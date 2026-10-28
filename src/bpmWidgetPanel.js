"use strict";

// BPM host for the generic widget panel: reads and writes the widget XAML held
// in BpDirective.Body.

const { openWidgetPanel } = require('./widgetPanel');

function typeLabelOf(directiveType) {
    return directiveType === 1 ? 'Pre'
        : directiveType === 3 ? 'Post'
        : directiveType === 2 ? 'Base'
        : `Type${directiveType}`;
}

// `directive` needs DirectiveID, BpMethodCode, Name and DirectiveType. Body is
// optional — without it (e.g. rehydrating from a pulled file) it's fetched.
function createBpmHost(bpmClient, directive) {
    const typeLabel = typeLabelOf(directive.DirectiveType);
    let cached = directive.Body || null;

    return {
        key: `bpm:${directive.DirectiveID}`,
        title: `BPM: ${typeLabel} ${directive.Name || directive.DirectiveID}`,
        heading: directive.Name || directive.DirectiveID,
        badge: typeLabel,
        meta: {
            kind: 'bpm',
            bpMethodCode: directive.BpMethodCode,
            directiveId: directive.DirectiveID,
            directiveType: directive.DirectiveType,
            name: directive.Name || directive.DirectiveID,
        },

        async loadXaml() {
            if (cached) return cached;
            const ts = await bpmClient.getBpmMethod('BO', directive.BpMethodCode);
            const row = (ts?.BpDirective || []).find(d => d.DirectiveID === directive.DirectiveID);
            if (!row) throw new Error(`Directive ${directive.DirectiveID} not found on ${directive.BpMethodCode}`);
            cached = row.Body;
            return cached;
        },

        async saveXaml(newXaml) {
            const rawTs = await bpmClient.getBpmMethodRaw('BO', directive.BpMethodCode);
            const updated = patchBody(rawTs, directive.DirectiveID, newXaml);
            const result = await bpmClient.updateBpmRaw(updated);
            const errs = (result?.returnObj?.BpMessageSvc || []).filter(m => m.Severity > 1);
            if (errs.length) throw new Error(errs.map(e => e.Message).join('; '));
            cached = newXaml;
            // Keep the tree's cached row in sync so reopening shows fresh data.
            directive.Body = newXaml;
        },
    };
}

function openBpmWidgetPanel(context, bpmClient, directive) {
    return openWidgetPanel(context, createBpmHost(bpmClient, directive));
}

// ─── Raw tableset Body patcher ────────────────────────────────────────────────
// Same pattern as updateRawBpmDirective in bpmClient.js but replaces the
// entire Body XAML string rather than just the Code= attribute inside it.

function patchBody(raw, directiveId, newBodyXaml) {
    const arrayStart = raw.indexOf('"BpDirective":[');
    if (arrayStart < 0) throw new Error('BpDirective array not found in tableset');

    const idNeedle = `"DirectiveID":"${directiveId}"`;
    let cursor = raw.indexOf('[', arrayStart) + 1;

    while (cursor < raw.length) {
        const objStart = raw.indexOf('{', cursor);
        if (objStart < 0) break;

        let depth = 0, inStr = false, esc = false, objEnd = -1;
        for (let i = objStart; i < raw.length; i++) {
            const ch = raw[i];
            if (inStr) {
                if (esc) { esc = false; continue; }
                if (ch === '\\') { esc = true; continue; }
                if (ch === '"') inStr = false;
                continue;
            }
            if (ch === '"') { inStr = true; continue; }
            if (ch === '{') depth++;
            else if (ch === '}') { depth--; if (!depth) { objEnd = i; break; } }
        }
        if (objEnd < 0) throw new Error('Malformed BpDirective object in tableset');

        const objStr = raw.slice(objStart, objEnd + 1);
        if (!objStr.includes(idNeedle)) { cursor = objEnd + 1; continue; }

        // Found the directive row — extract Body string value boundaries
        const bodyKey = '"Body":"';
        const bk = objStr.indexOf(bodyKey);
        if (bk < 0) throw new Error('Body field not found in directive row');
        const vs = bk + bodyKey.length;
        let ve = vs, escaped = false;
        while (ve < objStr.length) {
            const ch = objStr[ve];
            if (escaped) { escaped = false; ve++; continue; }
            if (ch === '\\') { escaped = true; ve++; continue; }
            if (ch === '"') break;
            ve++;
        }

        // Splice in new Body, then duplicate the row with RowMod="U"
        const newBodyEncoded = JSON.stringify(newBodyXaml).slice(1, -1);
        const newObj  = objStr.slice(0, vs) + newBodyEncoded + objStr.slice(ve);
        let result    = raw.slice(0, objStart) + objStr + ',' + newObj + raw.slice(objEnd + 1);

        const rmNeedle = '"BitFlag":0,"RowMod":""';
        const rmIdx    = result.indexOf(rmNeedle, objStart + objStr.length + 1);
        if (rmIdx < 0) throw new Error(`RowMod anchor not found for directive ${directiveId}`);
        return result.slice(0, rmIdx) + '"BitFlag":0,"RowMod":"U"' + result.slice(rmIdx + rmNeedle.length);
    }
    throw new Error(`Directive ${directiveId} not found in tableset`);
}

module.exports = { openBpmWidgetPanel, createBpmHost, typeLabelOf };
