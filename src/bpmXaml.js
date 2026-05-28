"use strict";

const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

const XAML_NS = 'http://schemas.microsoft.com/winfx/2006/xaml';

// ─── DOM helpers ──────────────────────────────────────────────────────────────

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
    return el.getAttributeNS(XAML_NS, 'Name') || el.getAttribute('x:Name') || null;
}

function xKey(el) {
    return el.getAttributeNS(XAML_NS, 'Key') || el.getAttribute('x:Key') || null;
}

// ─── Position extraction ───────────────────────────────────────────────────────

function findVps(el) {
    // Direct child
    let vps = childByLocalName(el, 'VisualPropertiesStorage');
    if (vps) return vps;
    // Inside a property-element wrapper e.g. <DirectiveStep.VisualProperties>
    for (let i = 0; i < el.childNodes.length; i++) {
        const c = el.childNodes[i];
        if (c.nodeType !== 1 || !c.localName.includes('.')) continue;
        vps = childByLocalName(c, 'VisualPropertiesStorage');
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
        if (key === 'ElementX') x = parseFloat(c.textContent) || 0;
        if (key === 'ElementY') y = parseFloat(c.textContent) || 0;
    }
    return { x, y };
}

// ─── Widget element finders ────────────────────────────────────────────────────

// Find the action element inside a DirectiveStep — checks DirectiveStep.Action
// wrapper first, then falls back to first non-property non-VPS child element.
function findActionEl(stepEl) {
    const wrapper = childByLocalName(stepEl, 'DirectiveStep.Action');
    if (wrapper) return firstElement(wrapper);
    for (let i = 0; i < stepEl.childNodes.length; i++) {
        const c = stepEl.childNodes[i];
        if (c.nodeType !== 1) continue;
        if (c.localName.includes('.') || c.localName === 'VisualPropertiesStorage') continue;
        return c;
    }
    return null;
}

// Find the condition element inside a DirectiveCondition.
function findConditionEl(condEl) {
    const wrapper = childByLocalName(condEl, 'DirectiveCondition.Condition');
    if (wrapper) return firstElement(wrapper);
    for (let i = 0; i < condEl.childNodes.length; i++) {
        const c = condEl.childNodes[i];
        if (c.nodeType !== 1) continue;
        if (c.localName.includes('.') || c.localName === 'VisualPropertiesStorage') continue;
        return c;
    }
    return null;
}

// ─── Widget info extraction ────────────────────────────────────────────────────

const ACTION_LABELS = {
    CustomCodeAction:        'Execute Custom Code',
    EnableDirectivesAction:  'Enable Post Directive',
    RaiseExceptionAction:    'Raise Exception',
    SetDataFieldAction:      'Set Data Field',
    CallMethodAction:        'Invoke BO Method',
    CompleteMethodCallAction:'Complete Method Call',
    SendEmailAction:         'Send E-mail',
    ActivityTrackingAction:  'Activity Tracking',
    LogMessageAction:        'Log Message',
    ShowMessageAction:       'Show Message',
    AttachDataTagAction:     'Attach Data Tag',
    RemoveDataTagAction:     'Remove Data Tag',
    AttachHoldAction:        'Attach Hold',
    RemoveHoldsAction:       'Remove Holds',
    EnablePostDirectiveAction:'Enable Post Directive',
    InvokeFunctionAction:    'Invoke Function',
    InvokeExternalMethodAction:'Invoke External Method',
};

const CONDITION_LABELS = {
    CustomCodeCondition: 'C# Condition',
    FieldCondition:      'Field Condition',
};

