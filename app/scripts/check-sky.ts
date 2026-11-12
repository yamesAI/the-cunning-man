// Check: Session Sky window helpers (SKY-001). 48h cap, D-1 default length,
// timezone independence, planetary hours across days, sign-change bisect,
// polar note path, and no election.ts imports.
// Run: npm run check:sky

import { readFileSync } from "node:fs";
import {
  MAX_WINDOW_MS, checkWindow, clampEnd, findChanges, fromLocalInput, thisPlanetaryDay,
  toLocalInput, windowHours, zonedWallToDate,
} from "../src/astro/sessionsky";
import { buildHoroscope, lonOf } from "../src/astro/engine";
import { moonMansion } from "../src/astro/traditional";

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

// no election code in Session Sky
for (const f of ["../src/astro/sessionsky.ts", "../src/pages/site/SessionSkyPage.tsx"]) {
  const s = readFileSync(new URL(f, import.meta.url), "utf8");
  assert(!/election|scanElections|ElectionPanel|components\/panels/.test(s.replace(/^\/\/.*$/gm, "")), `${f}: no election.ts / ElectionPanel import`);
}

console.log(`check:sky OK — ${n} assertions`);
