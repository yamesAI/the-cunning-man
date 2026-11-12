// Sunrise / sunset calculation (Almanac for Computers 1990, zenith 90.833°).
// Accurate to ~1-2 minutes, plenty for planetary hours.
// Takes the civil date explicitly (year, 0-indexed month, day) as observed
// at the location, so results are independent of the system timezone.
//
// The raw Almanac UT can fall outside [0, 24). Wrapping it into that range
// and attaching it to Date.UTC of the requested civil Y-M-D puts the event
// on the wrong local day at most longitudes away from Greenwich (QC-SKY-001
// H-1). We leave UT unwrapped and then keep the neighbouring-date event
// whose wall date in the location's zone equals the requested civil date.

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
  // Prefer the requested date, then neighbours; prefer an unshifted UT, then ±24/48 h.
  // The shifts cover UT values that land a day off, including at year boundaries.
  for (const delta of [0, -1, 1]) {
    const d = addCivilDays(year, month0, day, delta);
    const ev = calc(d.year, d.month, d.day, lat, lng, rising);
    if (!ev) continue;
    for (const shiftH of [0, -24, 24, -48, 48]) {
      const cand = new Date(ev.getTime() + shiftH * 3600000);
      if (onCivilDate(cand, year, month0, day, tz)) return cand;
    }
  }
  return null;
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
