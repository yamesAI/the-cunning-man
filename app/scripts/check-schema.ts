// Check: route structured data and canonicals (SCHEMA-001 §3 + CEO rulings 2026-11-12 08:54, owner 09:05).
// Run: npm run check:schema   (optionally: BUNDLE_DIR=<vite outDir> to also scan a built bundle)

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { routeHead, absUrl, isoDate, SITE_ORIGIN } from "../src/site/structuredData";
import { PRESS } from "../src/site/press";
import { LIBRARY_BOOKS, LIBRARY_DESCRIPTION, LIBRARY_SUBTITLE, LIBRARY_TERMS } from "../src/site/library";
import { TESTIMONY } from "../src/data/tradition";
import {
  DIGNITIES_DESCRIPTION, DIGNITIES_PATH, DIGNITIES_SUBTITLE, DISCLAIMER, LATER_BOOK1_POINTERS, LILLY_SOURCE,
  LILLY_TABLE_TERMS, PLANET_CATALOGS, planetPageDescription, planetPageName, planetPath, signDignities,
} from "../src/site/dignities";
import { ART_ASSIGNMENTS, ART_WORKS, SHIPPED_FILES, artForPath, contentPath, creditText } from "../src/site/art";
import { LEARN_MORE, learnMoreForCatalog, learnMoreForName, occupationHaystack } from "../src/site/learnMore";

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
const ALLOWED_TYPES: Record<string, Set<string>> = { "/library": new Set(["Person"]), "/dignities": new Set(["Person"]) };
for (const c of PLANET_CATALOGS) ALLOWED_TYPES[planetPath(c.key)] = new Set(["Person"]);

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
  for (const re of FORBIDDEN_TEXT) assert(!re.test(text), `${path}: forbidden text ${re}`);
  walk(ld, path, ALLOWED_KEYS[path], ALLOWED_TYPES[path]);
}

// 1. known routes emit the expected @type; 5. canonical == url == route
const EXPECT: Record<string, string> = {
  "/": "FAQPage", "/clock": "WebApplication", "/natal": "WebApplication", "/synastry": "WebApplication",
  "/launches": "WebApplication", "/sky": "WebApplication", "/sigil": "WebApplication", "/runes": "WebApplication",
  "/spells/love": "WebPage", "/spells/money": "WebPage", "/press": "CollectionPage", "/library": "CollectionPage",
  "/dignities": "WebPage",
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
  assert(Object.keys(ld).sort().join(",") === "@context,@type,applicationCategory,description,featureList,inLanguage,isAccessibleForFree,isPartOf,name,operatingSystem,primaryImageOfPage,url", "/sky: only the §5 properties plus primaryImageOfPage");
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
  assert(/This planet page was not found/.test(pageSrc), "unknown slug: short miss state");
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
for (const path of ["/dignity", "/library/christian-astrology", "/library/x", "/lib", "/nope", "/clock/extra", "/press/nope", "/press/LAUNCH", "/press/launch/x", "/spells", "/spells/other", "/index.html"]) {
  const h = routeHead(path);
  assert(h.jsonLd === null, `${path}: unknown -> no JSON-LD`);
}
assert(routeHead("/press/nope").canonical === absUrl(`/press/${PRESS[0].slug}`), "/press/nope: canonical to fallback content");
assert(routeHead("/nope").canonical === `${SITE_ORIGIN}/`, "/nope: canonical root");

// DIGNITIES-002 unknown planet slugs: miss, no JSON-LD, canonical /dignities
for (const path of ["/dignities/x", "/dignities/pluto", "/dignities/uranus", "/dignities/neptune", "/dignities/SATURN", "/dignities/Saturn", "/dignities/saturn/extra", "/dignities/dragon"]) {
  const h = routeHead(path);
  assert(h.jsonLd === null, `${path}: unknown planet slug -> no JSON-LD`);
  assert(h.canonical === absUrl(DIGNITIES_PATH), `${path}: canonical is /dignities`);
  assert(h.canonical !== `${SITE_ORIGIN}/` && !PLANET_CATALOGS.some((c) => h.canonical === absUrl(planetPath(c.key))), `${path}: not home or another planet`);
}
assert(routeHead("/dignities/saturn").jsonLd !== null, "/dignities/saturn is a known planet page");

// App.tsx routes all covered
const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const routes = [...app.matchAll(/path="([^"]+)"/g)].map((m) => m[1]).filter((r) => r !== "*" && r !== "/press/:slug" && r !== "/dignities/:planet" && r !== "/dignities/*");
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
      if (ld) assert(!ld.primaryImageOfPage, `${a.path}: no ImageObject when the still was not shipped`);
      continue;
    }
    assert(hit && hit.work.id === work.id, `${a.path}: art assignment`);
    const h = routeHead(a.path);
    assert(h.jsonLd, `${a.path}: has JSON-LD`);
    const ld = h.jsonLd!;
    const img = ld.primaryImageOfPage as Record<string, unknown> | undefined;
    assert(img && img["@type"] === "ImageObject", `${a.path}: primaryImageOfPage is ImageObject`);
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
  assert(!/1708/.test(artSrc) && !/1708/.test(cellCredit) && !/1708/.test(String(routeHead("/synastry").jsonLd?.primaryImageOfPage && JSON.stringify(routeHead("/synastry").jsonLd))), "Cellarius credit and art.ts never say 1708");
  assert(/1660–61 \(Amsterdam: Johannes Janssonius\)/.test(cellCredit), "Cellarius date is 1660–61 (Amsterdam: Johannes Janssonius)");
  assert(!/Children of the Planets/.test(artSrc) && !/Children of the Planets/.test(pageSrc) && !/Children of the Planets/.test(JSON.stringify(routeHead("/dignities/sun").jsonLd)), "no Children of the Planets wording");
}

console.log(`check:schema OK — ${n} assertions`);
