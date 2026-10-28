"use strict";

// Epicor Function host for the generic widget panel: reads and writes the
// widget XAML held in EfxFunction.Body, keeping any JSON envelope intact.

const { openWidgetPanel } = require('./widgetPanel');
const { describeBody, packFlowXaml } = require('./efxBody');

// `body` is optional — pass the row the tree already has to avoid a re-fetch.
function createEfxHost(client, libraryId, functionId, body) {
    let desc = body ? describeBody(body) : null;

    async function ensureFlow() {
        if (!desc) {
            const tableset = await client.getLibrary(libraryId);
            const row = (tableset?.EfxFunction || []).find(f => f.FunctionID === functionId);
            if (!row) throw new Error(`Function ${libraryId}.${functionId} not found on server`);
            desc = describeBody(row.Body);
        }
        if (desc.kind !== 'flow') {
            throw new Error(`${libraryId}.${functionId} has no widget flow — it is a code-based function`);
        }
        return desc;
    }

    return {
        key: `efx:${libraryId}.${functionId}`,
        title: `Function: ${libraryId}.${functionId}`,
        heading: `${libraryId}.${functionId}`,
        badge: 'Function',
        meta: { kind: 'efx', libraryId, functionId },

        async loadXaml() {
            return (await ensureFlow()).xaml;
        },

        async saveXaml(newXaml) {
            const current = await ensureFlow();
            await client.saveFunctionBody(libraryId, functionId, packFlowXaml(current, newXaml));
            desc = { ...current, xaml: newXaml };
        },
    };
}

function openEfxWidgetPanel(context, client, libraryId, functionId, body) {
    return openWidgetPanel(context, createEfxHost(client, libraryId, functionId, body));
}

module.exports = { openEfxWidgetPanel, createEfxHost };
