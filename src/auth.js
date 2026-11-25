"use strict";
// The one place that turns a profile into request headers.
//
//   basic → Authorization: Basic <user:password>
//   entra → Authorization: Bearer <access token>
//   both  → x-api-key when the profile has one (REST v2 wants it with a bearer too)
//
// Entra sign-in is our own OAuth authorization-code + PKCE flow (public client,
// no secret, Node built-ins only). The browser hands the code back through
//   <uriScheme>://<publisher>.<name>/auth   (e.g. vscode://cpi.epicor-efx-manager/auth)
// which VS Code routes to this extension — no localhost listener, no web relay.
// The redirect must be registered on the app registration exactly as above.
// Or, with profile.redirectUri set to an https page that's already registered
// (Kinetic's azuread-redirect.html), sign-in runs in a small app-style Chrome
// window we drive (signinBrowser.js); the redirect is caught before that page
// loads and the window closes.
//
// Token calls are SILENT everywhere: a cached access token, else a refresh with
// the stored refresh token, else (https-redirect profiles) a prompt=none renewal
// in hidden Chrome using the saved Microsoft session. Nothing is shown to the user
// except by signIn(), which only a person triggers (EFx: Sign In, Profile Settings'
// Sign In button, or the "Sign-in required" toast).
//
// Storage: refresh token + account in SecretStorage (Keychain on macOS), keyed by
// tenant|client|scope — so it survives profile renames and profiles that point at
// the same app share one sign-in. Access tokens live in memory only.

const vscode = require("vscode");
const crypto = require("crypto");
const https = require("https");
const http = require("http");
const os = require("os");
const path = require("path");

// Test hook only; real runs always use Microsoft's login endpoint.
const AUTHORITY = (process.env.EFX_ENTRA_AUTHORITY || "https://login.microsoftonline.com").replace(/\/+$/, "");
const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DOMAIN_RE = /^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;
const PROMPT_EVERY_MS = 60 * 1000;
const SIGN_IN_TIMEOUT_MS = 5 * 60 * 1000;
const EXPIRY_SLACK_MS = 2 * 60 * 1000;
// Own browser profile for the sign-in window, so Microsoft's "stay signed in"
// cookie makes later sign-ins quick. Separate from your normal Chrome.
const SIGNIN_PROFILE_DIR = path.join(os.homedir(), ".efx-manager", "signin-browser");
const SILENT_TIMEOUT_MS = 25 * 1000;
const SILENT_RETRY_MS = 10 * 60 * 1000;

let secrets = null;
let extensionId = "";
const accessCache = new Map();  // session key -> { token, expiresAt }
const refreshing = new Map();   // session key -> in-flight refresh promise
const pendingSignIn = new Map(); // state -> { resolve, reject, timer }
const lastPrompt = new Map();   // profile name -> when we last showed the sign-in toast
const lastSilentFail = new Map(); // session key -> when a hidden renewal last failed
let interactive = 0;            // sign-ins a person is doing right now

function init(context) {
    secrets = context.secrets;
    extensionId = context.extension ? context.extension.id : "cpi.epicor-efx-manager";
}

const secretKey = (name, kind) => `efx.profile.${name}.${kind}`;

// Profiles saved before authType existed have none — they're basic.
function authTypeOf(profile) {
    return profile && profile.authType === "entra" ? "entra" : "basic";
}

function authError(message, code) {
    return Object.assign(new Error(message), { code });
}
function signInRequired(profile) {
    return authError(`Sign-in required for EFx profile "${profile.name}" — run EFx: Sign In.`, "login-required");
}

// null when clientId / tenantId / scope look usable, else what's wrong.
function entraFieldProblem(p) {
    if (!GUID_RE.test(p.clientId || "")) return "clientId must be a GUID";
    if (!GUID_RE.test(p.tenantId || "") && !DOMAIN_RE.test(p.tenantId || "")) return "tenantId must be a GUID or a domain";
    if (!p.scope || /\s/.test(p.scope)) return "scope is required (one scope, no spaces)";
    return null;
}
function requireEntraFields(profile) {
    const bad = entraFieldProblem(profile);
    if (bad) throw authError(`EFx profile "${profile.name}": ${bad} (EFx: Profile Settings → Authentication).`, "config");
}

