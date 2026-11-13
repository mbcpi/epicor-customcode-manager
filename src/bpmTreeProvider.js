"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BpmTreeProvider = void 0;
const vscode = __importStar(require("vscode"));
const bpmClient_1 = require("./bpmClient");

// ── Node types ──

const GROUP_LABELS = { BO: 'Method Directives', DB: 'Data Directives', DQ: 'UBAQ Directives' };

class BpmGroupNode extends vscode.TreeItem {
    constructor(source) {
        super(GROUP_LABELS[source], vscode.TreeItemCollapsibleState.Collapsed);
        this.source = source;
        this.contextValue = 'bpm-group';
        this.iconPath = new vscode.ThemeIcon(source === 'DB' ? 'database' : source === 'DQ' ? 'table' : 'server-process');
    }
}

// A UBAQ query ("Ice.CPI01/CabPDUSNMatching") holding its BPM methods.
class BpmQueryNode extends vscode.TreeItem {
    constructor(queryKey, methods) {
        super(queryKey.replace(/^Ice\./, ''), vscode.TreeItemCollapsibleState.Collapsed);
        this.queryKey = queryKey;
        this.methods = methods; // [{ method, directives }]
        this.contextValue = 'bpm-query';
        this.iconPath = new vscode.ThemeIcon('table');
        const count = methods.reduce((n, m) => n + m.directives.length, 0);
        this.description = `${count} directive${count === 1 ? '' : 's'}`;
        this.tooltip = queryKey;
    }
}

class BpmServiceNode extends vscode.TreeItem {
    constructor(svc) {
        const label = `${svc.SystemCode}.${svc.ServiceKind}.${svc.ServiceName}`;
        super(label, vscode.TreeItemCollapsibleState.Collapsed);
        this.svc = svc;
        this.contextValue = 'bpm-service';
        this.iconPath = new vscode.ThemeIcon('server');
        this.tooltip = `${svc.SystemCode} / ${svc.ServiceKind} / ${svc.ServiceName}`;
    }
}

class BpmMethodNode extends vscode.TreeItem {
    constructor(method, directives, label) {
        super(label || method.Name, vscode.TreeItemCollapsibleState.Collapsed);
        this.method = method;
        this.directives = directives;
        this.contextValue = 'bpm-method';
        const source = bpmClient_1.bpmSourceOf(method);

        const flags = [];
        if (source === 'BO') {
            if (method.HasPreProcessing)  flags.push('Pre');
            if (method.HasBaseProcessing) flags.push('Base');
            if (method.HasPostProcessing) flags.push('Post');
        } else {
            // Has*Processing flags describe method directives only — label from
            // the directives actually present.
            for (const t of [...new Set((directives || []).map(d => d.DirectiveType))].sort()) {
                flags.push(bpmClient_1.directiveTypeLabel(source, t));
            }
        }
        if (method.Disabled)          flags.push('Disabled');
        if (method.HasOutdatedDirectives) flags.push('⚠ Outdated');

        this.description = flags.join(' · ') || 'No directives';
        this.tooltip = [
            `${method.BpMethodCode}`,
            `Source: ${method.Source}`,
            flags.length ? `Flags: ${flags.join(', ')}` : '',
        ].filter(Boolean).join('\n');

        if (method.Disabled) {
            this.iconPath = new vscode.ThemeIcon('circle-slash', new vscode.ThemeColor('charts.red'));
        } else if (method.HasOutdatedDirectives) {
            this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.yellow'));
        } else if (flags.length > 0) {
            this.iconPath = new vscode.ThemeIcon('symbol-event', new vscode.ThemeColor('charts.blue'));
        } else {
            this.iconPath = new vscode.ThemeIcon('symbol-event');
        }
    }
}

