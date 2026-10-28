"use strict";
const vscode = require("vscode");
const { EpicorClient } = require("./epicorClient");
const { BpmClient } = require("./bpmClient");
const CompareBpm = require("./compareBpm");
const CompareLayers = require("./compareLayers");
// Webview-side script for the BPM + Layers tabs. Kept as .txt so esbuild
// bundles it as a plain string (default text loader) — it is browser JS,
// injected after the panel's main <script>.
const COMPARE_WEBVIEW_JS = require("./compareWebview.txt");
const { directiveToCanonicalText } = require("./widgetXaml");
const { describeBody } = require("./efxBody");
const { KineticMetaFXClient } = require("./kineticLayerClient");

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCTIONS COMPARE HELPERS  (ported from compare.py)
// ═══════════════════════════════════════════════════════════════════════════════

function parseFunctionBody(bodyStr) {
    const desc = describeBody(bodyStr);
    if (desc.kind !== 'flow') return { code: desc.code, usings: desc.usings, isFlow: false };
    // Render a widget-based function the way BPM directives are rendered, so a
    // dragged widget or a renamed node doesn't read as a code change.
    return {
        code: directiveToCanonicalText(desc.xaml) || desc.xaml,
        usings: desc.usings,
        isFlow: true,
    };
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
        const { code, usings, isFlow } = parseFunctionBody(fn.Body);
        if (!fnMap[fn.LibraryID]) fnMap[fn.LibraryID] = {};
        fnMap[fn.LibraryID][fn.FunctionID] = {
            ...fn, _code: code, _usings: usings, _isFlow: isFlow,
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
                    case 'openBpmRaw':        await this._openBpmRaw(msg); break;
                    case 'applyFunction':     await this._applyFunction(msg); break;
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
        // Fail loudly rather than building a client with an empty password and
        // surfacing a raw auth error later (matches pickKineticEnv elsewhere).
        if (!password) {
            throw new Error(`No password stored for profile "${profileName}" — open Manage Profiles and re-enter it.`);
        }
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
        // Tell the webview to clear stale results now, so a re-run doesn't keep
        // showing the previous comparison while this one is still fetching.
        this._post({ command: 'compareStarted' });
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
            // request() hands back the raw string when a 2xx body isn't JSON.
            // Feeding that to buildFnMap yields empty maps, which would render
            // as "every library is only in the other environment" — a silently
            // wrong diff. Treat a non-object response as the failure it is.
            for (const [raw, label] of [[rawA, profileA], [rawB, profileB]]) {
                if (!raw || typeof raw !== 'object') {
                    throw new Error(`Unexpected GetLibraries response from ${label} — expected JSON, got ${typeof raw}.`);
                }
            }
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
            const warnings = [];

            // Method directives: same proven path as the BPM tree provider
            // (GetBpmDirectiveServicesTS -> GetRowsEx per service, 6 at a time).
            // Data directives (source 'DB') come from one GetRowsEx call.
            const fetchAll = async (bpm, label) => {
                const services = await bpm.getBpmServices();
                const CONCURRENCY = 6;
                const results = new Array(services.length);
                let next = 0;
                const worker = async () => {
                    while (next < services.length) {
                        const i = next++;
                        const { SystemCode, ServiceKind, ServiceName } = services[i];
                        results[i] = await bpm.getBpmMethodsByService(SystemCode, ServiceKind, ServiceName);
                    }
                };
                await Promise.all(Array.from({ length: Math.min(CONCURRENCY, services.length) }, worker));
                const methods = [], directives = [];
                for (const data of results) {
                    for (const m of data.methods) methods.push({ ...m, Source: m.Source || 'BO' });
                    for (const d of data.directives) directives.push({ ...d, Source: d.Source || 'BO' });
                }
                try {
                    const db = await bpm.getBpmRowsBySource('DB');
                    for (const m of db.methods) methods.push({ ...m, Source: 'DB' });
                    for (const d of db.directives) directives.push({ ...d, Source: 'DB' });
                } catch (e) {
                    warnings.push(`${label}: data directives not loaded — ${e.message}`);
                }
                // A directive can only appear once per environment.
                const seen = new Set();
                return { methods, directives: directives.filter(d => {
                    const k = d.DirectiveID || CompareBpm.directiveKey(d);
                    if (seen.has(k)) return false; seen.add(k); return true;
                }) };
            };

            this._post({ command: 'status', text: 'Fetching BPM directives from both environments…' });
            const [dA, dB] = await Promise.all([fetchAll(bA, profileA), fetchAll(bB, profileB)]);

            // Same directive stored as XAML on one side and Kinetic JSON on the
            // other: let the server convert both to its JSON model.
            const mixed = CompareBpm.mixedFormatPairs(dA.directives, dB.directives);
            if (mixed.length) {
                this._post({ command: 'status', text: `Normalizing ${mixed.length} directive(s) stored in different formats…` });
                let next = 0, failed = 0;
                const worker = async () => {
                    while (next < mixed.length) {
                        const { a, b } = mixed[next++];
                        try {
                            const [ja, jb] = await Promise.all([bA.getKineticDirective(a.DirectiveID), bB.getKineticDirective(b.DirectiveID)]);
                            const ca = ja && CompareBpm.jsonToCanonical(ja), cb = jb && CompareBpm.jsonToCanonical(jb);
                            if (!ca || !cb) { failed++; continue; }
                            a._origFormat = CompareBpm.bodyFormat(a.Body); b._origFormat = CompareBpm.bodyFormat(b.Body);
                            a._canon = { format: 'json', ...ca }; b._canon = { format: 'json', ...cb };
                            a._normalized = b._normalized = true;
                        } catch { failed++; }
                    }
                };
                await Promise.all(Array.from({ length: Math.min(6, mixed.length) }, worker));
                if (failed) warnings.push(`${failed} directive pair(s) stored as XAML vs JSON could not be normalized — they compare as raw text and will show as different.`);
            }

            this._post({ command: 'status', text: 'Computing BPM diff…' });
            const bpmData = CompareBpm.buildBpmCompare(dA.methods, dA.directives, dB.methods, dB.directives);
            // Stored bodies stay host-side for the "XML" diff; the webview only
            // gets canonical text.
            this._bpmRawA = new Map(dA.directives.map(d => [CompareBpm.directiveKey(d), d.Body || '']));
            this._bpmRawB = new Map(dB.directives.map(d => [CompareBpm.directiveKey(d), d.Body || '']));
            bpmData.warnings = warnings;
            this._post({ command: 'bpmReady', data: bpmData });
        } catch (err) {
            this._post({ command: 'error', tab: 'bpm', message: err.message });
        }
    }

    async _runLayersCompare({ profileA, companyA, profileB, companyB }) {
        this._post({ command: 'status', text: 'Fetching app list…' });
        try {
            const [cA, cB] = await Promise.all([this._metafxClient(profileA, companyA), this._metafxClient(profileB, companyB)]);
            // GetApplications(IncludeAllLayers) already embeds each app's Layers[],
            // so the whole app + layer map is one call per environment.
            const [appsA, appsB] = await Promise.all([cA.listApps(), cB.listApps()]);
            const data = CompareLayers.buildLayerApps(appsA, appsB, companyA === companyB);
            this._post({ command: 'layersReady', data });
        } catch (err) {
            this._post({ command: 'error', tab: 'layers', message: err.message });
        }
    }

    // Fetch layer descriptors from both envs for an app
    async _fetchLayerList({ appId, profileA, companyA, profileB, companyB }) {
        this._post({ command: 'layerListLoading', appId });
        try {
            const [cA, cB] = await Promise.all([this._metafxClient(profileA, companyA), this._metafxClient(profileB, companyB)]);
            // Capture per-env failures instead of silently rendering "0 layers"
            const [resA, resB] = await Promise.all([
                cA.getLayers(appId).then(layers => ({ layers })).catch(e => { console.error('[layers A]', e.message); return { layers: [], error: e.message }; }),
                cB.getLayers(appId).then(layers => ({ layers })).catch(e => { console.error('[layers B]', e.message); return { layers: [], error: e.message }; }),
            ]);
            this._post({ command: 'status', text: `Layers for ${appId}: ${profileA}=${resA.error ? 'ERROR' : resA.layers.length}, ${profileB}=${resB.error ? 'ERROR' : resB.layers.length}` });
            this._post({ command: 'layerListReady', appId, layersA: resA.layers, layersB: resB.layers, errorA: resA.error || null, errorB: resB.error || null });
        } catch (err) {
            this._post({ command: 'layerListError', appId, message: err.message });
        }
    }

    // Fetch merged GetApp content for one layer from both envs, then diff it
    // per section/item (CompareLayers) and build the wireframe trees.
    async _fetchLayerContent({ appId, layerKey, layerA, layerB, profileA, companyA, profileB, companyB }) {
        this._post({ command: 'layerContentLoading', appId, layerKey });
        try {
            const [cA, cB] = await Promise.all([this._metafxClient(profileA, companyA), this._metafxClient(profileB, companyB)]);
            // Track fetch failures separately from "this side has no layer" —
            // conflating them made two failed fetches render as "Identical".
            const fetchSide = (client, layer, tag) => {
                const name = layer && (layer.LayerName || layer.LayerDescription);
                if (!name) return Promise.resolve({ raw: null });
                return client.getAppForLayer(appId, name, layer.DeviceType)
                    .then(raw => ({ raw }))
                    .catch(e => { console.error(`[comparePanel] getAppForLayer ${tag} failed:`, e.message); return { raw: null, error: e.message }; });
            };
            const [resA, resB] = await Promise.all([fetchSide(cA, layerA, 'A'), fetchSide(cB, layerB, 'B')]);
            if (resA.error && resB.error) {
                throw new Error(`Could not load layer content from either environment — ${resA.error} / ${resB.error}`);
            }
            if (resA.error || resB.error) {
                this._post({ command: 'layerContentError', appId, layerKey,
                    message: `${resA.error ? profileA : profileB} failed: ${resA.error || resB.error}` });
                return;
            }
            const toStr = v => (v ? JSON.stringify(v, null, 2) : '');
            const normA = normalizeJson(toStr(resA.raw));
            const normB = normalizeJson(toStr(resB.raw));
            // One-sided layer: every item would be "only in X" — send counts only.
            let sections = CompareLayers.diffAppSections(resA.raw, resB.raw);
            if (!resA.raw || !resB.raw) sections = sections.map(s => ({ ...s, items: [] }));
            this._post({ command: 'layerSectionsReady', appId, layerKey,
                sections,
                wireA: CompareLayers.buildWireframe(resA.raw), wireB: CompareLayers.buildWireframe(resB.raw) });
            this._post({ command: 'layerContentReady', appId, layerKey, normA, normB, same: normA === normB });
        } catch (err) {
            console.error(`[comparePanel] _fetchLayerContent error:`, err.message);
            this._post({ command: 'layerContentError', appId, layerKey, message: err.message });
        }
    }

    // Copy one function's Code+Usings from one environment to the other, reusing
    // the same wrapper call efx.pushFunction uses — including its read-back
    // verification. Only handles functions that already exist on both sides:
    // the wrapper updates rows, it does not create them.
    async _applyFunction({ libraryId, functionId, direction, profileA, companyA, profileB, companyB }) {
        const srcProfile = direction === 'aToB' ? profileA : profileB;
        const srcCompany = direction === 'aToB' ? companyA : companyB;
        const tgtProfile = direction === 'aToB' ? profileB : profileA;
        const tgtCompany = direction === 'aToB' ? companyB : companyA;
        const key = `${libraryId}.${functionId}`;

        const confirm = await vscode.window.showWarningMessage(
            `Apply ${key} from ${srcProfile} -> ${tgtProfile}?`,
            { modal: true }, 'Apply'
        );
        if (confirm !== 'Apply') { this._post({ command: 'applyFnCancelled', libraryId, functionId }); return; }

        this._post({ command: 'applyFnStarted', libraryId, functionId });
        let demoted = false;
        let tgtClient = null;
        try {
            const [sc, tc] = await Promise.all([
                this._efxClient(srcProfile, srcCompany),
                this._efxClient(tgtProfile, tgtCompany),
            ]);
            tgtClient = tc;

            // Re-read the source from the server rather than trusting the copy
            // the webview is holding — the compare may be minutes old.
            this._post({ command: 'applyFnStatus', libraryId, functionId, text: `Reading ${key} from ${srcProfile}…` });
            const srcTableset = await sc.getLibrary(libraryId);
            const srcFunc = srcTableset?.EfxFunction?.find(f => f.FunctionID === functionId);
            if (!srcFunc) throw new Error(`${key} not found on ${srcProfile}`);
            if (describeBody(srcFunc.Body).kind === 'flow') {
                // Apply writes through the Code/Usings wrapper, which cannot carry
                // a widget flow — sending it would overwrite the target's widgets.
                throw new Error(`${key} is a widget-based function — apply only supports code-based functions.`);
            }
            const { code, usings } = EpicorClient.extractCode(srcFunc.Body);

            this._post({ command: 'applyFnStatus', libraryId, functionId, text: `Checking ${tgtProfile}…` });
            const tgtTableset = await tgtClient.getLibrary(libraryId);
            const tgtLibRow = tgtTableset?.EfxLibrary?.[0];
            if (!tgtLibRow) throw new Error(`Library ${libraryId} does not exist on ${tgtProfile} — create it there first.`);
            if (!tgtTableset.EfxFunction?.some(f => f.FunctionID === functionId)) {
                throw new Error(`${key} does not exist on ${tgtProfile} — this applies changes to existing functions, it cannot create new ones.`);
            }

            // Frozen blocks the write. Promoted libraries are frozen and can be
            // demoted; a library frozen for any other reason cannot be helped here.
            if (tgtLibRow.Frozen === true) {
                if (!tgtLibRow.Published) {
                    throw new Error(`${libraryId} is locked/frozen on ${tgtProfile}. Unfreeze it in Epicor first.`);
                }
                const ok = await vscode.window.showWarningMessage(
                    `${libraryId} is promoted to production on ${tgtProfile}. Demote it, apply ${functionId}, then re-promote?`,
                    { modal: true }, 'Demote, Apply, Re-promote'
                );
                if (ok !== 'Demote, Apply, Re-promote') { this._post({ command: 'applyFnCancelled', libraryId, functionId }); return; }
                this._post({ command: 'applyFnStatus', libraryId, functionId, text: `Demoting ${libraryId} on ${tgtProfile}…` });
                await tgtClient.demoteFromProduction(libraryId);
                demoted = true;
            }

            this._post({ command: 'applyFnStatus', libraryId, functionId, text: `Applying to ${tgtProfile}…` });
            const result = await tgtClient.validateFunctionViaWrapper(
                libraryId, functionId, code, usings, 'Utilities', 'ApplyChangesWithDiagnostics');
            if (!result.saved) {
                const diags = (result.diagnostics || result.errors || [])
                    .map(d => (typeof d === 'object' && d !== null) ? [d.Code, d.Message].filter(Boolean).join(': ') : String(d));
                throw new Error(diags[0] || result.outMsg || result.outResult || 'Apply rejected by Epicor');
            }

            // Read back and compare, same as pushFunction does.
            this._post({ command: 'applyFnStatus', libraryId, functionId, text: `Verifying on ${tgtProfile}…` });
            const verifyTableset = await tgtClient.getLibrary(libraryId);
            const verifyFunc = verifyTableset?.EfxFunction?.find(f => f.FunctionID === functionId);
            if (!verifyFunc) throw new Error(`Verification failed: ${key} not found on ${tgtProfile} after apply.`);
            const verifyCode = EpicorClient.extractCode(verifyFunc.Body).code;
            const norm = s => String(s || '').replace(/\r\n/g, '\n').trimEnd();
            if (norm(verifyCode) !== norm(code)) {
                throw new Error(`Apply reported success, but ${tgtProfile} code does not match ${srcProfile}.`);
            }

            // Signatures ride a different endpoint, so a code apply can leave
            // them out of sync — say so rather than implying a full match.
            const sigOf = ts => JSON.stringify((ts?.EfxFunctionSignature || [])
                .filter(s => s.FunctionID === functionId)
                .map(s => [s.ArgumentName, s.DataType, !!s.Response, !!s.Optional])
                .sort());
            const sigsDiffer = sigOf(srcTableset) !== sigOf(verifyTableset);

            this._post({ command: 'applyFnDone', libraryId, functionId });
            if (sigsDiffer) {
                vscode.window.showWarningMessage(
                    `Applied ${key} to ${tgtProfile} — but signatures still differ. Code only; edit parameters via Execute -> Edit Signatures.`);
            } else {
                vscode.window.showInformationMessage(`Verified ${key} on ${tgtProfile} — code matches ${srcProfile}`);
            }
        } catch (err) {
            this._post({ command: 'applyFnError', libraryId, functionId, message: err.message });
        } finally {
            // Always restore promotion, including when the apply above threw —
            // otherwise a failed run leaves a production library demoted.
            if (demoted && tgtClient) {
                try {
                    this._post({ command: 'applyFnStatus', libraryId, functionId, text: `Re-promoting ${libraryId}…` });
                    await tgtClient.promoteToProduction(libraryId);
                    this._post({ command: 'applyFnStatus', libraryId, functionId, text: '' });
                } catch (e) {
                    vscode.window.showErrorMessage(
                        `${libraryId} on ${tgtProfile} could NOT be re-promoted and is still demoted — promote it manually. (${e.message})`);
                }
            }
        }
    }

    // Native diff of the stored BpDirective.Body (XAML or Kinetic JSON) for one
    // directive pair. keyA/keyB differ for a renamed directive.
    async _openBpmRaw({ keyA, keyB, name, labelA, labelB }) {
        const bodyA = (keyA && this._bpmRawA && this._bpmRawA.get(keyA)) || '';
        const bodyB = (keyB && this._bpmRawB && this._bpmRawB.get(keyB)) || '';
        const fa = CompareBpm.bodyFormat(bodyA), fb = CompareBpm.bodyFormat(bodyB);
        const pick = f => (f === 'json' ? 'json' : f === 'xaml' ? 'xml' : null);
        const ext = (pick(fa) && (pick(fa) === pick(fb) || fb === 'empty')) ? pick(fa) : (fa === 'empty' && pick(fb)) ? pick(fb) : 'txt';
        await this._openNativeDiff({
            diffId: 'raw::' + (keyA || keyB), fileName: String(name || 'directive').replace(/[^a-zA-Z0-9._-]/g, '_') + '.' + ext,
            labelA, labelB, contentA: CompareBpm.prettyBody(bodyA), contentB: CompareBpm.prettyBody(bodyB),
        });
    }

    async _openNativeDiff({ diffId, fileName, labelA, labelB, contentA, contentB }) {
        const os = require('os'), path = require('path'), fs = require('fs'), crypto = require('crypto');
        const normA = contentA || '';
        const normB = contentB || '';
        const safeName = (fileName || 'diff').replace(/[^a-zA-Z0-9._-]/g, '_');
        // Scope every diff to its own directory pair. Keying temp paths on the
        // bare filename let same-named items under different parents (two
        // libraries each with a GetData function, two apps each with a Base
        // layer) share a path — reopening one silently rewrote the other's
        // still-open diff tab. Keeping the real filename preserves syntax
        // highlighting; the side folder is named for the environment.
        const scope = crypto.createHash('sha1')
            .update(`${diffId || ''}::${fileName || ''}`).digest('hex').slice(0, 12);
        const sideDir = (label, fallback) => {
            const safeLabel = String(label || '').replace(/[^a-zA-Z0-9._-]/g, '_') || fallback;
            const dir = path.join(os.tmpdir(), 'efx-compare', scope, safeLabel);
            fs.mkdirSync(dir, { recursive: true });
            return dir;
        };
        const pathA = path.join(sideDir(labelA, 'A'), safeName);
        const pathB = path.join(sideDir(labelB, 'B'), safeName);
        fs.writeFileSync(pathA, normA, 'utf8');
        fs.writeFileSync(pathB, normB, 'utf8');
        const title = `${fileName}: ${labelA || 'A'} vs ${labelB || 'B'}`;
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
.chevron::before{content:'';display:inline-block;border-left:5px solid currentColor;border-top:4px solid transparent;border-bottom:4px solid transparent}
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

/* ── Compare v1 additions ───────────────────────────────────────────── */
.filter-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.fb-chk{font-size:11px;display:inline-flex;gap:4px;align-items:center;color:var(--vscode-descriptionForeground);cursor:pointer;user-select:none}
.tag{font-size:9px;padding:1px 5px;border-radius:2px;margin-left:5px;font-weight:600;
  background:var(--vscode-badge-background);color:var(--vscode-badge-foreground);font-family:var(--vscode-font-family);vertical-align:1px}
.tag.warn{background:var(--c-diff-bg);color:var(--c-diff)}
.pre-block{font-family:var(--vscode-editor-font-family);font-size:calc(var(--vscode-editor-font-size,13px) - 1px);
  padding:10px 14px;max-height:420px;overflow:auto;white-space:pre-wrap;word-break:break-all}
.pre-block.dim{color:var(--vscode-descriptionForeground)}
.wf-bar{display:flex;align-items:center;gap:10px;padding:8px 12px;font-size:11px;border-bottom:1px solid var(--vscode-panel-border)}
.wf-legend{display:inline-flex;gap:6px;align-items:center;color:var(--vscode-descriptionForeground)}
.wf-legend i.wf-struct{border:1px dashed var(--c-diff)!important;background:none}
.wf-legend i{display:inline-block;width:10px;height:10px;border-radius:2px;border:1px solid var(--vscode-panel-border)}
.wf-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px}
.wf-page{padding:6px;max-height:640px;overflow:auto;border:1px solid var(--vscode-panel-border);border-top:none}
.wf-node{border:1px solid var(--vscode-panel-border);border-radius:3px;margin:2px;font-size:10px}
.wf-box{display:flex;flex-wrap:wrap;align-content:flex-start;padding:3px;gap:2px}
.wf-box>.wf-lbl{width:100%;font-weight:700;font-size:9px;color:var(--vscode-descriptionForeground);padding:1px 3px}
.wf-leaf{padding:3px 6px;min-width:110px;flex:1 1 130px;border-style:dashed}
.wf-type{opacity:.5;font-size:9px;font-family:var(--vscode-editor-font-family)}
.wf-bind{display:block;opacity:.6;font-size:9px;font-family:var(--vscode-editor-font-family);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wf-changed{background:var(--c-diff-bg)!important;border-color:var(--c-diff)!important}
.wf-only-a{background:var(--c-only-a-bg)!important;border-color:var(--c-only-a)!important}
.wf-only-b{background:var(--c-only-b-bg)!important;border-color:var(--c-only-b)!important}
.bf-wrap{overflow:auto;max-height:560px;border:1px solid var(--vscode-panel-border);border-top:none;padding:4px}
.bf-svg{display:block}
.bf-node rect{fill:var(--vscode-editor-background);stroke:var(--vscode-descriptionForeground);stroke-width:1}
.bf-condition rect{stroke-dasharray:4 2}
.bf-changed rect{stroke:#e0ac00;stroke-width:2}
.bf-del rect{stroke:#e0ac00;stroke-width:2;stroke-dasharray:5 3}
.bf-only-a rect{fill:var(--c-only-a-bg);stroke:var(--c-only-a);stroke-width:2}
.bf-only-b rect{fill:var(--c-only-b-bg);stroke:var(--c-only-b);stroke-width:2}
.bf-t1{font-size:11px;font-weight:700;fill:var(--vscode-foreground);font-family:var(--vscode-font-family)}
.bf-t2{font-size:10px;fill:var(--vscode-descriptionForeground);font-family:var(--vscode-font-family)}
.bf-edge{fill:none;stroke:var(--vscode-descriptionForeground);stroke-width:1.2}
.bf-arrow{fill:var(--vscode-descriptionForeground)}
.bf-elbl{font-size:9px;fill:var(--vscode-descriptionForeground);font-family:var(--vscode-font-family)}
.bf-node{cursor:help}
/* ── Kinetic-style preview ──────────────────────────────────────────────────
   Values follow Kinetic's own component rules (main.js component styles) and
   palette variables; --interactive is the CPI override sampled from a live page. */
.kin-single{padding:8px}
.kin-col-wrap{min-width:0}
.kin-canvas{--base:#f0f3f5;--interactive:#316b9c;--interactive-44:#3f86c0;--interactive-24:#244f73;--neutral:#fff;--neutral-20:#333;
  --neutral-38:#616161;--neutral-80:#ccc;--neutral-95:#f2f2f2;--nothing:#000;--primary-2485:#d2dee1;--primary-3468:#9bbdc8;
  --primary-2491:#e4ebed;--primary-3495:#eff5f6;--success-4566:#6db7ab;--warning:#ffe199;--error-91:#ffd6d1;
  background:var(--base);color:var(--nothing);font-family:"Source Sans Pro","Source Sans 3","Segoe UI",-apple-system,Helvetica,Arial,sans-serif;
  font-size:12px;padding:14px 16px;max-height:760px;overflow:auto;border:1px solid var(--vscode-panel-border);border-top:none}
.kin-canvas *{box-sizing:border-box}
/* ep-panel-card */
.kin-card{background:var(--primary-2485);border:1px solid var(--primary-3468);border-radius:3px;margin:0 0 10px}
.kin-card-hdr{display:flex;align-items:center;justify-content:space-between;position:relative;padding:4px 15px 4px 50px;min-height:50px;border-bottom:1px solid var(--primary-3468)}
.kin-card.kin-collapsed-card .kin-card-hdr{border-bottom:none}
.kin-chev{position:absolute;left:20px;top:50%;transform:translateY(-50%);color:var(--interactive);display:flex;width:18px}
.kin-chev.kin-collapsed{transform:translateY(-50%) rotate(180deg)}
.kin-card-title{font-size:18px;font-weight:600;line-height:24px;white-space:nowrap;color:var(--nothing)}
.kin-card-hdr-items{display:flex;gap:10px;align-items:center;flex-wrap:wrap;flex:1;justify-content:flex-end;margin-left:16px}
.kin-card-body{padding:20px 20px 0}
.kin-card-grid{padding:0}
.kin-fullscreen{display:flex;justify-content:center}
.kin-fullscreen span{background:var(--primary-3468);color:var(--neutral-20);font-size:14px;padding:2px 18px;display:inline-flex;gap:8px;align-items:center}
.kin-ic{width:16px;height:16px;display:block}
/* metafx-div / metafx-col: rows never wrap, 15px gutters, 30px under a row */
.kin-div{min-width:0}
.kin-row{display:flex;flex-wrap:nowrap;justify-content:flex-start;align-items:stretch;margin:0 -15px 30px}
.kin-col .kin-row:last-child, .kin-card-body>.kin-div:last-child>.kin-row{margin-bottom:10px}
.kin-col{flex:0 1 auto;min-width:0;padding:0 15px}
.kin-group-lbl{display:block;font-size:14px;color:var(--neutral-20);padding-top:5px;margin-bottom:10px;font-weight:400}
.kin-flex{display:flex;flex-wrap:wrap;gap:0 20px;align-items:flex-start}
.kin-flex>*{flex:1 1 180px;min-width:150px}
/* ep-text-box family (kendo floating label) */
.kin-field{margin:0 0 10px}
.kin-multi{display:flex;gap:10px}
.kin-multi>.kin-input{flex:1}
.kin-multi>.kin-narrow{flex:0 0 90px}
.kin-input{position:relative;background:var(--neutral);height:40px;padding:3px 40px 0 10px;box-shadow:0 1px 0 0 var(--interactive)}
.kin-input.kin-ro{background:var(--neutral-95);box-shadow:0 1px 0 0 var(--neutral-80)}
.kin-input.kin-area{height:auto;min-height:132px;background:var(--neutral-95);box-shadow:none;border:1px solid #dfdfdf}
.kin-flabel{font-size:12px;color:var(--neutral-38);line-height:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kin-req{margin-left:3px}
.kin-val{font-size:14px;line-height:19px;min-height:19px;display:flex;justify-content:space-between;gap:6px;overflow:hidden}
.kin-bind{color:#8a96a3;font-size:12px;font-style:italic;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kin-num{margin-left:auto}
.kin-icon{position:absolute;right:10px;top:50%;transform:translateY(-50%);color:var(--interactive);display:flex;align-items:center;gap:4px}
.kin-ro .kin-icon{color:var(--neutral-38)}
.kin-navtxt{font-size:12px;white-space:nowrap;color:var(--neutral-38)}
.kin-rownav .kin-input{padding-right:100px}
/* ep-check-box */
.kin-check{position:relative;display:flex;align-items:center;min-height:24px;margin:5px 16px 5px 0}
.kin-cb{width:18px;height:18px;border:2px solid var(--interactive);border-radius:2px;background:var(--neutral);flex-shrink:0}
.kin-cb.kin-ro{border-color:var(--neutral-38)}
.kin-cb-lbl{font-size:14px;margin-left:7px;color:var(--neutral-20)}
.kin-cb.kin-ro + .kin-cb-lbl{color:var(--neutral-38)}
.kin-radios{display:flex;gap:16px;flex-wrap:wrap}
.kin-radio{display:inline-flex;align-items:center;gap:7px;font-size:14px;color:var(--neutral-20)}
.kin-rb{width:18px;height:18px;border:2px solid var(--interactive);border-radius:50%;display:inline-block;background:var(--neutral)}
.kin-rb-on{box-shadow:inset 0 0 0 3px var(--neutral);background:var(--interactive)}
/* ep-button (primary) */
.kin-btn{display:inline-flex;align-items:center;justify-content:center;background:var(--interactive);color:var(--neutral);font-size:14px;padding:6px 18px;white-space:nowrap;margin:5px 10px 5px 5px}
.kin-card-hdr .kin-btn{margin:0}
/* erp-shape / erp-tag */
.kin-shape{display:inline-flex;align-items:center;gap:8px;border:2px solid var(--interactive);border-radius:5px;background:var(--success-4566);min-height:20px;padding:2px 10px 2px 6px;margin:5px 0}
.kin-shape-lbl{font-size:14px;font-weight:600;color:var(--nothing);white-space:nowrap}
.kin-shape::before{content:'';width:16px;height:16px;background:var(--neutral);border:2px solid var(--interactive);border-radius:2px;flex-shrink:0}
.kin-shape-warn{background:var(--warning)}
.kin-shape-err{background:var(--error-91)}
.kin-card-hdr .kin-shape{margin:0}
.kin-label{font-size:14px;padding:4px 0 8px;color:var(--neutral-20)}
/* ep-grid */
.kin-grid-tools{display:flex;align-items:center;gap:14px;padding:6px 20px;color:var(--interactive)}
.kin-gsearch{display:flex;align-items:center;gap:6px;background:var(--neutral);box-shadow:0 1px 0 0 var(--interactive);padding:4px 8px;min-width:170px;font-size:13px;color:var(--neutral-38)}
.kin-grid-scroll{overflow:auto}
.kin-grid{border-collapse:collapse;width:100%;font-size:14px}
.kin-grid th{background:var(--primary-2491);font-weight:600;text-align:left;padding:10px 8px;border-top:1px solid var(--primary-3468);border-bottom:1px solid var(--neutral-80);border-right:1px solid var(--neutral-80);white-space:nowrap}
.kin-grid td{height:24px;background:var(--neutral);border-bottom:1px solid var(--neutral-80);border-right:1px solid var(--neutral-80)}
.kin-grid tr:nth-child(even) td{background:var(--primary-3495)}
.kin-grid .kin-gsel{width:20px;padding:0}
.kin-grid-foot{font-size:11px;color:#8a96a3;font-style:italic;padding:4px 20px}
/* metafx-tabstrip (page tabs as rendered on the live page) */
.kin-tabstrip{margin:0 0 10px}
.kin-tabs{display:flex;gap:8px;margin:0 0 14px;align-items:center}
.kin-tab{padding:8px 16px;font-size:14px;color:var(--interactive);cursor:pointer;border:1px solid transparent;border-radius:3px}
.kin-tab:hover{color:var(--interactive-44)}
.kin-tab-on{color:var(--nothing);background:var(--neutral);border-color:#858585}
.kin-stack>.kin-card{margin-bottom:10px}
.kin-unknown{border:1px dashed #9aa8b0;padding:6px 8px;margin:0 0 10px;background:rgba(255,255,255,.45)}
.kin-unknown-lbl{font-size:13px;color:var(--neutral-38)}
.kin-unknown-lbl span{font-size:11px;opacity:.7;font-family:var(--vscode-editor-font-family)}
.kin-empty{color:var(--neutral-38);font-style:italic;padding:16px;font-size:13px}
.kin-hidden{opacity:.45;outline:1px dashed #8a96a3;outline-offset:1px}
/* diff overlay: yellow border on the changed control only (B side); dashed on A for deleted. No tints. */
.kin-ch{outline:2px solid #e0ac00!important;outline-offset:1px}
.kin-del{outline:2px dashed #e0ac00!important;outline-offset:1px}
.kin-side{background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.04));color:var(--vscode-foreground)}
.wf-legend i.kin-lg-ch{border:2px solid #e0ac00!important;background:none}
.wf-legend i.kin-lg-del{border:2px dashed #e0ac00!important;background:none}
.kin-viewsw{display:inline-flex;border:1px solid var(--vscode-panel-border);border-radius:3px;overflow:hidden}
.kin-vs{padding:2px 10px;cursor:pointer;font-size:11px;color:var(--vscode-descriptionForeground)}
.kin-vs.on{background:var(--vscode-button-background);color:var(--vscode-button-foreground)}

.bf-start rect{fill:var(--vscode-badge-background);stroke:var(--vscode-descriptionForeground)}
.fn-row.open > .fn-row-hdr .chevron{transform:rotate(90deg)}

/* ── One colour for all text/badges. The only colour in the panel is the yellow
   border on changed controls/nodes in Preview and Flow (plus line-diff backgrounds). ── */
.fn-badge,.list-badge,.tag,.tag.warn,.tab-badge,.type-tab.active .tab-badge,.chip-count{background:var(--vscode-badge-background)!important;color:var(--vscode-badge-foreground)!important}
.list-dot{background:var(--vscode-descriptionForeground)!important;opacity:.6}
.chip.active{border-bottom-color:var(--vscode-button-background)!important}
.env-label.a,.env-label.b{color:var(--vscode-descriptionForeground)!important}
.diff-col-hdr.a,.diff-col-hdr.b{background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.04))!important;color:var(--vscode-foreground)!important}
.section-lbl,.detail-meta span,.fn-changed,.only-info,.list-delta{color:var(--vscode-descriptionForeground)!important}
.meta-tbl tr.changed td{background:none!important}
.meta-tbl tr.changed td:first-child{font-weight:700}
.va,.vb,.vs{color:inherit!important}
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
    <button class="run-btn" id="runBtn" onclick="runCompare()">Run Compare</button>
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
    <span>Method + data directives, widgets and code, from both environments</span>
  </div>
  <div style="display:none;flex-direction:column;flex:1;overflow:hidden" id="bpmMain">
    <div class="summary" id="bpmSummary"></div>
    <div class="filter-bar">
      <input class="search" id="bpmSearch" placeholder="Search services / methods / directives…" oninput="bpmApply()">
      <select id="bpmSource" onchange="bpmApply()"><option value="">All sources</option><option value="BO">Method directives</option><option value="DB">Data directives</option></select>
      <label class="fb-chk"><input type="checkbox" id="bpmHideDisabled" onchange="bpmApply()"> Hide disabled</label>
      <label class="fb-chk"><input type="checkbox" id="bpmCodeOnly" onchange="bpmApply()"> Code changes only</label>
    </div>
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
    <span>Custom layers only (system/base excluded) — content loads per layer on click</span>
  </div>
  <div style="display:none;flex-direction:column;flex:1;overflow:hidden" id="layersMain">
    <div class="summary" id="layersSummary"></div>
    <div class="filter-bar"><input class="search" id="layersSearch" placeholder="Search apps / layers…" oninput="layersApply()"></div>
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
// Separate in-flight flags: the LOADED flags only flip on success, so without
// these a double-click fired two concurrent full fetches.
let BPM_LOADING = false, LY_LOADING = false;
let LAST_RUN   = null; // {profileA, companyA, profileB, companyB}
let LAYER_LIST_CACHE    = {}; // appId -> { layersA, layersB }
let LAYER_CONTENT_CACHE = {}; // appId::layerKey -> { normA, normB, same } | { loading } | { error }
let LAYER_OBJECTS       = {}; // appId::layerKey::a/b -> layer descriptor
let PENDING_DIFF        = null; // { appId, layerKey } -- open native diff once content loads

// ── HELPERS ───────────────────────────────────────────────────────────
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
// For values interpolated into a JS string literal inside an on* attribute.
// esc() alone is not enough there: it leaves ' untouched, so a layer or
// function named "Bob's Layer" closed the literal early and killed the handler
// (or worse, injected). Backslash-escape for the JS layer first, then HTML-escape
// for the attribute layer — the browser undoes them in the reverse order.
function jsAttr(s){
  return esc(String(s).replace(/\\\\/g,'\\\\\\\\').replace(/'/g,"\\\\'").replace(/\\r?\\n/g,'\\\\n'));
}
// Only treat genuinely blob-like strings as binary. The old 20-char threshold
// misclassified ordinary alphanumeric layer names (e.g. "CustomerPortalLayerV2"),
// collapsing every such layer onto its TypeCode key and silently dropping rows.
function looksLikeBinary(s) { return !!s && s.length > 64 && /^[A-Za-z0-9+/]+=*$/.test(s); }
// Stable cross-env identity for a layer. Prefer LayerName (stable) over
// LayerDescription (often version-stamped per save, so the same logical layer
// has different descriptions in each environment), then qualify with Company
// and DeviceType so same-named layers in different scopes never collide.
function layerBaseName(l) {
  const n = l.LayerName;        if (n && !looksLikeBinary(n)) return n;
  const d = l.LayerDescription; if (d && !looksLikeBinary(d)) return d;
  return l.TypeCode || '?';
}
// Key every layer row uniquely — residual duplicates (e.g. published + WIP
// rows of the same layer) get a #2/#3 suffix instead of overwriting each
// other during Map construction. Deterministic for a given input array, so
// the keys built in layerListReady match the ones built in renderLayerList.
// Placeholder rows with no identity and no content occasionally come back from
// GetLayers — hide them; they render as "?" and waste a content fetch per click.
// (GetLayers is a method call, not an OData entity set, so there is no
// server-side $filter — filtering here costs nothing since the rows already
// arrived in the same response.)
function isBlankLayer(l) {
  return !l.LayerName && !l.LayerDescription && !l.Content && !l.HasDraftContent;
}
function layerEntries(layers) {
  const used = new Map();
  // Suffix assignment must not depend on the order the server happened to
  // return rows in. If env A returned [published, wip] and env B returned
  // [wip, published], "#2" landed on a different logical layer per side and
  // the two environments got paired against the wrong counterparts. Sorting on
  // a stable discriminator first makes both sides number duplicates the same.
  // (filter() already copied, so this sort does not disturb the cached array.)
  const rows = (layers || []).filter(l => !isBlankLayer(l));
  rows.sort((x, y) =>
    layerBaseName(x).localeCompare(layerBaseName(y))
    || String(x.Company || '').localeCompare(String(y.Company || ''))
    || String(x.DeviceType || '').localeCompare(String(y.DeviceType || ''))
    || String(x.LayerDescription || '').localeCompare(String(y.LayerDescription || ''))
    || String(x.TypeCode || '').localeCompare(String(y.TypeCode || ''))
    || (x.IsPublished === y.IsPublished ? 0 : x.IsPublished ? -1 : 1));
  return rows.map(l => {
    let key = [layerBaseName(l), l.Company || '', l.DeviceType || ''].filter(Boolean).join(' · ');
    const n = used.get(key) || 0;
    used.set(key, n + 1);
    if (n > 0) key += ' #' + (n + 1);
    return { key: key, layer: l };
  });
}
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
    setStatus('Select both profiles and companies before running');
    return;
  }
  LAST_RUN = { profileA, companyA, profileB, companyB };
  BPM_LOADED = false; LY_LOADED = false;
  BPM_LOADING = false; LY_LOADING = false;
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
  if (!LAST_RUN) { setStatus('Run a compare first'); return; }
  if (BPM_LOADED || BPM_LOADING) return;
  BPM_LOADING = true;
  document.getElementById('bpmPrompt').style.display = 'none';
  document.getElementById('bpmMain').style.display   = 'flex';
  document.getElementById('bpmDetail').innerHTML     = '<div class="empty-state"><span>Loading BPM data…</span></div>';
  setStatus('Fetching BPMs…');
  vscode.postMessage({ command: 'runBpmCompare', ...LAST_RUN });
}

function loadLayers() {
  if (!LAST_RUN) { setStatus('Run a compare first'); return; }
  if (LY_LOADED || LY_LOADING) return;
  LY_LOADING = true;
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
      BPM_LOADED = true; BPM_LOADING = false;
      setStatus('');
      BPM_DATA = msg.data;
      document.getElementById('bpmBadge').textContent = BPM_DATA.total;
      renderBpmSummary(); bpmApply();
      break;
    case 'layersReady':
      LY_LOADED = true; LY_LOADING = false;
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
      for (const e of layerEntries(msg.layersA)) LAYER_OBJECTS[msg.appId + '::' + e.key + '::a'] = e.layer;
      for (const e of layerEntries(msg.layersB)) LAYER_OBJECTS[msg.appId + '::' + e.key + '::b'] = e.layer;
      LAYER_LIST_CACHE[msg.appId] = { layersA: msg.layersA, layersB: msg.layersB, errorA: msg.errorA, errorB: msg.errorB };
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
        sendDiff(msg.normA||'', msg.normB||'', msg.layerKey.replace(/[^a-zA-Z0-9._-]/g,'_')+'.json', LAST_RUN?.profileA, LAST_RUN?.profileB, msg.appId);
      }
      break;
    }
    case 'layerContentError':
      LAYER_CONTENT_CACHE[\`\${msg.appId}::\${msg.layerKey}\`] = { error: msg.message };
      { const bodyEl2 = document.getElementById('lrb_' + safeId(msg.appId + '_' + msg.layerKey));
        if (bodyEl2) bodyEl2.innerHTML = \`<div class="only-info" style="color:var(--c-only-a)">Error: \${esc(msg.message)}</div>\`; }
      break;
    case 'applyFnStarted':
      setStatus(\`Applying \${msg.libraryId}.\${msg.functionId}…\`);
      break;
    case 'applyFnStatus':
      setStatus(msg.text);
      break;
    case 'applyFnCancelled':
      setStatus('');
      break;
    case 'applyFnDone':
      setStatus(\`Applied \${msg.functionId} — re-run compare to refresh this view\`);
      break;
    case 'applyFnError':
      setStatus('Apply failed: ' + msg.message);
      break;
    case 'error':
      document.getElementById('runBtn').disabled = false;
      setStatus('Error: ' + msg.message);
      // Put the failed tab back to its load prompt. Leaving it on a permanent
      // "Loading…" pane with the retry button hidden meant the only way back
      // was re-running the whole comparison.
      if (msg.tab === 'bpm') {
        BPM_LOADING = false;
        document.getElementById('bpmPrompt').style.display = '';
        document.getElementById('bpmMain').style.display   = 'none';
      }
      if (msg.tab === 'layers') {
        LY_LOADING = false;
        document.getElementById('layersPrompt').style.display = '';
        document.getElementById('layersMain').style.display   = 'none';
      }
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
        return \`<div class="list-item s-\${l.status} \${l.libID===FN_SEL?'active':''}" onclick="fnSelect('\${jsAttr(l.libID)}')">
          <div class="list-dot"></div>
          <span class="list-name" title="\${esc(l.libID)}">\${esc(l.libID)}</span>
          \${delta ? \`<span class="list-delta">\${delta} diff</span>\` : ''}
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
  const sl = { match:'Match', diff:'~ Different', 'only-a':\`Only in \${ea}\`, 'only-b':\`+ Only in \${eb}\` };
  let html = \`<div class="detail-hdr">
    <div class="detail-title">\${esc(lib.libID)}</div>
    <div class="detail-meta">
      <span style="color:\${sc[lib.status]}">\${sl[lib.status]}</span>
      <span>| \${lib.fnDiffs.length} function\${lib.fnDiffs.length!==1?'s':''}</span>
      <span style="color:\${lib.inA?'var(--c-only-a)':'var(--vscode-descriptionForeground)'}">\${ea}</span>
      <span style="color:\${lib.inB?'var(--c-only-b)':'var(--vscode-descriptionForeground)'}">\${eb}</span>
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
        Library Info\${hasDiff ? ' *' : ''}
        \${hasDiff ? \`<span style="color:var(--c-diff);font-size:9px">has differences</span>\` : \`<span style="color:var(--vscode-descriptionForeground);font-size:9px">click to expand</span>\`}
      </span>
      <span class="chevron \${hasDiff?'open':''}" id="\${lid}_chev"></span>
    </div>
    <div id="\${lid}" style="display:\${hasDiff?'block':'none'};border-top:1px solid var(--vscode-panel-border)">
      <div class="tabs">
        <button class="tab active" onclick="switchLibTab(this,'\${lid}','refs')">References\${refsDiff?' *':''}</button>
        <button class="tab"        onclick="switchLibTab(this,'\${lid}','settings')">Settings\${metaDiff?' *':''}</button>
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
        <span style="font-size:9px;color:var(--c-match)">match (\${items.length})</span>
        <span class="chevron" id="\${sid}_chev"></span></div>
        <div id="\${sid}" style="display:none"><table class="meta-tbl"><tbody>\${items.map(i=>\`<tr><td colspan="2" class="vs">\${esc(i)}</td></tr>\`).join('')}</tbody></table></div></div>\`;
    } else {
      html += \`<div class="ref-group"><div class="ref-group-hdr"><span class="ref-group-lbl">\${k}</span><span style="font-size:9px;color:var(--c-diff)"> * different</span></div>\${inlineListDiff(v.a,v.b,ea,eb)}</div>\`;
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
  // Only offer Apply where it can actually work: the wrapper updates an
  // existing function row, so only-in-one-environment functions are excluded
  // (they need creating on the target first), as are already-matching ones.
  const applyBtns = fn.status === 'diff'
    ? \`<button class="open-diff-btn" title="Copy this function's code to \${esc(eb)}" onclick="event.stopPropagation();applyFn('\${jsAttr(libID)}','\${jsAttr(fn.fnID)}','aToB')">-> \${esc(eb)}</button>\`
      + \`<button class="open-diff-btn" title="Copy this function's code to \${esc(ea)}" onclick="event.stopPropagation();applyFn('\${jsAttr(libID)}','\${jsAttr(fn.fnID)}','bToA')">-> \${esc(ea)}</button>\`
    : '';
  return \`<div class="fn-row" id="\${id}">
    <div class="fn-row-hdr" onclick="toggleFn('\${id}')">
      <span class="fn-badge" style="background:\${sc[fn.status]}22;color:\${sc[fn.status]}">\${sb[fn.status]}</span>
      <span class="fn-name">\${esc(fn.fnID)}</span>
      \${changed.length?\`<span class="fn-changed">\${changed.join(', ')}</span>\`:''}
      <button class="open-diff-btn" title="Open in VS Code diff editor" onclick="event.stopPropagation();openFnDiff('\${jsAttr(libID)}','\${jsAttr(fn.fnID)}')">Diff</button>
      \${applyBtns}
      <span class="chevron"></span>
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
    <button class="tab active" onclick="switchFnTab(this,'\${fid}','code')">Code\${codeDiff?' *':''}</button>
    <button class="tab"        onclick="switchFnTab(this,'\${fid}','sig')">Signature\${sigDiff?' *':''}</button>
    <button class="tab"        onclick="switchFnTab(this,'\${fid}','meta')">Metadata\${metaDiff?' *':''}</button>
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

// ── Unified native diff helpers ──────────────────────────────────────────
// diffId scopes the temp files (library / app / BPM method) so two items that
// share a filename under different parents don't collide on disk.
function sendDiff(cA, cB, fileName, lA, lB, diffId) {
  vscode.postMessage({ command: 'openNativeDiff',
    contentA: cA, contentB: cB, diffId: diffId || '',
    fileName: fileName, labelA: lA || 'A', labelB: lB || 'B' });
}
function applyFn(libraryId, functionId, direction) {
  vscode.postMessage({ command: 'applyFunction', libraryId, functionId, direction, ...LAST_RUN });
}
function openFnDiff(libId, fnId) {
  const lib = (FN_DATA?.libraries||[]).find(l=>l.libID===libId);
  const fn  = (lib?.fnDiffs||[]).find(f=>f.fnID===fnId);
  if (!fn) return;
  sendDiff(fn.fa?._code||'', fn.fb?._code||'', fnId+'.cs', LAST_RUN?.profileA, LAST_RUN?.profileB, libId);
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
  return \`<div class="diff-wrap"><div class="diff-col-hdrs"><div class="diff-col-hdr a">\${labelA}</div><div class="diff-col-hdr b">\${labelB}</div></div><div class="diff-scroll"><div class="diff-grid">\${cells}</div></div></div>\`;
}

function lcs(A, B) {
  // Trim the common prefix/suffix first — layer JSONs and function bodies are
  // mostly identical, so the O(n·m) alignment only needs to run on the changed
  // middle. The old version bailed out entirely past 800 lines and rendered
  // "all of A deleted, then all of B added" — the misaligned stacked view.
  let pre = 0;
  while (pre < A.length && pre < B.length && A[pre] === B[pre]) pre++;
  let suf = 0;
  while (suf < A.length - pre && suf < B.length - pre && A[A.length-1-suf] === B[B.length-1-suf]) suf++;
  const midA = A.slice(pre, A.length - suf), midB = B.slice(pre, B.length - suf);
  const n = midA.length, m = midB.length;
  let aligned;
  if (n === 0 && m === 0) {
    aligned = [];
  } else if (n > 2500 || m > 2500) {
    // Genuinely massive changed region — alignment too expensive; the
    // native Diff button handles these properly.
    aligned = [...midA.map(v=>({t:'-',v})), ...midB.map(v=>({t:'+',v}))];
  } else {
    const dp = Array.from({length:n+1},()=>new Int32Array(m+1));
    for (let i=n-1;i>=0;i--) for (let j=m-1;j>=0;j--) dp[i][j]=midA[i]===midB[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
    aligned=[]; let i=0,j=0;
    while(i<n||j<m){
      if(i<n&&j<m&&midA[i]===midB[j]){aligned.push({t:'=',v:midA[i]});i++;j++;}
      else if(j<m&&(i>=n||dp[i][j+1]>=dp[i+1][j])){aligned.push({t:'+',v:midB[j]});j++;}
      else{aligned.push({t:'-',v:midA[i]});i++;}
    }
  }
  const out=[...A.slice(0,pre).map(v=>({t:'=',v})), ...aligned, ...A.slice(A.length-suf).map(v=>({t:'=',v}))];
  const CTX=3, result=[];
  let equalRun=[];
  // Collapse long equal runs into a skip row, keeping CTX context lines on the
  // sides that touch a change. Every line is accounted for exactly once — the
  // old version double-pushed short trailing runs and dropped end-of-file runs
  // without a skip marker, which corrupted the line numbers.
  function flush(last){
    if(!equalRun.length) return;
    if(result.length===0&&last){result.push(...equalRun);equalRun=[];return;}
    const head = result.length>0 ? CTX : 0; // context after a change
    const tail = last ? 0 : CTX;            // context before the next change
    if (equalRun.length <= head + tail) {
      result.push(...equalRun);
    } else {
      if (head) result.push(...equalRun.slice(0, head));
      const midCount = equalRun.length - head - tail;
      result.push({t:'skip',v:'… '+midCount+' unchanged lines …',countA:midCount,countB:midCount});
      if (tail) result.push(...equalRun.slice(-tail));
    }
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
  return \`<div class="diff-wrap"><div class="diff-col-hdrs"><div class="diff-col-hdr a">\${labelA}</div><div class="diff-col-hdr b">\${labelB}</div></div><div class="diff-scroll"><div class="diff-grid">\${cells}</div></div></div>\`;
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
<script>
${COMPARE_WEBVIEW_JS}
</script>
</body>
</html>`;
    }
}

ComparePanel.KEY = 'efxCompare';
ComparePanel.panels = new Map();
exports.ComparePanel = ComparePanel;
