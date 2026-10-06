# The Cunning Man — Modern Renaissance + Natal & Transits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle The Cunning Man deeper into the Renaissance with an agent-readable semantic layer, and add a real Natal & Transits module (live transits-to-natal with verified traditional testimony) plus an Active Transits panel on the clock.

**Architecture:** A shared `SkyProvider` context owns live time + geolocation-backed location for every page; a transit engine (`transits.ts`) computes transiting→natal aspects and true exact-hit dates on top of the existing ephemeris engine; a curated, source-verified testimony corpus (`tradition.ts`) feeds quote cards; a CSS-variable token layer drives the visual restyle.

**Tech Stack:** Vite 7, React 19, TypeScript, Tailwind 3.4, `circular-natal-horoscope-js`, `tz-lookup`, `date-fns` (already installed); `tsx` added as devDependency for one-off engine check scripts.

**Spec:** `Workspaces/ShieldAstroLive/docs/superpowers/specs/2026-10-06-cunning-man-modern-renaissance-natal-transits-design.md`

## Global Constraints

- All astro math uses the existing engine (`computeChart`, `buildHoroscope`, `angleDiff`, `norm360`) — never a second ephemeris implementation.
- Traditional orbs, verbatim from spec §3.2: ☌ 8°, ⚹ 5°, □ 6°, △ 7°, ☍ 8°.
- Exact-hit search windows, verbatim from spec §3.2: Moon 2 d; Sun/Mercury/Venus/Mars 30 d; Jupiter/Saturn 90 d. Step = `min(6 h, window/48)`; bisect to < 60 s; direction = applying ? forward : backward; `null` when no local minimum exists in window.
- Classical set for transits-to-natal = `PLANETS.slice(0, 7)` (sun..saturn); natal points = those 7 + natal `asc` + natal `mc`.
- Storage keys: `cunning-man:location` (legacy `shield-astro-location` migrated once), `cunning-man:natal`. Every storage access try/catch (opaque-origin iframes must not throw).
- Every testimony entry carries author/work/year/citation; `kind: "quote"` only when verbatim-verified via web sources during Task 6, otherwise `kind: "doctrine"`. Minimum 24 entries; ≥ 3 per classical planet (planet-wide + hard aspect + soft aspect).
- No hex color literals in `src/pages/**` or `src/components/**` after Task 10 (grep gate in Task 12); `src/astro/constants.ts` sign/planet chart colors are data and stay.
- No new runtime dependencies; `tsx` is the only added devDependency (engine check runner).
- Widget/iframe behavior preserved: `SiteLayout` renders bare children in iframes; `data-kimi-*` attributes kept; tilt and animations disabled under `prefers-reduced-motion` and in iframes.
- No test framework is added (project has none; spec non-goal). Verification = `npm run build`, `npm run lint`, `npm run check:*` scripts, and the Task 12 browser sweep.

## Review Focus

1. **Retrograde triple-pass aspects** — a transiting planet stationing over a natal point can perfect three times; the code must return the *first* exactness in the aspect's natural direction, never a later station. Pinned by Task 5 check Case B.
2. **Aspect orb boundary** — separation 8.1° from a conjunction must not register; 7.95° must. Pinned by Task 5 synthetic boundary assertions.
3. **Geolocation denial** — after a denial, no repeated prompts in the same session; pages keep working on saved/manual/default location. Manual check in Task 12.
4. **Opaque-origin widget iframe** — `SkyProvider` and natal storage must not throw when `localStorage` access raises; clock ticks bare. Pinned by Task 12 iframe regression (guards written in Tasks 2 and 3).
5. **Non-integer timezone wall clock** — header pill must show correct wall time for e.g. Dubai (+4:00) and Mumbai-style +5:30 offsets. Manual check in Task 12.

---

### Task 1: Renaissance design-token layer + git baseline

**Files:**
- Create: `Workspaces/ShieldAstroLive/.gitignore` (node_modules, dist, out)
- Modify: `app/src/index.css`
- Modify: `app/tailwind.config.js`
- Test: none (verified by build + token grep)

**Interfaces:**
- Produces: CSS variables `--parchment`, `--parchment-deep`, `--card` (light cream), `--ink`, `--ink-soft`, `--seal`, `--seal-deep`, `--brass`, `--spruce`, `--line`; component classes `.manor-card`, `.btn-seal`, `.tbl-ledger`, `.glyph-pair`, `.font-display`, `.font-ui`; Tailwind color utilities `bg-parchment`, `text-ink`, `border-seal`, `bg-card`, `text-ink-soft`, `bg-seal`, `text-brass` via `theme.extend.colors`.

- [ ] **Step 1: Initialize git and commit the untouched tree as baseline**

```bash
cd Workspaces/ShieldAstroLive
git init && git add -A && git commit -m "baseline: cunning man before modern-renaissance restyle"
```

(If the user has declined git by execution time, skip all commit steps in this plan; task boundaries remain the save points.)

- [ ] **Step 2: Replace the `:root` token block in `app/src/index.css` with the Renaissance set**

