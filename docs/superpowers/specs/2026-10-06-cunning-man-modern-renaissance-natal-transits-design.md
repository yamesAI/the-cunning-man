# The Cunning Man — Modern Renaissance Restyle + Natal & Transits Module

**Date:** 2026-10-06
**Status:** Approved (design presented in chat, user approved 2026-10-06)
**Project:** `Workspaces/ShieldAstroLive/app` ("The Cunning Man" — free Renaissance astrology grimoire)

## 1. Context & intent

The site (Vite 7 + React 19 + TS, `circular-natal-horoscope-js`, deployed on Vercel) currently
renders a live shield-style astrological clock plus seven static tool pages. The user wants:

1. **More Renaissance, not more modern** — deepen the period character; make details easy to see.
2. **Top priority: agent readability** — semantic, text-first HTML that an AI agent (or screen
   reader / crawler) can parse accurately.
3. **Light SEO** — meta/OG, JSON-LD, sitemap, robots.
4. **A little 3D** — subtle CSS depth only; no WebGL.
5. **Easily updateable** — one token file, content in data files, no scattered hardcoded values.
6. **New Natal + Transit module** (`/natal`): saved birth profile → natal chart + live
   transits-to-natal aspects with exact-hit dates and **verified traditional astrologer quotes**.
7. **Active Transits on the dashboard** (`/clock`): live sky transits + (when a profile exists)
   transits to the natal chart, with matched traditional testimony.
8. **Time and location automatically update on every page** — a shared live clock and a
   geolocation-backed location that re-acquires itself, with a manual fallback.

"Keep it real": all positions/aspects/exact-hit dates come from the real ephemeris engine
already in the repo; every traditional quote must be verbatim-verified against a public source
or shipped as an explicitly labeled doctrine paraphrase. No fabricated citations.

## 2. Non-goals

- Bi-wheel SVG geometry (natal + transit wheels in one drawing) — deferred.
- Backend, accounts, sync — profiles stay in `localStorage`.
- Test framework/scaffolding — the project has no test runner and house rules say don't add one.
- PWA, i18n, dark mode (the parchment *is* the brand).
- Changing the underlying astro techniques (tropical, geocentric, Regiomontanus, Egyptian terms).

## 3. Architecture

### 3.1 Shared sky context — `src/sky/SkyContext.tsx` (new)

```ts
interface Loc { lat: number; lng: number; name: string; source: "geo" | "manual"; }
interface Sky {
  now: Date;                     // live instant, ticked every 1000 ms
  loc: Loc;
  setLoc: (loc: Loc) => void;
  refreshLocation: () => void;   // re-acquire geolocation, only when source === "geo"
}
```

- `<SkyProvider>` wraps the app in `App.tsx`. One `setInterval(1000)` drives `now`; consumers
  memoize heavy math at coarser buckets (clock: 1 s; elections: 5 min; site pages: 1 s is fine
  because `computeChart` is memoized on `floor(t/1000)` already).
- Location persistence: `localStorage` key `cunning-man:location` (replaces the clock page's
  private `shield-astro-location`; migrate-read the old key once if present). All storage access
  stays try/catch — widget iframes can have an opaque origin.
- Default location: London `{ 51.5074, -0.1278 }`.
- **Auto-update behavior:** on provider mount, if `source === "geo"` (or no saved location),
  request `navigator.geolocation`; on success update `loc` (name `"My location"`, plus tz label
  from the engine). Re-acquire on `window` `focus` and on a 5-minute interval, but only while
  `source === "geo"`. Geolocation denial or absence → the UI falls back to the manual picker;
  never prompt repeatedly after a denial in the same session.
- **Header clock pill:** `SiteLayout` header (non-iframe mode) shows live wall time at `loc`
  (1 s tick, tabular numerals) + place name + tz label. This is the literal "time updates on
  every page."
- The clock page (`/clock`) consumes `now`/`loc` from context but keeps its time-travel
  `offsetMs` locally: `viewTime = now + offsetMs`. Its old storage/geolocation code is deleted.

### 3.2 Transit engine — `src/astro/transits.ts` (new)

Reuses `computeChart` for both natal and current charts (same ephemeris, same house system).

