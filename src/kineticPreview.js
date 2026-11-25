"use strict";
// Headless Kinetic preview for the Claude bridge: real Kinetic renders a layer's
// saved draft and we screenshot it. See docs/layer-preview.md.
//
// Chrome DevTools Protocol over --remote-debugging-pipe (fd 3 = to browser,
// fd 4 = from browser, NUL-delimited JSON). No port, no WebSocket, no library.
// Sign-in mirrors Kinetic's own login (captured on pilot): TokenResource (Basic)
// -> SessionModSvc/Login (Bearer) -> session id. Entra profiles skip TokenResource:
// the Entra access token from auth.js is the bearer for Login and for the page. Before the app boots we set its
// auth cookie and the minimal localStorage it checks (proven by stripping the
// real blob down until preview still loaded). No password enters the page.
// One session per server+user is reused until the token nears expiry.

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const crypto = require("crypto");
const { spawn } = require("child_process");
const { StringDecoder } = require("string_decoder");

const IDLE_MS = 10 * 60 * 1000;
const AUTH_COOKIE = "homepage__erp.token.auth";
const SESSION_SLACK_MS = 5 * 60 * 1000;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── browser ──────────────────────────────────────────────────────────────────

function browserCandidates() {
    if (process.env.EFX_PREVIEW_BROWSER) return [process.env.EFX_PREVIEW_BROWSER];
    if (process.platform === "darwin") return [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ];
    if (process.platform === "win32") {
        const roots = [process.env.PROGRAMFILES, process.env["PROGRAMFILES(X86)"], process.env.LOCALAPPDATA].filter(Boolean);
        return roots.flatMap(r => [
            path.join(r, "Google", "Chrome", "Application", "chrome.exe"),
            path.join(r, "Microsoft", "Edge", "Application", "msedge.exe"),
        ]);
    }
    return ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge"];
}

function findBrowser() {
    const list = browserCandidates();
    const hit = list.find(p => { try { return fs.statSync(p).isFile(); } catch { return false; } });
    if (!hit) throw new Error(`No Chrome, Edge or Chromium found for previews. Tried: ${list.join(", ")}. Set EFX_PREVIEW_BROWSER to the browser executable.`);
    return hit;
}

class Cdp {
    constructor(proc) {
        this.nextId = 1;
        this.pending = new Map();
        this.listeners = new Set();
        this.buf = "";
        this.decoder = new StringDecoder("utf8");
        this.toBrowser = proc.stdio[3];
        this.dead = null;
        proc.stdio[4].on("data", d => this.onData(d));
        // A browser that dies makes pipe writes fail (EPIPE). Unhandled, that
        // error event would take down the whole extension host.
        this.toBrowser.on("error", e => this.fail(e));
        proc.stdio[4].on("error", e => this.fail(e));
        proc.on("error", e => this.fail(e));
        proc.on("exit", () => this.fail(new Error("Preview browser exited")));
    }
    fail(e) {
        if (!this.dead) this.dead = e;
        for (const p of this.pending.values()) p.reject(new Error(`Browser connection lost: ${e.message}`));
        this.pending.clear();
    }
    onData(chunk) {
        this.buf += this.decoder.write(chunk);
        let i;
        while ((i = this.buf.indexOf("\0")) >= 0) {
            const raw = this.buf.slice(0, i);
            this.buf = this.buf.slice(i + 1);
            let msg;
            try { msg = JSON.parse(raw); } catch { continue; }
            const p = msg.id && this.pending.get(msg.id);
            if (p) {
                this.pending.delete(msg.id);
                msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result);
            } else if (msg.method) {
                for (const fn of this.listeners) fn(msg);
            }
        }
    }
    send(method, params = {}, sessionId) {
        if (this.dead) return Promise.reject(new Error(`Browser connection lost: ${this.dead.message}`));
        const id = this.nextId++;
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.toBrowser.write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + "\0", err => {
                if (err && this.pending.has(id)) { this.pending.delete(id); reject(new Error(`Browser connection lost: ${err.message}`)); }
            });
        });
    }
    on(fn) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }
}

