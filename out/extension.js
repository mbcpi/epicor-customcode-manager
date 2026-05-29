"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// src/epicorClient.js
var require_epicorClient = __commonJS({
  "src/epicorClient.js"(exports2) {
    "use strict";
    var __createBinding2 = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault2 = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar2 = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding2(result, mod, k[i]);
        }
        __setModuleDefault2(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.EpicorClient = void 0;
    var https = __importStar2(require("https"));
    var http = __importStar2(require("http"));
    var EpicorClient = class _EpicorClient {
      constructor(config) {
        this.config = config;
      }
      getHeaders() {
        const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString("base64");
        const headers = {
          "Content-Type": "application/json",
          "Authorization": `Basic ${auth}`
        };
        if (this.config.apiKey) {
          headers["x-api-key"] = this.config.apiKey;
        }
        return headers;
      }
      getDesignerUrl(method) {
        const base = this.config.serverUrl.replace(/\/$/, "");
        return `${base}/api/v2/odata/${this.config.company}/Ice.LIB.EfxLibraryDesignerSvc/${method}`;
      }
      getEfxUrl(libraryId, functionId, companyOverride, staging = false) {
        const base = this.config.serverUrl.replace(/\/$/, "");
        const company = companyOverride || this.config.company;
        if (staging) {
          return `${base}/api/v2/efx/staging/${company}/${libraryId}/${functionId}`;
        }
        return `${base}/api/v2/efx/${company}/${libraryId}/${functionId}`;
      }
      async request(url, body) {
        const raw = await this.requestRaw(url, typeof body === "string" ? body : JSON.stringify(body));
        try {
          return raw ? JSON.parse(raw) : {};
        } catch {
          return raw;
        }
      }
      // GET request — used for OData entity endpoints that don't accept POST.
      async requestGet(url) {
        return new Promise((resolve, reject) => {
          const parsed = new URL(url);
          const isHttps = parsed.protocol === "https:";
          const mod = isHttps ? https : http;
          const options = {
            hostname: parsed.hostname,
            port: parsed.port || (isHttps ? 443 : 80),
            path: parsed.pathname + parsed.search,
            method: "GET",
            headers: this.getHeaders(),
            rejectUnauthorized: false
          };
          const req = mod.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => {
              data += chunk;
            });
            res.on("end", () => {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  resolve(data ? JSON.parse(data) : {});
                } catch {
                  resolve(data);
                }
              } else {
                let errorMsg = `HTTP ${res.statusCode}`;
                try {
                  const errObj = JSON.parse(data);
                  errorMsg = errObj.ErrorMessage || errObj.error?.message || JSON.stringify(errObj, null, 2);
                } catch {
                  errorMsg = data || errorMsg;
                }
                reject(new Error(errorMsg));
              }
            });
          });
          req.on("error", reject);
          req.end();
        });
      }
      // List companies the configured user has access to.
      // Calls Ice.BO.UserFileSvc against the seed company to discover all UserComp rows.
      async getUserCompanies() {
        const base = this.config.serverUrl.replace(/\/$/, "");
        const userId = encodeURIComponent(this.config.username);
        const url = `${base}/api/v2/odata/${this.config.company}/Ice.BO.UserFileSvc/UserFiles('${userId}')/UserComps?$select=Company,Name`;
        const result = await this.requestGet(url);
        const rows = Array.isArray(result?.value) ? result.value : [];
        return rows.map((r) => r.Company).filter(Boolean);
      }
      async requestRaw(url, bodyStr) {
        return new Promise((resolve, reject) => {
          const parsed = new URL(url);
          const isHttps = parsed.protocol === "https:";
          const mod = isHttps ? https : http;
          const options = {
            hostname: parsed.hostname,
            port: parsed.port || (isHttps ? 443 : 80),
            path: parsed.pathname + parsed.search,
            method: "POST",
            headers: {
              ...this.getHeaders(),
              "Content-Length": Buffer.byteLength(bodyStr)
            },
            rejectUnauthorized: false
          };
          const req = mod.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => {
              data += chunk;
            });
            res.on("end", () => {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                resolve(data);
              } else {
                let errorMsg = `HTTP ${res.statusCode}`;
                try {
                  const errObj = JSON.parse(data);
                  errorMsg = errObj.ErrorMessage || errObj.error?.message || JSON.stringify(errObj, null, 2);
                } catch {
                  errorMsg = data || errorMsg;
                }
                console.error("EFx HTTP failure status:", res.statusCode);
                console.error("EFx HTTP failure body:", data);
                reject(new Error(errorMsg));
              }
            });
          });
          req.on("error", reject);
          req.write(bodyStr);
          req.end();
        });
      }
      async getLibraryList() {
        const result = await this.request(this.getDesignerUrl("GetLibraryList"), {
          options: { kind: 0, startsWith: "", rollOutMode: 2, status: 0 }
        });
        return result.returnObj?.EfxLibraryList || [];
      }
      async getLibrary(libraryId) {
        const result = await this.request(this.getDesignerUrl("GetLibrary"), {
          libraryId
        });
        return result.returnObj;
      }
      async getDefaults() {
        const result = await this.request(this.getDesignerUrl("GetDefaults"), {});
        return result.returnObj;
      }
      async getDefaultsRaw() {
        const raw = await this.requestRaw(this.getDesignerUrl("GetDefaults"), "{}");
        const match = raw.match(/"returnObj"\s*:\s*(\{.*\})\s*\}$/s);
        return match ? match[1] : raw;
      }
      async getLibraryRaw(libraryId) {
        const raw = await this.requestRaw(
          this.getDesignerUrl("GetLibrary"),
          JSON.stringify({ libraryId })
        );
        const match = raw.match(/"returnObj"\s*:\s*(\{.*\})\s*\}$/s);
        return match ? match[1] : raw;
      }
      async applyChangesRaw(rawTableset) {
        const body = `{"libraryTableset":${rawTableset}}`;
        const rawResult = await this.requestRaw(this.getDesignerUrl("ApplyChangesWithDiagnostics"), body);
        try {
          const parsed = JSON.parse(rawResult);
          return {
            diagnostics: parsed.returnObj?.diagnostics || parsed.parameters?.diagnostics || []
          };
        } catch {
          return { diagnostics: [] };
        }
      }
      async applyChanges(tableset) {
        const result = await this.request(this.getDesignerUrl("ApplyChangesWithDiagnostics"), {
          libraryTableset: tableset
        });
        return {
          tableset: result.returnObj?.libraryTableset || result.parameters?.libraryTableset || tableset,
          diagnostics: result.returnObj?.diagnostics || result.parameters?.diagnostics || []
        };
      }
      async promoteToProduction(libraryId) {
        await this.request(this.getDesignerUrl("PromoteToProduction"), {
          libraryID: libraryId
        });
      }
      async regenerateLibrary(libraryId) {
        const result = await this.request(this.getDesignerUrl("RegenerateLibrary"), {
          libraryID: libraryId
        });
        console.log("EFx Regenerate raw result:", JSON.stringify(result, null, 2));
        const errors = result.returnObj?.BOUpdError || result.returnObj?.BOUpdErrorList || result.returnObj?.BOUpdErrorTableset?.BOUpdError || result.parameters?.result?.BOUpdError || result.parameters?.result?.BOUpdErrorList || result.parameters?.result?.BOUpdErrorTableset?.BOUpdError || result.parameters?.errors || result.errors || [];
        return {
          errors,
          raw: result
        };
      }
      async demoteFromProduction(libraryId) {
        await this.request(this.getDesignerUrl("DemoteFromProduction"), {
          libraryID: libraryId
        });
      }
      async lockLibrary(libraryId) {
        await this.request(this.getDesignerUrl("LockLibrary"), {
          libraryID: libraryId
        });
      }
      async releaseLibrary(libraryId) {
        await this.request(this.getDesignerUrl("ReleaseLibrary"), {
          libraryID: libraryId
        });
      }
      // Direct raw designer-service save.
      // Keep this as fallback only. Bad EFx C# can still return HTTP 500 here.
      async validateFunctionRaw(libraryId, functionId, code, usings) {
        const rawTableset = await this.getLibraryRaw(libraryId);
        const newBody = _EpicorClient.packCode(code, usings || "");
        const patched = this._patchFunctionBody(rawTableset, functionId, newBody, "U");
        const body = `{"libraryTableset":${patched}}`;
        const rawResult = await this.requestRaw(
          this.getDesignerUrl("ApplyChangesWithDiagnostics"),
          body
        );
        try {
          const parsed = JSON.parse(rawResult);
          const diagnostics = parsed.returnObj?.diagnostics || parsed.parameters?.diagnostics || [];
          const hasErrors = diagnostics.some(
            (d) => typeof d === "object" ? (d.Severity ?? 2) >= 2 : /\berror\b/i.test(String(d))
          );
          return { diagnostics, saved: !hasErrors, newBody };
        } catch {
          return { diagnostics: [], saved: false, newBody };
        }
      }
      // Preferred EFx save path.
      // Calls FunctionUtilities.ApplyChangesWithDiagnostics.
      // This catches Epicor.Customization.CompilationException server-side and returns HTTP 200.
      async validateFunctionViaWrapper(libraryId, functionId, code, usings, wrapperLibrary = "Utilities", wrapperFn = "ApplyChangesWithDiagnostics") {
        const tableset = await this.getLibrary(libraryId);
        if (!tableset?.EfxLibrary?.[0]) {
          const message = `Library '${libraryId}' not found`;
          return {
            saved: false,
            diagnostics: [{ Severity: 2, Message: message }],
            errors: [message],
            outResult: "",
            outMsg: "",
            raw: null,
            newBody: null
          };
        }
        const funcSrc = tableset.EfxFunction?.find((f) => f.FunctionID === functionId);
        if (!funcSrc) {
          const message = `Function '${functionId}' not found in library '${libraryId}'`;
          return {
            saved: false,
            diagnostics: [{ Severity: 2, Message: message }],
            errors: [message],
            outResult: "",
            outMsg: "",
            raw: null,
            newBody: null
          };
        }
        const libRow = {
          ...tableset.EfxLibrary[0],
          RowMod: "U"
        };
        const funcRow = {
          ...funcSrc,
          Code: code,
          Usings: usings || "",
          Body: "",
          RowMod: "U"
        };
        const inDS = {
          EfxLibrary: [libRow],
          EfxFunction: [funcRow]
        };
        let result;
        try {
          result = await this.request(
            this.getEfxUrl(wrapperLibrary, wrapperFn),
            { inFunctionID: functionId, inDS }
          );
        } catch (wrapperErr) {
          if (/HTTP 404/.test(wrapperErr.message)) {
            try {
              await this.applyChanges(inDS);
              return {
                saved: true,
                diagnostics: [],
                errors: [],
                outResult: "",
                outMsg: "Saved Successfully",
                raw: null,
                newBody: _EpicorClient.packCode(code, usings || "")
              };
            } catch (directErr) {
              const msg = directErr.message || String(directErr);
              return {
                saved: false,
                diagnostics: [{ Severity: 2, Message: msg }],
                errors: [msg],
                outResult: "",
                outMsg: msg,
                raw: null,
                newBody: null
              };
            }
          }
          throw wrapperErr;
        }
        const outMsg = result?.outMsg ?? result?.parameters?.outMsg ?? "";
        const outResult = result?.outResult ?? result?.parameters?.outResult ?? "";
        const outSuccess = result?.outSuccess ?? result?.parameters?.outSuccess ?? false;
        const errors = [];
        for (const line of String(outMsg).split(/\r?\n/)) {
          const m = line.match(/^Error:\s*(.+)$/i);
          if (m) errors.push(m[1].trim());
        }
        const saved = outSuccess === true || errors.length === 0 && /Saved Successfully/i.test(outMsg);
        const diagnostics = errors.map((message) => ({
          Severity: 2,
          Message: message
        }));
        return {
          saved,
          diagnostics,
          errors,
          outResult,
          outMsg,
          raw: result,
          newBody: _EpicorClient.packCode(code, usings || "")
        };
      }
      _patchFunctionBody(rawTableset, functionId, newBodyString, rowMod) {
        const funcNeedle = `"FunctionID":${JSON.stringify(functionId)}`;
        const newBodyJsonLiteral = JSON.stringify(newBodyString);
        let patched = this._setParentLibraryRowMod(rawTableset, rowMod);
        const arrayPropIdx = patched.indexOf('"EfxFunction":[');
        if (arrayPropIdx < 0) throw new Error("EfxFunction array not found");
        const arrayStart = patched.indexOf("[", arrayPropIdx);
        let cursor = arrayStart + 1;
        while (cursor < patched.length) {
          const objStart = patched.indexOf("{", cursor);
          if (objStart < 0) break;
          const objEnd = this._findJsonObjectEnd(patched, objStart, "EfxFunction row");
          const objStr = patched.slice(objStart, objEnd + 1);
          if (!objStr.includes(funcNeedle)) {
            cursor = objEnd + 1;
            continue;
          }
          let newObj = this._replaceJsonStringValue(objStr, "Body", newBodyJsonLiteral);
          newObj = this._replaceJsonStringValue(newObj, "RowMod", JSON.stringify(rowMod));
          return patched.slice(0, objStart) + newObj + patched.slice(objEnd + 1);
        }
        throw new Error(`Function ${functionId} not found in raw tableset`);
      }
      _setParentLibraryRowMod(rawTableset, rowMod) {
        const arrayPropIdx = rawTableset.indexOf('"EfxLibrary":[');
        if (arrayPropIdx < 0) throw new Error("EfxLibrary array not found");
        const arrayStart = rawTableset.indexOf("[", arrayPropIdx);
        const objStart = rawTableset.indexOf("{", arrayStart);
        if (objStart < 0) throw new Error("No EfxLibrary row found");
        const objEnd = this._findJsonObjectEnd(rawTableset, objStart, "EfxLibrary row");
        const objStr = rawTableset.slice(objStart, objEnd + 1);
        const patched = this._replaceJsonStringValue(objStr, "RowMod", JSON.stringify(rowMod));
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
            if (ch === "\\") {
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
          if (ch === "{") depth++;
          else if (ch === "}") {
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
        while (/\s/.test(objStr[vStart] || "")) vStart++;
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
          if (ch === "\\") {
            esc = true;
            continue;
          }
          if (ch === '"') break;
        }
        return objStr.slice(0, vStart) + newJsonLiteral + objStr.slice(vEnd + 1);
      }
      async executeFunction(libraryId, functionId, requestParams, companyOverride, staging = false) {
        const url = this.getEfxUrl(libraryId, functionId, companyOverride, staging);
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
        const parsed = JSON.parse(raw);
        if (!parsed?.EfxLibrary?.[0]) throw new Error(`Library '${libraryId}' not found`);
        if (!parsed.EfxFunction?.find((f) => f.FunctionID === functionId))
          throw new Error(`Function '${functionId}' not found in library '${libraryId}'`);
        const existingSigs = (parsed.EfxFunctionSignature || []).filter((s) => s.FunctionID === functionId);
        let nextParamId = (parsed.EfxFunctionSignature || []).reduce((max, s) => Math.max(max, s.ParameterID || 0), 0) + 1;
        const sigNeedle = '"EfxFunctionSignature":[';
        const sigPropIdx = raw.indexOf(sigNeedle);
        if (sigPropIdx < 0) throw new Error("EfxFunctionSignature array not found");
        const sigArrayStart = raw.indexOf("[", sigPropIdx);
        const sigArrayEnd = this._rawFindClose(raw, sigArrayStart, "[", "]");
        const rawSigRows = [];
        let cursor = sigArrayStart + 1;
        while (cursor < sigArrayEnd) {
          const objStart = raw.indexOf("{", cursor);
          if (objStart < 0 || objStart >= sigArrayEnd) break;
          const objEnd = this._rawFindClose(raw, objStart, "{", "}");
          if (objEnd < 0 || objEnd >= sigArrayEnd) break;
          const objStr = raw.slice(objStart, objEnd + 1);
          let sigData = null;
          try {
            sigData = JSON.parse(objStr);
          } catch {
          }
          rawSigRows.push({ objStr, sigData });
          cursor = objEnd + 1;
        }
        const parts = [];
        for (const { objStr, sigData } of rawSigRows) {
          if (!sigData || sigData.FunctionID !== functionId) {
            parts.push(objStr);
          }
        }
        for (const ns of newSigs) {
          const existing = existingSigs.find(
            (es) => es.ArgumentName === ns.ArgumentName && !!es.Response === !!ns.Response
          );
          if (existing) {
            const { objStr: originalRaw } = rawSigRows.find(
              (r) => r.sigData?.ArgumentName === existing.ArgumentName && !!r.sigData?.Response === !!existing.Response
            ) || {};
            if (!originalRaw) continue;
            const changed = existing.DataType !== (ns.DataType ?? existing.DataType) || existing.DataTypeInfo !== (ns.DataTypeInfo ?? existing.DataTypeInfo) || !!existing.Optional !== !!(ns.Optional ?? existing.Optional) || existing.DefaultValue !== (ns.DefaultValue ?? existing.DefaultValue) || existing.Order !== (ns.Order ?? existing.Order);
            if (!changed) {
              parts.push(originalRaw);
            } else {
              let patched = originalRaw;
              patched = this._rawSetStringProp(patched, "DataType", ns.DataType ?? existing.DataType);
              patched = this._rawSetStringProp(patched, "DataTypeInfo", ns.DataTypeInfo ?? existing.DataTypeInfo ?? "");
              patched = this._rawSetBoolProp(patched, "Optional", ns.Optional ?? existing.Optional ?? false);
              patched = this._rawSetStringProp(patched, "DefaultValue", ns.DefaultValue ?? existing.DefaultValue ?? "");
              patched = this._rawSetIntProp(patched, "Order", ns.Order ?? existing.Order);
              patched = this._rawSetStringProp(patched, "RowMod", "U");
              parts.push(originalRaw);
              parts.push(patched);
            }
          } else {
            const newRow = {
              LibraryID: libraryId,
              FunctionID: functionId,
              Response: !!ns.Response,
              ParameterID: nextParamId++,
              ArgumentName: ns.ArgumentName,
              Order: ns.Order ?? parts.length,
              DataType: ns.DataType || "System.String",
              DataTypeInfo: ns.DataTypeInfo || "",
              Optional: ns.Optional ?? false,
              DefaultValue: ns.DefaultValue ?? "",
              SysRevID: 0,
              SysRowID: "00000000-0000-0000-0000-000000000000",
              BitFlag: 0,
              RowMod: "A"
            };
            parts.push(JSON.stringify(newRow));
          }
        }
        for (const es of existingSigs) {
          const stillPresent = newSigs.some(
            (ns) => ns.ArgumentName === es.ArgumentName && !!ns.Response === !!es.Response
          );
          if (!stillPresent) {
            const { objStr: originalRaw } = rawSigRows.find(
              (r) => r.sigData?.ArgumentName === es.ArgumentName && !!r.sigData?.Response === !!es.Response
            ) || {};
            if (!originalRaw) continue;
            const deleted = this._rawSetStringProp(originalRaw, "RowMod", "D");
            parts.push(originalRaw);
            parts.push(deleted);
          }
        }
        let result = raw.slice(0, sigArrayStart + 1) + parts.join(",") + raw.slice(sigArrayEnd);
        result = this._setParentLibraryRowMod(result, "U");
        result = this._setEfxFunctionRowMod(result, functionId, "U");
        JSON.parse(result);
        const applyResult = await this.applyChangesRaw(result);
        const hasErrors = (applyResult.diagnostics || []).some(
          (d) => typeof d === "object" ? (d.Severity ?? 2) >= 2 : /\berror\b/i.test(String(d))
        );
        const updatedSigs = newSigs.map((ns, i) => {
          const existing = existingSigs.find(
            (es) => es.ArgumentName === ns.ArgumentName && !!es.Response === !!ns.Response
          );
          return existing ? { ...existing, DataType: ns.DataType ?? existing.DataType, DataTypeInfo: ns.DataTypeInfo ?? existing.DataTypeInfo ?? "", Optional: ns.Optional ?? existing.Optional ?? false, DefaultValue: ns.DefaultValue ?? existing.DefaultValue ?? "", Order: ns.Order ?? i } : { LibraryID: libraryId, FunctionID: functionId, Response: !!ns.Response, ArgumentName: ns.ArgumentName, DataType: ns.DataType || "System.String", DataTypeInfo: ns.DataTypeInfo || "", Optional: ns.Optional ?? false, DefaultValue: ns.DefaultValue ?? "", Order: ns.Order ?? i };
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
            if (esc) {
              esc = false;
              continue;
            }
            if (ch === "\\") {
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
          if (ch === openCh) depth++;
          else if (ch === closeCh) {
            depth--;
            if (depth === 0) return i;
          }
        }
        return -1;
      }
      // Replace a JSON string (or null) property value in a raw object string
      _rawSetStringProp(objStr, propName, value) {
        const needle = `"${propName}":`;
        const propIdx = objStr.indexOf(needle);
        if (propIdx < 0) throw new Error(`Property "${propName}" not found`);
        let vStart = propIdx + needle.length;
        while (objStr[vStart] === " ") vStart++;
        let vEnd;
        if (objStr[vStart] === '"') {
          vEnd = vStart + 1;
          let esc = false;
          for (; vEnd < objStr.length; vEnd++) {
            const ch = objStr[vEnd];
            if (esc) {
              esc = false;
              continue;
            }
            if (ch === "\\") {
              esc = true;
              continue;
            }
            if (ch === '"') {
              vEnd++;
              break;
            }
          }
        } else {
          vEnd = vStart;
          while (vEnd < objStr.length && objStr[vEnd] !== "," && objStr[vEnd] !== "}" && objStr[vEnd] !== " " && objStr[vEnd] !== "\n" && objStr[vEnd] !== "\r") vEnd++;
        }
        return objStr.slice(0, vStart) + JSON.stringify(value) + objStr.slice(vEnd);
      }
      // Replace a JSON boolean property value in a raw object string
      _rawSetBoolProp(objStr, propName, value) {
        const needle = `"${propName}":`;
        const propIdx = objStr.indexOf(needle);
        if (propIdx < 0) throw new Error(`Property "${propName}" not found`);
        let vStart = propIdx + needle.length;
        while (objStr[vStart] === " ") vStart++;
        let vEnd = vStart;
        while (vEnd < objStr.length && objStr[vEnd] !== "," && objStr[vEnd] !== "}" && objStr[vEnd] !== " ") vEnd++;
        return objStr.slice(0, vStart) + (value ? "true" : "false") + objStr.slice(vEnd);
      }
      // Replace a JSON integer property value in a raw object string
      _rawSetIntProp(objStr, propName, value) {
        const needle = `"${propName}":`;
        const propIdx = objStr.indexOf(needle);
        if (propIdx < 0) throw new Error(`Property "${propName}" not found`);
        let vStart = propIdx + needle.length;
        while (objStr[vStart] === " ") vStart++;
        let vEnd = vStart;
        while (vEnd < objStr.length && objStr[vEnd] !== "," && objStr[vEnd] !== "}" && objStr[vEnd] !== " ") vEnd++;
        return objStr.slice(0, vStart) + String(Math.floor(value)) + objStr.slice(vEnd);
      }
      // Set RowMod on the EfxFunction row matching functionId without touching Body or SysRevID
      _setEfxFunctionRowMod(rawTableset, functionId, rowMod) {
        const funcNeedle = `"FunctionID":${JSON.stringify(functionId)}`;
        const arrayPropIdx = rawTableset.indexOf('"EfxFunction":[');
        if (arrayPropIdx < 0) throw new Error("EfxFunction array not found");
        const arrayStart = rawTableset.indexOf("[", arrayPropIdx);
        let cursor = arrayStart + 1;
        while (cursor < rawTableset.length) {
          const objStart = rawTableset.indexOf("{", cursor);
          if (objStart < 0) break;
          const objEnd = this._findJsonObjectEnd(rawTableset, objStart, "EfxFunction row");
          const objStr = rawTableset.slice(objStart, objEnd + 1);
          if (objStr.includes(funcNeedle)) {
            const patched = this._replaceJsonStringValue(objStr, "RowMod", JSON.stringify(rowMod));
            return rawTableset.slice(0, objStart) + patched + rawTableset.slice(objEnd + 1);
          }
          cursor = objEnd + 1;
        }
        throw new Error(`EfxFunction row for '${functionId}' not found`);
      }
      static extractCode(body) {
        try {
          const parsed = JSON.parse(body);
          return { code: parsed.Code || "", usings: parsed.Usings || "" };
        } catch {
          return { code: body, usings: "" };
        }
      }
      static packCode(code, usings = "") {
        return JSON.stringify({ Code: code, Usings: usings });
      }
    };
    exports2.EpicorClient = EpicorClient;
  }
});

// src/treeProvider.js
var require_treeProvider = __commonJS({
  "src/treeProvider.js"(exports2) {
    "use strict";
    var __createBinding2 = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault2 = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar2 = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding2(result, mod, k[i]);
        }
        __setModuleDefault2(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.EfxTreeProvider = exports2.FunctionNode = exports2.LibraryNode = void 0;
    var vscode2 = __importStar2(require("vscode"));
    var LibraryNode = class extends vscode2.TreeItem {
      constructor(library) {
        super(library.LibraryID, vscode2.TreeItemCollapsibleState.Collapsed);
        this.library = library;
        const parts = [];
        if (library.Published) {
          parts.push("$(cloud) Promoted");
        } else {
          parts.push("Unpromoted / Editable");
        }
        if (library.Disabled) {
          parts.push("$(circle-slash) Disabled");
        }
        if (library.LockedBy) {
          parts.push(`$(lock) ${library.LockedBy}`);
        }
        if (library.OwnedByCompany) {
          parts.push(library.OwnedByCompany);
        }
        this.description = library.Description || "";
        this.tooltip = [
          library.LibraryID,
          library.Description || "",
          `Status: ${library.Published ? "Promoted" : "Unpromoted / Editable"}`,
          library.LockedBy ? `Locked by: ${library.LockedBy}` : "Unlocked",
          library.Disabled ? "DISABLED" : "",
          `Company: ${library.OwnedByCompany || "System"}`
        ].filter(Boolean).join("\n");
        this.contextValue = library.Published ? "library-promoted" : "library-unpromoted";
        if (library.Published) {
          this.iconPath = new vscode2.ThemeIcon("cloud", new vscode2.ThemeColor("charts.green"));
        } else if (library.Disabled) {
          this.iconPath = new vscode2.ThemeIcon("circle-slash", new vscode2.ThemeColor("charts.red"));
        } else if (library.LockedBy) {
          this.iconPath = new vscode2.ThemeIcon("lock", new vscode2.ThemeColor("charts.yellow"));
        } else {
          this.iconPath = new vscode2.ThemeIcon("package");
        }
      }
    };
    exports2.LibraryNode = LibraryNode;
    var FunctionNode = class extends vscode2.TreeItem {
      constructor(libraryId, func, signatures) {
        super(func.FunctionID, vscode2.TreeItemCollapsibleState.None);
        this.libraryId = libraryId;
        this.func = func;
        this.signatures = signatures;
        const requestParams = signatures.filter((s) => !s.Response).map((s) => s.ArgumentName);
        const responseParams = signatures.filter((s) => s.Response).map((s) => s.ArgumentName);
        this.description = func.Description || "";
        this.tooltip = [
          `${func.LibraryID}.${func.FunctionID}`,
          func.Description || "",
          `Kind: ${func.Kind === 2 ? "Code-based" : func.Kind === 1 ? "Widget + Code" : "Widget"}`,
          requestParams.length ? `Request: ${requestParams.join(", ")}` : "Request: (none)",
          `Response: ${responseParams.join(", ")}`,
          func.Disabled ? "DISABLED" : "",
          func.Invalid ? "INVALID" : ""
        ].filter(Boolean).join("\n");
        this.contextValue = "function";
        this.iconPath = new vscode2.ThemeIcon(func.Invalid ? "warning" : func.Disabled ? "circle-slash" : "symbol-function");
        this.command = {
          command: "efx.pullFunction",
          title: "Pull Function",
          arguments: [{
            libraryId: this.libraryId,
            func: this.func,
            signatures: this.signatures
          }]
        };
      }
    };
    var FunctionGroupNode = class extends vscode2.TreeItem {
      constructor(libraryId, count) {
        super(`Functions (${count})`, vscode2.TreeItemCollapsibleState.Collapsed);
        this.libraryId = libraryId;
        this.contextValue = "function-group";
        this.iconPath = new vscode2.ThemeIcon("symbol-function");
      }
    };
    var ReferenceGroupNode = class extends vscode2.TreeItem {
      constructor(libraryId, kind, label, count) {
        super(`${label} (${count})`, vscode2.TreeItemCollapsibleState.Collapsed);
        this.libraryId = libraryId;
        this.kind = kind;
        this.contextValue = `reference-group-${kind}`;
        const icons = {
          tables: "database",
          services: "server",
          libraries: "library",
          assemblies: "package"
        };
        this.iconPath = new vscode2.ThemeIcon(icons[kind] || "references");
      }
    };
    var ReferenceItemNode = class extends vscode2.TreeItem {
      constructor(kind, row) {
        let label = "";
        let description = "";
        let tooltip = "";
        let icon = "references";
        if (kind === "tables") {
          label = row.TableID;
          description = row.Updatable ? "Updatable" : "Read-only";
          tooltip = [
            row.TableID,
            `Updatable: ${row.Updatable ? "Yes" : "No"}`,
            `SysRowID: ${row.SysRowID || ""}`
          ].join("\n");
          icon = row.Updatable ? "edit" : "lock";
        } else if (kind === "services") {
          label = row.ServiceID;
          description = "Service";
          tooltip = [
            row.ServiceID,
            `SysRowID: ${row.SysRowID || ""}`
          ].join("\n");
          icon = "server";
        } else if (kind === "libraries") {
          label = row.LibraryRef;
          description = row.Mode === 1 ? "Read-only" : row.Mode === 2 ? "Hidden" : "Normal";
          tooltip = [
            row.LibraryRef,
            `Mode: ${row.Mode}`,
            `SysRowID: ${row.SysRowID || ""}`
          ].join("\n");
          icon = "library";
        } else if (kind === "assemblies") {
          label = row.Assembly;
          description = "Assembly";
          tooltip = [
            row.Assembly,
            `SysRowID: ${row.SysRowID || ""}`
          ].join("\n");
          icon = "package";
        }
        super(label || "(unknown)", vscode2.TreeItemCollapsibleState.None);
        this.kind = kind;
        this.row = row;
        this.description = description;
        this.tooltip = tooltip;
        this.contextValue = `reference-item-${kind}`;
        this.iconPath = new vscode2.ThemeIcon(icon);
      }
    };
    exports2.FunctionNode = FunctionNode;
    var EfxTreeProvider = class {
      constructor(client2) {
        this.client = client2;
        this._onDidChangeTreeData = new vscode2.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.libraries = [];
        this.libraryCache = /* @__PURE__ */ new Map();
      }
      setClient(client2) {
        this.client = client2;
      }
      async refresh() {
        if (!this.client) {
          vscode2.window.showWarningMessage("EFx: Configure connection first (gear icon)");
          return;
        }
        try {
          this.libraries = await this.client.getLibraryList();
          this.libraryCache.clear();
          this._onDidChangeTreeData.fire(void 0);
          vscode2.window.showInformationMessage(`EFx: Loaded ${this.libraries.length} libraries`);
        } catch (err) {
          vscode2.window.showErrorMessage(`EFx: Failed to load libraries: ${err.message}`);
        }
      }
      async getLibraryTableset(libraryId) {
        if (!this.client) {
          return void 0;
        }
        if (this.libraryCache.has(libraryId)) {
          return this.libraryCache.get(libraryId);
        }
        try {
          const tableset = await this.client.getLibrary(libraryId);
          this.libraryCache.set(libraryId, tableset);
          return tableset;
        } catch (err) {
          vscode2.window.showErrorMessage(`EFx: Failed to load ${libraryId}: ${err.message}`);
          return void 0;
        }
      }
      invalidateCache(libraryId) {
        this.libraryCache.delete(libraryId);
      }
      getTreeItem(element) {
        return element;
      }
      async getChildren(element) {
        if (!this.client) {
          return [];
        }
        if (!element) {
          return this.libraries.sort((a, b) => a.LibraryID.localeCompare(b.LibraryID)).map((lib) => new LibraryNode(lib));
        }
        if (element instanceof LibraryNode) {
          const tableset = await this.getLibraryTableset(element.library.LibraryID);
          if (!tableset) {
            return [];
          }
          const groups = [];
          const functions = (tableset.EfxFunction || []).filter((f) => f.Kind === 2 || f.Kind === 1);
          const tables = tableset.EfxRefTable || [];
          const services = tableset.EfxRefService || [];
          const libraries = tableset.EfxRefLibrary || [];
          const assemblies = tableset.EfxRefAssembly || [];
          if (functions.length > 0 || true) {
            if (functions.length > 0) {
              groups.push(new FunctionGroupNode(element.library.LibraryID, functions.length));
            }
          }
          groups.push(new ReferenceGroupNode(element.library.LibraryID, "tables", "Tables", tables.length));
          groups.push(new ReferenceGroupNode(element.library.LibraryID, "services", "Services", services.length));
          groups.push(new ReferenceGroupNode(element.library.LibraryID, "libraries", "Libraries", libraries.length));
          groups.push(new ReferenceGroupNode(element.library.LibraryID, "assemblies", "Assemblies", assemblies.length));
          return groups;
        }
        if (element instanceof FunctionGroupNode) {
          const tableset = await this.getLibraryTableset(element.libraryId);
          if (!tableset) {
            return [];
          }
          return (tableset.EfxFunction || []).filter((f) => f.Kind === 2 || f.Kind === 1).sort((a, b) => a.FunctionID.localeCompare(b.FunctionID)).map((func) => {
            const sigs = (tableset.EfxFunctionSignature || []).filter((s) => s.FunctionID === func.FunctionID);
            return new FunctionNode(element.libraryId, func, sigs);
          });
        }
        if (element instanceof ReferenceGroupNode) {
          const tableset = await this.getLibraryTableset(element.libraryId);
          if (!tableset) {
            return [];
          }
          if (element.kind === "tables") {
            return (tableset.EfxRefTable || []).sort((a, b) => a.TableID.localeCompare(b.TableID)).map((row) => new ReferenceItemNode("tables", row));
          }
          if (element.kind === "services") {
            return (tableset.EfxRefService || []).sort((a, b) => a.ServiceID.localeCompare(b.ServiceID)).map((row) => new ReferenceItemNode("services", row));
          }
          if (element.kind === "libraries") {
            return (tableset.EfxRefLibrary || []).sort((a, b) => a.LibraryRef.localeCompare(b.LibraryRef)).map((row) => new ReferenceItemNode("libraries", row));
          }
          if (element.kind === "assemblies") {
            return (tableset.EfxRefAssembly || []).sort((a, b) => a.Assembly.localeCompare(b.Assembly)).map((row) => new ReferenceItemNode("assemblies", row));
          }
          return [];
        }
        return [];
      }
    };
    exports2.EfxTreeProvider = EfxTreeProvider;
  }
});

// src/executePanel.js
var require_executePanel = __commonJS({
  "src/executePanel.js"(exports2) {
    "use strict";
    var __createBinding2 = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault2 = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar2 = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding2(result, mod, k[i]);
        }
        __setModuleDefault2(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ExecutePanel = void 0;
    var vscode2 = __importStar2(require("vscode"));
    var ExecutePanel = class _ExecutePanel {
      constructor(panel, client2, libraryId, functionId, signatures, companies, defaultCompany, treeProvider2, staging = false) {
        this.client = client2;
        this.libraryId = libraryId;
        this.functionId = functionId;
        this.signatures = signatures;
        this.companies = Array.isArray(companies) && companies.length > 0 ? companies : defaultCompany ? [defaultCompany] : [];
        this.defaultCompany = defaultCompany || (this.companies[0] || "");
        this.treeProvider = treeProvider2 || null;
        this.staging = staging;
        this.disposed = false;
        this.panel = panel;
        this.panel.webview.onDidReceiveMessage(async (msg) => {
          if (msg.command === "execute") {
            await this.execute(msg.payload, msg.company);
          }
          if (msg.command === "saveSignatures") {
            await this.saveSignatures(msg.signatures);
          }
        });
        this.panel.onDidDispose(() => {
          this.disposed = true;
          _ExecutePanel.panels.delete(`${libraryId}.${functionId}`);
        });
        this.panel.webview.html = this.getHtml();
      }
      static show(client2, libraryId, functionId, signatures, companies, defaultCompany, treeProvider2, staging = false) {
        const key = `${libraryId}.${functionId}`;
        const existing = _ExecutePanel.panels.get(key);
        if (existing && !existing.disposed) {
          existing.panel.reveal();
          return;
        }
        const panel = vscode2.window.createWebviewPanel("efxExecute", `\u25B6 ${functionId}`, vscode2.ViewColumn.Two, { enableScripts: true, retainContextWhenHidden: true });
        const ep = new _ExecutePanel(panel, client2, libraryId, functionId, signatures, companies, defaultCompany, treeProvider2, staging);
        _ExecutePanel.panels.set(key, ep);
      }
      async execute(payload, company) {
        this.panel.webview.postMessage({ command: "executing" });
        try {
          const result = await this.client.executeFunction(this.libraryId, this.functionId, payload, company || void 0, this.staging);
          this.panel.webview.postMessage({
            command: "result",
            data: JSON.stringify(result, null, 2),
            success: true
          });
        } catch (err) {
          this.panel.webview.postMessage({
            command: "result",
            data: err.message,
            success: false
          });
        }
      }
      async saveSignatures(newSigs) {
        this.panel.webview.postMessage({ command: "sigSaving" });
        try {
          const { saved, diagnostics, updatedSigs } = await this.client.saveSignatures(
            this.libraryId,
            this.functionId,
            newSigs
          );
          if (!saved) {
            const msgs = (diagnostics || []).map(
              (d) => typeof d === "object" ? d.Message || JSON.stringify(d) : String(d)
            );
            this.panel.webview.postMessage({
              command: "sigError",
              error: msgs.join("\n") || "Epicor rejected the signature change"
            });
            return;
          }
          const otherSigs = this.signatures.filter((s) => s.FunctionID !== this.functionId);
          this.signatures = [...otherSigs, ...updatedSigs];
          if (this.treeProvider) {
            this.treeProvider.invalidateCache(this.libraryId);
          }
          this.panel.webview.postMessage({
            command: "sigSaved",
            signatures: updatedSigs
          });
        } catch (err) {
          this.panel.webview.postMessage({
            command: "sigError",
            error: err.message
          });
        }
      }
      getHtml() {
        const requestParams = this.signatures.filter((s) => !s.Response);
        const responseParams = this.signatures.filter((s) => s.Response);
        const defaultPayload = {};
        for (const p of requestParams) {
          if (p.DataType.includes("Int") || p.DataType.includes("Decimal") || p.DataType.includes("Double")) {
            defaultPayload[p.ArgumentName] = 0;
          } else if (p.DataType.includes("Boolean")) {
            defaultPayload[p.ArgumentName] = false;
          } else if (p.DataType.includes("DataSet") || p.DataType.includes("DataTable")) {
            defaultPayload[p.ArgumentName] = {};
          } else {
            defaultPayload[p.ArgumentName] = "";
          }
        }
        const requestInfo = requestParams.map((p) => `<span class="param">${p.ArgumentName} <span class="type">${p.DataType.split(".").pop()}${p.Optional ? "?" : ""}</span></span>`).join("") || '<span class="param none">No request parameters</span>';
        const responseInfo = responseParams.map((p) => `<span class="param">${p.ArgumentName} <span class="type">${p.DataType.split(".").pop()}</span></span>`).join("");
        const companyOptions = (this.companies || []).map(
          (c) => `<option value="${c}"${c === this.defaultCompany ? " selected" : ""}>${c}</option>`
        ).join("");
        const companyRow = this.companies && this.companies.length > 0 ? `<div class="company-row">
        <label for="companySelect">Company</label>
        <select id="companySelect">${companyOptions}</select>
        <button class="btn-secondary" id="toggleSigBtn" onclick="toggleSigEditor()">\u2699 Edit Signatures</button>
    </div>` : `<div class="company-row">
        <button class="btn-secondary" id="toggleSigBtn" onclick="toggleSigEditor()">\u2699 Edit Signatures</button>
    </div>`;
        const toEditorSig = (s) => ({
          ArgumentName: s.ArgumentName,
          DataType: s.DataType || "System.String",
          Optional: !!s.Optional,
          Response: !!s.Response,
          Order: s.Order ?? 0
        });
        const reqSigsJson = JSON.stringify(requestParams.map(toEditorSig));
        const respSigsJson = JSON.stringify(responseParams.map(toEditorSig));
        const typeOptionsHtml = [
          ["System.String", "String"],
          ["System.Int32", "Int32"],
          ["System.Int64", "Int64"],
          ["System.Decimal", "Decimal"],
          ["System.Double", "Double"],
          ["System.Boolean", "Boolean"],
          ["System.DateTime", "DateTime"],
          ["System.Data.DataSet", "DataSet"],
          ["System.Data.DataTable", "DataTable"]
        ].map(([v, l]) => `<option value="${v}">${l}</option>`).join("") + '<option value="__custom__">Custom\u2026</option>';
        return (
          /*html*/
          `<!DOCTYPE html>
<html>
<head>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
        font-family: var(--vscode-font-family);
        font-size: var(--vscode-font-size);
        color: var(--vscode-foreground);
        background: var(--vscode-editor-background);
        padding: 16px;
    }
    h2 {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 8px;
        color: var(--vscode-foreground);
    }
    .header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--vscode-panel-border);
    }
    .header h1 {
        font-size: 16px;
        font-weight: 600;
    }
    .header .lib {
        color: var(--vscode-descriptionForeground);
        font-size: 13px;
    }
    .company-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
    }
    .company-row label {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .company-row select {
        background: var(--vscode-dropdown-background);
        color: var(--vscode-dropdown-foreground);
        border: 1px solid var(--vscode-dropdown-border);
        border-radius: 3px;
        padding: 4px 8px;
        font-size: 13px;
        font-family: var(--vscode-font-family);
        cursor: pointer;
        min-width: 120px;
    }
    .company-row select:focus {
        outline: 1px solid var(--vscode-focusBorder);
    }
    .section {
        margin-bottom: 16px;
    }
    .params {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 8px;
    }
    .param {
        background: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 12px;
    }
    .param .type {
        opacity: 0.7;
        font-style: italic;
    }
    .param.none {
        opacity: 0.5;
        font-style: italic;
    }
    textarea {
        width: 100%;
        min-height: 200px;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border);
        border-radius: 4px;
        padding: 8px;
        font-family: var(--vscode-editor-font-family);
        font-size: var(--vscode-editor-font-size);
        resize: vertical;
    }
    textarea:focus {
        outline: 1px solid var(--vscode-focusBorder);
    }
    button {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        padding: 8px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        margin-top: 8px;
    }
    button:hover {
        background: var(--vscode-button-hoverBackground);
    }
    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .response-area {
        margin-top: 16px;
    }
    pre {
        background: var(--vscode-textCodeBlock-background);
        padding: 12px;
        border-radius: 4px;
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-word;
        font-family: var(--vscode-editor-font-family);
        font-size: var(--vscode-editor-font-size);
        max-height: 400px;
        overflow-y: auto;
    }
    .error { color: var(--vscode-errorForeground); }
    .success { color: var(--vscode-testing-iconPassed); }
    .spinner { display: none; opacity: 0.7; }
    .spinner.active { display: inline; }
    .btn-secondary {
        background: var(--vscode-button-secondaryBackground, #3a3d41);
        color: var(--vscode-button-secondaryForeground, #ccc);
        border: none; border-radius: 4px; padding: 4px 10px;
        font-size: 12px; font-weight: 600; cursor: pointer; margin-top: 0;
    }
    .btn-secondary:hover { background: var(--vscode-button-secondaryHoverBackground, #45494e); }
    .btn-secondary.active { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
    .sig-editor { display: none; border: 1px solid var(--vscode-panel-border); border-radius: 4px; margin-bottom: 12px; overflow: hidden; }
    .sig-editor.open { display: block; }
    .sig-tabs { display: flex; border-bottom: 1px solid var(--vscode-panel-border); background: var(--vscode-sideBarSectionHeader-background, rgba(255,255,255,0.04)); }
    .sig-tab { padding: 6px 16px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; background: transparent; color: var(--vscode-descriptionForeground); border-bottom: 2px solid transparent; margin-bottom: -1px; }
    .sig-tab:hover { color: var(--vscode-foreground); }
    .sig-tab.active { color: var(--vscode-foreground); border-bottom-color: var(--vscode-button-background); }
    .sig-col-headers { display: grid; grid-template-columns: 1fr 150px 65px auto; gap: 6px; padding: 5px 10px 3px; border-bottom: 1px solid var(--vscode-panel-border); font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; color: var(--vscode-descriptionForeground); }
    .sig-rows { padding: 6px 8px; display: flex; flex-direction: column; gap: 5px; min-height: 30px; }
    .sig-row { display: grid; grid-template-columns: 1fr 150px 65px auto; gap: 6px; align-items: start; }
    .sig-row input, .sig-row select { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 3px; padding: 3px 6px; font-size: 12px; font-family: var(--vscode-font-family); width: 100%; }
    .sig-row input:focus, .sig-row select:focus { outline: 1px solid var(--vscode-focusBorder); }
    .type-cell { display: flex; flex-direction: column; gap: 3px; }
    .opt-label { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--vscode-descriptionForeground); padding-top: 4px; cursor: pointer; }
    .sig-empty { font-size: 12px; color: var(--vscode-descriptionForeground); padding: 10px; font-style: italic; }
    .sig-footer { padding: 7px 8px; border-top: 1px solid var(--vscode-panel-border); display: flex; gap: 6px; align-items: center; flex-wrap: wrap; background: var(--vscode-sideBarSectionHeader-background, rgba(255,255,255,0.03)); }
    .sig-footer input, .sig-footer select { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 3px; padding: 3px 7px; font-size: 12px; font-family: var(--vscode-font-family); }
    #newArgName { flex: 1; min-width: 90px; }
    #newDataType { min-width: 120px; }
    #newCustomType { flex: 1.5; min-width: 100px; display: none; }
    .add-btn { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 3px; padding: 3px 10px; font-size: 13px; font-weight: bold; cursor: pointer; }
    .add-btn:hover { background: var(--vscode-button-hoverBackground); }
    .btn-icon { background: transparent; color: var(--vscode-foreground); border: none; padding: 2px 5px; font-size: 13px; border-radius: 3px; opacity: 0.65; cursor: pointer; }
    .btn-icon:hover { opacity: 1; background: var(--vscode-toolbar-hoverBackground, rgba(255,255,255,0.1)); }
    .sig-save-bar { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-top: 1px solid var(--vscode-panel-border); flex-wrap: wrap; }
    .sig-status { font-size: 12px; flex: 1; }
    .sig-status.ok { color: var(--vscode-testing-iconPassed); }
    .sig-status.err { color: var(--vscode-errorForeground); }
    .sig-status.saving { color: var(--vscode-descriptionForeground); font-style: italic; }
    .btn-save { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; padding: 5px 14px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .btn-save:hover { background: var(--vscode-button-hoverBackground); }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
    .staging-badge {
        background: var(--vscode-statusBarItem-warningBackground, #cc6600);
        color: var(--vscode-statusBarItem-warningForeground, #fff);
        font-size: 10px; font-weight: 700; padding: 2px 7px;
        border-radius: 3px; letter-spacing: 0.4px; text-transform: uppercase;
    }
    .response-header {
        display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
    }
    .response-header h2 { margin-bottom: 0; }
    .btn-copy {
        background: transparent;
        color: var(--vscode-descriptionForeground);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 3px; padding: 2px 8px; font-size: 11px; font-weight: 600;
        cursor: pointer; margin-top: 0;
    }
    .btn-copy:hover { color: var(--vscode-foreground); background: var(--vscode-toolbar-hoverBackground, rgba(255,255,255,0.1)); }
    .btn-copy.copied { color: var(--vscode-testing-iconPassed); border-color: var(--vscode-testing-iconPassed); }
    .dataset-table-wrap {
        margin-top: 10px; border: 1px solid var(--vscode-panel-border); border-radius: 4px; overflow: hidden;
    }
    .dataset-tabs {
        display: flex; background: var(--vscode-sideBarSectionHeader-background, rgba(255,255,255,0.04));
        border-bottom: 1px solid var(--vscode-panel-border); flex-wrap: wrap;
    }
    .dataset-tab {
        padding: 5px 14px; font-size: 11px; font-weight: 600; cursor: pointer;
        border: none; background: transparent; color: var(--vscode-descriptionForeground);
        border-bottom: 2px solid transparent; margin-bottom: -1px;
    }
    .dataset-tab.active { color: var(--vscode-foreground); border-bottom-color: var(--vscode-button-background); }
    .dataset-table-container { overflow-x: auto; max-height: 300px; overflow-y: auto; }
    table.dataset-table { border-collapse: collapse; font-size: 12px; width: 100%; }
    table.dataset-table th {
        background: var(--vscode-sideBarSectionHeader-background, rgba(255,255,255,0.06));
        padding: 5px 10px; text-align: left; font-weight: 600; font-size: 11px;
        border-bottom: 1px solid var(--vscode-panel-border);
        white-space: nowrap; position: sticky; top: 0;
    }
    table.dataset-table td {
        padding: 4px 10px; border-bottom: 1px solid var(--vscode-panel-border, rgba(255,255,255,0.06));
        max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        font-family: var(--vscode-editor-font-family); font-size: 12px;
    }
    table.dataset-table tr:last-child td { border-bottom: none; }
    table.dataset-table tr:hover td { background: var(--vscode-list-hoverBackground); }
    .dataset-empty { padding: 10px; font-size: 12px; color: var(--vscode-descriptionForeground); font-style: italic; }
</style>
</head>
<body>
    <div class="header">
        <h1>\u25B6 ${this.functionId}</h1>
        <span class="lib">${this.libraryId}</span>
        ${this.staging ? '<span class="staging-badge">staging</span>' : ""}
    </div>

    ${companyRow}

    <div class="sig-editor" id="sigEditor">
        <div class="sig-tabs">
            <button class="sig-tab active" id="tabReq"  onclick="switchTab('request')">Request Params</button>
            <button class="sig-tab"        id="tabResp" onclick="switchTab('response')">Response Params</button>
        </div>
        <div class="sig-col-headers"><span>Argument Name</span><span>Data Type</span><span>Optional</span><span></span></div>
        <div class="sig-rows" id="sigRows"></div>
        <div class="sig-footer">
            <input  id="newArgName"    placeholder="ArgumentName" />
            <select id="newDataType">${typeOptionsHtml}</select>
            <input  id="newCustomType" placeholder="Full .NET type name" />
            <button class="add-btn" onclick="addSigRow()">\uFF0B Add</button>
        </div>
        <div class="sig-save-bar">
            <span class="sig-status" id="sigStatus"></span>
            <button class="btn-save" id="saveBtn" onclick="saveSignatures()">\u{1F4BE} Save to Epicor</button>
        </div>
    </div>

    <div class="section">
        <h2>Request Parameters</h2>
        <div class="params">${requestInfo}</div>
        <textarea id="payload" spellcheck="false">${JSON.stringify(defaultPayload, null, 2)}</textarea>
    </div>

    <button id="executeBtn" onclick="doExecute()">
        Execute
    </button>
    <span class="spinner" id="spinner">\u23F3 Running...</span>

    <div class="response-area">
        <div class="response-header">
            <h2>Response</h2>
            <button class="btn-copy" id="copyBtn" onclick="copyResponse()" title="Copy response to clipboard">\u2398 Copy</button>
        </div>
        <div class="params">${responseInfo}</div>
        <pre id="response">\u2014 No response yet \u2014</pre>
        <div id="datasetWrap" class="dataset-table-wrap" style="display:none"></div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const staging = ${this.staging ? "true" : "false"};

        let reqSigs  = ${reqSigsJson};
        let respSigs = ${respSigsJson};
        let activeTab  = 'request';
        let editorOpen = false;

        function toggleSigEditor() {
            editorOpen = !editorOpen;
            document.getElementById('sigEditor').className  = 'sig-editor' + (editorOpen ? ' open' : '');
            document.getElementById('toggleSigBtn').className = 'btn-secondary' + (editorOpen ? ' active' : '');
            if (editorOpen) renderSigRows();
        }
        function switchTab(tab) {
            activeTab = tab;
            document.getElementById('tabReq').className  = 'sig-tab' + (tab === 'request'  ? ' active' : '');
            document.getElementById('tabResp').className = 'sig-tab' + (tab === 'response' ? ' active' : '');
            renderSigRows();
        }
        const knownTypes = [
            'System.String','System.Int32','System.Int64','System.Decimal',
            'System.Double','System.Boolean','System.DateTime',
            'System.Data.DataSet','System.Data.DataTable'
        ];
        function renderSigRows() {
            const sigs = activeTab === 'request' ? reqSigs : respSigs;
            const container = document.getElementById('sigRows');
            container.innerHTML = '';
            if (sigs.length === 0) { container.innerHTML = '<div class="sig-empty">No parameters \u2014 use \uFF0B Add below.</div>'; return; }
            sigs.forEach((sig, idx) => {
                const row = document.createElement('div');
                row.className = 'sig-row';
                const nameInput = document.createElement('input');
                nameInput.value = sig.ArgumentName;
                nameInput.addEventListener('change', () => { sig.ArgumentName = nameInput.value.trim(); setSigStatus(''); });
                const isKnown = knownTypes.includes(sig.DataType);
                const typeCell = document.createElement('div');
                typeCell.className = 'type-cell';
                const typeSelect = document.createElement('select');
                knownTypes.forEach(t => { const o = document.createElement('option'); o.value = t; o.textContent = t.replace('System.Data.','').replace('System.',''); if (t === sig.DataType) o.selected = true; typeSelect.appendChild(o); });
                const customOpt = document.createElement('option'); customOpt.value = '__custom__'; customOpt.textContent = isKnown ? 'Custom\u2026' : sig.DataType; if (!isKnown) customOpt.selected = true; typeSelect.appendChild(customOpt);
                const customInput = document.createElement('input'); customInput.placeholder = 'Full .NET type'; customInput.value = isKnown ? '' : sig.DataType; customInput.style.display = isKnown ? 'none' : '';
                customInput.addEventListener('change', () => { if (customInput.value.trim()) sig.DataType = customInput.value.trim(); setSigStatus(''); });
                typeSelect.addEventListener('change', () => { if (typeSelect.value === '__custom__') { customInput.style.display = ''; customInput.focus(); } else { customInput.style.display = 'none'; sig.DataType = typeSelect.value; setSigStatus(''); } });
                typeCell.appendChild(typeSelect); typeCell.appendChild(customInput);
                const optLabel = document.createElement('label'); optLabel.className = 'opt-label';
                const optCheck = document.createElement('input'); optCheck.type = 'checkbox'; optCheck.checked = !!sig.Optional;
                optCheck.addEventListener('change', () => { sig.Optional = optCheck.checked; setSigStatus(''); });
                optLabel.appendChild(optCheck); optLabel.appendChild(document.createTextNode(' Optional'));
                const removeBtn = document.createElement('button'); removeBtn.className = 'btn-icon'; removeBtn.textContent = '\u2715'; removeBtn.title = 'Remove';
                removeBtn.addEventListener('click', () => { (activeTab === 'request' ? reqSigs : respSigs).splice(idx, 1); renderSigRows(); setSigStatus(''); });
                row.appendChild(nameInput); row.appendChild(typeCell); row.appendChild(optLabel); row.appendChild(removeBtn);
                container.appendChild(row);
            });
        }
        function addSigRow() {
            const nameInput = document.getElementById('newArgName');
            const typeSelect = document.getElementById('newDataType');
            const customInput = document.getElementById('newCustomType');
            const name = nameInput.value.trim();
            if (!name) { nameInput.focus(); return; }
            const dataType = typeSelect.value === '__custom__' ? (customInput.value.trim() || 'System.String') : typeSelect.value;
            const sigs = activeTab === 'request' ? reqSigs : respSigs;
            sigs.push({ ArgumentName: name, DataType: dataType, Optional: false, Response: activeTab === 'response', Order: sigs.length });
            nameInput.value = ''; customInput.value = ''; customInput.style.display = 'none'; typeSelect.value = 'System.String';
            renderSigRows(); setSigStatus(''); nameInput.focus();
        }
        document.getElementById('newArgName').addEventListener('keydown', e => { if (e.key === 'Enter') addSigRow(); });
        document.getElementById('newDataType').addEventListener('change', function() {
            const ci = document.getElementById('newCustomType');
            ci.style.display = this.value === '__custom__' ? '' : 'none';
            if (this.value === '__custom__') ci.focus();
        });
        function saveSignatures() {
            reqSigs.forEach((s, i) => { s.Order = i; s.Response = false; });
            respSigs.forEach((s, i) => { s.Order = i; s.Response = true; });
            document.getElementById('saveBtn').disabled = true;
            setSigStatus('Saving to Epicor\u2026', 'saving');
            vscode.postMessage({ command: 'saveSignatures', signatures: [...reqSigs, ...respSigs] });
        }
        function setSigStatus(msg, kind) {
            const el = document.getElementById('sigStatus');
            el.textContent = msg;
            el.className = 'sig-status' + (kind ? ' ' + kind : '');
        }

        // \u2500\u2500 Copy response to clipboard \u2500\u2500
        function copyResponse() {
            const text = document.getElementById('response').textContent;
            if (!text || text === '\u2014 No response yet \u2014') return;
            navigator.clipboard.writeText(text).then(() => {
                const btn = document.getElementById('copyBtn');
                btn.textContent = '\u2713 Copied';
                btn.classList.add('copied');
                setTimeout(() => { btn.textContent = '\u2398 Copy'; btn.classList.remove('copied'); }, 1500);
            });
        }

        // \u2500\u2500 DataSet / tableset table renderer \u2500\u2500
        function looksLikeDataSet(obj) {
            if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
            // Check at any depth for an array-of-objects
            function hasTableAnywhere(o, depth) {
                if (depth > 5) return false;
                for (const v of Object.values(o)) {
                    if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object') return true;
                    if (v && typeof v === 'object' && !Array.isArray(v) && hasTableAnywhere(v, depth + 1)) return true;
                }
                return false;
            }
            return hasTableAnywhere(obj, 0);
        }

        // Recursively find all array-of-objects, using dot-path keys (e.g. "ds.Parts")
        function extractTables(obj, prefix, depth) {
            if (depth === undefined) depth = 0;
            if (prefix === undefined) prefix = '';
            if (depth > 5) return {};
            const tables = {};
            for (const [k, v] of Object.entries(obj)) {
                const key = prefix ? prefix + '.' + k : k;
                if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object') {
                    tables[key] = v;
                } else if (v && typeof v === 'object' && !Array.isArray(v)) {
                    Object.assign(tables, extractTables(v, key, depth + 1));
                }
            }
            return tables;
        }

        let activeDatasetTab = null;
        function renderDatasetTables(obj) {
            const wrap = document.getElementById('datasetWrap');
            const tables = extractTables(obj);
            const keys = Object.keys(tables);
            if (keys.length === 0) { wrap.style.display = 'none'; return; }
            wrap.style.display = '';
            activeDatasetTab = activeDatasetTab && tables[activeDatasetTab] ? activeDatasetTab : keys[0];

            const tabHtml = keys.map(k =>
                \`<button class="dataset-tab\${k === activeDatasetTab ? ' active' : ''}" onclick="switchDatasetTab('\${k}')">\${k} <span style="opacity:.55;font-weight:400;">(\${tables[k].length})</span></button>\`
            ).join('');

            const rows = tables[activeDatasetTab];
            const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
            const colHeaders = cols.map(c => \`<th>\${c}</th>\`).join('');
            const bodyRows = rows.map(r =>
                \`<tr>\${cols.map(c => {
                    const val = r[c];
                    const display = val === null || val === undefined ? '<span style="opacity:.4">null</span>'
                        : typeof val === 'object' ? JSON.stringify(val)
                        : String(val);
                    return \`<td title="\${String(val ?? '').replace(/"/g,'&quot;')}">\${display}</td>\`;
                }).join('')}</tr>\`
            ).join('');

            wrap.innerHTML = \`
                <div class="dataset-tabs">\${tabHtml}</div>
                <div class="dataset-table-container">
                    \${cols.length > 0
                        ? \`<table class="dataset-table"><thead><tr>\${colHeaders}</tr></thead><tbody>\${bodyRows}</tbody></table>\`
                        : '<div class="dataset-empty">No rows</div>'}
                </div>\`;
        }

        function switchDatasetTab(key) {
            activeDatasetTab = key;
            try {
                const obj = JSON.parse(document.getElementById('response').textContent);
                renderDatasetTables(obj);
            } catch(e) {}
        }

        function doExecute() {
            const textarea = document.getElementById('payload');
            let payload;
            try {
                payload = JSON.parse(textarea.value);
            } catch(e) {
                document.getElementById('response').textContent = 'Invalid JSON: ' + e.message;
                document.getElementById('response').className = 'error';
                return;
            }
            const selectEl = document.getElementById('companySelect');
            const company = selectEl ? selectEl.value : '';
            vscode.postMessage({ command: 'execute', payload, company });
        }

        window.addEventListener('message', (event) => {
            const msg = event.data;
            const btn = document.getElementById('executeBtn');
            const spinner = document.getElementById('spinner');
            const response = document.getElementById('response');
            const datasetWrap = document.getElementById('datasetWrap');

            if (msg.command === 'executing') {
                btn.disabled = true;
                spinner.className = 'spinner active';
                response.textContent = '\u23F3 Executing...';
                response.className = '';
                datasetWrap.style.display = 'none';
            }
            if (msg.command === 'result') {
                btn.disabled = false;
                spinner.className = 'spinner';
                response.textContent = msg.data;
                response.className = msg.success ? 'success' : 'error';
                // Try to parse and render as DataSet table
                if (msg.success) {
                    try {
                        const parsed = JSON.parse(msg.data);
                        activeDatasetTab = null;
                        if (looksLikeDataSet(parsed)) {
                            renderDatasetTables(parsed);
                        } else {
                            datasetWrap.style.display = 'none';
                        }
                    } catch(e) {
                        datasetWrap.style.display = 'none';
                    }
                } else {
                    datasetWrap.style.display = 'none';
                }
            }
            if (msg.command === 'sigSaving') {
                setSigStatus('Saving to Epicor\u2026', 'saving');
            }
            if (msg.command === 'sigSaved') {
                document.getElementById('saveBtn').disabled = false;
                reqSigs  = (msg.signatures || []).filter(s => !s.Response);
                respSigs = (msg.signatures || []).filter(s =>  s.Response);
                renderSigRows();
                setSigStatus('\u2713 Saved to Epicor', 'ok');
            }
            if (msg.command === 'sigError') {
                document.getElementById('saveBtn').disabled = false;
                setSigStatus('\u2717 ' + (msg.error || 'Save failed'), 'err');
            }
        });
    </script>
</body>
</html>`
        );
      }
    };
    exports2.ExecutePanel = ExecutePanel;
    ExecutePanel.panels = /* @__PURE__ */ new Map();
  }
});

// src/bpmClient.js
var require_bpmClient = __commonJS({
  "src/bpmClient.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.BpmClient = void 0;
    var DIRECTIVE_TYPE = {
      PRE: 1,
      BASE: 2,
      POST: 3
    };
    exports2.DIRECTIVE_TYPE = DIRECTIVE_TYPE;
    function xmlEncode(str) {
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\t/g, "&#x9;").replace(/\r\n/g, "&#xA;").replace(/\n/g, "&#xA;").replace(/\r/g, "&#xA;");
    }
    function xmlDecode(str) {
      return str.replace(/&#xA;/g, "\n").replace(/&#xD;/g, "\r").replace(/&#x9;/g, "	").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    }
    exports2.xmlDecode = xmlDecode;
    exports2.xmlEncode = xmlEncode;
    function extractBpmCode(body) {
      if (!body) return { code: "", hasCustomCode: false };
      const idx = body.indexOf("CustomCodeAction");
      if (idx < 0) return { code: "", hasCustomCode: false };
      const codeAttr = 'Code="';
      const codeStart = body.indexOf(codeAttr, idx);
      if (codeStart < 0) return { code: "", hasCustomCode: false };
      const valueStart = codeStart + codeAttr.length;
      let valueEnd = valueStart;
      while (valueEnd < body.length) {
        if (body[valueEnd] === '"') break;
        if (body[valueEnd] === "&") {
          const semi = body.indexOf(";", valueEnd);
          if (semi < 0) break;
          valueEnd = semi + 1;
          continue;
        }
        valueEnd++;
      }
      const encoded = body.slice(valueStart, valueEnd);
      return { code: xmlDecode(encoded), hasCustomCode: true };
    }
    exports2.extractBpmCode = extractBpmCode;
    function replaceBpmCode(body, newCode) {
      const idx = body.indexOf("CustomCodeAction");
      if (idx < 0) throw new Error("No CustomCodeAction found in directive body");
      const codeAttr = 'Code="';
      const codeStart = body.indexOf(codeAttr, idx);
      if (codeStart < 0) throw new Error("No Code= attribute found in CustomCodeAction");
      const valueStart = codeStart + codeAttr.length;
      let valueEnd = valueStart;
      while (valueEnd < body.length) {
        if (body[valueEnd] === '"') break;
        if (body[valueEnd] === "&") {
          const semi = body.indexOf(";", valueEnd);
          if (semi < 0) break;
          valueEnd = semi + 1;
          continue;
        }
        valueEnd++;
      }
      return body.slice(0, valueStart) + xmlEncode(newCode) + body.slice(valueEnd);
    }
    exports2.replaceBpmCode = replaceBpmCode;
    function updateRawBpmDirective(rawTableset, directiveId, newCode) {
      const arrayNeedle = '"BpDirective":[';
      const arrayPropIdx = rawTableset.indexOf(arrayNeedle);
      if (arrayPropIdx < 0) throw new Error("BpDirective array not found in raw tableset");
      const arrayStart = rawTableset.indexOf("[", arrayPropIdx);
      const idNeedle = `"DirectiveID":"${directiveId}"`;
      let cursor = arrayStart + 1;
      while (cursor < rawTableset.length) {
        const objStart = rawTableset.indexOf("{", cursor);
        if (objStart < 0) break;
        let depth = 0;
        let inStr = false;
        let esc = false;
        let objEnd = -1;
        for (let i = objStart; i < rawTableset.length; i++) {
          const ch = rawTableset[i];
          if (inStr) {
            if (esc) {
              esc = false;
              continue;
            }
            if (ch === "\\") {
              esc = true;
              continue;
            }
            if (ch === '"') {
              inStr = false;
            }
            continue;
          }
          if (ch === '"') {
            inStr = true;
            continue;
          }
          if (ch === "{") depth++;
          else if (ch === "}") {
            depth--;
            if (depth === 0) {
              objEnd = i;
              break;
            }
          }
        }
        if (objEnd < 0) throw new Error("Malformed BpDirective object in raw tableset");
        const objStr = rawTableset.slice(objStart, objEnd + 1);
        if (objStr.includes(idNeedle)) {
          const bodyKey = '"Body":"';
          const bodyKeyIdx = objStr.indexOf(bodyKey);
          if (bodyKeyIdx < 0) throw new Error("Body field not found in BpDirective row");
          const valueStart = bodyKeyIdx + bodyKey.length;
          let i = valueStart;
          let escaped = false;
          while (i < objStr.length) {
            const ch = objStr[i];
            if (escaped) {
              escaped = false;
              i++;
              continue;
            }
            if (ch === "\\") {
              escaped = true;
              i++;
              continue;
            }
            if (ch === '"') break;
            i++;
          }
          if (i >= objStr.length) throw new Error("Body string value did not terminate");
          const valueEnd = i;
          const bodyJsonLiteral = '"' + objStr.slice(valueStart, valueEnd) + '"';
          let bodyXaml;
          try {
            bodyXaml = JSON.parse(bodyJsonLiteral);
          } catch (e) {
            throw new Error("Failed to JSON-parse Body value: " + e.message);
          }
          const newBodyXaml = replaceBpmCode(bodyXaml, newCode);
          const newBodyEncoded = JSON.stringify(newBodyXaml).slice(1, -1);
          const newObjBody = objStr.slice(0, valueStart) + newBodyEncoded + objStr.slice(valueEnd);
          let result = rawTableset.slice(0, objStart) + objStr + "," + newObjBody + rawTableset.slice(objEnd + 1);
          const rowModTarget = '"BitFlag":0,"RowMod":""';
          const rowModReplacement = '"BitFlag":0,"RowMod":"U"';
          const searchFrom = objStart + objStr.length + 1;
          const searchTo = searchFrom + newObjBody.length;
          const rmIdx = result.indexOf(rowModTarget, searchFrom);
          if (rmIdx < 0 || rmIdx > searchTo) {
            throw new Error(`BitFlag/RowMod anchor not found for directive ${directiveId}`);
          }
          return result.slice(0, rmIdx) + rowModReplacement + result.slice(rmIdx + rowModTarget.length);
        }
        cursor = objEnd + 1;
      }
      throw new Error(`Directive ${directiveId} not found in raw tableset`);
    }
    exports2.updateRawBpmDirective = updateRawBpmDirective;
    var BpmClient = class {
      constructor(epicorClient) {
        this._client = epicorClient;
      }
      getBpmUrl(method) {
        const base = this._client.config.serverUrl.replace(/\/$/, "");
        return `${base}/api/v2/odata/${this._client.config.company}/Ice.BO.BpMethodSvc/${method}`;
      }
      async request(url, body) {
        return this._client.request(url, body);
      }
      async requestRaw(url, bodyStr) {
        return this._client.requestRaw(url, bodyStr);
      }
      // ── Get all services that have BPMs ──
      async getBpmServices() {
        const result = await this.request(this.getBpmUrl("GetBpmDirectiveServicesTS"), {});
        return result.returnObj?.BpDirectiveService || [];
      }
      // ── Get methods for a service (with directive presence flags) ──
      async getBpmMethodsByService(systemCode, serviceKind, serviceName) {
        const result = await this.request(this.getBpmUrl("GetRowsEx"), {
          source: "BO",
          whereClauseBpMethod: `SystemCode = '${systemCode}' and ObjectNS = '${serviceKind}' and BusinessObject = '${serviceName}'`,
          whereClauseBpDirective: "",
          pageSize: 500,
          absolutePage: 1
        });
        const ts = result.returnObj;
        return {
          methods: ts?.BpMethod || [],
          directives: ts?.BpDirective || []
        };
      }
      // ── Get full tableset for one method ──
      async getBpmMethod(source, bpMethodCode) {
        const result = await this.request(this.getBpmUrl("GetByIDBpMethod"), {
          source,
          bpMethodCode
        });
        return result.returnObj;
      }
      // ── Get full tableset raw (preserves SysRevID int64) ──
      async getBpmMethodRaw(source, bpMethodCode) {
        const raw = await this.requestRaw(
          this.getBpmUrl("GetByIDBpMethod"),
          JSON.stringify({ source, bpMethodCode })
        );
        const match = raw.match(/"returnObj"\s*:\s*(\{.*\})\s*\}$/s);
        return match ? match[1] : raw;
      }
      // ── Update directives using raw JSON (preserves SysRevID int64) ──
      async updateBpmRaw(rawTableset) {
        const body = `{"ds":${rawTableset}}`;
        const rawResult = await this.requestRaw(this.getBpmUrl("Update"), body);
        try {
          return JSON.parse(rawResult);
        } catch {
          return {};
        }
      }
      // ── Validate custom code (syntax check without saving) ──
      async validateCustomCode(code, functionDefinition) {
        const codeSnippetWithScope = JSON.stringify({ Code: code, IsCondition: false });
        const result = await this.request(this.getBpmUrl("ValidateCustomCode"), {
          codeSnippetWithScope,
          functionDefinition: JSON.stringify(functionDefinition),
          isAsync: false
        });
        return result.returnObj?.diagnostics || null;
      }
    };
    exports2.BpmClient = BpmClient;
    function buildFunctionDefinition(method, args) {
      const sc = method.SystemCode || "Erp";
      const productCode = sc.charAt(0).toUpperCase() + sc.slice(1).toLowerCase();
      const directionMap = { "INPUT": 0, "OUTPUT": 1, "INPUT-OUTPUT": 2 };
      return {
        FunctionKind: 0,
        Target: {
          kind: 0,
          id: method.BpMethodCode,
          alias: method.BpMethodCode,
          productCode: { value: productCode },
          name: method.BusinessObject,
          method: method.Name,
          hasRootTransaction: method.HasRootTransaction
        },
        SupportsAdvancedFeatures: true,
        SupportsDbAccessInCode: 0,
        DebugMode: method.DebugMode || false,
        Arguments: (args || []).map((a) => ({
          Name: a.BpArgumentName,
          Type: a.TypeInfo,
          TypeName: a.Type,
          Direction: directionMap[a.Direction] ?? 2,
          Kind: directionMap[a.Direction] ?? 2
        })),
        LocalVariables: [],
        CustomReferences: [
          { Name: "Assemblies", IsStandard: false, IsEditable: true, References: {} },
          { Name: "Externals", IsStandard: false, IsEditable: true, References: {} },
          { Name: "Standard", IsStandard: true, IsEditable: true, References: {} }
        ],
        CustomUsings: ""
      };
    }
    exports2.buildFunctionDefinition = buildFunctionDefinition;
  }
});

// src/bpmTreeProvider.js
var require_bpmTreeProvider = __commonJS({
  "src/bpmTreeProvider.js"(exports2) {
    "use strict";
    var __importStar2 = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding2(result, mod, k[i]);
        }
        __setModuleDefault2(result, mod);
        return result;
      };
    })();
    var __createBinding2 = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault2 = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.BpmTreeProvider = void 0;
    var vscode2 = __importStar2(require("vscode"));
    var bpmClient_12 = require_bpmClient();
    var BpmServiceNode = class extends vscode2.TreeItem {
      constructor(svc) {
        const label = `${svc.SystemCode}.${svc.ServiceKind}.${svc.ServiceName}`;
        super(label, vscode2.TreeItemCollapsibleState.Collapsed);
        this.svc = svc;
        this.contextValue = "bpm-service";
        this.iconPath = new vscode2.ThemeIcon("server");
        this.tooltip = `${svc.SystemCode} / ${svc.ServiceKind} / ${svc.ServiceName}`;
      }
    };
    var BpmMethodNode = class extends vscode2.TreeItem {
      constructor(method, directives) {
        super(method.Name, vscode2.TreeItemCollapsibleState.Collapsed);
        this.method = method;
        this.directives = directives;
        this.contextValue = "bpm-method";
        const flags = [];
        if (method.HasPreProcessing) flags.push("Pre");
        if (method.HasBaseProcessing) flags.push("Base");
        if (method.HasPostProcessing) flags.push("Post");
        if (method.Disabled) flags.push("Disabled");
        if (method.HasOutdatedDirectives) flags.push("\u26A0 Outdated");
        this.description = flags.join(" \xB7 ") || "No directives";
        this.tooltip = [
          `${method.BpMethodCode}`,
          `Source: ${method.Source}`,
          flags.length ? `Flags: ${flags.join(", ")}` : ""
        ].filter(Boolean).join("\n");
        if (method.Disabled) {
          this.iconPath = new vscode2.ThemeIcon("circle-slash", new vscode2.ThemeColor("charts.red"));
        } else if (method.HasOutdatedDirectives) {
          this.iconPath = new vscode2.ThemeIcon("warning", new vscode2.ThemeColor("charts.yellow"));
        } else if (flags.length > 0) {
          this.iconPath = new vscode2.ThemeIcon("symbol-event", new vscode2.ThemeColor("charts.blue"));
        } else {
          this.iconPath = new vscode2.ThemeIcon("symbol-event");
        }
      }
    };
    var BpmDirectiveNode = class extends vscode2.TreeItem {
      constructor(directive) {
        super(directive.Name, vscode2.TreeItemCollapsibleState.None);
        this.directive = directive;
        const typeLabel = directive.DirectiveType === 1 ? "Pre" : directive.DirectiveType === 3 ? "Post" : directive.DirectiveType === 2 ? "Base" : `Type${directive.DirectiveType}`;
        const { hasCustomCode } = bpmClient_12.extractBpmCode(directive.Body);
        this.description = [
          typeLabel,
          !directive.IsEnabled ? "Disabled" : "",
          !hasCustomCode ? "No code" : "",
          directive.DirectiveGroup ? `[${directive.DirectiveGroup}]` : ""
        ].filter(Boolean).join(" \xB7 ");
        this.contextValue = hasCustomCode ? "bpm-directive-code" : "bpm-directive-nocode";
        if (!hasCustomCode) {
          this.command = {
            command: "efx.bpm.openWidgetPanel",
            title: "Open Widget Panel",
            arguments: [{ directive }]
          };
        }
        this.tooltip = [
          directive.Name,
          `Type: ${typeLabel}`,
          `Enabled: ${directive.IsEnabled}`,
          `Group: ${directive.DirectiveGroup || "(none)"}`,
          hasCustomCode ? "Has custom C# code" : "No custom code (widget/condition only)",
          directive.CompilerDiagnostics ? `Diagnostics: ${directive.CompilerDiagnostics}` : ""
        ].filter(Boolean).join("\n");
        if (!directive.IsEnabled) {
          this.iconPath = new vscode2.ThemeIcon("circle-slash", new vscode2.ThemeColor("charts.red"));
        } else if (!hasCustomCode) {
          this.iconPath = new vscode2.ThemeIcon("gear");
        } else if (directive.DirectiveType === 1) {
          this.iconPath = new vscode2.ThemeIcon("arrow-up", new vscode2.ThemeColor("charts.blue"));
        } else if (directive.DirectiveType === 3) {
          this.iconPath = new vscode2.ThemeIcon("arrow-down", new vscode2.ThemeColor("charts.green"));
        } else {
          this.iconPath = new vscode2.ThemeIcon("symbol-event");
        }
        if (hasCustomCode) {
          this.command = {
            command: "efx.bpm.pullDirective",
            title: "Pull Directive Code",
            arguments: [{ directive }]
          };
        }
      }
    };
    exports2.BpmServiceNode = BpmServiceNode;
    exports2.BpmMethodNode = BpmMethodNode;
    exports2.BpmDirectiveNode = BpmDirectiveNode;
    var BpmTreeProvider = class {
      constructor(bpmClient) {
        this.bpmClient = bpmClient;
        this._onDidChangeTreeData = new vscode2.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.services = [];
        this.methodCache = /* @__PURE__ */ new Map();
      }
      setClient(bpmClient) {
        this.bpmClient = bpmClient;
      }
      async refresh() {
        if (!this.bpmClient) {
          vscode2.window.showWarningMessage("BPM: Configure EFx connection first");
          return;
        }
        try {
          this.services = await this.bpmClient.getBpmServices();
          this.methodCache.clear();
          this._onDidChangeTreeData.fire(void 0);
          vscode2.window.showInformationMessage(`BPM: Loaded ${this.services.length} services`);
        } catch (err) {
          vscode2.window.showErrorMessage(`BPM: Failed to load services: ${err.message}`);
        }
      }
      invalidateService(systemCode, serviceKind, serviceName) {
        const key = `${systemCode}.${serviceKind}.${serviceName}`;
        this.methodCache.delete(key);
      }
      getTreeItem(element) {
        return element;
      }
      async getChildren(element) {
        if (!this.bpmClient) return [];
        if (!element) {
          return this.services.sort((a, b) => {
            const ka = `${a.SystemCode}.${a.ServiceKind}.${a.ServiceName}`;
            const kb = `${b.SystemCode}.${b.ServiceKind}.${b.ServiceName}`;
            return ka.localeCompare(kb);
          }).map((svc) => new BpmServiceNode(svc));
        }
        if (element instanceof BpmServiceNode) {
          const { SystemCode, ServiceKind, ServiceName } = element.svc;
          const key = `${SystemCode}.${ServiceKind}.${ServiceName}`;
          let data = this.methodCache.get(key);
          if (!data) {
            try {
              data = await this.bpmClient.getBpmMethodsByService(SystemCode, ServiceKind, ServiceName);
              this.methodCache.set(key, data);
            } catch (err) {
              vscode2.window.showErrorMessage(`BPM: Failed to load methods: ${err.message}`);
              return [];
            }
          }
          const { methods, directives } = data;
          return methods.sort((a, b) => a.Name.localeCompare(b.Name)).map((m) => {
            const methodDirs = directives.filter((d) => d.BpMethodCode === m.BpMethodCode);
            return new BpmMethodNode(m, methodDirs);
          });
        }
        if (element instanceof BpmMethodNode) {
          const dirs = element.directives;
          if (!dirs || dirs.length === 0) {
            return [];
          }
          return dirs.sort((a, b) => {
            if (a.DirectiveType !== b.DirectiveType) return a.DirectiveType - b.DirectiveType;
            return (a.Order || 0) - (b.Order || 0);
          }).map((d) => new BpmDirectiveNode(d));
        }
        return [];
      }
    };
    exports2.BpmTreeProvider = BpmTreeProvider;
  }
});

// node_modules/@xmldom/xmldom/lib/conventions.js
var require_conventions = __commonJS({
  "node_modules/@xmldom/xmldom/lib/conventions.js"(exports2) {
    "use strict";
    function find(list, predicate, ac) {
      if (ac === void 0) {
        ac = Array.prototype;
      }
      if (list && typeof ac.find === "function") {
        return ac.find.call(list, predicate);
      }
      for (var i = 0; i < list.length; i++) {
        if (hasOwn(list, i)) {
          var item = list[i];
          if (predicate.call(void 0, item, i, list)) {
            return item;
          }
        }
      }
    }
    function freeze(object, oc) {
      if (oc === void 0) {
        oc = Object;
      }
      if (oc && typeof oc.getOwnPropertyDescriptors === "function") {
        object = oc.create(null, oc.getOwnPropertyDescriptors(object));
      }
      return oc && typeof oc.freeze === "function" ? oc.freeze(object) : object;
    }
    function hasOwn(object, key) {
      return Object.prototype.hasOwnProperty.call(object, key);
    }
    function assign(target, source) {
      if (target === null || typeof target !== "object") {
        throw new TypeError("target is not an object");
      }
      for (var key in source) {
        if (hasOwn(source, key)) {
          target[key] = source[key];
        }
      }
      return target;
    }
    var HTML_BOOLEAN_ATTRIBUTES = freeze({
      allowfullscreen: true,
      async: true,
      autofocus: true,
      autoplay: true,
      checked: true,
      controls: true,
      default: true,
      defer: true,
      disabled: true,
      formnovalidate: true,
      hidden: true,
      ismap: true,
      itemscope: true,
      loop: true,
      multiple: true,
      muted: true,
      nomodule: true,
      novalidate: true,
      open: true,
      playsinline: true,
      readonly: true,
      required: true,
      reversed: true,
      selected: true
    });
    function isHTMLBooleanAttribute(name) {
      return hasOwn(HTML_BOOLEAN_ATTRIBUTES, name.toLowerCase());
    }
    var HTML_VOID_ELEMENTS = freeze({
      area: true,
      base: true,
      br: true,
      col: true,
      embed: true,
      hr: true,
      img: true,
      input: true,
      link: true,
      meta: true,
      param: true,
      source: true,
      track: true,
      wbr: true
    });
    function isHTMLVoidElement(tagName) {
      return hasOwn(HTML_VOID_ELEMENTS, tagName.toLowerCase());
    }
    var HTML_RAW_TEXT_ELEMENTS = freeze({
      script: false,
      style: false,
      textarea: true,
      title: true
    });
    function isHTMLRawTextElement(tagName) {
      var key = tagName.toLowerCase();
      return hasOwn(HTML_RAW_TEXT_ELEMENTS, key) && !HTML_RAW_TEXT_ELEMENTS[key];
    }
    function isHTMLEscapableRawTextElement(tagName) {
      var key = tagName.toLowerCase();
      return hasOwn(HTML_RAW_TEXT_ELEMENTS, key) && HTML_RAW_TEXT_ELEMENTS[key];
    }
    function isHTMLMimeType(mimeType) {
      return mimeType === MIME_TYPE.HTML;
    }
    function hasDefaultHTMLNamespace(mimeType) {
      return isHTMLMimeType(mimeType) || mimeType === MIME_TYPE.XML_XHTML_APPLICATION;
    }
    var MIME_TYPE = freeze({
      /**
       * `text/html`, the only mime type that triggers treating an XML document as HTML.
       *
       * @see https://www.iana.org/assignments/media-types/text/html IANA MimeType registration
       * @see https://en.wikipedia.org/wiki/HTML Wikipedia
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString MDN
       * @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-domparser-parsefromstring
       *      WHATWG HTML Spec
       */
      HTML: "text/html",
      /**
       * `application/xml`, the standard mime type for XML documents.
       *
       * @see https://www.iana.org/assignments/media-types/application/xml IANA MimeType
       *      registration
       * @see https://tools.ietf.org/html/rfc7303#section-9.1 RFC 7303
       * @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
       */
      XML_APPLICATION: "application/xml",
      /**
       * `text/xml`, an alias for `application/xml`.
       *
       * @see https://tools.ietf.org/html/rfc7303#section-9.2 RFC 7303
       * @see https://www.iana.org/assignments/media-types/text/xml IANA MimeType registration
       * @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
       */
      XML_TEXT: "text/xml",
      /**
       * `application/xhtml+xml`, indicates an XML document that has the default HTML namespace,
       * but is parsed as an XML document.
       *
       * @see https://www.iana.org/assignments/media-types/application/xhtml+xml IANA MimeType
       *      registration
       * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument WHATWG DOM Spec
       * @see https://en.wikipedia.org/wiki/XHTML Wikipedia
       */
      XML_XHTML_APPLICATION: "application/xhtml+xml",
      /**
       * `image/svg+xml`,
       *
       * @see https://www.iana.org/assignments/media-types/image/svg+xml IANA MimeType registration
       * @see https://www.w3.org/TR/SVG11/ W3C SVG 1.1
       * @see https://en.wikipedia.org/wiki/Scalable_Vector_Graphics Wikipedia
       */
      XML_SVG_IMAGE: "image/svg+xml"
    });
    var _MIME_TYPES = Object.keys(MIME_TYPE).map(function(key) {
      return MIME_TYPE[key];
    });
    function isValidMimeType(mimeType) {
      return _MIME_TYPES.indexOf(mimeType) > -1;
    }
    var NAMESPACE = freeze({
      /**
       * The XHTML namespace.
       *
       * @see http://www.w3.org/1999/xhtml
       */
      HTML: "http://www.w3.org/1999/xhtml",
      /**
       * The SVG namespace.
       *
       * @see http://www.w3.org/2000/svg
       */
      SVG: "http://www.w3.org/2000/svg",
      /**
       * The `xml:` namespace.
       *
       * @see http://www.w3.org/XML/1998/namespace
       */
      XML: "http://www.w3.org/XML/1998/namespace",
      /**
       * The `xmlns:` namespace.
       *
       * @see https://www.w3.org/2000/xmlns/
       */
      XMLNS: "http://www.w3.org/2000/xmlns/"
    });
    exports2.assign = assign;
    exports2.find = find;
    exports2.freeze = freeze;
    exports2.HTML_BOOLEAN_ATTRIBUTES = HTML_BOOLEAN_ATTRIBUTES;
    exports2.HTML_RAW_TEXT_ELEMENTS = HTML_RAW_TEXT_ELEMENTS;
    exports2.HTML_VOID_ELEMENTS = HTML_VOID_ELEMENTS;
    exports2.hasDefaultHTMLNamespace = hasDefaultHTMLNamespace;
    exports2.hasOwn = hasOwn;
    exports2.isHTMLBooleanAttribute = isHTMLBooleanAttribute;
    exports2.isHTMLRawTextElement = isHTMLRawTextElement;
    exports2.isHTMLEscapableRawTextElement = isHTMLEscapableRawTextElement;
    exports2.isHTMLMimeType = isHTMLMimeType;
    exports2.isHTMLVoidElement = isHTMLVoidElement;
    exports2.isValidMimeType = isValidMimeType;
    exports2.MIME_TYPE = MIME_TYPE;
    exports2.NAMESPACE = NAMESPACE;
  }
});

// node_modules/@xmldom/xmldom/lib/errors.js
var require_errors = __commonJS({
  "node_modules/@xmldom/xmldom/lib/errors.js"(exports2) {
    "use strict";
    var conventions = require_conventions();
    function extendError(constructor, writableName) {
      constructor.prototype = Object.create(Error.prototype, {
        constructor: { value: constructor },
        name: { value: constructor.name, enumerable: true, writable: writableName }
      });
    }
    var DOMExceptionName = conventions.freeze({
      /**
       * the default value as defined by the spec
       */
      Error: "Error",
      /**
       * @deprecated
       * Use RangeError instead.
       */
      IndexSizeError: "IndexSizeError",
      /**
       * @deprecated
       * Just to match the related static code, not part of the spec.
       */
      DomstringSizeError: "DomstringSizeError",
      HierarchyRequestError: "HierarchyRequestError",
      WrongDocumentError: "WrongDocumentError",
      InvalidCharacterError: "InvalidCharacterError",
      /**
       * @deprecated
       * Just to match the related static code, not part of the spec.
       */
      NoDataAllowedError: "NoDataAllowedError",
      NoModificationAllowedError: "NoModificationAllowedError",
      NotFoundError: "NotFoundError",
      NotSupportedError: "NotSupportedError",
      InUseAttributeError: "InUseAttributeError",
      InvalidStateError: "InvalidStateError",
      SyntaxError: "SyntaxError",
      InvalidModificationError: "InvalidModificationError",
      NamespaceError: "NamespaceError",
      /**
       * @deprecated
       * Use TypeError for invalid arguments,
       * "NotSupportedError" DOMException for unsupported operations,
       * and "NotAllowedError" DOMException for denied requests instead.
       */
      InvalidAccessError: "InvalidAccessError",
      /**
       * @deprecated
       * Just to match the related static code, not part of the spec.
       */
      ValidationError: "ValidationError",
      /**
       * @deprecated
       * Use TypeError instead.
       */
      TypeMismatchError: "TypeMismatchError",
      SecurityError: "SecurityError",
      NetworkError: "NetworkError",
      AbortError: "AbortError",
      /**
       * @deprecated
       * Just to match the related static code, not part of the spec.
       */
      URLMismatchError: "URLMismatchError",
      QuotaExceededError: "QuotaExceededError",
      TimeoutError: "TimeoutError",
      InvalidNodeTypeError: "InvalidNodeTypeError",
      DataCloneError: "DataCloneError",
      EncodingError: "EncodingError",
      NotReadableError: "NotReadableError",
      UnknownError: "UnknownError",
      ConstraintError: "ConstraintError",
      DataError: "DataError",
      TransactionInactiveError: "TransactionInactiveError",
      ReadOnlyError: "ReadOnlyError",
      VersionError: "VersionError",
      OperationError: "OperationError",
      NotAllowedError: "NotAllowedError",
      OptOutError: "OptOutError"
    });
    var DOMExceptionNames = Object.keys(DOMExceptionName);
    function isValidDomExceptionCode(value) {
      return typeof value === "number" && value >= 1 && value <= 25;
    }
    function endsWithError(value) {
      return typeof value === "string" && value.substring(value.length - DOMExceptionName.Error.length) === DOMExceptionName.Error;
    }
    function DOMException(messageOrCode, nameOrMessage) {
      if (isValidDomExceptionCode(messageOrCode)) {
        this.name = DOMExceptionNames[messageOrCode];
        this.message = nameOrMessage || "";
      } else {
        this.message = messageOrCode;
        this.name = endsWithError(nameOrMessage) ? nameOrMessage : DOMExceptionName.Error;
      }
      if (Error.captureStackTrace) Error.captureStackTrace(this, DOMException);
    }
    extendError(DOMException, true);
    Object.defineProperties(DOMException.prototype, {
      code: {
        enumerable: true,
        get: function() {
          var code = DOMExceptionNames.indexOf(this.name);
          if (isValidDomExceptionCode(code)) return code;
          return 0;
        }
      }
    });
    var ExceptionCode = {
      INDEX_SIZE_ERR: 1,
      DOMSTRING_SIZE_ERR: 2,
      HIERARCHY_REQUEST_ERR: 3,
      WRONG_DOCUMENT_ERR: 4,
      INVALID_CHARACTER_ERR: 5,
      NO_DATA_ALLOWED_ERR: 6,
      NO_MODIFICATION_ALLOWED_ERR: 7,
      NOT_FOUND_ERR: 8,
      NOT_SUPPORTED_ERR: 9,
      INUSE_ATTRIBUTE_ERR: 10,
      INVALID_STATE_ERR: 11,
      SYNTAX_ERR: 12,
      INVALID_MODIFICATION_ERR: 13,
      NAMESPACE_ERR: 14,
      INVALID_ACCESS_ERR: 15,
      VALIDATION_ERR: 16,
      TYPE_MISMATCH_ERR: 17,
      SECURITY_ERR: 18,
      NETWORK_ERR: 19,
      ABORT_ERR: 20,
      URL_MISMATCH_ERR: 21,
      QUOTA_EXCEEDED_ERR: 22,
      TIMEOUT_ERR: 23,
      INVALID_NODE_TYPE_ERR: 24,
      DATA_CLONE_ERR: 25
    };
    var entries = Object.entries(ExceptionCode);
    for (i = 0; i < entries.length; i++) {
      key = entries[i][0];
      DOMException[key] = entries[i][1];
    }
    var key;
    var i;
    function ParseError(message, locator) {
      this.message = message;
      this.locator = locator;
      if (Error.captureStackTrace) Error.captureStackTrace(this, ParseError);
    }
    extendError(ParseError);
    exports2.DOMException = DOMException;
    exports2.DOMExceptionName = DOMExceptionName;
    exports2.ExceptionCode = ExceptionCode;
    exports2.ParseError = ParseError;
  }
});

// node_modules/@xmldom/xmldom/lib/grammar.js
var require_grammar = __commonJS({
  "node_modules/@xmldom/xmldom/lib/grammar.js"(exports2) {
    "use strict";
    function detectUnicodeSupport(RegExpImpl) {
      try {
        if (typeof RegExpImpl !== "function") {
          RegExpImpl = RegExp;
        }
        var match = new RegExpImpl("\u{1D306}", "u").exec("\u{1D306}");
        return !!match && match[0].length === 2;
      } catch (error) {
      }
      return false;
    }
    var UNICODE_SUPPORT = detectUnicodeSupport();
    function chars(regexp) {
      if (regexp.source[0] !== "[") {
        throw new Error(regexp + " can not be used with chars");
      }
      return regexp.source.slice(1, regexp.source.lastIndexOf("]"));
    }
    function chars_without(regexp, search) {
      if (regexp.source[0] !== "[") {
        throw new Error("/" + regexp.source + "/ can not be used with chars_without");
      }
      if (!search || typeof search !== "string") {
        throw new Error(JSON.stringify(search) + " is not a valid search");
      }
      if (regexp.source.indexOf(search) === -1) {
        throw new Error('"' + search + '" is not is /' + regexp.source + "/");
      }
      if (search === "-" && regexp.source.indexOf(search) !== 1) {
        throw new Error('"' + search + '" is not at the first postion of /' + regexp.source + "/");
      }
      return new RegExp(regexp.source.replace(search, ""), UNICODE_SUPPORT ? "u" : "");
    }
    function reg(args) {
      var self = this;
      return new RegExp(
        Array.prototype.slice.call(arguments).map(function(part) {
          var isStr = typeof part === "string";
          if (isStr && self === void 0 && part === "|") {
            throw new Error("use regg instead of reg to wrap expressions with `|`!");
          }
          return isStr ? part : part.source;
        }).join(""),
        UNICODE_SUPPORT ? "mu" : "m"
      );
    }
    function regg(args) {
      if (arguments.length === 0) {
        throw new Error("no parameters provided");
      }
      return reg.apply(regg, ["(?:"].concat(Array.prototype.slice.call(arguments), [")"]));
    }
    var UNICODE_REPLACEMENT_CHARACTER = "\uFFFD";
    var Char = /[-\x09\x0A\x0D\x20-\x2C\x2E-\uD7FF\uE000-\uFFFD]/;
    if (UNICODE_SUPPORT) {
      Char = reg("[", chars(Char), "\\u{10000}-\\u{10FFFF}", "]");
    }
    var InvalidChar = new RegExp("[^" + chars(Char) + "]", UNICODE_SUPPORT ? "u" : "");
    var _SChar = /[\x20\x09\x0D\x0A]/;
    var SChar_s = chars(_SChar);
    var S = reg(_SChar, "+");
    var S_OPT = reg(_SChar, "*");
    var NameStartChar = /[:_a-zA-Z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
    if (UNICODE_SUPPORT) {
      NameStartChar = reg("[", chars(NameStartChar), "\\u{10000}-\\u{10FFFF}", "]");
    }
    var NameStartChar_s = chars(NameStartChar);
    var NameChar = reg("[", NameStartChar_s, chars(/[-.0-9\xB7]/), chars(/[\u0300-\u036F\u203F-\u2040]/), "]");
    var Name = reg(NameStartChar, NameChar, "*");
    var Nmtoken = reg(NameChar, "+");
    var EntityRef = reg("&", Name, ";");
    var CharRef = regg(/&#[0-9]+;|&#x[0-9a-fA-F]+;/);
    var Reference = regg(EntityRef, "|", CharRef);
    var PEReference = reg("%", Name, ";");
    var EntityValue = regg(
      reg('"', regg(/[^%&"]/, "|", PEReference, "|", Reference), "*", '"'),
      "|",
      reg("'", regg(/[^%&']/, "|", PEReference, "|", Reference), "*", "'")
    );
    var AttValue = regg('"', regg(/[^<&"]/, "|", Reference), "*", '"', "|", "'", regg(/[^<&']/, "|", Reference), "*", "'");
    var NCNameStartChar = chars_without(NameStartChar, ":");
    var NCNameChar = chars_without(NameChar, ":");
    var NCName = reg(NCNameStartChar, NCNameChar, "*");
    var QName = reg(NCName, regg(":", NCName), "?");
    var QName_exact = reg("^", QName, "$");
    var QName_group = reg("(", QName, ")");
    var SystemLiteral = regg(/"[^"]*"|'[^']*'/);
    var PI = reg(/^<\?/, "(", Name, ")", regg(S, "(", Char, "*?)"), "?", /\?>/);
    var PubidChar = /[\x20\x0D\x0Aa-zA-Z0-9-'()+,./:=?;!*#@$_%]/;
    var PubidLiteral = regg('"', PubidChar, '*"', "|", "'", chars_without(PubidChar, "'"), "*'");
    var COMMENT_START = "<!--";
    var COMMENT_END = "-->";
    var Comment = reg(COMMENT_START, regg(chars_without(Char, "-"), "|", reg("-", chars_without(Char, "-"))), "*", COMMENT_END);
    var PCDATA = "#PCDATA";
    var Mixed = regg(
      reg(/\(/, S_OPT, PCDATA, regg(S_OPT, /\|/, S_OPT, QName), "*", S_OPT, /\)\*/),
      "|",
      reg(/\(/, S_OPT, PCDATA, S_OPT, /\)/)
    );
    var _children_quantity = /[?*+]?/;
    var children = reg(
      /\([^>]+\)/,
      _children_quantity
      /*regg(choice, '|', seq), _children_quantity*/
    );
    var contentspec = regg("EMPTY", "|", "ANY", "|", Mixed, "|", children);
    var ELEMENTDECL_START = "<!ELEMENT";
    var elementdecl = reg(ELEMENTDECL_START, S, regg(QName, "|", PEReference), S, regg(contentspec, "|", PEReference), S_OPT, ">");
    var NotationType = reg("NOTATION", S, /\(/, S_OPT, Name, regg(S_OPT, /\|/, S_OPT, Name), "*", S_OPT, /\)/);
    var Enumeration = reg(/\(/, S_OPT, Nmtoken, regg(S_OPT, /\|/, S_OPT, Nmtoken), "*", S_OPT, /\)/);
    var EnumeratedType = regg(NotationType, "|", Enumeration);
    var AttType = regg(/CDATA|ID|IDREF|IDREFS|ENTITY|ENTITIES|NMTOKEN|NMTOKENS/, "|", EnumeratedType);
    var DefaultDecl = regg(/#REQUIRED|#IMPLIED/, "|", regg(regg("#FIXED", S), "?", AttValue));
    var AttDef = regg(S, Name, S, AttType, S, DefaultDecl);
    var ATTLIST_DECL_START = "<!ATTLIST";
    var AttlistDecl = reg(ATTLIST_DECL_START, S, Name, AttDef, "*", S_OPT, ">");
    var ABOUT_LEGACY_COMPAT = "about:legacy-compat";
    var ABOUT_LEGACY_COMPAT_SystemLiteral = regg('"' + ABOUT_LEGACY_COMPAT + '"', "|", "'" + ABOUT_LEGACY_COMPAT + "'");
    var SYSTEM = "SYSTEM";
    var PUBLIC = "PUBLIC";
    var ExternalID = regg(regg(SYSTEM, S, SystemLiteral), "|", regg(PUBLIC, S, PubidLiteral, S, SystemLiteral));
    var ExternalID_match = reg(
      "^",
      regg(
        regg(SYSTEM, S, "(?<SystemLiteralOnly>", SystemLiteral, ")"),
        "|",
        regg(PUBLIC, S, "(?<PubidLiteral>", PubidLiteral, ")", S, "(?<SystemLiteral>", SystemLiteral, ")")
      )
    );
    var PubidLiteral_match = reg("^", PubidLiteral, "$");
    var SystemLiteral_match = reg("^", SystemLiteral, "$");
    var NDataDecl = regg(S, "NDATA", S, Name);
    var EntityDef = regg(EntityValue, "|", regg(ExternalID, NDataDecl, "?"));
    var ENTITY_DECL_START = "<!ENTITY";
    var GEDecl = reg(ENTITY_DECL_START, S, Name, S, EntityDef, S_OPT, ">");
    var PEDef = regg(EntityValue, "|", ExternalID);
    var PEDecl = reg(ENTITY_DECL_START, S, "%", S, Name, S, PEDef, S_OPT, ">");
    var EntityDecl = regg(GEDecl, "|", PEDecl);
    var PublicID = reg(PUBLIC, S, PubidLiteral);
    var NotationDecl = reg("<!NOTATION", S, Name, S, regg(ExternalID, "|", PublicID), S_OPT, ">");
    var Eq = reg(S_OPT, "=", S_OPT);
    var VersionNum = /1[.]\d+/;
    var VersionInfo = reg(S, "version", Eq, regg("'", VersionNum, "'", "|", '"', VersionNum, '"'));
    var EncName = /[A-Za-z][-A-Za-z0-9._]*/;
    var EncodingDecl = regg(S, "encoding", Eq, regg('"', EncName, '"', "|", "'", EncName, "'"));
    var SDDecl = regg(S, "standalone", Eq, regg("'", regg("yes", "|", "no"), "'", "|", '"', regg("yes", "|", "no"), '"'));
    var XMLDecl = reg(/^<\?xml/, VersionInfo, EncodingDecl, "?", SDDecl, "?", S_OPT, /\?>/);
    var DOCTYPE_DECL_START = "<!DOCTYPE";
    var CDATA_START = "<![CDATA[";
    var CDATA_END = "]]>";
    var CDStart = /<!\[CDATA\[/;
    var CDEnd = /\]\]>/;
    var CData = reg(Char, "*?", CDEnd);
    var CDSect = reg(CDStart, CData);
    exports2.chars = chars;
    exports2.chars_without = chars_without;
    exports2.detectUnicodeSupport = detectUnicodeSupport;
    exports2.reg = reg;
    exports2.regg = regg;
    exports2.ABOUT_LEGACY_COMPAT = ABOUT_LEGACY_COMPAT;
    exports2.ABOUT_LEGACY_COMPAT_SystemLiteral = ABOUT_LEGACY_COMPAT_SystemLiteral;
    exports2.AttlistDecl = AttlistDecl;
    exports2.CDATA_START = CDATA_START;
    exports2.CDATA_END = CDATA_END;
    exports2.CDSect = CDSect;
    exports2.Char = Char;
    exports2.Comment = Comment;
    exports2.COMMENT_START = COMMENT_START;
    exports2.COMMENT_END = COMMENT_END;
    exports2.DOCTYPE_DECL_START = DOCTYPE_DECL_START;
    exports2.elementdecl = elementdecl;
    exports2.EntityDecl = EntityDecl;
    exports2.EntityValue = EntityValue;
    exports2.ExternalID = ExternalID;
    exports2.ExternalID_match = ExternalID_match;
    exports2.Name = Name;
    exports2.NotationDecl = NotationDecl;
    exports2.Reference = Reference;
    exports2.PEReference = PEReference;
    exports2.PI = PI;
    exports2.PUBLIC = PUBLIC;
    exports2.PubidLiteral = PubidLiteral;
    exports2.PubidLiteral_match = PubidLiteral_match;
    exports2.QName = QName;
    exports2.QName_exact = QName_exact;
    exports2.QName_group = QName_group;
    exports2.S = S;
    exports2.SChar_s = SChar_s;
    exports2.S_OPT = S_OPT;
    exports2.SYSTEM = SYSTEM;
    exports2.SystemLiteral = SystemLiteral;
    exports2.SystemLiteral_match = SystemLiteral_match;
    exports2.InvalidChar = InvalidChar;
    exports2.UNICODE_REPLACEMENT_CHARACTER = UNICODE_REPLACEMENT_CHARACTER;
    exports2.UNICODE_SUPPORT = UNICODE_SUPPORT;
    exports2.XMLDecl = XMLDecl;
  }
});

// node_modules/@xmldom/xmldom/lib/dom.js
var require_dom = __commonJS({
  "node_modules/@xmldom/xmldom/lib/dom.js"(exports2) {
    "use strict";
    var conventions = require_conventions();
    var find = conventions.find;
    var hasDefaultHTMLNamespace = conventions.hasDefaultHTMLNamespace;
    var hasOwn = conventions.hasOwn;
    var isHTMLMimeType = conventions.isHTMLMimeType;
    var isHTMLRawTextElement = conventions.isHTMLRawTextElement;
    var isHTMLVoidElement = conventions.isHTMLVoidElement;
    var MIME_TYPE = conventions.MIME_TYPE;
    var NAMESPACE = conventions.NAMESPACE;
    var PDC = /* @__PURE__ */ Symbol();
    var errors = require_errors();
    var DOMException = errors.DOMException;
    var DOMExceptionName = errors.DOMExceptionName;
    var g = require_grammar();
    function checkSymbol(symbol) {
      if (symbol !== PDC) {
        throw new TypeError("Illegal constructor");
      }
    }
    function notEmptyString(input) {
      return input !== "";
    }
    function splitOnASCIIWhitespace(input) {
      return input ? input.split(/[\t\n\f\r ]+/).filter(notEmptyString) : [];
    }
    function orderedSetReducer(current, element) {
      if (!hasOwn(current, element)) {
        current[element] = true;
      }
      return current;
    }
    function toOrderedSet(input) {
      if (!input) return [];
      var list = splitOnASCIIWhitespace(input);
      return Object.keys(list.reduce(orderedSetReducer, {}));
    }
    function arrayIncludes(list) {
      return function(element) {
        return list && list.indexOf(element) !== -1;
      };
    }
    function validateQualifiedName(qualifiedName) {
      if (!g.QName_exact.test(qualifiedName)) {
        throw new DOMException(DOMException.INVALID_CHARACTER_ERR, 'invalid character in qualified name "' + qualifiedName + '"');
      }
    }
    function validateAndExtract(namespace, qualifiedName) {
      validateQualifiedName(qualifiedName);
      namespace = namespace || null;
      var prefix = null;
      var localName = qualifiedName;
      if (qualifiedName.indexOf(":") >= 0) {
        var splitResult = qualifiedName.split(":");
        prefix = splitResult[0];
        localName = splitResult[1];
      }
      if (prefix !== null && namespace === null) {
        throw new DOMException(DOMException.NAMESPACE_ERR, "prefix is non-null and namespace is null");
      }
      if (prefix === "xml" && namespace !== conventions.NAMESPACE.XML) {
        throw new DOMException(DOMException.NAMESPACE_ERR, 'prefix is "xml" and namespace is not the XML namespace');
      }
      if ((prefix === "xmlns" || qualifiedName === "xmlns") && namespace !== conventions.NAMESPACE.XMLNS) {
        throw new DOMException(
          DOMException.NAMESPACE_ERR,
          'either qualifiedName or prefix is "xmlns" and namespace is not the XMLNS namespace'
        );
      }
      if (namespace === conventions.NAMESPACE.XMLNS && prefix !== "xmlns" && qualifiedName !== "xmlns") {
        throw new DOMException(
          DOMException.NAMESPACE_ERR,
          'namespace is the XMLNS namespace and neither qualifiedName nor prefix is "xmlns"'
        );
      }
      return [namespace, prefix, localName];
    }
    function copy(src, dest) {
      for (var p in src) {
        if (hasOwn(src, p)) {
          dest[p] = src[p];
        }
      }
    }
    function _extends(Class, Super) {
      var pt = Class.prototype;
      if (!(pt instanceof Super)) {
        let t = function() {
        };
        t.prototype = Super.prototype;
        t = new t();
        copy(pt, t);
        Class.prototype = pt = t;
      }
      if (pt.constructor != Class) {
        if (typeof Class != "function") {
          console.error("unknown Class:" + Class);
        }
        pt.constructor = Class;
      }
    }
    var NodeType = {};
    var ELEMENT_NODE = NodeType.ELEMENT_NODE = 1;
    var ATTRIBUTE_NODE = NodeType.ATTRIBUTE_NODE = 2;
    var TEXT_NODE = NodeType.TEXT_NODE = 3;
    var CDATA_SECTION_NODE = NodeType.CDATA_SECTION_NODE = 4;
    var ENTITY_REFERENCE_NODE = NodeType.ENTITY_REFERENCE_NODE = 5;
    var ENTITY_NODE = NodeType.ENTITY_NODE = 6;
    var PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE = 7;
    var COMMENT_NODE = NodeType.COMMENT_NODE = 8;
    var DOCUMENT_NODE = NodeType.DOCUMENT_NODE = 9;
    var DOCUMENT_TYPE_NODE = NodeType.DOCUMENT_TYPE_NODE = 10;
    var DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE = 11;
    var NOTATION_NODE = NodeType.NOTATION_NODE = 12;
    var DocumentPosition = conventions.freeze({
      DOCUMENT_POSITION_DISCONNECTED: 1,
      DOCUMENT_POSITION_PRECEDING: 2,
      DOCUMENT_POSITION_FOLLOWING: 4,
      DOCUMENT_POSITION_CONTAINS: 8,
      DOCUMENT_POSITION_CONTAINED_BY: 16,
      DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: 32
    });
    function commonAncestor(a, b) {
      if (b.length < a.length) return commonAncestor(b, a);
      var c = null;
      for (var n in a) {
        if (a[n] !== b[n]) return c;
        c = a[n];
      }
      return c;
    }
    function docGUID(doc) {
      if (!doc.guid) doc.guid = Math.random();
      return doc.guid;
    }
    function NodeList() {
    }
    NodeList.prototype = {
      /**
       * The number of nodes in the list. The range of valid child node indices is 0 to length-1
       * inclusive.
       *
       * @type {number}
       */
      length: 0,
      /**
       * Returns the item at `index`. If index is greater than or equal to the number of nodes in
       * the list, this returns null.
       *
       * @param index
       * Unsigned long Index into the collection.
       * @returns {Node | null}
       * The node at position `index` in the NodeList,
       * or null if that is not a valid index.
       */
      item: function(index) {
        return index >= 0 && index < this.length ? this[index] : null;
      },
      /**
       * Returns a string representation of the NodeList.
       *
       * Accepts the same `options` object as `XMLSerializer.prototype.serializeToString`
       * (`requireWellFormed`, `splitCDATASections`, `nodeFilter`). Passing a function is treated as
       * a legacy `nodeFilter` for backward compatibility.
       *
       * @param {Object | function} [options]
       * @param {boolean} [options.requireWellFormed=false]
       * @param {boolean} [options.splitCDATASections=true]
       * @param {function} [options.nodeFilter]
       * @returns {string}
       */
      toString: function(options) {
        var opts;
        if (typeof options === "function") {
          opts = { requireWellFormed: false, splitCDATASections: true, nodeFilter: options };
        } else if (!!options) {
          opts = {
            requireWellFormed: !!options.requireWellFormed,
            splitCDATASections: options.splitCDATASections !== false,
            nodeFilter: options.nodeFilter || null
          };
        } else {
          opts = { requireWellFormed: false, splitCDATASections: true, nodeFilter: null };
        }
        for (var buf = [], i = 0; i < this.length; i++) {
          serializeToString(this[i], buf, null, opts);
        }
        return buf.join("");
      },
      /**
       * Filters the NodeList based on a predicate.
       *
       * @param {function(Node): boolean} predicate
       * - A predicate function to filter the NodeList.
       * @returns {Node[]}
       * An array of nodes that satisfy the predicate.
       * @private
       */
      filter: function(predicate) {
        return Array.prototype.filter.call(this, predicate);
      },
      /**
       * Returns the first index at which a given node can be found in the NodeList, or -1 if it is
       * not present.
       *
       * @param {Node} item
       * - The Node item to locate in the NodeList.
       * @returns {number}
       * The first index of the node in the NodeList; -1 if not found.
       * @private
       */
      indexOf: function(item) {
        return Array.prototype.indexOf.call(this, item);
      }
    };
    NodeList.prototype[Symbol.iterator] = function() {
      var me = this;
      var index = 0;
      return {
        next: function() {
          if (index < me.length) {
            return {
              value: me[index++],
              done: false
            };
          } else {
            return {
              done: true
            };
          }
        },
        return: function() {
          return {
            done: true
          };
        }
      };
    };
    function LiveNodeList(node, refresh) {
      this._node = node;
      this._refresh = refresh;
      _updateLiveList(this);
    }
    function _updateLiveList(list) {
      var inc = list._node._inc || list._node.ownerDocument._inc;
      if (list._inc !== inc) {
        var ls = list._refresh(list._node);
        __set__(list, "length", ls.length);
        if (!list.$$length || ls.length < list.$$length) {
          for (var i = ls.length; i in list; i++) {
            if (hasOwn(list, i)) {
              delete list[i];
            }
          }
        }
        copy(ls, list);
        list._inc = inc;
      }
    }
    LiveNodeList.prototype.item = function(i) {
      _updateLiveList(this);
      return this[i] || null;
    };
    _extends(LiveNodeList, NodeList);
    function NamedNodeMap() {
    }
    function _findNodeIndex(list, node) {
      var i = 0;
      while (i < list.length) {
        if (list[i] === node) {
          return i;
        }
        i++;
      }
    }
    function _addNamedNode(el, list, newAttr, oldAttr) {
      if (oldAttr) {
        list[_findNodeIndex(list, oldAttr)] = newAttr;
      } else {
        list[list.length] = newAttr;
        list.length++;
      }
      if (el) {
        newAttr.ownerElement = el;
        var doc = el.ownerDocument;
        if (doc) {
          oldAttr && _onRemoveAttribute(doc, el, oldAttr);
          _onAddAttribute(doc, el, newAttr);
        }
      }
    }
    function _removeNamedNode(el, list, attr) {
      var i = _findNodeIndex(list, attr);
      if (i >= 0) {
        var lastIndex = list.length - 1;
        while (i <= lastIndex) {
          list[i] = list[++i];
        }
        list.length = lastIndex;
        if (el) {
          var doc = el.ownerDocument;
          if (doc) {
            _onRemoveAttribute(doc, el, attr);
          }
          attr.ownerElement = null;
        }
      }
    }
    NamedNodeMap.prototype = {
      length: 0,
      item: NodeList.prototype.item,
      /**
       * Get an attribute by name. Note: Name is in lower case in case of HTML namespace and
       * document.
       *
       * @param {string} localName
       * The local name of the attribute.
       * @returns {Attr | null}
       * The attribute with the given local name, or null if no such attribute exists.
       * @see https://dom.spec.whatwg.org/#concept-element-attributes-get-by-name
       */
      getNamedItem: function(localName) {
        if (this._ownerElement && this._ownerElement._isInHTMLDocumentAndNamespace()) {
          localName = localName.toLowerCase();
        }
        var i = 0;
        while (i < this.length) {
          var attr = this[i];
          if (attr.nodeName === localName) {
            return attr;
          }
          i++;
        }
        return null;
      },
      /**
       * Set an attribute.
       *
       * @param {Attr} attr
       * The attribute to set.
       * @returns {Attr | null}
       * The old attribute with the same local name and namespace URI as the new one, or null if no
       * such attribute exists.
       * @throws {DOMException}
       * With code:
       * - {@link INUSE_ATTRIBUTE_ERR} - If the attribute is already an attribute of another
       * element.
       * @see https://dom.spec.whatwg.org/#concept-element-attributes-set
       */
      setNamedItem: function(attr) {
        var el = attr.ownerElement;
        if (el && el !== this._ownerElement) {
          throw new DOMException(DOMException.INUSE_ATTRIBUTE_ERR);
        }
        var oldAttr = this.getNamedItemNS(attr.namespaceURI, attr.localName);
        if (oldAttr === attr) {
          return attr;
        }
        _addNamedNode(this._ownerElement, this, attr, oldAttr);
        return oldAttr;
      },
      /**
       * Set an attribute, replacing an existing attribute with the same local name and namespace
       * URI if one exists.
       *
       * @param {Attr} attr
       * The attribute to set.
       * @returns {Attr | null}
       * The old attribute with the same local name and namespace URI as the new one, or null if no
       * such attribute exists.
       * @throws {DOMException}
       * Throws a DOMException with the name "InUseAttributeError" if the attribute is already an
       * attribute of another element.
       * @see https://dom.spec.whatwg.org/#concept-element-attributes-set
       */
      setNamedItemNS: function(attr) {
        return this.setNamedItem(attr);
      },
      /**
       * Removes an attribute specified by the local name.
       *
       * @param {string} localName
       * The local name of the attribute to be removed.
       * @returns {Attr}
       * The attribute node that was removed.
       * @throws {DOMException}
       * With code:
       * - {@link DOMException.NOT_FOUND_ERR} if no attribute with the given name is found.
       * @see https://dom.spec.whatwg.org/#dom-namednodemap-removenameditem
       * @see https://dom.spec.whatwg.org/#concept-element-attributes-remove-by-name
       */
      removeNamedItem: function(localName) {
        var attr = this.getNamedItem(localName);
        if (!attr) {
          throw new DOMException(DOMException.NOT_FOUND_ERR, localName);
        }
        _removeNamedNode(this._ownerElement, this, attr);
        return attr;
      },
      /**
       * Removes an attribute specified by the namespace and local name.
       *
       * @param {string | null} namespaceURI
       * The namespace URI of the attribute to be removed.
       * @param {string} localName
       * The local name of the attribute to be removed.
       * @returns {Attr}
       * The attribute node that was removed.
       * @throws {DOMException}
       * With code:
       * - {@link DOMException.NOT_FOUND_ERR} if no attribute with the given namespace URI and local
       * name is found.
       * @see https://dom.spec.whatwg.org/#dom-namednodemap-removenameditemns
       * @see https://dom.spec.whatwg.org/#concept-element-attributes-remove-by-namespace
       */
      removeNamedItemNS: function(namespaceURI, localName) {
        var attr = this.getNamedItemNS(namespaceURI, localName);
        if (!attr) {
          throw new DOMException(DOMException.NOT_FOUND_ERR, namespaceURI ? namespaceURI + " : " + localName : localName);
        }
        _removeNamedNode(this._ownerElement, this, attr);
        return attr;
      },
      /**
       * Get an attribute by namespace and local name.
       *
       * @param {string | null} namespaceURI
       * The namespace URI of the attribute.
       * @param {string} localName
       * The local name of the attribute.
       * @returns {Attr | null}
       * The attribute with the given namespace URI and local name, or null if no such attribute
       * exists.
       * @see https://dom.spec.whatwg.org/#concept-element-attributes-get-by-namespace
       */
      getNamedItemNS: function(namespaceURI, localName) {
        if (!namespaceURI) {
          namespaceURI = null;
        }
        var i = 0;
        while (i < this.length) {
          var node = this[i];
          if (node.localName === localName && node.namespaceURI === namespaceURI) {
            return node;
          }
          i++;
        }
        return null;
      }
    };
    NamedNodeMap.prototype[Symbol.iterator] = function() {
      var me = this;
      var index = 0;
      return {
        next: function() {
          if (index < me.length) {
            return {
              value: me[index++],
              done: false
            };
          } else {
            return {
              done: true
            };
          }
        },
        return: function() {
          return {
            done: true
          };
        }
      };
    };
    function DOMImplementation() {
    }
    DOMImplementation.prototype = {
      /**
       * Test if the DOM implementation implements a specific feature and version, as specified in
       * {@link https://www.w3.org/TR/DOM-Level-3-Core/core.html#DOMFeatures DOM Features}.
       *
       * The DOMImplementation.hasFeature() method returns a Boolean flag indicating if a given
       * feature is supported. The different implementations fairly diverged in what kind of
       * features were reported. The latest version of the spec settled to force this method to
       * always return true, where the functionality was accurate and in use.
       *
       * @deprecated
       * It is deprecated and modern browsers return true in all cases.
       * @function DOMImplementation#hasFeature
       * @param {string} feature
       * The name of the feature to test.
       * @param {string} [version]
       * This is the version number of the feature to test.
       * @returns {boolean}
       * Always returns true.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/hasFeature MDN
       * @see https://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-5CED94D7 DOM Level 1 Core
       * @see https://dom.spec.whatwg.org/#dom-domimplementation-hasfeature DOM Living Standard
       * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-5CED94D7 DOM Level 3 Core
       */
      hasFeature: function(feature, version) {
        return true;
      },
      /**
       * Creates a DOM Document object of the specified type with its document element. Note that
       * based on the {@link DocumentType}
       * given to create the document, the implementation may instantiate specialized
       * {@link Document} objects that support additional features than the "Core", such as "HTML"
       * {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#DOM2HTML DOM Level 2 HTML}.
       * On the other hand, setting the {@link DocumentType} after the document was created makes
       * this very unlikely to happen. Alternatively, specialized {@link Document} creation methods,
       * such as createHTMLDocument
       * {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#DOM2HTML DOM Level 2 HTML},
       * can be used to obtain specific types of {@link Document} objects.
       *
       * __It behaves slightly different from the description in the living standard__:
       * - There is no interface/class `XMLDocument`, it returns a `Document`
       * instance (with it's `type` set to `'xml'`).
       * - `encoding`, `mode`, `origin`, `url` fields are currently not declared.
       *
       * @function DOMImplementation.createDocument
       * @param {string | null} namespaceURI
       * The
       * {@link https://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-namespaceURI namespace URI}
       * of the document element to create or null.
       * @param {string | null} qualifiedName
       * The
       * {@link https://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-qualifiedname qualified name}
       * of the document element to be created or null.
       * @param {DocumentType | null} [doctype=null]
       * The type of document to be created or null. When doctype is not null, its
       * {@link Node#ownerDocument} attribute is set to the document being created. Default is
       * `null`
       * @returns {Document}
       * A new {@link Document} object with its document element. If the NamespaceURI,
       * qualifiedName, and doctype are null, the returned {@link Document} is empty with no
       * document element.
       * @throws {DOMException}
       * With code:
       *
       * - `INVALID_CHARACTER_ERR`: Raised if the specified qualified name is not an XML name
       * according to {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#XML XML 1.0}.
       * - `NAMESPACE_ERR`: Raised if the qualifiedName is malformed, if the qualifiedName has a
       * prefix and the namespaceURI is null, or if the qualifiedName is null and the namespaceURI
       * is different from null, or if the qualifiedName has a prefix that is "xml" and the
       * namespaceURI is different from "{@link http://www.w3.org/XML/1998/namespace}"
       * {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#Namespaces XML Namespaces},
       * or if the DOM implementation does not support the "XML" feature but a non-null namespace
       * URI was provided, since namespaces were defined by XML.
       * - `WRONG_DOCUMENT_ERR`: Raised if doctype has already been used with a different document
       * or was created from a different implementation.
       * - `NOT_SUPPORTED_ERR`: May be raised if the implementation does not support the feature
       * "XML" and the language exposed through the Document does not support XML Namespaces (such
       * as {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#HTML40 HTML 4.01}).
       * @since DOM Level 2.
       * @see {@link #createHTMLDocument}
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createDocument MDN
       * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument DOM Living Standard
       * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Level-2-Core-DOM-createDocument DOM
       *      Level 3 Core
       * @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#Level-2-Core-DOM-createDocument DOM
       *      Level 2 Core (initial)
       */
      createDocument: function(namespaceURI, qualifiedName, doctype) {
        var contentType = MIME_TYPE.XML_APPLICATION;
        if (namespaceURI === NAMESPACE.HTML) {
          contentType = MIME_TYPE.XML_XHTML_APPLICATION;
        } else if (namespaceURI === NAMESPACE.SVG) {
          contentType = MIME_TYPE.XML_SVG_IMAGE;
        }
        var doc = new Document(PDC, { contentType });
        doc.implementation = this;
        doc.childNodes = new NodeList();
        doc.doctype = doctype || null;
        if (doctype) {
          doc.appendChild(doctype);
        }
        if (qualifiedName) {
          var root = doc.createElementNS(namespaceURI, qualifiedName);
          doc.appendChild(root);
        }
        return doc;
      },
      /**
       * Creates an empty DocumentType node. Entity declarations and notations are not made
       * available. Entity reference expansions and default attribute additions do not occur.
       *
       * **This behavior is slightly different from the one in the specs**:
       * - `encoding`, `mode`, `origin`, `url` fields are currently not declared.
       * - `publicId` and `systemId` contain the raw data including any possible quotes,
       *   so they can always be serialized back to the original value
       * - `internalSubset` contains the raw string between `[` and `]` if present,
       *   but is not parsed or validated in any form.
       *
       * @function DOMImplementation#createDocumentType
       * @param {string} qualifiedName
       * The {@link https://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-qualifiedname qualified
       * name} of the document type to be created.
       * @param {string} [publicId]
       * The external subset public identifier. Stored verbatim including surrounding quotes.
       * When serialized with `requireWellFormed: true`, the serializer throws `InvalidStateError`
       * if the value is non-empty and does not match the XML `PubidLiteral` production
       * (W3C DOM Parsing §3.2.1.3; XML 1.0 production [12]). Creation-time validation is not
       * enforced — deferred to a future breaking release.
       * @param {string} [systemId]
       * The external subset system identifier. Stored verbatim including surrounding quotes.
       * When serialized with `requireWellFormed: true`, the serializer throws `InvalidStateError`
       * if the value is non-empty and does not match the XML `SystemLiteral` production
       * (W3C DOM Parsing §3.2.1.3; XML 1.0 production [11]). Creation-time validation is not
       * enforced — deferred to a future breaking release.
       * @param {string} [internalSubset]
       * The internal subset or an empty string if it is not present. Stored verbatim.
       * When serialized with `requireWellFormed: true`, the serializer throws `InvalidStateError`
       * if the value contains `"]>"`. Creation-time validation is not enforced.
       * @returns {DocumentType}
       * A new {@link DocumentType} node with {@link Node#ownerDocument} set to null.
       * @throws {DOMException}
       * With code:
       *
       * - `INVALID_CHARACTER_ERR`: Raised if the specified qualified name is not an XML name
       * according to {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#XML XML 1.0}.
       * - `NAMESPACE_ERR`: Raised if the qualifiedName is malformed.
       * - `NOT_SUPPORTED_ERR`: May be raised if the implementation does not support the feature
       * "XML" and the language exposed through the Document does not support XML Namespaces (such
       * as {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#HTML40 HTML 4.01}).
       * @since DOM Level 2.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createDocumentType
       *      MDN
       * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocumenttype DOM Living
       *      Standard
       * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Level-3-Core-DOM-createDocType DOM
       *      Level 3 Core
       * @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#Level-2-Core-DOM-createDocType DOM
       *      Level 2 Core
       * @see https://github.com/xmldom/xmldom/blob/master/CHANGELOG.md#050
       * @see https://www.w3.org/TR/DOM-Level-2-Core/#core-ID-Core-DocType-internalSubset
       * @prettierignore
       */
      createDocumentType: function(qualifiedName, publicId, systemId, internalSubset) {
        validateQualifiedName(qualifiedName);
        var node = new DocumentType(PDC);
        node.name = qualifiedName;
        node.nodeName = qualifiedName;
        node.publicId = publicId || "";
        node.systemId = systemId || "";
        node.internalSubset = internalSubset || "";
        node.childNodes = new NodeList();
        return node;
      },
      /**
       * Returns an HTML document, that might already have a basic DOM structure.
       *
       * __It behaves slightly different from the description in the living standard__:
       * - If the first argument is `false` no initial nodes are added (steps 3-7 in the specs are
       * omitted)
       * - `encoding`, `mode`, `origin`, `url` fields are currently not declared.
       *
       * @param {string | false} [title]
       * A string containing the title to give the new HTML document.
       * @returns {Document}
       * The HTML document.
       * @since WHATWG Living Standard.
       * @see {@link #createDocument}
       * @see https://dom.spec.whatwg.org/#dom-domimplementation-createhtmldocument
       * @see https://dom.spec.whatwg.org/#html-document
       */
      createHTMLDocument: function(title) {
        var doc = new Document(PDC, { contentType: MIME_TYPE.HTML });
        doc.implementation = this;
        doc.childNodes = new NodeList();
        if (title !== false) {
          doc.doctype = this.createDocumentType("html");
          doc.doctype.ownerDocument = doc;
          doc.appendChild(doc.doctype);
          var htmlNode = doc.createElement("html");
          doc.appendChild(htmlNode);
          var headNode = doc.createElement("head");
          htmlNode.appendChild(headNode);
          if (typeof title === "string") {
            var titleNode = doc.createElement("title");
            titleNode.appendChild(doc.createTextNode(title));
            headNode.appendChild(titleNode);
          }
          htmlNode.appendChild(doc.createElement("body"));
        }
        return doc;
      }
    };
    function Node(symbol) {
      checkSymbol(symbol);
    }
    Node.prototype = {
      /**
       * The first child of this node.
       *
       * @type {Node | null}
       */
      firstChild: null,
      /**
       * The last child of this node.
       *
       * @type {Node | null}
       */
      lastChild: null,
      /**
       * The previous sibling of this node.
       *
       * @type {Node | null}
       */
      previousSibling: null,
      /**
       * The next sibling of this node.
       *
       * @type {Node | null}
       */
      nextSibling: null,
      /**
       * The parent node of this node.
       *
       * @type {Node | null}
       */
      parentNode: null,
      /**
       * The parent element of this node.
       *
       * @type {Element | null}
       */
      get parentElement() {
        return this.parentNode && this.parentNode.nodeType === this.ELEMENT_NODE ? this.parentNode : null;
      },
      /**
       * The child nodes of this node.
       *
       * @type {NodeList}
       */
      childNodes: null,
      /**
       * The document object associated with this node.
       *
       * @type {Document | null}
       */
      ownerDocument: null,
      /**
       * The value of this node.
       *
       * @type {string | null}
       */
      nodeValue: null,
      /**
       * The namespace URI of this node.
       *
       * @type {string | null}
       */
      namespaceURI: null,
      /**
       * The prefix of the namespace for this node.
       *
       * @type {string | null}
       */
      prefix: null,
      /**
       * The local part of the qualified name of this node.
       *
       * @type {string | null}
       */
      localName: null,
      /**
       * The baseURI is currently always `about:blank`,
       * since that's what happens when you create a document from scratch.
       *
       * @type {'about:blank'}
       */
      baseURI: "about:blank",
      /**
       * Is true if this node is part of a document.
       *
       * @type {boolean}
       */
      get isConnected() {
        var rootNode = this.getRootNode();
        return rootNode && rootNode.nodeType === rootNode.DOCUMENT_NODE;
      },
      /**
       * Checks whether `other` is an inclusive descendant of this node.
       *
       * @param {Node | null | undefined} other
       * The node to check.
       * @returns {boolean}
       * True if `other` is an inclusive descendant of this node; false otherwise.
       * @see https://dom.spec.whatwg.org/#dom-node-contains
       */
      contains: function(other) {
        if (!other) return false;
        var parent = other;
        do {
          if (this === parent) return true;
          parent = parent.parentNode;
        } while (parent);
        return false;
      },
      /**
       * @typedef GetRootNodeOptions
       * @property {boolean} [composed=false]
       */
      /**
       * Searches for the root node of this node.
       *
       * **This behavior is slightly different from the in the specs**:
       * - ignores `options.composed`, since `ShadowRoot`s are unsupported, always returns root.
       *
       * @param {GetRootNodeOptions} [options]
       * @returns {Node}
       * Root node.
       * @see https://dom.spec.whatwg.org/#dom-node-getrootnode
       * @see https://dom.spec.whatwg.org/#concept-shadow-including-root
       */
      getRootNode: function(options) {
        var parent = this;
        do {
          if (!parent.parentNode) {
            return parent;
          }
          parent = parent.parentNode;
        } while (parent);
      },
      /**
       * Checks whether the given node is equal to this node.
       *
       * Two nodes are equal when they have the same type, defining characteristics (for the type),
       * and the same childNodes. The comparison is iterative to avoid stack overflows on
       * deeply-nested trees. Attribute nodes of each Element pair are also pushed onto the stack
       * and compared the same way.
       *
       * @param {Node} [otherNode]
       * @returns {boolean}
       * @see https://dom.spec.whatwg.org/#concept-node-equals
       * @see ../docs/walk-dom.md.
       */
      isEqualNode: function(otherNode) {
        if (!otherNode) return false;
        var stack = [{ node: this, other: otherNode }];
        while (stack.length > 0) {
          var pair = stack.pop();
          var node = pair.node;
          var other = pair.other;
          if (node.nodeType !== other.nodeType) return false;
          switch (node.nodeType) {
            case node.DOCUMENT_TYPE_NODE:
              if (node.name !== other.name) return false;
              if (node.publicId !== other.publicId) return false;
              if (node.systemId !== other.systemId) return false;
              break;
            case node.ELEMENT_NODE:
              if (node.namespaceURI !== other.namespaceURI) return false;
              if (node.prefix !== other.prefix) return false;
              if (node.localName !== other.localName) return false;
              if (node.attributes.length !== other.attributes.length) return false;
              for (var i = 0; i < node.attributes.length; i++) {
                var attr = node.attributes.item(i);
                var otherAttr = other.getAttributeNodeNS(attr.namespaceURI, attr.localName);
                if (!otherAttr) return false;
                stack.push({ node: attr, other: otherAttr });
              }
              break;
            case node.ATTRIBUTE_NODE:
              if (node.namespaceURI !== other.namespaceURI) return false;
              if (node.localName !== other.localName) return false;
              if (node.value !== other.value) return false;
              break;
            case node.PROCESSING_INSTRUCTION_NODE:
              if (node.target !== other.target || node.data !== other.data) return false;
              break;
            case node.TEXT_NODE:
            case node.CDATA_SECTION_NODE:
            case node.COMMENT_NODE:
              if (node.data !== other.data) return false;
              break;
          }
          if (node.childNodes.length !== other.childNodes.length) return false;
          for (var i = node.childNodes.length - 1; i >= 0; i--) {
            stack.push({ node: node.childNodes[i], other: other.childNodes[i] });
          }
        }
        return true;
      },
      /**
       * Checks whether or not the given node is this node.
       *
       * @param {Node} [otherNode]
       */
      isSameNode: function(otherNode) {
        return this === otherNode;
      },
      /**
       * Inserts a node before a reference node as a child of this node.
       *
       * @param {Node} newChild
       * The new child node to be inserted.
       * @param {Node | null} refChild
       * The reference node before which newChild will be inserted.
       * @returns {Node}
       * The new child node successfully inserted.
       * @throws {DOMException}
       * Throws a DOMException if inserting the node would result in a DOM tree that is not
       * well-formed, or if `child` is provided but is not a child of `parent`.
       * See {@link _insertBefore} for more details.
       * @since Modified in DOM L2
       */
      insertBefore: function(newChild, refChild) {
        return _insertBefore(this, newChild, refChild);
      },
      /**
       * Replaces an old child node with a new child node within this node.
       *
       * @param {Node} newChild
       * The new node that is to replace the old node.
       * If it already exists in the DOM, it is removed from its original position.
       * @param {Node} oldChild
       * The existing child node to be replaced.
       * @returns {Node}
       * Returns the replaced child node.
       * @throws {DOMException}
       * Throws a DOMException if replacing the node would result in a DOM tree that is not
       * well-formed, or if `oldChild` is not a child of `this`.
       * This can also occur if the pre-replacement validity assertion fails.
       * See {@link _insertBefore}, {@link Node.removeChild}, and
       * {@link assertPreReplacementValidityInDocument} for more details.
       * @see https://dom.spec.whatwg.org/#concept-node-replace
       */
      replaceChild: function(newChild, oldChild) {
        _insertBefore(this, newChild, oldChild, assertPreReplacementValidityInDocument);
        if (oldChild) {
          this.removeChild(oldChild);
        }
      },
      /**
       * Removes an existing child node from this node.
       *
       * @param {Node} oldChild
       * The child node to be removed.
       * @returns {Node}
       * Returns the removed child node.
       * @throws {DOMException}
       * Throws a DOMException if `oldChild` is not a child of `this`.
       * See {@link _removeChild} for more details.
       */
      removeChild: function(oldChild) {
        return _removeChild(this, oldChild);
      },
      /**
       * Appends a child node to this node.
       *
       * @param {Node} newChild
       * The child node to be appended to this node.
       * If it already exists in the DOM, it is removed from its original position.
       * @returns {Node}
       * Returns the appended child node.
       * @throws {DOMException}
       * Throws a DOMException if appending the node would result in a DOM tree that is not
       * well-formed, or if `newChild` is not a valid Node.
       * See {@link insertBefore} for more details.
       */
      appendChild: function(newChild) {
        return this.insertBefore(newChild, null);
      },
      /**
       * Determines whether this node has any child nodes.
       *
       * @returns {boolean}
       * Returns true if this node has any child nodes, and false otherwise.
       */
      hasChildNodes: function() {
        return this.firstChild != null;
      },
      /**
       * Creates a copy of the calling node.
       *
       * @param {boolean} deep
       * If true, the contents of the node are recursively copied.
       * If false, only the node itself (and its attributes, if it is an element) are copied.
       * @returns {Node}
       * Returns the newly created copy of the node.
       * @throws {DOMException}
       * May throw a DOMException if operations within {@link Element#setAttributeNode} or
       * {@link Node#appendChild} (which are potentially invoked in this method) do not meet their
       * specific constraints.
       * @see {@link cloneNode}
       */
      cloneNode: function(deep) {
        return cloneNode(this.ownerDocument || this, this, deep);
      },
      /**
       * Puts the specified node and all of its subtree into a "normalized" form. In a normalized
       * subtree, no text nodes in the subtree are empty and there are no adjacent text nodes.
       *
       * Specifically, this method merges any adjacent text nodes (i.e., nodes for which `nodeType`
       * is `TEXT_NODE`) into a single node with the combined data. It also removes any empty text
       * nodes.
       *
       * This method iterativly traverses all child nodes to normalize all descendent nodes within
       * the subtree.
       *
       * @throws {DOMException}
       * May throw a DOMException if operations within removeChild or appendData (which are
       * potentially invoked in this method) do not meet their specific constraints.
       * @since Modified in DOM Level 2
       * @see {@link Node.removeChild}
       * @see {@link CharacterData.appendData}
       * @see ../docs/walk-dom.md.
       */
      normalize: function() {
        walkDOM(this, null, {
          enter: function(node) {
            var child = node.firstChild;
            while (child) {
              var next = child.nextSibling;
              if (next !== null && next.nodeType === TEXT_NODE && child.nodeType === TEXT_NODE) {
                node.removeChild(next);
                child.appendData(next.data);
              } else {
                child = next;
              }
            }
            return true;
          }
        });
      },
      /**
       * Checks whether the DOM implementation implements a specific feature and its version.
       *
       * @deprecated
       * Since `DOMImplementation.hasFeature` is deprecated and always returns true.
       * @param {string} feature
       * The package name of the feature to test. This is the same name that can be passed to the
       * method `hasFeature` on `DOMImplementation`.
       * @param {string} version
       * This is the version number of the package name to test.
       * @returns {boolean}
       * Returns true in all cases in the current implementation.
       * @since Introduced in DOM Level 2
       * @see {@link DOMImplementation.hasFeature}
       */
      isSupported: function(feature, version) {
        return this.ownerDocument.implementation.hasFeature(feature, version);
      },
      /**
       * Look up the prefix associated to the given namespace URI, starting from this node.
       * **The default namespace declarations are ignored by this method.**
       * See Namespace Prefix Lookup for details on the algorithm used by this method.
       *
       * **This behavior is different from the in the specs**:
       * - no node type specific handling
       * - uses the internal attribute _nsMap for resolving namespaces that is updated when changing attributes
       *
       * @param {string | null} namespaceURI
       * The namespace URI for which to find the associated prefix.
       * @returns {string | null}
       * The associated prefix, if found; otherwise, null.
       * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-lookupNamespacePrefix
       * @see https://www.w3.org/TR/DOM-Level-3-Core/namespaces-algorithms.html#lookupNamespacePrefixAlgo
       * @see https://dom.spec.whatwg.org/#dom-node-lookupprefix
       * @see https://github.com/xmldom/xmldom/issues/322
       * @prettierignore
       */
      lookupPrefix: function(namespaceURI) {
        var el = this;
        while (el) {
          var map = el._nsMap;
          if (map) {
            for (var n in map) {
              if (hasOwn(map, n) && map[n] === namespaceURI) {
                return n;
              }
            }
          }
          el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
        }
        return null;
      },
      /**
       * This function is used to look up the namespace URI associated with the given prefix,
       * starting from this node.
       *
       * **This behavior is different from the in the specs**:
       * - no node type specific handling
       * - uses the internal attribute _nsMap for resolving namespaces that is updated when changing attributes
       *
       * @param {string | null} prefix
       * The prefix for which to find the associated namespace URI.
       * @returns {string | null}
       * The associated namespace URI, if found; otherwise, null.
       * @since DOM Level 3
       * @see https://dom.spec.whatwg.org/#dom-node-lookupnamespaceuri
       * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-lookupNamespaceURI
       * @prettierignore
       */
      lookupNamespaceURI: function(prefix) {
        var el = this;
        while (el) {
          var map = el._nsMap;
          if (map) {
            if (hasOwn(map, prefix)) {
              return map[prefix];
            }
          }
          el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
        }
        return null;
      },
      /**
       * Determines whether the given namespace URI is the default namespace.
       *
       * The function works by looking up the prefix associated with the given namespace URI. If no
       * prefix is found (i.e., the namespace URI is not registered in the namespace map of this
       * node or any of its ancestors), it returns `true`, implying the namespace URI is considered
       * the default.
       *
       * **This behavior is different from the in the specs**:
       * - no node type specific handling
       * - uses the internal attribute _nsMap for resolving namespaces that is updated when changing attributes
       *
       * @param {string | null} namespaceURI
       * The namespace URI to be checked.
       * @returns {boolean}
       * Returns true if the given namespace URI is the default namespace, false otherwise.
       * @since DOM Level 3
       * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-isDefaultNamespace
       * @see https://dom.spec.whatwg.org/#dom-node-isdefaultnamespace
       * @prettierignore
       */
      isDefaultNamespace: function(namespaceURI) {
        var prefix = this.lookupPrefix(namespaceURI);
        return prefix == null;
      },
      /**
       * Compares the reference node with a node with regard to their position in the document and
       * according to the document order.
       *
       * @param {Node} other
       * The node to compare the reference node to.
       * @returns {number}
       * Returns how the node is positioned relatively to the reference node according to the
       * bitmask. 0 if reference node and given node are the same.
       * @since DOM Level 3
       * @see https://www.w3.org/TR/2004/REC-DOM-Level-3-Core-20040407/core.html#Node3-compare
       * @see https://dom.spec.whatwg.org/#dom-node-comparedocumentposition
       */
      compareDocumentPosition: function(other) {
        if (this === other) return 0;
        var node1 = other;
        var node2 = this;
        var attr1 = null;
        var attr2 = null;
        if (node1 instanceof Attr) {
          attr1 = node1;
          node1 = attr1.ownerElement;
        }
        if (node2 instanceof Attr) {
          attr2 = node2;
          node2 = attr2.ownerElement;
          if (attr1 && node1 && node2 === node1) {
            for (var i = 0, attr; attr = node2.attributes[i]; i++) {
              if (attr === attr1)
                return DocumentPosition.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + DocumentPosition.DOCUMENT_POSITION_PRECEDING;
              if (attr === attr2)
                return DocumentPosition.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
            }
          }
        }
        if (!node1 || !node2 || node2.ownerDocument !== node1.ownerDocument) {
          return DocumentPosition.DOCUMENT_POSITION_DISCONNECTED + DocumentPosition.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + (docGUID(node2.ownerDocument) > docGUID(node1.ownerDocument) ? DocumentPosition.DOCUMENT_POSITION_FOLLOWING : DocumentPosition.DOCUMENT_POSITION_PRECEDING);
        }
        if (attr2 && node1 === node2) {
          return DocumentPosition.DOCUMENT_POSITION_CONTAINS + DocumentPosition.DOCUMENT_POSITION_PRECEDING;
        }
        if (attr1 && node1 === node2) {
          return DocumentPosition.DOCUMENT_POSITION_CONTAINED_BY + DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
        }
        var chain1 = [];
        var ancestor1 = node1.parentNode;
        while (ancestor1) {
          if (!attr2 && ancestor1 === node2) {
            return DocumentPosition.DOCUMENT_POSITION_CONTAINED_BY + DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
          }
          chain1.push(ancestor1);
          ancestor1 = ancestor1.parentNode;
        }
        chain1.reverse();
        var chain2 = [];
        var ancestor2 = node2.parentNode;
        while (ancestor2) {
          if (!attr1 && ancestor2 === node1) {
            return DocumentPosition.DOCUMENT_POSITION_CONTAINS + DocumentPosition.DOCUMENT_POSITION_PRECEDING;
          }
          chain2.push(ancestor2);
          ancestor2 = ancestor2.parentNode;
        }
        chain2.reverse();
        var ca = commonAncestor(chain1, chain2);
        for (var n in ca.childNodes) {
          var child = ca.childNodes[n];
          if (child === node2) return DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
          if (child === node1) return DocumentPosition.DOCUMENT_POSITION_PRECEDING;
          if (chain2.indexOf(child) >= 0) return DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
          if (chain1.indexOf(child) >= 0) return DocumentPosition.DOCUMENT_POSITION_PRECEDING;
        }
        return 0;
      }
    };
    function _xmlEncoder(c) {
      return c == "<" && "&lt;" || c == ">" && "&gt;" || c == "&" && "&amp;" || c == '"' && "&quot;" || "&#" + c.charCodeAt() + ";";
    }
    copy(NodeType, Node);
    copy(NodeType, Node.prototype);
    copy(DocumentPosition, Node);
    copy(DocumentPosition, Node.prototype);
    function _visitNode(node, callback) {
      walkDOM(node, null, {
        enter: function(n) {
          return callback(n) ? walkDOM.STOP : true;
        }
      });
    }
    function walkDOM(node, context, callbacks) {
      var stack = [{ node, context, phase: walkDOM.ENTER }];
      while (stack.length > 0) {
        var frame = stack.pop();
        if (frame.phase === walkDOM.ENTER) {
          var childContext = callbacks.enter(frame.node, frame.context);
          if (childContext === walkDOM.STOP) {
            return walkDOM.STOP;
          }
          stack.push({ node: frame.node, context: childContext, phase: walkDOM.EXIT });
          if (childContext === null || childContext === void 0) {
            continue;
          }
          var child = frame.node.lastChild;
          while (child) {
            stack.push({ node: child, context: childContext, phase: walkDOM.ENTER });
            child = child.previousSibling;
          }
        } else {
          if (callbacks.exit) {
            callbacks.exit(frame.node, frame.context);
          }
        }
      }
    }
    walkDOM.STOP = /* @__PURE__ */ Symbol("walkDOM.STOP");
    walkDOM.ENTER = 0;
    walkDOM.EXIT = 1;
    function Document(symbol, options) {
      checkSymbol(symbol);
      var opt = options || {};
      this.ownerDocument = this;
      this.contentType = opt.contentType || MIME_TYPE.XML_APPLICATION;
      this.type = isHTMLMimeType(this.contentType) ? "html" : "xml";
    }
    function _onAddAttribute(doc, el, newAttr) {
      doc && doc._inc++;
      var ns = newAttr.namespaceURI;
      if (ns === NAMESPACE.XMLNS) {
        el._nsMap[newAttr.prefix ? newAttr.localName : ""] = newAttr.value;
      }
    }
    function _onRemoveAttribute(doc, el, newAttr, remove) {
      doc && doc._inc++;
      var ns = newAttr.namespaceURI;
      if (ns === NAMESPACE.XMLNS) {
        delete el._nsMap[newAttr.prefix ? newAttr.localName : ""];
      }
    }
    function _onUpdateChild(doc, parent, newChild) {
      if (doc && doc._inc) {
        doc._inc++;
        var childNodes = parent.childNodes;
        if (newChild && !newChild.nextSibling) {
          childNodes[childNodes.length++] = newChild;
        } else {
          var child = parent.firstChild;
          var i = 0;
          while (child) {
            childNodes[i++] = child;
            child = child.nextSibling;
          }
          childNodes.length = i;
          delete childNodes[childNodes.length];
        }
      }
    }
    function _removeChild(parentNode, child) {
      if (parentNode !== child.parentNode) {
        throw new DOMException(DOMException.NOT_FOUND_ERR, "child's parent is not parent");
      }
      var oldPreviousSibling = child.previousSibling;
      var oldNextSibling = child.nextSibling;
      if (oldPreviousSibling) {
        oldPreviousSibling.nextSibling = oldNextSibling;
      } else {
        parentNode.firstChild = oldNextSibling;
      }
      if (oldNextSibling) {
        oldNextSibling.previousSibling = oldPreviousSibling;
      } else {
        parentNode.lastChild = oldPreviousSibling;
      }
      _onUpdateChild(parentNode.ownerDocument, parentNode);
      child.parentNode = null;
      child.previousSibling = null;
      child.nextSibling = null;
      return child;
    }
    function hasValidParentNodeType(node) {
      return node && (node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.ELEMENT_NODE);
    }
    function hasInsertableNodeType(node) {
      return node && (node.nodeType === Node.CDATA_SECTION_NODE || node.nodeType === Node.COMMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.DOCUMENT_TYPE_NODE || node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.PROCESSING_INSTRUCTION_NODE || node.nodeType === Node.TEXT_NODE);
    }
    function isDocTypeNode(node) {
      return node && node.nodeType === Node.DOCUMENT_TYPE_NODE;
    }
    function isElementNode(node) {
      return node && node.nodeType === Node.ELEMENT_NODE;
    }
    function isTextNode(node) {
      return node && node.nodeType === Node.TEXT_NODE;
    }
    function isElementInsertionPossible(doc, child) {
      var parentChildNodes = doc.childNodes || [];
      if (find(parentChildNodes, isElementNode) || isDocTypeNode(child)) {
        return false;
      }
      var docTypeNode = find(parentChildNodes, isDocTypeNode);
      return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
    }
    function isElementReplacementPossible(doc, child) {
      var parentChildNodes = doc.childNodes || [];
      function hasElementChildThatIsNotChild(node) {
        return isElementNode(node) && node !== child;
      }
      if (find(parentChildNodes, hasElementChildThatIsNotChild)) {
        return false;
      }
      var docTypeNode = find(parentChildNodes, isDocTypeNode);
      return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
    }
    function assertPreInsertionValidity1to5(parent, node, child) {
      if (!hasValidParentNodeType(parent)) {
        throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Unexpected parent node type " + parent.nodeType);
      }
      if (child && child.parentNode !== parent) {
        throw new DOMException(DOMException.NOT_FOUND_ERR, "child not in parent");
      }
      if (
        // 4. If `node` is not a DocumentFragment, DocumentType, Element, or CharacterData node, then throw a "HierarchyRequestError" DOMException.
        !hasInsertableNodeType(node) || // 5. If either `node` is a Text node and `parent` is a document,
        // the sax parser currently adds top level text nodes, this will be fixed in 0.9.0
        // || (node.nodeType === Node.TEXT_NODE && parent.nodeType === Node.DOCUMENT_NODE)
        // or `node` is a doctype and `parent` is not a document, then throw a "HierarchyRequestError" DOMException.
        isDocTypeNode(node) && parent.nodeType !== Node.DOCUMENT_NODE
      ) {
        throw new DOMException(
          DOMException.HIERARCHY_REQUEST_ERR,
          "Unexpected node type " + node.nodeType + " for parent node type " + parent.nodeType
        );
      }
    }
    function assertPreInsertionValidityInDocument(parent, node, child) {
      var parentChildNodes = parent.childNodes || [];
      var nodeChildNodes = node.childNodes || [];
      if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        var nodeChildElements = nodeChildNodes.filter(isElementNode);
        if (nodeChildElements.length > 1 || find(nodeChildNodes, isTextNode)) {
          throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
        }
        if (nodeChildElements.length === 1 && !isElementInsertionPossible(parent, child)) {
          throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
        }
      }
      if (isElementNode(node)) {
        if (!isElementInsertionPossible(parent, child)) {
          throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
        }
      }
      if (isDocTypeNode(node)) {
        if (find(parentChildNodes, isDocTypeNode)) {
          throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
        }
        var parentElementChild = find(parentChildNodes, isElementNode);
        if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) {
          throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
        }
        if (!child && parentElementChild) {
          throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Doctype can not be appended since element is present");
        }
      }
    }
    function assertPreReplacementValidityInDocument(parent, node, child) {
      var parentChildNodes = parent.childNodes || [];
      var nodeChildNodes = node.childNodes || [];
      if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        var nodeChildElements = nodeChildNodes.filter(isElementNode);
        if (nodeChildElements.length > 1 || find(nodeChildNodes, isTextNode)) {
          throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
        }
        if (nodeChildElements.length === 1 && !isElementReplacementPossible(parent, child)) {
          throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
        }
      }
      if (isElementNode(node)) {
        if (!isElementReplacementPossible(parent, child)) {
          throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
        }
      }
      if (isDocTypeNode(node)) {
        let hasDoctypeChildThatIsNotChild = function(node2) {
          return isDocTypeNode(node2) && node2 !== child;
        };
        if (find(parentChildNodes, hasDoctypeChildThatIsNotChild)) {
          throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
        }
        var parentElementChild = find(parentChildNodes, isElementNode);
        if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) {
          throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
        }
      }
    }
    function _insertBefore(parent, node, child, _inDocumentAssertion) {
      assertPreInsertionValidity1to5(parent, node, child);
      if (parent.nodeType === Node.DOCUMENT_NODE) {
        (_inDocumentAssertion || assertPreInsertionValidityInDocument)(parent, node, child);
      }
      var cp = node.parentNode;
      if (cp) {
        cp.removeChild(node);
      }
      if (node.nodeType === DOCUMENT_FRAGMENT_NODE) {
        var newFirst = node.firstChild;
        if (newFirst == null) {
          return node;
        }
        var newLast = node.lastChild;
      } else {
        newFirst = newLast = node;
      }
      var pre = child ? child.previousSibling : parent.lastChild;
      newFirst.previousSibling = pre;
      newLast.nextSibling = child;
      if (pre) {
        pre.nextSibling = newFirst;
      } else {
        parent.firstChild = newFirst;
      }
      if (child == null) {
        parent.lastChild = newLast;
      } else {
        child.previousSibling = newLast;
      }
      do {
        newFirst.parentNode = parent;
      } while (newFirst !== newLast && (newFirst = newFirst.nextSibling));
      _onUpdateChild(parent.ownerDocument || parent, parent, node);
      if (node.nodeType == DOCUMENT_FRAGMENT_NODE) {
        node.firstChild = node.lastChild = null;
      }
      return node;
    }
    Document.prototype = {
      /**
       * The implementation that created this document.
       *
       * @type DOMImplementation
       * @readonly
       */
      implementation: null,
      nodeName: "#document",
      nodeType: DOCUMENT_NODE,
      /**
       * The DocumentType node of the document.
       *
       * @type DocumentType
       * @readonly
       */
      doctype: null,
      documentElement: null,
      _inc: 1,
      insertBefore: function(newChild, refChild) {
        if (newChild.nodeType === DOCUMENT_FRAGMENT_NODE) {
          var child = newChild.firstChild;
          while (child) {
            var next = child.nextSibling;
            this.insertBefore(child, refChild);
            child = next;
          }
          return newChild;
        }
        _insertBefore(this, newChild, refChild);
        newChild.ownerDocument = this;
        if (this.documentElement === null && newChild.nodeType === ELEMENT_NODE) {
          this.documentElement = newChild;
        }
        return newChild;
      },
      removeChild: function(oldChild) {
        var removed = _removeChild(this, oldChild);
        if (removed === this.documentElement) {
          this.documentElement = null;
        }
        return removed;
      },
      replaceChild: function(newChild, oldChild) {
        _insertBefore(this, newChild, oldChild, assertPreReplacementValidityInDocument);
        newChild.ownerDocument = this;
        if (oldChild) {
          this.removeChild(oldChild);
        }
        if (isElementNode(newChild)) {
          this.documentElement = newChild;
        }
      },
      /**
       * Imports a node from another document into this document, creating a new copy owned by this
       * document. The source node and its subtree are not modified.
       *
       * @param {Node} importedNode
       * The node to import.
       * @param {boolean} deep
       * If true, the contents of the node are recursively imported.
       * If false, only the node itself (and its attributes, if it is an element) are imported.
       * @returns {Node}
       * Returns the newly created import of the node.
       * @see {@link importNode}
       * @see {@link https://dom.spec.whatwg.org/#dom-document-importnode}
       */
      importNode: function(importedNode, deep) {
        return importNode(this, importedNode, deep);
      },
      // Introduced in DOM Level 2:
      getElementById: function(id) {
        var rtv = null;
        _visitNode(this.documentElement, function(node) {
          if (node.nodeType == ELEMENT_NODE) {
            if (node.getAttribute("id") == id) {
              rtv = node;
              return true;
            }
          }
        });
        return rtv;
      },
      /**
       * Creates a new `Element` that is owned by this `Document`.
       * In HTML Documents `localName` is the lower cased `tagName`,
       * otherwise no transformation is being applied.
       * When `contentType` implies the HTML namespace, it will be set as `namespaceURI`.
       *
       * __This implementation differs from the specification:__ - The provided name is not checked
       * against the `Name` production,
       * so no related error will be thrown.
       * - There is no interface `HTMLElement`, it is always an `Element`.
       * - There is no support for a second argument to indicate using custom elements.
       *
       * @param {string} tagName
       * @returns {Element}
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
       * @see https://dom.spec.whatwg.org/#dom-document-createelement
       * @see https://dom.spec.whatwg.org/#concept-create-element
       */
      createElement: function(tagName) {
        var node = new Element(PDC);
        node.ownerDocument = this;
        if (this.type === "html") {
          tagName = tagName.toLowerCase();
        }
        if (hasDefaultHTMLNamespace(this.contentType)) {
          node.namespaceURI = NAMESPACE.HTML;
        }
        node.nodeName = tagName;
        node.tagName = tagName;
        node.localName = tagName;
        node.childNodes = new NodeList();
        var attrs = node.attributes = new NamedNodeMap();
        attrs._ownerElement = node;
        return node;
      },
      /**
       * @returns {DocumentFragment}
       */
      createDocumentFragment: function() {
        var node = new DocumentFragment(PDC);
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        return node;
      },
      /**
       * @param {string} data
       * @returns {Text}
       */
      createTextNode: function(data) {
        var node = new Text(PDC);
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        node.appendData(data);
        return node;
      },
      /**
       * @param {string} data
       * @returns {Comment}
       * @see https://dom.spec.whatwg.org/#dom-document-createcomment
       * @see https://www.w3.org/TR/xml/#NT-Comment XML 1.0 production [15]
       * @see https://www.w3.org/TR/DOM-Parsing/#dfn-concept-serialize-xml §3.2.1.3
       *
       *      Note: no validation is performed at creation time. When the resulting document is
       *      serialized with `requireWellFormed: true`, the serializer throws `InvalidStateError`
       *      if the comment data contains `--` anywhere, ends with `-`, or contains characters
       *      outside the XML Char production (W3C DOM Parsing §3.2.1.3). Without that option the
       *      data is emitted verbatim.
       */
      createComment: function(data) {
        var node = new Comment(PDC);
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        node.appendData(data);
        return node;
      },
      /**
       * Returns a new CDATASection node whose data is `data`.
       *
       * __This implementation differs from the specification:__ - calling this method on an HTML
       * document does not throw `NotSupportedError`.
       *
       * @param {string} data
       * @returns {CDATASection}
       * @throws {DOMException}
       * With code `INVALID_CHARACTER_ERR` if `data` contains `"]]>"`.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/createCDATASection
       * @see https://dom.spec.whatwg.org/#dom-document-createcdatasection
       */
      createCDATASection: function(data) {
        if (data.indexOf("]]>") !== -1) {
          throw new DOMException(DOMException.INVALID_CHARACTER_ERR, 'data contains "]]>"');
        }
        var node = new CDATASection(PDC);
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        node.appendData(data);
        return node;
      },
      /**
       * Returns a ProcessingInstruction node whose target is target and data is data.
       *
       * __This behavior is slightly different from the in the specs__:
       * - it does not do any input validation on the arguments and doesn't throw
       * "InvalidCharacterError".
       *
       * Note: When the resulting document is serialized with `requireWellFormed: true`, the
       * serializer throws `InvalidStateError` if `.target` contains `:` or is an ASCII
       * case-insensitive match for `"xml"`, or if `.data` contains `?>` or characters outside the
       * XML Char production (W3C DOM Parsing §3.2.1.7). Without that option the data is emitted
       * verbatim.
       *
       * @param {string} target
       * @param {string} data
       * @returns {ProcessingInstruction}
       * @see https://developer.mozilla.org/docs/Web/API/Document/createProcessingInstruction
       * @see https://dom.spec.whatwg.org/#dom-document-createprocessinginstruction
       * @see https://www.w3.org/TR/DOM-Parsing/#dfn-concept-serialize-xml §3.2.1.7
       */
      createProcessingInstruction: function(target, data) {
        var node = new ProcessingInstruction(PDC);
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        node.nodeName = node.target = target;
        node.nodeValue = node.data = data;
        return node;
      },
      /**
       * Creates an `Attr` node that is owned by this document.
       * In HTML Documents `localName` is the lower cased `name`,
       * otherwise no transformation is being applied.
       *
       * __This implementation differs from the specification:__ - The provided name is not checked
       * against the `Name` production,
       * so no related error will be thrown.
       *
       * @param {string} name
       * @returns {Attr}
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/createAttribute
       * @see https://dom.spec.whatwg.org/#dom-document-createattribute
       */
      createAttribute: function(name) {
        if (!g.QName_exact.test(name)) {
          throw new DOMException(DOMException.INVALID_CHARACTER_ERR, 'invalid character in name "' + name + '"');
        }
        if (this.type === "html") {
          name = name.toLowerCase();
        }
        return this._createAttribute(name);
      },
      _createAttribute: function(name) {
        var node = new Attr(PDC);
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        node.name = name;
        node.nodeName = name;
        node.localName = name;
        node.specified = true;
        return node;
      },
      /**
       * Creates an EntityReference object.
       * The current implementation does not fill the `childNodes` with those of the corresponding
       * `Entity`
       *
       * @deprecated
       * In DOM Level 4.
       * @param {string} name
       * The name of the entity to reference. No namespace well-formedness checks are performed.
       * @returns {EntityReference}
       * @throws {DOMException}
       * With code `INVALID_CHARACTER_ERR` when `name` is not valid.
       * @throws {DOMException}
       * with code `NOT_SUPPORTED_ERR` when the document is of type `html`
       * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-392B75AE
       */
      createEntityReference: function(name) {
        if (!g.Name.test(name)) {
          throw new DOMException(DOMException.INVALID_CHARACTER_ERR, 'not a valid xml name "' + name + '"');
        }
        if (this.type === "html") {
          throw new DOMException("document is an html document", DOMExceptionName.NotSupportedError);
        }
        var node = new EntityReference(PDC);
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        node.nodeName = name;
        return node;
      },
      // Introduced in DOM Level 2:
      /**
       * @param {string} namespaceURI
       * @param {string} qualifiedName
       * @returns {Element}
       */
      createElementNS: function(namespaceURI, qualifiedName) {
        var validated = validateAndExtract(namespaceURI, qualifiedName);
        var node = new Element(PDC);
        var attrs = node.attributes = new NamedNodeMap();
        node.childNodes = new NodeList();
        node.ownerDocument = this;
        node.nodeName = qualifiedName;
        node.tagName = qualifiedName;
        node.namespaceURI = validated[0];
        node.prefix = validated[1];
        node.localName = validated[2];
        attrs._ownerElement = node;
        return node;
      },
      // Introduced in DOM Level 2:
      /**
       * @param {string} namespaceURI
       * @param {string} qualifiedName
       * @returns {Attr}
       */
      createAttributeNS: function(namespaceURI, qualifiedName) {
        var validated = validateAndExtract(namespaceURI, qualifiedName);
        var node = new Attr(PDC);
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        node.nodeName = qualifiedName;
        node.name = qualifiedName;
        node.specified = true;
        node.namespaceURI = validated[0];
        node.prefix = validated[1];
        node.localName = validated[2];
        return node;
      }
    };
    _extends(Document, Node);
    function Element(symbol) {
      checkSymbol(symbol);
      this._nsMap = /* @__PURE__ */ Object.create(null);
    }
    Element.prototype = {
      nodeType: ELEMENT_NODE,
      /**
       * The attributes of this element.
       *
       * @type {NamedNodeMap | null}
       */
      attributes: null,
      getQualifiedName: function() {
        return this.prefix ? this.prefix + ":" + this.localName : this.localName;
      },
      _isInHTMLDocumentAndNamespace: function() {
        return this.ownerDocument.type === "html" && this.namespaceURI === NAMESPACE.HTML;
      },
      /**
       * Implementaton of Level2 Core function hasAttributes.
       *
       * @returns {boolean}
       * True if attribute list is not empty.
       * @see https://www.w3.org/TR/DOM-Level-2-Core/#core-ID-NodeHasAttrs
       */
      hasAttributes: function() {
        return !!(this.attributes && this.attributes.length);
      },
      hasAttribute: function(name) {
        return !!this.getAttributeNode(name);
      },
      /**
       * Returns element’s first attribute whose qualified name is `name`, and `null`
       * if there is no such attribute.
       *
       * @param {string} name
       * @returns {string | null}
       */
      getAttribute: function(name) {
        var attr = this.getAttributeNode(name);
        return attr ? attr.value : null;
      },
      getAttributeNode: function(name) {
        if (this._isInHTMLDocumentAndNamespace()) {
          name = name.toLowerCase();
        }
        return this.attributes.getNamedItem(name);
      },
      /**
       * Sets the value of element’s first attribute whose qualified name is qualifiedName to value.
       *
       * @param {string} name
       * @param {string} value
       */
      setAttribute: function(name, value) {
        if (this._isInHTMLDocumentAndNamespace()) {
          name = name.toLowerCase();
        }
        var attr = this.getAttributeNode(name);
        if (attr) {
          attr.value = attr.nodeValue = "" + value;
        } else {
          attr = this.ownerDocument._createAttribute(name);
          attr.value = attr.nodeValue = "" + value;
          this.setAttributeNode(attr);
        }
      },
      removeAttribute: function(name) {
        var attr = this.getAttributeNode(name);
        attr && this.removeAttributeNode(attr);
      },
      setAttributeNode: function(newAttr) {
        return this.attributes.setNamedItem(newAttr);
      },
      setAttributeNodeNS: function(newAttr) {
        return this.attributes.setNamedItemNS(newAttr);
      },
      removeAttributeNode: function(oldAttr) {
        return this.attributes.removeNamedItem(oldAttr.nodeName);
      },
      //get real attribute name,and remove it by removeAttributeNode
      removeAttributeNS: function(namespaceURI, localName) {
        var old = this.getAttributeNodeNS(namespaceURI, localName);
        old && this.removeAttributeNode(old);
      },
      hasAttributeNS: function(namespaceURI, localName) {
        return this.getAttributeNodeNS(namespaceURI, localName) != null;
      },
      /**
       * Returns element’s attribute whose namespace is `namespaceURI` and local name is
       * `localName`,
       * or `null` if there is no such attribute.
       *
       * @param {string} namespaceURI
       * @param {string} localName
       * @returns {string | null}
       */
      getAttributeNS: function(namespaceURI, localName) {
        var attr = this.getAttributeNodeNS(namespaceURI, localName);
        return attr ? attr.value : null;
      },
      /**
       * Sets the value of element’s attribute whose namespace is `namespaceURI` and local name is
       * `localName` to value.
       *
       * @param {string} namespaceURI
       * @param {string} qualifiedName
       * @param {string} value
       * @see https://dom.spec.whatwg.org/#dom-element-setattributens
       */
      setAttributeNS: function(namespaceURI, qualifiedName, value) {
        var validated = validateAndExtract(namespaceURI, qualifiedName);
        var localName = validated[2];
        var attr = this.getAttributeNodeNS(namespaceURI, localName);
        if (attr) {
          attr.value = attr.nodeValue = "" + value;
        } else {
          attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
          attr.value = attr.nodeValue = "" + value;
          this.setAttributeNode(attr);
        }
      },
      getAttributeNodeNS: function(namespaceURI, localName) {
        return this.attributes.getNamedItemNS(namespaceURI, localName);
      },
      /**
       * Returns a LiveNodeList of all child elements which have **all** of the given class name(s).
       *
       * Returns an empty list if `classNames` is an empty string or only contains HTML white space
       * characters.
       *
       * Warning: This returns a live LiveNodeList.
       * Changes in the DOM will reflect in the array as the changes occur.
       * If an element selected by this array no longer qualifies for the selector,
       * it will automatically be removed. Be aware of this for iteration purposes.
       *
       * @param {string} classNames
       * Is a string representing the class name(s) to match; multiple class names are separated by
       * (ASCII-)whitespace.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByClassName
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementsByClassName
       * @see https://dom.spec.whatwg.org/#concept-getelementsbyclassname
       */
      getElementsByClassName: function(classNames) {
        var classNamesSet = toOrderedSet(classNames);
        return new LiveNodeList(this, function(base) {
          var ls = [];
          if (classNamesSet.length > 0) {
            _visitNode(base, function(node) {
              if (node !== base && node.nodeType === ELEMENT_NODE) {
                var nodeClassNames = node.getAttribute("class");
                if (nodeClassNames) {
                  var matches = classNames === nodeClassNames;
                  if (!matches) {
                    var nodeClassNamesSet = toOrderedSet(nodeClassNames);
                    matches = classNamesSet.every(arrayIncludes(nodeClassNamesSet));
                  }
                  if (matches) {
                    ls.push(node);
                  }
                }
              }
            });
          }
          return ls;
        });
      },
      /**
       * Returns a LiveNodeList of elements with the given qualifiedName.
       * Searching for all descendants can be done by passing `*` as `qualifiedName`.
       *
       * All descendants of the specified element are searched, but not the element itself.
       * The returned list is live, which means it updates itself with the DOM tree automatically.
       * Therefore, there is no need to call `Element.getElementsByTagName()`
       * with the same element and arguments repeatedly if the DOM changes in between calls.
       *
       * When called on an HTML element in an HTML document,
       * `getElementsByTagName` lower-cases the argument before searching for it.
       * This is undesirable when trying to match camel-cased SVG elements (such as
       * `<linearGradient>`) in an HTML document.
       * Instead, use `Element.getElementsByTagNameNS()`,
       * which preserves the capitalization of the tag name.
       *
       * `Element.getElementsByTagName` is similar to `Document.getElementsByTagName()`,
       * except that it only searches for elements that are descendants of the specified element.
       *
       * @param {string} qualifiedName
       * @returns {LiveNodeList}
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByTagName
       * @see https://dom.spec.whatwg.org/#concept-getelementsbytagname
       */
      getElementsByTagName: function(qualifiedName) {
        var isHTMLDocument = (this.nodeType === DOCUMENT_NODE ? this : this.ownerDocument).type === "html";
        var lowerQualifiedName = qualifiedName.toLowerCase();
        return new LiveNodeList(this, function(base) {
          var ls = [];
          _visitNode(base, function(node) {
            if (node === base || node.nodeType !== ELEMENT_NODE) {
              return;
            }
            if (qualifiedName === "*") {
              ls.push(node);
            } else {
              var nodeQualifiedName = node.getQualifiedName();
              var matchingQName = isHTMLDocument && node.namespaceURI === NAMESPACE.HTML ? lowerQualifiedName : qualifiedName;
              if (nodeQualifiedName === matchingQName) {
                ls.push(node);
              }
            }
          });
          return ls;
        });
      },
      getElementsByTagNameNS: function(namespaceURI, localName) {
        return new LiveNodeList(this, function(base) {
          var ls = [];
          _visitNode(base, function(node) {
            if (node !== base && node.nodeType === ELEMENT_NODE && (namespaceURI === "*" || node.namespaceURI === namespaceURI) && (localName === "*" || node.localName == localName)) {
              ls.push(node);
            }
          });
          return ls;
        });
      }
    };
    Document.prototype.getElementsByClassName = Element.prototype.getElementsByClassName;
    Document.prototype.getElementsByTagName = Element.prototype.getElementsByTagName;
    Document.prototype.getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS;
    _extends(Element, Node);
    function Attr(symbol) {
      checkSymbol(symbol);
      this.namespaceURI = null;
      this.prefix = null;
      this.ownerElement = null;
    }
    Attr.prototype.nodeType = ATTRIBUTE_NODE;
    _extends(Attr, Node);
    function CharacterData(symbol) {
      checkSymbol(symbol);
    }
    CharacterData.prototype = {
      data: "",
      substringData: function(offset, count) {
        return this.data.substring(offset, offset + count);
      },
      appendData: function(text) {
        text = this.data + text;
        this.nodeValue = this.data = text;
        this.length = text.length;
      },
      insertData: function(offset, text) {
        this.replaceData(offset, 0, text);
      },
      deleteData: function(offset, count) {
        this.replaceData(offset, count, "");
      },
      replaceData: function(offset, count, text) {
        var start = this.data.substring(0, offset);
        var end = this.data.substring(offset + count);
        text = start + text + end;
        this.nodeValue = this.data = text;
        this.length = text.length;
      }
    };
    _extends(CharacterData, Node);
    function Text(symbol) {
      checkSymbol(symbol);
    }
    Text.prototype = {
      nodeName: "#text",
      nodeType: TEXT_NODE,
      splitText: function(offset) {
        var text = this.data;
        var newText = text.substring(offset);
        text = text.substring(0, offset);
        this.data = this.nodeValue = text;
        this.length = text.length;
        var newNode = this.ownerDocument.createTextNode(newText);
        if (this.parentNode) {
          this.parentNode.insertBefore(newNode, this.nextSibling);
        }
        return newNode;
      }
    };
    _extends(Text, CharacterData);
    function Comment(symbol) {
      checkSymbol(symbol);
    }
    Comment.prototype = {
      nodeName: "#comment",
      nodeType: COMMENT_NODE
    };
    _extends(Comment, CharacterData);
    function CDATASection(symbol) {
      checkSymbol(symbol);
    }
    CDATASection.prototype = {
      nodeName: "#cdata-section",
      nodeType: CDATA_SECTION_NODE
    };
    _extends(CDATASection, Text);
    function DocumentType(symbol) {
      checkSymbol(symbol);
    }
    DocumentType.prototype.nodeType = DOCUMENT_TYPE_NODE;
    _extends(DocumentType, Node);
    function Notation(symbol) {
      checkSymbol(symbol);
    }
    Notation.prototype.nodeType = NOTATION_NODE;
    _extends(Notation, Node);
    function Entity(symbol) {
      checkSymbol(symbol);
    }
    Entity.prototype.nodeType = ENTITY_NODE;
    _extends(Entity, Node);
    function EntityReference(symbol) {
      checkSymbol(symbol);
    }
    EntityReference.prototype.nodeType = ENTITY_REFERENCE_NODE;
    _extends(EntityReference, Node);
    function DocumentFragment(symbol) {
      checkSymbol(symbol);
    }
    DocumentFragment.prototype.nodeName = "#document-fragment";
    DocumentFragment.prototype.nodeType = DOCUMENT_FRAGMENT_NODE;
    _extends(DocumentFragment, Node);
    function ProcessingInstruction(symbol) {
      checkSymbol(symbol);
    }
    ProcessingInstruction.prototype.nodeType = PROCESSING_INSTRUCTION_NODE;
    _extends(ProcessingInstruction, CharacterData);
    function XMLSerializer() {
    }
    XMLSerializer.prototype.serializeToString = function(node, options) {
      return nodeSerializeToString.call(node, options);
    };
    Node.prototype.toString = nodeSerializeToString;
    function nodeSerializeToString(options) {
      var opts;
      if (typeof options === "function") {
        opts = { requireWellFormed: false, splitCDATASections: true, nodeFilter: options };
      } else if (options != null) {
        opts = {
          requireWellFormed: !!options.requireWellFormed,
          splitCDATASections: options.splitCDATASections !== false,
          nodeFilter: options.nodeFilter || null
        };
      } else {
        opts = { requireWellFormed: false, splitCDATASections: true, nodeFilter: null };
      }
      var buf = [];
      var refNode = this.nodeType === DOCUMENT_NODE && this.documentElement || this;
      var prefix = refNode.prefix;
      var uri = refNode.namespaceURI;
      if (uri && prefix == null) {
        var prefix = refNode.lookupPrefix(uri);
        if (prefix == null) {
          var visibleNamespaces = [
            { namespace: uri, prefix: null }
            //{namespace:uri,prefix:''}
          ];
        }
      }
      serializeToString(this, buf, visibleNamespaces, opts);
      return buf.join("");
    }
    function needNamespaceDefine(node, isHTML, visibleNamespaces) {
      var prefix = node.prefix || "";
      var uri = node.namespaceURI;
      if (!uri) {
        return false;
      }
      if (prefix === "xml" && uri === NAMESPACE.XML || uri === NAMESPACE.XMLNS) {
        return false;
      }
      var i = visibleNamespaces.length;
      while (i--) {
        var ns = visibleNamespaces[i];
        if (ns.prefix === prefix) {
          return ns.namespace !== uri;
        }
      }
      return true;
    }
    function addSerializedAttribute(buf, qualifiedName, value) {
      buf.push(" ", qualifiedName, '="', value.replace(/[<>&"\t\n\r]/g, _xmlEncoder), '"');
    }
    function serializeToString(node, buf, visibleNamespaces, opts) {
      if (!visibleNamespaces) {
        visibleNamespaces = [];
      }
      var nodeFilter = opts.nodeFilter;
      var requireWellFormed = opts.requireWellFormed;
      var splitCDATASections = opts.splitCDATASections;
      var doc = node.nodeType === DOCUMENT_NODE ? node : node.ownerDocument;
      var isHTML = doc.type === "html";
      walkDOM(
        node,
        { ns: visibleNamespaces },
        {
          enter: function(n, ctx) {
            var namespaces = ctx.ns;
            if (nodeFilter) {
              n = nodeFilter(n);
              if (n) {
                if (typeof n == "string") {
                  buf.push(n);
                  return null;
                }
              } else {
                return null;
              }
            }
            switch (n.nodeType) {
              case ELEMENT_NODE:
                var attrs = n.attributes;
                var len = attrs.length;
                var nodeName = n.tagName;
                var prefixedNodeName = nodeName;
                if (!isHTML && !n.prefix && n.namespaceURI) {
                  var defaultNS;
                  for (var ai = 0; ai < attrs.length; ai++) {
                    if (attrs.item(ai).name === "xmlns") {
                      defaultNS = attrs.item(ai).value;
                      break;
                    }
                  }
                  if (!defaultNS) {
                    for (var nsi = namespaces.length - 1; nsi >= 0; nsi--) {
                      var nsEntry = namespaces[nsi];
                      if (nsEntry.prefix === "" && nsEntry.namespace === n.namespaceURI) {
                        defaultNS = nsEntry.namespace;
                        break;
                      }
                    }
                  }
                  if (defaultNS !== n.namespaceURI) {
                    for (var nsi = namespaces.length - 1; nsi >= 0; nsi--) {
                      var nsEntry = namespaces[nsi];
                      if (nsEntry.namespace === n.namespaceURI) {
                        if (nsEntry.prefix) {
                          prefixedNodeName = nsEntry.prefix + ":" + nodeName;
                        }
                        break;
                      }
                    }
                  }
                }
                buf.push("<", prefixedNodeName);
                var childNamespaces = namespaces.slice();
                for (var i = 0; i < len; i++) {
                  var attr = attrs.item(i);
                  if (attr.prefix == "xmlns") {
                    childNamespaces.push({
                      prefix: attr.localName,
                      namespace: attr.value
                    });
                  } else if (attr.nodeName == "xmlns") {
                    childNamespaces.push({ prefix: "", namespace: attr.value });
                  }
                }
                for (var i = 0; i < len; i++) {
                  var attr = attrs.item(i);
                  if (needNamespaceDefine(attr, isHTML, childNamespaces)) {
                    var attrPrefix = attr.prefix || "";
                    var uri = attr.namespaceURI;
                    addSerializedAttribute(buf, attrPrefix ? "xmlns:" + attrPrefix : "xmlns", uri);
                    childNamespaces.push({ prefix: attrPrefix, namespace: uri });
                  }
                  var filteredAttr = nodeFilter ? nodeFilter(attr) : attr;
                  if (filteredAttr) {
                    if (typeof filteredAttr === "string") {
                      buf.push(filteredAttr);
                    } else {
                      addSerializedAttribute(buf, filteredAttr.name, filteredAttr.value);
                    }
                  }
                }
                if (nodeName === prefixedNodeName && needNamespaceDefine(n, isHTML, childNamespaces)) {
                  var nodePrefix = n.prefix || "";
                  var uri = n.namespaceURI;
                  addSerializedAttribute(buf, nodePrefix ? "xmlns:" + nodePrefix : "xmlns", uri);
                  childNamespaces.push({ prefix: nodePrefix, namespace: uri });
                }
                var canCloseTag = !n.firstChild;
                if (canCloseTag && (isHTML || n.namespaceURI === NAMESPACE.HTML)) {
                  canCloseTag = isHTMLVoidElement(nodeName);
                }
                if (canCloseTag) {
                  buf.push("/>");
                  return null;
                }
                buf.push(">");
                if (isHTML && isHTMLRawTextElement(nodeName)) {
                  var child = n.firstChild;
                  while (child) {
                    if (child.data) {
                      buf.push(child.data);
                    } else {
                      serializeToString(child, buf, childNamespaces.slice(), opts);
                    }
                    child = child.nextSibling;
                  }
                  buf.push("</", prefixedNodeName, ">");
                  return null;
                }
                return { ns: childNamespaces, tag: prefixedNodeName };
              case DOCUMENT_NODE:
              case DOCUMENT_FRAGMENT_NODE:
                if (requireWellFormed && n.nodeType === DOCUMENT_NODE && n.documentElement == null) {
                  throw new DOMException("The Document has no documentElement", DOMExceptionName.InvalidStateError);
                }
                return { ns: namespaces };
              case ATTRIBUTE_NODE:
                addSerializedAttribute(buf, n.name, n.value);
                return null;
              case TEXT_NODE:
                if (requireWellFormed && g.InvalidChar.test(n.data)) {
                  throw new DOMException(
                    "The Text node data contains characters outside the XML Char production",
                    DOMExceptionName.InvalidStateError
                  );
                }
                buf.push(n.data.replace(/[<&>]/g, _xmlEncoder));
                return null;
              case CDATA_SECTION_NODE:
                if (requireWellFormed && n.data.indexOf("]]>") !== -1) {
                  throw new DOMException('The CDATASection data contains "]]>"', DOMExceptionName.InvalidStateError);
                }
                if (splitCDATASections) {
                  buf.push(g.CDATA_START, n.data.replace(/]]>/g, "]]]]><![CDATA[>"), g.CDATA_END);
                } else {
                  buf.push(g.CDATA_START, n.data, g.CDATA_END);
                }
                return null;
              case COMMENT_NODE:
                if (requireWellFormed) {
                  if (g.InvalidChar.test(n.data)) {
                    throw new DOMException(
                      "The comment node data contains characters outside the XML Char production",
                      DOMExceptionName.InvalidStateError
                    );
                  }
                  if (n.data.indexOf("--") !== -1 || n.data[n.data.length - 1] === "-") {
                    throw new DOMException(
                      'The comment node data contains "--" or ends with "-"',
                      DOMExceptionName.InvalidStateError
                    );
                  }
                }
                buf.push(g.COMMENT_START, n.data, g.COMMENT_END);
                return null;
              case DOCUMENT_TYPE_NODE:
                var pubid = n.publicId;
                var sysid = n.systemId;
                if (requireWellFormed) {
                  if (pubid && !g.PubidLiteral_match.test(pubid)) {
                    throw new DOMException("DocumentType publicId is not a valid PubidLiteral", DOMExceptionName.InvalidStateError);
                  }
                  if (sysid && sysid !== "." && !g.SystemLiteral_match.test(sysid)) {
                    throw new DOMException("DocumentType systemId is not a valid SystemLiteral", DOMExceptionName.InvalidStateError);
                  }
                  if (n.internalSubset && n.internalSubset.indexOf("]>") !== -1) {
                    throw new DOMException('DocumentType internalSubset contains "]>"', DOMExceptionName.InvalidStateError);
                  }
                }
                buf.push(g.DOCTYPE_DECL_START, " ", n.name);
                if (pubid) {
                  buf.push(" ", g.PUBLIC, " ", pubid);
                  if (sysid && sysid !== ".") {
                    buf.push(" ", sysid);
                  }
                } else if (sysid && sysid !== ".") {
                  buf.push(" ", g.SYSTEM, " ", sysid);
                }
                if (n.internalSubset) {
                  buf.push(" [", n.internalSubset, "]");
                }
                buf.push(">");
                return null;
              case PROCESSING_INSTRUCTION_NODE:
                if (requireWellFormed) {
                  if (n.target.indexOf(":") !== -1 || n.target.toLowerCase() === "xml") {
                    throw new DOMException("The ProcessingInstruction target is not well-formed", DOMExceptionName.InvalidStateError);
                  }
                  if (g.InvalidChar.test(n.data)) {
                    throw new DOMException(
                      "The ProcessingInstruction data contains characters outside the XML Char production",
                      DOMExceptionName.InvalidStateError
                    );
                  }
                  if (n.data.indexOf("?>") !== -1) {
                    throw new DOMException('The ProcessingInstruction data contains "?>"', DOMExceptionName.InvalidStateError);
                  }
                }
                buf.push("<?", n.target, " ", n.data, "?>");
                return null;
              case ENTITY_REFERENCE_NODE:
                buf.push("&", n.nodeName, ";");
                return null;
              //case ENTITY_NODE:
              //case NOTATION_NODE:
              default:
                buf.push("??", n.nodeName);
                return null;
            }
          },
          exit: function(n, childCtx) {
            if (childCtx && childCtx.tag) {
              buf.push("</", childCtx.tag, ">");
            }
          }
        }
      );
    }
    function importNode(doc, node, deep) {
      var destRoot;
      walkDOM(node, null, {
        enter: function(srcNode, destParent) {
          var destNode = srcNode.cloneNode(false);
          destNode.ownerDocument = doc;
          destNode.parentNode = null;
          if (destParent === null) {
            destRoot = destNode;
          } else {
            destParent.appendChild(destNode);
          }
          var shouldDeep = srcNode.nodeType === ATTRIBUTE_NODE || deep;
          return shouldDeep ? destNode : null;
        }
      });
      return destRoot;
    }
    function cloneNode(doc, node, deep) {
      var destRoot;
      walkDOM(node, null, {
        enter: function(srcNode, destParent) {
          var destNode = new srcNode.constructor(PDC);
          for (var n in srcNode) {
            if (hasOwn(srcNode, n)) {
              var v = srcNode[n];
              if (typeof v != "object") {
                if (v != destNode[n]) {
                  destNode[n] = v;
                }
              }
            }
          }
          if (srcNode.childNodes) {
            destNode.childNodes = new NodeList();
          }
          destNode.ownerDocument = doc;
          var shouldDeep = deep;
          switch (destNode.nodeType) {
            case ELEMENT_NODE:
              var attrs = srcNode.attributes;
              var attrs2 = destNode.attributes = new NamedNodeMap();
              var len = attrs.length;
              attrs2._ownerElement = destNode;
              for (var i = 0; i < len; i++) {
                destNode.setAttributeNode(cloneNode(doc, attrs.item(i), true));
              }
              break;
            case ATTRIBUTE_NODE:
              shouldDeep = true;
          }
          if (destParent !== null) {
            destParent.appendChild(destNode);
          } else {
            destRoot = destNode;
          }
          return shouldDeep ? destNode : null;
        }
      });
      return destRoot;
    }
    function __set__(object, key, value) {
      object[key] = value;
    }
    function childrenRefresh(node) {
      var ls = [];
      var child = node.firstChild;
      while (child) {
        if (child.nodeType === ELEMENT_NODE) {
          ls.push(child);
        }
        child = child.nextSibling;
      }
      return ls;
    }
    try {
      if (Object.defineProperty) {
        Object.defineProperty(LiveNodeList.prototype, "length", {
          get: function() {
            _updateLiveList(this);
            return this.$$length;
          }
        });
        Object.defineProperty(Node.prototype, "textContent", {
          get: function() {
            if (this.nodeType === ELEMENT_NODE || this.nodeType === DOCUMENT_FRAGMENT_NODE) {
              var buf = [];
              walkDOM(this, null, {
                enter: function(n) {
                  if (n.nodeType === ELEMENT_NODE || n.nodeType === DOCUMENT_FRAGMENT_NODE) {
                    return true;
                  }
                  if (n.nodeType === PROCESSING_INSTRUCTION_NODE || n.nodeType === COMMENT_NODE) {
                    return null;
                  }
                  buf.push(n.nodeValue);
                }
              });
              return buf.join("");
            }
            return this.nodeValue;
          },
          set: function(data) {
            switch (this.nodeType) {
              case ELEMENT_NODE:
              case DOCUMENT_FRAGMENT_NODE:
                while (this.firstChild) {
                  this.removeChild(this.firstChild);
                }
                if (data || String(data)) {
                  this.appendChild(this.ownerDocument.createTextNode(data));
                }
                break;
              default:
                this.data = data;
                this.value = data;
                this.nodeValue = data;
            }
          }
        });
        Object.defineProperty(Element.prototype, "children", {
          get: function() {
            return new LiveNodeList(this, childrenRefresh);
          }
        });
        Object.defineProperty(Document.prototype, "children", {
          get: function() {
            return new LiveNodeList(this, childrenRefresh);
          }
        });
        Object.defineProperty(DocumentFragment.prototype, "children", {
          get: function() {
            return new LiveNodeList(this, childrenRefresh);
          }
        });
        __set__ = function(object, key, value) {
          object["$$" + key] = value;
        };
      }
    } catch (e) {
    }
    exports2._updateLiveList = _updateLiveList;
    exports2.Attr = Attr;
    exports2.CDATASection = CDATASection;
    exports2.CharacterData = CharacterData;
    exports2.Comment = Comment;
    exports2.Document = Document;
    exports2.DocumentFragment = DocumentFragment;
    exports2.DocumentType = DocumentType;
    exports2.DOMImplementation = DOMImplementation;
    exports2.Element = Element;
    exports2.Entity = Entity;
    exports2.EntityReference = EntityReference;
    exports2.LiveNodeList = LiveNodeList;
    exports2.NamedNodeMap = NamedNodeMap;
    exports2.Node = Node;
    exports2.NodeList = NodeList;
    exports2.Notation = Notation;
    exports2.Text = Text;
    exports2.ProcessingInstruction = ProcessingInstruction;
    exports2.walkDOM = walkDOM;
    exports2.XMLSerializer = XMLSerializer;
  }
});

// node_modules/@xmldom/xmldom/lib/entities.js
var require_entities = __commonJS({
  "node_modules/@xmldom/xmldom/lib/entities.js"(exports2) {
    "use strict";
    var freeze = require_conventions().freeze;
    exports2.XML_ENTITIES = freeze({
      amp: "&",
      apos: "'",
      gt: ">",
      lt: "<",
      quot: '"'
    });
    exports2.HTML_ENTITIES = freeze({
      Aacute: "\xC1",
      aacute: "\xE1",
      Abreve: "\u0102",
      abreve: "\u0103",
      ac: "\u223E",
      acd: "\u223F",
      acE: "\u223E\u0333",
      Acirc: "\xC2",
      acirc: "\xE2",
      acute: "\xB4",
      Acy: "\u0410",
      acy: "\u0430",
      AElig: "\xC6",
      aelig: "\xE6",
      af: "\u2061",
      Afr: "\u{1D504}",
      afr: "\u{1D51E}",
      Agrave: "\xC0",
      agrave: "\xE0",
      alefsym: "\u2135",
      aleph: "\u2135",
      Alpha: "\u0391",
      alpha: "\u03B1",
      Amacr: "\u0100",
      amacr: "\u0101",
      amalg: "\u2A3F",
      AMP: "&",
      amp: "&",
      And: "\u2A53",
      and: "\u2227",
      andand: "\u2A55",
      andd: "\u2A5C",
      andslope: "\u2A58",
      andv: "\u2A5A",
      ang: "\u2220",
      ange: "\u29A4",
      angle: "\u2220",
      angmsd: "\u2221",
      angmsdaa: "\u29A8",
      angmsdab: "\u29A9",
      angmsdac: "\u29AA",
      angmsdad: "\u29AB",
      angmsdae: "\u29AC",
      angmsdaf: "\u29AD",
      angmsdag: "\u29AE",
      angmsdah: "\u29AF",
      angrt: "\u221F",
      angrtvb: "\u22BE",
      angrtvbd: "\u299D",
      angsph: "\u2222",
      angst: "\xC5",
      angzarr: "\u237C",
      Aogon: "\u0104",
      aogon: "\u0105",
      Aopf: "\u{1D538}",
      aopf: "\u{1D552}",
      ap: "\u2248",
      apacir: "\u2A6F",
      apE: "\u2A70",
      ape: "\u224A",
      apid: "\u224B",
      apos: "'",
      ApplyFunction: "\u2061",
      approx: "\u2248",
      approxeq: "\u224A",
      Aring: "\xC5",
      aring: "\xE5",
      Ascr: "\u{1D49C}",
      ascr: "\u{1D4B6}",
      Assign: "\u2254",
      ast: "*",
      asymp: "\u2248",
      asympeq: "\u224D",
      Atilde: "\xC3",
      atilde: "\xE3",
      Auml: "\xC4",
      auml: "\xE4",
      awconint: "\u2233",
      awint: "\u2A11",
      backcong: "\u224C",
      backepsilon: "\u03F6",
      backprime: "\u2035",
      backsim: "\u223D",
      backsimeq: "\u22CD",
      Backslash: "\u2216",
      Barv: "\u2AE7",
      barvee: "\u22BD",
      Barwed: "\u2306",
      barwed: "\u2305",
      barwedge: "\u2305",
      bbrk: "\u23B5",
      bbrktbrk: "\u23B6",
      bcong: "\u224C",
      Bcy: "\u0411",
      bcy: "\u0431",
      bdquo: "\u201E",
      becaus: "\u2235",
      Because: "\u2235",
      because: "\u2235",
      bemptyv: "\u29B0",
      bepsi: "\u03F6",
      bernou: "\u212C",
      Bernoullis: "\u212C",
      Beta: "\u0392",
      beta: "\u03B2",
      beth: "\u2136",
      between: "\u226C",
      Bfr: "\u{1D505}",
      bfr: "\u{1D51F}",
      bigcap: "\u22C2",
      bigcirc: "\u25EF",
      bigcup: "\u22C3",
      bigodot: "\u2A00",
      bigoplus: "\u2A01",
      bigotimes: "\u2A02",
      bigsqcup: "\u2A06",
      bigstar: "\u2605",
      bigtriangledown: "\u25BD",
      bigtriangleup: "\u25B3",
      biguplus: "\u2A04",
      bigvee: "\u22C1",
      bigwedge: "\u22C0",
      bkarow: "\u290D",
      blacklozenge: "\u29EB",
      blacksquare: "\u25AA",
      blacktriangle: "\u25B4",
      blacktriangledown: "\u25BE",
      blacktriangleleft: "\u25C2",
      blacktriangleright: "\u25B8",
      blank: "\u2423",
      blk12: "\u2592",
      blk14: "\u2591",
      blk34: "\u2593",
      block: "\u2588",
      bne: "=\u20E5",
      bnequiv: "\u2261\u20E5",
      bNot: "\u2AED",
      bnot: "\u2310",
      Bopf: "\u{1D539}",
      bopf: "\u{1D553}",
      bot: "\u22A5",
      bottom: "\u22A5",
      bowtie: "\u22C8",
      boxbox: "\u29C9",
      boxDL: "\u2557",
      boxDl: "\u2556",
      boxdL: "\u2555",
      boxdl: "\u2510",
      boxDR: "\u2554",
      boxDr: "\u2553",
      boxdR: "\u2552",
      boxdr: "\u250C",
      boxH: "\u2550",
      boxh: "\u2500",
      boxHD: "\u2566",
      boxHd: "\u2564",
      boxhD: "\u2565",
      boxhd: "\u252C",
      boxHU: "\u2569",
      boxHu: "\u2567",
      boxhU: "\u2568",
      boxhu: "\u2534",
      boxminus: "\u229F",
      boxplus: "\u229E",
      boxtimes: "\u22A0",
      boxUL: "\u255D",
      boxUl: "\u255C",
      boxuL: "\u255B",
      boxul: "\u2518",
      boxUR: "\u255A",
      boxUr: "\u2559",
      boxuR: "\u2558",
      boxur: "\u2514",
      boxV: "\u2551",
      boxv: "\u2502",
      boxVH: "\u256C",
      boxVh: "\u256B",
      boxvH: "\u256A",
      boxvh: "\u253C",
      boxVL: "\u2563",
      boxVl: "\u2562",
      boxvL: "\u2561",
      boxvl: "\u2524",
      boxVR: "\u2560",
      boxVr: "\u255F",
      boxvR: "\u255E",
      boxvr: "\u251C",
      bprime: "\u2035",
      Breve: "\u02D8",
      breve: "\u02D8",
      brvbar: "\xA6",
      Bscr: "\u212C",
      bscr: "\u{1D4B7}",
      bsemi: "\u204F",
      bsim: "\u223D",
      bsime: "\u22CD",
      bsol: "\\",
      bsolb: "\u29C5",
      bsolhsub: "\u27C8",
      bull: "\u2022",
      bullet: "\u2022",
      bump: "\u224E",
      bumpE: "\u2AAE",
      bumpe: "\u224F",
      Bumpeq: "\u224E",
      bumpeq: "\u224F",
      Cacute: "\u0106",
      cacute: "\u0107",
      Cap: "\u22D2",
      cap: "\u2229",
      capand: "\u2A44",
      capbrcup: "\u2A49",
      capcap: "\u2A4B",
      capcup: "\u2A47",
      capdot: "\u2A40",
      CapitalDifferentialD: "\u2145",
      caps: "\u2229\uFE00",
      caret: "\u2041",
      caron: "\u02C7",
      Cayleys: "\u212D",
      ccaps: "\u2A4D",
      Ccaron: "\u010C",
      ccaron: "\u010D",
      Ccedil: "\xC7",
      ccedil: "\xE7",
      Ccirc: "\u0108",
      ccirc: "\u0109",
      Cconint: "\u2230",
      ccups: "\u2A4C",
      ccupssm: "\u2A50",
      Cdot: "\u010A",
      cdot: "\u010B",
      cedil: "\xB8",
      Cedilla: "\xB8",
      cemptyv: "\u29B2",
      cent: "\xA2",
      CenterDot: "\xB7",
      centerdot: "\xB7",
      Cfr: "\u212D",
      cfr: "\u{1D520}",
      CHcy: "\u0427",
      chcy: "\u0447",
      check: "\u2713",
      checkmark: "\u2713",
      Chi: "\u03A7",
      chi: "\u03C7",
      cir: "\u25CB",
      circ: "\u02C6",
      circeq: "\u2257",
      circlearrowleft: "\u21BA",
      circlearrowright: "\u21BB",
      circledast: "\u229B",
      circledcirc: "\u229A",
      circleddash: "\u229D",
      CircleDot: "\u2299",
      circledR: "\xAE",
      circledS: "\u24C8",
      CircleMinus: "\u2296",
      CirclePlus: "\u2295",
      CircleTimes: "\u2297",
      cirE: "\u29C3",
      cire: "\u2257",
      cirfnint: "\u2A10",
      cirmid: "\u2AEF",
      cirscir: "\u29C2",
      ClockwiseContourIntegral: "\u2232",
      CloseCurlyDoubleQuote: "\u201D",
      CloseCurlyQuote: "\u2019",
      clubs: "\u2663",
      clubsuit: "\u2663",
      Colon: "\u2237",
      colon: ":",
      Colone: "\u2A74",
      colone: "\u2254",
      coloneq: "\u2254",
      comma: ",",
      commat: "@",
      comp: "\u2201",
      compfn: "\u2218",
      complement: "\u2201",
      complexes: "\u2102",
      cong: "\u2245",
      congdot: "\u2A6D",
      Congruent: "\u2261",
      Conint: "\u222F",
      conint: "\u222E",
      ContourIntegral: "\u222E",
      Copf: "\u2102",
      copf: "\u{1D554}",
      coprod: "\u2210",
      Coproduct: "\u2210",
      COPY: "\xA9",
      copy: "\xA9",
      copysr: "\u2117",
      CounterClockwiseContourIntegral: "\u2233",
      crarr: "\u21B5",
      Cross: "\u2A2F",
      cross: "\u2717",
      Cscr: "\u{1D49E}",
      cscr: "\u{1D4B8}",
      csub: "\u2ACF",
      csube: "\u2AD1",
      csup: "\u2AD0",
      csupe: "\u2AD2",
      ctdot: "\u22EF",
      cudarrl: "\u2938",
      cudarrr: "\u2935",
      cuepr: "\u22DE",
      cuesc: "\u22DF",
      cularr: "\u21B6",
      cularrp: "\u293D",
      Cup: "\u22D3",
      cup: "\u222A",
      cupbrcap: "\u2A48",
      CupCap: "\u224D",
      cupcap: "\u2A46",
      cupcup: "\u2A4A",
      cupdot: "\u228D",
      cupor: "\u2A45",
      cups: "\u222A\uFE00",
      curarr: "\u21B7",
      curarrm: "\u293C",
      curlyeqprec: "\u22DE",
      curlyeqsucc: "\u22DF",
      curlyvee: "\u22CE",
      curlywedge: "\u22CF",
      curren: "\xA4",
      curvearrowleft: "\u21B6",
      curvearrowright: "\u21B7",
      cuvee: "\u22CE",
      cuwed: "\u22CF",
      cwconint: "\u2232",
      cwint: "\u2231",
      cylcty: "\u232D",
      Dagger: "\u2021",
      dagger: "\u2020",
      daleth: "\u2138",
      Darr: "\u21A1",
      dArr: "\u21D3",
      darr: "\u2193",
      dash: "\u2010",
      Dashv: "\u2AE4",
      dashv: "\u22A3",
      dbkarow: "\u290F",
      dblac: "\u02DD",
      Dcaron: "\u010E",
      dcaron: "\u010F",
      Dcy: "\u0414",
      dcy: "\u0434",
      DD: "\u2145",
      dd: "\u2146",
      ddagger: "\u2021",
      ddarr: "\u21CA",
      DDotrahd: "\u2911",
      ddotseq: "\u2A77",
      deg: "\xB0",
      Del: "\u2207",
      Delta: "\u0394",
      delta: "\u03B4",
      demptyv: "\u29B1",
      dfisht: "\u297F",
      Dfr: "\u{1D507}",
      dfr: "\u{1D521}",
      dHar: "\u2965",
      dharl: "\u21C3",
      dharr: "\u21C2",
      DiacriticalAcute: "\xB4",
      DiacriticalDot: "\u02D9",
      DiacriticalDoubleAcute: "\u02DD",
      DiacriticalGrave: "`",
      DiacriticalTilde: "\u02DC",
      diam: "\u22C4",
      Diamond: "\u22C4",
      diamond: "\u22C4",
      diamondsuit: "\u2666",
      diams: "\u2666",
      die: "\xA8",
      DifferentialD: "\u2146",
      digamma: "\u03DD",
      disin: "\u22F2",
      div: "\xF7",
      divide: "\xF7",
      divideontimes: "\u22C7",
      divonx: "\u22C7",
      DJcy: "\u0402",
      djcy: "\u0452",
      dlcorn: "\u231E",
      dlcrop: "\u230D",
      dollar: "$",
      Dopf: "\u{1D53B}",
      dopf: "\u{1D555}",
      Dot: "\xA8",
      dot: "\u02D9",
      DotDot: "\u20DC",
      doteq: "\u2250",
      doteqdot: "\u2251",
      DotEqual: "\u2250",
      dotminus: "\u2238",
      dotplus: "\u2214",
      dotsquare: "\u22A1",
      doublebarwedge: "\u2306",
      DoubleContourIntegral: "\u222F",
      DoubleDot: "\xA8",
      DoubleDownArrow: "\u21D3",
      DoubleLeftArrow: "\u21D0",
      DoubleLeftRightArrow: "\u21D4",
      DoubleLeftTee: "\u2AE4",
      DoubleLongLeftArrow: "\u27F8",
      DoubleLongLeftRightArrow: "\u27FA",
      DoubleLongRightArrow: "\u27F9",
      DoubleRightArrow: "\u21D2",
      DoubleRightTee: "\u22A8",
      DoubleUpArrow: "\u21D1",
      DoubleUpDownArrow: "\u21D5",
      DoubleVerticalBar: "\u2225",
      DownArrow: "\u2193",
      Downarrow: "\u21D3",
      downarrow: "\u2193",
      DownArrowBar: "\u2913",
      DownArrowUpArrow: "\u21F5",
      DownBreve: "\u0311",
      downdownarrows: "\u21CA",
      downharpoonleft: "\u21C3",
      downharpoonright: "\u21C2",
      DownLeftRightVector: "\u2950",
      DownLeftTeeVector: "\u295E",
      DownLeftVector: "\u21BD",
      DownLeftVectorBar: "\u2956",
      DownRightTeeVector: "\u295F",
      DownRightVector: "\u21C1",
      DownRightVectorBar: "\u2957",
      DownTee: "\u22A4",
      DownTeeArrow: "\u21A7",
      drbkarow: "\u2910",
      drcorn: "\u231F",
      drcrop: "\u230C",
      Dscr: "\u{1D49F}",
      dscr: "\u{1D4B9}",
      DScy: "\u0405",
      dscy: "\u0455",
      dsol: "\u29F6",
      Dstrok: "\u0110",
      dstrok: "\u0111",
      dtdot: "\u22F1",
      dtri: "\u25BF",
      dtrif: "\u25BE",
      duarr: "\u21F5",
      duhar: "\u296F",
      dwangle: "\u29A6",
      DZcy: "\u040F",
      dzcy: "\u045F",
      dzigrarr: "\u27FF",
      Eacute: "\xC9",
      eacute: "\xE9",
      easter: "\u2A6E",
      Ecaron: "\u011A",
      ecaron: "\u011B",
      ecir: "\u2256",
      Ecirc: "\xCA",
      ecirc: "\xEA",
      ecolon: "\u2255",
      Ecy: "\u042D",
      ecy: "\u044D",
      eDDot: "\u2A77",
      Edot: "\u0116",
      eDot: "\u2251",
      edot: "\u0117",
      ee: "\u2147",
      efDot: "\u2252",
      Efr: "\u{1D508}",
      efr: "\u{1D522}",
      eg: "\u2A9A",
      Egrave: "\xC8",
      egrave: "\xE8",
      egs: "\u2A96",
      egsdot: "\u2A98",
      el: "\u2A99",
      Element: "\u2208",
      elinters: "\u23E7",
      ell: "\u2113",
      els: "\u2A95",
      elsdot: "\u2A97",
      Emacr: "\u0112",
      emacr: "\u0113",
      empty: "\u2205",
      emptyset: "\u2205",
      EmptySmallSquare: "\u25FB",
      emptyv: "\u2205",
      EmptyVerySmallSquare: "\u25AB",
      emsp: "\u2003",
      emsp13: "\u2004",
      emsp14: "\u2005",
      ENG: "\u014A",
      eng: "\u014B",
      ensp: "\u2002",
      Eogon: "\u0118",
      eogon: "\u0119",
      Eopf: "\u{1D53C}",
      eopf: "\u{1D556}",
      epar: "\u22D5",
      eparsl: "\u29E3",
      eplus: "\u2A71",
      epsi: "\u03B5",
      Epsilon: "\u0395",
      epsilon: "\u03B5",
      epsiv: "\u03F5",
      eqcirc: "\u2256",
      eqcolon: "\u2255",
      eqsim: "\u2242",
      eqslantgtr: "\u2A96",
      eqslantless: "\u2A95",
      Equal: "\u2A75",
      equals: "=",
      EqualTilde: "\u2242",
      equest: "\u225F",
      Equilibrium: "\u21CC",
      equiv: "\u2261",
      equivDD: "\u2A78",
      eqvparsl: "\u29E5",
      erarr: "\u2971",
      erDot: "\u2253",
      Escr: "\u2130",
      escr: "\u212F",
      esdot: "\u2250",
      Esim: "\u2A73",
      esim: "\u2242",
      Eta: "\u0397",
      eta: "\u03B7",
      ETH: "\xD0",
      eth: "\xF0",
      Euml: "\xCB",
      euml: "\xEB",
      euro: "\u20AC",
      excl: "!",
      exist: "\u2203",
      Exists: "\u2203",
      expectation: "\u2130",
      ExponentialE: "\u2147",
      exponentiale: "\u2147",
      fallingdotseq: "\u2252",
      Fcy: "\u0424",
      fcy: "\u0444",
      female: "\u2640",
      ffilig: "\uFB03",
      fflig: "\uFB00",
      ffllig: "\uFB04",
      Ffr: "\u{1D509}",
      ffr: "\u{1D523}",
      filig: "\uFB01",
      FilledSmallSquare: "\u25FC",
      FilledVerySmallSquare: "\u25AA",
      fjlig: "fj",
      flat: "\u266D",
      fllig: "\uFB02",
      fltns: "\u25B1",
      fnof: "\u0192",
      Fopf: "\u{1D53D}",
      fopf: "\u{1D557}",
      ForAll: "\u2200",
      forall: "\u2200",
      fork: "\u22D4",
      forkv: "\u2AD9",
      Fouriertrf: "\u2131",
      fpartint: "\u2A0D",
      frac12: "\xBD",
      frac13: "\u2153",
      frac14: "\xBC",
      frac15: "\u2155",
      frac16: "\u2159",
      frac18: "\u215B",
      frac23: "\u2154",
      frac25: "\u2156",
      frac34: "\xBE",
      frac35: "\u2157",
      frac38: "\u215C",
      frac45: "\u2158",
      frac56: "\u215A",
      frac58: "\u215D",
      frac78: "\u215E",
      frasl: "\u2044",
      frown: "\u2322",
      Fscr: "\u2131",
      fscr: "\u{1D4BB}",
      gacute: "\u01F5",
      Gamma: "\u0393",
      gamma: "\u03B3",
      Gammad: "\u03DC",
      gammad: "\u03DD",
      gap: "\u2A86",
      Gbreve: "\u011E",
      gbreve: "\u011F",
      Gcedil: "\u0122",
      Gcirc: "\u011C",
      gcirc: "\u011D",
      Gcy: "\u0413",
      gcy: "\u0433",
      Gdot: "\u0120",
      gdot: "\u0121",
      gE: "\u2267",
      ge: "\u2265",
      gEl: "\u2A8C",
      gel: "\u22DB",
      geq: "\u2265",
      geqq: "\u2267",
      geqslant: "\u2A7E",
      ges: "\u2A7E",
      gescc: "\u2AA9",
      gesdot: "\u2A80",
      gesdoto: "\u2A82",
      gesdotol: "\u2A84",
      gesl: "\u22DB\uFE00",
      gesles: "\u2A94",
      Gfr: "\u{1D50A}",
      gfr: "\u{1D524}",
      Gg: "\u22D9",
      gg: "\u226B",
      ggg: "\u22D9",
      gimel: "\u2137",
      GJcy: "\u0403",
      gjcy: "\u0453",
      gl: "\u2277",
      gla: "\u2AA5",
      glE: "\u2A92",
      glj: "\u2AA4",
      gnap: "\u2A8A",
      gnapprox: "\u2A8A",
      gnE: "\u2269",
      gne: "\u2A88",
      gneq: "\u2A88",
      gneqq: "\u2269",
      gnsim: "\u22E7",
      Gopf: "\u{1D53E}",
      gopf: "\u{1D558}",
      grave: "`",
      GreaterEqual: "\u2265",
      GreaterEqualLess: "\u22DB",
      GreaterFullEqual: "\u2267",
      GreaterGreater: "\u2AA2",
      GreaterLess: "\u2277",
      GreaterSlantEqual: "\u2A7E",
      GreaterTilde: "\u2273",
      Gscr: "\u{1D4A2}",
      gscr: "\u210A",
      gsim: "\u2273",
      gsime: "\u2A8E",
      gsiml: "\u2A90",
      Gt: "\u226B",
      GT: ">",
      gt: ">",
      gtcc: "\u2AA7",
      gtcir: "\u2A7A",
      gtdot: "\u22D7",
      gtlPar: "\u2995",
      gtquest: "\u2A7C",
      gtrapprox: "\u2A86",
      gtrarr: "\u2978",
      gtrdot: "\u22D7",
      gtreqless: "\u22DB",
      gtreqqless: "\u2A8C",
      gtrless: "\u2277",
      gtrsim: "\u2273",
      gvertneqq: "\u2269\uFE00",
      gvnE: "\u2269\uFE00",
      Hacek: "\u02C7",
      hairsp: "\u200A",
      half: "\xBD",
      hamilt: "\u210B",
      HARDcy: "\u042A",
      hardcy: "\u044A",
      hArr: "\u21D4",
      harr: "\u2194",
      harrcir: "\u2948",
      harrw: "\u21AD",
      Hat: "^",
      hbar: "\u210F",
      Hcirc: "\u0124",
      hcirc: "\u0125",
      hearts: "\u2665",
      heartsuit: "\u2665",
      hellip: "\u2026",
      hercon: "\u22B9",
      Hfr: "\u210C",
      hfr: "\u{1D525}",
      HilbertSpace: "\u210B",
      hksearow: "\u2925",
      hkswarow: "\u2926",
      hoarr: "\u21FF",
      homtht: "\u223B",
      hookleftarrow: "\u21A9",
      hookrightarrow: "\u21AA",
      Hopf: "\u210D",
      hopf: "\u{1D559}",
      horbar: "\u2015",
      HorizontalLine: "\u2500",
      Hscr: "\u210B",
      hscr: "\u{1D4BD}",
      hslash: "\u210F",
      Hstrok: "\u0126",
      hstrok: "\u0127",
      HumpDownHump: "\u224E",
      HumpEqual: "\u224F",
      hybull: "\u2043",
      hyphen: "\u2010",
      Iacute: "\xCD",
      iacute: "\xED",
      ic: "\u2063",
      Icirc: "\xCE",
      icirc: "\xEE",
      Icy: "\u0418",
      icy: "\u0438",
      Idot: "\u0130",
      IEcy: "\u0415",
      iecy: "\u0435",
      iexcl: "\xA1",
      iff: "\u21D4",
      Ifr: "\u2111",
      ifr: "\u{1D526}",
      Igrave: "\xCC",
      igrave: "\xEC",
      ii: "\u2148",
      iiiint: "\u2A0C",
      iiint: "\u222D",
      iinfin: "\u29DC",
      iiota: "\u2129",
      IJlig: "\u0132",
      ijlig: "\u0133",
      Im: "\u2111",
      Imacr: "\u012A",
      imacr: "\u012B",
      image: "\u2111",
      ImaginaryI: "\u2148",
      imagline: "\u2110",
      imagpart: "\u2111",
      imath: "\u0131",
      imof: "\u22B7",
      imped: "\u01B5",
      Implies: "\u21D2",
      in: "\u2208",
      incare: "\u2105",
      infin: "\u221E",
      infintie: "\u29DD",
      inodot: "\u0131",
      Int: "\u222C",
      int: "\u222B",
      intcal: "\u22BA",
      integers: "\u2124",
      Integral: "\u222B",
      intercal: "\u22BA",
      Intersection: "\u22C2",
      intlarhk: "\u2A17",
      intprod: "\u2A3C",
      InvisibleComma: "\u2063",
      InvisibleTimes: "\u2062",
      IOcy: "\u0401",
      iocy: "\u0451",
      Iogon: "\u012E",
      iogon: "\u012F",
      Iopf: "\u{1D540}",
      iopf: "\u{1D55A}",
      Iota: "\u0399",
      iota: "\u03B9",
      iprod: "\u2A3C",
      iquest: "\xBF",
      Iscr: "\u2110",
      iscr: "\u{1D4BE}",
      isin: "\u2208",
      isindot: "\u22F5",
      isinE: "\u22F9",
      isins: "\u22F4",
      isinsv: "\u22F3",
      isinv: "\u2208",
      it: "\u2062",
      Itilde: "\u0128",
      itilde: "\u0129",
      Iukcy: "\u0406",
      iukcy: "\u0456",
      Iuml: "\xCF",
      iuml: "\xEF",
      Jcirc: "\u0134",
      jcirc: "\u0135",
      Jcy: "\u0419",
      jcy: "\u0439",
      Jfr: "\u{1D50D}",
      jfr: "\u{1D527}",
      jmath: "\u0237",
      Jopf: "\u{1D541}",
      jopf: "\u{1D55B}",
      Jscr: "\u{1D4A5}",
      jscr: "\u{1D4BF}",
      Jsercy: "\u0408",
      jsercy: "\u0458",
      Jukcy: "\u0404",
      jukcy: "\u0454",
      Kappa: "\u039A",
      kappa: "\u03BA",
      kappav: "\u03F0",
      Kcedil: "\u0136",
      kcedil: "\u0137",
      Kcy: "\u041A",
      kcy: "\u043A",
      Kfr: "\u{1D50E}",
      kfr: "\u{1D528}",
      kgreen: "\u0138",
      KHcy: "\u0425",
      khcy: "\u0445",
      KJcy: "\u040C",
      kjcy: "\u045C",
      Kopf: "\u{1D542}",
      kopf: "\u{1D55C}",
      Kscr: "\u{1D4A6}",
      kscr: "\u{1D4C0}",
      lAarr: "\u21DA",
      Lacute: "\u0139",
      lacute: "\u013A",
      laemptyv: "\u29B4",
      lagran: "\u2112",
      Lambda: "\u039B",
      lambda: "\u03BB",
      Lang: "\u27EA",
      lang: "\u27E8",
      langd: "\u2991",
      langle: "\u27E8",
      lap: "\u2A85",
      Laplacetrf: "\u2112",
      laquo: "\xAB",
      Larr: "\u219E",
      lArr: "\u21D0",
      larr: "\u2190",
      larrb: "\u21E4",
      larrbfs: "\u291F",
      larrfs: "\u291D",
      larrhk: "\u21A9",
      larrlp: "\u21AB",
      larrpl: "\u2939",
      larrsim: "\u2973",
      larrtl: "\u21A2",
      lat: "\u2AAB",
      lAtail: "\u291B",
      latail: "\u2919",
      late: "\u2AAD",
      lates: "\u2AAD\uFE00",
      lBarr: "\u290E",
      lbarr: "\u290C",
      lbbrk: "\u2772",
      lbrace: "{",
      lbrack: "[",
      lbrke: "\u298B",
      lbrksld: "\u298F",
      lbrkslu: "\u298D",
      Lcaron: "\u013D",
      lcaron: "\u013E",
      Lcedil: "\u013B",
      lcedil: "\u013C",
      lceil: "\u2308",
      lcub: "{",
      Lcy: "\u041B",
      lcy: "\u043B",
      ldca: "\u2936",
      ldquo: "\u201C",
      ldquor: "\u201E",
      ldrdhar: "\u2967",
      ldrushar: "\u294B",
      ldsh: "\u21B2",
      lE: "\u2266",
      le: "\u2264",
      LeftAngleBracket: "\u27E8",
      LeftArrow: "\u2190",
      Leftarrow: "\u21D0",
      leftarrow: "\u2190",
      LeftArrowBar: "\u21E4",
      LeftArrowRightArrow: "\u21C6",
      leftarrowtail: "\u21A2",
      LeftCeiling: "\u2308",
      LeftDoubleBracket: "\u27E6",
      LeftDownTeeVector: "\u2961",
      LeftDownVector: "\u21C3",
      LeftDownVectorBar: "\u2959",
      LeftFloor: "\u230A",
      leftharpoondown: "\u21BD",
      leftharpoonup: "\u21BC",
      leftleftarrows: "\u21C7",
      LeftRightArrow: "\u2194",
      Leftrightarrow: "\u21D4",
      leftrightarrow: "\u2194",
      leftrightarrows: "\u21C6",
      leftrightharpoons: "\u21CB",
      leftrightsquigarrow: "\u21AD",
      LeftRightVector: "\u294E",
      LeftTee: "\u22A3",
      LeftTeeArrow: "\u21A4",
      LeftTeeVector: "\u295A",
      leftthreetimes: "\u22CB",
      LeftTriangle: "\u22B2",
      LeftTriangleBar: "\u29CF",
      LeftTriangleEqual: "\u22B4",
      LeftUpDownVector: "\u2951",
      LeftUpTeeVector: "\u2960",
      LeftUpVector: "\u21BF",
      LeftUpVectorBar: "\u2958",
      LeftVector: "\u21BC",
      LeftVectorBar: "\u2952",
      lEg: "\u2A8B",
      leg: "\u22DA",
      leq: "\u2264",
      leqq: "\u2266",
      leqslant: "\u2A7D",
      les: "\u2A7D",
      lescc: "\u2AA8",
      lesdot: "\u2A7F",
      lesdoto: "\u2A81",
      lesdotor: "\u2A83",
      lesg: "\u22DA\uFE00",
      lesges: "\u2A93",
      lessapprox: "\u2A85",
      lessdot: "\u22D6",
      lesseqgtr: "\u22DA",
      lesseqqgtr: "\u2A8B",
      LessEqualGreater: "\u22DA",
      LessFullEqual: "\u2266",
      LessGreater: "\u2276",
      lessgtr: "\u2276",
      LessLess: "\u2AA1",
      lesssim: "\u2272",
      LessSlantEqual: "\u2A7D",
      LessTilde: "\u2272",
      lfisht: "\u297C",
      lfloor: "\u230A",
      Lfr: "\u{1D50F}",
      lfr: "\u{1D529}",
      lg: "\u2276",
      lgE: "\u2A91",
      lHar: "\u2962",
      lhard: "\u21BD",
      lharu: "\u21BC",
      lharul: "\u296A",
      lhblk: "\u2584",
      LJcy: "\u0409",
      ljcy: "\u0459",
      Ll: "\u22D8",
      ll: "\u226A",
      llarr: "\u21C7",
      llcorner: "\u231E",
      Lleftarrow: "\u21DA",
      llhard: "\u296B",
      lltri: "\u25FA",
      Lmidot: "\u013F",
      lmidot: "\u0140",
      lmoust: "\u23B0",
      lmoustache: "\u23B0",
      lnap: "\u2A89",
      lnapprox: "\u2A89",
      lnE: "\u2268",
      lne: "\u2A87",
      lneq: "\u2A87",
      lneqq: "\u2268",
      lnsim: "\u22E6",
      loang: "\u27EC",
      loarr: "\u21FD",
      lobrk: "\u27E6",
      LongLeftArrow: "\u27F5",
      Longleftarrow: "\u27F8",
      longleftarrow: "\u27F5",
      LongLeftRightArrow: "\u27F7",
      Longleftrightarrow: "\u27FA",
      longleftrightarrow: "\u27F7",
      longmapsto: "\u27FC",
      LongRightArrow: "\u27F6",
      Longrightarrow: "\u27F9",
      longrightarrow: "\u27F6",
      looparrowleft: "\u21AB",
      looparrowright: "\u21AC",
      lopar: "\u2985",
      Lopf: "\u{1D543}",
      lopf: "\u{1D55D}",
      loplus: "\u2A2D",
      lotimes: "\u2A34",
      lowast: "\u2217",
      lowbar: "_",
      LowerLeftArrow: "\u2199",
      LowerRightArrow: "\u2198",
      loz: "\u25CA",
      lozenge: "\u25CA",
      lozf: "\u29EB",
      lpar: "(",
      lparlt: "\u2993",
      lrarr: "\u21C6",
      lrcorner: "\u231F",
      lrhar: "\u21CB",
      lrhard: "\u296D",
      lrm: "\u200E",
      lrtri: "\u22BF",
      lsaquo: "\u2039",
      Lscr: "\u2112",
      lscr: "\u{1D4C1}",
      Lsh: "\u21B0",
      lsh: "\u21B0",
      lsim: "\u2272",
      lsime: "\u2A8D",
      lsimg: "\u2A8F",
      lsqb: "[",
      lsquo: "\u2018",
      lsquor: "\u201A",
      Lstrok: "\u0141",
      lstrok: "\u0142",
      Lt: "\u226A",
      LT: "<",
      lt: "<",
      ltcc: "\u2AA6",
      ltcir: "\u2A79",
      ltdot: "\u22D6",
      lthree: "\u22CB",
      ltimes: "\u22C9",
      ltlarr: "\u2976",
      ltquest: "\u2A7B",
      ltri: "\u25C3",
      ltrie: "\u22B4",
      ltrif: "\u25C2",
      ltrPar: "\u2996",
      lurdshar: "\u294A",
      luruhar: "\u2966",
      lvertneqq: "\u2268\uFE00",
      lvnE: "\u2268\uFE00",
      macr: "\xAF",
      male: "\u2642",
      malt: "\u2720",
      maltese: "\u2720",
      Map: "\u2905",
      map: "\u21A6",
      mapsto: "\u21A6",
      mapstodown: "\u21A7",
      mapstoleft: "\u21A4",
      mapstoup: "\u21A5",
      marker: "\u25AE",
      mcomma: "\u2A29",
      Mcy: "\u041C",
      mcy: "\u043C",
      mdash: "\u2014",
      mDDot: "\u223A",
      measuredangle: "\u2221",
      MediumSpace: "\u205F",
      Mellintrf: "\u2133",
      Mfr: "\u{1D510}",
      mfr: "\u{1D52A}",
      mho: "\u2127",
      micro: "\xB5",
      mid: "\u2223",
      midast: "*",
      midcir: "\u2AF0",
      middot: "\xB7",
      minus: "\u2212",
      minusb: "\u229F",
      minusd: "\u2238",
      minusdu: "\u2A2A",
      MinusPlus: "\u2213",
      mlcp: "\u2ADB",
      mldr: "\u2026",
      mnplus: "\u2213",
      models: "\u22A7",
      Mopf: "\u{1D544}",
      mopf: "\u{1D55E}",
      mp: "\u2213",
      Mscr: "\u2133",
      mscr: "\u{1D4C2}",
      mstpos: "\u223E",
      Mu: "\u039C",
      mu: "\u03BC",
      multimap: "\u22B8",
      mumap: "\u22B8",
      nabla: "\u2207",
      Nacute: "\u0143",
      nacute: "\u0144",
      nang: "\u2220\u20D2",
      nap: "\u2249",
      napE: "\u2A70\u0338",
      napid: "\u224B\u0338",
      napos: "\u0149",
      napprox: "\u2249",
      natur: "\u266E",
      natural: "\u266E",
      naturals: "\u2115",
      nbsp: "\xA0",
      nbump: "\u224E\u0338",
      nbumpe: "\u224F\u0338",
      ncap: "\u2A43",
      Ncaron: "\u0147",
      ncaron: "\u0148",
      Ncedil: "\u0145",
      ncedil: "\u0146",
      ncong: "\u2247",
      ncongdot: "\u2A6D\u0338",
      ncup: "\u2A42",
      Ncy: "\u041D",
      ncy: "\u043D",
      ndash: "\u2013",
      ne: "\u2260",
      nearhk: "\u2924",
      neArr: "\u21D7",
      nearr: "\u2197",
      nearrow: "\u2197",
      nedot: "\u2250\u0338",
      NegativeMediumSpace: "\u200B",
      NegativeThickSpace: "\u200B",
      NegativeThinSpace: "\u200B",
      NegativeVeryThinSpace: "\u200B",
      nequiv: "\u2262",
      nesear: "\u2928",
      nesim: "\u2242\u0338",
      NestedGreaterGreater: "\u226B",
      NestedLessLess: "\u226A",
      NewLine: "\n",
      nexist: "\u2204",
      nexists: "\u2204",
      Nfr: "\u{1D511}",
      nfr: "\u{1D52B}",
      ngE: "\u2267\u0338",
      nge: "\u2271",
      ngeq: "\u2271",
      ngeqq: "\u2267\u0338",
      ngeqslant: "\u2A7E\u0338",
      nges: "\u2A7E\u0338",
      nGg: "\u22D9\u0338",
      ngsim: "\u2275",
      nGt: "\u226B\u20D2",
      ngt: "\u226F",
      ngtr: "\u226F",
      nGtv: "\u226B\u0338",
      nhArr: "\u21CE",
      nharr: "\u21AE",
      nhpar: "\u2AF2",
      ni: "\u220B",
      nis: "\u22FC",
      nisd: "\u22FA",
      niv: "\u220B",
      NJcy: "\u040A",
      njcy: "\u045A",
      nlArr: "\u21CD",
      nlarr: "\u219A",
      nldr: "\u2025",
      nlE: "\u2266\u0338",
      nle: "\u2270",
      nLeftarrow: "\u21CD",
      nleftarrow: "\u219A",
      nLeftrightarrow: "\u21CE",
      nleftrightarrow: "\u21AE",
      nleq: "\u2270",
      nleqq: "\u2266\u0338",
      nleqslant: "\u2A7D\u0338",
      nles: "\u2A7D\u0338",
      nless: "\u226E",
      nLl: "\u22D8\u0338",
      nlsim: "\u2274",
      nLt: "\u226A\u20D2",
      nlt: "\u226E",
      nltri: "\u22EA",
      nltrie: "\u22EC",
      nLtv: "\u226A\u0338",
      nmid: "\u2224",
      NoBreak: "\u2060",
      NonBreakingSpace: "\xA0",
      Nopf: "\u2115",
      nopf: "\u{1D55F}",
      Not: "\u2AEC",
      not: "\xAC",
      NotCongruent: "\u2262",
      NotCupCap: "\u226D",
      NotDoubleVerticalBar: "\u2226",
      NotElement: "\u2209",
      NotEqual: "\u2260",
      NotEqualTilde: "\u2242\u0338",
      NotExists: "\u2204",
      NotGreater: "\u226F",
      NotGreaterEqual: "\u2271",
      NotGreaterFullEqual: "\u2267\u0338",
      NotGreaterGreater: "\u226B\u0338",
      NotGreaterLess: "\u2279",
      NotGreaterSlantEqual: "\u2A7E\u0338",
      NotGreaterTilde: "\u2275",
      NotHumpDownHump: "\u224E\u0338",
      NotHumpEqual: "\u224F\u0338",
      notin: "\u2209",
      notindot: "\u22F5\u0338",
      notinE: "\u22F9\u0338",
      notinva: "\u2209",
      notinvb: "\u22F7",
      notinvc: "\u22F6",
      NotLeftTriangle: "\u22EA",
      NotLeftTriangleBar: "\u29CF\u0338",
      NotLeftTriangleEqual: "\u22EC",
      NotLess: "\u226E",
      NotLessEqual: "\u2270",
      NotLessGreater: "\u2278",
      NotLessLess: "\u226A\u0338",
      NotLessSlantEqual: "\u2A7D\u0338",
      NotLessTilde: "\u2274",
      NotNestedGreaterGreater: "\u2AA2\u0338",
      NotNestedLessLess: "\u2AA1\u0338",
      notni: "\u220C",
      notniva: "\u220C",
      notnivb: "\u22FE",
      notnivc: "\u22FD",
      NotPrecedes: "\u2280",
      NotPrecedesEqual: "\u2AAF\u0338",
      NotPrecedesSlantEqual: "\u22E0",
      NotReverseElement: "\u220C",
      NotRightTriangle: "\u22EB",
      NotRightTriangleBar: "\u29D0\u0338",
      NotRightTriangleEqual: "\u22ED",
      NotSquareSubset: "\u228F\u0338",
      NotSquareSubsetEqual: "\u22E2",
      NotSquareSuperset: "\u2290\u0338",
      NotSquareSupersetEqual: "\u22E3",
      NotSubset: "\u2282\u20D2",
      NotSubsetEqual: "\u2288",
      NotSucceeds: "\u2281",
      NotSucceedsEqual: "\u2AB0\u0338",
      NotSucceedsSlantEqual: "\u22E1",
      NotSucceedsTilde: "\u227F\u0338",
      NotSuperset: "\u2283\u20D2",
      NotSupersetEqual: "\u2289",
      NotTilde: "\u2241",
      NotTildeEqual: "\u2244",
      NotTildeFullEqual: "\u2247",
      NotTildeTilde: "\u2249",
      NotVerticalBar: "\u2224",
      npar: "\u2226",
      nparallel: "\u2226",
      nparsl: "\u2AFD\u20E5",
      npart: "\u2202\u0338",
      npolint: "\u2A14",
      npr: "\u2280",
      nprcue: "\u22E0",
      npre: "\u2AAF\u0338",
      nprec: "\u2280",
      npreceq: "\u2AAF\u0338",
      nrArr: "\u21CF",
      nrarr: "\u219B",
      nrarrc: "\u2933\u0338",
      nrarrw: "\u219D\u0338",
      nRightarrow: "\u21CF",
      nrightarrow: "\u219B",
      nrtri: "\u22EB",
      nrtrie: "\u22ED",
      nsc: "\u2281",
      nsccue: "\u22E1",
      nsce: "\u2AB0\u0338",
      Nscr: "\u{1D4A9}",
      nscr: "\u{1D4C3}",
      nshortmid: "\u2224",
      nshortparallel: "\u2226",
      nsim: "\u2241",
      nsime: "\u2244",
      nsimeq: "\u2244",
      nsmid: "\u2224",
      nspar: "\u2226",
      nsqsube: "\u22E2",
      nsqsupe: "\u22E3",
      nsub: "\u2284",
      nsubE: "\u2AC5\u0338",
      nsube: "\u2288",
      nsubset: "\u2282\u20D2",
      nsubseteq: "\u2288",
      nsubseteqq: "\u2AC5\u0338",
      nsucc: "\u2281",
      nsucceq: "\u2AB0\u0338",
      nsup: "\u2285",
      nsupE: "\u2AC6\u0338",
      nsupe: "\u2289",
      nsupset: "\u2283\u20D2",
      nsupseteq: "\u2289",
      nsupseteqq: "\u2AC6\u0338",
      ntgl: "\u2279",
      Ntilde: "\xD1",
      ntilde: "\xF1",
      ntlg: "\u2278",
      ntriangleleft: "\u22EA",
      ntrianglelefteq: "\u22EC",
      ntriangleright: "\u22EB",
      ntrianglerighteq: "\u22ED",
      Nu: "\u039D",
      nu: "\u03BD",
      num: "#",
      numero: "\u2116",
      numsp: "\u2007",
      nvap: "\u224D\u20D2",
      nVDash: "\u22AF",
      nVdash: "\u22AE",
      nvDash: "\u22AD",
      nvdash: "\u22AC",
      nvge: "\u2265\u20D2",
      nvgt: ">\u20D2",
      nvHarr: "\u2904",
      nvinfin: "\u29DE",
      nvlArr: "\u2902",
      nvle: "\u2264\u20D2",
      nvlt: "<\u20D2",
      nvltrie: "\u22B4\u20D2",
      nvrArr: "\u2903",
      nvrtrie: "\u22B5\u20D2",
      nvsim: "\u223C\u20D2",
      nwarhk: "\u2923",
      nwArr: "\u21D6",
      nwarr: "\u2196",
      nwarrow: "\u2196",
      nwnear: "\u2927",
      Oacute: "\xD3",
      oacute: "\xF3",
      oast: "\u229B",
      ocir: "\u229A",
      Ocirc: "\xD4",
      ocirc: "\xF4",
      Ocy: "\u041E",
      ocy: "\u043E",
      odash: "\u229D",
      Odblac: "\u0150",
      odblac: "\u0151",
      odiv: "\u2A38",
      odot: "\u2299",
      odsold: "\u29BC",
      OElig: "\u0152",
      oelig: "\u0153",
      ofcir: "\u29BF",
      Ofr: "\u{1D512}",
      ofr: "\u{1D52C}",
      ogon: "\u02DB",
      Ograve: "\xD2",
      ograve: "\xF2",
      ogt: "\u29C1",
      ohbar: "\u29B5",
      ohm: "\u03A9",
      oint: "\u222E",
      olarr: "\u21BA",
      olcir: "\u29BE",
      olcross: "\u29BB",
      oline: "\u203E",
      olt: "\u29C0",
      Omacr: "\u014C",
      omacr: "\u014D",
      Omega: "\u03A9",
      omega: "\u03C9",
      Omicron: "\u039F",
      omicron: "\u03BF",
      omid: "\u29B6",
      ominus: "\u2296",
      Oopf: "\u{1D546}",
      oopf: "\u{1D560}",
      opar: "\u29B7",
      OpenCurlyDoubleQuote: "\u201C",
      OpenCurlyQuote: "\u2018",
      operp: "\u29B9",
      oplus: "\u2295",
      Or: "\u2A54",
      or: "\u2228",
      orarr: "\u21BB",
      ord: "\u2A5D",
      order: "\u2134",
      orderof: "\u2134",
      ordf: "\xAA",
      ordm: "\xBA",
      origof: "\u22B6",
      oror: "\u2A56",
      orslope: "\u2A57",
      orv: "\u2A5B",
      oS: "\u24C8",
      Oscr: "\u{1D4AA}",
      oscr: "\u2134",
      Oslash: "\xD8",
      oslash: "\xF8",
      osol: "\u2298",
      Otilde: "\xD5",
      otilde: "\xF5",
      Otimes: "\u2A37",
      otimes: "\u2297",
      otimesas: "\u2A36",
      Ouml: "\xD6",
      ouml: "\xF6",
      ovbar: "\u233D",
      OverBar: "\u203E",
      OverBrace: "\u23DE",
      OverBracket: "\u23B4",
      OverParenthesis: "\u23DC",
      par: "\u2225",
      para: "\xB6",
      parallel: "\u2225",
      parsim: "\u2AF3",
      parsl: "\u2AFD",
      part: "\u2202",
      PartialD: "\u2202",
      Pcy: "\u041F",
      pcy: "\u043F",
      percnt: "%",
      period: ".",
      permil: "\u2030",
      perp: "\u22A5",
      pertenk: "\u2031",
      Pfr: "\u{1D513}",
      pfr: "\u{1D52D}",
      Phi: "\u03A6",
      phi: "\u03C6",
      phiv: "\u03D5",
      phmmat: "\u2133",
      phone: "\u260E",
      Pi: "\u03A0",
      pi: "\u03C0",
      pitchfork: "\u22D4",
      piv: "\u03D6",
      planck: "\u210F",
      planckh: "\u210E",
      plankv: "\u210F",
      plus: "+",
      plusacir: "\u2A23",
      plusb: "\u229E",
      pluscir: "\u2A22",
      plusdo: "\u2214",
      plusdu: "\u2A25",
      pluse: "\u2A72",
      PlusMinus: "\xB1",
      plusmn: "\xB1",
      plussim: "\u2A26",
      plustwo: "\u2A27",
      pm: "\xB1",
      Poincareplane: "\u210C",
      pointint: "\u2A15",
      Popf: "\u2119",
      popf: "\u{1D561}",
      pound: "\xA3",
      Pr: "\u2ABB",
      pr: "\u227A",
      prap: "\u2AB7",
      prcue: "\u227C",
      prE: "\u2AB3",
      pre: "\u2AAF",
      prec: "\u227A",
      precapprox: "\u2AB7",
      preccurlyeq: "\u227C",
      Precedes: "\u227A",
      PrecedesEqual: "\u2AAF",
      PrecedesSlantEqual: "\u227C",
      PrecedesTilde: "\u227E",
      preceq: "\u2AAF",
      precnapprox: "\u2AB9",
      precneqq: "\u2AB5",
      precnsim: "\u22E8",
      precsim: "\u227E",
      Prime: "\u2033",
      prime: "\u2032",
      primes: "\u2119",
      prnap: "\u2AB9",
      prnE: "\u2AB5",
      prnsim: "\u22E8",
      prod: "\u220F",
      Product: "\u220F",
      profalar: "\u232E",
      profline: "\u2312",
      profsurf: "\u2313",
      prop: "\u221D",
      Proportion: "\u2237",
      Proportional: "\u221D",
      propto: "\u221D",
      prsim: "\u227E",
      prurel: "\u22B0",
      Pscr: "\u{1D4AB}",
      pscr: "\u{1D4C5}",
      Psi: "\u03A8",
      psi: "\u03C8",
      puncsp: "\u2008",
      Qfr: "\u{1D514}",
      qfr: "\u{1D52E}",
      qint: "\u2A0C",
      Qopf: "\u211A",
      qopf: "\u{1D562}",
      qprime: "\u2057",
      Qscr: "\u{1D4AC}",
      qscr: "\u{1D4C6}",
      quaternions: "\u210D",
      quatint: "\u2A16",
      quest: "?",
      questeq: "\u225F",
      QUOT: '"',
      quot: '"',
      rAarr: "\u21DB",
      race: "\u223D\u0331",
      Racute: "\u0154",
      racute: "\u0155",
      radic: "\u221A",
      raemptyv: "\u29B3",
      Rang: "\u27EB",
      rang: "\u27E9",
      rangd: "\u2992",
      range: "\u29A5",
      rangle: "\u27E9",
      raquo: "\xBB",
      Rarr: "\u21A0",
      rArr: "\u21D2",
      rarr: "\u2192",
      rarrap: "\u2975",
      rarrb: "\u21E5",
      rarrbfs: "\u2920",
      rarrc: "\u2933",
      rarrfs: "\u291E",
      rarrhk: "\u21AA",
      rarrlp: "\u21AC",
      rarrpl: "\u2945",
      rarrsim: "\u2974",
      Rarrtl: "\u2916",
      rarrtl: "\u21A3",
      rarrw: "\u219D",
      rAtail: "\u291C",
      ratail: "\u291A",
      ratio: "\u2236",
      rationals: "\u211A",
      RBarr: "\u2910",
      rBarr: "\u290F",
      rbarr: "\u290D",
      rbbrk: "\u2773",
      rbrace: "}",
      rbrack: "]",
      rbrke: "\u298C",
      rbrksld: "\u298E",
      rbrkslu: "\u2990",
      Rcaron: "\u0158",
      rcaron: "\u0159",
      Rcedil: "\u0156",
      rcedil: "\u0157",
      rceil: "\u2309",
      rcub: "}",
      Rcy: "\u0420",
      rcy: "\u0440",
      rdca: "\u2937",
      rdldhar: "\u2969",
      rdquo: "\u201D",
      rdquor: "\u201D",
      rdsh: "\u21B3",
      Re: "\u211C",
      real: "\u211C",
      realine: "\u211B",
      realpart: "\u211C",
      reals: "\u211D",
      rect: "\u25AD",
      REG: "\xAE",
      reg: "\xAE",
      ReverseElement: "\u220B",
      ReverseEquilibrium: "\u21CB",
      ReverseUpEquilibrium: "\u296F",
      rfisht: "\u297D",
      rfloor: "\u230B",
      Rfr: "\u211C",
      rfr: "\u{1D52F}",
      rHar: "\u2964",
      rhard: "\u21C1",
      rharu: "\u21C0",
      rharul: "\u296C",
      Rho: "\u03A1",
      rho: "\u03C1",
      rhov: "\u03F1",
      RightAngleBracket: "\u27E9",
      RightArrow: "\u2192",
      Rightarrow: "\u21D2",
      rightarrow: "\u2192",
      RightArrowBar: "\u21E5",
      RightArrowLeftArrow: "\u21C4",
      rightarrowtail: "\u21A3",
      RightCeiling: "\u2309",
      RightDoubleBracket: "\u27E7",
      RightDownTeeVector: "\u295D",
      RightDownVector: "\u21C2",
      RightDownVectorBar: "\u2955",
      RightFloor: "\u230B",
      rightharpoondown: "\u21C1",
      rightharpoonup: "\u21C0",
      rightleftarrows: "\u21C4",
      rightleftharpoons: "\u21CC",
      rightrightarrows: "\u21C9",
      rightsquigarrow: "\u219D",
      RightTee: "\u22A2",
      RightTeeArrow: "\u21A6",
      RightTeeVector: "\u295B",
      rightthreetimes: "\u22CC",
      RightTriangle: "\u22B3",
      RightTriangleBar: "\u29D0",
      RightTriangleEqual: "\u22B5",
      RightUpDownVector: "\u294F",
      RightUpTeeVector: "\u295C",
      RightUpVector: "\u21BE",
      RightUpVectorBar: "\u2954",
      RightVector: "\u21C0",
      RightVectorBar: "\u2953",
      ring: "\u02DA",
      risingdotseq: "\u2253",
      rlarr: "\u21C4",
      rlhar: "\u21CC",
      rlm: "\u200F",
      rmoust: "\u23B1",
      rmoustache: "\u23B1",
      rnmid: "\u2AEE",
      roang: "\u27ED",
      roarr: "\u21FE",
      robrk: "\u27E7",
      ropar: "\u2986",
      Ropf: "\u211D",
      ropf: "\u{1D563}",
      roplus: "\u2A2E",
      rotimes: "\u2A35",
      RoundImplies: "\u2970",
      rpar: ")",
      rpargt: "\u2994",
      rppolint: "\u2A12",
      rrarr: "\u21C9",
      Rrightarrow: "\u21DB",
      rsaquo: "\u203A",
      Rscr: "\u211B",
      rscr: "\u{1D4C7}",
      Rsh: "\u21B1",
      rsh: "\u21B1",
      rsqb: "]",
      rsquo: "\u2019",
      rsquor: "\u2019",
      rthree: "\u22CC",
      rtimes: "\u22CA",
      rtri: "\u25B9",
      rtrie: "\u22B5",
      rtrif: "\u25B8",
      rtriltri: "\u29CE",
      RuleDelayed: "\u29F4",
      ruluhar: "\u2968",
      rx: "\u211E",
      Sacute: "\u015A",
      sacute: "\u015B",
      sbquo: "\u201A",
      Sc: "\u2ABC",
      sc: "\u227B",
      scap: "\u2AB8",
      Scaron: "\u0160",
      scaron: "\u0161",
      sccue: "\u227D",
      scE: "\u2AB4",
      sce: "\u2AB0",
      Scedil: "\u015E",
      scedil: "\u015F",
      Scirc: "\u015C",
      scirc: "\u015D",
      scnap: "\u2ABA",
      scnE: "\u2AB6",
      scnsim: "\u22E9",
      scpolint: "\u2A13",
      scsim: "\u227F",
      Scy: "\u0421",
      scy: "\u0441",
      sdot: "\u22C5",
      sdotb: "\u22A1",
      sdote: "\u2A66",
      searhk: "\u2925",
      seArr: "\u21D8",
      searr: "\u2198",
      searrow: "\u2198",
      sect: "\xA7",
      semi: ";",
      seswar: "\u2929",
      setminus: "\u2216",
      setmn: "\u2216",
      sext: "\u2736",
      Sfr: "\u{1D516}",
      sfr: "\u{1D530}",
      sfrown: "\u2322",
      sharp: "\u266F",
      SHCHcy: "\u0429",
      shchcy: "\u0449",
      SHcy: "\u0428",
      shcy: "\u0448",
      ShortDownArrow: "\u2193",
      ShortLeftArrow: "\u2190",
      shortmid: "\u2223",
      shortparallel: "\u2225",
      ShortRightArrow: "\u2192",
      ShortUpArrow: "\u2191",
      shy: "\xAD",
      Sigma: "\u03A3",
      sigma: "\u03C3",
      sigmaf: "\u03C2",
      sigmav: "\u03C2",
      sim: "\u223C",
      simdot: "\u2A6A",
      sime: "\u2243",
      simeq: "\u2243",
      simg: "\u2A9E",
      simgE: "\u2AA0",
      siml: "\u2A9D",
      simlE: "\u2A9F",
      simne: "\u2246",
      simplus: "\u2A24",
      simrarr: "\u2972",
      slarr: "\u2190",
      SmallCircle: "\u2218",
      smallsetminus: "\u2216",
      smashp: "\u2A33",
      smeparsl: "\u29E4",
      smid: "\u2223",
      smile: "\u2323",
      smt: "\u2AAA",
      smte: "\u2AAC",
      smtes: "\u2AAC\uFE00",
      SOFTcy: "\u042C",
      softcy: "\u044C",
      sol: "/",
      solb: "\u29C4",
      solbar: "\u233F",
      Sopf: "\u{1D54A}",
      sopf: "\u{1D564}",
      spades: "\u2660",
      spadesuit: "\u2660",
      spar: "\u2225",
      sqcap: "\u2293",
      sqcaps: "\u2293\uFE00",
      sqcup: "\u2294",
      sqcups: "\u2294\uFE00",
      Sqrt: "\u221A",
      sqsub: "\u228F",
      sqsube: "\u2291",
      sqsubset: "\u228F",
      sqsubseteq: "\u2291",
      sqsup: "\u2290",
      sqsupe: "\u2292",
      sqsupset: "\u2290",
      sqsupseteq: "\u2292",
      squ: "\u25A1",
      Square: "\u25A1",
      square: "\u25A1",
      SquareIntersection: "\u2293",
      SquareSubset: "\u228F",
      SquareSubsetEqual: "\u2291",
      SquareSuperset: "\u2290",
      SquareSupersetEqual: "\u2292",
      SquareUnion: "\u2294",
      squarf: "\u25AA",
      squf: "\u25AA",
      srarr: "\u2192",
      Sscr: "\u{1D4AE}",
      sscr: "\u{1D4C8}",
      ssetmn: "\u2216",
      ssmile: "\u2323",
      sstarf: "\u22C6",
      Star: "\u22C6",
      star: "\u2606",
      starf: "\u2605",
      straightepsilon: "\u03F5",
      straightphi: "\u03D5",
      strns: "\xAF",
      Sub: "\u22D0",
      sub: "\u2282",
      subdot: "\u2ABD",
      subE: "\u2AC5",
      sube: "\u2286",
      subedot: "\u2AC3",
      submult: "\u2AC1",
      subnE: "\u2ACB",
      subne: "\u228A",
      subplus: "\u2ABF",
      subrarr: "\u2979",
      Subset: "\u22D0",
      subset: "\u2282",
      subseteq: "\u2286",
      subseteqq: "\u2AC5",
      SubsetEqual: "\u2286",
      subsetneq: "\u228A",
      subsetneqq: "\u2ACB",
      subsim: "\u2AC7",
      subsub: "\u2AD5",
      subsup: "\u2AD3",
      succ: "\u227B",
      succapprox: "\u2AB8",
      succcurlyeq: "\u227D",
      Succeeds: "\u227B",
      SucceedsEqual: "\u2AB0",
      SucceedsSlantEqual: "\u227D",
      SucceedsTilde: "\u227F",
      succeq: "\u2AB0",
      succnapprox: "\u2ABA",
      succneqq: "\u2AB6",
      succnsim: "\u22E9",
      succsim: "\u227F",
      SuchThat: "\u220B",
      Sum: "\u2211",
      sum: "\u2211",
      sung: "\u266A",
      Sup: "\u22D1",
      sup: "\u2283",
      sup1: "\xB9",
      sup2: "\xB2",
      sup3: "\xB3",
      supdot: "\u2ABE",
      supdsub: "\u2AD8",
      supE: "\u2AC6",
      supe: "\u2287",
      supedot: "\u2AC4",
      Superset: "\u2283",
      SupersetEqual: "\u2287",
      suphsol: "\u27C9",
      suphsub: "\u2AD7",
      suplarr: "\u297B",
      supmult: "\u2AC2",
      supnE: "\u2ACC",
      supne: "\u228B",
      supplus: "\u2AC0",
      Supset: "\u22D1",
      supset: "\u2283",
      supseteq: "\u2287",
      supseteqq: "\u2AC6",
      supsetneq: "\u228B",
      supsetneqq: "\u2ACC",
      supsim: "\u2AC8",
      supsub: "\u2AD4",
      supsup: "\u2AD6",
      swarhk: "\u2926",
      swArr: "\u21D9",
      swarr: "\u2199",
      swarrow: "\u2199",
      swnwar: "\u292A",
      szlig: "\xDF",
      Tab: "	",
      target: "\u2316",
      Tau: "\u03A4",
      tau: "\u03C4",
      tbrk: "\u23B4",
      Tcaron: "\u0164",
      tcaron: "\u0165",
      Tcedil: "\u0162",
      tcedil: "\u0163",
      Tcy: "\u0422",
      tcy: "\u0442",
      tdot: "\u20DB",
      telrec: "\u2315",
      Tfr: "\u{1D517}",
      tfr: "\u{1D531}",
      there4: "\u2234",
      Therefore: "\u2234",
      therefore: "\u2234",
      Theta: "\u0398",
      theta: "\u03B8",
      thetasym: "\u03D1",
      thetav: "\u03D1",
      thickapprox: "\u2248",
      thicksim: "\u223C",
      ThickSpace: "\u205F\u200A",
      thinsp: "\u2009",
      ThinSpace: "\u2009",
      thkap: "\u2248",
      thksim: "\u223C",
      THORN: "\xDE",
      thorn: "\xFE",
      Tilde: "\u223C",
      tilde: "\u02DC",
      TildeEqual: "\u2243",
      TildeFullEqual: "\u2245",
      TildeTilde: "\u2248",
      times: "\xD7",
      timesb: "\u22A0",
      timesbar: "\u2A31",
      timesd: "\u2A30",
      tint: "\u222D",
      toea: "\u2928",
      top: "\u22A4",
      topbot: "\u2336",
      topcir: "\u2AF1",
      Topf: "\u{1D54B}",
      topf: "\u{1D565}",
      topfork: "\u2ADA",
      tosa: "\u2929",
      tprime: "\u2034",
      TRADE: "\u2122",
      trade: "\u2122",
      triangle: "\u25B5",
      triangledown: "\u25BF",
      triangleleft: "\u25C3",
      trianglelefteq: "\u22B4",
      triangleq: "\u225C",
      triangleright: "\u25B9",
      trianglerighteq: "\u22B5",
      tridot: "\u25EC",
      trie: "\u225C",
      triminus: "\u2A3A",
      TripleDot: "\u20DB",
      triplus: "\u2A39",
      trisb: "\u29CD",
      tritime: "\u2A3B",
      trpezium: "\u23E2",
      Tscr: "\u{1D4AF}",
      tscr: "\u{1D4C9}",
      TScy: "\u0426",
      tscy: "\u0446",
      TSHcy: "\u040B",
      tshcy: "\u045B",
      Tstrok: "\u0166",
      tstrok: "\u0167",
      twixt: "\u226C",
      twoheadleftarrow: "\u219E",
      twoheadrightarrow: "\u21A0",
      Uacute: "\xDA",
      uacute: "\xFA",
      Uarr: "\u219F",
      uArr: "\u21D1",
      uarr: "\u2191",
      Uarrocir: "\u2949",
      Ubrcy: "\u040E",
      ubrcy: "\u045E",
      Ubreve: "\u016C",
      ubreve: "\u016D",
      Ucirc: "\xDB",
      ucirc: "\xFB",
      Ucy: "\u0423",
      ucy: "\u0443",
      udarr: "\u21C5",
      Udblac: "\u0170",
      udblac: "\u0171",
      udhar: "\u296E",
      ufisht: "\u297E",
      Ufr: "\u{1D518}",
      ufr: "\u{1D532}",
      Ugrave: "\xD9",
      ugrave: "\xF9",
      uHar: "\u2963",
      uharl: "\u21BF",
      uharr: "\u21BE",
      uhblk: "\u2580",
      ulcorn: "\u231C",
      ulcorner: "\u231C",
      ulcrop: "\u230F",
      ultri: "\u25F8",
      Umacr: "\u016A",
      umacr: "\u016B",
      uml: "\xA8",
      UnderBar: "_",
      UnderBrace: "\u23DF",
      UnderBracket: "\u23B5",
      UnderParenthesis: "\u23DD",
      Union: "\u22C3",
      UnionPlus: "\u228E",
      Uogon: "\u0172",
      uogon: "\u0173",
      Uopf: "\u{1D54C}",
      uopf: "\u{1D566}",
      UpArrow: "\u2191",
      Uparrow: "\u21D1",
      uparrow: "\u2191",
      UpArrowBar: "\u2912",
      UpArrowDownArrow: "\u21C5",
      UpDownArrow: "\u2195",
      Updownarrow: "\u21D5",
      updownarrow: "\u2195",
      UpEquilibrium: "\u296E",
      upharpoonleft: "\u21BF",
      upharpoonright: "\u21BE",
      uplus: "\u228E",
      UpperLeftArrow: "\u2196",
      UpperRightArrow: "\u2197",
      Upsi: "\u03D2",
      upsi: "\u03C5",
      upsih: "\u03D2",
      Upsilon: "\u03A5",
      upsilon: "\u03C5",
      UpTee: "\u22A5",
      UpTeeArrow: "\u21A5",
      upuparrows: "\u21C8",
      urcorn: "\u231D",
      urcorner: "\u231D",
      urcrop: "\u230E",
      Uring: "\u016E",
      uring: "\u016F",
      urtri: "\u25F9",
      Uscr: "\u{1D4B0}",
      uscr: "\u{1D4CA}",
      utdot: "\u22F0",
      Utilde: "\u0168",
      utilde: "\u0169",
      utri: "\u25B5",
      utrif: "\u25B4",
      uuarr: "\u21C8",
      Uuml: "\xDC",
      uuml: "\xFC",
      uwangle: "\u29A7",
      vangrt: "\u299C",
      varepsilon: "\u03F5",
      varkappa: "\u03F0",
      varnothing: "\u2205",
      varphi: "\u03D5",
      varpi: "\u03D6",
      varpropto: "\u221D",
      vArr: "\u21D5",
      varr: "\u2195",
      varrho: "\u03F1",
      varsigma: "\u03C2",
      varsubsetneq: "\u228A\uFE00",
      varsubsetneqq: "\u2ACB\uFE00",
      varsupsetneq: "\u228B\uFE00",
      varsupsetneqq: "\u2ACC\uFE00",
      vartheta: "\u03D1",
      vartriangleleft: "\u22B2",
      vartriangleright: "\u22B3",
      Vbar: "\u2AEB",
      vBar: "\u2AE8",
      vBarv: "\u2AE9",
      Vcy: "\u0412",
      vcy: "\u0432",
      VDash: "\u22AB",
      Vdash: "\u22A9",
      vDash: "\u22A8",
      vdash: "\u22A2",
      Vdashl: "\u2AE6",
      Vee: "\u22C1",
      vee: "\u2228",
      veebar: "\u22BB",
      veeeq: "\u225A",
      vellip: "\u22EE",
      Verbar: "\u2016",
      verbar: "|",
      Vert: "\u2016",
      vert: "|",
      VerticalBar: "\u2223",
      VerticalLine: "|",
      VerticalSeparator: "\u2758",
      VerticalTilde: "\u2240",
      VeryThinSpace: "\u200A",
      Vfr: "\u{1D519}",
      vfr: "\u{1D533}",
      vltri: "\u22B2",
      vnsub: "\u2282\u20D2",
      vnsup: "\u2283\u20D2",
      Vopf: "\u{1D54D}",
      vopf: "\u{1D567}",
      vprop: "\u221D",
      vrtri: "\u22B3",
      Vscr: "\u{1D4B1}",
      vscr: "\u{1D4CB}",
      vsubnE: "\u2ACB\uFE00",
      vsubne: "\u228A\uFE00",
      vsupnE: "\u2ACC\uFE00",
      vsupne: "\u228B\uFE00",
      Vvdash: "\u22AA",
      vzigzag: "\u299A",
      Wcirc: "\u0174",
      wcirc: "\u0175",
      wedbar: "\u2A5F",
      Wedge: "\u22C0",
      wedge: "\u2227",
      wedgeq: "\u2259",
      weierp: "\u2118",
      Wfr: "\u{1D51A}",
      wfr: "\u{1D534}",
      Wopf: "\u{1D54E}",
      wopf: "\u{1D568}",
      wp: "\u2118",
      wr: "\u2240",
      wreath: "\u2240",
      Wscr: "\u{1D4B2}",
      wscr: "\u{1D4CC}",
      xcap: "\u22C2",
      xcirc: "\u25EF",
      xcup: "\u22C3",
      xdtri: "\u25BD",
      Xfr: "\u{1D51B}",
      xfr: "\u{1D535}",
      xhArr: "\u27FA",
      xharr: "\u27F7",
      Xi: "\u039E",
      xi: "\u03BE",
      xlArr: "\u27F8",
      xlarr: "\u27F5",
      xmap: "\u27FC",
      xnis: "\u22FB",
      xodot: "\u2A00",
      Xopf: "\u{1D54F}",
      xopf: "\u{1D569}",
      xoplus: "\u2A01",
      xotime: "\u2A02",
      xrArr: "\u27F9",
      xrarr: "\u27F6",
      Xscr: "\u{1D4B3}",
      xscr: "\u{1D4CD}",
      xsqcup: "\u2A06",
      xuplus: "\u2A04",
      xutri: "\u25B3",
      xvee: "\u22C1",
      xwedge: "\u22C0",
      Yacute: "\xDD",
      yacute: "\xFD",
      YAcy: "\u042F",
      yacy: "\u044F",
      Ycirc: "\u0176",
      ycirc: "\u0177",
      Ycy: "\u042B",
      ycy: "\u044B",
      yen: "\xA5",
      Yfr: "\u{1D51C}",
      yfr: "\u{1D536}",
      YIcy: "\u0407",
      yicy: "\u0457",
      Yopf: "\u{1D550}",
      yopf: "\u{1D56A}",
      Yscr: "\u{1D4B4}",
      yscr: "\u{1D4CE}",
      YUcy: "\u042E",
      yucy: "\u044E",
      Yuml: "\u0178",
      yuml: "\xFF",
      Zacute: "\u0179",
      zacute: "\u017A",
      Zcaron: "\u017D",
      zcaron: "\u017E",
      Zcy: "\u0417",
      zcy: "\u0437",
      Zdot: "\u017B",
      zdot: "\u017C",
      zeetrf: "\u2128",
      ZeroWidthSpace: "\u200B",
      Zeta: "\u0396",
      zeta: "\u03B6",
      Zfr: "\u2128",
      zfr: "\u{1D537}",
      ZHcy: "\u0416",
      zhcy: "\u0436",
      zigrarr: "\u21DD",
      Zopf: "\u2124",
      zopf: "\u{1D56B}",
      Zscr: "\u{1D4B5}",
      zscr: "\u{1D4CF}",
      zwj: "\u200D",
      zwnj: "\u200C"
    });
    exports2.entityMap = exports2.HTML_ENTITIES;
  }
});

// node_modules/@xmldom/xmldom/lib/sax.js
var require_sax = __commonJS({
  "node_modules/@xmldom/xmldom/lib/sax.js"(exports2) {
    "use strict";
    var conventions = require_conventions();
    var g = require_grammar();
    var errors = require_errors();
    var isHTMLEscapableRawTextElement = conventions.isHTMLEscapableRawTextElement;
    var isHTMLMimeType = conventions.isHTMLMimeType;
    var isHTMLRawTextElement = conventions.isHTMLRawTextElement;
    var hasOwn = conventions.hasOwn;
    var NAMESPACE = conventions.NAMESPACE;
    var ParseError = errors.ParseError;
    var DOMException = errors.DOMException;
    var S_TAG = 0;
    var S_ATTR = 1;
    var S_ATTR_SPACE = 2;
    var S_EQ = 3;
    var S_ATTR_NOQUOT_VALUE = 4;
    var S_ATTR_END = 5;
    var S_TAG_SPACE = 6;
    var S_TAG_CLOSE = 7;
    function XMLReader() {
    }
    XMLReader.prototype = {
      parse: function(source, defaultNSMap, entityMap) {
        var domBuilder = this.domBuilder;
        domBuilder.startDocument();
        _copy(defaultNSMap, defaultNSMap = /* @__PURE__ */ Object.create(null));
        parse(source, defaultNSMap, entityMap, domBuilder, this.errorHandler);
        domBuilder.endDocument();
      }
    };
    var ENTITY_REG = /&#?\w+;?/g;
    function parse(source, defaultNSMapCopy, entityMap, domBuilder, errorHandler) {
      var isHTML = isHTMLMimeType(domBuilder.mimeType);
      if (source.indexOf(g.UNICODE_REPLACEMENT_CHARACTER) >= 0) {
        errorHandler.warning("Unicode replacement character detected, source encoding issues?");
      }
      function fixedFromCharCode(code) {
        if (code > 65535) {
          code -= 65536;
          var surrogate1 = 55296 + (code >> 10), surrogate2 = 56320 + (code & 1023);
          return String.fromCharCode(surrogate1, surrogate2);
        } else {
          return String.fromCharCode(code);
        }
      }
      function entityReplacer(a2) {
        var complete = a2[a2.length - 1] === ";" ? a2 : a2 + ";";
        if (!isHTML && complete !== a2) {
          errorHandler.error("EntityRef: expecting ;");
          return a2;
        }
        var match = g.Reference.exec(complete);
        if (!match || match[0].length !== complete.length) {
          errorHandler.error("entity not matching Reference production: " + a2);
          return a2;
        }
        var k = complete.slice(1, -1);
        if (hasOwn(entityMap, k)) {
          return entityMap[k];
        } else if (k.charAt(0) === "#") {
          return fixedFromCharCode(parseInt(k.substring(1).replace("x", "0x")));
        } else {
          errorHandler.error("entity not found:" + a2);
          return a2;
        }
      }
      function appendText(end2) {
        if (end2 > start) {
          var xt = source.substring(start, end2).replace(ENTITY_REG, entityReplacer);
          locator && position(start);
          domBuilder.characters(xt, 0, end2 - start);
          start = end2;
        }
      }
      var lineStart = 0;
      var lineEnd = 0;
      var linePattern = /\r\n?|\n|$/g;
      var locator = domBuilder.locator;
      function position(p, m) {
        while (p >= lineEnd && (m = linePattern.exec(source))) {
          lineStart = lineEnd;
          lineEnd = m.index + m[0].length;
          locator.lineNumber++;
        }
        locator.columnNumber = p - lineStart + 1;
      }
      var parseStack = [{ currentNSMap: defaultNSMapCopy }];
      var unclosedTags = [];
      var start = 0;
      while (true) {
        try {
          var tagStart = source.indexOf("<", start);
          if (tagStart < 0) {
            if (!isHTML && unclosedTags.length > 0) {
              return errorHandler.fatalError("unclosed xml tag(s): " + unclosedTags.join(", "));
            }
            if (!source.substring(start).match(/^\s*$/)) {
              var doc = domBuilder.doc;
              var text = doc.createTextNode(source.substring(start));
              if (doc.documentElement) {
                return errorHandler.error("Extra content at the end of the document");
              }
              doc.appendChild(text);
              domBuilder.currentElement = text;
            }
            return;
          }
          if (tagStart > start) {
            var fromSource = source.substring(start, tagStart);
            if (!isHTML && unclosedTags.length === 0) {
              fromSource = fromSource.replace(new RegExp(g.S_OPT.source, "g"), "");
              fromSource && errorHandler.error("Unexpected content outside root element: '" + fromSource + "'");
            }
            appendText(tagStart);
          }
          switch (source.charAt(tagStart + 1)) {
            case "/":
              var end = source.indexOf(">", tagStart + 2);
              var tagNameRaw = source.substring(tagStart + 2, end > 0 ? end : void 0);
              if (!tagNameRaw) {
                return errorHandler.fatalError("end tag name missing");
              }
              var tagNameMatch = end > 0 && g.reg("^", g.QName_group, g.S_OPT, "$").exec(tagNameRaw);
              if (!tagNameMatch) {
                return errorHandler.fatalError('end tag name contains invalid characters: "' + tagNameRaw + '"');
              }
              if (!domBuilder.currentElement && !domBuilder.doc.documentElement) {
                return;
              }
              var currentTagName = unclosedTags[unclosedTags.length - 1] || domBuilder.currentElement.tagName || domBuilder.doc.documentElement.tagName || "";
              if (currentTagName !== tagNameMatch[1]) {
                var tagNameLower = tagNameMatch[1].toLowerCase();
                if (!isHTML || currentTagName.toLowerCase() !== tagNameLower) {
                  return errorHandler.fatalError('Opening and ending tag mismatch: "' + currentTagName + '" != "' + tagNameRaw + '"');
                }
              }
              var config = parseStack.pop();
              unclosedTags.pop();
              var localNSMap = config.localNSMap;
              domBuilder.endElement(config.uri, config.localName, currentTagName);
              if (localNSMap) {
                for (var prefix in localNSMap) {
                  if (hasOwn(localNSMap, prefix)) {
                    domBuilder.endPrefixMapping(prefix);
                  }
                }
              }
              end++;
              break;
            // end element
            case "?":
              locator && position(tagStart);
              end = parseProcessingInstruction(source, tagStart, domBuilder, errorHandler);
              break;
            case "!":
              locator && position(tagStart);
              end = parseDoctypeCommentOrCData(source, tagStart, domBuilder, errorHandler, isHTML);
              break;
            default:
              locator && position(tagStart);
              var el = new ElementAttributes();
              var currentNSMap = parseStack[parseStack.length - 1].currentNSMap;
              var end = parseElementStartPart(source, tagStart, el, currentNSMap, entityReplacer, errorHandler, isHTML);
              var len = el.length;
              if (!el.closed) {
                if (isHTML && conventions.isHTMLVoidElement(el.tagName)) {
                  el.closed = true;
                } else {
                  unclosedTags.push(el.tagName);
                }
              }
              if (locator && len) {
                var locator2 = copyLocator(locator, {});
                for (var i = 0; i < len; i++) {
                  var a = el[i];
                  position(a.offset);
                  a.locator = copyLocator(locator, {});
                }
                domBuilder.locator = locator2;
                if (appendElement(el, domBuilder, currentNSMap)) {
                  parseStack.push(el);
                }
                domBuilder.locator = locator;
              } else {
                if (appendElement(el, domBuilder, currentNSMap)) {
                  parseStack.push(el);
                }
              }
              if (isHTML && !el.closed) {
                end = parseHtmlSpecialContent(source, end, el.tagName, entityReplacer, domBuilder);
              } else {
                end++;
              }
          }
        } catch (e) {
          if (e instanceof ParseError) {
            throw e;
          } else if (e instanceof DOMException) {
            throw new ParseError(e.name + ": " + e.message, domBuilder.locator, e);
          }
          errorHandler.error("element parse error: " + e);
          end = -1;
        }
        if (end > start) {
          start = end;
        } else {
          appendText(Math.max(tagStart, start) + 1);
        }
      }
    }
    function copyLocator(f, t) {
      t.lineNumber = f.lineNumber;
      t.columnNumber = f.columnNumber;
      return t;
    }
    function parseElementStartPart(source, start, el, currentNSMap, entityReplacer, errorHandler, isHTML) {
      function addAttribute(qname, value2, startIndex) {
        if (hasOwn(el.attributeNames, qname)) {
          return errorHandler.fatalError("Attribute " + qname + " redefined");
        }
        if (!isHTML && value2.indexOf("<") >= 0) {
          return errorHandler.fatalError("Unescaped '<' not allowed in attributes values");
        }
        el.addValue(
          qname,
          // @see https://www.w3.org/TR/xml/#AVNormalize
          // since the xmldom sax parser does not "interpret" DTD the following is not implemented:
          // - recursive replacement of (DTD) entity references
          // - trimming and collapsing multiple spaces into a single one for attributes that are not of type CDATA
          value2.replace(/[\t\n\r]/g, " ").replace(ENTITY_REG, entityReplacer),
          startIndex
        );
      }
      var attrName;
      var value;
      var p = ++start;
      var s = S_TAG;
      while (true) {
        var c = source.charAt(p);
        switch (c) {
          case "=":
            if (s === S_ATTR) {
              attrName = source.slice(start, p);
              s = S_EQ;
            } else if (s === S_ATTR_SPACE) {
              s = S_EQ;
            } else {
              throw new Error("attribute equal must after attrName");
            }
            break;
          case "'":
          case '"':
            if (s === S_EQ || s === S_ATTR) {
              if (s === S_ATTR) {
                errorHandler.warning('attribute value must after "="');
                attrName = source.slice(start, p);
              }
              start = p + 1;
              p = source.indexOf(c, start);
              if (p > 0) {
                value = source.slice(start, p);
                addAttribute(attrName, value, start - 1);
                s = S_ATTR_END;
              } else {
                throw new Error("attribute value no end '" + c + "' match");
              }
            } else if (s == S_ATTR_NOQUOT_VALUE) {
              value = source.slice(start, p);
              addAttribute(attrName, value, start);
              errorHandler.warning('attribute "' + attrName + '" missed start quot(' + c + ")!!");
              start = p + 1;
              s = S_ATTR_END;
            } else {
              throw new Error('attribute value must after "="');
            }
            break;
          case "/":
            switch (s) {
              case S_TAG:
                el.setTagName(source.slice(start, p));
              case S_ATTR_END:
              case S_TAG_SPACE:
              case S_TAG_CLOSE:
                s = S_TAG_CLOSE;
                el.closed = true;
              case S_ATTR_NOQUOT_VALUE:
              case S_ATTR:
                break;
              case S_ATTR_SPACE:
                el.closed = true;
                break;
              //case S_EQ:
              default:
                throw new Error("attribute invalid close char('/')");
            }
            break;
          case "":
            errorHandler.error("unexpected end of input");
            if (s == S_TAG) {
              el.setTagName(source.slice(start, p));
            }
            return p;
          case ">":
            switch (s) {
              case S_TAG:
                el.setTagName(source.slice(start, p));
              case S_ATTR_END:
              case S_TAG_SPACE:
              case S_TAG_CLOSE:
                break;
              //normal
              case S_ATTR_NOQUOT_VALUE:
              //Compatible state
              case S_ATTR:
                value = source.slice(start, p);
                if (value.slice(-1) === "/") {
                  el.closed = true;
                  value = value.slice(0, -1);
                }
              case S_ATTR_SPACE:
                if (s === S_ATTR_SPACE) {
                  value = attrName;
                }
                if (s == S_ATTR_NOQUOT_VALUE) {
                  errorHandler.warning('attribute "' + value + '" missed quot(")!');
                  addAttribute(attrName, value, start);
                } else {
                  if (!isHTML) {
                    errorHandler.warning('attribute "' + value + '" missed value!! "' + value + '" instead!!');
                  }
                  addAttribute(value, value, start);
                }
                break;
              case S_EQ:
                if (!isHTML) {
                  return errorHandler.fatalError(`AttValue: ' or " expected`);
                }
            }
            return p;
          /*xml space '\x20' | #x9 | #xD | #xA; */
          case "\x80":
            c = " ";
          default:
            if (c <= " ") {
              switch (s) {
                case S_TAG:
                  el.setTagName(source.slice(start, p));
                  s = S_TAG_SPACE;
                  break;
                case S_ATTR:
                  attrName = source.slice(start, p);
                  s = S_ATTR_SPACE;
                  break;
                case S_ATTR_NOQUOT_VALUE:
                  var value = source.slice(start, p);
                  errorHandler.warning('attribute "' + value + '" missed quot(")!!');
                  addAttribute(attrName, value, start);
                case S_ATTR_END:
                  s = S_TAG_SPACE;
                  break;
              }
            } else {
              switch (s) {
                //case S_TAG:void();break;
                //case S_ATTR:void();break;
                //case S_ATTR_NOQUOT_VALUE:void();break;
                case S_ATTR_SPACE:
                  if (!isHTML) {
                    errorHandler.warning('attribute "' + attrName + '" missed value!! "' + attrName + '" instead2!!');
                  }
                  addAttribute(attrName, attrName, start);
                  start = p;
                  s = S_ATTR;
                  break;
                case S_ATTR_END:
                  errorHandler.warning('attribute space is required"' + attrName + '"!!');
                case S_TAG_SPACE:
                  s = S_ATTR;
                  start = p;
                  break;
                case S_EQ:
                  s = S_ATTR_NOQUOT_VALUE;
                  start = p;
                  break;
                case S_TAG_CLOSE:
                  throw new Error("elements closed character '/' and '>' must be connected to");
              }
            }
        }
        p++;
      }
    }
    function appendElement(el, domBuilder, currentNSMap) {
      var tagName = el.tagName;
      var localNSMap = null;
      var i = el.length;
      while (i--) {
        var a = el[i];
        var qName = a.qName;
        var value = a.value;
        var nsp = qName.indexOf(":");
        if (nsp > 0) {
          var prefix = a.prefix = qName.slice(0, nsp);
          var localName = qName.slice(nsp + 1);
          var nsPrefix = prefix === "xmlns" && localName;
        } else {
          localName = qName;
          prefix = null;
          nsPrefix = qName === "xmlns" && "";
        }
        a.localName = localName;
        if (nsPrefix !== false) {
          if (localNSMap == null) {
            localNSMap = /* @__PURE__ */ Object.create(null);
            _copy(currentNSMap, currentNSMap = /* @__PURE__ */ Object.create(null));
          }
          currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
          a.uri = NAMESPACE.XMLNS;
          domBuilder.startPrefixMapping(nsPrefix, value);
        }
      }
      var i = el.length;
      while (i--) {
        a = el[i];
        if (a.prefix) {
          if (a.prefix === "xml") {
            a.uri = NAMESPACE.XML;
          }
          if (a.prefix !== "xmlns") {
            a.uri = currentNSMap[a.prefix];
          }
        }
      }
      var nsp = tagName.indexOf(":");
      if (nsp > 0) {
        prefix = el.prefix = tagName.slice(0, nsp);
        localName = el.localName = tagName.slice(nsp + 1);
      } else {
        prefix = null;
        localName = el.localName = tagName;
      }
      var ns = el.uri = currentNSMap[prefix || ""];
      domBuilder.startElement(ns, localName, tagName, el);
      if (el.closed) {
        domBuilder.endElement(ns, localName, tagName);
        if (localNSMap) {
          for (prefix in localNSMap) {
            if (hasOwn(localNSMap, prefix)) {
              domBuilder.endPrefixMapping(prefix);
            }
          }
        }
      } else {
        el.currentNSMap = currentNSMap;
        el.localNSMap = localNSMap;
        return true;
      }
    }
    function parseHtmlSpecialContent(source, elStartEnd, tagName, entityReplacer, domBuilder) {
      var isEscapableRaw = isHTMLEscapableRawTextElement(tagName);
      if (isEscapableRaw || isHTMLRawTextElement(tagName)) {
        var elEndStart = source.indexOf("</" + tagName + ">", elStartEnd);
        var text = source.substring(elStartEnd + 1, elEndStart);
        if (isEscapableRaw) {
          text = text.replace(ENTITY_REG, entityReplacer);
        }
        domBuilder.characters(text, 0, text.length);
        return elEndStart;
      }
      return elStartEnd + 1;
    }
    function _copy(source, target) {
      for (var n in source) {
        if (hasOwn(source, n)) {
          target[n] = source[n];
        }
      }
    }
    function parseUtils(source, start) {
      var index = start;
      function char(n) {
        n = n || 0;
        return source.charAt(index + n);
      }
      function skip(n) {
        n = n || 1;
        index += n;
      }
      function skipBlanks() {
        var blanks = 0;
        while (index < source.length) {
          var c = char();
          if (c !== " " && c !== "\n" && c !== "	" && c !== "\r") {
            return blanks;
          }
          blanks++;
          skip();
        }
        return -1;
      }
      function substringFromIndex() {
        return source.substring(index);
      }
      function substringStartsWith(text) {
        return source.substring(index, index + text.length) === text;
      }
      function substringStartsWithCaseInsensitive(text) {
        return source.substring(index, index + text.length).toUpperCase() === text.toUpperCase();
      }
      function getMatch(args) {
        var expr = g.reg("^", args);
        var match = expr.exec(substringFromIndex());
        if (match) {
          skip(match[0].length);
          return match[0];
        }
        return null;
      }
      return {
        char,
        getIndex: function() {
          return index;
        },
        getMatch,
        getSource: function() {
          return source;
        },
        skip,
        skipBlanks,
        substringFromIndex,
        substringStartsWith,
        substringStartsWithCaseInsensitive
      };
    }
    function parseDoctypeInternalSubset(p, errorHandler) {
      function parsePI(p2, errorHandler2) {
        var match = g.PI.exec(p2.substringFromIndex());
        if (!match) {
          return errorHandler2.fatalError("processing instruction is not well-formed at position " + p2.getIndex());
        }
        if (match[1].toLowerCase() === "xml") {
          return errorHandler2.fatalError(
            "xml declaration is only allowed at the start of the document, but found at position " + p2.getIndex()
          );
        }
        p2.skip(match[0].length);
        return match[0];
      }
      var source = p.getSource();
      if (p.char() === "[") {
        p.skip(1);
        var intSubsetStart = p.getIndex();
        while (p.getIndex() < source.length) {
          p.skipBlanks();
          if (p.char() === "]") {
            var internalSubset = source.substring(intSubsetStart, p.getIndex());
            p.skip(1);
            return internalSubset;
          }
          var current = null;
          if (p.char() === "<" && p.char(1) === "!") {
            switch (p.char(2)) {
              case "E":
                if (p.char(3) === "L") {
                  current = p.getMatch(g.elementdecl);
                } else if (p.char(3) === "N") {
                  current = p.getMatch(g.EntityDecl);
                }
                break;
              case "A":
                current = p.getMatch(g.AttlistDecl);
                break;
              case "N":
                current = p.getMatch(g.NotationDecl);
                break;
              case "-":
                current = p.getMatch(g.Comment);
                break;
            }
          } else if (p.char() === "<" && p.char(1) === "?") {
            current = parsePI(p, errorHandler);
          } else if (p.char() === "%") {
            current = p.getMatch(g.PEReference);
          } else {
            return errorHandler.fatalError("Error detected in Markup declaration");
          }
          if (!current) {
            return errorHandler.fatalError("Error in internal subset at position " + p.getIndex());
          }
        }
        return errorHandler.fatalError("doctype internal subset is not well-formed, missing ]");
      }
    }
    function parseDoctypeCommentOrCData(source, start, domBuilder, errorHandler, isHTML) {
      var p = parseUtils(source, start);
      switch (isHTML ? p.char(2).toUpperCase() : p.char(2)) {
        case "-":
          var comment = p.getMatch(g.Comment);
          if (comment) {
            domBuilder.comment(comment, g.COMMENT_START.length, comment.length - g.COMMENT_START.length - g.COMMENT_END.length);
            return p.getIndex();
          } else {
            return errorHandler.fatalError("comment is not well-formed at position " + p.getIndex());
          }
        case "[":
          var cdata = p.getMatch(g.CDSect);
          if (cdata) {
            if (!isHTML && !domBuilder.currentElement) {
              return errorHandler.fatalError("CDATA outside of element");
            }
            domBuilder.startCDATA();
            domBuilder.characters(cdata, g.CDATA_START.length, cdata.length - g.CDATA_START.length - g.CDATA_END.length);
            domBuilder.endCDATA();
            return p.getIndex();
          } else {
            return errorHandler.fatalError("Invalid CDATA starting at position " + start);
          }
        case "D": {
          if (domBuilder.doc && domBuilder.doc.documentElement) {
            return errorHandler.fatalError("Doctype not allowed inside or after documentElement at position " + p.getIndex());
          }
          if (isHTML ? !p.substringStartsWithCaseInsensitive(g.DOCTYPE_DECL_START) : !p.substringStartsWith(g.DOCTYPE_DECL_START)) {
            return errorHandler.fatalError("Expected " + g.DOCTYPE_DECL_START + " at position " + p.getIndex());
          }
          p.skip(g.DOCTYPE_DECL_START.length);
          if (p.skipBlanks() < 1) {
            return errorHandler.fatalError("Expected whitespace after " + g.DOCTYPE_DECL_START + " at position " + p.getIndex());
          }
          var doctype = {
            name: void 0,
            publicId: void 0,
            systemId: void 0,
            internalSubset: void 0
          };
          doctype.name = p.getMatch(g.Name);
          if (!doctype.name)
            return errorHandler.fatalError("doctype name missing or contains unexpected characters at position " + p.getIndex());
          if (isHTML && doctype.name.toLowerCase() !== "html") {
            errorHandler.warning("Unexpected DOCTYPE in HTML document at position " + p.getIndex());
          }
          p.skipBlanks();
          if (p.substringStartsWith(g.PUBLIC) || p.substringStartsWith(g.SYSTEM)) {
            var match = g.ExternalID_match.exec(p.substringFromIndex());
            if (!match) {
              return errorHandler.fatalError("doctype external id is not well-formed at position " + p.getIndex());
            }
            if (match.groups.SystemLiteralOnly !== void 0) {
              doctype.systemId = match.groups.SystemLiteralOnly;
            } else {
              doctype.systemId = match.groups.SystemLiteral;
              doctype.publicId = match.groups.PubidLiteral;
            }
            p.skip(match[0].length);
          } else if (isHTML && p.substringStartsWithCaseInsensitive(g.SYSTEM)) {
            p.skip(g.SYSTEM.length);
            if (p.skipBlanks() < 1) {
              return errorHandler.fatalError("Expected whitespace after " + g.SYSTEM + " at position " + p.getIndex());
            }
            doctype.systemId = p.getMatch(g.ABOUT_LEGACY_COMPAT_SystemLiteral);
            if (!doctype.systemId) {
              return errorHandler.fatalError(
                "Expected " + g.ABOUT_LEGACY_COMPAT + " in single or double quotes after " + g.SYSTEM + " at position " + p.getIndex()
              );
            }
          }
          if (isHTML && doctype.systemId && !g.ABOUT_LEGACY_COMPAT_SystemLiteral.test(doctype.systemId)) {
            errorHandler.warning("Unexpected doctype.systemId in HTML document at position " + p.getIndex());
          }
          if (!isHTML) {
            p.skipBlanks();
            doctype.internalSubset = parseDoctypeInternalSubset(p, errorHandler);
          }
          p.skipBlanks();
          if (p.char() !== ">") {
            return errorHandler.fatalError("doctype not terminated with > at position " + p.getIndex());
          }
          p.skip(1);
          domBuilder.startDTD(doctype.name, doctype.publicId, doctype.systemId, doctype.internalSubset);
          domBuilder.endDTD();
          return p.getIndex();
        }
        default:
          return errorHandler.fatalError('Not well-formed XML starting with "<!" at position ' + start);
      }
    }
    function parseProcessingInstruction(source, start, domBuilder, errorHandler) {
      var match = source.substring(start).match(g.PI);
      if (!match) {
        return errorHandler.fatalError("Invalid processing instruction starting at position " + start);
      }
      if (match[1].toLowerCase() === "xml") {
        if (start > 0) {
          return errorHandler.fatalError(
            "processing instruction at position " + start + " is an xml declaration which is only at the start of the document"
          );
        }
        if (!g.XMLDecl.test(source.substring(start))) {
          return errorHandler.fatalError("xml declaration is not well-formed");
        }
      }
      domBuilder.processingInstruction(match[1], match[2]);
      return start + match[0].length;
    }
    function ElementAttributes() {
      this.attributeNames = /* @__PURE__ */ Object.create(null);
    }
    ElementAttributes.prototype = {
      setTagName: function(tagName) {
        if (!g.QName_exact.test(tagName)) {
          throw new Error("invalid tagName:" + tagName);
        }
        this.tagName = tagName;
      },
      addValue: function(qName, value, offset) {
        if (!g.QName_exact.test(qName)) {
          throw new Error("invalid attribute:" + qName);
        }
        this.attributeNames[qName] = this.length;
        this[this.length++] = { qName, value, offset };
      },
      length: 0,
      getLocalName: function(i) {
        return this[i].localName;
      },
      getLocator: function(i) {
        return this[i].locator;
      },
      getQName: function(i) {
        return this[i].qName;
      },
      getURI: function(i) {
        return this[i].uri;
      },
      getValue: function(i) {
        return this[i].value;
      }
      //	,getIndex:function(uri, localName)){
      //		if(localName){
      //
      //		}else{
      //			var qName = uri
      //		}
      //	},
      //	getValue:function(){return this.getValue(this.getIndex.apply(this,arguments))},
      //	getType:function(uri,localName){}
      //	getType:function(i){},
    };
    exports2.XMLReader = XMLReader;
    exports2.parseUtils = parseUtils;
    exports2.parseDoctypeCommentOrCData = parseDoctypeCommentOrCData;
  }
});

// node_modules/@xmldom/xmldom/lib/dom-parser.js
var require_dom_parser = __commonJS({
  "node_modules/@xmldom/xmldom/lib/dom-parser.js"(exports2) {
    "use strict";
    var conventions = require_conventions();
    var dom = require_dom();
    var errors = require_errors();
    var entities = require_entities();
    var sax = require_sax();
    var DOMImplementation = dom.DOMImplementation;
    var hasDefaultHTMLNamespace = conventions.hasDefaultHTMLNamespace;
    var isHTMLMimeType = conventions.isHTMLMimeType;
    var isValidMimeType = conventions.isValidMimeType;
    var MIME_TYPE = conventions.MIME_TYPE;
    var NAMESPACE = conventions.NAMESPACE;
    var ParseError = errors.ParseError;
    var XMLReader = sax.XMLReader;
    function normalizeLineEndings(input) {
      return input.replace(/\r[\n\u0085]/g, "\n").replace(/[\r\u0085\u2028\u2029]/g, "\n");
    }
    function DOMParser(options) {
      options = options || {};
      if (options.locator === void 0) {
        options.locator = true;
      }
      this.assign = options.assign || conventions.assign;
      this.domHandler = options.domHandler || DOMHandler;
      this.onError = options.onError || options.errorHandler;
      if (options.errorHandler && typeof options.errorHandler !== "function") {
        throw new TypeError("errorHandler object is no longer supported, switch to onError!");
      } else if (options.errorHandler) {
        options.errorHandler("warning", "The `errorHandler` option has been deprecated, use `onError` instead!", this);
      }
      this.normalizeLineEndings = options.normalizeLineEndings || normalizeLineEndings;
      this.locator = !!options.locator;
      this.xmlns = this.assign(/* @__PURE__ */ Object.create(null), options.xmlns);
    }
    DOMParser.prototype.parseFromString = function(source, mimeType) {
      if (!isValidMimeType(mimeType)) {
        throw new TypeError('DOMParser.parseFromString: the provided mimeType "' + mimeType + '" is not valid.');
      }
      var defaultNSMap = this.assign(/* @__PURE__ */ Object.create(null), this.xmlns);
      var entityMap = entities.XML_ENTITIES;
      var defaultNamespace = defaultNSMap[""] || null;
      if (hasDefaultHTMLNamespace(mimeType)) {
        entityMap = entities.HTML_ENTITIES;
        defaultNamespace = NAMESPACE.HTML;
      } else if (mimeType === MIME_TYPE.XML_SVG_IMAGE) {
        defaultNamespace = NAMESPACE.SVG;
      }
      defaultNSMap[""] = defaultNamespace;
      defaultNSMap.xml = defaultNSMap.xml || NAMESPACE.XML;
      var domBuilder = new this.domHandler({
        mimeType,
        defaultNamespace,
        onError: this.onError
      });
      var locator = this.locator ? {} : void 0;
      if (this.locator) {
        domBuilder.setDocumentLocator(locator);
      }
      var sax2 = new XMLReader();
      sax2.errorHandler = domBuilder;
      sax2.domBuilder = domBuilder;
      var isXml = !conventions.isHTMLMimeType(mimeType);
      if (isXml && typeof source !== "string") {
        sax2.errorHandler.fatalError("source is not a string");
      }
      sax2.parse(this.normalizeLineEndings(String(source)), defaultNSMap, entityMap);
      if (!domBuilder.doc.documentElement) {
        sax2.errorHandler.fatalError("missing root element");
      }
      return domBuilder.doc;
    };
    function DOMHandler(options) {
      var opt = options || {};
      this.mimeType = opt.mimeType || MIME_TYPE.XML_APPLICATION;
      this.defaultNamespace = opt.defaultNamespace || null;
      this.cdata = false;
      this.currentElement = void 0;
      this.doc = void 0;
      this.locator = void 0;
      this.onError = opt.onError;
    }
    function position(locator, node) {
      node.lineNumber = locator.lineNumber;
      node.columnNumber = locator.columnNumber;
    }
    DOMHandler.prototype = {
      /**
       * Either creates an XML or an HTML document and stores it under `this.doc`.
       * If it is an XML document, `this.defaultNamespace` is used to create it,
       * and it will not contain any `childNodes`.
       * If it is an HTML document, it will be created without any `childNodes`.
       *
       * @see http://www.saxproject.org/apidoc/org/xml/sax/ContentHandler.html
       */
      startDocument: function() {
        var impl = new DOMImplementation();
        this.doc = isHTMLMimeType(this.mimeType) ? impl.createHTMLDocument(false) : impl.createDocument(this.defaultNamespace, "");
      },
      startElement: function(namespaceURI, localName, qName, attrs) {
        var doc = this.doc;
        var el = doc.createElementNS(namespaceURI, qName || localName);
        var len = attrs.length;
        appendElement(this, el);
        this.currentElement = el;
        this.locator && position(this.locator, el);
        for (var i = 0; i < len; i++) {
          var namespaceURI = attrs.getURI(i);
          var value = attrs.getValue(i);
          var qName = attrs.getQName(i);
          var attr = doc.createAttributeNS(namespaceURI, qName);
          this.locator && position(attrs.getLocator(i), attr);
          attr.value = attr.nodeValue = value;
          el.setAttributeNode(attr);
        }
      },
      endElement: function(namespaceURI, localName, qName) {
        this.currentElement = this.currentElement.parentNode;
      },
      startPrefixMapping: function(prefix, uri) {
      },
      endPrefixMapping: function(prefix) {
      },
      processingInstruction: function(target, data) {
        var ins = this.doc.createProcessingInstruction(target, data);
        this.locator && position(this.locator, ins);
        appendElement(this, ins);
      },
      ignorableWhitespace: function(ch, start, length) {
      },
      characters: function(chars, start, length) {
        chars = _toString.apply(this, arguments);
        if (chars) {
          if (this.cdata) {
            var charNode = this.doc.createCDATASection(chars);
          } else {
            var charNode = this.doc.createTextNode(chars);
          }
          if (this.currentElement) {
            this.currentElement.appendChild(charNode);
          } else if (/^\s*$/.test(chars)) {
            this.doc.appendChild(charNode);
          }
          this.locator && position(this.locator, charNode);
        }
      },
      skippedEntity: function(name) {
      },
      endDocument: function() {
        this.doc.normalize();
      },
      /**
       * Stores the locator to be able to set the `columnNumber` and `lineNumber`
       * on the created DOM nodes.
       *
       * @param {Locator} locator
       */
      setDocumentLocator: function(locator) {
        if (locator) {
          locator.lineNumber = 0;
        }
        this.locator = locator;
      },
      //LexicalHandler
      comment: function(chars, start, length) {
        chars = _toString.apply(this, arguments);
        var comm = this.doc.createComment(chars);
        this.locator && position(this.locator, comm);
        appendElement(this, comm);
      },
      startCDATA: function() {
        this.cdata = true;
      },
      endCDATA: function() {
        this.cdata = false;
      },
      startDTD: function(name, publicId, systemId, internalSubset) {
        var impl = this.doc.implementation;
        if (impl && impl.createDocumentType) {
          var dt = impl.createDocumentType(name, publicId, systemId, internalSubset);
          this.locator && position(this.locator, dt);
          appendElement(this, dt);
          this.doc.doctype = dt;
        }
      },
      reportError: function(level, message) {
        if (typeof this.onError === "function") {
          try {
            this.onError(level, message, this);
          } catch (e) {
            throw new ParseError("Reporting " + level + ' "' + message + '" caused ' + e, this.locator);
          }
        } else {
          console.error("[xmldom " + level + "]	" + message, _locator(this.locator));
        }
      },
      /**
       * @see http://www.saxproject.org/apidoc/org/xml/sax/ErrorHandler.html
       */
      warning: function(message) {
        this.reportError("warning", message);
      },
      error: function(message) {
        this.reportError("error", message);
      },
      /**
       * This function reports a fatal error and throws a ParseError.
       *
       * @param {string} message
       * - The message to be used for reporting and throwing the error.
       * @returns {never}
       * This function always throws an error and never returns a value.
       * @throws {ParseError}
       * Always throws a ParseError with the provided message.
       */
      fatalError: function(message) {
        this.reportError("fatalError", message);
        throw new ParseError(message, this.locator);
      }
    };
    function _locator(l) {
      if (l) {
        return "\n@#[line:" + l.lineNumber + ",col:" + l.columnNumber + "]";
      }
    }
    function _toString(chars, start, length) {
      if (typeof chars == "string") {
        return chars.substr(start, length);
      } else {
        if (chars.length >= start + length || start) {
          return new java.lang.String(chars, start, length) + "";
        }
        return chars;
      }
    }
    "endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(
      /\w+/g,
      function(key) {
        DOMHandler.prototype[key] = function() {
          return null;
        };
      }
    );
    function appendElement(handler, node) {
      if (!handler.currentElement) {
        handler.doc.appendChild(node);
      } else {
        handler.currentElement.appendChild(node);
      }
    }
    function onErrorStopParsing(level) {
      if (level === "error") throw "onErrorStopParsing";
    }
    function onWarningStopParsing() {
      throw "onWarningStopParsing";
    }
    exports2.__DOMHandler = DOMHandler;
    exports2.DOMParser = DOMParser;
    exports2.normalizeLineEndings = normalizeLineEndings;
    exports2.onErrorStopParsing = onErrorStopParsing;
    exports2.onWarningStopParsing = onWarningStopParsing;
  }
});

// node_modules/@xmldom/xmldom/lib/index.js
var require_lib = __commonJS({
  "node_modules/@xmldom/xmldom/lib/index.js"(exports2) {
    "use strict";
    var conventions = require_conventions();
    exports2.assign = conventions.assign;
    exports2.hasDefaultHTMLNamespace = conventions.hasDefaultHTMLNamespace;
    exports2.isHTMLMimeType = conventions.isHTMLMimeType;
    exports2.isValidMimeType = conventions.isValidMimeType;
    exports2.MIME_TYPE = conventions.MIME_TYPE;
    exports2.NAMESPACE = conventions.NAMESPACE;
    var errors = require_errors();
    exports2.DOMException = errors.DOMException;
    exports2.DOMExceptionName = errors.DOMExceptionName;
    exports2.ExceptionCode = errors.ExceptionCode;
    exports2.ParseError = errors.ParseError;
    var dom = require_dom();
    exports2.Attr = dom.Attr;
    exports2.CDATASection = dom.CDATASection;
    exports2.CharacterData = dom.CharacterData;
    exports2.Comment = dom.Comment;
    exports2.Document = dom.Document;
    exports2.DocumentFragment = dom.DocumentFragment;
    exports2.DocumentType = dom.DocumentType;
    exports2.DOMImplementation = dom.DOMImplementation;
    exports2.Element = dom.Element;
    exports2.Entity = dom.Entity;
    exports2.EntityReference = dom.EntityReference;
    exports2.LiveNodeList = dom.LiveNodeList;
    exports2.NamedNodeMap = dom.NamedNodeMap;
    exports2.Node = dom.Node;
    exports2.NodeList = dom.NodeList;
    exports2.Notation = dom.Notation;
    exports2.ProcessingInstruction = dom.ProcessingInstruction;
    exports2.Text = dom.Text;
    exports2.XMLSerializer = dom.XMLSerializer;
    var domParser = require_dom_parser();
    exports2.DOMParser = domParser.DOMParser;
    exports2.normalizeLineEndings = domParser.normalizeLineEndings;
    exports2.onErrorStopParsing = domParser.onErrorStopParsing;
    exports2.onWarningStopParsing = domParser.onWarningStopParsing;
  }
});

// src/bpmXaml.js
var require_bpmXaml = __commonJS({
  "src/bpmXaml.js"(exports2, module2) {
    "use strict";
    var { DOMParser, XMLSerializer } = require_lib();
    var XAML_NS = "http://schemas.microsoft.com/winfx/2006/xaml";
    function childByLocalName(parent, localName) {
      for (let i = 0; i < parent.childNodes.length; i++) {
        const c = parent.childNodes[i];
        if (c.nodeType === 1 && c.localName === localName) return c;
      }
      return null;
    }
    function firstElement(parent) {
      if (!parent) return null;
      for (let i = 0; i < parent.childNodes.length; i++) {
        if (parent.childNodes[i].nodeType === 1) return parent.childNodes[i];
      }
      return null;
    }
    function xName(el) {
      return el.getAttributeNS(XAML_NS, "Name") || el.getAttribute("x:Name") || null;
    }
    function xKey(el) {
      return el.getAttributeNS(XAML_NS, "Key") || el.getAttribute("x:Key") || null;
    }
    function findVps(el) {
      let vps = childByLocalName(el, "VisualPropertiesStorage");
      if (vps) return vps;
      for (let i = 0; i < el.childNodes.length; i++) {
        const c = el.childNodes[i];
        if (c.nodeType !== 1 || !c.localName.includes(".")) continue;
        vps = childByLocalName(c, "VisualPropertiesStorage");
        if (vps) return vps;
      }
      return null;
    }
    function getPosition(el) {
      const vps = findVps(el);
      if (!vps) return { x: 0, y: 0 };
      let x = 0, y = 0;
      for (let i = 0; i < vps.childNodes.length; i++) {
        const c = vps.childNodes[i];
        if (c.nodeType !== 1) continue;
        const key = xKey(c);
        if (key === "ElementX") x = parseFloat(c.textContent) || 0;
        if (key === "ElementY") y = parseFloat(c.textContent) || 0;
      }
      return { x, y };
    }
    function findActionEl(stepEl) {
      const wrapper = childByLocalName(stepEl, "DirectiveStep.Action");
      if (wrapper) return firstElement(wrapper);
      for (let i = 0; i < stepEl.childNodes.length; i++) {
        const c = stepEl.childNodes[i];
        if (c.nodeType !== 1) continue;
        if (c.localName.includes(".") || c.localName === "VisualPropertiesStorage") continue;
        return c;
      }
      return null;
    }
    function findConditionEl(condEl) {
      const wrapper = childByLocalName(condEl, "DirectiveCondition.Condition");
      if (wrapper) return firstElement(wrapper);
      for (let i = 0; i < condEl.childNodes.length; i++) {
        const c = condEl.childNodes[i];
        if (c.nodeType !== 1) continue;
        if (c.localName.includes(".") || c.localName === "VisualPropertiesStorage") continue;
        return c;
      }
      return null;
    }
    var ACTION_LABELS = {
      CustomCodeAction: "Execute Custom Code",
      EnableDirectivesAction: "Enable Post Directive",
      RaiseExceptionAction: "Raise Exception",
      SetDataFieldAction: "Set Data Field",
      CallMethodAction: "Invoke BO Method",
      CompleteMethodCallAction: "Complete Method Call",
      SendEmailAction: "Send E-mail",
      ActivityTrackingAction: "Activity Tracking",
      LogMessageAction: "Log Message",
      ShowMessageAction: "Show Message",
      AttachDataTagAction: "Attach Data Tag",
      RemoveDataTagAction: "Remove Data Tag",
      AttachHoldAction: "Attach Hold",
      RemoveHoldsAction: "Remove Holds",
      EnablePostDirectiveAction: "Enable Post Directive",
      InvokeFunctionAction: "Invoke Function",
      InvokeExternalMethodAction: "Invoke External Method"
    };
    var CONDITION_LABELS = {
      CustomCodeCondition: "C# Condition",
      FieldCondition: "Field Condition"
    };
    function extractWidget(el) {
      if (!el) return null;
      const localName = el.localName;
      const attrs = {};
      for (let i = 0; i < el.attributes.length; i++) {
        const a = el.attributes[i];
        if (a.name.startsWith("xmlns")) continue;
        attrs[a.name] = a.value;
      }
      const code = el.hasAttribute("Code") ? el.getAttribute("Code") : null;
      let message = null;
      const msgEl = firstElement(el);
      if (msgEl && msgEl.localName === "String") {
        message = msgEl.textContent;
      }
      let actionExpressionText = null;
      let actionFieldInfo = null;
      if (localName === "SetBpmDataFieldAction") {
        const exprWrapper = childByLocalName(el, localName + ".Expression");
        if (exprWrapper) {
          const exprDef = childByLocalName(exprWrapper, "ExpressionDefinition");
          if (exprDef) actionExpressionText = exprDef.getAttribute("Text");
        }
        const fieldWrapper = childByLocalName(el, localName + ".Field");
        if (fieldWrapper) {
          const colInfo = childByLocalName(fieldWrapper, "ColumnInfo");
          if (colInfo) actionFieldInfo = {
            tableName: colInfo.getAttribute("TableName"),
            columnName: colInfo.getAttribute("ColumnName")
          };
        }
      }
      let paramBindings = null;
      if (localName === "InvokeEpicorFunctionAction2" || localName === "InvokeEpicorFunctionAction") {
        paramBindings = [];
        for (const propName of ["InputParameters", "OutputParameters"]) {
          const wrapper = childByLocalName(el, localName + "." + propName);
          if (!wrapper) continue;
          const parent = childByLocalName(wrapper, "Array") || wrapper;
          for (let i = 0; i < parent.childNodes.length; i++) {
            const pb = parent.childNodes[i];
            if (pb.nodeType !== 1 || pb.localName !== "ParameterBinding2") continue;
            const btWrapper = childByLocalName(pb, "ParameterBinding2.BindingTarget");
            const vbt = btWrapper ? childByLocalName(btWrapper, "VariableBindingTarget") : null;
            paramBindings.push({
              paramName: pb.getAttribute("ParameterName") || "",
              paramDirection: pb.getAttribute("ParameterDirection") || "Input",
              variableName: vbt ? vbt.getAttribute("VariableName") || "" : ""
            });
          }
        }
      }
      let conditions = null;
      if (localName === "ConditionBlock") {
        conditions = [];
        const itemsWrapper = childByLocalName(el, "ConditionBlock.Items");
        const itemsParent = itemsWrapper || el;
        for (let i = 0; i < itemsParent.childNodes.length; i++) {
          const item = itemsParent.childNodes[i];
          if (item.nodeType !== 1 || item.localName !== "ConditionBlockItem") continue;
          const itemOperator = item.getAttribute("Operator") || "None";
          const condWrapper = childByLocalName(item, "ConditionBlockItem.Condition");
          const actualCond = condWrapper ? firstElement(condWrapper) : null;
          if (!actualCond) continue;
          const condLocalName = actualCond.localName;
          const condAttrs = {};
          for (let j = 0; j < actualCond.attributes.length; j++) {
            const a = actualCond.attributes[j];
            if (!a.name.startsWith("xmlns")) condAttrs[a.name] = a.value;
          }
          let expressionText = null;
          const exprWrapper = childByLocalName(actualCond, condLocalName + ".Expression");
          if (exprWrapper) {
            const exprDef = childByLocalName(exprWrapper, "ExpressionDefinition");
            if (exprDef) expressionText = exprDef.getAttribute("Text");
          }
          let fieldInfo = null;
          const fieldWrapper = childByLocalName(actualCond, condLocalName + ".Field");
          if (fieldWrapper) {
            const colInfo = childByLocalName(fieldWrapper, "ColumnInfo");
            if (colInfo) fieldInfo = {
              tableName: colInfo.getAttribute("TableName"),
              columnName: colInfo.getAttribute("ColumnName")
            };
          }
          conditions.push({ localName: condLocalName, attrs: condAttrs, itemOperator, expressionText, fieldInfo });
        }
      }
      return { localName, attrs, code, message, conditions, actionExpressionText, actionFieldInfo, paramBindings, label: ACTION_LABELS[localName] || CONDITION_LABELS[localName] || localName };
    }
    function parseDirective(bodyXml) {
      if (!bodyXml) return null;
      const doc = new DOMParser({
        onError: (level, msg) => {
          if (level === "fatalError") throw new Error(msg);
        }
      }).parseFromString(bodyXml, "text/xml");
      const root = doc.documentElement;
      if (!root || root.localName !== "DirectiveDefinition2") return null;
      const nodes = [];
      const edges = [];
      const seen = /* @__PURE__ */ new Set();
      function walk(el, fromId, edgeLabel) {
        if (!el) return;
        if (el.localName === "Null" || el.getAttribute("x:Null") !== null) return;
        const id = xName(el) || `_node${nodes.length}`;
        if (seen.has(id)) {
          if (fromId !== null) edges.push({ from: fromId, to: id, label: edgeLabel });
          return;
        }
        seen.add(id);
        if (fromId !== null) edges.push({ from: fromId, to: id, label: edgeLabel });
        const { x, y } = getPosition(el);
        if (el.localName === "DirectiveCondition") {
          nodes.push({ id, type: "condition", widget: extractWidget(findConditionEl(el)), x, y, _el: el });
          const trueWrapper = childByLocalName(el, "DirectiveCondition.True");
          const falseWrapper = childByLocalName(el, "DirectiveCondition.False");
          const trueEl = trueWrapper ? firstElement(trueWrapper) : null;
          if (trueEl) walk(trueEl, id, "True");
          else edges.push({ from: id, to: null, label: "True" });
          const falseAttr = el.getAttribute("False");
          const falseEl = falseWrapper ? firstElement(falseWrapper) : null;
          if (falseEl) walk(falseEl, id, "False");
          else if (!falseAttr || falseAttr === "{x:Null}") edges.push({ from: id, to: null, label: "False" });
        } else if (el.localName === "DirectiveStep") {
          nodes.push({ id, type: "step", widget: extractWidget(findActionEl(el)), x, y, _el: el });
          const nextWrapper = childByLocalName(el, "DirectiveStep.Next");
          if (nextWrapper) walk(firstElement(nextWrapper), id, null);
        }
      }
      const startWrapper = childByLocalName(root, "DirectiveDefinition2.StartNode");
      if (startWrapper) walk(firstElement(startWrapper), null, null);
      return { nodes, edges, startNodeId: nodes[0]?.id ?? null, doc, root };
    }
    function setNodeCode(bodyXml, nodeId, newCode) {
      const parsed = parseDirective(bodyXml);
      if (!parsed) throw new Error("Failed to parse directive XAML");
      const node = parsed.nodes.find((n) => n.id === nodeId);
      if (!node) throw new Error(`Node "${nodeId}" not found`);
      const widgetEl = node.type === "condition" ? findConditionEl(node._el) : findActionEl(node._el);
      if (!widgetEl) throw new Error(`No widget element found in node "${nodeId}"`);
      if (!widgetEl.hasAttribute("Code")) throw new Error(`Widget ${widgetEl.localName} has no Code attribute`);
      widgetEl.setAttribute("Code", newCode);
      return new XMLSerializer().serializeToString(parsed.doc);
    }
    function setRaiseExceptionMessage(bodyXml, nodeId, newMessage) {
      const parsed = parseDirective(bodyXml);
      if (!parsed) throw new Error("Failed to parse directive XAML");
      const node = parsed.nodes.find((n) => n.id === nodeId);
      if (!node || node.type !== "step") throw new Error(`Step node "${nodeId}" not found`);
      const actionEl = findActionEl(node._el);
      if (!actionEl || actionEl.localName !== "RaiseExceptionAction") {
        throw new Error(`Node "${nodeId}" is not a RaiseExceptionAction`);
      }
      const msgEl = firstElement(actionEl);
      if (msgEl && msgEl.localName === "String") {
        msgEl.textContent = newMessage;
      }
      return new XMLSerializer().serializeToString(parsed.doc);
    }
    function setConditionChildren(bodyXml, nodeId, conditionUpdates) {
      const parsed = parseDirective(bodyXml);
      if (!parsed) throw new Error("Failed to parse directive XAML");
      const node = parsed.nodes.find((n) => n.id === nodeId);
      if (!node) throw new Error(`Node "${nodeId}" not found`);
      const widgetEl = node.type === "condition" ? findConditionEl(node._el) : findActionEl(node._el);
      if (!widgetEl || widgetEl.localName !== "ConditionBlock") throw new Error("Not a ConditionBlock node");
      const itemsWrapper = childByLocalName(widgetEl, "ConditionBlock.Items");
      const itemsParent = itemsWrapper || widgetEl;
      const items = [];
      for (let i = 0; i < itemsParent.childNodes.length; i++) {
        const c = itemsParent.childNodes[i];
        if (c.nodeType === 1 && c.localName === "ConditionBlockItem") items.push(c);
      }
      for (const { index, conditionAttrs, expressionText, itemOperator, fieldInfo } of conditionUpdates) {
        const item = items[index];
        if (!item) continue;
        if (itemOperator !== void 0) item.setAttribute("Operator", itemOperator);
        const condWrapper = childByLocalName(item, "ConditionBlockItem.Condition");
        const actualCond = condWrapper ? firstElement(condWrapper) : null;
        if (!actualCond) continue;
        if (conditionAttrs) {
          for (const [attr, value] of Object.entries(conditionAttrs)) {
            actualCond.setAttribute(attr, value);
          }
        }
        if (expressionText !== void 0) {
          const exprWrapper = childByLocalName(actualCond, actualCond.localName + ".Expression");
          if (exprWrapper) {
            const exprDef = childByLocalName(exprWrapper, "ExpressionDefinition");
            if (exprDef) exprDef.setAttribute("Text", expressionText);
          }
        }
        if (fieldInfo) {
          const fieldWrapper = childByLocalName(actualCond, actualCond.localName + ".Field");
          if (fieldWrapper) {
            const colInfo = childByLocalName(fieldWrapper, "ColumnInfo");
            if (colInfo) {
              if (fieldInfo.tableName !== void 0) colInfo.setAttribute("TableName", fieldInfo.tableName);
              if (fieldInfo.columnName !== void 0) colInfo.setAttribute("ColumnName", fieldInfo.columnName);
            }
          }
        }
      }
      return new XMLSerializer().serializeToString(parsed.doc);
    }
    function setNodeAttrs(bodyXml, nodeId, attrsMap) {
      const parsed = parseDirective(bodyXml);
      if (!parsed) throw new Error("Failed to parse directive XAML");
      const node = parsed.nodes.find((n) => n.id === nodeId);
      if (!node) throw new Error(`Node "${nodeId}" not found`);
      const widgetEl = node.type === "condition" ? findConditionEl(node._el) : findActionEl(node._el);
      if (!widgetEl) throw new Error(`No widget element found in node "${nodeId}"`);
      for (const [attr, value] of Object.entries(attrsMap)) {
        widgetEl.setAttribute(attr, value);
      }
      return new XMLSerializer().serializeToString(parsed.doc);
    }
    function setInvokeFunctionAction(bodyXml, nodeId, attrsMap, paramBindings) {
      const parsed = parseDirective(bodyXml);
      if (!parsed) throw new Error("Failed to parse directive XAML");
      const node = parsed.nodes.find((n) => n.id === nodeId);
      if (!node) throw new Error(`Node "${nodeId}" not found`);
      const actionEl = findActionEl(node._el);
      if (!actionEl) throw new Error(`No action element found in node "${nodeId}"`);
      for (const [attr, value] of Object.entries(attrsMap)) {
        actionEl.setAttribute(attr, value);
      }
      for (const { paramName, variableName } of paramBindings) {
        for (const propName of ["InputParameters", "OutputParameters"]) {
          const wrapper = childByLocalName(actionEl, actionEl.localName + "." + propName);
          if (!wrapper) continue;
          const parent = childByLocalName(wrapper, "Array") || wrapper;
          for (let i = 0; i < parent.childNodes.length; i++) {
            const pb = parent.childNodes[i];
            if (pb.nodeType !== 1 || pb.localName !== "ParameterBinding2") continue;
            if (pb.getAttribute("ParameterName") !== paramName) continue;
            const btWrapper = childByLocalName(pb, "ParameterBinding2.BindingTarget");
            const vbt = btWrapper ? childByLocalName(btWrapper, "VariableBindingTarget") : null;
            if (vbt) vbt.setAttribute("VariableName", variableName);
          }
        }
      }
      return new XMLSerializer().serializeToString(parsed.doc);
    }
    function setActionField(bodyXml, nodeId, expressionText, fieldInfo) {
      const parsed = parseDirective(bodyXml);
      if (!parsed) throw new Error("Failed to parse directive XAML");
      const node = parsed.nodes.find((n) => n.id === nodeId);
      if (!node) throw new Error(`Node "${nodeId}" not found`);
      const actionEl = findActionEl(node._el);
      if (!actionEl) throw new Error(`No action element found in node "${nodeId}"`);
      if (expressionText !== void 0) {
        const exprWrapper = childByLocalName(actionEl, actionEl.localName + ".Expression");
        if (exprWrapper) {
          const exprDef = childByLocalName(exprWrapper, "ExpressionDefinition");
          if (exprDef) exprDef.setAttribute("Text", expressionText);
        }
      }
      if (fieldInfo) {
        const fieldWrapper = childByLocalName(actionEl, actionEl.localName + ".Field");
        if (fieldWrapper) {
          const colInfo = childByLocalName(fieldWrapper, "ColumnInfo");
          if (colInfo) {
            if (fieldInfo.tableName !== void 0) colInfo.setAttribute("TableName", fieldInfo.tableName);
            if (fieldInfo.columnName !== void 0) colInfo.setAttribute("ColumnName", fieldInfo.columnName);
          }
        }
      }
      return new XMLSerializer().serializeToString(parsed.doc);
    }
    module2.exports = { parseDirective, setNodeCode, setRaiseExceptionMessage, setNodeAttrs, setConditionChildren, setInvokeFunctionAction, setActionField };
  }
});

// src/bpmWidgetPanel.js
var require_bpmWidgetPanel = __commonJS({
  "src/bpmWidgetPanel.js"(exports2, module2) {
    "use strict";
    var vscode2 = require("vscode");
    var { parseDirective, setNodeCode, setRaiseExceptionMessage, setNodeAttrs, setConditionChildren, setInvokeFunctionAction, setActionField } = require_bpmXaml();
    var panels = /* @__PURE__ */ new Map();
    function openWidgetPanel2(context, bpmClient, directive) {
      const key = directive.DirectiveID;
      if (panels.has(key)) {
        panels.get(key).reveal(vscode2.ViewColumn.One);
        return;
      }
      const typeLabel = directive.DirectiveType === 1 ? "Pre" : directive.DirectiveType === 3 ? "Post" : directive.DirectiveType === 2 ? "Base" : "";
      const panel = vscode2.window.createWebviewPanel(
        "bpmWidgets",
        `BPM: ${typeLabel} ${directive.Name}`,
        vscode2.ViewColumn.One,
        { enableScripts: true, retainContextWhenHidden: true }
      );
      panels.set(key, panel);
      panel.onDidDispose(() => panels.delete(key), null, context.subscriptions);
      let currentBody = directive.Body;
      function render() {
        const parsed = parseDirective(currentBody);
        if (!parsed || parsed.nodes.length === 0) {
          panel.webview.html = errorHtml("Could not parse directive XAML, or no widget nodes found.<br>This directive may be a pure C# code directive with no visual widgets.");
          return;
        }
        const graph = {
          nodes: parsed.nodes.map((n) => ({
            id: n.id,
            type: n.type,
            widget: n.widget ? {
              localName: n.widget.localName,
              label: n.widget.label,
              code: n.widget.code,
              message: n.widget.message,
              attrs: n.widget.attrs,
              conditions: n.widget.conditions,
              paramBindings: n.widget.paramBindings,
              actionExpressionText: n.widget.actionExpressionText,
              actionFieldInfo: n.widget.actionFieldInfo
            } : null,
            x: n.x,
            y: n.y
          })),
          edges: parsed.edges
        };
        panel.webview.html = buildHtml(directive.Name, typeLabel, graph);
      }
      render();
      panel.webview.onDidReceiveMessage(async (msg) => {
        if (msg.type === "saveCode") {
          await push(msg.nodeId, () => setNodeCode(currentBody, msg.nodeId, msg.code));
        } else if (msg.type === "saveMessage") {
          await push(msg.nodeId, () => setRaiseExceptionMessage(currentBody, msg.nodeId, msg.message));
        } else if (msg.type === "saveAttrs") {
          await push(msg.nodeId, () => setNodeAttrs(currentBody, msg.nodeId, msg.attrs));
        } else if (msg.type === "saveConditions") {
          await push(msg.nodeId, () => setConditionChildren(currentBody, msg.nodeId, msg.conditions));
        } else if (msg.type === "saveInvokeFunction") {
          await push(msg.nodeId, () => setInvokeFunctionAction(currentBody, msg.nodeId, msg.attrs, msg.paramBindings));
        } else if (msg.type === "saveActionField") {
          await push(msg.nodeId, () => setActionField(currentBody, msg.nodeId, msg.expressionText, msg.fieldInfo));
        }
      }, null, context.subscriptions);
      async function push(nodeId, mutate) {
        try {
          panel.webview.postMessage({ type: "saving" });
          const newBody = mutate();
          const rawTs = await bpmClient.getBpmMethodRaw("BO", directive.BpMethodCode);
          const updated = patchBody(rawTs, directive.DirectiveID, newBody);
          const result = await bpmClient.updateBpmRaw(updated);
          const errs = (result?.returnObj?.BpMessageSvc || []).filter((m) => m.Severity > 1);
          if (errs.length) throw new Error(errs.map((e) => e.Message).join("; "));
          currentBody = newBody;
          directive.Body = newBody;
          panel.webview.postMessage({ type: "saved" });
          vscode2.window.showInformationMessage(`BPM: "${directive.Name}" saved.`);
        } catch (err) {
          panel.webview.postMessage({ type: "saveError", message: err.message });
          vscode2.window.showErrorMessage(`BPM Widget push failed: ${err.message}`);
        }
      }
    }
    function patchBody(raw, directiveId, newBodyXaml) {
      const arrayStart = raw.indexOf('"BpDirective":[');
      if (arrayStart < 0) throw new Error("BpDirective array not found in tableset");
      const idNeedle = `"DirectiveID":"${directiveId}"`;
      let cursor = raw.indexOf("[", arrayStart) + 1;
      while (cursor < raw.length) {
        const objStart = raw.indexOf("{", cursor);
        if (objStart < 0) break;
        let depth = 0, inStr = false, esc = false, objEnd = -1;
        for (let i = objStart; i < raw.length; i++) {
          const ch = raw[i];
          if (inStr) {
            if (esc) {
              esc = false;
              continue;
            }
            if (ch === "\\") {
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
          if (ch === "{") depth++;
          else if (ch === "}") {
            depth--;
            if (!depth) {
              objEnd = i;
              break;
            }
          }
        }
        if (objEnd < 0) throw new Error("Malformed BpDirective object in tableset");
        const objStr = raw.slice(objStart, objEnd + 1);
        if (!objStr.includes(idNeedle)) {
          cursor = objEnd + 1;
          continue;
        }
        const bodyKey = '"Body":"';
        const bk = objStr.indexOf(bodyKey);
        if (bk < 0) throw new Error("Body field not found in directive row");
        const vs = bk + bodyKey.length;
        let ve = vs, escaped = false;
        while (ve < objStr.length) {
          const ch = objStr[ve];
          if (escaped) {
            escaped = false;
            ve++;
            continue;
          }
          if (ch === "\\") {
            escaped = true;
            ve++;
            continue;
          }
          if (ch === '"') break;
          ve++;
        }
        const newBodyEncoded = JSON.stringify(newBodyXaml).slice(1, -1);
        const newObj = objStr.slice(0, vs) + newBodyEncoded + objStr.slice(ve);
        let result = raw.slice(0, objStart) + objStr + "," + newObj + raw.slice(objEnd + 1);
        const rmNeedle = '"BitFlag":0,"RowMod":""';
        const rmIdx = result.indexOf(rmNeedle, objStart + objStr.length + 1);
        if (rmIdx < 0) throw new Error(`RowMod anchor not found for directive ${directiveId}`);
        return result.slice(0, rmIdx) + '"BitFlag":0,"RowMod":"U"' + result.slice(rmIdx + rmNeedle.length);
      }
      throw new Error(`Directive ${directiveId} not found in tableset`);
    }
    function errorHtml(msg) {
      return `<!DOCTYPE html><html><body style="color:#f87171;font-family:sans-serif;padding:24px;background:#1e1e1e;font-size:13px">${msg}</body></html>`;
    }
    function buildHtml(dirName, typeLabel, graph) {
      const n = genNonce();
      const gj = JSON.stringify(graph);
      const dj = JSON.stringify(dirName);
      const tj = JSON.stringify(typeLabel);
      return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${n}';">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#1e1e1e;color:#d4d4d4;font-family:var(--vscode-font-family,system-ui,sans-serif);font-size:13px;display:flex;flex-direction:column;height:100vh;overflow:hidden}
#hdr{padding:8px 12px;background:#252526;border-bottom:1px solid #3e3e42;display:flex;align-items:center;gap:8px;flex-shrink:0}
#hdr h2{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.badge{background:#0e639c;color:#fff;padding:2px 8px;border-radius:3px;font-size:11px}
#cwrap{flex:1;overflow:auto;position:relative;min-height:150px}
#canvas{position:relative}
#esvg{position:absolute;top:0;left:0;pointer-events:none;overflow:visible}
.nd{position:absolute;border-radius:5px;border:2px solid;padding:6px 10px;cursor:pointer;user-select:none;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:filter .1s}
.nd:hover{filter:brightness(1.25)}
.nd.sel{outline:2px solid rgba(255,255,255,.7);outline-offset:2px}
.nl{font-size:11px;font-weight:600;text-align:center;line-height:1.3}
.ns{font-size:10px;opacity:.6;text-align:center;margin-top:2px}
#props{flex-shrink:0;border-top:1px solid #3e3e42;background:#252526;max-height:260px;overflow-y:auto}
#pi{padding:10px 12px}
#pt{font-weight:600;margin-bottom:6px;font-size:12px;color:#9ca3af}
textarea,input[type=text]{width:100%;background:#1e1e1e;color:#d4d4d4;border:1px solid #3e3e42;border-radius:3px;padding:5px 7px;font-family:'Menlo','Consolas',monospace;font-size:12px}
textarea{resize:vertical;min-height:90px}
button{background:#0e639c;color:#fff;border:none;padding:5px 14px;border-radius:3px;cursor:pointer;font-size:12px;margin-top:6px}
button:hover{background:#1177bb}
button:disabled{opacity:.5;cursor:default}
.ro{color:#6b7280;font-style:italic;font-size:12px}
.ar{font-size:11px;margin:2px 0}.ak{color:#9ca3af}
</style></head><body>
<div id="hdr"><h2 id="dn"></h2><span id="db" class="badge"></span></div>
<div id="cwrap"><div id="canvas">
<svg id="esvg"><defs><marker id="arr" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3z" fill="#6b7280"/></marker></defs></svg>
</div></div>
<div id="props"><div id="pi">
<div id="pt">Click a node to inspect or edit</div>
<div id="pb"></div>
</div></div>
<script nonce="${n}">
const vscode=acquireVsCodeApi();
const G=${gj},DN=${dj},TL=${tj};
const NW=160,NH=56,CW=140,CH=70,PAD=60;
const ST={
  CustomCodeAction:        {bg:'#3b1f5e',bd:'#7c3aed',fg:'#e9d5ff'},
  CustomCodeCondition:     {bg:'#1e3a5f',bd:'#2563eb',fg:'#bfdbfe'},
  EnableDirectivesAction:  {bg:'#14532d',bd:'#16a34a',fg:'#bbf7d0'},
  EnablePostDirectiveAction:{bg:'#14532d',bd:'#16a34a',fg:'#bbf7d0'},
  RaiseExceptionAction:    {bg:'#7f1d1d',bd:'#dc2626',fg:'#fecaca'},
  SetDataFieldAction:      {bg:'#164e63',bd:'#0891b2',fg:'#a5f3fc'},
  CallMethodAction:        {bg:'#1a2f5e',bd:'#1d4ed8',fg:'#bfdbfe'},
  CompleteMethodCallAction:{bg:'#14432d',bd:'#059669',fg:'#a7f3d0'},
  SendEmailAction:         {bg:'#1e3040',bd:'#0ea5e9',fg:'#bae6fd'},
  LogMessageAction:        {bg:'#2d2d2d',bd:'#6b7280',fg:'#e5e7eb'},
  ShowMessageAction:       {bg:'#2d2d2d',bd:'#6b7280',fg:'#e5e7eb'},
  InvokeEpicorFunctionAction2:{bg:'#1a2a3a',bd:'#38bdf8',fg:'#7dd3fc'},
  InvokeEpicorFunctionAction: {bg:'#1a2a3a',bd:'#38bdf8',fg:'#7dd3fc'},
  SetBpmDataFieldAction:   {bg:'#1a3040',bd:'#0284c7',fg:'#7dd3fc'},
};
const DS={bg:'#2d2d2d',bd:'#6b7280',fg:'#e5e7eb'};
document.getElementById('dn').textContent=DN;
document.getElementById('db').textContent=TL;
const nm={};G.nodes.forEach(n=>nm[n.id]=n);
// Auto-layout fallback: if all nodes cluster at (0,0) positions weren't parsed
const allZero=G.nodes.every(n=>n.x===0&&n.y===0);
if(allZero&&G.nodes.length>0){
  // BFS from start, assign positions in rows
  const visited=new Set(),queue=[{id:G.nodes[0].id,col:0,row:0}];
  const rowCounts={};
  while(queue.length){
    const {id,row}=queue.shift();
    if(visited.has(id))continue;
    visited.add(id);
    rowCounts[row]=(rowCounts[row]||0);
    const col=rowCounts[row]++;
    const n=nm[id];
    if(n){n.x=PAD+col*200;n.y=PAD+row*120;}
    G.edges.filter(e=>e.from===id&&e.to).forEach(e=>queue.push({id:e.to,col:0,row:row+1}));
  }
}
let mx=400,my=300;
G.nodes.forEach(n=>{const w=n.type==='condition'?CW:NW,h=n.type==='condition'?CH:NH;mx=Math.max(mx,n.x+w+PAD);my=Math.max(my,n.y+h+PAD);});
const cv=document.getElementById('canvas');
cv.style.width=mx+'px';cv.style.height=my+'px';
const sv=document.getElementById('esvg');
sv.setAttribute('width',mx);sv.setAttribute('height',my);
G.nodes.forEach(n=>{
  const w=n.type==='condition'?CW:NW,h=n.type==='condition'?CH:NH;
  const s=ST[n.widget?.localName]||DS;
  const d=document.createElement('div');
  d.className='nd';d.dataset.id=n.id;
  d.style.cssText='left:'+n.x+'px;top:'+n.y+'px;width:'+w+'px;height:'+h+'px;background:'+s.bg+';border-color:'+s.bd+';color:'+s.fg;
  const l=document.createElement('div');l.className='nl';
  l.textContent=n.widget?.label||(n.type==='condition'?'Condition':'Step');
  d.appendChild(l);
  if(n.type==='condition'){const ss=document.createElement('div');ss.className='ns';ss.textContent='True / False';d.appendChild(ss);}
  d.addEventListener('click',()=>sel(n.id));
  cv.appendChild(d);
});
G.edges.forEach(e=>{
  if(!e.from||!e.to)return;
  const s=nm[e.from],d=nm[e.to];if(!s||!d)return;
  const sw=s.type==='condition'?CW:NW,sh=s.type==='condition'?CH:NH,dw=d.type==='condition'?CW:NW;
  const sx=s.x+sw/2,sy=s.y+sh,tx=d.x+dw/2,ty=d.y;
  const c=Math.max(40,Math.abs(ty-sy)*.5);
  const p=document.createElementNS('http://www.w3.org/2000/svg','path');
  p.setAttribute('d','M'+sx+','+sy+' C'+sx+','+(sy+c)+' '+tx+','+(ty-c)+' '+tx+','+ty);
  p.setAttribute('stroke','#6b7280');p.setAttribute('stroke-width','1.5');
  p.setAttribute('fill','none');p.setAttribute('marker-end','url(#arr)');
  sv.appendChild(p);
  if(e.label){
    const t=document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('x',(sx+tx)/2+4);t.setAttribute('y',(sy+ty)/2);
    t.setAttribute('fill','#9ca3af');t.setAttribute('font-size','11');
    t.textContent=e.label;sv.appendChild(t);
  }
});
// Structural attrs \u2014 never display or edit these
const STRUCTURAL=new Set(['Id','ValidationState','TerminateOnError','IsNewRow','RowMod','BitFlag','SysRevID','SysRowID']);
// Whitelisted editable attrs per widget type. Multiple candidates per concept
// because Epicor uses slightly different names across versions.
// Only attrs that actually exist on the node element will be shown.
const EDITABLE={
  SetDataFieldAction:        [{k:'TableName'},{k:'FieldName'},{k:'NewValue'},{k:'Value'},{k:'SetValueType'},{k:'ValueType'}],
  EnableDirectivesAction:    [{k:'DirectiveName'},{k:'GroupName'},{k:'DirectiveGroup'}],
  EnablePostDirectiveAction: [{k:'DirectiveName'},{k:'GroupName'},{k:'DirectiveGroup'}],
  FieldCondition:            [{k:'LeftValue'},{k:'Left'},{k:'FieldName'},{k:'Operator'},{k:'RightValue'},{k:'Right'},{k:'CompareValue'}],
  LogMessageAction:          [{k:'Message',rows:3},{k:'Severity'}],
  ShowMessageAction:         [{k:'Message',rows:3},{k:'Title'}],
  CallMethodAction:          [{k:'SvcCode'},{k:'MethodCode'},{k:'BOName'},{k:'MethodName'}],
  CompleteMethodCallAction:  [{k:'SvcCode'},{k:'MethodCode'},{k:'BOName'},{k:'MethodName'}],
  SendEmailAction:           [{k:'To'},{k:'CC'},{k:'From'},{k:'Subject'},{k:'Body',rows:4}],
  ActivityTrackingAction:    [{k:'Description'},{k:'Status'}],
  AttachDataTagAction:       [{k:'TagID'},{k:'DataTagID'}],
  RemoveDataTagAction:       [{k:'TagID'},{k:'DataTagID'}],
  InvokeFunctionAction:      [{k:'FunctionCode'},{k:'LibraryCode'}],
  InvokeExternalMethodAction:[{k:'AssemblyName'},{k:'TypeName'},{k:'MethodName'}],
  BpmDataFormAction:         [{k:'FormId'},{k:'ShowAlways'},{k:'Company'},{k:'CustomizationId'},{k:'CustomizationKey1'},{k:'CustomizationKey3'},{k:'CustomizationTypeCode'}],
  BpmDataFormAction2:        [{k:'FormId'},{k:'ShowAlways'},{k:'Company'},{k:'CustomizationId'},{k:'CustomizationKey1'},{k:'CustomizationKey3'},{k:'CustomizationTypeCode'}],
};
let sid=null;
function addLbl(parent,text){const d=document.createElement('div');d.style.cssText='font-size:11px;color:#9ca3af;margin-top:6px;margin-bottom:2px';d.textContent=text;parent.appendChild(d);}
function addRo(parent,k,v){const d=document.createElement('div');d.className='ar';d.innerHTML='<span class="ak">'+esc(k)+':</span> '+esc(String(v));parent.appendChild(d);}
function mkInput(v,rows){
  if(rows&&rows>1){const t=document.createElement('textarea');t.value=v;t.rows=rows;return t;}
  const i=document.createElement('input');i.type='text';i.value=v;return i;
}
function sel(id){
  document.querySelectorAll('.nd.sel').forEach(e=>e.classList.remove('sel'));
  const el=document.querySelector('.nd[data-id="'+CSS.escape(id)+'"]');
  if(el)el.classList.add('sel');
  sid=id;
  const n=nm[id];if(!n)return;
  const pt=document.getElementById('pt'),pb=document.getElementById('pb');
  pt.textContent=n.widget?.label||n.type;pt.style.color='#d4d4d4';
  pb.innerHTML='';
  const wn=n.widget?.localName||'';
  const attrs=n.widget?.attrs||{};

  if(wn==='CustomCodeAction'||wn==='CustomCodeCondition'){
    addLbl(pb,'C# Code');
    const ta=document.createElement('textarea');ta.value=n.widget.code||'';ta.rows=7;pb.appendChild(ta);
    const btn=mkBtn('Push to Epicor',()=>{btn.disabled=true;btn.textContent='Saving\u2026';vscode.postMessage({type:'saveCode',nodeId:id,code:ta.value});});
    pb.appendChild(btn);
    return;
  }
  if(wn==='RaiseExceptionAction'){
    addLbl(pb,'Exception Message');
    const inp=document.createElement('input');inp.type='text';inp.value=n.widget.message||'';inp.placeholder='Exception message\u2026';pb.appendChild(inp);
    const btn=mkBtn('Push to Epicor',()=>{btn.disabled=true;btn.textContent='Saving\u2026';vscode.postMessage({type:'saveMessage',nodeId:id,message:inp.value});});
    pb.appendChild(btn);
    return;
  }
  if(wn==='ConditionBlock'){
    const conds=n.widget.conditions||[];
    if(!conds.length){const d=document.createElement('div');d.className='ro';d.textContent='No child conditions found in XAML.';pb.appendChild(d);return;}
    // Actual XAML enum values (Epicor uses these, not Equal/NotEqual)
    const COND_OPS=[['EqualsTo','is equal to'],['NotEqualsTo','is not equal to'],['LessThen','is less than'],['LessThenOrEquals','is less or equal to'],['MoreThen','is more than'],['MoreThenOrEquals','is more or equal to'],['BeginsWith','begins with'],['EndsWith','ends with'],['Contains','contains'],['Matches','matches']];
    const ITEM_OPS=[['None','(first)'],['And','AND'],['Or','OR']];
    const condInputMaps=[];
    conds.forEach((cond,ci)=>{
      if(ci>0){const hr=document.createElement('div');hr.style.cssText='margin:10px 0 4px;border-top:1px solid #3e3e42';pb.appendChild(hr);}
      const hdr=document.createElement('div');hdr.style.cssText='font-size:10px;color:#6b7280;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em';
      hdr.textContent=(ci===0?'':'')+'Condition '+(ci+1);pb.appendChild(hdr);
      const im={condAttrs:{},expressionInp:null,itemOpSel:null};

      // AND/OR connector (ConditionBlockItem.Operator)
      if(ci>0){
        addLbl(pb,'Join operator');
        const sel=document.createElement('select');
        sel.style.cssText='width:100%;background:#1e1e1e;color:#d4d4d4;border:1px solid #3e3e42;border-radius:3px;padding:5px 7px;font-size:12px';
        ITEM_OPS.forEach(([val,lbl])=>{const o=document.createElement('option');o.value=val;o.textContent=lbl;if(val===cond.itemOperator)o.selected=true;sel.appendChild(o);});
        pb.appendChild(sel);im.itemOpSel=sel;
      }

      // Field info \u2014 editable (table + column as separate inputs)
      let tableInp=null,colInp=null;
      if(cond.fieldInfo){
        addLbl(pb,'Table');
        tableInp=document.createElement('input');tableInp.type='text';tableInp.value=cond.fieldInfo.tableName||'';pb.appendChild(tableInp);
        addLbl(pb,'Column');
        colInp=document.createElement('input');colInp.type='text';colInp.value=cond.fieldInfo.columnName||'';pb.appendChild(colInp);
      }
      im.tableInp=tableInp;im.colInp=colInp;

      // Condition operator (EqualsTo, MoreThen, etc.)
      const opVal=cond.attrs['Operator']||'';
      if(opVal){
        addLbl(pb,'Operator');
        const sel=document.createElement('select');
        sel.style.cssText='width:100%;background:#1e1e1e;color:#d4d4d4;border:1px solid #3e3e42;border-radius:3px;padding:5px 7px;font-size:12px';
        COND_OPS.forEach(([val,lbl])=>{const o=document.createElement('option');o.value=val;o.textContent=lbl;if(val===opVal)o.selected=true;sel.appendChild(o);});
        if(!COND_OPS.find(([v])=>v===opVal)){const o=document.createElement('option');o.value=opVal;o.textContent=opVal;o.selected=true;sel.appendChild(o);}
        pb.appendChild(sel);im.condAttrs['Operator']=sel;
      }

      // Filter attr (Added/Updated/Changed) if present
      const filterVal=cond.attrs['Filter'];
      if(filterVal!==undefined){
        addLbl(pb,'Filter (row state)');
        const inp=document.createElement('input');inp.type='text';inp.value=filterVal;
        pb.appendChild(inp);im.condAttrs['Filter']=inp;
      }

      // Expression text (the value being compared)
      if(cond.expressionText!==null&&cond.expressionText!==undefined){
        addLbl(pb,'Comparison (C# Expression)');
        const inp=document.createElement('input');inp.type='text';inp.value=cond.expressionText;
        pb.appendChild(inp);im.expressionInp=inp;
      }

      // CustomCodeCondition: show code
      if(cond.localName==='CustomCodeCondition'&&cond.attrs['Code']!==undefined){
        addLbl(pb,'C# Code');
        const ta=document.createElement('textarea');ta.value=cond.attrs['Code']||'';ta.rows=5;
        pb.appendChild(ta);im.condAttrs['Code']=ta;
      }

      condInputMaps.push({index:ci,map:im});
    });
    const btn=mkBtn('Push to Epicor',()=>{
      const updates=condInputMaps.map(({index,map})=>{
        const condAttrs={};
        Object.entries(map.condAttrs).forEach(([k,el])=>{condAttrs[k]=el.value;});
        const u={index,conditionAttrs:condAttrs};
        if(map.expressionInp)u.expressionText=map.expressionInp.value;
        if(map.itemOpSel)u.itemOperator=map.itemOpSel.value;
        if(map.tableInp||map.colInp)u.fieldInfo={tableName:map.tableInp?.value,columnName:map.colInp?.value};
        return u;
      });
      btn.disabled=true;btn.textContent='Saving\u2026';
      vscode.postMessage({type:'saveConditions',nodeId:id,conditions:updates});
    });
    pb.appendChild(btn);
    return;
  }

  if(wn==='InvokeEpicorFunctionAction2'||wn==='InvokeEpicorFunctionAction'){
    addLbl(pb,'Function ID');
    const fidInp=document.createElement('input');fidInp.type='text';fidInp.value=attrs['FunctionId']||'';pb.appendChild(fidInp);
    addLbl(pb,'Library ID');
    const lidInp=document.createElement('input');lidInp.type='text';lidInp.value=attrs['LibraryId']||'';pb.appendChild(lidInp);
    const pbs=n.widget.paramBindings||[];
    const paramInputs={};
    const inputs=pbs.filter(p=>p.paramDirection==='Input');
    const outputs=pbs.filter(p=>p.paramDirection==='Output');
    function secHdr(txt){const d=document.createElement('div');d.style.cssText='font-size:10px;color:#6b7280;margin-top:10px;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em';d.textContent=txt;pb.appendChild(d);}
    if(inputs.length){secHdr('Input Parameters');inputs.forEach(p=>{addLbl(pb,p.paramName+' \u2192');const inp=document.createElement('input');inp.type='text';inp.value=p.variableName;pb.appendChild(inp);paramInputs[p.paramName]=inp;});}
    if(outputs.length){secHdr('Output Parameters');outputs.forEach(p=>{addLbl(pb,p.paramName+' \u2190');const inp=document.createElement('input');inp.type='text';inp.value=p.variableName;pb.appendChild(inp);paramInputs[p.paramName]=inp;});}
    const btn=mkBtn('Push to Epicor',()=>{
      const updatedParams=(n.widget.paramBindings||[]).map(p=>({paramName:p.paramName,variableName:paramInputs[p.paramName]?paramInputs[p.paramName].value:p.variableName}));
      btn.disabled=true;btn.textContent='Saving\u2026';
      vscode.postMessage({type:'saveInvokeFunction',nodeId:id,attrs:{FunctionId:fidInp.value,LibraryId:lidInp.value},paramBindings:updatedParams});
    });
    pb.appendChild(btn);
    return;
  }
  if(wn==='SetBpmDataFieldAction'){
    const fi=n.widget.actionFieldInfo||{};
    const et=n.widget.actionExpressionText;
    addLbl(pb,'Table');
    const tblInp=document.createElement('input');tblInp.type='text';tblInp.value=fi.tableName||'';pb.appendChild(tblInp);
    addLbl(pb,'Column');
    const colInp=document.createElement('input');colInp.type='text';colInp.value=fi.columnName||'';pb.appendChild(colInp);
    let expInp=null;
    if(et!==null&&et!==undefined){
      addLbl(pb,'Value (C# Expression)');
      expInp=document.createElement('input');expInp.type='text';expInp.value=et;pb.appendChild(expInp);
    }
    const btn=mkBtn('Push to Epicor',()=>{
      btn.disabled=true;btn.textContent='Saving\u2026';
      vscode.postMessage({type:'saveActionField',nodeId:id,expressionText:expInp?expInp.value:undefined,fieldInfo:{tableName:tblInp.value,columnName:colInp.value}});
    });
    pb.appendChild(btn);
    return;
  }
  // Generic whitelist-driven editor
  const specs=EDITABLE[wn]||[];
  const allPairs=Object.entries(attrs).filter(([k])=>!k.startsWith('xmlns')&&!k.startsWith('x:')&&!STRUCTURAL.has(k));
  const editableKeySet=new Set(specs.map(s=>s.k));
  const editPairs=allPairs.filter(([k])=>editableKeySet.has(k));
  const roPairs  =allPairs.filter(([k])=>!editableKeySet.has(k));

  const inputMap={};
  if(editPairs.length){
    // Render inputs in whitelist order so related fields stay grouped
    specs.filter(s=>editPairs.find(([k])=>k===s.k)).forEach(s=>{
      const pair=editPairs.find(([k])=>k===s.k);if(!pair)return;
      const [k,v]=pair;
      addLbl(pb,k);
      const inp=mkInput(v,s.rows);pb.appendChild(inp);
      inputMap[k]=inp;
    });
    const btn=mkBtn('Push to Epicor',()=>{
      const toSave={};
      Object.entries(inputMap).forEach(([k,inp])=>{toSave[k]=inp.value;});
      btn.disabled=true;btn.textContent='Saving\u2026';
      vscode.postMessage({type:'saveAttrs',nodeId:id,attrs:toSave});
    });
    pb.appendChild(btn);
  } else if(!n.widget){
    const d=document.createElement('div');d.className='ro';d.textContent='No widget data.';pb.appendChild(d);
  } else if(specs.length===0){
    const d=document.createElement('div');d.className='ro';d.textContent='Read-only \u2014 no editable properties defined for '+wn+'.';pb.appendChild(d);
  } else {
    const d=document.createElement('div');d.className='ro';d.textContent='No recognised attributes found on this node. Check read-only attrs below.';pb.appendChild(d);
  }

  if(roPairs.length){
    if(editPairs.length){const hr=document.createElement('div');hr.style.cssText='margin:10px 0 4px;border-top:1px solid #3e3e42';pb.appendChild(hr);}
    const lbl=document.createElement('div');lbl.style.cssText='font-size:10px;color:#6b7280;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em';lbl.textContent='Other attributes (read-only)';pb.appendChild(lbl);
    roPairs.forEach(([k,v])=>addRo(pb,k,v));
  }
}
function mkBtn(t,fn){const b=document.createElement('button');b.textContent=t;b.onclick=fn;return b;}
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
window.addEventListener('message',e=>{
  const m=e.data,btn=document.querySelector('button:disabled');
  if(m.type==='saved'&&btn){btn.disabled=false;btn.textContent='Push to Epicor';}
  else if(m.type==='saveError'&&btn){btn.disabled=false;btn.textContent='Retry Push';}
});
</script>
</body></html>`;
    }
    function genNonce() {
      let s = "";
      const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      for (let i = 0; i < 32; i++) s += c[Math.floor(Math.random() * c.length)];
      return s;
    }
    module2.exports = { openWidgetPanel: openWidgetPanel2 };
  }
});

// src/updater.js
var require_updater = __commonJS({
  "src/updater.js"(exports2) {
    "use strict";
    var __importStar2 = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") result[k[i]] = mod[k[i]];
        }
        result["default"] = mod;
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.registerUpdateCommand = registerUpdateCommand;
    exports2.checkForUpdatesOnStartup = checkForUpdatesOnStartup;
    var vscode2 = __importStar2(require("vscode"));
    var https = __importStar2(require("https"));
    var fs2 = __importStar2(require("fs"));
    var path2 = __importStar2(require("path"));
    var os = __importStar2(require("os"));
    var GITHUB_OWNER = "mbcpi";
    var GITHUB_REPO = "epicor-customcode-manager";
    var EXTENSION_PUBLISHER = "micah-bragg";
    var RELEASES_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
    var SNOOZE_KEY = "efx.updateSnoozedVersion";
    function isNewer(localVersion, remoteVersion) {
      const parse = (v) => String(v || "0").replace(/^v/, "").split(".").map((n) => parseInt(n) || 0);
      const [lMaj, lMin, lPatch] = parse(localVersion);
      const [rMaj, rMin, rPatch] = parse(remoteVersion);
      if (rMaj !== lMaj) return rMaj > lMaj;
      if (rMin !== lMin) return rMin > lMin;
      return rPatch > lPatch;
    }
    function fetchJson(url, redirectsLeft = 3) {
      return new Promise((resolve, reject) => {
        const req = https.get(url, {
          headers: { "User-Agent": "epicor-efx-manager-vscode" }
        }, (res) => {
          if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location && redirectsLeft > 0) {
            return resolve(fetchJson(res.headers.location, redirectsLeft - 1));
          }
          if (res.statusCode !== 200) {
            res.resume();
            return reject(new Error(`GitHub API returned ${res.statusCode}`));
          }
          let data = "";
          res.on("data", (c) => {
            data += c;
          });
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error("Failed to parse GitHub API response"));
            }
          });
        });
        req.on("error", reject);
        req.setTimeout(1e4, () => {
          req.destroy();
          reject(new Error("Update check timed out"));
        });
      });
    }
    function downloadFile(url, destPath, redirectsLeft = 5) {
      return new Promise((resolve, reject) => {
        const file = fs2.createWriteStream(destPath);
        const req = https.get(url, {
          headers: { "User-Agent": "epicor-efx-manager-vscode" }
        }, (res) => {
          if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location && redirectsLeft > 0) {
            file.close();
            fs2.unlink(destPath, () => {
            });
            return resolve(downloadFile(res.headers.location, destPath, redirectsLeft - 1));
          }
          if (res.statusCode !== 200) {
            file.close();
            fs2.unlink(destPath, () => {
            });
            return reject(new Error(`Download failed: HTTP ${res.statusCode}`));
          }
          res.pipe(file);
          file.on("finish", () => file.close(resolve));
          file.on("error", (err) => {
            fs2.unlink(destPath, () => {
            });
            reject(err);
          });
        });
        req.on("error", (err) => {
          fs2.unlink(destPath, () => {
          });
          reject(err);
        });
        req.setTimeout(6e4, () => {
          req.destroy();
          reject(new Error("Download timed out"));
        });
      });
    }
    async function getLatestRelease() {
      const data = await fetchJson(RELEASES_API);
      const asset = (data.assets || []).find((a) => a.name && a.name.endsWith(".vsix"));
      if (!asset) throw new Error("No .vsix asset found in latest GitHub release");
      return {
        version: (data.tag_name || "").replace(/^v/, ""),
        tagName: data.tag_name || "",
        releaseNotes: data.body || "",
        downloadUrl: asset.browser_download_url,
        assetName: asset.name
      };
    }
    async function installRelease(release) {
      const tmpPath = path2.join(os.tmpdir(), release.assetName);
      await vscode2.window.withProgress(
        { location: vscode2.ProgressLocation.Notification, title: `EFx: Downloading v${release.version}...`, cancellable: false },
        async () => {
          await downloadFile(release.downloadUrl, tmpPath);
        }
      );
      const vsixUri = vscode2.Uri.file(tmpPath);
      await vscode2.commands.executeCommand("workbench.extensions.installExtension", vsixUri);
      setTimeout(() => {
        try {
          fs2.unlinkSync(tmpPath);
        } catch (_) {
        }
      }, 5e3);
      const reload = await vscode2.window.showInformationMessage(
        `EFx Manager updated to v${release.version}. Reload window to activate?`,
        "Reload Now",
        "Later"
      );
      if (reload === "Reload Now") {
        await vscode2.commands.executeCommand("workbench.action.reloadWindow");
      }
    }
    async function checkForUpdates(context, silent = false) {
      const ext = vscode2.extensions.getExtension(`${EXTENSION_PUBLISHER}.epicor-efx-manager`);
      const localVersion = ext?.packageJSON?.version || "0.0.0";
      let release;
      try {
        release = await getLatestRelease();
      } catch (err) {
        if (!silent) {
          vscode2.window.showWarningMessage(`EFx: Update check failed \u2014 ${err.message}`);
        }
        return;
      }
      if (!isNewer(localVersion, release.version)) {
        if (!silent) {
          vscode2.window.showInformationMessage(`EFx Manager is up to date (v${localVersion})`);
        }
        return;
      }
      const snoozed = context.globalState.get(SNOOZE_KEY, "");
      if (silent && snoozed === release.version) return;
      const choice = await vscode2.window.showInformationMessage(
        `EFx Manager v${release.version} is available (you have v${localVersion})`,
        "Update Now",
        "Later"
      );
      if (choice === "Update Now") {
        try {
          await installRelease(release);
        } catch (err) {
          vscode2.window.showErrorMessage(`EFx: Update failed \u2014 ${err.message}`);
        }
      } else if (choice === "Later") {
        await context.globalState.update(SNOOZE_KEY, release.version);
      }
    }
    function registerUpdateCommand(context) {
      context.subscriptions.push(
        vscode2.commands.registerCommand("efx.checkForUpdates", async () => {
          await checkForUpdates(
            context,
            /* silent */
            false
          );
        })
      );
    }
    function checkForUpdatesOnStartup(context) {
      setTimeout(() => {
        checkForUpdates(
          context,
          /* silent */
          true
        ).catch(() => {
        });
      }, 5e3);
    }
  }
});

// src/kineticLayerClient.js
var require_kineticLayerClient = __commonJS({
  "src/kineticLayerClient.js"(exports2) {
    "use strict";
    var https = require("https");
    var http = require("http");
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
        properties: "properties"
      };
      const result = {};
      for (const [filename, content] of Object.entries(files || {})) {
        if (!content) continue;
        const base = filename.replace(/\.jsonc?$/, "");
        if (fieldMap[base]) {
          try {
            result[fieldMap[base]] = JSON.parse(content);
          } catch {
          }
        }
      }
      return result;
    }
    var KineticMetaFXClient = class {
      constructor(config) {
        this.config = config;
      }
      _getHeaders() {
        const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString("base64");
        const headers = {
          "Content-Type": "application/json",
          "Authorization": `Basic ${auth}`
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
              "Content-Length": Buffer.byteLength(bodyStr)
            },
            rejectUnauthorized: false
          };
          const req = mod.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => {
              data += chunk;
            });
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
                console.error(`[MetaFX] ${method} failed ${res.statusCode}: body=`, data.slice(0, 2e3));
                console.error(`[MetaFX] ${method} request body was:`, bodyStr.slice(0, 1e3));
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
          parsed.searchParams.set("request", JSON.stringify(params));
          const isHttps = parsed.protocol === "https:";
          const mod = isHttps ? https : http;
          const hdrs = this._getHeaders();
          delete hdrs["Content-Type"];
          const options = {
            hostname: parsed.hostname,
            port: parsed.port || (isHttps ? 443 : 80),
            path: parsed.pathname + "?" + parsed.searchParams.toString(),
            method: "GET",
            headers: hdrs,
            rejectUnauthorized: false
          };
          const req = mod.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => {
              data += chunk;
            });
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
                  const e = JSON.parse(data);
                  msg = e.error?.message || e.ErrorMessage || data;
                } catch {
                  msg = data || msg;
                }
                console.error(`[MetaFX] GET ${method} failed ${res.statusCode}:`, data.slice(0, 1e3));
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
          request: { Type: "view", SubType: "", SearchText: "", IncludeAllLayers: true }
        });
        return Array.isArray(result?.returnObj) ? result.returnObj : [];
      }
      // Get layer descriptors for a specific app (used to build the ExportLayers payload).
      // Uses GetLayers — GetApp returns merged app content, not a layer list.
      async getLayers(viewId) {
        const result = await this._call("GetLayers", {
          request: { ViewId: viewId, IncludeUnpublishedLayers: true }
        });
        const obj = result?.returnObj;
        if (Array.isArray(obj)) return obj;
        if (obj && typeof obj === "object") {
          const KNOWN_KEYS = [
            "Layers",
            "layers",
            "EpMetaFXLayerForApplicationList",
            "LayerList",
            "value",
            "Value",
            "data",
            "Data",
            "items",
            "Items",
            "Result",
            "result",
            "EpMetaFXLayerList",
            "AppLayerList",
            "LayerDescriptors"
          ];
          for (const k of KNOWN_KEYS) {
            if (Array.isArray(obj[k])) return obj[k];
          }
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
        console.log(`[MetaFX] getAppForLayer \u2192 viewId="${viewId}" layer="${layerDescription}"`);
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
            debug: false
          }
        };
        console.log(`[MetaFX] getAppForLayer request:`, JSON.stringify(request));
        try {
          const result = await this._get("GetApp", request);
          const obj = result?.returnObj;
          if (!obj) {
            console.error(`[MetaFX] getAppForLayer: empty returnObj. Full response:`, JSON.stringify(result).slice(0, 500));
            return null;
          }
          console.log(`[MetaFX] getAppForLayer OK \u2014 top-level keys:`, Object.keys(obj));
          return obj;
        } catch (e) {
          console.error(`[MetaFX] getAppForLayer failed for layer="${layerDescription}":`, e.message);
          throw e;
        }
      }
      // Find a specific app's metadata (Type, SubType) from the app list on this server.
      async getApplicationInfo(viewId) {
        const apps = await this.listApps();
        return apps.find((a) => a.Id === viewId) || null;
      }
      // Create an empty app shell on this server — required before SaveApp for new apps.
      async getNewApplication(viewId, type, subType) {
        await this._call("GetNewApplication", {
          request: { Id: viewId, Type: type, SubType: subType }
        });
      }
      // Build a layerInfo object for SaveApp / PublishApp.
      // meta: { subType, typeCode, isNew, company, layerDescription, comment, wip }
      _buildLayerInfo(viewId, meta = {}, wip = true) {
        const desc = meta.layerDescription || "";
        return {
          ViewId: viewId,
          LayerDescription: desc,
          LayerName: desc,
          TypeCode: meta.typeCode || "KNTCCustLayer",
          WIP: wip,
          IsNew: meta.isNew || false,
          Company: meta.company || this.config.company || "",
          DeviceType: "Desktop",
          CGCCode: "",
          SystemFlag: false,
          HasDraftContent: wip,
          PublishParentLayers: false,
          CommentText: meta.comment || "",
          ParentLayers: null,
          UserName: null,
          Content: null,
          ChangedOn: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) + "T00:00:00",
          LayerUpdatedToPropDiffFormat: null,
          ProcessedInfo: null,
          LastUpdatedBy: ""
        };
      }
      // Save app content as a draft (WIP). files = Files dict from exportApp().
      // meta: { subType, typeCode, isNew, company, layerDescription, comment }
      async saveApp(viewId, files, meta = {}) {
        const parsed = parseAppFiles(files);
        const subType = meta.subType || parsed.layout?.viewType || "Dashboard";
        const result = await this._call("SaveApp", {
          request: {
            id: viewId,
            viewType: subType,
            ...parsed,
            applicationType: "view",
            subApplicationType: subType,
            uxAppVersion: 0,
            commentText: meta.comment || "",
            deviceType: "Desktop",
            layerInfo: this._buildLayerInfo(viewId, meta, true)
          }
        });
        return result?.returnObj;
      }
      // Publish the saved draft — makes the app live.
      // meta: same shape as saveApp.
      async publishApp(viewId, files, meta = {}) {
        const parsed = parseAppFiles(files);
        const subType = meta.subType || parsed.layout?.viewType || "Dashboard";
        const result = await this._call("PublishApp", {
          request: {
            id: viewId,
            viewType: subType,
            ...parsed,
            applicationType: "view",
            subApplicationType: subType,
            uxAppVersion: 0,
            commentText: meta.comment || "",
            deviceType: "Desktop",
            layerInfo: this._buildLayerInfo(viewId, meta, false)
          }
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
          fileContent: { content: exportedContent, overwrite }
        });
      }
    };
    exports2.KineticMetaFXClient = KineticMetaFXClient;
    exports2.KineticLayerClient = KineticMetaFXClient;
    exports2.KineticAppClient = KineticMetaFXClient;
  }
});

// src/comparePanel.js
var require_comparePanel = __commonJS({
  "src/comparePanel.js"(exports2) {
    "use strict";
    var vscode2 = require("vscode");
    var { EpicorClient } = require_epicorClient();
    var { BpmClient, extractBpmCode } = require_bpmClient();
    var { KineticMetaFXClient } = require_kineticLayerClient();
    function parseFunctionBody(bodyStr) {
      if (!bodyStr) return { code: "", usings: "" };
      try {
        const b = JSON.parse(bodyStr);
        return { code: b.Code || "", usings: b.Usings || "" };
      } catch {
        return { code: bodyStr, usings: "" };
      }
    }
    function buildFnMap(data) {
      const fns = data.EfxFunction || [];
      const sigs = data.EfxFunctionSignature || [];
      const libs = data.EfxLibrary || [];
      const sigMap = {};
      for (const s of sigs) {
        const k = `${s.LibraryID}|${s.FunctionID}`;
        if (!sigMap[k]) sigMap[k] = { inputs: [], outputs: [] };
        const p = { name: s.ArgumentName, type: s.DataType, order: s.Order };
        (s.Response ? sigMap[k].outputs : sigMap[k].inputs).push(p);
      }
      for (const k of Object.keys(sigMap)) {
        sigMap[k].inputs.sort((a, b) => a.order - b.order);
        sigMap[k].outputs.sort((a, b) => a.order - b.order);
      }
      const refMap = {};
      const addRef = (libId, key, val) => {
        (refMap[libId] = refMap[libId] || {})[key] = (refMap[libId] || {})[key] || [];
        refMap[libId][key].push(val);
      };
      for (const r of data.EfxRefLibrary || []) addRef(r.LibraryID, "libs", r.LibraryRef);
      for (const r of data.EfxRefAssembly || []) addRef(r.LibraryID, "assemblies", r.Assembly);
      for (const r of data.EfxRefService || []) addRef(r.LibraryID, "services", r.ServiceID);
      for (const r of data.EfxRefTable || []) addRef(r.LibraryID, "tables", `${r.TableID} (${r.Updatable ? "rw" : "ro"})`);
      const libDetail = {};
      for (const l of libs) libDetail[l.LibraryID] = l;
      const fnMap = {};
      for (const fn of fns) {
        const { code, usings } = parseFunctionBody(fn.Body);
        if (!fnMap[fn.LibraryID]) fnMap[fn.LibraryID] = {};
        fnMap[fn.LibraryID][fn.FunctionID] = {
          ...fn,
          _code: code,
          _usings: usings,
          _sig: sigMap[`${fn.LibraryID}|${fn.FunctionID}`] || { inputs: [], outputs: [] }
        };
      }
      return { fnMap, refMap, libDetail };
    }
    function compareFn(fa, fb) {
      const fields = {};
      let hasDiff = false;
      for (const [key, label] of [["_code", "Code"], ["_usings", "Usings"]]) {
        const va = fa[key] || "", vb = fb[key] || "", same = va === vb;
        if (!same) hasDiff = true;
        fields[label] = { a: va, b: vb, same };
      }
      for (const key of ["Description", "Kind", "RequireTransaction", "SingleRowMode", "Private", "Disabled"]) {
        const va = String(fa[key] ?? ""), vb = String(fb[key] ?? ""), same = va === vb;
        if (!same) hasDiff = true;
        fields[key] = { a: va, b: vb, same };
      }
      const fmt = (ps) => (ps || []).map((p) => `${p.name}: ${p.type}`).join(", ");
      const sigA = fa._sig || {}, sigB = fb._sig || {};
      for (const [label, key] of [["Inputs", "inputs"], ["Outputs", "outputs"]]) {
        const va = fmt(sigA[key]), vb = fmt(sigB[key]), same = va === vb;
        if (!same) hasDiff = true;
        fields[label] = { a: va, b: vb, same, params_a: sigA[key] || [], params_b: sigB[key] || [] };
      }
      fields.hasDiff = hasDiff;
      return fields;
    }
    var DIFF_WORTHY = ["DirectDBAccess", "AllowCustomCodeFunctions", "AllowCustomCodeWidgets", "Frozen", "Disabled"];
    var INFO_ONLY = ["Description", "Owner", "Revision", "EpicorVersion", "Mode", "Notes", "Package", "PackageVersion", "Publisher", "LockedBy", "LockedOn", "DebugMode", "DumpSources", "AdvTracing"];
    function compareLibRefs(refsA, refsB, detA, detB) {
      const diffs = {};
      let hasDiff = false;
      for (const key of ["libs", "assemblies", "services", "tables"]) {
        const va = [...refsA[key] || []].sort().join("\n");
        const vb = [...refsB[key] || []].sort().join("\n");
        const same = va === vb;
        if (!same) hasDiff = true;
        diffs[key] = { a: va, b: vb, same };
      }
      for (const key of DIFF_WORTHY) {
        const va = String((detA || {})[key] ?? ""), vb = String((detB || {})[key] ?? ""), same = va === vb;
        if (!same) hasDiff = true;
        diffs[key] = { a: va, b: vb, same };
      }
      for (const key of INFO_ONLY) {
        const va = String((detA || {})[key] ?? ""), vb = String((detB || {})[key] ?? "");
        diffs[key] = { a: va, b: vb, same: va === vb, infoOnly: true };
      }
      diffs.hasDiff = hasDiff;
      return diffs;
    }
    function safeFn(fn) {
      if (!fn) return null;
      return {
        FunctionID: fn.FunctionID || "",
        Description: fn.Description || "",
        Kind: fn.Kind,
        RequireTransaction: fn.RequireTransaction,
        SingleRowMode: fn.SingleRowMode,
        Private: fn.Private,
        Disabled: fn.Disabled,
        _code: fn._code || "",
        _usings: fn._usings || "",
        _sig: fn._sig || { inputs: [], outputs: [] }
      };
    }
    function buildLibraryCompare(libListA, libListB, fnMapA, fnMapB, refMapA, refMapB, libDetailA, libDetailB) {
      const allIds = [.../* @__PURE__ */ new Set([
        ...libListA.map((l) => l.LibraryID),
        ...libListB.map((l) => l.LibraryID),
        ...Object.keys(fnMapA),
        ...Object.keys(fnMapB)
      ])].sort();
      const results = [];
      for (const libId of allIds) {
        const inA = libId in fnMapA || libId in libDetailA;
        const inB = libId in fnMapB || libId in libDetailB;
        const fnsA = fnMapA[libId] || {}, fnsB = fnMapB[libId] || {};
        const allFnIds = [.../* @__PURE__ */ new Set([...Object.keys(fnsA), ...Object.keys(fnsB)])].sort();
        const fnDiffs = [];
        for (const fnId of allFnIds) {
          const fa = fnsA[fnId], fb = fnsB[fnId];
          if (!fa) fnDiffs.push({ fnID: fnId, status: "only-b", fa: null, fb: safeFn(fb) });
          else if (!fb) fnDiffs.push({ fnID: fnId, status: "only-a", fa: safeFn(fa), fb: null });
          else {
            const fields = compareFn(fa, fb);
            fnDiffs.push({ fnID: fnId, status: fields.hasDiff ? "diff" : "match", fa: safeFn(fa), fb: safeFn(fb), fields });
          }
        }
        const libDiff = compareLibRefs(refMapA[libId] || {}, refMapB[libId] || {}, libDetailA[libId], libDetailB[libId]);
        let status;
        if (!inA) status = "only-b";
        else if (!inB) status = "only-a";
        else if (fnDiffs.some((f) => f.status !== "match") || libDiff.hasDiff) status = "diff";
        else status = "match";
        results.push({ libID: libId, status, inA, inB, libDiff, fnDiffs });
      }
      return results;
    }
    function compareDirective(da, db) {
      const fields = {};
      let hasDiff = false;
      const cA = da._code || "", cB = db._code || "", codeSame = cA === cB;
      if (!codeSame) hasDiff = true;
      fields.Code = { a: cA, b: cB, same: codeSame };
      for (const key of ["DirectiveType", "IsEnabled", "Sequence"]) {
        const va = String(da[key] ?? ""), vb = String(db[key] ?? ""), same = va === vb;
        if (!same) hasDiff = true;
        fields[key] = { a: va, b: vb, same };
      }
      fields.hasDiff = hasDiff;
      return fields;
    }
    function safeDirective(d) {
      if (!d) return null;
      return {
        name: d.Name || "",
        DirectiveType: d.DirectiveType,
        IsEnabled: d.IsEnabled,
        Sequence: d.Sequence,
        hasCode: d.hasCode || false,
        _code: d._code || ""
      };
    }
    function buildBpmCompare(methodsA, directivesA, methodsB, directivesB) {
      const methodMapA = {}, methodMapB = {};
      for (const m of methodsA) methodMapA[m.BpMethodCode] = m;
      for (const m of methodsB) methodMapB[m.BpMethodCode] = m;
      const dirMapA = {}, dirMapB = {};
      for (const d of directivesA) {
        if (!dirMapA[d.BpMethodCode]) dirMapA[d.BpMethodCode] = {};
        dirMapA[d.BpMethodCode][d.Name] = d;
      }
      for (const d of directivesB) {
        if (!dirMapB[d.BpMethodCode]) dirMapB[d.BpMethodCode] = {};
        dirMapB[d.BpMethodCode][d.Name] = d;
      }
      const allCodes = [.../* @__PURE__ */ new Set([...Object.keys(methodMapA), ...Object.keys(methodMapB)])].sort();
      const serviceMap = {};
      for (const code of allCodes) {
        const m = methodMapA[code] || methodMapB[code];
        const svcKey = `${m.SystemCode || "Erp"}:${m.BusinessObject || code}`;
        if (!serviceMap[svcKey]) serviceMap[svcKey] = { systemCode: m.SystemCode || "Erp", businessObject: m.BusinessObject || code, methods: [] };
        const dirsA = dirMapA[code] || {}, dirsB = dirMapB[code] || {};
        const allDirNames = [.../* @__PURE__ */ new Set([...Object.keys(dirsA), ...Object.keys(dirsB)])].sort();
        const dirDiffs = [];
        for (const name of allDirNames) {
          const da = dirsA[name], db = dirsB[name];
          if (!da) dirDiffs.push({ name, status: "only-b", da: null, db: safeDirective(db) });
          else if (!db) dirDiffs.push({ name, status: "only-a", da: safeDirective(da), db: null });
          else {
            const fields = compareDirective(da, db);
            dirDiffs.push({ name, status: fields.hasDiff ? "diff" : "match", da: safeDirective(da), db: safeDirective(db), fields });
          }
        }
        const inA = code in methodMapA, inB = code in methodMapB;
        let status = !inA ? "only-b" : !inB ? "only-a" : dirDiffs.some((d) => d.status !== "match") ? "diff" : "match";
        serviceMap[svcKey].methods.push({ methodCode: code, methodName: m.Name || code, status, inA, inB, dirDiffs });
      }
      const services = Object.entries(serviceMap).map(([svcKey, svc]) => {
        const diffCount = svc.methods.reduce((n, m) => n + m.dirDiffs.filter((d) => d.status !== "match").length, 0);
        const status = svc.methods.some((m) => m.status !== "match") ? "diff" : "match";
        return { svcKey, systemCode: svc.systemCode, businessObject: svc.businessObject, status, diffCount, methods: svc.methods };
      });
      services.sort((a, b) => {
        const o = { diff: 0, "only-a": 1, "only-b": 2, match: 3 };
        return (o[a.status] ?? 4) - (o[b.status] ?? 4) || a.businessObject.localeCompare(b.businessObject);
      });
      const counts = { match: 0, diff: 0 };
      for (const s of services) counts[s.status] = (counts[s.status] || 0) + 1;
      return { services, counts, total: services.length };
    }
    function sortKeys(v) {
      if (Array.isArray(v)) return v.map(sortKeys);
      if (v && typeof v === "object") return Object.keys(v).sort().reduce((a, k) => {
        a[k] = sortKeys(v[k]);
        return a;
      }, {});
      return v;
    }
    function normalizeJson(str) {
      if (!str || !str.trim()) return str || "";
      try {
        return JSON.stringify(sortKeys(JSON.parse(str)), null, 2);
      } catch {
        return str;
      }
    }
    var ComparePanel2 = class _ComparePanel {
      constructor(panel, context) {
        this.panel = panel;
        this.context = context;
        this.disposed = false;
        this._layerCache = /* @__PURE__ */ new Map();
        panel.webview.onDidReceiveMessage(async (msg) => {
          try {
            switch (msg.command) {
              case "ready":
                this._postProfiles();
                break;
              case "runCompare":
                await this._runFunctionsCompare(msg);
                break;
              case "runBpmCompare":
                await this._runBpmCompare(msg);
                break;
              case "runLayersCompare":
                await this._runLayersCompare(msg);
                break;
              case "fetchLayerList":
                await this._fetchLayerList(msg);
                break;
              case "fetchLayerContent":
                await this._fetchLayerContent(msg);
                break;
              case "openNativeDiff":
                await this._openNativeDiff(msg);
                break;
              case "applyLayer":
                await this._applyLayer(msg);
                break;
            }
          } catch (err) {
            this._post({ command: "error", message: err.message });
          }
        });
        panel.onDidDispose(() => {
          this.disposed = true;
          _ComparePanel.panels.delete(_ComparePanel.KEY);
        });
        panel.webview.html = this.getHtml();
      }
      static show(context) {
        const existing = _ComparePanel.panels.get(_ComparePanel.KEY);
        if (existing && !existing.disposed) {
          existing.panel.reveal();
          return;
        }
        const panel = vscode2.window.createWebviewPanel(
          "efxCompare",
          "Compare",
          vscode2.ViewColumn.Two,
          { enableScripts: true, retainContextWhenHidden: true }
        );
        _ComparePanel.panels.set(_ComparePanel.KEY, new _ComparePanel(panel, context));
      }
      _post(msg) {
        if (!this.disposed) this.panel.webview.postMessage(msg);
      }
      _postProfiles() {
        const profiles = vscode2.workspace.getConfiguration().get("efx.profiles") || [];
        const activeProfile = vscode2.workspace.getConfiguration().get("efx.activeProfile") || "";
        const activeCompany = vscode2.workspace.getConfiguration().get("efx.activeCompany") || "";
        this._post({ command: "profiles", data: profiles.map((p) => ({ name: p.name, companies: p.companies || [] })), activeProfile, activeCompany });
      }
      async _secrets(profileName) {
        const password = await this.context.secrets.get(`efx.profile.${profileName}.password`) || "";
        const apiKey = await this.context.secrets.get(`efx.profile.${profileName}.apiKey`) || "";
        return { password, apiKey };
      }
      async _efxClient(profileName, company) {
        const profiles = vscode2.workspace.getConfiguration().get("efx.profiles") || [];
        const profile = profiles.find((p) => p.name === profileName);
        if (!profile) throw new Error(`Profile "${profileName}" not found`);
        const { password, apiKey } = await this._secrets(profileName);
        return new EpicorClient({ serverUrl: profile.serverUrl, company, username: profile.username, password, apiKey });
      }
      async _metafxClient(profileName, company) {
        const profiles = vscode2.workspace.getConfiguration().get("efx.profiles") || [];
        const profile = profiles.find((p) => p.name === profileName);
        if (!profile) throw new Error(`Profile "${profileName}" not found`);
        const { password, apiKey } = await this._secrets(profileName);
        return new KineticMetaFXClient({ serverUrl: profile.serverUrl, company, username: profile.username, password, apiKey });
      }
      async _runFunctionsCompare({ profileA, companyA, profileB, companyB }) {
        this._post({ command: "status", text: "Building clients\u2026" });
        try {
          const [cA, cB] = await Promise.all([this._efxClient(profileA, companyA), this._efxClient(profileB, companyB)]);
          this._post({ command: "status", text: "Fetching library lists\u2026" });
          const [libListA, libListB] = await Promise.all([cA.getLibraryList(), cB.getLibraryList()]);
          const allIds = [.../* @__PURE__ */ new Set([...libListA.map((l) => l.LibraryID), ...libListB.map((l) => l.LibraryID)])];
          this._post({ command: "status", text: `Fetching ${allIds.length} libraries from both environments\u2026` });
          const [rawA, rawB] = await Promise.all([
            cA.request(cA.getDesignerUrl("GetLibraries"), { libraryIds: allIds }),
            cB.request(cB.getDesignerUrl("GetLibraries"), { libraryIds: allIds })
          ]);
          this._post({ command: "status", text: "Computing diff\u2026" });
          const rA = rawA.returnObj || rawA, rB = rawB.returnObj || rawB;
          const { fnMap: fnMapA, refMap: refMapA, libDetail: ldA } = buildFnMap(rA);
          const { fnMap: fnMapB, refMap: refMapB, libDetail: ldB } = buildFnMap(rB);
          const libraries = buildLibraryCompare(libListA, libListB, fnMapA, fnMapB, refMapA, refMapB, ldA, ldB);
          const counts = { match: 0, diff: 0, "only-a": 0, "only-b": 0 };
          for (const l of libraries) counts[l.status] = (counts[l.status] || 0) + 1;
          this._post({ command: "functionsReady", data: { meta: { env_a_name: profileA, env_b_name: profileB, counts, total: libraries.length }, libraries } });
        } catch (err) {
          this._post({ command: "error", tab: "functions", message: err.message });
        }
      }
      async _runBpmCompare({ profileA, companyA, profileB, companyB }) {
        this._post({ command: "status", text: "Fetching BPM services\u2026" });
        try {
          const [cA, cB] = await Promise.all([this._efxClient(profileA, companyA), this._efxClient(profileB, companyB)]);
          const bA = new BpmClient(cA), bB = new BpmClient(cB);
          const fetchAll = async (bpm) => {
            const services = await bpm.getBpmServices();
            const methods = [], directives = [];
            for (const svc of services) {
              const { SystemCode, ServiceKind, ServiceName } = svc;
              const data = await bpm.getBpmMethodsByService(SystemCode, ServiceKind, ServiceName);
              methods.push(...data.methods);
              for (const d of data.directives) {
                const { code, hasCustomCode } = extractBpmCode(d.Body || "");
                directives.push({
                  BpMethodCode: d.BpMethodCode,
                  Name: d.Name,
                  DirectiveType: d.DirectiveType,
                  IsEnabled: d.IsEnabled,
                  Sequence: d.Sequence,
                  _code: code,
                  hasCode: hasCustomCode
                });
              }
            }
            return { methods, directives };
          };
          this._post({ command: "status", text: "Fetching BPM directives from both environments\u2026" });
          const [dA, dB] = await Promise.all([fetchAll(bA), fetchAll(bB)]);
          this._post({ command: "status", text: "Computing BPM diff\u2026" });
          const bpmData = buildBpmCompare(dA.methods, dA.directives, dB.methods, dB.directives);
          this._post({ command: "bpmReady", data: bpmData });
        } catch (err) {
          this._post({ command: "error", tab: "bpm", message: err.message });
        }
      }
      async _runLayersCompare({ profileA, companyA, profileB, companyB }) {
        this._post({ command: "status", text: "Fetching app list\u2026" });
        try {
          const [cA, cB] = await Promise.all([this._metafxClient(profileA, companyA), this._metafxClient(profileB, companyB)]);
          const [appsA, appsB] = await Promise.all([cA.listApps(), cB.listApps()]);
          const mapA = new Map(appsA.map((a) => [a.Id, a]));
          const mapB = new Map(appsB.map((a) => [a.Id, a]));
          const allIds = [.../* @__PURE__ */ new Set([...mapA.keys(), ...mapB.keys()])].sort();
          const apps = allIds.map((id) => {
            const a = mapA.get(id), b = mapB.get(id);
            const inA = !!a, inB = !!b;
            const timestampsDiffer = inA && inB && a.LastUpdated !== b.LastUpdated;
            const status = !inA ? "only-b" : !inB ? "only-a" : "in-both";
            return { id, inA, inB, status, timestampsDiffer, lastUpdatedA: a?.LastUpdated, lastUpdatedB: b?.LastUpdated, type: (a || b).Type, subType: (a || b).SubType };
          });
          apps.sort((x, y) => {
            const sc = (a) => a.status === "only-a" ? 0 : a.status === "only-b" ? 1 : a.timestampsDiffer ? 2 : 3;
            return sc(x) - sc(y) || x.id.localeCompare(y.id);
          });
          const counts = { "only-a": 0, "only-b": 0, "timestamps-differ": 0, "in-both": 0 };
          for (const a of apps) {
            if (a.status === "only-a") counts["only-a"]++;
            else if (a.status === "only-b") counts["only-b"]++;
            else if (a.timestampsDiffer) counts["timestamps-differ"]++;
            else counts["in-both"]++;
          }
          this._post({ command: "layersReady", data: { apps, counts, total: apps.length } });
        } catch (err) {
          this._post({ command: "error", tab: "layers", message: err.message });
        }
      }
      // Fetch layer descriptors from both envs for an app
      async _fetchLayerList({ appId, profileA, companyA, profileB, companyB }) {
        this._post({ command: "layerListLoading", appId });
        try {
          const [cA, cB] = await Promise.all([this._metafxClient(profileA, companyA), this._metafxClient(profileB, companyB)]);
          const [layersA, layersB] = await Promise.all([
            cA.getLayers(appId).catch((e) => {
              console.error("[layers A]", e.message);
              return [];
            }),
            cB.getLayers(appId).catch((e) => {
              console.error("[layers B]", e.message);
              return [];
            })
          ]);
          this._post({ command: "status", text: `Layers for ${appId}: ${profileA}=${layersA.length}, ${profileB}=${layersB.length}` });
          this._post({ command: "layerListReady", appId, layersA, layersB });
        } catch (err) {
          this._post({ command: "layerListError", appId, message: err.message });
        }
      }
      // Fetch layer content from both envs via GetApp (returns merged Layout/Events/DataViews/Rules)
      async _fetchLayerContent({ appId, layerKey, layerA, layerB, profileA, companyA, profileB, companyB }) {
        this._post({ command: "layerContentLoading", appId, layerKey });
        try {
          const [cA, cB] = await Promise.all([this._metafxClient(profileA, companyA), this._metafxClient(profileB, companyB)]);
          const descA = layerA?.LayerDescription || layerA?.LayerName;
          const descB = layerB?.LayerDescription || layerB?.LayerName;
          console.log(`[comparePanel] _fetchLayerContent appId="${appId}" layerKey="${layerKey}" descA="${descA}" descB="${descB}"`);
          const [rawA, rawB] = await Promise.all([
            descA ? cA.getAppForLayer(appId, descA).catch((e) => {
              console.error("[comparePanel] getAppForLayer A failed:", e.message);
              return null;
            }) : Promise.resolve(null),
            descB ? cB.getAppForLayer(appId, descB).catch((e) => {
              console.error("[comparePanel] getAppForLayer B failed:", e.message);
              return null;
            }) : Promise.resolve(null)
          ]);
          console.log(`[comparePanel] rawA keys:`, rawA ? Object.keys(rawA) : "null");
          console.log(`[comparePanel] rawB keys:`, rawB ? Object.keys(rawB) : "null");
          const toStr = (v) => v ? JSON.stringify(v, null, 2) : "";
          const normA = normalizeJson(toStr(rawA));
          const normB = normalizeJson(toStr(rawB));
          this._layerCache.set(`${appId}::${layerKey}::a`, normA);
          this._layerCache.set(`${appId}::${layerKey}::b`, normB);
          this._post({ command: "layerContentReady", appId, layerKey, normA, normB, same: normA === normB });
        } catch (err) {
          console.error(`[comparePanel] _fetchLayerContent error:`, err.message);
          this._post({ command: "layerContentError", appId, layerKey, message: err.message });
        }
      }
      // layer = specific layer descriptor from getLayers; if omitted, exports all layers for the app
      async _applyLayer({ appId, direction, profileA, companyA, profileB, companyB, layer, layerKey }) {
        const srcProfile = direction === "aToB" ? profileA : profileB;
        const srcCompany = direction === "aToB" ? companyA : companyB;
        const tgtProfile = direction === "aToB" ? profileB : profileA;
        const tgtCompany = direction === "aToB" ? companyB : companyA;
        const srcLabel = direction === "aToB" ? profileA : profileB;
        const tgtLabel = direction === "aToB" ? profileB : profileA;
        const name = layerKey || layer?.LayerDescription || layer?.LayerName || appId;
        const confirm = await vscode2.window.showWarningMessage(
          `Apply "${name}" from ${srcLabel} \u2192 ${tgtLabel}?`,
          { modal: true },
          "Apply"
        );
        if (confirm !== "Apply") {
          this._post({ command: "applyLayerCancelled", appId, layerKey });
          return;
        }
        this._post({ command: "applyLayerStarted", appId, layerKey });
        try {
          const [srcClient, tgtClient] = await Promise.all([
            this._metafxClient(srcProfile, srcCompany),
            this._metafxClient(tgtProfile, tgtCompany)
          ]);
          let layersToExport;
          if (layer) {
            layersToExport = [layer];
          } else {
            this._post({ command: "applyLayerStatus", appId, layerKey, text: `Getting layers from ${srcLabel}\u2026` });
            layersToExport = await srcClient.getLayers(appId);
            if (!layersToExport.length) throw new Error(`No layers found for "${appId}" on ${srcLabel}`);
          }
          this._post({ command: "applyLayerStatus", appId, layerKey, text: `Exporting from ${srcLabel}\u2026` });
          const exported = await srcClient.exportLayers(layersToExport);
          if (!exported) throw new Error(`Export returned empty for "${name}"`);
          this._post({ command: "applyLayerStatus", appId, layerKey, text: `Importing to ${tgtLabel}\u2026` });
          await tgtClient.importLayers(exported, true);
          this._post({ command: "applyLayerDone", appId, layerKey });
          vscode2.window.showInformationMessage(`\u2713 Applied "${name}" to ${tgtLabel}`);
        } catch (err) {
          this._post({ command: "applyLayerError", appId, layerKey, message: err.message });
        }
      }
      async _openNativeDiff({ appId, fileName, labelA, labelB, contentA, contentB }) {
        const os = require("os"), path2 = require("path"), fs2 = require("fs");
        const normA = contentA !== void 0 ? contentA : this._layerCache.get(`${appId}::${fileName}::a`) || "";
        const normB = contentB !== void 0 ? contentB : this._layerCache.get(`${appId}::${fileName}::b`) || "";
        const safeName = (fileName || "diff").replace(/[^a-zA-Z0-9._-]/g, "_");
        const pathA = path2.join(os.tmpdir(), `efx_cmp_a_${safeName}`);
        const pathB = path2.join(os.tmpdir(), `efx_cmp_b_${safeName}`);
        fs2.writeFileSync(pathA, normA, "utf8");
        fs2.writeFileSync(pathB, normB, "utf8");
        const title = `${fileName}: ${labelA || "A"} \u2194 ${labelB || "B"}`;
        await vscode2.commands.executeCommand("vscode.diff", vscode2.Uri.file(pathA), vscode2.Uri.file(pathB), title);
      }
      // ─────────────────────────────────────────────────────────────────────────
      // WEBVIEW HTML
      // ─────────────────────────────────────────────────────────────────────────
      getHtml() {
        return (
          /* html */
          `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Compare</title>
<style>
/* \u2500\u2500 Reset & root \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
*{box-sizing:border-box;margin:0;padding:0}
body{
  font-family:var(--vscode-font-family);
  font-size:var(--vscode-font-size);
  color:var(--vscode-foreground);
  background:var(--vscode-editor-background);
  height:100vh;display:flex;flex-direction:column;overflow:hidden;
}

/* \u2500\u2500 Semantic diff status colors \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
:root{
  --c-match:   var(--vscode-testing-iconPassed,   #3fb950);
  --c-diff:    var(--vscode-list-warningForeground,#cca700);
  --c-only-a:  var(--vscode-gitDecoration-deletedResourceForeground,  #f85149);
  --c-only-b:  var(--vscode-charts-purple, #bc8cff);
  --c-match-bg:  rgba(63,185,80,  .10);
  --c-diff-bg:   rgba(204,167,0,  .10);
  --c-only-a-bg: rgba(248,81,73,  .10);
  --c-only-b-bg: rgba(188,140,255,.10);
}

/* \u2500\u2500 Header \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.top-bar{
  padding:10px 16px;
  border-bottom:1px solid var(--vscode-panel-border);
  background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.03));
  flex-shrink:0;
  display:flex;align-items:center;gap:12px;flex-wrap:wrap;
}
.top-bar h1{font-size:14px;font-weight:700;white-space:nowrap}
.picker{display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:1}
.env-group{display:flex;align-items:center;gap:6px}
.env-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;
  color:var(--vscode-descriptionForeground);white-space:nowrap}
.env-label.a{color:var(--c-only-a)}
.env-label.b{color:var(--c-only-b)}
select{
  background:var(--vscode-dropdown-background);
  color:var(--vscode-dropdown-foreground);
  border:1px solid var(--vscode-dropdown-border);
  border-radius:3px;padding:4px 6px;
  font-size:12px;font-family:var(--vscode-font-family);cursor:pointer;
}
select:focus{outline:1px solid var(--vscode-focusBorder)}
.vs-sep{color:var(--vscode-descriptionForeground);font-size:11px;font-weight:600}
.run-btn{
  background:var(--vscode-button-background);
  color:var(--vscode-button-foreground);
  border:none;border-radius:3px;padding:5px 14px;
  font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;
}
.run-btn:hover{background:var(--vscode-button-hoverBackground)}
.run-btn:disabled{opacity:.4;cursor:not-allowed}
.status-bar{
  padding:3px 16px;font-size:11px;color:var(--vscode-descriptionForeground);
  font-style:italic;border-bottom:1px solid var(--vscode-panel-border);
  background:var(--vscode-editor-background);flex-shrink:0;min-height:22px;
}

/* \u2500\u2500 Type tabs \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.type-tabs{
  display:flex;border-bottom:2px solid var(--vscode-panel-border);
  background:var(--vscode-sideBar-background,var(--vscode-editor-background));flex-shrink:0;
}
.type-tab{
  background:none;border:none;padding:8px 16px;cursor:pointer;
  font-family:var(--vscode-font-family);font-size:12px;font-weight:700;
  color:var(--vscode-descriptionForeground);
  border-bottom:2px solid transparent;margin-bottom:-2px;transition:color .15s;
}
.type-tab:hover:not(.active){color:var(--vscode-foreground)}
.type-tab.active{color:var(--vscode-foreground);border-bottom-color:var(--vscode-button-background)}
.tab-badge{
  font-size:9px;padding:1px 5px;border-radius:10px;margin-left:5px;font-weight:700;
  background:var(--vscode-badge-background);color:var(--vscode-badge-foreground);
}
.type-tab.active .tab-badge{background:var(--c-only-b-bg);color:var(--c-only-b)}
.type-pane{display:none;flex-direction:column;flex:1;overflow:hidden}
.type-pane.active{display:flex}

/* \u2500\u2500 Summary filter tabs (replaces pills) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.summary{
  display:flex;gap:0;padding:0;
  border-bottom:2px solid var(--vscode-panel-border);
  background:var(--vscode-sideBar-background,var(--vscode-editor-background));
  flex-shrink:0;overflow-x:auto;
}
.chip{
  background:none;border:none;border-bottom:2px solid transparent;margin-bottom:-2px;
  padding:7px 14px;cursor:pointer;
  font-family:var(--vscode-font-family);font-size:11px;font-weight:600;
  color:var(--vscode-descriptionForeground);
  white-space:nowrap;transition:color .15s;user-select:none;
  display:inline-flex;align-items:center;gap:5px;
}
.chip:hover:not(.active){color:var(--vscode-foreground)}
.chip.active{color:var(--vscode-foreground)}
.chip-all.active    {border-bottom-color:var(--vscode-button-background)}
.chip-match.active  {border-bottom-color:var(--c-match)}
.chip-diff.active   {border-bottom-color:var(--c-diff)}
.chip-only-a.active {border-bottom-color:var(--c-only-a)}
.chip-only-b.active {border-bottom-color:var(--c-only-b)}
.chip-count{
  font-size:9px;padding:1px 5px;border-radius:10px;font-weight:700;
  background:var(--vscode-badge-background);color:var(--vscode-badge-foreground);
}

/* \u2500\u2500 Filter bar \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.filter-bar{
  padding:6px 16px;border-bottom:1px solid var(--vscode-panel-border);flex-shrink:0;
}
.search{
  background:var(--vscode-input-background);color:var(--vscode-input-foreground);
  border:1px solid var(--vscode-input-border);border-radius:3px;
  padding:4px 8px;font-size:11px;font-family:var(--vscode-editor-font-family);
  outline:none;width:220px;transition:border-color .15s;
}
.search:focus{border-color:var(--vscode-focusBorder)}

/* \u2500\u2500 Split grid \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.split-grid{display:grid;grid-template-columns:280px 1fr;flex:1;overflow:hidden}
.list-col{
  border-right:1px solid var(--vscode-panel-border);overflow-y:auto;
  background:var(--vscode-sideBar-background,var(--vscode-editor-background));
}
.list-col::-webkit-scrollbar{width:4px}
.list-col::-webkit-scrollbar-thumb{background:var(--vscode-scrollbarSlider-background);border-radius:2px}
.detail-col{overflow-y:auto;background:var(--vscode-editor-background)}
.detail-col::-webkit-scrollbar{width:4px}
.detail-col::-webkit-scrollbar-thumb{background:var(--vscode-scrollbarSlider-background);border-radius:2px}

/* \u2500\u2500 List items \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.list-item{
  padding:7px 12px;border-bottom:1px solid var(--vscode-panel-border);
  cursor:pointer;display:flex;align-items:center;gap:7px;transition:background .1s;
}
.list-item:hover{background:var(--vscode-list-hoverBackground)}
.list-item.active{background:var(--vscode-list-activeSelectionBackground);color:var(--vscode-list-activeSelectionForeground)}
.list-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.s-match   .list-dot{background:var(--c-match)}
.s-diff    .list-dot{background:var(--c-diff)}
.s-only-a  .list-dot{background:var(--c-only-a)}
.s-only-b  .list-dot{background:var(--c-only-b)}
.s-in-both .list-dot{background:var(--vscode-descriptionForeground)}
.s-ts-diff .list-dot{background:var(--c-diff)}
.list-name{font-size:11px;font-family:var(--vscode-editor-font-family);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.list-badge{font-size:9px;font-family:var(--vscode-editor-font-family);padding:1px 5px;border-radius:2px;font-weight:700;flex-shrink:0}
.s-match   .list-badge{background:var(--c-match-bg);color:var(--c-match)}
.s-diff    .list-badge{background:var(--c-diff-bg);color:var(--c-diff)}
.s-only-a  .list-badge{background:var(--c-only-a-bg);color:var(--c-only-a)}
.s-only-b  .list-badge{background:var(--c-only-b-bg);color:var(--c-only-b)}
.s-in-both .list-badge{background:var(--vscode-badge-background);color:var(--vscode-badge-foreground)}
.s-ts-diff .list-badge{background:var(--c-diff-bg);color:var(--c-diff)}
.list-delta{font-size:9px;color:var(--vscode-descriptionForeground);font-family:var(--vscode-editor-font-family)}
.no-results{padding:24px;text-align:center;color:var(--vscode-descriptionForeground);font-size:11px}

/* \u2500\u2500 Empty / loading states \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.empty-state{
  height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;
  color:var(--vscode-descriptionForeground);gap:6px;font-size:12px;
}
.load-prompt{
  flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:10px;color:var(--vscode-descriptionForeground);
}
.load-prompt button{
  background:var(--vscode-button-background);color:var(--vscode-button-foreground);
  border:none;border-radius:3px;padding:7px 18px;font-size:12px;font-weight:700;cursor:pointer;
}
.load-prompt button:hover{background:var(--vscode-button-hoverBackground)}
.load-prompt span{font-size:11px;opacity:.7}
.err-banner{
  padding:8px 16px;background:var(--c-only-a-bg);color:var(--c-only-a);
  font-size:12px;border-bottom:1px solid var(--vscode-panel-border);flex-shrink:0;
}

/* \u2500\u2500 Detail header \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.detail-hdr{
  padding:14px 20px;border-bottom:1px solid var(--vscode-panel-border);
  background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.03));
  position:sticky;top:0;z-index:10;
}
.detail-title{font-size:14px;font-weight:700;font-family:var(--vscode-editor-font-family);margin-bottom:5px}
.detail-meta{display:flex;gap:12px;font-size:11px;color:var(--vscode-descriptionForeground);flex-wrap:wrap;margin-bottom:8px}

/* \u2500\u2500 Collapsible lib info \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.lib-info-wrap{margin:10px 16px;border:1px solid var(--vscode-panel-border);border-radius:3px;overflow:hidden}
.lib-info-toggle{
  display:flex;align-items:center;justify-content:space-between;padding:7px 12px;
  background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.03));
  cursor:pointer;user-select:none;
}
.lib-info-toggle:hover{background:var(--vscode-list-hoverBackground)}
.lib-info-label{font-size:11px;font-weight:700;display:flex;align-items:center;gap:6px}
.chevron{font-size:9px;color:var(--vscode-descriptionForeground);transition:transform .15s;flex-shrink:0}
.chevron.open{transform:rotate(90deg)}

/* \u2500\u2500 Tabs (function body / lib info) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.tabs{display:flex;background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.03));border-bottom:1px solid var(--vscode-panel-border)}
.tab{
  background:none;border:none;border-bottom:2px solid transparent;margin-bottom:-1px;
  padding:6px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;
  cursor:pointer;color:var(--vscode-descriptionForeground);transition:all .15s;
  font-family:var(--vscode-font-family);
}
.tab:hover:not(.active){color:var(--vscode-foreground)}
.tab.active{color:var(--vscode-foreground);border-bottom-color:var(--vscode-button-background)}
.pane{display:none}.pane.active{display:block}

/* \u2500\u2500 Function sections & rows \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.fn-section{padding:8px 16px 16px}
.section-lbl{
  font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;
  font-family:var(--vscode-editor-font-family);
  padding:8px 0 4px;border-bottom:1px solid var(--vscode-panel-border);margin-bottom:4px;
}
.fn-row{border:1px solid var(--vscode-panel-border);border-radius:3px;margin:4px 0;overflow:hidden}
.fn-row-hdr{
  display:flex;align-items:center;gap:8px;padding:7px 10px;
  background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.03));
  cursor:pointer;user-select:none;
}
.fn-row-hdr:hover{background:var(--vscode-list-hoverBackground)}
.fn-badge{font-size:9px;font-weight:700;padding:2px 6px;border-radius:2px;font-family:var(--vscode-editor-font-family);flex-shrink:0}
.fn-name{font-family:var(--vscode-editor-font-family);font-size:12px;flex:1}
.fn-changed{font-size:10px;color:var(--vscode-descriptionForeground);font-family:var(--vscode-editor-font-family)}
.fn-body{display:none;border-top:1px solid var(--vscode-panel-border)}
.fn-row.open .fn-body{display:block}
.open-diff-btn{
  background:none;border:1px solid var(--vscode-panel-border);
  color:var(--vscode-descriptionForeground);border-radius:3px;
  padding:1px 6px;font-size:10px;cursor:pointer;flex-shrink:0;line-height:1.6;
}
.open-diff-btn:hover{background:var(--vscode-button-secondaryBackground);color:var(--vscode-foreground)}
.detail-actions{display:flex;gap:6px;flex-shrink:0;align-items:center}
.apply-btn{
  background:var(--vscode-button-background);color:var(--vscode-button-foreground);
  border:none;border-radius:3px;padding:4px 10px;font-size:11px;cursor:pointer;
  font-family:var(--vscode-font-family);font-weight:600;
}
.apply-btn:hover{background:var(--vscode-button-hoverBackground)}
.apply-btn:disabled,.apply-btn-disabled{opacity:.5;cursor:default}

/* \u2500\u2500 Side-by-side diff grid \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.diff-wrap{border:1px solid var(--vscode-panel-border);border-radius:2px;overflow:hidden;margin:0}
.diff-col-hdrs{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid var(--vscode-panel-border)}
.diff-col-hdr{padding:4px 10px;font-size:9px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;font-family:var(--vscode-font-family)}
.diff-col-hdr.a{background:var(--c-only-a-bg);color:var(--c-only-a);border-right:1px solid var(--vscode-panel-border)}
.diff-col-hdr.b{background:var(--c-only-b-bg);color:var(--c-only-b)}
.diff-scroll{max-height:480px;overflow-y:auto}
.diff-scroll::-webkit-scrollbar{width:4px}
.diff-scroll::-webkit-scrollbar-thumb{background:var(--vscode-scrollbarSlider-background);border-radius:2px}
.diff-grid{display:grid;grid-template-columns:1fr 1fr}
.diff-cell{
  padding:0 10px;line-height:1.55;
  font-family:var(--vscode-editor-font-family);
  font-size:calc(var(--vscode-editor-font-size, 13px) - 1px);
  white-space:pre-wrap;word-break:break-all;min-height:20px;
}
.diff-cell:nth-child(odd){border-right:1px solid var(--vscode-panel-border)}
.diff-cell.ctx{color:var(--vscode-descriptionForeground)}
.diff-cell.add{background:var(--vscode-diffEditor-insertedTextBackground,rgba(63,185,80,.15));color:var(--vscode-foreground)}
.diff-cell.del{background:var(--vscode-diffEditor-removedTextBackground,rgba(248,81,73,.15));color:var(--vscode-foreground)}
.diff-cell.skip{color:var(--vscode-panel-border);font-style:italic;font-family:var(--vscode-font-family);font-size:10px}
.diff-cell.empty{background:var(--vscode-editor-background);opacity:.25}
.ln{
  color:var(--vscode-editorLineNumber-foreground,rgba(150,150,150,.4));
  min-width:30px;display:inline-block;text-align:right;
  margin-right:12px;user-select:none;font-size:9px;
}

/* \u2500\u2500 Inline list diff (refs) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.ref-group{border-bottom:1px solid var(--vscode-panel-border)}
.ref-group:last-child{border-bottom:none}
.ref-group-hdr{display:flex;align-items:center;gap:8px;padding:5px 12px;background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.03));cursor:pointer;user-select:none}
.ref-group-hdr:hover{background:var(--vscode-list-hoverBackground)}
.ref-group-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--vscode-descriptionForeground);flex:1}

/* \u2500\u2500 Meta / sig tables \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.meta-tbl{width:100%;border-collapse:collapse;font-family:var(--vscode-editor-font-family);font-size:11px}
.meta-tbl th{
  padding:5px 12px;text-align:left;font-size:9px;letter-spacing:1px;text-transform:uppercase;
  color:var(--vscode-descriptionForeground);border-bottom:1px solid var(--vscode-panel-border);
  background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.03));font-weight:700;
  font-family:var(--vscode-font-family);
}
.meta-tbl td{padding:5px 12px;border-bottom:1px solid var(--vscode-panel-border);vertical-align:top;max-width:260px;word-break:break-word;white-space:pre-wrap}
.meta-tbl tr.changed td{background:var(--c-diff-bg)}
.meta-tbl td:first-child{color:var(--vscode-descriptionForeground)}
.va{color:var(--c-only-a)}.vb{color:var(--c-only-b)}.vs{color:var(--c-match)}
.sig-sec-lbl{padding:5px 12px;font-size:9px;font-family:var(--vscode-font-family);letter-spacing:1px;color:var(--vscode-descriptionForeground);text-transform:uppercase;border-bottom:1px solid var(--vscode-panel-border);background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.03))}

/* \u2500\u2500 Only-one-side info block \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.only-info{padding:10px 14px;font-size:11px;color:var(--vscode-descriptionForeground)}
.code-preview{
  margin-top:8px;max-height:200px;overflow-y:auto;
  background:var(--vscode-textCodeBlock-background);border-radius:3px;
  padding:8px 10px;font-size:11px;white-space:pre-wrap;word-break:break-all;
  color:var(--vscode-foreground);font-family:var(--vscode-editor-font-family);
}
</style>
</head>
<body>

<!-- \u2500\u2500 TOP BAR \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
<div class="top-bar">
  <h1>Compare</h1>
  <div class="picker" id="picker">
    <div class="env-group">
      <span class="env-label a">Env A</span>
      <select id="profileA" onchange="onProfileChange('A')"><option value="">\u2014 profile \u2014</option></select>
      <select id="companyA"><option value="">\u2014 company \u2014</option></select>
    </div>
    <span class="vs-sep">vs</span>
    <div class="env-group">
      <span class="env-label b">Env B</span>
      <select id="profileB" onchange="onProfileChange('B')"><option value="">\u2014 profile \u2014</option></select>
      <select id="companyB"><option value="">\u2014 company \u2014</option></select>
    </div>
    <button class="run-btn" id="runBtn" onclick="runCompare()">\u25B6 Run Compare</button>
  </div>
</div>
<div class="status-bar" id="statusBar"></div>

<!-- \u2500\u2500 TYPE TABS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
<div class="type-tabs">
  <button class="type-tab active" id="tab-functions" onclick="switchTab('functions',this)">
    Functions <span class="tab-badge" id="fnBadge">\u2014</span>
  </button>
  <button class="type-tab" id="tab-bpm" onclick="switchTab('bpm',this)">
    BPMs <span class="tab-badge" id="bpmBadge">\u2014</span>
  </button>
  <button class="type-tab" id="tab-layers" onclick="switchTab('layers',this)">
    Layers <span class="tab-badge" id="layersBadge">\u2014</span>
  </button>
</div>

<!-- \u2500\u2500 FUNCTIONS PANE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
<div class="type-pane active" id="pane-functions">
  <div class="summary" id="fnSummary"></div>
  <div class="filter-bar"><input class="search" id="fnSearch" placeholder="Search libraries\u2026" oninput="fnApply()"></div>
  <div class="split-grid">
    <div class="list-col" id="fnList"></div>
    <div class="detail-col" id="fnDetail"><div class="empty-state"><span>Run a compare to begin</span></div></div>
  </div>
</div>

<!-- \u2500\u2500 BPM PANE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
<div class="type-pane" id="pane-bpm">
  <div class="load-prompt" id="bpmPrompt">
    <button onclick="loadBpm()">Load BPM Compare</button>
    <span>Fetches all directive code from both environments</span>
  </div>
  <div style="display:none;flex-direction:column;flex:1;overflow:hidden" id="bpmMain">
    <div class="summary" id="bpmSummary"></div>
    <div class="filter-bar"><input class="search" id="bpmSearch" placeholder="Search services\u2026" oninput="bpmApply()"></div>
    <div class="split-grid">
      <div class="list-col" id="bpmList"></div>
      <div class="detail-col" id="bpmDetail"><div class="empty-state"><span>Select a service</span></div></div>
    </div>
  </div>
</div>

<!-- \u2500\u2500 LAYERS PANE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
<div class="type-pane" id="pane-layers">
  <div class="load-prompt" id="layersPrompt">
    <button onclick="loadLayers()">Load Layers Compare</button>
    <span>Fetches app list \u2014 detail loads on click</span>
  </div>
  <div style="display:none;flex-direction:column;flex:1;overflow:hidden" id="layersMain">
    <div class="summary" id="layersSummary"></div>
    <div class="filter-bar"><input class="search" id="layersSearch" placeholder="Search apps\u2026" oninput="layersApply()"></div>
    <div class="split-grid">
      <div class="list-col" id="layersList"></div>
      <div class="detail-col" id="layersDetail"><div class="empty-state"><span>Select an app to diff</span></div></div>
    </div>
  </div>
</div>

<script>
const vscode = acquireVsCodeApi();
vscode.postMessage({ command: 'ready' });

// \u2500\u2500 STATE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
let PROFILES  = [];
let FN_DATA   = null;
let BPM_DATA  = null;
let LY_DATA   = null;
let FN_FILTER = 'all', FN_SEL = null;
let BPM_FILTER= 'all', BPM_SEL= null;
let LY_FILTER = 'all', LY_SEL = null;
let ACTIVE_TAB= 'functions';
let BPM_LOADED = false, LY_LOADED = false;
let LAST_RUN   = null; // {profileA, companyA, profileB, companyB}
let LAYER_LIST_CACHE    = {}; // appId -> { layersA, layersB }
let LAYER_CONTENT_CACHE = {}; // appId::layerKey -> { normA, normB, same } | { loading } | { error }
let LAYER_OBJECTS       = {}; // appId::layerKey::a/b -> layer descriptor
let PENDING_DIFF        = null; // { appId, layerKey } -- open native diff once content loads

// \u2500\u2500 HELPERS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function looksLikeBinary(s) { return !!s && s.length > 20 && /^[A-Za-z0-9+/]+=*$/.test(s); }
function setStatus(text){ document.getElementById('statusBar').textContent = text || ''; }

// \u2500\u2500 PROFILES \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function populateProfiles(profiles, activeProfile, activeCompany) {
  PROFILES = profiles;
  const sels = [['profileA','companyA'], ['profileB','companyB']];
  sels.forEach(([pid, cid]) => {
    const pSel = document.getElementById(pid);
    pSel.innerHTML = '<option value="">\u2014 profile \u2014</option>';
    for (const p of profiles) {
      const opt = document.createElement('option');
      opt.value = opt.textContent = p.name;
      pSel.appendChild(opt);
    }
  });
  // Pre-select active profile on both sides
  if (activeProfile) {
    document.getElementById('profileA').value = activeProfile;
    document.getElementById('profileB').value = activeProfile;
    populateCompanies('A', activeProfile, activeCompany);
    populateCompanies('B', activeProfile, '');
  }
}

function populateCompanies(side, profileName, preferCompany) {
  const p = PROFILES.find(x => x.name === profileName);
  const sel = document.getElementById('company' + side);
  sel.innerHTML = '<option value="">\u2014 company \u2014</option>';
  if (!p) return;
  for (const c of p.companies) {
    const opt = document.createElement('option');
    opt.value = opt.textContent = c;
    sel.appendChild(opt);
  }
  if (preferCompany && p.companies.includes(preferCompany)) sel.value = preferCompany;
  else if (p.companies.length) sel.value = p.companies[0];
}

function onProfileChange(side) {
  const pName = document.getElementById('profile' + side).value;
  populateCompanies(side, pName, '');
}

// \u2500\u2500 TAB SWITCH \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function switchTab(tab, btn) {
  document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.type-pane').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('pane-' + tab).classList.add('active');
  ACTIVE_TAB = tab;
}

// \u2500\u2500 RUN COMPARE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function runCompare() {
  const profileA = document.getElementById('profileA').value;
  const companyA = document.getElementById('companyA').value;
  const profileB = document.getElementById('profileB').value;
  const companyB = document.getElementById('companyB').value;
  if (!profileA || !companyA || !profileB || !companyB) {
    setStatus('\u26A0 Select both profiles and companies before running');
    return;
  }
  LAST_RUN = { profileA, companyA, profileB, companyB };
  BPM_LOADED = false; LY_LOADED = false;
  LAYER_LIST_CACHE = {}; LAYER_CONTENT_CACHE = {}; LAYER_OBJECTS = {}; PENDING_DIFF = null;
  // Reset BPM + layers back to load-prompt
  document.getElementById('bpmPrompt').style.display = '';
  document.getElementById('bpmMain').style.display   = 'none';
  document.getElementById('layersPrompt').style.display = '';
  document.getElementById('layersMain').style.display   = 'none';
  document.getElementById('runBtn').disabled = true;
  setStatus('Connecting\u2026');
  vscode.postMessage({ command: 'runCompare', profileA, companyA, profileB, companyB });
}

function loadBpm() {
  if (!LAST_RUN) { setStatus('\u26A0 Run a compare first'); return; }
  if (BPM_LOADED) return;
  document.getElementById('bpmPrompt').style.display = 'none';
  document.getElementById('bpmMain').style.display   = 'flex';
  document.getElementById('bpmDetail').innerHTML     = '<div class="empty-state"><span>Loading BPM data\u2026</span></div>';
  setStatus('Fetching BPMs\u2026');
  vscode.postMessage({ command: 'runBpmCompare', ...LAST_RUN });
}

function loadLayers() {
  if (!LAST_RUN) { setStatus('\u26A0 Run a compare first'); return; }
  if (LY_LOADED) return;
  document.getElementById('layersPrompt').style.display = 'none';
  document.getElementById('layersMain').style.display   = 'flex';
  document.getElementById('layersDetail').innerHTML     = '<div class="empty-state"><span>Loading app list\u2026</span></div>';
  setStatus('Fetching app list\u2026');
  vscode.postMessage({ command: 'runLayersCompare', ...LAST_RUN });
}

// \u2500\u2500 MESSAGE HANDLER \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
window.addEventListener('message', ({ data: msg }) => {
  switch (msg.command) {
    case 'profiles':
      populateProfiles(msg.data, msg.activeProfile, msg.activeCompany);
      break;
    case 'compareStarted':
      FN_DATA = BPM_DATA = LY_DATA = null;
      FN_SEL = BPM_SEL = LY_SEL = null;
      document.getElementById('fnList').innerHTML = '';
      document.getElementById('fnDetail').innerHTML = '<div class="empty-state"><span>Loading\u2026</span></div>';
      document.getElementById('fnSummary').innerHTML = '';
      document.getElementById('fnBadge').textContent = '\u2026';
      break;
    case 'status':
      setStatus(msg.text);
      break;
    case 'functionsReady':
      document.getElementById('runBtn').disabled = false;
      setStatus('');
      FN_DATA = msg.data;
      document.getElementById('fnBadge').textContent = FN_DATA.meta.total;
      renderFnSummary(); fnApply();
      break;
    case 'bpmReady':
      BPM_LOADED = true;
      setStatus('');
      BPM_DATA = msg.data;
      document.getElementById('bpmBadge').textContent = BPM_DATA.total;
      renderBpmSummary(); bpmApply();
      break;
    case 'layersReady':
      LY_LOADED = true;
      setStatus('');
      LY_DATA = msg.data;
      document.getElementById('layersBadge').textContent = LY_DATA.total;
      renderLayersSummary(); layersApply();
      document.getElementById('layersDetail').innerHTML = '<div class="empty-state"><span>Select an app to view its layers</span></div>';
      break;
    case 'layerListLoading':
      if (LY_SEL === msg.appId)
        document.getElementById('layersDetail').innerHTML = '<div class="empty-state"><span>Loading layers\u2026</span></div>';
      break;
    case 'layerListReady': {
            const lkFn = l => {
        const d = l.LayerDescription; if (d && !looksLikeBinary(d)) return d;
        const n = l.LayerName;        if (n && !looksLikeBinary(n)) return n;
        return l.TypeCode || '?';
      };
      for (const l of (msg.layersA||[])) LAYER_OBJECTS[\`\${msg.appId}::\${lkFn(l)}::a\`] = l;
      for (const l of (msg.layersB||[])) LAYER_OBJECTS[\`\${msg.appId}::\${lkFn(l)}::b\`] = l;
      LAYER_LIST_CACHE[msg.appId] = { layersA: msg.layersA, layersB: msg.layersB };
      if (LY_SEL === msg.appId) renderLayerList(msg.appId);
      break;
    }
    case 'layerListError':
      if (LY_SEL === msg.appId)
        document.getElementById('layersDetail').innerHTML = \`<div class="err-banner">Error: \${esc(msg.message)}</div>\`;
      break;
    case 'layerContentLoading':
      LAYER_CONTENT_CACHE[\`\${msg.appId}::\${msg.layerKey}\`] = { loading: true };
      break;
    case 'layerContentReady': {
      LAYER_CONTENT_CACHE[\`\${msg.appId}::\${msg.layerKey}\`] = { normA: msg.normA, normB: msg.normB, same: msg.same };
      // Surgically update the body div if it's in the DOM
      const bodyEl = document.getElementById('lrb_' + safeId(msg.appId + '_' + msg.layerKey));
      if (bodyEl) {
        const inA = !!LAYER_OBJECTS[\`\${msg.appId}::\${msg.layerKey}::a\`];
        const inB = !!LAYER_OBJECTS[\`\${msg.appId}::\${msg.layerKey}::b\`];
        bodyEl.innerHTML = renderLayerRowBody(\`\${msg.appId}::\${msg.layerKey}\`, inA, inB, LAST_RUN.profileA, LAST_RUN.profileB);
      }
      // Auto-open native diff if pending
      if (PENDING_DIFF && PENDING_DIFF.appId === msg.appId && PENDING_DIFF.layerKey === msg.layerKey) {
        PENDING_DIFF = null;
        sendDiff(msg.normA||'', msg.normB||'', msg.layerKey.replace(/[^a-zA-Z0-9._-]/g,'_')+'.json', LAST_RUN?.profileA, LAST_RUN?.profileB);
      }
      break;
    }
    case 'layerContentError':
      LAYER_CONTENT_CACHE[\`\${msg.appId}::\${msg.layerKey}\`] = { error: msg.message };
      { const bodyEl2 = document.getElementById('lrb_' + safeId(msg.appId + '_' + msg.layerKey));
        if (bodyEl2) bodyEl2.innerHTML = \`<div class="only-info" style="color:var(--c-only-a)">Error: \${esc(msg.message)}</div>\`; }
      break;
    case 'applyLayerStarted':
      setStatus(\`Applying "\${msg.layerKey || msg.appId}"\u2026\`);
      break;
    case 'applyLayerStatus':
      setStatus(msg.text);
      break;
    case 'applyLayerDone':
      setStatus('');
      // Re-fetch layer list to reflect the change
      if (LY_SEL === msg.appId) {
        delete LAYER_LIST_CACHE[msg.appId];
        if (msg.layerKey) delete LAYER_CONTENT_CACHE[\`\${msg.appId}::\${msg.layerKey}\`];
        vscode.postMessage({ command: 'fetchLayerList', appId: msg.appId, ...LAST_RUN });
      }
      break;
    case 'applyLayerCancelled':
      setStatus('');
      break;
    case 'applyLayerError':
      setStatus('Apply error: ' + msg.message);
      break;
    case 'error':
      document.getElementById('runBtn').disabled = false;
      setStatus('Error: ' + msg.message);
      break;
  }
});

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// FUNCTIONS TAB
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

function renderFnSummary() {
  const c = FN_DATA.meta.counts, m = FN_DATA.meta;
  const ea = m.env_a_name, eb = m.env_b_name;
  document.getElementById('fnSummary').innerHTML =
    chip('all',    'chip-all',   'All',               'fnFilter', m.total) +
    chip('match',  'chip-match', 'Match',             'fnFilter', c.match) +
    chip('diff',   'chip-diff',  'Different',         'fnFilter', c.diff) +
    chip('only-a', 'chip-only-a', \`Only in \${ea}\`,  'fnFilter', c['only-a']) +
    chip('only-b', 'chip-only-b', \`Only in \${eb}\`,  'fnFilter', c['only-b']);
}
function fnFilter(f, el) { FN_FILTER = f; document.querySelectorAll('[data-chip="fnFilter"]').forEach(c=>c.classList.remove('active')); el.classList.add('active'); fnApply(); }
function fnApply() {
  if (!FN_DATA) return;
  const q = (document.getElementById('fnSearch').value || '').toLowerCase();
  const items = FN_DATA.libraries.filter(l => (FN_FILTER === 'all' || l.status === FN_FILTER) && (!q || l.libID.toLowerCase().includes(q)));
  const lm = { match:'MATCH', diff:'DIFF', 'only-a': FN_DATA.meta.env_a_name, 'only-b': FN_DATA.meta.env_b_name };
  document.getElementById('fnList').innerHTML = items.length
    ? items.map(l => {
        const delta = l.fnDiffs.filter(f => f.status !== 'match').length;
        return \`<div class="list-item s-\${l.status} \${l.libID===FN_SEL?'active':''}" onclick="fnSelect('\${esc(l.libID)}')">
          <div class="list-dot"></div>
          <span class="list-name" title="\${esc(l.libID)}">\${esc(l.libID)}</span>
          \${delta ? \`<span class="list-delta">\${delta}\u0394</span>\` : ''}
          <span class="list-badge">\${lm[l.status]||l.status}</span>
        </div>\`;
      }).join('')
    : '<div class="no-results">No libraries match</div>';
}
function fnSelect(libID) {
  FN_SEL = libID;
  document.querySelectorAll('#fnList .list-item').forEach(el => el.classList.toggle('active', el.querySelector('.list-name')?.title === libID));
  const lib = FN_DATA.libraries.find(l => l.libID === libID);
  if (lib) renderFnDetail(lib);
}

function renderFnDetail(lib) {
  const ea = FN_DATA.meta.env_a_name, eb = FN_DATA.meta.env_b_name;
  const sc = { match:'var(--c-match)', diff:'var(--c-diff)', 'only-a':'var(--c-only-a)', 'only-b':'var(--c-only-b)' };
  const sl = { match:'\u2713 Match', diff:'~ Different', 'only-a':\`\u2717 Only in \${ea}\`, 'only-b':\`+ Only in \${eb}\` };
  let html = \`<div class="detail-hdr">
    <div class="detail-title">\${esc(lib.libID)}</div>
    <div class="detail-meta">
      <span style="color:\${sc[lib.status]}">\${sl[lib.status]}</span>
      <span>\u2502 \${lib.fnDiffs.length} function\${lib.fnDiffs.length!==1?'s':''}</span>
      <span style="color:\${lib.inA?'var(--c-only-a)':'var(--vscode-descriptionForeground)'}">\u25CF \${ea}</span>
      <span style="color:\${lib.inB?'var(--c-only-b)':'var(--vscode-descriptionForeground)'}">\u25CF \${eb}</span>
    </div>
  </div>\`;
  html += renderLibInfoPanel(lib, ea, eb);
  html += '<div class="fn-section">';
  const groups = [{k:'diff',l:'Different',c:'var(--c-diff)'},{k:'only-a',l:\`Only in \${ea}\`,c:'var(--c-only-a)'},{k:'only-b',l:\`Only in \${eb}\`,c:'var(--c-only-b)'},{k:'match',l:'Matching',c:'var(--c-match)'}];
  for (const g of groups) {
    const fns = lib.fnDiffs.filter(f => f.status === g.k);
    if (!fns.length) continue;
    html += \`<div class="section-lbl" style="color:\${g.c}">\${g.l} (\${fns.length})</div>\`;
    for (const fn of fns) html += renderFnRow(fn, lib.libID, ea, eb);
  }
  html += '</div>';
  document.getElementById('fnDetail').innerHTML = html;
}

function renderLibInfoPanel(lib, ea, eb) {
  const hasDiff = lib.libDiff?.hasDiff;
  const ld = lib.libDiff || {};
  const refKeys  = ['libs','assemblies','services','tables'];
  const metaKeys = ['DirectDBAccess','AllowCustomCodeFunctions','AllowCustomCodeWidgets','Frozen','Disabled'];
  const infoKeys = ['Description','Owner','Revision','EpicorVersion','Mode','Notes','Package','PackageVersion','Publisher','LockedBy','LockedOn','DebugMode','DumpSources','AdvTracing'];
  const lid = 'li_' + CSS.escape(lib.libID);
  const refsDiff = refKeys.some(k => ld[k] && !ld[k].same);
  const metaDiff = metaKeys.some(k => ld[k] && !ld[k].same);

  let html = \`<div class="lib-info-wrap">
    <div class="lib-info-toggle" onclick="toggleEl('\${lid}','\${lid}_chev')">
      <span class="lib-info-label">
        \${hasDiff ? '\u26A1' : '\u{1F4CB}'} Library Info
        \${hasDiff ? \`<span style="color:var(--c-diff);font-size:9px">has differences</span>\` : \`<span style="color:var(--vscode-descriptionForeground);font-size:9px">click to expand</span>\`}
      </span>
      <span class="chevron \${hasDiff?'open':''}" id="\${lid}_chev">\u25B6</span>
    </div>
    <div id="\${lid}" style="display:\${hasDiff?'block':'none'};border-top:1px solid var(--vscode-panel-border)">
      <div class="tabs">
        <button class="tab active" onclick="switchLibTab(this,'\${lid}','refs')">References\${refsDiff?' \u26A1':''}</button>
        <button class="tab"        onclick="switchLibTab(this,'\${lid}','settings')">Settings\${metaDiff?' \u26A1':''}</button>
        <button class="tab"        onclick="switchLibTab(this,'\${lid}','info')">Info</button>
      </div>\`;

  // REFS
  html += \`<div class="pane active" data-libtab="\${lid}" data-tab="refs">\`;
  for (const k of refKeys) {
    const v = ld[k]; if (!v) continue;
    if (v.same) {
      const items = (v.a||'').split('\\n').filter(Boolean); if (!items.length) continue;
      const sid = \`\${lid}_\${k}\`;
      html += \`<div class="ref-group"><div class="ref-group-hdr" onclick="toggleEl('\${sid}','\${sid}_chev')">
        <span class="ref-group-lbl">\${k}</span>
        <span style="font-size:9px;color:var(--c-match)">\u2713 match (\${items.length})</span>
        <span class="chevron" id="\${sid}_chev">\u25B6</span></div>
        <div id="\${sid}" style="display:none"><table class="meta-tbl"><tbody>\${items.map(i=>\`<tr><td colspan="2" class="vs">\${esc(i)}</td></tr>\`).join('')}</tbody></table></div></div>\`;
    } else {
      html += \`<div class="ref-group"><div class="ref-group-hdr"><span class="ref-group-lbl">\${k}</span><span style="font-size:9px;color:var(--c-diff)">\u26A1 different</span></div>\${inlineListDiff(v.a,v.b,ea,eb)}</div>\`;
    }
  }
  html += '</div>';

  // SETTINGS
  html += \`<div class="pane" data-libtab="\${lid}" data-tab="settings"><table class="meta-tbl"><thead><tr><th>Field</th><th style="color:var(--c-only-a)">\${ea}</th><th style="color:var(--c-only-b)">\${eb}</th></tr></thead><tbody>\`;
  for (const k of metaKeys) { const v = ld[k]; if(!v) continue; html += \`<tr \${!v.same?'class="changed"':''}><td>\${k}</td><td class="\${v.same?'vs':'va'}">\${esc(v.a||'\u2014')}</td><td class="\${v.same?'vs':'vb'}">\${esc(v.b||'\u2014')}</td></tr>\`; }
  html += '</tbody></table></div>';

  // INFO
  html += \`<div class="pane" data-libtab="\${lid}" data-tab="info">
    <div style="padding:4px 12px;font-size:9px;color:var(--vscode-descriptionForeground);border-bottom:1px solid var(--vscode-panel-border);background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.03))">Informational only \u2014 differences here do not affect library status</div>
    <table class="meta-tbl"><thead><tr><th>Field</th><th style="color:var(--c-only-a)">\${ea}</th><th style="color:var(--c-only-b)">\${eb}</th></tr></thead><tbody>\`;
  for (const k of infoKeys) { const v = ld[k]; if(!v) continue; html += \`<tr><td>\${k}</td><td style="\${!v.same?'color:var(--c-only-a);opacity:.7':''}" class="\${v.same?'vs':''}">\${esc(v.a||'\u2014')}</td><td style="\${!v.same?'color:var(--c-only-b);opacity:.7':''}" class="\${v.same?'vs':''}">\${esc(v.b||'\u2014')}</td></tr>\`; }
  html += '</tbody></table></div>';

  html += '</div></div>';
  return html;
}

function renderFnRow(fn, libID, ea, eb) {
  const sc = { match:'var(--c-match)', diff:'var(--c-diff)', 'only-a':'var(--c-only-a)', 'only-b':'var(--c-only-b)' };
  const sb = { match:'MATCH', diff:'DIFF', 'only-a': ea, 'only-b': eb };
  const changed = fn.fields ? Object.entries(fn.fields).filter(([k,v])=>k!=='hasDiff'&&typeof v==='object'&&!v.same).map(([k])=>k) : [];
  const id = 'fn_' + CSS.escape(libID + '_' + fn.fnID);
  return \`<div class="fn-row" id="\${id}">
    <div class="fn-row-hdr" onclick="toggleFn('\${id}')">
      <span class="fn-badge" style="background:\${sc[fn.status]}22;color:\${sc[fn.status]}">\${sb[fn.status]}</span>
      <span class="fn-name">\${esc(fn.fnID)}</span>
      \${changed.length?\`<span class="fn-changed">\${changed.join(', ')}</span>\`:''}
      <button class="open-diff-btn" title="Open in VS Code diff editor" onclick="event.stopPropagation();openFnDiff('\${esc(libID)}','\${esc(fn.fnID)}')">\u2197 Diff</button>
      <span class="chevron">\u25B6</span>
    </div>
    <div class="fn-body">\${renderFnBody(fn, ea, eb)}</div>
  </div>\`;
}

function renderFnBody(fn, ea, eb) {
  if (fn.status === 'match') {
    const fid = esc(fn.fnID);
    return \`<div class="tabs"><button class="tab active" onclick="switchFnTab(this,'\${fid}','code')">Code</button><button class="tab" onclick="switchFnTab(this,'\${fid}','sig')">Signature</button><button class="tab" onclick="switchFnTab(this,'\${fid}','meta')">Metadata</button></div>
      <div class="pane active" data-fn="\${fid}" data-tab="code">
        <div style="font-family:var(--vscode-editor-font-family);font-size:calc(var(--vscode-editor-font-size,13px) - 1px);padding:10px 14px;max-height:400px;overflow-y:auto;white-space:pre-wrap;word-break:break-all;color:var(--vscode-descriptionForeground)">\${esc(fn.fa?._code||fn.fb?._code||'')}</div>
      </div>
      <div class="pane" data-fn="\${fid}" data-tab="sig">\${renderSigPane(fn,ea,eb)}</div>
      <div class="pane" data-fn="\${fid}" data-tab="meta">\${renderMetaPane(fn,ea,eb)}</div>\`;
  }
  if (fn.status === 'only-a' || fn.status === 'only-b') {
    const f = fn.fa || fn.fb, env = fn.status==='only-a'?ea:eb, fid = esc(fn.fnID);
    const envColor = fn.status==='only-a'?'var(--c-only-a)':'var(--c-only-b)';
    const synth = fn.status==='only-a'
      ? { fields:{ Inputs:{params_a:f?._sig?.inputs||[],params_b:[],same:false}, Outputs:{params_a:f?._sig?.outputs||[],params_b:[],same:false} }, fa:f, fb:null }
      : { fields:{ Inputs:{params_a:[],params_b:f?._sig?.inputs||[],same:false}, Outputs:{params_a:[],params_b:f?._sig?.outputs||[],same:false} }, fa:null, fb:f };
    const synthMeta = { fields:{}, fa:fn.status==='only-a'?f:null, fb:fn.status==='only-b'?f:null };
    for (const k of ['Description','Kind','RequireTransaction','SingleRowMode','Private','Disabled']) {
      const val = String(f?.[k]??'');
      synthMeta.fields[k] = fn.status==='only-a'?{a:val,b:'\u2014',same:false}:{a:'\u2014',b:val,same:false};
    }
    return \`<div class="tabs"><button class="tab active" onclick="switchFnTab(this,'\${fid}','code')">Code</button><button class="tab" onclick="switchFnTab(this,'\${fid}','sig')">Signature</button><button class="tab" onclick="switchFnTab(this,'\${fid}','meta')">Metadata</button></div>
      <div class="pane active" data-fn="\${fid}" data-tab="code">
        <div style="padding:4px 12px;font-size:9px;color:\${envColor};border-bottom:1px solid var(--vscode-panel-border)">Only exists in \${env}</div>
        <div style="font-family:var(--vscode-editor-font-family);font-size:calc(var(--vscode-editor-font-size,13px)-1px);padding:10px 14px;max-height:400px;overflow-y:auto;white-space:pre-wrap;word-break:break-all">\${esc(f?._code||'')}</div>
      </div>
      <div class="pane" data-fn="\${fid}" data-tab="sig">\${renderSigPane(synth,ea,eb)}</div>
      <div class="pane" data-fn="\${fid}" data-tab="meta">\${renderMetaPane(synthMeta,ea,eb)}</div>\`;
  }
  const fid = esc(fn.fnID);
  const codeDiff = !fn.fields?.Code?.same || !fn.fields?.Usings?.same;
  const sigDiff  = !fn.fields?.Inputs?.same || !fn.fields?.Outputs?.same;
  const metaDiff = ['Description','Kind','RequireTransaction','SingleRowMode','Private','Disabled'].some(k=>fn.fields?.[k]&&!fn.fields[k].same);
  return \`<div class="tabs">
    <button class="tab active" onclick="switchFnTab(this,'\${fid}','code')">Code\${codeDiff?' \u26A1':''}</button>
    <button class="tab"        onclick="switchFnTab(this,'\${fid}','sig')">Signature\${sigDiff?' \u26A1':''}</button>
    <button class="tab"        onclick="switchFnTab(this,'\${fid}','meta')">Metadata\${metaDiff?' \u26A1':''}</button>
  </div>
  <div class="pane active" data-fn="\${fid}" data-tab="code">
    \${sideBySide(fn.fields?.Code?.a||'',fn.fields?.Code?.b||'',ea,eb)}
    \${!fn.fields?.Usings?.same?\`<div style="padding:4px 12px;font-size:9px;color:var(--vscode-descriptionForeground);border-top:1px solid var(--vscode-panel-border)">USINGS</div>\${sideBySide(fn.fields.Usings.a||'',fn.fields.Usings.b||'',ea,eb)}\`:''}
  </div>
  <div class="pane" data-fn="\${fid}" data-tab="sig">\${renderSigPane(fn,ea,eb)}</div>
  <div class="pane" data-fn="\${fid}" data-tab="meta">\${renderMetaPane(fn,ea,eb)}</div>\`;
}

function renderSigPane(fn, ea, eb) {
  function tbl(label, pA, pB) {
    const names = [...new Set([...(pA||[]).map(p=>p.name),...(pB||[]).map(p=>p.name)])];
    const mA = Object.fromEntries((pA||[]).map(p=>[p.name,p]));
    const mB = Object.fromEntries((pB||[]).map(p=>[p.name,p]));
    return \`<div class="sig-sec-lbl">\${label}</div><table class="meta-tbl"><thead><tr><th>#</th><th>Name</th><th style="color:var(--c-only-a)">\${ea} Type</th><th style="color:var(--c-only-b)">\${eb} Type</th></tr></thead><tbody>\${
      names.map((name,i)=>{const pa=mA[name],pb=mB[name],same=pa&&pb&&pa.type===pb.type;
        return \`<tr \${!same?'class="changed"':''}><td style="color:var(--vscode-descriptionForeground)">\${i+1}</td><td>\${esc(name)}</td><td class="\${pa?(same?'vs':'va'):'va'}">\${pa?esc(pa.type):'\u2014'}</td><td class="\${pb?(same?'vs':'vb'):'vb'}">\${pb?esc(pb.type):'\u2014'}</td></tr>\`;
      }).join('')
    }</tbody></table>\`;
  }
  return tbl('Inputs', fn.fields?.Inputs?.params_a, fn.fields?.Inputs?.params_b) +
         tbl('Outputs', fn.fields?.Outputs?.params_a, fn.fields?.Outputs?.params_b);
}

function renderMetaPane(fn, ea, eb) {
  const keys = ['Description','Kind','RequireTransaction','SingleRowMode','Private','Disabled'];
  return \`<table class="meta-tbl"><thead><tr><th>Field</th><th style="color:var(--c-only-a)">\${ea}</th><th style="color:var(--c-only-b)">\${eb}</th></tr></thead><tbody>\${
    keys.map(k=>{ const f=fn.fields?.[k]; if(!f) return '';
      return \`<tr \${!f.same?'class="changed"':''}><td>\${k}</td><td class="\${f.same?'vs':'va'}">\${esc(f.a||'\u2014')}</td><td class="\${f.same?'vs':'vb'}">\${esc(f.b||'\u2014')}</td></tr>\`;
    }).join('')
  }</tbody></table>\`;
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// BPM TAB
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

function renderBpmSummary() {
  const c = BPM_DATA.counts;
  document.getElementById('bpmSummary').innerHTML =
    chip('all',   'chip-all',   'All',       'bpmFilter', BPM_DATA.total) +
    chip('match', 'chip-match', 'Match',     'bpmFilter', c.match||0) +
    chip('diff',  'chip-diff',  'Different', 'bpmFilter', c.diff||0);
}
function bpmFilter(f, el) { BPM_FILTER = f; document.querySelectorAll('[data-chip="bpmFilter"]').forEach(c=>c.classList.remove('active')); el.classList.add('active'); bpmApply(); }
function bpmApply() {
  if (!BPM_DATA) return;
  const q = (document.getElementById('bpmSearch').value||'').toLowerCase();
  const items = BPM_DATA.services.filter(s => (BPM_FILTER==='all'||s.status===BPM_FILTER)&&(!q||s.businessObject.toLowerCase().includes(q)));
  document.getElementById('bpmList').innerHTML = items.length
    ? items.map(s => \`<div class="list-item s-\${s.status} \${s.svcKey===BPM_SEL?'active':''}" onclick="bpmSelect('\${esc(s.svcKey)}')">
        <div class="list-dot"></div>
        <span class="list-name" title="\${esc(s.svcKey)}">\${esc(s.businessObject)}</span>
        \${s.diffCount?\`<span class="list-delta">\${s.diffCount}\u0394</span>\`:''}
        <span class="list-badge">\${s.status.toUpperCase()}</span>
      </div>\`).join('')
    : '<div class="no-results">No services match</div>';
}
function bpmSelect(svcKey) {
  BPM_SEL = svcKey;
  document.querySelectorAll('#bpmList .list-item').forEach(el=>el.classList.toggle('active', el.querySelector('.list-name')?.title===svcKey));
  const svc = BPM_DATA.services.find(s=>s.svcKey===svcKey);
  if (svc) renderBpmDetail(svc);
}

function renderBpmDetail(svc) {
  const ea = LAST_RUN.profileA, eb = LAST_RUN.profileB;
  const sc = { match:'var(--c-match)', diff:'var(--c-diff)', 'only-a':'var(--c-only-a)', 'only-b':'var(--c-only-b)' };
  let html = \`<div class="detail-hdr">
    <div class="detail-title">\${esc(svc.businessObject)}</div>
    <div class="detail-meta">
      <span style="color:\${sc[svc.status]}">\${svc.status}</span>
      <span>\u2502 \${svc.methods.length} method\${svc.methods.length!==1?'s':''}</span>
      <span>\${svc.systemCode}</span>
    </div>
  </div><div class="fn-section">\`;

  const groups = [{k:'diff',l:'Different',c:'var(--c-diff)'},{k:'only-a',l:\`Only in \${ea}\`,c:'var(--c-only-a)'},{k:'only-b',l:\`Only in \${eb}\`,c:'var(--c-only-b)'},{k:'match',l:'Matching',c:'var(--c-match)'}];
  for (const g of groups) {
    const methods = svc.methods.filter(m => m.status === g.k);
    if (!methods.length) continue;
    html += \`<div class="section-lbl" style="color:\${g.c}">\${g.l} (\${methods.length})</div>\`;
    for (const m of methods) {
      html += \`<div style="padding:4px 0 2px;font-size:10px;font-weight:700;color:var(--vscode-descriptionForeground);font-family:var(--vscode-editor-font-family);margin-top:6px">\${esc(m.methodName)}</div>\`;
      for (const dir of m.dirDiffs) html += renderBpmDirRow(dir, m.methodCode, ea, eb);
    }
  }
  html += '</div>';
  document.getElementById('bpmDetail').innerHTML = html;
}

function renderBpmDirRow(dir, methodCode, ea, eb) {
  const sc = { match:'var(--c-match)', diff:'var(--c-diff)', 'only-a':'var(--c-only-a)', 'only-b':'var(--c-only-b)' };
  const sb = { match:'MATCH', diff:'DIFF', 'only-a': ea, 'only-b': eb };
  const id = 'bpm_' + CSS.escape(methodCode + '_' + dir.name);
  const typeLabel = { 1:'Pre', 2:'Base', 3:'Post' };
  const dirType = typeLabel[(dir.da||dir.db)?.DirectiveType] || '';
  const changed = dir.fields ? Object.entries(dir.fields).filter(([k,v])=>k!=='hasDiff'&&typeof v==='object'&&!v.same).map(([k])=>k) : [];
  return \`<div class="fn-row" id="\${id}">
    <div class="fn-row-hdr" onclick="toggleFn('\${id}')">
      <span class="fn-badge" style="background:\${sc[dir.status]}22;color:\${sc[dir.status]}">\${sb[dir.status]}</span>
      <span class="fn-name">\${esc(dir.name)}\${dirType?\` <span style="opacity:.5;font-size:10px">[\${dirType}]</span>\`:''}</span>
      \${changed.length?\`<span class="fn-changed">\${changed.join(', ')}</span>\`:''}
      <button class="open-diff-btn" title="Open in VS Code diff editor" onclick="event.stopPropagation();openBpmDirDiff('\${esc(methodCode)}','\${esc(dir.name)}')">\u2197 Diff</button>
      <span class="chevron">\u25B6</span>
    </div>
    <div class="fn-body">\${renderBpmDirBody(dir, ea, eb)}</div>
  </div>\`;
}

function renderBpmDirBody(dir, ea, eb) {
  if (dir.status === 'only-a' || dir.status === 'only-b') {
    const d = dir.da || dir.db, env = dir.status==='only-a'?ea:eb;
    const envColor = dir.status==='only-a'?'var(--c-only-a)':'var(--c-only-b)';
    return \`<div style="padding:4px 12px;font-size:9px;color:\${envColor};border-bottom:1px solid var(--vscode-panel-border)">Only in \${env}</div>
      \${d?.hasCode?\`<div style="font-family:var(--vscode-editor-font-family);font-size:calc(var(--vscode-editor-font-size,13px)-1px);padding:10px 14px;max-height:360px;overflow-y:auto;white-space:pre-wrap;word-break:break-all">\${esc(d._code||'')}</div>\`:'<div class="only-info">No custom C# code</div>'}\`;
  }
  if (dir.status === 'match') {
    const code = dir.da?._code || '';
    return \`<div style="font-family:var(--vscode-editor-font-family);font-size:calc(var(--vscode-editor-font-size,13px)-1px);padding:10px 14px;max-height:360px;overflow-y:auto;white-space:pre-wrap;word-break:break-all;color:var(--vscode-descriptionForeground)">\${esc(code||'(no custom code)')}</div>\`;
  }
  const fid = esc(dir.name);
  const codeDiff = dir.fields?.Code && !dir.fields.Code.same;
  const metaDiff = ['DirectiveType','IsEnabled','Sequence'].some(k=>dir.fields?.[k]&&!dir.fields[k].same);
  return \`<div class="tabs">
    <button class="tab active" onclick="switchFnTab(this,'\${fid}','code')">Code\${codeDiff?' \u26A1':''}</button>
    <button class="tab"        onclick="switchFnTab(this,'\${fid}','meta')">Settings\${metaDiff?' \u26A1':''}</button>
  </div>
  <div class="pane active" data-fn="\${fid}" data-tab="code">\${sideBySide(dir.fields?.Code?.a||'',dir.fields?.Code?.b||'',ea,eb)}</div>
  <div class="pane" data-fn="\${fid}" data-tab="meta">
    <table class="meta-tbl"><thead><tr><th>Field</th><th style="color:var(--c-only-a)">\${ea}</th><th style="color:var(--c-only-b)">\${eb}</th></tr></thead><tbody>\${
      ['DirectiveType','IsEnabled','Sequence'].map(k=>{ const f=dir.fields?.[k]; if(!f) return '';
        return \`<tr \${!f.same?'class="changed"':''}><td>\${k}</td><td class="\${f.same?'vs':'va'}">\${esc(f.a||'\u2014')}</td><td class="\${f.same?'vs':'vb'}">\${esc(f.b||'\u2014')}</td></tr>\`;
      }).join('')
    }</tbody></table>
  </div>\`;
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// LAYERS TAB
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

function renderLayersSummary() {
  const c = LY_DATA.counts;
  document.getElementById('layersSummary').innerHTML =
    chip('all',               'chip-all',   'All',              'lyFilter', LY_DATA.total) +
    chip('only-a',            'chip-only-a', \`Only in \${LAST_RUN?.profileA||'A'}\`, 'lyFilter', c['only-a']) +
    chip('only-b',            'chip-only-b', \`Only in \${LAST_RUN?.profileB||'B'}\`, 'lyFilter', c['only-b']) +
    chip('timestamps-differ', 'chip-diff',  'Timestamps Differ','lyFilter', c['timestamps-differ']) +
    chip('in-both',           'chip-match', 'Matching',         'lyFilter', c['in-both']);
}
function lyFilter(f, el) { LY_FILTER = f; document.querySelectorAll('[data-chip="lyFilter"]').forEach(c=>c.classList.remove('active')); el.classList.add('active'); layersApply(); }
function layersApply() {
  if (!LY_DATA) return;
  const q = (document.getElementById('layersSearch').value||'').toLowerCase();
  const items = LY_DATA.apps.filter(a => {
    if (LY_FILTER !== 'all') {
      if (LY_FILTER === 'timestamps-differ' && !(a.status==='in-both'&&a.timestampsDiffer)) return false;
      if (LY_FILTER === 'in-both' && !(a.status==='in-both'&&!a.timestampsDiffer)) return false;
      if (LY_FILTER !== 'timestamps-differ' && LY_FILTER !== 'in-both' && a.status !== LY_FILTER) return false;
    }
    return !q || a.id.toLowerCase().includes(q);
  });
  document.getElementById('layersList').innerHTML = items.length
    ? items.map(a => {
        const cls = a.status!=='in-both' ? \`s-\${a.status}\` : a.timestampsDiffer ? 's-ts-diff' : 's-in-both';
        const badge = a.status==='only-a'?LAST_RUN.profileA : a.status==='only-b'?LAST_RUN.profileB : a.timestampsDiffer?'\u23F1 DIFFER':'MATCH';
        return \`<div class="list-item \${cls} \${a.id===LY_SEL?'active':''}" onclick="layersSelect('\${esc(a.id)}')">
          <div class="list-dot"></div>
          <span class="list-name" title="\${esc(a.id)}">\${esc(a.id)}</span>
          \${a.subType?\`<span class="list-delta">\${esc(a.subType)}</span>\`:''}
          <span class="list-badge">\${badge}</span>
        </div>\`;
      }).join('')
    : '<div class="no-results">No apps match</div>';
}

function layersSelect(appId) {
  LY_SEL = appId;
  document.querySelectorAll('#layersList .list-item').forEach(el=>el.classList.toggle('active', el.querySelector('.list-name')?.title===appId));
  if (LAYER_LIST_CACHE[appId]) {
    renderLayerList(appId);
  } else {
    document.getElementById('layersDetail').innerHTML = '<div class="empty-state"><span>Loading layers\u2026</span></div>';
    vscode.postMessage({ command: 'fetchLayerList', appId, ...LAST_RUN });
  }
}

// \u2500\u2500 safeId: turn any string into a valid HTML id fragment \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function safeId(s) { return String(s).replace(/[^a-zA-Z0-9_-]/g, '_'); }

// \u2500\u2500 Layer list render \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function renderLayerList(appId) {
  const cache = LAYER_LIST_CACHE[appId];
  if (!cache) return;
  const { layersA, layersB } = cache;
  const ea = LAST_RUN.profileA, eb = LAST_RUN.profileB;
  const app = LY_DATA?.apps.find(a=>a.id===appId);
        const lkFn = l => {
        const d = l.LayerDescription; if (d && !looksLikeBinary(d)) return d;
        const n = l.LayerName;        if (n && !looksLikeBinary(n)) return n;
        return l.TypeCode || '?';
      };
  const mapA = new Map((layersA||[]).map(l=>[lkFn(l),l]));
  const mapB = new Map((layersB||[]).map(l=>[lkFn(l),l]));
  const allKeys = [...new Set([...mapA.keys(),...mapB.keys()])].sort();
  const rows = allKeys.map(key => ({ key, lA: mapA.get(key)||null, lB: mapB.get(key)||null }));

  const onlyA  = rows.filter(r=>r.lA&&!r.lB);
  const onlyB  = rows.filter(r=>!r.lA&&r.lB);
  const inBoth = rows.filter(r=>r.lA&&r.lB);

  let html = \`<div class="detail-hdr">
    <div style="font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--vscode-descriptionForeground);margin-bottom:4px">App\${app?.subType?' \xB7 '+esc(app.subType):''}</div>
    <div class="detail-title" title="\${esc(appId)}">\${esc(appId)}</div>
    <div class="detail-meta">
      <span style="color:var(--c-only-a)">\u25CF \${esc(ea)}: \${(layersA||[]).length} layer\${(layersA||[]).length!==1?'s':''}</span>
      <span style="color:var(--c-only-b)">\u25CF \${esc(eb)}: \${(layersB||[]).length} layer\${(layersB||[]).length!==1?'s':''}</span>
    </div>
  </div><div class="fn-section">\`;

  if (!rows.length) {
    html += '<div class="no-results">No layers found on either environment</div>';
  } else {
    if (onlyA.length) {
      html += \`<div class="section-lbl" style="color:var(--c-only-a)">Only in \${esc(ea)} (\${onlyA.length})</div>\`;
      for (const r of onlyA) html += renderLayerRow(r, appId, ea, eb);
    }
    if (onlyB.length) {
      html += \`<div class="section-lbl" style="color:var(--c-only-b)">Only in \${esc(eb)} (\${onlyB.length})</div>\`;
      for (const r of onlyB) html += renderLayerRow(r, appId, ea, eb);
    }
    if (inBoth.length) {
      html += \`<div class="section-lbl">In Both (\${inBoth.length})</div>\`;
      for (const r of inBoth) html += renderLayerRow(r, appId, ea, eb);
    }
  }

  html += '</div>';
  document.getElementById('layersDetail').innerHTML = html;
}

function renderLayerRow(row, appId, ea, eb) {
  const { key, lA, lB } = row;
  const rid  = 'lr_'  + safeId(appId + '_' + key);
  const rbid = 'lrb_' + safeId(appId + '_' + key);
  const inA = !!lA, inB = !!lB;
  const status = !inA ? 'only-b' : !inB ? 'only-a' : 'in-both';
  const sc = { 'only-a':'var(--c-only-a)', 'only-b':'var(--c-only-b)', 'in-both':'var(--vscode-descriptionForeground)' };
  const sb = { 'only-a':esc(ea), 'only-b':esc(eb), 'in-both':'BOTH' };
  const meta = lA || lB;
  const typeLabel = meta?.TypeCode ? \`<span style="opacity:.5;font-size:10px"> [\${esc(meta.TypeCode)}]</span>\` : '';
  const compLabel = meta?.Company  ? \`<span class="list-delta">\${esc(meta.Company)}</span>\` : '';

  const diffBtn   = (inA && inB)
    ? \`<button class="open-diff-btn" title="Open in VS Code diff editor" onclick="event.stopPropagation();openLayerDiff('\${esc(appId)}','\${esc(key)}')">\u2197 Diff</button>\`
    : '';
  const applyAtoB = inA
    ? \`<button class="open-diff-btn" onclick="event.stopPropagation();applyLayerByKey('\${esc(appId)}','\${esc(key)}','aToB')">\u2192 \${esc(eb)}</button>\`
    : '';
  const applyBtoA = inB
    ? \`<button class="open-diff-btn" onclick="event.stopPropagation();applyLayerByKey('\${esc(appId)}','\${esc(key)}','bToA')">\u2192 \${esc(ea)}</button>\`
    : '';

  return \`<div class="fn-row" id="\${rid}">
    <div class="fn-row-hdr" onclick="toggleFn('\${rid}');loadLayerContent('\${esc(appId)}','\${esc(key)}')">
      <span class="fn-badge" style="background:\${sc[status]}22;color:\${sc[status]}">\${sb[status]}</span>
      <span class="fn-name">\${esc(key)}\${typeLabel}</span>
      \${compLabel}
      \${diffBtn}\${applyAtoB}\${applyBtoA}
      <span class="chevron">\u25B6</span>
    </div>
    <div class="fn-body" id="\${rbid}">\${renderLayerRowBody(\`\${appId}::\${key}\`, inA, inB, ea, eb)}</div>
  </div>\`;
}

function renderLayerRowBody(contentKey, inA, inB, ea, eb) {
  const c = LAYER_CONTENT_CACHE[contentKey];
  if (!c)           return \`<div class="only-info">Click row to load diff\u2026</div>\`;
  if (c.loading)    return \`<div class="only-info">Loading\u2026</div>\`;
  if (c.error)      return \`<div class="only-info" style="color:var(--c-only-a)">Error: \${esc(c.error)}</div>\`;
  if (c.same)       return \`<div class="only-info" style="color:var(--c-match)">\u2713 Identical</div>\`;
  if (!inA)         return \`<div style="font-family:var(--vscode-editor-font-family);font-size:calc(var(--vscode-editor-font-size,13px)-1px);padding:10px 14px;max-height:360px;overflow-y:auto;white-space:pre-wrap;word-break:break-all">\${esc(c.normB||'')}</div>\`;
  if (!inB)         return \`<div style="font-family:var(--vscode-editor-font-family);font-size:calc(var(--vscode-editor-font-size,13px)-1px);padding:10px 14px;max-height:360px;overflow-y:auto;white-space:pre-wrap;word-break:break-all">\${esc(c.normA||'')}</div>\`;
  return sideBySide(c.normA||'', c.normB||'', ea, eb);
}

function loadLayerContent(appId, layerKey) {
  const ck = \`\${appId}::\${layerKey}\`;
  if (LAYER_CONTENT_CACHE[ck]) return; // already loaded or in-flight
  LAYER_CONTENT_CACHE[ck] = { loading: true };
  const layerA = LAYER_OBJECTS[\`\${appId}::\${layerKey}::a\`] || null;
  const layerB = LAYER_OBJECTS[\`\${appId}::\${layerKey}::b\`] || null;
  vscode.postMessage({ command: 'fetchLayerContent', appId, layerKey, layerA, layerB, ...LAST_RUN });
}

function openLayerDiff(appId, layerKey) {
  const c = LAYER_CONTENT_CACHE[\`\${appId}::\${layerKey}\`];
  if (c && !c.loading && !c.error) {
    sendDiff(c.normA||'', c.normB||'', layerKey.replace(/[^a-zA-Z0-9._-]/g,'_')+'.json', LAST_RUN?.profileA, LAST_RUN?.profileB);
    return;
  }
  PENDING_DIFF = { appId, layerKey };
  setStatus('Loading layer content for diff\u2026');
  loadLayerContent(appId, layerKey);
}

function applyLayerByKey(appId, layerKey, direction) {
  const side  = direction === 'aToB' ? 'a' : 'b';
  const layer = LAYER_OBJECTS[\`\${appId}::\${layerKey}::\${side}\`] || null;
  vscode.postMessage({ command: 'applyLayer', appId, layer, layerKey, direction, ...LAST_RUN });
}

// \u2500\u2500 Unified native diff helpers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function sendDiff(cA, cB, fileName, lA, lB) {
  vscode.postMessage({ command: 'openNativeDiff',
    contentA: cA, contentB: cB,
    fileName: fileName, labelA: lA || 'A', labelB: lB || 'B' });
}
function openFnDiff(libId, fnId) {
  const lib = (FN_DATA?.libraries||[]).find(l=>l.libID===libId);
  const fn  = (lib?.fnDiffs||[]).find(f=>f.fnID===fnId);
  if (!fn) return;
  sendDiff(fn.fa?._code||'', fn.fb?._code||'', fnId+'.cs', LAST_RUN?.profileA, LAST_RUN?.profileB);
}
function openBpmDirDiff(methodCode, dirName) {
  for (const svc of (BPM_DATA?.services||[])) {
    for (const m of (svc.methods||[])) {
      if (m.methodCode !== methodCode) continue;
      const d = (m.dirDiffs||[]).find(x=>x.name===dirName);
      if (d) { sendDiff(d.da?._code||'', d.db?._code||'', dirName.replace(/[^a-zA-Z0-9._-]/g,'_')+'.cs', LAST_RUN?.profileA, LAST_RUN?.profileB); return; }
    }
  }
}
function openLayerDiff_unused(appId, fileName) {
  // kept for reference only \u2014 replaced by openLayerDiff above
  if (!appId) return;
  sendDiff(f.normA||'', f.normB||'', fileName, LAST_RUN?.profileA, LAST_RUN?.profileB);
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// SHARED DIFF RENDERING
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

function sideBySide(textA, textB, labelA, labelB) {
  const linesA = textA.split('\\n'), linesB = textB.split('\\n');
  const diff = lcs(linesA, linesB);
  let cells = '', nA = 1, nB = 1;
  for (const d of diff) {
    if (d.t === 'skip') {
      cells += \`<div class="diff-cell skip"><span class="ln">\${nA}\u2013\${nA+d.countA-1}</span>\${esc(d.v)}</div><div class="diff-cell skip"><span class="ln">\${nB}\u2013\${nB+d.countB-1}</span>\${esc(d.v)}</div>\`;
      nA += d.countA; nB += d.countB;
    } else if (d.t === '=') {
      cells += \`<div class="diff-cell ctx"><span class="ln">\${nA++}</span>\${esc(d.v)}</div><div class="diff-cell ctx"><span class="ln">\${nB++}</span>\${esc(d.v)}</div>\`;
    } else if (d.t === '-') {
      cells += \`<div class="diff-cell del"><span class="ln">\${nA++}</span>\${esc(d.v)}</div><div class="diff-cell empty"></div>\`;
    } else {
      cells += \`<div class="diff-cell empty"></div><div class="diff-cell add"><span class="ln">\${nB++}</span>\${esc(d.v)}</div>\`;
    }
  }
  return \`<div class="diff-wrap"><div class="diff-col-hdrs"><div class="diff-col-hdr a">\u25CF \${labelA}</div><div class="diff-col-hdr b">\u25CF \${labelB}</div></div><div class="diff-scroll"><div class="diff-grid">\${cells}</div></div></div>\`;
}

function lcs(A, B) {
  const n = A.length, m = B.length;
  if (n > 800 || m > 800) return [...A.map(v=>({t:'-',v})), ...B.map(v=>({t:'+',v}))];
  const dp = Array.from({length:n+1},()=>new Int32Array(m+1));
  for (let i=n-1;i>=0;i--) for (let j=m-1;j>=0;j--) dp[i][j]=A[i]===B[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
  const out=[]; let i=0,j=0;
  while(i<n||j<m){
    if(i<n&&j<m&&A[i]===B[j]){out.push({t:'=',v:A[i]});i++;j++;}
    else if(j<m&&(i>=n||dp[i][j+1]>=dp[i+1][j])){out.push({t:'+',v:B[j]});j++;}
    else{out.push({t:'-',v:A[i]});i++;}
  }
  const CTX=3, result=[];
  let equalRun=[];
  function flush(last){
    if(!equalRun.length) return;
    if(result.length===0&&last){result.push(...equalRun);equalRun=[];return;}
    if(result.length>0) result.push(...equalRun.slice(0,CTX));
    const mid=equalRun.length-CTX*2;
    if(!last&&mid>0) result.push({t:'skip',v:\`\u2026 \${mid} unchanged lines \u2026\`,countA:mid,countB:mid});
    if(!last) result.push(...equalRun.slice(-CTX));
    else result.push(...equalRun.slice(Math.max(0,equalRun.length-CTX)));
    equalRun=[];
  }
  for(const d of out){ if(d.t==='=') equalRun.push(d); else{flush(false);result.push(d);} }
  flush(true);
  return result;
}

function inlineListDiff(strA, strB, labelA, labelB) {
  const setA = new Set((strA||'').split('\\n').filter(Boolean));
  const setB = new Set((strB||'').split('\\n').filter(Boolean));
  const all = [...new Set([...setA,...setB])].sort();
  let cells = '';
  for (const item of all) {
    const inA=setA.has(item), inB=setB.has(item);
    if(inA&&inB){ cells+=\`<div class="diff-cell ctx">\${esc(item)}</div><div class="diff-cell ctx">\${esc(item)}</div>\`; }
    else if(inA){ cells+=\`<div class="diff-cell del">\${esc(item)}</div><div class="diff-cell empty"></div>\`; }
    else       { cells+=\`<div class="diff-cell empty"></div><div class="diff-cell add">\${esc(item)}</div>\`; }
  }
  return \`<div class="diff-wrap"><div class="diff-col-hdrs"><div class="diff-col-hdr a">\u25CF \${labelA}</div><div class="diff-col-hdr b">\u25CF \${labelB}</div></div><div class="diff-scroll"><div class="diff-grid">\${cells}</div></div></div>\`;
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// UI HELPERS
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

function chip(filter, cls, label, group, count) {
  const cur = group==='fnFilter'?FN_FILTER : group==='bpmFilter'?BPM_FILTER : LY_FILTER;
  const badge = count!==undefined ? \`<span class="chip-count">\${count}</span>\` : '';
  return \`<button class="chip \${cls} \${filter===cur?'active':''}" data-chip="\${group}" onclick="\${group}('\${filter}',this)">\${label}\${badge}</button>\`;
}
function toggleFn(id) { document.getElementById(id)?.classList.toggle('open'); }
function toggleEl(id, chevId) {
  const el = document.getElementById(id), chev = document.getElementById(chevId);
  const open = el.style.display === 'none';
  el.style.display = open ? 'block' : 'none';
  if (chev) chev.classList.toggle('open', open);
}
function switchFnTab(btn, fnID, tab) {
  const body = btn.closest('.fn-body') || btn.closest('.lib-info-body');
  if (!body) return;
  body.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
  body.querySelectorAll('.pane').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');
  body.querySelector(\`.pane[data-fn="\${fnID}"][data-tab="\${tab}"]\`)?.classList.add('active');
}
function switchLibTab(btn, lid, tab) {
  const wrap = btn.closest('div[id="' + lid + '"]') || btn.parentElement?.nextElementSibling?.parentElement;
  if (!wrap) return;
  btn.closest('.tabs')?.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll(\`[data-libtab="\${lid}"]\`).forEach(p=>p.classList.remove('active'));
  document.querySelector(\`[data-libtab="\${lid}"][data-tab="\${tab}"]\`)?.classList.add('active');
}
</script>
</body>
</html>`
        );
      }
    };
    ComparePanel2.KEY = "efxCompare";
    ComparePanel2.panels = /* @__PURE__ */ new Map();
    exports2.ComparePanel = ComparePanel2;
  }
});

// src/extension.js
var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
  if (k2 === void 0) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = { enumerable: true, get: function() {
      return m[k];
    } };
  }
  Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
  if (k2 === void 0) k2 = k;
  o[k2] = m[k];
}));
var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
  Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
  o["default"] = v;
});
var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
  var ownKeys = function(o) {
    ownKeys = Object.getOwnPropertyNames || function(o2) {
      var ar = [];
      for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
      return ar;
    };
    return ownKeys(o);
  };
  return function(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) {
      for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
    }
    __setModuleDefault(result, mod);
    return result;
  };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
var vscode = __importStar(require("vscode"));
var path = __importStar(require("path"));
var fs = __importStar(require("fs"));
var epicorClient_1 = require_epicorClient();
var treeProvider_1 = require_treeProvider();
var executePanel_1 = require_executePanel();
var bpmClient_1 = require_bpmClient();
var bpmTreeProvider_1 = require_bpmTreeProvider();
var { openWidgetPanel } = require_bpmWidgetPanel();
var updater_1 = require_updater();
var kineticLayerClient_1 = require_kineticLayerClient();
var { ComparePanel } = require_comparePanel();
var pulledTablesets = /* @__PURE__ */ new Map();
var fileMap = /* @__PURE__ */ new Map();
var pushInProgress = /* @__PURE__ */ new Set();
var client = null;
var bpmClientInst = null;
var treeProvider;
var bpmTreeProvider;
var efxLibrariesView = null;
var bpmMethodsView = null;
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
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === openChar) {
      depth++;
    } else if (ch === closeChar) {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}
function findEfxFunctionRowBounds(rawTableset, libraryId, functionId) {
  const arrayProp = '"EfxFunction"';
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
  const libraryNeedle = '"LibraryID":' + jsonStringLiteral(libraryId);
  const functionNeedle = '"FunctionID":' + jsonStringLiteral(functionId);
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
  const propNeedle = '"' + propName + '":';
  const propIndex = row.indexOf(propNeedle);
  if (propIndex < 0) {
    throw new Error(`${propName} property not found in target EfxFunction row`);
  }
  let valueStart = propIndex + propNeedle.length;
  while (/\s/.test(row[valueStart] || "")) {
    valueStart++;
  }
  if (row[valueStart] !== '"') {
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
    if (ch === '"') {
      break;
    }
  }
  if (i >= row.length) {
    throw new Error(`${propName} string did not terminate in target EfxFunction row`);
  }
  return row.slice(0, valueStart) + newJsonStringLiteral + row.slice(i + 1);
}
function markEfxFunctionDeleted(rawTableset, libraryId, functionId) {
  const bounds = findEfxFunctionRowBounds(rawTableset, libraryId, functionId);
  const newRow = replaceJsonStringProperty(bounds.row, "RowMod", JSON.stringify("D"));
  if (newRow === bounds.row) {
    throw new Error(`Target EfxFunction row did not change for ${libraryId}.${functionId}`);
  }
  const updated = rawTableset.slice(0, bounds.start) + newRow + rawTableset.slice(bounds.end);
  JSON.parse(updated);
  return updated;
}
function injectRowIntoArray(rawTableset, arrayName, newRowJson) {
  const needle = `"${arrayName}":[`;
  const arrayPropIdx = rawTableset.indexOf(needle);
  if (arrayPropIdx === -1) {
    throw new Error(`Array "${arrayName}" not found in raw tableset`);
  }
  const arrayStart = rawTableset.indexOf("[", arrayPropIdx);
  const arrayEnd = findMatchingRaw(rawTableset, arrayStart, "[", "]");
  if (arrayEnd < 0) {
    throw new Error(`Could not find end of "${arrayName}" array`);
  }
  const arrayContent = rawTableset.substring(arrayStart + 1, arrayEnd).trim();
  const sep = arrayContent.length > 0 ? "," : "";
  return rawTableset.substring(0, arrayEnd) + sep + newRowJson + rawTableset.substring(arrayEnd);
}
function findEfxRefTableRowBounds(rawTableset, tableId) {
  const arrayProp = '"EfxRefTable"';
  const propIndex = rawTableset.indexOf(arrayProp);
  if (propIndex < 0) throw new Error("EfxRefTable array not found in raw tableset");
  const arrayStart = rawTableset.indexOf("[", propIndex);
  if (arrayStart < 0) throw new Error("EfxRefTable array start not found in raw tableset");
  const arrayEnd = findMatchingRaw(rawTableset, arrayStart, "[", "]");
  if (arrayEnd < 0) throw new Error("EfxRefTable array end not found in raw tableset");
  const tableNeedle = '"TableID":' + jsonStringLiteral(tableId);
  let cursor = arrayStart + 1;
  while (cursor < arrayEnd) {
    const objStart = rawTableset.indexOf("{", cursor);
    if (objStart < 0 || objStart > arrayEnd) break;
    const objEnd = findMatchingRaw(rawTableset, objStart, "{", "}");
    if (objEnd < 0 || objEnd > arrayEnd) throw new Error("Malformed EfxRefTable row object in raw tableset");
    const row = rawTableset.slice(objStart, objEnd + 1);
    if (row.includes(tableNeedle)) return { start: objStart, end: objEnd + 1, row };
    cursor = objEnd + 1;
  }
  throw new Error(`EfxRefTable row not found in raw tableset for ${tableId}`);
}
function setRawLibraryRowMod(rawTableset, rowMod) {
  const arrayPropIdx = rawTableset.indexOf('"EfxLibrary":[');
  if (arrayPropIdx < 0) throw new Error("EfxLibrary array not found in raw tableset");
  const arrayStart = rawTableset.indexOf("[", arrayPropIdx);
  const objStart = rawTableset.indexOf("{", arrayStart);
  if (objStart < 0) throw new Error("No EfxLibrary row found in raw tableset");
  const objEnd = findMatchingRaw(rawTableset, objStart, "{", "}");
  const objStr = rawTableset.slice(objStart, objEnd + 1);
  const patched = replaceJsonStringProperty(objStr, "RowMod", JSON.stringify(rowMod));
  return rawTableset.slice(0, objStart) + patched + rawTableset.slice(objEnd + 1);
}
function replaceJsonBoolProp(objStr, propName, newBool) {
  const needle = '"' + propName + '":';
  const propIdx = objStr.indexOf(needle);
  if (propIdx < 0) throw new Error(`${propName} not found in object`);
  let vStart = propIdx + needle.length;
  while (/\s/.test(objStr[vStart] || "")) vStart++;
  const isTrue = objStr.startsWith("true", vStart);
  const isFalse = objStr.startsWith("false", vStart);
  if (!isTrue && !isFalse) throw new Error(`${propName} is not a boolean in object`);
  const vEnd = vStart + (isTrue ? 4 : 5);
  return objStr.slice(0, vStart) + String(newBool) + objStr.slice(vEnd);
}
function markEfxRefTableUpdatable(rawTableset, tableId, updatable) {
  const bounds = findEfxRefTableRowBounds(rawTableset, tableId);
  let newRow = replaceJsonBoolProp(bounds.row, "Updatable", updatable);
  newRow = replaceJsonStringProperty(newRow, "RowMod", JSON.stringify("U"));
  let updated = rawTableset.slice(0, bounds.start) + newRow + rawTableset.slice(bounds.end);
  updated = setRawLibraryRowMod(updated, "U");
  JSON.parse(updated);
  return updated;
}
async function saveOpenDocumentIfDirty(filePath) {
  const normalized = normalizeFsPath(filePath);
  const doc = vscode.workspace.textDocuments.find((d) => d.uri && normalizeFsPath(d.uri.fsPath) === normalized);
  if (doc && doc.isDirty) {
    pushInProgress.add(normalized);
    try {
      const saved = await doc.save();
      if (!saved) {
        throw new Error(`Could not save ${filePath}`);
      }
    } finally {
      pushInProgress.delete(normalized);
    }
  }
}
function severityFromCode(code) {
  if (code === 1) return vscode.DiagnosticSeverity.Warning;
  if (code === 0) return vscode.DiagnosticSeverity.Hint;
  return vscode.DiagnosticSeverity.Error;
}
function stripGeneratedHeader(fileContent) {
  const lines = fileContent.split(/\r?\n/);
  const markerIndex = lines.findIndex(
    (line) => line.startsWith("// \u2500\u2500\u2500\u2500\u2500") || line.startsWith("// -----")
  );
  if (markerIndex < 0) {
    return fileContent;
  }
  const markerLine = lines[markerIndex];
  const gluedUnicode = markerLine.indexOf("// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
  const gluedAscii = markerLine.indexOf("// --------------------------------------------------");
  let gluedRemainder = "";
  if (gluedUnicode >= 0) {
    gluedRemainder = markerLine.slice(gluedUnicode + "// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500".length).trimStart();
  } else if (gluedAscii >= 0) {
    gluedRemainder = markerLine.slice(gluedAscii + "// --------------------------------------------------".length).trimStart();
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
    const level = e.ErrorLevel !== void 0 ? `Level ${e.ErrorLevel}` : "Error";
    const type = e.ErrorType ? ` (${e.ErrorType})` : "";
    const table = e.TableName ? `
Table: ${e.TableName}` : "";
    const text = e.ErrorText || e.Message || JSON.stringify(e);
    return `${index + 1}. ${level}${type}${table}
${text}`;
  }).join("\n\n");
}
function activate(context) {
  treeProvider = new treeProvider_1.EfxTreeProvider(null);
  efxLibrariesView = vscode.window.createTreeView("efxLibraries", { treeDataProvider: treeProvider });
  context.subscriptions.push(efxLibrariesView);
  bpmTreeProvider = new bpmTreeProvider_1.BpmTreeProvider(null);
  bpmMethodsView = vscode.window.createTreeView("bpmMethods", { treeDataProvider: bpmTreeProvider });
  context.subscriptions.push(bpmMethodsView);
  initClient(context).then(() => updateViewDescriptions());
  updater_1.registerUpdateCommand(context);
  updater_1.checkForUpdatesOnStartup(context);
  const manageProfilesHandler = async () => {
    await openProfileManager(context);
  };
  context.subscriptions.push(vscode.commands.registerCommand("efx.manageProfiles", manageProfilesHandler));
  context.subscriptions.push(vscode.commands.registerCommand("efx.configureConnection", manageProfilesHandler));
  context.subscriptions.push(vscode.commands.registerCommand("efx.switchProfile", async () => {
    await switchActiveProfile(context);
  }));
  context.subscriptions.push(vscode.commands.registerCommand("efx.switchCompany", async () => {
    await switchActiveCompany(context);
  }));
  context.subscriptions.push(vscode.commands.registerCommand("efx.refreshLibraries", async () => {
    if (!client) {
      vscode.window.showWarningMessage("EFx: Configure connection first");
      return;
    }
    await treeProvider.refresh();
  }));
  context.subscriptions.push(vscode.commands.registerCommand("efx.pullFunction", async (node) => {
    if (!client || !node) {
      return;
    }
    const libraryId = node.libraryId;
    const functionId = node.func.FunctionID;
    await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `Pulling ${functionId}...` }, async () => {
      try {
        treeProvider.invalidateCache(libraryId);
        const tableset = await treeProvider.getLibraryTableset(libraryId);
        if (!tableset) {
          return;
        }
        pulledTablesets.set(libraryId, tableset);
        const funcRow = tableset.EfxFunction.find((f) => f.FunctionID === functionId);
        if (!funcRow) {
          vscode.window.showErrorMessage(`Function ${functionId} not found`);
          return;
        }
        const { code, usings } = epicorClient_1.EpicorClient.extractCode(funcRow.Body);
        const efxDir = getEfxDir();
        const libDir = path.join(efxDir, libraryId);
        fs.mkdirSync(libDir, { recursive: true });
        const filePath = path.join(libDir, `${functionId}.cs`);
        const header = [
          `// EFx Function: ${libraryId}.${functionId}`,
          `// Pulled: ${(/* @__PURE__ */ new Date()).toISOString()}`,
          usings ? `// Usings: ${usings}` : "",
          "// --------------------------------------------------",
          ""
        ].filter((l) => l !== "").join("\n");
        fs.writeFileSync(filePath, header.replace(/\s*$/, "") + "\n\n" + code, "utf-8");
        fileMap.set(normalizeFsPath(filePath), { libraryId, functionId });
        const doc = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
        vscode.window.showInformationMessage(`EFx: Pulled ${libraryId}.${functionId}`);
      } catch (err) {
        vscode.window.showErrorMessage(`EFx Pull failed: ${err.message}`);
      }
    });
  }));
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
    } else {
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
          await saveOpenDocumentIfDirty(filePath);
          const freshTableset = await client.getLibrary(libraryId);
          const libraryRow = freshTableset.EfxLibrary && freshTableset.EfxLibrary[0];
          if (!libraryRow) {
            throw new Error(`Library ${libraryId} not found on server`);
          }
          if (libraryRow.Frozen === true) {
            const reason = libraryRow.Published ? `${libraryId} is promoted to production \u2014 demote it first (right-click the library \u2192 Demote from Production).` : `${libraryId} is locked/frozen in Epicor. Unfreeze it before editing.`;
            throw new Error(reason);
          }
          let fileContent = fs.readFileSync(filePath, "utf-8");
          fileContent = stripGeneratedHeader(fileContent);
          const funcRow = freshTableset.EfxFunction.find((f) => f.FunctionID === functionId);
          if (!funcRow) {
            throw new Error(`Function ${functionId} not found on server`);
          }
          const existing = epicorClient_1.EpicorClient.extractCode(funcRow.Body);
          const result = await client.validateFunctionViaWrapper(
            libraryId,
            functionId,
            fileContent,
            existing.usings,
            "Utilities",
            "ApplyChangesWithDiagnostics"
          );
          const uri = vscode.Uri.file(filePath);
          if (!result.saved) {
            const diagnostics = result.diagnostics || result.errors || [];
            if (diagnostics.length > 0) {
              const vsDiags = diagnostics.map((d) => {
                if (typeof d === "object" && d !== null) {
                  const line = Math.max(0, (d.Line ?? 1) - 1);
                  const msg = [d.Code, d.Message].filter(Boolean).join(": ") || String(d);
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
            throw new Error(result.errors?.[0] || result.outMsg || result.outResult || "Wrapper save failed");
          }
          const verifyTableset = await client.getLibrary(libraryId);
          const verifyFunc = verifyTableset.EfxFunction.find((f) => f.FunctionID === functionId);
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
          const cachedTableset = pulledTablesets.get(libraryId);
          const cachedFunc = cachedTableset?.EfxFunction?.find((f) => f.FunctionID === functionId);
          if (cachedFunc && result.newBody) {
            cachedFunc.Body = result.newBody;
          }
          treeProvider.invalidateCache(libraryId);
        } catch (err) {
          console.error("EFx Push failed:", err);
          vscode.window.showErrorMessage(`EFx Push failed: ${err.message}`);
        }
      }
    );
  }));
  context.subscriptions.push(vscode.commands.registerCommand("efx.regenerateLibrary", async (node) => {
    if (!client) {
      vscode.window.showWarningMessage("EFx: Configure connection first");
      return;
    }
    let libraryId;
    if (node?.library?.LibraryID) {
      libraryId = node.library.LibraryID;
    } else if (node?.libraryId) {
      libraryId = node.libraryId;
    } else {
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
            content: `# EFx Validation Errors: ${libraryId}

\`\`\`text
${msg}
\`\`\`
`
          });
          await vscode.window.showTextDocument(doc, vscode.ViewColumn.Two);
          vscode.window.showWarningMessage(`EFx: ${libraryId} has ${errors.length} validation error(s)`);
        } catch (err) {
          vscode.window.showErrorMessage(`EFx Validate failed: ${err.message}`);
        }
      }
    );
  }));
  context.subscriptions.push(vscode.commands.registerCommand("efx.executeFunction", async (node) => {
    if (!client || !node) {
      return;
    }
    const profile = getActiveProfile();
    const companies = profile ? profile.companies || [] : [];
    const defaultCompany = getActiveCompany() || (companies[0] || "");
    const libMeta = (treeProvider.libraries || []).find((l) => l.LibraryID === node.libraryId);
    const staging = libMeta ? !libMeta.Published : false;
    executePanel_1.ExecutePanel.show(client, node.libraryId, node.func.FunctionID, node.signatures, companies, defaultCompany, treeProvider, staging);
  }));
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
    } catch (err) {
      vscode.window.showErrorMessage(`EFx Demote failed: ${err.message}`);
    }
  }));
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
    } catch (err) {
      vscode.window.showErrorMessage(`EFx Promote failed: ${err.message}`);
    }
  }));
  context.subscriptions.push(vscode.commands.registerCommand("efx.newFunction", async (node) => {
    if (!client) {
      vscode.window.showWarningMessage("EFx: Configure connection first");
      return;
    }
    let libraryId;
    if (node && node.library) {
      libraryId = node.library.LibraryID;
    } else if (node && node.libraryId) {
      libraryId = node.libraryId;
    } else {
      libraryId = await vscode.window.showInputBox({
        prompt: "Library ID to add the function to",
        placeHolder: "e.g. PaintLineFuncts"
      });
    }
    if (!libraryId) return;
    const functionId = await vscode.window.showInputBox({
      prompt: "New Function ID",
      placeHolder: "e.g. MyNewFunction",
      validateInput: (val) => {
        if (!val || val.trim().length === 0) return "Function ID is required";
        if (/\s/.test(val)) return "Function ID cannot contain spaces";
        return null;
      }
    });
    if (!functionId) return;
    const description = await vscode.window.showInputBox({
      prompt: "Description (optional)",
      placeHolder: "Short description of the function"
    });
    const PARAM_TYPES = [
      "string",
      "int",
      "decimal",
      "bool",
      "DateTime",
      "System.Data.DataSet",
      "System.Data.DataTable",
      "Custom\u2026"
    ];
    async function collectParams(label) {
      const params = [];
      while (true) {
        const argName = await vscode.window.showInputBox({
          prompt: `${label} param name (leave blank to finish)`,
          placeHolder: "e.g. partNum",
          ignoreFocusOut: true
        });
        if (!argName) break;
        const typePick = await vscode.window.showQuickPick(
          PARAM_TYPES.map((t) => ({ label: t })),
          { placeHolder: `Data type for "${argName}"`, ignoreFocusOut: true }
        );
        if (!typePick) break;
        let dataType = typePick.label;
        if (dataType === "Custom\u2026") {
          const custom = await vscode.window.showInputBox({
            prompt: "Enter full .NET type name",
            placeHolder: "e.g. Erp.Tablesets.SalesOrderTableset",
            ignoreFocusOut: true
          });
          if (!custom) break;
          dataType = custom;
        }
        params.push({ ArgumentName: argName, DataType: dataType });
      }
      return params;
    }
    const addReqPick = await vscode.window.showQuickPick(
      [{ label: "Skip \u2014 add later", value: false }, { label: "Add request params now", value: true }],
      { placeHolder: "Add request parameters?", ignoreFocusOut: true }
    );
    const requestParams = addReqPick?.value ? await collectParams("Request") : [];
    const addRespPick = await vscode.window.showQuickPick(
      [{ label: "Skip \u2014 add later", value: false }, { label: "Add response params now", value: true }],
      { placeHolder: "Add response parameters?", ignoreFocusOut: true }
    );
    const responseParams = addRespPick?.value ? await collectParams("Response") : [];
    const allSigs = [
      ...requestParams.map((p, i) => ({ ...p, Response: false, Order: i })),
      ...responseParams.map((p, i) => ({ ...p, Response: true, Order: i }))
    ];
    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: `Creating ${functionId}...` },
      async () => {
        try {
          let rawTableset = await client.getLibraryRaw(libraryId);
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
          const efxFuncArrayStart = rawTableset.indexOf('"EfxFunction":[');
          if (efxFuncArrayStart === -1) {
            vscode.window.showErrorMessage("EFx: Could not find EfxFunction array in tableset");
            return;
          }
          const arrayStart = rawTableset.indexOf("[", efxFuncArrayStart);
          let depth = 0;
          let arrayEnd = -1;
          for (let i = arrayStart; i < rawTableset.length; i++) {
            const ch = rawTableset[i];
            if (ch === '"') {
              i++;
              while (i < rawTableset.length) {
                if (rawTableset[i] === "\\") {
                  i++;
                } else if (rawTableset[i] === '"') {
                  break;
                }
                i++;
              }
              continue;
            }
            if (ch === "[") depth++;
            if (ch === "]") {
              depth--;
              if (depth === 0) {
                arrayEnd = i;
                break;
              }
            }
          }
          if (arrayEnd === -1) {
            vscode.window.showErrorMessage("EFx: Could not parse EfxFunction array");
            return;
          }
          const arrayContent = rawTableset.substring(arrayStart + 1, arrayEnd).trim();
          const separator = arrayContent.length > 0 ? "," : "";
          rawTableset = rawTableset.substring(0, arrayEnd) + separator + newFuncJson + rawTableset.substring(arrayEnd);
          const result = await client.applyChangesRaw(rawTableset);
          if (result.diagnostics && result.diagnostics.length > 0) {
            const diagMsg = result.diagnostics.join("\n");
            vscode.window.showWarningMessage(`EFx: ${functionId} created with diagnostics:
${diagMsg}`);
          } else {
            vscode.window.showInformationMessage(`EFx: Created ${libraryId}.${functionId} \u2713`);
          }
          if (allSigs.length > 0) {
            let sigSaved = false;
            let sigErr = null;
            for (let attempt = 0; attempt < 4; attempt++) {
              if (attempt > 0) {
                await new Promise((r) => setTimeout(r, 800 * attempt));
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
              vscode.window.showInformationMessage(`EFx: Saved ${allSigs.length} parameter(s) for ${functionId} \u2713`);
            } else {
              vscode.window.showWarningMessage(`EFx: Function created but signatures failed: ${sigErr?.message}. Add them via \u2699 Edit Signatures in the Execute panel.`);
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
  context.subscriptions.push(vscode.commands.registerCommand("efx.deleteFunction", async (node) => {
    if (!client) {
      vscode.window.showWarningMessage("EFx: Configure connection first");
      return;
    }
    if (!node) {
      vscode.window.showWarningMessage("EFx: Delete must be invoked from a function in the tree.");
      return;
    }
    const libraryId = node.libraryId;
    const functionId = node.func && node.func.FunctionID;
    if (!libraryId || !functionId) {
      vscode.window.showErrorMessage("EFx: Could not determine library/function from selection.");
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
          const tableset = await client.getLibrary(libraryId);
          const libraryRow = tableset && tableset.EfxLibrary && tableset.EfxLibrary[0];
          if (!libraryRow) {
            throw new Error(`Library ${libraryId} not found on server`);
          }
          if (libraryRow.Frozen === true) {
            const reason = libraryRow.Published ? `${libraryId} is promoted to production \u2014 demote it first (right-click the library \u2192 Demote from Production).` : `${libraryId} is locked/frozen in Epicor. Unfreeze it before deleting functions.`;
            throw new Error(reason);
          }
          const rawTableset = await client.getLibraryRaw(libraryId);
          const updatedRaw = markEfxFunctionDeleted(rawTableset, libraryId, functionId);
          const result = await client.applyChangesRaw(updatedRaw);
          const diags = result.diagnostics || [];
          const hasErrors = diags.some(
            (d) => typeof d === "object" ? (d.Severity ?? 2) >= 2 : /\berror\b/i.test(String(d))
          );
          if (hasErrors) {
            const msg = diags.map((d) => typeof d === "object" ? d.ErrorText || JSON.stringify(d) : String(d)).join("\n");
            throw new Error(`Server rejected delete:
${msg}`);
          }
          pulledTablesets.delete(libraryId);
          for (const [k, v] of fileMap.entries()) {
            if (v && v.libraryId === libraryId && v.functionId === functionId) {
              fileMap.delete(k);
            }
          }
          treeProvider.invalidateCache(libraryId);
          await treeProvider.refresh();
          vscode.window.showInformationMessage(`EFx: Deleted ${libraryId}.${functionId} \u2713 (local .cs file, if any, was left in place)`);
        } catch (err) {
          vscode.window.showErrorMessage(`EFx: Delete function failed: ${err.message}`);
        }
      }
    );
  }));
  context.subscriptions.push(vscode.commands.registerCommand("efx.newLibrary", async () => {
    if (!client) {
      vscode.window.showWarningMessage("EFx: Configure connection first");
      return;
    }
    const libraryId = await vscode.window.showInputBox({
      prompt: "New Library ID",
      placeHolder: "e.g. MyNewLibrary",
      validateInput: (val) => {
        if (!val || val.trim().length === 0) return "Library ID is required";
        if (/\s/.test(val)) return "Library ID cannot contain spaces";
        return null;
      }
    });
    if (!libraryId) return;
    const description = await vscode.window.showInputBox({
      prompt: "Description (optional)",
      placeHolder: "Short description of the library"
    });
    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: `Creating library ${libraryId}...` },
      async () => {
        try {
          let rawDefaults = await client.getDefaultsRaw();
          rawDefaults = rawDefaults.replace(/"LibraryID":"@library"/g, `"LibraryID":"${libraryId}"`);
          rawDefaults = rawDefaults.replace(/"OriginalID":"@library"/, `"OriginalID":"${libraryId}"`);
          rawDefaults = rawDefaults.replace(/"FunctionID":"@function"/, `"FunctionID":"__placeholder__"`);
          if (description) {
            rawDefaults = rawDefaults.replace(/"Description":null/, `"Description":"${description}"`);
          }
          rawDefaults = rawDefaults.replace(
            /("OriginalID":"[^"]*"[^}]*"RowMod":")(")/,
            "$1A$2"
          );
          rawDefaults = rawDefaults.replace('"AllowCustomCodeFunctions":false', '"AllowCustomCodeFunctions":true');
          rawDefaults = rawDefaults.replace('"DirectDBAccess":0', '"DirectDBAccess":2');
          const efxFuncStart = rawDefaults.indexOf('"EfxFunction":[');
          if (efxFuncStart !== -1) {
            const bracketStart = rawDefaults.indexOf("[", efxFuncStart);
            let depth = 0;
            let bracketEnd = -1;
            for (let i = bracketStart; i < rawDefaults.length; i++) {
              const ch = rawDefaults[i];
              if (ch === '"') {
                i++;
                while (i < rawDefaults.length) {
                  if (rawDefaults[i] === "\\") {
                    i++;
                  } else if (rawDefaults[i] === '"') {
                    break;
                  }
                  i++;
                }
                continue;
              }
              if (ch === "[") depth++;
              if (ch === "]") {
                depth--;
                if (depth === 0) {
                  bracketEnd = i;
                  break;
                }
              }
            }
            if (bracketEnd !== -1) {
              rawDefaults = rawDefaults.substring(0, bracketStart) + "[]" + rawDefaults.substring(bracketEnd + 1);
            }
          }
          const result = await client.applyChangesRaw(rawDefaults);
          if (result.diagnostics && result.diagnostics.length > 0) {
            const diagMsg = result.diagnostics.join("\n");
            vscode.window.showWarningMessage(`EFx: Library ${libraryId} created with diagnostics:
${diagMsg}`);
          } else {
            vscode.window.showInformationMessage(`EFx: Created library ${libraryId} \u2713`);
          }
          await treeProvider.refresh();
        } catch (err) {
          vscode.window.showErrorMessage(`EFx: Create library failed: ${err.message}`);
        }
      }
    );
  }));
  context.subscriptions.push(vscode.commands.registerCommand("efx.addTable", async (node) => {
    if (!client || !node) return;
    const libraryId = node.libraryId;
    const COMMON_TABLES = [
      "ERP.Part",
      "ERP.PartBin",
      "ERP.PartCost",
      "ERP.PartPlant",
      "ERP.PartUOM",
      "ERP.PartWhse",
      "ERP.PartCOO",
      "ERP.PartPC",
      "ERP.PartRev",
      "ERP.Customer",
      "ERP.CustCnt",
      "ERP.ShipTo",
      "ERP.OrderHed",
      "ERP.OrderDtl",
      "ERP.OrderRel",
      "ERP.QuoteHed",
      "ERP.QuoteDtl",
      "ERP.JobHead",
      "ERP.JobAsmbl",
      "ERP.JobMtl",
      "ERP.JobOper",
      "ERP.ShipHead",
      "ERP.ShipDtl",
      "ERP.PurchaseOrder",
      "ERP.PODetail",
      "ERP.PORel",
      "ERP.Vendor",
      "ERP.VendPart",
      "ERP.PriceLst",
      "ERP.PriceLstParts",
      "ERP.LaborDtl",
      "ERP.LaborHed",
      "ERP.PlantWhse",
      "ERP.PartTran",
      "ERP.Country",
      "ERP.Currency",
      "ERP.UD01",
      "ERP.UD02",
      "ERP.UD03",
      "ERP.UD04",
      "ERP.UD05",
      "ERP.UD06",
      "ERP.UD07",
      "ERP.UD08",
      "ERP.UD09",
      "ERP.UD10",
      "ICE.UD11",
      "ICE.UD12",
      "ICE.UD13",
      "ICE.UD14",
      "ICE.UD15",
      "ICE.UD16",
      "ICE.UD17",
      "ICE.UD18",
      "ICE.UD19",
      "ICE.UD20"
    ].sort();
    const picks = [
      { label: "$(edit) Enter manually...", alwaysShow: true, manual: true },
      ...COMMON_TABLES.map((t) => ({ label: t, manual: false }))
    ];
    const selection = await vscode.window.showQuickPick(picks, {
      placeHolder: "Select a table or enter manually (format: ERP.Part)",
      matchOnDescription: true
    });
    if (!selection) return;
    let tableId;
    if (selection.manual) {
      tableId = await vscode.window.showInputBox({
        prompt: "Table ID",
        placeHolder: "e.g. ERP.PartBin or ICE.UD11",
        validateInput: (v) => !v || !v.includes(".") ? "Format must be NAMESPACE.TableName" : null
      });
    } else {
      tableId = selection.label;
    }
    if (!tableId) return;
    const updatablePick = await vscode.window.showQuickPick(
      [{ label: "Read-only", value: false }, { label: "Updatable", value: true }],
      { placeHolder: "Read-only or Updatable?" }
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
            SysRowID: "00000000-0000-0000-0000-000000000000",
            RowMod: "A"
          });
          raw = injectRowIntoArray(raw, "EfxRefTable", newRow);
          const result = await client.applyChangesRaw(raw);
          if (result.diagnostics && result.diagnostics.length > 0) {
            vscode.window.showWarningMessage(`EFx: Table added with diagnostics: ${result.diagnostics.join(", ")}`);
          } else {
            vscode.window.showInformationMessage(`EFx: Added table ${tableId} to ${libraryId} \u2713`);
          }
          treeProvider.invalidateCache(libraryId);
          treeProvider._onDidChangeTreeData.fire(void 0);
        } catch (err) {
          vscode.window.showErrorMessage(`EFx: Add table failed: ${err.message}`);
        }
      }
    );
  }));
  context.subscriptions.push(vscode.commands.registerCommand("efx.setTableUpdatable", async (node) => {
    if (!client) {
      vscode.window.showWarningMessage("EFx: Configure connection first");
      return;
    }
    if (!node || !node.row) {
      vscode.window.showWarningMessage("EFx: Must be invoked from a table in the tree.");
      return;
    }
    const libraryId = node.row.LibraryID;
    const tableId = node.row.TableID;
    const current = node.row.Updatable;
    if (!libraryId || !tableId) {
      vscode.window.showErrorMessage("EFx: Could not determine library/table from selection.");
      return;
    }
    const pick = await vscode.window.showQuickPick(
      [
        { label: "$(lock) Read-only", value: false, description: current === false ? "current" : "" },
        { label: "$(edit) Updatable", value: true, description: current === true ? "current" : "" }
      ],
      { placeHolder: `${tableId} \u2014 choose access mode` }
    );
    if (!pick || pick.value === current) return;
    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: `Updating ${tableId}...` },
      async () => {
        try {
          const rawTableset = await client.getLibraryRaw(libraryId);
          const updatedRaw = markEfxRefTableUpdatable(rawTableset, tableId, pick.value);
          const result = await client.applyChangesRaw(updatedRaw);
          const diags = result.diagnostics || [];
          const hasErrors = diags.some((d) => typeof d === "object" ? (d.Severity ?? 2) >= 2 : /\berror\b/i.test(String(d)));
          if (hasErrors) {
            const msg = diags.map((d) => typeof d === "object" ? d.ErrorText || JSON.stringify(d) : String(d)).join("\n");
            throw new Error(`Server rejected update:
${msg}`);
          }
          treeProvider.invalidateCache(libraryId);
          treeProvider._onDidChangeTreeData.fire(void 0);
          vscode.window.showInformationMessage(`EFx: ${tableId} set to ${pick.value ? "Updatable" : "Read-only"} \u2713`);
        } catch (err) {
          vscode.window.showErrorMessage(`EFx: Set updatable failed: ${err.message}`);
        }
      }
    );
  }));
  context.subscriptions.push(vscode.commands.registerCommand("efx.addService", async (node) => {
    if (!client || !node) return;
    const libraryId = node.libraryId;
    const COMMON_SERVICES = [
      "ERP:BO:Part",
      "ERP:BO:PartBin",
      "ERP:BO:PartWhse",
      "ERP:BO:PartCost",
      "ERP:BO:PartTran",
      "ERP:BO:Customer",
      "ERP:BO:ShipTo",
      "ERP:BO:SalesOrder",
      "ERP:BO:QuoteMgr",
      "ERP:BO:JobEntry",
      "ERP:BO:JobStatus",
      "ERP:BO:CustShip",
      "ERP:BO:SubShipD",
      "ERP:BO:PurchaseOrder",
      "ERP:BO:Receipt",
      "ERP:BO:Vendor",
      "ERP:BO:LaborDtl",
      "ERP:BO:PriceLst",
      "ERP:BO:Currency",
      "ERP:BO:Country",
      "ERP:BO:Inventory",
      "ICE:BO:UD11",
      "ICE:BO:UD12",
      "ICE:BO:UD13",
      "ICE:BO:UD14",
      "ICE:BO:UD15",
      "ICE:BO:UD16",
      "ICE:BO:UD17",
      "ICE:BO:UD18",
      "ICE:BO:UD19",
      "ICE:BO:UD20",
      "ICE:LIB:EfxLibraryDesigner"
    ].sort();
    const picks = [
      { label: "$(edit) Enter manually...", alwaysShow: true, manual: true },
      ...COMMON_SERVICES.map((s) => ({ label: s, manual: false }))
    ];
    const selection = await vscode.window.showQuickPick(picks, {
      placeHolder: "Select a service or enter manually (format: ERP:BO:Part)"
    });
    if (!selection) return;
    let serviceId;
    if (selection.manual) {
      serviceId = await vscode.window.showInputBox({
        prompt: "Service ID",
        placeHolder: "e.g. ERP:BO:Part or ICE:BO:UD11",
        validateInput: (v) => !v || v.split(":").length < 3 ? "Format must be NAMESPACE:TYPE:Name" : null
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
            SysRowID: "00000000-0000-0000-0000-000000000000",
            RowMod: "A"
          });
          raw = injectRowIntoArray(raw, "EfxRefService", newRow);
          const result = await client.applyChangesRaw(raw);
          if (result.diagnostics && result.diagnostics.length > 0) {
            vscode.window.showWarningMessage(`EFx: Service added with diagnostics: ${result.diagnostics.join(", ")}`);
          } else {
            vscode.window.showInformationMessage(`EFx: Added service ${serviceId} to ${libraryId} \u2713`);
          }
          treeProvider.invalidateCache(libraryId);
          treeProvider._onDidChangeTreeData.fire(void 0);
        } catch (err) {
          vscode.window.showErrorMessage(`EFx: Add service failed: ${err.message}`);
        }
      }
    );
  }));
  context.subscriptions.push(vscode.commands.registerCommand("efx.addAssembly", async (node) => {
    if (!client || !node) return;
    const libraryId = node.libraryId;
    const COMMON_ASSEMBLIES = [
      "Newtonsoft.Json.dll",
      "Ice.Contracts.BO.DynamicQuery.dll",
      "Ice.Contracts.BO.BAQDesigner.dll",
      "Erp.Contracts.BO.Part.dll",
      "Erp.Contracts.BO.JobEntry.dll",
      "Erp.Contracts.BO.SalesOrder.dll",
      "Erp.Contracts.BO.QuoteMgr.dll",
      "Erp.Contracts.BO.CustShip.dll",
      "Erp.Contracts.BO.PurchaseOrder.dll",
      "Erp.Contracts.BO.LaborDtl.dll",
      "Erp.Contracts.BO.Inventory.dll",
      "Erp.Contracts.BO.Customer.dll",
      "Erp.Contracts.BO.Vendor.dll",
      "Ice.Contracts.BO.UD11.dll",
      "Ice.Contracts.BO.UD15.dll",
      "System.Net.Http.dll",
      "System.Xml.dll",
      "System.Linq.dll"
    ].sort();
    const picks = [
      { label: "$(edit) Enter manually...", alwaysShow: true, manual: true },
      ...COMMON_ASSEMBLIES.map((a) => ({ label: a, manual: false }))
    ];
    const selection = await vscode.window.showQuickPick(picks, {
      placeHolder: "Select an assembly or enter manually (include .dll)"
    });
    if (!selection) return;
    let assembly;
    if (selection.manual) {
      assembly = await vscode.window.showInputBox({
        prompt: "Assembly filename",
        placeHolder: "e.g. Newtonsoft.Json.dll",
        validateInput: (v) => !v || !v.toLowerCase().endsWith(".dll") ? "Must end in .dll" : null
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
            SysRowID: "00000000-0000-0000-0000-000000000000",
            RowMod: "A"
          });
          raw = injectRowIntoArray(raw, "EfxRefAssembly", newRow);
          const result = await client.applyChangesRaw(raw);
          if (result.diagnostics && result.diagnostics.length > 0) {
            vscode.window.showWarningMessage(`EFx: Assembly added with diagnostics: ${result.diagnostics.join(", ")}`);
          } else {
            vscode.window.showInformationMessage(`EFx: Added assembly ${assembly} to ${libraryId} \u2713`);
          }
          treeProvider.invalidateCache(libraryId);
          treeProvider._onDidChangeTreeData.fire(void 0);
        } catch (err) {
          vscode.window.showErrorMessage(`EFx: Add assembly failed: ${err.message}`);
        }
      }
    );
  }));
  context.subscriptions.push(vscode.commands.registerCommand("efx.addLibraryRef", async (node) => {
    if (!client || !node) return;
    const libraryId = node.libraryId;
    const allLibraries = treeProvider.libraries || [];
    const otherLibraries = allLibraries.map((l) => l.LibraryID).filter((id) => id !== libraryId).sort();
    const picks = [
      { label: "$(edit) Enter manually...", alwaysShow: true, manual: true },
      ...otherLibraries.map((id) => ({ label: id, manual: false }))
    ];
    const selection = await vscode.window.showQuickPick(picks, {
      placeHolder: otherLibraries.length > 0 ? "Select a library to reference" : "Enter library ID (refresh tree first to get suggestions)"
    });
    if (!selection) return;
    let libraryRef;
    if (selection.manual) {
      libraryRef = await vscode.window.showInputBox({
        prompt: "Library ID to reference",
        placeHolder: "e.g. LogFuncts",
        validateInput: (v) => !v || v.trim().length === 0 ? "Library ID is required" : null
      });
    } else {
      libraryRef = selection.label;
    }
    if (!libraryRef) return;
    const modePick = await vscode.window.showQuickPick(
      [
        { label: "Normal (0)", value: 0, description: "Standard reference" },
        { label: "Read-only (1)", value: 1, description: "Cannot call mutating functions" },
        { label: "Hidden (2)", value: 2, description: "Not visible in designer" }
      ],
      { placeHolder: "Reference mode" }
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
            SysRowID: "00000000-0000-0000-0000-000000000000",
            RowMod: "A"
          });
          raw = injectRowIntoArray(raw, "EfxRefLibrary", newRow);
          const result = await client.applyChangesRaw(raw);
          if (result.diagnostics && result.diagnostics.length > 0) {
            vscode.window.showWarningMessage(`EFx: Library ref added with diagnostics: ${result.diagnostics.join(", ")}`);
          } else {
            vscode.window.showInformationMessage(`EFx: Added library ref ${libraryRef} to ${libraryId} \u2713`);
          }
          treeProvider.invalidateCache(libraryId);
          treeProvider._onDidChangeTreeData.fire(void 0);
        } catch (err) {
          vscode.window.showErrorMessage(`EFx: Add library ref failed: ${err.message}`);
        }
      }
    );
  }));
  const bpmDiagnostics = vscode.languages.createDiagnosticCollection("epicor-bpm");
  context.subscriptions.push(bpmDiagnostics);
  const efxDiagnostics = vscode.languages.createDiagnosticCollection("epicor-efx");
  context.subscriptions.push(efxDiagnostics);
  const bpmValidationState = /* @__PURE__ */ new Map();
  function getBpmState(filePath) {
    if (!bpmValidationState.has(filePath)) {
      bpmValidationState.set(filePath, { status: "idle", timer: null });
    }
    return bpmValidationState.get(filePath);
  }
  function scheduleBpmValidation(filePath, mapping) {
    const state = getBpmState(filePath);
    if (state.status === "running" || state.status === "dirty") {
      if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
      }
      state.status = "dirty";
      return;
    }
    if (state.timer) clearTimeout(state.timer);
    state.timer = setTimeout(() => {
      state.timer = null;
      state.status = "running";
      runBpmValidation(filePath, mapping);
    }, 500);
  }
  async function runBpmValidation(filePath, mapping) {
    const state = bpmValidationState.get(filePath);
    if (!state) return;
    try {
      if (!bpmClientInst || !mapping.isBpm || !mapping.functionDefinition) return;
      const openDoc = vscode.workspace.textDocuments.find(
        (d) => normalizeFsPath(d.uri.fsPath) === normalizeFsPath(filePath)
      );
      let code = openDoc ? openDoc.getText() : fs.readFileSync(filePath, "utf-8");
      code = stripGeneratedHeader(code);
      const diagnostics = await bpmClientInst.validateCustomCode(code, mapping.functionDefinition);
      const uri = vscode.Uri.file(filePath);
      if (!diagnostics || diagnostics.length === 0) {
        bpmDiagnostics.set(uri, []);
      } else {
        const vsDiags = diagnostics.map((d) => {
          const startLine = Math.max(0, (d.Span?.start?.line ?? 1) - 1);
          const startCol = Math.max(0, d.Span?.start?.column ?? 0);
          const endLine = Math.max(0, (d.Span?.end?.line ?? startLine + 1) - 1);
          const endCol = Math.max(0, d.Span?.end?.column ?? startCol + 1);
          const range = new vscode.Range(startLine, startCol, endLine, endCol);
          const severity = severityFromCode(d.Severity);
          const msg = `${d.Code}: ${d.Message}`;
          return new vscode.Diagnostic(range, msg, severity);
        });
        bpmDiagnostics.set(uri, vsDiags);
      }
    } catch (_) {
    } finally {
      const currentState = bpmValidationState.get(filePath);
      if (!currentState) return;
      const wasDirty = currentState.status === "dirty";
      currentState.status = "idle";
      if (wasDirty) {
        currentState.status = "running";
        runBpmValidation(filePath, mapping);
      }
    }
  }
  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((e) => {
    const filePath = e.document.uri.fsPath;
    const mapping = fileMap.get(normalizeFsPath(filePath));
    if (mapping && mapping.isBpm && mapping.functionDefinition) {
      scheduleBpmValidation(filePath, mapping);
    }
    if (mapping && !mapping.isBpm && client) {
      scheduleEfxValidation(filePath, mapping);
    }
  }));
  context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(async (doc) => {
    const normalized = normalizeFsPath(doc.uri.fsPath);
    if (pushInProgress.has(normalized)) return;
    const mapping = fileMap.get(normalized);
    if (!mapping || mapping.isBpm || !client) return;
    const activeProfile = getActiveProfile();
    if (!activeProfile?.autoPush) return;
    await vscode.commands.executeCommand("efx.pushFunction", null, true);
  }));
  context.subscriptions.push(vscode.workspace.onDidCloseTextDocument((doc) => {
    const filePath = doc.uri.fsPath;
    const mapping = fileMap.get(normalizeFsPath(filePath));
    if (mapping && mapping.isBpm) {
      bpmDiagnostics.delete(doc.uri);
      const bpmState = bpmValidationState.get(filePath);
      if (bpmState?.timer) clearTimeout(bpmState.timer);
      bpmValidationState.delete(filePath);
    }
    if (mapping && !mapping.isBpm) {
      efxDiagnostics.delete(doc.uri);
      const state = efxValidationState.get(filePath);
      if (state?.timer) clearTimeout(state.timer);
      efxValidationState.delete(filePath);
    }
  }));
  const efxValidationState = /* @__PURE__ */ new Map();
  function getEfxState(filePath) {
    if (!efxValidationState.has(filePath)) {
      efxValidationState.set(filePath, { status: "idle", timer: null });
    }
    return efxValidationState.get(filePath);
  }
  function scheduleEfxValidation(filePath, mapping) {
    const state = getEfxState(filePath);
    if (state.status === "running" || state.status === "dirty") {
      if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
      }
      state.status = "dirty";
      return;
    }
    if (state.timer) clearTimeout(state.timer);
    state.timer = setTimeout(() => {
      state.timer = null;
      state.status = "running";
      runEfxValidation(filePath, mapping);
    }, 1500);
  }
  async function runEfxValidation(filePath, mapping) {
    const state = efxValidationState.get(filePath);
    if (!state) return;
    try {
      if (!client || !mapping.libraryId || !mapping.functionId) return;
      const openDoc = vscode.workspace.textDocuments.find(
        (d) => normalizeFsPath(d.uri.fsPath) === normalizeFsPath(filePath)
      );
      let code = openDoc ? openDoc.getText() : fs.readFileSync(filePath, "utf-8");
      code = stripGeneratedHeader(code);
      const cachedTableset = pulledTablesets.get(mapping.libraryId);
      const cachedFunc = cachedTableset?.EfxFunction?.find((f) => f.FunctionID === mapping.functionId);
      if (cachedFunc) {
        const cachedCode = epicorClient_1.EpicorClient.extractCode(cachedFunc.Body).code;
        if (normalizeCodeForCompare(cachedCode) === normalizeCodeForCompare(code)) {
          efxDiagnostics.set(vscode.Uri.file(filePath), []);
          return;
        }
      }
      const usings = cachedFunc ? epicorClient_1.EpicorClient.extractCode(cachedFunc.Body).usings : "";
      const { diagnostics, saved, newBody } = await client.validateFunctionViaWrapper(
        mapping.libraryId,
        mapping.functionId,
        code,
        usings,
        "Utilities",
        "ApplyChangesWithDiagnostics"
      );
      if (saved && cachedTableset && cachedFunc) {
        cachedFunc.Body = newBody;
      }
      const uri = vscode.Uri.file(filePath);
      if (!diagnostics || diagnostics.length === 0) {
        efxDiagnostics.set(uri, []);
      } else {
        const vsDiags = diagnostics.map((d) => {
          if (typeof d === "object" && d !== null) {
            const parsedLine = Number.isInteger(d.Line) ? d.Line : void 0;
            const startLine = Math.max(0, (d.Span?.start?.line ?? parsedLine ?? 1) - 1);
            const startCol = Math.max(0, d.Span?.start?.column ?? 0);
            const endLine = Math.max(0, (d.Span?.end?.line ?? parsedLine ?? startLine + 1) - 1);
            const endCol = Math.max(0, d.Span?.end?.column ?? startCol + 1);
            const severity = severityFromCode(d.Severity);
            const msg = [d.Code, d.Message].filter(Boolean).join(": ");
            return new vscode.Diagnostic(
              new vscode.Range(startLine, startCol, endLine, endCol),
              msg || String(d),
              severity
            );
          }
          const m = String(d).match(/\((\d+),(\d+)\).*?(error|warning|info)\s+(CS\w+)?:?\s*(.*)/i);
          if (m) {
            const line = Math.max(0, parseInt(m[1]) - 1);
            const col = Math.max(0, parseInt(m[2]) - 1);
            const sev = m[3].toLowerCase();
            return new vscode.Diagnostic(
              new vscode.Range(line, col, line, col + 1),
              `${m[4] ? m[4] + ": " : ""}${m[5]}`,
              sev === "warning" ? vscode.DiagnosticSeverity.Warning : sev === "info" ? vscode.DiagnosticSeverity.Information : vscode.DiagnosticSeverity.Error
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
    } catch (_) {
    } finally {
      const currentState = efxValidationState.get(filePath);
      if (!currentState) return;
      const wasDirty = currentState.status === "dirty";
      currentState.status = "idle";
      if (wasDirty) {
        currentState.status = "running";
        runEfxValidation(filePath, mapping);
      }
    }
  }
  context.subscriptions.push(vscode.commands.registerCommand("efx.bpm.refresh", async () => {
    if (!bpmClientInst) {
      vscode.window.showWarningMessage("BPM: Configure connection first");
      return;
    }
    await bpmTreeProvider.refresh();
  }));
  context.subscriptions.push(vscode.commands.registerCommand("efx.bpm.openWidgetPanel", async (nodeOrArg) => {
    if (!bpmClientInst) {
      vscode.window.showWarningMessage("BPM: Configure connection first");
      return;
    }
    let directive;
    if (nodeOrArg?.directive) directive = nodeOrArg.directive;
    else if (nodeOrArg instanceof bpmTreeProvider_1.BpmDirectiveNode) directive = nodeOrArg.directive;
    if (!directive) {
      vscode.window.showWarningMessage("BPM: Select a directive");
      return;
    }
    openWidgetPanel(context, bpmClientInst, directive);
  }));
  context.subscriptions.push(vscode.commands.registerCommand("efx.bpm.pullDirective", async (nodeOrArg) => {
    if (!bpmClientInst) {
      vscode.window.showWarningMessage("BPM: Configure connection first");
      return;
    }
    let directive;
    if (nodeOrArg && nodeOrArg.directive) {
      directive = nodeOrArg.directive;
    } else if (nodeOrArg instanceof bpmTreeProvider_1.BpmDirectiveNode) {
      directive = nodeOrArg.directive;
    } else {
      vscode.window.showWarningMessage("BPM: Select a directive to pull");
      return;
    }
    const { code, hasCustomCode } = bpmClient_1.extractBpmCode(directive.Body);
    if (!hasCustomCode) {
      vscode.window.showWarningMessage(`BPM: "${directive.Name}" has no custom C# code \u2014 it uses widget actions only`);
      return;
    }
    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: `Pulling BPM: ${directive.Name}...` },
      async () => {
        try {
          const typeLabel = directive.DirectiveType === 1 ? "Pre" : directive.DirectiveType === 3 ? "Post" : directive.DirectiveType === 2 ? "Base" : `Type${directive.DirectiveType}`;
          const efxDir = getEfxDir();
          const bpmDir = path.join(efxDir, "_BPM", directive.BpMethodCode);
          fs.mkdirSync(bpmDir, { recursive: true });
          const safeName = directive.Name.replace(/[^a-zA-Z0-9_\-. ]/g, "_");
          const filePath = path.join(bpmDir, `${typeLabel}_${safeName}.cs`);
          const header = [
            `// BPM Directive: ${directive.Name}`,
            `// Method: ${directive.BpMethodCode}`,
            `// Type: ${typeLabel}`,
            `// Enabled: ${directive.IsEnabled}`,
            `// Group: ${directive.DirectiveGroup || "(none)"}`,
            `// DirectiveID: ${directive.DirectiveID}`,
            `// Pulled: ${(/* @__PURE__ */ new Date()).toISOString()}`,
            `// --------------------------------------------------`,
            ``
          ].join("\n");
          fs.writeFileSync(filePath, header + code, "utf-8");
          const tableset = await bpmClientInst.getBpmMethod("BO", directive.BpMethodCode);
          const method = tableset?.BpMethod?.[0];
          const args = tableset?.BpArgument || [];
          const functionDefinition = method ? bpmClient_1.buildFunctionDefinition(method, args) : null;
          fileMap.set(normalizeFsPath(filePath), {
            libraryId: "__BPM__",
            functionId: directive.DirectiveID,
            bpmMethodCode: directive.BpMethodCode,
            directiveId: directive.DirectiveID,
            directiveType: directive.DirectiveType,
            isBpm: true,
            functionDefinition
          });
          const doc = await vscode.workspace.openTextDocument(filePath);
          await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
          vscode.window.showInformationMessage(`BPM: Pulled ${typeLabel} directive "${directive.Name}"`);
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
  context.subscriptions.push(vscode.commands.registerCommand("efx.bpm.pushDirective", async (node) => {
    if (!bpmClientInst) {
      vscode.window.showWarningMessage("BPM: Configure connection first");
      return;
    }
    let filePath;
    let mapping;
    if (node && node.directive) {
      const directive = node.directive;
      const typeLabel = directive.DirectiveType === 1 ? "Pre" : directive.DirectiveType === 3 ? "Post" : directive.DirectiveType === 2 ? "Base" : `Type${directive.DirectiveType}`;
      const safeName = directive.Name.replace(/[^a-zA-Z0-9_\-. ]/g, "_");
      const efxDir = getEfxDir();
      filePath = path.join(efxDir, "_BPM", directive.BpMethodCode, `${typeLabel}_${safeName}.cs`);
      mapping = fileMap.get(normalizeFsPath(filePath));
    } else {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage("BPM: No active file to push");
        return;
      }
      filePath = editor.document.uri.fsPath;
      mapping = fileMap.get(normalizeFsPath(filePath));
    }
    if (!mapping || !mapping.isBpm) {
      vscode.window.showWarningMessage("BPM: This file is not a pulled BPM directive. Pull it first.");
      return;
    }
    if (!filePath || !fs.existsSync(filePath)) {
      vscode.window.showErrorMessage("BPM: File not found. Pull the directive first.");
      return;
    }
    const confirm = await vscode.window.showWarningMessage(
      `Push BPM directive to ${mapping.bpmMethodCode}?`,
      { modal: true },
      "Push"
    );
    if (confirm !== "Push") return;
    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: `Pushing BPM directive...` },
      async () => {
        try {
          await saveOpenDocumentIfDirty(filePath);
          let fileContent = fs.readFileSync(filePath, "utf-8");
          fileContent = stripGeneratedHeader(fileContent);
          const rawTableset = await bpmClientInst.getBpmMethodRaw("BO", mapping.bpmMethodCode);
          const updatedRaw = bpmClient_1.updateRawBpmDirective(
            rawTableset,
            mapping.directiveId,
            fileContent
          );
          JSON.parse(`{"ds":${updatedRaw}}`);
          await bpmClientInst.updateBpmRaw(updatedRaw);
          vscode.window.showInformationMessage(`BPM: Pushed directive to ${mapping.bpmMethodCode} \u2713`);
          if (mapping.functionDefinition) {
            scheduleBpmValidation(filePath, mapping);
          }
          const parts = mapping.bpmMethodCode.split(".");
          if (parts.length >= 3) {
            bpmTreeProvider.invalidateService(parts[0].toUpperCase(), parts[1], parts[2]);
          }
        } catch (err) {
          vscode.window.showErrorMessage(`BPM Push failed: ${err.message}`);
        }
      }
    );
  }));
  async function pickKineticEnv(placeHolder) {
    const profiles = getProfiles();
    if (profiles.length < 1) {
      vscode.window.showWarningMessage("EFx: No profiles configured. Add profiles via Manage Profiles first.");
      return null;
    }
    const pick = await vscode.window.showQuickPick(
      profiles.map((p) => ({ label: p.name, description: p.serverUrl, profile: p })),
      { placeHolder, ignoreFocusOut: true }
    );
    if (!pick) return null;
    let company;
    if (pick.profile.companies.length === 1) {
      company = pick.profile.companies[0];
    } else {
      company = await vscode.window.showQuickPick(
        pick.profile.companies,
        { placeHolder: `Company on ${pick.profile.name}`, ignoreFocusOut: true }
      );
    }
    if (!company) return null;
    const pwd = await context.secrets.get(profileSecretKey(pick.profile.name, "password"));
    if (!pwd) {
      vscode.window.showErrorMessage(`EFx: No password stored for "${pick.profile.name}".`);
      return null;
    }
    const apiKey = await context.secrets.get(profileSecretKey(pick.profile.name, "apiKey")) || "";
    return new kineticLayerClient_1.KineticMetaFXClient({
      serverUrl: pick.profile.serverUrl,
      company,
      username: pick.profile.username,
      password: pwd,
      apiKey
    });
  }
  context.subscriptions.push(vscode.commands.registerCommand("efx.dev.dumpBpmXaml", async () => {
    if (!bpmClientInst) {
      vscode.window.showErrorMessage("EFx: Not connected \u2014 configure a profile first.");
      return;
    }
    const methodCode = await vscode.window.showInputBox({
      prompt: "BPM method code",
      value: "Erp.BO.Labor.Update",
      ignoreFocusOut: true
    });
    if (!methodCode) return;
    const out = vscode.window.createOutputChannel("EFx Widget XAML Dump");
    out.show(true);
    out.appendLine(`Fetching ${methodCode}...`);
    try {
      const ts = await bpmClientInst.getBpmMethod("BO", methodCode.trim());
      const dirs = ts?.BpDirective || [];
      out.appendLine(`Got ${dirs.length} directive(s)
`);
      for (const d of dirs) {
        const typeLabel = d.DirectiveType === 1 ? "Pre" : d.DirectiveType === 3 ? "Post" : "Base";
        out.appendLine("=".repeat(70));
        out.appendLine(`[${typeLabel}] "${d.Name}"  enabled=${d.IsEnabled}  group=${d.DirectiveGroup || "(none)"}`);
        if (!d.Body) {
          out.appendLine("  (no body)");
          continue;
        }
        const elementTypes = [...new Set([...d.Body.matchAll(/<(\w+Action)\b/g)].map((m) => m[1]))];
        out.appendLine(`  Action elements: ${elementTypes.join(", ") || "(none found)"}`);
        let searchFrom = 0, actionIdx = 0;
        while (true) {
          const idx = d.Body.indexOf("CustomCodeAction", searchFrom);
          if (idx < 0) break;
          const codeAttr = 'Code="';
          const codeStart = d.Body.indexOf(codeAttr, idx);
          if (codeStart < 0) {
            searchFrom = idx + 1;
            continue;
          }
          const valueStart = codeStart + codeAttr.length;
          let valueEnd = valueStart;
          while (valueEnd < d.Body.length) {
            if (d.Body[valueEnd] === '"') break;
            if (d.Body[valueEnd] === "&") {
              const s = d.Body.indexOf(";", valueEnd);
              if (s < 0) break;
              valueEnd = s + 1;
              continue;
            }
            valueEnd++;
          }
          const encoded = d.Body.slice(valueStart, valueEnd);
          const code = bpmClient_1.xmlDecode(encoded);
          out.appendLine(`
  --- CustomCodeAction[${actionIdx++}] ---`);
          out.appendLine(code);
          searchFrom = valueEnd + 1;
        }
        if (actionIdx === 0) {
          out.appendLine("\n  No CustomCodeAction found \u2014 full XAML body:");
          out.appendLine(d.Body);
        }
      }
    } catch (err) {
      out.appendLine(`ERROR: ${err.message}`);
    }
  }));
  context.subscriptions.push(vscode.commands.registerCommand("efx.compareLibraries", () => {
    ComparePanel.show(context);
  }));
}
var PROFILE_INPUT_OPTS = { ignoreFocusOut: true };
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
  return getProfiles().find((p) => p.name === name) || null;
}
function profileSecretKey(profileName, kind) {
  return `efx.profile.${profileName}.${kind}`;
}
function updateViewDescriptions() {
  const profileName = getActiveProfileName();
  const company = getActiveCompany();
  const desc = profileName && company ? `${profileName} / ${company}` : profileName ? profileName : "";
  if (efxLibrariesView) efxLibrariesView.description = desc;
  if (bpmMethodsView) bpmMethodsView.description = desc;
}
async function openProfileManager(context) {
  const profiles = getProfiles();
  const activeName = getActiveProfileName();
  const items = [];
  items.push({
    label: "$(add) New Profile\u2026",
    description: "Create a new Epicor environment profile",
    action: "new"
  });
  for (const p of profiles) {
    const isActive = p.name === activeName;
    items.push({
      label: `${isActive ? "$(check) " : "$(blank) "}${p.name}`,
      description: p.serverUrl || "",
      detail: `${p.username || "(no user)"} \u2022 ${(p.companies || []).join(", ") || "no companies"}`,
      action: "use",
      profileName: p.name
    });
  }
  if (profiles.length > 0) {
    items.push({ label: "$(edit) Edit Profile\u2026", action: "edit" });
    items.push({ label: "$(trash) Delete Profile\u2026", action: "delete" });
  }
  const pick = await vscode.window.showQuickPick(items, {
    placeHolder: profiles.length === 0 ? "No profiles yet \u2014 create your first one" : `Select a profile to activate, or manage profiles (${profiles.length} configured)`,
    ignoreFocusOut: true
  });
  if (!pick) return;
  if (pick.action === "new") {
    await createProfile(context);
  } else if (pick.action === "use") {
    await activateProfile(context, pick.profileName);
  } else if (pick.action === "edit") {
    const target = await pickProfile("Select profile to edit");
    if (target) await editProfile(context, target);
  } else if (pick.action === "delete") {
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
    profiles.map((p) => ({
      label: p.name,
      description: p.serverUrl || "",
      detail: p.username || "",
      profileName: p.name
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
    companies: []
  };
  const ok = await runProfileEditor(
    context,
    draft,
    /*isNew*/
    true
  );
  if (!ok) return;
  const profiles = getProfiles();
  if (profiles.some((p) => p.name === draft.name)) {
    vscode.window.showErrorMessage(`EFx: Profile "${draft.name}" already exists.`);
    return;
  }
  profiles.push(draft);
  await setProfiles(profiles);
  if (profiles.length === 1 || await confirmActivate(draft.name)) {
    await activateProfile(context, draft.name);
  } else {
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
  const idx = profiles.findIndex((p) => p.name === profileName);
  if (idx < 0) return;
  const draft = JSON.parse(JSON.stringify(profiles[idx]));
  const originalName = draft.name;
  const ok = await runProfileEditor(
    context,
    draft,
    /*isNew*/
    false
  );
  if (!ok) return;
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
  if (getActiveProfileName() === draft.name) {
    await activateProfile(context, draft.name);
  } else {
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
  const profiles = getProfiles().filter((p) => p.name !== profileName);
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
async function runProfileEditor(context, draft, isNew) {
  const name = await vscode.window.showInputBox({
    ...PROFILE_INPUT_OPTS,
    prompt: isNew ? "Profile name (e.g. Dev, Prod, Pilot)" : "Profile name",
    value: draft.name,
    validateInput: (v) => {
      if (!v || !v.trim()) return "Name is required";
      if (!/^[A-Za-z0-9_\-. ]+$/.test(v)) return "Use letters, numbers, space, dash, dot, underscore";
      return null;
    }
  });
  if (name === void 0) return false;
  draft.name = name.trim();
  const serverUrl = await vscode.window.showInputBox({
    ...PROFILE_INPUT_OPTS,
    prompt: "Epicor Server URL",
    value: draft.serverUrl,
    placeHolder: "https://your-epicor-server/your-app",
    validateInput: (v) => !v || !v.trim() ? "Server URL is required" : null
  });
  if (serverUrl === void 0) return false;
  draft.serverUrl = serverUrl.trim();
  const username = await vscode.window.showInputBox({
    ...PROFILE_INPUT_OPTS,
    prompt: "Username",
    value: draft.username,
    validateInput: (v) => !v || !v.trim() ? "Username is required" : null
  });
  if (username === void 0) return false;
  draft.username = username.trim();
  let resolvedPassword = isNew ? null : await context.secrets.get(profileSecretKey(draft.name, "password"));
  let promptForPassword = isNew;
  if (!isNew) {
    const pwdChoice = await vscode.window.showQuickPick(
      [
        { label: "Keep existing password", value: false },
        { label: "Change password", value: true }
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
      validateInput: (v) => !v ? "Password is required" : null
    });
    if (password === void 0) return false;
    await context.secrets.store(profileSecretKey(draft.name, "password"), password);
    resolvedPassword = password;
  }
  let resolvedApiKey = isNew ? "" : await context.secrets.get(profileSecretKey(draft.name, "apiKey")) || "";
  let promptForApiKey = isNew;
  if (!isNew) {
    const keyChoice = await vscode.window.showQuickPick(
      [
        { label: "Keep existing API key", value: false },
        { label: "Change API key", value: true },
        { label: "Clear API key", value: "clear" }
      ],
      { placeHolder: "API Key", ignoreFocusOut: true }
    );
    if (!keyChoice) return false;
    if (keyChoice.value === "clear") {
      await context.secrets.delete(profileSecretKey(draft.name, "apiKey"));
      resolvedApiKey = "";
      promptForApiKey = false;
    } else {
      promptForApiKey = keyChoice.value === true;
    }
  }
  if (promptForApiKey) {
    const apiKey = await vscode.window.showInputBox({
      ...PROFILE_INPUT_OPTS,
      prompt: "API Key (leave blank if not required)",
      password: true,
      value: ""
    });
    if (apiKey === void 0) return false;
    await context.secrets.store(profileSecretKey(draft.name, "apiKey"), apiKey || "");
    resolvedApiKey = apiKey || "";
  }
  const companiesResult = await resolveCompanies(context, draft, resolvedPassword, resolvedApiKey);
  if (companiesResult === void 0) return false;
  draft.companies = companiesResult;
  const autoPushPick = await vscode.window.showQuickPick(
    [
      { label: "No \u2014 push manually", value: false },
      { label: "Yes \u2014 auto-push on file save", value: true }
    ],
    { placeHolder: "Auto-push changes to Epicor when you save a .cs file?", ignoreFocusOut: true }
  );
  if (autoPushPick === void 0) return false;
  draft.autoPush = autoPushPick.value;
  return true;
}
async function resolveCompanies(context, draft, password, apiKey) {
  const isNew = !draft.companies || draft.companies.length === 0;
  let action;
  if (isNew) {
    action = "fetch";
  } else {
    const items = [];
    const isActiveProfile = getActiveProfileName() === draft.name;
    const currentActiveCompany = getActiveCompany();
    if (isActiveProfile && draft.companies.length > 1) {
      items.push({
        label: "$(arrow-right) Switch active company",
        description: `currently ${currentActiveCompany || "(none)"}`,
        value: "switch"
      });
    }
    items.push({ label: "$(check) Keep current selection", description: (draft.companies || []).join(", "), value: "keep" });
    items.push({ label: "$(refresh) Re-fetch from server", description: "Discover companies again via UserFile", value: "fetch" });
    items.push({ label: "$(list-selection) Pick from current list", description: "Multi-select among already saved companies", value: "pick" });
    items.push({ label: "$(edit) Enter manually", description: "Comma-separated list", value: "manual" });
    const choice = await vscode.window.showQuickPick(items, { placeHolder: "Companies", ignoreFocusOut: true });
    if (!choice) return void 0;
    action = choice.value;
    if (action === "keep") return draft.companies;
    if (action === "switch") {
      const target = await vscode.window.showQuickPick(
        draft.companies.map((c) => ({
          label: `${c === currentActiveCompany ? "$(check) " : "$(blank) "}${c}`,
          company: c
        })),
        { placeHolder: `Active company (profile: ${draft.name})`, ignoreFocusOut: true }
      );
      if (!target) return void 0;
      if (target.company !== currentActiveCompany) {
        await applyActiveCompany(context, target.company);
      }
      return draft.companies;
    }
  }
  if (action === "fetch") {
    const fetched = await fetchCompaniesFlow(draft, password, apiKey);
    if (fetched === void 0) return void 0;
    return fetched;
  }
  if (action === "pick") {
    const picked = await multiPickCompanies(draft.companies, draft.companies);
    return picked;
  }
  return await manualCompaniesInput(draft.companies);
}
async function fetchCompaniesFlow(draft, password, apiKey) {
  if (!password) {
    vscode.window.showWarningMessage("EFx: Cannot fetch companies \u2014 no password available. Falling back to manual entry.");
    return await manualCompaniesInput(draft.companies);
  }
  const seedDefault = draft.companies && draft.companies[0] || "";
  const seedCompany = await vscode.window.showInputBox({
    ...PROFILE_INPUT_OPTS,
    prompt: "Default company (used to authenticate the discovery call)",
    placeHolder: "your default company code",
    value: seedDefault,
    validateInput: (v) => !v || !v.trim() ? "Default company is required" : null
  });
  if (seedCompany === void 0) return void 0;
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
          apiKey: apiKey || ""
        });
        return await tempClient.getUserCompanies();
      }
    );
  } catch (err) {
    const fallback = await vscode.window.showErrorMessage(
      `EFx: Could not fetch companies \u2014 ${err.message}`,
      { modal: false },
      "Enter Manually",
      "Cancel"
    );
    if (fallback !== "Enter Manually") return void 0;
    return await manualCompaniesInput([seed]);
  }
  if (!fetched || fetched.length === 0) {
    const fallback = await vscode.window.showWarningMessage(
      `EFx: Server returned no companies for user "${draft.username}". Enter manually?`,
      "Enter Manually",
      "Cancel"
    );
    if (fallback !== "Enter Manually") return void 0;
    return await manualCompaniesInput([seed]);
  }
  const all = Array.from(/* @__PURE__ */ new Set([seed, ...fetched]));
  const picked = await multiPickCompanies(all, all);
  return picked;
}
async function multiPickCompanies(allCompanies, preselected) {
  const preset = new Set(preselected || []);
  const items = allCompanies.map((c) => ({
    label: c,
    picked: preset.has(c)
  }));
  const picked = await vscode.window.showQuickPick(items, {
    canPickMany: true,
    placeHolder: "Select companies to include in this profile",
    ignoreFocusOut: true
  });
  if (!picked) return void 0;
  if (picked.length === 0) {
    vscode.window.showWarningMessage("EFx: At least one company is required.");
    return void 0;
  }
  return picked.map((p) => p.label);
}
async function manualCompaniesInput(existing) {
  const companiesStr = await vscode.window.showInputBox({
    ...PROFILE_INPUT_OPTS,
    prompt: "Companies (comma-separated)",
    value: (existing || []).join(", "),
    validateInput: (v) => {
      if (!v || !v.trim()) return "At least one company is required";
      const list = v.split(",").map((s) => s.trim()).filter(Boolean);
      if (list.length === 0) return "At least one company is required";
      return null;
    }
  });
  if (companiesStr === void 0) return void 0;
  return companiesStr.split(",").map((s) => s.trim()).filter(Boolean);
}
async function activateProfile(context, profileName) {
  const profile = getProfiles().find((p) => p.name === profileName);
  if (!profile) {
    vscode.window.showErrorMessage(`EFx: Profile "${profileName}" not found.`);
    return;
  }
  const password = await context.secrets.get(profileSecretKey(profileName, "password"));
  if (!password) {
    vscode.window.showErrorMessage(`EFx: No password stored for "${profileName}". Edit the profile to set one.`);
    return;
  }
  const apiKey = await context.secrets.get(profileSecretKey(profileName, "apiKey")) || "";
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
    apiKey
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
    profiles.map((p) => ({
      label: `${p.name === activeName ? "$(check) " : "$(blank) "}${p.name}`,
      description: p.serverUrl || "",
      profileName: p.name
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
    profile.companies.map((c) => ({
      label: `${c === current ? "$(check) " : "$(blank) "}${c}`,
      company: c
    })),
    { placeHolder: `Active company (profile: ${profile.name})`, ignoreFocusOut: true }
  );
  if (!target) return;
  if (target.company === current) return;
  await applyActiveCompany(context, target.company);
}
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
  const apiKey = await context.secrets.get(profileSecretKey(profile.name, "apiKey")) || "";
  await setActiveCompany(company);
  client = new epicorClient_1.EpicorClient({
    serverUrl: profile.serverUrl,
    company,
    username: profile.username,
    password,
    apiKey
  });
  treeProvider.setClient(client);
  bpmClientInst = new bpmClient_1.BpmClient(client);
  bpmTreeProvider.setClient(bpmClientInst);
  await treeProvider.refresh();
  updateViewDescriptions();
  vscode.window.showInformationMessage(`EFx: Active company \u2192 ${company}`);
}
function getEfxDir() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    return path.join(workspaceFolders[0].uri.fsPath, ".efx");
  }
  const homeDir = process.env.HOME || process.env.USERPROFILE || "/tmp";
  return path.join(homeDir, ".efx");
}
async function initClient(context) {
  const profileName = getActiveProfileName();
  if (!profileName) {
    return;
  }
  const profile = getProfiles().find((p) => p.name === profileName);
  if (!profile) {
    return;
  }
  const password = await context.secrets.get(profileSecretKey(profileName, "password"));
  if (!password) {
    return;
  }
  const apiKey = await context.secrets.get(profileSecretKey(profileName, "apiKey")) || "";
  let activeCompany = getActiveCompany();
  if (!profile.companies.includes(activeCompany)) {
    activeCompany = profile.companies[0] || "";
  }
  if (!activeCompany) {
    return;
  }
  if (activeCompany !== getActiveCompany()) {
    await setActiveCompany(activeCompany);
  }
  client = new epicorClient_1.EpicorClient({
    serverUrl: profile.serverUrl,
    company: activeCompany,
    username: profile.username,
    password,
    apiKey
  });
  treeProvider.setClient(client);
  bpmClientInst = new bpmClient_1.BpmClient(client);
  bpmTreeProvider.setClient(bpmClientInst);
}
function deactivate() {
}
