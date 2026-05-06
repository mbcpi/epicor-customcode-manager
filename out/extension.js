"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function () { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function (o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const epicorClient_1 = require("./epicorClient");
const treeProvider_1 = require("./treeProvider");
const executePanel_1 = require("./executePanel");
const bpmClient_1 = require("./bpmClient");
const bpmTreeProvider_1 = require("./bpmTreeProvider");
const updater_1 = require("./updater");
// Store pulled tablesets for push-back/debugging.
const pulledTablesets = new Map();
// Map open .cs files back to their library/function.
const fileMap = new Map();
let client = null;
let bpmClientInst = null;
let treeProvider;
let bpmTreeProvider;
let efxLibrariesView = null;
let bpmMethodsView = null;
function normalizeFsPath(filePath) {
    return String(filePath || "").toLowerCase();
}
function jsonStringLiteral(value) {
    return JSON.stringify(String(value));
}
function findMatchingRaw(raw, startIndex, openChar, closeChar) {
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = startIndex; i < raw.length; i++) {
        const ch = raw[i];
        if (inString) {
            if (escape) {
                escape = false;
            }
            else if (ch === "\\") {
                escape = true;
            }
            else if (ch === "\"") {
                inString = false;
            }
            continue;
        }
        if (ch === "\"") {
            inString = true;
            continue;
        }
        if (ch === openChar) {
            depth++;
        }
        else if (ch === closeChar) {
            depth--;
            if (depth === 0) {
                return i;
            }
        }
    }
    return -1;
}
function findEfxFunctionRowBounds(rawTableset, libraryId, functionId) {
    const arrayProp = "\"EfxFunction\"";
    const propIndex = rawTableset.indexOf(arrayProp);
    if (propIndex < 0) {
        throw new Error("EfxFunction array not found in raw tableset");
    }
    const arrayStart = rawTableset.indexOf("[", propIndex);
    if (arrayStart < 0) {
        throw new Error("EfxFunction array start not found in raw tableset");
    }
    const arrayEnd = findMatchingRaw(rawTableset, arrayStart, "[", "]");
    if (arrayEnd < 0) {
        throw new Error("EfxFunction array end not found in raw tableset");
    }
    const libraryNeedle = "\"LibraryID\":" + jsonStringLiteral(libraryId);
    const functionNeedle = "\"FunctionID\":" + jsonStringLiteral(functionId);
    let cursor = arrayStart + 1;
    while (cursor < arrayEnd) {
        const objStart = rawTableset.indexOf("{", cursor);
        if (objStart < 0 || objStart > arrayEnd) {
            break;
        }
        const objEnd = findMatchingRaw(rawTableset, objStart, "{", "}");
        if (objEnd < 0 || objEnd > arrayEnd) {
            throw new Error("Malformed EfxFunction row object in raw tableset");
        }
        const row = rawTableset.slice(objStart, objEnd + 1);
        if (row.includes(libraryNeedle) && row.includes(functionNeedle)) {
            return { start: objStart, end: objEnd + 1, row };
        }
        cursor = objEnd + 1;
    }
    throw new Error(`EfxFunction row not found in raw tableset for ${libraryId}.${functionId}`);
}
function replaceJsonStringProperty(row, propName, newJsonStringLiteral) {
    const propNeedle = "\"" + propName + "\":";
    const propIndex = row.indexOf(propNeedle);
    if (propIndex < 0) {
        throw new Error(`${propName} property not found in target EfxFunction row`);
    }
    let valueStart = propIndex + propNeedle.length;
    while (/\s/.test(row[valueStart] || "")) {
        valueStart++;
    }
    if (row[valueStart] !== "\"") {
        throw new Error(`${propName} is not a JSON string in target EfxFunction row`);
    }
    let i = valueStart + 1;
    let escape = false;
    for (; i < row.length; i++) {
        const ch = row[i];
        if (escape) {
            escape = false;
            continue;
        }
        if (ch === "\\") {
            escape = true;
            continue;
        }
        if (ch === "\"") {
            break;
        }
    }
    if (i >= row.length) {
        throw new Error(`${propName} string did not terminate in target EfxFunction row`);
    }
    return row.slice(0, valueStart) + newJsonStringLiteral + row.slice(i + 1);
}
function updateRawEfxFunctionBodyAndRowMod(rawTableset, libraryId, functionId, newBodyJsonString) {
    const bounds = findEfxFunctionRowBounds(rawTableset, libraryId, functionId);
    let newRow = replaceJsonStringProperty(bounds.row, "Body", JSON.stringify(newBodyJsonString));
    newRow = replaceJsonStringProperty(newRow, "RowMod", JSON.stringify("U"));
    if (newRow === bounds.row) {
        throw new Error(`Target EfxFunction row did not change for ${libraryId}.${functionId}`);
    }
    const updated = rawTableset.slice(0, bounds.start) + newRow + rawTableset.slice(bounds.end);
    // Validate syntax only. Do not send this parsed object back, because JS will corrupt int64 SysRevID values.
    JSON.parse(updated);
    return updated;
}
function markEfxFunctionDeleted(rawTableset, libraryId, functionId) {
    const bounds = findEfxFunctionRowBounds(rawTableset, libraryId, functionId);
    const newRow = replaceJsonStringProperty(bounds.row, "RowMod", JSON.stringify("D"));
    if (newRow === bounds.row) {
        throw new Error(`Target EfxFunction row did not change for ${libraryId}.${functionId}`);
    }
    const updated = rawTableset.slice(0, bounds.start) + newRow + rawTableset.slice(bounds.end);
    // Validate JSON syntax only.
    JSON.parse(updated);
    return updated;
}
// ── Generic helper: inject a new row JSON into a named array in raw tableset ──
function injectRowIntoArray(rawTableset, arrayName, newRowJson) {
    const needle = `"${arrayName}":[`;
    const arrayPropIdx = rawTableset.indexOf(needle);
    if (arrayPropIdx === -1) {
        throw new Error(`Array "${arrayName}" not found in raw tableset`);
    }
    const arrayStart = rawTableset.indexOf('[', arrayPropIdx);
    const arrayEnd = findMatchingRaw(rawTableset, arrayStart, '[', ']');
    if (arrayEnd < 0) {
        throw new Error(`Could not find end of "${arrayName}" array`);
    }
    const arrayContent = rawTableset.substring(arrayStart + 1, arrayEnd).trim();
    const sep = arrayContent.length > 0 ? ',' : '';
    return rawTableset.substring(0, arrayEnd) + sep + newRowJson + rawTableset.substring(arrayEnd);
}

