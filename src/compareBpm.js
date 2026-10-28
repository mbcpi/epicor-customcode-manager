"use strict";
// ═══════════════════════════════════════════════════════════════════════════════
// BPM COMPARE  (host side)
//
// Directive bodies come in two storage formats now:
//   • XAML  — classic designer (DirectiveDefinition2 …)
//   • JSON  — Kinetic BPM Designer saves Body as {Version:3, Nodes, Links, …}
// Both are rendered to the same style of canonical text (walk-order numbered
// nodes, code inline, positions split into their own "layout" text). When the
// two sides of a pair are in different formats, the caller re-fetches both via
// BpMethodSvc/GetKineticDirective so the server's own XAML→JSON conversion
// makes them comparable.
// ═══════════════════════════════════════════════════════════════════════════════

const { parseDirective, directiveToCanonicalText, looksLikeFlowXaml } = require("./widgetXaml");
const { formatBpmBodyXaml } = require("./bpmClient");

const TYPE_LABEL = { 1: 'Pre', 2: 'Base', 3: 'Post' };

// ── format detection ───────────────────────────────────────────────────────────

function tryParseJson(s) {
    if (s && typeof s === 'object') return s;
    if (typeof s !== 'string') return null;
    const t = s.trim();
    if (!t.startsWith('{')) return null;
    try { return JSON.parse(t); } catch { return null; }
}

function bodyFormat(body) {
    if (!body || !String(body).trim()) return 'empty';
    const j = tryParseJson(body);
    if (j && (j.Nodes || j.Links || j.Version !== undefined)) return 'json';
    if (looksLikeFlowXaml(body)) return 'xaml';
    return 'other';
}

// ── JSON (Version 3) model ─────────────────────────────────────────────────────

// Json.NET TypeNameHandling wraps collections as {$type, $values:[…]}.
function unwrap(v) {
    if (Array.isArray(v)) return v.map(unwrap);
    if (v && typeof v === 'object') {
        if (Array.isArray(v.$values)) return v.$values.map(unwrap);
        const o = {};
        for (const k of Object.keys(v)) o[k] = unwrap(v[k]);
        return o;
    }
    return v;
}

function shortType(t) {
    if (!t) return '';
    const head = String(t).split(',')[0];
    return head.slice(head.lastIndexOf('.') + 1);
}

function sortKeysDeep(v) {
    if (Array.isArray(v)) return v.map(sortKeysDeep);
    if (v && typeof v === 'object') return Object.keys(v).sort().reduce((a, k) => { a[k] = sortKeysDeep(v[k]); return a; }, {});
    return v;
}
const compact = v => (v && typeof v === 'object') ? JSON.stringify(sortKeysDeep(v)) : String(v);

const SKIP_PROPS = new Set(['$type', 'Id', 'Code', 'VisualProperties', 'ValidationState']);

function propLines(obj, indent) {
    const out = [];
    if (!obj || typeof obj !== 'object') return out;
    for (const k of Object.keys(obj).sort()) {
        if (SKIP_PROPS.has(k) || k.startsWith('_')) continue;
        const v = obj[k];
        if (v === null || v === undefined || v === '') continue;
        out.push(indent + k + ' = ' + compact(v));
    }
    return out;
}

function codeLines(code, indent) {
    return String(code).replace(/\r\n/g, '\n').split('\n').map(l => indent + '| ' + l);
}

