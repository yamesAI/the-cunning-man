// Check: route structured data and canonicals (SCHEMA-001 §3 + CEO rulings 2026-11-12 08:54, owner 09:05).
// Run: npm run check:schema   (optionally: BUNDLE_DIR=<vite outDir> to also scan a built bundle)

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { routeHead, absUrl, isoDate, SITE_ORIGIN } from "../src/site/structuredData";
import { PRESS } from "../src/site/press";

let n = 0;
function assert(cond: unknown, msg: string) {
  n++;
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

const FORBIDDEN_KEYS = new Set(["offers", "price", "priceCurrency", "priceSpecification", "publisher", "creator",
  "aggregateRating", "review", "featureList", "creativeWorkStatus", "educationalLevel", "dateline"]);
const FORBIDDEN_TYPES = new Set(["Offer", "MonetaryAmount", "PriceSpecification", "Rating", "AggregateRating", "Review",
  "HowTo", "Event", "Observation", "Person", "Place", "Game", "VideoGame", "Claim", "Statement", "NewsArticle",
  "MedicalWebPage", "FinancialProduct", "FinancialService", "InvestmentOrDeposit", "Organization"]);
const FORBIDDEN_TEXT = [/CunningMan AstroTrading/i, /AstroTrading/i, /\bprop[- ]?firm/i, /MonetaryAmount/, /"Offer"/, /"price/i];

function walk(v: unknown, where: string) {
  if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${where}[${i}]`));
  if (v && typeof v === "object") {
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      assert(!FORBIDDEN_KEYS.has(k), `${where}: forbidden key ${k}`);
      if (k === "@type") assert(!FORBIDDEN_TYPES.has(String(x)), `${where}: forbidden @type ${x}`);
      walk(x, `${where}.${k}`);
    }
  }
}

function common(path: string, ld: Record<string, unknown>) {
  const url = absUrl(path);
  assert(ld["@context"] === "https://schema.org", `${path}: @context`);
  assert(ld.url === url, `${path}: url is the route's own (${ld.url})`);
  assert(typeof ld.description === "string" && (ld.description as string).length > 0, `${path}: description`);
  assert(ld.inLanguage === "en", `${path}: inLanguage en`);
  const part = ld.isPartOf as Record<string, unknown>;
  assert(part && part["@type"] === "WebSite" && part.name === "The Cunning Man" && part.url === `${SITE_ORIGIN}/`, `${path}: isPartOf WebSite`);
  const text = JSON.stringify(ld);
  for (const re of FORBIDDEN_TEXT) assert(!re.test(text), `${path}: forbidden text ${re}`);
  walk(ld, path);
}

// 1. known routes emit the expected @type; 5. canonical == url == route
const EXPECT: Record<string, string> = {
  "/": "FAQPage", "/clock": "WebApplication", "/natal": "WebApplication", "/synastry": "WebApplication",
  "/launches": "WebApplication", "/sigil": "WebApplication", "/runes": "WebApplication",
  "/spells/love": "WebPage", "/spells/money": "WebPage", "/press": "CollectionPage",
};
const canonicals = new Set<string>();
for (const [path, type] of Object.entries(EXPECT)) {
  const h = routeHead(path);
  assert(h.jsonLd, `${path}: has JSON-LD`);
  const ld = h.jsonLd!;
  assert(ld["@type"] === type, `${path}: @type ${type} (got ${ld["@type"]})`);
  assert(h.canonical === absUrl(path) && h.canonical === ld.url, `${path}: canonical per route`);
  canonicals.add(h.canonical);
  common(path, ld);
  if (type === "WebApplication") {
    // 2. free tools: isAccessibleForFree, no Offer/price
    assert(ld.isAccessibleForFree === true, `${path}: isAccessibleForFree true`);
    assert(ld.applicationCategory === "LifestyleApplication", `${path}: applicationCategory`);
    assert(typeof ld.operatingSystem === "string", `${path}: operatingSystem`);
  }
  // trailing slash and case resolve to the same route
  if (path !== "/") {
    assert(JSON.stringify(routeHead(path + "/")) === JSON.stringify(h), `${path}/: same as ${path}`);
    assert(routeHead(path.toUpperCase()).canonical === h.canonical, `${path} upper-case: same canonical`);
  }
}
assert(canonicals.size === Object.keys(EXPECT).length, "all route canonicals distinct");

// per-route "do not add" content
const desc = (p: string) => String(routeHead(p).jsonLd!.description);
assert(!/trader|trading|session|entr(y|ies)|do-not-trade/i.test(JSON.stringify(routeHead("/clock").jsonLd)), "/clock: no trading wording");
assert(/traditional electional astrology/i.test(desc("/launches")) && /study and entertainment/i.test(desc("/launches")), "/launches: study and entertainment");
assert(!/business|contract|financ|trad(e|ing)|invest/i.test(JSON.stringify(routeHead("/launches").jsonLd)), "/launches: no business/financial/trading use");
assert(!/advice|compatib/i.test(JSON.stringify(routeHead("/synastry").jsonLd)), "/synastry: no relationship-advice claims");
assert(!/in money|wealth|money/i.test(JSON.stringify(routeHead("/runes").jsonLd)), "/runes: no money meanings");
assert(routeHead("/spells/love").jsonLd!.about === "traditional love working", "/spells/love: about");
assert(!/prosper|wealth|riches/i.test(JSON.stringify(routeHead("/spells/money").jsonLd)), "/spells/money: no prosperity claims");

// /press ItemList
const list = routeHead("/press").jsonLd!.mainEntity as Record<string, unknown>;
const items = list.itemListElement as Record<string, unknown>[];
assert(list["@type"] === "ItemList" && list.numberOfItems === PRESS.length && items.length === PRESS.length, "/press: ItemList size matches PRESS");
items.forEach((it, i) => {
  assert(it["@type"] === "ListItem" && it.position === i + 1, `/press item ${i}: ListItem position`);
  assert(it.url === absUrl(`/press/${PRESS[i].slug}`) && it.name === PRESS[i].title, `/press item ${i}: url + name`);
});

// /press/:slug -> Article (not NewsArticle), including trading-clock (owner 2026-11-12 09:05)
for (const p of PRESS) {
  const path = `/press/${p.slug}`;
  const h = routeHead(path);
  assert(h.canonical === absUrl(path), `${path}: canonical per slug`);
  canonicals.add(h.canonical);
  const ld = h.jsonLd!;
  assert(ld && ld["@type"] === "Article", `${path}: Article`);
  assert(ld.headline === p.title && ld.description === p.excerpt, `${path}: headline + description`);
  assert(ld.datePublished === isoDate(p.date) && /^\d{4}-\d{2}-\d{2}$/.test(String(ld.datePublished)), `${path}: ISO datePublished`);
  common(path, ld);
}
assert(isoDate("September 1, 2026") === "2026-09-01", "isoDate example");
assert(isoDate("not a date") === null, "isoDate rejects junk");

// 4. unknown paths and slugs: no FAQPage / Article, never another item's block
for (const path of ["/nope", "/clock/extra", "/press/nope", "/press/LAUNCH", "/press/launch/x", "/spells", "/spells/other", "/index.html"]) {
  const h = routeHead(path);
  assert(h.jsonLd === null, `${path}: unknown -> no JSON-LD`);
}
assert(routeHead("/press/nope").canonical === absUrl(`/press/${PRESS[0].slug}`), "/press/nope: canonical to fallback content");
assert(routeHead("/nope").canonical === `${SITE_ORIGIN}/`, "/nope: canonical root");

// App.tsx routes all covered
const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const routes = [...app.matchAll(/path="([^"]+)"/g)].map((m) => m[1]).filter((r) => r !== "*" && r !== "/press/:slug");
for (const r of routes) assert(EXPECT[r], `App route ${r} has expected structured data`);

// 6. source: index.html WebSite kept, no price fields; no page-level JSON-LD outside the table
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
assert(ldBlocks.length === 1 && ldBlocks[0]["@type"] === "WebSite" && ldBlocks[0].name === "The Cunning Man", "index.html: WebSite kept");
for (const re of FORBIDDEN_TEXT) assert(!re.test(JSON.stringify(ldBlocks)), `index.html JSON-LD: forbidden ${re}`);
function srcFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? srcFiles(join(dir, e.name)) : /\.(tsx?|html)$/.test(e.name) ? [join(dir, e.name)] : []);
}
const srcDir = new URL("../src", import.meta.url).pathname;
for (const f of srcFiles(srcDir)) {
  const s = readFileSync(f, "utf8");
  assert(!/"@type":\s*"(Offer|MonetaryAmount)"|priceCurrency|\bprice:\s*"/.test(s), `${f}: no Offer/price fields`);
  if (!/structuredData\.ts$/.test(f)) assert(!/"@context":\s*"https:\/\/schema\.org"/.test(s), `${f}: JSON-LD only via structuredData.ts`);
}

// optional: scan a built bundle
const bundle = process.env.BUNDLE_DIR;
if (bundle && existsSync(bundle)) {
  const files = srcFiles(bundle).concat(readdirSync(join(bundle, "assets")).filter((f) => f.endsWith(".js")).map((f) => join(bundle, "assets", f)));
  for (const f of files) {
    const s = readFileSync(f, "utf8");
    assert(!/MonetaryAmount|priceCurrency|"Offer"|@type":"Offer|CunningMan AstroTrading/.test(s), `${f}: bundle free of Offer/price/firm brand`);
  }
  console.log(`bundle scanned: ${files.length} files in ${bundle}`);
}

console.log(`check:schema OK — ${n} assertions`);