// Two browsers: "shot" = headless, for screenshots, closes after 10 idle minutes;
// "window" = visible, for clicking around, stays until the extension shuts down.
// They need separate user-data-dirs (Chrome locks a profile dir per process).
// "signin" = small app-style window, "signinHidden" = headless; both only for
// Entra sign-in (signinBrowser.js), share one profile dir, closed right after.
const browsers = { shot: null, window: null, signin: null, signinHidden: null };
const HEADLESS = new Set(["shot", "signinHidden"]);
// App-mode window: no tabs / address bar — looks like a sign-in dialog.
const APP_ARGS = ["--app=data:text/html,<title>Sign in</title>", "--window-size=500,720"];

function touch() {
    const b = browsers.shot;
    if (!b) return;
    clearTimeout(b.idleTimer);
    b.idleTimer = setTimeout(() => { closeBrowser("shot"); }, IDLE_MS);
    if (b.idleTimer.unref) b.idleTimer.unref();
}

async function getBrowser(kind, userDataDir) {
    const b = browsers[kind];
    if (b && b.userDataDir === userDataDir && b.proc.exitCode === null) { if (kind === "shot") touch(); return b; }
    await closeBrowser(kind);
    // Chrome locks a profile dir per process — free it if another kind holds it,
    // and wait out a shutdown that's still in progress on it.
    for (const [k, other] of Object.entries(browsers)) if (other && other.userDataDir === userDataDir) await closeBrowser(k);
    if (closing.has(userDataDir)) await closing.get(userDataDir);
    fs.mkdirSync(userDataDir, { recursive: true });
    const args = ["--remote-debugging-pipe", `--user-data-dir=${userDataDir}`, "--no-first-run", "--no-default-browser-check", "--disable-extensions"];
    if (HEADLESS.has(kind)) args.unshift("--headless=new");
    if (kind === "shot") args.push("--hide-scrollbars");
    const start = kind === "signin" ? APP_ARGS : ["about:blank"];
    const proc = spawn(findBrowser(), [...args, ...start], { stdio: ["ignore", "ignore", "ignore", "pipe", "pipe"] });
    await new Promise((resolve, reject) => { proc.once("spawn", resolve); proc.once("error", reject); });
    browsers[kind] = { proc, cdp: new Cdp(proc), userDataDir, idleTimer: null };
    if (kind === "shot") touch();
    return browsers[kind];
}

// Shutdowns in progress, by profile dir. A new browser on the same dir waits for
// the old one to exit (Chrome locks the dir, and writes cookies on the way out).
const closing = new Map();

// Close one browser, or all when kind is omitted. Resolves once it has exited.
async function closeBrowser(kind) {
    for (const k of kind ? [kind] : Object.keys(browsers)) {
        const b = browsers[k];
        browsers[k] = null;
        if (k === "shot") for (const v of lives.values()) clearTimeout(v.timer);
        if (k === "shot") lives.clear();
        if (!b) continue;
        clearTimeout(b.idleTimer);
        const exited = b.proc.exitCode !== null || b.proc.signalCode !== null
            ? Promise.resolve()
            : new Promise(r => b.proc.once("exit", r));
        const done = (async () => {
            try { await Promise.race([b.cdp.send("Browser.close"), sleep(2000)]); } catch { /* already gone */ }
            await Promise.race([exited, sleep(4000)]);
            if (b.proc.exitCode === null && b.proc.signalCode === null) {
                b.proc.kill();
                await Promise.race([exited, sleep(2000)]);
            }
        })();
        closing.set(b.userDataDir, done);
        try { await done; } finally { if (closing.get(b.userDataDir) === done) closing.delete(b.userDataDir); }
    }
}

function previewUrl(base, { app, layer, company, site }) {
    const q = new URLSearchParams({
        channelid: crypto.randomUUID(), preview: "true", layerVersion: "0", baseAppVersion: "0",
        layerNames: layer, company, autoload: "false",
    });
    if (site) q.set("site", site);
    return `${base}/Apps/Erp/Home/#/view/preview/${encodeURIComponent(app)}?${q}`;
}

// ── preview ──────────────────────────────────────────────────────────────────

// ── session ──────────────────────────────────────────────────────────────────

