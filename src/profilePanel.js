"use strict";
// Profile settings panel: one webview, three tabs (General / Authentication /
// Integrations). Replaces the input-box wizard for New and Edit.
//
// Secrets never go to the webview. The page sends a typed password / API key
// up once, it's held here in memory until Save, and the page only ever sees
// "set" / "not set" / "changes on save". Nothing is written until Save.
//
// claudeAccess is editable here on purpose: this panel is VS Code UI the user
// drives. The Claude bridge still can't change it (claudeOps.profileFields).

const vscode = require("vscode");
const path = require("path");
const crypto = require("crypto");
const { BRIDGE_FILE, REQUEST_DIR } = require("./claudeBridge");

const NAME_RE = /^[A-Za-z0-9_\-. ]+$/;
const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DOMAIN_RE = /^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;
const ENTRA_FIELDS = ["clientId", "tenantId", "scope", "redirectUri"];
const SECRET_KINDS = ["password", "apiKey"];

let current = null;

class ProfilePanel {
    // deps: getProfiles, setProfiles, getActiveProfileName, setActiveProfileName,
    // getActiveCompany, setActiveCompany, activateProfile(name), profileSecretKey,
    // profileRootNoPrompt, authTypeOf, CLAUDE_ACCESS_LEVELS, EpicorClient
    static open(context, deps, profileName) {
        if (current) {
            current.load(profileName || null);
            current.panel.reveal();
            return;
        }
        current = new ProfilePanel(context, deps);
        current.load(profileName || null);
    }

    constructor(context, deps) {
        this.context = context;
        this.deps = deps;
        this.originalName = null;
        this.pending = {}; // kind -> string (store) | null (delete)
        this.ready = false;
        this.panel = vscode.window.createWebviewPanel("efxProfile", "EFx Profile", vscode.ViewColumn.Active,
            { enableScripts: true, retainContextWhenHidden: true });
        this.panel.webview.html = pageHtml(crypto.randomBytes(16).toString("base64"), this.panel.webview.cspSource);
        this.panel.onDidDispose(() => { current = null; this.pending = {}; });
        this.panel.webview.onDidReceiveMessage(m => {
            this.onMessage(m).catch(e => this.post({ type: "error", message: e.message || String(e), field: e.field }));
        });
    }

    post(msg) { this.panel.webview.postMessage(msg); }

    load(profileName) {
        this.originalName = profileName;
        this.pending = {};
        this.panel.title = profileName ? `EFx Profile: ${profileName}` : "New EFx Profile";
        if (this.ready) this.sendState().catch(e => this.post({ type: "error", message: e.message }));
    }

    secretKey(name, kind) { return this.deps.profileSecretKey(name, kind); }

    async storedSecret(kind) {
        if (!this.originalName) return "";
        return (await this.context.secrets.get(this.secretKey(this.originalName, kind))) || "";
    }

    // Value the profile will have after Save: pending wins over stored.
    async effectiveSecret(kind) {
        if (kind in this.pending) return this.pending[kind] || "";
        return this.storedSecret(kind);
    }

    async sendState() {
        const d = this.deps;
        const name = this.originalName;
        const p = name ? d.getProfiles().find(x => x.name === name) : null;
        if (name && !p) throw new Error(`Profile "${name}" no longer exists.`);
        const draft = p ? JSON.parse(JSON.stringify(p)) : {
            name: "", serverUrl: "", username: "", companies: [],
            autoPush: false, autoClean: false, claudeAccess: "off",
        };
        draft.authType = d.authTypeOf(draft);
        const secrets = {};
        for (const kind of SECRET_KINDS) secrets[kind] = !!(await this.storedSecret(kind));
        const root = p ? d.profileRootNoPrompt(p.name) : null;
        const activeName = d.getActiveProfileName();
        this.post({
            type: "state",
            profiles: d.getProfiles().map(x => ({ name: x.name, active: x.name === activeName })),
            isNew: !p,
            isActive: !!p && d.getActiveProfileName() === p.name,
            activeCompany: d.getActiveCompany(),
            draft,
            secrets,
            pending: this.pendingView(),
            accessLevels: d.CLAUDE_ACCESS_LEVELS,
            authState: p ? await d.auth.getAuthState(p) : { state: "n/a" },
            bridge: { file: BRIDGE_FILE, requestDir: root ? path.join(root, REQUEST_DIR) : null },
        });
    }

    pendingView() {
        const v = {};
        for (const kind of Object.keys(this.pending)) v[kind] = this.pending[kind] === null ? "clear" : "set";
        return v;
    }

