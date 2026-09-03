// Electional scanner for day-trading entries (traditional electional astrology).
// Scores candidate moments over the next 72 hours using Moon condition,
// angularity of benefics/trade significators, and Ascendant ruler dignity.
// This is traditional astrology, not financial advice.

import type { Horoscope } from "circular-natal-horoscope-js";
import type { PlanetKey, SignKey } from "./constants";
import { PLANETS, SIGNS, PLANET_LABEL } from "./constants";
import { norm360, angleDiff } from "./format";
import { buildHoroscope, houseOf, lonOf } from "./engine";
import { dignity, RULER } from "./traditional";

export interface ElectionFactor {
  label: string;
  pts: number;
}

export interface ElectionResult {
  date: Date;
  score: number;
  factors: ElectionFactor[];
  moonAspect: { other: PlanetKey; angle: number; inHours: number } | null;
  voc: boolean;
  blockedReasons: string[];
}

export interface BlockedPeriod {
  start: Date;
  end: Date;
  reasons: string[];
}

export interface ElectionScan {
  best: ElectionResult;
  alternates: Array<{ date: Date; score: number }>;
  blocked: BlockedPeriod[];
}

// ---- Moon's next perfecting Ptolemaic aspect before leaving its sign ----

const PTOLEMAIC = [0, 60, 90, 120, 180];
const ASPECT_NAME: Record<number, string> = {
  0: "conjunction", 60: "sextile", 90: "square", 120: "trine", 180: "opposition",
};
export const aspectName = (a: number): string => ASPECT_NAME[a] ?? `${a}°`;

interface MovingBody {
  key: PlanetKey;
  lon: number;
  spd: number; // deg/day
}

function moonNextAspect(
  moon: MovingBody,
  others: MovingBody[],
  maxDeg: number
): { other: PlanetKey; angle: number; x: number } | null {
  let best: { other: PlanetKey; angle: number; x: number } | null = null;
  const STEP = 0.25;
  for (const p of others) {
    const ratio = p.spd / moon.spd;
    let prevX = 0;
    let prevG = angleDiff(moon.lon, p.lon); // signed separation
    for (let x = STEP; x <= maxDeg + 1e-9; x += STEP) {
      const g = prevG + angleDiff(
        angleDiff(moon.lon + x, p.lon + ratio * x),
        prevG
      );
      // crossing of any aspect angle between prevG and g?
      const lo = Math.min(prevG, g), hi = Math.max(prevG, g);
      for (const a of PTOLEMAIC) {
        for (let k = -1; k <= 1; k++) {
          const goal = a + 360 * k;
          if (goal > lo && goal <= hi) {
            if (!best || x < best.x) best = { other: p.key, angle: a, x };
          }
        }
      }
      prevG = g;
      prevX = x;
    }
    void prevX;
  }
  return best;
}

// ---- scoring ----

function aspectPts(planet: PlanetKey, angle: number): { label: string; pts: number } {
  const name = aspectName(angle);
  // soft aspects to benefics/trade planets are strong; hard aspects to them are not election-grade
  const TABLE: Partial<Record<PlanetKey, Record<number, number>>> = {
    jupiter: { 0: 7, 120: 7, 60: 5, 90: -1, 180: -2 },
    venus: { 0: 6, 120: 6, 60: 4, 90: -1, 180: -2 },
    mercury: { 0: 4, 120: 4, 60: 3, 90: 0, 180: -1 },
    sun: { 0: 0, 120: 3, 60: 2, 90: -1, 180: -1 },
    saturn: { 0: -7, 90: -7, 180: -7, 120: -1, 60: -1 },
    mars: { 0: -7, 90: -7, 180: -7, 120: -1, 60: -1 },
  };
  const pts = TABLE[planet]?.[angle] ?? 0;
  const tag = planet === "mercury" ? " (trade)" : "";
  return { label: `Moon applying ${name} ${PLANET_LABEL[planet]}${tag}`, pts };
}

interface Snap {
  t: number;
  h: Horoscope;
}

