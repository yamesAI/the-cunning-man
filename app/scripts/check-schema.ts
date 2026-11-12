// Check: route structured data and canonicals (SCHEMA-001 §3 + CEO rulings 2026-11-12 08:54, owner 09:05).
// Run: npm run check:schema   (optionally: BUNDLE_DIR=<vite outDir> to also scan a built bundle)

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { routeHead, absUrl, isoDate, SITE_ORIGIN } from "../src/site/structuredData";
import { PRESS } from "../src/site/press";
import { LIBRARY_BOOKS, LIBRARY_DESCRIPTION, LIBRARY_SUBTITLE, LIBRARY_TERMS } from "../src/site/library";
import { TESTIMONY } from "../src/data/tradition";

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

// SKY-001 §5: /sky alone may carry featureList (checked exactly below).
const ALLOWED_KEYS: Record<string, Set<string>> = { "/sky": new Set(["featureList"]) };
// LIB-001 §4: /library Books alone may name a historical author/translator as
// Person (name only; checked exactly below). Everywhere else Person stays forbidden.
const ALLOWED_TYPES: Record<string, Set<string>> = { "/library": new Set(["Person"]) };

function walk(v: unknown, where: string, allow: Set<string> = new Set(), allowTypes: Set<string> = new Set()) {
  if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${where}[${i}]`, allow, allowTypes));
  if (v && typeof v === "object") {
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      assert(!FORBIDDEN_KEYS.has(k) || allow.has(k), `${where}: forbidden key ${k}`);
      if (k === "@type") assert(!FORBIDDEN_TYPES.has(String(x)) || allowTypes.has(String(x)), `${where}: forbidden @type ${x}`);
      walk(x, `${where}.${k}`, allow, allowTypes);
    }
  }
}

// LIB-001 §6: the market-study definition is the brief's verbatim negative
// ("Not trading signals, prices, financial advice, or prop-firm claims."). Only
// those DefinedTerm descriptions are blanked before the text scan; they are
// asserted equal to the brief wording in the /library block below.
function withoutTermDefinitions(ld: Record<string, unknown>): Record<string, unknown> {
  const set = ld.hasPart as Record<string, unknown>;
  const terms = (set.hasDefinedTerm as Record<string, unknown>[]).map((t) => ({ ...t, description: "" }));
  return { ...ld, hasPart: { ...set, hasDefinedTerm: terms } };
}

function common(path: string, ld: Record<string, unknown>) {
  const url = absUrl(path);
  assert(ld["@context"] === "https://schema.org", `${path}: @context`);
  assert(ld.url === url, `${path}: url is the route's own (${ld.url})`);
  assert(typeof ld.description === "string" && (ld.description as string).length > 0, `${path}: description`);
  assert(ld.inLanguage === "en", `${path}: inLanguage en`);
  const part = ld.isPartOf as Record<string, unknown>;
  assert(part && part["@type"] === "WebSite" && part.name === "The Cunning Man" && part.url === `${SITE_ORIGIN}/`, `${path}: isPartOf WebSite`);
  const text = JSON.stringify(path === "/library" ? withoutTermDefinitions(ld) : ld);
  for (const re of FORBIDDEN_TEXT) assert(!re.test(text), `${path}: forbidden text ${re}`);
  walk(ld, path, ALLOWED_KEYS[path], ALLOWED_TYPES[path]);
}