    async onMessage(m) {
        if (!m || typeof m !== "object") return;
        switch (m.type) {
            case "ready":
                this.ready = true;
                return this.sendState();
            case "setSecret": {
                if (!SECRET_KINDS.includes(m.kind)) return;
                const v = typeof m.value === "string" ? m.value : "";
                if (!v) throw Object.assign(new Error("Nothing typed."), { field: m.kind });
                this.pending[m.kind] = v;
                return this.post({ type: "pending", pending: this.pendingView() });
            }
            case "clearSecret":
                if (m.kind !== "apiKey") return; // a basic profile always needs its password
                this.pending.apiKey = null;
                return this.post({ type: "pending", pending: this.pendingView() });
            case "undoSecret":
                delete this.pending[m.kind];
                return this.post({ type: "pending", pending: this.pendingView() });
            case "fetchCompanies":
                return this.fetchCompanies(m.draft || {}, String(m.seed || "").trim());
            case "save":
                return this.save(m.draft || {}, m.activeCompany ? String(m.activeCompany) : "");
            case "switch": {
                if (m.dirty || Object.keys(this.pending).length) {
                    const ok = await vscode.window.showWarningMessage(
                        `Discard unsaved changes to "${this.originalName || "new profile"}"?`, { modal: true }, "Discard");
                    if (ok !== "Discard") return this.post({ type: "switchCancelled" });
                }
                return this.load(typeof m.name === "string" && m.name ? m.name : null);
            }
            case "signIn": {
                const p = this.originalName && this.deps.getProfiles().find(x => x.name === this.originalName);
                if (!p) throw new Error("Save the profile first.");
                await vscode.commands.executeCommand("efx.signIn", p.name);
                return this.post({ type: "authState", authState: await this.deps.auth.getAuthState(p) });
            }
            case "applyAccessAll":
                return this.applyAccessAll(m.level);
            case "revert":
                this.pending = {};
                return this.sendState();
            case "close":
                return this.panel.dispose();
        }
    }

    // Writes claudeAccess on every saved profile right away (not on Save) after a
    // modal confirm. Leaves the rest of the form, and any unsaved edits, alone.
    async applyAccessAll(level) {
        const d = this.deps;
        const lvl = (d.CLAUDE_ACCESS_LEVELS || []).find(l => l.value === level);
        if (!lvl) return;
        const profiles = d.getProfiles();
        if (!profiles.length) throw new Error("No saved profiles yet.");
        const ok = await vscode.window.showWarningMessage(
            `Set Claude access to "${level}" on all ${profiles.length} profiles?`,
            { modal: true, detail: `${profiles.map(p => `${p.name}: ${p.claudeAccess || "off"} → ${level}`).join("\n")}` },
            "Apply to all");
        if (ok !== "Apply to all") return;
        for (const p of profiles) p.claudeAccess = level;
        await d.setProfiles(profiles);
        this.post({ type: "accessApplied", level, count: profiles.length });
    }

    async fetchCompanies(input, seed) {
        const d = clean(input, {});
        if (!d.serverUrl || !d.username) throw new Error("Server URL and username first.");
        if (!seed) throw Object.assign(new Error("Enter a company to authenticate the lookup against."), { field: "seed" });
        let client;
        if (d.authType === "entra") {
            // Uses the SAVED profile's Entra settings and sign-in (silent token).
            const saved = this.originalName && this.deps.getProfiles().find(p => p.name === this.originalName);
            if (!saved || this.deps.authTypeOf(saved) !== "entra") throw new Error("Save the Entra profile and sign in first, then fetch.");
            client = new this.deps.EpicorClient(this.deps.auth.clientConfig(saved, seed));
        } else {
            const password = await this.effectiveSecret("password");
            if (!password) throw Object.assign(new Error("Set a password first (Authentication tab)."), { field: "password" });
            const apiKey = await this.effectiveSecret("apiKey");
            client = new this.deps.EpicorClient(this.deps.auth.draftBasicConfig({ serverUrl: d.serverUrl, company: seed, username: d.username, password, apiKey }));
        }
        this.post({ type: "busy", text: `Fetching companies for ${d.username}…` });
        const list = await client.getUserCompanies();
        this.post({ type: "companies", companies: Array.from(new Set([seed, ...list])) });
    }