function basicHeaders(username, password, apiKey) {
    const h = { Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}` };
    if (apiKey) h["x-api-key"] = apiKey;
    return h;
}

function redirectUri() {
    return `${vscode.env.uriScheme}://${extensionId}/auth`;
}
// profile.redirectUri = an https page already on the app registration (e.g.
// Kinetic's azuread-redirect.html): sign-in runs in hidden Chrome we drive, which
// catches that redirect. Empty → the vscode:// link.
function landingFor(profile) {
    const v = String(profile.redirectUri || "").trim();
    return /^https:\/\//i.test(v) ? v : "";
}

// Pull code / state / error out of a redirect URL (query or #fragment).
function parseLanded(text) {
    const u = new URL(String(text || "").trim());
    const q = new URLSearchParams(u.search);
    new URLSearchParams(u.hash.replace(/^#/, "")).forEach((v, k) => { if (!q.has(k)) q.set(k, v); });
    return q;
}

// ── session storage ─────────────────────────────────────────────────────────

function sessionKey(profile) {
    const id = `${profile.tenantId}|${profile.clientId}|${profile.scope}`.toLowerCase();
    return `efx.entra.${crypto.createHash("sha256").update(id).digest("hex").slice(0, 24)}`;
}
async function readSession(key) {
    const raw = await secrets.get(key);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}
async function writeSession(key, s) { await secrets.store(key, JSON.stringify(s)); }
async function dropSession(key) {
    accessCache.delete(key);
    await secrets.delete(key);
}

// ── token endpoint ───────────────────────────────────────────────────────────

const b64url = buf => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function postForm(url, fields, extraHeaders) {
    const u = new URL(url);
    const body = new URLSearchParams(fields).toString();
    const mod = u.protocol === "http:" ? http : https;
    return new Promise((resolve, reject) => {
        const req = mod.request(u, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(body), ...(extraHeaders || {}) },
        }, res => {
            let data = "";
            res.on("data", c => { data += c; });
            res.on("end", () => {
                let json = null;
                try { json = JSON.parse(data); } catch { /* not JSON */ }
                if (res.statusCode >= 200 && res.statusCode < 300 && json) return resolve(json);
                const desc = json && (json.error_description || json.error) || data.slice(0, 300) || `HTTP ${res.statusCode}`;
                reject(Object.assign(new Error(String(desc).split(/\r?\n/)[0]), { oauthError: json && json.error, status: res.statusCode }));
            });
        });
        req.on("error", reject);
        req.setTimeout(30000, () => req.destroy(new Error("Microsoft token endpoint timed out")));
        req.end(body);
    });
}

const tokenUrl = profile => `${AUTHORITY}/${encodeURIComponent(profile.tenantId)}/oauth2/v2.0/token`;
const requestScopes = profile => `${profile.scope} offline_access openid profile`;

function accountFromIdToken(idToken) {
    try {
        const claims = JSON.parse(Buffer.from(idToken.split(".")[1], "base64").toString("utf-8"));
        return claims.preferred_username || claims.upn || claims.email || claims.name || "";
    } catch { return ""; }
}

// Store what the token endpoint returned; Entra rotates refresh tokens.
async function saveTokens(key, tok, prev) {
    const s = {
        refreshToken: tok.refresh_token || (prev && prev.refreshToken),
        account: (tok.id_token && accountFromIdToken(tok.id_token)) || (prev && prev.account) || "",
        origin: (prev && prev.origin) || tok._origin || undefined,
        savedAt: new Date().toISOString(),
    };
    if (!s.refreshToken) throw new Error("Microsoft returned no refresh token (offline_access not granted?)");
    await writeSession(key, s);
    accessCache.set(key, { token: tok.access_token, expiresAt: Date.now() + (Number(tok.expires_in) || 3600) * 1000 });
    return s;
}

