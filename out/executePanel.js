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
exports.ExecutePanel = void 0;
const vscode = __importStar(require("vscode"));
class ExecutePanel {
    constructor(panel, client, libraryId, functionId, signatures, companies, defaultCompany, treeProvider) {
        this.client = client;
        this.libraryId = libraryId;
        this.functionId = functionId;
        this.signatures = signatures;
        this.companies = Array.isArray(companies) && companies.length > 0 ? companies : (defaultCompany ? [defaultCompany] : []);
        this.defaultCompany = defaultCompany || (this.companies[0] || '');
        this.treeProvider = treeProvider || null;
        this.disposed = false;
        this.panel = panel;
        this.panel.webview.onDidReceiveMessage(async (msg) => {
            if (msg.command === 'execute') {
                await this.execute(msg.payload, msg.company);
            }
            if (msg.command === 'saveSignatures') {
                await this.saveSignatures(msg.signatures);
            }
        });
        this.panel.onDidDispose(() => {
            this.disposed = true;
            ExecutePanel.panels.delete(`${libraryId}.${functionId}`);
        });
        this.panel.webview.html = this.getHtml();
    }
    static show(client, libraryId, functionId, signatures, companies, defaultCompany, treeProvider) {
        const key = `${libraryId}.${functionId}`;
        const existing = ExecutePanel.panels.get(key);
        if (existing && !existing.disposed) {
            existing.panel.reveal();
            return;
        }
        const panel = vscode.window.createWebviewPanel('efxExecute', `▶ ${functionId}`, vscode.ViewColumn.Two, { enableScripts: true, retainContextWhenHidden: true });
        const ep = new ExecutePanel(panel, client, libraryId, functionId, signatures, companies, defaultCompany, treeProvider);
        ExecutePanel.panels.set(key, ep);
    }
    async execute(payload, company) {
        this.panel.webview.postMessage({ command: 'executing' });
        try {
            const result = await this.client.executeFunction(this.libraryId, this.functionId, payload, company || undefined);
            this.panel.webview.postMessage({
                command: 'result',
                data: JSON.stringify(result, null, 2),
                success: true,
            });
        }
        catch (err) {
            this.panel.webview.postMessage({
                command: 'result',
                data: err.message,
                success: false,
            });
        }
    }
    async saveSignatures(newSigs) {
        this.panel.webview.postMessage({ command: 'sigSaving' });
        try {
            const { saved, diagnostics, updatedSigs } = await this.client.saveSignatures(
                this.libraryId, this.functionId, newSigs
            );
            if (!saved) {
                const msgs = (diagnostics || []).map(d =>
                    typeof d === 'object' ? (d.Message || JSON.stringify(d)) : String(d)
                );
                this.panel.webview.postMessage({
                    command: 'sigError',
                    error: msgs.join('\n') || 'Epicor rejected the signature change',
                });
                return;
            }
            // Keep in-memory signatures in sync
            const otherSigs = this.signatures.filter(s => s.FunctionID !== this.functionId);
            this.signatures = [...otherSigs, ...updatedSigs];
            // Bust tree cache so library node picks up new param list
            if (this.treeProvider) {
                this.treeProvider.invalidateCache(this.libraryId);
            }
            this.panel.webview.postMessage({
                command: 'sigSaved',
                signatures: updatedSigs,
            });
        }
        catch (err) {
            this.panel.webview.postMessage({
                command: 'sigError',
                error: err.message,
            });
        }
    }
    getHtml() {
        const requestParams = this.signatures.filter(s => !s.Response);
        const responseParams = this.signatures.filter(s => s.Response);
        // Build default payload from request params
        const defaultPayload = {};
        for (const p of requestParams) {
            if (p.DataType.includes('Int') || p.DataType.includes('Decimal') || p.DataType.includes('Double')) {
                defaultPayload[p.ArgumentName] = 0;
            }
            else if (p.DataType.includes('Boolean')) {
                defaultPayload[p.ArgumentName] = false;
            }
            else if (p.DataType.includes('DataSet') || p.DataType.includes('DataTable')) {
                defaultPayload[p.ArgumentName] = {};
            }
            else {
                defaultPayload[p.ArgumentName] = '';
            }
        }
        const requestInfo = requestParams.map(p => `<span class="param">${p.ArgumentName} <span class="type">${p.DataType.split('.').pop()}${p.Optional ? '?' : ''}</span></span>`).join('') || '<span class="param none">No request parameters</span>';
        const responseInfo = responseParams.map(p => `<span class="param">${p.ArgumentName} <span class="type">${p.DataType.split('.').pop()}</span></span>`).join('');
        const companyOptions = (this.companies || []).map(c =>
            `<option value="${c}"${c === this.defaultCompany ? ' selected' : ''}>${c}</option>`
        ).join('');
        const companyRow = (this.companies && this.companies.length > 0)
            ? `<div class="company-row">
        <label for="companySelect">Company</label>
        <select id="companySelect">${companyOptions}</select>
        <button class="btn-secondary" id="toggleSigBtn" onclick="toggleSigEditor()">⚙ Edit Signatures</button>
    </div>`
            : `<div class="company-row">
        <button class="btn-secondary" id="toggleSigBtn" onclick="toggleSigEditor()">⚙ Edit Signatures</button>
    </div>`;
        const toEditorSig = s => ({
            ArgumentName: s.ArgumentName,
            DataType: s.DataType || 'System.String',
            Optional: !!s.Optional,
            Response: !!s.Response,
            Order: s.Order ?? 0,
        });
        const reqSigsJson  = JSON.stringify(requestParams.map(toEditorSig));
        const respSigsJson = JSON.stringify(responseParams.map(toEditorSig));
        const typeOptionsHtml = [
            ['System.String','String'],['System.Int32','Int32'],['System.Int64','Int64'],
            ['System.Decimal','Decimal'],['System.Double','Double'],
            ['System.Boolean','Boolean'],['System.DateTime','DateTime'],
        ].map(([v,l]) => `<option value="${v}">${l}</option>`).join('') + '<option value="__custom__">Custom…</option>';
        return /*html*/ `<!DOCTYPE html>
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
</style>
</head>
<body>
    <div class="header">
        <h1>▶ ${this.functionId}</h1>
        <span class="lib">${this.libraryId}</span>
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
            <button class="add-btn" onclick="addSigRow()">＋ Add</button>
        </div>
        <div class="sig-save-bar">
            <span class="sig-status" id="sigStatus"></span>
            <button class="btn-save" id="saveBtn" onclick="saveSignatures()">💾 Save to Epicor</button>
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
    <span class="spinner" id="spinner">⏳ Running...</span>

    <div class="response-area">
        <h2>Response</h2>
        <div class="params">${responseInfo}</div>
        <pre id="response">— No response yet —</pre>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

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
        const knownTypes = ['System.String','System.Int32','System.Int64','System.Decimal','System.Double','System.Boolean','System.DateTime'];
        function renderSigRows() {
            const sigs = activeTab === 'request' ? reqSigs : respSigs;
            const container = document.getElementById('sigRows');
            container.innerHTML = '';
            if (sigs.length === 0) { container.innerHTML = '<div class="sig-empty">No parameters — use ＋ Add below.</div>'; return; }
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
                knownTypes.forEach(t => { const o = document.createElement('option'); o.value = t; o.textContent = t.replace('System.',''); if (t === sig.DataType) o.selected = true; typeSelect.appendChild(o); });
                const customOpt = document.createElement('option'); customOpt.value = '__custom__'; customOpt.textContent = isKnown ? 'Custom…' : sig.DataType; if (!isKnown) customOpt.selected = true; typeSelect.appendChild(customOpt);
                const customInput = document.createElement('input'); customInput.placeholder = 'Full .NET type'; customInput.value = isKnown ? '' : sig.DataType; customInput.style.display = isKnown ? 'none' : '';
                customInput.addEventListener('change', () => { if (customInput.value.trim()) sig.DataType = customInput.value.trim(); setSigStatus(''); });
                typeSelect.addEventListener('change', () => { if (typeSelect.value === '__custom__') { customInput.style.display = ''; customInput.focus(); } else { customInput.style.display = 'none'; sig.DataType = typeSelect.value; setSigStatus(''); } });
                typeCell.appendChild(typeSelect); typeCell.appendChild(customInput);
                const optLabel = document.createElement('label'); optLabel.className = 'opt-label';
                const optCheck = document.createElement('input'); optCheck.type = 'checkbox'; optCheck.checked = !!sig.Optional;
                optCheck.addEventListener('change', () => { sig.Optional = optCheck.checked; setSigStatus(''); });
                optLabel.appendChild(optCheck); optLabel.appendChild(document.createTextNode(' Optional'));
                const removeBtn = document.createElement('button'); removeBtn.className = 'btn-icon'; removeBtn.textContent = '✕'; removeBtn.title = 'Remove';
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
            setSigStatus('Saving to Epicor…', 'saving');
            vscode.postMessage({ command: 'saveSignatures', signatures: [...reqSigs, ...respSigs] });
        }
        function setSigStatus(msg, kind) {
            const el = document.getElementById('sigStatus');
            el.textContent = msg;
            el.className = 'sig-status' + (kind ? ' ' + kind : '');
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

            if (msg.command === 'executing') {
                btn.disabled = true;
                spinner.className = 'spinner active';
                response.textContent = '⏳ Executing...';
                response.className = '';
            }
            if (msg.command === 'result') {
                btn.disabled = false;
                spinner.className = 'spinner';
                response.textContent = msg.data;
                response.className = msg.success ? 'success' : 'error';
            }
            if (msg.command === 'sigSaving') {
                setSigStatus('Saving to Epicor…', 'saving');
            }
            if (msg.command === 'sigSaved') {
                document.getElementById('saveBtn').disabled = false;
                reqSigs  = (msg.signatures || []).filter(s => !s.Response);
                respSigs = (msg.signatures || []).filter(s =>  s.Response);
                renderSigRows();
                setSigStatus('✓ Saved to Epicor', 'ok');
            }
            if (msg.command === 'sigError') {
                document.getElementById('saveBtn').disabled = false;
                setSigStatus('✗ ' + (msg.error || 'Save failed'), 'err');
            }
        });
    </script>
</body>
</html>`;
    }
}
exports.ExecutePanel = ExecutePanel;
ExecutePanel.panels = new Map();
//# sourceMappingURL=executePanel.js.map