function scoreSnap(
  s: Snap,
  speeds: Map<PlanetKey, number>
): ElectionResult {
  const h = s.h;
  const cusps = h.Houses.map((c) => norm360(c.ChartPosition.StartPosition.Ecliptic.DecimalDegrees));
  const asc = norm360(h.Ascendant.ChartPosition.Ecliptic.DecimalDegrees);
  const lons = new Map<PlanetKey, number>();
  const houses = new Map<PlanetKey, number>();
  for (const p of PLANETS) {
    const lon = lonOf(h, p);
    lons.set(p, lon);
    houses.set(p, houseOf(lon, cusps));
  }
  const moonLon = lons.get("moon")!;
  const sunLon = lons.get("sun")!;
  const moonSpd = speeds.get("moon") ?? 13;

  const factors: ElectionFactor[] = [];
  const add = (label: string, pts: number) => {
    if (pts !== 0) factors.push({ label, pts });
  };

  // Moon next aspect / void of course
  const degLeft = 30 - (moonLon % 30);
  const moving: MovingBody[] = PLANETS.filter((p) => p !== "moon").map((p) => ({
    key: p,
    lon: lons.get(p)!,
    spd: speeds.get(p) ?? 0,
  }));
  const next = moonNextAspect({ key: "moon", lon: moonLon, spd: moonSpd }, moving, degLeft);
  const voc = !next;
  if (next) {
    const { label, pts } = aspectPts(next.other, next.angle);
    add(label, pts);
  } else {
    add("Moon void of course", -8);
  }

  // Moon condition
  const viaCombusta = moonLon >= 195 && moonLon <= 225;
  const combust = Math.abs(angleDiff(moonLon, sunLon)) <= 8.5;
  const hardMalefic =
    next !== null &&
    (next.other === "saturn" || next.other === "mars") &&
    (next.angle === 0 || next.angle === 90 || next.angle === 180);
  if (viaCombusta) add("Moon in via combusta", -5);
  if (combust) add("Moon combust", -6);
  if (moonSpd > 13.17) add("Moon swift", 2);
  else if (moonSpd < 12) add("Moon slow", -2);
  const elong = norm360(moonLon - sunLon);
  if (elong < 180) add("Moon waxing", 1);
  const moonSign = SIGNS[Math.floor(moonLon / 30)];
  if (moonSign === "taurus" || moonSign === "cancer") add("Moon in dignity", 2);
  if (moonSign === "capricorn" || moonSign === "scorpio") add("Moon in debility", -2);
  if (houses.get("moon") === 1 || houses.get("moon") === 10) add("Moon angular", 2);

  // Angularity (1st & 10th houses)
  const ang = (p: PlanetKey) => houses.get(p) === 1 || houses.get(p) === 10;
  if (ang("jupiter")) add("Jupiter angular (1st/10th)", 5);
  if (ang("venus")) add("Venus angular (1st/10th)", 5);
  if (ang("mercury")) add("Mercury angular (trade)", 3);
  if (ang("saturn")) add("Saturn angular", -4);
  if (ang("mars")) add("Mars angular", -4);

  // Ascendant ruler
  const ascSign: SignKey = SIGNS[Math.floor(asc / 30)];
  const ruler = RULER[ascSign];
  if (ruler === "jupiter" || ruler === "venus") add(`${PLANET_LABEL[ruler]} rules Ascendant`, 2);
  if (ruler === "mercury") add("Mercury rules Ascendant", 1);
  const isDay = houses.get("sun")! >= 7;
  const rd = dignity(ruler, lons.get(ruler)!, isDay);
  if (rd) {
    if (rd.score >= 4) add(`Asc ruler ${PLANET_LABEL[ruler]} strongly dignified`, 3);
    else if (rd.score > 0) add(`Asc ruler ${PLANET_LABEL[ruler]} dignified`, 1);
    else if (rd.score < 0) add(`Asc ruler ${PLANET_LABEL[ruler]} debilitated`, -2);
  }

  factors.sort((a, b) => Math.abs(b.pts) - Math.abs(a.pts));
  const score = factors.reduce((s, f) => s + f.pts, 0);

  const blockedReasons: string[] = [];
  if (voc) blockedReasons.push("Moon void of course");
  if (viaCombusta) blockedReasons.push("Moon in via combusta");
  if (combust) blockedReasons.push("Moon combust");
  if (hardMalefic && next) {
    blockedReasons.push(`Moon applying ${aspectName(next.angle)} ${PLANET_LABEL[next.other]}`);
  }
  if (score <= -6 && !blockedReasons.length) blockedReasons.push("Very low election score");

  return {
    date: new Date(s.t),
    score,
    factors,
    moonAspect: next
      ? { other: next.other, angle: next.angle, inHours: (next.x / moonSpd) * 24 }
      : null,
    voc,
    blockedReasons,
  };
}

// ---- scan ----

const MIN = 60000;

function speedsAt(snaps: Snap[], i: number, stepMs: number): Map<PlanetKey, number> {
  const prev = snaps[Math.max(0, i - 1)];
  const next = snaps[Math.min(snaps.length - 1, i + 1)];
  const dtDays = ((next.t - prev.t) || stepMs) / 86400000;
  const m = new Map<PlanetKey, number>();
  for (const p of PLANETS) {
    m.set(p, angleDiff(lonOf(next.h, p), lonOf(prev.h, p)) / dtDays);
  }
  return m;
}

