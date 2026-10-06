// Transit engine: aspects formed by the moving sky against natal positions,
// with true exact-hit dates found by a bounded minimum-orb search.

import type { ChartData, AspectCell } from "./engine";
import { buildHoroscope, lonOf } from "./engine";
import { ASPECT_DEFS, PLANETS, type AspectKey, type PlanetKey } from "./constants";
import { angleDiff } from "./format";

export type NatalPoint = PlanetKey | "asc" | "mc";

export interface TransitHit {
  transiting: PlanetKey;
  natalPoint: NatalPoint;
  aspectKey: AspectKey;
  angle: 0 | 60 | 90 | 120 | 180;
  orb: number; // degrees at the current moment
  applying: boolean;
  exactAt: Date | null; // first local minimum of |orb| in the natural direction
}

const DAY = 86400000;
const HOUR = 3600000;

export const EXACT_WINDOW_MS: Partial<Record<PlanetKey, number>> = {
  moon: 2 * DAY,
  sun: 30 * DAY,
  mercury: 30 * DAY,
  venus: 30 * DAY,
  mars: 30 * DAY,
  jupiter: 90 * DAY,
  saturn: 90 * DAY,
  uranus: 90 * DAY,
  neptune: 90 * DAY,
  pluto: 90 * DAY,
};

function ternaryMinimum(
  f: (tMs: number) => number,
  lo: number,
  hi: number
): number {
  while (hi - lo > 60000) {
    const m1 = lo + (hi - lo) / 3;
    const m2 = hi - (hi - lo) / 3;
    if (f(m1) <= f(m2)) hi = m2;
    else lo = m1;
  }
  return (lo + hi) / 2;
}

export function findExactSeparation(
  sepAt: (t: Date) => number,
  angle: number,
  from: Date,
  dir: 1 | -1,
  windowMs: number
): Date | null {
  const f = (tMs: number) => Math.abs(Math.abs(sepAt(new Date(tMs))) - angle);
  return scanForMinimum(f, from.getTime(), dir, windowMs);
}

// Grid of 48 intervals across the window (one extra point behind `from` when
// dir = 1 so a minimum exactly at `from` is bracketed), then ternary search on
// the first bracket where the orb stops shrinking.
function scanForMinimum(
  f: (tMs: number) => number,
  fromMs: number,
  dir: 1 | -1,
  windowMs: number
): Date | null {
  const step = windowMs / 48;
  const start = fromMs - (dir === 1 ? step : 0);
  const at = (i: number) => start + dir * i * step;

  let prev = f(at(0));
  let cur = f(at(1));
  for (let i = 1; i < 49; i++) {
    const next = f(at(i + 1));
    if (cur <= prev && cur < next) {
      const lo = at(i - 1);
      const hi = at(i + 1);
      return new Date(ternaryMinimum(f, Math.min(lo, hi), Math.max(lo, hi)));
    }
    prev = cur;
    cur = next;
  }
  return null;
}

// ---- batched exact-time search ----------------------------------------
// buildHoroscope costs ~5.6 ms, so the search phase evaluates orb functions on
// a coarse shared time grid (one horoscope per grid instant, reused by every
// hit/cell) and only the short ternary refinement builds fresh horoscopes.
// 24 intervals over the widest window: every body is monotonic enough at this
// spacing that the true minimum always lands inside a detected bracket, and
// the ternary then pins it to < 60 s.

const GRID_INTERVALS = 24;
const TERNARY_ITERS = 12;
const MAX_WINDOW_MS = 90 * DAY;

function makeHoroCache(lat: number, lng: number) {
  const cache = new Map<number, ReturnType<typeof buildHoroscope>>();
  return (tMs: number) => {
    const key = Math.round(tMs / 30000); // 30 s bucketing so refinement hits cache sometimes
    let h = cache.get(key);
    if (!h) {
      h = buildHoroscope(new Date(tMs), lat, lng);
      cache.set(key, h);
    }
    return h;
  };
}

