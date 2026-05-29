"use strict";
const https = require("https");
const http = require("http");

// Client for Ice.LIB.MetaFXSvc — Kinetic app and layer transfer.
// All operations are POST method calls (same pattern as Ice.LIB.EfxLibraryDesignerSvc).

// Map ExportApp Files keys (e.g. "layout.jsonc") to SaveApp/PublishApp request fields.
function parseAppFiles(files) {
    const fieldMap = {
        layout: "layout",
        events: "events",
        dataviews: "dataviews",
        pages: "pages",
        rules: "rules",
        tools: "tools",
        classicLayout: "classicLayout",
        orphans: "orphans",
        properties: "properties",
    };
    const result = {};
    for (const [filename, content] of Object.entries(files || {})) {
        if (!content) continue;
        const base = filename.replace(/\.jsonc?$/, "");
        if (fieldMap[base]) {
            try { result[fieldMap[base]] = JSON.parse(content); } catch { /* skip unparseable */ }
        }
    }
    return result;
}

class KineticMetaFXClient {
    constructor(config) {
        this.config = config;
    }

    _getHeaders() {
        const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString("base64");
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Basic ${auth}`,
        };
        if (this.config.apiKey) {
            headers["x-api-key"] = this.config.apiKey;
        }
        return headers;
    }

    _methodUrl(method) {
        const base = this.config.serverUrl.replace(/\/$/, "");
        return `${base}/api/v2/odata/${this.config.company}/Ice.LIB.MetaFXSvc/${method}`;
    }

    _call(method, body) {
        return new Promise((resolve, reject) => {
            const url = this._methodUrl(method);
            const parsed = new URL(url);
            const isHttps = parsed.protocol === "https:";
            const mod = isHttps ? https : http;
            const bodyStr = JSON.stringify(body);
            const options = {
                hostname: parsed.hostname,
                port: parsed.port || (isHttps ? 443 : 80),
                path: parsed.pathname + parsed.search,
                method: "POST",
                headers: {
                    ...this._getHeaders(),
                    "Content-Length": Buffer.byteLength(bodyStr),
                },
                rejectUnauthorized: false,
            };
            const req = mod.request(options, (res) => {
                let data = "";
                res.on("data", chunk => { data += chunk; });
                res.on("end", () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            resolve(data ? JSON.parse(data) : null);
                        } catch {
                            resolve(data);
                        }
                    } else {
                        let msg = `HTTP ${res.statusCode}`;
                        try {
                            const errObj = JSON.parse(data);
                            msg = errObj.error?.message || errObj.ErrorMessage || JSON.stringify(errObj, null, 2);
                        } catch {
                            msg = data || msg;
                        }
                        console.error(`[MetaFX] ${method} failed ${res.statusCode}: body=`, data.slice(0, 2000));
                        console.error(`[MetaFX] ${method} request body was:`, bodyStr.slice(0, 1000));
                        reject(new Error(msg));
                    }
                });
            });
            req.on("error", reject);
            req.write(bodyStr);
            req.end();
        });
    }

    // GET request — used for endpoints like GetApp that take a 'request' query param
    _get(method, params) {
        return new Promise((resolve, reject) => {
            const url = this._methodUrl(method);
            const parsed = new URL(url);
            parsed.searchParams.set('request', JSON.stringify(params));
            const isHttps = parsed.protocol === "https:";
            const mod = isHttps ? https : http;
            const hdrs = this._getHeaders();
            delete hdrs['Content-Type']; // no body on GET
            const options = {
                hostname: parsed.hostname,
                port: parsed.port || (isHttps ? 443 : 80),
                path: parsed.pathname + '?' + parsed.searchParams.toString(),
                method: "GET",
                headers: hdrs,
                rejectUnauthorized: false,
            };
            const req = mod.request(options, (res) => {
                let data = "";
                res.on("data", chunk => { data += chunk; });
                res.on("end", () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try { resolve(data ? JSON.parse(data) : null); }
                        catch { resolve(data); }
                    } else {
                        let msg = `HTTP ${res.statusCode}`;
                        try {
                            const e = JSON.parse(data);
                            msg = e.error?.message || e.ErrorMessage || data;
                        } catch { msg = data || msg; }
                        console.error(`[MetaFX] GET ${method} failed ${res.statusCode}:`, data.slice(0, 1000));
                        reject(new Error(msg));
                    }
                });
            });
            req.on("error", reject);
            req.end();
        });
    }

    // ── Apps ──────────────────────────────────────────────────────────────────

    // List all apps (lightweight — no layer detail). Each row has: Id, Type, SubType, LastUpdated, etc.
    async listApps() {
        const result = await this._call("GetApplications", {
            request: { Type: "view", SubType: "", SearchText: "", IncludeAllLayers: true },
        });
        return Array.isArray(result?.returnObj) ? result.returnObj : [];
    }

    // Get layer descriptors for a specific app (used to build the ExportLayers payload).
    // Uses GetLayers — GetApp returns merged app content, not a layer list.
    async getLayers(viewId) {
        const result = await this._call("GetLayers", {
            request: { ViewId: viewId, IncludeUnpublishedLayers: true },
        });
        const obj = result?.returnObj;
        if (Array.isArray(obj)) return obj;
        if (obj && typeof obj === 'object') {
            const KNOWN_KEYS = ['Layers', 'layers', 'EpMetaFXLayerForApplicationList', 'LayerList',
                                'value', 'Value', 'data', 'Data', 'items', 'Items', 'Result', 'result',
                                'EpMetaFXLayerList', 'AppLayerList', 'LayerDescriptors'];
            for (const k of KNOWN_KEYS) {
                if (Array.isArray(obj[k])) return obj[k];
            }
            // Last resort: first array-valued property
            for (const [k, v] of Object.entries(obj)) {
                if (Array.isArray(v)) {
                    console.error("[MetaFX] GetLayers used fallback key:", k, "shape keys:", Object.keys(obj));
                    return v;
                }
            }
        }
        if (obj != null) console.error("[MetaFX] GetLayers returnObj (no array found):", JSON.stringify(obj).slice(0, 600));
        else console.error("[MetaFX] GetLayers result:", JSON.stringify(result).slice(0, 600));
        return [];
    }

    // Check if an app already exists on this server.
    async applicationExists(viewId) {
        const result = await this._call("ApplicationExists", { viewId });
        return result?.returnObj === true;
    }

    // Delete an app from this server (used before reimport to overwrite).
    async deleteApp(viewId) {
        await this._call("DeleteApp", { viewId });
    }

    // Export a full app. Returns AppContent: { ViewId, CompanyId, Files: { [name]: string } }
    async exportApp(viewId) {
        const result = await this._call("ExportApp", { viewId });
        return result?.returnObj || null;
    }

    // Fetch the merged app content for a specific layer via GetApp (GET).
    // layerDescription is the LayerDescription string from GetLayers (e.g. "V5_2594_20260529_MB").
    // Returns returnObj: { Layout, Events, DataViews, Rules, ToolBar, Pages, Properties, ... }
    async getAppForLayer(viewId, layerDescription) {
        console.log(`[MetaFX] getAppForLayer → viewId="${viewId}" layer="${layerDescription}"`);
        const request = {
            id: viewId,
            properties: {
                deviceType: "Desktop",
                layers: [layerDescription],
                baseAppVersion: 0,
                layerVersion: 0,
                mode: "AppStudio",
                applicationType: "view",
                ignorePersonalization: false,
                additionalContext: { doValidation: true, menuId: "preview", inPreviewMode: true },
                checkDuplicateIds: false,
                debug: false,
            },
        };
        console.log(`[MetaFX] getAppForLayer request:`, JSON.stringify(request));
        try {
            const result = await this._get("GetApp", request);
            const obj = result?.returnObj;
            if (!obj) {
                console.error(`[MetaFX] getAppForLayer: empty returnObj. Full response:`, JSON.stringify(result).slice(0, 500));
                return null;
            }
            console.log(`[MetaFX] getAppForLayer OK — top-level keys:`, Object.keys(obj));
            return obj;
        } catch (e) {
            console.error(`[MetaFX] getAppForLayer failed for layer="${layerDescription}":`, e.message);
            throw e;
        }
    }

    // Find a specific app's metadata (Type, SubType) from the app list on this server.
    async getApplicationInfo(viewId) {
        const apps = await this.listApps();
        return apps.find(a => a.Id === viewId) || null;
    }

    // Create an empty app shell on this server — required before SaveApp for new apps.
    async getNewApplication(viewId, type, subType) {
        await this._call("GetNewApplication", {
            request: { Id: viewId, Type: type, SubType: subType },
        });
    }

    // Build a layerInfo object for SaveApp / PublishApp.
    // meta: { subType, typeCode, isNew, company, layerDescription, comment, wip }
    _buildLayerInfo(viewId, meta = {}, wip = true) {
        const desc = meta.layerDescription || '';
        return {
            ViewId: viewId,
            LayerDescription: desc,
            LayerName: desc,
            TypeCode: meta.typeCode || 'KNTCCustLayer',
            WIP: wip,
            IsNew: meta.isNew || false,
            Company: meta.company || this.config.company || '',
            DeviceType: 'Desktop',
            CGCCode: '',
            SystemFlag: false,
            HasDraftContent: wip,
            PublishParentLayers: false,
            CommentText: meta.comment || '',
            ParentLayers: null,
            UserName: null,
            Content: null,
            ChangedOn: new Date().toISOString().slice(0, 10) + 'T00:00:00',
            LayerUpdatedToPropDiffFormat: null,
            ProcessedInfo: null,
            LastUpdatedBy: '',
        };
    }

    // Save app content as a draft (WIP). files = Files dict from exportApp().
    // meta: { subType, typeCode, isNew, company, layerDescription, comment }
    async saveApp(viewId, files, meta = {}) {
        const parsed = parseAppFiles(files);
        const subType = meta.subType || parsed.layout?.viewType || 'Dashboard';
        const result = await this._call("SaveApp", {
            request: {
                id: viewId,
                viewType: subType,
                ...parsed,
                applicationType: 'view',
                subApplicationType: subType,
                uxAppVersion: 0,
                commentText: meta.comment || '',
                deviceType: 'Desktop',
                layerInfo: this._buildLayerInfo(viewId, meta, true),
            },
        });
        return result?.returnObj;
    }

    // Publish the saved draft — makes the app live.
    // meta: same shape as saveApp.
    async publishApp(viewId, files, meta = {}) {
        const parsed = parseAppFiles(files);
        const subType = meta.subType || parsed.layout?.viewType || 'Dashboard';
        const result = await this._call("PublishApp", {
            request: {
                id: viewId,
                viewType: subType,
                ...parsed,
                applicationType: 'view',
                subApplicationType: subType,
                uxAppVersion: 0,
                commentText: meta.comment || '',
                deviceType: 'Desktop',
                layerInfo: this._buildLayerInfo(viewId, meta, false),
            },
        });
        return result?.returnObj;
    }

    // ── Layers ────────────────────────────────────────────────────────────────

    // Export selected layers. layerDescriptors = EpMetaFxLayerForApplication[] from listAppsWithLayers().
    // Returns a string (Epicor's layer package format) to pass directly to importLayers().
    async exportLayers(layerDescriptors) {
        const result = await this._call("ExportLayers", { apps: layerDescriptors });
        return result?.returnObj ?? null;
    }

    // Import an exported layer package onto this client's server.
    async importLayers(exportedContent, overwrite = true) {
        await this._call("ImportLayers", {
            fileContent: { content: exportedContent, overwrite },
        });
    }
}

exports.KineticMetaFXClient = KineticMetaFXClient;
// Keep old name exported so any external references don't break.
exports.KineticLayerClient = KineticMetaFXClient;
exports.KineticAppClient = KineticMetaFXClient;
//# sourceMappingURL=kineticLayerClient.js.map