    async save(input, activeCompany) {
        const d = this.deps;
        const secrets = this.context.secrets;
        const orig = this.originalName;
        const profiles = d.getProfiles();
        const idx = orig ? profiles.findIndex(p => p.name === orig) : -1;
        if (orig && idx < 0) throw new Error(`Profile "${orig}" was deleted elsewhere — close this panel.`);

        const next = clean(input, idx >= 0 ? profiles[idx] : {});
        const bad = validate(next);
        if (bad) throw Object.assign(new Error(bad.message), { field: bad.field });
        if (profiles.some((p, i) => i !== idx && p.name === next.name)) {
            throw Object.assign(new Error(`Profile "${next.name}" already exists.`), { field: "name" });
        }
        if (next.authType === "basic" && !(await this.effectiveSecret("password"))) {
            throw Object.assign(new Error("Basic auth needs a password."), { field: "password" });
        }

        // Rename: carry stored secrets to the new name first.
        if (orig && next.name !== orig) {
            for (const kind of SECRET_KINDS) {
                const v = await secrets.get(this.secretKey(orig, kind));
                if (v) await secrets.store(this.secretKey(next.name, kind), v);
                await secrets.delete(this.secretKey(orig, kind));
            }
        }
        for (const [kind, v] of Object.entries(this.pending)) {
            if (v === null) await secrets.delete(this.secretKey(next.name, kind));
            else await secrets.store(this.secretKey(next.name, kind), v);
        }
        // An Entra profile never keeps a password around.
        if (next.authType === "entra") await secrets.delete(this.secretKey(next.name, "password"));

        if (idx >= 0) profiles[idx] = next; else profiles.push(next);
        await d.setProfiles(profiles);
        this.pending = {};
        this.originalName = next.name;
        this.panel.title = `EFx Profile: ${next.name}`;

        const wasActive = !!orig && d.getActiveProfileName() === orig;
        if (wasActive) {
            if (next.name !== orig) await d.setActiveProfileName(next.name);
            if (activeCompany && next.companies.includes(activeCompany)) await d.setActiveCompany(activeCompany);
            await d.activateProfile(next.name);
        } else if (!orig && profiles.length === 1) {
            await d.activateProfile(next.name);
        } else if (!orig) {
            vscode.window.showInformationMessage(`EFx: Profile "${next.name}" saved.`, "Activate").then(a => {
                if (a === "Activate") d.activateProfile(next.name);
            });
        }
        await this.sendState();
        this.post({ type: "saved" });
    }
}

// Overlay the editable fields onto the stored profile so fields this panel
// doesn't know about survive a save.
function clean(input, base) {
    const s = v => (typeof v === "string" ? v.trim() : "");
    const out = { ...base };
    out.name = s(input.name);
    out.serverUrl = s(input.serverUrl).replace(/\/+$/, "");
    out.username = s(input.username);
    out.companies = Array.isArray(input.companies)
        ? Array.from(new Set(input.companies.map(c => String(c).trim()).filter(Boolean)))
        : [];
    out.autoPush = !!input.autoPush;
    out.autoClean = !!input.autoClean;
    out.claudeAccess = ["off", "read", "write", "risky"].includes(input.claudeAccess) ? input.claudeAccess : "off";
    out.authType = input.authType === "entra" ? "entra" : "basic";
    for (const f of ENTRA_FIELDS) {
        if (out.authType === "entra") out[f] = s(input[f]);
        else delete out[f];
    }
    return out;
}

function validate(p) {
    if (!p.name) return { field: "name", message: "Name is required." };
    if (!NAME_RE.test(p.name)) return { field: "name", message: "Name: letters, numbers, space, dash, dot, underscore." };
    if (!/^https?:\/\/\S+$/.test(p.serverUrl)) return { field: "serverUrl", message: "Server URL must start with http:// or https://." };
    if (!p.username) return { field: "username", message: p.authType === "entra" ? "Epicor user ID is required." : "Username is required." };
    if (!p.companies.length) return { field: "companies", message: "At least one company." };
    if (p.authType === "entra") {
        if (!GUID_RE.test(p.clientId)) return { field: "clientId", message: "Client ID must be a GUID." };
        if (!GUID_RE.test(p.tenantId) && !DOMAIN_RE.test(p.tenantId)) return { field: "tenantId", message: "Tenant must be a GUID or a domain." };
        if (!p.scope || /\s/.test(p.scope)) return { field: "scope", message: "One scope, no spaces." };
        if (p.redirectUri && !/^https:\/\/\S+$/.test(p.redirectUri)) return { field: "redirectUri", message: "Redirect must be an https address, or empty for the vscode:// link." };
    }
    return null;
}