Values (HSL, space separated): `--parchment: 42 38% 85%` (page), `--parchment-deep: 40 35% 78%` (wells), `--card: 48 52% 92%` (raised panels), `--ink: 30 40% 10%`, `--ink-soft: 30 18% 32%`, `--seal: 4 58% 33%`, `--seal-deep: 4 65% 24%`, `--brass: 38 45% 42%`, `--spruce: 140 35% 28%`, `--line: 36 30% 62%`. Map shadcn tokens onto them: `background→parchment, foreground→ink, card→card, card-foreground→ink, popover→card, popover-foreground→ink, primary→seal, primary-foreground→card, secondary→parchment-deep, secondary-foreground→ink, muted→parchment-deep, muted-foreground→ink-soft, accent→parchment-deep, accent-foreground→ink, destructive→seal, destructive-foreground→card, border→line, input→line, ring→seal` (exact HSL var references, same pattern the file already uses). Delete the unused `.dark` block (no dark mode per spec non-goals). Keep `--radius: 0.25rem`.

- [ ] **Step 3: Add the component layer to `app/src/index.css` (`@layer components`)**

`.manor-card` (card bg, 1px `line` border, plus an inset `box-shadow: 0 0 0 3px var(--card), 0 0 0 4px hsl(var(--line))` double-rule effect, `box-shadow` stack `0 1px 2px rgb(30 20 5 / .12), 0 8px 24px -12px rgb(30 20 5 / .35)`); `.btn-seal` (seal bg, card text, inset top highlight `inset 0 1px 0 rgb(255 255 255 / .18)`, hover darkens to `--seal-deep`, `font-display` small-caps); `.tbl-ledger` (`th` uppercased small-caps `ink-soft`, row rules 1px `line`, `font-variant-numeric: tabular-nums`, sans font); `.glyph-pair` (inline-flex baseline gap — callers always pair the glyph with its spelled-out label); `.font-display` / `.font-ui` (font stacks from Step 4). Add `@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }`.

- [ ] **Step 4: Extend `app/tailwind.config.js`**

`theme.extend.fontFamily`: `display: ["'EB Garamond'", "Georgia", "'Times New Roman'", "serif"]`, `ui: ["'Source Sans 3'", "system-ui", "sans-serif"]`. `theme.extend.colors`: `parchment: "hsl(var(--parchment))"`, `parchmentDeep: "hsl(var(--parchment-deep))"`, `card: "hsl(var(--card))"`, `ink: "hsl(var(--ink))"`, `inkSoft: "hsl(var(--ink-soft))"`, `seal: "hsl(var(--seal))"`, `sealDeep: "hsl(var(--seal-deep))"`, `brass: "hsl(var(--brass))"`, `spruce: "hsl(var(--spruce))"`, `line: "hsl(var(--line))"`. Nothing else changes in the config.

- [ ] **Step 5: Verify build + token presence**

Run: `cd app && npm run build`
Expected: passes. Run: `grep -c "seal" src/index.css` → ≥ 5. No component files touched yet, so nothing else can break.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(theme): renaissance token layer + tailwind utilities"
```

---

### Task 2: Cities + natal profile storage

**Files:**
- Create: `app/src/data/cities.ts`
- Create: `app/src/lib/natal.ts`
- Create: `app/scripts/check-natal.ts`
- Modify: `app/package.json` (script `check:natal`)

**Interfaces:**
- Produces:
```ts
export interface City { name: string; lat: number; lng: number; }
export const CITIES: City[]; // London, New York, Los Angeles, Chicago, Toronto, Berlin, Madrid, Dubai, Tokyo, Sydney
export interface NatalProfile { name?: string; birth: string; lat: number; lng: number; placeName: string; }
export function loadNatal(): NatalProfile | null;
export function saveNatal(p: NatalProfile): void;
export function clearNatal(): void;
```

- [ ] **Step 1: Write `app/src/data/cities.ts`** — the 10 cities with real coordinates: London 51.5074/-0.1278, New York 40.7128/-74.0060, Los Angeles 34.0522/-118.2437, Chicago 41.8781/-87.6298, Toronto 43.6532/-79.3832, Berlin 52.5200/13.4050, Madrid 40.4168/-3.7038, Dubai 25.2048/55.2708, Tokyo 35.6762/139.6503, Sydney -33.8688/151.2093.

- [ ] **Step 2: Write `app/src/lib/natal.ts`** — key `"cunning-man:natal"`; `loadNatal` try/catch parse with field validation (`birth` parseable date, finite coords in range, else `null`); `saveNatal`/`clearNatal` try/catch (never throw — opaque-origin iframes).

- [ ] **Step 3: Check script `app/scripts/check-natal.ts`** — stub `globalThis.localStorage` with a `Map`-backed shim; assert save→load round-trip, clear→`null`, garbage JSON → `null`, and that with a throwing storage shim `loadNatal` returns `null` and `saveNatal` doesn't throw.
Run: `npm run check:natal` → PASS.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(data): preset cities + natal profile storage"
```

---

