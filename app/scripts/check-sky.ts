// Check: Session Sky window helpers (SKY-001). 48h cap, D-1 default length,
// timezone independence, planetary hours across days, sign-change bisect,
// polar note path, and no election.ts imports.
// Run: npm run check:sky

import { readFileSync } from "node:fs";
import {
  MAX_WINDOW_MS, checkWindow, clampEnd, findChanges, fromLocalInput, thisPlanetaryDay,
  toLocalInput, windowHours, zonedWallToDate,
} from "../src/astro/sessionsky";
import { buildHoroscope, lonOf, tzForLocation } from "../src/astro/engine";
import { moonMansion } from "../src/astro/traditional";
import { sunEvents } from "../src/astro/sun";
import { wallParts } from "../src/astro/format";

let n = 0;
function assert(cond: unknown, msg: string) {
  n++;
  if (!cond) throw new Error(`FAIL: ${msg}`);
}
const H = 3600000;
const LONDON = { lat: 51.5074, lng: -0.1278 };

// 48h cap
const t0 = new Date("2026-11-12T12:00:00Z");
assert(checkWindow(t0, new Date(t0.getTime() + 48 * H)).ok, "exactly 48h is allowed");
const over = checkWindow(t0, new Date(t0.getTime() + 48 * H + 60000));
assert(!over.ok && /48 hours/.test(over.message ?? ""), "over 48h rejected with a plain message");
assert(!checkWindow(t0, t0).ok && !checkWindow(new Date(t0.getTime() + H), t0).ok, "end must be after start");
assert(!checkWindow(null, t0).ok, "missing start rejected");
assert(clampEnd(t0, new Date(t0.getTime() + 100 * H)).getTime() - t0.getTime() === MAX_WINDOW_MS, "clamp to 48h");
const longScan = findChanges(t0, new Date(t0.getTime() + 96 * H), LONDON.lat, LONDON.lng, 60 * 60000);
assert(longScan.every((c) => c.time.getTime() <= t0.getTime() + MAX_WINDOW_MS), "finder never scans past 48h");

// D-1: this planetary day = sunrise to next sunrise, location zone
const d1 = thisPlanetaryDay(t0, LONDON.lat, LONDON.lng);
const len = d1.end.getTime() - d1.start.getTime();
assert(d1.planetaryDay && d1.zone === "Europe/London" && d1.note === null, "D-1 London: planetary day in Europe/London");
assert(len > 23.9 * H && len < 24.1 * H, `D-1 length ~24h (got ${len / H})`);
assert(t0 >= d1.start && t0 < d1.end, "D-1 contains now");
const preDawn = new Date("2026-11-12T05:00:00Z"); // before London sunrise -> previous planetary day
const d1b = thisPlanetaryDay(preDawn, LONDON.lat, LONDON.lng);
assert(d1b.start < preDawn && d1b.end > preDawn && d1b.end.getTime() - d1.start.getTime() < 60 * 60000, "before sunrise: previous planetary day");
const wh = windowHours(d1.start, d1.end, LONDON.lat, LONDON.lng);
assert(wh.days.length === 1 && wh.hours.length === 24 && wh.notes.length === 0, "D-1 window: one day, 24 hours");
assert(wh.hours[0].start.getTime() === d1.start.getTime() && wh.hours.every((h) => !h.clipped), "hours start at sunrise, none clipped");
assert(wh.days[0].ruler === "jupiter" && wh.hours[0].ruler === "jupiter", "Thursday: day of Jupiter, 1st hour Jupiter");

// planetary hours across two days, clipped edges
const w2 = windowHours(new Date("2026-11-12T10:00:00Z"), new Date("2026-11-14T10:00:00Z"), LONDON.lat, LONDON.lng);
assert(w2.days.length === 3, `48h window crosses 3 planetary days (got ${w2.days.length})`);
assert(w2.hours[0].clipped && w2.hours[w2.hours.length - 1].clipped, "first and last hours are clipped");
for (let i = 1; i < w2.hours.length; i++) assert(Math.abs(w2.hours[i].start.getTime() - w2.hours[i - 1].end.getTime()) < 1000, `hours contiguous at ${i}`);