function jsonToCanonical(bodyOrObj) {
    const raw = tryParseJson(bodyOrObj);
    if (!raw) return null;
    const m = unwrap(raw);
    const nodes = Array.isArray(m.Nodes) ? m.Nodes : [];
    const L = m.Links || m;
    const next = L.NextNodes || {}, tru = L.TrueNodes || {}, fal = L.FalseNodes || {};
    const byId = new Map(nodes.map(n => [String(n.Id), n]));

    // Walk order from the start node (depth-first, True before False), then
    // any unreachable nodes in stored order so nothing silently disappears.
    const order = [], seen = new Set();
    const visit = id => {
        if (id == null) return;
        id = String(id);
        if (seen.has(id) || !byId.has(id)) return;
        seen.add(id); order.push(id);
        visit(next[id]); visit(tru[id]); visit(fal[id]);
    };
    visit(L.StartNodeId);
    for (const n of nodes) if (!seen.has(String(n.Id))) { seen.add(String(n.Id)); order.push(String(n.Id)); }
    const num = new Map(order.map((id, i) => [id, i + 1]));
    const tgt = id => (id == null ? '(end)' : '[' + (num.get(String(id)) ?? '?') + ']');

    const text = [], code = [], layout = [];
    const graph = { nodes: [], edges: [] };
    if (m.AdditionalUsings) text.push('Usings = ' + compact(m.AdditionalUsings));
    if (m.AdditionalReferences && (!Array.isArray(m.AdditionalReferences) || m.AdditionalReferences.length)) text.push('References = ' + compact(m.AdditionalReferences));
    if (Array.isArray(m.Variables) && m.Variables.length) {
        for (const v of m.Variables) text.push('Variable ' + (v.Name || '?') + ' : ' + compact(v.TypeData || v.Type || ''));
    }
    if (text.length) text.push('');
    if (m.VisualProperties) layout.push('(directive) ' + compact(m.VisualProperties));

    order.forEach((id, i) => {
        const n = byId.get(id), idx = i + 1;
        const kind = shortType(n.$type);
        const isCond = kind === 'DirectiveCondition' || !!n.Condition;
        const widget = isCond ? 'Condition' : shortType(n.Action && n.Action.$type) || kind || '(unknown)';
        const title = '[' + idx + '] ' + (isCond ? 'Condition' : 'Step') + ': ' + widget + (n.DisplayName ? '  "' + n.DisplayName + '"' : '');
        const nodeStart = text.length;
        text.push(title);
        if (isCond) {
            const items = (n.Condition && n.Condition.Items) || [];
            items.forEach((it, j) => {
                const c = it.Condition || {};
                text.push('    Condition ' + (j + 1) + ': ' + (j > 0 && it.Operator != null ? it.Operator + ' ' : '') + shortType(c.$type));
                text.push(...propLines(c, '        '));
                if (c.Code) {
                    text.push(...codeLines(c.Code, '        '));
                    code.push('// [' + idx + '] condition ' + (j + 1) + ' ' + shortType(c.$type), String(c.Code), '');
                }
            });
            text.push(...propLines(n.Condition, '    ').filter(l => !l.trim().startsWith('Items =')));
            text.push('    True -> ' + tgt(tru[id]));
            text.push('    False -> ' + tgt(fal[id]));
        } else {
            const a = n.Action || {};
            text.push(...propLines(a, '    '));
            if (a.Code) {
                text.push('    Code:', ...codeLines(a.Code, '      '));
                code.push('// [' + idx + '] ' + widget + (n.DisplayName ? ' "' + n.DisplayName + '"' : ''), String(a.Code), '');
            }
            text.push('    -> ' + tgt(next[id]));
        }
        const vp = n.VisualProperties || {};
        graph.nodes.push({ n: idx, kind: isCond ? 'condition' : 'step', widget, label: n.DisplayName || '',
            x: +vp.ElementX || 0, y: +vp.ElementY || 0, sig: text.slice(nodeStart + 1).filter(l => !/^\s*(True |False )?-> /.test(l)).join('\n') });
        if (isCond) {
            graph.edges.push({ from: idx, to: num.get(String(tru[id])) || null, label: 'True' });
            graph.edges.push({ from: idx, to: num.get(String(fal[id])) || null, label: 'False' });
        } else if (next[id] != null) graph.edges.push({ from: idx, to: num.get(String(next[id])) || null, label: '' });
        text.push('');
        layout.push('[' + idx + '] ' + widget + '  ' + compact(vp));
    });
    return { text: text.join('\n'), code: code.join('\n'), layout: layout.join('\n'), graph };
}

