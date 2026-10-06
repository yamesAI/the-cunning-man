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

// One shared horizon cache per transitsToNatal call: grid points align across
// hits of the same planet, so each planet's grid is built once.
type LonCache = Map<string, number>;

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

const CLASSICAL = PLANETS.slice(0, 7); // sun..saturn

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
          exactAt: null,
        });
      }
    }
  }

  const cache: LonCache = new Map();
  const lonAt = (planet: PlanetKey, tMs: number): number => {
    const key = `${planet}|${Math.round(tMs)}`;
    let v = cache.get(key);
    if (v === undefined) {
      v = lonOf(buildHoroscope(new Date(tMs), current.lat, current.lng), planet);
      cache.set(key, v);
    }
    return v;
  };

  for (const h of hits) {
    const tgt = targets.find((t) => t.key === h.natalPoint)!;
    const windowMs = EXACT_WINDOW_MS[h.transiting] ?? 30 * DAY;
    const dir: 1 | -1 = h.applying ? 1 : -1;
    const f = (tMs: number) =>
      Math.abs(Math.abs(angleDiff(lonAt(h.transiting, tMs), tgt.lon)) - h.angle);
    h.exactAt = scanForMinimum(f, current.date.getTime(), dir, windowMs);
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
