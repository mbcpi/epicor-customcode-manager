"use strict";
// Checks GitHub Releases for a newer EFx MCP .mcpb, and can open it so Claude Desktop installs it.
// Version comes from the .mcpb file name (build.js), since release tags follow the extension.

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");

const RELEASES = "https://api.github.com/repos/mbcpi/epicor-customcode-manager/releases?per_page=10";
const HEADERS = { "User-Agent": "epicor-efx-manager-mcp" };
const CURRENT = require("./package.json").version;

// true if a > b
function newer(a, b) {
    const x = a.split(".").map(Number), y = b.split(".").map(Number);
    for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
    return false;
}

async function checkForUpdate() {
    const res = await fetch(RELEASES, { headers: HEADERS });
    if (!res.ok) throw new Error(`GitHub returned ${res.status}`);
    let latest = null;
    for (const r of await res.json()) {
        if (r.draft || r.prerelease) continue;
        for (const a of r.assets) {
            const m = /^epicor-efx-manager-(\d+\.\d+\.\d+)\.mcpb$/.exec(a.name);
            if (m && (!latest || newer(m[1], latest.version))) latest = { version: m[1], file: a.name, url: a.browser_download_url };
        }
    }
    return { current: CURRENT, latest, updateAvailable: !!latest && newer(latest.version, CURRENT) };
}

async function installUpdate() {
    const r = await checkForUpdate();
    if (!r.updateAvailable) return r;
    const res = await fetch(r.latest.url, { headers: HEADERS });
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const dest = path.join(os.tmpdir(), r.latest.file);
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    const [cmd, args] = { darwin: ["open", [dest]], win32: ["cmd", ["/c", "start", "", dest]] }[process.platform] || ["xdg-open", [dest]];
    await new Promise((ok, fail) => execFile(cmd, args, e => (e ? fail(e) : ok())));
    return { ...r, opened: dest };
}

module.exports = { checkForUpdate, installUpdate };
