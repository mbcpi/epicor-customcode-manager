"use strict";
const vscode = require("vscode");
const { EpicorClient } = require("./epicorClient");
const { BpmClient, extractBpmCode } = require("./bpmClient");
const { KineticMetaFXClient } = require("./kineticLayerClient");

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCTIONS COMPARE HELPERS  (ported from compare.py)
// ═══════════════════════════════════════════════════════════════════════════════

function parseFunctionBody(bodyStr) {
    if (!bodyStr) return { code: '', usings: '' };
    try { const b = JSON.parse(bodyStr); return { code: b.Code || '', usings: b.Usings || '' }; }
    catch { return { code: bodyStr, usings: '' }; }
}

function buildFnMap(data) {
    const fns   = data.EfxFunction || [];
    const sigs  = data.EfxFunctionSignature || [];
    const libs  = data.EfxLibrary || [];

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
    const addRef = (libId, key, val) => { (refMap[libId] = refMap[libId] || {})[key] = ((refMap[libId] || {})[key] || []); refMap[libId][key].push(val); };
    for (const r of (data.EfxRefLibrary  || [])) addRef(r.LibraryID, 'libs',       r.LibraryRef);
    for (const r of (data.EfxRefAssembly || [])) addRef(r.LibraryID, 'assemblies', r.Assembly);
    for (const r of (data.EfxRefService  || [])) addRef(r.LibraryID, 'services',   r.ServiceID);
    for (const r of (data.EfxRefTable    || [])) addRef(r.LibraryID, 'tables',     `${r.TableID} (${r.Updatable ? 'rw' : 'ro'})`);

    const libDetail = {};
    for (const l of libs) libDetail[l.LibraryID] = l;

    const fnMap = {};
    for (const fn of fns) {
        const { code, usings } = parseFunctionBody(fn.Body);
        if (!fnMap[fn.LibraryID]) fnMap[fn.LibraryID] = {};
        fnMap[fn.LibraryID][fn.FunctionID] = {
            ...fn, _code: code, _usings: usings,
            _sig: sigMap[`${fn.LibraryID}|${fn.FunctionID}`] || { inputs: [], outputs: [] },
        };
    }
    return { fnMap, refMap, libDetail };
}

function compareFn(fa, fb) {
    const fields = {}; let hasDiff = false;
    for (const [key, label] of [['_code', 'Code'], ['_usings', 'Usings']]) {
        const va = fa[key] || '', vb = fb[key] || '', same = va === vb;
        if (!same) hasDiff = true;
        fields[label] = { a: va, b: vb, same };
    }
    for (const key of ['Description', 'Kind', 'RequireTransaction', 'SingleRowMode', 'Private', 'Disabled']) {
        const va = String(fa[key] ?? ''), vb = String(fb[key] ?? ''), same = va === vb;
        if (!same) hasDiff = true;
        fields[key] = { a: va, b: vb, same };
    }
    const fmt = ps => (ps || []).map(p => `${p.name}: ${p.type}`).join(', ');
    const sigA = fa._sig || {}, sigB = fb._sig || {};
    for (const [label, key] of [['Inputs', 'inputs'], ['Outputs', 'outputs']]) {
        const va = fmt(sigA[key]), vb = fmt(sigB[key]), same = va === vb;
        if (!same) hasDiff = true;
        fields[label] = { a: va, b: vb, same, params_a: sigA[key] || [], params_b: sigB[key] || [] };
    }
    fields.hasDiff = hasDiff;
    return fields;
}

const DIFF_WORTHY = ['DirectDBAccess', 'AllowCustomCodeFunctions', 'AllowCustomCodeWidgets', 'Frozen', 'Disabled'];
const INFO_ONLY   = ['Description', 'Owner', 'Revision', 'EpicorVersion', 'Mode', 'Notes', 'Package', 'PackageVersion', 'Publisher', 'LockedBy', 'LockedOn', 'DebugMode', 'DumpSources', 'AdvTracing'];

function compareLibRefs(refsA, refsB, detA, detB) {
    const diffs = {}; let hasDiff = false;
    for (const key of ['libs', 'assemblies', 'services', 'tables']) {
        const va = ([...(refsA[key] || [])].sort()).join('\n');
        const vb = ([...(refsB[key] || [])].sort()).join('\n');
        const same = va === vb; if (!same) hasDiff = true;
        diffs[key] = { a: va, b: vb, same };
    }
    for (const key of DIFF_WORTHY) {
        const va = String((detA || {})[key] ?? ''), vb = String((detB || {})[key] ?? ''), same = va === vb;
        if (!same) hasDiff = true;
        diffs[key] = { a: va, b: vb, same };
    }
    for (const key of INFO_ONLY) {
        const va = String((detA || {})[key] ?? ''), vb = String((detB || {})[key] ?? '');
        diffs[key] = { a: va, b: vb, same: va === vb, infoOnly: true };
    }
    diffs.hasDiff = hasDiff;
    return diffs;
}

function safeFn(fn) {
    if (!fn) return null;
    return { FunctionID: fn.FunctionID || '', Description: fn.Description || '', Kind: fn.Kind,
        RequireTransaction: fn.RequireTransaction, SingleRowMode: fn.SingleRowMode,
        Private: fn.Private, Disabled: fn.Disabled,
        _code: fn._code || '', _usings: fn._usings || '',
        _sig: fn._sig || { inputs: [], outputs: [] } };
}