async function saveOpenDocumentIfDirty(filePath) {
    const normalized = normalizeFsPath(filePath);
    const doc = vscode.workspace.textDocuments.find(d => d.uri && normalizeFsPath(d.uri.fsPath) === normalized);
    if (doc && doc.isDirty) {
        const saved = await doc.save();
        if (!saved) {
            throw new Error(`Could not save ${filePath}`);
        }
    }
}
function stripGeneratedHeader(fileContent) {
    const lines = fileContent.split(/\r?\n/);

    const markerIndex = lines.findIndex(line =>
        line.startsWith("// ─────") ||
        line.startsWith("// -----")
    );

    if (markerIndex < 0) {
        return fileContent;
    }

    const markerLine = lines[markerIndex];

    // If real code/comment was accidentally glued to the marker line,
    // preserve whatever comes after the marker.
    const gluedUnicode = markerLine.indexOf("// ─────────────────────────────────────");
    const gluedAscii = markerLine.indexOf("// --------------------------------------------------");

    let gluedRemainder = "";

    if (gluedUnicode >= 0) {
        gluedRemainder = markerLine
            .slice(gluedUnicode + "// ─────────────────────────────────────".length)
            .trimStart();
    }
    else if (gluedAscii >= 0) {
        gluedRemainder = markerLine
            .slice(gluedAscii + "// --------------------------------------------------".length)
            .trimStart();
    }

    const remainingLines = lines.slice(markerIndex + 1);

    if (gluedRemainder) {
        return [gluedRemainder, ...remainingLines].join("\n");
    }

    return remainingLines.join("\n");
}
function normalizeCodeForCompare(code) {
    return String(code || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}
function formatBOUpdErrors(errors) {
    if (!errors || errors.length === 0) {
        return "";
    }

    return errors.map((e, index) => {
        const level = e.ErrorLevel !== undefined ? `Level ${e.ErrorLevel}` : "Error";
        const type = e.ErrorType ? ` (${e.ErrorType})` : "";
        const table = e.TableName ? `\nTable: ${e.TableName}` : "";
        const text = e.ErrorText || e.Message || JSON.stringify(e);

        return `${index + 1}. ${level}${type}${table}\n${text}`;
    }).join("\n\n");
}
function activate(context) {
    treeProvider = new treeProvider_1.EfxTreeProvider(null);
    efxLibrariesView = vscode.window.createTreeView("efxLibraries", { treeDataProvider: treeProvider });
    context.subscriptions.push(efxLibrariesView);
    bpmTreeProvider = new bpmTreeProvider_1.BpmTreeProvider(null);
    bpmMethodsView = vscode.window.createTreeView("bpmMethods", { treeDataProvider: bpmTreeProvider });
    context.subscriptions.push(bpmMethodsView);
    // Try to initialize client from settings + secrets.
    initClient(context).then(() => updateViewDescriptions());
    // ── Auto-update: check GitHub releases on startup + manual command ──
    updater_1.registerUpdateCommand(context);
    updater_1.checkForUpdatesOnStartup(context);
    // -- Manage Profiles (entry point — also aliased as Configure Connection) --
    const manageProfilesHandler = async () => {
        await openProfileManager(context);
    };
    context.subscriptions.push(vscode.commands.registerCommand("efx.manageProfiles", manageProfilesHandler));
    // Keep configureConnection as alias for backwards compat / discoverability
    context.subscriptions.push(vscode.commands.registerCommand("efx.configureConnection", manageProfilesHandler));
    // -- Switch Profile --
    context.subscriptions.push(vscode.commands.registerCommand("efx.switchProfile", async () => {
        await switchActiveProfile(context);
    }));
    // -- Switch Company --
    context.subscriptions.push(vscode.commands.registerCommand("efx.switchCompany", async () => {
        await switchActiveCompany(context);
    }));
    // -- Refresh Libraries --
    context.subscriptions.push(vscode.commands.registerCommand("efx.refreshLibraries", async () => {
        if (!client) {
            vscode.window.showWarningMessage("EFx: Configure connection first");
            return;
        }
        await treeProvider.refresh();
    }));
    // -- Pull Function --
    context.subscriptions.push(vscode.commands.registerCommand("efx.pullFunction", async (node) => {
        if (!client || !node) {
            return;
        }
        const libraryId = node.libraryId;
        const functionId = node.func.FunctionID;
        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `Pulling ${functionId}...` }, async () => {
            try {
                // Always get fresh tableset.
                treeProvider.invalidateCache(libraryId);
                const tableset = await treeProvider.getLibraryTableset(libraryId);
                if (!tableset) {
                    return;
                }
                // Cache for debugging/back-reference only. Do not send parsed tablesets back.
                pulledTablesets.set(libraryId, tableset);
                const funcRow = tableset.EfxFunction.find(f => f.FunctionID === functionId);
                if (!funcRow) {
                    vscode.window.showErrorMessage(`Function ${functionId} not found`);
                    return;
                }
                const { code, usings } = epicorClient_1.EpicorClient.extractCode(funcRow.Body);
                // Write to a temp .cs file in the workspace.
                const efxDir = getEfxDir();
                const libDir = path.join(efxDir, libraryId);
                fs.mkdirSync(libDir, { recursive: true });
                const filePath = path.join(libDir, `${functionId}.cs`);
                // Write header comment with metadata.
                const header = [
                    `// EFx Function: ${libraryId}.${functionId}`,
                    `// Pulled: ${new Date().toISOString()}`,
                    usings ? `// Usings: ${usings}` : "",
                    "// --------------------------------------------------",
                    "",
                ].filter(l => l !== "").join("\n");
                fs.writeFileSync(filePath, header.replace(/\s*$/, "") + "\n\n" + code, "utf-8");
                fileMap.set(normalizeFsPath(filePath), { libraryId, functionId });
                // Open in editor.
                const doc = await vscode.workspace.openTextDocument(filePath);
                await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
                vscode.window.showInformationMessage(`EFx: Pulled ${libraryId}.${functionId}`);

                // Kick off initial validation
                const mapping = fileMap.get(normalizeFsPath(filePath));
                if (mapping && client) {
                    scheduleEfxValidation(filePath, mapping, code);
                }
            }
            catch (err) {
                vscode.window.showErrorMessage(`EFx Pull failed: ${err.message}`);
            }
        });
    }));
    // -- Push Function --
    context.subscriptions.push(vscode.commands.registerCommand("efx.pushFunction", async (node, skipConfirm = false) => {
        if (!client) {
            return;
        }
        let libraryId;
        let functionId;
        let filePath;
        if (node) {
            libraryId = node.libraryId;
            functionId = node.func.FunctionID;
            const efxDir = getEfxDir();
            filePath = path.join(efxDir, libraryId, `${functionId}.cs`);
        }
        else {
            // Try current editor.
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage("EFx: No active file to push");
                return;
            }
            filePath = editor.document.uri.fsPath;
            const mapping = fileMap.get(normalizeFsPath(filePath));
            if (!mapping) {
                vscode.window.showWarningMessage("EFx: This file is not a pulled EFx function");
                return;
            }
            libraryId = mapping.libraryId;
            functionId = mapping.functionId;
        }
        if (!filePath || !fs.existsSync(filePath)) {
            vscode.window.showErrorMessage("EFx: File not found. Pull the function first.");
            return;
        }
        if (!skipConfirm) {
            const confirm = await vscode.window.showWarningMessage(`Push ${functionId} to ${libraryId}?`, { modal: true }, "Push");
            if (confirm !== "Push") {
                return;
            }
        }
        await vscode.window.withProgress(
            { location: vscode.ProgressLocation.Notification, title: `Pushing ${functionId}...` },
            async () => {
                try {
                    // Make tree/context-menu push read the latest editor buffer, not stale disk.
                    await saveOpenDocumentIfDirty(filePath);

                    // Fetch a fresh parsed tableset for current metadata/Usings.
                    // The wrapper pulls the final live tableset server-side before applying changes,
                    // so the extension no longer posts raw ApplyChangesWithDiagnostics for function saves.
                    const freshTableset = await client.getLibrary(libraryId);

                    const libraryRow = freshTableset.EfxLibrary && freshTableset.EfxLibrary[0];
                    if (!libraryRow) {
                        throw new Error(`Library ${libraryId} not found on server`);
                    }

                    console.log("Published:", libraryRow.Published);
                    console.log("Frozen:", libraryRow.Frozen);

                    if (libraryRow.Frozen === true) {
                        throw new Error(`${libraryId} is frozen. Epicor will not accept edits while frozen.`);
                    }

                    // Read edited code.
                    let fileContent = fs.readFileSync(filePath, "utf-8");
                    fileContent = stripGeneratedHeader(fileContent);

                    // Find function row.
                    const funcRow = freshTableset.EfxFunction.find(f => f.FunctionID === functionId);
                    if (!funcRow) {
                        throw new Error(`Function ${functionId} not found on server`);
                    }

                    // Preserve existing Usings while replacing only Code.
                    const existing = epicorClient_1.EpicorClient.extractCode(funcRow.Body);

                    const result = await client.validateFunctionViaWrapper(
                        libraryId,
                        functionId,
                        fileContent,
                        existing.usings,
                        'Utilities',
                        'ApplyChangesWithDiagnostics'
                    );

                    const debugPath = path.join(getEfxDir(), `${libraryId}.${functionId}.last-wrapper-result.json`);
                    fs.writeFileSync(debugPath, JSON.stringify(result.raw || result, null, 2), "utf-8");
                    console.log("EFx wrapper result written:", debugPath);

                    const uri = vscode.Uri.file(filePath);

                    if (!result.saved) {
                        const diagnostics = result.diagnostics || result.errors || [];
                        if (diagnostics.length > 0) {
                            const vsDiags = diagnostics.map(d => {
                                if (typeof d === 'object' && d !== null) {
                                    const line = Math.max(0, (d.Line ?? 1) - 1);
                                    const msg = [d.Code, d.Message].filter(Boolean).join(': ') || String(d);
                                    return new vscode.Diagnostic(
                                        new vscode.Range(line, 0, line, 1),
                                        msg,
                                        vscode.DiagnosticSeverity.Error
                                    );
                                }
                                return new vscode.Diagnostic(
                                    new vscode.Range(0, 0, 0, 1),
                                    String(d),
                                    vscode.DiagnosticSeverity.Error
                                );
                            });
                            efxDiagnostics.set(uri, vsDiags);
                        }
                        throw new Error(result.errors?.[0] || result.outMsg || result.outResult || 'Wrapper save failed');
                    }

                    // Verify immediately by fetching from server and comparing the code body.
                    const verifyTableset = await client.getLibrary(libraryId);
                    const verifyFunc = verifyTableset.EfxFunction.find(f => f.FunctionID === functionId);

                    if (!verifyFunc) {
                        throw new Error(`Verification failed: ${libraryId}.${functionId} not found after save`);
                    }

                    const verifyCode = epicorClient_1.EpicorClient.extractCode(verifyFunc.Body).code;

                    if (normalizeCodeForCompare(verifyCode) !== normalizeCodeForCompare(fileContent)) {
                        throw new Error(
                            "EFx Push verification failed: wrapper returned success, but server Body does not match editor text."
                        );
                    }

                    efxDiagnostics.set(uri, []);
                    vscode.window.showInformationMessage(`EFx: Verified save of ${libraryId}.${functionId}`);

                    // Keep local cache accurate for the no-change validation guard.
                    const cachedTableset = pulledTablesets.get(libraryId);
                    const cachedFunc = cachedTableset?.EfxFunction?.find(f => f.FunctionID === functionId);
                    if (cachedFunc && result.newBody) {
                        cachedFunc.Body = result.newBody;
                    }

                    treeProvider.invalidateCache(libraryId);
                }
                catch (err) {
                    console.error("EFx Push failed:", err);
                    vscode.window.showErrorMessage(`EFx Push failed: ${err.message}`);
                }
            });
    }));
    // ── EFx: Regenerate / Validate Library ──
    context.subscriptions.push(vscode.commands.registerCommand("efx.regenerateLibrary", async (node) => {
        if (!client) {
            vscode.window.showWarningMessage("EFx: Configure connection first");
            return;
        }

        let libraryId;

        if (node?.library?.LibraryID) {
            libraryId = node.library.LibraryID;
        }
        else if (node?.libraryId) {
            libraryId = node.libraryId;
        }
        else {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const mapping = fileMap.get(normalizeFsPath(editor.document.uri.fsPath));
                if (mapping && !mapping.isBpm) {
                    libraryId = mapping.libraryId;
                }
            }
        }

        if (!libraryId) {
            libraryId = await vscode.window.showInputBox({
                prompt: "Library ID to regenerate / validate",
                placeHolder: "e.g. PimberlyFuncts"
            });
        }

        if (!libraryId) return;

        await vscode.window.withProgress(
            { location: vscode.ProgressLocation.Notification, title: `Validating ${libraryId}...` },
            async () => {
                try {
                    const result = await client.regenerateLibrary(libraryId);
                    const errors = result.errors || [];

                    if (errors.length === 0) {
                        vscode.window.showInformationMessage(`EFx: ${libraryId} validated with no reported errors`);
                        return;
                    }

                    const msg = formatBOUpdErrors(errors);

                    const doc = await vscode.workspace.openTextDocument({
                        language: "markdown",
                        content: `# EFx Validation Errors: ${libraryId}\n\n\`\`\`text\n${msg}\n\`\`\`\n`
                    });

                    await vscode.window.showTextDocument(doc, vscode.ViewColumn.Two);

                    vscode.window.showWarningMessage(`EFx: ${libraryId} has ${errors.length} validation error(s)`);
                }
                catch (err) {
                    vscode.window.showErrorMessage(`EFx Validate failed: ${err.message}`);
                }
            }
        );
    }));
    // -- Execute Function --
    context.subscriptions.push(vscode.commands.registerCommand("efx.executeFunction", async (node) => {
        if (!client || !node) {
            return;
        }
        const profile = getActiveProfile();
        const companies = profile ? (profile.companies || []) : [];
        const defaultCompany = getActiveCompany() || (companies[0] || '');
        // Determine if this library is unpromoted (staging) so execute uses the right URL
        const libMeta = (treeProvider.libraries || []).find(l => l.LibraryID === node.libraryId);
        const staging = libMeta ? !libMeta.Published : false;
        executePanel_1.ExecutePanel.show(client, node.libraryId, node.func.FunctionID, node.signatures, companies, defaultCompany, treeProvider, staging);
    }));
    // -- Demote Library --
    context.subscriptions.push(vscode.commands.registerCommand("efx.demoteLibrary", async (node) => {
        if (!client || !node) {
            return;
        }
        const confirm = await vscode.window.showWarningMessage(`Demote ${node.library.LibraryID} from production?`, { modal: true }, "Demote");
        if (confirm !== "Demote") {
            return;
        }
        try {
            await client.demoteFromProduction(node.library.LibraryID);
            vscode.window.showInformationMessage(`EFx: Demoted ${node.library.LibraryID}`);
            await treeProvider.refresh();
        }
        catch (err) {
            vscode.window.showErrorMessage(`EFx Demote failed: ${err.message}`);
        }
    }));
    // -- Promote Library --
    context.subscriptions.push(vscode.commands.registerCommand("efx.promoteLibrary", async (node) => {
        if (!client || !node) {
            return;
        }
        const confirm = await vscode.window.showWarningMessage(`Promote ${node.library.LibraryID} to production?`, { modal: true }, "Promote");
        if (confirm !== "Promote") {
            return;
        }
        try {
            await client.promoteToProduction(node.library.LibraryID);
            vscode.window.showInformationMessage(`EFx: Promoted ${node.library.LibraryID}`);
            await treeProvider.refresh();
        }
        catch (err) {
            vscode.window.showErrorMessage(`EFx Promote failed: ${err.message}`);
        }
    }));
    // ── New Function ──
    context.subscriptions.push(vscode.commands.registerCommand("efx.newFunction", async (node) => {
        if (!client) {
            vscode.window.showWarningMessage('EFx: Configure connection first');
            return;
        }

        // Get library ID from tree node or prompt
        let libraryId;
        if (node && node.library) {
            libraryId = node.library.LibraryID;
        } else if (node && node.libraryId) {
            libraryId = node.libraryId;
        } else {
            libraryId = await vscode.window.showInputBox({
                prompt: 'Library ID to add the function to',
                placeHolder: 'e.g. PaintLineFuncts',
            });
        }
        if (!libraryId) return;

        const functionId = await vscode.window.showInputBox({
            prompt: 'New Function ID',
            placeHolder: 'e.g. MyNewFunction',
            validateInput: (val) => {
                if (!val || val.trim().length === 0) return 'Function ID is required';
                if (/\s/.test(val)) return 'Function ID cannot contain spaces';
                return null;
            }
        });
        if (!functionId) return;

        const description = await vscode.window.showInputBox({
            prompt: 'Description (optional)',
            placeHolder: 'Short description of the function',
        });

        // ── Collect request/response params before creating ──
        const PARAM_TYPES = [
            'string', 'int', 'decimal', 'bool', 'DateTime',
            'System.Data.DataSet', 'System.Data.DataTable', 'Custom…'
        ];

        async function collectParams(label) {
            const params = [];
            while (true) {
                const argName = await vscode.window.showInputBox({
                    prompt: `${label} param name (leave blank to finish)`,
                    placeHolder: 'e.g. partNum',
                    ignoreFocusOut: true,
                });
                if (!argName) break;
                const typePick = await vscode.window.showQuickPick(
                    PARAM_TYPES.map(t => ({ label: t })),
                    { placeHolder: `Data type for "${argName}"`, ignoreFocusOut: true }
                );
                if (!typePick) break;
                let dataType = typePick.label;
                if (dataType === 'Custom…') {
                    const custom = await vscode.window.showInputBox({
                        prompt: 'Enter full .NET type name',
                        placeHolder: 'e.g. Erp.Tablesets.SalesOrderTableset',
                        ignoreFocusOut: true,
                    });
                    if (!custom) break;
                    dataType = custom;
                }
                params.push({ ArgumentName: argName, DataType: dataType });
            }
            return params;
        }

        const addReqPick = await vscode.window.showQuickPick(
            [{ label: 'Skip — add later', value: false }, { label: 'Add request params now', value: true }],
            { placeHolder: 'Add request parameters?', ignoreFocusOut: true }
        );
        const requestParams = (addReqPick?.value) ? await collectParams('Request') : [];

        const addRespPick = await vscode.window.showQuickPick(
            [{ label: 'Skip — add later', value: false }, { label: 'Add response params now', value: true }],
            { placeHolder: 'Add response parameters?', ignoreFocusOut: true }
        );
        const responseParams = (addRespPick?.value) ? await collectParams('Response') : [];

        const allSigs = [
            ...requestParams.map((p, i) => ({ ...p, Response: false, Order: i })),
            ...responseParams.map((p, i) => ({ ...p, Response: true, Order: i })),
        ];

        await vscode.window.withProgress(
            { location: vscode.ProgressLocation.Notification, title: `Creating ${functionId}...` },
            async () => {
                try {
                    // Get fresh raw tableset for the library
                    let rawTableset = await client.getLibraryRaw(libraryId);

                    // Build the new function row JSON
                    const emptyBody = JSON.stringify({ Code: "// New function\r\n", Usings: "" });
                    const newFuncRow = {
                        LibraryID: libraryId,
                        FunctionID: functionId,
                        Description: description || null,
                        Kind: 2,
                        RequireTransaction: false,
                        SingleRowMode: false,
                        Private: false,
                        Disabled: false,
                        Invalid: false,
                        Thumbnail: null,
                        Body: emptyBody,
                        Notes: null,
                        SysRevID: 0,
                        SysRowID: "00000000-0000-0000-0000-000000000000",
                        BitFlag: 0,
                        RowMod: "A"
                    };
                    const newFuncJson = JSON.stringify(newFuncRow);

                    // Insert the new function row into the EfxFunction array in the raw JSON
                    // Find the end of the EfxFunction array and insert before the closing ]
                    const efxFuncArrayStart = rawTableset.indexOf('"EfxFunction":[');
                    if (efxFuncArrayStart === -1) {
                        vscode.window.showErrorMessage('EFx: Could not find EfxFunction array in tableset');
                        return;
                    }

                    // Find the closing ] of the EfxFunction array
                    // We need to track bracket depth starting from the [
                    const arrayStart = rawTableset.indexOf('[', efxFuncArrayStart);
                    let depth = 0;
                    let arrayEnd = -1;
                    for (let i = arrayStart; i < rawTableset.length; i++) {
                        const ch = rawTableset[i];
                        if (ch === '"') {
                            // Skip strings
                            i++;
                            while (i < rawTableset.length) {
                                if (rawTableset[i] === '\\') { i++; }
                                else if (rawTableset[i] === '"') { break; }
                                i++;
                            }
                            continue;
                        }
                        if (ch === '[') depth++;
                        if (ch === ']') {
                            depth--;
                            if (depth === 0) { arrayEnd = i; break; }
                        }
                    }

                    if (arrayEnd === -1) {
                        vscode.window.showErrorMessage('EFx: Could not parse EfxFunction array');
                        return;
                    }

                    // Check if the array has existing items
                    const arrayContent = rawTableset.substring(arrayStart + 1, arrayEnd).trim();
                    const separator = arrayContent.length > 0 ? ',' : '';

                    // Insert the new row
                    rawTableset = rawTableset.substring(0, arrayEnd) + separator + newFuncJson + rawTableset.substring(arrayEnd);

                    // Apply
                    const result = await client.applyChangesRaw(rawTableset);

                    if (result.diagnostics && result.diagnostics.length > 0) {
                        const diagMsg = result.diagnostics.join('\n');
                        vscode.window.showWarningMessage(`EFx: ${functionId} created with diagnostics:\n${diagMsg}`);
                    } else {
                        vscode.window.showInformationMessage(`EFx: Created ${libraryId}.${functionId} ✓`);
                    }

                    // ── Save signatures if user supplied any ──
                    if (allSigs.length > 0) {
                        // Retry a few times — Epicor may not have committed the new
                        // function row by the time we immediately call getLibraryRaw
                        let sigSaved = false;
                        let sigErr = null;
                        for (let attempt = 0; attempt < 4; attempt++) {
                            if (attempt > 0) {
                                await new Promise(r => setTimeout(r, 800 * attempt));
                            }
                            try {
                                await client.saveSignatures(libraryId, functionId, allSigs);
                                sigSaved = true;
                                break;
                            } catch (e) {
                                sigErr = e;
                            }
                        }
                        if (sigSaved) {
                            vscode.window.showInformationMessage(`EFx: Saved ${allSigs.length} parameter(s) for ${functionId} ✓`);
                        } else {
                            vscode.window.showWarningMessage(`EFx: Function created but signatures failed: ${sigErr?.message}. Add them via ⚙ Edit Signatures in the Execute panel.`);
                        }
                    }

                    treeProvider.invalidateCache(libraryId);
                    await treeProvider.refresh();
                } catch (err) {
                    vscode.window.showErrorMessage(`EFx: Create function failed: ${err.message}`);
                }
            }
        );
    }));

    // ── Delete Function ──
    context.subscriptions.push(vscode.commands.registerCommand("efx.deleteFunction", async (node) => {
        if (!client) {
            vscode.window.showWarningMessage('EFx: Configure connection first');
            return;
        }
        if (!node) {
            vscode.window.showWarningMessage('EFx: Delete must be invoked from a function in the tree.');
            return;
        }
        const libraryId = node.libraryId;
        const functionId = node.func && node.func.FunctionID;
        if (!libraryId || !functionId) {
            vscode.window.showErrorMessage('EFx: Could not determine library/function from selection.');
            return;
        }

        const confirm = await vscode.window.showWarningMessage(
            `Delete function "${functionId}" from library "${libraryId}"? This cannot be undone.`,
            { modal: true },
            "Delete"
        );
        if (confirm !== "Delete") return;

        await vscode.window.withProgress(
            { location: vscode.ProgressLocation.Notification, title: `Deleting ${functionId}...` },
            async () => {
                try {
                    // Verify library isn't frozen — same guard as push.
                    const tableset = await client.getLibrary(libraryId);
                    const libraryRow = tableset && tableset.EfxLibrary && tableset.EfxLibrary[0];
                    if (!libraryRow) {
                        throw new Error(`Library ${libraryId} not found on server`);
                    }
                    if (libraryRow.Frozen === true) {
                        throw new Error(`${libraryId} is frozen. Demote it from production before deleting functions.`);
                    }

                    // Pull fresh raw tableset, mark function as deleted, send.
                    const rawTableset = await client.getLibraryRaw(libraryId);
                    const updatedRaw = markEfxFunctionDeleted(rawTableset, libraryId, functionId);
                    const result = await client.applyChangesRaw(updatedRaw);

                    // Surface diagnostics if any.
                    const diags = result.diagnostics || [];
                    const hasErrors = diags.some(d =>
                        typeof d === 'object'
                            ? (d.Severity ?? 2) >= 2
                            : /\berror\b/i.test(String(d))
                    );
                    if (hasErrors) {
                        const msg = diags.map(d => typeof d === 'object' ? (d.ErrorText || JSON.stringify(d)) : String(d)).join('\n');
                        throw new Error(`Server rejected delete:\n${msg}`);
                    }

                    // Clear any cached pulled tableset for this library.
                    pulledTablesets.delete(libraryId);

                    // Drop fileMap entries for this function so re-creating with the same name later works cleanly.
                    for (const [k, v] of fileMap.entries()) {
                        if (v && v.libraryId === libraryId && v.functionId === functionId) {
                            fileMap.delete(k);
                        }
                    }

                    treeProvider.invalidateCache(libraryId);
                    await treeProvider.refresh();
                    vscode.window.showInformationMessage(`EFx: Deleted ${libraryId}.${functionId} ✓ (local .cs file, if any, was left in place)`);
                } catch (err) {
                    vscode.window.showErrorMessage(`EFx: Delete function failed: ${err.message}`);
                }
            }
        );
    }));
    // ── New Library ──
    context.subscriptions.push(vscode.commands.registerCommand("efx.newLibrary", async () => {
        if (!client) {
            vscode.window.showWarningMessage('EFx: Configure connection first');
            return;
        }

        const libraryId = await vscode.window.showInputBox({
            prompt: 'New Library ID',
            placeHolder: 'e.g. MyNewLibrary',
            validateInput: (val) => {
                if (!val || val.trim().length === 0) return 'Library ID is required';
                if (/\s/.test(val)) return 'Library ID cannot contain spaces';
                return null;
            }
        });
        if (!libraryId) return;

        const description = await vscode.window.showInputBox({
            prompt: 'Description (optional)',
            placeHolder: 'Short description of the library',
        });

        await vscode.window.withProgress(
            { location: vscode.ProgressLocation.Notification, title: `Creating library ${libraryId}...` },
            async () => {
                try {
                    // Get the defaults template as raw JSON
                    let rawDefaults = await client.getDefaultsRaw();

                    // Replace placeholder values
                    rawDefaults = rawDefaults.replace(/"LibraryID":"@library"/g, `"LibraryID":"${libraryId}"`);
                    rawDefaults = rawDefaults.replace(/"OriginalID":"@library"/, `"OriginalID":"${libraryId}"`);
                    rawDefaults = rawDefaults.replace(/"FunctionID":"@function"/, `"FunctionID":"__placeholder__"`);

                    // Set description on the library
                    if (description) {
                        rawDefaults = rawDefaults.replace(/"Description":null/, `"Description":"${description}"`);
                    }

                    // Set RowMod to A for add on both library and function rows
                    // Library RowMod
                    rawDefaults = rawDefaults.replace(
                        /("OriginalID":"[^"]*"[^}]*"RowMod":")(")/, '$1A$2'
                    );

                    // Set AllowCustomCodeFunctions to true and Kind to 2 (code-based)
                    rawDefaults = rawDefaults.replace('"AllowCustomCodeFunctions":false', '"AllowCustomCodeFunctions":true');
                    rawDefaults = rawDefaults.replace('"DirectDBAccess":0', '"DirectDBAccess":2');

                    // Remove the placeholder function — we'll create an empty library
                    // Replace EfxFunction array with empty
                    const efxFuncStart = rawDefaults.indexOf('"EfxFunction":[');
                    if (efxFuncStart !== -1) {
                        const bracketStart = rawDefaults.indexOf('[', efxFuncStart);
                        let depth = 0;
                        let bracketEnd = -1;
                        for (let i = bracketStart; i < rawDefaults.length; i++) {
                            const ch = rawDefaults[i];
                            if (ch === '"') {
                                i++;
                                while (i < rawDefaults.length) {
                                    if (rawDefaults[i] === '\\') { i++; }
                                    else if (rawDefaults[i] === '"') { break; }
                                    i++;
                                }
                                continue;
                            }
                            if (ch === '[') depth++;
                            if (ch === ']') {
                                depth--;
                                if (depth === 0) { bracketEnd = i; break; }
                            }
                        }
                        if (bracketEnd !== -1) {
                            rawDefaults = rawDefaults.substring(0, bracketStart) + '[]' + rawDefaults.substring(bracketEnd + 1);
                        }
                    }

                    // Apply
                    const result = await client.applyChangesRaw(rawDefaults);

                    if (result.diagnostics && result.diagnostics.length > 0) {
                        const diagMsg = result.diagnostics.join('\n');
                        vscode.window.showWarningMessage(`EFx: Library ${libraryId} created with diagnostics:\n${diagMsg}`);
                    } else {
                        vscode.window.showInformationMessage(`EFx: Created library ${libraryId} ✓`);
                    }

                    await treeProvider.refresh();
                } catch (err) {
                    vscode.window.showErrorMessage(`EFx: Create library failed: ${err.message}`);
                }
            }
        );
    }));

    // -- Push from active editor via command palette --
    context.subscriptions.push(vscode.commands.registerCommand("efx.pushActiveFile", async () => {
        await vscode.commands.executeCommand("efx.pushFunction");
    }));

    // ── Add Table Reference ──
    context.subscriptions.push(vscode.commands.registerCommand("efx.addTable", async (node) => {
        if (!client || !node) return;
        const libraryId = node.libraryId;

        const COMMON_TABLES = [
            'ERP.Part', 'ERP.PartBin', 'ERP.PartCost', 'ERP.PartPlant', 'ERP.PartUOM', 'ERP.PartWhse',
            'ERP.PartCOO', 'ERP.PartPC', 'ERP.PartRev',
            'ERP.Customer', 'ERP.CustCnt', 'ERP.ShipTo',
            'ERP.OrderHed', 'ERP.OrderDtl', 'ERP.OrderRel',
            'ERP.QuoteHed', 'ERP.QuoteDtl',
            'ERP.JobHead', 'ERP.JobAsmbl', 'ERP.JobMtl', 'ERP.JobOper',
            'ERP.ShipHead', 'ERP.ShipDtl',
            'ERP.PurchaseOrder', 'ERP.PODetail', 'ERP.PORel',
            'ERP.Vendor', 'ERP.VendPart',
            'ERP.PriceLst', 'ERP.PriceLstParts',
            'ERP.LaborDtl', 'ERP.LaborHed',
            'ERP.PlantWhse', 'ERP.PartTran',
            'ERP.Country', 'ERP.Currency',
            'ERP.UD01', 'ERP.UD02', 'ERP.UD03', 'ERP.UD04', 'ERP.UD05',
            'ERP.UD06', 'ERP.UD07', 'ERP.UD08', 'ERP.UD09', 'ERP.UD10',
            'ICE.UD11', 'ICE.UD12', 'ICE.UD13', 'ICE.UD14', 'ICE.UD15',
            'ICE.UD16', 'ICE.UD17', 'ICE.UD18', 'ICE.UD19', 'ICE.UD20',
        ].sort();

        const picks = [
            { label: '$(edit) Enter manually...', alwaysShow: true, manual: true },
            ...COMMON_TABLES.map(t => ({ label: t, manual: false }))
        ];

        const selection = await vscode.window.showQuickPick(picks, {
            placeHolder: 'Select a table or enter manually (format: ERP.Part)',
            matchOnDescription: true,
        });
        if (!selection) return;

        let tableId;
        if (selection.manual) {
            tableId = await vscode.window.showInputBox({
                prompt: 'Table ID',
                placeHolder: 'e.g. ERP.PartBin or ICE.UD11',
                validateInput: v => (!v || !v.includes('.')) ? 'Format must be NAMESPACE.TableName' : null
            });
        } else {
            tableId = selection.label;
        }
        if (!tableId) return;

        const updatablePick = await vscode.window.showQuickPick(
            [{ label: 'Read-only', value: false }, { label: 'Updatable', value: true }],
            { placeHolder: 'Read-only or Updatable?' }
        );
        if (!updatablePick) return;

        await vscode.window.withProgress(
            { location: vscode.ProgressLocation.Notification, title: `Adding table ${tableId}...` },
            async () => {
                try {
                    let raw = await client.getLibraryRaw(libraryId);
                    const newRow = JSON.stringify({
                        LibraryID: libraryId,
                        TableID: tableId,
                        Updatable: updatablePick.value,
                        SysRevID: 0,
                        SysRowID: '00000000-0000-0000-0000-000000000000',
                        RowMod: 'A'
                    });
                    raw = injectRowIntoArray(raw, 'EfxRefTable', newRow);
                    const result = await client.applyChangesRaw(raw);
                    if (result.diagnostics && result.diagnostics.length > 0) {
                        vscode.window.showWarningMessage(`EFx: Table added with diagnostics: ${result.diagnostics.join(', ')}`);
                    } else {
                        vscode.window.showInformationMessage(`EFx: Added table ${tableId} to ${libraryId} ✓`);
                    }
                    treeProvider.invalidateCache(libraryId);
                    treeProvider._onDidChangeTreeData.fire(undefined);
                } catch (err) {
                    vscode.window.showErrorMessage(`EFx: Add table failed: ${err.message}`);
                }
            }
        );
    }));

    // ── Add Service Reference ──
    context.subscriptions.push(vscode.commands.registerCommand("efx.addService", async (node) => {
        if (!client || !node) return;
        const libraryId = node.libraryId;

        const COMMON_SERVICES = [
            'ERP:BO:Part', 'ERP:BO:PartBin', 'ERP:BO:PartWhse', 'ERP:BO:PartCost', 'ERP:BO:PartTran',
            'ERP:BO:Customer', 'ERP:BO:ShipTo',
            'ERP:BO:SalesOrder', 'ERP:BO:QuoteMgr',
            'ERP:BO:JobEntry', 'ERP:BO:JobStatus',
            'ERP:BO:CustShip', 'ERP:BO:SubShipD',
            'ERP:BO:PurchaseOrder', 'ERP:BO:Receipt',
            'ERP:BO:Vendor',
            'ERP:BO:LaborDtl',
            'ERP:BO:PriceLst',
            'ERP:BO:Currency', 'ERP:BO:Country',
            'ERP:BO:Inventory',
            'ICE:BO:UD11', 'ICE:BO:UD12', 'ICE:BO:UD13', 'ICE:BO:UD14', 'ICE:BO:UD15',
            'ICE:BO:UD16', 'ICE:BO:UD17', 'ICE:BO:UD18', 'ICE:BO:UD19', 'ICE:BO:UD20',
            'ICE:LIB:EfxLibraryDesigner',
        ].sort();

        const picks = [
            { label: '$(edit) Enter manually...', alwaysShow: true, manual: true },
            ...COMMON_SERVICES.map(s => ({ label: s, manual: false }))
        ];

        const selection = await vscode.window.showQuickPick(picks, {
            placeHolder: 'Select a service or enter manually (format: ERP:BO:Part)',
        });
        if (!selection) return;

        let serviceId;
        if (selection.manual) {
            serviceId = await vscode.window.showInputBox({
                prompt: 'Service ID',
                placeHolder: 'e.g. ERP:BO:Part or ICE:BO:UD11',
                validateInput: v => (!v || v.split(':').length < 3) ? 'Format must be NAMESPACE:TYPE:Name' : null
            });
        } else {
            serviceId = selection.label;
        }
        if (!serviceId) return;

        await vscode.window.withProgress(
            { location: vscode.ProgressLocation.Notification, title: `Adding service ${serviceId}...` },
            async () => {
                try {
                    let raw = await client.getLibraryRaw(libraryId);
                    const newRow = JSON.stringify({
                        LibraryID: libraryId,
                        ServiceID: serviceId,
                        SysRevID: 0,
                        SysRowID: '00000000-0000-0000-0000-000000000000',
                        RowMod: 'A'
                    });
                    raw = injectRowIntoArray(raw, 'EfxRefService', newRow);
                    const result = await client.applyChangesRaw(raw);
                    if (result.diagnostics && result.diagnostics.length > 0) {
                        vscode.window.showWarningMessage(`EFx: Service added with diagnostics: ${result.diagnostics.join(', ')}`);
                    } else {
                        vscode.window.showInformationMessage(`EFx: Added service ${serviceId} to ${libraryId} ✓`);
                    }
                    treeProvider.invalidateCache(libraryId);
                    treeProvider._onDidChangeTreeData.fire(undefined);
                } catch (err) {
                    vscode.window.showErrorMessage(`EFx: Add service failed: ${err.message}`);
                }
            }
        );
    }));

    // ── Add Assembly Reference ──
    context.subscriptions.push(vscode.commands.registerCommand("efx.addAssembly", async (node) => {
        if (!client || !node) return;
        const libraryId = node.libraryId;

        const COMMON_ASSEMBLIES = [
            'Newtonsoft.Json.dll',
            'Ice.Contracts.BO.DynamicQuery.dll',
            'Ice.Contracts.BO.BAQDesigner.dll',
            'Erp.Contracts.BO.Part.dll',
            'Erp.Contracts.BO.JobEntry.dll',
            'Erp.Contracts.BO.SalesOrder.dll',
            'Erp.Contracts.BO.QuoteMgr.dll',
            'Erp.Contracts.BO.CustShip.dll',
            'Erp.Contracts.BO.PurchaseOrder.dll',
            'Erp.Contracts.BO.LaborDtl.dll',
            'Erp.Contracts.BO.Inventory.dll',
            'Erp.Contracts.BO.Customer.dll',
            'Erp.Contracts.BO.Vendor.dll',
            'Ice.Contracts.BO.UD11.dll',
            'Ice.Contracts.BO.UD15.dll',
            'System.Net.Http.dll',
            'System.Xml.dll',
            'System.Linq.dll',
        ].sort();

        const picks = [
            { label: '$(edit) Enter manually...', alwaysShow: true, manual: true },
            ...COMMON_ASSEMBLIES.map(a => ({ label: a, manual: false }))
        ];

        const selection = await vscode.window.showQuickPick(picks, {
            placeHolder: 'Select an assembly or enter manually (include .dll)',
        });
        if (!selection) return;

        let assembly;
        if (selection.manual) {
            assembly = await vscode.window.showInputBox({
                prompt: 'Assembly filename',
                placeHolder: 'e.g. Newtonsoft.Json.dll',
                validateInput: v => (!v || !v.toLowerCase().endsWith('.dll')) ? 'Must end in .dll' : null
            });
        } else {
            assembly = selection.label;
        }
        if (!assembly) return;

        await vscode.window.withProgress(
            { location: vscode.ProgressLocation.Notification, title: `Adding assembly ${assembly}...` },
            async () => {
                try {
                    let raw = await client.getLibraryRaw(libraryId);
                    const newRow = JSON.stringify({
                        LibraryID: libraryId,
                        Assembly: assembly,
                        SysRevID: 0,
                        SysRowID: '00000000-0000-0000-0000-000000000000',
                        RowMod: 'A'
                    });
                    raw = injectRowIntoArray(raw, 'EfxRefAssembly', newRow);
                    const result = await client.applyChangesRaw(raw);
                    if (result.diagnostics && result.diagnostics.length > 0) {
                        vscode.window.showWarningMessage(`EFx: Assembly added with diagnostics: ${result.diagnostics.join(', ')}`);
                    } else {
                        vscode.window.showInformationMessage(`EFx: Added assembly ${assembly} to ${libraryId} ✓`);
                    }
                    treeProvider.invalidateCache(libraryId);
                    treeProvider._onDidChangeTreeData.fire(undefined);
                } catch (err) {
                    vscode.window.showErrorMessage(`EFx: Add assembly failed: ${err.message}`);
                }
            }
        );
    }));

    // ── Add Library Reference ──
    context.subscriptions.push(vscode.commands.registerCommand("efx.addLibraryRef", async (node) => {
        if (!client || !node) return;
        const libraryId = node.libraryId;

        // Use live library list from tree for suggestions
        const allLibraries = treeProvider.libraries || [];
        const otherLibraries = allLibraries
            .map(l => l.LibraryID)
            .filter(id => id !== libraryId)
            .sort();

        const picks = [
            { label: '$(edit) Enter manually...', alwaysShow: true, manual: true },
            ...otherLibraries.map(id => ({ label: id, manual: false }))
        ];

        const selection = await vscode.window.showQuickPick(picks, {
            placeHolder: otherLibraries.length > 0
                ? 'Select a library to reference'
                : 'Enter library ID (refresh tree first to get suggestions)',
        });
        if (!selection) return;

        let libraryRef;
        if (selection.manual) {
            libraryRef = await vscode.window.showInputBox({
                prompt: 'Library ID to reference',
                placeHolder: 'e.g. LogFuncts',
                validateInput: v => (!v || v.trim().length === 0) ? 'Library ID is required' : null
            });
        } else {
            libraryRef = selection.label;
        }
        if (!libraryRef) return;

        const modePick = await vscode.window.showQuickPick(
            [
                { label: 'Normal (0)', value: 0, description: 'Standard reference' },
                { label: 'Read-only (1)', value: 1, description: 'Cannot call mutating functions' },
                { label: 'Hidden (2)', value: 2, description: 'Not visible in designer' },
            ],
            { placeHolder: 'Reference mode' }
        );
        if (!modePick) return;

        await vscode.window.withProgress(
            { location: vscode.ProgressLocation.Notification, title: `Adding library ref ${libraryRef}...` },
            async () => {
                try {
                    let raw = await client.getLibraryRaw(libraryId);
                    const newRow = JSON.stringify({
                        LibraryID: libraryId,
                        LibraryRef: libraryRef,
                        Mode: modePick.value,
                        SysRevID: 0,
                        SysRowID: '00000000-0000-0000-0000-000000000000',
                        RowMod: 'A'
                    });
                    raw = injectRowIntoArray(raw, 'EfxRefLibrary', newRow);
                    const result = await client.applyChangesRaw(raw);
                    if (result.diagnostics && result.diagnostics.length > 0) {
                        vscode.window.showWarningMessage(`EFx: Library ref added with diagnostics: ${result.diagnostics.join(', ')}`);
                    } else {
                        vscode.window.showInformationMessage(`EFx: Added library ref ${libraryRef} to ${libraryId} ✓`);
                    }
                    treeProvider.invalidateCache(libraryId);
                    treeProvider._onDidChangeTreeData.fire(undefined);
                } catch (err) {
                    vscode.window.showErrorMessage(`EFx: Add library ref failed: ${err.message}`);
                }
            }
        );
    }));
    // ── BPM diagnostics collection ──
    const bpmDiagnostics = vscode.languages.createDiagnosticCollection('epicor-bpm');
    context.subscriptions.push(bpmDiagnostics);

    // ── EFx diagnostics collection ──
    const efxDiagnostics = vscode.languages.createDiagnosticCollection('epicor-efx');
    context.subscriptions.push(efxDiagnostics);

    // Debounce map: filePath -> timeout handle
    const validateTimers = new Map();

    function scheduleBpmValidation(filePath, mapping, documentText) {
        if (validateTimers.has(filePath)) {
            clearTimeout(validateTimers.get(filePath));
        }
        validateTimers.set(filePath, setTimeout(async () => {
            validateTimers.delete(filePath);
            if (!bpmClientInst || !mapping.isBpm || !mapping.functionDefinition) return;
            try {
                // Use passed-in document text if available (live buffer),
                // otherwise fall back to disk (e.g. on initial pull)
                let code = documentText !== undefined
                    ? documentText
                    : fs.readFileSync(filePath, 'utf-8');
                code = stripGeneratedHeader(code);
                const diagnostics = await bpmClientInst.validateCustomCode(code, mapping.functionDefinition);
                const uri = vscode.Uri.file(filePath);
                if (!diagnostics || diagnostics.length === 0) {
                    bpmDiagnostics.set(uri, []);
                    return;
                }
                const vsDiags = diagnostics.map(d => {
                    const startLine = Math.max(0, (d.Span?.start?.line ?? 1) - 1);
                    const startCol = Math.max(0, d.Span?.start?.column ?? 0);
                    const endLine = Math.max(0, (d.Span?.end?.line ?? startLine + 1) - 1);
                    const endCol = Math.max(0, d.Span?.end?.column ?? startCol + 1);
                    const range = new vscode.Range(startLine, startCol, endLine, endCol);
                    const severity = d.Severity === 0
                        ? vscode.DiagnosticSeverity.Hint
                        : d.Severity === 1
                            ? vscode.DiagnosticSeverity.Warning
                            : vscode.DiagnosticSeverity.Error;
                    const msg = `${d.Code}: ${d.Message}`;
                    return new vscode.Diagnostic(range, msg, severity);
                });
                bpmDiagnostics.set(uri, vsDiags);
            } catch (_) {
                // Validation errors are non-fatal — don't spam the user
            }
        }, 500));
    }

    // Watch open documents for BPM file changes
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => {
        const filePath = e.document.uri.fsPath;
        const mapping = fileMap.get(normalizeFsPath(filePath));
        if (mapping && mapping.isBpm && mapping.functionDefinition) {
            scheduleBpmValidation(filePath, mapping, e.document.getText());
        }
        if (mapping && !mapping.isBpm && client) {
            scheduleEfxValidation(filePath, mapping, e.document.getText());
        }
        //ApplyChangesWithDiagnostics with RowMod:"" causes:
        // "Can't infer library ID from the input"
        // Use efx.regenerateLibrary instead.
    }));

    // ── Auto-push on save (if enabled in profile) ──
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(async (doc) => {
        const filePath = doc.uri.fsPath;
        const mapping = fileMap.get(normalizeFsPath(filePath));
        if (!mapping || mapping.isBpm || !client) return;
        const activeProfile = getActiveProfile();
        if (!activeProfile?.autoPush) return;
        // Fire push silently — skipConfirm=true so no modal dialog
        await vscode.commands.executeCommand('efx.pushFunction', null, true);
    }));

    // Clear diagnostics when BPM file is closed
    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(doc => {
        const mapping = fileMap.get(normalizeFsPath(doc.uri.fsPath));
        if (mapping && mapping.isBpm) {
            bpmDiagnostics.delete(doc.uri);
        }
        if (mapping && !mapping.isBpm) {
            efxDiagnostics.delete(doc.uri);
        }
    }));

    // ── EFx debounced validation ──
    // NOTE: Since Epicor has no stateless validate endpoint for EFx, validation IS a save.
    // The no-change guard below prevents unnecessary saves while typing.
    // If button-based validation is needed in future, extract the inner logic to a
    // runEfxValidation(filePath, mapping, code) helper and call it directly.
    const efxValidateTimers = new Map();

    function scheduleEfxValidation(filePath, mapping, documentText) {
        if (efxValidateTimers.has(filePath)) {
            clearTimeout(efxValidateTimers.get(filePath));
        }
        efxValidateTimers.set(filePath, setTimeout(async () => {
            efxValidateTimers.delete(filePath);
            if (!client || !mapping.libraryId || !mapping.functionId) return;

            try {
                let code = documentText !== undefined
                    ? documentText
                    : fs.readFileSync(filePath, 'utf-8');
                code = stripGeneratedHeader(code);

                // ── No-change guard: skip network call if code matches cache ──
                const cachedTableset = pulledTablesets.get(mapping.libraryId);
                const cachedFunc = cachedTableset?.EfxFunction?.find(f => f.FunctionID === mapping.functionId);
                console.log('[EFx validate] firing for', mapping.functionId);
                console.log('[EFx validate] cachedFunc found:', !!cachedFunc);
                if (cachedFunc) {
                    const cachedCode = epicorClient_1.EpicorClient.extractCode(cachedFunc.Body).code;
                    console.log('[EFx validate] codes match:', normalizeCodeForCompare(cachedCode) === normalizeCodeForCompare(code));
                }

                if (cachedFunc) {
                    const cachedCode = epicorClient_1.EpicorClient.extractCode(cachedFunc.Body).code;
                    if (normalizeCodeForCompare(cachedCode) === normalizeCodeForCompare(code)) {
                        // Code unchanged — clear any stale squiggles and bail
                        efxDiagnostics.set(vscode.Uri.file(filePath), []);
                        return;
                    }
                }

                const usings = cachedFunc
                    ? epicorClient_1.EpicorClient.extractCode(cachedFunc.Body).usings
                    : '';

                const { diagnostics, saved, newBody } = await client.validateFunctionViaWrapper(
                    mapping.libraryId,
                    mapping.functionId,
                    code,
                    usings,
                    'Utilities',
                    'ApplyChangesWithDiagnostics'
                );

                // ── Cache sync: if Epicor accepted the save, update local cache ──
                // Keeps the no-change guard accurate on the next debounce fire.
                if (saved && cachedTableset && cachedFunc) {
                    cachedFunc.Body = newBody;
                }

                const uri = vscode.Uri.file(filePath);

                if (!diagnostics || diagnostics.length === 0) {
                    efxDiagnostics.set(uri, []);
                    return;
                }

                const vsDiags = diagnostics.map(d => {
                    // Structured object — what ApplyChangesWithDiagnostics actually returns
                    if (typeof d === 'object' && d !== null) {
                        const parsedLine = Number.isInteger(d.Line) ? d.Line : undefined;
                        const startLine = Math.max(0, (d.Span?.start?.line ?? parsedLine ?? 1) - 1);
                        const startCol = Math.max(0, d.Span?.start?.column ?? 0);
                        const endLine = Math.max(0, (d.Span?.end?.line ?? parsedLine ?? startLine + 1) - 1);
                        const endCol = Math.max(0, d.Span?.end?.column ?? startCol + 1);
                        const severity = d.Severity === 1
                            ? vscode.DiagnosticSeverity.Warning
                            : d.Severity === 0
                                ? vscode.DiagnosticSeverity.Hint
                                : vscode.DiagnosticSeverity.Error;
                        const msg = [d.Code, d.Message].filter(Boolean).join(': ');
                        return new vscode.Diagnostic(
                            new vscode.Range(startLine, startCol, endLine, endCol),
                            msg || String(d),
                            severity
                        );
                    }
                    // Fallback: plain string "(line,col): error CSxxxx: msg"
                    const m = String(d).match(/\((\d+),(\d+)\).*?(error|warning|info)\s+(CS\w+)?:?\s*(.*)/i);
                    if (m) {
                        const line = Math.max(0, parseInt(m[1]) - 1);
                        const col = Math.max(0, parseInt(m[2]) - 1);
                        const sev = m[3].toLowerCase();
                        return new vscode.Diagnostic(
                            new vscode.Range(line, col, line, col + 1),
                            `${m[4] ? m[4] + ': ' : ''}${m[5]}`,
                            sev === 'warning' ? vscode.DiagnosticSeverity.Warning
                                : sev === 'info' ? vscode.DiagnosticSeverity.Information
                                    : vscode.DiagnosticSeverity.Error
                        );
                    }
                    return new vscode.Diagnostic(
                        new vscode.Range(0, 0, 0, 1),
                        String(d),
                        vscode.DiagnosticSeverity.Error
                    );
                });

                efxDiagnostics.set(uri, vsDiags);

            } catch (_) {
                // Non-fatal — swallow network/parse errors silently
            }
        }, 1500)); // 1.5s debounce — longer than BPM since every fire is a real save + getLibraryRaw
    }
    context.subscriptions.push(vscode.commands.registerCommand("efx.bpm.refresh", async () => {
        if (!bpmClientInst) {
            vscode.window.showWarningMessage('BPM: Configure connection first');
            return;
        }
        await bpmTreeProvider.refresh();
    }));

    // ── BPM: Pull Directive Code ──
    context.subscriptions.push(vscode.commands.registerCommand("efx.bpm.pullDirective", async (nodeOrArg) => {
        if (!bpmClientInst) {
            vscode.window.showWarningMessage('BPM: Configure connection first');
            return;
        }

        let directive;
        if (nodeOrArg && nodeOrArg.directive) {
            directive = nodeOrArg.directive;
        } else if (nodeOrArg instanceof bpmTreeProvider_1.BpmDirectiveNode) {
            directive = nodeOrArg.directive;
        } else {
            vscode.window.showWarningMessage('BPM: Select a directive to pull');
            return;
        }

        const { code, hasCustomCode } = bpmClient_1.extractBpmCode(directive.Body);
        if (!hasCustomCode) {
            vscode.window.showWarningMessage(`BPM: "${directive.Name}" has no custom C# code — it uses widget actions only`);
            return;
        }

        await vscode.window.withProgress(
            { location: vscode.ProgressLocation.Notification, title: `Pulling BPM: ${directive.Name}...` },
            async () => {
                try {
                    const typeLabel = directive.DirectiveType === 1 ? 'Pre'
                        : directive.DirectiveType === 3 ? 'Post'
                            : directive.DirectiveType === 2 ? 'Base'
                                : `Type${directive.DirectiveType}`;

                    const efxDir = getEfxDir();
                    const bpmDir = path.join(efxDir, '_BPM', directive.BpMethodCode);
                    fs.mkdirSync(bpmDir, { recursive: true });

                    const safeName = directive.Name.replace(/[^a-zA-Z0-9_\-. ]/g, '_');
                    const filePath = path.join(bpmDir, `${typeLabel}_${safeName}.cs`);

                    const header = [
                        `// BPM Directive: ${directive.Name}`,
                        `// Method: ${directive.BpMethodCode}`,
                        `// Type: ${typeLabel}`,
                        `// Enabled: ${directive.IsEnabled}`,
                        `// Group: ${directive.DirectiveGroup || '(none)'}`,
                        `// DirectiveID: ${directive.DirectiveID}`,
                        `// Pulled: ${new Date().toISOString()}`,
                        `// --------------------------------------------------`,
                        ``,
                    ].join('\n');

                    fs.writeFileSync(filePath, header + code, 'utf-8');

                    // Store mapping for push + validation
                    const tableset = await bpmClientInst.getBpmMethod('BO', directive.BpMethodCode);
                    const method = tableset?.BpMethod?.[0];
                    const args = tableset?.BpArgument || [];
                    const functionDefinition = (method)
                        ? bpmClient_1.buildFunctionDefinition(method, args)
                        : null;

                    fileMap.set(normalizeFsPath(filePath), {
                        libraryId: '__BPM__',
                        functionId: directive.DirectiveID,
                        bpmMethodCode: directive.BpMethodCode,
                        directiveId: directive.DirectiveID,
                        directiveType: directive.DirectiveType,
                        isBpm: true,
                        functionDefinition,
                    });

                    const doc = await vscode.workspace.openTextDocument(filePath);
                    await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
                    vscode.window.showInformationMessage(`BPM: Pulled ${typeLabel} directive "${directive.Name}"`);

                    // Kick off initial validation
                    if (functionDefinition) {
                        const mapping = fileMap.get(normalizeFsPath(filePath));
                        scheduleBpmValidation(filePath, mapping);
                    }
                } catch (err) {
                    vscode.window.showErrorMessage(`BPM Pull failed: ${err.message}`);
                }
            }
        );
    }));
    // ── BPM: Push Directive Code ──
    context.subscriptions.push(vscode.commands.registerCommand("efx.bpm.pushDirective", async (node) => {
        if (!bpmClientInst) {
            vscode.window.showWarningMessage('BPM: Configure connection first');
            return;
        }

        // Resolve from node (tree click) or active editor
        let filePath;
        let mapping;
        if (node && node.directive) {
            // Called from tree — find the pulled file
            const directive = node.directive;
            const typeLabel = directive.DirectiveType === 1 ? 'Pre'
                : directive.DirectiveType === 3 ? 'Post'
                    : directive.DirectiveType === 2 ? 'Base'
                        : `Type${directive.DirectiveType}`;
            const safeName = directive.Name.replace(/[^a-zA-Z0-9_\-. ]/g, '_');
            const efxDir = getEfxDir();
            filePath = path.join(efxDir, '_BPM', directive.BpMethodCode, `${typeLabel}_${safeName}.cs`);
            mapping = fileMap.get(normalizeFsPath(filePath));
        } else {
            // Called from command palette / active editor
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('BPM: No active file to push');
                return;
            }
            filePath = editor.document.uri.fsPath;
            mapping = fileMap.get(normalizeFsPath(filePath));
        }

        if (!mapping || !mapping.isBpm) {
            vscode.window.showWarningMessage('BPM: This file is not a pulled BPM directive. Pull it first.');
            return;
        }

        if (!filePath || !fs.existsSync(filePath)) {
            vscode.window.showErrorMessage('BPM: File not found. Pull the directive first.');
            return;
        }

        const confirm = await vscode.window.showWarningMessage(
            `Push BPM directive to ${mapping.bpmMethodCode}?`,
            { modal: true },
            'Push'
        );
        if (confirm !== 'Push') return;

        await vscode.window.withProgress(
            { location: vscode.ProgressLocation.Notification, title: `Pushing BPM directive...` },
            async () => {
                try {
                    await saveOpenDocumentIfDirty(filePath);

                    // Read edited code, strip header
                    let fileContent = fs.readFileSync(filePath, 'utf-8');
                    fileContent = stripGeneratedHeader(fileContent);

                    // Get fresh raw tableset
                    const rawTableset = await bpmClientInst.getBpmMethodRaw('BO', mapping.bpmMethodCode);

                    // Inject new code and set RowMod U on the target directive
                    const updatedRaw = bpmClient_1.updateRawBpmDirective(
                        rawTableset,
                        mapping.directiveId,
                        fileContent
                    );

                    // Validate JSON before sending
                    JSON.parse(`{"ds":${updatedRaw}}`);

                    // Push
                    const pushResult = await bpmClientInst.updateBpmRaw(updatedRaw);

                    // Debug: log the response and what we sent
                    const debugDir = getEfxDir();
                    fs.writeFileSync(path.join(debugDir, '_bpm_push_response.json'), JSON.stringify(pushResult, null, 2), 'utf-8');
                    fs.writeFileSync(path.join(debugDir, '_bpm_push_payload.json'), `{"ds":${updatedRaw}}`, 'utf-8');

                    vscode.window.showInformationMessage(`BPM: Pushed directive to ${mapping.bpmMethodCode} ✓`);

                    // Re-validate after push
                    if (mapping.functionDefinition) {
                        scheduleBpmValidation(filePath, mapping);
                    }

                    // Invalidate cache so tree refreshes
                    const parts = mapping.bpmMethodCode.split('.');
                    // BpMethodCode = Erp.BO.JobEntry.Update -> SystemCode=ERP, ServiceKind=BO, ServiceName=JobEntry
                    if (parts.length >= 3) {
                        bpmTreeProvider.invalidateService(parts[0].toUpperCase(), parts[1], parts[2]);
                    }
                } catch (err) {
                    vscode.window.showErrorMessage(`BPM Push failed: ${err.message}`);
                }
            }
        );
    }));
}
// ─────────────────────────────────────────────────────────────────────────────
// Profile management
// ─────────────────────────────────────────────────────────────────────────────
//
// Settings:
//   efx.profiles        — array of { name, serverUrl, username, companies[] }
//   efx.activeProfile   — name of current profile
//   efx.activeCompany   — currently selected company within active profile
//
// SecretStorage (per-profile):
//   efx.profile.<name>.password
//   efx.profile.<name>.apiKey
// ─────────────────────────────────────────────────────────────────────────────
const PROFILE_INPUT_OPTS = { ignoreFocusOut: true };
function getProfiles() {
    const config = vscode.workspace.getConfiguration("efx");
    const profiles = config.get("profiles");
    return Array.isArray(profiles) ? profiles : [];
}
async function setProfiles(profiles) {
    const config = vscode.workspace.getConfiguration("efx");
    await config.update("profiles", profiles, vscode.ConfigurationTarget.Global);
}
function getActiveProfileName() {
    return vscode.workspace.getConfiguration("efx").get("activeProfile") || "";
}
async function setActiveProfileName(name) {
    const config = vscode.workspace.getConfiguration("efx");
    await config.update("activeProfile", name, vscode.ConfigurationTarget.Global);
}
function getActiveCompany() {
    return vscode.workspace.getConfiguration("efx").get("activeCompany") || "";
}
async function setActiveCompany(company) {
    const config = vscode.workspace.getConfiguration("efx");
    await config.update("activeCompany", company, vscode.ConfigurationTarget.Global);
}
function getActiveProfile() {
    const name = getActiveProfileName();
    if (!name) return null;
    return getProfiles().find(p => p.name === name) || null;
}
function profileSecretKey(profileName, kind) {
    return `efx.profile.${profileName}.${kind}`;
}
// Updates the inline description shown next to "EFx Libraries" / "BPM Methods"
// in the view title bar. Format: "Profile / Company". Empty when no active profile.
function updateViewDescriptions() {
    const profileName = getActiveProfileName();
    const company = getActiveCompany();
    const desc = (profileName && company)
        ? `${profileName} / ${company}`
        : (profileName ? profileName : "");
    if (efxLibrariesView) efxLibrariesView.description = desc;
    if (bpmMethodsView) bpmMethodsView.description = desc;
}

