// Session Sky (SKY-001) window helpers: the sky across a user-chosen window.
// Reuses the hub ephemeris (buildHoroscope/lonOf), sunEvents and the
// traditional tables as they are. New here, per brief gaps G-1 to G-3:
//   - window state helpers (wall time in any IANA zone <-> instant),
//   - planetary days and hours across a window (spelltime.ts loop pattern),
//   - a sign / mansion change finder (15-min samples, bisect to 1 minute,
//     the same step-and-bisect as findAscSignChange),
//   - polar notes when sunrise or sunset does not exist (never invented).
// No scoring of windows or hours. Nothing here comes from election.ts.

import type { PlanetKey, SignKey } from "./constants";
import { CLASSICAL_PLANETS, SIGNS } from "./constants";
import { buildHoroscope, lonOf, tzForLocation } from "./engine";
import { wallParts, pad, type WallParts } from "./format";
import { sunEvents } from "./sun";
import { dayRuler, planetaryHours, moonMansion, type PlanetaryHour } from "./traditional";

export const MAX_WINDOW_HOURS = 48;
export const MAX_WINDOW_MS = MAX_WINDOW_HOURS * 3600000;
export const SAMPLE_STEP_MS = 15 * 60000;
export const BISECT_TO_MS = 60000;

// Seven classical planets in the usual display order.
export const SKY_PLANETS: PlanetKey[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"];

// ---------- G-1: wall time in any zone ----------

export function isValidTimeZone(tz: string): boolean {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Instant for a wall-clock time in `tz`. A DST gap resolves forward (02:30 -> 03:30); an overlap takes the first. */
export function zonedWallToDate(w: WallParts, tz: string): Date {
  const target = Date.UTC(w.year, w.month, w.day, w.hour, w.minute, w.second);
  const offsetAt = (t: number) => {
    const p = wallParts(new Date(t), tz);
    return Date.UTC(p.year, p.month, p.day, p.hour, p.minute, p.second) - Math.floor(t / 1000) * 1000;
  };
  // the two offsets in force a day either side cover any transition
  const offs = [offsetAt(target - 86400000), offsetAt(target + 86400000)];
  const hits = offs.map((o) => target - o).filter((t) => offsetAt(t) === target - t);
  if (hits.length > 0) return new Date(Math.min(...hits));
  return new Date(Math.max(...offs.map((o) => target - o))); // in a gap: the pre-gap offset moves forward
}

/** "YYYY-MM-DDTHH:mm" (datetime-local value) for an instant in `tz`. */
export function toLocalInput(date: Date, tz: string): string {
  const w = wallParts(date, tz);
  return `${w.year}-${pad(w.month + 1)}-${pad(w.day)}T${pad(w.hour)}:${pad(w.minute)}`;
}

/** Parse a datetime-local value as wall time in `tz`; null if malformed. */
export function fromLocalInput(value: string, tz: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!m || !isValidTimeZone(tz)) return null;
  const w: WallParts = { year: +m[1], month: +m[2] - 1, day: +m[3], hour: +m[4], minute: +m[5], second: +(m[6] ?? 0) };
  if (w.month > 11 || w.day < 1 || w.day > 31 || w.hour > 23 || w.minute > 59) return null;
  return zonedWallToDate(w, tz);
}

export interface WindowCheck {
  ok: boolean;
  message: string | null;
}

/** Window validation: end after start, at most 48 hours. Never scans past 48h. */
export function checkWindow(start: Date | null, end: Date | null): WindowCheck {
  if (!start || !end) return { ok: false, message: "Enter a valid start and end date and time." };
  if (end.getTime() <= start.getTime()) return { ok: false, message: "The window end must be after its start." };
  if (end.getTime() - start.getTime() > MAX_WINDOW_MS) {
    return { ok: false, message: `The window is longer than ${MAX_WINDOW_HOURS} hours. Shorten it to ${MAX_WINDOW_HOURS} hours or less.` };
  }
  return { ok: true, message: null };
}

export function clampEnd(start: Date, end: Date): Date {
  return new Date(Math.min(end.getTime(), start.getTime() + MAX_WINDOW_MS));
}

// ---------- D-1: this planetary day ----------

function civil(w: WallParts, addDays = 0): { year: number; month: number; day: number; weekdayIdx: number } {
  const d = new Date(Date.UTC(w.year, w.month, w.day + addDays));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate(), weekdayIdx: d.getUTCDay() };
}

