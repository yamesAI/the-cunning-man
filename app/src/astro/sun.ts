// Sunrise / sunset calculation (Almanac for Computers 1990, zenith 90.833°).
// Accurate to ~1-2 minutes, plenty for planetary hours.
// Takes the civil date explicitly (year, 0-indexed month, day) as observed
// at the location, so results are independent of the system timezone.
//
// The raw Almanac UT can fall outside [0, 24). Wrapping it into that range
// and attaching it to Date.UTC of the requested civil Y-M-D puts the event
// on the wrong local day at most longitudes away from Greenwich (QC-SKY-001
// H-1). We leave UT unwrapped and keep the event whose wall date in the
// location's zone equals the requested civil date, from this day's calc or
// an unshifted neighbour calc (delta -1/0/+1). A ±24/48 h shift is applied
// only to this day's calc, and only in a chain anchored by a self-landing
// calc with no polar null in between (year-boundary UT attachment). After
// a polar null, a shift would copy a time onto a transition date.

import tzlookup from "tz-lookup";
import { wallParts } from "./format";

const ZENITH = 90.833;

function tzFor(lat: number, lng: number): string {
  try {
    return tzlookup(lat, lng);
  } catch {
    return "UTC";
  }
}

function addCivilDays(year: number, month0: number, day: number, delta: number): { year: number; month: number; day: number } {
  const d = new Date(Date.UTC(year, month0, day + delta));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate() };
}

function onCivilDate(date: Date, year: number, month0: number, day: number, tz: string): boolean {
  const w = wallParts(date, tz);
  return w.year === year && w.month === month0 && w.day === day;
}

function calc(year: number, month0: number, day: number, lat: number, lng: number, rising: boolean): Date | null {
  const dayOfYear = Math.floor(
    (Date.UTC(year, month0, day) - Date.UTC(year, 0, 0)) / 86400000
  );
  const lngHour = lng / 15;
  const t = dayOfYear + ((rising ? 6 : 18) - lngHour) / 24;

  const M = 0.9856 * t - 3.289; // Sun's mean anomaly
  let L =
    M + 1.916 * Math.sin((M * Math.PI) / 180) + 0.02 * Math.sin((2 * M * Math.PI) / 180) + 282.634;
  L = ((L % 360) + 360) % 360; // Sun's true longitude

  let RA = (Math.atan(0.91764 * Math.tan((L * Math.PI) / 180)) * 180) / Math.PI;
  RA = ((RA % 360) + 360) % 360;
  const Lquadrant = Math.floor(L / 90) * 90;
  const RAquadrant = Math.floor(RA / 90) * 90;
  RA = RA + (Lquadrant - RAquadrant);
  RA /= 15;

  const sinDec = 0.39782 * Math.sin((L * Math.PI) / 180);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH =
    (Math.cos((ZENITH * Math.PI) / 180) - sinDec * Math.sin((lat * Math.PI) / 180)) /
    (cosDec * Math.cos((lat * Math.PI) / 180));
  if (cosH > 1 || cosH < -1) return null; // polar day/night

  let H = rising
    ? 360 - (Math.acos(cosH) * 180) / Math.PI
    : (Math.acos(cosH) * 180) / Math.PI;
  H /= 15;

  const T = H + RA - 0.06571 * t - 6.622;
  const UT = T - lngHour;
  // Leave UT unwrapped: Date.UTC + UT hours already lands on the correct UTC day.
  return new Date(Date.UTC(year, month0, day) + UT * 3600000);
}

const WALK_LIMIT = 400;

function cacheKey(year: number, month0: number, day: number, lat: number, lng: number, rising: boolean): string {
  return `${year}-${month0}-${day}:${lat}:${lng}:${rising ? "r" : "s"}`;
}

const calcCache = new Map<string, Date | null>();
function cachedCalc(year: number, month0: number, day: number, lat: number, lng: number, rising: boolean): Date | null {
  const key = cacheKey(year, month0, day, lat, lng, rising);
  if (calcCache.has(key)) return calcCache.get(key)!;
  const ev = calc(year, month0, day, lat, lng, rising);
  calcCache.set(key, ev);
  return ev;
}

const landingCache = new Map<string, boolean>();