```ts
type NatalPoint = PlanetKey | "asc" | "mc";
interface TransitHit {
  transiting: PlanetKey;          // classical 7: sun..saturn
  natalPoint: NatalPoint;
  aspectKey: AspectKey;           // conjunction | sextile | square | trine | opposition
  angle: 0 | 60 | 90 | 120 | 180;
  orb: number;                    // degrees, at the current moment
  applying: boolean;              // from real 6 h speed samples
  exactAt: Date | null;           // true first local minimum of |orb|, or null if none in window
}
function transitsToNatal(natal: ChartData, current: ChartData): TransitHit[]
```

- Natal points: 7 classical planets + natal Asc + natal MC (9 points). Transiting set: classical 7
  (outers excluded — the tradition corpus predates them; the sky-transits panel still shows them).
- Aspects & orbs: exactly the engine's existing traditional set — ☌ 8°, ⚹ 5°, □ 6°, △ 7°, ☍ 8°.
  `ASPECT_DEFS` and the `AspectCell["aspectKey"]` union move from `engine.ts` into
  `src/astro/constants.ts` and are imported by both (small refactor, no behavior change).
- **Exact-hit finder (honest math):** for each hit, scan from the current instant in the aspect's
  natural direction (applying → forward, separating → backward) in 6 h steps, tracking unwrapped
  separation via the `angleDiff` continuity pattern already used in `engine.ts`'s `findPhase`.
  Window per transiting planet: Moon 2 d, Sun/Mercury/Venus/Mars 30 d, Jupiter/Saturn 90 d.
  On the first local minimum of `|sep − angle|`, bisect to < 1 minute. Retrograde loops naturally
  produce the first exactness. No minimum within the window → `exactAt: null` (rendered as
  "no perfection in window," never a made-up date).
- Applying/separating: orb at `t` vs orb at `t + 6 h` (same approach as `engine.ts`).

### 3.3 Traditional testimony data — `src/data/tradition.ts` (new)

```ts
interface Testimony {
  match: { planet: PlanetKey; aspect?: AspectKey };  // aspect omitted = planet-wide default
  kind: "quote" | "doctrine";
  text: string;                 // verbatim (kind=quote) or labeled paraphrase (kind=doctrine)
  author: string;               // e.g. "William Lilly"
  work: string;                 // e.g. "Christian Astrology"
  year: number;                 // e.g. 1647
  citation: string;             // book/chapter where verifiable
}
lookupTestimony(planet: PlanetKey, aspect: AspectKey): Testimony;
```

- **Anti-fabrication protocol (mandatory):** every candidate line is checked with web sources
  (public-domain scans, e.g. archive.org's *Christian Astrology* 1647, sacred-texts.com's
  *Tetrabiblos*, Wikiquote) before inclusion. Wording confirmed → `kind: "quote"`, rendered in
  quotation marks. Not confirmable → rewritten as `kind: "doctrine"`, rendered with an explicit
  "After {author}, {work} ({year}):" prefix and no quotation marks.
- Corpus targets: Lilly (*Christian Astrology*), Ptolemy (*Tetrabiblos*), Bonatti (*Liber
  Astronomiae* / *Tractatus*), Al-Biruni (*Book of Instruction in the Elements of the Art of
  Astrology*), Ramesey (*Astrologia Restaurata*). Coverage ≥ 3 entries per planet (one
  planet-wide, one hard-aspect, one soft-aspect) → ≥ 24 entries minimum.
- Lookup precedence: exact `{planet, aspect}` → planet-wide fallback. Callers get a guaranteed
  hit (planet-wide entries exist for all 7).

### 3.4 `/natal` — Natal & Transits page (`src/pages/site/NatalPage.tsx`, new)

Route `/natal`, nav label "Natal & Transits", added to `NAV` in `SiteLayout` and sitemap.

- **Unsaved state:** a birth form — name (optional), `datetime-local`, place via preset-city
  dropdown (`src/data/cities.ts`: London, New York, Los Angeles, Chicago, Toronto, Berlin,
  Madrid, Dubai, Tokyo, Sydney) or lat/lng inputs or the shared 📍 geolocation. Validation:
  finite coords, `|lat| ≤ 90`, `|lng| ≤ 180`, parseable date.