function ternaryNarrow(
  f: (tMs: number) => number,
  lo: number,
  hi: number
): number {
  for (let i = 0; i < TERNARY_ITERS; i++) {
    const m1 = lo + (hi - lo) / 3;
    const m2 = hi - (hi - lo) / 3;
    if (f(m1) <= f(m2)) hi = m2;
    else lo = m1;
  }
  return (lo + hi) / 2;
}

function gridSearch(
  fArr: number[],
  gridLoMs: number,
  stepMs: number,
  fromMs: number,
  dir: 1 | -1,
  refine: (loMs: number, hiMs: number) => number
): Date | null {
  // anchored at `from`, not at the window edge: walk outward in the aspect's
  // natural direction so the NEXT (or most recent) exactness is found, never
  // a same-window minimum on the far side of the span
  const n = fArr.length;
  const i0 = Math.min(Math.max(Math.round((fromMs - gridLoMs) / stepMs), 1), n - 2);
  const lo = (i: number) => gridLoMs + Math.max(i - 1, 0) * stepMs;
  const hi = (i: number) => gridLoMs + Math.min(i + 1, n - 1) * stepMs;

  // minimum exactly at the current instant (bracket straddles `from`)
  if (fArr[i0] <= fArr[i0 - 1] && fArr[i0] < fArr[i0 + 1]) {
    return new Date(refine(lo(i0), hi(i0)));
  }
  if (dir === 1) {
    for (let i = i0 + 1; i < n - 1; i++) {
      if (fArr[i] <= fArr[i - 1] && fArr[i] < fArr[i + 1]) return new Date(refine(lo(i), hi(i)));
    }
  } else {
    for (let i = i0 - 1; i >= 1; i--) {
      if (fArr[i] <= fArr[i - 1] && fArr[i] < fArr[i + 1]) return new Date(refine(lo(i), hi(i)));
    }
  }
  return null;
}

function sharedGrid(fromMs: number, windowMs: number): { times: number[]; lo: number; step: number } {
  const step = windowMs / GRID_INTERVALS;
  const lo = fromMs - windowMs;
  const times = Array.from({ length: GRID_INTERVALS * 2 + 1 }, (_, i) => lo + i * step);
  return { times, lo, step };
}

const CLASSICAL = PLANETS.slice(0, 7); // sun..saturn

// Exact times for a whole aspectarian in one batch: one horoscope per shared
// grid instant (cached), pure arithmetic per cell, then per-cell refinement.
export function exactTimesForAspects(
  cells: AspectCell[],
  from: Date,
  lat: number,
  lng: number
): Map<AspectCell, Date | null> {
  const { times, lo, step } = sharedGrid(from.getTime(), MAX_WINDOW_MS);
  const horoAt = makeHoroCache(lat, lng);

  // planet longitudes at each grid instant
  const planets = [...new Set(cells.flatMap((c) => [c.p1, c.p2]))];
  const lonGrid = new Map<string, number[]>();
  for (const p of planets) {
    const arr = times.map((t) => lonOf(horoAt(t), p));
    lonGrid.set(p, arr);
  }

  const out = new Map<AspectCell, Date | null>();
  for (const c of cells) {
    const a = lonGrid.get(c.p1)!;
    const b = lonGrid.get(c.p2)!;
    const fArr = a.map((la, i) => Math.abs(Math.abs(angleDiff(la, b[i])) - c.angle));
    const refine = (loMs: number, hiMs: number) =>
      ternaryNarrow(
        (tMs) => {
          const h = horoAt(tMs);
          return Math.abs(Math.abs(angleDiff(lonOf(h, c.p1), lonOf(h, c.p2))) - c.angle);
        },
        loMs,
        hiMs
      );
    out.set(c, gridSearch(fArr, lo, step, from.getTime(), c.applying ? 1 : -1, refine));
  }
  return out;
}

