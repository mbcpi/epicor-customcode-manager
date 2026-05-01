# Epicor EFx Manager

A VS Code extension for working with Epicor Kinetic EFx Function Libraries and BPM Directives directly from your editor — pull, edit, push, execute, and manage signatures without leaving VS Code.

---

## Features

### EFx Function Libraries

- **Browse** all EFx libraries and their functions in the EFx Explorer sidebar
- **Pull** function C# code into a local `.cs` file with one click
- **Push** edited code back to Epicor with live compile diagnostics shown as VS Code squiggles
- **Execute** functions directly from VS Code with a built-in request/response panel
- **Edit Signatures** — add, remove, or modify request and response parameters and save them directly to Epicor
- **Create** new libraries and functions
- **Promote / Demote** libraries to/from production
- **Regenerate / Validate** libraries
- **Manage references** — tables, services, assemblies, and library references

### BPM Directives

- **Browse** all BPM services, methods, and directives in the BPM Methods sidebar
- **Pull** C# custom code from any directive into a local `.cs` file
- **Push** edited directive code back to Epicor with live compile diagnostics

### Multi-Profile / Multi-Company

- Configure multiple Epicor environment profiles (Dev, Pilot, Prod, etc.)
- Switch between profiles and companies instantly from the toolbar
- Passwords and API keys stored securely in VS Code SecretStorage — never in settings files
- Auto-discovers available companies from the server via the UserFile service

---

## Installation

### 1. Install the Extension

Install the `.vsix` file directly in VS Code via **Extensions → ··· → Install from VSIX**, or run:

```
code --install-extension epicor-efx-manager-0.3.0.vsix
```

### 2. Install the Utilities Library in Epicor

This extension relies on the **Utilities** EFx function library for saving code changes. You must install it in each Epicor environment you want to use the extension with.

Download the `Utilities.efx` library package and import it via **Epicor → Function Library Maintenance → Import**. If you do not have the Utilities library, contact the publisher.

### 3. Add Utilities to Your Access Scope

Once installed, your Epicor user (or security group) must have execute access to the Utilities library:

1. In Epicor, open **Function Library Access Scope Maintenance**
2. Find or create the access scope assigned to your user or group
3. Add the **Utilities** library to the scope
4. Save and log out/in for the change to take effect

Without this, pushes and saves will fail with an `Access denied (Utilities.ApplyChangesWithDiagnostics)` error.

### 4. Add Your Own Libraries to the Access Scope

Any EFx library you want to pull from, push to, or execute must also be in your access scope:

1. In **Function Library Access Scope Maintenance**, open the relevant scope
2. Add each library you need access to
3. Save — no log out required for library additions

---



### 1. Configure a Profile

Click the **gear icon** in the EFx Libraries toolbar, or run `EFx: Manage Profiles` from the command palette. You'll be walked through:

- Profile name (e.g. `Dev`, `Prod`)
- Epicor server URL (e.g. `https://your-server/your-app`)
- Username and password
- API key (optional)
- Company selection — the extension will attempt to auto-discover companies you have access to

### 2. Browse Libraries

Once connected, the **EFx Libraries** panel populates with all accessible libraries. Expand a library to see its functions, and expand further to see table/service/assembly/library references.

### 3. Pull and Edit a Function

Click a function node (or the download icon) to pull its C# code into a `.cs` file. The file opens in the editor and live validation runs automatically — compile errors appear as red squiggles.

### 4. Push Changes

Save the file and click the **upload icon** on the function node, or run `EFx: Push Function Code` from the command palette. The extension pushes the code and verifies the server accepted it.

### 5. Execute a Function

Click the **play icon** on a function node to open the Execute panel. Select a company, fill in the request JSON, and click **Execute**. The response appears below.

### 6. Edit Signatures

In the Execute panel, click **⚙ Edit Signatures** to open the signature editor. Switch between the **Request Params** and **Response Params** tabs to add, edit, or remove parameters. Click **💾 Save to Epicor** to persist changes — this updates the actual function definition in Epicor, exactly as if you'd done it in Function Maintenance.

---

## Commands

| Command | Description |
|---|---|
| `EFx: Manage Profiles` | Create, edit, delete, and activate environment profiles |
| `EFx: Switch Profile` | Quickly switch between configured profiles |
| `EFx: Switch Company` | Switch the active company within the current profile |
| `EFx: Refresh Libraries` | Reload the library list from the server |
| `EFx: Pull Function Code` | Pull a function's C# code to a local file |
| `EFx: Push Function Code` | Push edited code back to Epicor |
| `EFx: Execute Function` | Open the execute panel for a function |
| `EFx: New Library` | Create a new EFx library |
| `EFx: New Function` | Create a new function in a library |
| `EFx: Delete Function` | Delete a function |
| `EFx: Promote to Production` | Promote a library to production |
| `EFx: Demote from Production` | Demote a library from production |
| `EFx: Regenerate / Validate Library` | Regenerate and validate a library |
| `BPM: Refresh BPM Methods` | Reload the BPM method tree |
| `BPM: Pull Directive Code` | Pull a BPM directive's C# code |
| `BPM: Push Directive Code` | Push edited BPM directive code back |

---

## Requirements

- Epicor Kinetic (tested on 2023+)
- REST API access to your Epicor server
- Your Epicor user must have access to `Ice.LIB.EfxLibraryDesignerSvc`
- To use the push/save path via the `Utilities` wrapper library, your user needs EFx execute access to `Utilities.ApplyChangesWithDiagnostics` — if not, the extension falls back to the direct designer service endpoint automatically

---

## Extension Settings

Settings are managed through profiles rather than VS Code settings directly. The following settings are written automatically and should not be edited by hand:

| Setting | Description |
|---|---|
| `efx.profiles` | Array of configured profiles (no secrets — those are in SecretStorage) |
| `efx.activeProfile` | Name of the currently active profile |
| `efx.activeCompany` | Currently selected company |

---

## How Code is Stored Locally

Pulled function code is saved to a `.efx/` folder — either in your workspace root (if a folder is open) or in your home directory. Files are organized as `.efx/{LibraryID}/{FunctionID}.cs`. These files are for editing only; the extension manages pushing them back.

BPM directive code follows the same pattern under `.efx/bpm/{BpMethodCode}/{DirectiveName}.cs`.

---

## Changelog

### 0.3.0
- **Signature editor** — add, edit, and remove request/response parameters directly from the Execute panel and save them to Epicor
- **Multi-company execute** — select which company to execute a function against from the Execute panel
- **Multi-profile support** — manage multiple Epicor environment profiles with secure credential storage
- **Switch Profile / Switch Company** toolbar commands
- **Auto-discover companies** from the server during profile setup
- **BPM Directives** — browse, pull, and push BPM custom code with live diagnostics
- **Raw string tableset handling** throughout — prevents int64 SysRevID corruption that caused optimistic locking errors
- **Library references** — add table, service, assembly, and library references from the tree view

### 0.2.3
- Company dropdown in Execute panel
- Live EFx validation on save with diagnostic squiggles
- New library and new function creation
- Promote / demote / regenerate library commands

### 0.2.0
- Initial release: pull, push, execute EFx functions
- Tree view for libraries and functions
- Basic connection configuration

---

## Known Limitations

- The extension does not support widget-based functions (Kind 0) — only code-based (Kind 2) and widget+code (Kind 1)
- Signature editor does not support `DataSet`/`DataTable` parameter types via the dropdown — use the "Custom…" option and enter the full .NET type name
- BPM directives without custom C# code (widget-only) are shown but cannot be pulled/pushed
