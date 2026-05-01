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
exports.EfxTreeProvider = exports.FunctionNode = exports.LibraryNode = void 0;
const vscode = __importStar(require("vscode"));
class LibraryNode extends vscode.TreeItem {
    constructor(library) {
        super(library.LibraryID, vscode.TreeItemCollapsibleState.Collapsed);
        this.library = library;
        const parts = [];
        if (library.Published) {
            parts.push("$(cloud) Promoted");
        }
        else {
            parts.push("Unpromoted / Editable");
        }
        if (library.Disabled) {
            parts.push("$(circle-slash) Disabled");
        }
        if (library.LockedBy) {
            parts.push(`$(lock) ${library.LockedBy}`);
        }
        if (library.OwnedByCompany) {
            parts.push(library.OwnedByCompany);
        }
        this.description = library.Description || "";
        this.tooltip = [
            library.LibraryID,
            library.Description || "",
            `Status: ${library.Published ? "Promoted" : "Unpromoted / Editable"}`,
            library.LockedBy ? `Locked by: ${library.LockedBy}` : "Unlocked",
            library.Disabled ? "DISABLED" : "",
            `Company: ${library.OwnedByCompany || "System"}`,
        ].filter(Boolean).join("\n");
        this.contextValue = library.Published ? "library-promoted" : "library-unpromoted";
        if (library.Published) {
            this.iconPath = new vscode.ThemeIcon("cloud", new vscode.ThemeColor("charts.green"));
        }
        else if (library.Disabled) {
            this.iconPath = new vscode.ThemeIcon("circle-slash", new vscode.ThemeColor("charts.red"));
        }
        else if (library.LockedBy) {
            this.iconPath = new vscode.ThemeIcon("lock", new vscode.ThemeColor("charts.yellow"));
        }
        else {
            this.iconPath = new vscode.ThemeIcon("package");
        }
    }
}
exports.LibraryNode = LibraryNode;
class FunctionNode extends vscode.TreeItem {
    constructor(libraryId, func, signatures) {
        super(func.FunctionID, vscode.TreeItemCollapsibleState.None);
        this.libraryId = libraryId;
        this.func = func;
        this.signatures = signatures;
        const requestParams = signatures.filter(s => !s.Response).map(s => s.ArgumentName);
        const responseParams = signatures.filter(s => s.Response).map(s => s.ArgumentName);
        this.description = func.Description || "";
        this.tooltip = [
            `${func.LibraryID}.${func.FunctionID}`,
            func.Description || "",
            `Kind: ${func.Kind === 2 ? "Code-based" : func.Kind === 1 ? "Widget + Code" : "Widget"}`,
            requestParams.length ? `Request: ${requestParams.join(", ")}` : "Request: (none)",
            `Response: ${responseParams.join(", ")}`,
            func.Disabled ? "DISABLED" : "",
            func.Invalid ? "INVALID" : "",
        ].filter(Boolean).join("\n");
        this.contextValue = "function";
        this.iconPath = new vscode.ThemeIcon(func.Invalid ? "warning" : func.Disabled ? "circle-slash" : "symbol-function");
        // Click to pull. Pass a plain object, not this FunctionNode, to avoid circular command args.
        this.command = {
            command: "efx.pullFunction",
            title: "Pull Function",
            arguments: [{
                libraryId: this.libraryId,
                func: this.func,
                signatures: this.signatures,
            }],
        };
    }
}
class FunctionGroupNode extends vscode.TreeItem {
    constructor(libraryId, count) {
        super(`Functions (${count})`, vscode.TreeItemCollapsibleState.Collapsed);
        this.libraryId = libraryId;
        this.contextValue = 'function-group';
        this.iconPath = new vscode.ThemeIcon('symbol-function');
    }
}

class ReferenceGroupNode extends vscode.TreeItem {
    constructor(libraryId, kind, label, count) {
        super(`${label} (${count})`, vscode.TreeItemCollapsibleState.Collapsed);
        this.libraryId = libraryId;
        this.kind = kind;
        // contextValue used for menu targeting: reference-group-tables, reference-group-services, etc.
        this.contextValue = `reference-group-${kind}`;

        const icons = {
            tables: 'database',
            services: 'server',
            libraries: 'library',
            assemblies: 'package'
        };

        this.iconPath = new vscode.ThemeIcon(icons[kind] || 'references');
    }
}

