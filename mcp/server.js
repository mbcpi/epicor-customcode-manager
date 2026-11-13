#!/usr/bin/env node
"use strict";
// EFx MCP server. Claude calls a tool → this writes a request file into the
// active EFx profile's _claude folder → the EFx Manager extension in VS Code
// runs it (all Epicor calls, all credentials stay in VS Code) → this returns
// the result file as the tool result.
//
// Discovery: ~/.efx-manager/bridge.json, written by the extension (override
// with EFX_BRIDGE_FILE). No secrets in it, none read here.

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execFile, spawn } = require("child_process");
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { ListToolsRequestSchema, CallToolRequestSchema } = require("@modelcontextprotocol/sdk/types.js");

const BRIDGE_FILE = process.env.EFX_BRIDGE_FILE || path.join(os.homedir(), ".efx-manager", "bridge.json");
const ACK_WAIT_RUNNING_MS = 5000;
const ACK_WAIT_LAUNCH_MS = 30000;
const LEVELS = ["off", "read", "write", "risky"];

// ─── tool catalogue ──────────────────────────────────────────────────────────

const S = {
    str: d => ({ type: "string", description: d }),
    bool: d => ({ type: "boolean", description: d }),
    profile: { type: "string", description: "Name of the EFx profile that must be ACTIVE in VS Code (see list_profiles). Requests for any other profile are refused." },
    allowDemote: { type: "boolean", description: "Only after the user said yes: demote the promoted library, make the change, re-promote it. Needs Claude access risky. Without it, a promoted library returns needsDemote — ask the user first." },
};
const PROMOTED_NOTE = " If the library is promoted the call returns needsDemote: ask the user, then retry with allowDemote: true.";
const sigSchema = {
    type: "array",
    description: "Parameters. type is a .NET type name, e.g. System.String, System.Int32, System.Decimal, System.Boolean, System.DateTime, System.Data.DataSet.",
    items: {
        type: "object",
        properties: {
            name: S.str("Argument name"),
            type: S.str(".NET type"),
            direction: { type: "string", enum: ["in", "out"], description: "in = request, out = response" },
            optional: S.bool("Optional parameter"),
            default: S.str("Default value"),
        },
        required: ["name", "type", "direction"],
    },
};
function tool(name, level, description, properties = {}, required = [], timeout = 120000) {
    return {
        name, level, timeout,
        description: `${description} [needs Claude access: ${level}]`,
        inputSchema: { type: "object", properties: { profile: S.profile, ...properties }, required: ["profile", ...required] },
    };
}
const TOOLS = [
    tool("status", "read", "Active profile, company, connection state and this profile's Claude access level."),
    tool("list_libraries", "read", "List every EFx library on the active environment (ID, description, published state, ...)."),
    tool("get_library", "read", "One library: settings, every function with its signature, and its table/service/assembly/library references.",
        { library: S.str("Library ID"), includeCode: S.bool("Also return each function's code (can be large)") }, ["library"]),
    tool("get_function", "read", "One function straight from Epicor: signature and code (or a readable view of a widget flow), plus the local file path it pulls to.",
        { library: S.str("Library ID"), function: S.str("Function ID") }, ["library", "function"]),
    tool("search_functions", "read", "Search the code and names of every function on the active environment (cached index; refresh to rebuild). Returns library, function, line and the matching line.",
        { query: S.str("Text or regex"), regex: S.bool("Treat query as a regex"), caseSensitive: S.bool("Case sensitive"), word: S.bool("Whole word"), library: S.str("Only this library"), refresh: S.bool("Rebuild the index first") },
        ["query"], 180000),
    tool("pull", "read", "Pull functions from Epicor to local .cs files (the files push_functions sends back). Pull one library, some functions of it, or everything. Local files that differ from Epicor are kept unless overwrite is true; files open with unsaved edits are always skipped.",
        { library: S.str("Library ID (omit with all=true)"), functions: { type: "array", items: { type: "string" }, description: "Only these function IDs" }, all: S.bool("Pull every library"), overwrite: S.bool("Overwrite local files that differ from Epicor") },
        [], 600000),
    tool("list_bpm", "read", "List BPM directives. source BO = method directives (pass service like Erp.BO.SalesOrder, or a filter; with neither you get the service list), DB = data directives, DQ = updatable BAQ directives.",
        { source: { type: "string", enum: ["BO", "DB", "DQ"] }, service: S.str("BO only: Erp.BO.SalesOrder"), filter: S.str("Substring of method code or directive name") },
        ["source"], 180000),
    tool("pull_directive", "read", "Pull one BPM directive's custom C# to a local file (directives with widgets only can't be pulled). Returns the file path for push_directives.",
        { source: { type: "string", enum: ["BO", "DB", "DQ"] }, method: S.str("BpMethodCode, e.g. Erp.BO.SalesOrder.Update or Erp.Part.Update"), directiveId: S.str("DirectiveID from list_bpm"), overwrite: S.bool("Replace a local file that differs from Epicor") },
        ["source", "method", "directiveId"]),
    tool("compare", "read", "Compare two profiles (environments). kind functions = libraries/functions/references, kind bpm = all BPM directives. Returns only differences. Needs at least read access on both profiles.",
        { profileA: S.str("Profile A"), companyA: S.str("Company in A (default: first)"), profileB: S.str("Profile B"), companyB: S.str("Company in B (default: first)"), kind: { type: "string", enum: ["functions", "bpm"] }, library: S.str("functions only: limit to one library"), includeCode: S.bool("with library: include both sides' code for differing functions") },
        ["profileA", "profileB"], 300000),

    tool("push_functions", "write", "Push local .cs files (from pull) to Epicor. Several functions in one library go in ONE save — one compile, all or nothing; a single function and widget-flow functions push one at a time. Refuses frozen (locked) libraries and files open in VS Code with unsaved edits. Backs up the server version first. Returns per-function ok/errors/diagnostics." + PROMOTED_NOTE,
        { functions: { type: "array", items: { type: "object", properties: { library: S.str("Library ID"), function: S.str("Function ID") }, required: ["library", "function"] } }, allowDemote: S.allowDemote },
        ["functions"]),
    tool("push_directives", "write", "Push pulled BPM directive files back to Epicor (verified after save). Paths are relative to the profile folder, as returned by pull_directive.",
        { files: { type: "array", items: { type: "string" } } }, ["files"]),
    tool("new_function", "write", "Create a code function in a library, optionally with its signature." + PROMOTED_NOTE,
        { library: S.str("Library ID"), function: S.str("New function ID"), description: S.str("Description"), signatures: sigSchema, allowDemote: S.allowDemote }, ["library", "function"]),
    tool("delete_function", "write", "Delete a function (server body and signature are backed up locally first)." + PROMOTED_NOTE,
        { library: S.str("Library ID"), function: S.str("Function ID"), allowDemote: S.allowDemote }, ["library", "function"]),
    tool("new_library", "write", "Create an empty code library.",
        { library: S.str("New library ID"), description: S.str("Description") }, ["library"]),
    tool("add_reference", "write", "Add a reference to a library. kind table: value ERP.Part (+ updatable); service: ERP:BO:Part; assembly: Newtonsoft.Json.dll; library: LibraryID (+ mode 0 normal, 1 read-only, 2 hidden)." + PROMOTED_NOTE,
        { library: S.str("Library ID"), kind: { type: "string", enum: ["table", "service", "assembly", "library"] }, value: S.str("Reference"), updatable: S.bool("table only"), mode: { type: "integer", enum: [0, 1, 2] }, allowDemote: S.allowDemote },
        ["library", "kind", "value"]),
    tool("set_table_updatable", "write", "Make a table reference read-only or updatable." + PROMOTED_NOTE,
        { library: S.str("Library ID"), table: S.str("e.g. ERP.Part"), updatable: S.bool("true = updatable"), allowDemote: S.allowDemote }, ["library", "table", "updatable"]),
    tool("save_signatures", "write", "Replace a function's whole signature (parameters not listed are removed). Old signature is backed up." + PROMOTED_NOTE,
        { library: S.str("Library ID"), function: S.str("Function ID"), signatures: sigSchema, allowDemote: S.allowDemote }, ["library", "function", "signatures"]),
    tool("regenerate_library", "write", "Regenerate/validate a library on the server and return its validation errors.",
        { library: S.str("Library ID") }, ["library"], 300000),
    tool("execute_function", "write", "Run an EFx function on the server (it can change data). Unpromoted libraries run via the staging endpoint.",
        { library: S.str("Library ID"), function: S.str("Function ID"), params: { type: "object", description: "Request parameters by name" }, company: S.str("Company (default: active)") },
        ["library", "function"], 300000),
    tool("switch_profile", "write", "Make another profile active in VS Code (its Claude access must not be off). Every later call must pass the new profile name.",
        { target: S.str("Profile to activate"), company: S.str("Company in it") }, ["target"]),
    tool("switch_company", "write", "Change the active company within the active profile.",
        { company: S.str("Company") }, ["company"]),
    tool("create_profile", "write", "Create a profile. VS Code then asks the user for the password and API key (they never pass through Claude). New profiles start with Claude access off.",
        { name: S.str("Profile name"), serverUrl: S.str("https://server/instance"), username: S.str("Epicor user"), companies: { type: "array", items: { type: "string" } }, autoPush: S.bool("Auto-push on save"), autoClean: S.bool("Delete local file on close") },
        ["name", "serverUrl", "username", "companies"], 300000),
    tool("update_profile", "write", "Edit a profile's non-secret fields (Claude access can only be changed in VS Code).",
        { name: S.str("Profile to edit"), newName: S.str("Rename to"), serverUrl: S.str("Server URL"), username: S.str("User"), companies: { type: "array", items: { type: "string" } }, autoPush: S.bool("Auto-push"), autoClean: S.bool("Auto-clean") },
        ["name"]),
    tool("delete_profile", "write", "Delete a profile and its stored credentials (not the active one).",
        { name: S.str("Profile to delete") }, ["name"]),
    tool("set_profile_secret", "write", "Ask the user, in VS Code, to type a profile's password or API key.",
        { name: S.str("Profile"), kind: { type: "string", enum: ["password", "apiKey"] } }, ["name"], 300000),

    tool("promote_library", "risky", "Promote a library to production.", { library: S.str("Library ID") }, ["library"]),
    tool("demote_library", "risky", "Demote a library from production.", { library: S.str("Library ID") }, ["library"]),
];
const BY_NAME = new Map(TOOLS.map(t => [t.name, t]));

