# Layer edit + preview (MCP only)

Lets Claude pull a Kinetic layer's JSON, edit it, save it as a draft, and see
real Kinetic render the draft. No extension UI: these are bridge ops that only
the MCP calls.

## Ops

| op | level | does |
|---|---|---|
| `list_layers` | read | GetLayers for one app (unpublished included) |
| `get_layer` | read | GetApp (AppStudio mode) → `<profile>/KineticLayers/<app>/<layer>.json` |
| `save_layer` | write | that file → SaveApp as a draft (`WIP: true`). Server copy backed up first |
| `preview_layer` | read | headless Chrome opens the App Studio preview URL for the draft → PNG |
| `open_preview` | read | same page, signed in, in a visible Chrome window to click around |
| `show_live_preview` → `live_open` | read | live, clickable preview inline in the chat (MCP App) |
| `live_input` / `live_close` | read | view-only: replay clicks/keys/scroll, return a JPEG frame / close |

Publishing stays out of scope. When it comes, it's its own `risky` op.

## Boundary

The extension makes every Epicor call and holds every credential, as with the
other ops. The MCP only writes requests, reads results, and turns the preview
PNG into an image for Claude.

## Local layer file

```json
{ "app": "Ice.UIDbd.X", "layer": "V1_..._MB", "subType": "Dashboard",
  "pulledAt": "...", "serverChangedOn": "...",
  "content": { "layout": {}, "events": [], "dataviews": [], "pages": [],
               "rules": [], "tools": [], "orphans": [] } }
```

GetApp → SaveApp field map: `Layout→layout, Events→events, DataViews→dataviews,
Pages→pages, Rules→rules, ToolBar→tools, Orphans→orphans`. The file holds exactly
what gets saved. These rules come from real App Studio SaveApp captures (a base app
layer, Erp.UI.ReqEntry, and a dashboard, Ice.UIDbd.CPI_JobClosingExTk):

- **Events:** dashboards send every event. Layers on base apps send only the
  layer's own events, the ones carrying `mode` (`A`/`U`/`D`), so 1 of 201 for
  ReqEntry. Base events have no `mode`. `D` events are sent (App Studio does).
- **PatchInfo tokens go back in:** GetApp resolves e.g. `navigation.dataSetId`
  `%datasetId%` → `"Req"`, and App Studio saves the token.
- **`layoutData`:** stamped on top-level components for dashboards only.
- **`serializedEvents`:** App Studio sends its event-editor diagram (node
  positions). GetApp doesn't return it, so this sends `null`; event logic is
  unaffected.

Checked against the ReqEntry capture: identical apart from page order and
`serializedEvents`. Unit tests: `npm test`.

`layerInfo` comes from a fresh GetLayers row at save time, with
`WIP: true, HasDraftContent: true`. If the row's `ChangedOn` moved since the
pull, save refuses unless `force`.

## Preview

URL (captured from App Studio's Preview button):

```
<server>/Apps/Erp/Home/#/view/preview/<app>?channelid=<guid>&preview=true
  &layerVersion=0&baseAppVersion=0&layerNames=<layer>&company=<co>[&site=<site>]&autoload=false
```

This renders the saved draft. It doesn't need an App Studio tab.

Sign-in mirrors Kinetic's own login, captured on pilot:

1. `POST <server>/api/TokenResource/`: `Authorization: Basic`, form-urlencoded, empty
   body → `{AccessToken, ExpiresIn: 9999}`
2. `POST <server>/api/v2/Ice.Lib.SessionModSvc/Login`: `Bearer <token>`,
   `callSettings: {"Company":"","Plant":""}`, body `{}` → session id
3. Before the app boots:
   - cookie `homepage__erp.token.auth` = urlencoded
     `{url, userId, password: "", token, createdUTC, expiresUTC, expiresInSecs}`,
     path `/<instance>/Apps/Erp/Home`, secure, SameSite=Strict
   - localStorage `appData.khp/<instance>/apps/erp/home/` =
     `{ ep.session.server: {authMethod 1, serverUrl, userId, ...static},
        khp.settings: {SessionId, IsValidSession, UserId, CurrentAuthMode: 1, AppServerUrl, LicenseType: "Default"} }`

That localStorage set is the minimum, found by stripping the real blob on pilot:
the cookie alone gives the login form, a missing `LicenseType` gives "Invalid Session —
login again to change license type", and no `ep.session.server` never loads.
Kinetic rebuilds the rest (~22KB) itself. No password enters the page.

One session per server+user is reused until 5 min before the token expires. If
Kinetic rejects a reused session, the preview retries once with a fresh one.

Browser: installed Chrome/Edge/Chromium (`EFX_PREVIEW_BROWSER` overrides),
`--headless=new --remote-debugging-pipe`. That's the debugging protocol over stdio:
no port, no WebSocket, no new library. One browser per VS Code session, its own
user-data-dir per EFx profile, closed after 10 idle minutes or on extension
shutdown. PNG goes to `<profile>/_claude/previews/<app>__<layer>.png`.

## Failure modes

- No Chrome/Edge found → error naming the paths tried and `EFX_PREVIEW_BROWSER`.
- Session not accepted (stays on `#/login`, or "Invalid Session") → one retry with a
  fresh session, then an error plus a screenshot of what Kinetic showed.
- TokenResource / Login HTTP error → error with the status and body.
- Page never settles → screenshot anyway, `settled: false`.
- Layer not found / app not found → error from GetLayers / GetApp.
- Layer changed on server since pull → save refuses unless `force`.

## Test plan (pilot, throwaway layer)

1. `list_layers` → `get_layer` → `save_layer` unchanged → `get_layer` again → diff = empty.
2. `preview_layer` renders, not the login page.
3. Edit a label in the file → `save_layer` → `preview_layer` shows the change.

## Inline live preview (MCP App)

`show_live_preview` carries `_meta.ui.resourceUri = ui://efx-manager/kinetic-live-preview`,
so Claude renders `mcp/liveView.js` inline under the tool call. The extension keeps a
preview page open in the headless browser (15 idle minutes); the view sends the
user's clicks, keys and scrolls through `live_input` (`_meta.ui.visibility: ["app"]`,
so Claude never calls it) and draws the JPEG frame it returns. Reload = Page.reload,
which re-seeds the session and picks up the latest saved draft. Inputs that change
data in Kinetic do change data on that server: it's real Kinetic.

The view loads the official MCP Apps client, pinned
(`@modelcontextprotocol/ext-apps@1.7.5`, from unpkg, declared in the resource's
`csp.resourceDomains`), as Claude's quickstart does. No npm dependency. The server
side adds `_meta` and the `ui://` resource on the existing low-level `Server`.