async function openProfileManager(context) {
    const profiles = getProfiles();
    const activeName = getActiveProfileName();
    const items = [];
    items.push({
        label: "$(add) New Profile…",
        description: "Create a new Epicor environment profile",
        action: "new",
    });
    for (const p of profiles) {
        const isActive = p.name === activeName;
        items.push({
            label: `${isActive ? "$(check) " : "$(blank) "}${p.name}`,
            description: p.serverUrl || "",
            detail: `${p.username || "(no user)"} • ${(p.companies || []).join(", ") || "no companies"}`,
            action: "use",
            profileName: p.name,
        });
    }
    if (profiles.length > 0) {
        items.push({ label: "$(edit) Edit Profile…", action: "edit" });
        items.push({ label: "$(trash) Delete Profile…", action: "delete" });
    }
    const pick = await vscode.window.showQuickPick(items, {
        placeHolder: profiles.length === 0
            ? "No profiles yet — create your first one"
            : `Select a profile to activate, or manage profiles (${profiles.length} configured)`,
        ignoreFocusOut: true,
    });
    if (!pick) return;
    if (pick.action === "new") {
        await createProfile(context);
    }
    else if (pick.action === "use") {
        await activateProfile(context, pick.profileName);
    }
    else if (pick.action === "edit") {
        const target = await pickProfile("Select profile to edit");
        if (target) await editProfile(context, target);
    }
    else if (pick.action === "delete") {
        const target = await pickProfile("Select profile to delete");
        if (target) await deleteProfile(context, target);
    }
}