const LIST_PROFILES = {
    name: "list_profiles",
    description: "Profiles configured in the EFx extension: name, server, companies, Claude access level, which one is active. Read locally — no secrets.",
    inputSchema: { type: "object", properties: {} },
};

// ─── bridge plumbing ─────────────────────────────────────────────────────────

function readBridge() {
    let raw;
    try { raw = fs.readFileSync(BRIDGE_FILE, "utf-8"); }
    catch { throw new Error(`EFx bridge file not found (${BRIDGE_FILE}). Open VS Code once with an EFx Manager build that includes the Claude bridge.`); }
    return JSON.parse(raw);
}
function pidAlive(pid) {
    if (!pid) return false;
    try { process.kill(pid, 0); return true; }
    catch (e) { return e.code === "EPERM"; }
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function waitForFile(file, ms, onTick) {
    const end = Date.now() + ms;
    let lastTick = Date.now();
    while (Date.now() < end) {
        if (fs.existsSync(file)) return true;
        await sleep(250);
        if (onTick && Date.now() - lastTick > 10000) { lastTick = Date.now(); onTick(); }
    }
    return fs.existsSync(file);
}
function readJsonRetry(file) {
    // The extension renames into place, so a partial read is unlikely — retry once anyway.
    try { return JSON.parse(fs.readFileSync(file, "utf-8")); }
    catch { return null; }
}
function rmQuiet(file) { try { fs.unlinkSync(file); } catch { /* ignore */ } }

function openUri(uri) {
    return new Promise(resolve => {
        let child;
        if (process.platform === "win32") {
            // start's first quoted arg is the window title.
            child = spawn("cmd", ["/c", `start "" "${uri}"`], { windowsVerbatimArguments: true, stdio: "ignore", detached: true });
        } else if (process.platform === "darwin") {
            child = execFile("open", [uri]);
        } else {
            child = execFile("xdg-open", [uri]);
        }
        child.on("error", () => resolve(false));
        child.on("exit", () => resolve(true));
        setTimeout(() => resolve(true), 3000);
    });
}

function levelOk(level, need) {
    return LEVELS.indexOf(level || "off") >= LEVELS.indexOf(need) && level !== "off";
}

async function callExtension(t, args, progress) {
    const bridge = readBridge();
    const profileName = args.profile;
    if (!bridge.activeProfile) throw new Error("No active EFx profile in VS Code.");
    if (profileName !== bridge.activeProfile) {
        throw new Error(`Profile "${profileName}" is not active — VS Code's active profile is "${bridge.activeProfile}". Use that name, or switch_profile.`);
    }
    const prof = (bridge.profiles || []).find(p => p.name === profileName);
    if (!prof || !levelOk(prof.claudeAccess, t.level)) {
        throw new Error(`Claude access for "${profileName}" is "${prof ? prof.claudeAccess : "off"}"; ${t.name} needs "${t.level}". Change it in VS Code: EFx: Manage Profiles → Edit Profile.`);
    }
    if (!bridge.requestDir) throw new Error("EFx storage location isn't set in VS Code (EFx: Change Storage Location).");

    // Fail fast on missing local files before involving VS Code.
    if (t.name === "push_functions" && Array.isArray(args.functions) && prof.root) {
        const missing = args.functions.filter(f => !fs.existsSync(path.join(prof.root, "Libraries", String(f.library), `${f.function}.cs`)));
        if (missing.length) throw new Error(`No local file for: ${missing.map(f => `${f.library}.${f.function}`).join(", ")} — pull them first.`);
    }

    const { profile, ...opArgs } = args;
    // switch_profile's target travels as args.profile inside the request.
    if (t.name === "switch_profile") { opArgs.profile = opArgs.target; delete opArgs.target; }

    fs.mkdirSync(bridge.requestDir, { recursive: true });
    const id = crypto.randomUUID();
    const reqFile = path.join(bridge.requestDir, `${id}.json`);
    const ackFile = path.join(bridge.requestDir, `${id}.ack.json`);
    const resFile = path.join(bridge.requestDir, `${id}.result.json`);
    const tmp = `${reqFile}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify({ id, profile: profileName, op: t.name, args: opArgs, createdAt: new Date().toISOString() }, null, 2));
    fs.renameSync(tmp, reqFile);

    let acked = pidAlive(bridge.pid) && await waitForFile(ackFile, ACK_WAIT_RUNNING_MS);
    if (!acked) {
        const scheme = bridge.uriScheme || process.env.EFX_URI_SCHEME || "vscode";
        await openUri(`${scheme}://${bridge.extensionId || "micah-bragg.epicor-efx-manager"}/request?id=${id}`);
        acked = await waitForFile(ackFile, ACK_WAIT_LAUNCH_MS);
    }
    if (!acked) {
        rmQuiet(reqFile);
        throw new Error("VS Code didn't pick up the request. Is VS Code running with EFx Manager and this profile active? On first use VS Code may be showing an \"Allow extension to open this URI?\" prompt.");
    }

    const timeout = typeof t.timeout === "function" ? t.timeout(args) : t.timeout;
    const done = await waitForFile(resFile, timeout, progress);
    if (!done) throw new Error(`VS Code accepted the request but no result after ${Math.round(timeout / 1000)}s — it may still be running (or waiting on a prompt). Check VS Code before retrying.`);
    const result = readJsonRetry(resFile) || (await sleep(300), readJsonRetry(resFile));
    rmQuiet(resFile);
    rmQuiet(ackFile);
    if (!result) throw new Error("Result file was unreadable.");
    return result;
}

