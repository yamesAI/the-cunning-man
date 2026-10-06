// Check: traditional testimony corpus (Task 6).
// Anti-fabrication gate: every kind:"quote" entry must carry verifiedUrl;
// coverage must span all 7 classical planets in 3 categories.
// Run: npm run check:tradition

import { readFileSync } from "node:fs";
import { TESTIMONY, lookupTestimony, type Testimony } from "../src/data/tradition";
import { PLANETS, ASPECT_DEFS } from "../src/astro/constants";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

assert(TESTIMONY.length >= 24, `at least 24 entries (got ${TESTIMONY.length})`);

const CLASSICAL = PLANETS.slice(0, 7);
const HARD = new Set(["square", "opposition"]);
const SOFT = new Set(["trine", "sextile", "conjunction"]);

for (const p of CLASSICAL) {
  const entries = TESTIMONY.filter((t) => t.match.planet === p);
  assert(entries.length >= 3, `${p}: at least 3 entries (got ${entries.length})`);
  assert(entries.some((t) => !t.match.aspect), `${p}: has a planet-wide entry`);
  assert(entries.some((t) => t.match.aspect && HARD.has(t.match.aspect)), `${p}: has a hard-aspect entry`);
  assert(entries.some((t) => t.match.aspect && SOFT.has(t.match.aspect)), `${p}: has a soft-aspect entry`);
}

for (const t of TESTIMONY) {
  assert(t.author.trim().length > 0 && t.work.trim().length > 0 && t.citation.trim().length > 0, `citation fields non-empty (${t.match.planet})`);
  assert(t.year > 0 && t.year < 2100, `sane year (${t.author})`);
  assert(t.text.trim().length >= 20, `text substantial (${t.author})`);
  if (t.match.aspect) assert(ASPECT_DEFS.some((d) => d.key === t.match.aspect), `valid aspect key ${t.match.aspect}`);
  if (t.kind === "quote") {
    assert(typeof t.verifiedUrl === "string" && /^https?:\/\//.test(t.verifiedUrl), `quote has verifiedUrl (${t.author})`);
  } else {
    assert(t.kind === "doctrine", `kind is quote|doctrine (${t.kind})`);
  }
}

// lookup precedence: specific aspect beats planet-wide; planet-wide always exists
for (const p of CLASSICAL) {
  const wide = TESTIMONY.find((t) => t.match.planet === p && !t.match.aspect)!;
  for (const a of ["square", "trine", "conjunction", "opposition", "sextile"] as const) {
    const hit = lookupTestimony(p, a);
    assert(hit, `${p}/${a}: lookup returns something`);
    const specific = TESTIMONY.find((t) => t.match.planet === p && t.match.aspect === a);
    assert(hit === (specific ?? wide), `${p}/${a}: precedence correct`);
  }
}

// every quote's URL appears in the corpus file next to its entry (paranoia
// against url/data drift): each verifiedUrl string must exist in the source.
{
  const src = readFileSync(new URL("../src/data/tradition.ts", import.meta.url), "utf8");
  for (const t of TESTIMONY) {
    if (t.kind === "quote") assert(src.includes(t.verifiedUrl!), `${t.author}: url present in source file`);
  }
}

// spot-check: no two entries are byte-identical text (copy-paste accidents)
{
  const seen = new Set<string>();
  for (const t of TESTIMONY as Testimony[]) {
    assert(!seen.has(t.text), `duplicate text (${t.author})`);
    seen.add(t.text);
  }
}

console.log("check:tradition OK");