### Task 3: Shared sky context — live time + auto location

**Files:**
- Create: `app/src/sky/SkyContext.tsx`
- Modify: `app/src/App.tsx` (wrap with provider)
- Modify: `app/src/components/SiteLayout.tsx` (header clock pill + location controls)
- Test: manual behavior pinned in Task 12; build+lint here

**Interfaces:**
- Consumes: `CITIES` from `src/data/cities.ts` (Task 2); `tzForLocation` from `src/astro/engine.ts`; `wallParts`, `tzOffsetLabel` from `src/astro/format.ts`.
- Produces:
```ts
export interface Loc { lat: number; lng: number; name: string; source: "geo" | "manual"; }
export const DEFAULT_LOC: Loc; // London 51.5074, -0.1278, source "manual"
export interface Sky { now: Date; loc: Loc; setLoc: (loc: Loc) => void; refreshLocation: () => void; }
export function SkyProvider({ children }: { children: ReactNode }): ReactElement;
export function useSky(): Sky;
```

- [ ] **Step 1: Write `app/src/sky/SkyContext.tsx`**

- `STORAGE_KEY = "cunning-man:location"`, legacy key `"shield-astro-location"`: on load, if the new key is absent and the legacy key parses as a valid `Loc`, use it (source coerced to `"manual"`).
- `loadLoc()`: try/catch JSON parse → validate `typeof lat/lng === "number"` and `|lat| ≤ 90`, `|lng| ≤ 180`; else `DEFAULT_LOC`.
- Provider state: `now` (ticked by one `setInterval(1000)`), `loc` (persisted via try/catch on every change).
- `acquire()`: guarded by a module-level `deniedThisSession` flag; calls `navigator.geolocation.getCurrentPosition` with `{ timeout: 8000, maximumAge: 300000 }`; success → `setLoc({ lat: +lat.toFixed(4), lng: +lng.toFixed(4), name: "My location", source: "geo" })`; error → set `deniedThisSession = true` (no re-prompt until page reload or an explicit 📍 click).
- Effects on mount: if saved `source === "geo"` or no saved location → `acquire()`; add a `window` `focus` listener and a 5-minute `setInterval`, both calling `acquire()` only while the current `source === "geo"`. Clean up on unmount.
- `refreshLocation()`: clears `deniedThisSession` and calls `acquire()` (used by 📍 buttons).

- [ ] **Step 2: Wire the provider in `app/src/App.tsx`**

Wrap the existing `<SiteLayout>` tree in `<SkyProvider>` (inside `App`, above `SiteLayout`).

- [ ] **Step 3: Add the header clock pill + location controls to `app/src/components/SiteLayout.tsx`**

In the header, after the tagline: a `<div>` showing wall time at `loc` via `wallParts(now, tzForLocation(loc.lat, loc.lng))` formatted `HH:MM:SS` + `tzOffsetLabel(now, tz)` + `loc.name`, `.font-ui tabular-nums`, rendered as `<time dateTime={now.toISOString()} aria-label="Current time at ${loc.name}">`. Beside it a `LocControls` group: preset-city `<select>` (`onChange` → `setLoc({ ...city, source: "manual" })`, current city preselected when coords match within 0.01°) and a 📍 button (`refreshLocation()`).

- [ ] **Step 4: Verify**

Run: `cd app && npm run build && npm run lint` → both pass.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(sky): shared live time + geolocation context with header clock pill"
```

---

### Task 4: Extract aspect definitions into constants

**Files:**
- Modify: `app/src/astro/constants.ts`
- Modify: `app/src/astro/engine.ts` (delete local `ASPECT_DEFS`, import instead)
- Test: `npm run build` + unchanged aspectarian behavior

**Interfaces:**
- Produces:
```ts
export type AspectKey = "conjunction" | "sextile" | "square" | "trine" | "opposition";
export const ASPECT_DEFS: ReadonlyArray<{ angle: 0 | 60 | 90 | 120 | 180; key: AspectKey; orb: number }>;
```
- `engine.ts`'s `AspectCell.aspectKey` becomes `AspectKey` (interface otherwise unchanged).

- [ ] **Step 1: Add the definitions to `app/src/astro/constants.ts`**

Exactly the values engine.ts currently uses: conjunction 0° orb 8, sextile 60° orb 5, square 90° orb 6, trine 120° orb 7, opposition 180° orb 8.

- [ ] **Step 2: Update `app/src/astro/engine.ts`**

Delete the local `ASPECT_DEFS` (lines ~306-311), import from `./constants`, and change `AspectCell.aspectKey` to `AspectKey`.

- [ ] **Step 3: Verify**

Run: `cd app && npm run build && npm run lint` → pass. (Behavioral parity is pinned by Task 5's cross-checks, which fail loudly if the aspectarian changed.)

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "refactor(astro): extract ASPECT_DEFS/AspectKey to constants for reuse"
```

---

### Task 5: Transit engine — `transits.ts` with verified exact-hit math