// push_functions: 60s + 30s per function
BY_NAME.get("push_functions").timeout = a => 60000 + 30000 * ((a.functions || []).length || 1);
BY_NAME.get("push_directives").timeout = a => 60000 + 30000 * ((a.files || []).length || 1);

// ─── server ──────────────────────────────────────────────────────────────────

const server = new Server({ name: "efx-manager", version: require("./package.json").version }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [LIST_PROFILES, ...TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }))],
}));

server.setRequestHandler(CallToolRequestSchema, async (req, extra) => {
    const name = req.params.name;
    const args = req.params.arguments || {};
    const text = obj => ({ content: [{ type: "text", text: typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) }] });
    try {
        if (name === "list_profiles") {
            const b = readBridge();
            return text({
                activeProfile: b.activeProfile, activeCompany: b.activeCompany,
                profiles: (b.profiles || []).map(p => ({ name: p.name, serverUrl: p.serverUrl, companies: p.companies, claudeAccess: p.claudeAccess, active: p.name === b.activeProfile })),
                vscodeRunning: pidAlive(b.pid),
            });
        }
        const t = BY_NAME.get(name);
        if (!t) return { ...text(`Unknown tool ${name}`), isError: true };
        if (typeof args.profile !== "string" || !args.profile) return { ...text('"profile" is required (see list_profiles)'), isError: true };
        const token = req.params._meta && req.params._meta.progressToken;
        let n = 0;
        const progress = token !== undefined && extra && extra.sendNotification
            ? () => extra.sendNotification({ method: "notifications/progress", params: { progressToken: token, progress: ++n, message: "waiting for VS Code" } }).catch(() => {})
            : null;
        const result = await callExtension(t, args, progress);
        return { ...text(result), isError: !result.ok };
    } catch (e) {
        return { ...text(e.message || String(e)), isError: true };
    }
});

if (require.main === module) {
    server.connect(new StdioServerTransport()).catch(e => {
        console.error("efx-mcp failed to start:", e);
        process.exit(1);
    });
}

module.exports = { TOOLS, callExtension, readBridge };