async function pickProfile(placeHolder) {
    const profiles = getProfiles();
    if (profiles.length === 0) {
        vscode.window.showInformationMessage("EFx: No profiles configured.");
        return null;
    }
    const pick = await vscode.window.showQuickPick(
        profiles.map(p => ({
            label: p.name,
            description: p.serverUrl || "",
            detail: p.username || "",
            profileName: p.name,
        })),
        { placeHolder, ignoreFocusOut: true }
    );
    return pick ? pick.profileName : null;
}

async function createProfile(context) {
    const draft = {
        name: "",
        serverUrl: "",
        username: "",
        companies: [],
    };
    const ok = await runProfileEditor(context, draft, /*isNew*/ true);
    if (!ok) return;
    const profiles = getProfiles();
    if (profiles.some(p => p.name === draft.name)) {
        vscode.window.showErrorMessage(`EFx: Profile "${draft.name}" already exists.`);
        return;
    }
    profiles.push(draft);
    await setProfiles(profiles);
    // Auto-activate if first profile or user confirms
    if (profiles.length === 1 || await confirmActivate(draft.name)) {
        await activateProfile(context, draft.name);
    }
    else {
        vscode.window.showInformationMessage(`EFx: Profile "${draft.name}" saved.`);
    }
}

async function confirmActivate(name) {
    const pick = await vscode.window.showQuickPick(
        [{ label: "Activate now", value: true }, { label: "Save only", value: false }],
        { placeHolder: `Activate profile "${name}"?`, ignoreFocusOut: true }
    );
    return pick ? pick.value : false;
}