// Silent refresh, one at a time per session.
function refresh(profile, key) {
    if (refreshing.has(key)) return refreshing.get(key);
    const p = (async () => {
        const s = await readSession(key);
        if (!s || !s.refreshToken) return null;
        try {
            const tok = await postForm(tokenUrl(profile), {
                client_id: profile.clientId,
                grant_type: "refresh_token",
                refresh_token: s.refreshToken,
                scope: requestScopes(profile),
            }, s.origin ? { Origin: s.origin } : null);
            await saveTokens(key, tok, s);
            return accessCache.get(key).token;
        } catch (e) {
            // invalid_grant = refresh token expired / revoked / password changed.
            if (e.oauthError === "invalid_grant" || e.oauthError === "interaction_required") {
                const renewed = await silentRenew(profile, key, s);
                if (renewed) return renewed;
                await dropSession(key);
                return null;
            }
            throw e; // network etc. — keep the session, surface the error
        }
    })().finally(() => refreshing.delete(key));
    refreshing.set(key, p);
    return p;
}

// ── sign-in toast ────────────────────────────────────────────────────────────

// Non-blocking "Sign In" toast, at most once a minute per profile.
function nudgeSignIn(profile) {
    const now = Date.now();
    if (now - (lastPrompt.get(profile.name) || 0) < PROMPT_EVERY_MS) return;
    lastPrompt.set(profile.name, now);
    vscode.window.showWarningMessage(`EFx: Sign-in required for "${profile.name}".`, "Sign In").then(a => {
        if (a === "Sign In") vscode.commands.executeCommand("efx.signIn", profile.name);
    });
}

// ── public ──────────────────────────────────────────────────────────────────

// opts.retry: called after a 401 — drop the cached access token and refresh.
async function getAuthHeader(profile, opts = {}) {
    if (!secrets) throw new Error("auth.init(context) was not called");
    const apiKey = (await secrets.get(secretKey(profile.name, "apiKey"))) || "";
    if (authTypeOf(profile) === "basic") {
        const password = await secrets.get(secretKey(profile.name, "password"));
        if (!password) throw authError(`No password stored for EFx profile "${profile.name}" (EFx: Profile Settings → Authentication).`, "no-password");
        return basicHeaders(profile.username, password, apiKey);
    }
    requireEntraFields(profile);
    const key = sessionKey(profile);
    if (opts.retry) accessCache.delete(key);
    const cached = accessCache.get(key);
    let token = cached && cached.expiresAt - Date.now() > EXPIRY_SLACK_MS ? cached.token : null;
    if (!token) token = await refresh(profile, key);
    if (!token) {
        nudgeSignIn(profile);
        throw signInRequired(profile);
    }
    const h = { Authorization: `Bearer ${token}` };
    if (apiKey) h["x-api-key"] = apiKey;
    return h;
}

// Called by the extension's URI handler for <scheme>://<extensionId>/auth?code=…&state=…
function handleRedirect(uri) {
    const q = new URLSearchParams(uri.query);
    const state = q.get("state") || "";
    const pending = pendingSignIn.get(state);
    if (!pending) {
        vscode.window.showWarningMessage("EFx: Ignored a sign-in link that doesn't match a sign-in in progress.");
        return;
    }
    pendingSignIn.delete(state);
    clearTimeout(pending.timer);
    if (q.get("error")) {
        pending.reject(new Error((q.get("error_description") || q.get("error")).split(/\r?\n/)[0]));
    } else if (!q.get("code")) {
        pending.reject(new Error("Microsoft's redirect had no code."));
    } else {
        pending.resolve(q.get("code"));
    }
}

// ── authorize / redeem ──────────────────────────────────────────────────────

