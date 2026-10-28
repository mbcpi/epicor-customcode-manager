"use strict";
// ═══════════════════════════════════════════════════════════════════════════════
// LAYERS COMPARE  (host side)
//
// • App/layer list comes straight from GetApplications(IncludeAllLayers) — each
//   app row already carries Layers[], so no GetLayers round-trip per app.
//   Only custom layers (TypeCode KNTCCustLayer, SystemFlag false) are kept;
//   base / system content is never listed. One row per layer name.
// • Layer content is still the merged GetApp result per layer (same as before),
//   but diffed per section and per item (components by id, events by id, …)
//   instead of one giant JSON text diff. Nothing is filtered out — every field
//   difference is reported.
// • buildWireframe() turns Layout/Pages into a plain component tree for the
//   webview's wireframe view.
// ═══════════════════════════════════════════════════════════════════════════════

const CUSTOM_LAYER_TYPE = 'KNTCCustLayer';

function isCustomLayer(l) {
    return !!l && l.TypeCode === CUSTOM_LAYER_TYPE && !l.SystemFlag && !!l.LayerName;
}

// Identity is LayerName (+ non-Desktop device). Company scope is NOT part of
// it: the same layer can be all-companies in one environment and scoped to a
// company in another, and that should show as a difference on one row.
function layerKey(l) {
    const parts = [l.LayerName];
    if (l.DeviceType && l.DeviceType !== 'Desktop') parts.push(l.DeviceType);
    return parts.join(' · ');
}

function layerSummary(l) {
    if (!l) return null;
    return { LayerName: l.LayerName, TypeCode: l.TypeCode, DeviceType: l.DeviceType || 'Desktop',
        Company: l.Company || '', IsPublished: l.IsPublished, HasDraftContent: l.HasDraftContent,
        LastUpdated: l.LastUpdated || '', LastUpdatedBy: l.LastUpdatedBy || '', CGCCode: l.CGCCode || '' };
}

// appsA/appsB: GetApplications returnObj rows. useCompany: include layer.Company
// in the identity (only meaningful when both sides are the same company code).
function buildLayerApps(appsA, appsB, useCompany) {
    const index = apps => {
        const m = new Map();
        for (const a of apps || []) {
            const layers = (a.Layers || []).filter(isCustomLayer).map(layerSummary);
            if (layers.length) m.set(a.Id, { app: a, layers });
        }
        return m;
    };
    const scope = l => l.Company || '';

    // Pair layers across environments: exact name + company first (when both
    // sides are the same company code), then whatever is left by name only —
    // so an all-companies layer in one env still pairs with the same layer
    // scoped to CPI01 in the other.
    const pairLayers = (la, lb) => {
        const restA = [...la], restB = [...lb], pairs = [];
        const take = match => {
            for (let i = 0; i < restA.length; i++) {
                const j = restB.findIndex(b => match(restA[i], b));
                if (j < 0) continue;
                pairs.push([restA[i], restB[j]]);
                restA.splice(i--, 1); restB.splice(j, 1);
            }
        };
        if (useCompany) take((x, y) => layerKey(x) === layerKey(y) && scope(x) === scope(y));
        take((x, y) => layerKey(x) === layerKey(y));
        for (const x of restA) pairs.push([x, null]);
        for (const y of restB) pairs.push([null, y]);
        // Row key: name, plus company only when that name appears more than once.
        const nameCount = new Map();
        for (const [x, y] of pairs) { const k = layerKey(x || y); nameCount.set(k, (nameCount.get(k) || 0) + 1); }
        const used = new Set();
        return pairs.map(([lA, lB]) => {
            const l = lA || lB, base = layerKey(l);
            let key = nameCount.get(base) > 1 ? base + ' · ' + (scope(l) || 'all companies') : base, n = 2;
            const k0 = key;
            while (used.has(key)) key = k0 + ' #' + (n++);
            used.add(key);
            return { key, lA, lB };
        });
    };

    const A = index(appsA), B = index(appsB);
    const ids = [...new Set([...A.keys(), ...B.keys()])].sort();
    const counts = { 'only-a': 0, 'only-b': 0, 'layers-differ': 0, 'in-both': 0 };
    const apps = ids.map(id => {
        const a = A.get(id), b = B.get(id);
        const meta = (a || b).app;
        const layers = pairLayers(a ? a.layers : [], b ? b.layers : []).map(({ key, lA, lB }) => ({
            key, lA, lB, status: lA && lB ? 'in-both' : lA ? 'only-a' : 'only-b',
            updatedDiffers: !!(lA && lB && (lA.LastUpdated !== lB.LastUpdated || lA.LastUpdatedBy !== lB.LastUpdatedBy)),
            companyDiffers: !!(lA && lB && scope(lA) !== scope(lB)),
            publishDiffers: !!(lA && lB && lA.IsPublished !== lB.IsPublished),
        })).sort((x, y) => x.key.localeCompare(y.key));
        const status = !a ? 'only-b' : !b ? 'only-a' : layers.some(l => l.status !== 'in-both') ? 'layers-differ' : 'in-both';
        counts[status]++;
        return { id, status, type: meta.Type, subType: meta.SubType, systemApp: !!meta.SystemFlag,
            layerCount: layers.length, layerDelta: layers.filter(l => l.status !== 'in-both').length,
            updatedDelta: layers.filter(l => l.updatedDiffers).length, layers };
    });
    const order = { 'only-a': 0, 'only-b': 1, 'layers-differ': 2, 'in-both': 3 };
    apps.sort((x, y) => order[x.status] - order[y.status] || x.id.localeCompare(y.id));
    return { apps, counts, total: apps.length };
}