function buildLibraryCompare(libListA, libListB, fnMapA, fnMapB, refMapA, refMapB, libDetailA, libDetailB) {
    const allIds = [...new Set([
        ...libListA.map(l => l.LibraryID), ...libListB.map(l => l.LibraryID),
        ...Object.keys(fnMapA), ...Object.keys(fnMapB),
    ])].sort();
    const results = [];
    for (const libId of allIds) {
        const inA = libId in fnMapA || libId in libDetailA;
        const inB = libId in fnMapB || libId in libDetailB;
        const fnsA = fnMapA[libId] || {}, fnsB = fnMapB[libId] || {};
        const allFnIds = [...new Set([...Object.keys(fnsA), ...Object.keys(fnsB)])].sort();
        const fnDiffs = [];
        for (const fnId of allFnIds) {
            const fa = fnsA[fnId], fb = fnsB[fnId];
            if (!fa)      fnDiffs.push({ fnID: fnId, status: 'only-b', fa: null,       fb: safeFn(fb) });
            else if (!fb) fnDiffs.push({ fnID: fnId, status: 'only-a', fa: safeFn(fa), fb: null });
            else { const fields = compareFn(fa, fb); fnDiffs.push({ fnID: fnId, status: fields.hasDiff ? 'diff' : 'match', fa: safeFn(fa), fb: safeFn(fb), fields }); }
        }
        const libDiff = compareLibRefs(refMapA[libId] || {}, refMapB[libId] || {}, libDetailA[libId], libDetailB[libId]);
        let status;
        if (!inA) status = 'only-b';
        else if (!inB) status = 'only-a';
        else if (fnDiffs.some(f => f.status !== 'match') || libDiff.hasDiff) status = 'diff';
        else status = 'match';
        results.push({ libID: libId, status, inA, inB, libDiff, fnDiffs });
    }
    return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BPM COMPARE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function compareDirective(da, db) {
    const fields = {}; let hasDiff = false;
    const cA = da._code || '', cB = db._code || '', codeSame = cA === cB;
    if (!codeSame) hasDiff = true;
    fields.Code = { a: cA, b: cB, same: codeSame };
    for (const key of ['DirectiveType', 'IsEnabled', 'Sequence']) {
        const va = String(da[key] ?? ''), vb = String(db[key] ?? ''), same = va === vb;
        if (!same) hasDiff = true;
        fields[key] = { a: va, b: vb, same };
    }
    fields.hasDiff = hasDiff;
    return fields;
}

function safeDirective(d) {
    if (!d) return null;
    return { name: d.Name || '', DirectiveType: d.DirectiveType, IsEnabled: d.IsEnabled,
        Sequence: d.Sequence, hasCode: d.hasCode || false, _code: d._code || '' };
}

function buildBpmCompare(methodsA, directivesA, methodsB, directivesB) {
    const methodMapA = {}, methodMapB = {};
    for (const m of methodsA) methodMapA[m.BpMethodCode] = m;
    for (const m of methodsB) methodMapB[m.BpMethodCode] = m;

    const dirMapA = {}, dirMapB = {};
    for (const d of directivesA) { if (!dirMapA[d.BpMethodCode]) dirMapA[d.BpMethodCode] = {}; dirMapA[d.BpMethodCode][d.Name] = d; }
    for (const d of directivesB) { if (!dirMapB[d.BpMethodCode]) dirMapB[d.BpMethodCode] = {}; dirMapB[d.BpMethodCode][d.Name] = d; }

    const allCodes = [...new Set([...Object.keys(methodMapA), ...Object.keys(methodMapB)])].sort();
    const serviceMap = {};
    for (const code of allCodes) {
        const m = methodMapA[code] || methodMapB[code];
        const svcKey = `${m.SystemCode || 'Erp'}:${m.BusinessObject || code}`;
        if (!serviceMap[svcKey]) serviceMap[svcKey] = { systemCode: m.SystemCode || 'Erp', businessObject: m.BusinessObject || code, methods: [] };
        const dirsA = dirMapA[code] || {}, dirsB = dirMapB[code] || {};
        const allDirNames = [...new Set([...Object.keys(dirsA), ...Object.keys(dirsB)])].sort();
        const dirDiffs = [];
        for (const name of allDirNames) {
            const da = dirsA[name], db = dirsB[name];
            if (!da)      dirDiffs.push({ name, status: 'only-b', da: null,          db: safeDirective(db) });
            else if (!db) dirDiffs.push({ name, status: 'only-a', da: safeDirective(da), db: null });
            else { const fields = compareDirective(da, db); dirDiffs.push({ name, status: fields.hasDiff ? 'diff' : 'match', da: safeDirective(da), db: safeDirective(db), fields }); }
        }
        const inA = code in methodMapA, inB = code in methodMapB;
        let status = !inA ? 'only-b' : !inB ? 'only-a' : dirDiffs.some(d => d.status !== 'match') ? 'diff' : 'match';
        serviceMap[svcKey].methods.push({ methodCode: code, methodName: m.Name || code, status, inA, inB, dirDiffs });
    }

    const services = Object.entries(serviceMap).map(([svcKey, svc]) => {
        const diffCount = svc.methods.reduce((n, m) => n + m.dirDiffs.filter(d => d.status !== 'match').length, 0);
        const status = svc.methods.some(m => m.status !== 'match') ? 'diff' : 'match';
        return { svcKey, systemCode: svc.systemCode, businessObject: svc.businessObject, status, diffCount, methods: svc.methods };
    });
    services.sort((a, b) => { const o = { diff: 0, 'only-a': 1, 'only-b': 2, match: 3 }; return (o[a.status] ?? 4) - (o[b.status] ?? 4) || a.businessObject.localeCompare(b.businessObject); });

    const counts = { match: 0, diff: 0 };
    for (const s of services) counts[s.status] = (counts[s.status] || 0) + 1;
    return { services, counts, total: services.length };
}

// ═══════════════════════════════════════════════════════════════════════════════
// JSON NORMALIZATION  (for layer file diffs)
// ═══════════════════════════════════════════════════════════════════════════════

function sortKeys(v) {
    if (Array.isArray(v)) return v.map(sortKeys);
    if (v && typeof v === 'object') return Object.keys(v).sort().reduce((a, k) => { a[k] = sortKeys(v[k]); return a; }, {});
    return v;
}
function normalizeJson(str) {
    if (!str || !str.trim()) return str || '';
    try { return JSON.stringify(sortKeys(JSON.parse(str)), null, 2); }
    catch { return str; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPARE PANEL
// ═══════════════════════════════════════════════════════════════════════════════

class ComparePanel {
    constructor(panel, context) {
        this.panel   = panel;
        this.context = context;
        this.disposed = false;
        // Cache of layer file content for openNativeDiff: key = `${appId}::${fileName}`
        this._layerCache = new Map();

        panel.webview.onDidReceiveMessage(async (msg) => {
            try {
                switch (msg.command) {
                    case 'ready':             this._postProfiles(); break;
                    case 'runCompare':        await this._runFunctionsCompare(msg); break;
                    case 'runBpmCompare':     await this._runBpmCompare(msg); break;
                    case 'runLayersCompare':  await this._runLayersCompare(msg); break;
                    case 'fetchLayerList':    await this._fetchLayerList(msg); break;
                    case 'fetchLayerContent': await this._fetchLayerContent(msg); break;
                    case 'openNativeDiff':    await this._openNativeDiff(msg); break;
                    case 'applyLayer':        await this._applyLayer(msg); break;
                }
            } catch (err) {
                this._post({ command: 'error', message: err.message });
            }
        });

        panel.onDidDispose(() => { this.disposed = true; ComparePanel.panels.delete(ComparePanel.KEY); });
        panel.webview.html = this.getHtml();
    }

    static show(context) {
        const existing = ComparePanel.panels.get(ComparePanel.KEY);
        if (existing && !existing.disposed) { existing.panel.reveal(); return; }
        const panel = vscode.window.createWebviewPanel('efxCompare', 'Compare', vscode.ViewColumn.Two,
            { enableScripts: true, retainContextWhenHidden: true });
        ComparePanel.panels.set(ComparePanel.KEY, new ComparePanel(panel, context));
    }

    _post(msg) { if (!this.disposed) this.panel.webview.postMessage(msg); }

    _postProfiles() {
        const profiles      = vscode.workspace.getConfiguration().get('efx.profiles') || [];
        const activeProfile = vscode.workspace.getConfiguration().get('efx.activeProfile') || '';
        const activeCompany = vscode.workspace.getConfiguration().get('efx.activeCompany') || '';
        this._post({ command: 'profiles', data: profiles.map(p => ({ name: p.name, companies: p.companies || [] })), activeProfile, activeCompany });
    }

    async _secrets(profileName) {
        const password = (await this.context.secrets.get(`efx.profile.${profileName}.password`)) || '';
        const apiKey   = (await this.context.secrets.get(`efx.profile.${profileName}.apiKey`))   || '';
        return { password, apiKey };
    }

    async _efxClient(profileName, company) {
        const profiles = vscode.workspace.getConfiguration().get('efx.profiles') || [];
        const profile  = profiles.find(p => p.name === profileName);
        if (!profile) throw new Error(`Profile "${profileName}" not found`);
        const { password, apiKey } = await this._secrets(profileName);
        return new EpicorClient({ serverUrl: profile.serverUrl, company, username: profile.username, password, apiKey });
    }

    async _metafxClient(profileName, company) {
        const profiles = vscode.workspace.getConfiguration().get('efx.profiles') || [];
        const profile  = profiles.find(p => p.name === profileName);
        if (!profile) throw new Error(`Profile "${profileName}" not found`);
        const { password, apiKey } = await this._secrets(profileName);
        return new KineticMetaFXClient({ serverUrl: profile.serverUrl, company, username: profile.username, password, apiKey });
    }

    async _runFunctionsCompare({ profileA, companyA, profileB, companyB }) {
        this._post({ command: 'status', text: 'Building clients…' });
        try {
            const [cA, cB] = await Promise.all([this._efxClient(profileA, companyA), this._efxClient(profileB, companyB)]);
            this._post({ command: 'status', text: 'Fetching library lists…' });
            const [libListA, libListB] = await Promise.all([cA.getLibraryList(), cB.getLibraryList()]);
            const allIds = [...new Set([...libListA.map(l => l.LibraryID), ...libListB.map(l => l.LibraryID)])];
            this._post({ command: 'status', text: `Fetching ${allIds.length} libraries from both environments…` });
            const [rawA, rawB] = await Promise.all([
                cA.request(cA.getDesignerUrl('GetLibraries'), { libraryIds: allIds }),
                cB.request(cB.getDesignerUrl('GetLibraries'), { libraryIds: allIds }),
            ]);
            this._post({ command: 'status', text: 'Computing diff…' });
            const rA = rawA.returnObj || rawA, rB = rawB.returnObj || rawB;
            const { fnMap: fnMapA, refMap: refMapA, libDetail: ldA } = buildFnMap(rA);
            const { fnMap: fnMapB, refMap: refMapB, libDetail: ldB } = buildFnMap(rB);
            const libraries = buildLibraryCompare(libListA, libListB, fnMapA, fnMapB, refMapA, refMapB, ldA, ldB);
            const counts = { match: 0, diff: 0, 'only-a': 0, 'only-b': 0 };
            for (const l of libraries) counts[l.status] = (counts[l.status] || 0) + 1;
            this._post({ command: 'functionsReady', data: { meta: { env_a_name: profileA, env_b_name: profileB, counts, total: libraries.length }, libraries } });
        } catch (err) {
            this._post({ command: 'error', tab: 'functions', message: err.message });
        }
    }

    async _runBpmCompare({ profileA, companyA, profileB, companyB }) {
        this._post({ command: 'status', text: 'Fetching BPM services…' });
        try {
            const [cA, cB] = await Promise.all([this._efxClient(profileA, companyA), this._efxClient(profileB, companyB)]);
            const bA = new BpmClient(cA), bB = new BpmClient(cB);

            // Use the same proven approach as the BPM tree provider:
            // 1. GetBpmDirectiveServicesTS → list of services that have directives
            // 2. GetRowsEx per service with specific where clause
            const fetchAll = async (bpm) => {
                const services = await bpm.getBpmServices();
                const methods = [], directives = [];
                for (const svc of services) {
                    const { SystemCode, ServiceKind, ServiceName } = svc;
                    const data = await bpm.getBpmMethodsByService(SystemCode, ServiceKind, ServiceName);
                    methods.push(...data.methods);
                    for (const d of data.directives) {
                        const { code, hasCustomCode } = extractBpmCode(d.Body || '');
                        directives.push({
                            BpMethodCode: d.BpMethodCode, Name: d.Name,
                            DirectiveType: d.DirectiveType, IsEnabled: d.IsEnabled,
                            Sequence: d.Sequence, _code: code, hasCode: hasCustomCode,
                        });
                    }
                }
                return { methods, directives };
            };

            this._post({ command: 'status', text: 'Fetching BPM directives from both environments…' });
            const [dA, dB] = await Promise.all([fetchAll(bA), fetchAll(bB)]);
            this._post({ command: 'status', text: 'Computing BPM diff…' });
            const bpmData = buildBpmCompare(dA.methods, dA.directives, dB.methods, dB.directives);
            this._post({ command: 'bpmReady', data: bpmData });
        } catch (err) {
            this._post({ command: 'error', tab: 'bpm', message: err.message });
        }
    }

    async _runLayersCompare({ profileA, companyA, profileB, companyB }) {
        this._post({ command: 'status', text: 'Fetching app list…' });
        try {
            const [cA, cB] = await Promise.all([this._metafxClient(profileA, companyA), this._metafxClient(profileB, companyB)]);
            const [appsA, appsB] = await Promise.all([cA.listApps(), cB.listApps()]);
            const mapA = new Map(appsA.map(a => [a.Id, a]));
            const mapB = new Map(appsB.map(a => [a.Id, a]));
            const allIds = [...new Set([...mapA.keys(), ...mapB.keys()])].sort();
            const apps = allIds.map(id => {
                const a = mapA.get(id), b = mapB.get(id);
                const inA = !!a, inB = !!b;
                const timestampsDiffer = inA && inB && a.LastUpdated !== b.LastUpdated;
                const status = !inA ? 'only-b' : !inB ? 'only-a' : 'in-both';
                return { id, inA, inB, status, timestampsDiffer, lastUpdatedA: a?.LastUpdated, lastUpdatedB: b?.LastUpdated, type: (a || b).Type, subType: (a || b).SubType };
            });
            apps.sort((x, y) => {
                const sc = a => a.status === 'only-a' ? 0 : a.status === 'only-b' ? 1 : a.timestampsDiffer ? 2 : 3;
                return sc(x) - sc(y) || x.id.localeCompare(y.id);
            });
            const counts = { 'only-a': 0, 'only-b': 0, 'timestamps-differ': 0, 'in-both': 0 };
            for (const a of apps) {
                if (a.status === 'only-a') counts['only-a']++;
                else if (a.status === 'only-b') counts['only-b']++;
                else if (a.timestampsDiffer) counts['timestamps-differ']++;
                else counts['in-both']++;
            }
            this._post({ command: 'layersReady', data: { apps, counts, total: apps.length } });
        } catch (err) {
            this._post({ command: 'error', tab: 'layers', message: err.message });
        }
    }

    // Fetch layer descriptors from both envs for an app
    async _fetchLayerList({ appId, profileA, companyA, profileB, companyB }) {
        this._post({ command: 'layerListLoading', appId });
        try {
            const [cA, cB] = await Promise.all([this._metafxClient(profileA, companyA), this._metafxClient(profileB, companyB)]);
            const [layersA, layersB] = await Promise.all([
                cA.getLayers(appId).catch(e => { console.error('[layers A]', e.message); return []; }),
                cB.getLayers(appId).catch(e => { console.error('[layers B]', e.message); return []; }),
            ]);
            this._post({ command: 'status', text: `Layers for ${appId}: ${profileA}=${layersA.length}, ${profileB}=${layersB.length}` });
            this._post({ command: 'layerListReady', appId, layersA, layersB });
        } catch (err) {
            this._post({ command: 'layerListError', appId, message: err.message });
        }
    }

    // Fetch layer content from both envs via GetApp (returns merged Layout/Events/DataViews/Rules)
    async _fetchLayerContent({ appId, layerKey, layerA, layerB, profileA, companyA, profileB, companyB }) {
        this._post({ command: 'layerContentLoading', appId, layerKey });
        try {
            const [cA, cB] = await Promise.all([this._metafxClient(profileA, companyA), this._metafxClient(profileB, companyB)]);
            const descA = layerA?.LayerDescription || layerA?.LayerName;
            const descB = layerB?.LayerDescription || layerB?.LayerName;
            console.log(`[comparePanel] _fetchLayerContent appId="${appId}" layerKey="${layerKey}" descA="${descA}" descB="${descB}"`);
            const [rawA, rawB] = await Promise.all([
                descA ? cA.getAppForLayer(appId, descA).catch(e => { console.error('[comparePanel] getAppForLayer A failed:', e.message); return null; }) : Promise.resolve(null),
                descB ? cB.getAppForLayer(appId, descB).catch(e => { console.error('[comparePanel] getAppForLayer B failed:', e.message); return null; }) : Promise.resolve(null),
            ]);
            console.log(`[comparePanel] rawA keys:`, rawA ? Object.keys(rawA) : 'null');
            console.log(`[comparePanel] rawB keys:`, rawB ? Object.keys(rawB) : 'null');
            const toStr = v => (v ? JSON.stringify(v, null, 2) : '');
            const normA = normalizeJson(toStr(rawA));
            const normB = normalizeJson(toStr(rawB));
            this._layerCache.set(`${appId}::${layerKey}::a`, normA);
            this._layerCache.set(`${appId}::${layerKey}::b`, normB);
            this._post({ command: 'layerContentReady', appId, layerKey, normA, normB, same: normA === normB });
        } catch (err) {
            console.error(`[comparePanel] _fetchLayerContent error:`, err.message);
            this._post({ command: 'layerContentError', appId, layerKey, message: err.message });
        }
    }

    // layer = specific layer descriptor from getLayers; if omitted, exports all layers for the app
    async _applyLayer({ appId, direction, profileA, companyA, profileB, companyB, layer, layerKey }) {
        const srcProfile = direction === 'aToB' ? profileA : profileB;
        const srcCompany = direction === 'aToB' ? companyA : companyB;
        const tgtProfile = direction === 'aToB' ? profileB : profileA;
        const tgtCompany = direction === 'aToB' ? companyB : companyA;
        const srcLabel   = direction === 'aToB' ? profileA : profileB;
        const tgtLabel   = direction === 'aToB' ? profileB : profileA;
        const name       = layerKey || layer?.LayerDescription || layer?.LayerName || appId;

        const confirm = await vscode.window.showWarningMessage(
            `Apply "${name}" from ${srcLabel} → ${tgtLabel}?`,
            { modal: true }, 'Apply'
        );
        if (confirm !== 'Apply') { this._post({ command: 'applyLayerCancelled', appId, layerKey }); return; }

        this._post({ command: 'applyLayerStarted', appId, layerKey });
        try {
            const [srcClient, tgtClient] = await Promise.all([
                this._metafxClient(srcProfile, srcCompany),
                this._metafxClient(tgtProfile, tgtCompany),
            ]);
            let layersToExport;
            if (layer) {
                layersToExport = [layer];
            } else {
                this._post({ command: 'applyLayerStatus', appId, layerKey, text: `Getting layers from ${srcLabel}…` });
                layersToExport = await srcClient.getLayers(appId);
                if (!layersToExport.length) throw new Error(`No layers found for "${appId}" on ${srcLabel}`);
            }
            this._post({ command: 'applyLayerStatus', appId, layerKey, text: `Exporting from ${srcLabel}…` });
            const exported = await srcClient.exportLayers(layersToExport);
            if (!exported) throw new Error(`Export returned empty for "${name}"`);

            this._post({ command: 'applyLayerStatus', appId, layerKey, text: `Importing to ${tgtLabel}…` });
            await tgtClient.importLayers(exported, true);

            this._post({ command: 'applyLayerDone', appId, layerKey });
            vscode.window.showInformationMessage(`✓ Applied "${name}" to ${tgtLabel}`);
        } catch (err) {
            this._post({ command: 'applyLayerError', appId, layerKey, message: err.message });
        }
    }

    async _openNativeDiff({ appId, fileName, labelA, labelB, contentA, contentB }) {
        const os = require('os'), path = require('path'), fs = require('fs');
        // Content may be passed directly (functions, BPMs) or retrieved from layer cache
        const normA = contentA !== undefined ? contentA : (this._layerCache.get(`${appId}::${fileName}::a`) || '');
        const normB = contentB !== undefined ? contentB : (this._layerCache.get(`${appId}::${fileName}::b`) || '');
        const safeName = (fileName || 'diff').replace(/[^a-zA-Z0-9._-]/g, '_');
        const pathA = path.join(os.tmpdir(), `efx_cmp_a_${safeName}`);
        const pathB = path.join(os.tmpdir(), `efx_cmp_b_${safeName}`);
        fs.writeFileSync(pathA, normA, 'utf8');
        fs.writeFileSync(pathB, normB, 'utf8');
        const title = `${fileName}: ${labelA || 'A'} ↔ ${labelB || 'B'}`;
        await vscode.commands.executeCommand('vscode.diff', vscode.Uri.file(pathA), vscode.Uri.file(pathB), title);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WEBVIEW HTML
    // ─────────────────────────────────────────────────────────────────────────
    getHtml() {
        return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Compare</title>
<style>
/* ── Reset & root ───────────────────────────────────────────────────── */
*{box-sizing:border-box;margin:0;padding:0}
body{
  font-family:var(--vscode-font-family);
  font-size:var(--vscode-font-size);
  color:var(--vscode-foreground);
  background:var(--vscode-editor-background);
  height:100vh;display:flex;flex-direction:column;overflow:hidden;
}

/* ── Semantic diff status colors ────────────────────────────────────── */
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

/* ── Header ─────────────────────────────────────────────────────────── */
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

/* ── Type tabs ──────────────────────────────────────────────────────── */
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

/* ── Summary filter tabs (replaces pills) ───────────────────────────── */
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

/* ── Filter bar ─────────────────────────────────────────────────────── */
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

/* ── Split grid ─────────────────────────────────────────────────────── */
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

/* ── List items ─────────────────────────────────────────────────────── */
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

/* ── Empty / loading states ─────────────────────────────────────────── */
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

/* ── Detail header ──────────────────────────────────────────────────── */
.detail-hdr{
  padding:14px 20px;border-bottom:1px solid var(--vscode-panel-border);
  background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.03));
  position:sticky;top:0;z-index:10;
}
.detail-title{font-size:14px;font-weight:700;font-family:var(--vscode-editor-font-family);margin-bottom:5px}
.detail-meta{display:flex;gap:12px;font-size:11px;color:var(--vscode-descriptionForeground);flex-wrap:wrap;margin-bottom:8px}

/* ── Collapsible lib info ───────────────────────────────────────────── */
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

/* ── Tabs (function body / lib info) ───────────────────────────────── */
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

/* ── Function sections & rows ───────────────────────────────────────── */
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

/* ── Side-by-side diff grid ─────────────────────────────────────────── */
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

/* ── Inline list diff (refs) ────────────────────────────────────────── */
.ref-group{border-bottom:1px solid var(--vscode-panel-border)}
.ref-group:last-child{border-bottom:none}
.ref-group-hdr{display:flex;align-items:center;gap:8px;padding:5px 12px;background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.03));cursor:pointer;user-select:none}
.ref-group-hdr:hover{background:var(--vscode-list-hoverBackground)}
.ref-group-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--vscode-descriptionForeground);flex:1}