// Exact-hit times for transit hits, batched the same way as the sky
// aspectarian. Callers tier recomputation: Moon hits move fast (short memo),
// slow planets barely move (long memo) — see NatalPage / ActiveTransitsPanel.
export function exactTimesForHits(
  hits: TransitHit[],
  natal: ChartData,
  from: Date,
  lat: number,
  lng: number
): Map<TransitHit, Date | null> {
  if (hits.length === 0) return new Map();
  const targets: Array<{ key: NatalPoint; lon: number }> = [
    ...natal.bodies
      .filter((b) => (CLASSICAL as readonly string[]).includes(b.key))
      .map((b) => ({ key: b.key as NatalPoint, lon: b.lon })),
    { key: "asc", lon: natal.asc },
    { key: "mc", lon: natal.mc },
  ];
  const { times, lo, step } = sharedGrid(from.getTime(), MAX_WINDOW_MS);
  const horoAt = makeHoroCache(lat, lng);
  const lonGrid = new Map<PlanetKey, number[]>();
  for (const p of CLASSICAL) lonGrid.set(p, times.map((t) => lonOf(horoAt(t), p)));

  const out = new Map<TransitHit, Date | null>();
  for (const h of hits) {
    const tgt = targets.find((t) => t.key === h.natalPoint)!;
    const grid = lonGrid.get(h.transiting)!;
    const fArr = grid.map((lg) => Math.abs(Math.abs(angleDiff(lg, tgt.lon)) - h.angle));
    const refine = (loMs: number, hiMs: number) =>
      ternaryNarrow(
        (tMs) => {
          const hh = horoAt(tMs);
          return Math.abs(Math.abs(angleDiff(lonOf(hh, h.transiting), tgt.lon)) - h.angle);
        },
        loMs,
        hiMs
      );
    out.set(h, gridSearch(fArr, lo, step, from.getTime(), h.applying ? 1 : -1, refine));
  }
  return out;
}

export function transitsToNatal(natal: ChartData, current: ChartData): TransitHit[] {
  const targets: Array<{ key: NatalPoint; lon: number }> = [
    ...natal.bodies
      .filter((b) => (CLASSICAL as readonly string[]).includes(b.key))
      .map((b) => ({ key: b.key as NatalPoint, lon: b.lon })),
    { key: "asc", lon: natal.asc },
    { key: "mc", lon: natal.mc },
  ];

  const later = buildHoroscope(
    new Date(current.date.getTime() + 6 * HOUR),
    current.lat,
    current.lng
  );
  const nowLons = new Map(current.bodies.map((b) => [b.key, b.lon]));
  const laterLons = new Map(
    CLASSICAL.map((p) => [p, lonOf(later, p)] as [PlanetKey, number])
  );

  const hits: TransitHit[] = [];
  for (const tr of CLASSICAL) {
    const lonNow = nowLons.get(tr)!;
    const lonLater = laterLons.get(tr)!;
    for (const tgt of targets) {
      const sep = Math.abs(angleDiff(lonNow, tgt.lon));
      const sepLater = Math.abs(angleDiff(lonLater, tgt.lon));
      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(sep - def.angle);
        if (orb > def.orb) continue;
        const orbLater = Math.abs(sepLater - def.angle);
        hits.push({
          transiting: tr,
          natalPoint: tgt.key,
          aspectKey: def.key,
          angle: def.angle,
          orb,
          applying: orbLater < orb,
          exactAt: null, // filled by exactTimesForHits (tiered by the caller)
        });
      }
    }
  }

  return hits;
}

// Moon first, then applying before separating, then tightest orb.
export function sortTransitHits(hits: TransitHit[]): TransitHit[] {
  return [...hits].sort((a, b) => {
    const rank = (h: TransitHit) =>
      (h.transiting === "moon" ? 0 : 1) * 1000 + (h.applying ? 0 : 1) * 100 + h.orb;
    return rank(a) - rank(b);
  });
}

export function sortAspectCells(cells: AspectCell[]): AspectCell[] {
  return [...cells].sort((a, b) => {
    const rank = (c: AspectCell) =>
      (c.p1 === "moon" || c.p2 === "moon" ? 0 : 1) * 1000 +
      (c.applying ? 0 : 1) * 100 +
      c.orb;
    return rank(a) - rank(b);
  });
}
