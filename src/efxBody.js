"use strict";

// EfxFunction.Body holds a function's implementation in one of two shapes:
//
//   code-based    → a JSON envelope {"Code":"…","Usings":"…"}
//   widget-based  → the same widget-flow XAML BPM directives use, stored either
//                   raw or inside a property of the JSON envelope
//
// describeBody() normalises both so no caller has to sniff the format itself.

const { looksLikeFlowXaml, summarizeFlow, setNodeCode } = require('./widgetXaml');

// Returns:
//   { kind: 'code', code, usings, flow: null }
//   { kind: 'flow', xaml, xamlProp, envelope, code, usings, flow }
// where flow is the summarizeFlow() result (node count + custom-code widgets).
function describeBody(body) {
    const text = body == null ? '' : String(body);
    if (!text.trim()) return { kind: 'code', code: '', usings: '', flow: null };

    if (looksLikeFlowXaml(text)) {
        const flow = summarizeFlow(text);
        if (flow) {
            return { kind: 'flow', xaml: text, xamlProp: null, envelope: null, code: '', usings: '', flow };
        }
        // Looked like XAML but yielded no widget graph. Flag it: callers must
        // not treat this as C# — writing it into a .cs file and pushing it back
        // would replace the function body with its own markup.
        return { kind: 'code', code: text, usings: '', flow: null, unparsedFlow: true };
    }

    let parsed = null;
    try { parsed = JSON.parse(text); } catch { /* not an envelope */ }

    if (parsed && typeof parsed === 'object') {
        for (const [prop, value] of Object.entries(parsed)) {
            if (typeof value !== 'string' || !looksLikeFlowXaml(value)) continue;
            const flow = summarizeFlow(value);
            if (flow) {
                return {
                    kind: 'flow',
                    xaml: value,
                    xamlProp: prop,
                    envelope: parsed,
                    code: typeof parsed.Code === 'string' ? parsed.Code : '',
                    usings: typeof parsed.Usings === 'string' ? parsed.Usings : '',
                    flow,
                };
            }
        }
        return { kind: 'code', code: parsed.Code || '', usings: parsed.Usings || '', flow: null };
    }

    return { kind: 'code', code: text, usings: '', flow: null };
}

// Put edited flow XAML back into whatever container it came out of.
function packFlowXaml(desc, newXaml) {
    if (desc.kind !== 'flow') throw new Error('Function body is not a widget flow');
    if (!desc.xamlProp) return newXaml;
    return JSON.stringify({ ...desc.envelope, [desc.xamlProp]: newXaml });
}

// Replace one custom-code widget's C# inside a function body, envelope intact.
function setBodyNodeCode(body, nodeId, newCode) {
    const desc = describeBody(body);
    return packFlowXaml(desc, setNodeCode(desc.xaml, nodeId, newCode));
}

// The C# a function actually contains, for search indexing and previews.
// Widget flows contribute every custom-code widget, labelled by node.
function bodyCodeText(body) {
    const desc = describeBody(body);
    if (desc.unparsedFlow) return '';
    if (desc.kind !== 'flow') return desc.code || '';
    return desc.flow.codeNodes
        .map(n => (desc.flow.codeNodes.length > 1 ? `// ── ${n.label} (${n.id}) ──\n` : '') + n.code)
        .join('\n\n');
}

// One-line description of how a function is implemented, for tree tooltips.
function bodyKindLabel(desc) {
    if (desc.unparsedFlow) return 'Unrecognised widget body';
    if (desc.kind !== 'flow') return 'Code-based';
    if (desc.flow.onlyCustomCode) return 'Widget flow — custom code only';
    const n = desc.flow.codeNodes.length;
    return `Widget flow — ${desc.flow.nodeCount} widgets, ${n} with custom code`;
}

module.exports = { describeBody, packFlowXaml, setBodyNodeCode, bodyCodeText, bodyKindLabel };