function post(url, headers, body) {
    const u = new URL(url);
    const mod = u.protocol === "https:" ? https : http;
    const data = body == null ? "" : body;
    return new Promise((resolve, reject) => {
        const req = mod.request(u, { method: "POST", headers: { ...headers, "Content-Length": Buffer.byteLength(data) }, rejectUnauthorized: false }, res => {
            let out = "";
            res.on("data", c => { out += c; });
            res.on("end", () => {
                if (res.statusCode < 200 || res.statusCode >= 300) return reject(new Error(`${u.pathname} returned HTTP ${res.statusCode}: ${out.slice(0, 300)}`));
                try { resolve(JSON.parse(out)); } catch { reject(new Error(`${u.pathname} returned non-JSON`)); }
            });
        });
        req.on("error", reject);
        req.setTimeout(30000, () => req.destroy(new Error(`${u.pathname} timed out`)));
        req.end(data);
    });
}

const sessions = new Map(); // `${base}|${username}` -> { token, createdUTC, expiresUTC, expiresInSecs, sessionId }

async function getSession(base, cfg, fresh) {
    const key = `${base}|${cfg.username}`;
    const hit = sessions.get(key);
    if (!fresh && hit && hit.expiresUTC - Date.now() > SESSION_SLACK_MS) return hit;
    if (cfg.authType === "entra") {
        const sess = await entraSession(base, cfg);
        sessions.set(key, sess);
        return sess;
    }
    const { Authorization } = await cfg.authHeaders();
    const tok = await post(`${base}/api/TokenResource/`, {
        Authorization, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded",
    });
    if (!tok.AccessToken) throw new Error("TokenResource returned no AccessToken");
    const login = await post(`${base}/api/v2/Ice.Lib.SessionModSvc/Login`, {
        Authorization: `Bearer ${tok.AccessToken}`, Accept: "application/json", "Content-Type": "application/json",
        callSettings: JSON.stringify({ Company: "", Plant: "" }),
        contextheader: JSON.stringify({ Context: { BpmData: [], Client: [] } }),
    }, "{}");
    if (!login.returnObj) throw new Error("SessionModSvc/Login returned no session id");
    const createdUTC = Date.now();
    const expiresInSecs = Number(tok.ExpiresIn) || 3600;
    const sess = { token: tok.AccessToken, createdUTC, expiresUTC: createdUTC + expiresInSecs * 1000, expiresInSecs, sessionId: login.returnObj };
    sessions.set(key, sess);
    return sess;
}

// Entra: the access token auth.js hands out (Bearer + x-api-key) logs in directly.
// The session lives as long as that token (its exp claim).
async function entraSession(base, cfg) {
    const auth = await cfg.authHeaders();
    const token = String(auth.Authorization || "").replace(/^Bearer\s+/i, "");
    const login = await post(`${base}/api/v2/Ice.Lib.SessionModSvc/Login`, {
        ...auth, Accept: "application/json", "Content-Type": "application/json",
        callSettings: JSON.stringify({ Company: "", Plant: "" }),
        contextheader: JSON.stringify({ Context: { BpmData: [], Client: [] } }),
    }, "{}");
    if (!login.returnObj) throw new Error("SessionModSvc/Login returned no session id");
    const createdUTC = Date.now();
    let expiresUTC = createdUTC + 3600 * 1000;
    try {
        const exp = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString("utf-8")).exp;
        if (exp) expiresUTC = exp * 1000;
    } catch { /* not a JWT we can read — assume an hour */ }
    return { token, createdUTC, expiresUTC, expiresInSecs: Math.max(60, Math.round((expiresUTC - createdUTC) / 1000)), sessionId: login.returnObj };
}

