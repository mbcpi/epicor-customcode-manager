"use strict";
// ═══════════════════════════════════════════════════════════════════════════════
// FIND IN FUNCTIONS  —  a Cmd+F style popout over the whole function library
// ═══════════════════════════════════════════════════════════════════════════════
//
// Deliberately a native QuickPick, not a webview: it floats over whatever the
// user is doing, costs nothing to open, and needs no HTML. If this earns its
// keep, the same index feeds a full results panel later.
//
// The library corpus is fetched once per profile+company (one GetLibraries call
// for every library, the same endpoint the compare panel uses) and cached, so
// typing filters in-memory with no round-trips.
// ═══════════════════════════════════════════════════════════════════════════════

const vscode = require("vscode");
const { bodyCodeText } = require("./efxBody");

// Cache key is server+company so switching profiles can't show another
// environment's code. Cleared on refresh / after a push.
let corpusCache = null; // { key, loadedAt, fns: [...], libCount }

// Cap items handed to the QuickPick. Beyond a few hundred the list stops being
// something a human reads, and rendering starts to lag per keystroke.
const MAX_ITEMS = 300;
// Per-line display width before we window around the match.
const MAX_SNIPPET = 200;

function clearSearchCache() {
    corpusCache = null;
}

function cacheKey(client) {
    return `${client.config.serverUrl}|${client.config.company}`;
}

function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─────────────────────────────────────────────────────────────────────────────
// Corpus
// ─────────────────────────────────────────────────────────────────────────────

async function loadCorpus(client) {
    const list = await client.getLibraryList();
    const ids = [...new Set(list.map(l => l.LibraryID))].sort();
    if (!ids.length) {
        return { key: cacheKey(client), loadedAt: Date.now(), fns: [], libCount: 0 };
    }

    const raw = await client.request(client.getDesignerUrl("GetLibraries"), { libraryIds: ids });
    // request() hands back the raw string when a 2xx body isn't JSON. Treating
    // that as an empty tableset would render as "no matches anywhere" — a
    // silently wrong answer. Fail loudly instead.
    if (!raw || typeof raw !== "object") {
        throw new Error(`Unexpected GetLibraries response — expected JSON, got ${typeof raw}.`);
    }
    const ts = raw.returnObj || raw;

    const fns = [];
    for (const fn of (ts.EfxFunction || [])) {
        // bodyCodeText covers both shapes: a code function's Code column and
        // every custom-code widget of a widget-based one.
        const code = bodyCodeText(fn.Body);
        if (!code) continue;
        fns.push({
            libraryId: fn.LibraryID,
            functionId: fn.FunctionID,
            description: fn.Description || "",
            lines: String(code || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n"),
        });
    }
    fns.sort((a, b) =>
        a.libraryId.localeCompare(b.libraryId) || a.functionId.localeCompare(b.functionId));

    return { key: cacheKey(client), loadedAt: Date.now(), fns, libCount: ids.length };
}

async function getCorpus(client, force) {
    const key = cacheKey(client);
    if (!force && corpusCache && corpusCache.key === key) {
        return corpusCache;
    }
    corpusCache = await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: "EFx: Indexing function library…" },
        () => loadCorpus(client));
    return corpusCache;
}

// ─────────────────────────────────────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────────────────────────────────────

function buildRegex(query, opts) {
    let src = opts.regex ? query : escapeRe(query);
    if (opts.word) src = `\\b${src}\\b`;
    return new RegExp(src, opts.caseSensitive ? "g" : "gi");
}

function firstMatch(re, text) {
    re.lastIndex = 0;
    const m = re.exec(text);
    // A zero-length match (e.g. the regex `x*`) matches every line and tells the
    // user nothing — treat it as no match rather than listing the whole library.
    return m && m[0].length > 0 ? m : null;
}

// Trim indentation and window long lines around the match, keeping the match
// offsets valid for display.
function snippet(rawLine, col, len) {
    const lead = rawLine.length - rawLine.replace(/^\s+/, "").length;
    let text = rawLine.slice(lead);
    let start = col - lead;
    if (text.length > MAX_SNIPPET) {
        const from = Math.max(0, start - 30);
        text = (from > 0 ? "…" : "") + text.slice(from, from + MAX_SNIPPET);
        start = start - from + (from > 0 ? 1 : 0);
    }
    return { text, start, end: start + len };
}