function pageHtml(nonce, cspSource) {
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style nonce="${nonce}">
body{font-family:var(--vscode-font-family);font-size:var(--vscode-font-size);color:var(--vscode-foreground);background:var(--vscode-editor-background);margin:0;padding:0}
.wrap{max-width:720px;padding:16px 24px 80px}
h1{font-size:16px;font-weight:600;margin:4px 0 12px}
.tag{font-size:11px;padding:1px 6px;border-radius:8px;margin-left:8px;background:var(--vscode-badge-background);color:var(--vscode-badge-foreground);vertical-align:middle}
.tabs{display:flex;border-bottom:1px solid var(--vscode-panel-border);margin-bottom:16px}
.tab{background:none;border:none;border-bottom:2px solid transparent;color:var(--vscode-descriptionForeground);padding:6px 14px;cursor:pointer;font:inherit}
.tab.on{color:var(--vscode-foreground);border-bottom-color:var(--vscode-focusBorder)}
.tab .dot{color:var(--vscode-errorForeground);margin-left:4px}
section{display:none}section.on{display:block}
.row{margin-bottom:14px}
label.l{display:block;font-weight:600;margin-bottom:4px}
.hint{color:var(--vscode-descriptionForeground);font-size:12px;margin-top:3px}
input[type=text],input[type=password],select{box-sizing:border-box;width:100%;padding:4px 6px;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border,transparent);font:inherit}
input:focus,select:focus{outline:1px solid var(--vscode-focusBorder)}
.bad{outline:1px solid var(--vscode-inputValidation-errorBorder,#f14c4c)!important}
.inline{display:flex;gap:6px;align-items:center}
.inline input{flex:1}
.mt{margin-top:6px}
.mb{margin-bottom:14px}
button.b{background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground);border:none;padding:4px 10px;cursor:pointer;font:inherit;white-space:nowrap}
button.b:hover{background:var(--vscode-button-secondaryHoverBackground)}
button.p{background:var(--vscode-button-background);color:var(--vscode-button-foreground)}
button.p:hover{background:var(--vscode-button-hoverBackground)}
button:disabled{opacity:.5;cursor:default}
.head{display:flex;align-items:center;gap:8px;margin:4px 0 12px}
.head select{width:auto;min-width:220px;font-size:13px}
/* Checkbox / radio drawn with VS Code's checkbox theme colors */
input[type=checkbox],input[type=radio]{-webkit-appearance:none;appearance:none;box-sizing:border-box;width:16px;height:16px;margin:1px 8px 0 0;flex-shrink:0;position:relative;cursor:pointer;
  border:1px solid var(--vscode-checkbox-border,var(--vscode-input-border,#6b6b6b));background:var(--vscode-checkbox-background,var(--vscode-input-background));border-radius:3px}
input[type=radio]{border-radius:50%}
input[type=checkbox]:checked::after{content:"";position:absolute;left:4px;top:1px;width:4px;height:8px;border:solid var(--vscode-checkbox-foreground,var(--vscode-foreground));border-width:0 2px 2px 0;transform:rotate(45deg)}
input[type=radio]:checked::after{content:"";position:absolute;inset:3px;border-radius:50%;background:var(--vscode-checkbox-foreground,var(--vscode-foreground))}
input[type=checkbox]:focus-visible,input[type=radio]:focus-visible{outline:1px solid var(--vscode-focusBorder);outline-offset:1px}
label.opt{display:flex;align-items:flex-start;padding:3px 0;cursor:pointer;line-height:18px}
.radio{display:flex;gap:22px;margin-top:2px}
.opt .d{color:var(--vscode-descriptionForeground)}
.access{margin:4px 0 10px}
.access.bad{outline-offset:4px}
.box{border:1px solid var(--vscode-panel-border);padding:10px 12px;margin-bottom:14px}
.box h3{margin:0 0 8px;font-size:13px}
.status{font-size:12px;margin-left:6px}
.ok{color:var(--vscode-testing-iconPassed,#3fb950)}
.warn{color:var(--vscode-list-warningForeground,#cca700)}
.muted{color:var(--vscode-descriptionForeground)}
.cos{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:0 14px;margin:4px 0 8px}
code{font-family:var(--vscode-editor-font-family);font-size:12px;word-break:break-all}
.foot{position:fixed;left:0;right:0;bottom:0;display:flex;gap:8px;align-items:center;padding:10px 24px;background:var(--vscode-sideBar-background,var(--vscode-editor-background));border-top:1px solid var(--vscode-panel-border)}
.msg{flex:1;font-size:12px}
.msg.err{color:var(--vscode-errorForeground)}
</style></head><body>
<div class="wrap">
<div class="head"><select id="profileSel" aria-label="Profile"></select><span id="activeTag" class="tag" hidden>active</span></div>
<div class="tabs">
  <button class="tab on" data-tab="general">General<span class="dot" hidden>●</span></button>
  <button class="tab" data-tab="auth">Authentication<span class="dot" hidden>●</span></button>
  <button class="tab" data-tab="integrations">Integrations<span class="dot" hidden>●</span></button>
</div>

<section id="general" class="on">
  <div class="row"><label class="l" for="name">Name</label><input type="text" id="name" placeholder="Dev, Pilot, Prod…"></div>
  <div class="row"><label class="l" for="serverUrl">Server URL</label><input type="text" id="serverUrl" placeholder="https://server/instance"></div>
  <div class="row">
    <label class="l">Companies</label>
    <div id="cos" class="cos"></div>
    <div class="inline"><input type="text" id="addCo" placeholder="Add company code"><button class="b" id="addCoBtn">Add</button></div>
    <div class="inline mt"><input type="text" id="seed" placeholder="Company to authenticate the lookup"><button class="b" id="fetchBtn">Fetch from server</button></div>
  </div>
  <div class="row" id="activeCoRow" hidden><label class="l" for="activeCo">Active company</label><select id="activeCo"></select></div>
  <div class="row">
    <label class="opt"><input type="checkbox" id="autoPush"><span>Auto-push to Epicor when a .cs file is saved</span></label>
    <label class="opt"><input type="checkbox" id="autoClean"><span>Delete the local .cs file when its tab is closed (only if fully saved)</span></label>
  </div>
</section>

<section id="auth">
  <div class="row">
    <label class="l">Sign-in method</label>
    <div class="radio">
      <label class="opt"><input type="radio" name="authType" value="basic"><span>Basic — username + password</span></label>
      <label class="opt"><input type="radio" name="authType" value="entra"><span>Entra SSO — Microsoft sign-in</span></label>
    </div>
    <div class="hint" id="entraSwitchHint" hidden>Saving as Entra deletes this profile's stored password.</div>
  </div>
  <div class="row"><label class="l" for="username" id="usernameLabel">Username</label><input type="text" id="username">
    <div class="hint" id="usernameHint" hidden>Still needed for company lookup and the layer preview. Sign-in itself goes through Entra.</div></div>

  <div class="box" id="basicBox">
    <h3>Password <span class="status" id="st-password"></span></h3>
    <div class="inline"><input type="password" id="in-password" placeholder="Type to set or change" autocomplete="off"><button class="b" data-set="password">Set</button><button class="b" data-undo="password" hidden>Undo</button></div>
  </div>

  <div class="box" id="entraBox">
    <h3>Entra app</h3>
    <div class="row"><label class="l" for="authUrl">Paste sign-in URL</label>
      <div class="inline"><input type="text" id="authUrl" placeholder="https://login.microsoftonline.com/…/authorize?client_id=…&amp;scope=…"><button class="b" id="fillFromUrl">Fill</button></div></div>
    <div class="row"><label class="l" for="clientId">Client ID</label><input type="text" id="clientId" placeholder="Kinetic native app registration (GUID)"></div>
    <div class="row"><label class="l" for="tenantId">Tenant ID</label><input type="text" id="tenantId" placeholder="GUID or domain"></div>
    <div class="row"><label class="l" for="scope">Scope</label><input type="text" id="scope" placeholder="api://&lt;webAppId&gt;/&lt;scopeName&gt;"></div>
    <div class="row"><label class="l" for="redirectUri">Redirect URI</label><input type="text" id="redirectUri" placeholder="Empty = vscode:// link (needs admin)"></div>
    <div class="inline"><button class="b" id="signInBtn">Sign In</button><span class="status" id="signInStatus"></span></div>
  </div>

  <div class="box">
    <h3>API key <span class="status" id="st-apiKey"></span></h3>
    <div class="inline"><input type="password" id="in-apiKey" placeholder="Type to set or change" autocomplete="off"><button class="b" data-set="apiKey">Set</button><button class="b" id="clearKey">Clear</button><button class="b" data-undo="apiKey" hidden>Undo</button></div>
  </div>
</section>

<section id="integrations">
  <div class="box">
    <h3>Claude (EFx MCP server)</h3>
    <label class="l">Access while this profile is active</label>
    <div class="access" id="accessList"></div>
    <div class="inline mb"><button class="b" id="applyAllBtn">Apply to all profiles</button><span class="status muted" id="applyAllNote"></span></div>
    <div class="hint">Bridge file: <code id="bridgeFile"></code></div>
    <div class="hint">Request folder: <code id="reqDir"></code></div>
  </div>
</section>
</div>

<div class="foot">
  <button class="b p" id="saveBtn">Save</button>
  <button class="b" id="revertBtn">Revert</button>
  <button class="b" id="closeBtn">Close</button>
  <span class="msg" id="msg"></span>
</div>

<script nonce="${nonce}">
const vscode = acquireVsCodeApi();
const $ = id => document.getElementById(id);
const FIELD_TAB = { name:"general", serverUrl:"general", companies:"general", seed:"general",
  username:"auth", authUrl:"auth", password:"auth", apiKey:"auth", clientId:"auth", tenantId:"auth", scope:"auth", redirectUri:"auth", claudeAccess:"integrations" };
let S = null;            // last state from the extension
let known = [];          // companies shown as checkboxes
let checked = new Set();
let dirty = false;

function showTab(t){
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("on", b.dataset.tab === t));
  document.querySelectorAll("section").forEach(s => s.classList.toggle("on", s.id === t));
}
document.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => showTab(b.dataset.tab)));

function msg(text, err){ const m = $("msg"); m.textContent = text || ""; m.classList.toggle("err", !!err); }
function clearBad(){
  document.querySelectorAll(".bad").forEach(e => e.classList.remove("bad"));
  document.querySelectorAll(".tab .dot").forEach(d => d.hidden = true);
}
function markBad(field){
  if (!field) return;
  const el = $(field === "password" || field === "apiKey" ? "in-" + field
    : field === "companies" ? "addCo" : field === "claudeAccess" ? "accessList" : field);
  if (el) el.classList.add("bad");
  const tab = FIELD_TAB[field];
  if (tab){ const b = document.querySelector('.tab[data-tab="' + tab + '"]'); b.querySelector(".dot").hidden = false; showTab(tab); }
}
function setDirty(v){ dirty = v; $("saveBtn").textContent = v ? "Save ●" : "Save"; }

function authType(){ const r = document.querySelector('input[name=authType]:checked'); return r ? r.value : "basic"; }
function renderAuth(){
  const entra = authType() === "entra";
  $("basicBox").hidden = entra;
  $("entraBox").hidden = !entra;
  $("usernameLabel").textContent = entra ? "Epicor user ID" : "Username";
  $("usernameHint").hidden = !entra;
  $("entraSwitchHint").hidden = !(entra && S && S.secrets.password);
}
document.querySelectorAll('input[name=authType]').forEach(r => r.addEventListener("change", () => { renderAuth(); setDirty(true); }));

function secretStatus(kind){
  const p = S.pending[kind], el = $("st-" + kind);
  if (p === "set"){ el.textContent = "changes on save"; el.className = "status warn"; }
  else if (p === "clear"){ el.textContent = "cleared on save"; el.className = "status warn"; }
  else if (S.secrets[kind]){ el.textContent = "set"; el.className = "status ok"; }
  else { el.textContent = "not set"; el.className = "status muted"; }
  const undo = document.querySelector('[data-undo="' + kind + '"]');
  if (undo) undo.hidden = !p;
}

function renderCompanies(){
  const box = $("cos"); box.textContent = "";
  for (const c of known){
    const lab = document.createElement("label"); lab.className = "opt";
    const cb = document.createElement("input");
    cb.type = "checkbox"; cb.checked = checked.has(c);
    cb.addEventListener("change", () => { cb.checked ? checked.add(c) : checked.delete(c); renderActiveCo(); setDirty(true); });
    const t = document.createElement("span"); t.textContent = c;
    lab.appendChild(cb); lab.appendChild(t);
    box.appendChild(lab);
  }
  if (!known.length){ const s = document.createElement("span"); s.className = "muted"; s.textContent = "None yet."; box.appendChild(s); }
  renderActiveCo();
}
function renderActiveCo(){
  $("activeCoRow").hidden = !(S && S.isActive);
  const sel = $("activeCo"), was = sel.value || (S && S.activeCompany);
  sel.textContent = "";
  for (const c of known.filter(c => checked.has(c))){
    const o = document.createElement("option"); o.value = c; o.textContent = c; sel.appendChild(o);
  }
  if ([...sel.options].some(o => o.value === was)) sel.value = was;
}
function addCompanies(list, check){
  for (const c of list){ if (!known.includes(c)) known.push(c); if (check) checked.add(c); }
  renderCompanies();
}
$("addCoBtn").addEventListener("click", () => {
  const v = $("addCo").value.trim().split(",").map(s => s.trim()).filter(Boolean);
  if (!v.length) return;
  addCompanies(v, true); $("addCo").value = ""; setDirty(true);
});
$("addCo").addEventListener("keydown", e => { if (e.key === "Enter") $("addCoBtn").click(); });

function collect(){
  return {
    name: $("name").value, serverUrl: $("serverUrl").value, username: $("username").value,
    companies: known.filter(c => checked.has(c)),
    autoPush: $("autoPush").checked, autoClean: $("autoClean").checked,
    claudeAccess: accessLevel(), authType: authType(),
    clientId: $("clientId").value, tenantId: $("tenantId").value, scope: $("scope").value, redirectUri: $("redirectUri").value,
  };
}

$("fetchBtn").addEventListener("click", () => { clearBad(); vscode.postMessage({ type:"fetchCompanies", draft: collect(), seed: $("seed").value }); });
document.querySelectorAll("[data-set]").forEach(b => b.addEventListener("click", () => {
  const kind = b.dataset.set, input = $("in-" + kind);
  clearBad();
  vscode.postMessage({ type:"setSecret", kind, value: input.value });
  input.value = "";
}));
document.querySelectorAll("[data-undo]").forEach(b => b.addEventListener("click", () => vscode.postMessage({ type:"undoSecret", kind: b.dataset.undo })));
$("clearKey").addEventListener("click", () => vscode.postMessage({ type:"clearSecret", kind:"apiKey" }));
$("saveBtn").addEventListener("click", () => { clearBad(); msg("Saving…"); vscode.postMessage({ type:"save", draft: collect(), activeCompany: $("activeCo").value }); });
$("revertBtn").addEventListener("click", () => { clearBad(); vscode.postMessage({ type:"revert" }); });
$("closeBtn").addEventListener("click", () => vscode.postMessage({ type:"close" }));
document.querySelectorAll("input[type=text],input[type=checkbox],select").forEach(el =>
  el.addEventListener(el.tagName === "SELECT" || el.type === "checkbox" ? "change" : "input", () => {
    if (!["addCo", "seed", "profileSel", "authUrl"].includes(el.id)) setDirty(true);
  }));

// Profile picker: switching asks the extension first so unsaved edits get a confirm.
$("profileSel").addEventListener("change", () => {
  const v = $("profileSel").value;
  vscode.postMessage({ type:"switch", name: v === "__new__" ? null : v, dirty });
});
function renderProfileSel(){
  const sel = $("profileSel"); sel.textContent = "";
  for (const p of S.profiles){
    const o = document.createElement("option"); o.value = p.name;
    o.textContent = p.name; sel.appendChild(o);
  }
  const n = document.createElement("option"); n.value = "__new__"; n.textContent = "＋ New profile…"; sel.appendChild(n);
  sel.value = S.isNew ? "__new__" : S.draft.name;
}

function accessLevel(){ const r = document.querySelector('input[name=access]:checked'); return r ? r.value : "off"; }
function renderAccess(level){
  const box = $("accessList"); box.textContent = "";
  for (const l of S.accessLevels){
    const lab = document.createElement("label"); lab.className = "opt";
    const r = document.createElement("input"); r.type = "radio"; r.name = "access"; r.value = l.value; r.checked = l.value === level;
    r.addEventListener("change", () => { setDirty(true); $("applyAllNote").textContent = ""; });
    const dash = l.label.indexOf(" — ");
    const b = document.createElement("b"); b.textContent = dash > 0 ? l.label.slice(0, dash) : l.label;
    const d = document.createElement("span"); d.className = "d"; d.textContent = dash > 0 ? " — " + l.label.slice(dash + 3) : "";
    const t = document.createElement("span"); t.appendChild(b); t.appendChild(d);
    lab.appendChild(r); lab.appendChild(t); box.appendChild(lab);
  }
}
// Pull client_id / tenant / scope out of the Microsoft authorize URL Kinetic
// redirects to. Decodes a few times so a URL nested inside another one works.
function parseAuthUrl(raw){
  let t = String(raw || "").trim();
  for (let i = 0; i < 3; i++){
    let d; try { d = decodeURIComponent(t.replace(/\\+/g, " ")); } catch { break; }
    if (d === t) break; t = d;
  }
  const tenant = (t.match(/login\\.(?:microsoftonline\\.com|microsoft\\.com|windows\\.net)\\/([^\\/?#\\s]+)/i) || [])[1] || "";
  const clientId = (t.match(/[?&]client_id=([^&#\\s]+)/i) || [])[1] || "";
  const scopeRaw = (t.match(/[?&]scope=([^&#]+)/i) || [])[1] || "";
  const scope = scopeRaw.split(/\\s+/).find(x => x && !["openid", "profile", "offline_access", "email"].includes(x.toLowerCase())) || "";
  const redirect = (t.match(/[?&]redirect_uri=([^&#\\s]+)/i) || [])[1] || "";
  return { tenant: ["common", "organizations", "consumers"].includes(tenant.toLowerCase()) ? "" : tenant, clientId, scope, redirect: /^https:\\/\\//i.test(redirect) ? redirect : "" };
}
$("fillFromUrl").addEventListener("click", () => {
  clearBad();
  const r = parseAuthUrl($("authUrl").value), got = [];
  if (r.clientId){ $("clientId").value = r.clientId; got.push("Client ID"); }
  if (r.tenant){ $("tenantId").value = r.tenant; got.push("Tenant"); }
  if (r.scope){ $("scope").value = r.scope; got.push("Scope"); }
  if (r.redirect){ $("redirectUri").value = r.redirect; got.push("Redirect"); }
  if (!got.length){ msg("No client_id, tenant or scope found in that URL.", true); markBad("authUrl"); return; }
  const missing = ["Client ID", "Tenant", "Scope"].filter(x => !got.includes(x));
  $("authUrl").value = "";
  setDirty(true);
  msg("Filled " + got.join(", ") + (missing.length ? " — still need " + missing.join(", ") : "") + ". Save to keep.", !!missing.length);
});
function renderSignIn(){
  const a = S.authState || {}, st = $("signInStatus"), btn = $("signInBtn");
  const usable = !S.isNew && S.draft.authType === "entra";
  btn.disabled = !usable;
  if (!usable){ st.textContent = "Save as Entra first."; st.className = "status muted"; }
  else if (a.state === "ok"){ st.textContent = "Signed in as " + a.account; st.className = "status ok"; }
  else { st.textContent = "Not signed in"; st.className = "status warn"; }
}
$("signInBtn").addEventListener("click", () => {
  if (dirty){ msg("Save first — sign-in uses the saved Client ID, Tenant and Scope.", true); return; }
  clearBad(); msg("Waiting for Microsoft sign-in…");
  vscode.postMessage({ type:"signIn" });
});
$("applyAllBtn").addEventListener("click", () => vscode.postMessage({ type:"applyAccessAll", level: accessLevel() }));

function render(){
  const d = S.draft;
  renderProfileSel();
  $("activeTag").hidden = !S.isActive;
  $("name").value = d.name || ""; $("serverUrl").value = d.serverUrl || ""; $("username").value = d.username || "";
  $("autoPush").checked = !!d.autoPush; $("autoClean").checked = !!d.autoClean;
  document.querySelectorAll('input[name=authType]').forEach(r => r.checked = r.value === d.authType);
  $("clientId").value = d.clientId || ""; $("tenantId").value = d.tenantId || ""; $("scope").value = d.scope || "";
  $("redirectUri").value = d.redirectUri || "";
  renderAccess(d.claudeAccess || "off"); $("applyAllNote").textContent = "";
  $("bridgeFile").textContent = S.bridge.file;
  $("reqDir").textContent = S.bridge.requestDir || "(set after the first save, once a storage location exists)";
  known = (d.companies || []).slice(); checked = new Set(known);
  $("seed").value = known[0] || "";
  renderCompanies(); renderAuth(); renderSignIn(); secretStatus("password"); secretStatus("apiKey");
  setDirty(false);
}

window.addEventListener("message", e => {
  const m = e.data;
  if (m.type === "state"){ S = m; render(); msg(""); }
  else if (m.type === "pending"){ S.pending = m.pending; secretStatus("password"); secretStatus("apiKey"); setDirty(true); msg(""); }
  else if (m.type === "companies"){ addCompanies(m.companies, checked.size === 0); setDirty(true); msg("Fetched " + m.companies.length + " companies — check the ones to keep."); }
  else if (m.type === "busy"){ msg(m.text); }
  else if (m.type === "saved"){ msg("Saved."); }
  else if (m.type === "switchCancelled"){ renderProfileSel(); }
  else if (m.type === "authState"){ S.authState = m.authState; renderSignIn(); msg(""); }
  else if (m.type === "accessApplied"){
    $("applyAllNote").textContent = 'Applied "' + m.level + '" to ' + m.count + ' profiles.';
    S.draft.claudeAccess = m.level; msg("");
  }
  else if (m.type === "error"){ msg(m.message, true); markBad(m.field); }
});
vscode.postMessage({ type:"ready" });
</script></body></html>`;
}

module.exports = { ProfilePanel };