// timezone independence: London place, Chicago window
const chi = fromLocalInput("2026-11-12T09:00", "America/Chicago")!;
assert(chi.toISOString() === "2026-11-12T15:00:00.000Z", "Chicago wall time -> instant");
assert(toLocalInput(chi, "America/Chicago") === "2026-11-12T09:00" && toLocalInput(chi, "Europe/London") === "2026-11-12T15:00", "same instant shown in two zones");
const wChi = windowHours(chi, new Date(chi.getTime() + 4 * H), LONDON.lat, LONDON.lng);
assert(wChi.hours.length >= 4 && wChi.days.every((d) => d.weekdayIdx === 4), "hours use the place's sunrise, not the window zone");
assert(zonedWallToDate({ year: 2026, month: 2, day: 8, hour: 2, minute: 30, second: 0 }, "America/Chicago").toISOString() === "2026-03-08T08:30:00.000Z", "DST gap resolves forward");
assert(fromLocalInput("2026-13-01T00:00", "UTC") === null && fromLocalInput("2026-11-12T09:00", "Not/AZone") === null, "bad input rejected");

// sign-change bisect: every change lands within 1 minute of the true boundary
const changes = findChanges(t0, new Date(t0.getTime() + 48 * H), LONDON.lat, LONDON.lng);
const moonSign = changes.filter((c) => c.kind === "sign" && c.planet === "moon");
assert(moonSign.length >= 1, "Moon changes sign at least once in 48h");
for (const c of changes) {
  const before = lonOf(buildHoroscope(new Date(c.time.getTime() - 60000), LONDON.lat, LONDON.lng), c.planet);
  const after = lonOf(buildHoroscope(c.time, LONDON.lat, LONDON.lng), c.planet);
  if (c.kind === "sign") {
    assert(Math.floor(after / 30) % 12 !== Math.floor(before / 30) % 12, `${c.planet} sign change bracketed to 1 min`);
  } else {
    assert(moonMansion(after).index === c.to && moonMansion(before).index === c.from, "mansion change bracketed to 1 min");
  }
  assert(c.time > t0 && c.time.getTime() <= t0.getTime() + 48 * H, "change inside window");
}

// polar: Longyearbyen in December has no sunrise; note, no invented hours
const SVAL = { lat: 78.2232, lng: 15.6267 };
const pd = thisPlanetaryDay(new Date("2026-12-20T12:00:00Z"), SVAL.lat, SVAL.lng);
assert(!pd.planetaryDay && pd.note && pd.end.getTime() - pd.start.getTime() === 24 * H, "polar default: civil day with a note");
const pw = windowHours(pd.start, pd.end, SVAL.lat, SVAL.lng);
assert(pw.hours.length === 0 && pw.days.length === 0 && pw.notes.length >= 1 && /polar/.test(pw.notes[0]), "polar window: no hours, plain note");

// H-1 / L-1: sunrise, sunset and nextSunrise on the location's civil date
// at longitudes away from Greenwich, and in Chicago/Cancun summer. 24
// positive-length contiguous hours per planetary day. The polar note appears
// only when sunEvents returns a null sunrise, sunset or nextSunrise.
const PLACES: Array<{ name: string; lat: number; lng: number }> = [
  { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
  { name: "Honolulu", lat: 21.3069, lng: -157.8583 },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { name: "Sydney", lat: -33.8688, lng: 151.2093 },
  { name: "Auckland", lat: -36.8485, lng: 174.7633 },
  { name: "Chicago", lat: 41.8781, lng: -87.6298 },
  { name: "Cancun", lat: 21.1619, lng: -86.8515 },
];

function addCivil(year: number, month0: number, day: number, delta: number) {
  const d = new Date(Date.UTC(year, month0, day + delta));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate() };
}

