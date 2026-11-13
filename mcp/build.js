#!/usr/bin/env node
"use strict";
// Builds the Claude Desktop bundle (.mcpb) for the EFx MCP server.
//
//   dist/server/index.js   server.js + @modelcontextprotocol/sdk bundled into one file
//   dist/manifest.json     MCPB manifest (tools list generated from server.js)
//   ../epicor-efx-manager-<version>.mcpb
//
// Node ships with Claude Desktop, so users only double-click the .mcpb.
// Run from mcp/ after `npm ci`: `npm run build`. esbuild comes from the
// extension's own devDependencies one folder up.

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const here = __dirname;
const dist = path.join(here, "dist");
const pkg = require("./package.json");
const ext = require("../package.json");

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, "server"), { recursive: true });

require("esbuild").buildSync({
    entryPoints: [path.join(here, "server.js")],
    outfile: path.join(dist, "server", "index.js"),
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node18",
    logLevel: "warning",
});

const { TOOLS } = require("./server.js");
const manifest = {
    manifest_version: "0.3",
    name: "epicor-efx-manager",
    display_name: "Epicor EFx Manager",
    version: pkg.version,
    description: "Let Claude list, search, pull, compare and push Epicor Kinetic EFx functions and BPM directives through the Epicor EFx Manager VS Code extension. The extension makes every Epicor call; this server never sees credentials.",
    author: { name: "Micah Bragg" },
    repository: { type: "git", url: ext.repository.url },
    homepage: ext.repository.url.replace(/\.git$/, "") + "#using-with-claude-mcp-server",
    license: "MIT",
    server: {
        type: "node",
        entry_point: "server/index.js",
        mcp_config: { command: "node", args: ["${__dirname}/server/index.js"], env: {} },
    },
    tools: [
        { name: "list_profiles", description: "Profiles configured in the EFx extension and their Claude access level." },
        ...TOOLS.map(t => ({ name: t.name, description: t.description.replace(/\s*\[needs Claude access: \w+\]$/, "") })),
    ],
    tools_generated: false,
    compatibility: { platforms: ["darwin", "win32", "linux"], runtimes: { node: ">=18.0.0" } },
};
fs.writeFileSync(path.join(dist, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

const out = path.join(here, "..", `epicor-efx-manager-${pkg.version}.mcpb`);
execFileSync("npx", ["-y", "@anthropic-ai/mcpb", "pack", dist, out], { stdio: "inherit", shell: process.platform === "win32" });
console.log(`built ${path.relative(process.cwd(), out)}`);