/** Follow unshifted landings from this date until a self-landing or a polar null. */
function landingsReachSelf(
  year: number,
  month0: number,
  day: number,
  lat: number,
  lng: number,
  rising: boolean,
  tz: string,
): boolean {
  const startKey = cacheKey(year, month0, day, lat, lng, rising);
  const hit = landingCache.get(startKey);
  if (hit !== undefined) return hit;
  let y = year, m = month0, d = day;
  const path: string[] = [];
  let result = false;
  for (let i = 0; i < WALK_LIMIT; i++) {
    const key = cacheKey(y, m, d, lat, lng, rising);
    if (path.includes(key)) { result = false; break; }
    const cached = landingCache.get(key);
    if (cached !== undefined) { result = cached; break; }
    path.push(key);
    const ev = cachedCalc(y, m, d, lat, lng, rising);
    if (!ev) { result = false; break; }
    if (onCivilDate(ev, y, m, d, tz)) { result = true; break; }
    const landed = wallParts(ev, tz);
    y = landed.year;
    m = landed.month;
    d = landed.day;
    if (i === WALK_LIMIT - 1) result = false;
  }
  for (const key of path) landingCache.set(key, result);
  return result;
}

/**
 * Walk civil dates from `year-month0-day` in the direction opposite the
 * unshifted landing, until a self-landing (true) or a polar null (false).
 */
function oppositeReachSelf(
  year: number,
  month0: number,
  day: number,
  landedYear: number,
  landedMonth0: number,
  landedDay: number,
  lat: number,
  lng: number,
  rising: boolean,
  tz: string,
): boolean {
  const step = Date.UTC(landedYear, landedMonth0, landedDay) >= Date.UTC(year, month0, day) ? -1 : 1;
  let y = year, m = month0, d = day;
  for (let i = 0; i < WALK_LIMIT; i++) {
    const n = addCivilDays(y, m, d, step);
    y = n.year;
    m = n.month;
    d = n.day;
    const ev = cachedCalc(y, m, d, lat, lng, rising);
    if (!ev) return false;
    if (onCivilDate(ev, y, m, d, tz)) return true;
  }
  return false;
}

/** True when a ±24/48 h shift of this day's calc will not invent a 24 h copy. */
function canShiftSameDay(
  year: number,
  month0: number,
  day: number,
  ev: Date,
  lat: number,
  lng: number,
  rising: boolean,
  tz: string,
): boolean {
  const landed = wallParts(ev, tz);
  // Allow the shift only in a chain anchored by a self-landing calc on both
  // sides, with no polar null in between (year-boundary UT attachment). After
  // a polar null, a shift copies a neighbouring day's time onto a transition date.
  return (
    landingsReachSelf(year, month0, day, lat, lng, rising, tz) &&
    oppositeReachSelf(year, month0, day, landed.year, landed.month, landed.day, lat, lng, rising, tz)
  );
}

/** The Almanac event whose wall date in `tz` is the requested civil date, or null. */
function eventOnCivilDate(
  year: number,
  month0: number,
  day: number,
  lat: number,
  lng: number,
  rising: boolean,
  tz: string,
): Date | null {
  const same = cachedCalc(year, month0, day, lat, lng, rising);
  if (same && onCivilDate(same, year, month0, day, tz)) return same;
  let neighbour: Date | null = null;
  for (const delta of [-1, 1]) {
    const d = addCivilDays(year, month0, day, delta);
    const ev = cachedCalc(d.year, d.month, d.day, lat, lng, rising);
    if (ev && onCivilDate(ev, year, month0, day, tz)) {
      neighbour = ev;
      break;
    }
  }
  // Same-day ±24/48 h only, and only when the shift is not a copy of another
  // day's event. Prefer that shift over a neighbour so year-boundary days
  // each keep their own slightly different time.
  if (same && canShiftSameDay(year, month0, day, same, lat, lng, rising, tz)) {
    for (const shiftH of [-24, 24, -48, 48]) {
      const cand = new Date(same.getTime() + shiftH * 3600000);
      if (onCivilDate(cand, year, month0, day, tz)) return cand;
    }
  }
  return neighbour;
}

export interface SunEvents {
  sunrise: Date | null;
  sunset: Date | null;
  nextSunrise: Date | null; // sunrise of the following civil date at the location
}

export function sunEvents(year: number, month0: number, day: number, lat: number, lng: number): SunEvents {
  const tz = tzFor(lat, lng);
  const next = addCivilDays(year, month0, day, 1);
  return {
    sunrise: eventOnCivilDate(year, month0, day, lat, lng, true, tz),
    sunset: eventOnCivilDate(year, month0, day, lat, lng, false, tz),
    nextSunrise: eventOnCivilDate(next.year, next.month, next.day, lat, lng, true, tz),
  };
}
