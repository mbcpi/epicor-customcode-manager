"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BpmClient = void 0;

// DirectiveType constants
const DIRECTIVE_TYPE = {
    PRE: 1,
    BASE: 2,
    POST: 3,
};
exports.DIRECTIVE_TYPE = DIRECTIVE_TYPE;

// XML entity encode/decode for BPM Body XAML
function xmlEncode(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/\t/g, '&#x9;')
        .replace(/\r\n/g, '&#xA;')
        .replace(/\n/g, '&#xA;')
        .replace(/\r/g, '&#xA;');
}

function xmlDecode(str) {
    return str
        .replace(/&#xA;/g, '\n')
        .replace(/&#xD;/g, '\r')
        .replace(/&#x9;/g, '\t')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}
exports.xmlDecode = xmlDecode;
exports.xmlEncode = xmlEncode;

// Extract C# code from BpDirective.Body XAML
// Returns { code, hasCustomCode }
function extractBpmCode(body) {
    if (!body) return { code: '', hasCustomCode: false };
    const idx = body.indexOf('CustomCodeAction');
    if (idx < 0) return { code: '', hasCustomCode: false };
    // Find Code=" attribute
    const codeAttr = 'Code="';
    const codeStart = body.indexOf(codeAttr, idx);
    if (codeStart < 0) return { code: '', hasCustomCode: false };
    const valueStart = codeStart + codeAttr.length;
    // Find closing " — must skip XML entities (they never contain raw ")
    let valueEnd = valueStart;
    while (valueEnd < body.length) {
        if (body[valueEnd] === '"') break;
        if (body[valueEnd] === '&') {
            // skip entity
            const semi = body.indexOf(';', valueEnd);
            if (semi < 0) break;
            valueEnd = semi + 1;
            continue;
        }
        valueEnd++;
    }
    const encoded = body.slice(valueStart, valueEnd);
    return { code: xmlDecode(encoded), hasCustomCode: true };
}
exports.extractBpmCode = extractBpmCode;

// Replace C# code in BpDirective.Body XAML (raw string, no parse/stringify)
function replaceBpmCode(body, newCode) {
    const idx = body.indexOf('CustomCodeAction');
    if (idx < 0) throw new Error('No CustomCodeAction found in directive body');
    const codeAttr = 'Code="';
    const codeStart = body.indexOf(codeAttr, idx);
    if (codeStart < 0) throw new Error('No Code= attribute found in CustomCodeAction');
    const valueStart = codeStart + codeAttr.length;
    let valueEnd = valueStart;
    while (valueEnd < body.length) {
        if (body[valueEnd] === '"') break;
        if (body[valueEnd] === '&') {
            const semi = body.indexOf(';', valueEnd);
            if (semi < 0) break;
            valueEnd = semi + 1;
            continue;
        }
        valueEnd++;
    }
    return body.slice(0, valueStart) + xmlEncode(newCode) + body.slice(valueEnd);
}
exports.replaceBpmCode = replaceBpmCode;

// Find a BpDirective row in the raw tableset by DirectiveID,
// replace its Code= attribute in Body, and set RowMod to "U".
// Returns the modified raw tableset string.
function updateRawBpmDirective(rawTableset, directiveId, newCode) {
    // Find the BpDirective array
    const arrayNeedle = '"BpDirective":[';
    const arrayPropIdx = rawTableset.indexOf(arrayNeedle);
    if (arrayPropIdx < 0) throw new Error('BpDirective array not found in raw tableset');

    const arrayStart = rawTableset.indexOf('[', arrayPropIdx);
    const idNeedle = `"DirectiveID":"${directiveId}"`;

    let cursor = arrayStart + 1;
    while (cursor < rawTableset.length) {
        const objStart = rawTableset.indexOf('{', cursor);
        if (objStart < 0) break;

        // Find matching closing brace, respecting strings
        let depth = 0;
        let inStr = false;
        let esc = false;
        let objEnd = -1;
        for (let i = objStart; i < rawTableset.length; i++) {
            const ch = rawTableset[i];
            if (inStr) {
                if (esc) { esc = false; continue; }
                if (ch === '\\') { esc = true; continue; }
                if (ch === '"') { inStr = false; }
                continue;
            }
            if (ch === '"') { inStr = true; continue; }
            if (ch === '{') depth++;
            else if (ch === '}') {
                depth--;
                if (depth === 0) { objEnd = i; break; }
            }
        }
        if (objEnd < 0) throw new Error('Malformed BpDirective object in raw tableset');
        const objStr = rawTableset.slice(objStart, objEnd + 1);

        if (objStr.includes(idNeedle)) {
            // Found the right directive row.
            // The Body field is a JSON-encoded string inside the raw JSON, so its
            // inner XAML quotes appear as \" (one backslash + quote).
            // Strategy: find the Body string value boundaries, JSON.parse just that
            // value to get real XAML, do the code replacement, JSON.stringify back,
            // then splice into the object string.

            const bodyKey = '"Body":"';
            const bodyKeyIdx = objStr.indexOf(bodyKey);
            if (bodyKeyIdx < 0) throw new Error('Body field not found in BpDirective row');

            // Walk the JSON string value to find its end
            const valueStart = bodyKeyIdx + bodyKey.length; // points to first char of value
            let i = valueStart;
            let escaped = false;
            while (i < objStr.length) {
                const ch = objStr[i];
                if (escaped) { escaped = false; i++; continue; }
                if (ch === '\\') { escaped = true; i++; continue; }
                if (ch === '"') break; // end of string value
                i++;
            }
            if (i >= objStr.length) throw new Error('Body string value did not terminate');
            const valueEnd = i; // index of closing quote

            // Extract the raw JSON string literal (with surrounding quotes) and parse it
            const bodyJsonLiteral = '"' + objStr.slice(valueStart, valueEnd) + '"';
            let bodyXaml;
            try {
                bodyXaml = JSON.parse(bodyJsonLiteral);
            } catch (e) {
                throw new Error('Failed to JSON-parse Body value: ' + e.message);
            }

            // Do the XAML-level Code= replacement on the decoded string
            const newBodyXaml = replaceBpmCode(bodyXaml, newCode);

            // Re-encode back to a JSON string literal (without surrounding quotes)
            const newBodyEncoded = JSON.stringify(newBodyXaml).slice(1, -1);

            // Build the modified object string with the new Body
            const newObjBody = objStr.slice(0, valueStart) + newBodyEncoded + objStr.slice(valueEnd);

            // Epicor requires the original row (RowMod:"") immediately followed by
            // the updated row (RowMod:"U"). Insert original unchanged, then modified.
            // The original objStr already has RowMod:"" so we just prepend it.
            let result = rawTableset.slice(0, objStart) + objStr + ',' + newObjBody + rawTableset.slice(objEnd + 1);

            // Set RowMod "U" on the SECOND copy (the modified one) using BitFlag anchor.
            // The first occurrence of BitFlag/RowMod"" belongs to the original copy —
            // we want the second occurrence, which starts at objStart + objStr.length + 1.
            const rowModTarget = '"BitFlag":0,"RowMod":""';
            const rowModReplacement = '"BitFlag":0,"RowMod":"U"';
            const searchFrom = objStart + objStr.length + 1; // skip past the original copy
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
exports.updateRawBpmDirective = updateRawBpmDirective;

class BpmClient {
    constructor(epicorClient) {
        // Reuse the EpicorClient's transport — just need a different URL builder
        this._client = epicorClient;
    }

    getBpmUrl(method) {
        const base = this._client.config.serverUrl.replace(/\/$/, '');
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
        const result = await this.request(this.getBpmUrl('GetBpmDirectiveServicesTS'), {});
        return result.returnObj?.BpDirectiveService || [];
    }

    // ── Get methods for a service (with directive presence flags) ──
    async getBpmMethodsByService(systemCode, serviceKind, serviceName) {
        // Use GetRowsEx with a where clause on the method
        const result = await this.request(this.getBpmUrl('GetRowsEx'), {
            source: 'BO',
            whereClauseBpMethod: `SystemCode = '${systemCode}' and ObjectNS = '${serviceKind}' and BusinessObject = '${serviceName}'`,
            whereClauseBpDirective: '',
            pageSize: 500,
            absolutePage: 1,
        });
        const ts = result.returnObj;
        return {
            methods: ts?.BpMethod || [],
            directives: ts?.BpDirective || [],
        };
    }

    // ── Get full tableset for one method ──
    async getBpmMethod(source, bpMethodCode) {
        const result = await this.request(this.getBpmUrl('GetByIDBpMethod'), {
            source,
            bpMethodCode,
        });
        return result.returnObj;
    }

    // ── Get full tableset raw (preserves SysRevID int64) ──
    async getBpmMethodRaw(source, bpMethodCode) {
        const raw = await this.requestRaw(
            this.getBpmUrl('GetByIDBpMethod'),
            JSON.stringify({ source, bpMethodCode })
        );
        const match = raw.match(/"returnObj"\s*:\s*(\{.*\})\s*\}$/s);
        return match ? match[1] : raw;
    }

    // ── Update directives using raw JSON (preserves SysRevID int64) ──
    async updateBpmRaw(rawTableset) {
        const body = `{"ds":${rawTableset}}`;
        const rawResult = await this.requestRaw(this.getBpmUrl('Update'), body);
        try {
            return JSON.parse(rawResult);
        } catch {
            return {};
        }
    }
    // ── Validate custom code (syntax check without saving) ──
    async validateCustomCode(code, functionDefinition) {
        const codeSnippetWithScope = JSON.stringify({ Code: code, IsCondition: false });
        const result = await this.request(this.getBpmUrl('ValidateCustomCode'), {
            codeSnippetWithScope,
            functionDefinition: JSON.stringify(functionDefinition),
            isAsync: false,
        });
        return result.returnObj?.diagnostics || null;
    }
}
exports.BpmClient = BpmClient;

// ── Build functionDefinition from BpMethod + BpArgument tableset ──
// Matches exactly what the Kinetic BPM designer sends to ValidateCustomCode.
function buildFunctionDefinition(method, args) {
    const sc = method.SystemCode || 'Erp';
    const productCode = sc.charAt(0).toUpperCase() + sc.slice(1).toLowerCase();
    const directionMap = { 'INPUT': 0, 'OUTPUT': 1, 'INPUT-OUTPUT': 2 };
    return {
        FunctionKind: 0,
        Target: {
            kind: 0,
            id: method.BpMethodCode,
            alias: method.BpMethodCode,
            productCode: { value: productCode },
            name: method.BusinessObject,
            method: method.Name,
            hasRootTransaction: method.HasRootTransaction,
        },
        SupportsAdvancedFeatures: true,
        SupportsDbAccessInCode: 0,
        DebugMode: method.DebugMode || false,
        Arguments: (args || []).map(a => ({
            Name: a.BpArgumentName,
            Type: a.TypeInfo,
            TypeName: a.Type,
            Direction: directionMap[a.Direction] ?? 2,
            Kind: directionMap[a.Direction] ?? 2,
        })),
        LocalVariables: [],
        CustomReferences: [
            { Name: 'Assemblies', IsStandard: false, IsEditable: true, References: {} },
            { Name: 'Externals', IsStandard: false, IsEditable: true, References: {} },
            { Name: 'Standard', IsStandard: true, IsEditable: true, References: {} },
        ],
        CustomUsings: '',
    };
}
exports.buildFunctionDefinition = buildFunctionDefinition;