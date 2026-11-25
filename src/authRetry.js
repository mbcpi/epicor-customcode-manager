"use strict";
// Shared by the HTTP clients. send(authHeaders) once; on a 401 from a profile
// whose auth can retry (Entra), get headers again and try exactly one more time.
// No vscode import, so the clients stay usable outside the extension host.

async function withAuthRetry(config, send) {
    try {
        return await send(await config.authHeaders());
    } catch (e) {
        if (e.status !== 401 || !config.retry401) throw e;
    }
    try {
        return await send(await config.authHeaders({ retry: true }));
    } catch (e) {
        if (e.status === 401) {
            throw Object.assign(new Error("Epicor rejected the Entra token (HTTP 401) — run EFx: Sign In."), { code: "login-required", status: 401 });
        }
        throw e;
    }
}

module.exports = { withAuthRetry };