async function editProfile(context, profileName) {
    const profiles = getProfiles();
    const idx = profiles.findIndex(p => p.name === profileName);
    if (idx < 0) return;
    const draft = JSON.parse(JSON.stringify(profiles[idx]));
    const originalName = draft.name;
    const ok = await runProfileEditor(context, draft, /*isNew*/ false);
    if (!ok) return;
    // If renamed, move secrets
    if (draft.name !== originalName) {
        const oldPwd = await context.secrets.get(profileSecretKey(originalName, "password"));
        const oldKey = await context.secrets.get(profileSecretKey(originalName, "apiKey"));
        if (oldPwd) await context.secrets.store(profileSecretKey(draft.name, "password"), oldPwd);
        if (oldKey) await context.secrets.store(profileSecretKey(draft.name, "apiKey"), oldKey);
        await context.secrets.delete(profileSecretKey(originalName, "password"));
        await context.secrets.delete(profileSecretKey(originalName, "apiKey"));
        if (getActiveProfileName() === originalName) {
            await setActiveProfileName(draft.name);
        }
    }
    profiles[idx] = draft;
    await setProfiles(profiles);
    // Reload client if this is active
    if (getActiveProfileName() === draft.name) {
        await activateProfile(context, draft.name);
    }
    else {
        vscode.window.showInformationMessage(`EFx: Profile "${draft.name}" updated.`);
    }
}