function extractWidget(el) {
    if (!el) return null;
    const localName = el.localName;
    const attrs = {};
    for (let i = 0; i < el.attributes.length; i++) {
        const a = el.attributes[i];
        if (a.name.startsWith('xmlns')) continue;
        attrs[a.name] = a.value;
    }
    // Code is auto-decoded by the DOM parser (entity refs → chars)
    const code = el.hasAttribute('Code') ? el.getAttribute('Code') : null;

    // RaiseExceptionAction stores the message as a child x:String element
    let message = null;
    const msgEl = firstElement(el);
    if (msgEl && msgEl.localName === 'String') {
        message = msgEl.textContent;
    }

    // SetBpmDataFieldAction: expression + field in child property elements
    let actionExpressionText = null;
    let actionFieldInfo = null;
    if (localName === 'SetBpmDataFieldAction') {
        const exprWrapper = childByLocalName(el, localName + '.Expression');
        if (exprWrapper) {
            const exprDef = childByLocalName(exprWrapper, 'ExpressionDefinition');
            if (exprDef) actionExpressionText = exprDef.getAttribute('Text');
        }
        const fieldWrapper = childByLocalName(el, localName + '.Field');
        if (fieldWrapper) {
            const colInfo = childByLocalName(fieldWrapper, 'ColumnInfo');
            if (colInfo) actionFieldInfo = {
                tableName: colInfo.getAttribute('TableName'),
                columnName: colInfo.getAttribute('ColumnName'),
            };
        }
    }

    // InvokeEpicorFunctionAction2: parameter bindings (VariableBindingTarget.VariableName)
    let paramBindings = null;
    if (localName === 'InvokeEpicorFunctionAction2' || localName === 'InvokeEpicorFunctionAction') {
        paramBindings = [];
        for (const propName of ['InputParameters', 'OutputParameters']) {
            const wrapper = childByLocalName(el, localName + '.' + propName);
            if (!wrapper) continue;
            const parent = childByLocalName(wrapper, 'Array') || wrapper;
            for (let i = 0; i < parent.childNodes.length; i++) {
                const pb = parent.childNodes[i];
                if (pb.nodeType !== 1 || pb.localName !== 'ParameterBinding2') continue;
                const btWrapper = childByLocalName(pb, 'ParameterBinding2.BindingTarget');
                const vbt = btWrapper ? childByLocalName(btWrapper, 'VariableBindingTarget') : null;
                paramBindings.push({
                    paramName: pb.getAttribute('ParameterName') || '',
                    paramDirection: pb.getAttribute('ParameterDirection') || 'Input',
                    variableName: vbt ? (vbt.getAttribute('VariableName') || '') : '',
                });
            }
        }
    }

    // ConditionBlock stores conditions as ConditionBlockItem children inside .Items
    let conditions = null;
    if (localName === 'ConditionBlock') {
        conditions = [];
        const itemsWrapper = childByLocalName(el, 'ConditionBlock.Items');
        const itemsParent = itemsWrapper || el;
        for (let i = 0; i < itemsParent.childNodes.length; i++) {
            const item = itemsParent.childNodes[i];
            if (item.nodeType !== 1 || item.localName !== 'ConditionBlockItem') continue;

            const itemOperator = item.getAttribute('Operator') || 'None';

            // Actual condition is inside ConditionBlockItem.Condition
            const condWrapper = childByLocalName(item, 'ConditionBlockItem.Condition');
            const actualCond = condWrapper ? firstElement(condWrapper) : null;
            if (!actualCond) continue;

            const condLocalName = actualCond.localName;
            const condAttrs = {};
            for (let j = 0; j < actualCond.attributes.length; j++) {
                const a = actualCond.attributes[j];
                if (!a.name.startsWith('xmlns')) condAttrs[a.name] = a.value;
            }

            // Expression text: {localName}.Expression > ExpressionDefinition Text attr
            let expressionText = null;
            const exprWrapper = childByLocalName(actualCond, condLocalName + '.Expression');
            if (exprWrapper) {
                const exprDef = childByLocalName(exprWrapper, 'ExpressionDefinition');
                if (exprDef) expressionText = exprDef.getAttribute('Text');
            }

            // Field info: {localName}.Field > ColumnInfo attrs
            let fieldInfo = null;
            const fieldWrapper = childByLocalName(actualCond, condLocalName + '.Field');
            if (fieldWrapper) {
                const colInfo = childByLocalName(fieldWrapper, 'ColumnInfo');
                if (colInfo) fieldInfo = {
                    tableName: colInfo.getAttribute('TableName'),
                    columnName: colInfo.getAttribute('ColumnName'),
                };
            }

            conditions.push({ localName: condLocalName, attrs: condAttrs, itemOperator, expressionText, fieldInfo });
        }
    }

    return { localName, attrs, code, message, conditions, actionExpressionText, actionFieldInfo, paramBindings, label: ACTION_LABELS[localName] || CONDITION_LABELS[localName] || localName };
}