// One authorize request: PKCE verifier, state, redirect, and the URL to open.
function authorizeRequest(profile, prompt) {
    const verifier = b64url(crypto.randomBytes(32));
    const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
    const state = b64url(crypto.randomBytes(16));
    const landing = landingFor(profile);
    const redirect = landing || redirectUri();
    // %20 for spaces, not "+": VS Code re-encodes links it opens, and "+" can come out ambiguous.
    const query = Object.entries({
        client_id: profile.clientId,
        response_type: "code",
        redirect_uri: redirect,
        response_mode: "query",
        scope: requestScopes(profile),
        state,
        code_challenge: challenge,
        code_challenge_method: "S256",
        prompt,
    }).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    const url = `${AUTHORITY}/${encodeURIComponent(profile.tenantId)}/oauth2/v2.0/authorize?${query}`;
    return { url, verifier, state, redirect, landing };
}

// The code out of a caught redirect URL; Microsoft's error if it sent one.
function codeFrom(landed, req) {
    let q;
    try { q = parseLanded(landed); } catch { throw new Error("Couldn't read the sign-in redirect."); }
    if (q.get("error")) throw authError((q.get("error_description") || q.get("error")).split(/\r?\n/)[0], q.get("error"));
    if (q.get("state") !== req.state) throw new Error("The sign-in redirect didn't match this sign-in. Run Sign In again.");
    if (!q.get("code")) throw new Error("Microsoft's redirect had no code.");
    return q.get("code");
}

// Trade the code for tokens. An https redirect (Kinetic's page) is usually a
// single-page-app redirect: Microsoft then wants that site as Origin, here and
// on every refresh (kept in the session as `origin`).
async function redeem(profile, code, req) {
    const fields = {
        client_id: profile.clientId,
        grant_type: "authorization_code",
        code,
        redirect_uri: req.redirect,
        code_verifier: req.verifier,
        scope: requestScopes(profile),
    };
    if (!req.landing) return postForm(tokenUrl(profile), fields);
    const origin = new URL(req.landing).origin;
    try {
        const tok = await postForm(tokenUrl(profile), fields, { Origin: origin });
        tok._origin = origin;
        return tok;
    } catch (e) {
        // AADSTS9002326: cross-origin redemption only for SPA redirects → not SPA, try plain.
        if (!/9002326/.test(e.message)) throw e;
        return postForm(tokenUrl(profile), fields);
    }
}

// ── sign-in ─────────────────────────────────────────────────────────────────

// Interactive — only call from something a person clicked.
async function signIn(profile) {
    if (authTypeOf(profile) !== "entra") throw new Error(`"${profile.name}" uses Basic auth — nothing to sign in to.`);
    requireEntraFields(profile);
    const key = sessionKey(profile);
    const req = authorizeRequest(profile, "select_account");
    let code;
    interactive++;
    try {
        code = req.landing ? codeFrom(await catchSignIn(req, profile), req) : await waitForLink(req, profile);
    } finally {
        interactive--;
    }
    const tok = await redeem(profile, code, req);
    const s = await saveTokens(key, tok, null);
    lastPrompt.delete(profile.name);
    lastSilentFail.delete(key);
    return s.account || "your Microsoft account";
}

// vscode:// route: open the system browser, wait for the link to come back.
function waitForLink(req, profile) {
    return vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: `EFx: Finish signing in to "${profile.name}" in your browser…`, cancellable: true },
        (_progress, cancel) => new Promise((resolve, reject) => {
            const timer = setTimeout(() => { pendingSignIn.delete(req.state); reject(new Error("Sign-in timed out.")); }, SIGN_IN_TIMEOUT_MS);
            pendingSignIn.set(req.state, { resolve, reject, timer });
            cancel.onCancellationRequested(() => { clearTimeout(timer); pendingSignIn.delete(req.state); reject(new Error("Sign-in was cancelled.")); });
            vscode.env.openExternal(vscode.Uri.parse(req.url, true)).then(ok => {
                if (!ok) { clearTimeout(timer); pendingSignIn.delete(req.state); reject(new Error("Couldn't open the browser.")); }
            });
        })
    );
}