// 1. known routes emit the expected @type; 5. canonical == url == route
const EXPECT: Record<string, string> = {
  "/": "FAQPage", "/clock": "WebApplication", "/natal": "WebApplication", "/synastry": "WebApplication",
  "/launches": "WebApplication", "/sky": "WebApplication", "/sigil": "WebApplication", "/runes": "WebApplication",
  "/spells/love": "WebPage", "/spells/money": "WebPage", "/press": "CollectionPage", "/library": "CollectionPage",
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

// /sky (SKY-001 §5): exact description and featureList, free, no Offer/price, no trading wording, no result CreativeWork
{
  const ld = routeHead("/sky").jsonLd!;
  const text = JSON.stringify(ld);
  assert(ld.name === "The Cunning Man — Session Sky", "/sky: name");
  assert(ld.description === "Traditional sky for a time window you choose: essential dignities, planetary hours and the Moon, computed in your browser. For entertainment and study.", "/sky: description");
  assert(/for entertainment and study/i.test(desc("/sky")), "/sky: entertainment and study wording");
  assert(ld.isAccessibleForFree === true && ld.operatingSystem === "Any (web browser)", "/sky: free, any browser");
  assert(JSON.stringify(ld.featureList) === JSON.stringify(["Essential dignities", "Planetary hours", "Moon phase, sign and mansion"]), "/sky: featureList exactly three items");
  assert(!/Offer|price|MonetaryAmount|offers/i.test(text), "/sky: no Offer/price/MonetaryAmount");
  assert(!/CreativeWork|temporalCoverage|isBasedOn/.test(text), "/sky: no result CreativeWork in v0");
  assert(!/\btrad(e|es|er|ers|ing)\b|\bentr(y|ies)\b|\bexit|signal|\bbuy\b|\bsell\b|\bedge\b|win rate|profit|market|ticker|funded|prop[- ]?firm|advice|disclaimer|forecast/i.test(text), "/sky: no trading/advice wording");
  assert(Object.keys(ld).sort().join(",") === "@context,@type,applicationCategory,description,featureList,inLanguage,isAccessibleForFree,isPartOf,name,operatingSystem,url", "/sky: only the §5 properties");
}

// /press ItemList
const list = routeHead("/press").jsonLd!.mainEntity as Record<string, unknown>;
const items = list.itemListElement as Record<string, unknown>[];
assert(list["@type"] === "ItemList" && list.numberOfItems === PRESS.length && items.length === PRESS.length, "/press: ItemList size matches PRESS");
items.forEach((it, i) => {
  assert(it["@type"] === "ListItem" && it.position === i + 1, `/press item ${i}: ListItem position`);
  assert(it.url === absUrl(`/press/${PRESS[i].slug}`) && it.name === PRESS[i].title, `/press item ${i}: url + name`);
});

// /library (LIB-001 §4–§7, CEO D-1–D-5): CollectionPage -> ItemList of the four
// cited Books (metadata only) + DefinedTermSet of three facets. No Library type,
// no Offer/price, not press items, not the AI vs the Sky PDF.
{
  const ld = routeHead("/library").jsonLd!;
  const text = JSON.stringify(ld);
  const types = [...text.matchAll(/"@type":"([^"]+)"/g)].map((m) => m[1]);
  assert(ld.name === "The Cunning Man — Library", "/library: name");
  assert(ld.url === "https://cunning-man.vercel.app/library", "/library: absolute url");
  assert(ld.isAccessibleForFree === true, "/library: isAccessibleForFree true");
  assert(Object.keys(ld).sort().join(",") === "@context,@type,description,hasPart,inLanguage,isAccessibleForFree,isPartOf,mainEntity,name,url", "/library: only the §4 page properties");
  const LIB_TYPES = ["CollectionPage", "WebSite", "ItemList", "ListItem", "Book", "Person", "DefinedTerm", "DefinedTermSet"];
  assert(LIB_TYPES.every((t) => types.includes(t)), "/library: uses CollectionPage, WebSite, ItemList, ListItem, Book, Person, DefinedTerm, DefinedTermSet");
  for (const t of types) assert(LIB_TYPES.includes(t), `/library: allowed @type ${t}`);
  assert(!/"(Library|LibrarySystem|EsotericLibrary|Article|CreativeWork|DigitalDocument|NewsArticle)"/.test(text), "/library: no Library/LibrarySystem/invented or non-v0 types");
  assert(!/"Offer"|"offers"|MonetaryAmount|"publisher"|"creator"|"isbn"|"numberOfPages"|"articleBody"|"genre"|"disclaimer"/.test(text) && !/offer|publisher|creator|isbn|genre|disclaimer/i.test(JSON.stringify(withoutTermDefinitions(ld))), "/library: no Offer/MonetaryAmount/publisher/creator/isbn/pages/body/genre/disclaimer");
  assert(!/price/i.test(JSON.stringify(withoutTermDefinitions(ld))), "/library: no price outside the brief's verbatim market-study definition");
  assert(!/AstroTrading|ai-vs-the-sky|AI vs the Sky|\.pdf/i.test(text), "/library: no firm brand, no AI vs the Sky PDF");
  assert(!/\/press/.test(text), "/library: no press URLs");

  const list = ld.mainEntity as Record<string, unknown>;
  const els = list.itemListElement as Record<string, unknown>[];
  assert(list["@type"] === "ItemList" && list.numberOfItems === 4 && els.length === 4 && LIBRARY_BOOKS.length === 4, "/library: ItemList of exactly 4");
  const want = [
    { name: "Christian Astrology", author: "William Lilly", year: "1647", url: "https://archive.org/details/ca-william-lilly" },
    { name: "Tetrabiblos", author: "Claudius Ptolemy", year: "1822", url: "https://www.sacred-texts.com/astro/ptb/ptb07.htm", translator: "J. M. Ashmand" },
    { name: "Astrologia Restaurata", author: "William Ramesey", year: "1653", url: "https://archive.org/details/b30323149_0001" },
    { name: "Liber Astronomiae (146 Considerations)", author: "Guido Bonatti", year: "1676", url: "https://archive.org/details/astrologersguide00lill", translator: "Henry Coley" },
  ];
  const cited = new Set(TESTIMONY.map((t) => t.verifiedUrl));
  const pressTitles = new Set(PRESS.map((p) => p.title));
  els.forEach((el, i) => {
    const w = want[i];
    assert(el["@type"] === "ListItem" && el.position === i + 1 && Object.keys(el).sort().join(",") === "@type,item,position", `/library item ${i}: ListItem position + item`);
    const b = el.item as Record<string, unknown>;
    const keys = ["@type", "author", "datePublished", "description", "inLanguage", "isAccessibleForFree", "keywords", "name", "url", ...(w.translator ? ["translator"] : [])].sort();
    assert(Object.keys(b).sort().join(",") === keys.join(","), `/library item ${i}: metadata-only Book properties`);
    assert(b["@type"] === "Book" && b.name === w.name && b.url === w.url && b.datePublished === w.year, `/library item ${i}: Book ${w.name} ${w.year}`);
    assert(b.inLanguage === "en" && b.isAccessibleForFree === true, `/library item ${i}: en, free`);
    assert(JSON.stringify(b.author) === JSON.stringify({ "@type": "Person", name: w.author }), `/library item ${i}: author Person name only`);
    if (w.translator) assert(JSON.stringify(b.translator) === JSON.stringify({ "@type": "Person", name: w.translator }), `/library item ${i}: translator Person name only`);
    const kw = b.keywords as Record<string, unknown>;
    assert(kw["@type"] === "DefinedTerm" && kw.termCode === "esoteric" && kw.name === "esoteric", `/library item ${i}: keywords -> esoteric DefinedTerm`);
    // same URL / author / year the natal testimony already cites
    assert(cited.has(w.url), `/library item ${i}: url already cited in tradition.ts`);
    assert(TESTIMONY.some((t) => t.verifiedUrl === w.url && t.author === w.author && String(t.year) === w.year), `/library item ${i}: author + year match tradition.ts`);
    assert(!pressTitles.has(String(b.name)), `/library item ${i}: not a press item`);
    assert(String(b.description).length > 0 && String(b.description).length < 240, `/library item ${i}: short description`);
  });

  const set = ld.hasPart as Record<string, unknown>;
  const terms = set.hasDefinedTerm as Record<string, unknown>[];
  assert(set["@type"] === "DefinedTermSet" && set.name === "The Cunning Man library facets", "/library: hasPart DefinedTermSet name");
  assert(set.inLanguage === "en" && set.isAccessibleForFree === true, "/library: term set en, free");
  const sp = set.isPartOf as Record<string, unknown>;
  assert(sp && sp["@type"] === "WebSite" && sp.name === "The Cunning Man" && sp.url === `${SITE_ORIGIN}/`, "/library: term set isPartOf WebSite");
  const defs: Record<string, string> = {
    esoteric: "Traditional and hidden-arts sources studied as historical doctrine — astrology, magic, and the runes — offered for study and entertainment, not as a promised result.",
    exoteric: "Plain-language public explanations of the same tradition, written so a visitor can learn the terms without being sent a signal or a fee.",
    "market-study": "Historical and traditional sources, and firm study notes, about looking at markets or timing in a scholarly way. Not trading signals, prices, financial advice, or prop-firm claims.",
  };
  assert(terms.length === 3 && terms.map((t) => t.termCode).join(",") === "esoteric,exoteric,market-study", "/library: three terms esoteric, exoteric, market-study");
  for (const t of terms) {
    const code = String(t.termCode);
    assert(t["@type"] === "DefinedTerm" && t.name === code && t.description === defs[code], `/library term ${code}: name + brief definition`);
    assert(t.url === `${absUrl("/library")}#term-${code}`, `/library term ${code}: url anchor on /library`);
    const ins = t.inDefinedTermSet as Record<string, unknown>;
    assert(ins && ins["@type"] === "DefinedTermSet" && ins.name === set.name, `/library term ${code}: inDefinedTermSet`);
  }
  assert(LIBRARY_TERMS.every((t) => t.code !== ("trading" as string) && !/^trading$/i.test(t.name)), "/library: no 'trading' term");
  // wording limits (LIB-001 §7) on everything except the brief's verbatim definitions
  const copy = JSON.stringify(withoutTermDefinitions(ld));
  assert(!/\btrad(e|es|er|ers|ing)\b|\bentr(y|ies)\b|\bexit|signal|\bbuy\b|\bsell\b|\bedge\b|win rate|profit|ticker|funded|prop[- ]?firm|advice|price/i.test(copy), "/library: no banned wording in page/item metadata");
  for (const b of LIBRARY_BOOKS) {
    const vis = [b.title, b.note, b.scanNote ?? "", b.yearLabel].join(" ");
    assert(!/\btrad(e|es|er|ers|ing)\b|\bentr(y|ies)\b|\bexit|signal|\bbuy\b|\bsell\b|\bedge\b|win rate|profit|ticker|funded|prop[- ]?firm|advice|price|\$/i.test(vis), `/library ${b.id}: no banned wording in visible copy`);
  }
  // catalog lives beside press.ts, not in src/lib, and is not built from press
  const libSrc = readFileSync(new URL("../src/site/library.ts", import.meta.url), "utf8");
  assert(!/from\s+["'][^"']*press["']/.test(libSrc), "src/site/library.ts: not built from press");
  assert(!existsSync(new URL("../src/lib/library.ts", import.meta.url)), "catalog not in src/lib/");
  // public files list /library
  const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  const llms = readFileSync(new URL("../public/llms.txt", import.meta.url), "utf8");
  assert(sitemap.includes("<loc>https://cunning-man.vercel.app/library</loc>") && !/\/library\//.test(sitemap), "sitemap: /library, no /library/:slug");
  assert(/^- \/library — /m.test(llms), "llms.txt: /library line");
  // L-1: shared copy must be true of all four sources (Ptolemy's URL is an
  // HTML transcription, not a scan). Per-item scanNotes may still say "scan".
  assert(ld.description === LIBRARY_DESCRIPTION, "/library: JSON-LD description matches page description");
  assert(!/scan/i.test(LIBRARY_SUBTITLE) && !/scan/i.test(LIBRARY_DESCRIPTION), "/library: subtitle and description do not call every source a scan");
  assert(/public-domain source/.test(LIBRARY_SUBTITLE) && /public-domain sources/.test(LIBRARY_DESCRIPTION), "/library: shared wording is public-domain source(s)");
  const pageSrc = readFileSync(new URL("../src/pages/site/LibraryPage.tsx", import.meta.url), "utf8");
  assert(!/public-domain scan/.test(pageSrc), "/library page: no shared 'public-domain scan' link label");
  assert(/Read the public-domain source/.test(pageSrc), "/library page: shared link label is public-domain source");
  const libLine = (llms.match(/^- \/library — [\s\S]*?(?=\n- |\n## |$)/m) || [""])[0];
  assert(libLine.length > 0 && !/scan/i.test(libLine), "llms.txt /library line does not call every source a scan");
  const ramesey = LIBRARY_BOOKS.find((b) => b.id === "astrologia-restaurata")!;
  const bonatti = LIBRARY_BOOKS.find((b) => b.id === "liber-astronomiae")!;
  const ptolemy = LIBRARY_BOOKS.find((b) => b.id === "tetrabiblos")!;
  assert(ramesey.year === 1653 && /1654/.test(ramesey.scanNote ?? ""), "/library Ramesey: year 1653, scan note 1654");
  assert(bonatti.year === 1676 && /1676/.test(bonatti.yearLabel) && /1886/.test(bonatti.scanNote ?? "") && /1676 title page/.test(bonatti.scanNote ?? ""), "/library Bonatti: year 1676, scan note 1886 and 1676 title page");
  assert(!(ptolemy.scanNote ?? "").length, "/library Ptolemy: no scan note on the HTML source");
}

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
for (const path of ["/library/christian-astrology", "/library/x", "/lib", "/nope", "/clock/extra", "/press/nope", "/press/LAUNCH", "/press/launch/x", "/spells", "/spells/other", "/index.html"]) {
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