// ── XAML model (classic) ───────────────────────────────────────────────────────

function xamlToCanonical(body) {
    const text = directiveToCanonicalText(body);
    if (text == null) return { text: formatBpmBodyXaml(body), code: '', layout: '', graph: null };
    const code = [], layout = [];
    const graph = { nodes: [], edges: [] };
    try {
        const p = parseDirective(body);
        const num = new Map((p?.nodes || []).map((n, i) => [n.id, i + 1]));
        for (const e of (p?.edges || [])) {
            if (num.has(e.from)) graph.edges.push({ from: num.get(e.from), to: e.to == null ? null : (num.get(e.to) || null), label: e.label || '' });
        }
        (p?.nodes || []).forEach((n, i) => {
            const w = n.widget || {}, idx = i + 1;
            const { attrs, ...rest } = w;
            const sigAttrs = {};
            for (const k of Object.keys(attrs || {}).sort()) if (!k.startsWith('x:') && !k.startsWith('xmlns') && k !== 'Id' && k !== 'ValidationState') sigAttrs[k] = attrs[k];
            graph.nodes.push({ n: idx, kind: n.type === 'condition' ? 'condition' : 'step', widget: n.type === 'condition' ? 'Condition' : (w.localName || n.type),
                label: (n._el && n._el.getAttribute && n._el.getAttribute('DisplayName')) || '', x: +n.x || 0, y: +n.y || 0,
                sig: compact({ ...rest, attrs: sigAttrs }) });
            if (w.code != null) code.push('// [' + idx + '] ' + (w.localName || ''), String(w.code), '');
            (w.conditions || []).forEach((c, j) => {
                if (c.attrs && c.attrs.Code) code.push('// [' + idx + '] condition ' + (j + 1) + ' ' + c.localName, String(c.attrs.Code), '');
            });
            layout.push('[' + idx + '] ' + (w.localName || n.type) + '  x=' + n.x + ' y=' + n.y);
        });
    } catch { /* text already rendered; code/layout/graph stay partial */ }
    return { text, code: code.join('\n'), layout: layout.join('\n'), graph };
}

function canonicalizeBody(body) {
    const format = bodyFormat(body);
    if (format === 'empty') return { format, text: '', code: '', layout: '', graph: null };
    if (format === 'json') return { format, ...(jsonToCanonical(body) || { text: String(body), code: '', layout: '', graph: null }) };
    if (format === 'xaml') return { format, ...xamlToCanonical(body) };
    return { format, text: String(body), code: '', layout: '', graph: null };
}

// ── row → directive entry ──────────────────────────────────────────────────────

function directiveKey(d) {
    return [d.Source || 'BO', d.BpMethodCode, d.DirectiveType, d.Name].join('|');
}

function toEntry(d, methodRow) {
    const c = d._canon || canonicalizeBody(d.Body || '');
    return {
        key: directiveKey(d), Source: d.Source || 'BO', BpMethodCode: d.BpMethodCode,
        DirectiveID: d.DirectiveID || '', Name: d.Name || '', DirectiveType: d.DirectiveType,
        IsEnabled: d.IsEnabled, Order: d.Order ?? d.Sequence ?? '', DirectiveGroup: d.DirectiveGroup || '',
        MethodDisabled: !!(methodRow && methodRow.Disabled),
        format: c.format, origFormat: d._origFormat || c.format, normalized: !!d._normalized,
        text: c.text, code: c.code, layout: c.layout, graph: c.graph || null,
    };
}

const FIELD_KEYS = [['Widgets', 'text'], ['Code', 'code']];
const META_KEYS  = ['DirectiveType', 'IsEnabled', 'Order', 'DirectiveGroup', 'MethodDisabled'];