/* ── Meta / sig tables ──────────────────────────────────────────────── */
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

/* ── Only-one-side info block ───────────────────────────────────────── */
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

<!-- ── TOP BAR ───────────────────────────────────────────────────────── -->
<div class="top-bar">
  <h1>Compare</h1>
  <div class="picker" id="picker">
    <div class="env-group">
      <span class="env-label a">Env A</span>
      <select id="profileA" onchange="onProfileChange('A')"><option value="">— profile —</option></select>
      <select id="companyA"><option value="">— company —</option></select>
    </div>
    <span class="vs-sep">vs</span>
    <div class="env-group">
      <span class="env-label b">Env B</span>
      <select id="profileB" onchange="onProfileChange('B')"><option value="">— profile —</option></select>
      <select id="companyB"><option value="">— company —</option></select>
    </div>
    <button class="run-btn" id="runBtn" onclick="runCompare()">▶ Run Compare</button>
  </div>
</div>
<div class="status-bar" id="statusBar"></div>

<!-- ── TYPE TABS ─────────────────────────────────────────────────────── -->
<div class="type-tabs">
  <button class="type-tab active" id="tab-functions" onclick="switchTab('functions',this)">
    Functions <span class="tab-badge" id="fnBadge">—</span>
  </button>
  <button class="type-tab" id="tab-bpm" onclick="switchTab('bpm',this)">
    BPMs <span class="tab-badge" id="bpmBadge">—</span>
  </button>
  <button class="type-tab" id="tab-layers" onclick="switchTab('layers',this)">
    Layers <span class="tab-badge" id="layersBadge">—</span>
  </button>
