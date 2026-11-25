"use strict";
// Claude bridge: lets the EFx MCP server (mcp/) drive this extension.
//
//   MCP writes  <profileRoot>/_claude/<id>.json   { id, profile, op, args, createdAt }
//   extension   claims it (rename), writes <id>.ack.json, runs the op,
//               writes <id>.result.json atomically, deletes the request.
//   MCP reads the result, deletes result + ack.
//
// Triggers: an fs watcher + 2s sweep on the active profile's _claude folder
// (VS Code already running), and vscode://<publisher.name>/request?id=<id>
// (launches VS Code / activates the extension). A web page can open the URI
// but can't write the request file, so the URI alone never does anything.
//
// ~/.efx-manager/bridge.json tells the MCP where to write and what each
// profile allows. It never contains secrets.

const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const os = require("os");

const ID_RE = /^[A-Za-z0-9-]{8,64}$/;
const REQ_RE = /^([A-Za-z0-9-]{8,64})\.json$/;
const LEVELS = ["off", "read", "write", "risky"];
const MAX_AGE_MS = 10 * 60 * 1000;
const CLIENT_WAIT_MS = 20 * 1000;
// Requests already in the folder when we start watching it are held this long.
// A cold start (MCP wrote the request, then opened the vscode:// link) claims
// its request via the link inside the MCP's 30s ack wait; anything still held
// after that is a leftover from before VS Code started and is deleted unrun.
const LEFTOVER_HOLD_MS = 35 * 1000;
const BRIDGE_DIR = path.join(os.homedir(), ".efx-manager");
const BRIDGE_FILE = path.join(BRIDGE_DIR, "bridge.json");
const REQUEST_DIR = "_claude";
const EXTENSION_ID = "cpi.epicor-efx-manager"; // fallback; the live id comes from context.extension
const auth = require("./auth");

function levelOf(profile) {
    const v = profile && profile.claudeAccess;
    return LEVELS.includes(v) ? v : "off";
}
function atLeast(level, need) {
    return LEVELS.indexOf(level) >= LEVELS.indexOf(need);
}
function writeJsonAtomic(file, obj) {
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), "utf-8");
    fs.renameSync(tmp, file);
}
function withTimeout(promise, ms, message) {
    let t;
    return Promise.race([
        promise.finally(() => clearTimeout(t)),
        new Promise((_, reject) => { t = setTimeout(() => reject(new Error(message)), ms); }),
    ]);
}

class ClaudeBridge {
    // api: see buildClaudeApi in extension.js. ops: claudeOps.buildOps(api).
    constructor(context, api, ops) {
        this.context = context;
        this.api = api;
        this.ops = ops;
        this.queue = Promise.resolve();
        this.inFlight = new Set();
        this.watcher = null;
        this.watchedDir = null;
        this.sweepTimer = null;
        this.held = new Map(); // id -> dir, leftovers waiting on a vscode:// claim
    }

