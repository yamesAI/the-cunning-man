// Check: route structured data and canonicals (SCHEMA-001 §3 + CEO rulings 2026-11-12 08:54, owner 09:05).
// Run: npm run check:schema   (optionally: BUNDLE_DIR=<vite outDir> to also scan a built bundle)

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { routeHead, absUrl, isoDate, SITE_ORIGIN } from "../src/site/structuredData";
import { PRESS } from "../src/site/press";
import {
  LIBRARY_BOOKS, LIBRARY_DESCRIPTION, LIBRARY_PATH, LIBRARY_SUBTITLE, LIBRARY_TERMS,
  bookPageDescription, bookPageName, bookPath,
} from "../src/site/library";
import { TESTIMONY } from "../src/data/tradition";
import {
  DIGNITIES_DESCRIPTION, DIGNITIES_PATH, DIGNITIES_SUBTITLE, DISCLAIMER, LATER_BOOK1_POINTERS, LILLY_SOURCE,
  LILLY_TABLE_TERMS, PLANET_CATALOGS, planetPageDescription, planetPageName, planetPath, signDignities,
} from "../src/site/dignities";
import { ART_ASSIGNMENTS, ART_WORKS, SHIPPED_FILES, artForPath, contentPath, creditText } from "../src/site/art";
import { LEARN_MORE, learnMoreForCatalog, learnMoreForName, occupationHaystack } from "../src/site/learnMore";
import { NON_PORTRAIT_ART_IDS } from "../src/site/art";
import {
  ALLOWED_RATINGS, CHARTS_DESCRIPTION, CHARTS_PATH, CHARTS_PRESS_SLUG, CHART_FIGURES,
  figureAspects, figureChart, figureFromPath, figurePageDescription, figurePageName, figurePath, figureReads, parseAdbCoord,
  SCORE_NOTE, SITE_INTRO,
} from "../src/site/charts";
import { ARTICLES, ARTICLES_PATH, ARTICLE_BEATS, articlePath } from "../src/site/articles";
import { personId, ogImage, DEFAULT_OG_IMAGE } from "../src/site/structuredData";
import { STATIC_META, NOT_FOUND_META, pageMeta } from "../src/site/pageMeta";
import { OPERATOR_NAME } from "../src/site/info";
import { wallParts } from "../src/astro/format";

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
// LIB-001 §4: /library, /dignities and the book and planet pages may name a
// historical author/translator as Person (name only; checked exactly below).
// Chart subjects are allowed only through PERSON_ALLOWLIST. Everywhere else
// Person stays forbidden.
const ALLOWED_TYPES: Record<string, Set<string>> = { "/library": new Set(["Person"]), "/dignities": new Set(["Person"]) };
// HUB-FIX-001 (owner 2026-11-15 16:30/16:52): /about and /contact name the
// operator as an Organization by brand only; only these pages may carry the
// brand text. Nowhere else does Organization or the brand appear.
const BRAND_PATHS = new Set(["/about", "/contact"]);
for (const p of BRAND_PATHS) ALLOWED_TYPES[p] = new Set(["Organization"]);
for (const c of PLANET_CATALOGS) ALLOWED_TYPES[planetPath(c.key)] = new Set(["Person"]);
for (const b of LIBRARY_BOOKS) ALLOWED_TYPES[bookPath(b.id)] = new Set(["Person"]);

// PERSON_ALLOWLIST (R-CHARTS-001 §7–§9): the only paths where a full Person
// node (one with @id) may appear, the role it plays, and its exact @id. Today
// the one role is "subject": a chart figure, as about/mainEntity of its /charts
// page and about of its press release. BRUNO-001 adds role "author" entries
// here; nothing else widens the Person allowance. Place is allowed with the
// subject only where the catalog types the birthplace as Place (D-7).
type PersonRole = "subject";
const PERSON_ALLOWLIST: Record<string, { role: PersonRole; id: string }[]> = {};
for (const f of CHART_FIGURES) {
  const entry = { role: "subject" as const, id: personId(f) };
  for (const path of [figurePath(f.slug), `/press/${f.pressSlug}`]) {
    PERSON_ALLOWLIST[path] = [entry];
    ALLOWED_TYPES[path] = new Set(["Person", ...(f.placeType === "Place" ? ["Place"] : [])]);
  }
}
/** Full Person nodes (those carrying @id) anywhere in a JSON-LD graph. */
function personNodes(v: unknown, out: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (Array.isArray(v)) v.forEach((x) => personNodes(x, out));
  else if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (o["@type"] === "Person" && "@id" in o) out.push(o);
    Object.values(o).forEach((x) => personNodes(x, out));
  }
  return out;
}