// ── component tree helpers ────────────────────────────────────────────────────

const isComp = o => o && typeof o === 'object' && !Array.isArray(o) && typeof o.sourceTypeId === 'string';

// First-level component descendants of v (components[], model.bodyComponents,
// model.expandedHeaderComponents, …) without descending into those children.
function childComps(v, out = []) {
    if (Array.isArray(v)) { for (const x of v) childComps(x, out); return out; }
    if (!v || typeof v !== 'object') return out;
    if (isComp(v)) { out.push(v); return out; }
    for (const k of Object.keys(v)) childComps(v[k], out);
    return out;
}
function compChildren(c) {
    const out = [];
    for (const k of Object.keys(c)) if (k !== 'sourceTypeId') childComps(c[k], out);
    return out;
}
// The component with its child components replaced by {"@child": id}, so a
// change inside a child is reported on the child, not on every ancestor.
function compShallow(c) {
    const strip = v => {
        if (Array.isArray(v)) return v.map(strip);
        if (!v || typeof v !== 'object') return v;
        if (isComp(v)) return { '@child': v.id };
        const o = {};
        for (const k of Object.keys(v)) o[k] = strip(v[k]);
        return o;
    };
    const o = {};
    for (const k of Object.keys(c)) o[k] = strip(c[k]);
    return o;
}
function compLabel(c) {
    const m = c.model || {};
    return m.labelText || m.title || m.caption || m.text || m.headerText || c.id;
}

// ── keyed item extraction per section ─────────────────────────────────────────

function addItem(map, key, label, value) {
    let k = key, n = 2;
    while (map.has(k)) k = key + ' #' + (n++);
    map.set(k, { key: k, label, value });
}

function sectionItems(raw, section) {
    const map = new Map();
    const v = raw ? raw[section] : undefined;
    if (section === 'Layout' || section === 'Pages') {
        const pages = section === 'Layout' ? (v ? [v] : []) : (v || []);
        for (const p of pages) {
            const pName = section === 'Layout' ? '(layout)' : (p.name || p.guid || '?');
            const pageProps = {};
            for (const k of Object.keys(p)) if (k !== 'components') pageProps[k] = p[k];
            addItem(map, pName + ' / (page)', pName, pageProps);
            const walk = c => {
                addItem(map, pName + ' / ' + (c.id || c.model?.guid || '?'), c.sourceTypeId + '  ' + compLabel(c), compShallow(c));
                for (const ch of compChildren(c)) walk(ch);
            };
            for (const c of childComps(p.components || [])) walk(c);
        }
        return map;
    }
    if (Array.isArray(v)) {
        v.forEach((it, i) => {
            const id = it && (it.id ?? it.Id ?? it.name ?? it.Name);
            addItem(map, id != null ? String(id) : '#' + i, id != null ? String(id) : '#' + i, it);
        });
        return map;
    }
    if (v !== undefined && v !== null) addItem(map, '(value)', section, v);
    return map;
}

function flatten(v, prefix, out) {
    if (Array.isArray(v)) {
        if (!v.length) out[prefix || '(root)'] = '[]';
        v.forEach((x, i) => flatten(x, prefix + '[' + i + ']', out));
    } else if (v && typeof v === 'object') {
        const ks = Object.keys(v);
        if (!ks.length) out[prefix || '(root)'] = '{}';
        for (const k of ks.sort()) flatten(v[k], prefix ? prefix + '.' + k : k, out);
    } else out[prefix || '(root)'] = JSON.stringify(v);
    return out;
}

function sortKeysDeep(v) {
    if (Array.isArray(v)) return v.map(sortKeysDeep);
    if (v && typeof v === 'object') return Object.keys(v).sort().reduce((a, k) => { a[k] = sortKeysDeep(v[k]); return a; }, {});
    return v;
}
const pretty = v => JSON.stringify(sortKeysDeep(v), null, 2);

const SECTION_ORDER = ['Layout', 'Pages', 'Events', 'DataViews', 'Rules', 'ToolBar', 'Orphans', 'Properties'];
const MAX_FIELDS = 300;

