// Chart engine: wraps the ephemeris and adds traditional calculations.
//
// IMPORTANT timezone note: circular-natal-horoscope-js interprets the wall
// time passed to Origin in the LOCATION's timezone (via tz-lookup). So we
// always convert the instant `date` into the location's wall time first.

import { Horoscope, Origin } from "circular-natal-horoscope-js";
import tzlookup from "tz-lookup";
import type { PlanetKey, SignKey } from "./constants";
import { PLANETS, SIGNS } from "./constants";
import { norm360, forwardDist, angleDiff, wallParts, tzOffsetLabel, pad, type WallParts } from "./format";
import { sunEvents, type SunEvents } from "./sun";
import {
  dayRuler, planetaryHours, currentHour, moonMansion, moonPhase,
  dignity, type PlanetaryHour, type MoonPhase, type DignityRow,
} from "./traditional";

export interface BodyInfo {
  key: PlanetKey;
  lon: number;
  sign: SignKey;
  deg: number;   // degrees within sign
  min: number;   // minutes within sign
  house: number; // 1..12
  retro: boolean;
  speed: number; // deg/day in longitude (signed)
}

export interface MoonAspectInfo {
  other: PlanetKey;
  aspectKey: string;
  orb: number;
  applying: boolean;
}

export interface NearestPhase {
  target: 0 | 90 | 180 | 270;
  label: string;
  date: Date;
}

export interface AspectCell {
  p1: PlanetKey;
  p2: PlanetKey;
  aspectKey: string; // "conjunction" | "sextile" | "square" | "trine" | "opposition"
  angle: number;     // 0 | 60 | 90 | 120 | 180
  orb: number;
  applying: boolean;
}

export interface ChartData {
  date: Date;
  lat: number;
  lng: number;
  tzName: string;
  tzLabel: string;      // e.g. "UTC+1"
  wallClock: string;    // "HH:MM:SS" at the location
  wallDateStr: string;  // e.g. "Wednesday, Jul 29 2026"
  weekdayIdx: number;   // civil weekday at the location (0=Sunday)
  bodies: BodyInfo[];
  cusps: number[];       // 12 ecliptic longitudes, index 0 = cusp 1
  asc: number;
  mc: number;
  sect: "day" | "night";
  dignities: DignityRow[];
  moonAspects: MoonAspectInfo[];
  aspectsGrid: AspectCell[];
  sunEv: SunEvents;
  hours: PlanetaryHour[];
  curHour: PlanetaryHour | null;
  nextHour: PlanetaryHour | null;
  rulerOfDay: PlanetKey;
  hourOfDay: { n: number; isDay: boolean } | null;
  mansion: ReturnType<typeof moonMansion>;
  phase: MoonPhase;
  nearestPhases: NearestPhase[];
}

// ---- timezone lookup (cached) ----
const tzCache = new Map<string, string>();
export function tzForLocation(lat: number, lng: number): string {
  const key = `${lat.toFixed(3)}|${lng.toFixed(3)}`;
  let tz = tzCache.get(key);
  if (!tz) {
    try {
      tz = tzlookup(lat, lng);
    } catch {
      tz = "UTC";
    }
    tzCache.set(key, tz);
    if (tzCache.size > 200) tzCache.clear();
  }
  return tz;
}

export function buildHoroscope(date: Date, lat: number, lng: number): Horoscope {
  const tz = tzForLocation(lat, lng);
  const w: WallParts = wallParts(date, tz);
  const origin = new Origin({
    year: w.year,
    month: w.month,
    date: w.day,
    hour: w.hour,
    minute: w.minute,
    second: w.second + date.getMilliseconds() / 1000,
    latitude: lat,
    longitude: lng,
  });
  return new Horoscope({
    origin,
    houseSystem: "regiomontanus",
    zodiac: "tropical",
    language: "en",
  });
}

export function lonOf(h: Horoscope, key: string): number {
  return norm360(h.CelestialBodies[key].ChartPosition.Ecliptic.DecimalDegrees);
}

export function ascAt(date: Date, lat: number, lng: number): number {
  const h = buildHoroscope(date, lat, lng);
  return norm360(h.Ascendant.ChartPosition.Ecliptic.DecimalDegrees);
}

// Find the next (dir=1) or previous (dir=-1) moment the Ascendant changes
// sign. Returns a time ~45s inside the new sign so repeated presses move on.
export function findAscSignChange(from: Date, dir: 1 | -1, lat: number, lng: number): Date | null {
  const signIdx = (ms: number) => Math.floor(ascAt(new Date(ms), lat, lng) / 30);
  const startIdx = signIdx(from.getTime());
  const step = 5 * 60000 * dir;
  let prev = from.getTime();
  for (let i = 0; i < 288; i++) { // up to 24h away
    const t = prev + step;
    if (signIdx(t) !== startIdx) {
      let a = prev, b = t; // a is in the old sign, b in the new one
      while (Math.abs(b - a) > 30000) {
        const mid = (a + b) / 2;
        if (signIdx(mid) === startIdx) a = mid; else b = mid;
      }
      return new Date(b + dir * 45000);
    }
    prev = t;
  }
  return null;
}

