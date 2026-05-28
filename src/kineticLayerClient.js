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

    // ── Apps ──────────────────────────────────────────────────────────────────

    // List all apps (lightweight — no layer detail). Each row has: Id, Type, SubType, LastUpdated, etc.
    async listApps() {
        const result = await this._call("GetApplications", { request: {} });
        return Array.isArray(result?.returnObj) ? result.returnObj : [];
    }

    // Get layer descriptors for a specific app (used to build the ExportLayers payload).
    // Uses GetLayers rather than GetApplications({IncludeAllLayers:true}) which causes a 500.
    async getLayers(viewId) {
        const result = await this._call("GetLayers", {
            request: { ViewId: viewId, IncludeUnpublishedLayers: true },
        });
        // returnObj shape is undocumented — handle the common variants
        const obj = result?.returnObj;
        if (Array.isArray(obj)) return obj;
        if (Array.isArray(obj?.Layers)) return obj.Layers;
        if (Array.isArray(obj?.layers)) return obj.layers;
        if (Array.isArray(obj?.value)) return obj.value;
        // Log the actual shape so we can adapt if none of the above matched
        if (obj != null) console.error("[MetaFX] GetLayers returnObj shape:", JSON.stringify(obj).slice(0, 500));
        return [];
    }

    // Check if an app already exists on this server.
    async applicationExists(viewId) {
        const result = await this._call("ApplicationExists", { applicationFullName: viewId });
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

    // Save app content as a draft. files = Files dict from exportApp().
    async saveApp(viewId, files) {
        const parsed = parseAppFiles(files);
        await this._call("SaveApp", {
            request: { id: viewId, ...parsed },
        });
    }

    // Publish the saved draft — makes the app live.
    async publishApp(viewId, files) {
        const parsed = parseAppFiles(files);
        await this._call("PublishApp", {
            request: { id: viewId, ...parsed },
        });
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