async function deleteProfile(context, profileName) {
    const confirm = await vscode.window.showWarningMessage(
        `Delete profile "${profileName}"? This will remove its stored credentials.`,
        { modal: true },
        "Delete"
    );
    if (confirm !== "Delete") return;
    const profiles = getProfiles().filter(p => p.name !== profileName);
    await setProfiles(profiles);
    await context.secrets.delete(profileSecretKey(profileName, "password"));
    await context.secrets.delete(profileSecretKey(profileName, "apiKey"));
    if (getActiveProfileName() === profileName) {
        await setActiveProfileName("");
        await setActiveCompany("");
        client = null;
        bpmClientInst = null;
        treeProvider.setClient(null);
        bpmTreeProvider.setClient(null);
        updateViewDescriptions();
    }
    vscode.window.showInformationMessage(`EFx: Profile "${profileName}" deleted.`);
}

// Edits a profile draft in place. Returns true if completed, false if cancelled.
async function runProfileEditor(context, draft, isNew) {
    // Step 1: name
    const name = await vscode.window.showInputBox({
        ...PROFILE_INPUT_OPTS,
        prompt: isNew ? "Profile name (e.g. Dev, Prod, Pilot)" : "Profile name",
        value: draft.name,
        validateInput: (v) => {
            if (!v || !v.trim()) return "Name is required";
            if (!/^[A-Za-z0-9_\-. ]+$/.test(v)) return "Use letters, numbers, space, dash, dot, underscore";
            return null;
        },
    });
    if (name === undefined) return false;
    draft.name = name.trim();

    // Step 2: server URL
    const serverUrl = await vscode.window.showInputBox({
        ...PROFILE_INPUT_OPTS,
        prompt: "Epicor Server URL",
        value: draft.serverUrl,
        placeHolder: "https://your-epicor-server/your-app",
        validateInput: (v) => (!v || !v.trim()) ? "Server URL is required" : null,
    });
    if (serverUrl === undefined) return false;
    draft.serverUrl = serverUrl.trim();

    // Step 3: username
    const username = await vscode.window.showInputBox({
        ...PROFILE_INPUT_OPTS,
        prompt: "Username",
        value: draft.username,
        validateInput: (v) => (!v || !v.trim()) ? "Username is required" : null,
    });
    if (username === undefined) return false;
    draft.username = username.trim();

    // Step 4: password — only prompt for new profiles, or if user opts in for edits.
    // Track the resolved password locally so we can use it for company discovery
    // without an extra SecretStorage round-trip.
    let resolvedPassword = isNew
        ? null
        : await context.secrets.get(profileSecretKey(draft.name, "password"));
    let promptForPassword = isNew;
    if (!isNew) {
        const pwdChoice = await vscode.window.showQuickPick(
            [
                { label: "Keep existing password", value: false },
                { label: "Change password", value: true },
            ],
            { placeHolder: "Password", ignoreFocusOut: true }
        );
        if (!pwdChoice) return false;
        promptForPassword = pwdChoice.value;
    }
    if (promptForPassword) {
        const password = await vscode.window.showInputBox({
            ...PROFILE_INPUT_OPTS,
            prompt: `Password for ${draft.username}`,
            password: true,
            validateInput: (v) => (!v) ? "Password is required" : null,
        });
        if (password === undefined) return false;
        await context.secrets.store(profileSecretKey(draft.name, "password"), password);
        resolvedPassword = password;
    }

    // Step 5: API key
    let resolvedApiKey = isNew
        ? ""
        : ((await context.secrets.get(profileSecretKey(draft.name, "apiKey"))) || "");
    let promptForApiKey = isNew;
    if (!isNew) {
        const keyChoice = await vscode.window.showQuickPick(
            [
                { label: "Keep existing API key", value: false },
                { label: "Change API key", value: true },
                { label: "Clear API key", value: "clear" },
            ],
            { placeHolder: "API Key", ignoreFocusOut: true }
        );
        if (!keyChoice) return false;
        if (keyChoice.value === "clear") {
            await context.secrets.delete(profileSecretKey(draft.name, "apiKey"));
            resolvedApiKey = "";
            promptForApiKey = false;
        }
        else {
            promptForApiKey = keyChoice.value === true;
        }
    }
    if (promptForApiKey) {
        const apiKey = await vscode.window.showInputBox({
            ...PROFILE_INPUT_OPTS,
            prompt: "API Key (leave blank if not required)",
            password: true,
            value: "",
        });
        if (apiKey === undefined) return false;
        await context.secrets.store(profileSecretKey(draft.name, "apiKey"), apiKey || "");
        resolvedApiKey = apiKey || "";
    }

    // Step 6: companies — try auto-discovery first, fall back to manual.
    const companiesResult = await resolveCompanies(context, draft, resolvedPassword, resolvedApiKey);
    if (companiesResult === undefined) return false;
    draft.companies = companiesResult;

    // Step 7: auto-push on save
    const autoPushPick = await vscode.window.showQuickPick(
        [
            { label: "No — push manually", value: false },
            { label: "Yes — auto-push on file save", value: true },
        ],
        { placeHolder: "Auto-push changes to Epicor when you save a .cs file?", ignoreFocusOut: true }
    );
    if (autoPushPick === undefined) return false;
    draft.autoPush = autoPushPick.value;

    return true;
}