// ─── Main parser ───────────────────────────────────────────────────────────────

function parseDirective(bodyXml) {
    if (!bodyXml) return null;

    const doc = new DOMParser({
        onError: (level, msg) => { if (level === 'fatalError') throw new Error(msg); },
    }).parseFromString(bodyXml, 'text/xml');

    const root = doc.documentElement;
    if (!root || root.localName !== 'DirectiveDefinition2') return null;

    const nodes = [];
    const edges = [];
    const seen  = new Set();

    function walk(el, fromId, edgeLabel) {
        if (!el) return;
        // {x:Null} means the branch terminates
        if (el.localName === 'Null' || el.getAttribute('x:Null') !== null) return;

        const id = xName(el) || `_node${nodes.length}`;

        if (seen.has(id)) {
            if (fromId !== null) edges.push({ from: fromId, to: id, label: edgeLabel });
            return;
        }
        seen.add(id);
        if (fromId !== null) edges.push({ from: fromId, to: id, label: edgeLabel });

        const { x, y } = getPosition(el);

        if (el.localName === 'DirectiveCondition') {
            nodes.push({ id, type: 'condition', widget: extractWidget(findConditionEl(el)), x, y, _el: el });

            const trueWrapper  = childByLocalName(el, 'DirectiveCondition.True');
            const falseWrapper = childByLocalName(el, 'DirectiveCondition.False');

            // True branch — also check inline attribute form
            const trueEl = trueWrapper ? firstElement(trueWrapper) : null;
            if (trueEl) walk(trueEl, id, 'True');
            else edges.push({ from: id, to: null, label: 'True' });

            // False branch
            const falseAttr = el.getAttribute('False');
            const falseEl   = falseWrapper ? firstElement(falseWrapper) : null;
            if (falseEl) walk(falseEl, id, 'False');
            else if (!falseAttr || falseAttr === '{x:Null}') edges.push({ from: id, to: null, label: 'False' });

        } else if (el.localName === 'DirectiveStep') {
            nodes.push({ id, type: 'step', widget: extractWidget(findActionEl(el)), x, y, _el: el });

            const nextWrapper = childByLocalName(el, 'DirectiveStep.Next');
            if (nextWrapper) walk(firstElement(nextWrapper), id, null);
        }
    }

    const startWrapper = childByLocalName(root, 'DirectiveDefinition2.StartNode');
    if (startWrapper) walk(firstElement(startWrapper), null, null);

    return { nodes, edges, startNodeId: nodes[0]?.id ?? null, doc, root };
}

// ─── Mutation helpers ─────────────────────────────────────────────────────────

// Update the Code attribute on a specific node's widget element.
// Returns updated XML string ready to push to Epicor.
function setNodeCode(bodyXml, nodeId, newCode) {
    const parsed = parseDirective(bodyXml);
    if (!parsed) throw new Error('Failed to parse directive XAML');

    const node = parsed.nodes.find(n => n.id === nodeId);
    if (!node) throw new Error(`Node "${nodeId}" not found`);

    const widgetEl = node.type === 'condition'
        ? findConditionEl(node._el)
        : findActionEl(node._el);
    if (!widgetEl) throw new Error(`No widget element found in node "${nodeId}"`);
    if (!widgetEl.hasAttribute('Code')) throw new Error(`Widget ${widgetEl.localName} has no Code attribute`);

    // DOM setAttribute re-encodes special chars on serialization automatically
    widgetEl.setAttribute('Code', newCode);
    return new XMLSerializer().serializeToString(parsed.doc);
}