class BpmDirectiveNode extends vscode.TreeItem {
    constructor(directive) {
        super(directive.Name, vscode.TreeItemCollapsibleState.None);
        this.directive = directive;

        const typeLabel = bpmClient_1.directiveTypeLabel(bpmClient_1.bpmSourceOf(directive), directive.DirectiveType);

        const { hasCustomCode } = bpmClient_1.extractBpmCode(directive.Body);

        this.description = [
            typeLabel,
            !directive.IsEnabled ? 'Disabled' : '',
            !hasCustomCode ? 'No code' : '',
            directive.DirectiveGroup ? `[${directive.DirectiveGroup}]` : '',
        ].filter(Boolean).join(' · ');

        this.contextValue = hasCustomCode ? 'bpm-directive-code' : 'bpm-directive-nocode';

        if (!hasCustomCode) {
            this.command = {
                command: 'efx.bpm.openWidgetPanel',
                title: 'Open Widget Panel',
                arguments: [{ directive }],
            };
        }

        this.tooltip = [
            directive.Name,
            `Type: ${typeLabel}`,
            `Enabled: ${directive.IsEnabled}`,
            `Group: ${directive.DirectiveGroup || '(none)'}`,
            hasCustomCode ? 'Has custom C# code' : 'No custom code (widget/condition only)',
            directive.CompilerDiagnostics ? `Diagnostics: ${directive.CompilerDiagnostics}` : '',
        ].filter(Boolean).join('\n');

        if (!directive.IsEnabled) {
            this.iconPath = new vscode.ThemeIcon('circle-slash', new vscode.ThemeColor('charts.red'));
        } else if (!hasCustomCode) {
            this.iconPath = new vscode.ThemeIcon('gear');
        } else if (directive.DirectiveType === 1) {
            this.iconPath = new vscode.ThemeIcon('arrow-up', new vscode.ThemeColor('charts.blue'));
        } else if (directive.DirectiveType === 3) {
            this.iconPath = new vscode.ThemeIcon('arrow-down', new vscode.ThemeColor('charts.green'));
        } else {
            this.iconPath = new vscode.ThemeIcon('symbol-event');
        }

        // Click to pull if it has code
        if (hasCustomCode) {
            this.command = {
                command: 'efx.bpm.pullDirective',
                title: 'Pull Directive Code',
                arguments: [{ directive }],
            };
        }
    }
}

exports.BpmGroupNode    = BpmGroupNode;
exports.BpmQueryNode    = BpmQueryNode;
exports.BpmServiceNode  = BpmServiceNode;
exports.BpmMethodNode   = BpmMethodNode;
exports.BpmDirectiveNode = BpmDirectiveNode;

// ── Tree Provider ──

class BpmTreeProvider {
    constructor(bpmClient) {
        this.bpmClient = bpmClient;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.services = [];
        // Cache: serviceKey -> { methods, directives }
        this.methodCache = new Map();
        // Cache: source ('DB' | 'DQ') -> { methods, directives }
        this.sourceCache = new Map();
    }

    setClient(bpmClient) {
        this.bpmClient = bpmClient;
    }

    async refresh() {
        if (!this.bpmClient) {
            vscode.window.showWarningMessage('BPM: Configure EFx connection first');
            return;
        }
        try {
            this.services = await this.bpmClient.getBpmServices();
            this.methodCache.clear();
            this.sourceCache.clear();
            this._onDidChangeTreeData.fire(undefined);
            vscode.window.showInformationMessage(`BPM: Loaded ${this.services.length} services`);
        } catch (err) {
            vscode.window.showErrorMessage(`BPM: Failed to load services: ${err.message}`);
        }
    }

    invalidateService(systemCode, serviceKind, serviceName) {
        const key = `${systemCode}.${serviceKind}.${serviceName}`;
        this.methodCache.delete(key);
    }

    invalidateSource(source) {
        this.sourceCache.delete(source);
    }

    // All methods + directives for DB or DQ, loaded once per refresh. Directive
    // rows get Source stamped so pull/push know which BpMethodSvc source to use.
    async _loadSource(source) {
        let data = this.sourceCache.get(source);
        if (data) return data;
        const raw = await this.bpmClient.getBpmRowsBySource(source);
        data = {
            methods: raw.methods.map(m => ({ ...m, Source: source })),
            directives: raw.directives.map(d => ({ ...d, Source: source })),
        };
        this.sourceCache.set(source, data);
        return data;
    }