// Cookie + localStorage the way Kinetic's login leaves them (minimal set).
async function seedSession(send, base, username, sess) {
    const u = new URL(base);
    const homePath = `${u.pathname.replace(/\/+$/, "")}/Apps/Erp/Home`;
    await send("Network.deleteCookies", { name: AUTH_COOKIE, domain: u.hostname });
    await send("Network.setCookie", {
        name: AUTH_COOKIE,
        value: encodeURIComponent(JSON.stringify({ url: base, userId: username, password: "", token: sess.token, createdUTC: sess.createdUTC, expiresUTC: sess.expiresUTC, expiresInSecs: sess.expiresInSecs })),
        url: `${u.origin}${homePath}/`, path: homePath, secure: u.protocol === "https:", sameSite: "Strict", expires: Math.floor(sess.expiresUTC / 1000),
    });
    const storageKey = `appData.khp${homePath.toLowerCase()}/`;
    const blob = {
        ep: { session: { server: {
            authMethod: 1, availableAuthMethods: [1], azureUserId: "", configKey: "ep.session.server", idpUserId: "",
            inDemoMode: false, objectCreationDate: new Date().toISOString(), objectKind: 2, objectName: "EpErpSessionService",
            requestedAuthMethod: "", restPath: "api/v2/odata", restProtocol: u.protocol.replace(":", ""), serverUrl: base,
            ssoUserId: "", systemCode: "ERP", userId: username,
        } } },
        // CurrentAuthMode 1 = basic; LicenseType "Default" = what pilot's login stores
        // (leaving it out gets "Invalid Session — login again to change license type").
        khp: { settings: { SessionId: sess.sessionId, IsValidSession: true, UserId: username, CurrentAuthMode: 1, AppServerUrl: base, LicenseType: "Default" } },
    };
    await send("Page.addScriptToEvaluateOnNewDocument", {
        source: `try { if (location.pathname.toLowerCase().startsWith(${JSON.stringify(homePath.toLowerCase())})) localStorage.setItem(${JSON.stringify(storageKey)}, ${JSON.stringify(JSON.stringify(blob))}); } catch (e) {}`,
    });
}

async function saveShot(send, outFile) {
    const shot = await send("Page.captureScreenshot", { format: "png" });
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, Buffer.from(shot.data, "base64"));
}

// Network tracking counts real requests only. SignalR / event streams / long-polls
// never go quiet, so they'd make every wait run to its cap.
const STREAMING_TYPES = new Set(["WebSocket", "EventSource", "Ping"]);
const STREAMING_URL = /signalr|\/negotiate|\/poll|\/connect\b/i;

// Requests started at/after `since` that haven't finished.
function pending(page, since) {
    let n = 0;
    for (const t of page.inflight.values()) if (t >= since) n++;
    return n;
}

// A signed-in preview page on its own target in the given browser. Tracks load and
// network activity so callers can tell when the page has settled.
async function openPage(kind, { cfg, app, layer, company, site, userDataDir, width, height }, freshSession, failShot) {
    const base = cfg.serverUrl.replace(/\/+$/, "");
    const sess = await getSession(base, cfg, freshSession);
    const { cdp } = await getBrowser(kind, userDataDir);
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    const page = { targetId, loaded: false, lastNet: Date.now(), inflight: new Map(), title: "", settled: false, send: (m, p) => cdp.send(m, p, sessionId) };
    const off = cdp.on(msg => {
        if (msg.sessionId !== sessionId) return;
        const p = msg.params || {};
        if (msg.method === "Page.loadEventFired") page.loaded = true;
        else if (msg.method === "Network.requestWillBeSent") {
            if (STREAMING_TYPES.has(p.type) || STREAMING_URL.test((p.request && p.request.url) || "")) return;
            page.inflight.set(p.requestId, Date.now());
            page.lastNet = Date.now();
        } else if (msg.method === "Network.loadingFinished" || msg.method === "Network.loadingFailed") {
            if (page.inflight.delete(p.requestId)) page.lastNet = Date.now();
        }
    });
    page.close = () => { off(); cdp.send("Target.closeTarget", { targetId }).catch(() => {}); };
    try {
        await page.send("Network.enable");
        await page.send("Page.enable");
        await page.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
        await seedSession(page.send, base, cfg.username, sess);
        await page.send("Page.navigate", { url: previewUrl(base, { app, layer, company, site }) });
        await waitSettled(page, { freshSession, failShot });
        return page;
    } catch (e) {
        page.close();
        throw e;
    }
}

