"use strict";
// Chrome for Entra sign-in (used by auth.js). One browser profile for both
// modes, so Microsoft's "stay signed in" cookie is shared between them:
//
//   window — small app-style Chrome window (no tabs / address bar) for sign-in
//   silent — hidden Chrome, nothing shown; prompt=none renewals
//
// Each mode opens the Microsoft authorize URL, catches the browser's request to
// the redirect page before that page loads, and resolves with the full redirect
// URL (code + state in the query). The browser closes afterwards.
//
// No vscode import.

const { getBrowser, closeBrowser } = require("./kineticPreview");

const KIND = { silent: "signinHidden", window: "signin" };
const SIGNED_IN_PAGE = "<!doctype html><meta charset=utf-8><title>Signed in</title><body style=\"font:15px -apple-system,Segoe UI,sans-serif;padding:40px\">Signed in to EFx Manager. This window closes by itself.</body>";

function err(message, extra) { return Object.assign(new Error(message), extra || {}); }

// opts: { mode, url, redirectPrefix, userDataDir, timeoutMs }
// Returns { done: Promise<redirectUrl>, close() }.
// done rejects with .cancelled (closed/cancelled), .timeout, or .browser (Chrome
// couldn't start / CDP failed before the login page loaded).
function open(opts) {
    const { mode, url, redirectPrefix, userDataDir, timeoutMs = 5 * 60 * 1000 } = opts;
    const kind = KIND[mode];
    let cancelNow = null;      // rejects the pending sign-in as cancelled, once it exists
    let closed = false;

    const done = (async () => {
        let browser;
        try { browser = await getBrowser(kind, userDataDir); }
        catch (e) { throw err(`Couldn't start Chrome or Edge for sign-in: ${e.message}`, { browser: true }); }
        const { cdp, proc } = browser;
        let off = () => {};
        try {
            let targetId;
            if (mode === "window") {
                // The app window opened with its own page — use it.
                const { targetInfos } = await cdp.send("Target.getTargets");
                const page = targetInfos.find(t => t.type === "page");
                targetId = page ? page.targetId : (await cdp.send("Target.createTarget", { url: "about:blank", newWindow: true })).targetId;
            } else {
                targetId = (await cdp.send("Target.createTarget", { url: "about:blank" })).targetId;
            }
            const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
            const s = (method, params) => cdp.send(method, params, sessionId);

            const result = new Promise((resolve, reject) => {
                let settled = false;
                const gone = () => finish(reject, err("Sign-in was cancelled.", { cancelled: true }));
                const timer = setTimeout(() => finish(reject, err("Sign-in timed out.", { timeout: true })), timeoutMs);
                function finish(fn, v) {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timer);
                    proc.removeListener("exit", gone);
                    fn(v);
                }
                cancelNow = gone;
                proc.once("exit", gone);
                off = cdp.on(msg => {
                    if (msg.sessionId === sessionId && msg.method === "Fetch.requestPaused") {
                        s("Fetch.fulfillRequest", {
                            requestId: msg.params.requestId, responseCode: 200,
                            responseHeaders: [{ name: "Content-Type", value: "text/html; charset=utf-8" }],
                            body: Buffer.from(SIGNED_IN_PAGE).toString("base64"),
                        }).catch(() => {});
                        finish(resolve, msg.params.request.url);
                    } else if ((msg.method === "Target.targetDestroyed" && msg.params.targetId === targetId)
                        || (msg.method === "Target.detachedFromTarget" && msg.params.sessionId === sessionId)) {
                        gone();
                    }
                });
            });

            if (closed) throw err("Sign-in was cancelled.", { cancelled: true });
            await cdp.send("Target.setDiscoverTargets", { discover: true }).catch(() => {});
            await s("Fetch.enable", { patterns: [{ urlPattern: `${redirectPrefix}*`, requestStage: "Request" }] });
            await s("Page.enable");
            await s("Page.navigate", { url });
            if (mode === "window") await s("Page.bringToFront").catch(() => {});
            return await result;
        } catch (e) {
            if (e.cancelled || e.timeout || e.browser) throw e;
            if (closed) throw err("Sign-in was cancelled.", { cancelled: true });
            throw err(`Sign-in browser failed: ${e.message}`, { browser: true });
        } finally {
            off();
            setTimeout(() => { closeBrowser(kind); }, mode === "window" ? 800 : 0);
        }
    })();

    function close() {
        closed = true;
        if (cancelNow) cancelNow();
        closeBrowser(kind);
    }
    return { done, close };
}

// Convenience: run a mode to completion and return the redirect URL.
function capture(opts) {
    return open(opts).done;
}

module.exports = { open, capture };