class ReferenceItemNode extends vscode.TreeItem {
    constructor(kind, row) {
        let label = '';
        let description = '';
        let tooltip = '';
        let icon = 'references';

        if (kind === 'tables') {
            label = row.TableID;
            description = row.Updatable ? 'Updatable' : 'Read-only';
            tooltip = [
                row.TableID,
                `Updatable: ${row.Updatable ? 'Yes' : 'No'}`,
                `SysRowID: ${row.SysRowID || ''}`
            ].join('\n');

            icon = row.Updatable ? 'edit' : 'lock';
        }
        else if (kind === 'services') {
            label = row.ServiceID;
            description = 'Service';
            tooltip = [
                row.ServiceID,
                `SysRowID: ${row.SysRowID || ''}`
            ].join('\n');

            icon = 'server';
        }
        else if (kind === 'libraries') {
            label = row.LibraryRef;
            description = row.Mode === 1 ? 'Read-only' : row.Mode === 2 ? 'Hidden' : 'Normal';
            tooltip = [
                row.LibraryRef,
                `Mode: ${row.Mode}`,
                `SysRowID: ${row.SysRowID || ''}`
            ].join('\n');

            icon = 'library';
        }
        else if (kind === 'assemblies') {
            label = row.Assembly;
            description = 'Assembly';
            tooltip = [
                row.Assembly,
                `SysRowID: ${row.SysRowID || ''}`
            ].join('\n');

            icon = 'package';
        }

        super(label || '(unknown)', vscode.TreeItemCollapsibleState.None);

        this.kind = kind;
        this.row = row;
        this.description = description;
        this.tooltip = tooltip;
        this.contextValue = `reference-item-${kind}`;
        this.iconPath = new vscode.ThemeIcon(icon);
    }
}
exports.FunctionNode = FunctionNode;
class EfxTreeProvider {
    constructor(client) {
        this.client = client;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.libraries = []; // public — used by addLibraryRef for suggestions
        this.libraryCache = new Map();
    }
    setClient(client) {
        this.client = client;
    }
    async refresh() {
        if (!this.client) {
            vscode.window.showWarningMessage("EFx: Configure connection first (gear icon)");
            return;
        }
        try {
            this.libraries = await this.client.getLibraryList();
            this.libraryCache.clear();
            this._onDidChangeTreeData.fire(undefined);
            vscode.window.showInformationMessage(`EFx: Loaded ${this.libraries.length} libraries`);
        }
        catch (err) {
            vscode.window.showErrorMessage(`EFx: Failed to load libraries: ${err.message}`);
        }
    }
    async getLibraryTableset(libraryId) {
        if (!this.client) {
            return undefined;
        }
        if (this.libraryCache.has(libraryId)) {
            return this.libraryCache.get(libraryId);
        }
        try {
            const tableset = await this.client.getLibrary(libraryId);
            this.libraryCache.set(libraryId, tableset);
            return tableset;
        }
        catch (err) {
            vscode.window.showErrorMessage(`EFx: Failed to load ${libraryId}: ${err.message}`);
            return undefined;
        }
    }
    invalidateCache(libraryId) {
        this.libraryCache.delete(libraryId);
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        if (!this.client) {
            return [];
        }

        // Root: show libraries
        if (!element) {
            return this.libraries
                .sort((a, b) => a.LibraryID.localeCompare(b.LibraryID))
                .map(lib => new LibraryNode(lib));
        }

        // Library: show grouped children
        if (element instanceof LibraryNode) {
            const tableset = await this.getLibraryTableset(element.library.LibraryID);
            if (!tableset) {
                return [];
            }

            const groups = [];

            const functions = (tableset.EfxFunction || [])
                .filter(f => f.Kind === 2 || f.Kind === 1);

            const tables = tableset.EfxRefTable || [];
            const services = tableset.EfxRefService || [];
            const libraries = tableset.EfxRefLibrary || [];
            const assemblies = tableset.EfxRefAssembly || [];

        // Always show all groups (even empty) so user can add to them
            if (functions.length > 0 || true) {
                if (functions.length > 0) {
                    groups.push(new FunctionGroupNode(element.library.LibraryID, functions.length));
                }
            }

            groups.push(new ReferenceGroupNode(element.library.LibraryID, 'tables', 'Tables', tables.length));
            groups.push(new ReferenceGroupNode(element.library.LibraryID, 'services', 'Services', services.length));
            groups.push(new ReferenceGroupNode(element.library.LibraryID, 'libraries', 'Libraries', libraries.length));
            groups.push(new ReferenceGroupNode(element.library.LibraryID, 'assemblies', 'Assemblies', assemblies.length));

            return groups;
        }

        // Functions group: show functions
        if (element instanceof FunctionGroupNode) {
            const tableset = await this.getLibraryTableset(element.libraryId);
            if (!tableset) {
                return [];
            }

            return (tableset.EfxFunction || [])
                .filter(f => f.Kind === 2 || f.Kind === 1)
                .sort((a, b) => a.FunctionID.localeCompare(b.FunctionID))
                .map(func => {
                    const sigs = (tableset.EfxFunctionSignature || [])
                        .filter(s => s.FunctionID === func.FunctionID);

                    return new FunctionNode(element.libraryId, func, sigs);
                });
        }

        // Reference groups
        if (element instanceof ReferenceGroupNode) {
            const tableset = await this.getLibraryTableset(element.libraryId);
            if (!tableset) {
                return [];
            }

            if (element.kind === 'tables') {
                return (tableset.EfxRefTable || [])
                    .sort((a, b) => a.TableID.localeCompare(b.TableID))
                    .map(row => new ReferenceItemNode('tables', row));
            }

            if (element.kind === 'services') {
                return (tableset.EfxRefService || [])
                    .sort((a, b) => a.ServiceID.localeCompare(b.ServiceID))
                    .map(row => new ReferenceItemNode('services', row));
            }

            if (element.kind === 'libraries') {
                return (tableset.EfxRefLibrary || [])
                    .sort((a, b) => a.LibraryRef.localeCompare(b.LibraryRef))
                    .map(row => new ReferenceItemNode('libraries', row));
            }

            if (element.kind === 'assemblies') {
                return (tableset.EfxRefAssembly || [])
                    .sort((a, b) => a.Assembly.localeCompare(b.Assembly))
                    .map(row => new ReferenceItemNode('assemblies', row));
            }

            return [];
        }

        return [];
    }
}
exports.EfxTreeProvider = EfxTreeProvider;
//# sourceMappingURL=treeProvider.js.map
