"use strict";
// Operations the Claude bridge can run. Each op: { level, needsClient?, run(args, ctx) }.
// level: "read" | "write" | "risky" (see claudeBridge LEVELS). Ops never prompt,
// except the profile-secret ops, which ask YOU for the password in VS Code so
// it never passes through Claude.

const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { EpicorClient } = require("./epicorClient");
const bpmClient_1 = require("./bpmClient");
const efxBody_1 = require("./efxBody");
const { directiveToCanonicalText } = require("./widgetXaml");
const { compareFunctionsData, compareBpmData } = require("./comparePanel");
const { getCorpus, search } = require("./searchQuickPick");

const MAX_LIST = 500;
const PROFILE_NAME_RE = /^[A-Za-z0-9_\-. ]+$/;
const ID_TOKEN_RE = /^[^\s"\\]+$/;

function str(args, key, { optional = false } = {}) {
    const v = args[key];
    if (v === undefined || v === null || v === "") {
        if (optional) return undefined;
        throw new Error(`Missing argument "${key}"`);
    }
    if (typeof v !== "string") throw new Error(`Argument "${key}" must be a string`);
    return v.trim();
}
function idArg(args, key) {
    const v = str(args, key);
    if (!ID_TOKEN_RE.test(v)) throw new Error(`"${key}" cannot contain spaces, quotes or backslashes`);
    return v;
}
function stamp() {
    return new Date().toISOString().replace(/[:.]/g, "-");
}
function pickRow(row, drop = ["Thumbnail", "SysRevID", "SysRowID", "BitFlag", "RowMod"]) {
    const out = {};
    for (const [k, v] of Object.entries(row || {})) if (!drop.includes(k)) out[k] = v;
    return out;
}

function buildOps(api) {
    const client = () => api.getClient();
    const bpm = () => api.getBpmClient();

    function profileRoot() {
        const root = api.profileRootNoPrompt(api.getActiveProfileName());
        if (!root) throw new Error("EFx storage location is not set in VS Code (EFx: Change Storage Location).");
        return root;
    }
    const efxDir = () => path.join(profileRoot(), "Libraries");

    // One backup folder per request.
    const backupDirs = new Map();
    function backupPath(ctx, ...parts) {
        if (!backupDirs.has(ctx.id)) backupDirs.set(ctx.id, path.join(profileRoot(), "_backup", stamp()));
        const p = path.join(backupDirs.get(ctx.id), ...parts);
        fs.mkdirSync(path.dirname(p), { recursive: true });
        return p;
    }

    function openDoc(filePath) {
        const n = api.normalizeFsPath(filePath);
        return vscode.workspace.textDocuments.find(d => d.uri && api.normalizeFsPath(d.uri.fsPath) === n);
    }
    // True when the file is open with unsaved edits whose code differs from disk.
    // (Whitespace/header-only differences don't count.)
    function dirtyConflict(filePath) {
        const doc = openDoc(filePath);
        if (!doc || !doc.isDirty) return false;
        let disk = "";
        try { disk = fs.readFileSync(filePath, "utf-8"); } catch { return true; }
        const code = t => efxBody_1.normalizeCode(api.stripGeneratedHeaderInfo(t).content);
        return code(doc.getText()) !== code(disk);
    }
    const DIRTY_MSG = "Open in VS Code with unsaved changes that differ from the file on disk — save or revert it first (pushing would overwrite one of the two).";

    async function libraryState(libraryId) {
        const ts = await client().getLibrary(libraryId);
        const row = ts && ts.EfxLibrary && ts.EfxLibrary[0];
        if (!row) throw new Error(`Library ${libraryId} not found on server`);
        return { ts, row };
    }
    // Promoted libraries come back Published + Frozen; Frozen without
    // Published means locked in Epicor.
    function needsDemoteError(libs, ctx) {
        const e = new Error(`${libs.join(", ")} ${libs.length > 1 ? "are" : "is"} promoted to production. `
            + (ctx.level === "risky"
                ? "Ask the user whether to demote for this change. If yes, call again with allowDemote: true — it's demoted, changed, and re-promoted right after (callers of the library fail for those few seconds)."
                : `Changing it means demoting, which needs Claude access "risky" on profile "${ctx.profile.name}" (it is "${ctx.level}").`));
        e.needsDemote = libs;
        return e;
    }

    // Runs fn(ts) with the library editable. A promoted library is demoted first
    // (only with allowDemote and "risky") and always re-promoted afterwards,
    // whether fn succeeded or not. Returns { value, demoted, repromoted, repromoteError }.
    async function withEditableLibrary(libraryId, ctx, allowDemote, fn) {
        const { ts, row } = await libraryState(libraryId);
        if (!row.Published) {
            if (row.Frozen) throw new Error(`${libraryId} is locked/frozen in Epicor (not promoted). Unfreeze it first.`);
            return { value: await fn(ts), demoted: false };
        }
        if (!allowDemote || ctx.level !== "risky") throw needsDemoteError([libraryId], ctx);
        await client().demoteFromProduction(libraryId);
        const info = { demoted: true, repromoted: false };
        let err = null;
        try {
            const fresh = await libraryState(libraryId);
            info.value = await fn(fresh.ts);
        } catch (e) {
            err = e;
        }
        try {
            await client().promoteToProduction(libraryId);
            info.repromoted = true;
        } catch (e) {
            info.repromoteError = `FAILED to re-promote ${libraryId}: ${e.message} — it is still demoted, promote it manually.`;
        }
        api.treeProvider().invalidateCache(libraryId);
        if (err) {
            err.message += info.repromoted ? ` (${libraryId} was re-promoted)` : ` (${info.repromoteError})`;
            throw err;
        }
        return info;
    }
    // Folds demote/re-promote info into an op result.
    function withDemoteInfo(result, info, libraryId) {
        if (!info.demoted) return result;
        return {
            ...result,
            ok: (result.ok !== false) && info.repromoted,
            demoted: [libraryId],
            repromoted: info.repromoted ? [libraryId] : [],
            ...(info.repromoteError ? { warning: info.repromoteError } : {}),
            summary: `${result.summary} (demoted + ${info.repromoted ? "re-promoted" : "NOT re-promoted"} ${libraryId})`,
        };
    }

    function signaturesOf(ts, functionId) {
        const sigs = (ts.EfxFunctionSignature || []).filter(s => s.FunctionID === functionId)
            .sort((a, b) => (a.Order || 0) - (b.Order || 0))
            .map(s => ({ name: s.ArgumentName, type: s.DataType, optional: !!s.Optional, default: s.DefaultValue || "", direction: s.Response ? "out" : "in" }));
        return { inputs: sigs.filter(s => s.direction === "in"), outputs: sigs.filter(s => s.direction === "out") };
    }
    function functionCode(fnRow) {
        const desc = efxBody_1.describeBody(fnRow.Body);
        if (desc.unparsedFlow) return { kind: "unreadable widget body" };
        if (desc.kind === "flow") {
            if (desc.flow.onlyCustomCode) return { kind: "widget flow (single custom-code widget)", code: desc.flow.codeNodes[0].code, usings: desc.usings };
            return { kind: efxBody_1.bodyKindLabel(desc), flow: directiveToCanonicalText(desc.xaml) || desc.xaml };
        }
        return { kind: "code", code: desc.code, usings: desc.usings };
    }

    function toDiag(d, headerOffset) {
        if (typeof d === "object" && d !== null) {
            return {
                line: d.Line != null ? d.Line + headerOffset : null,
                column: d.Column ?? null,
                severity: d.Severity ?? 2,
                message: [d.Code, d.Message].filter(Boolean).join(": ") || String(d),
            };
        }
        return { line: null, column: null, severity: 2, message: String(d) };
    }
    function setEditorDiagnostics(filePath, diags) {
        api.efxDiagnostics.set(vscode.Uri.file(filePath), diags.map(d => {
            const line = Math.max(0, (d.line ?? 1) - 1);
            const col = Math.max(0, (d.column ?? 1) - 1);
            return new vscode.Diagnostic(new vscode.Range(line, col, line, col + 1), d.message,
                d.severity === 1 ? vscode.DiagnosticSeverity.Warning : vscode.DiagnosticSeverity.Error);
        }));
    }

    function bpmDirectiveInfo(d, source) {
        return {
            directiveId: d.DirectiveID,
            source,
            method: d.BpMethodCode,
            type: bpmClient_1.directiveTypeLabel(source, d.DirectiveType),
            name: d.Name,
            enabled: !!d.IsEnabled,
            group: d.DirectiveGroup || "",
            order: d.Order,
            hasCode: bpmClient_1.extractBpmCode(d.Body).hasCustomCode,
        };
    }
    function bpmSourceArg(args) {
        const s = String(args.source || "BO").toUpperCase();
        if (!bpmClient_1.BPM_SOURCES.includes(s)) throw new Error(`source must be one of ${bpmClient_1.BPM_SOURCES.join(", ")}`);
        return s;
    }
    function resolveInRoot(rel, allowedTop) {
        const root = profileRoot();
        const abs = path.resolve(root, rel);
        const okTop = allowedTop.some(t => abs.startsWith(path.join(root, t) + path.sep));
        if (!okTop) throw new Error(`Path must be inside ${allowedTop.join(" or ")} under the profile folder`);
        return abs;
    }

    async function makeProfileClient(profileName, company) {
        const profile = api.getProfiles().find(p => p.name === profileName);
        if (!profile) throw new Error(`Profile "${profileName}" not found`);
        const password = await api.context.secrets.get(api.profileSecretKey(profileName, "password"));
        if (!password) throw new Error(`No password stored for profile "${profileName}"`);
        const apiKey = (await api.context.secrets.get(api.profileSecretKey(profileName, "apiKey"))) || "";
        const co = company || (profile.companies || [])[0];
        if (!(profile.companies || []).includes(co)) throw new Error(`Company "${co}" is not in profile "${profileName}"`);
        return new EpicorClient({ serverUrl: profile.serverUrl, company: co, username: profile.username, password, apiKey });
    }

    async function askSecret(prompt) {
        return vscode.window.showInputBox({ prompt, password: true, ignoreFocusOut: true });
    }

    const ops = {};

    // ───────────────────────────── read ─────────────────────────────

    ops.status = {
        level: "read", needsClient: false,
        async run(_args, ctx) {
            const p = ctx.profile;
            return {
                activeProfile: p.name,
                activeCompany: api.getActiveCompany(),
                companies: p.companies || [],
                serverUrl: p.serverUrl,
                connected: !!client(),
                claudeAccess: ctx.level,
                profileFolder: api.profileRootNoPrompt(p.name),
            };
        },
    };

    ops.list_libraries = {
        level: "read",
        async run() {
            const libs = await client().getLibraryList();
            return { count: libs.length, libraries: libs.map(l => pickRow(l)) };
        },
    };

    ops.get_library = {
        level: "read",
        async run(args) {
            const libraryId = idArg(args, "library");
            const { ts, row } = await libraryState(libraryId);
            const functions = (ts.EfxFunction || []).map(f => {
                const out = {
                    function: f.FunctionID,
                    description: f.Description || "",
                    implementation: efxBody_1.bodyKindLabel(efxBody_1.describeBody(f.Body)),
                    private: !!f.Private, disabled: !!f.Disabled, invalid: !!f.Invalid,
                    requireTransaction: !!f.RequireTransaction, singleRowMode: !!f.SingleRowMode,
                    ...signaturesOf(ts, f.FunctionID),
                };
                if (args.includeCode) Object.assign(out, functionCode(f));
                return out;
            });
            return {
                library: pickRow(row),
                functions,
                references: {
                    tables: (ts.EfxRefTable || []).map(t => ({ table: t.TableID, updatable: !!t.Updatable })),
                    services: (ts.EfxRefService || []).map(s => s.ServiceID),
                    assemblies: (ts.EfxRefAssembly || []).map(a => a.Assembly),
                    libraries: (ts.EfxRefLibrary || []).map(l => ({ library: l.LibraryRef, mode: l.Mode })),
                },
            };
        },
    };

    ops.get_function = {
        level: "read",
        async run(args) {
            const libraryId = idArg(args, "library");
            const functionId = idArg(args, "function");
            const { ts } = await libraryState(libraryId);
            const f = (ts.EfxFunction || []).find(x => x.FunctionID === functionId);
            if (!f) throw new Error(`Function ${functionId} not found in ${libraryId}`);
            return {
                library: libraryId, function: functionId, description: f.Description || "",
                ...signaturesOf(ts, functionId), ...functionCode(f),
                localFile: path.join(efxDir(), libraryId, `${functionId}.cs`),
            };
        },
    };

    ops.search_functions = {
        level: "read",
        async run(args) {
            const query = str(args, "query");
            const corpus = await getCorpus(client(), !!args.refresh);
            const res = search(corpus, query, { regex: !!args.regex, caseSensitive: !!args.caseSensitive, word: !!args.word }, args.library || null);
            return {
                total: res.total,
                shown: res.hits.length,
                indexedAt: new Date(corpus.loadedAt).toISOString(),
                hits: res.hits.map(h => ({
                    library: h.fn.libraryId, function: h.fn.functionId, kind: h.kind, line: h.line,
                    text: h.line > 0 ? String(h.fn.lines[h.line - 1]).trim().slice(0, 240) : h.fn.functionId,
                })),
            };
        },
    };

    ops.pull = {
        level: "read",
        async run(args) {
            const dir = efxDir();
            const policy = args.overwrite ? "overwrite" : "keep";
            let files, skipped, what;
            if (args.all) {
                const all = await api.collectAllLibraryFiles();
                ({ files, skipped } = all);
                what = `all ${all.libCount} libraries`;
            } else {
                const libraryId = idArg(args, "library");
                api.treeProvider().invalidateCache(libraryId);
                const ts = await client().getLibrary(libraryId);
                if (!ts || !ts.EfxLibrary || !ts.EfxLibrary[0]) throw new Error(`Library ${libraryId} not found on server`);
                api.pulledTablesets.set(libraryId, ts);
                const built = api.buildLibraryFiles(libraryId, ts, new Date().toISOString());
                files = built.files; skipped = built.skipped;
                if (Array.isArray(args.functions) && args.functions.length) {
                    const want = new Set(args.functions);
                    const found = new Set(files.map(f => f.functionId));
                    files = files.filter(f => want.has(f.functionId));
                    for (const fn of want) if (!found.has(fn)) skipped.push(`${libraryId}.${fn} (not found on server)`);
                }
                what = libraryId;
            }
            const res = await api.writePulledFiles(dir, files, skipped, policy);
            return {
                folder: dir,
                written: res.written.map(f => ({ library: f.libraryId, function: f.functionId, file: path.join(dir, f.libraryId, f.file), pushable: f.pushable })),
                skipped: res.skipped,
                summary: `pulled ${res.written.length} function(s) from ${what}${res.skipped.length ? `, skipped ${res.skipped.length}` : ""}`,
            };
        },
    };

    ops.list_bpm = {
        level: "read",
        async run(args) {
            const source = bpmSourceArg(args);
            const filter = String(args.filter || "").toLowerCase();
            const b = bpm();
            let directives = [];
            if (source === "BO") {
                const services = await b.getBpmServices();
                const key = s => `${s.SystemCode}.${s.ServiceKind}.${s.ServiceName}`;
                let picked;
                if (args.service) {
                    picked = services.filter(s => key(s).toLowerCase() === String(args.service).toLowerCase());
                    if (!picked.length) throw new Error(`Service "${args.service}" has no method directives (format: Erp.BO.SalesOrder)`);
                } else if (filter) {
                    picked = services.filter(s => key(s).toLowerCase().includes(filter)).slice(0, 10);
                } else {
                    return { source, services: services.map(key).sort(), note: "Pass service (e.g. Erp.BO.SalesOrder) or filter to list directives." };
                }
                for (const s of picked) {
                    const data = await b.getBpmMethodsByService(s.SystemCode, s.ServiceKind, s.ServiceName, "BO");
                    directives.push(...data.directives);
                }
                if (!args.service && filter) {
                    // services were matched by filter — keep all their directives
                } else if (filter) {
                    directives = directives.filter(d => `${d.BpMethodCode} ${d.Name}`.toLowerCase().includes(filter));
                }
            } else {
                const rows = await b.getBpmRowsBySource(source);
                directives = rows.directives.filter(d => !filter || `${d.BpMethodCode} ${d.Name}`.toLowerCase().includes(filter));
            }
            const out = directives.map(d => bpmDirectiveInfo(d, source))
                .sort((x, y) => x.method.localeCompare(y.method) || String(x.type).localeCompare(String(y.type)) || (x.order || 0) - (y.order || 0));
            return { source, total: out.length, directives: out.slice(0, MAX_LIST), truncated: out.length > MAX_LIST };
        },
    };

    ops.pull_directive = {
        level: "read",
        async run(args) {
            const source = bpmSourceArg(args);
            const method = str(args, "method");
            const directiveId = str(args, "directiveId");
            const ts = await bpm().getBpmMethod(source, method);
            const d = (ts && ts.BpDirective || []).find(x => x.DirectiveID === directiveId);
            if (!d) throw new Error(`Directive ${directiveId} not found on ${source} ${method}`);
            d.Source = source;
            const { code, hasCustomCode } = bpmClient_1.extractBpmCode(d.Body);
            if (!hasCustomCode) throw new Error(`"${d.Name}" has no custom C# code — it uses widget actions only`);
            const root = profileRoot();
            const label = bpmClient_1.directiveTypeLabel(source, d.DirectiveType);
            const target = path.join(root, "BPM", api.bpmMethodDirName(method), `${label}_${d.Name.replace(/[^a-zA-Z0-9_\-. ]/g, "_")}.cs`);
            if (dirtyConflict(target)) throw new Error(DIRTY_MSG);
            if (fs.existsSync(target) && !args.overwrite) {
                const local = efxBody_1.normalizeCode(api.stripGeneratedHeaderInfo(fs.readFileSync(target, "utf-8")).content);
                if (local !== efxBody_1.normalizeCode(code)) {
                    return { ok: false, file: target, summary: "local file differs from Epicor (unpushed edits?) — pass overwrite: true to replace it" };
                }
            }
            const { filePath } = await api.writeDirectiveFile(d, code, root);
            return { file: filePath, relative: path.relative(root, filePath), directive: bpmDirectiveInfo(d, source), summary: `pulled ${label} "${d.Name}"` };
        },
    };

    ops.compare = {
        level: "read",
        async run(args, ctx) {
            const profileA = str(args, "profileA");
            const profileB = str(args, "profileB");
            for (const name of [profileA, profileB]) {
                const p = api.getProfiles().find(x => x.name === name);
                if (!p) throw new Error(`Profile "${name}" not found`);
                if (!ctx.atLeast(ctx.levelOf(p), "read") || ctx.levelOf(p) === "off") {
                    throw new Error(`Claude access for profile "${name}" is off — compare needs at least read on both profiles.`);
                }
            }
            const [cA, cB] = await Promise.all([makeProfileClient(profileA, args.companyA), makeProfileClient(profileB, args.companyB)]);
            const kind = args.kind || "functions";
            if (kind === "bpm") {
                const { bpmData } = await compareBpmData(cA, cB, profileA, profileB);
                const diffs = [];
                for (const s of bpmData.services) for (const m of s.methods) for (const d of m.dirs) {
                    if (d.status === "match") continue;
                    const e = d.a || d.b;
                    diffs.push({
                        source: s.source, service: `${s.systemCode}.${s.businessObject}`, method: m.methodCode,
                        name: e.Name, type: d.typeLabel, status: d.status,
                        changed: d.fields ? Object.keys(d.fields).filter(k => d.fields[k] && d.fields[k].same === false) : [],
                    });
                }
                return { kind, counts: bpmData.counts, total: bpmData.total, warnings: bpmData.warnings || [], differences: diffs.slice(0, MAX_LIST), truncated: diffs.length > MAX_LIST };
            }
            const data = await compareFunctionsData(cA, cB, profileA, profileB);
            const libs = data.libraries
                .filter(l => l.status !== "match" && (!args.library || l.libID === args.library))
                .map(l => ({
                    library: l.libID, status: l.status,
                    libraryChanges: Object.keys(l.libDiff || {}).filter(k => k !== "hasDiff" && l.libDiff[k] && l.libDiff[k].same === false && !l.libDiff[k].infoOnly),
                    functions: l.fnDiffs.filter(f => f.status !== "match").map(f => {
                        const out = { function: f.fnID, status: f.status, changed: f.fields ? Object.keys(f.fields).filter(k => k !== "hasDiff" && f.fields[k].same === false) : [] };
                        if (args.library && args.includeCode) {
                            out.codeA = f.fa ? f.fa._code : null;
                            out.codeB = f.fb ? f.fb._code : null;
                        }
                        return out;
                    }),
                }));
            return { kind: "functions", profileA, profileB, counts: data.meta.counts, total: data.meta.total, differences: libs };
        },
    };

    // ───────────────────────────── write ─────────────────────────────

    ops.push_functions = {
        level: "write",
        async run(args, ctx) {
            const list = Array.isArray(args.functions) ? args.functions : [];
            if (!list.length) throw new Error('"functions" must be a non-empty array of { library, function }');
            const results = [];
            const notes = [];
            const byLib = new Map();
            for (const it of list) {
                const lib = String(it.library || ""), fn = String(it.function || "");
                if (!ID_TOKEN_RE.test(lib) || !ID_TOKEN_RE.test(fn)) {
                    results.push({ ok: false, libraryId: lib, functionId: fn, message: "Invalid library/function name", errors: ["Invalid library/function name"], diagnostics: [] });
                    continue;
                }
                if (!byLib.has(lib)) byLib.set(lib, []);
                if (!byLib.get(lib).includes(fn)) byLib.get(lib).push(fn);
            }
            const fail = (libraryId, functionId, message, extra = {}) =>
                results.push({ ok: false, libraryId, functionId, message, errors: [message], diagnostics: [], ...extra });
            const node = (libraryId, functionId) => ({ libraryId, func: { FunctionID: functionId } });

            // Ask once, up front, for every promoted library in the request.
            const promoted = [];
            for (const libraryId of byLib.keys()) {
                try { const st = await libraryState(libraryId); if (st.row.Published) promoted.push(libraryId); } catch { /* reported below */ }
            }
            if (promoted.length && (!args.allowDemote || ctx.level !== "risky")) throw needsDemoteError(promoted, ctx);

            const demoted = [], repromoted = [];
            const pushLibrary = async (libraryId, fns, ts) => {
                const codeItems = [], flowItems = [];
                for (const functionId of fns) {
                    const filePath = path.join(efxDir(), libraryId, `${functionId}.cs`);
                    if (!fs.existsSync(filePath)) { fail(libraryId, functionId, `Local file not found: ${filePath} — pull it first`); continue; }
                    if (dirtyConflict(filePath)) { fail(libraryId, functionId, DIRTY_MSG); continue; }
                    const fnRow = (ts.EfxFunction || []).find(f => f.FunctionID === functionId);
                    if (!fnRow) { fail(libraryId, functionId, `Function ${functionId} not found on server`); continue; }
                    const desc = efxBody_1.describeBody(fnRow.Body);
                    if (desc.unparsedFlow) { fail(libraryId, functionId, "Widget body this extension can't read — refusing to overwrite it"); continue; }
                    // Back up the server version before touching it.
                    if (desc.kind === "flow") fs.writeFileSync(backupPath(ctx, libraryId, `${functionId}.body`), String(fnRow.Body || ""), "utf-8");
                    else fs.writeFileSync(backupPath(ctx, libraryId, `${functionId}.cs`), EpicorClient.extractCode(fnRow.Body).code || "", "utf-8");
                    (desc.kind === "flow" ? flowItems : codeItems).push({ functionId, filePath, fnRow });
                }

                const pushOne = async it => results.push(await api.pushFunctionCommand(node(libraryId, it.functionId)));

                if (codeItems.length === 1) {
                    await pushOne(codeItems[0]);
                } else if (codeItems.length > 1) {
                    const items = codeItems.map(it => {
                        const stripped = api.stripGeneratedHeaderInfo(fs.readFileSync(it.filePath, "utf-8"));
                        return { ...it, code: stripped.content, headerOffset: stripped.lineOffset, usings: EpicorClient.extractCode(it.fnRow.Body).usings };
                    });
                    let res;
                    try {
                        res = await client().applyFunctionsViaWrapper(libraryId, items.map(i => ({ functionId: i.functionId, code: i.code, usings: i.usings })), ts);
                    } catch (e) {
                        for (const it of items) fail(libraryId, it.functionId, `Batch save failed: ${e.message}`);
                        return;
                    }
                    if (res.oldWrapper) {
                        notes.push(`${libraryId}: server has the old single-function Utilities wrapper — pushed one at a time.`);
                        for (const it of items) await pushOne(it);
                    } else if (res.saved) {
                        const verify = await client().getLibrary(libraryId);
                        for (const it of items) {
                            const row = (verify.EfxFunction || []).find(f => f.FunctionID === it.functionId);
                            const serverCode = row ? EpicorClient.extractCode(row.Body).code : null;
                            if (serverCode === null || efxBody_1.normalizeCode(serverCode) !== efxBody_1.normalizeCode(it.code)) {
                                fail(libraryId, it.functionId, "Verification failed: wrapper reported success but server code does not match the file");
                            } else {
                                api.efxDiagnostics.set(vscode.Uri.file(it.filePath), []);
                                const cached = api.pulledTablesets.get(libraryId);
                                const cf = cached && (cached.EfxFunction || []).find(f => f.FunctionID === it.functionId);
                                if (cf && row) cf.Body = row.Body;
                                results.push({ ok: true, libraryId, functionId: it.functionId, message: `Verified save of ${libraryId}.${it.functionId} (batch of ${items.length})`, errors: [], diagnostics: [] });
                            }
                        }
                        api.treeProvider().invalidateCache(libraryId);
                        api.clearSearchCache();
                    } else {
                        for (const it of items) {
                            const p = res.perFunction[it.functionId] || { errors: [], diagnostics: [] };
                            const diagnostics = (p.diagnostics || []).map(d => toDiag(d, it.headerOffset));
                            if (diagnostics.length) setEditorDiagnostics(it.filePath, diagnostics);
                            results.push({
                                ok: false, libraryId, functionId: it.functionId,
                                message: (p.errors && p.errors.length)
                                    ? `Compile failed — nothing in this batch of ${items.length} was saved`
                                    : `Batch of ${items.length} failed because another function in it has errors — nothing was saved`,
                                errors: p.errors || [], diagnostics,
                            });
                        }
                    }
                }
                // Widget flows: one at a time, after the batch.
                for (const it of flowItems) await pushOne(it);
            };
            for (const [libraryId, fns] of byLib) {
                try {
                    const info = await withEditableLibrary(libraryId, ctx, !!args.allowDemote, ts => pushLibrary(libraryId, fns, ts));
                    if (info.demoted) demoted.push(libraryId);
                    if (info.repromoted) repromoted.push(libraryId);
                    if (info.repromoteError) notes.push(info.repromoteError);
                } catch (e) {
                    for (const fn of fns) if (!results.some(r => r.libraryId === libraryId && r.functionId === fn)) fail(libraryId, fn, e.message);
                }
            }
            const okCount = results.filter(r => r.ok).length;
            const notRepromoted = demoted.filter(l => !repromoted.includes(l));
            return {
                ok: okCount === results.length && notRepromoted.length === 0,
                results,
                demoted,
                repromoted,
                notes,
                backupFolder: backupDirs.get(ctx.id) || null,
                summary: `pushed ${okCount} of ${results.length} function(s)${okCount < results.length ? ` (${results.length - okCount} failed)` : ""}`
                    + (demoted.length ? `; demoted + ${notRepromoted.length ? `re-promoted ${repromoted.join(", ") || "none"}, NOT re-promoted ${notRepromoted.join(", ")}` : `re-promoted ${demoted.join(", ")}`}` : ""),
            };
        },
    };

    ops.push_directives = {
        level: "write",
        async run(args, ctx) {
            const files = Array.isArray(args.files) ? args.files : [];
            if (!files.length) throw new Error('"files" must be a non-empty array of paths relative to the profile folder (as returned by pull_directive)');
            const results = [];
            for (const rel of files) {
                const r = { file: rel, ok: false };
                try {
                    const abs = resolveInRoot(String(rel), ["BPM", path.join("Widgets", "BPM")]);
                    if (!fs.existsSync(abs)) throw new Error("File not found — pull the directive first");
                    if (dirtyConflict(abs)) throw new Error(DIRTY_MSG);
                    const mapping = await api.resolveMapping(abs);
                    if (!mapping || !mapping.isBpm) throw new Error("Not a pulled BPM directive file");
                    const source = mapping.source || "BO";
                    const ts = await bpm().getBpmMethod(source, mapping.bpmMethodCode);
                    const row = (ts && ts.BpDirective || []).find(d => d.DirectiveID === mapping.directiveId);
                    if (!row) throw new Error(`Directive ${mapping.directiveId} not found on ${mapping.bpmMethodCode}`);
                    fs.writeFileSync(backupPath(ctx, "BPM", api.bpmMethodDirName(mapping.bpmMethodCode), `${mapping.directiveId}.body.xml`), String(row.Body || ""), "utf-8");
                    if (mapping.isWidgetCode) {
                        const w = await api.pushWidgetCodeFile(abs, mapping);
                        if (!w || !w.ok) throw new Error((w && w.message) || "Widget push failed");
                    } else {
                        await api.corePushDirective(abs, mapping);
                    }
                    if (source === "BO") {
                        const parts = mapping.bpmMethodCode.split(".");
                        if (parts.length >= 3) api.bpmTreeProvider().invalidateService(parts[0].toUpperCase(), parts[1], parts[2]);
                    } else {
                        api.bpmTreeProvider().invalidateSource(source);
                    }
                    r.ok = true;
                    r.message = `Pushed ${row.Name} (${source} ${mapping.bpmMethodCode})`;
                } catch (e) {
                    r.message = e.message;
                }
                results.push(r);
            }
            const okCount = results.filter(r => r.ok).length;
            return { ok: okCount === results.length, results, backupFolder: backupDirs.get(ctx.id) || null, summary: `pushed ${okCount} of ${results.length} directive(s)` };
        },
    };

    ops.new_function = {
        level: "write",
        async run(args, ctx) {
            const libraryId = idArg(args, "library");
            const functionId = idArg(args, "function");
            const sigs = sigArgs(args.signatures);
            const info = await withEditableLibrary(libraryId, ctx, !!args.allowDemote, async ts => {
                if ((ts.EfxFunction || []).some(f => f.FunctionID === functionId)) throw new Error(`${libraryId}.${functionId} already exists`);
                return api.coreCreateFunction(libraryId, functionId, args.description || "", sigs);
            });
            const created = info.value;
            return withDemoteInfo({
                ok: created.signaturesSaved,
                diagnostics: created.diagnostics,
                signaturesSaved: created.signaturesSaved,
                signatureError: created.signatureError,
                summary: `created ${libraryId}.${functionId}${created.signaturesSaved ? "" : " (signatures failed)"}`,
            }, info, libraryId);
        },
    };

    function sigArgs(list) {
        if (list === undefined) return [];
        if (!Array.isArray(list)) throw new Error('"signatures" must be an array');
        let inOrder = 0, outOrder = 0;
        return list.map(s => {
            if (!s || !s.name || !s.type) throw new Error("Each signature needs name and type");
            const response = s.direction === "out";
            return {
                ArgumentName: String(s.name), DataType: String(s.type), Response: response,
                Order: response ? outOrder++ : inOrder++,
                ...(s.optional !== undefined ? { Optional: !!s.optional } : {}),
                ...(s.default !== undefined ? { DefaultValue: String(s.default) } : {}),
            };
        });
    }

    ops.delete_function = {
        level: "write",
        async run(args, ctx) {
            const libraryId = idArg(args, "library");
            const functionId = idArg(args, "function");
            const info = await withEditableLibrary(libraryId, ctx, !!args.allowDemote, async ts => {
                const f = (ts.EfxFunction || []).find(x => x.FunctionID === functionId);
                if (!f) throw new Error(`${libraryId}.${functionId} not found`);
                fs.writeFileSync(backupPath(ctx, libraryId, `${functionId}.body`), String(f.Body || ""), "utf-8");
                fs.writeFileSync(backupPath(ctx, libraryId, `${functionId}.signatures.json`), JSON.stringify(signaturesOf(ts, functionId), null, 2), "utf-8");
                await api.coreDeleteFunction(libraryId, functionId);
            });
            return withDemoteInfo({ backupFolder: backupDirs.get(ctx.id), summary: `deleted ${libraryId}.${functionId}` }, info, libraryId);
        },
    };

    ops.new_library = {
        level: "write",
        async run(args) {
            const libraryId = idArg(args, "library");
            const libs = await client().getLibraryList();
            if (libs.some(l => l.LibraryID === libraryId)) throw new Error(`Library ${libraryId} already exists`);
            const diagnostics = await api.coreCreateLibrary(libraryId, args.description || "");
            return { diagnostics, summary: `created library ${libraryId}` };
        },
    };

    ops.add_reference = {
        level: "write",
        async run(args, ctx) {
            const libraryId = idArg(args, "library");
            const kind = str(args, "kind");
            const value = idArg(args, "value");
            const info = await withEditableLibrary(libraryId, ctx, !!args.allowDemote,
                () => api.coreAddReference(libraryId, kind, value, { updatable: !!args.updatable, mode: args.mode }));
            return withDemoteInfo({ diagnostics: info.value, summary: `added ${kind} reference ${value} to ${libraryId}` }, info, libraryId);
        },
    };

    ops.set_table_updatable = {
        level: "write",
        async run(args, ctx) {
            const libraryId = idArg(args, "library");
            const tableId = idArg(args, "table");
            if (typeof args.updatable !== "boolean") throw new Error('"updatable" must be true or false');
            const info = await withEditableLibrary(libraryId, ctx, !!args.allowDemote,
                () => api.coreSetTableUpdatable(libraryId, tableId, args.updatable));
            return withDemoteInfo({ summary: `${tableId} in ${libraryId} set to ${args.updatable ? "updatable" : "read-only"}` }, info, libraryId);
        },
    };

    ops.save_signatures = {
        level: "write",
        async run(args, ctx) {
            const libraryId = idArg(args, "library");
            const functionId = idArg(args, "function");
            const sigs = sigArgs(args.signatures || []);
            const info = await withEditableLibrary(libraryId, ctx, !!args.allowDemote, async ts => {
                if (!(ts.EfxFunction || []).some(f => f.FunctionID === functionId)) throw new Error(`${libraryId}.${functionId} not found`);
                fs.writeFileSync(backupPath(ctx, libraryId, `${functionId}.signatures.json`), JSON.stringify(signaturesOf(ts, functionId), null, 2), "utf-8");
                await client().saveSignatures(libraryId, functionId, sigs);
            });
            api.treeProvider().invalidateCache(libraryId);
            const after = await client().getLibrary(libraryId);
            return withDemoteInfo({ signatures: signaturesOf(after, functionId), backupFolder: backupDirs.get(ctx.id), summary: `saved signatures for ${libraryId}.${functionId}` }, info, libraryId);
        },
    };

    ops.regenerate_library = {
        level: "write",
        async run(args) {
            const libraryId = idArg(args, "library");
            const res = await client().regenerateLibrary(libraryId);
            const errors = res.errors || [];
            return {
                ok: errors.length === 0,
                errors: errors.length ? api.formatBOUpdErrors(errors).split("\n\n") : [],
                summary: errors.length ? `${libraryId} has ${errors.length} validation error(s)` : `${libraryId} validated with no errors`,
            };
        },
    };

    ops.execute_function = {
        level: "write",
        async run(args, ctx) {
            const libraryId = idArg(args, "library");
            const functionId = idArg(args, "function");
            const company = args.company || api.getActiveCompany();
            if (!(ctx.profile.companies || []).includes(company)) throw new Error(`Company "${company}" is not in profile "${ctx.profile.name}"`);
            const libs = await client().getLibraryList();
            const meta = libs.find(l => l.LibraryID === libraryId);
            if (!meta) throw new Error(`Library ${libraryId} not found`);
            const staging = !meta.Published;
            const response = await client().executeFunction(libraryId, functionId, args.params || {}, company, staging);
            let out = response;
            const text = JSON.stringify(response);
            if (text && text.length > 200000) out = { truncated: true, preview: text.slice(0, 200000) };
            return { company, staging, response: out, summary: `executed ${libraryId}.${functionId} in ${company}` };
        },
    };

    ops.switch_profile = {
        level: "write", needsClient: false,
        async run(args, ctx) {
            const name = str(args, "profile");
            const target = api.getProfiles().find(p => p.name === name);
            if (!target) throw new Error(`Profile "${name}" not found`);
            if (ctx.levelOf(target) === "off") throw new Error(`Claude access for "${name}" is off — enable it in VS Code (EFx: Manage Profiles → Edit) first.`);
            await api.activateProfile(name);
            if (api.getActiveProfileName() !== name || !client()) throw new Error(`Could not activate "${name}" (no stored password?)`);
            if (args.company) await api.applyActiveCompany(String(args.company));
            return { activeProfile: name, activeCompany: api.getActiveCompany(), claudeAccess: ctx.levelOf(target), summary: `switched to ${name} / ${api.getActiveCompany()}` };
        },
    };

    ops.switch_company = {
        level: "write",
        async run(args, ctx) {
            const company = str(args, "company");
            if (!(ctx.profile.companies || []).includes(company)) throw new Error(`Company "${company}" is not in profile "${ctx.profile.name}"`);
            await api.applyActiveCompany(company);
            if (api.getActiveCompany() !== company) throw new Error(`Could not switch to ${company}`);
            return { activeCompany: company, summary: `switched company to ${company}` };
        },
    };

    // Profile management. claudeAccess is never settable from here — new
    // profiles start at "off" and only the VS Code profile editor can raise it.
    function profileFields(args, base) {
        if ("claudeAccess" in args) throw new Error("claudeAccess can only be changed in VS Code (EFx: Manage Profiles → Edit Profile).");
        const p = { ...base };
        if (args.serverUrl !== undefined) {
            if (!/^https?:\/\/\S+$/.test(String(args.serverUrl))) throw new Error("serverUrl must start with http:// or https://");
            p.serverUrl = String(args.serverUrl).replace(/\/+$/, "");
        }
        if (args.username !== undefined) p.username = String(args.username);
        if (args.companies !== undefined) {
            if (!Array.isArray(args.companies) || !args.companies.length) throw new Error("companies must be a non-empty array");
            p.companies = args.companies.map(String);
        }
        if (args.autoPush !== undefined) p.autoPush = !!args.autoPush;
        if (args.autoClean !== undefined) p.autoClean = !!args.autoClean;
        return p;
    }

    ops.create_profile = {
        level: "write", needsClient: false,
        async run(args) {
            const name = str(args, "name");
            if (!PROFILE_NAME_RE.test(name)) throw new Error("Profile name: letters, numbers, space, dash, dot, underscore");
            const profiles = api.getProfiles();
            if (profiles.some(p => p.name === name)) throw new Error(`Profile "${name}" already exists`);
            const draft = profileFields(args, { name, serverUrl: "", username: "", companies: [], autoPush: false, autoClean: false, claudeAccess: "off" });
            if (!draft.serverUrl || !draft.username || !draft.companies.length) throw new Error("serverUrl, username and companies are required");
            const password = await askSecret(`Claude is creating EFx profile "${name}" (${draft.serverUrl}, user ${draft.username}). Enter the Epicor password — it goes to VS Code SecretStorage, never to Claude.`);
            if (!password) return { ok: false, summary: "cancelled — no password entered, profile not created" };
            const apiKey = await askSecret(`API key for "${name}" (leave blank for none)`);
            await api.context.secrets.store(api.profileSecretKey(name, "password"), password);
            await api.context.secrets.store(api.profileSecretKey(name, "apiKey"), apiKey || "");
            profiles.push(draft);
            await api.setProfiles(profiles);
            return { profile: { ...draft }, summary: `created profile ${name} (Claude access off until you enable it in VS Code)` };
        },
    };

    ops.update_profile = {
        level: "write", needsClient: false,
        async run(args) {
            const name = str(args, "name");
            const profiles = api.getProfiles();
            const idx = profiles.findIndex(p => p.name === name);
            if (idx < 0) throw new Error(`Profile "${name}" not found`);
            const next = profileFields(args, profiles[idx]);
            const newName = args.newName !== undefined ? String(args.newName).trim() : name;
            if (newName !== name) {
                if (!PROFILE_NAME_RE.test(newName)) throw new Error("newName: letters, numbers, space, dash, dot, underscore");
                if (profiles.some(p => p.name === newName)) throw new Error(`Profile "${newName}" already exists`);
                for (const kind of ["password", "apiKey"]) {
                    const v = await api.context.secrets.get(api.profileSecretKey(name, kind));
                    if (v) await api.context.secrets.store(api.profileSecretKey(newName, kind), v);
                    await api.context.secrets.delete(api.profileSecretKey(name, kind));
                }
                next.name = newName;
            }
            const wasActive = api.getActiveProfileName() === name;
            profiles[idx] = next;
            await api.setProfiles(profiles);
            if (wasActive) {
                if (newName !== name) await api.setActiveProfileName(newName);
                await api.activateProfile(newName);
            }
            const { claudeAccess, ...shown } = next;
            return { profile: shown, summary: `updated profile ${newName}` };
        },
    };

    ops.delete_profile = {
        level: "write", needsClient: false,
        async run(args) {
            const name = str(args, "name");
            if (api.getActiveProfileName() === name) throw new Error("Can't delete the active profile — switch_profile to another one first.");
            const profiles = api.getProfiles();
            if (!profiles.some(p => p.name === name)) throw new Error(`Profile "${name}" not found`);
            await api.setProfiles(profiles.filter(p => p.name !== name));
            await api.context.secrets.delete(api.profileSecretKey(name, "password"));
            await api.context.secrets.delete(api.profileSecretKey(name, "apiKey"));
            return { summary: `deleted profile ${name}` };
        },
    };

    ops.set_profile_secret = {
        level: "write", needsClient: false,
        async run(args) {
            const name = str(args, "name");
            const kind = args.kind === "apiKey" ? "apiKey" : "password";
            if (!api.getProfiles().some(p => p.name === name)) throw new Error(`Profile "${name}" not found`);
            const value = await askSecret(`Claude asked to set the ${kind === "apiKey" ? "API key" : "password"} for EFx profile "${name}". Type it here — it never goes to Claude.`);
            if (value === undefined || (kind === "password" && !value)) return { ok: false, summary: "cancelled — nothing changed" };
            await api.context.secrets.store(api.profileSecretKey(name, kind), value);
            if (api.getActiveProfileName() === name) await api.activateProfile(name);
            return { summary: `${kind} updated for ${name}` };
        },
    };

    // ───────────────────────────── risky ─────────────────────────────

    ops.promote_library = {
        level: "risky",
        async run(args) {
            const libraryId = idArg(args, "library");
            await client().promoteToProduction(libraryId);
            await api.treeProvider().refresh();
            return { summary: `promoted ${libraryId}` };
        },
    };

    ops.demote_library = {
        level: "risky",
        async run(args) {
            const libraryId = idArg(args, "library");
            await client().demoteFromProduction(libraryId);
            await api.treeProvider().refresh();
            return { summary: `demoted ${libraryId}` };
        },
    };

    return ops;
}

module.exports = { buildOps };