// Trading session: 06:00–15:00 in fixed UTC-5, independent of chart location.
function inSession(t: number): boolean {
  const h = (((t / 3600000) - 5) % 24 + 24) % 24;
  return h >= 6 && h < 15;
}

export interface ScanOptions {
  hours?: number;        // horizon, default 72
  sessionOnly?: boolean; // restrict to 6a–3p UTC-5 trading session, default true
}

export function scanElections(now: Date, lat: number, lng: number, opts: ScanOptions = {}): ElectionScan {
  const { hours = 72, sessionOnly = true } = opts;
  const STEP = 30 * MIN;
  const start = Math.ceil(now.getTime() / MIN) * MIN;
  const end = start + hours * 3600000;

  // coarse pass: every 30 min (all points kept — needed for speed derivatives
  // and for mapping blocked periods)
  const coarse: Snap[] = [];
  for (let t = start; t <= end; t += STEP) {
    coarse.push({ t, h: buildHoroscope(new Date(t), lat, lng) });
  }
  const coarseScored = coarse.map((s, i) => ({
    s,
    r: scoreSnap(s, speedsAt(coarse, i, STEP)),
  }));
  const sessionScored = sessionOnly ? coarseScored.filter((c) => inSession(c.s.t)) : coarseScored;
  const pool = sessionScored.length ? sessionScored : coarseScored;
  const bestCoarse = pool.reduce((bc, c) => (c.r.score > bc.r.score ? c : bc));
  const t0 = bestCoarse.s.t;

  // refine: 5-min steps within +/-30 min (session-filtered when possible)
  const fine: Snap[] = [];
  for (let t = t0 - STEP; t <= t0 + STEP; t += 5 * MIN) {
    fine.push({ t, h: buildHoroscope(new Date(t), lat, lng) });
  }
  const fineScored = fine.map((s, i) => ({
    s,
    r: scoreSnap(s, speedsAt(fine, i, 5 * MIN)),
  }));
  const fineSession = sessionOnly ? fineScored.filter((c) => inSession(c.s.t)) : fineScored;
  const finePool = fineSession.length ? fineSession : fineScored;
  const bestFine = finePool.reduce((bc, c) => (c.r.score > bc.r.score ? c : bc));
  const t1 = bestFine.s.t;

  // refine: 1-min steps within +/-5 min (session-filtered when possible)
  const finer: Snap[] = [];
  for (let t = t1 - 5 * MIN; t <= t1 + 5 * MIN; t += MIN) {
    finer.push({ t, h: buildHoroscope(new Date(t), lat, lng) });
  }
  const finerScored = finer.map((s, i) => ({
    s,
    r: scoreSnap(s, speedsAt(finer, i, MIN)),
  }));
  const finerSession = sessionOnly ? finerScored.filter((c) => inSession(c.s.t)) : finerScored;
  const finerPool = finerSession.length ? finerSession : finerScored;
  const best = finerPool.reduce((bc, c) => (c.r.score > bc.r.score ? c : bc)).r;

  // alternates: next-best session coarse peaks at least 6h apart
  const alternates: Array<{ date: Date; score: number }> = [];
  const sorted = [...pool].sort((a, b) => b.r.score - a.r.score);
  for (const c of sorted) {
    if (Math.abs(c.s.t - best.date.getTime()) < 6 * 3600000) continue;
    if (alternates.some((a) => Math.abs(a.date.getTime() - c.s.t) < 6 * 3600000)) continue;
    alternates.push({ date: new Date(c.s.t), score: c.r.score });
    if (alternates.length >= 3) break;
  }

  // blocked periods: consecutive session points with hard blockers
  const blocked: BlockedPeriod[] = [];
  let cur: BlockedPeriod | null = null;
  const reasons = new Set<string>();
  for (const c of coarseScored) {
    const flagged = (!sessionOnly || inSession(c.s.t)) && c.r.blockedReasons.length > 0;
    if (flagged) {
      c.r.blockedReasons.forEach((r) => reasons.add(r));
      if (cur) {
        cur.end = new Date(c.s.t + STEP);
      } else {
        cur = { start: new Date(c.s.t), end: new Date(c.s.t + STEP), reasons: [] };
      }
    } else if (cur) {
      cur.reasons = [...reasons];
      blocked.push(cur);
      cur = null;
      reasons.clear();
    }
  }
  if (cur) {
    cur.reasons = [...reasons];
    blocked.push(cur);
  }
  const nowMs = now.getTime();
  blocked.sort((a, b) => {
    const aNow = a.start.getTime() <= nowMs && nowMs <= a.end.getTime();
    const bNow = b.start.getTime() <= nowMs && nowMs <= b.end.getTime();
    if (aNow !== bNow) return aNow ? -1 : 1;
    return a.start.getTime() - b.start.getTime();
  });

  return { best, alternates, blocked: blocked.slice(0, 6) };
}