// Settled = load fired, 2s without network traffic, and the "<app> | Preview" title
// (or 15s in, if the title never shows). Long-poll connections don't block it.
// Kinetic can pass through #/login and bounce back; staying there (or its
// "Invalid Session" panel) means the seeded session wasn't accepted.
async function waitSettled(page, { freshSession = false, failShot, timeoutMs = 45000 } = {}) {
    const started = Date.now();
    let state = {};
    let onLoginSince = 0;
    page.settled = false;
    while (Date.now() - started < timeoutMs) {
        await sleep(500);
        try {
            const r = await page.send("Runtime.evaluate", { expression: "({ hash: location.hash, title: document.title, invalid: /Invalid Session/i.test(document.body ? document.body.innerText : '') })", returnByValue: true });
            state = (r && r.result && r.result.value) || state;
        } catch { continue; } // context swapped mid-navigation
        if (state.invalid || /^#\/login/i.test(state.hash || "")) {
            onLoginSince = onLoginSince || Date.now();
            if (state.invalid || Date.now() - onLoginSince > 8000) {
                if (failShot) await saveShot(page.send, failShot);
                const err = new Error(`Kinetic didn't accept the session (${state.invalid ? "Invalid Session" : "stayed on login"}).${failShot ? ` Screenshot of what it showed: ${failShot}` : ""}`);
                err.sessionRejected = !freshSession;
                throw err;
            }
            continue;
        }
        onLoginSince = 0;
        const quiet = Date.now() - page.lastNet > 2000 && !pending(page, Date.now() - 5000);
        const previewTitle = /\|\s*Preview$/i.test(state.title || "");
        if (page.loaded && quiet && (previewTitle || Date.now() - started > 15000)) { page.settled = true; break; }
    }
    page.title = state.title || "";
}

// One retry with a fresh session when Kinetic rejects a reused one.
async function withSessionRetry(fn) {
    try {
        return await fn(false);
    } catch (e) {
        if (!e.sessionRejected) throw e;
        return fn(true);
    }
}

// cfg: auth.clientConfig(profile, company). Writes a PNG to outFile.
function capturePreview(opts) {
    return withSessionRetry(async fresh => {
        const width = opts.width || 1440, height = opts.height || 900;
        const page = await openPage("shot", { ...opts, width, height }, fresh, opts.outFile);
        try {
            await sleep(400);
            await saveShot(page.send, opts.outFile);
            return { image: opts.outFile, settled: page.settled, title: page.title, width, height };
        } finally {
            page.close();
            touch();
        }
    });
}

// ── live views ───────────────────────────────────────────────────────────────
// A preview page kept open in the headless browser for an inline MCP App view:
// the view sends clicks/keys/scrolls, we replay them and return a JPEG frame.

const LIVE_IDLE_MS = 15 * 60 * 1000;
const lives = new Map(); // viewId -> { page, timer }
const KEYS = { Enter: 13, Tab: 9, Backspace: 8, Escape: 27, Delete: 46, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Home: 36, End: 35, PageUp: 33, PageDown: 34 };

function liveTouch(viewId) {
    const v = lives.get(viewId);
    if (!v) return;
    clearTimeout(v.timer);
    v.timer = setTimeout(() => { liveClose(viewId); }, LIVE_IDLE_MS);
    if (v.timer.unref) v.timer.unref();
    touch();
}

async function frame(page) {
    const shot = await page.send("Page.captureScreenshot", { format: "jpeg", quality: 70 });
    let title = page.title;
    try { title = (await page.send("Runtime.evaluate", { expression: "document.title", returnByValue: true })).result.value; } catch { /* mid-navigation */ }
    return { frame: shot.data, mime: "image/jpeg", title };
}

// Wait for the requests the input kicked off, then a short beat for rendering.
// Requests already running before the input (long-polls) are ignored. Capped so the
// user sees something fast; if requests are still out, the result says so and the
// view asks again with a "wait" action.
const QUIET_CAP_MS = 1500;
async function quietAfterInput(page, since) {
    const start = Date.now();
    await sleep(80);
    while (Date.now() - start < QUIET_CAP_MS && (pending(page, since) || Date.now() - page.lastNet < 120)) await sleep(40);
    return pending(page, since);
}

async function liveOpen(opts) {
    const width = opts.width || 1280, height = opts.height || 760;
    const page = await withSessionRetry(fresh => openPage("shot", { ...opts, width, height }, fresh));
    const viewId = crypto.randomUUID();
    lives.set(viewId, { page, timer: null });
    liveTouch(viewId);
    return { viewId, width, height, ...(await frame(page)) };
}