- **Persistence:** `cunning-man:natal` = `{ name?, birth: ISO string, lat, lng, placeName }`
  (try/catch storage).
- **Saved state:**
  - Summary header: name, birth moment, place.
  - Natal wheel: existing `SquareChart` fed `computeChart(birth, lat, lng)` (component is
    reused, not forked).
  - Natal positions table: planet · sign°deg′ · house · speed · retro.
  - **Live transits-to-natal:** `transitsToNatal(...)` recomputed each second (memoized), sorted
    Moon-first then applying-first then orb-ascending. Row text:
    `Saturn □ natal Moon · 1.2° applying · perfects 12 Mar 2027` followed by its testimony card
    (quote or labeled doctrine). `exactAt: null` rows say "separating — no perfection in window."
  - Edit (returns to form with values) and Clear (removes storage) actions.

### 3.5 Active Transits on the dashboard (`/clock`)

New `ActiveTransitsPanel` (`src/components/ActiveTransitsPanel.tsx`), placed at the top of the
clock page's left column, driven by the shared context's `viewTime`:

- **In the sky now:** `chart.aspectsGrid` (already computed by the engine — real data), sorted
  Moon-involved first, then applying-first, then orb-ascending; row text
  `Moon △ Venus · 0.8° applying · separates 18:42` (separation time = same exact-hit finder run
  separating-direction).
- **To your natal chart** (only when `cunning-man:natal` exists): `transitsToNatal` rows as on
  `/natal`, each with its testimony. Section renders a one-line pointer to `/natal` when no
  profile exists.
- Panel is collapsible (`<details>`/state) to preserve the clock's information budget; default
  expanded on wide screens.

### 3.6 Visual system — Renaissance, deeper

All values live in `app/src/index.css` as CSS variables (replacing the scaffold's default
shadcn values). The named Renaissance tokens (`--parchment`, `--parchment-deep`, `--ink`,
`--ink-soft`, `--seal`, `--seal-deep`, `--brass`, `--spruce`) are exposed as Tailwind utilities
(`bg-parchment`, `text-ink`, `border-seal`…) by extending `theme.extend.colors` in
`tailwind.config.js` with the same `hsl(var(--token))` pattern the scaffold already uses for
`background`/`foreground`. The shadcn-mapped tokens keep working unchanged. After migration,
**no hex literals remain in any component file** (verified by grep in the done-when checklist).

- **Palette (HSL tokens):** warmer/deeper parchment (`--parchment` page, `--parchment-deep`
  cards) for real contrast; true iron-gall ink (`--ink`, `--ink-soft`); sealing-wax red
  (`--seal`, `--seal-deep`) as the single accent; brass (`--brass`) for highlights; spruce green
  reserved for benefic semantics, red for malefic — semantics only, never decoration.
- **Typography:** EB Garamond via Google Fonts for display (real small-caps through OpenType
  `font-feature-settings`, replacing the inline `fontVariant` styles); a humanist sans
  (Source Sans 3) for dense data tables and UI chrome; `font-variant-numeric: tabular-nums` on
  every numeric run. Every astro glyph is **always** paired with its spelled-out name
  (`☌ conjunction`) — humans and agents both get the meaning.
- **Recurring classes** (`@layer components` in `index.css`, this is the updateability lever):
  `.manor-card` (double-rule frame motif, kept from the current design), `.btn-seal`,
  `.tbl-ledger` (scoped `th`, tabular numerals, zebra-free parchment rules), `.glyph-pair`.
- **A little 3D, all CSS:** layered-paper `box-shadow` stacks; beveled double-rule frames;
  raised wax-seal buttons with inset top highlight; a pointer-tilt of ≤ 3° on the shield wheel
  frame (`useTilt` hook, `perspective: 1200px`, transform on the frame not the SVG). Disabled
  under `prefers-reduced-motion` and inside widget iframes. No WebGL, no animation libraries.

### 3.7 Agent readability & SEO (top priority)

