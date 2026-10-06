// CDP-based screenshot + iframe inspector for sandbox repro.
// Usage: node scripts/cdp_shot.mjs <url> <outPng> [waitMs]
import { writeFileSync } from "node:fs";

const url = process.argv[2];
const out = process.argv[3];
const waitMs = Number(process.argv[4] || 6000);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// find page target
let targets = [];
for (let i = 0; i < 20; i++) {
  try {
    targets = await (await fetch("http://127.0.0.1:9222/json")).json();
    if (targets.length) break;
  } catch {}
  await sleep(300);
}
const page = targets.find((t) => t.type === "page");
if (!page) { console.error("no page target"); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const events = [];
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  } else if (msg.method) {
    events.push(msg);
  }
};
const send = (method, params = {}, sessionId) =>
  new Promise((res) => {
    const mid = ++id;
    pending.set(mid, res);
    ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
  });

await new Promise((r) => (ws.onopen = r));
await send("Page.enable");
await send("Runtime.enable");
await send("Page.navigate", { url });
await sleep(waitMs);

// inspect all targets, including OOPIF iframes
const { targetInfos } = (await send("Target.getTargets")).result;
const report = [];
for (const t of targetInfos) {
  if (t.type !== "iframe" && t.type !== "page") continue;
  try {
    const { sessionId } = (await send("Target.attachToTarget", { targetId: t.targetId, flatten: true })).result;
    const r = await send("Runtime.evaluate", {
      expression: `JSON.stringify({url: location.href.slice(0,60), errs: (window.__errs||null), rootChildren: document.getElementById("root") ? document.getElementById("root").childNodes.length : null, bodyText: document.body ? document.body.innerText.slice(0,80) : null})`,
      returnByValue: true,
    }, sessionId);
    report.push(`${t.type}: ${r.result?.result?.value ?? JSON.stringify(r.result)}`);
    await send("Target.detachFromTarget", { sessionId });
  } catch (e) {
    report.push(`${t.type}: attach failed ${e.message}`);
  }
}
console.log(report.join("\n"));

const shot = await send("Page.captureScreenshot", { format: "png" });
writeFileSync(out, Buffer.from(shot.result.data, "base64"));
console.log("screenshot saved:", out);
process.exit(0);