// Resolves the company list for a profile draft.
// On new profiles → asks for a default/seed company, fetches the list, multi-selects.
// On edits → offers re-fetch, multi-select from existing, or manual entry.
// Returns array of company codes, or undefined if cancelled.
async function resolveCompanies(context, draft, password, apiKey) {
    const isNew = !draft.companies || draft.companies.length === 0;

    // For edits, ask what they want to do.
    let action;
    if (isNew) {
        action = "fetch";
    }
    else {
        const items = [];
        // Only offer "switch active" when this draft IS the active profile
        // and has 2+ companies. Otherwise it's meaningless.
        const isActiveProfile = getActiveProfileName() === draft.name;
        const currentActiveCompany = getActiveCompany();
        if (isActiveProfile && draft.companies.length > 1) {
            items.push({
                label: "$(arrow-right) Switch active company",
                description: `currently ${currentActiveCompany || "(none)"}`,
                value: "switch",
            });
        }
        items.push({ label: "$(check) Keep current selection", description: (draft.companies || []).join(", "), value: "keep" });
        items.push({ label: "$(refresh) Re-fetch from server", description: "Discover companies again via UserFile", value: "fetch" });
        items.push({ label: "$(list-selection) Pick from current list", description: "Multi-select among already saved companies", value: "pick" });
        items.push({ label: "$(edit) Enter manually", description: "Comma-separated list", value: "manual" });
        const choice = await vscode.window.showQuickPick(items, { placeHolder: "Companies", ignoreFocusOut: true });
        if (!choice) return undefined;
        action = choice.value;
        if (action === "keep") return draft.companies;
        if (action === "switch") {
            // Switch active company without modifying the list.
            const target = await vscode.window.showQuickPick(
                draft.companies.map(c => ({
                    label: `${c === currentActiveCompany ? "$(check) " : "$(blank) "}${c}`,
                    company: c,
                })),
                { placeHolder: `Active company (profile: ${draft.name})`, ignoreFocusOut: true }
            );
            if (!target) return undefined;
            if (target.company !== currentActiveCompany) {
                await applyActiveCompany(context, target.company);
            }
            return draft.companies; // list unchanged
        }
    }

    if (action === "fetch") {
        const fetched = await fetchCompaniesFlow(draft, password, apiKey);
        if (fetched === undefined) return undefined;
        return fetched;
    }

    if (action === "pick") {
        const picked = await multiPickCompanies(draft.companies, draft.companies);
        return picked; // may be undefined on cancel
    }

    // Manual entry
    return await manualCompaniesInput(draft.companies);
}