function assertSunDay(name: string, lat: number, lng: number, year: number, month0: number, day: number) {
  const tz = tzForLocation(lat, lng);
  const ev = sunEvents(year, month0, day, lat, lng);
  const missing = !ev.sunrise || !ev.sunset || !ev.nextSunrise;
  const noon = zonedWallToDate({ year, month: month0, day, hour: 12, minute: 0, second: 0 }, tz);
  const dw = thisPlanetaryDay(noon, lat, lng);
  if (missing) {
    assert(!dw.planetaryDay && !!dw.note, `${name} ${year}-${month0 + 1}-${day}: polar note only when sunEvents is null`);
    return;
  }
  assert(dw.planetaryDay && dw.note === null, `${name} ${year}-${month0 + 1}-${day}: no polar note when sunEvents is complete`);
  assert(ev.sunrise! < ev.sunset! && ev.sunset! < ev.nextSunrise!, `${name} ${year}-${month0 + 1}-${day}: sunrise < sunset < nextSunrise`);
  const sr = wallParts(ev.sunrise!, tz);
  assert(sr.year === year && sr.month === month0 && sr.day === day, `${name} sunrise on local civil date (got ${sr.year}-${sr.month + 1}-${sr.day})`);
  const ss = wallParts(ev.sunset!, tz);
  assert(ss.year === year && ss.month === month0 && ss.day === day, `${name} sunset on local civil date`);
  const nxt = addCivil(year, month0, day, 1);
  const ns = wallParts(ev.nextSunrise!, tz);
  assert(ns.year === nxt.year && ns.month === nxt.month && ns.day === nxt.day, `${name} nextSunrise on the following civil date`);
  const wh = windowHours(dw.start, dw.end, lat, lng);
  assert(wh.hours.length === 24 && wh.notes.length === 0 && wh.days.length === 1, `${name} ${year}-${month0 + 1}-${day}: 24 hours, one day, no polar note`);
  for (let i = 0; i < wh.hours.length; i++) {
    assert(wh.hours[i].end.getTime() > wh.hours[i].start.getTime(), `${name} hour ${i} has positive length`);
  }
  for (let i = 1; i < wh.hours.length; i++) {
    assert(Math.abs(wh.hours[i].start.getTime() - wh.hours[i - 1].end.getTime()) < 1000, `${name} hours contiguous at ${i}`);
  }
}