function compareEntries(a, b) {
    const fields = {}; let hasDiff = false;
    for (const [label, k] of FIELD_KEYS) {
        // Big text stays on the entries (a.text / b.text) — not duplicated here.
        const same = (a[k] || '') === (b[k] || '');
        if (!same) hasDiff = true;
        fields[label] = { same };
    }
    for (const k of META_KEYS) {
        const va = String(a[k] ?? ''), vb = String(b[k] ?? ''), same = va === vb;
        if (!same) hasDiff = true;
        fields[k] = { a: va, b: vb, same };
    }
    // Positions are shown, never hidden — but a dragged widget alone does not
    // make a directive "different".
    fields.Layout = { same: (a.layout || '') === (b.layout || ''), infoOnly: true };
    fields.Format = { a: a.origFormat, b: b.origFormat, same: a.origFormat === b.origFormat, infoOnly: true };
    fields.hasDiff = hasDiff;
    return fields;
}

// methods*: BpMethod rows; dirs*: BpDirective rows (with Body or _canon)
function buildBpmCompare(methodsA, dirsA, methodsB, dirsB) {
    const mKey = m => (m.Source || 'BO') + '|' + m.BpMethodCode;
    const methA = new Map(methodsA.map(m => [mKey(m), m]));
    const methB = new Map(methodsB.map(m => [mKey(m), m]));
    const entA = new Map(), entB = new Map();
    for (const d of dirsA) { const e = toEntry(d, methA.get((d.Source || 'BO') + '|' + d.BpMethodCode)); entA.set(e.key, e); }
    for (const d of dirsB) { const e = toEntry(d, methB.get((d.Source || 'BO') + '|' + d.BpMethodCode)); entB.set(e.key, e); }

    const dirs = [];
    const keys = [...new Set([...entA.keys(), ...entB.keys()])].sort();
    for (const k of keys) {
        const a = entA.get(k) || null, b = entB.get(k) || null;
        if (a && b) {
            const fields = compareEntries(a, b);
            dirs.push({ key: k, status: fields.hasDiff ? 'diff' : 'match', a, b, fields, layoutDiff: !fields.Layout.same });
        } else dirs.push({ key: k, status: a ? 'only-a' : 'only-b', a, b, fields: null, layoutDiff: false });
    }

    // Rename detection: same DirectiveID on both sides (directives moved by
    // solution/export keep their GUID) within the same method.
    const onlyA = dirs.filter(d => d.status === 'only-a' && d.a.DirectiveID);
    const onlyB = dirs.filter(d => d.status === 'only-b' && d.b.DirectiveID);
    const removed = new Set();
    for (const da of onlyA) {
        const db = onlyB.find(x => !removed.has(x) && x.b.DirectiveID === da.a.DirectiveID
            && x.b.BpMethodCode === da.a.BpMethodCode && x.b.Source === da.a.Source);
        if (!db) continue;
        removed.add(db);
        da.b = db.b; da.status = 'renamed'; da.fields = compareEntries(da.a, da.b);
        da.layoutDiff = !da.fields.Layout.same; da.renamedTo = db.b.Name;
    }
    const finalDirs = dirs.filter(d => !removed.has(d));

    // Group: service (Source + SystemCode + BusinessObject) → method → directives
    const svcMap = new Map();
    for (const d of finalDirs) {
        const e = d.a || d.b;
        const m = methA.get(e.Source + '|' + e.BpMethodCode) || methB.get(e.Source + '|' + e.BpMethodCode) || {};
        const sys = m.SystemCode || String(e.BpMethodCode).split('.')[0] || 'Erp';
        const bo = m.BusinessObject || String(e.BpMethodCode).split('.').slice(-2, -1)[0] || e.BpMethodCode;
        const svcKey = e.Source + ':' + sys + ':' + bo;
        if (!svcMap.has(svcKey)) svcMap.set(svcKey, { svcKey, source: e.Source, systemCode: sys, businessObject: bo, methods: new Map() });
        const svc = svcMap.get(svcKey);
        if (!svc.methods.has(e.BpMethodCode)) {
            svc.methods.set(e.BpMethodCode, {
                methodCode: e.BpMethodCode, methodName: m.Name || String(e.BpMethodCode).split('.').pop(),
                inA: methA.has(e.Source + '|' + e.BpMethodCode), inB: methB.has(e.Source + '|' + e.BpMethodCode), dirs: [],
            });
        }
        svc.methods.get(e.BpMethodCode).dirs.push({ ...d, typeLabel: TYPE_LABEL[e.DirectiveType] || ('Type' + e.DirectiveType) });
    }

    const counts = { match: 0, diff: 0, 'only-a': 0, 'only-b': 0, renamed: 0 };
    for (const d of finalDirs) counts[d.status]++;

    const services = [...svcMap.values()].map(s => {
        const methods = [...s.methods.values()].map(m => {
            m.dirs.sort((x, y) => (x.a || x.b).DirectiveType - (y.a || y.b).DirectiveType || String((x.a || x.b).Order).localeCompare(String((y.a || y.b).Order)) || (x.a || x.b).Name.localeCompare((y.a || y.b).Name));
            m.status = m.dirs.some(d => d.status !== 'match') ? 'diff' : 'match';
            return m;
        }).sort((x, y) => x.methodName.localeCompare(y.methodName));
        const diffCount = methods.reduce((n, m) => n + m.dirs.filter(d => d.status !== 'match').length, 0);
        const dirCount = methods.reduce((n, m) => n + m.dirs.length, 0);
        return { svcKey: s.svcKey, source: s.source, systemCode: s.systemCode, businessObject: s.businessObject,
            status: diffCount ? 'diff' : 'match', diffCount, dirCount, methods };
    }).sort((x, y) => (x.status === y.status ? 0 : x.status === 'diff' ? -1 : 1) || x.businessObject.localeCompare(y.businessObject));

    return { services, counts, total: finalDirs.length, serviceTotal: services.length };
}