export interface DefaultWindow {
  start: Date;
  end: Date;
  zone: string;           // the location's zone
  planetaryDay: boolean;  // false when sunrise is missing (polar) and the civil day was used
  note: string | null;
}

/**
 * D-1: sunrise to next sunrise of the planetary day containing `now`, at the
 * location, in the location's zone. Before sunrise the planetary day is still
 * the previous civil day's (as engine.ts computeChart does). In polar day or
 * night no sunrise exists, so the civil day (midnight to midnight) is used
 * with a plain note; no hours are invented.
 */
export function thisPlanetaryDay(now: Date, lat: number, lng: number): DefaultWindow {
  const zone = tzForLocation(lat, lng);
  const w = wallParts(now, zone);
  for (const add of [0, -1]) {
    const c = civil(w, add);
    const ev = sunEvents(c.year, c.month, c.day, lat, lng);
    if (!ev.sunrise || !ev.nextSunrise) break;
    if (now.getTime() >= ev.sunrise.getTime() && now.getTime() < ev.nextSunrise.getTime()) {
      return { start: ev.sunrise, end: ev.nextSunrise, zone, planetaryDay: true, note: null };
    }
  }
  const c = civil(w);
  const n = civil(w, 1);
  return {
    start: zonedWallToDate({ year: c.year, month: c.month, day: c.day, hour: 0, minute: 0, second: 0 }, zone),
    end: zonedWallToDate({ year: n.year, month: n.month, day: n.day, hour: 0, minute: 0, second: 0 }, zone),
    zone,
    planetaryDay: false,
    note: "The Sun does not both rise and set here today, so there is no planetary day; the window is set to this civil day instead.",
  };
}

// ---------- planetary days and hours across the window ----------

export interface WindowDay {
  weekdayIdx: number;
  ruler: PlanetKey;
  sunrise: Date;
  sunset: Date;
  nextSunrise: Date;
}

export interface WindowHour extends PlanetaryHour {
  weekdayIdx: number;
  clipped: boolean; // true when the hour runs past the window start or end
}

export interface WindowHours {
  days: WindowDay[];
  hours: WindowHour[];
  notes: string[];
}

const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Every planetary day and hour overlapping [start, end). Loop over civil days as in spelltime.ts. */
export function windowHours(start: Date, end: Date, lat: number, lng: number): WindowHours {
  const tz = tzForLocation(lat, lng);
  const s = start.getTime(), e = end.getTime();
  const first = wallParts(start, tz);
  const last = wallParts(end, tz);
  const span = Math.round((Date.UTC(last.year, last.month, last.day) - Date.UTC(first.year, first.month, first.day)) / 86400000);
  const days: WindowDay[] = [];
  const hours: WindowHour[] = [];
  const notes: string[] = [];
  for (let d = -1; d <= span; d++) {
    const c = civil(first, d);
    const ev = sunEvents(c.year, c.month, c.day, lat, lng);
    if (!ev.sunrise || !ev.sunset || !ev.nextSunrise) {
      const n = civil(first, d + 1);
      const mid = zonedWallToDate({ year: c.year, month: c.month, day: c.day, hour: 0, minute: 0, second: 0 }, tz).getTime();
      const nextMid = zonedWallToDate({ year: n.year, month: n.month, day: n.day, hour: 0, minute: 0, second: 0 }, tz).getTime();
      if (nextMid > s && mid < e) {
        const missing = !ev.sunrise && !ev.sunset ? "sunrise or sunset" : !ev.sunrise ? "sunrise" : !ev.sunset ? "sunset" : "next sunrise";
        notes.push(
          `No ${missing} at this place for the planetary day of ${WEEKDAY[c.weekdayIdx]} ${MONTH[c.month]} ${c.day} ${c.year} (polar day or night), so its planetary hours cannot be formed.`
        );
      }
      continue;
    }
    if (ev.nextSunrise.getTime() <= s || ev.sunrise.getTime() >= e) continue;
    days.push({ weekdayIdx: c.weekdayIdx, ruler: dayRuler(c.weekdayIdx), sunrise: ev.sunrise, sunset: ev.sunset, nextSunrise: ev.nextSunrise });
    for (const h of planetaryHours(c.weekdayIdx, ev.sunrise, ev.sunset, ev.nextSunrise)) {
      if (h.end.getTime() <= s || h.start.getTime() >= e) continue;
      hours.push({ ...h, weekdayIdx: c.weekdayIdx, clipped: h.start.getTime() < s || h.end.getTime() > e });
    }
  }
  return { days, hours, notes };
}