export function houseOf(lon: number, cusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    if (forwardDist(start, lon) < forwardDist(start, end)) return i + 1;
  }
  return 12;
}

// ---- lunar phase event finder (elongation target via bracket + bisect) ----

function elongAt(date: Date, lat: number, lng: number): number {
  const h = buildHoroscope(date, lat, lng);
  return norm360(lonOf(h, "moon") - lonOf(h, "sun"));
}

function findPhase(from: Date, target: number, dir: 1 | -1, lat: number, lng: number): Date | null {
  // Track unwrapped elongation so the 0/360 wrap never fakes a crossing.
  const step = 12 * 3600000 * dir;
  let prevT = from.getTime();
  let prevU = elongAt(from, lat, lng);
  for (let i = 0; i < 65; i++) {
    const t = prevT + step;
    const u = prevU + angleDiff(elongAt(new Date(t), lat, lng), prevU);
    // does unwrapped elongation cross target + k*360 in this bracket?
    const loU = Math.min(prevU, u), hiU = Math.max(prevU, u);
    const k = Math.floor((hiU - target) / 360);
    const goal = target + 360 * k;
    if (goal >= loU && goal <= hiU) {
      // bisect with locally-continuous signed distance to the goal
      let lo = prevT, hi = t;
      let flo = angleDiff(elongAt(new Date(lo), lat, lng), goal);
      for (let j = 0; j < 24; j++) {
        const mid = (lo + hi) / 2;
        const fm = angleDiff(elongAt(new Date(mid), lat, lng), goal);
        if ((flo < 0 && fm < 0) || (flo > 0 && fm > 0)) {
          lo = mid; flo = fm;
        } else {
          hi = mid;
        }
      }
      return new Date((lo + hi) / 2);
    }
    prevT = t; prevU = u;
  }
  return null;
}

const PHASE_DEFS: Array<{ target: 0 | 90 | 180 | 270; label: string }> = [
  { target: 0, label: "New" },
  { target: 90, label: "1st Q" },
  { target: 180, label: "Full" },
  { target: 270, label: "3rd Q" },
];

// simple caches: phases move slowly, sun events are per civil day
const phaseCache = new Map<string, NearestPhase[]>();
const sunCache = new Map<string, SunEvents>();

function getSunEvents(w: WallParts, lat: number, lng: number): SunEvents {
  const key = `${w.year}-${w.month}-${w.day}|${lat.toFixed(3)}|${lng.toFixed(3)}`;
  let v = sunCache.get(key);
  if (!v) {
    v = sunEvents(w.year, w.month, w.day, lat, lng);
    sunCache.set(key, v);
    if (sunCache.size > 60) sunCache.clear();
  }
  return v;
}

function getNearestPhases(date: Date, lat: number, lng: number): NearestPhase[] {
  const bucket = Math.floor(date.getTime() / (60 * 60000));
  const key = `${bucket}|${lat.toFixed(3)}|${lng.toFixed(3)}`;
  let v = phaseCache.get(key);
  if (!v) {
    const out: NearestPhase[] = [];
    for (const def of PHASE_DEFS) {
      const prev = findPhase(date, def.target, -1, lat, lng);
      const next = findPhase(date, def.target, 1, lat, lng);
      if (prev) out.push({ ...def, date: prev });
      if (next) out.push({ ...def, date: next });
    }
    out.sort((a, b) => a.date.getTime() - b.date.getTime());
    v = out;
    phaseCache.set(key, v);
    if (phaseCache.size > 30) phaseCache.clear();
  }
  return v;
}