**Files:**
- Create: `app/src/astro/transits.ts`
- Create: `app/scripts/check-transits.ts`
- Modify: `app/package.json` (add devDep `tsx`, script `check:transits": "tsx scripts/check-transits.ts"`)
- Test: `app/scripts/check-transits.ts` (pinned real-ephemeris cases + synthetic boundary cases)

**Interfaces:**
- Consumes: `ChartData`, `AspectCell`, `buildHoroscope`, `lonOf` from `./engine`; `ASPECT_DEFS`, `AspectKey`, `PlanetKey` from `./constants`; `angleDiff` from `./format`.
- Produces:
```ts
export type NatalPoint = PlanetKey | "asc" | "mc";
export interface TransitHit {
  transiting: PlanetKey; natalPoint: NatalPoint; aspectKey: AspectKey;
  angle: 0 | 60 | 90 | 120 | 180; orb: number; applying: boolean; exactAt: Date | null;
}
export const EXACT_WINDOW_MS: Partial<Record<PlanetKey, number>>;
export function findExactSeparation(
  sepAt: (t: Date) => number, angle: number, from: Date, dir: 1 | -1, windowMs: number
): Date | null;
export function transitsToNatal(natal: ChartData, current: ChartData): TransitHit[];
export function sortTransitHits(hits: TransitHit[]): TransitHit[]; // moon transits first, then applying before separating, then orb ascending
export function sortAspectCells(cells: AspectCell[]): AspectCell[]; // same ordering for sky aspects
```

- [ ] **Step 1: Add `tsx` and write the failing check script `app/scripts/check-transits.ts`**

Cases (throw on failure; exit 1 on any throw):
- **Synthetic minimum:** `sepAt(t) = |8 − t/86400000|°` with `angle 0`, `dir 1`, `windowMs 30 d` from `t0` → `findExactSeparation` returns `t0 + 8 d` ± 60 s. A second run with `windowMs 4 d` → returns `null` (minimum outside window).
- **Boundary (orb gate in `transitsToNatal`):** construct a `natal`/`current` pair whose separation is 8.1° from conjunction → no hit; nudge to 7.95° → hit exists. (Build the pair via real `computeChart` calls at two instants ~0.15 d apart, or by monkey-patching — prefer real charts chosen so the Moon sits just outside/inside orb.)
- **Case A (lunar):** transiting Moon opposition a natal Sun. Fix a natal chart a few hours before a known full moon; assert the hit's `exactAt` matches the published full-moon UTC instant (fill in from a web-verified source — timeanddate.com or NASA moon-phase table — record the URL in the commit message) within 30 minutes.
- **Case B (Saturn, retrograde):** transiting Saturn conjunct a natal point a few arcminutes past a 2026 Saturn station. Fill the expected first-exactness date from a web-verified Saturn station table; assert `exactAt` matches within 1 day AND is the *first* pass (≤ station date, not a later direct-station date).
- **Case C (solar return):** natal `1985-04-12T08:30:00Z`; assert transiting Sun conjunction natal Sun `exactAt` falls on the anniversary ± 1 day.
Run: `npm run check:transits` → FAIL (module `./src/astro/transits` does not exist).

- [ ] **Step 2: Implement `app/src/astro/transits.ts`**

- `EXACT_WINDOW_MS`: moon 2 d, sun/mercury/venus/mars 30 d, jupiter/saturn 90 d (uranus/neptune/pluto 90 d for completeness).
- `findExactSeparation`: step = `Math.min(6 h, windowMs/48)` in ms; evaluate `f(t) = Math.abs(sepAt(t) − angle)` over grid points walking from `from` in direction `dir` (include one grid point *before* `from` when `dir === 1` so a minimum exactly at `from` is bracketed); find the first interior grid point `i` with `f[i] <= f[i−1] && f[i] < f[i+1]`; ternary-search that bracket to < 60 000 ms. No interior minimum → `null`.
- `transitsToNatal`: targets = `natal.bodies` filtered to `PLANETS.slice(0,7)` plus `{ key: "asc", lon: natal.asc }` and `{ key: "mc", lon: natal.mc }`; transiting set = same 7. For each pair × aspect def: `orb = Math.abs(sep − angle)`; keep when `orb <= def.orb`. Applying: recompute separation at `current.date + 6 h` via `buildHoroscope`/`lonOf`/`angleDiff` and compare orbs. `exactAt`: `findExactSeparation(sepAt(t) = Math.abs(angleDiff(lonOf(buildHoroscope(new Date(t), current.lat, current.lng), transiting), targetLon)), angle, current.date, applying ? 1 : −1, EXACT_WINDOW_MS[transiting])`.
- `sortTransitHits` / `sortAspectCells`: Moon-involved first; then applying before separating; then orb ascending.

- [ ] **Step 3: Run the check**

Run: `npm run check:transits` → all cases PASS (paste the ephemeris source URLs into the commit message).

- [ ] **Step 4: Build + commit**

Run: `cd app && npm run build` → pass.
```bash
git add -A && git commit -m "feat(astro): transit engine with exact-hit finder (verified vs published ephemeris)"
```

---