function search(corpus, query, opts, libraryFilter) {
    const re = buildRegex(query, opts); // may throw on a bad regex — caller handles
    const hits = [];
    let total = 0;

    for (const fn of corpus.fns) {
        if (libraryFilter && fn.libraryId !== libraryFilter) continue;

        // A function whose *name* matches is worth surfacing even when its body
        // doesn't mention the term — that's usually what you were after.
        if (firstMatch(re, fn.functionId)) {
            total++;
            if (hits.length < MAX_ITEMS) {
                hits.push({ fn, line: 0, col: 0, len: 0, kind: "name" });
            }
        }

        for (let i = 0; i < fn.lines.length; i++) {
            const m = firstMatch(re, fn.lines[i]);
            if (!m) continue;
            total++;
            if (hits.length < MAX_ITEMS) {
                hits.push({ fn, line: i + 1, col: m.index, len: m[0].length, kind: "code" });
            }
        }
    }

    return { hits, total };
}

function toItems(result, corpus) {
    const items = result.hits.map(hit => {
        if (hit.kind === "name") {
            return {
                label: `$(symbol-function) ${hit.fn.functionId}`,
                description: `${hit.fn.libraryId} — function name`,
                detail: hit.fn.description || undefined,
                alwaysShow: true,
                hit,
            };
        }
        const s = snippet(hit.fn.lines[hit.line - 1], hit.col, hit.len);
        return {
            label: s.text || "(blank line)",
            description: `${hit.fn.libraryId}.${hit.fn.functionId}:${hit.line}`,
            alwaysShow: true,
            hit,
        };
    });

    if (result.total > result.hits.length) {
        items.push({
            label: `$(ellipsis) ${result.total - result.hits.length} more matches not shown`,
            description: `narrow the search — showing the first ${result.hits.length} of ${result.total}`,
            alwaysShow: true,
        });
    }
    if (!items.length) {
        items.push({
            label: "$(search-stop) No matches",
            description: `searched ${corpus.fns.length} functions`,
            alwaysShow: true,
        });
    }
    return items;
}

// ─────────────────────────────────────────────────────────────────────────────
// Open a hit
// ─────────────────────────────────────────────────────────────────────────────

// Pulled files carry a comment header (`// EFx Function:` … `// ------`) ahead
// of the code, so server line 1 is not document line 1. Locate the marker.
function codeStartLine(doc) {
    const max = Math.min(doc.lineCount, 12);
    for (let i = 0; i < max; i++) {
        const t = doc.lineAt(i).text;
        if (/^\/\/\s*(-{10,}|─{10,})/.test(t)) return i + 2; // marker, blank, code
        if (!t.startsWith("//") && t.trim() !== "") break;
    }
    return 0;
}

// Trust the marker offset only if the line it points at is the line we matched;
// a header that ever changes shape shouldn't land the cursor somewhere random.
function resolveLine(doc, hit) {
    if (hit.kind !== "code") return 0;
    const raw = hit.fn.lines[hit.line - 1];
    const guess = codeStartLine(doc) + hit.line - 1;
    if (guess < doc.lineCount && doc.lineAt(guess).text === raw) return guess;
    for (let i = 0; i < doc.lineCount; i++) {
        if (doc.lineAt(i).text === raw) return i;
    }
    return Math.min(Math.max(guess, 0), Math.max(doc.lineCount - 1, 0));
}

async function openHit(hit) {
    const { libraryId, functionId } = hit.fn;
    // Reuse the normal pull path so the file lands in the configured storage
    // location and stays wired up for push.
    await vscode.commands.executeCommand("efx.pullFunction", {
        libraryId,
        func: { FunctionID: functionId },
        signatures: [],
    });

    const editor = vscode.window.activeTextEditor;
    if (!editor || !editor.document.fileName.endsWith(`${functionId}.cs`)) return;

    const line = resolveLine(editor.document, hit);
    const lineLen = editor.document.lineAt(line).text.length;
    const from = hit.kind === "code" ? Math.min(hit.col, lineLen) : 0;
    const to = hit.kind === "code" ? Math.min(hit.col + hit.len, lineLen) : 0;
    const range = new vscode.Range(line, from, line, to);
    editor.selection = new vscode.Selection(range.start, range.end);
    editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
}

// ─────────────────────────────────────────────────────────────────────────────
// The popout
// ─────────────────────────────────────────────────────────────────────────────

