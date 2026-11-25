"use strict";
// Inline MCP App view for show_live_preview: draws the live Kinetic frame and sends
// the user's clicks / keys / scrolls back through the view-only live_input tool.
// The MCP Apps client is the official one, pinned, from unpkg (as in Claude's quickstart).

const LIVE_VIEW_URI = "ui://efx-manager/kinetic-live-preview";

const LIVE_VIEW_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="color-scheme" content="light dark"><title>Kinetic preview</title>
<style>
  :root {
    --fg: var(--color-text-primary, #141413);
    --muted: var(--color-text-tertiary, #73726c);
    --line: var(--color-border-tertiary, rgba(31, 30, 29, .15));
    --ring: var(--color-border-info, #4682d5);
    --font: var(--font-sans, system-ui, sans-serif);
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: transparent; color: var(--fg); font: 12px/1.4 var(--font); }
  .bar { display: flex; align-items: center; gap: 6px; padding: 4px 6px; border-bottom: 1px solid var(--line); }
  .bar .t { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
  .bar .s { color: var(--muted); margin-left: auto; white-space: nowrap; font-variant-numeric: tabular-nums; }
  button { font: inherit; color: inherit; background: transparent; border: 1px solid var(--line); padding: 2px 8px; cursor: pointer; }
  button:hover { border-color: var(--fg); }
  #stage { position: relative; outline: none; }
  #stage:focus-within { outline: 2px solid var(--ring); outline-offset: -2px; }
  #screen { display: block; width: 100%; height: auto; user-select: none; -webkit-user-drag: none; }
  .ping { position: absolute; width: 18px; height: 18px; margin: -9px 0 0 -9px; border: 2px solid var(--ring); border-radius: 50%; pointer-events: none; animation: ping .45s ease-out forwards; }
  @keyframes ping { from { opacity: .9; transform: scale(.4); } to { opacity: 0; transform: scale(1.6); } }
  #msg { padding: 14px 8px; color: var(--muted); display: flex; gap: 8px; align-items: center; }
</style></head>
<body>
<div class="bar">
  <span class="t" id="title">Kinetic preview</span>
  <button id="reload" title="Reload the page to pick up the latest saved draft">Reload</button>
  <button id="full">Full screen</button>
  <span class="s" id="status">connecting</span>
</div>
<div id="stage" tabindex="0">
  <img id="screen" alt="Live Kinetic preview" hidden>
  <div id="msg"><span id="msgText">Opening the preview…</span><button id="reopen" hidden>Reopen</button></div>
</div>
<script type="module">
import { App } from "https://unpkg.com/@modelcontextprotocol/ext-apps@1.7.5/dist/src/app-with-deps.js";
const $ = id => document.getElementById(id);
const app = new App({ name: "EFx Kinetic Preview", version: "1.0.0" }, { availableDisplayModes: ["inline", "fullscreen"] });
const SPECIAL = new Set(["Enter", "Tab", "Backspace", "Escape", "Delete", "ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown", "Home", "End", "PageUp", "PageDown"]);

let args = {}, viewId = null, size = { width: 1280, height: 760 };
let busy = false, queue = [], typed = "", typeTimer = null, wheelDy = 0, wheelTimer = null, full = false, waits = 0;
const MAX_WAITS = 6;   // follow-up frames while Kinetic is still loading (~1.5s each)

const status = t => { $("status").textContent = t; };
function message(text, reopen) {
  $("msg").hidden = false; $("msgText").textContent = text; $("reopen").hidden = !reopen;
  if (reopen) $("screen").hidden = true;
}
function draw(sc) {
  if (!sc || !sc.frame) return;
  $("screen").src = "data:" + (sc.mime || "image/jpeg") + ";base64," + sc.frame;
  $("screen").hidden = false; $("msg").hidden = true;
  if (sc.title) $("title").textContent = sc.title.replace(/\\s*\\|\\s*Preview$/i, "") + (args.layer ? " · " + args.layer : "");
}

async function call(name, extra) {
  const r = await app.callServerTool({ name, arguments: { profile: args.profile, ...extra } });
  if (r.isError) throw new Error((r.content && r.content[0] && r.content[0].text) || name + " failed");
  return r.structuredContent || {};
}

function flushTyped() {
  clearTimeout(typeTimer);
  if (typed) { queue.push({ type: "type", text: typed }); typed = ""; }
}
function send(action) { if (action) queue.push(action); pump(); }
async function pump() {
  if (busy || !viewId) return;
  flushTyped();
  if (!queue.length) return;
  const actions = queue.splice(0, queue.length);
  busy = true; status(actions.some(a => a.type === "reload") ? "reloading" : actions.every(a => a.type === "wait") ? "loading" : "working");
  const t0 = performance.now();
  try {
    const r = await call("live_input", { viewId, actions });
    draw(r);
    const total = Math.round(performance.now() - t0), t = r.timing || {};
    const kin = (t.input || 0) + (t.wait || 0) + (t.shot || 0);
    // bridge = MCP ↔ VS Code handoff + Claude relay; wait = Kinetic settling.
    status(total + " ms · bridge " + Math.max(total - kin, 0) + " · wait " + (t.wait || 0) + " · shot " + (t.shot || 0) + (r.pending ? " · loading" : ""));
    if (actions.some(a => a.type !== "wait")) waits = 0;
    if (r.pending && !queue.length && waits < MAX_WAITS) { waits++; queue.push({ type: "wait" }); }
  } catch (e) {
    viewId = null; queue = []; status("closed");
    message(String(e && e.message || e), true);
  } finally {
    busy = false;
    if (queue.length || typed) pump();
  }
}

function open(sc) {
  if (!sc || !sc.viewId) { message("The preview didn't open.", true); return; }
  viewId = sc.viewId;
  size = { width: sc.width || size.width, height: sc.height || size.height };
  status("loading");
  busy = true;                      // first frame: no actions, just a picture
  call("live_input", { viewId, actions: [] })
    .then(f => { draw(f); status("live"); })
    .catch(e => { viewId = null; message(String(e.message || e), true); status("closed"); })
    .finally(() => { busy = false; pump(); });
}

// pointer → page coordinates
function point(ev) {
  const r = $("screen").getBoundingClientRect();
  return { x: Math.round((ev.clientX - r.left) * size.width / r.width), y: Math.round((ev.clientY - r.top) * size.height / r.height) };
}
// Clicks go out immediately; ev.detail is 2 on a double-click's second click, which
// makes Chrome fire dblclick on its side.
$("screen").addEventListener("click", ev => {
  $("stage").focus();
  const sr = $("stage").getBoundingClientRect(), dot = document.createElement("div");
  dot.className = "ping"; dot.style.left = (ev.clientX - sr.left) + "px"; dot.style.top = (ev.clientY - sr.top) + "px";
  $("stage").appendChild(dot); setTimeout(() => dot.remove(), 500);
  send({ type: "click", ...point(ev), count: ev.detail || 1 });
});
$("screen").addEventListener("wheel", ev => {
  if (document.activeElement !== $("stage")) return;   // don't hijack chat scrolling until clicked into
  ev.preventDefault();
  wheelDy += ev.deltaY;
  const p = point(ev);
  clearTimeout(wheelTimer);
  wheelTimer = setTimeout(() => { const dy = wheelDy; wheelDy = 0; send({ type: "scroll", ...p, dx: 0, dy }); }, 150);
}, { passive: false });
$("stage").addEventListener("keydown", ev => {
  if (!viewId || ev.metaKey || ev.ctrlKey || ev.altKey) return;
  if (ev.key.length === 1) {
    ev.preventDefault();
    typed += ev.key;
    clearTimeout(typeTimer);
    typeTimer = setTimeout(() => pump(), 250);
  } else if (SPECIAL.has(ev.key)) {
    ev.preventDefault();
    flushTyped();
    send({ type: "key", key: ev.key, shift: ev.shiftKey });
  }
});

$("reload").addEventListener("click", () => send({ type: "reload" }));
$("full").addEventListener("click", async () => {
  try {
    const r = await app.requestDisplayMode({ mode: full ? "inline" : "fullscreen" });
    full = r && r.mode === "fullscreen";
    $("full").textContent = full ? "Exit full screen" : "Full screen";
  } catch { /* host refused */ }
});
$("reopen").addEventListener("click", async () => {
  message("Reopening…", false); status("opening");
  try { open(await call("show_live_preview", { app: args.app, layer: args.layer, ...(args.site ? { site: args.site } : {}) })); }
  catch (e) { message(String(e.message || e), true); status("closed"); }
});

app.ontoolinput = p => { if (p && p.arguments) args = { ...args, ...p.arguments }; };
app.ontoolresult = r => {
  if (r && r.isError) { message((r.content && r.content[0] && r.content[0].text) || "The preview didn't open.", true); status("closed"); return; }
  const sc = (r && r.structuredContent) || {};
  args = { ...args, profile: args.profile || sc.profile, app: args.app || sc.app, layer: args.layer || sc.layer };
  open(sc);
};
app.onteardown = async () => { if (viewId) { try { await call("live_close", { viewId }); } catch {} } return {}; };
await app.connect();
</script>
</body></html>`;

module.exports = { LIVE_VIEW_URI, LIVE_VIEW_HTML };
