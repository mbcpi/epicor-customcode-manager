"use strict";
// Probe a BPM method for all CustomCodeAction widgets.
// Usage:
//   EFX_PASSWORD=yourpassword node probe-bpm-widgets.js
//
// Targets: Erp.BO.Labor.Update on dev, looking for WarnOverReport directive.

const https = require("https");

const SERVER   = "https://epiwebprod.cpiglobal.net/KDev01Web";
const COMPANY  = "CPI01";
const USERNAME = "bragg_m";
const PASSWORD = process.env.EFX_PASSWORD;
const SOURCE   = "BO";
const METHOD   = "Erp.BO.Labor.Update";

if (!PASSWORD) {
    console.error("Set EFX_PASSWORD env var before running.");
    process.exit(1);
}

const AUTH = "Basic " + Buffer.from(`${USERNAME}:${PASSWORD}`).toString("base64");

function request(url, body) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const parsed  = new URL(url);
        const opts = {
            hostname: parsed.hostname,
            port: parsed.port || 443,
            path: parsed.pathname + parsed.search,
            method: "POST",
            headers: {
                "Authorization": AUTH,
                "Content-Type":  "application/json",
                "Accept":        "application/json",
                "Content-Length": Buffer.byteLength(payload),
            },
        };
        const req = https.request(opts, res => {
            let data = "";
            res.on("data", c => data += c);
            res.on("end", () => {
                try { resolve(JSON.parse(data)); }
                catch(e) { reject(new Error("Bad JSON: " + data.slice(0, 200))); }
            });
        });
        req.on("error", reject);
        req.write(payload);
        req.end();
    });
}

function xmlDecode(str) {
    return str
        .replace(/&#xA;/g, "\n").replace(/&#xD;/g, "\r").replace(/&#x9;/g, "\t")
        .replace(/&quot;/g, '"').replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function findAllCodeActions(body) {
    const results = [];
    let searchFrom = 0;
    let actionIndex = 0;

    while (true) {
        const idx = body.indexOf("CustomCodeAction", searchFrom);
        if (idx < 0) break;

        // Grab ~200 chars before for context (parent element name etc.)
        const contextBefore = body.slice(Math.max(0, idx - 200), idx);

        const codeAttr = 'Code="';
        const codeStart = body.indexOf(codeAttr, idx);
        if (codeStart < 0) { searchFrom = idx + 1; continue; }

        const valueStart = codeStart + codeAttr.length;
        let valueEnd = valueStart;
        while (valueEnd < body.length) {
            if (body[valueEnd] === '"') break;
            if (body[valueEnd] === "&") {
                const semi = body.indexOf(";", valueEnd);
                if (semi < 0) break;
                valueEnd = semi + 1;
                continue;
            }
            valueEnd++;
        }

        const encoded = body.slice(valueStart, valueEnd);
        const code    = xmlDecode(encoded);

        // Try to find a parent label — look for x:Key or Name= attribute nearby
        const keyMatch   = contextBefore.match(/x:Key="([^"]+)"/);
        const nameMatch  = contextBefore.match(/\bName="([^"]+)"/);
        const label = keyMatch?.[1] || nameMatch?.[1] || `Action_${actionIndex}`;

        results.push({ index: actionIndex++, label, code, offset: idx });
        searchFrom = valueEnd + 1;
    }

    return results;
}

async function main() {
    const url = `${SERVER}/api/v2/odata/${COMPANY}/Ice.BO.BpMethodSvc/GetByIDBpMethod`;
    console.log(`Fetching ${METHOD}...`);

    let ts;
    try {
        const res = await request(url, { source: SOURCE, bpMethodCode: METHOD });
        ts = res.returnObj;
    } catch (err) {
        console.error("Request failed:", err.message);
        process.exit(1);
    }

    const directives = ts?.BpDirective || [];
    console.log(`Got ${directives.length} directive(s) total.\n`);

    // Focus on WarnOverReport but show all
    for (const d of directives) {
        const typeLabel = d.DirectiveType === 1 ? "Pre" : d.DirectiveType === 3 ? "Post" : "Base";
        const isTarget  = d.Name === "WarnOverReport";
        console.log(`${"─".repeat(60)}`);
        console.log(`[${typeLabel}] ${d.Name}${isTarget ? " ← TARGET" : ""} (enabled: ${d.IsEnabled})`);

        if (!d.Body) {
            console.log("  (no body)");
            continue;
        }

        const actions = findAllCodeActions(d.Body);
        if (actions.length === 0) {
            console.log("  No CustomCodeAction found — pure widget/condition directive.");
            // Show raw element names present in the body for intelligence
            const elements = [...new Set([...d.Body.matchAll(/\b(\w+Action)\b/g)].map(m => m[1]))];
            if (elements.length) console.log("  Widget elements found:", elements.join(", "));
        } else {
            console.log(`  Found ${actions.length} CustomCodeAction(s):`);
            for (const a of actions) {
                console.log(`\n  [${a.index}] label: ${a.label}`);
                console.log("  " + "·".repeat(40));
                // Print first 20 lines of each code block
                const lines = a.code.split("\n").slice(0, 20);
                lines.forEach(l => console.log("  " + l));
                if (a.code.split("\n").length > 20) {
                    console.log(`  ... (${a.code.split("\n").length - 20} more lines)`);
                }
            }
        }
    }
}

main();