// ---------- G-2: sign and mansion changes inside the window ----------

export interface SignChange {
  kind: "sign";
  planet: PlanetKey;
  from: SignKey;
  to: SignKey;
  time: Date;
}

export interface MansionChange {
  kind: "mansion";
  planet: "moon";
  from: number; // 1..28
  to: number;
  time: Date;
}

export type SkyChange = SignChange | MansionChange;

type Sample = Partial<Record<PlanetKey, number>>;

function sampleLons(t: number, lat: number, lng: number): Sample {
  const h = buildHoroscope(new Date(t), lat, lng);
  const out: Partial<Record<PlanetKey, number>> = {};
  for (const p of CLASSICAL_PLANETS) out[p] = lonOf(h, p);
  return out;
}

const signIdx = (lon: number) => Math.floor(lon / 30) % 12;
const mansionIdx = (lon: number) => moonMansion(lon).index;

/**
 * Sign changes of the 7 classical planets and Moon mansion changes inside
 * [start, end]. Samples longitudes every `stepMs` (15 min), then bisects each
 * change to within 1 minute, as findAscSignChange does for the Ascendant.
 * Times are the first sampled instant found in the new sign or mansion.
 */
export function findChanges(start: Date, end: Date, lat: number, lng: number, stepMs = SAMPLE_STEP_MS): SkyChange[] {
  const s = start.getTime();
  const e = Math.min(end.getTime(), s + MAX_WINDOW_MS); // never scan past 48h
  const cache = new Map<number, Sample>();
  const at = (t: number): Sample => {
    let v = cache.get(t);
    if (!v) {
      v = sampleLons(t, lat, lng);
      cache.set(t, v);
    }
    return v;
  };
  const keys: Array<{ planet: PlanetKey; kind: "sign" | "mansion"; idx: (lon: number) => number }> = [
    ...SKY_PLANETS.map((planet) => ({ planet, kind: "sign" as const, idx: signIdx })),
    { planet: "moon", kind: "mansion", idx: mansionIdx },
  ];
  const out: SkyChange[] = [];
  let prevT = s;
  while (prevT < e) {
    const t = Math.min(prevT + stepMs, e);
    const a0 = at(prevT), b0 = at(t);
    for (const k of keys) {
      const from = k.idx(a0[k.planet]!);
      const to = k.idx(b0[k.planet]!);
      if (from === to) continue;
      let a = prevT, b = t;
      while (b - a > BISECT_TO_MS) {
        const mid = Math.round((a + b) / 2);
        if (k.idx(at(mid)[k.planet]!) === from) a = mid; else b = mid;
      }
      if (k.kind === "sign") {
        out.push({ kind: "sign", planet: k.planet, from: SIGNS[from], to: SIGNS[to], time: new Date(b) });
      } else {
        out.push({ kind: "mansion", planet: "moon", from, to, time: new Date(b) });
      }
    }
    prevT = t;
  }
  out.sort((x, y) => x.time.getTime() - y.time.getTime());
  return out;
}

// ---------- display helpers (window zone) ----------

export function fmtDayTz(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric" }).format(date);
}

export function fmtLength(ms: number): string {
  const m = Math.round(ms / 60000);
  const h = Math.floor(m / 60);
  return `${h}h ${pad(m % 60)}m`;
}
