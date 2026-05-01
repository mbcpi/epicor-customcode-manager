# Epicor EFx Manager

Pull, edit, push, and execute Epicor Kinetic EFx Functions directly from VS Code.

## Features

- **Library Tree View** — Browse all EFx libraries and functions in the sidebar
- **Pull** — Click a function to pull its C# code into a local editor tab
- **Edit** — Full VS Code editing with syntax highlighting, search/replace, etc.
- **Push** — Save your changes back to Epicor with compile diagnostics
- **Execute** — Test functions with a request/response panel
- **Promote/Demote** — Manage library promotion status from context menus

## Setup

1. Open the Command Palette (`Ctrl+Shift+P`) and run **EFx: Configure Connection**
2. Enter your Epicor server URL, company code, username, password, and API key
3. The library tree will populate in the sidebar

## Workflow

1. Click the **EFx Explorer** icon in the activity bar
2. Expand a library to see its functions
3. Click a function to pull the code into an editor tab
4. Edit the code
5. Right-click the function in the tree → **Push Function Code**
6. Check diagnostics for any compile errors
7. Right-click the library → **Promote to Production** when ready

## Requirements

- Epicor Kinetic with REST API v2 enabled
- API key configured on the Epicor server
- User account with EFx development permissions