- **Semantic sweep of every page:** exactly one `<h1>`; `header/nav/main/footer` landmarks
  already in `SiteLayout` (kept); sections headed by `<h2>`; all data tables get `<thead>` +
  `<th scope="col">`; chart facts render as real text/tables (`dl` where label-value), never
  glyph-only or image-only; descriptive link text; decorative SVGs `aria-hidden`, informative
  ones `role="img"` with `aria-label` (existing pattern, applied consistently).
- **`useMeta` kept** for per-page title/description; `index.html` gains global OG/Twitter tags,
  canonical, and preconnected Google Fonts.
- **JSON-LD** (visible-text-matching, no spam): `WebSite` on `/`, `WebApplication` on `/clock`
  and `/natal`, `FAQPage` on `/` (questions already answered in visible copy).
- **Sitemap + robots:** add `/natal` to the sitemap source, add `public/robots.txt` referencing
  it, add a static `public/llms.txt` describing the tools in plain text (agent-facing).
- Existing `data-kimi-*` attributes and iframe-bare mode are preserved untouched.

## 4. File-level change list

**New:** `src/sky/SkyContext.tsx`, `src/astro/transits.ts`, `src/data/tradition.ts`,
`src/data/cities.ts`, `src/pages/site/NatalPage.tsx`, `src/components/ActiveTransitsPanel.tsx`,
`src/hooks/useTilt.ts`, `public/robots.txt`, `public/llms.txt`.

**Modified:** `src/App.tsx` (provider + route), `src/components/SiteLayout.tsx` (tokens, header
clock pill, nav item), `src/pages/Home.tsx` (context consumption, new panel, delete private
location code), `src/components/panels.tsx`, `src/components/SquareChart.tsx` (tokens, tilt,
aria), all 7 `src/pages/site/*.tsx` (tokens + semantics), `src/index.css` (token layer +
component classes), `src/index.html` (fonts, meta), `src/astro/constants.ts` + `engine.ts`
(`ASPECT_DEFS` extraction), `tailwind.config.js` (named token utilities), sitemap source.

## 5. Verification plan (no test runner — per house rules)

1. `npm run build` and `npm run lint` pass clean.
2. **Ephemeris spot-check:** at least 3 sample transits (one lunar, one Saturn, one with a
   retrograde loop) have their `exactAt` dates cross-checked against an independent source
   (a `skyfield` script using a local DE421 kernel if installable; otherwise published
   ephemeris data via web). Manual recorded in the PR/commit notes.
3. **Quote audit:** grep `tradition.ts`; every `kind: "quote"` entry must have a source URL
   noted in its citation; count ≥ 24 entries.
4. **Live browser pass on the dev server:** every page shows the ticking header clock + correct
   place name; geolocation grant/deny paths both verified; `/natal` save/edit/clear round-trip;
   clock page panel lists real aspects matching the engine's aspectarian for the same moment.
5. **Agent-readability spot check:** view-source on `/clock` and `/natal` — one `h1`, landmarks,
   scoped `th`, JSON-LD blocks present, sitemap/robots/llms.txt served.
6. **Grep gate:** no hex color literals outside `index.css`.
7. Widget mode: `/clock` inside an iframe renders bare and still ticks (regression check).

## 6. Done-when checklist

- [ ] Every page: live header clock + location name; geo re-acquires on focus/interval; manual fallback works after denial.
- [ ] `/natal`: full save/edit/clear flow; natal wheel + positions table; transit rows with real orbs/applying/exact-hit dates.
- [ ] Exact-hit dates verified against an independent ephemeris for ≥ 3 sample aspects.
- [ ] `tradition.ts`: ≥ 24 entries, all cited, quotes verbatim-verified or labeled doctrine.
- [ ] `/clock`: Active Transits panel (sky + natal-with-profile) with testimonies.
- [ ] Visual: zero hardcoded hexes outside `index.css`; EB Garamond + sans live; 3D touches present but inert under reduced-motion/iframes.
- [ ] Agent/SEO: semantic sweep on all pages, JSON-LD on `/`, `/clock`, `/natal`; sitemap + robots + llms.txt live.
- [ ] `npm run build` + `npm run lint` clean; iframe widget regression checked.
