#!/usr/bin/env node
"use strict";
// Dev helper: send one Claude-bridge request to the running EFx extension, without
// the MCP, and print the result. Uses VS Code's active profile from bridge.json.
//
//   node scripts/efx-request.js <op> [app] [layer] [extra-json]
//   node scripts/efx-request.js open_preview Ice.UIDbd.CPI_AppServerErrors PUBLISH
//   node scripts/efx-request.js save_layer   Ice.UIDbd.CPI_AppServerErrors PUBLISH '{"force":true}'

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const [op, app, layer, extra] = process.argv.slice(2);
if (!op) { console.error("usage: node scripts/efx-request.js <op> [app] [layer] [extra-json]"); process.exit(1); }

const bridge = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".efx-manager", "bridge.json"), "utf-8"));
if (!bridge.requestDir) { console.error("No active EFx profile / storage location in VS Code."); process.exit(1); }

const args = { ...(app ? { app } : {}), ...(layer ? { layer } : {}), ...(extra ? JSON.parse(extra) : {}) };
const id = crypto.randomUUID();
const file = path.join(bridge.requestDir, `${id}.json`);
fs.mkdirSync(bridge.requestDir, { recursive: true });
fs.writeFileSync(`${file}.tmp`, JSON.stringify({ id, profile: bridge.activeProfile, op, args, createdAt: new Date().toISOString() }));
fs.renameSync(`${file}.tmp`, file);
console.error(`${op} → ${bridge.activeProfile} (${id})`);

const resultFile = path.join(bridge.requestDir, `${id}.result.json`);
const started = Date.now();
const timer = setInterval(() => {
    if (fs.existsSync(resultFile)) {
        clearInterval(timer);
        const result = fs.readFileSync(resultFile, "utf-8");
        for (const f of [resultFile, path.join(bridge.requestDir, `${id}.ack.json`)]) fs.rmSync(f, { force: true });
        console.log(result);
        process.exit(JSON.parse(result).ok ? 0 : 2);
    }
    if (Date.now() - started > 180000) {
        clearInterval(timer);
        console.error("No result after 3 minutes. Is VS Code running with EFx Manager and this profile active?");
        process.exit(1);
    }
}, 500);