### Task 6: Traditional testimony corpus — `tradition.ts`

**Files:**
- Create: `app/src/data/tradition.ts`
- Create: `app/scripts/check-tradition.ts`
- Modify: `app/package.json` (script `check:tradition": "tsx scripts/check-tradition.ts"`)

**Interfaces:**
- Consumes: `PlanetKey` from `src/astro/constants`; `AspectKey` from Task 4.
- Produces:
```ts
export interface Testimony {
  match: { planet: PlanetKey; aspect?: AspectKey };
  kind: "quote" | "doctrine";
  text: string; author: string; work: string; year: number; citation: string;
}
export const TESTIMONY: Testimony[];
export function lookupTestimony(planet: PlanetKey, aspect: AspectKey): Testimony;
```

- [ ] **Step 1: Write the corpus + lookup in `app/src/data/tradition.ts`**

Corpus rules (spec §3.3): ≥ 24 entries; for each of the 7 classical planets at least one planet-wide entry (`match.aspect` omitted), one hard-aspect entry (square or opposition), one soft-aspect entry (trine, sextile, or conjunction). Candidate sources: William Lilly *Christian Astrology* (1647), Ptolemy *Tetrabiblos* (Ashmand translation, public domain), Bonatti *Liber Astronomiae*, Al-Biruni *Book of Instruction*, William Ramesey *Astrologia Restaurata* (1653). For every `kind: "quote"`, verify the wording against a web source (public-domain scan at archive.org / sacred-texts.com / Wikiquote) *during this task*; anything not confirmed verbatim is written as `kind: "doctrine"` with "After {author}…" phrasing. Keep a `// verified: <url>` comment on each quote entry — required.

- [ ] **Step 2: Write `app/scripts/check-tradition.ts` and run it**

Asserts: `TESTIMONY.length >= 24`; coverage — for each of `PLANETS.slice(0,7)` ≥ 1 planet-wide, ≥ 1 square/opposition, ≥ 1 of trine/sextile/conjunction; every entry has non-empty `author/work/citation` and `year > 0`; every `kind === "quote"` entry has a `// verified: http` comment; `lookupTestimony` prefers an exact aspect match over planet-wide and returns a planet-wide entry for all 7 planets with an arbitrary aspect.
Run: `npm run check:tradition` → PASS.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(data): verified traditional testimony corpus with lookup"
```

---

### Task 7: `/natal` — Natal & Transits page

**Files:**
- Create: `app/src/components/TestimonyCard.tsx`
- Create: `app/src/pages/site/NatalPage.tsx`
- Modify: `app/src/App.tsx` (route `/natal`)
- Modify: `app/src/components/SiteLayout.tsx` (`NAV` gains `{ to: "/natal", label: "Natal & Transits" }`)
- Modify: `app/public/sitemap.xml` (add `/natal` URL)
- Test: build+lint; browser flow in Task 12

**Interfaces:**
- Consumes: `useSky()` (Task 3), `computeChart`/`ChartData` (engine), `transitsToNatal`, `sortTransitHits`, `TransitHit` (Task 5), `lookupTestimony`, `Testimony` (Task 6), `CITIES` (Task 2), `loadNatal/saveNatal/clearNatal/NatalProfile` (Task 2), `SquareChart` (existing).
- Produces:
```ts
// TestimonyCard.tsx
export function TestimonyCard({ testimony }: { testimony: Testimony }): ReactElement;
```

- [ ] **Step 1: Write `app/src/components/TestimonyCard.tsx`**

`kind === "quote"` → text in quotation marks followed by an em-dash attribution (`— William Lilly, Christian Astrology, 1647`) and the `citation` in a `<cite>`. `kind === "doctrine"` → prefix `After {author}, {work} ({year}): ` then text, no quotation marks. Both render as an aside (`.manor-card`, `.font-display` italic) with an `aria-label`.

- [ ] **Step 2: Write the page `app/src/pages/site/NatalPage.tsx`**

- `useMeta("Natal Chart & Live Transits — The Cunning Man", "Cast your natal chart by the old art and watch the living sky aspect it: exact transits, applying and separating, with testimony from Lilly, Ptolemy, Bonatti and the tradition.")`.
- Unsaved: one `<h1>` ("Natal & Transits"), intro `<p>`, then a form: name input (optional), `datetime-local` birth moment, place controls (city `<select>` from `CITIES`, lat/lng inputs, 📍 button → `useSky().refreshLocation()` then copy `loc` into the place fields), submit "Cast the natal figure". Validation (finite coords, `|lat| ≤ 90`, `|lng| ≤ 180`, parseable date) with inline error text — never `alert`.
- Saved: summary header (`<h1>` + `<dl>` of name/birth/place); natal wheel `<SquareChart chart={natalChart} showOuters={false} />` in the same `.wheel-frame` motif as the clock; natal positions `<table className="tbl-ledger">` with `<thead>` + `<th scope="col">` columns Planet · Position · House · Speed · Station; live transits list — `currentChart = useMemo(() => computeChart(now, loc.lat, loc.lng), [floor(now/1000), loc])`, `hits = sortTransitHits(transitsToNatal(natalChart, currentChart))` — as `<ul>` rows `Saturn □ natal Moon · 1.2° applying · perfects 12 Mar 2027` (glyph + spelled-out aspect name via `ASPECT_GLYPH`/`aspectKey`; date via `date-fns` `format`) each followed by `<TestimonyCard testimony={lookupTestimony(hit.transiting, hit.aspectKey)} />`; `exactAt === null` rows render "separating — no perfection in window". Natal chart memo: `computeChart(new Date(profile.birth), profile.lat, profile.lng)` — once per profile, not per tick. Edit button (form prefilled) and Clear button (`window.confirm`, then `clearNatal()`).

- [ ] **Step 3: Wire the route, nav, and sitemap**

`App.tsx`: `<Route path="/natal" element={<NatalPage />} />`. `NAV` entry as specified. `public/sitemap.xml`: add `<url><loc>https://the-cunning-man-davids-projects-76350782.vercel.app/natal</loc><changefreq>monthly</changefreq></url>` matching the file's existing formatting.

