"use strict";
// npm test  (node --test, built-in runner, no dependencies)
// Rules come from real App Studio SaveApp captures — see docs/layer-preview.md.
const test = require("node:test");
const assert = require("node:assert");
const { toLayerFile, toSaveRequest, findLayerRow } = require("../src/layerContent");

const getApp = () => ({
    Layout: { name: "MyForm", viewType: "Apps", components: [{ id: "c1", model: {} }] },
    Events: [
        { id: "base_onLoad", actions: [] },
        { id: "btn_onClick", actions: [], mode: "A" },
        { id: "old_onClick", actions: [], mode: "D" },
    ],
    DataViews: [{ id: "Req" }],
    Pages: [{ name: "Main", guid: "g1", navigation: { dataSetId: "Req" } }],
    Rules: [],
    ToolBar: [],
    Orphans: [],
    PatchInfo: [{ Id: "g1", Property: "navigation.dataSetId", Name: "%datasetId%", Value: "Req", Type: "layout" }],
});
const row = { ViewId: "Erp.UI.My", LayerName: "mb", LayerDescription: "", WIP: false, HasDraftContent: false, Content: "x", TypeCode: "KNTCCustLayer" };

test("base-app layer keeps only layer-owned events (mode A/U/D)", () => {
    const f = toLayerFile(getApp(), { app: "Erp.UI.My", layer: "mb", subType: "Apps" });
    assert.deepStrictEqual(f.content.events.map(e => e.id), ["btn_onClick", "old_onClick"]);
});

test("dashboard keeps every event", () => {
    const f = toLayerFile(getApp(), { app: "Ice.UIDbd.My", layer: "mb", subType: "Dashboard" });
    assert.strictEqual(f.content.events.length, 3);
});

test("PatchInfo tokens are restored", () => {
    const f = toLayerFile(getApp(), { app: "Erp.UI.My", layer: "mb", subType: "Apps" });
    assert.strictEqual(f.content.pages[0].navigation.dataSetId, "%datasetId%");
});

test("save request: draft layerInfo from the server row, content as-is", () => {
    const f = toLayerFile(getApp(), { app: "Erp.UI.My", layer: "mb", subType: "Apps" });
    const r = toSaveRequest(f, row);
    assert.strictEqual(r.id, "Erp.UI.My");
    assert.strictEqual(r.viewType, "Apps");
    assert.strictEqual(r.subApplicationType, "Apps");
    assert.deepStrictEqual([r.layerInfo.WIP, r.layerInfo.HasDraftContent, r.layerInfo.Content], [true, true, null]);
    assert.strictEqual(r.layerInfo.LayerName, "mb");
    assert.strictEqual(r.layout.components[0].layoutData, undefined);
    assert.deepStrictEqual(r.events, f.content.events);
});

test("dashboard save stamps layoutData on top-level components", () => {
    const f = toLayerFile(getApp(), { app: "Ice.UIDbd.My", layer: "mb", subType: "Dashboard" });
    const r = toSaveRequest(f, row);
    assert.deepStrictEqual(r.layout.components[0].layoutData, { flexLayout: true, hostId: "MyForm" });
    assert.strictEqual(f.content.layout.components[0].layoutData, undefined, "file content not mutated");
});

test("findLayerRow matches LayerName or LayerDescription", () => {
    assert.strictEqual(findLayerRow([row], "mb"), row);
    assert.strictEqual(findLayerRow([{ LayerDescription: "V1_X" }], "V1_X").LayerDescription, "V1_X");
    assert.strictEqual(findLayerRow([row], "nope"), null);
});