async function fetchCompaniesFlow(draft, password, apiKey) {
    if (!password) {
        vscode.window.showWarningMessage("EFx: Cannot fetch companies — no password available. Falling back to manual entry.");
        return await manualCompaniesInput(draft.companies);
    }

    // Ask for a seed/default company to authenticate against.
    const seedDefault = (draft.companies && draft.companies[0]) || "";
    const seedCompany = await vscode.window.showInputBox({
        ...PROFILE_INPUT_OPTS,
        prompt: "Default company (used to authenticate the discovery call)",
        placeHolder: "your default company code",
        value: seedDefault,
        validateInput: (v) => (!v || !v.trim()) ? "Default company is required" : null,
    });
    if (seedCompany === undefined) return undefined;
    const seed = seedCompany.trim();

    let fetched;
    try {
        fetched = await vscode.window.withProgress(
            { location: vscode.ProgressLocation.Notification, title: `Fetching companies for ${draft.username}...` },
            async () => {
                const tempClient = new epicorClient_1.EpicorClient({
                    serverUrl: draft.serverUrl,
                    company: seed,
                    username: draft.username,
                    password,
                    apiKey: apiKey || "",
                });
                return await tempClient.getUserCompanies();
            }
        );
    }
    catch (err) {
        const fallback = await vscode.window.showErrorMessage(
            `EFx: Could not fetch companies — ${err.message}`,
            { modal: false },
            "Enter Manually",
            "Cancel"
        );
        if (fallback !== "Enter Manually") return undefined;
        return await manualCompaniesInput([seed]);
    }

    if (!fetched || fetched.length === 0) {
        const fallback = await vscode.window.showWarningMessage(
            `EFx: Server returned no companies for user "${draft.username}". Enter manually?`,
            "Enter Manually",
            "Cancel"
        );
        if (fallback !== "Enter Manually") return undefined;
        return await manualCompaniesInput([seed]);
    }

    // Multi-select with all pre-checked, but ensure the seed is present.
    const all = Array.from(new Set([seed, ...fetched]));
    const picked = await multiPickCompanies(all, all);
    return picked;
}

async function multiPickCompanies(allCompanies, preselected) {
    const preset = new Set(preselected || []);
    const items = allCompanies.map(c => ({
        label: c,
        picked: preset.has(c),
    }));
    const picked = await vscode.window.showQuickPick(items, {
        canPickMany: true,
        placeHolder: "Select companies to include in this profile",
        ignoreFocusOut: true,
    });
    if (!picked) return undefined;
    if (picked.length === 0) {
        vscode.window.showWarningMessage("EFx: At least one company is required.");
        return undefined;
    }
    return picked.map(p => p.label);
}

async function manualCompaniesInput(existing) {
    const companiesStr = await vscode.window.showInputBox({
        ...PROFILE_INPUT_OPTS,
        prompt: "Companies (comma-separated)",
        value: (existing || []).join(", "),
        validateInput: (v) => {
            if (!v || !v.trim()) return "At least one company is required";
            const list = v.split(",").map(s => s.trim()).filter(Boolean);
            if (list.length === 0) return "At least one company is required";
            return null;
        },
    });
    if (companiesStr === undefined) return undefined;
    return companiesStr.split(",").map(s => s.trim()).filter(Boolean);
}

async function activateProfile(context, profileName) {
    const profile = getProfiles().find(p => p.name === profileName);
    if (!profile) {
        vscode.window.showErrorMessage(`EFx: Profile "${profileName}" not found.`);
        return;
    }
    const password = await context.secrets.get(profileSecretKey(profileName, "password"));
    if (!password) {
        vscode.window.showErrorMessage(`EFx: No password stored for "${profileName}". Edit the profile to set one.`);
        return;
    }
    const apiKey = (await context.secrets.get(profileSecretKey(profileName, "apiKey"))) || "";
    // Pick company: keep current if still valid for this profile, else first
    let activeCompany = getActiveCompany();
    if (!profile.companies.includes(activeCompany)) {
        activeCompany = profile.companies[0];
    }
    await setActiveProfileName(profileName);
    await setActiveCompany(activeCompany);
    client = new epicorClient_1.EpicorClient({
        serverUrl: profile.serverUrl,
        company: activeCompany,
        username: profile.username,
        password,
        apiKey,
    });
    treeProvider.setClient(client);
    bpmClientInst = new bpmClient_1.BpmClient(client);
    bpmTreeProvider.setClient(bpmClientInst);
    await treeProvider.refresh();
    updateViewDescriptions();
    vscode.window.showInformationMessage(`EFx: Active profile "${profileName}" (company ${activeCompany})`);
}

async function switchActiveProfile(context) {
    const profiles = getProfiles();
    if (profiles.length === 0) {
        const pick = await vscode.window.showInformationMessage(
            "EFx: No profiles configured. Create one?",
            "Create Profile"
        );
        if (pick === "Create Profile") {
            await openProfileManager(context);
        }
        return;
    }
    const activeName = getActiveProfileName();
    const target = await vscode.window.showQuickPick(
        profiles.map(p => ({
            label: `${p.name === activeName ? "$(check) " : "$(blank) "}${p.name}`,
            description: p.serverUrl || "",
            profileName: p.name,
        })),
        { placeHolder: "Switch to profile", ignoreFocusOut: true }
    );
    if (!target) return;
    await activateProfile(context, target.profileName);
}

async function switchActiveCompany(context) {
    const profile = getActiveProfile();
    if (!profile) {
        vscode.window.showWarningMessage("EFx: No active profile. Manage Profiles first.");
        return;
    }
    if (!profile.companies || profile.companies.length === 0) {
        vscode.window.showWarningMessage(`EFx: Profile "${profile.name}" has no companies configured. Edit the profile to add some.`);
        return;
    }
    if (profile.companies.length === 1) {
        vscode.window.showInformationMessage(`EFx: Only one company in profile "${profile.name}" (${profile.companies[0]}).`);
        return;
    }
    const current = getActiveCompany();
    const target = await vscode.window.showQuickPick(
        profile.companies.map(c => ({
            label: `${c === current ? "$(check) " : "$(blank) "}${c}`,
            company: c,
        })),
        { placeHolder: `Active company (profile: ${profile.name})`, ignoreFocusOut: true }
    );
    if (!target) return;
    if (target.company === current) return; // no-op
    await applyActiveCompany(context, target.company);
}

// Shared helper: change the active company and rebuild the client.
// Used by switchActiveCompany and by the profile editor.
async function applyActiveCompany(context, company) {
    const profile = getActiveProfile();
    if (!profile) return;
    if (!profile.companies.includes(company)) {
        vscode.window.showErrorMessage(`EFx: "${company}" is not in profile "${profile.name}".`);
        return;
    }
    const password = await context.secrets.get(profileSecretKey(profile.name, "password"));
    if (!password) {
        vscode.window.showErrorMessage(`EFx: No password stored for "${profile.name}".`);
        return;
    }
    const apiKey = (await context.secrets.get(profileSecretKey(profile.name, "apiKey"))) || "";
    await setActiveCompany(company);
    client = new epicorClient_1.EpicorClient({
        serverUrl: profile.serverUrl,
        company,
        username: profile.username,
        password,
        apiKey,
    });
    treeProvider.setClient(client);
    bpmClientInst = new bpmClient_1.BpmClient(client);
    bpmTreeProvider.setClient(bpmClientInst);
    await treeProvider.refresh();
    updateViewDescriptions();
    vscode.window.showInformationMessage(`EFx: Active company → ${company}`);
}

function getEfxDir() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        return path.join(workspaceFolders[0].uri.fsPath, ".efx");
    }
    // Fallback to home dir.
    const homeDir = process.env.HOME || process.env.USERPROFILE || "/tmp";
    return path.join(homeDir, ".efx");
}
async function initClient(context) {
    const profileName = getActiveProfileName();
    if (!profileName) {
        return;
    }
    const profile = getProfiles().find(p => p.name === profileName);
    if (!profile) {
        return;
    }
    const password = await context.secrets.get(profileSecretKey(profileName, "password"));
    if (!password) {
        return;
    }
    const apiKey = (await context.secrets.get(profileSecretKey(profileName, "apiKey"))) || "";
    let activeCompany = getActiveCompany();
    if (!profile.companies.includes(activeCompany)) {
        activeCompany = profile.companies[0] || "";
    }
    if (!activeCompany) {
        return;
    }
    // Persist if we had to fall back to first company
    if (activeCompany !== getActiveCompany()) {
        await setActiveCompany(activeCompany);
    }
    client = new epicorClient_1.EpicorClient({
        serverUrl: profile.serverUrl,
        company: activeCompany,
        username: profile.username,
        password,
        apiKey,
    });
    treeProvider.setClient(client);
    bpmClientInst = new bpmClient_1.BpmClient(client);
    bpmTreeProvider.setClient(bpmClientInst);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map