- [ ] **Step 4: Verify**

Run: `cd app && npm run build && npm run lint` → pass.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(natal): natal chart + live transits page with traditional testimony"
```

---

### Task 8: Active Transits panel + clock page on the shared context

**Files:**
- Create: `app/src/components/ActiveTransitsPanel.tsx`
- Modify: `app/src/pages/Home.tsx`
- Test: build+lint; visual/browser in Task 12

**Interfaces:**
- Consumes: `useSky()` (Task 3); `findExactSeparation`, `sortAspectCells`, `sortTransitHits`, `transitsToNatal`, `EXACT_WINDOW_MS` (Task 5); `loadNatal`, `NatalProfile` (Task 2); `TestimonyCard` (Task 7); `CITIES` (Task 2).
- Produces:
```ts
export function ActiveTransitsPanel({ chart }: { chart: ChartData }): ReactElement;
```
(`chart` is the clock's current `ChartData`; the panel derives everything else.)

- [ ] **Step 1: Write `app/src/components/ActiveTransitsPanel.tsx`**

Collapsible panel (default open; toggle button with `aria-expanded`, local state, `.manor-card`). Section 1 "In the sky now": `sortAspectCells(chart.aspectsGrid)` rows `Moon △ Venus · 0.8° applying · separates 18:42` — the time via `findExactSeparation(sepAt, angle, chart.date, applying ? 1 : −1, windowOfFasterBody)` where `windowOfFasterBody` = the smaller `EXACT_WINDOW_MS` of the two bodies; memo the whole section on `floor(chart.date.getTime() / 300000)`. Time formatted `HH:mm` same-day, else `d MMM HH:mm`. Section 2 "To your natal chart": if `loadNatal()` returns a profile → compute its natal chart once (`computeChart(new Date(profile.birth), profile.lat, profile.lng)`), `sortTransitHits(transitsToNatal(natal, chart))`, same row format + `<TestimonyCard>`; if no profile → one line + `<Link to="/natal">Cast your natal figure</Link>`.

- [ ] **Step 2: Migrate `app/src/pages/Home.tsx` onto `useSky`**

- Delete `STORAGE_KEY`, `loadLoc`, `saveLoc`, the local `loc` state, `latText/lngText`, `applyCoords`, `useMyLocation`; import `useSky` instead. `viewTime = new Date(now.getTime() + offsetMs)` with `now` from the context.
- Header location controls become: city `<select>` (`setLoc({ ...city, source: "manual" })`), lat/lng inputs + Set (`source: "manual"`), 📍 (`refreshLocation()`). Keep time-travel buttons and the "Outer planets" toggle unchanged.
- Add `<ActiveTransitsPanel chart={chart} />` at the top of the left column.

- [ ] **Step 3: Verify**

Run: `cd app && npm run build && npm run lint` → pass.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(clock): active transits panel + shared sky context on the clock"
```

---

### Task 9: Visual migration I — layout, panels, wheel, tilt

**Files:**
- Create: `app/src/hooks/useTilt.ts`
- Modify: `app/src/components/SiteLayout.tsx`
- Modify: `app/src/components/panels.tsx`
- Modify: `app/src/components/SquareChart.tsx`
- Modify: `app/src/pages/Home.tsx` (wheel frame + header chrome)
- Test: build+lint; optional screenshot via `app/scripts/cdp_shot.mjs`

**Interfaces:**
- Consumes: token classes from Task 1.
- Produces:
```ts
export function useTilt<T extends HTMLElement>(maxDeg?: number): React.RefObject<T | null>;
```

- [ ] **Step 1: Write `app/src/hooks/useTilt.ts`** — pointer-move on the ref'd element maps to `transform: perspective(1200px) rotateX(..) rotateY(..)` ≤ `maxDeg` (default 3) around the element center, reset on pointer-leave; no-op (no listeners attached) when `prefers-reduced-motion: reduce` matches or `inIframe` is true.