const BTN = {
    case: { iconPath: new vscode.ThemeIcon("case-sensitive"), tooltip: "Toggle Match Case" },
    word: { iconPath: new vscode.ThemeIcon("whole-word"), tooltip: "Toggle Match Whole Word" },
    regex: { iconPath: new vscode.ThemeIcon("regex"), tooltip: "Toggle Use Regular Expression" },
    reload: { iconPath: new vscode.ThemeIcon("refresh"), tooltip: "Re-index the function library" },
};

function ago(ts) {
    const s = Math.round((Date.now() - ts) / 1000);
    if (s < 60) return "just now";
    const m = Math.round(s / 60);
    return m < 60 ? `${m}m ago` : `${Math.round(m / 60)}h ago`;
}

async function openFunctionSearch(client, opts = {}) {
    if (!client) {
        vscode.window.showWarningMessage("EFx: Configure connection first (gear icon)");
        return;
    }

    let corpus;
    try {
        corpus = await getCorpus(client, false);
    } catch (err) {
        vscode.window.showErrorMessage(`EFx Find: could not index the library: ${err.message}`);
        return;
    }

    const libraryFilter = opts.libraryId || null;
    const flags = { caseSensitive: false, word: false, regex: false };

    const qp = vscode.window.createQuickPick();
    qp.buttons = [BTN.case, BTN.word, BTN.regex, BTN.reload];
    qp.matchOnDescription = false;
    qp.matchOnDetail = false;
    // Every item carries alwaysShow, so the built-in fuzzy filter stays out of
    // the way and the list is exactly what our own search produced.
    qp.ignoreFocusOut = false;

    const on = f => (flags[f] ? "on" : "off");
    const setTitle = (note) => {
        const scope = libraryFilter ? `in ${libraryFilter}` : "in all libraries";
        qp.title = `Find in Functions — ${scope}  ·  Aa ${on("case")}  ·  ab ${on("word")}  ·  .* ${on("regex")}${note ? `  ·  ${note}` : ""}`;
    };
    const setPlaceholder = () => {
        const n = libraryFilter
            ? corpus.fns.filter(f => f.libraryId === libraryFilter).length
            : corpus.fns.length;
        qp.placeholder = `Search ${n} function${n === 1 ? "" : "s"} · ${client.config.company} · indexed ${ago(corpus.loadedAt)}`;
    };

    const render = () => {
        const query = qp.value;
        if (!query) {
            qp.items = [];
            setTitle();
            return;
        }
        try {
            const result = search(corpus, query, flags, libraryFilter);
            qp.items = toItems(result, corpus);
            setTitle(`${result.total} match${result.total === 1 ? "" : "es"}`);
        } catch (err) {
            // Only reachable in regex mode, while the pattern is half-typed.
            qp.items = [{ label: "$(error) Invalid regular expression", description: err.message, alwaysShow: true }];
            setTitle();
        }
    };

    qp.onDidChangeValue(render);

    qp.onDidTriggerButton(async (btn) => {
        if (btn === BTN.reload) {
            qp.busy = true;
            try {
                corpus = await getCorpus(client, true);
            } catch (err) {
                vscode.window.showErrorMessage(`EFx Find: re-index failed: ${err.message}`);
            }
            qp.busy = false;
            setPlaceholder();
        } else if (btn === BTN.case) flags.caseSensitive = !flags.caseSensitive;
        else if (btn === BTN.word) flags.word = !flags.word;
        else if (btn === BTN.regex) flags.regex = !flags.regex;
        render();
    });

    qp.onDidAccept(async () => {
        const picked = qp.selectedItems[0];
        if (!picked || !picked.hit) return; // informational rows
        qp.hide();
        try {
            await openHit(picked.hit);
        } catch (err) {
            vscode.window.showErrorMessage(`EFx Find: could not open ${picked.hit.fn.functionId}: ${err.message}`);
        }
    });

    qp.onDidHide(() => qp.dispose());

    // Seed from the editor selection, the way Cmd+F does.
    const sel = vscode.window.activeTextEditor?.selection;
    const seed = sel && !sel.isEmpty && sel.isSingleLine
        ? vscode.window.activeTextEditor.document.getText(sel).trim()
        : "";
    if (seed) qp.value = seed;

    setPlaceholder();
    render();
    qp.show();
}

module.exports = { openFunctionSearch, clearSearchCache };