for (const p of PLACES) {
  // a midwinter and midsummer day for every listed place
  for (const [month0, day] of [[0, 15], [5, 21], [10, 12]] as Array<[number, number]>) {
    assertSunDay(p.name, p.lat, p.lng, 2026, month0, day);
  }
}
// Chicago and Cancun through summer 2026 (1 June – 31 August)
for (const p of PLACES.filter((x) => x.name === "Chicago" || x.name === "Cancun")) {
  for (let d = 0; d < 92; d++) {
    const dt = new Date(Date.UTC(2026, 5, 1 + d));
    assertSunDay(p.name, p.lat, p.lng, dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
  }
}
// Year of 2026 at 17:00 UTC (the QC H-1 sample) for the far-longitude places
for (const p of PLACES.filter((x) => !["Chicago", "Cancun"].includes(x.name))) {
  for (let d = 0; d < 365; d++) {
    const when = new Date(Date.UTC(2026, 0, 1, 17) + d * 86400000);
    const tz = tzForLocation(p.lat, p.lng);
    const w = wallParts(when, tz);
    const ev = sunEvents(w.year, w.month, w.day, p.lat, p.lng);
    const dw = thisPlanetaryDay(when, p.lat, p.lng);
    const missing = !ev.sunrise || !ev.sunset || !ev.nextSunrise;
    if (missing) {
      assert(!dw.planetaryDay && !!dw.note, `${p.name} day ${d}: polar note only when sunEvents is null`);
    } else {
      assert(dw.planetaryDay && dw.note === null, `${p.name} day ${d}: no polar note when sunEvents is complete`);
      assert(ev.sunrise! < ev.sunset! && ev.sunset! < ev.nextSunrise!, `${p.name} day ${d}: sunrise < sunset < nextSunrise`);
      const wh = windowHours(dw.start, dw.end, p.lat, p.lng);
      assert(wh.hours.length === 24 && wh.notes.length === 0, `${p.name} day ${d}: 24 hours, no polar note`);
      for (let i = 0; i < 24; i++) assert(wh.hours[i].end.getTime() > wh.hours[i].start.getTime(), `${p.name} day ${d} hour ${i} positive`);
      for (let i = 1; i < 24; i++) {
        assert(Math.abs(wh.hours[i].start.getTime() - wh.hours[i - 1].end.getTime()) < 1000, `${p.name} day ${d} contiguous at ${i}`);
      }
    }
  }
}

// polar note appears only when sunEvents returns null (Longyearbyen already polar above)
{
  const ev = sunEvents(2026, 11, 20, SVAL.lat, SVAL.lng);
  assert(!ev.sunrise || !ev.sunset || !ev.nextSunrise, "Longyearbyen 20 Dec: sunEvents is null");
  assert(!pd.planetaryDay && !!pd.note, "Longyearbyen 20 Dec: polar note matches null sunEvents");
}

// Polar midwinter / midsummer stay null (no invented hours). McMurdo is
// Antarctic, so midwinter is June and midsummer is December.
const MCMURDO = { lat: -77.8419, lng: 166.6863 };
for (const [name, place, month0, day] of [
  ["Longyearbyen midwinter", SVAL, 11, 20],
  ["Longyearbyen midsummer", SVAL, 5, 21],
  ["McMurdo midwinter", MCMURDO, 5, 21],
  ["McMurdo midsummer", MCMURDO, 11, 21],
] as Array<[string, { lat: number; lng: number }, number, number]>) {
  const ev = sunEvents(2026, month0, day, place.lat, place.lng);
  assert(!ev.sunrise && !ev.sunset && !ev.nextSunrise, `${name}: sunEvents stay null`);
}

// Transition days: an exact 24 h duplicate of sunrise or sunset across
// adjacent civil dates must fail. Covers Longyearbyen 2026-02-15/16 and
// 2026-04-18, and McMurdo 2026-02-19/20, plus the rest of 2026.
const DAY_MS = 24 * H;
function assertNoExactDayCopy(name: string, lat: number, lng: number) {
  let prev: ReturnType<typeof sunEvents> | null = null;
  for (let i = 0; i < 365; i++) {
    const dt = new Date(Date.UTC(2026, 0, 1 + i));
    const ev = sunEvents(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), lat, lng);
    if (prev) {
      const ymd = `${dt.getUTCFullYear()}-${dt.getUTCMonth() + 1}-${dt.getUTCDate()}`;
      if (prev.sunrise && ev.sunrise) {
        assert(ev.sunrise.getTime() - prev.sunrise.getTime() !== DAY_MS, `${name} ${ymd}: sunrise is not an exact 24 h copy of the previous civil date`);
      }
      if (prev.sunset && ev.sunset) {
        assert(ev.sunset.getTime() - prev.sunset.getTime() !== DAY_MS, `${name} ${ymd}: sunset is not an exact 24 h copy of the previous civil date`);
      }
    }
    if (ev.sunrise && ev.nextSunrise) {
      const ymd = `${dt.getUTCFullYear()}-${dt.getUTCMonth() + 1}-${dt.getUTCDate()}`;
      assert(ev.nextSunrise.getTime() - ev.sunrise.getTime() !== DAY_MS, `${name} ${ymd}: nextSunrise is not an exact 24 h copy of sunrise`);
    }
    prev = ev;
  }
}
assertNoExactDayCopy("Longyearbyen", SVAL.lat, SVAL.lng);
assertNoExactDayCopy("McMurdo", MCMURDO.lat, MCMURDO.lng);

// no election code in Session Sky
for (const f of ["../src/astro/sessionsky.ts", "../src/pages/site/SessionSkyPage.tsx"]) {
  const s = readFileSync(new URL(f, import.meta.url), "utf8");
  assert(!/election|scanElections|ElectionPanel|components\/panels/.test(s.replace(/^\/\/.*$/gm, "")), `${f}: no election.ts / ElectionPanel import`);
}

console.log(`check:sky OK — ${n} assertions`);