// Update the message text on a RaiseExceptionAction node.
function setRaiseExceptionMessage(bodyXml, nodeId, newMessage) {
    const parsed = parseDirective(bodyXml);
    if (!parsed) throw new Error('Failed to parse directive XAML');

    const node = parsed.nodes.find(n => n.id === nodeId);
    if (!node || node.type !== 'step') throw new Error(`Step node "${nodeId}" not found`);

    const actionEl = findActionEl(node._el);
    if (!actionEl || actionEl.localName !== 'RaiseExceptionAction') {
        throw new Error(`Node "${nodeId}" is not a RaiseExceptionAction`);
    }

    const msgEl = firstElement(actionEl);
    if (msgEl && msgEl.localName === 'String') {
        msgEl.textContent = newMessage;
    }
    return new XMLSerializer().serializeToString(parsed.doc);
}

// Update condition items inside a ConditionBlock.
// conditionUpdates = [{ index, conditionAttrs, expressionText, itemOperator }]
function setConditionChildren(bodyXml, nodeId, conditionUpdates) {
    const parsed = parseDirective(bodyXml);
    if (!parsed) throw new Error('Failed to parse directive XAML');

    const node = parsed.nodes.find(n => n.id === nodeId);
    if (!node) throw new Error(`Node "${nodeId}" not found`);

    const widgetEl = node.type === 'condition' ? findConditionEl(node._el) : findActionEl(node._el);
    if (!widgetEl || widgetEl.localName !== 'ConditionBlock') throw new Error('Not a ConditionBlock node');

    const itemsWrapper = childByLocalName(widgetEl, 'ConditionBlock.Items');
    const itemsParent = itemsWrapper || widgetEl;

    const items = [];
    for (let i = 0; i < itemsParent.childNodes.length; i++) {
        const c = itemsParent.childNodes[i];
        if (c.nodeType === 1 && c.localName === 'ConditionBlockItem') items.push(c);
    }

    for (const { index, conditionAttrs, expressionText, itemOperator, fieldInfo } of conditionUpdates) {
        const item = items[index];
        if (!item) continue;

        // ConditionBlockItem.Operator (And/Or/None)
        if (itemOperator !== undefined) item.setAttribute('Operator', itemOperator);

        const condWrapper = childByLocalName(item, 'ConditionBlockItem.Condition');
        const actualCond = condWrapper ? firstElement(condWrapper) : null;
        if (!actualCond) continue;

        // Direct attrs on the condition element (e.g. Operator, Filter)
        if (conditionAttrs) {
            for (const [attr, value] of Object.entries(conditionAttrs)) {
                actualCond.setAttribute(attr, value);
            }
        }

        // Expression text
        if (expressionText !== undefined) {
            const exprWrapper = childByLocalName(actualCond, actualCond.localName + '.Expression');
            if (exprWrapper) {
                const exprDef = childByLocalName(exprWrapper, 'ExpressionDefinition');
                if (exprDef) exprDef.setAttribute('Text', expressionText);
            }
        }

        // Field info (TableName / ColumnName on ColumnInfo child)
        if (fieldInfo) {
            const fieldWrapper = childByLocalName(actualCond, actualCond.localName + '.Field');
            if (fieldWrapper) {
                const colInfo = childByLocalName(fieldWrapper, 'ColumnInfo');
                if (colInfo) {
                    if (fieldInfo.tableName !== undefined) colInfo.setAttribute('TableName', fieldInfo.tableName);
                    if (fieldInfo.columnName !== undefined) colInfo.setAttribute('ColumnName', fieldInfo.columnName);
                }
            }
        }
    }
    return new XMLSerializer().serializeToString(parsed.doc);
}