// https-redirect route: a small app-style Chrome window. Resolves with the
// caught redirect URL.
function catchSignIn(req, profile) {
    const sb = require("./signinBrowser");
    return vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: `EFx: Sign in to "${profile.name}" in the sign-in window…`, cancellable: true },
        (_progress, cancel) => {
            const session = sb.open({ mode: "window", url: req.url, redirectPrefix: req.landing, userDataDir: SIGNIN_PROFILE_DIR, timeoutMs: SIGN_IN_TIMEOUT_MS });
            cancel.onCancellationRequested(() => session.close());
            return session.done;
        });
}

// Expired sign-in → try again without showing anything: hidden Chrome with the
// sign-in profile's saved Microsoft session and prompt=none. https-redirect
// profiles only. null when Microsoft needs the person (then: the toast).
async function silentRenew(profile, key, prev) {
    const landing = landingFor(profile);
    if (!landing || interactive > 0) return null;
    if (Date.now() - (lastSilentFail.get(key) || 0) < SILENT_RETRY_MS) return null;
    const req = authorizeRequest(profile, "none");
    try {
        const landed = await require("./signinBrowser").capture({
            mode: "silent", url: req.url, redirectPrefix: landing, userDataDir: SIGNIN_PROFILE_DIR, timeoutMs: SILENT_TIMEOUT_MS,
        });
        const tok = await redeem(profile, codeFrom(landed, req), req);
        await saveTokens(key, tok, prev);
        lastSilentFail.delete(key);
        return accessCache.get(key).token;
    } catch (e) {
        console.log(`EFx: hidden sign-in renewal for "${profile.name}" needs you — ${e.message}`);
        lastSilentFail.set(key, Date.now());
        return null;
    }
}

async function signOut(profile) {
    if (authTypeOf(profile) !== "entra") return;
    requireEntraFields(profile);
    await dropSession(sessionKey(profile));
}

// { state: "n/a" | "ok" | "login-required", account? } — local check, never prompts or calls out.
async function getAuthState(profile) {
    if (authTypeOf(profile) !== "entra") return { state: "n/a" };
    if (entraFieldProblem(profile)) return { state: "login-required", error: "Entra settings incomplete" };
    const s = await readSession(sessionKey(profile));
    return s && s.refreshToken ? { state: "ok", account: s.account } : { state: "login-required" };
}

// Fails early the way the old "No password stored" checks did. Entra profiles
// always pass — a missing sign-in shows up on the first call instead.
async function preflight(profile) {
    if (authTypeOf(profile) !== "basic") return null;
    const pw = secrets && await secrets.get(secretKey(profile.name, "password"));
    return pw ? null : `No password stored for "${profile.name}". Set it in EFx: Profile Settings.`;
}

// Client config (EpicorClient / KineticMetaFXClient / layer preview) for a saved profile.
function clientConfig(profile, company) {
    const entra = authTypeOf(profile) === "entra";
    return {
        serverUrl: profile.serverUrl,
        company,
        username: profile.username,
        authType: entra ? "entra" : "basic",
        retry401: entra,
        authHeaders: opts => getAuthHeader(profile, opts),
    };
}

// Client config from typed-in, not-yet-saved Basic credentials (company
// discovery while a profile is being edited).
function draftBasicConfig({ serverUrl, company, username, password, apiKey }) {
    return {
        serverUrl, company, username,
        authType: "basic",
        retry401: false,
        authHeaders: async () => basicHeaders(username, password, apiKey || ""),
    };
}

module.exports = {
    init, secretKey, authTypeOf, entraFieldProblem, getAuthHeader, signIn, signOut, handleRedirect,
    getAuthState, preflight, redirectUri, clientConfig, draftBasicConfig,
};