function diffAppSections(rawA, rawB) {
    const names = [...new Set([...SECTION_ORDER, ...Object.keys(rawA || {}), ...Object.keys(rawB || {})])];
    const sections = [];
    for (const name of names) {
        const ia = sectionItems(rawA, name), ib = sectionItems(rawB, name);
        if (!ia.size && !ib.size) continue;
        const counts = { added: 0, removed: 0, changed: 0, same: 0 };
        const items = [];
        const keys = [...new Set([...ia.keys(), ...ib.keys()])];
        for (const k of keys) {
            const a = ia.get(k), b = ib.get(k);
            if (a && b) {
                const fa = flatten(a.value, '', {}), fb = flatten(b.value, '', {});
                const fields = [];
                for (const p of [...new Set([...Object.keys(fa), ...Object.keys(fb)])].sort()) {
                    if (fa[p] !== fb[p]) fields.push({ path: p, a: fa[p] ?? null, b: fb[p] ?? null });
                }
                if (!fields.length) { counts.same++; continue; }
                counts.changed++;
                // Only the list of child ids moved (a child added/removed/reordered)
                // — the component's own settings are untouched.
                const structural = fields.every(f => f.path.includes('@child'));
                items.push({ key: k, label: a.label, status: 'changed', structural, fields: fields.slice(0, MAX_FIELDS),
                    fieldCount: fields.length, a: pretty(a.value), b: pretty(b.value) });
            } else if (a) {
                counts.removed++;
                items.push({ key: k, label: a.label, status: 'only-a', fields: [], fieldCount: 0, a: pretty(a.value), b: '' });
            } else {
                counts.added++;
                items.push({ key: k, label: b.label, status: 'only-b', fields: [], fieldCount: 0, a: '', b: pretty(b.value) });
            }
        }
        sections.push({ name, counts, items });
    }
    return sections;
}

// ── wireframe ─────────────────────────────────────────────────────────────────

// Children with the slot they render in: 'header' (panel-card header controls),
// 'ext' (extension area) or 'body'.
const SLOT = { expandedHeaderComponents: 'header', extensionComponents: 'ext' };
function compChildrenWithSlot(c) {
    const out = [];
    for (const ch of childComps(c.components || [])) out.push([ch, 'body']);
    const m = c.model || {};
    for (const k of Object.keys(m)) {
        if (k === 'gridModel') continue;
        for (const ch of childComps(m[k])) out.push([ch, SLOT[k] || 'body']);
    }
    return out;
}

// Only what the preview needs to draw the component like Kinetic does.
function previewProps(c) {
    const m = c.model || {}, p = {};
    for (const k of ['title', 'labelText', 'flexBasis', 'columns', 'orientation', 'readonly', 'required', 'disabled',
        'isKeyField', 'hidden', 'enableSearch', 'enabledCaption', 'disabledCaption', 'status', 'comboBoxLabel',
        'trueCaption', 'falseCaption', 'expanded', 'textHAlign', 'fullScreenButtonVisible']) {
        if (m[k] !== undefined && m[k] !== null && typeof m[k] !== 'object') p[k] = m[k];
        else if (k === 'columns' && Array.isArray(m[k])) p.navColumns = m[k].filter(x => typeof x === 'string');
    }
    if (m.gridModel && Array.isArray(m.gridModel.columns)) {
        p.gridColumns = m.gridModel.columns.map(col => col && (col.title || col.caption || col.field)).filter(Boolean).slice(0, 40);
    }
    if (Array.isArray(m.data) && c.sourceTypeId === 'metafx-tabstrip') {
        p.tabs = m.data.map(t => ({ title: t.title || t.id, page: t.page || '', selected: !!t.selected }));
    }
    if (Array.isArray(m.data) && c.sourceTypeId === 'erp-radio-button') {
        p.options = m.data.map(o => o && (o.text || o.label || o.Val || o.value)).filter(Boolean).slice(0, 8);
    }
    return p;
}

function wireNode(c, pName, slot) {
    const m = c.model || {};
    return { key: pName + ' / ' + (c.id || m.guid || '?'), id: c.id || '', type: c.sourceTypeId, slot: slot || 'body',
        label: compLabel(c), binding: m.epBinding || '', props: previewProps(c),
        children: compChildrenWithSlot(c).map(([ch, sl]) => wireNode(ch, pName, sl)) };
}

function buildWireframe(raw) {
    if (!raw) return [];
    const pages = [];
    if (raw.Layout) pages.push({ key: '(layout)', caption: raw.Layout.caption || '(layout)', roots: childComps(raw.Layout.components || []).map(c => wireNode(c, '(layout)', 'body')) });
    for (const p of raw.Pages || []) {
        const n = p.name || p.guid || '?';
        pages.push({ key: n, caption: p.caption || n, roots: childComps(p.components || []).map(c => wireNode(c, n, 'body')) });
    }
    return pages;
}

module.exports = { buildLayerApps, diffAppSections, buildWireframe, isCustomLayer, layerKey };