// actions: [{type:"click", x, y, count?} | {type:"dblclick", x, y} | {type:"type", text}
//           | {type:"key", key, shift?} | {type:"scroll", x, y, dx, dy} | {type:"reload"}
//           | {type:"wait"}]. No actions = just a frame. "wait" = settle again after a
//           result that came back with pending requests.
// Returns the frame plus { pending, timing: { input, wait, shot } } in ms.
async function liveInput(viewId, actions = []) {
    const v = lives.get(viewId);
    if (!v) throw new Error("This preview has closed. Reopen it.");
    liveTouch(viewId);
    const { page } = v;
    const s = page.send;
    const t0 = Date.now();
    let reloaded = false;
    for (const a of actions) {
        if (a.type === "click" || a.type === "dblclick") {
            const x = Number(a.x), y = Number(a.y);
            // count = the browser's click detail (2 on the second click of a double-click),
            // so Chrome fires dblclick itself.
            const count = a.type === "dblclick" ? 2 : Math.min(Math.max(Number(a.count) || 1, 1), 3);
            await s("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
            for (let c = a.type === "dblclick" ? 1 : count; c <= count; c++) {
                await s("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: c });
                await s("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: c });
            }
        } else if (a.type === "type" && a.text) {
            await s("Input.insertText", { text: String(a.text) });
        } else if (a.type === "key" && KEYS[a.key]) {
            const k = { key: a.key, code: a.key, windowsVirtualKeyCode: KEYS[a.key], modifiers: a.shift ? 8 : 0 };
            await s("Input.dispatchKeyEvent", { type: "rawKeyDown", ...k });
            await s("Input.dispatchKeyEvent", { type: "keyUp", ...k });
        } else if (a.type === "scroll") {
            await s("Input.dispatchMouseEvent", { type: "mouseWheel", x: Number(a.x) || 0, y: Number(a.y) || 0, deltaX: Number(a.dx) || 0, deltaY: Number(a.dy) || 0 });
        } else if (a.type === "reload") {
            page.loaded = false;
            await s("Page.reload", { ignoreCache: true });
            reloaded = true;
        }
    }
    const t1 = Date.now();
    let stillPending = 0;
    if (reloaded) await waitSettled(page, { freshSession: true });
    else if (actions.length) {
        if (actions.some(a => a.type !== "wait")) page.inputAt = t0;
        stillPending = await quietAfterInput(page, page.inputAt || t0);
    }
    const t2 = Date.now();
    const f = await frame(page);
    return { ...f, pending: stillPending, timing: { input: t1 - t0, wait: t2 - t1, shot: Date.now() - t2 } };
}

function liveClose(viewId) {
    const v = lives.get(viewId);
    if (!v) return false;
    lives.delete(viewId);
    clearTimeout(v.timer);
    v.page.close();
    return true;
}

// Open the preview, signed in, in a visible window you can click around in.
// Reloading the window (Cmd+R) shows the latest saved draft.
async function openPreviewWindow({ cfg, app, layer, company, site, userDataDir }) {
    const base = cfg.serverUrl.replace(/\/+$/, "");
    const sess = await getSession(base, cfg, false);
    const { cdp } = await getBrowser("window", `${userDataDir}-window`);
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank", newWindow: true });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    const s = (method, params) => cdp.send(method, params, sessionId);
    await s("Network.enable");
    await s("Page.enable");
    await seedSession(s, base, cfg.username, sess);
    await s("Page.navigate", { url: previewUrl(base, { app, layer, company, site }) });
    await s("Page.bringToFront").catch(() => {});
    // Drop the blank window Chrome starts with.
    const { targetInfos } = await cdp.send("Target.getTargets");
    for (const t of targetInfos) {
        if (t.type === "page" && t.targetId !== targetId && t.url === "about:blank") cdp.send("Target.closeTarget", { targetId: t.targetId }).catch(() => {});
    }
    return { opened: true, sessionExpires: new Date(sess.expiresUTC).toISOString() };
}

module.exports = { capturePreview, openPreviewWindow, liveOpen, liveInput, liveClose, closeBrowser, getBrowser };