- [ ] **Step 2: Restyle `SiteLayout.tsx` onto tokens** — page bg `bg-parchment text-ink font-ui`; header/footer keep the double-rule motif via the token shadow stack on `border-line`; brand in EB Garamond real small-caps (`font-feature-settings: "smcp"` — replace every inline `fontVariant: "small-caps"`); nav active state becomes `.btn-seal`-style wax seal, inactive `border-line hover:bg-parchment-deep`; all hexes (`#f0e8d0`, `#e8dcbc`, `#5a3d1e`, `#7a1f1f`, `#f5eeda`, `#6b5537`) replaced by token utilities. Keep the iframe-bare branch.

- [ ] **Step 3: Restyle `panels.tsx` onto tokens + semantics** — replace every hardcoded hex with token utilities; every panel title becomes `<h2>`; all data tables adopt `.tbl-ledger` with `<thead>` + `<th scope="col">`; glyph usages adopt `.glyph-pair` (glyph + `PLANET_LABEL`/`SIGN_LABEL`); existing `aria-label`s kept.

- [ ] **Step 4: Restyle `SquareChart.tsx` + wheel frame** — chart chrome (rings, text, house lines) moves to CSS variables where the SVG needs exact values: inline `hsl(var(--ink))`, `hsl(var(--ink-soft))`, `hsl(var(--line))`, `hsl(var(--card))`; `SIGN_COLOR`/`PLANET_COLOR` data fills stay. Add `role="img"` plus an `aria-label` summarizing Ascendant sign/degree and Moon sign/degree (computed from the passed `chart`). In `Home.tsx`, apply `useTilt` to the `.wheel-frame` div and give it the layered-paper shadow; the clock header/footer hexes become tokens.

- [ ] **Step 5: Verify**

Run: `cd app && npm run build && npm run lint` → pass. Optional: `node scripts/cdp_shot.mjs` against the dev server for a before/after screenshot (if it fails for environment reasons, note it and move on).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "style(theme): token-driven renaissance chrome on layout, panels, wheel + subtle tilt"
```

---

### Task 10: Visual migration II — the site pages

**Files:**
- Modify: `app/src/pages/site/SiteHome.tsx`, `SynastryPage.tsx`, `LaunchesPage.tsx`, `SigilPage.tsx`, `RunesPage.tsx`, `SpellPage.tsx`, `PressIndex.tsx`, `PressRelease.tsx`
- Test: build+lint + hex grep gate

**Interfaces:**
- Consumes: token classes from Task 1.

- [ ] **Step 1: Token + semantics sweep, one page at a time, in this order: SiteHome → Synastry → Launches → Sigil → Runes → Spell → PressIndex → PressRelease.** For each page: replace every hardcoded hex (current palette values such as `#f7f0da`, `#5a3d1e`, `#7a1f1f`, `#2b1d0e`, `#d8c9a3`, `#1e6b34`, `#4a351f`, `#6b5537`) with the matching token utility (`bg-card`, `border-line`, `bg-seal`, `text-ink`, `text-spruce`, `text-ink-soft`, …); replace inline `style={{ fontVariant: "small-caps" }}` with the small-caps utility class; verify exactly one `<h1>`; wrap major blocks in `<section aria-labelledby>` with `<h2>`; convert result tables to `.tbl-ledger` with `<thead>`/scoped `th`; ensure every glyph sits in a `.glyph-pair` with its label; convert label-value clusters to `<dl>`.

- [ ] **Step 2: Verify**

Run: `cd app && npm run build && npm run lint` → pass.
Run: `grep -rnE "#[0-9a-fA-F]{3,8}\b" src/pages src/components` → **no matches** (chart-color data lives in `src/astro/constants.ts`, outside the gate).

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "style(theme): token + semantic sweep across all site pages"
```

---

### Task 11: SEO & agent layer

**Files:**
- Modify: `app/index.html`
- Modify: `app/src/pages/site/SiteHome.tsx`
- Modify: `app/src/pages/Home.tsx`
- Modify: `app/src/pages/site/NatalPage.tsx`
- Modify: `app/public/robots.txt`
- Create: `app/public/llms.txt`
- Test: build; dev-server curl checks

**Interfaces:**
- Consumes: page copy already on screen (JSON-LD must mirror visible text only).

- [ ] **Step 1: `app/index.html`** — add `<link rel="canonical" href="https://the-cunning-man-davids-projects-76350782.vercel.app/" />`; Google Fonts: `<link rel="preconnect" href="https://fonts.googleapis.com">`, `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`, `<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Source+Sans+3:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet">`; global `WebSite` JSON-LD (`@type: WebSite`, name, url, description matching the existing meta description).

- [ ] **Step 2: Page-level JSON-LD** — `SiteHome.tsx`: `FAQPage` whose questions/answers copy the visible directory copy verbatim (3–4 entries); `Home.tsx`: `WebApplication` (name "The Cunning Man — Shield Astrological Clock", applicationCategory "LifestyleApplication", operatingSystem "Any (web browser)", offers price 0); `NatalPage.tsx`: `WebApplication` likewise. Render each via `useEffect` (create/replace a `<script type="application/ld+json">` in `document.head`, remove on unmount) so it never lands in widget-iframe markup.

