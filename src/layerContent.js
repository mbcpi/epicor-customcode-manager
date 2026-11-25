"use strict";
// Kinetic layer content: GetApp result <-> local editable file <-> SaveApp request.
// Pure functions (no vscode, no I/O) so they can be tested on their own.
//
// Rules match real App Studio SaveApp captures (docs/layer-preview.md):
//  - layout, dataviews, rules, toolbar, pages, orphans: sent as GetApp returns them
//  - events: dashboards send every event; layers on base apps send only the
//    layer's own events (the ones carrying "mode": A/U/D). Base events have no mode.
//  - dashboards: top-level components carry layoutData { flexLayout, hostId }
//  - PatchInfo tokens go back in: GetApp resolves e.g. navigation.dataSetId
//    "%datasetId%" -> "Req"; App Studio saves the token, not the value
// The local file holds exactly what save_layer sends.

const FIELD_MAP = [
    ["Layout", "layout"],
    ["Events", "events"],
    ["DataViews", "dataviews"],
    ["Pages", "pages"],
    ["Rules", "rules"],
    ["ToolBar", "tools"],
    ["Orphans", "orphans"],
];

const isDashboard = subType => /^dashboard$/i.test(subType || "");

// Sections each PatchInfo Type applies to.
const PATCH_SECTIONS = { layout: ["layout", "pages"], events: ["events"], rules: ["rules"] };

// Put PatchInfo tokens back: on objects whose guid/id is p.Id, if p.Property
// (a dotted path) still holds p.Value, set it back to p.Name. Mutates content.
function restorePatchTokens(content, patchInfo) {
    for (const p of patchInfo || []) {
        if (!p || !p.Id || !p.Property || !p.Name) continue;
        const keys = String(p.Property).split(".");
        const visit = node => {
            if (Array.isArray(node)) { node.forEach(visit); return; }
            if (!node || typeof node !== "object") return;
            if (node.guid === p.Id || node.id === p.Id) {
                let parent = node;
                for (const k of keys.slice(0, -1)) parent = parent && parent[k];
                const last = keys[keys.length - 1];
                if (parent && typeof parent === "object" && parent[last] === p.Value) parent[last] = p.Name;
            }
            for (const v of Object.values(node)) if (v && typeof v === "object") visit(v);
        };
        for (const section of PATCH_SECTIONS[String(p.Type || "").toLowerCase()] || []) visit(content[section]);
    }
    return content;
}

// GetApp returnObj -> local file object.
function toLayerFile(getApp, { app, layer, subType, serverChangedOn }) {
    if (!getApp || !getApp.Layout) throw new Error(`GetApp returned no Layout for ${app} / ${layer}`);
    const type = subType || getApp.Layout.viewType || "";
    const content = {};
    for (const [from, to] of FIELD_MAP) content[to] = getApp[from] ?? (to === "layout" ? {} : []);
    if (!isDashboard(type)) content.events = content.events.filter(e => e && e.mode);
    restorePatchTokens(content, getApp.PatchInfo);
    return {
        app, layer, subType: type,
        pulledAt: new Date().toISOString(),
        serverChangedOn: serverChangedOn || null,
        content,
    };
}

// Local file object + fresh GetLayers row -> SaveApp request (draft).
function toSaveRequest(file, layerRow) {
    const c = file && file.content;
    if (!c || !c.layout) throw new Error("Layer file has no content.layout");
    if (!layerRow) throw new Error(`Layer ${file.layer} not found on the server`);
    const subType = file.subType || c.layout.viewType || "Dashboard";
    const layout = JSON.parse(JSON.stringify(c.layout));
    if (isDashboard(subType)) {
        for (const comp of layout.components || []) {
            if (comp && typeof comp === "object" && !comp.layoutData) comp.layoutData = { flexLayout: true, hostId: layout.name };
        }
    }
    return {
        id: file.app,
        viewType: subType,
        layout,
        pages: c.pages || [],
        orphans: c.orphans || [],
        tools: c.tools || [],
        commentText: "",
        deviceType: "Desktop",
        rules: c.rules || [],
        events: c.events || [],
        dataviews: c.dataviews || [],
        serializedEvents: null,
        applicationType: "view",
        subApplicationType: subType,
        uxAppVersion: 0,
        layerInfo: { ...layerRow, WIP: true, HasDraftContent: true, Content: null },
    };
}

// GetLayers row for a layer name (LayerName or LayerDescription).
function findLayerRow(rows, layer) {
    return (rows || []).find(r => r && (r.LayerName === layer || r.LayerDescription === layer)) || null;
}

module.exports = { FIELD_MAP, toLayerFile, toSaveRequest, findLayerRow, restorePatchTokens };