    start() {
        const ctx = this.context;
        ctx.subscriptions.push(vscode.window.registerUriHandler({ handleUri: uri => this.handleUri(uri) }));
        ctx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration("efx")) this.refresh();
        }));
        ctx.subscriptions.push({ dispose: () => this.stopWatching() });
        this.refresh();
    }

    // Rewrite bridge.json and re-point the watcher at the active profile.
    refresh() {
        try { this.writeBridgeFile(); } catch (e) { console.error("EFx Claude bridge: bridge.json write failed", e); }
        this.watchActiveDir();
    }

    requestDir(profileName) {
        const root = this.api.profileRootNoPrompt(profileName);
        return root ? path.join(root, REQUEST_DIR) : null;
    }

    writeBridgeFile() {
        const active = this.api.getActiveProfileName();
        const profiles = this.api.getProfiles().map(p => ({
            name: p.name,
            serverUrl: p.serverUrl || "",
            companies: p.companies || [],
            claudeAccess: levelOf(p),
            authType: p.authType === "entra" ? "entra" : "basic",
            root: this.api.profileRootNoPrompt(p.name),
        }));
        fs.mkdirSync(BRIDGE_DIR, { recursive: true });
        writeJsonAtomic(BRIDGE_FILE, {
            version: 1,
            pid: process.pid,
            appName: vscode.env.appName,
            uriScheme: vscode.env.uriScheme,
            extensionId: (this.context.extension && this.context.extension.id) || EXTENSION_ID,
            activeProfile: active || null,
            activeCompany: this.api.getActiveCompany() || null,
            requestDir: active ? this.requestDir(active) : null,
            storageLocationSet: !!this.api.profileRootNoPrompt(active || "Default"),
            profiles,
            updatedAt: new Date().toISOString(),
        });
    }

    stopWatching() {
        if (this.watcher) { try { this.watcher.close(); } catch { /* ignore */ } }
        if (this.sweepTimer) clearInterval(this.sweepTimer);
        this.watcher = null;
        this.sweepTimer = null;
        this.watchedDir = null;
    }

    watchActiveDir() {
        const active = this.api.getActiveProfileName();
        const dir = active ? this.requestDir(active) : null;
        if (dir === this.watchedDir) return;
        this.stopWatching();
        if (!dir) return;
        try { fs.mkdirSync(dir, { recursive: true }); } catch { return; }
        this.watchedDir = dir;
        this.holdLeftovers(dir);
        try {
            this.watcher = fs.watch(dir, (_evt, name) => {
                const m = name && String(name).match(REQ_RE);
                if (m) this.enqueue(m[1]);
            });
            this.watcher.on("error", () => { /* the sweep still runs */ });
        } catch { /* sweep only */ }
        // fs.watch can miss events (network drives, some platforms) — sweep too.
        this.sweepTimer = setInterval(() => this.sweep(), 2000);
        this.sweep();
    }

    sweep() {
        const dir = this.watchedDir;
        if (!dir) return;
        let names = [];
        try { names = fs.readdirSync(dir); } catch { return; }
        for (const n of names) {
            const m = n.match(REQ_RE);
            if (m) this.enqueue(m[1]);
        }
    }

    holdLeftovers(dir) {
        let names = [];
        try { names = fs.readdirSync(dir); } catch { return; }
        const ids = names.map(n => (n.match(REQ_RE) || [])[1]).filter(Boolean);
        if (!ids.length) return;
        for (const id of ids) this.held.set(id, dir);
        setTimeout(() => this.discardHeld(dir), LEFTOVER_HOLD_MS);
    }

    discardHeld(dir) {
        let n = 0;
        for (const [id, d] of this.held) {
            if (d !== dir) continue;
            this.held.delete(id);
            const reqFile = path.join(dir, `${id}.json`);
            const claimed = path.join(dir, `${id}.discarded-${process.pid}`);
            try { fs.renameSync(reqFile, claimed); } catch { continue; } // already gone (claimed, or the MCP gave up)
            try { fs.unlinkSync(claimed); n++; } catch { /* ignore */ }
        }
        if (n) {
            console.log(`EFx Claude bridge: discarded ${n} leftover request(s) in ${dir}`);
            vscode.window.setStatusBarMessage(`EFx: discarded ${n} stale Claude request${n === 1 ? "" : "s"} from before VS Code started`, 8000);
        }
    }

    // One URI handler per extension: /request is the MCP bridge, /auth is the
    // Entra sign-in redirect (auth.js).
    handleUri(uri) {
        if (uri.path === "/auth") return auth.handleRedirect(uri);
        if (uri.path !== "/request") return;
        const id = new URLSearchParams(uri.query).get("id") || "";
        if (!ID_RE.test(id)) {
            vscode.window.showWarningMessage("EFx: Ignored a Claude request link with an invalid id.");
            return;
        }
        // Make sure the watcher is pointed at the active profile, then try the id.
        // The link is what releases a held (cold-start) request.
        this.watchActiveDir();
        this.held.delete(id);
        this.enqueue(id);
    }

    // One request at a time — ops can switch profiles or hit Epicor heavily.
    enqueue(id) {
        if (this.inFlight.has(id) || this.held.has(id)) return;
        this.inFlight.add(id);
        this.queue = this.queue
            .then(() => this.process(id))
            .catch(e => console.error("EFx Claude bridge:", e))
            .finally(() => this.inFlight.delete(id));
    }

    async process(id) {
        const dir = this.watchedDir;
        if (!dir) return;
        const reqFile = path.join(dir, `${id}.json`);
        const claimed = path.join(dir, `${id}.claimed-${process.pid}`);
        // Atomic claim: only one VS Code window wins the rename. A missing file
        // (bare URI from a web page, or already handled) is silently ignored.
        try { fs.renameSync(reqFile, claimed); } catch { return; }

        let req = null;
        let parseError = null;
        try { req = JSON.parse(fs.readFileSync(claimed, "utf-8")); } catch (e) { parseError = e.message; }
        try { fs.unlinkSync(claimed); } catch { /* ignore */ }
        try { writeJsonAtomic(path.join(dir, `${id}.ack.json`), { id, pid: process.pid, at: new Date().toISOString() }); } catch { /* ignore */ }

        let outcome;
        try {
            outcome = parseError
                ? { ok: false, error: `Request file is not valid JSON: ${parseError}` }
                : await this.run(id, req);
        } catch (e) {
            outcome = { ok: false, error: e.message || String(e), ...(e.needsDemote ? { needsDemote: e.needsDemote } : {}) };
        }
        const result = {
            id,
            profile: req && req.profile,
            op: req && req.op,
            finishedAt: new Date().toISOString(),
            ...outcome,
        };
        try { writeJsonAtomic(path.join(dir, `${id}.result.json`), result); }
        catch (e) { console.error("EFx Claude bridge: result write failed", e); }
        this.notify(result);
    }

    async run(id, req) {
        if (!req || typeof req !== "object") return { ok: false, error: "Empty request" };
        if (req.id !== id) return { ok: false, error: "Request id does not match its file name" };
        const age = Date.now() - Date.parse(req.createdAt || "");
        if (!(age >= -60000 && age <= MAX_AGE_MS)) return { ok: false, error: "Request is missing createdAt or is older than 10 minutes" };
        const op = this.ops[req.op];
        if (!op) return { ok: false, error: `Unknown op "${req.op}"` };

        // Let a cold-started extension finish connecting before judging anything.
        try { await withTimeout(this.api.clientReady(), CLIENT_WAIT_MS, "timeout"); } catch { /* checked below */ }

        const activeName = this.api.getActiveProfileName();
        if (!activeName) return { ok: false, error: "No active EFx profile in VS Code" };
        if (req.profile !== activeName) {
            return { ok: false, error: `Request is for profile "${req.profile}" but the active profile is "${activeName}". Claude never switches profiles implicitly — use switch_profile.` };
        }
        const profile = this.api.getActiveProfile();
        const level = levelOf(profile);
        if (!atLeast(level, op.level) || level === "off") {
            return { ok: false, error: `Claude access for profile "${activeName}" is "${level}"; ${req.op} needs "${op.level}". Change it in VS Code: EFx: Manage Profiles → Edit Profile.` };
        }
        if (op.needsClient !== false && !this.api.getClient()) {
            return { ok: false, error: `Profile "${activeName}" is not connected (no stored password?). Open EFx: Manage Profiles in VS Code.` };
        }
        const data = await op.run(req.args || {}, { profile, level, id, levelOf, atLeast });
        const ok = data && typeof data.ok === "boolean" ? data.ok : true;
        return { ok, result: data };
    }

    notify(result) {
        const op = this.ops[result.op];
        const summary = result.result && result.result.summary;
        const text = `Claude: ${result.op || "request"} on ${result.profile || "?"} — ${result.ok ? (summary || "done") : (summary || result.error || "failed")}`;
        if (op && op.level !== "read") {
            (result.ok ? vscode.window.showInformationMessage : vscode.window.showWarningMessage)(text);
        } else {
            vscode.window.setStatusBarMessage(text, 6000);
        }
    }
}

module.exports = { ClaudeBridge, LEVELS, levelOf, atLeast, BRIDGE_FILE, REQUEST_DIR, ID_RE };