- [ ] **Step 3: `app/public/robots.txt`** — `User-agent: *` / `Allow: /` / `Sitemap: https://the-cunning-man-davids-projects-76350782.vercel.app/sitemap.xml`.

- [ ] **Step 4: `app/public/llms.txt`** — plain-text agent manifest: one line per tool (clock, natal & transits, synastry, elections, sigil, runes, spells) with its URL path and a one-sentence plain description, plus the disclaimer line, in the site's voice.

- [ ] **Step 5: Verify**

Run: `cd app && npm run build` → pass. Run dev server (`npm run dev`) and `curl -s -o /dev/null -w "%{http_code} " http://localhost:5173/robots.txt http://localhost:5173/llms.txt http://localhost:5173/sitemap.xml` → `200 200 200`.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(seo): canonical, fonts, JSON-LD, robots, llms.txt"
```

---

### Task 12: Final verification sweep against the done-when checklist

**Files:** none (verification only; fixes land as a follow-up commit if anything fails)

**Interfaces:**
- Consumes: everything.

- [ ] **Step 1: Static gates** — `cd app && npm run build && npm run lint` pass; `npm run check:transits && npm run check:tradition && npm run check:natal` all pass; hex grep gate from Task 10 still clean; `grep -rn "TBD\|TODO\|PLACEHOLDER" src` → no matches.

- [ ] **Step 2: Live browser sweep** (drive the dev server with a real browser — the repo's `scripts/cdp_shot.mjs` for screenshots plus the desktop-browser tool for interaction): every route (`/`, `/clock`, `/natal`, `/synastry`, `/launches`, `/sigil`, `/runes`, `/spells/love`, `/spells/money`, `/press`) shows the ticking header clock and correct place name; header time matches the system clock for the selected city — check London *and* Dubai (Review Focus #5).

- [ ] **Step 3: Geolocation paths** — grant: 📍 sets "My location" and the clock uses it; deny: no repeated prompt after the first denial, pages keep working on the fallback location (Review Focus #3); manual city select updates all pages.

- [ ] **Step 4: /natal flow** — save a profile with a known birth moment; natal wheel renders; spot-check one natal planet position against the clock page for a manually time-traveled matching instant; transit rows show plausible applying/separating states and exact dates; edit and clear round-trip.

- [ ] **Step 5: Clock panel correctness** — at a fixed instant, the Active Transits "In the sky now" rows match the engine's aspectarian for the same instant (compare against the Aspect Grid panel on the same page); with a natal profile saved, natal rows appear with testimony cards.

- [ ] **Step 6: Agent-readability spot check** — view-source on `/clock` and `/natal`: exactly one `<h1>` each, `header/nav/main/footer` landmarks, scoped `<th>`, JSON-LD blocks present, `/robots.txt`, `/llms.txt`, `/sitemap.xml` served.

- [ ] **Step 7: Widget iframe regression** — load `/clock` inside a sandboxed iframe: renders bare, ticks, no console errors, no storage exceptions (Review Focus #4).

- [ ] **Step 8: Report** — write a short completion note mapping each spec done-when item to its evidence (command outputs / observations). If anything failed: fix in a follow-up commit, re-run its step, then report.

---

## Self-review notes (2026-10-06)

- **Spec coverage:** §3.1→T3, §3.2→T4+T5, §3.3→T6, §3.4→T2+T7, §3.5→T8, §3.6→T1+T9+T10, §3.7→T11 (+T12 verification), §5→T5/T6/T12, §6→T12. All covered.
- **Step scan:** every step names its file, its exact values/signatures, and its check command; no body is dictated where signature+values suffice (T5's search algorithm is the one place the spec's math needs spelling out — intentional).
- **Type consistency:** `City/CITIES` and `NatalProfile/loadNatal/saveNatal/clearNatal` (T2) consumed in T3/T7/T8; `Loc/Sky/useSky` (T3) consumed in T7/T8; `AspectKey/ASPECT_DEFS` (T4) consumed in T5/T6; `TransitHit/findExactSeparation/sortTransitHits/sortAspectCells/EXACT_WINDOW_MS` (T5) consumed verbatim in T7/T8; `Testimony/lookupTestimony` (T6) consumed in T7/T8 via `TestimonyCard` (T7).
- **Review Focus → owning tasks:** retrograde first-pass (T5 Case B), orb boundary (T5 synthetic), geolocation denial (T12 Step 3; guard written in T3), opaque-origin iframe (T12 Step 7; guards written in T2/T3), non-integer tz (T12 Step 2).
- **Proportion:** plan ≈ 1.6× spec length; heaviest detail sits on the math (T5) and corpus (T6) tasks where "keep it real" demands exactness.
- **Ordering note:** T2 (data/storage) precedes T3 (context) so `CITIES` exists before the header select needs it — the earlier draft had these reversed and was corrected during self-review.
