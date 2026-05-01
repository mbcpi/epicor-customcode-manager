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
exports.EpicorClient = void 0;
const https = __importStar(require("https"));
const http = __importStar(require("http"));

class EpicorClient {
    constructor(config) {
        this.config = config;
    }

    getHeaders() {
        const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`,
        };
        if (this.config.apiKey) {
            headers['x-api-key'] = this.config.apiKey;
        }
        return headers;
    }

    getDesignerUrl(method) {
        const base = this.config.serverUrl.replace(/\/$/, '');
        return `${base}/api/v2/odata/${this.config.company}/Ice.LIB.EfxLibraryDesignerSvc/${method}`;
    }

    getEfxUrl(libraryId, functionId, companyOverride) {
        const base = this.config.serverUrl.replace(/\/$/, '');
        const company = companyOverride || this.config.company;
        return `${base}/api/v2/efx/${company}/${libraryId}/${functionId}`;
    }

    async request(url, body) {
        const raw = await this.requestRaw(url, typeof body === 'string' ? body : JSON.stringify(body));
        try {
            return raw ? JSON.parse(raw) : {};
        }
        catch {
            return raw;
        }
    }

    // GET request — used for OData entity endpoints that don't accept POST.
    async requestGet(url) {
        return new Promise((resolve, reject) => {
            const parsed = new URL(url);
            const isHttps = parsed.protocol === 'https:';
            const mod = isHttps ? https : http;
            const options = {
                hostname: parsed.hostname,
                port: parsed.port || (isHttps ? 443 : 80),
                path: parsed.pathname + parsed.search,
                method: 'GET',
                headers: this.getHeaders(),
                rejectUnauthorized: false,
            };

            const req = mod.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            resolve(data ? JSON.parse(data) : {});
                        }
                        catch {
                            resolve(data);
                        }
                    }
                    else {
                        let errorMsg = `HTTP ${res.statusCode}`;
                        try {
                            const errObj = JSON.parse(data);
                            errorMsg = errObj.ErrorMessage || errObj.error?.message || JSON.stringify(errObj, null, 2);
                        }
                        catch {
                            errorMsg = data || errorMsg;
                        }
                        reject(new Error(errorMsg));
                    }
                });
            });

            req.on('error', reject);
            req.end();
        });
    }

    // List companies the configured user has access to.
    // Calls Ice.BO.UserFileSvc against the seed company to discover all UserComp rows.
    async getUserCompanies() {
        const base = this.config.serverUrl.replace(/\/$/, '');
        const userId = encodeURIComponent(this.config.username);
        const url = `${base}/api/v2/odata/${this.config.company}/Ice.BO.UserFileSvc/UserFiles('${userId}')/UserComps?$select=Company,Name`;
        const result = await this.requestGet(url);
        const rows = Array.isArray(result?.value) ? result.value : [];
        return rows.map(r => r.Company).filter(Boolean);
    }

    async requestRaw(url, bodyStr) {
        return new Promise((resolve, reject) => {
            const parsed = new URL(url);
            const isHttps = parsed.protocol === 'https:';
            const mod = isHttps ? https : http;
            const options = {
                hostname: parsed.hostname,
                port: parsed.port || (isHttps ? 443 : 80),
                path: parsed.pathname + parsed.search,
                method: 'POST',
                headers: {
                    ...this.getHeaders(),
                    'Content-Length': Buffer.byteLength(bodyStr),
                },
                rejectUnauthorized: false,
            };

            const req = mod.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data);
                    }
                    else {
                        let errorMsg = `HTTP ${res.statusCode}`;

                        try {
                            const errObj = JSON.parse(data);
                            errorMsg = errObj.ErrorMessage || errObj.error?.message || JSON.stringify(errObj, null, 2);
                        }
                        catch {
                            errorMsg = data || errorMsg;
                        }

                        console.error("EFx HTTP failure status:", res.statusCode);
                        console.error("EFx HTTP failure body:", data);

                        reject(new Error(errorMsg));
                    }
                });
            });

            req.on('error', reject);
            req.write(bodyStr);
            req.end();
        });
    }

    async getLibraryList() {
        const result = await this.request(this.getDesignerUrl('GetLibraryList'), {
            options: { kind: 0, startsWith: '', rollOutMode: 2, status: 0 }
        });
        return result.returnObj?.EfxLibraryList || [];
    }

    async getLibrary(libraryId) {
        const result = await this.request(this.getDesignerUrl('GetLibrary'), {
            libraryId: libraryId
        });
        return result.returnObj;
    }

    async getDefaults() {
        const result = await this.request(this.getDesignerUrl('GetDefaults'), {});
        return result.returnObj;
    }

    async getDefaultsRaw() {
        const raw = await this.requestRaw(this.getDesignerUrl('GetDefaults'), '{}');
        const match = raw.match(/"returnObj"\s*:\s*(\{.*\})\s*\}$/s);
        return match ? match[1] : raw;
    }

    async getLibraryRaw(libraryId) {
        const raw = await this.requestRaw(
            this.getDesignerUrl('GetLibrary'),
            JSON.stringify({ libraryId })
        );
        const match = raw.match(/"returnObj"\s*:\s*(\{.*\})\s*\}$/s);
        return match ? match[1] : raw;
    }

    async applyChangesRaw(rawTableset) {
        const body = `{"libraryTableset":${rawTableset}}`;
        const rawResult = await this.requestRaw(this.getDesignerUrl('ApplyChangesWithDiagnostics'), body);

        try {
            const parsed = JSON.parse(rawResult);
            return {
                diagnostics: parsed.returnObj?.diagnostics || parsed.parameters?.diagnostics || [],
            };
        }
        catch {
            return { diagnostics: [] };
        }
    }

    async applyChanges(tableset) {
        const result = await this.request(this.getDesignerUrl('ApplyChangesWithDiagnostics'), {
            libraryTableset: tableset
        });
        return {
            tableset: result.returnObj?.libraryTableset || result.parameters?.libraryTableset || tableset,
            diagnostics: result.returnObj?.diagnostics || result.parameters?.diagnostics || [],
        };
    }

    async promoteToProduction(libraryId) {
        await this.request(this.getDesignerUrl('PromoteToProduction'), {
            libraryID: libraryId
        });
    }

    async regenerateLibrary(libraryId) {
        const result = await this.request(this.getDesignerUrl('RegenerateLibrary'), {
            libraryID: libraryId
        });

        console.log("EFx Regenerate raw result:", JSON.stringify(result, null, 2));

        const errors =
            result.returnObj?.BOUpdError ||
            result.returnObj?.BOUpdErrorList ||
            result.returnObj?.BOUpdErrorTableset?.BOUpdError ||
            result.parameters?.result?.BOUpdError ||
            result.parameters?.result?.BOUpdErrorList ||
            result.parameters?.result?.BOUpdErrorTableset?.BOUpdError ||
            result.parameters?.errors ||
            result.errors ||
            [];

        return {
            errors,
            raw: result
        };
    }

    async demoteFromProduction(libraryId) {
        await this.request(this.getDesignerUrl('DemoteFromProduction'), {
            libraryID: libraryId
        });
    }

    async lockLibrary(libraryId) {
        await this.request(this.getDesignerUrl('LockLibrary'), {
            libraryID: libraryId
        });
    }

    async releaseLibrary(libraryId) {
        await this.request(this.getDesignerUrl('ReleaseLibrary'), {
            libraryID: libraryId
        });
    }

    // Direct raw designer-service save.
    // Keep this as fallback only. Bad EFx C# can still return HTTP 500 here.
    async validateFunctionRaw(libraryId, functionId, code, usings) {
        const rawTableset = await this.getLibraryRaw(libraryId);
        const newBody = EpicorClient.packCode(code, usings || '');
        const patched = this._patchFunctionBody(rawTableset, functionId, newBody, 'U');

        const body = `{"libraryTableset":${patched}}`;
        const rawResult = await this.requestRaw(
            this.getDesignerUrl('ApplyChangesWithDiagnostics'),
            body
        );

        try {
            const parsed = JSON.parse(rawResult);
            const diagnostics = parsed.returnObj?.diagnostics
                || parsed.parameters?.diagnostics
                || [];

            const hasErrors = diagnostics.some(d =>
                typeof d === 'object'
                    ? (d.Severity ?? 2) >= 2
                    : /\berror\b/i.test(String(d))
            );

            return { diagnostics, saved: !hasErrors, newBody };
        }
        catch {
            return { diagnostics: [], saved: false, newBody };
        }
    }

    // Preferred EFx save path.
    // Calls FunctionUtilities.ApplyChangesWithDiagnostics.
    // This catches Epicor.Customization.CompilationException server-side and returns HTTP 200.
    async validateFunctionViaWrapper(
        libraryId,
        functionId,
        code,
        usings,
        wrapperLibrary = 'Utilities',
        wrapperFn = 'ApplyChangesWithDiagnostics'
    ) {
        const tableset = await this.getLibrary(libraryId);

        if (!tableset?.EfxLibrary?.[0]) {
            const message = `Library '${libraryId}' not found`;
            return {
                saved: false,
                diagnostics: [{ Severity: 2, Message: message }],
                errors: [message],
                outResult: '',
                outMsg: '',
                raw: null,
                newBody: null,
            };
        }

        const funcSrc = tableset.EfxFunction?.find(f => f.FunctionID === functionId);

        if (!funcSrc) {
            const message = `Function '${functionId}' not found in library '${libraryId}'`;
            return {
                saved: false,
                diagnostics: [{ Severity: 2, Message: message }],
                errors: [message],
                outResult: '',
                outMsg: '',
                raw: null,
                newBody: null,
            };
        }

        const libRow = {
            ...tableset.EfxLibrary[0],
            RowMod: 'U',
        };

        const funcRow = {
            ...funcSrc,
            Code: code,
            Usings: usings || '',
            Body: '',
            RowMod: 'U',
        };

        const inDS = {
            EfxLibrary: [libRow],
            EfxFunction: [funcRow],
        };

        const result = await this.request(
            this.getEfxUrl(wrapperLibrary, wrapperFn),
            {
                inFunctionID: functionId,
                inDS,
            }
        );

        const outMsg = result?.outMsg ?? result?.parameters?.outMsg ?? '';
        const outResult = result?.outResult ?? result?.parameters?.outResult ?? '';
        const outSuccess = result?.outSuccess ?? result?.parameters?.outSuccess ?? false;

        const errors = [];
        for (const line of String(outMsg).split(/\r?\n/)) {
            const m = line.match(/^Error:\s*(.+)$/i);
            if (m) errors.push(m[1].trim());
        }

        const saved = outSuccess === true || (
            errors.length === 0 &&
            /Saved Successfully/i.test(outMsg)
        );

        const diagnostics = errors.map(message => ({
            Severity: 2,
            Message: message,
        }));

        return {
            saved,
            diagnostics,
            errors,
            outResult,
            outMsg,
            raw: result,
            newBody: EpicorClient.packCode(code, usings || ''),
        };
    }

    _patchFunctionBody(rawTableset, functionId, newBodyString, rowMod) {
        const funcNeedle = `"FunctionID":${JSON.stringify(functionId)}`;
        const newBodyJsonLiteral = JSON.stringify(newBodyString);
        let patched = this._setParentLibraryRowMod(rawTableset, rowMod);

        const arrayPropIdx = patched.indexOf('"EfxFunction":[');
        if (arrayPropIdx < 0) throw new Error('EfxFunction array not found');

        const arrayStart = patched.indexOf('[', arrayPropIdx);
        let cursor = arrayStart + 1;

        while (cursor < patched.length) {
            const objStart = patched.indexOf('{', cursor);
            if (objStart < 0) break;

            const objEnd = this._findJsonObjectEnd(patched, objStart, 'EfxFunction row');
            const objStr = patched.slice(objStart, objEnd + 1);

            if (!objStr.includes(funcNeedle)) {
                cursor = objEnd + 1;
                continue;
            }

            let newObj = this._replaceJsonStringValue(objStr, 'Body', newBodyJsonLiteral);
            newObj = this._replaceJsonStringValue(newObj, 'RowMod', JSON.stringify(rowMod));

            return patched.slice(0, objStart) + newObj + patched.slice(objEnd + 1);
        }

        throw new Error(`Function ${functionId} not found in raw tableset`);
    }

    _setParentLibraryRowMod(rawTableset, rowMod) {
        const arrayPropIdx = rawTableset.indexOf('"EfxLibrary":[');
        if (arrayPropIdx < 0) throw new Error('EfxLibrary array not found');

        const arrayStart = rawTableset.indexOf('[', arrayPropIdx);
        const objStart = rawTableset.indexOf('{', arrayStart);
        if (objStart < 0) throw new Error('No EfxLibrary row found');

        const objEnd = this._findJsonObjectEnd(rawTableset, objStart, 'EfxLibrary row');
        const objStr = rawTableset.slice(objStart, objEnd + 1);
        const patched = this._replaceJsonStringValue(objStr, 'RowMod', JSON.stringify(rowMod));

        return rawTableset.slice(0, objStart) + patched + rawTableset.slice(objEnd + 1);
    }

    _findJsonObjectEnd(jsonText, objStart, label) {
        let depth = 0;
        let inStr = false;
        let esc = false;

        for (let i = objStart; i < jsonText.length; i++) {
            const ch = jsonText[i];

            if (inStr) {
                if (esc) {
                    esc = false;
                    continue;
                }
                if (ch === '\\') {
                    esc = true;
                    continue;
                }
                if (ch === '"') inStr = false;
                continue;
            }

            if (ch === '"') {
                inStr = true;
                continue;
            }

            if (ch === '{') depth++;
            else if (ch === '}') {
                depth--;
                if (depth === 0) return i;
            }
        }

        throw new Error(`Malformed ${label}`);
    }

    _replaceJsonStringValue(objStr, propName, newJsonLiteral) {
        const needle = `"${propName}":`;
        const propIdx = objStr.lastIndexOf(needle);
        if (propIdx < 0) throw new Error(`${propName} not found in object`);

        let vStart = propIdx + needle.length;
        while (/\s/.test(objStr[vStart] || '')) vStart++;

        if (objStr[vStart] !== '"') {
            throw new Error(`${propName} value is not a JSON string`);
        }

        let vEnd = vStart + 1;
        let esc = false;

        for (; vEnd < objStr.length; vEnd++) {
            const ch = objStr[vEnd];

            if (esc) {
                esc = false;
                continue;
            }

            if (ch === '\\') {
                esc = true;
                continue;
            }

            if (ch === '"') break;
        }

        return objStr.slice(0, vStart) + newJsonLiteral + objStr.slice(vEnd + 1);
    }

    async executeFunction(libraryId, functionId, requestParams, companyOverride) {
        const url = this.getEfxUrl(libraryId, functionId, companyOverride);
        return this.request(url, requestParams);
    }

    // ── Save function signatures (request + response params) to Epicor ──
    //
    // newSigs: { ArgumentName, DataType, DataTypeInfo?, Optional?, DefaultValue?, Response, Order }[]
    //
    // Follows the same raw-string-only pattern as updateRawBpmDirective and
    // updateRawEfxFunctionBodyAndRowMod — never round-trips through JSON.parse/stringify
    // so SysRevID int64 values are never corrupted by JS float64 precision loss.
    //
    // For each sig in the EfxFunctionSignature array belonging to this function:
    //   - unchanged  → left alone in the raw string (no RowMod change)
    //   - changed    → duplicated: original row (RowMod:"") then patched copy (RowMod:"U")
    //   - deleted    → duplicated: original row (RowMod:"") then copy with (RowMod:"D")
    //   - new        → appended as a fresh JSON object (RowMod:"A")
    // EfxLibrary[0] and the EfxFunction row are also marked RowMod:"U" in the raw string.
    async saveSignatures(libraryId, functionId, newSigs) {
        const raw = await this.getLibraryRaw(libraryId);

        // ── Parse ONLY for reading metadata — never serialised back ──
        // EfxFunctionSignature has no int64 fields so this is safe.
        // EfxLibrary/EfxFunction SysRevID values stay in the raw string untouched.
        const parsed = JSON.parse(raw);

        if (!parsed?.EfxLibrary?.[0]) throw new Error(`Library '${libraryId}' not found`);
        if (!parsed.EfxFunction?.find(f => f.FunctionID === functionId))
            throw new Error(`Function '${functionId}' not found in library '${libraryId}'`);

        // Existing sigs for this function only (safe to read from parsed)
        const existingSigs = (parsed.EfxFunctionSignature || [])
            .filter(s => s.FunctionID === functionId);

        // Next ParameterID (must be unique across whole library)
        let nextParamId = (parsed.EfxFunctionSignature || [])
            .reduce((max, s) => Math.max(max, s.ParameterID || 0), 0) + 1;

        // ── Walk the raw EfxFunctionSignature array and patch in-place ──
        // We touch only rows belonging to this function; all others are left byte-for-byte identical.
        const sigNeedle = '"EfxFunctionSignature":[';
        const sigPropIdx = raw.indexOf(sigNeedle);
        if (sigPropIdx < 0) throw new Error('EfxFunctionSignature array not found');

        const sigArrayStart = raw.indexOf('[', sigPropIdx);
        const sigArrayEnd = this._rawFindClose(raw, sigArrayStart, '[', ']');

        // Collect raw object strings for every sig row in this array
        const rawSigRows = []; // { objStr, sigData } — sigData only for our function's rows
        let cursor = sigArrayStart + 1;
        while (cursor < sigArrayEnd) {
            const objStart = raw.indexOf('{', cursor);
            if (objStart < 0 || objStart >= sigArrayEnd) break;
            const objEnd = this._rawFindClose(raw, objStart, '{', '}');
            if (objEnd < 0 || objEnd >= sigArrayEnd) break;
            const objStr = raw.slice(objStart, objEnd + 1);

            // Parse just this one small object to check ownership — safe, no int64 in sig rows
            let sigData = null;
            try { sigData = JSON.parse(objStr); } catch { /* leave null */ }

            rawSigRows.push({ objStr, sigData });
            cursor = objEnd + 1;
        }

        // Build the new array content as a raw string
        const parts = [];

        // 1. Pass through all rows NOT belonging to this function unchanged
        for (const { objStr, sigData } of rawSigRows) {
            if (!sigData || sigData.FunctionID !== functionId) {
                parts.push(objStr);
            }
        }

        // 2. For rows belonging to this function, diff against newSigs
        for (const ns of newSigs) {
            const existing = existingSigs.find(
                es => es.ArgumentName === ns.ArgumentName && !!es.Response === !!ns.Response
            );

            if (existing) {
                // Find the original raw object string for this existing row
                const { objStr: originalRaw } = rawSigRows.find(
                    r => r.sigData?.ArgumentName === existing.ArgumentName &&
                        !!r.sigData?.Response === !!existing.Response
                ) || {};

                if (!originalRaw) continue; // shouldn't happen

                const changed =
                    existing.DataType !== (ns.DataType ?? existing.DataType) ||
                    existing.DataTypeInfo !== (ns.DataTypeInfo ?? existing.DataTypeInfo) ||
                    !!existing.Optional !== !!(ns.Optional ?? existing.Optional) ||
                    existing.DefaultValue !== (ns.DefaultValue ?? existing.DefaultValue) ||
                    existing.Order !== (ns.Order ?? existing.Order);

                if (!changed) {
                    // Unchanged — emit as-is (no RowMod touch)
                    parts.push(originalRaw);
                } else {
                    // Changed — emit original (RowMod:"") then patched copy (RowMod:"U")
                    // Build patched copy by splicing string values into the raw object
                    let patched = originalRaw;
                    patched = this._rawSetStringProp(patched, 'DataType', ns.DataType ?? existing.DataType);
                    patched = this._rawSetStringProp(patched, 'DataTypeInfo', ns.DataTypeInfo ?? existing.DataTypeInfo ?? '');
                    patched = this._rawSetBoolProp(patched, 'Optional', ns.Optional ?? existing.Optional ?? false);
                    patched = this._rawSetStringProp(patched, 'DefaultValue', ns.DefaultValue ?? existing.DefaultValue ?? '');
                    patched = this._rawSetIntProp(patched, 'Order', ns.Order ?? existing.Order);
                    patched = this._rawSetStringProp(patched, 'RowMod', 'U');
                    parts.push(originalRaw); // original with RowMod:""
                    parts.push(patched);     // modified with RowMod:"U"
                }
            } else {
                // New param — build fresh JSON object (no existing raw row, safe to stringify)
                const newRow = {
                    LibraryID: libraryId,
                    FunctionID: functionId,
                    Response: !!ns.Response,
                    ParameterID: nextParamId++,
                    ArgumentName: ns.ArgumentName,
                    Order: ns.Order ?? parts.length,
                    DataType: ns.DataType || 'System.String',
                    DataTypeInfo: ns.DataTypeInfo || '',
                    Optional: ns.Optional ?? false,
                    DefaultValue: ns.DefaultValue ?? '',
                    SysRevID: 0,
                    SysRowID: '00000000-0000-0000-0000-000000000000',
                    BitFlag: 0,
                    RowMod: 'A',
                };
                parts.push(JSON.stringify(newRow));
            }
        }

        // 3. Rows that existed but are absent from newSigs → emit original + deleted copy
        for (const es of existingSigs) {
            const stillPresent = newSigs.some(
                ns => ns.ArgumentName === es.ArgumentName && !!ns.Response === !!es.Response
            );
            if (!stillPresent) {
                const { objStr: originalRaw } = rawSigRows.find(
                    r => r.sigData?.ArgumentName === es.ArgumentName &&
                        !!r.sigData?.Response === !!es.Response
                ) || {};
                if (!originalRaw) continue;
                const deleted = this._rawSetStringProp(originalRaw, 'RowMod', 'D');
                parts.push(originalRaw); // original with RowMod:""
                parts.push(deleted);     // copy with RowMod:"D"
            }
        }

        // Splice the new sig array back into the raw tableset
        let result = raw.slice(0, sigArrayStart + 1) +
            parts.join(',') +
            raw.slice(sigArrayEnd);

        // Mark EfxLibrary[0] and EfxFunction row as RowMod:"U" (raw string ops — SysRevID safe)
        result = this._setParentLibraryRowMod(result, 'U');
        result = this._setEfxFunctionRowMod(result, functionId, 'U');

        // Validate structure — do NOT send this parsed value back
        JSON.parse(result);

        const applyResult = await this.applyChangesRaw(result);

        const hasErrors = (applyResult.diagnostics || []).some(d =>
            typeof d === 'object' ? (d.Severity ?? 2) >= 2 : /\berror\b/i.test(String(d))
        );

        // Return surviving sigs for the webview to refresh from
        const updatedSigs = newSigs.map((ns, i) => {
            const existing = existingSigs.find(
                es => es.ArgumentName === ns.ArgumentName && !!es.Response === !!ns.Response
            );
            return existing
                ? { ...existing, DataType: ns.DataType ?? existing.DataType, DataTypeInfo: ns.DataTypeInfo ?? existing.DataTypeInfo ?? '', Optional: ns.Optional ?? existing.Optional ?? false, DefaultValue: ns.DefaultValue ?? existing.DefaultValue ?? '', Order: ns.Order ?? i }
                : { LibraryID: libraryId, FunctionID: functionId, Response: !!ns.Response, ArgumentName: ns.ArgumentName, DataType: ns.DataType || 'System.String', DataTypeInfo: ns.DataTypeInfo || '', Optional: ns.Optional ?? false, DefaultValue: ns.DefaultValue ?? '', Order: ns.Order ?? i };
        });

        return { saved: !hasErrors, diagnostics: applyResult.diagnostics || [], updatedSigs };
    }

    // ── Raw string property setters ──
    // These splice a new value into a JSON object string without ever parsing/re-serializing
    // the whole thing, so int64 SysRevID values elsewhere in the string are never touched.

    _rawFindClose(str, start, openCh, closeCh) {
        let depth = 0, inStr = false, esc = false;
        for (let i = start; i < str.length; i++) {
            const ch = str[i];
            if (inStr) {
                if (esc) { esc = false; continue; }
                if (ch === '\\') { esc = true; continue; }
                if (ch === '"') inStr = false;
                continue;
            }
            if (ch === '"') { inStr = true; continue; }
            if (ch === openCh) depth++;
            else if (ch === closeCh) { depth--; if (depth === 0) return i; }
        }
        return -1;
    }

    // Replace a JSON string (or null) property value in a raw object string
    _rawSetStringProp(objStr, propName, value) {
        const needle = `"${propName}":`;
        const propIdx = objStr.indexOf(needle);
        if (propIdx < 0) throw new Error(`Property "${propName}" not found`);
        let vStart = propIdx + needle.length;
        while (objStr[vStart] === ' ') vStart++;
        let vEnd;
        if (objStr[vStart] === '"') {
            // Quoted string — walk to closing quote
            vEnd = vStart + 1;
            let esc = false;
            for (; vEnd < objStr.length; vEnd++) {
                const ch = objStr[vEnd];
                if (esc) { esc = false; continue; }
                if (ch === '\\') { esc = true; continue; }
                if (ch === '"') { vEnd++; break; } // include closing quote
            }
        } else {
            // Bare token (null, true, false, number) — end at comma, } or whitespace
            vEnd = vStart;
            while (vEnd < objStr.length && objStr[vEnd] !== ',' && objStr[vEnd] !== '}' && objStr[vEnd] !== ' ' && objStr[vEnd] !== '\n' && objStr[vEnd] !== '\r') vEnd++;
        }
        return objStr.slice(0, vStart) + JSON.stringify(value) + objStr.slice(vEnd);
    }

    // Replace a JSON boolean property value in a raw object string
    _rawSetBoolProp(objStr, propName, value) {
        const needle = `"${propName}":`;
        const propIdx = objStr.indexOf(needle);
        if (propIdx < 0) throw new Error(`Property "${propName}" not found`);
        let vStart = propIdx + needle.length;
        while (objStr[vStart] === ' ') vStart++;
        // Boolean values end at next comma, } or whitespace
        let vEnd = vStart;
        while (vEnd < objStr.length && objStr[vEnd] !== ',' && objStr[vEnd] !== '}' && objStr[vEnd] !== ' ') vEnd++;
        return objStr.slice(0, vStart) + (value ? 'true' : 'false') + objStr.slice(vEnd);
    }

    // Replace a JSON integer property value in a raw object string
    _rawSetIntProp(objStr, propName, value) {
        const needle = `"${propName}":`;
        const propIdx = objStr.indexOf(needle);
        if (propIdx < 0) throw new Error(`Property "${propName}" not found`);
        let vStart = propIdx + needle.length;
        while (objStr[vStart] === ' ') vStart++;
        let vEnd = vStart;
        while (vEnd < objStr.length && objStr[vEnd] !== ',' && objStr[vEnd] !== '}' && objStr[vEnd] !== ' ') vEnd++;
        return objStr.slice(0, vStart) + String(Math.floor(value)) + objStr.slice(vEnd);
    }

    // Set RowMod on the EfxFunction row matching functionId without touching Body or SysRevID
    _setEfxFunctionRowMod(rawTableset, functionId, rowMod) {
        const funcNeedle = `"FunctionID":${JSON.stringify(functionId)}`;
        const arrayPropIdx = rawTableset.indexOf('"EfxFunction":[');
        if (arrayPropIdx < 0) throw new Error('EfxFunction array not found');
        const arrayStart = rawTableset.indexOf('[', arrayPropIdx);
        let cursor = arrayStart + 1;
        while (cursor < rawTableset.length) {
            const objStart = rawTableset.indexOf('{', cursor);
            if (objStart < 0) break;
            const objEnd = this._findJsonObjectEnd(rawTableset, objStart, 'EfxFunction row');
            const objStr = rawTableset.slice(objStart, objEnd + 1);
            if (objStr.includes(funcNeedle)) {
                const patched = this._replaceJsonStringValue(objStr, 'RowMod', JSON.stringify(rowMod));
                return rawTableset.slice(0, objStart) + patched + rawTableset.slice(objEnd + 1);
            }
            cursor = objEnd + 1;
        }
        throw new Error(`EfxFunction row for '${functionId}' not found`);
    }

    static extractCode(body) {
        try {
            const parsed = JSON.parse(body);
            return { code: parsed.Code || '', usings: parsed.Usings || '' };
        }
        catch {
            return { code: body, usings: '' };
        }
    }

    static packCode(code, usings = '') {
        return JSON.stringify({ Code: code, Usings: usings });
    }
}

exports.EpicorClient = EpicorClient;
//# sourceMappingURL=epicorClient.js.map