// ---- main ----

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function computeChart(date: Date, lat: number, lng: number): ChartData {
  const tz = tzForLocation(lat, lng);
  const w = wallParts(date, tz);
  const weekdayIdx = new Date(Date.UTC(w.year, w.month, w.day)).getUTCDay();

  const h = buildHoroscope(date, lat, lng);
  const cusps = h.Houses.map((c) => norm360(c.ChartPosition.StartPosition.Ecliptic.DecimalDegrees));
  const asc = norm360(h.Ascendant.ChartPosition.Ecliptic.DecimalDegrees);
  const mc = norm360(h.Midheaven.ChartPosition.Ecliptic.DecimalDegrees);

  // speeds via 6h delta
  const hLater = buildHoroscope(new Date(date.getTime() + 6 * 3600000), lat, lng);

  const bodies: BodyInfo[] = PLANETS.map((key) => {
    const lon = lonOf(h, key);
    const lonLater = lonOf(hLater, key);
    const speed = angleDiff(lonLater, lon) * 4; // deg/day, signed
    const signIdx = Math.floor(lon / 30);
    const dis = lon % 30;
    return {
      key,
      lon,
      sign: SIGNS[signIdx],
      deg: Math.floor(dis),
      min: Math.floor((dis - Math.floor(dis)) * 60 + 1e-9),
      house: houseOf(lon, cusps),
      retro: h.CelestialBodies[key].isRetrograde ?? speed < 0,
      speed,
    };
  });

  const sun = bodies.find((b) => b.key === "sun")!;
  const moon = bodies.find((b) => b.key === "moon")!;
  const sect: "day" | "night" = sun.house >= 7 ? "day" : "night";

  const dignities = bodies
    .map((b) => dignity(b.key, b.lon, sect === "day"))
    .filter((d): d is DignityRow => d !== null)
    .sort((a, b) => {
      const order = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"];
      return order.indexOf(a.planet) - order.indexOf(b.planet);
    });

  // Moon aspects: major aspects involving the Moon, with applying/separating
  const moonAspects: MoonAspectInfo[] = [];
  for (const a of h.Aspects.all) {
    if (a.point1Key !== "moon" && a.point2Key !== "moon") continue;
    const otherKey = (a.point1Key === "moon" ? a.point2Key : a.point1Key) as PlanetKey;
    if (!PLANETS.includes(otherKey)) continue;
    moonAspects.push({ other: otherKey, aspectKey: a.aspectKey, orb: a.orb, applying: true });
  }
  // determine applying: recompute orbs 6h later
  for (const ma of moonAspects) {
    const later = hLater.Aspects.all.find(
      (a) =>
        (a.point1Key === "moon" && a.point2Key === ma.other) ||
        (a.point2Key === "moon" && a.point1Key === ma.other)
    );
    const laterSame = later && later.aspectKey === ma.aspectKey ? later.orb : 99;
    ma.applying = laterSame < ma.orb;
  }

  // Full aspectarian: every planet pair, major aspects with traditional orbs
  const ASPECT_DEFS: Array<{ angle: number; key: string; orb: number }> = [
    { angle: 0, key: "conjunction", orb: 8 },
    { angle: 60, key: "sextile", orb: 5 },
    { angle: 90, key: "square", orb: 6 },
    { angle: 120, key: "trine", orb: 7 },
    { angle: 180, key: "opposition", orb: 8 },
  ];
  const aspectsGrid: AspectCell[] = [];
  const lonNow = new Map(bodies.map((b) => [b.key, b.lon]));
  const lonLater = new Map(PLANETS.map((p) => [p, lonOf(hLater, p)] as [PlanetKey, number]));
  for (let i = 0; i < PLANETS.length; i++) {
    for (let j = i + 1; j < PLANETS.length; j++) {
      const p1 = PLANETS[i], p2 = PLANETS[j];
      const sep = Math.abs(angleDiff(lonNow.get(p1)!, lonNow.get(p2)!));
      let bestDef: (typeof ASPECT_DEFS)[number] | null = null;
      let bestOrb = 99;
      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(sep - def.angle);
        if (orb <= def.orb && orb < bestOrb) {
          bestDef = def;
          bestOrb = orb;
        }
      }
      if (!bestDef) continue;
      const sepLater = Math.abs(angleDiff(lonLater.get(p1)!, lonLater.get(p2)!));
      const orbLater = Math.abs(sepLater - bestDef.angle);
      aspectsGrid.push({
        p1, p2,
        aspectKey: bestDef.key,
        angle: bestDef.angle,
        orb: bestOrb,
        applying: orbLater < bestOrb,
      });
    }
  }

  let sunEv = getSunEvents(w, lat, lng);
  // before sunrise the planetary day is still the previous civil day's
  let hoursWeekday = weekdayIdx;
  if (sunEv.sunrise && date.getTime() < sunEv.sunrise.getTime()) {
    const pd = new Date(Date.UTC(w.year, w.month, w.day) - 86400000);
    sunEv = getSunEvents(
      { year: pd.getUTCFullYear(), month: pd.getUTCMonth(), day: pd.getUTCDate(), hour: 0, minute: 0, second: 0 },
      lat, lng
    );
    hoursWeekday = pd.getUTCDay();
  }
  let hours: PlanetaryHour[] = [];
  let curHour: PlanetaryHour | null = null;
  let nextHour: PlanetaryHour | null = null;
  let hourOfDay: ChartData["hourOfDay"] = null;
  if (sunEv.sunrise && sunEv.sunset && sunEv.nextSunrise) {
    hours = planetaryHours(hoursWeekday, sunEv.sunrise, sunEv.sunset, sunEv.nextSunrise);
    curHour = currentHour(hours, date);
    nextHour = curHour ? hours[curHour.index] ?? null : null;
    if (curHour) hourOfDay = { n: curHour.index, isDay: curHour.isDay };
  }

  return {
    date, lat, lng,
    tzName: tz,
    tzLabel: tzOffsetLabel(date, tz),
    wallClock: `${pad(w.hour)}:${pad(w.minute)}:${pad(w.second)}`,
    wallDateStr: `${WEEKDAYS[weekdayIdx]}, ${MONTHS[w.month]} ${w.day} ${w.year}`,
    weekdayIdx,
    bodies, cusps, asc, mc, sect, dignities,
    moonAspects, aspectsGrid,
    sunEv, hours, curHour, nextHour,
    rulerOfDay: dayRuler(hoursWeekday),
    hourOfDay,
    mansion: moonMansion(moon.lon),
    phase: moonPhase(sun.lon, moon.lon),
    nearestPhases: getNearestPhases(date, lat, lng),
  };
}