</div>

<!-- ── FUNCTIONS PANE ────────────────────────────────────────────────── -->
<div class="type-pane active" id="pane-functions">
  <div class="summary" id="fnSummary"></div>
  <div class="filter-bar"><input class="search" id="fnSearch" placeholder="Search libraries…" oninput="fnApply()"></div>
  <div class="split-grid">
    <div class="list-col" id="fnList"></div>
    <div class="detail-col" id="fnDetail"><div class="empty-state"><span>Run a compare to begin</span></div></div>
  </div>
</div>

<!-- ── BPM PANE ──────────────────────────────────────────────────────── -->
<div class="type-pane" id="pane-bpm">
  <div class="load-prompt" id="bpmPrompt">
    <button onclick="loadBpm()">Load BPM Compare</button>
    <span>Fetches all directive code from both environments</span>
  </div>
  <div style="display:none;flex-direction:column;flex:1;overflow:hidden" id="bpmMain">
    <div class="summary" id="bpmSummary"></div>
    <div class="filter-bar"><input class="search" id="bpmSearch" placeholder="Search services…" oninput="bpmApply()"></div>
    <div class="split-grid">
      <div class="list-col" id="bpmList"></div>
      <div class="detail-col" id="bpmDetail"><div class="empty-state"><span>Select a service</span></div></div>
    </div>
  </div>
