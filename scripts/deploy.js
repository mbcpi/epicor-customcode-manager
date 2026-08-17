#!/usr/bin/env node
"use strict";
// Copy this build over every installed copy of the extension so a reload picks
// it up, without packaging a .vsix.
//
// Two things the old one-line `cp` got wrong, both of which cost real debugging
// time: it hardcoded a version-stamped folder (which stops existing the moment
// the version is bumped), and it copied only out/extension.js — so any change
// to commands, menus, or keybindings appeared to do nothing, because those live
// in package.json.

const fs = require("fs");
const os = require("os");
const path = require("path");

const repo = path.resolve(__dirname, "..");
const { name, publisher, version } = require(path.join(repo, "package.json"));
const idPrefix = `${publisher}.${name}-`;

// Every editor that keeps VS Code-style extension folders.
const roots = [".vscode", ".antigravity", ".vscode-insiders", ".cursor", ".windsurf"]
    .map(d => path.join(os.homedir(), d, "extensions"));

// package.json must land too, or manifest-only changes are invisible.
const files = ["package.json", path.join("out", "extension.js")];

// Optional args narrow which installs to touch: `npm run deploy -- .vscode`.
const filters = process.argv.slice(2).filter(a => !a.startsWith("-"));

const targets = [];
for (const root of roots) {
    if (filters.length && !filters.some(f => root.includes(f))) continue;
    let entries;
    try { entries = fs.readdirSync(root); } catch { continue; }
    for (const entry of entries) {
        if (!entry.startsWith(idPrefix)) continue;
        const dir = path.join(root, entry);
        if (fs.statSync(dir).isDirectory()) targets.push(dir);
    }
}

if (!targets.length) {
    console.error(`No installed copy of ${idPrefix}* found under:\n  ${roots.join("\n  ")}`);
    console.error("Install it once with `npm run package` + `code --install-extension <vsix>`, then re-run deploy.");
    process.exit(1);
}

for (const dir of targets) {
    for (const rel of files) {
        const dest = path.join(dir, rel);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(path.join(repo, rel), dest);
    }
    // The folder name carries the version the editor reports; leaving a stale
    // name is harmless for loading but confusing to read, so say what we saw.
    const installed = path.basename(dir).slice(idPrefix.length);
    const note = installed === version ? "" : `  (folder says ${installed}, now running ${version})`;
    console.log(`deployed → ${dir}${note}`);
}

console.log(`\n${targets.length} target(s) updated. Reload the editor window to pick it up.`);
