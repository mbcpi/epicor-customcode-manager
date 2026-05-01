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
    constructor(method, directives) {
        super(method.Name, vscode.TreeItemCollapsibleState.Collapsed);
        this.method = method;
        this.directives = directives;
        this.contextValue = 'bpm-method';

        const flags = [];
        if (method.HasPreProcessing)  flags.push('Pre');
        if (method.HasBaseProcessing) flags.push('Base');
        if (method.HasPostProcessing) flags.push('Post');
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

        const typeLabel = directive.DirectiveType === 1 ? 'Pre'
            : directive.DirectiveType === 3 ? 'Post'
            : directive.DirectiveType === 2 ? 'Base'
            : `Type${directive.DirectiveType}`;

        const { hasCustomCode } = bpmClient_1.extractBpmCode(directive.Body);

        this.description = [
            typeLabel,
            !directive.IsEnabled ? 'Disabled' : '',
            !hasCustomCode ? 'No code' : '',
            directive.DirectiveGroup ? `[${directive.DirectiveGroup}]` : '',
        ].filter(Boolean).join(' · ');

        this.contextValue = hasCustomCode ? 'bpm-directive-code' : 'bpm-directive-nocode';

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

    getTreeItem(element) {
        return element;
    }

    async getChildren(element) {
        if (!this.bpmClient) return [];

        // Root: services
        if (!element) {
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