</div>

<!-- ── LAYERS PANE ───────────────────────────────────────────────────── -->
<div class="type-pane" id="pane-layers">
  <div class="load-prompt" id="layersPrompt">
    <button onclick="loadLayers()">Load Layers Compare</button>
    <span>Fetches app list — detail loads on click</span>
  </div>
  <div style="display:none;flex-direction:column;flex:1;overflow:hidden" id="layersMain">
    <div class="summary" id="layersSummary"></div>
    <div class="filter-bar"><input class="search" id="layersSearch" placeholder="Search apps…" oninput="layersApply()"></div>
    <div class="split-grid">
      <div class="list-col" id="layersList"></div>
      <div class="detail-col" id="layersDetail"><div class="empty-state"><span>Select an app to diff</span></div></div>
    </div>
  </div>
</div>

<script>
const vscode = acquireVsCodeApi();
vscode.postMessage({ command: 'ready' });

// ── STATE ─────────────────────────────────────────────────────────────
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

// ── HELPERS ───────────────────────────────────────────────────────────
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function looksLikeBinary(s) { return !!s && s.length > 20 && /^[A-Za-z0-9+/]+=*$/.test(s); }
function setStatus(text){ document.getElementById('statusBar').textContent = text || ''; }

// ── PROFILES ──────────────────────────────────────────────────────────
function populateProfiles(profiles, activeProfile, activeCompany) {
  PROFILES = profiles;
  const sels = [['profileA','companyA'], ['profileB','companyB']];
  sels.forEach(([pid, cid]) => {
    const pSel = document.getElementById(pid);
    pSel.innerHTML = '<option value="">— profile —</option>';
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
  sel.innerHTML = '<option value="">— company —</option>';
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

// ── TAB SWITCH ────────────────────────────────────────────────────────
function switchTab(tab, btn) {
  document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.type-pane').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('pane-' + tab).classList.add('active');
  ACTIVE_TAB = tab;
}

// ── RUN COMPARE ───────────────────────────────────────────────────────
function runCompare() {
  const profileA = document.getElementById('profileA').value;
  const companyA = document.getElementById('companyA').value;
  const profileB = document.getElementById('profileB').value;
  const companyB = document.getElementById('companyB').value;
  if (!profileA || !companyA || !profileB || !companyB) {
    setStatus('⚠ Select both profiles and companies before running');
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
  setStatus('Connecting…');
  vscode.postMessage({ command: 'runCompare', profileA, companyA, profileB, companyB });
}

function loadBpm() {
  if (!LAST_RUN) { setStatus('⚠ Run a compare first'); return; }
  if (BPM_LOADED) return;
  document.getElementById('bpmPrompt').style.display = 'none';
  document.getElementById('bpmMain').style.display   = 'flex';
  document.getElementById('bpmDetail').innerHTML     = '<div class="empty-state"><span>Loading BPM data…</span></div>';
  setStatus('Fetching BPMs…');
  vscode.postMessage({ command: 'runBpmCompare', ...LAST_RUN });
}

function loadLayers() {
  if (!LAST_RUN) { setStatus('⚠ Run a compare first'); return; }
  if (LY_LOADED) return;
  document.getElementById('layersPrompt').style.display = 'none';
  document.getElementById('layersMain').style.display   = 'flex';
  document.getElementById('layersDetail').innerHTML     = '<div class="empty-state"><span>Loading app list…</span></div>';
  setStatus('Fetching app list…');
  vscode.postMessage({ command: 'runLayersCompare', ...LAST_RUN });
}

// ── MESSAGE HANDLER ───────────────────────────────────────────────────
window.addEventListener('message', ({ data: msg }) => {
  switch (msg.command) {
    case 'profiles':
      populateProfiles(msg.data, msg.activeProfile, msg.activeCompany);
      break;
    case 'compareStarted':
      FN_DATA = BPM_DATA = LY_DATA = null;
      FN_SEL = BPM_SEL = LY_SEL = null;
      document.getElementById('fnList').innerHTML = '';
      document.getElementById('fnDetail').innerHTML = '<div class="empty-state"><span>Loading…</span></div>';
      document.getElementById('fnSummary').innerHTML = '';
      document.getElementById('fnBadge').textContent = '…';
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
        document.getElementById('layersDetail').innerHTML = '<div class="empty-state"><span>Loading layers…</span></div>';
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
      setStatus(\`Applying "\${msg.layerKey || msg.appId}"…\`);
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

// ═══════════════════════════════════════════════════════════════════════
// FUNCTIONS TAB
// ═══════════════════════════════════════════════════════════════════════

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
          \${delta ? \`<span class="list-delta">\${delta}Δ</span>\` : ''}
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
  const sl = { match:'✓ Match', diff:'~ Different', 'only-a':\`✗ Only in \${ea}\`, 'only-b':\`+ Only in \${eb}\` };
  let html = \`<div class="detail-hdr">
    <div class="detail-title">\${esc(lib.libID)}</div>
    <div class="detail-meta">
      <span style="color:\${sc[lib.status]}">\${sl[lib.status]}</span>
      <span>│ \${lib.fnDiffs.length} function\${lib.fnDiffs.length!==1?'s':''}</span>
      <span style="color:\${lib.inA?'var(--c-only-a)':'var(--vscode-descriptionForeground)'}">● \${ea}</span>
      <span style="color:\${lib.inB?'var(--c-only-b)':'var(--vscode-descriptionForeground)'}">● \${eb}</span>
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
        \${hasDiff ? '⚡' : '📋'} Library Info
        \${hasDiff ? \`<span style="color:var(--c-diff);font-size:9px">has differences</span>\` : \`<span style="color:var(--vscode-descriptionForeground);font-size:9px">click to expand</span>\`}
      </span>
      <span class="chevron \${hasDiff?'open':''}" id="\${lid}_chev">▶</span>
    </div>
    <div id="\${lid}" style="display:\${hasDiff?'block':'none'};border-top:1px solid var(--vscode-panel-border)">
      <div class="tabs">
        <button class="tab active" onclick="switchLibTab(this,'\${lid}','refs')">References\${refsDiff?' ⚡':''}</button>
        <button class="tab"        onclick="switchLibTab(this,'\${lid}','settings')">Settings\${metaDiff?' ⚡':''}</button>
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
        <span style="font-size:9px;color:var(--c-match)">✓ match (\${items.length})</span>
        <span class="chevron" id="\${sid}_chev">▶</span></div>
        <div id="\${sid}" style="display:none"><table class="meta-tbl"><tbody>\${items.map(i=>\`<tr><td colspan="2" class="vs">\${esc(i)}</td></tr>\`).join('')}</tbody></table></div></div>\`;
    } else {
      html += \`<div class="ref-group"><div class="ref-group-hdr"><span class="ref-group-lbl">\${k}</span><span style="font-size:9px;color:var(--c-diff)">⚡ different</span></div>\${inlineListDiff(v.a,v.b,ea,eb)}</div>\`;
    }
  }
  html += '</div>';

  // SETTINGS
  html += \`<div class="pane" data-libtab="\${lid}" data-tab="settings"><table class="meta-tbl"><thead><tr><th>Field</th><th style="color:var(--c-only-a)">\${ea}</th><th style="color:var(--c-only-b)">\${eb}</th></tr></thead><tbody>\`;
  for (const k of metaKeys) { const v = ld[k]; if(!v) continue; html += \`<tr \${!v.same?'class="changed"':''}><td>\${k}</td><td class="\${v.same?'vs':'va'}">\${esc(v.a||'—')}</td><td class="\${v.same?'vs':'vb'}">\${esc(v.b||'—')}</td></tr>\`; }
  html += '</tbody></table></div>';

  // INFO
  html += \`<div class="pane" data-libtab="\${lid}" data-tab="info">
    <div style="padding:4px 12px;font-size:9px;color:var(--vscode-descriptionForeground);border-bottom:1px solid var(--vscode-panel-border);background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.03))">Informational only — differences here do not affect library status</div>
    <table class="meta-tbl"><thead><tr><th>Field</th><th style="color:var(--c-only-a)">\${ea}</th><th style="color:var(--c-only-b)">\${eb}</th></tr></thead><tbody>\`;
  for (const k of infoKeys) { const v = ld[k]; if(!v) continue; html += \`<tr><td>\${k}</td><td style="\${!v.same?'color:var(--c-only-a);opacity:.7':''}" class="\${v.same?'vs':''}">\${esc(v.a||'—')}</td><td style="\${!v.same?'color:var(--c-only-b);opacity:.7':''}" class="\${v.same?'vs':''}">\${esc(v.b||'—')}</td></tr>\`; }
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
      <button class="open-diff-btn" title="Open in VS Code diff editor" onclick="event.stopPropagation();openFnDiff('\${esc(libID)}','\${esc(fn.fnID)}')">↗ Diff</button>
      <span class="chevron">▶</span>
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
      synthMeta.fields[k] = fn.status==='only-a'?{a:val,b:'—',same:false}:{a:'—',b:val,same:false};
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
    <button class="tab active" onclick="switchFnTab(this,'\${fid}','code')">Code\${codeDiff?' ⚡':''}</button>
    <button class="tab"        onclick="switchFnTab(this,'\${fid}','sig')">Signature\${sigDiff?' ⚡':''}</button>
    <button class="tab"        onclick="switchFnTab(this,'\${fid}','meta')">Metadata\${metaDiff?' ⚡':''}</button>
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
        return \`<tr \${!same?'class="changed"':''}><td style="color:var(--vscode-descriptionForeground)">\${i+1}</td><td>\${esc(name)}</td><td class="\${pa?(same?'vs':'va'):'va'}">\${pa?esc(pa.type):'—'}</td><td class="\${pb?(same?'vs':'vb'):'vb'}">\${pb?esc(pb.type):'—'}</td></tr>\`;
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
      return \`<tr \${!f.same?'class="changed"':''}><td>\${k}</td><td class="\${f.same?'vs':'va'}">\${esc(f.a||'—')}</td><td class="\${f.same?'vs':'vb'}">\${esc(f.b||'—')}</td></tr>\`;
    }).join('')
  }</tbody></table>\`;
}

// ═══════════════════════════════════════════════════════════════════════
// BPM TAB
// ═══════════════════════════════════════════════════════════════════════

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
        \${s.diffCount?\`<span class="list-delta">\${s.diffCount}Δ</span>\`:''}
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
      <span>│ \${svc.methods.length} method\${svc.methods.length!==1?'s':''}</span>
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
      <button class="open-diff-btn" title="Open in VS Code diff editor" onclick="event.stopPropagation();openBpmDirDiff('\${esc(methodCode)}','\${esc(dir.name)}')">↗ Diff</button>
      <span class="chevron">▶</span>
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
    <button class="tab active" onclick="switchFnTab(this,'\${fid}','code')">Code\${codeDiff?' ⚡':''}</button>
    <button class="tab"        onclick="switchFnTab(this,'\${fid}','meta')">Settings\${metaDiff?' ⚡':''}</button>
  </div>
  <div class="pane active" data-fn="\${fid}" data-tab="code">\${sideBySide(dir.fields?.Code?.a||'',dir.fields?.Code?.b||'',ea,eb)}</div>
  <div class="pane" data-fn="\${fid}" data-tab="meta">
    <table class="meta-tbl"><thead><tr><th>Field</th><th style="color:var(--c-only-a)">\${ea}</th><th style="color:var(--c-only-b)">\${eb}</th></tr></thead><tbody>\${
      ['DirectiveType','IsEnabled','Sequence'].map(k=>{ const f=dir.fields?.[k]; if(!f) return '';
        return \`<tr \${!f.same?'class="changed"':''}><td>\${k}</td><td class="\${f.same?'vs':'va'}">\${esc(f.a||'—')}</td><td class="\${f.same?'vs':'vb'}">\${esc(f.b||'—')}</td></tr>\`;
      }).join('')
    }</tbody></table>
  </div>\`;
}

// ═══════════════════════════════════════════════════════════════════════
// LAYERS TAB
// ═══════════════════════════════════════════════════════════════════════

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
        const badge = a.status==='only-a'?LAST_RUN.profileA : a.status==='only-b'?LAST_RUN.profileB : a.timestampsDiffer?'⏱ DIFFER':'MATCH';
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
    document.getElementById('layersDetail').innerHTML = '<div class="empty-state"><span>Loading layers…</span></div>';
    vscode.postMessage({ command: 'fetchLayerList', appId, ...LAST_RUN });
  }
}

// ── safeId: turn any string into a valid HTML id fragment ────────────────
function safeId(s) { return String(s).replace(/[^a-zA-Z0-9_-]/g, '_'); }

// ── Layer list render ────────────────────────────────────────────────────
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
    <div style="font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--vscode-descriptionForeground);margin-bottom:4px">App\${app?.subType?' · '+esc(app.subType):''}</div>
    <div class="detail-title" title="\${esc(appId)}">\${esc(appId)}</div>
    <div class="detail-meta">
      <span style="color:var(--c-only-a)">● \${esc(ea)}: \${(layersA||[]).length} layer\${(layersA||[]).length!==1?'s':''}</span>
      <span style="color:var(--c-only-b)">● \${esc(eb)}: \${(layersB||[]).length} layer\${(layersB||[]).length!==1?'s':''}</span>
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
    ? \`<button class="open-diff-btn" title="Open in VS Code diff editor" onclick="event.stopPropagation();openLayerDiff('\${esc(appId)}','\${esc(key)}')">↗ Diff</button>\`
    : '';
  const applyAtoB = inA
    ? \`<button class="open-diff-btn" onclick="event.stopPropagation();applyLayerByKey('\${esc(appId)}','\${esc(key)}','aToB')">→ \${esc(eb)}</button>\`
    : '';
  const applyBtoA = inB
    ? \`<button class="open-diff-btn" onclick="event.stopPropagation();applyLayerByKey('\${esc(appId)}','\${esc(key)}','bToA')">→ \${esc(ea)}</button>\`
    : '';

  return \`<div class="fn-row" id="\${rid}">
    <div class="fn-row-hdr" onclick="toggleFn('\${rid}');loadLayerContent('\${esc(appId)}','\${esc(key)}')">
      <span class="fn-badge" style="background:\${sc[status]}22;color:\${sc[status]}">\${sb[status]}</span>
      <span class="fn-name">\${esc(key)}\${typeLabel}</span>
      \${compLabel}
      \${diffBtn}\${applyAtoB}\${applyBtoA}
      <span class="chevron">▶</span>
    </div>
    <div class="fn-body" id="\${rbid}">\${renderLayerRowBody(\`\${appId}::\${key}\`, inA, inB, ea, eb)}</div>
  </div>\`;
}

function renderLayerRowBody(contentKey, inA, inB, ea, eb) {
  const c = LAYER_CONTENT_CACHE[contentKey];
  if (!c)           return \`<div class="only-info">Click row to load diff…</div>\`;
  if (c.loading)    return \`<div class="only-info">Loading…</div>\`;
  if (c.error)      return \`<div class="only-info" style="color:var(--c-only-a)">Error: \${esc(c.error)}</div>\`;
  if (c.same)       return \`<div class="only-info" style="color:var(--c-match)">✓ Identical</div>\`;
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
  setStatus('Loading layer content for diff…');
  loadLayerContent(appId, layerKey);
}

function applyLayerByKey(appId, layerKey, direction) {
  const side  = direction === 'aToB' ? 'a' : 'b';
  const layer = LAYER_OBJECTS[\`\${appId}::\${layerKey}::\${side}\`] || null;
  vscode.postMessage({ command: 'applyLayer', appId, layer, layerKey, direction, ...LAST_RUN });
}

// ── Unified native diff helpers ──────────────────────────────────────────
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
  // kept for reference only — replaced by openLayerDiff above
  if (!appId) return;
  sendDiff(f.normA||'', f.normB||'', fileName, LAST_RUN?.profileA, LAST_RUN?.profileB);
}

// ═══════════════════════════════════════════════════════════════════════
// SHARED DIFF RENDERING
// ═══════════════════════════════════════════════════════════════════════

function sideBySide(textA, textB, labelA, labelB) {
  const linesA = textA.split('\\n'), linesB = textB.split('\\n');
  const diff = lcs(linesA, linesB);
  let cells = '', nA = 1, nB = 1;
  for (const d of diff) {
    if (d.t === 'skip') {
      cells += \`<div class="diff-cell skip"><span class="ln">\${nA}–\${nA+d.countA-1}</span>\${esc(d.v)}</div><div class="diff-cell skip"><span class="ln">\${nB}–\${nB+d.countB-1}</span>\${esc(d.v)}</div>\`;
      nA += d.countA; nB += d.countB;
    } else if (d.t === '=') {
      cells += \`<div class="diff-cell ctx"><span class="ln">\${nA++}</span>\${esc(d.v)}</div><div class="diff-cell ctx"><span class="ln">\${nB++}</span>\${esc(d.v)}</div>\`;
    } else if (d.t === '-') {
      cells += \`<div class="diff-cell del"><span class="ln">\${nA++}</span>\${esc(d.v)}</div><div class="diff-cell empty"></div>\`;
    } else {
      cells += \`<div class="diff-cell empty"></div><div class="diff-cell add"><span class="ln">\${nB++}</span>\${esc(d.v)}</div>\`;
    }
  }
  return \`<div class="diff-wrap"><div class="diff-col-hdrs"><div class="diff-col-hdr a">● \${labelA}</div><div class="diff-col-hdr b">● \${labelB}</div></div><div class="diff-scroll"><div class="diff-grid">\${cells}</div></div></div>\`;
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
    if(!last&&mid>0) result.push({t:'skip',v:\`… \${mid} unchanged lines …\`,countA:mid,countB:mid});
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
  return \`<div class="diff-wrap"><div class="diff-col-hdrs"><div class="diff-col-hdr a">● \${labelA}</div><div class="diff-col-hdr b">● \${labelB}</div></div><div class="diff-scroll"><div class="diff-grid">\${cells}</div></div></div>\`;
}

// ═══════════════════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════════════════

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
</html>`;
    }
}

ComparePanel.KEY = 'efxCompare';
ComparePanel.panels = new Map();
exports.ComparePanel = ComparePanel;