function walk(v: unknown, where: string, allow: Set<string> = new Set(), allowTypes: Set<string> = new Set()) {
  if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${where}[${i}]`, allow, allowTypes));
  if (v && typeof v === "object") {
    const typ = String((v as Record<string, unknown>)["@type"] ?? "");
    const keys = typ === "ImageObject" ? new Set([...allow, "creator"]) : allow;
    const types = typ === "ImageObject" ? new Set([...allowTypes, "Person"]) : allowTypes;
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      assert(!FORBIDDEN_KEYS.has(k) || keys.has(k), `${where}: forbidden key ${k}`);
      if (k === "@type") assert(!FORBIDDEN_TYPES.has(String(x)) || types.has(String(x)), `${where}: forbidden @type ${x}`);
      walk(x, `${where}.${k}`, keys, types);
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
  for (const re of FORBIDDEN_TEXT) {
    if (BRAND_PATHS.has(path) && /AstroTrading/.test(re.source)) continue;
    assert(!re.test(text), `${path}: forbidden text ${re}`);
  }
  walk(ld, path, ALLOWED_KEYS[path], ALLOWED_TYPES[path]);
}

// 1. known routes emit the expected @type; 5. canonical == url == route
const EXPECT: Record<string, string> = {
  "/": "FAQPage", "/clock": "WebApplication", "/natal": "WebApplication", "/synastry": "WebApplication",
  "/launches": "WebApplication", "/sky": "WebApplication", "/sigil": "WebApplication", "/runes": "WebApplication",
  "/spells/love": "WebPage", "/spells/money": "WebPage", "/press": "CollectionPage", "/library": "CollectionPage",
  "/dignities": "WebPage", "/charts": "CollectionPage", "/articles": "CollectionPage",
  "/about": "AboutPage", "/contact": "ContactPage", "/privacy": "WebPage",
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
  assert(Object.keys(ld).sort().join(",") === "@context,@type,applicationCategory,description,featureList,image,inLanguage,isAccessibleForFree,isPartOf,name,operatingSystem,url", "/sky: only the §5 properties plus image (m-2)");
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
    const keys = ["@id", "@type", "author", "datePublished", "description", "inLanguage", "isAccessibleForFree", "keywords", "name", "url", ...(w.translator ? ["translator"] : [])].sort();
    assert(Object.keys(b).sort().join(",") === keys.join(","), `/library item ${i}: metadata-only Book properties`);
    assert(b["@type"] === "Book" && b["@id"] === `${absUrl("/library")}#${LIBRARY_BOOKS[i].id}` && b.name === w.name && b.url === w.url && b.datePublished === w.year, `/library item ${i}: Book ${w.name} ${w.year}`);
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
  assert(sitemap.includes("<loc>https://cunning-man.vercel.app/library</loc>"), "sitemap: /library");
  for (const b of LIBRARY_BOOKS) {
    assert(sitemap.includes(`<loc>https://cunning-man.vercel.app/library/${b.id}</loc>`), `sitemap: /library/${b.id}`);
  }
  assert(/^- \/library — /m.test(llms), "llms.txt: /library line");
  for (const b of LIBRARY_BOOKS) {
    const re = new RegExp(`^- /library/${b.id} — .+`, "m");
    const line = (llms.match(re) || [""])[0];
    assert(line.includes(b.title) && /study page/.test(line) && /public-domain source/.test(line) && /No full text is hosted/.test(line), `llms.txt: /library/${b.id}`);
    assert(!/scan/i.test(line) && !/\btrad(e|es|er|ers|ing)\b|\bentr(y|ies)\b|signal|price|financ|invest|advice|prop[- ]?firm/i.test(line), `llms.txt: /library/${b.id} clean wording`);
  }
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
  const appSrc = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
  assert(/<Route path="\/library" element=\{<LibraryPage \/>\} \/>/.test(appSrc), "App.tsx: /library index route");
  assert(/<Route path="\/library\/:book" element=\{<LibraryPage \/>\} \/>/.test(appSrc), "App.tsx: /library/:book child route");
  assert(appSrc.lastIndexOf('path="*"') > appSrc.lastIndexOf("/library/:book"), "App.tsx: catch-all remains last");
  const layout = readFileSync(new URL("../src/components/SiteLayout.tsx", import.meta.url), "utf8");
  assert((layout.match(/label: "Library"/g) || []).length === 1 && !/to: "\/library\//.test(layout), "header nav: one Library entry, no per-book items");
}

// /library/:book (HUB-PAGES-001 §3.2, D-1): WebPage about the existing Book,
// backlinks, breadcrumbs, stable Book @id, no hosted full text, no banned types.
{
  const LIB_URL = "https://cunning-man.vercel.app/library";
  const indexLd = routeHead(LIBRARY_PATH).jsonLd!;
  const indexBooks = ((indexLd.mainEntity as Record<string, unknown>).itemListElement as Record<string, unknown>[]).map((el) => el.item as Record<string, unknown>);
  const BANNED = /\btrad(e|es|er|ers|ing)\b|\bentr(y|ies)\b|\bexit|signal|\bbuy\b|\bsell\b|\bedge\b|win rate|profit|ticker|funded|prop[- ]?firm|price|financ|invest|\bcur(e|es|ed|ing)\b|\bdos(e|es|ing|age)\b|remed|prescri|career|\$/i;
  const pageSrc = readFileSync(new URL("../src/pages/site/LibraryPage.tsx", import.meta.url), "utf8");
  const BOOK_TYPES = ["WebPage", "WebSite", "Book", "Person", "DefinedTerm", "BreadcrumbList", "ListItem"];
  const BANNED_TYPES = /"@type":"(Library|LibrarySystem|EsotericLibrary|Article|CreativeWork|DigitalDocument|NewsArticle|WebApplication|CollectionPage|Offer|MonetaryAmount|Plant|Animal|Taxon|Drug|Medical[A-Za-z]*|DietarySupplement|Substance|HowTo|HowToStep)"/;
  const BANNED_PROPS = /"(offers|price|priceCurrency|publisher|creator|isbn|numberOfPages|articleBody|genre|disclaimer)"/;

  for (const b of LIBRARY_BOOKS) {
    const path = bookPath(b.id);
    const h = routeHead(path);
    assert(h.jsonLd, `${path}: has JSON-LD`);
    const ld = h.jsonLd!;
    const text = JSON.stringify(ld);
    const types = [...text.matchAll(/"@type":"([^"]+)"/g)].map((m) => m[1]);
    assert(ld["@type"] === "WebPage" && ld.name === bookPageName(b.title), `${path}: WebPage, not Book`);
    assert(h.canonical === absUrl(path) && ld.url === h.canonical, `${path}: canonical per route`);
    assert(ld.description === bookPageDescription(b), `${path}: description from the catalog`);
    assert(!/scan/i.test(bookPageDescription(b)), `${path}: shared description does not say scan`);
    assert(ld.isAccessibleForFree === true, `${path}: isAccessibleForFree`);
    assert(Object.keys(ld).sort().join(",") === "@context,@type,about,breadcrumb,description,inLanguage,isAccessibleForFree,isBasedOn,isPartOf,mainEntity,name,relatedLink,url", `${path}: only the book-page properties`);
    common(path, ld);
    assert(BOOK_TYPES.every((t) => types.includes(t)), `${path}: uses the required types`);
    for (const t of new Set(types)) assert(BOOK_TYPES.includes(t), `${path}: allowed @type ${t}`);
    assert(!BANNED_TYPES.test(text), `${path}: no banned or invented types`);
    assert(!BANNED_PROPS.test(text), `${path}: no banned properties`);
    assert(!/AstroTrading|ai-vs-the-sky|AI vs the Sky|\.pdf/i.test(text), `${path}: no firm brand, no AI vs the Sky PDF`);
    assert(!/\/press/.test(text), `${path}: no press URLs`);
    const book = ld.mainEntity as Record<string, unknown>;
    assert(JSON.stringify(book) === JSON.stringify(ld.about) && JSON.stringify(book) === JSON.stringify(ld.isBasedOn), `${path}: about, mainEntity and isBasedOn are the same Book`);
    assert(book["@type"] === "Book" && book["@id"] === `${LIB_URL}#${b.id}` && book.url === b.url && book.url !== absUrl(path), `${path}: Book @id and scan url, not the hub page`);
    assert(book.name === b.title && book.description === b.note && book.datePublished === String(b.year), `${path}: Book fields from the catalog`);
    assert(JSON.stringify(book.author) === JSON.stringify({ "@type": "Person", name: b.author }), `${path}: author Person name only`);
    if (b.translator) assert(JSON.stringify(book.translator) === JSON.stringify({ "@type": "Person", name: b.translator }), `${path}: translator Person name only`);
    const persons = [...text.matchAll(/\{"@type":"Person"[^}]*\}/g)].map((m) => m[0]);
    assert(persons.length > 0 && persons.every((p) => p === `{"@type":"Person","name":"${b.author}"}` || (b.translator ? p === `{"@type":"Person","name":"${b.translator}"}` : false)), `${path}: Person only as author or translator, name only`);
    const indexBook = indexBooks.find((x) => x["@id"] === book["@id"])!;
    assert(indexBook && indexBook["@id"] === book["@id"] && indexBook.url === book.url, `${path}: Book @id matches the collection`);
    const crumbs = ld.breadcrumb as Record<string, unknown>;
    const items = crumbs.itemListElement as Record<string, unknown>[];
    assert(crumbs["@type"] === "BreadcrumbList" && items.length === 3, `${path}: BreadcrumbList of three steps`);
    assert(items[0]["@type"] === "ListItem" && items[0].position === 1 && items[0].name === "The Cunning Man" && items[0].item === `${SITE_ORIGIN}/`, `${path}: breadcrumb 1`);
    assert(items[1]["@type"] === "ListItem" && items[1].position === 2 && items[1].name === "Library" && items[1].item === LIB_URL, `${path}: breadcrumb 2`);
    assert(items[2]["@type"] === "ListItem" && items[2].position === 3 && items[2].name === b.title && items[2].item === absUrl(path), `${path}: breadcrumb 3 is this page`);
    const related = ld.relatedLink as string[];
    const siblings = LIBRARY_BOOKS.filter((x) => x.id !== b.id).map((x) => absUrl(bookPath(x.id)));
    assert(Array.isArray(related) && related.length === 3 && JSON.stringify(related) === JSON.stringify(siblings), `${path}: relatedLink is the three sibling URLs`);
    assert(!BANNED.test(text) && !/advice/i.test(text), `${path}: no banned wording in JSON-LD`);
    assert(JSON.stringify(routeHead(path + "/")) === JSON.stringify(h), `${path}/: trailing slash is the same page`);
  }

  assert(/aria-label="Breadcrumb"/.test(pageSrc), "book page: visible breadcrumb trail");
  assert(/Back to Library/.test(pageSrc), "book page: visible back link to /library");
  assert(/aria-label="Other books"/.test(pageSrc) && /LIBRARY_BOOKS\.filter\(\(b\) => b\.id !== book\.id\)/.test(pageSrc), "book page: visible links to the three siblings");
  assert(/return <NotFoundPage \/>/.test(pageSrc), "unknown slug: NotFoundPage (MN-1)");
  assert(!/SiteHome/.test(pageSrc), "book miss does not render SiteHome");
  assert(/bookFromPath/.test(pageSrc) && !/PRESS\[0\]/.test(pageSrc), "unknown slug does not copy the press fallback");
  const pageLiterals = [...pageSrc.replace(/className="[^"]*"/g, "").matchAll(/>([^<>{}]+)</g)].map((m) => m[1]).join(" ");
  const lit = pageLiterals.replace(/Not financial, medical, or legal advice\./g, "");
  assert(!BANNED.test(lit) && !/\badvice\b/i.test(lit), "book/miss page literals: no banned wording");
}


// /dignities (DIGNITIES-001 v1.1 §4–§7, CEO D-1–D-6 and 14:21 rulings): a WebPage
// (not WebApplication, CollectionPage or Library) with three DefinedTermSets and
// seven Lilly chapter sections. Occupation and Country/City carry name +
// description only; days are DayOfWeek; herbs, beasts, stones, sickness,
// angels and the rest stay visible text only. Lilly 1647 is the only layer.
{
  const ld = routeHead("/dignities").jsonLd!;
  const text = JSON.stringify(ld);
  const types = [...text.matchAll(/"@type":"([^"]+)"/g)].map((m) => m[1]);
  const DIG_URL = "https://cunning-man.vercel.app/dignities";
  assert(ld["@type"] === "WebPage" && ld.name === "The Cunning Man — Dignities and Correspondences", "/dignities: WebPage, D-1 name");
  assert(ld.url === DIG_URL && ld.isAccessibleForFree === true, "/dignities: absolute url, free");
  assert(ld.description === DIGNITIES_DESCRIPTION, "/dignities: JSON-LD description matches page description");
  assert(Object.keys(ld).sort().join(",") === "@context,@type,about,description,hasPart,inLanguage,isAccessibleForFree,isBasedOn,isPartOf,name,primaryImageOfPage,url", "/dignities: only the §4 page properties plus primaryImageOfPage");
  const DIG_TYPES = ["WebPage", "WebSite", "Book", "Person", "DefinedTermSet", "DefinedTerm", "CreativeWork", "Occupation", "DayOfWeek", "Country", "City", "ImageObject"];
  assert(DIG_TYPES.every((t) => types.includes(t)), "/dignities: uses every §4 type");
  for (const t of new Set(types)) assert(DIG_TYPES.includes(t), `/dignities: allowed @type ${t}`);
  assert(!/"(WebApplication|CollectionPage|Library|LibrarySystem|Plant|Animal|Herb|Taxon|Drug|DrugClass|DietarySupplement|Substance|Medical[A-Za-z]*|SuperficialAnatomy|AnatomicalStructure|HowTo|HowToStep|AdministrativeArea|Landform|Cemetery|CivicStructure|LandmarksOrHistoricalBuildings|BodyOfWater|Place|State|Continent|Organization|Offer|MonetaryAmount|PriceSpecification|QuantitativeValue|QualitativeValue|PropertyValue|WeatherForecast|Color|Colour|Mineral|Angel|Deity|Planet|ZodiacSign|Correspondence|Profession|Tarot)"/.test(text), "/dignities: no WebApplication/CollectionPage/Library, no Plant/Animal/Taxon/Drug/Medical*/Substance/HowTo, no Place stretch, no Offer, no invented types");
  assert(!/"(offers|price|priceCurrency|estimatedSalary|occupationalCategory|address|geo|telephone|relatedTo|knowsAbout|color|publisher|creator|dosage|keywords)"/.test(JSON.stringify({ ...ld, primaryImageOfPage: undefined })), "/dignities: no Offer/price/salary/Place-business/relatedTo/knowsAbout/color/publisher/creator fields outside ImageObject");
  assert(!/uranus|neptune|pluto/i.test(text) && !/uranus|neptune|pluto/i.test(JSON.stringify(PLANET_CATALOGS)), "/dignities: no modern outer planets");
  assert(!/tarot|agrippa|al-biruni|biruni/i.test(text + JSON.stringify(PLANET_CATALOGS)), "/dignities: no tarot, Agrippa or Al-Biruni layer");
  // Lilly citation: same title, author, year, URL as library.ts / tradition.ts
  const lib = LIBRARY_BOOKS.find((b) => b.id === "christian-astrology")!;
  const book = JSON.stringify({ "@type": "Book", name: lib.title, author: { "@type": "Person", name: lib.author }, datePublished: String(lib.year), url: lib.url });
  assert(JSON.stringify(ld.isBasedOn) === book && lib.url === "https://archive.org/details/ca-william-lilly", "/dignities: isBasedOn is the library's Lilly Book");
  assert(LILLY_SOURCE.url === lib.url && TESTIMONY.some((t) => t.verifiedUrl === lib.url && t.author === lib.author && t.year === lib.year), "/dignities: Lilly URL matches library.ts and tradition.ts");
  const persons = [...text.matchAll(/\{"@type":"Person"[^}]*\}/g)].map((m) => m[0]);
  const allowedPeople = new Set([`{"@type":"Person","name":"${lib.author}"}`, '{"@type":"Person","name":"Sebald Beham"}']);
  assert(persons.length > 0 && persons.every((p) => allowedPeople.has(p)), "/dignities: Person only as the cited Book's author or the ImageObject artist, name only");
  // term sets
  const parts = ld.hasPart as Record<string, unknown>[];
  const sets = parts.filter((x) => x["@type"] === "DefinedTermSet");
  const sections = parts.filter((x) => x["@type"] === "CreativeWork");
  assert(parts.length === 10 && sets.length === 3 && sections.length === 7, "/dignities: hasPart = 3 term sets + 7 chapter sections");
  assert(sets.map((x) => x.name).join("|") === "Classical planets|Zodiac signs|Essential dignities", "/dignities: term set names");
  for (const set of sets) {
    const sp = set.isPartOf as Record<string, unknown>;
    assert(set.inLanguage === "en" && set.isAccessibleForFree === true && sp["@type"] === "WebPage" && sp.url === DIG_URL, `/dignities set ${set.name}: en, free, isPartOf the page`);
    assert(JSON.stringify(set.isBasedOn) === book && typeof set.about === "string", `/dignities set ${set.name}: about + isBasedOn Lilly`);
    for (const t of set.hasDefinedTerm as Record<string, unknown>[]) {
      const allowed = set.name === "Classical planets"
        ? ["@type", "@id", "name", "alternateName", "description", "termCode", "url", "inDefinedTermSet"]
        : ["@type", "name", "alternateName", "description", "termCode", "url", "inDefinedTermSet"];
      assert(t["@type"] === "DefinedTerm" && Object.keys(t).every((k) => allowed.includes(k)), `/dignities term ${t.name}: DefinedTerm properties only (no mentions/keywords/isAccessibleForFree)`);
      if (set.name === "Classical planets") {
        assert(t["@id"] === `${DIG_URL}#${t.termCode}` && t.url === `${DIG_URL}/${t.termCode}`, `/dignities term ${t.name}: stable @id hash, url is the planet page`);
      } else {
        assert(String(t.url).startsWith(`${DIG_URL}#`), `/dignities term ${t.name}: url anchor`);
      }
      assert((t.inDefinedTermSet as Record<string, unknown>).name === set.name, `/dignities term ${t.name}: inDefinedTermSet`);
    }
  }
  const pTerms = sets[0].hasDefinedTerm as Record<string, unknown>[];
  assert(pTerms.map((t) => t.termCode).join(",") === "saturn,jupiter,mars,sun,venus,mercury,moon", "/dignities: exactly the seven traditional planets");
  assert(PLANET_CATALOGS.map((c) => c.key).join(",") === "saturn,jupiter,mars,sun,venus,mercury,moon", "/dignities catalog: seven traditional planets only");
  assert(pTerms.every((t) => Array.isArray(t.alternateName) && (t.alternateName as string[]).length > 0), "/dignities: traditional names as alternateName");
  assert((sets[1].hasDefinedTerm as unknown[]).length === 12, "/dignities: twelve sign terms");
  assert((sets[2].hasDefinedTerm as Record<string, unknown>[]).map((t) => t.termCode).join(",") === "house,exaltation,triplicity,term,face,detriment,fall,peregrine", "/dignities: essential dignity terms");
  // chapter sections
  const DAYS = new Set<string>();
  sections.forEach((sec, i) => {
    const c = PLANET_CATALOGS[i];
    const where = `/dignities ${c.key}`;
    const visible = c.entries.map((e) => e.text).join(" ");
    assert(sec.url === `${DIG_URL}/${c.key}` && JSON.stringify(sec.isBasedOn) === book, `${where}: section url + isBasedOn Lilly`);
    assert(JSON.stringify(sec.about) === JSON.stringify({ "@type": "DefinedTerm", "@id": `${DIG_URL}#${c.key}`, name: c.name, termCode: c.key, url: `${DIG_URL}/${c.key}` }), `${where}: section about the planet term`);
    assert(Object.keys(sec).sort().join(",") === "@type,about,inLanguage,isBasedOn,isPartOf,mentions,name,url", `${where}: section properties`);
    const men = sec.mentions as Record<string, unknown>[];
    const days = men.filter((m) => m["@type"] === "DayOfWeek");
    assert(days.length === 1 && days[0]["@id"] === `https://schema.org/${c.day}` && days[0].name === c.day, `${where}: DayOfWeek ${c.day}`);
    assert(c.entries.some((e) => e.heading === "Day of the week" && e.text.includes(c.day)), `${where}: day of the week is in the chapter text`);
    DAYS.add(c.day);
    const occ = men.filter((m) => m["@type"] === "Occupation");
    assert(occ.length === c.occupations.length && occ.length > 0, `${where}: Occupation per named trade or station`);
    for (const o of occ) {
      const okeys = Object.keys(o).sort().join(",");
      assert(okeys === "@type,description,name" || okeys === "@type,description,name,sameAs", `${where} Occupation ${o.name}: name + description only`);
      if (okeys.includes("sameAs")) {
        const row = learnMoreForName(String(o.name));
        assert(row && row.sameAs && o.sameAs === row.url, `${where} Occupation ${o.name}: sameAs is the sample learn-more URL`);
      }
      assert(visible.includes(String(o.name)), `${where} Occupation ${o.name}: named in the chapter text`);
    }
    const places = men.filter((m) => m["@type"] === "Country" || m["@type"] === "City");
    const countries = c.entries.filter((e) => e.heading === "Countries").map((e) => e.text).join(" ");
    for (const p of places) {
      const pkeys = Object.keys(p).sort().join(",");
      assert(pkeys === "@type,description,name" || pkeys === "@type,description,name,sameAs", `${where} ${p["@type"]} ${p.name}: name + description only`);
      if (pkeys.includes("sameAs")) {
        const row = learnMoreForName(String(p.name));
        assert(row && row.sameAs && p.sameAs === row.url, `${where} ${p.name}: sameAs is the sample learn-more URL`);
      }
      assert(countries.includes(String(p.name)), `${where} ${p.name}: in the chapter's Countries list`);
    }
    assert(!/Climate/i.test(JSON.stringify(places)), `${where}: numbered climates not typed as places`);
    const others = men.filter((m) => m["@type"] === "DefinedTerm").map((m) => m.termCode);
    assert(others.every((k) => k !== c.key && (c.friends.includes(k as never) || c.enemies.includes(k as never))), `${where}: mentions only the planets it names as friends or enemies`);
    assert(men.length === 1 + occ.length + places.length + others.length, `${where}: no other mentioned types`);
    // the complete Book 1 heading families are present (brief §5)
    // The Moon chapter prints no oriental/occidental notes; nothing is supplied for it.
    const families = [/^Names?$/i, /nature/i, /corporature/i, /sickness|diseases/i, /hearbs|herbs/i, /beasts/i, /birds/i, /fishes/i, /places/i, /mineral|mettals/i, /stones/i, /weather/i, /wind/i, /orbe/i, /yeers/i, /countries/i, /angel/i, /day of the week/i];
    if (c.key !== "moon") families.push(/orient/i, /occident/i);
    else assert(!c.entries.some((e) => /orient|occident/i.test(e.heading)), `${where}: no oriental/occidental heading invented`);
    for (const re of families) assert(c.entries.some((e) => re.test(e.heading)), `${where}: heading ${re} present`);
    assert(c.entries.some((e) => /ill/.test(e.heading)) && c.entries.some((e) => /well/.test(e.heading)), `${where}: manners well and ill dignified`);
    assert(c.entries.some((e) => e.sickness), `${where}: sickness notes flagged for the visible disclaimer`);
    const [lo, hi] = c.pages.match(/\d+/g)!.map(Number);
    assert(c.entries.every((e) => e.page >= lo && e.page <= hi), `${where}: every heading cites a page inside the chapter (${c.pages})`);
  });
  assert(DAYS.size === 7, "/dignities: seven distinct days of the week");
  // unmapped: herbs, beasts, stones, angels, colours stay out of JSON-LD
  for (const name of ["Mandrake", "Hemlock", "Elephant", "Dolphin", "Saphire", "Quicksilver", "Cassiel", "Zadkiel", "Samael", "Michael", "Anael", "Raphael", "Gabriel", "Apoplexies", "Spleen"])
    assert(!text.includes(name), `/dignities: ${name} stays visible text only`);
  // dignity table consistent with traditional.ts; Lilly p.104 terms well formed
  const rows = signDignities();
  assert(rows.length === 12 && rows.every((r) => r.terms.length === 5 && r.terms[4][1] === 30 && r.faces.length === 3), "/dignities table: twelve signs, five terms, three faces");
  let differ = 0;
  for (const r of rows) {
    const lt = LILLY_TABLE_TERMS[r.sign];
    assert(lt.length === 5 && lt[4][1] === 30 && lt.every((x, i) => i === 0 || x[1] > lt[i - 1][1]) && new Set(lt.map((x) => x[0])).size === 5 && lt.every((x) => !["sun", "moon"].includes(x[0])), `/dignities Lilly terms ${r.sign}: five planets, ascending to 30`);
    if (JSON.stringify(lt) !== JSON.stringify(r.terms)) differ++;
  }
  assert(differ === 12, `/dignities: Lilly p.104 terms differ from the Egyptian terms in every sign, as the page says (${differ})`);
  // wording limits (§6): JSON-LD, subtitle, description, pointers, page literals, public lines
  const BANNED = /\btrad(e|es|er|ers|ing)\b|\bentr(y|ies)\b|\bexit|signal|\bbuy\b|\bsell\b|\bedge\b|win rate|profit|ticker|funded|prop[- ]?firm|price|financ|invest|\bcur(e|es|ed|ing)\b|\bdos(e|es|ing|age)\b|remed|prescri|career|\$/i;
  assert(!BANNED.test(text) && !/advice/i.test(text), "/dignities: no banned wording in JSON-LD");
  const pageSrc = readFileSync(new URL("../src/pages/site/DignitiesPage.tsx", import.meta.url), "utf8");
  const pageLiterals = [...pageSrc.replace(/className="[^"]*"/g, "").matchAll(/>([^<>{}]+)</g)].map((m) => m[1]).join(" ");
  const copy = [DIGNITIES_SUBTITLE, DIGNITIES_DESCRIPTION, pageLiterals, ...LATER_BOOK1_POINTERS.map((x) => `${x.title} ${x.note}`)].join(" ");
  assert(!BANNED.test(copy), "/dignities: no banned wording in page copy");
  assert((copy.match(/advice/gi) || []).length === (copy.match(/not advice/gi) || []).length, "/dignities: 'advice' only as 'not advice'");
  assert(/study reference, not a live chart and not advice/.test(DIGNITIES_SUBTITLE), "/dignities: subtitle says study reference, not a live chart, not advice");
  // Lilly's verbatim lists: the only banned-word hits are these three historical uses
  const hits = PLANET_CATALOGS.flatMap((c) => c.entries.flatMap((e) => [...e.text.matchAll(new RegExp(BANNED.source, "gi"))].map((m) => `${c.key}|${e.heading}|${m[0]}`)));
  assert(hits.join(";") === "venus|Quality of men and professions|sell;mercury|Manners when well placed|Trade;moon|Manners or actions when well placed or dignified|trade", `/dignities: verbatim Lilly hits are only the known three (${hits.join(";")})`);
  assert(PLANET_CATALOGS.every((c) => c.entries.every((e) => !/advice/i.test(e.text))), "/dignities: no 'advice' in the Lilly lists");
  // gathering/timing sentences carry the historical flag (not HowTo)
  for (const c of PLANET_CATALOGS) for (const e of c.entries)
    if (/gathering|Hermeticall operation/i.test(e.text)) assert(e.historical === true, `/dignities ${c.key} ${e.heading}: gathering text flagged historical`);
  assert(/e\.historical \?/.test(pageSrc) && /not instructions/.test(pageSrc), "/dignities page: historical label rendered");
  // visible disclaimer: top of page, beside every sickness note, and in the footer
  const layout = readFileSync(new URL("../src/components/SiteLayout.tsx", import.meta.url), "utf8");
  assert(DISCLAIMER === "For entertainment & study. Not financial, medical, or legal advice." && layout.includes("For entertainment &amp; study. Not financial, medical, or legal advice."), "/dignities: disclaimer text matches the footer");
  assert((pageSrc.match(/\{DISCLAIMER\}/g) || []).length >= 2 && /e\.sickness \? <span[^>]*>\{DISCLAIMER\}/.test(pageSrc), "/dignities page: disclaimer at top and beside each sickness note");
  // placement and untouched files
  assert(existsSync(new URL("../src/site/dignities.ts", import.meta.url)) && !existsSync(new URL("../src/lib/dignities.ts", import.meta.url)), "dignities catalog in src/site/, not src/lib/");
  assert(readdirSync(new URL("../src/lib", import.meta.url)).sort().join(",") === "env.ts,natal.ts,transitFormat.ts,utils.ts", "src/lib unchanged");
  const sha = (rel: string) => createHash("sha256").update(readFileSync(new URL(rel, import.meta.url))).digest("hex");
  assert(sha("../src/astro/traditional.ts") === "caf83c29458915031f84fd0061be6f967aab58cb99cd23b450e36986010bcada", "traditional.ts untouched (D-3)");
  const panels = readFileSync(new URL("../src/components/panels.tsx", import.meta.url), "utf8");
  const panel = panels.slice(panels.indexOf("export function DignitiesPanel"), panels.indexOf("export function MoonAspectsPanel"));
  assert(createHash("sha256").update(panel).digest("hex") === "9df7257aa3a8fbdc004f97a6404974ea5a1a52b169813ebf0513019c8775f7f0", "/clock DignitiesPanel untouched (D-3)");
  assert(!/site\/dignities/.test(panels) && !/site\/dignities/.test(readFileSync(new URL("../src/astro/traditional.ts", import.meta.url), "utf8")), "clock code does not import the catalog");
  // route, nav and public files
  const appSrc = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
  assert(/<Route path="\/dignities" element=\{<DignitiesPage \/>\} \/>/.test(appSrc), "App.tsx: /dignities index route");
  assert(/<Route path="\/dignities\/:planet" element=\{<DignitiesPage \/>\} \/>/.test(appSrc), "App.tsx: /dignities/:planet child route");
  assert(appSrc.lastIndexOf('path="*"') > appSrc.lastIndexOf("/dignities/:planet"), "App.tsx: catch-all remains last");
  assert(/\{ to: "\/library", label: "Library" \},\n\s*\{ to: "\/dignities", label: "Dignities" \},/.test(layout), "header nav: Dignities after Library");
  assert((layout.match(/label: "Dignities"/g) || []).length === 1 && !/to: "\/dignities\//.test(layout), "header nav: one Dignities entry, no per-planet items");
  const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  const llms = readFileSync(new URL("../public/llms.txt", import.meta.url), "utf8");
  assert(sitemap.includes("<loc>https://cunning-man.vercel.app/dignities</loc>"), "sitemap: /dignities");
  for (const c of PLANET_CATALOGS) {
    assert(sitemap.includes(`<loc>https://cunning-man.vercel.app/dignities/${c.key}</loc>`), `sitemap: /dignities/${c.key}`);
  }
  const digLine = (llms.match(/^- \/dignities — [\s\S]*?(?=\n- |\n## |$)/m) || [""])[0];
  assert(digLine.length > 0 && !BANNED.test(digLine) && !/uranus|neptune|pluto|tarot/i.test(digLine), "llms.txt: /dignities line, clean wording");
  for (const c of PLANET_CATALOGS) {
    const re = new RegExp(`^- /dignities/${c.key} — .+`, "m");
    const line = (llms.match(re) || [""])[0];
    assert(line.includes(c.name) && /Lilly, Christian Astrology, 1647, Book 1/.test(line) && /study page/.test(line), `llms.txt: /dignities/${c.key}`);
    assert(!BANNED.test(line) && !/uranus|neptune|pluto|tarot/i.test(line), `llms.txt: /dignities/${c.key} clean wording`);
  }
}

// /dignities/:planet (DIGNITIES-002 §4–§7, D-1–D-4): WebPage per traditional planet,
// backlinks, breadcrumbs, stable term @id, no banned types, no new sources.
{
  const DIG_URL = "https://cunning-man.vercel.app/dignities";
  const indexLd = routeHead(DIGNITIES_PATH).jsonLd!;
  const indexParts = indexLd.hasPart as Record<string, unknown>[];
  const indexPlanets = (indexParts.find((x) => x["@type"] === "DefinedTermSet" && x.name === "Classical planets")!.hasDefinedTerm) as Record<string, unknown>[];
  const lib = LIBRARY_BOOKS.find((b) => b.id === "christian-astrology")!;
  const book = JSON.stringify({ "@type": "Book", name: lib.title, author: { "@type": "Person", name: lib.author }, datePublished: String(lib.year), url: lib.url });
  const BANNED = /\btrad(e|es|er|ers|ing)\b|\bentr(y|ies)\b|\bexit|signal|\bbuy\b|\bsell\b|\bedge\b|win rate|profit|ticker|funded|prop[- ]?firm|price|financ|invest|\bcur(e|es|ed|ing)\b|\bdos(e|es|ing|age)\b|remed|prescri|career|\$/i;
  const pageSrc = readFileSync(new URL("../src/pages/site/DignitiesPage.tsx", import.meta.url), "utf8");
  const PLANET_TYPES = ["WebPage", "WebSite", "Book", "Person", "DefinedTermSet", "DefinedTerm", "CreativeWork", "Occupation", "DayOfWeek", "Country", "City", "BreadcrumbList", "ListItem", "ImageObject"];
  const BANNED_TYPES = /"(WebApplication|CollectionPage|Library|LibrarySystem|Plant|Animal|Herb|Taxon|Drug|DrugClass|DietarySupplement|Substance|Medical[A-Za-z]*|SuperficialAnatomy|AnatomicalStructure|HowTo|HowToStep|AdministrativeArea|Landform|Cemetery|CivicStructure|LandmarksOrHistoricalBuildings|BodyOfWater|Place|State|Continent|Organization|Offer|MonetaryAmount|PriceSpecification|QuantitativeValue|QualitativeValue|PropertyValue|WeatherForecast|Color|Colour|Mineral|Angel|Deity|Planet|ZodiacSign|Correspondence|Profession|Tarot)"/;
  const BANNED_PROPS = /"(offers|price|priceCurrency|estimatedSalary|occupationalCategory|address|geo|telephone|relatedTo|knowsAbout|color|publisher|creator|dosage|keywords)"/;

  for (const c of PLANET_CATALOGS) {
    const path = planetPath(c.key);
    const h = routeHead(path);
    assert(h.jsonLd, `${path}: has JSON-LD`);
    const ld = h.jsonLd!;
    const text = JSON.stringify(ld);
    const types = [...text.matchAll(/"@type":"([^"]+)"/g)].map((m) => m[1]);
    assert(ld["@type"] === "WebPage" && ld.name === planetPageName(c.name), `${path}: WebPage name`);
    assert(h.canonical === absUrl(path) && ld.url === h.canonical, `${path}: canonical per route`);
    assert(ld.description === planetPageDescription(c), `${path}: description from the catalog`);
    assert(ld.isAccessibleForFree === true, `${path}: isAccessibleForFree`);
    const keys = Object.keys(ld).sort().join(",");
    const baseKeys = "@context,@type,about,breadcrumb,description,hasPart,inLanguage,isAccessibleForFree,isBasedOn,isPartOf,mainEntity,name,relatedLink,url";
    const artKeys = "@context,@type,about,breadcrumb,description,hasPart,inLanguage,isAccessibleForFree,isBasedOn,isPartOf,mainEntity,name,primaryImageOfPage,relatedLink,url";
    assert(keys === (artForPath(path) ? artKeys : baseKeys), `${path}: only the §4 page properties`);
    common(path, ld);
    const required = ["WebPage", "WebSite", "Book", "Person", "DefinedTermSet", "DefinedTerm", "CreativeWork", "Occupation", "DayOfWeek", "BreadcrumbList", "ListItem"];
    assert(required.every((t) => types.includes(t)), `${path}: uses the required types`);
    if (c.places.some((pl) => pl.type === "Country")) assert(types.includes("Country"), `${path}: Country`);
    if (c.places.some((pl) => pl.type === "City")) assert(types.includes("City"), `${path}: City`);
    for (const t of new Set(types)) assert(PLANET_TYPES.includes(t), `${path}: allowed @type ${t}`);
    assert(!BANNED_TYPES.test(text), `${path}: no banned or invented types`);
    assert(!BANNED_PROPS.test(JSON.stringify({ ...ld, primaryImageOfPage: undefined })), `${path}: no banned properties outside ImageObject`);
    assert(!/uranus|neptune|pluto/i.test(text), `${path}: no modern outer planets`);
    assert(!/tarot|agrippa|al-biruni|biruni/i.test(text), `${path}: no tarot, Agrippa or Al-Biruni`);
    assert(JSON.stringify(ld.isBasedOn) === book, `${path}: isBasedOn the Lilly Book`);
    const persons = [...text.matchAll(/\{"@type":"Person"[^}]*\}/g)].map((m) => m[0]);
    const artists = new Set([`{"@type":"Person","name":"${lib.author}"}`]);
    const artHit = artForPath(path);
    if (artHit?.work.creatorName) artists.add(`{"@type":"Person","name":"${artHit.work.creatorName}"}`);
    assert(persons.length > 0 && persons.every((p) => artists.has(p)), `${path}: Person only as the cited Book's author or the ImageObject artist, name only`);
    const term = ld.mainEntity as Record<string, unknown>;
    assert(JSON.stringify(term) === JSON.stringify(ld.about), `${path}: about and mainEntity are the same DefinedTerm`);
    assert(term["@type"] === "DefinedTerm" && term["@id"] === `${DIG_URL}#${c.key}` && term.url === absUrl(path) && term.termCode === c.key && term.name === c.name, `${path}: planet DefinedTerm @id and url`);
    assert(JSON.stringify(term.inDefinedTermSet) === JSON.stringify({ "@type": "DefinedTermSet", name: "Classical planets", url: `${DIG_URL}#planets` }), `${path}: inDefinedTermSet is the Classical planets set`);
    const indexTerm = indexPlanets.find((t) => t.termCode === c.key)!;
    assert(indexTerm["@id"] === term["@id"], `${path}: DefinedTerm @id matches the index`);
    const crumbs = ld.breadcrumb as Record<string, unknown>;
    const items = crumbs.itemListElement as Record<string, unknown>[];
    assert(crumbs["@type"] === "BreadcrumbList" && items.length === 3, `${path}: BreadcrumbList of three steps`);
    assert(items[0]["@type"] === "ListItem" && items[0].position === 1 && items[0].name === "The Cunning Man" && items[0].item === `${SITE_ORIGIN}/`, `${path}: breadcrumb 1`);
    assert(items[1]["@type"] === "ListItem" && items[1].position === 2 && items[1].name === "Dignities and Correspondences" && items[1].item === DIG_URL, `${path}: breadcrumb 2`);
    assert(items[2]["@type"] === "ListItem" && items[2].position === 3 && items[2].name === c.name && items[2].item === absUrl(path), `${path}: breadcrumb 3 is this page`);
    const related = ld.relatedLink as string[];
    const siblings = PLANET_CATALOGS.filter((x) => x.key !== c.key).map((x) => absUrl(planetPath(x.key)));
    assert(Array.isArray(related) && related.length === 6 && JSON.stringify(related) === JSON.stringify(siblings), `${path}: relatedLink is the six sibling URLs`);
    const sec = ld.hasPart as Record<string, unknown>;
    assert(sec["@type"] === "CreativeWork" && sec.url === absUrl(path) && JSON.stringify(sec.isBasedOn) === book, `${path}: hasPart CreativeWork on this page`);
    assert(JSON.stringify((sec.isPartOf as Record<string, unknown>).url) === JSON.stringify(DIG_URL) || (sec.isPartOf as Record<string, unknown>).url === DIG_URL, `${path}: chapter isPartOf the /dignities WebPage`);
    const men = sec.mentions as Record<string, unknown>[];
    const days = men.filter((m) => m["@type"] === "DayOfWeek");
    assert(days.length === 1 && days[0]["@id"] === `https://schema.org/${c.day}` && days[0].name === c.day, `${path}: DayOfWeek ${c.day}`);
    const occ = men.filter((m) => m["@type"] === "Occupation");
    assert(occ.length === c.occupations.length && occ.every((o) => {
      const k = Object.keys(o).sort().join(",");
      return k === "@type,description,name" || k === "@type,description,name,sameAs";
    }), `${path}: Occupation name + description only`);
    const places = men.filter((m) => m["@type"] === "Country" || m["@type"] === "City");
    assert(places.every((pl) => {
      const k = Object.keys(pl).sort().join(",");
      return k === "@type,description,name" || k === "@type,description,name,sameAs";
    }), `${path}: Country/City name + description only`);
    assert(!BANNED.test(text) && !/advice/i.test(text), `${path}: no banned wording in JSON-LD`);
    assert(JSON.stringify(routeHead(path + "/")) === JSON.stringify(h), `${path}/: trailing slash is the same page`);
  }

  assert(/aria-label="Breadcrumb"/.test(pageSrc), "planet page: visible breadcrumb trail");
  assert(/Back to Dignities and Correspondences/.test(pageSrc), "planet page: visible back link to /dignities");
  assert(/aria-label="Other planets"/.test(pageSrc) && /PLANET_CATALOGS\.filter\(\(p\) => p\.key !== catalog\.key\)/.test(pageSrc), "planet page: visible links to the six siblings");
  assert(/return <NotFoundPage \/>/.test(pageSrc), "unknown slug: NotFoundPage (MN-1)");
  assert(!/SiteHome/.test(pageSrc), "planet miss does not render SiteHome");
  assert(/planetFromPath/.test(pageSrc) && !/PRESS\[0\]/.test(pageSrc), "unknown slug does not copy the press fallback");
  assert(!/LATER_BOOK1_POINTERS|FURTHER_STUDY_IDS/.test(pageSrc.slice(pageSrc.indexOf("function PlanetPage"), pageSrc.indexOf("function DignitiesIndex"))), "planet page: no Dragon, colours, or further-study books");
  const pageLiterals = [...pageSrc.replace(/className="[^"]*"/g, "").matchAll(/>([^<>{}]+)</g)].map((m) => m[1]).join(" ");
  assert(!BANNED.test(pageLiterals), "planet/miss page literals: no banned wording");
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
for (const path of ["/dignity", "/lib", "/nope", "/clock/extra", "/press/nope", "/press/LAUNCH", "/press/launch/x", "/spells", "/spells/other", "/index.html"]) {
  const h = routeHead(path);
  assert(h.jsonLd === null, `${path}: unknown -> no JSON-LD`);
}
// QC-SITE-001 M-2: unknown paths and press slugs are not-found pages: no canonical.
for (const path of ["/nope", "/this-does-not-exist", "/press/nope", "/press/LAUNCH", "/clock/extra", "/index.html", "/downloads/ai-vs-the-sky.pdf"]) {
  const h = routeHead(path);
  assert(h.canonical === null && h.jsonLd === null, `${path}: not found -> no canonical, no JSON-LD`);
  assert(JSON.stringify(pageMeta(path)) === JSON.stringify(NOT_FOUND_META), `${path}: not-found title and description`);
}

// DIGNITIES-002 / HUB-FIX-002 MN-1: unknown planet slugs are not-found (no canonical, no JSON-LD)
for (const path of ["/dignities/x", "/dignities/pluto", "/dignities/uranus", "/dignities/neptune", "/dignities/SATURN", "/dignities/Saturn", "/dignities/saturn/extra", "/dignities/dragon"]) {
  const h = routeHead(path);
  assert(h.jsonLd === null && h.canonical === null, `${path}: unknown planet slug -> no JSON-LD, no canonical`);
  assert(JSON.stringify(pageMeta(path)) === JSON.stringify(NOT_FOUND_META), `${path}: not-found title and description`);
}
assert(routeHead("/dignities/saturn").jsonLd !== null && routeHead("/dignities/saturn").canonical === absUrl(planetPath("saturn")), "/dignities/saturn is a known planet page");

// HUB-PAGES-001 / HUB-FIX-002 MN-1: unknown library slugs are not-found
for (const path of ["/library/x", "/library/Christian-Astrology", "/library/CHRISTIAN-ASTROLOGY", "/library/christian-astrology/extra", "/library/esoteric", "/library/ai-vs-the-sky"]) {
  const h = routeHead(path);
  assert(h.jsonLd === null && h.canonical === null, `${path}: unknown library slug -> no JSON-LD, no canonical`);
  assert(JSON.stringify(pageMeta(path)) === JSON.stringify(NOT_FOUND_META), `${path}: not-found title and description`);
}
assert(routeHead("/library/christian-astrology").jsonLd !== null && routeHead("/library/christian-astrology").canonical === absUrl(bookPath("christian-astrology")), "/library/christian-astrology is a known book page");

// App.tsx routes all covered
const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const routes = [...app.matchAll(/path="([^"]+)"/g)].map((m) => m[1]).filter((r) => r !== "*" && r !== "/press/:slug" && r !== "/dignities/:planet" && r !== "/dignities/*" && r !== "/library/:book" && r !== "/library/*"
  && r !== "/charts/:figure" && r !== "/charts/*" && r !== "/articles/:beat/:slug" && r !== "/articles/*");
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
    assert(!/MonetaryAmount|priceCurrency|"Offer"|@type":"Offer/.test(s), `${f}: bundle free of Offer/price`);
  }
  console.log(`bundle scanned: ${files.length} files in ${bundle}`);
}


// HUB-ART-001: page stills, ImageObject, credits, siblings, sample learn-more.
{
  const artDir = new URL("../public/art/", import.meta.url);
  const pageSrc = readFileSync(new URL("../src/components/PageArt.tsx", import.meta.url), "utf8");
  const layoutSrc = readFileSync(new URL("../src/components/SiteLayout.tsx", import.meta.url), "utf8");
  const digSrc = readFileSync(new URL("../src/pages/site/DignitiesPage.tsx", import.meta.url), "utf8");
  assert(/<PageArt \/>/.test(layoutSrc), "SiteLayout renders PageArt");
  assert(/work\.sourceRecord/.test(pageSrc) && /Source record/.test(pageSrc), "PageArt links the visible credit to the source record");
  assert(/assignment\.siblings/.test(pageSrc), "PageArt renders art siblings");
  assert(/Learn more/.test(digSrc) && /learnMoreForCatalog/.test(digSrc), "dignities pages render sample learn-more links");
  assert(!/sickness/i.test(LEARN_MORE.map((r) => r.term).join(" ")), "learn-more sample has no sickness terms");

  const lib = routeHead("/library").jsonLd!;
  assert(!JSON.stringify(lib).includes("ImageObject") && !lib.primaryImageOfPage, "/library: no placeholder ImageObject (D-5)");
  for (const b of LIBRARY_BOOKS) {
    const h = routeHead(`/library/${b.id}`);
    if (h.jsonLd) assert(!JSON.stringify(h.jsonLd).includes("ImageObject"), `/library/${b.id}: no ImageObject (D-5)`);
  }

  const CC0_DEED = "https://creativecommons.org/publicdomain/zero/1.0/deed.en";
  for (const a of ART_ASSIGNMENTS) {
    const work = ART_WORKS[a.artId];
    const shipped = SHIPPED_FILES.has(work.file);
    const fileOk = existsSync(new URL(work.file, artDir));
    if (shipped) assert(fileOk, `${work.file} is present under public/art/`);
    const hit = artForPath(a.path);
    if (!shipped) {
      assert(hit === null, `${a.path}: unshipped still is not attached`);
      const ld = routeHead(a.path).jsonLd;
      if (ld) assert(!ld.primaryImageOfPage && !ld.image, `${a.path}: no ImageObject when the still was not shipped`);
      continue;
    }
    assert(hit && hit.work.id === work.id, `${a.path}: art assignment`);
    const h = routeHead(a.path);
    assert(h.jsonLd, `${a.path}: has JSON-LD`);
    const ld = h.jsonLd!;
    // m-2: WebApplication carries the still as image; WebPage types as primaryImageOfPage.
    const isApp = ld["@type"] === "WebApplication";
    assert(isApp ? !("primaryImageOfPage" in ld) : !("image" in ld), `${a.path}: ${isApp ? "WebApplication has image, never primaryImageOfPage" : "WebPage type has primaryImageOfPage"}`);
    const img = (isApp ? ld.image : ld.primaryImageOfPage) as Record<string, unknown> | undefined;
    assert(img && img["@type"] === "ImageObject", `${a.path}: page still is an ImageObject`);
    assert(ogImage(a.path) === img.contentUrl, `${a.path}: og:image is the page still (M-3)`);
    const content = String(img.contentUrl);
    assert(content === absUrl(contentPath(work)) && content.startsWith(`${SITE_ORIGIN}/art/`), `${a.path}: contentUrl is same-origin /art/`);
    assert(img.url === work.sourceRecord, `${a.path}: ImageObject.url is the source record`);
    assert(img.license === work.license, `${a.path}: license is present`);
    const alp = String(img.acquireLicensePage);
    if (work.licenseKind === "CC0") assert(alp === CC0_DEED, `${a.path}: acquireLicensePage is the CC0 deed`);
    else assert(alp === work.sourceRecord && /commons\.wikimedia\.org\/wiki\/File:/.test(alp), `${a.path}: acquireLicensePage is the Commons file page`);
    assert(!/shop|cart|buy|purchase|price/i.test(alp) && !/offer/i.test(JSON.stringify(img)), `${a.path}: acquireLicensePage is not a shop or Offer`);
    const about = img.about;
    const abouts = Array.isArray(about) ? about : [about];
    for (const id of a.about) assert(abouts.includes(id), `${a.path}: about includes ${id}`);
    const creator = img.creator as Record<string, unknown> | undefined;
    if (work.id === "metzger-clock") {
      assert(creator === undefined, `${a.path}: clock ImageObject has no single-Person creator`);
      const credit = String(img.creditText);
      assert(/probably by Jeremias Metzger/.test(credit) && /[Ss]igned by Caspar Behaim/.test(credit), `${a.path}: credit names Metzger (probably) and Behaim (signed by)`);
    } else if (work.creatorName) {
      assert(creator && creator["@type"] === "Person" && creator.name === work.creatorName && Object.keys(creator).sort().join(",") === "@type,name", `${a.path}: creator is Person, name only`);
    } else {
      assert(creator === undefined, `${a.path}: no ImageObject.creator when creatorName is omitted`);
    }
    if (work.dateCreated) {
      assert(img.dateCreated === work.dateCreated, `${a.path}: dateCreated is the artwork date`);
      assert(!String(img.dateCreated).startsWith("2019"), `${a.path}: dateCreated is not the upload timestamp`);
    } else {
      assert(img.dateCreated === undefined, `${a.path}: no dateCreated when the source states no artwork date`);
    }
    assert(img.creditText === creditText(work), `${a.path}: creditText`);
    const text = JSON.stringify(ld);
    assert(!/"Offer"|MonetaryAmount|"price"/.test(text), `${a.path}: no Offer, price or MonetaryAmount`);
    for (const sib of a.siblings) {
      assert(hit.assignment.siblings.includes(sib), `${a.path}: art sibling ${sib}`);
    }
  }

  // Sample learn-more is the accepted set only (D-8); UNMAPPED names are not linked.
  assert(LEARN_MORE.length === 23, "learn-more sample has 23 mapped rows");
  const unmapped = ["Ferraria", "Cullen", "Ingoldstad", "Constantia", "Norimberge", "Clownes", "Night-farmers", "Pulse", "Willow", "Woolf-bane", "Chrystall"];
  for (const name of unmapped) assert(!learnMoreForName(name), `UNMAPPED ${name} has no learn-more row`);
  const jup = routeHead("/dignities/jupiter").jsonLd!;
  const mentions = ((jup.hasPart as Record<string, unknown>).mentions ?? []) as Record<string, unknown>[];
  const judges = mentions.find((m) => m["@type"] === "Occupation" && m.name === "Judges");
  assert(judges && judges.sameAs === "https://www.wikidata.org/wiki/Q16533", "/dignities/jupiter: Judges Occupation has sameAs");
  const italyPage = routeHead("/dignities/sun").jsonLd!;
  const italy = (((italyPage.hasPart as Record<string, unknown>).mentions ?? []) as Record<string, unknown>[]).find((m) => m.name === "Italy");
  assert(italy && italy["@type"] === "Country" && italy.sameAs === "https://www.wikidata.org/wiki/Q38", "/dignities/sun: Italy Country has sameAs");

  const sunCat = PLANET_CATALOGS.find((c) => c.key === "sun")!;
  const merCat = PLANET_CATALOGS.find((c) => c.key === "mercury")!;
  assert(!learnMoreForCatalog(sunCat).some((r) => r.term === "Poets"), "/dignities/sun: no Poets learn-more (Names prose is not a signification)");
  assert(learnMoreForCatalog(merCat).some((r) => r.term === "Poets"), "/dignities/mercury: Poets learn-more remains (occupation list)");
  for (const c of PLANET_CATALOGS) {
    const hay = occupationHaystack(c);
    for (const r of learnMoreForCatalog(c).filter((row) => row.kind === "occupation")) {
      const escaped = r.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      assert(new RegExp(`(?<![A-Za-z])${escaped}(?![A-Za-z])`).test(hay), `${c.key}: occupation learn-more ${r.term} is drawn only from occupation/profession entries`);
    }
  }
  const names = sunCat.entries.find((e) => e.heading === "Names")?.text ?? "";
  assert(/Poets/.test(names), "/dignities/sun: Names prose still mentions Poets in the catalog (matcher must ignore it)");

  const artSrc = readFileSync(new URL("../src/site/art.ts", import.meta.url), "utf8");
  const cellCredit = creditText(ART_WORKS["cellarius-harmonia"]);
  assert(!/1708/.test(artSrc) && !/1708/.test(cellCredit) && !/1708/.test(JSON.stringify(routeHead("/synastry").jsonLd)), "Cellarius credit and art.ts never say 1708");
  assert(/1660–61 \(Amsterdam: Johannes Janssonius\)/.test(cellCredit), "Cellarius date is 1660–61 (Amsterdam: Johannes Janssonius)");
  assert(!/Children of the Planets/.test(artSrc) && !/Children of the Planets/.test(pageSrc) && !/Children of the Planets/.test(JSON.stringify(routeHead("/dignities/sun").jsonLd)), "no Children of the Planets wording");
}


// R-CHARTS-001 §8–§9 (D-1–D-10) and R-EDITORIAL-001 §9: /charts, figure pages,
// chart press releases, /articles. Guardrails (owner t683u/t690u/t697u):
// Astro-Databank Rodden AA/A/B only, no gossip, health, death, pregnancy or
// scandal wording, no trading or price wording, no Offer, no likeness.
{
  const CH_URL = absUrl(CHARTS_PATH);
  const ADB = "https://www.astro.com/astro-databank/";
  const BANNED = /\btrad(e|es|er|ers|ing)\b|\bentr(y|ies)\b|\bexit|signal|\bbuy\b|\bsell\b|\bedge\b|win rate|profit|market|ticker|funded|prop[- ]?firm|advice|disclaimer|forecast|do not trade|hours not to trade|price|financ|invest|\bstocks?\b|\bshares?\b|\bIPO\b|dividend|health|death|\bdie[sd]?\b|pregnan|illness|diagnos|scandal|divorce|rumou?r|gossip/i;
  const stripDisclaimer = (t: string) => t.replace(/For entertainment &(amp;)? study\. Not financial, medical, or legal advice\./g, "");
  const ISO = /^\d{4}-\d{2}-\d{2}$/;
  const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  const llms = readFileSync(new URL("../public/llms.txt", import.meta.url), "utf8");
  const pageSrc = readFileSync(new URL("../src/pages/site/ChartsPage.tsx", import.meta.url), "utf8");
  const types = (ld: unknown) => [...JSON.stringify(ld).matchAll(/"@type":"([^"]+)"/g)].map((m) => m[1]);

  // /charts CollectionPage + ItemList
  const idx = routeHead(CHARTS_PATH).jsonLd!;
  assert(idx["@type"] === "CollectionPage" && idx.isAccessibleForFree === true && idx.description === CHARTS_DESCRIPTION, "/charts: CollectionPage, free, description");
  assert(Object.keys(idx).sort().join(",") === "@context,@type,description,inLanguage,isAccessibleForFree,isPartOf,mainEntity,name,primaryImageOfPage,relatedLink,url", "/charts: only the §7 properties plus primaryImageOfPage");
  const list = idx.mainEntity as Record<string, unknown>;
  const els = list.itemListElement as Record<string, unknown>[];
  assert(CHART_FIGURES.length === 4 && list["@type"] === "ItemList" && list.numberOfItems === CHART_FIGURES.length && els.length === CHART_FIGURES.length, "/charts: ItemList size equals the catalog (4)");
  els.forEach((el, i) => {
    const f = CHART_FIGURES[i];
    assert(el["@type"] === "ListItem" && el.position === i + 1 && el.name === f.name && el.url === absUrl(figurePath(f.slug)), `/charts item ${i}: position, name, url`);
  });
  assert(JSON.stringify(idx.relatedLink) === JSON.stringify([absUrl("/natal"), absUrl("/dignities")]), "/charts: relatedLink /natal and /dignities");
  assert(personNodes(idx).length === 0 && !types(idx).includes("Place"), "/charts: no Person or Place on the collection");
  assert(CHART_FIGURES.map((f) => f.name).join("|") === "King Charles III|Liza Minnelli|Billy Idol|Queen Latifah", "/charts: exactly the four launch figures");

  // Research cross-check (R-CHARTS-001 §4, PyEphem): same sign, within 0°10′.
  const XCHECK: Record<string, { sect: "day" | "night"; pos: string[] }> = {
    "charles-iii": { sect: "night", pos: ["22 25 scorpio", "0 25 taurus", "6 57 scorpio", "16 23 libra", "20 56 sagittarius", "29 53 sagittarius", "5 16 virgo"] },
    "liza-minnelli": { sect: "day", pos: ["21 28 pisces", "19 08 cancer", "9 01 aries", "1 00 aries", "16 06 cancer", "26 03 libra", "18 00 cancer"] },
    "billy-idol": { sect: "night", pos: ["7 40 sagittarius", "21 19 gemini", "5 28 sagittarius", "0 38 capricorn", "1 02 scorpio", "1 00 virgo", "25 25 scorpio"] },
    "queen-latifah": { sect: "day", pos: ["27 31 pisces", "7 33 leo", "22 38 pisces", "10 20 aries", "8 11 taurus", "4 52 scorpio", "6 34 taurus"] },
  };
  const ORDER = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"] as const;
  const SIGN_ORDER = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];

  const STATUS_KEYS = "@context,@type,about,breadcrumb,citation,description,inLanguage,isAccessibleForFree,isBasedOn,isPartOf,mainEntity,name,primaryImageOfPage,relatedLink,url";
  const charts: Record<string, ReturnType<typeof figureChart>> = {};
  for (const f of CHART_FIGURES) {
    const path = figurePath(f.slug);
    const where = path;
    // catalog: Astro-Databank data and identity
    assert((ALLOWED_RATINGS as readonly string[]).includes(f.roddenRating) && ["AA", "A", "B"].includes(f.roddenRating), `${where}: Rodden rating ${f.roddenRating} is AA, A or B`);
    assert(f.adbUrl.startsWith(ADB) && f.adbWikiUrl.startsWith("https://www.astro.com/wiki/astro-databank/index.php?title=") && f.adbWikiUrl.endsWith(f.adbUrl.slice(ADB.length)), `${where}: Astro-Databank URL and the wiki record read`);
    assert(ISO.test(f.birthDate) && /^\d{2}:\d{2}$/.test(f.birthTimeText) && /^[A-Z]{3}$/.test(f.tzAbbr), `${where}: ISO date, HH:MM time, zone abbreviation`);
    assert(ISO.test(f.adbLastEdit) && ISO.test(f.verifiedOn) && f.dataSource.length > 0 && f.collector.length > 0, `${where}: record last edit, read date, data source, collector`);
    const title = decodeURIComponent(f.wikipediaUrl.replace("https://en.wikipedia.org/wiki/", ""));
    const ruled = title.toLowerCase().replace(/[(),]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    assert(ruled === f.slug, `${where}: slug follows the Wikipedia title rule (${ruled})`);
    assert(/^Q\d+$/.test(f.wikidataId) && /^https:\/\/en\.wikipedia\.org\/wiki\//.test(f.placeSameAs), `${where}: Wikidata id and birthplace Wikipedia URL`);
    assert(f.placeType === (f.slug === "billy-idol" ? "Place" : "City"), `${where}: D-7 birthplace type`);
    if (f.hook) assert(ISO.test(f.hook.date) && f.hook.url.startsWith("https://") && f.hook.outlet.length > 0, `${where}: dated hook with outlet and URL`);
    else assert(f.slug === "charles-iii", `${where}: only Charles III has no hook (HUB-FIX-001 cut)`);
    assert(NON_PORTRAIT_ART_IDS.has(f.artId), `${where}: art id on the non-portrait allowlist`);
    assert(PRESS.some((p) => p.slug === f.pressSlug), `${where}: pressSlug ${f.pressSlug} exists in PRESS`);
    const [lat, lng] = f.latLongText.split(",").map(parseAdbCoord);
    assert(Math.abs(lat) <= 90 && Math.abs(lng) <= 180, `${where}: Astro-Databank coordinates parse`);

    // engine: the record's clock time and zone match the place's historical zone; Research cross-check
    const chart = figureChart(f);
    charts[f.slug] = chart;
    assert(chart.wallClock.startsWith(`${f.birthTimeText}:`), `${where}: engine wall clock ${chart.wallClock} equals the record's ${f.birthTimeText} ${f.tzAbbr}`);
    const wp = wallParts(chart.date, chart.tzName);
    assert(`${wp.year}-${String(wp.month + 1).padStart(2, "0")}-${String(wp.day).padStart(2, "0")}` === f.birthDate, `${where}: engine local date equals the record's date`);
    const x = XCHECK[f.slug];
    assert(chart.sect === x.sect, `${where}: sect ${chart.sect} matches the cross-check ${x.sect}`);
    ORDER.forEach((key, i) => {
      const [d, m, sign] = x.pos[i].split(" ");
      const want = SIGN_ORDER.indexOf(sign) * 30 + Number(d) + Number(m) / 60;
      const b = chart.bodies.find((y) => y.key === key)!;
      assert(b.sign === sign, `${where}: ${key} sign ${b.sign} matches the cross-check ${sign}`);
      assert(Math.abs(b.lon - want) <= 10 / 60, `${where}: ${key} within 0°10′ of the cross-check`);
    });
    const reads = figureReads(chart);
    assert(reads.length === 7 && reads.map((r) => r.key).join(",") === PLANET_CATALOGS.map((c) => c.key).join(","), `${where}: seven traditional planets read, each with a /dignities page`);
    const visible = stripDisclaimer([f.name, f.hook?.sentence ?? "", f.dataNote ?? "", f.patternNote ?? "", figurePageName(f), figurePageDescription(f), ...reads.map((r) => `${r.position} ${r.condition}`)].join(" "));
    assert(!BANNED.test(visible), `${where}: no banned wording in visible copy (${visible.match(BANNED)?.[0]})`);

    // JSON-LD
    const h = routeHead(path);
    assert(h.jsonLd, `${where}: has JSON-LD`);
    const ld = h.jsonLd!;
    const text = JSON.stringify(ld);
    assert(ld["@type"] === "WebPage" && ld.name === figurePageName(f) && ld.description === figurePageDescription(f), `${where}: WebPage (D-1), name, description`);
    assert(h.canonical === absUrl(path) && ld.url === h.canonical, `${where}: canonical per slug`);
    assert(Object.keys(ld).sort().join(",") === (f.hook ? STATUS_KEYS : STATUS_KEYS.replace("citation,", "")), `${where}: only the §7 properties (no citation without a hook)`);
    assert(ld.isAccessibleForFree === true, `${where}: isAccessibleForFree`);
    common(path, ld);
    const FIG_TYPES = ["WebPage", "WebSite", "Person", f.placeType, "BreadcrumbList", "ListItem", "ImageObject"];
    for (const t of new Set(types(ld))) assert(FIG_TYPES.includes(t), `${where}: allowed @type ${t}`);
    assert(!/"(Article|NewsArticle|Offer|MonetaryAmount|Organization|Corporation|Event|Review|Rating)"/.test(text), `${where}: no Article, Offer, Organization or other stretched types`);
    const person = ld.mainEntity as Record<string, unknown>;
    assert(JSON.stringify(person) === JSON.stringify(ld.about), `${where}: about and mainEntity are the same Person`);
    assert(Object.keys(person).sort().join(",") === "@id,@type,birthDate,birthPlace,name,sameAs", `${where}: Person keys exactly @id, @type, name, birthDate, birthPlace, sameAs`);
    assert(person["@type"] === "Person" && person["@id"] === `${absUrl(path)}#person` && person.name === f.name, `${where}: Person @id and name`);
    assert(person.birthDate === f.birthDate && ISO.test(String(person.birthDate)), `${where}: birthDate is a plain ISO date`);
    assert(JSON.stringify(person.sameAs) === JSON.stringify([f.wikipediaUrl, `https://www.wikidata.org/wiki/${f.wikidataId}`]), `${where}: sameAs is exactly Wikipedia and Wikidata`);
    assert(JSON.stringify(person.birthPlace) === JSON.stringify({ "@type": f.placeType, name: f.placeName, sameAs: f.placeSameAs }), `${where}: birthPlace ${f.placeType} with name and sameAs`);
    assert(!/birthTime|"geo"|latitude|longitude|"image"|jobTitle|award|deathDate|gender|spouse|children|parent/i.test(JSON.stringify(person)), `${where}: no birth time, geo, image, job, awards or family in the Person`);
    assert(!text.includes(f.birthTimeText) && !text.includes(f.latLongText), `${where}: birth time and coordinates stay out of JSON-LD (D-3)`);
    const allowed = PERSON_ALLOWLIST[path];
    const persons = personNodes(ld);
    assert(persons.length >= 1 && persons.every((p) => allowed.some((a) => a.id === p["@id"])), `${where}: every Person node is on PERSON_ALLOWLIST`);
    const based = ld.isBasedOn as Record<string, unknown>;
    assert(JSON.stringify(based) === JSON.stringify({ "@type": "WebPage", name: `Astro-Databank: ${f.name}`, url: f.adbUrl }) && String(based.url).startsWith(ADB), `${where}: isBasedOn the Astro-Databank WebPage`);
    assert(ld.citation === f.hook?.url, `${where}: citation is the hook URL`);
    const crumbs = (ld.breadcrumb as Record<string, unknown>).itemListElement as Record<string, unknown>[];
    assert(crumbs.length === 3 && crumbs[0].item === `${SITE_ORIGIN}/` && crumbs[1].name === "Charts" && crumbs[1].item === CH_URL && crumbs[2].name === f.name && crumbs[2].item === absUrl(path) && crumbs.every((c, i) => c.position === i + 1 && c["@type"] === "ListItem"), `${where}: three-step breadcrumb`);
    const siblings = CHART_FIGURES.filter((y) => y.slug !== f.slug).map((y) => absUrl(figurePath(y.slug)));
    assert(JSON.stringify(ld.relatedLink) === JSON.stringify(siblings), `${where}: relatedLink is exactly the sibling figure pages`);
    const img = ld.primaryImageOfPage as Record<string, unknown>;
    const hit = artForPath(path);
    assert(hit && NON_PORTRAIT_ART_IDS.has(hit.work.id) && img["@type"] === "ImageObject" && img.contentUrl === absUrl(contentPath(hit.work)), `${where}: primaryImageOfPage is a non-portrait still`);
    assert(JSON.stringify(img.about) === JSON.stringify(absUrl(path)) && hit.assignment.siblings.includes("/natal"), `${where}: art about this page, /natal as art sibling (D-8)`);
    assert(!BANNED.test(JSON.stringify({ ...ld, primaryImageOfPage: undefined })), `${where}: no banned wording in JSON-LD`);
    assert(JSON.stringify(routeHead(path + "/")) === JSON.stringify(h), `${where}/: trailing slash is the same page`);
    const up = routeHead(path.toUpperCase());
    assert(up.jsonLd === null && up.canonical === null, `${where} upper case: miss, no canonical`);
    assert(figureFromPath(path)?.slug === f.slug, `${where}: figureFromPath exact match`);
    // sitemap and llms.txt
    assert(sitemap.includes(`<loc>${absUrl(path)}</loc>`) && sitemap.includes(`<loc>${absUrl(`/press/${f.pressSlug}`)}</loc>`), `sitemap: ${path} and its release`);
    const line = (llms.match(new RegExp(`^- ${path} — .+`, "m")) || [""])[0];
    assert(line.includes(f.name) && /study page/.test(line) && /Astro-Databank/.test(line) && line.includes(`Rodden rating ${f.roddenRating}`), `llms.txt: ${path} line with study page, Astro-Databank and rating`);
    assert(!BANNED.test(line), `llms.txt: ${path} clean wording`);
  }
  // sensitive reads the page states in one line (D-5 and §4 flags)
  const idol = charts["billy-idol"].bodies.find((b) => b.key === "sun")!;
  assert(charts["billy-idol"].sect === "night" && idol.house === 6, "billy-idol: engine sect night, Sun just below the western horizon");
  assert(/sect/.test(CHART_FIGURES.find((f) => f.slug === "billy-idol")!.dataNote ?? ""), "billy-idol: page carries the one-line sect note (D-5)");
  const jup = charts["charles-iii"].bodies.find((b) => b.key === "jupiter")!;
  assert(jup.sign === "sagittarius" && jup.lon > 269.75, "charles-iii: Jupiter in the last minutes of Sagittarius, as the data note says");
  assert(/07:28/.test(CHART_FIGURES.find((f) => f.slug === "liza-minnelli")!.dataNote ?? ""), "liza-minnelli: variant time noted without choosing it");

  // figure page source: backlinks, breadcrumb, miss
  for (const needle of ['to="/natal"', 'to="/library"', 'to="/library/christian-astrology"', 'to="/dignities"', "planetPath(r.key)", "to={CHARTS_PATH}", "to={`/press/${figure.pressSlug}`}", 'aria-label="Breadcrumb"', 'aria-label="Other charts"', "CHART_FIGURES.filter((f) => f.slug !== figure.slug)"])
    assert(pageSrc.includes(needle), `figure page: ${needle}`);
  assert(/return <NotFoundPage \/>/.test(pageSrc) && /figureFromPath/.test(pageSrc) && !/PRESS\[0\]|SiteHome/.test(pageSrc), "chart miss: NotFoundPage, not the press fallback or home");
  assert(/figureChart\(figure\)/.test(pageSrc) && !/\d+°\d+′/.test(pageSrc), "figure page: positions come from the engine, none typed in");
  const lit = stripDisclaimer([...pageSrc.replace(/className="[^"]*"/g, "").matchAll(/>([^<>{}]+)</g)].map((m) => m[1]).join(" "));
  assert(!BANNED.test(lit), `charts page literals: no banned wording (${lit.match(BANNED)?.[0]})`);
  const chartsSrc = readFileSync(new URL("../src/site/charts.ts", import.meta.url), "utf8");
  assert(!/\d+°\d+′/.test(chartsSrc) && !/"(Offer|MonetaryAmount)"/.test(chartsSrc), "charts.ts: no hand-entered positions, no Offer");

  // chart press releases (§9)
  assert(PRESS[0].slug === "launch", "PRESS[0] is still launch");
  const cp = routeHead(`/press/${CHARTS_PRESS_SLUG}`).jsonLd!;
  assert(cp["@type"] === "Article" && cp.about === CH_URL && cp.isAccessibleForFree === true, "/press/charts: Article about /charts, free");
  assert(Array.isArray(cp.isBasedOn) && (cp.isBasedOn as Record<string, unknown>[]).length === 4 && (cp.isBasedOn as Record<string, unknown>[]).every((b) => String(b.url).startsWith(ADB)), "/press/charts: isBasedOn the four Astro-Databank records");
  assert(personNodes(cp).length === 0, "/press/charts: no Person");
  const pressSlugs = [CHARTS_PRESS_SLUG, ...CHART_FIGURES.map((f) => f.pressSlug)];
  for (const slug of pressSlugs) {
    const item = PRESS.find((p) => p.slug === slug)!;
    const path = `/press/${slug}`;
    const ld = routeHead(path).jsonLd!;
    assert(ld["@type"] === "Article" && !JSON.stringify(ld).includes("NewsArticle"), `${path}: Article, not NewsArticle (D-9)`);
    assert(Object.keys(ld).sort().join(",") === "@context,@type,about,datePublished,description,headline,inLanguage,isAccessibleForFree,isBasedOn,isPartOf,name,url", `${path}: Article plus about, isBasedOn, isAccessibleForFree only`);
    const links = (item.links ?? []).map((l) => l.to);
    const f = CHART_FIGURES.find((x) => x.pressSlug === slug);
    assert(links.includes(f ? figurePath(f.slug) : CHARTS_PATH) && links.includes("/natal"), `${path}: visible links to its /charts page and /natal`);
    for (const l of links) assert(l === "/natal" || l === "/dignities" || l === CHARTS_PATH || figureFromPath(l) !== undefined || /^\/dignities\/(saturn|jupiter|mars|sun|venus|mercury|moon)$/.test(l), `${path}: link ${l} is a live hub page`);
    const copy = [item.title, item.excerpt, ...item.body, ...(item.links ?? []).map((l) => l.label)].join(" ");
    assert(!BANNED.test(copy), `${path}: no banned wording in title, excerpt or body (${copy.match(BANNED)?.[0]})`);
    assert(!BANNED.test(JSON.stringify(ld)), `${path}: no banned wording in JSON-LD`);
    assert(sitemap.includes(`<loc>${absUrl(path)}</loc>`), `sitemap: ${path}`);
    if (f) {
      const about = ld.about as unknown[];
      const figLd = routeHead(figurePath(f.slug)).jsonLd!;
      assert(Array.isArray(about) && about.length === 2 && JSON.stringify(about[0]) === JSON.stringify(figLd.mainEntity) && about[1] === absUrl(figurePath(f.slug)), `${path}: about is the figure's Person (same @id) and its page`);
      assert(personNodes(ld).every((p) => PERSON_ALLOWLIST[path].some((a) => a.id === p["@id"] && a.id === personId(f))), `${path}: Person on PERSON_ALLOWLIST`);
      assert(String((ld.isBasedOn as Record<string, unknown>).url) === f.adbUrl, `${path}: isBasedOn the Astro-Databank record`);
      assert(copy.includes(`rated ${f.roddenRating}`), `${path}: states the Rodden rating`);
    }
  }
  // release claims agree with the engine (§9: "if Dev's engine disagrees, the summary changes")
  const dig = (slug: string, key: string) => charts[slug].dignities.find((d) => d.planet === key)!;
  assert(charts["charles-iii"].sect === "night" && dig("charles-iii", "venus").ruler && dig("charles-iii", "jupiter").ruler && dig("charles-iii", "moon").exalt, "chart-charles-iii: night, Venus and Jupiter in own house, Moon exalted");
  assert(charts["liza-minnelli"].sect === "day" && dig("liza-minnelli", "moon").ruler, "chart-liza-minnelli: day, Moon in own house");
  assert(dig("billy-idol", "mars").ruler && charts["billy-idol"].bodies.find((b) => b.key === "mars")!.sign === "scorpio", "chart-billy-idol: Mars in own house of Scorpio");
  const lsun = charts["queen-latifah"].bodies.find((b) => b.key === "sun")!;
  assert(charts["queen-latifah"].sect === "day" && lsun.sign === "pisces" && lsun.deg >= 20, "chart-queen-latifah: day, Sun late in Pisces");

  // Person allowance stays narrow: only the allowlisted paths carry full Person nodes
  for (const path of [...Object.keys(EXPECT), ...PRESS.map((p) => `/press/${p.slug}`), ...PLANET_CATALOGS.map((c) => planetPath(c.key)), ...LIBRARY_BOOKS.map((b) => bookPath(b.id)), ...CHART_FIGURES.map((f) => figurePath(f.slug))]) {
    const ld = routeHead(path).jsonLd;
    const nodes = ld ? personNodes(ld) : [];
    if (!PERSON_ALLOWLIST[path]) assert(nodes.length === 0, `${path}: no full Person node outside PERSON_ALLOWLIST`);
  }
  assert(Object.keys(PERSON_ALLOWLIST).length === 8, "PERSON_ALLOWLIST: four figure pages and four releases only");

  // /articles (R-EDITORIAL-001 §3, §9)
  const art = routeHead(ARTICLES_PATH).jsonLd!;
  const alist = art.mainEntity as Record<string, unknown>;
  const aels = alist.itemListElement as Record<string, unknown>[];
  const want = [...CHART_FIGURES.map((f) => absUrl(figurePath(f.slug))), ...ARTICLES.map((a) => absUrl(articlePath(a)))];
  assert(art["@type"] === "CollectionPage" && art.isAccessibleForFree === true && JSON.stringify(art.relatedLink) === JSON.stringify([CH_URL]), "/articles: CollectionPage, free, links /charts");
  assert(alist.numberOfItems === want.length && aels.length === want.length && aels.every((el, i) => el.position === i + 1 && el.url === want[i]), "/articles: ItemList size equals the catalog (celebrity beat + articles)");
  assert(!aels.some((el) => /\/articles\/celebrity/.test(String(el.url))), "/articles: no /articles/celebrity duplicate (D-1)");
  assert(personNodes(art).length === 0, "/articles: no Person");
  for (const a of ARTICLES) {
    const path = articlePath(a);
    const ld = routeHead(path).jsonLd!;
    assert(ld["@type"] === "Article" && ld.headline === a.title && ISO.test(String(ld.datePublished)) && ld.isAccessibleForFree === true, `${path}: Article`);
    common(path, ld);
    assert(a.beat in ARTICLE_BEATS && PRESS.some((p) => p.slug === a.pressSlug), `${path}: beat and pressSlug`);
    assert(!BANNED.test([a.title, a.summary, ...a.body].join(" ")) && !/\bcur(e|es|ed|ing)\b|\bdos(e|es|ing|age)\b|remed|harm/i.test(a.body.join(" ")), `${path}: no banned wording`);
    assert(sitemap.includes(`<loc>${absUrl(path)}</loc>`), `sitemap: ${path}`);
  }
  const artSrc = readFileSync(new URL("../src/pages/site/ArticlesPage.tsx", import.meta.url), "utf8");
  assert(/to=\{CHARTS_PATH\}/.test(artSrc) && /return <NotFoundPage \/>/.test(artSrc) && /articleFromPath/.test(artSrc) && !/PRESS\[0\]|SiteHome/.test(artSrc), "/articles page: links /charts, miss is NotFoundPage");
  const artLit = stripDisclaimer([...artSrc.replace(/className="[^"]*"/g, "").matchAll(/>([^<>{}]+)</g)].map((m) => m[1]).join(" "));
  assert(!BANNED.test(artLit), "/articles page literals: no banned wording");

  // unknown slugs: miss, no JSON-LD, no canonical (HUB-FIX-002 MN-1)
  for (const path of ["/charts/x", "/charts/Charles-III", "/charts/CHARLES-III", "/charts/charles-iii/extra", "/charts/charles", "/charts/avril-lavigne", "/charts/king-charles-iii"]) {
    const h = routeHead(path);
    assert(h.jsonLd === null && h.canonical === null, `${path}: miss, no JSON-LD, no canonical`);
    assert(JSON.stringify(pageMeta(path)) === JSON.stringify(NOT_FOUND_META), `${path}: not-found title and description`);
  }
  for (const path of ["/articles/x", "/articles/magic", "/articles/companies/ford", "/articles/celebrity/charles-iii", "/articles/Magic/x"]) {
    const h = routeHead(path);
    assert(h.jsonLd === null && h.canonical === null, `${path}: miss, no JSON-LD, no canonical`);
    assert(JSON.stringify(pageMeta(path)) === JSON.stringify(NOT_FOUND_META), `${path}: not-found title and description`);
  }

  // nav, routes, public files, press room links
  const layout = readFileSync(new URL("../src/components/SiteLayout.tsx", import.meta.url), "utf8");
  assert(/\{ to: "\/dignities", label: "Dignities" \},\n\s*\{ to: "\/charts", label: "Charts" \},/.test(layout) && (layout.match(/label: "Charts"/g) || []).length === 1 && !/to: "\/charts\//.test(layout), "header nav: one Charts entry after Dignities, no per-figure items (D-2)");
  assert(!/label: "Articles"/.test(layout), "header nav: no Articles entry until a non-celebrity article ships (R-EDITORIAL D-9)");
  const appSrc = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
  assert(/<Route path="\/charts" element=\{<ChartsPage \/>\} \/>/.test(appSrc) && /<Route path="\/charts\/:figure" element=\{<ChartsPage \/>\} \/>/.test(appSrc), "App.tsx: /charts routes");
  assert(/<Route path="\/articles" element=\{<ArticlesPage \/>\} \/>/.test(appSrc) && /<Route path="\/articles\/:beat\/:slug" element=\{<ArticlesPage \/>\} \/>/.test(appSrc), "App.tsx: /articles routes");
  assert(appSrc.lastIndexOf('path="*"') > appSrc.lastIndexOf("/articles/*"), "App.tsx: catch-all remains last");
  assert(sitemap.includes(`<loc>${CH_URL}</loc>`) && sitemap.includes(`<loc>${absUrl(ARTICLES_PATH)}</loc>`), "sitemap: /charts and /articles");
  const chLine = (llms.match(/^- \/charts — [\s\S]*?(?=\n- |\n## )/m) || [""])[0];
  assert(/Astro-Databank/.test(chLine) && /Rodden rating/.test(chLine) && /study and entertainment/.test(chLine) && !BANNED.test(chLine), "llms.txt: /charts line");
  const arLine = (llms.match(/^- \/articles — [\s\S]*?(?=\n- |\n## )/m) || [""])[0];
  assert(/celebrity/.test(arLine) && /businesses/.test(arLine) && /magic/.test(arLine) && /occult/.test(arLine) && /study and entertainment/.test(arLine) && !BANNED.test(arLine), "llms.txt: /articles line names the four beats");
  const pressIdx = readFileSync(new URL("../src/pages/site/PressIndex.tsx", import.meta.url), "utf8");
  assert(/<Link to="\/charts"/.test(pressIdx) && /<Link to="\/articles"/.test(pressIdx), "/press: visible links to /charts and /articles");
  assert(JSON.stringify(routeHead("/press").jsonLd!.relatedLink) === JSON.stringify([absUrl("/charts"), absUrl("/articles")]), "/press: relatedLink /charts and /articles");
  const pressRel = readFileSync(new URL("../src/pages/site/PressRelease.tsx", import.meta.url), "utf8");
  assert(/p\.links\.map/.test(pressRel), "press release renders its hub links");
}

// HUB-FIX-001: QC-SITE-001 majors/minors, SIM-WALK-001, SIM-CROWD-001,
// About/Contact/Privacy, footer PDF removal.
{
  const src = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
  const appSrc = src("../src/App.tsx");
  const layout = src("../src/components/SiteLayout.tsx");
  const sitemap = src("../public/sitemap.xml");
  const charts = src("../src/pages/site/ChartsPage.tsx");
  const vercel = JSON.parse(src("../vercel.json")) as { rewrites?: { source: string; destination: string }[] };

  // About, Contact, Privacy: routes, @type, footer links, sitemap, brand only
  const INFO: Record<string, [string, string]> = {
    "/about": ["AboutPage", "AboutPage"], "/contact": ["ContactPage", "ContactPage"], "/privacy": ["WebPage", "PrivacyPage"],
  };
  for (const [path, [type, comp]] of Object.entries(INFO)) {
    assert(new RegExp(`<Route path="${path}" element=\\{<${comp} />\\} />`).test(appSrc), `App.tsx: ${path} route`);
    const h = routeHead(path);
    assert(h.jsonLd && h.jsonLd["@type"] === type && h.canonical === absUrl(path), `${path}: @type ${type}, canonical`);
    assert(sitemap.includes(`<loc>${absUrl(path)}</loc>`), `sitemap: ${path}`);
    assert(layout.includes(`{ to: "${path}", label: "`), `footer: ${path} link`);
    assert(pageMeta(path) === STATIC_META[path as keyof typeof STATIC_META], `${path}: own title and description`);
    assert(personNodes(h.jsonLd).length === 0 && !/"Person"/.test(JSON.stringify(h.jsonLd)), `${path}: no Person`);
    assert(!/"(Offer|MonetaryAmount|FinancialService|FinancialProduct)"|price|signal/i.test(JSON.stringify(h.jsonLd)), `${path}: no prices or trading claims`);
  }
  for (const path of ["/about", "/contact"]) {
    const org = routeHead(path).jsonLd!.about as Record<string, unknown>;
    assert(org["@type"] === "Organization" && org.name === OPERATOR_NAME && Object.keys(org).sort().join(",") === "@type,name,url", `${path}: operator Organization, brand name and url only`);
  }
  assert(OPERATOR_NAME === "CunningMan AstroTrading", "operator brand is CunningMan AstroTrading");
  assert(JSON.stringify(routeHead("/about").jsonLd!.mainEntity) === JSON.stringify(routeHead("/about").jsonLd!.about), "/about: mainEntity is the operator");
  // no personal name anywhere on About (page source, info strings, JSON-LD)
  const infoPages = src("../src/pages/site/InfoPages.tsx");
  const aboutSrc = infoPages.slice(infoPages.indexOf("export function AboutPage"), infoPages.indexOf("export function ContactPage"));
  const noComments = (t: string) => t.replace(/^\s*\/\/.*$/gm, "");
  const aboutText = [noComments(aboutSrc), noComments(src("../src/site/info.ts")), JSON.stringify(routeHead("/about").jsonLd), JSON.stringify(pageMeta("/about"))].join(" ");
  assert(!/david|yames|archia|keeper|founder|owner|\bMr\.?\s|\bMs\.?\s|"Person"/i.test(aboutText), "/about: brand only, no personal name");
  assert(/OPERATOR_NAME/.test(aboutSrc), "/about: names the operator by brand");
  // MN-3 (a): visible About/Contact text is an allowlist of exact strings (invented names fail)
  const pageJsx = (s: string) => s.slice(s.indexOf("return ("), s.lastIndexOf(")") + 1);
  const visibleBits = (s: string) => {
    const jsx = pageJsx(s);
    let out = "";
    for (let i = 0; i < jsx.length; i++) {
      if (jsx[i] === "{") {
        let depth = 1, j = i + 1;
        while (j < jsx.length && depth) {
          if (jsx[j] === "{") depth++;
          else if (jsx[j] === "}") depth--;
          j++;
        }
        out += jsx.slice(i + 1, j - 1).trim() === "OPERATOR_NAME" ? OPERATOR_NAME : " ";
        i = j - 1;
      } else out += jsx[i];
    }
    const text = [...out.replace(/className="[^"]*"/g, "").matchAll(/>([^<>]+)</g)].map((m) => m[1].replace(/&amp;/g, "&").replace(/\s+/g, " ").trim()).filter(Boolean);
    const titles = [...jsx.matchAll(/\btitle="([^"]+)"/g)].map((m) => m[1]);
    return [...text, ...titles];
  };
  const ABOUT_ALLOWED = new Set([
    "About The Cunning Man",
    "A free public grimoire of the old village arts: Renaissance astrology, chaos magic, and the Elder Futhark runes, computed live in your browser. No coin asked, no account, no gate.",
    "For entertainment & study. Not financial, medical, or legal advice.",
    "Who runs it",
    `The Cunning Man is run by ${OPERATOR_NAME}.`,
    "What is here",
    "Method",
    "The art of Lilly and the masters of the shield chart: tropical zodiac, geocentric positions, Regiomontanus houses, essential dignities with Egyptian terms, planetary days and hours, and elections for the fit moment.",
    "Nothing on this site is a trading signal, a price or financial advice.",
    "Contact", "Privacy",
  ]);
  for (const bit of visibleBits(aboutSrc)) assert(ABOUT_ALLOWED.has(bit), `/about: unexpected visible text ${JSON.stringify(bit)}`);
  assert(ABOUT_ALLOWED.has(`The Cunning Man is run by ${OPERATOR_NAME}.`) && visibleBits(aboutSrc).includes(`The Cunning Man is run by ${OPERATOR_NAME}.`), "/about: operator line is the exact brand string");
  // Contact: no invented address or handle; visible text is an allowlist
  const contactSrc = infoPages.slice(infoPages.indexOf("export function ContactPage"), infoPages.indexOf("export function PrivacyPage"));
  assert(!/@|mailto:|https?:\/\//.test(contactSrc) && /no public contact/.test(contactSrc), "/contact: says plainly there is no public contact channel; invents none");
  const CONTACT_ALLOWED = new Set([
    "Contact",
    "For entertainment & study. Not financial, medical, or legal advice.",
    "How to reach us",
    "The Cunning Man has no public contact address or account yet. If one is added, it will be listed here.",
    `The site is run by ${OPERATOR_NAME}.`,
    "About", "Privacy",
  ]);
  for (const bit of visibleBits(contactSrc)) assert(CONTACT_ALLOWED.has(bit), `/contact: unexpected visible text ${JSON.stringify(bit)}`);
  assert(!/"(contactPoint|email|telephone)"/.test(JSON.stringify(routeHead("/contact").jsonLd)), "/contact: no contactPoint, email or telephone in JSON-LD");
  // Privacy: every claim maps to code that exists
  const privacySrc = infoPages.slice(infoPages.indexOf("export function PrivacyPage"));
  assert(/cunning-man:location/.test(privacySrc) && /"cunning-man:location"/.test(src("../src/sky/SkyContext.tsx")), "/privacy: location storage key matches SkyContext");
  assert(/cunning-man:natal/.test(privacySrc) && /"cunning-man:natal"/.test(src("../src/lib/natal.ts")), "/privacy: natal storage key matches lib/natal");
  assert(/nominatim\.openstreetmap\.org/.test(privacySrc) && /nominatim\.openstreetmap\.org/.test(src("../src/components/CitySearch.tsx")), "/privacy: Nominatim disclosed and used");
  assert(/fonts\.googleapis\.com/.test(privacySrc) && /fonts\.googleapis\.com/.test(src("../index.html")), "/privacy: Google Fonts disclosed and used");
  assert(!/@vercel\/analytics|@vercel\/speed-insights|gtag|googletagmanager|plausible|posthog|segment/i.test(src("../package.json") + src("../index.html")), "/privacy: no analytics package or script");
  // only src/components/ui/sidebar.tsx (unused) touches cookies
  for (const f of srcFiles(new URL("../src", import.meta.url).pathname)) {
    if (/components\/ui\/sidebar\.tsx$/.test(f)) continue;
    assert(!/document\.cookie|sessionStorage|<iframe/.test(readFileSync(f, "utf8")), `${f}: no cookie, sessionStorage or iframe (privacy page)`);
  }
  assert(!/components\/ui\/sidebar/.test(srcFiles(new URL("../src", import.meta.url).pathname).filter((f) => !/components\/ui\//.test(f)).map((f) => readFileSync(f, "utf8")).join("\n")), "sidebar (the only cookie writer) is not imported by the app");
  // brand text lives in info.ts only
  for (const f of srcFiles(new URL("../src", import.meta.url).pathname)) {
    if (/site\/info\.ts$/.test(f)) continue;
    assert(!/AstroTrading/.test(readFileSync(f, "utf8")), `${f}: brand spelled only in src/site/info.ts`);
  }

  // footer PDF removed: no link, no file, no references
  assert(!/ai-vs-the-sky|AI vs the Sky|\.pdf/i.test(layout), "footer: no AI vs the Sky link");
  assert(!existsSync(new URL("../public/downloads/ai-vs-the-sky.pdf", import.meta.url)), "public/downloads/ai-vs-the-sky.pdf removed from the build");
  assert(!/ai-vs-the-sky|\.pdf/i.test(sitemap + src("../public/llms.txt") + src("../public/robots.txt")), "sitemap, llms.txt, robots.txt: no PDF");
  for (const f of srcFiles(new URL("../src", import.meta.url).pathname)) assert(!/ai-vs-the-sky|AI vs the Sky/i.test(readFileSync(f, "utf8")), `${f}: no AI vs the Sky reference`);

  // SIM-CROWD-001: Charles birthday line cut; Latifah pattern line checked by the engine
  const pressSrc = src("../src/site/press.ts");
  assert(!/78th birthday/i.test(src("../src/site/charts.ts") + pressSrc + charts), "no '78th birthday' line on the Charles page or release");
  const lat = CHART_FIGURES.find((f) => f.slug === "queen-latifah")!;
  assert(/T-square/.test(lat.patternNote ?? "") && /name is modern/.test(lat.patternNote ?? ""), "queen-latifah: pattern line says the name is modern");
  const latAsp = figureAspects(figureChart(lat));
  const has = (p1: string, p2: string, k: string) => latAsp.some((a) => ((a.p1 === p1 && a.p2 === p2) || (a.p1 === p2 && a.p2 === p1)) && a.aspectKey === k);
  assert(has("moon", "mars", "square") && has("moon", "saturn", "square") && has("moon", "jupiter", "square") && has("jupiter", "mars", "opposition") && has("jupiter", "saturn", "opposition"), "queen-latifah: engine shows Moon square Mars, Saturn, Jupiter and Jupiter opposite Mars and Saturn");
  // MN-3 (b): every planet pair the pattern note names must appear in the engine list
  const PLANET_WORD: Record<string, string> = { sun: "sun", moon: "moon", mercury: "mercury", venus: "venus", mars: "mars", jupiter: "jupiter", saturn: "saturn" };
  const ASPECT_WORD: Record<string, string> = { square: "square", squares: "square", oppose: "opposition", opposes: "opposition", trine: "trine", trines: "trine", sextile: "sextile", sextiles: "sextile", conjunct: "conjunction", conjunction: "conjunction" };
  const claimSent = (lat.patternNote ?? "").split(/(?<=\.)\s+/)[0];
  const noteTok = claimSent.split(/[^A-Za-z]+/).filter((w) => PLANET_WORD[w.toLowerCase()] || ASPECT_WORD[w.toLowerCase()]);
  const claimed: { p1: string; p2: string; aspectKey: string }[] = [];
  let subject: string | null = null;
  let aspect: string | null = null;
  for (let i = 0; i < noteTok.length; i++) {
    const w = noteTok[i].toLowerCase();
    if (PLANET_WORD[w]) {
      const next = noteTok[i + 1]?.toLowerCase();
      if (next && ASPECT_WORD[next]) subject = PLANET_WORD[w];
      else if (subject && aspect) claimed.push({ p1: subject, p2: PLANET_WORD[w], aspectKey: aspect });
      else subject = PLANET_WORD[w];
    } else if (ASPECT_WORD[w]) aspect = ASPECT_WORD[w];
  }
  assert(claimed.length >= 5, "queen-latifah: pattern note names the T-square pairs");
  for (const c of claimed) assert(has(c.p1, c.p2, c.aspectKey), `queen-latifah: pattern note claims ${c.p1} ${c.aspectKey} ${c.p2}, which the engine does not show`);
  assert(CHART_FIGURES.filter((f) => f.patternNote).length === 1, "only the Latifah page carries a pattern line");
  assert(/SCORE_NOTE/.test(charts) && /figureAspects\(chart\)/.test(charts), "figure pages explain the score and list engine aspects");
  // Liza hook: only from approved copy (R-CHARTS-001, R-EDITORIAL-001, press copy); not found there, so not on the page
  assert(!/Same sky\. Different chart\./.test(src("../src/site/charts.ts") + charts + pressSrc), "liza-minnelli: no hook copy invented");

  // SIM-WALK-001: /charts has no /articles link; one-line site intro on /charts and figure pages
  assert(!/to="\/articles"|to=\{ARTICLES_PATH\}|href="\/articles/.test(charts), "/charts: no link to the /articles placeholder");
  assert((charts.match(/<SiteIntro \/>/g) || []).length === 2 && /The Cunning Man is a free site/.test(SITE_INTRO), "/charts and figure pages: one-line what-this-site-is intro");
  assert(!/\btrad(e|ing)|advice|price|signal/i.test(SITE_INTRO + SCORE_NOTE), "intro and score note: clean wording");
  // SIM-WALK-001: /sky change scan runs in slices and cannot stay stuck
  const sky = src("../src/pages/site/SessionSkyPage.tsx");
  assert(/scanChanges\(/.test(sky) && /catch \{/.test(sky) && /could not be worked out/.test(sky) && !/findChanges\(/.test(sky), "/sky: sliced scan with progress and a failure state");

  // HUB-FIX-002: /clock study wording, MN-2 tap targets, llms.txt info pages
  const panels = src("../src/components/panels.tsx");
  const election = src("../src/astro/election.ts");
  assert(!/Do not begin during these hours/.test(panels), "/clock: old in-tool 'Do not begin during these hours' label is gone");
  assert(/Hours the old books say to begin nothing new/.test(panels), "/clock: new in-tool study label is present");
  assert(!/Trading session|trading session/.test(election), "/clock: election.ts has no 'Trading session' comment");
  assert(/Study window: 06:00–15:00/.test(election) && /6a–3p UTC-5 study window/.test(election), "/clock: election.ts comments say study window");
  assert(/next 72h · study window 6a–3p UTC-5/.test(panels), "/clock: scan window reads as a study window");
  assert(!/\btrad(e|es|er|ers|ing)\b|Trading session|trading session/.test(panels + election.replace(/sessionOnly/g, "")), "/clock: no trading wording in the panel or comments");
  const digSrc = src("../src/pages/site/DignitiesPage.tsx");
  const libSrc = src("../src/pages/site/LibraryPage.tsx");
  const homeSrc = src("../src/pages/site/SiteHome.tsx");
  const pressRelSrc = src("../src/pages/site/PressRelease.tsx");
  assert(/to=\{planetPath\(p\.key\)\} className="inline-block py-1 underline"/.test(digSrc), "MN-2: /dignities/* sibling planet links are 24 px");
  assert(/to=\{planetPath\(c\.key\)\} className="inline-block py-1 underline"/.test(digSrc), "MN-2: /dignities index planet links are 24 px");
  assert(/to=\{bookPath\(b\.id\)\} className="inline-block py-1 underline"/.test(libSrc), "MN-2: library sibling-book links are 24 px");
  assert(/to=\{figurePath\(f\.slug\)\} className="inline-block py-1 underline"/.test(charts), "MN-2: chart sibling-figure links are 24 px");
  assert(/className="inline-block py-1 underline hover:text-seal"/.test(pressRelSrc), "MN-2: press-release related links are 24 px");
  assert(/to="\/press" className="inline-block py-1 mt-2 text-\[13px\] underline"/.test(homeSrc), "MN-2: home 'All press releases' link is 24 px");
  const llmsTxt = src("../public/llms.txt");
  const aboutLine = (llmsTxt.match(/^- \/about — [\s\S]*?(?=\n- |\n## )/m) || [""])[0];
  const contactLine = (llmsTxt.match(/^- \/contact — [\s\S]*?(?=\n- |\n## )/m) || [""])[0];
  const privacyLine = (llmsTxt.match(/^- \/privacy — [\s\S]*?(?=\n- |\n## )/m) || [""])[0];
  assert(/free public site/.test(aboutLine) && /Renaissance astrology/.test(aboutLine) && /study/.test(aboutLine), "llms.txt: /about line");
  assert(/no public contact/.test(contactLine), "llms.txt: /contact line");
  assert(/No account/.test(privacyLine) && /Nominatim/.test(privacyLine) && /no analytics/.test(privacyLine), "llms.txt: /privacy line");

  // M-1: trading-clock release is study-only; slug and Article kept
  const tc = PRESS.find((p) => p.slug === "trading-clock")!;
  const tcText = [tc.title, tc.excerpt, ...tc.body].join(" ");
  assert(!/day trader|trader|trading entry|entry window|not to trade|do-not-trade|session|sit on your hands/i.test(tcText), "M-1: trading-clock copy has no trader/entry/do-not-trade/session wording");
  assert(/study/i.test(tc.title) && /study and entertainment/.test(tcText) && routeHead("/press/trading-clock").jsonLd!["@type"] === "Article", "M-1: study framing, Article kept");
  const home = src("../src/pages/site/SiteHome.tsx");
  assert(!/Day Traders|traders/i.test(home) && !/trading clock/i.test(JSON.stringify(STATIC_META)), "M-1: home teaser and /press description reworded");

  // M-2: catch-all is the not-found page; press misses never render PRESS[0]; no blanket rewrite
  assert(/<Route path="\*" element=\{inIframe \? <Home \/> : <NotFoundPage \/>\} \/>/.test(appSrc), "App.tsx: catch-all is NotFoundPage");
  assert(!/PRESS\[0\]/.test(src("../src/pages/site/PressRelease.tsx")) && /NotFoundPage/.test(src("../src/pages/site/PressRelease.tsx")), "press miss: not-found page, not PRESS[0]");
  assert(!(vercel.rewrites ?? []).some((r) => r.destination === "/index.html"), "vercel.json: no blanket rewrite to /index.html");
  assert(/noindex/.test(src("../src/components/RouteHead.tsx")) && /noindex/.test(src("./prerender.ts")), "not-found: noindex at runtime and in 404.html");

  // M-3/M-4: per-route head; index.html has no hard-coded canonical; og:image default
  const indexHtml = src("../index.html");
  assert(!/rel="canonical"/.test(indexHtml) && !/og:url/.test(indexHtml), "index.html: no hard-coded canonical or og:url");
  assert(indexHtml.includes(`<meta property="og:image" content="${DEFAULT_OG_IMAGE}" />`) && /twitter:card" content="summary_large_image"/.test(indexHtml), "index.html: default og:image and summary_large_image");
  for (const m of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const path = m[1].slice(SITE_ORIGIN.length) || "/";
    const h = routeHead(path);
    assert(h.jsonLd && h.canonical === m[1], `${path}: sitemap route has JSON-LD and canonical (pre-render)`);
    assert(pageMeta(path) !== NOT_FOUND_META && pageMeta(path).title.length > 0, `${path}: has its own title`);
    assert(/^https:\/\/cunning-man\.vercel\.app\/art\/[a-z-]+\.webp$/.test(ogImage(path)), `${path}: absolute og:image`);
  }
  assert(/vite-node scripts\/prerender\.ts/.test(src("../package.json")), "build runs the pre-render");
  // m-1: /clock has its own title and description
  assert(pageMeta("/clock").title !== pageMeta("/").title && pageMeta("/clock").description !== pageMeta("/").description, "/clock: own title and description");
  // m-5 skip link; m-7 credit; m-8 favicon; m-9 inspect plugin dev-only
  assert(/href="#main"/.test(layout) && (layout.match(/id="main"/g) || []).length === 2, "skip-to-content link and #main on both layouts");
  assert(!/High Renaissance|not Renaissance/.test(creditText(ART_WORKS["metzger-clock"]) + creditText(ART_WORKS["cellarius-harmonia"])), "credits: no internal period notes");
  assert(existsSync(new URL("../public/favicon.ico", import.meta.url)), "public/favicon.ico present");
  assert(/command === 'serve' \? \[inspectAttr\(\), react\(\)\] : \[react\(\)\]/.test(src("../vite.config.ts")), "inspectAttr only in dev");

  // optional: built pre-render output
  const built = process.env.BUNDLE_DIR;
  if (built && existsSync(join(built, "404.html"))) {
    const nf = readFileSync(join(built, "404.html"), "utf8");
    assert(/name="robots" content="noindex"/.test(nf) && !/rel="canonical"/.test(nf) && !/id="ld-route"/.test(nf), "dist/404.html: noindex, no canonical, no route JSON-LD");
    for (const m of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const path = m[1].slice(SITE_ORIGIN.length) || "/";
      const html = readFileSync(join(built, path === "/" ? "index.html" : `${path.slice(1)}/index.html`), "utf8");
      const meta = pageMeta(path);
      const t = meta.title.replace(/&/g, "&amp;");
      assert(html.includes(`<title>${t}</title>`) && html.includes(`<link rel="canonical" href="${m[1]}" />`) && html.includes(`<meta property="og:url" content="${m[1]}" />`), `dist${path}: title, canonical, og:url`);
      assert(html.includes(`<meta property="og:image" content="${ogImage(path)}" />`) && html.includes(`<meta name="twitter:title" content="${t.replace(/"/g, "&quot;")}" />`), `dist${path}: og:image, twitter:title`);
      const ld = JSON.parse((/<script type="application\/ld\+json" id="ld-route">([\s\S]*?)<\/script>/.exec(html) || ["", "null"])[1]);
      assert(ld && JSON.stringify(ld) === JSON.stringify(routeHead(path).jsonLd), `dist${path}: route JSON-LD in static HTML`);
      assert(!/code-path=/.test(html), `dist${path}: no code-path attributes`);
    }
    assert(!existsSync(join(built, "downloads", "ai-vs-the-sky.pdf")), "dist: no AI vs the Sky PDF");
    const js = readdirSync(join(built, "assets")).filter((f) => f.endsWith(".js")).map((f) => readFileSync(join(built, "assets", f), "utf8")).join("\n");
    assert(!/code-path|ai-vs-the-sky|78th birthday|sidebar_state/.test(js), "dist JS: no code-path, no PDF link, no birthday line, no sidebar cookie");
    console.log(`pre-render output checked in ${built}`);
  }
}

console.log(`check:schema OK — ${n} assertions`);
