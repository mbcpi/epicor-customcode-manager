# Contributing to Epicor EFx Manager

Thanks for your interest in contributing! This document explains how to get set up and how to submit changes.

---

## Just want to use the extension?

Head to [Releases](../../releases) and download the latest `.vsix` file. Install it in VS Code via **Extensions → ··· → Install from VSIX**. You don't need to touch the source code at all.

---

## Want to contribute code?

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [VS Code](https://code.visualstudio.com/)
- Access to an Epicor Kinetic environment for testing

### 1. Fork the repo

Click **Fork** at the top right of this page. This creates your own copy of the repo under your GitHub account.

### 2. Clone your fork

```bash
git clone https://github.com/YOUR_USERNAME/epicor-customcode-manager.git
cd epicor-customcode-manager
```

### 3. Install dependencies

```bash
npm install
```

### 4. Make your changes

The extension is built from the files in the `out/` directory. Key files:

| File | Purpose |
|---|---|
| `out/extension.js` | Main entry point — command registration, push/pull logic |
| `out/epicorClient.js` | All Epicor API communication |
| `out/executePanel.js` | Execute function webview panel |
| `out/treeProvider.js` | EFx library tree view |
| `out/bpmClient.js` | BPM directive API communication |
| `out/bpmTreeProvider.js` | BPM method tree view |

### 5. Test your changes

Press **F5** in VS Code to launch an Extension Development Host with your changes loaded. You'll need a configured Epicor profile to test against.

### 6. Package and verify

```bash
npm run package
```

Install the generated `.vsix` and do a quick smoke test against your Epicor environment before submitting.

### 7. Submit a pull request

Push your changes to a branch on your fork:

```bash
git checkout -b my-feature-branch
git add .
git commit -m "Brief description of what changed"
git push origin my-feature-branch
```

Then open a pull request from your fork's branch to `main` on this repo. In the PR description, include:

- What the change does
- How you tested it
- Any Epicor version considerations

---

## Guidelines

- **One thing per PR** — keep changes focused so they're easy to review
- **Test against Epicor** — changes to `epicorClient.js` especially need real server testing since the raw JSON string handling is sensitive
- **Don't break the raw string path** — Epicor uses int64 SysRevID values that JS `JSON.parse` silently corrupts. Always use the raw string manipulation helpers (`_rawSetStringProp`, `_setParentLibraryRowMod`, etc.) when submitting tablesets back to Epicor, never round-trip through `JSON.parse` → `JSON.stringify`
- **Keep the `.efx/` folder out of commits** — this folder contains pulled function code and is local to each developer's workspace

---

## Reporting Issues

Open an issue on GitHub with:
- Your Epicor version
- What you were trying to do
- The error message (check the VS Code Output panel → Extension Host for details)
- Steps to reproduce