// Pairs whose two sides are stored in different formats (XAML vs JSON) can't
// be compared textually — return the DirectiveIDs that need server-side
// normalization through GetKineticDirective.
function mixedFormatPairs(dirsA, dirsB) {
    const fa = new Map(dirsA.map(d => [directiveKey(d), d]));
    const out = [];
    for (const b of dirsB) {
        const a = fa.get(directiveKey(b));
        if (!a) continue;
        const ka = bodyFormat(a.Body), kb = bodyFormat(b.Body);
        if (ka !== kb && ka !== 'empty' && kb !== 'empty') out.push({ a, b });
    }
    return out;
}

// Stored Body as-is, just laid out for a line diff: XAML one element per line,
// indented, long tags with one attribute per line; JSON pretty-printed.
function prettyBody(body) {
    const fmt = bodyFormat(body);
    if (fmt === 'empty') return '';
    if (fmt === 'json') return JSON.stringify(tryParseJson(body), null, 2);
    const tokens = String(body).match(/<[^>]+>|[^<]+/g) || [];
    const out = []; let depth = 0;
    const pad = () => '  '.repeat(Math.max(0, depth));
    for (const t of tokens) {
        if (!t.trim()) continue;
        if (!t.startsWith('<')) { out.push(pad() + t.trim()); continue; }
        const closing = t.startsWith('</'), selfClose = t.endsWith('/>') || t.startsWith('<?') || t.startsWith('<!');
        if (closing) depth--;
        if (t.length > 120 && !closing) {
            const parts = t.split(/\s+(?=[\w:.]+=")/);
            out.push(pad() + parts[0]);
            for (const a of parts.slice(1)) out.push(pad() + '    ' + a);
        } else out.push(pad() + t);
        if (!closing && !selfClose) depth++;
    }
    return out.join('\n');
}

module.exports = { bodyFormat, canonicalizeBody, jsonToCanonical, buildBpmCompare, mixedFormatPairs, directiveKey, prettyBody };