// Update multiple attributes on a widget element in one round-trip.
function setNodeAttrs(bodyXml, nodeId, attrsMap) {
    const parsed = parseDirective(bodyXml);
    if (!parsed) throw new Error('Failed to parse directive XAML');

    const node = parsed.nodes.find(n => n.id === nodeId);
    if (!node) throw new Error(`Node "${nodeId}" not found`);

    const widgetEl = node.type === 'condition'
        ? findConditionEl(node._el)
        : findActionEl(node._el);
    if (!widgetEl) throw new Error(`No widget element found in node "${nodeId}"`);

    for (const [attr, value] of Object.entries(attrsMap)) {
        widgetEl.setAttribute(attr, value);
    }
    return new XMLSerializer().serializeToString(parsed.doc);
}

// Update FunctionId/LibraryId attrs and parameter binding variable names on InvokeEpicorFunctionAction2.
// paramBindings = [{ paramName, variableName }]
function setInvokeFunctionAction(bodyXml, nodeId, attrsMap, paramBindings) {
    const parsed = parseDirective(bodyXml);
    if (!parsed) throw new Error('Failed to parse directive XAML');

    const node = parsed.nodes.find(n => n.id === nodeId);
    if (!node) throw new Error(`Node "${nodeId}" not found`);

    const actionEl = findActionEl(node._el);
    if (!actionEl) throw new Error(`No action element found in node "${nodeId}"`);

    for (const [attr, value] of Object.entries(attrsMap)) {
        actionEl.setAttribute(attr, value);
    }

    for (const { paramName, variableName } of paramBindings) {
        for (const propName of ['InputParameters', 'OutputParameters']) {
            const wrapper = childByLocalName(actionEl, actionEl.localName + '.' + propName);
            if (!wrapper) continue;
            const parent = childByLocalName(wrapper, 'Array') || wrapper;
            for (let i = 0; i < parent.childNodes.length; i++) {
                const pb = parent.childNodes[i];
                if (pb.nodeType !== 1 || pb.localName !== 'ParameterBinding2') continue;
                if (pb.getAttribute('ParameterName') !== paramName) continue;
                const btWrapper = childByLocalName(pb, 'ParameterBinding2.BindingTarget');
                const vbt = btWrapper ? childByLocalName(btWrapper, 'VariableBindingTarget') : null;
                if (vbt) vbt.setAttribute('VariableName', variableName);
            }
        }
    }

    return new XMLSerializer().serializeToString(parsed.doc);
}

// Update the expression text and/or target field on SetBpmDataFieldAction.
function setActionField(bodyXml, nodeId, expressionText, fieldInfo) {
    const parsed = parseDirective(bodyXml);
    if (!parsed) throw new Error('Failed to parse directive XAML');

    const node = parsed.nodes.find(n => n.id === nodeId);
    if (!node) throw new Error(`Node "${nodeId}" not found`);

    const actionEl = findActionEl(node._el);
    if (!actionEl) throw new Error(`No action element found in node "${nodeId}"`);

    if (expressionText !== undefined) {
        const exprWrapper = childByLocalName(actionEl, actionEl.localName + '.Expression');
        if (exprWrapper) {
            const exprDef = childByLocalName(exprWrapper, 'ExpressionDefinition');
            if (exprDef) exprDef.setAttribute('Text', expressionText);
        }
    }

    if (fieldInfo) {
        const fieldWrapper = childByLocalName(actionEl, actionEl.localName + '.Field');
        if (fieldWrapper) {
            const colInfo = childByLocalName(fieldWrapper, 'ColumnInfo');
            if (colInfo) {
                if (fieldInfo.tableName !== undefined) colInfo.setAttribute('TableName', fieldInfo.tableName);
                if (fieldInfo.columnName !== undefined) colInfo.setAttribute('ColumnName', fieldInfo.columnName);
            }
        }
    }

    return new XMLSerializer().serializeToString(parsed.doc);
}

module.exports = { parseDirective, setNodeCode, setRaiseExceptionMessage, setNodeAttrs, setConditionChildren, setInvokeFunctionAction, setActionField };