    // Methods that actually carry directives, each with its directive rows.
    _methodsWithDirectives(data) {
        const byCode = new Map();
        for (const d of data.directives) {
            if (!byCode.has(d.BpMethodCode)) byCode.set(d.BpMethodCode, []);
            byCode.get(d.BpMethodCode).push(d);
        }
        const out = [];
        for (const [code, directives] of byCode) {
            const method = data.methods.find(m => m.BpMethodCode === code)
                || { BpMethodCode: code, Name: code.split('.').pop(), Source: directives[0].Source };
            out.push({ method, directives });
        }
        return out.sort((a, b) => a.method.BpMethodCode.localeCompare(b.method.BpMethodCode));
    }

    getTreeItem(element) {
        return element;
    }

    async getChildren(element) {
        if (!this.bpmClient) return [];

        // Root: one group per BPM source
        if (!element) {
            return bpmClient_1.BPM_SOURCES.map(src => new BpmGroupNode(src));
        }

        // Data / UBAQ groups load in one call per source
        if (element instanceof BpmGroupNode && element.source !== 'BO') {
            let data;
            try {
                data = await this._loadSource(element.source);
            } catch (err) {
                vscode.window.showErrorMessage(`BPM: Failed to load ${GROUP_LABELS[element.source]}: ${err.message}`);
                return [];
            }
            const methods = this._methodsWithDirectives(data);
            if (element.source === 'DB') {
                // Erp.Part.Update -> "Erp.Part"
                return methods.map(({ method, directives }) =>
                    new BpmMethodNode(method, directives, method.BpMethodCode.replace(/\.Update$/, '')));
            }
            // DQ: Ice.CPI01/Query.GetList -> query "Ice.CPI01/Query", method "GetList"
            const byQuery = new Map();
            for (const m of methods) {
                const code = m.method.BpMethodCode;
                const queryKey = code.slice(0, code.lastIndexOf('.'));
                if (!byQuery.has(queryKey)) byQuery.set(queryKey, []);
                byQuery.get(queryKey).push(m);
            }
            return [...byQuery.entries()]
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([queryKey, ms]) => new BpmQueryNode(queryKey, ms));
        }

        if (element instanceof BpmQueryNode) {
            return element.methods.map(({ method, directives }) =>
                new BpmMethodNode(method, directives, method.BpMethodCode.split('.').pop()));
        }

        // Method directives group: services
        if (element instanceof BpmGroupNode) {
            return this.services
                .sort((a, b) => {
                    const ka = `${a.SystemCode}.${a.ServiceKind}.${a.ServiceName}`;
                    const kb = `${b.SystemCode}.${b.ServiceKind}.${b.ServiceName}`;
                    return ka.localeCompare(kb);
                })
                .map(svc => new BpmServiceNode(svc));
        }

        // Service: methods
        if (element instanceof BpmServiceNode) {
            const { SystemCode, ServiceKind, ServiceName } = element.svc;
            const key = `${SystemCode}.${ServiceKind}.${ServiceName}`;
            let data = this.methodCache.get(key);
            if (!data) {
                try {
                    data = await this.bpmClient.getBpmMethodsByService(SystemCode, ServiceKind, ServiceName);
                    this.methodCache.set(key, data);
                } catch (err) {
                    vscode.window.showErrorMessage(`BPM: Failed to load methods: ${err.message}`);
                    return [];
                }
            }
            const { methods, directives } = data;
            return methods
                .sort((a, b) => a.Name.localeCompare(b.Name))
                .map(m => {
                    const methodDirs = directives.filter(d => d.BpMethodCode === m.BpMethodCode);
                    return new BpmMethodNode(m, methodDirs);
                });
        }

        // Method: directives
        if (element instanceof BpmMethodNode) {
            const dirs = element.directives;
            if (!dirs || dirs.length === 0) {
                return [];
            }
            return dirs
                .sort((a, b) => {
                    // Sort by type (Pre first, then Base, then Post), then Order
                    if (a.DirectiveType !== b.DirectiveType) return a.DirectiveType - b.DirectiveType;
                    return (a.Order || 0) - (b.Order || 0);
                })
                .map(d => new BpmDirectiveNode(d));
        }

        return [];
    }
}
exports.BpmTreeProvider = BpmTreeProvider;
