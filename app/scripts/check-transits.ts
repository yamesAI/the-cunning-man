// Check: transit engine math (Task 5).
// Real-ephemeris anchors (verified 2026-10-06):
//   - Full Moon 2026-10-26 04:12 UTC
//     https://www.astronomy.com/observing/full-moon-calendar-dates-times-types/
//     https://www.hermetikon.com/astrology/moon/october-2026 (04:12 AM UTC)
//   - Saturn direct station Dec 10-11 2026, ~7°56' Aries (tropical)
//     https://bonniesorsby.com/retrograde-dates/ (10 Dec 2026, 7°56' Aries)
//     https://theastroscope.com/astrology/retrogrades/saturn-2026
// Run: npm run check:transits

import { computeChart, buildHoroscope, lonOf, type ChartData } from "../src/astro/engine";
import { angleDiff } from "../src/astro/format";
import {
  findExactSeparation,
  transitsToNatal,
  exactTimesForHits,
  sortTransitHits,
  sortAspectCells,
  EXACT_WINDOW_MS,
  type TransitHit,
} from "../src/astro/transits";

// transitsToNatal detects hits; exact times come from the batched tier-able
// search. This helper pairs them the way the UI does.
function withExact(
  natal: ChartData,
  current: ChartData,
  pred: (h: TransitHit) => boolean
): TransitHit {
  const hits = transitsToNatal(natal, current);
  const times = exactTimesForHits(hits, natal, current.date, current.lat, current.lng);
  const h = hits.find(pred);
  if (!h) throw new Error("FAIL: expected transit hit not found");
  return { ...h, exactAt: times.get(h) ?? null };
}

const L = { lat: 51.5074, lng: -0.1278 };
const DAY = 86400000;
const HOUR = 3600000;

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}
const approx = (a: number, b: number, tol: number, msg: string) =>
  assert(Math.abs(a - b) <= tol, `${msg} (got ${a}, want ${b} ±${tol})`);

const moonLon = (t: number | Date) => lonOf(buildHoroscope(new Date(t), L.lat, L.lng), "moon");
const sunLon = (t: number | Date) => lonOf(buildHoroscope(new Date(t), L.lat, L.lng), "sun");
const saturnLon = (t: number | Date) => lonOf(buildHoroscope(new Date(t), L.lat, L.lng), "saturn");

// ---- synthetic minimum + window ----
{
  const t0 = new Date("2026-01-01T00:00:00Z").getTime();
  const sepAt = (t: Date) => Math.abs(8 - (t.getTime() - t0) / DAY);
  const hit = findExactSeparation(sepAt, 0, new Date(t0), 1, 30 * DAY);
  assert(hit, "synthetic: minimum found");
  approx(hit!.getTime() - t0, 8 * DAY, 60000, "synthetic: min at t0+8d");
  const miss = findExactSeparation(sepAt, 0, new Date(t0), 1, 4 * DAY);
  assert(miss === null, "synthetic: null when minimum outside window");
}

// ---- boundary: orb gate in transitsToNatal (Moon opposition natal Sun) ----
{
  const base = new Date("2026-10-01T00:00:00Z");
  const natal = computeChart(base, L.lat, L.lng);

  // find the instant when the Moon's angular distance from the NATAL Sun
  // (unwrapped, moving away from conjunction) equals target
  const natalSunLon = sunLon(base);
  const distAt = (t: number) => angleDiff(moonLon(t), natalSunLon);
  const findDist = (target: number): Date => {
    let prevT = base.getTime();
    let prevU = distAt(prevT);
    for (let i = 0; i < 400; i++) {
      const t = prevT + 6 * HOUR;
      let u = distAt(t);
      while (u < prevU - 180) u += 360;
      while (u > prevU + 180) u -= 360;
      if (prevU < target && u >= target) {
        let lo = prevT, hi = t;
        for (let j = 0; j < 26; j++) {
          const m = (lo + hi) / 2;
          let mu = distAt(m);
          while (mu < prevU - 180) mu += 360;
          while (mu > prevU + 180) mu -= 360;
          if (mu < target) lo = m; else hi = m;
        }
        return new Date((lo + hi) / 2);
      }
      prevT = t; prevU = u;
    }
    throw new Error("distance target not reached");
  };

  const outside = computeChart(findDist(188.1), L.lat, L.lng);
  const hitsOutside = transitsToNatal(natal, outside).filter(
    (h) => h.transiting === "moon" && h.natalPoint === "sun" && h.aspectKey === "opposition"
  );
  assert(hitsOutside.length === 0, "orb gate: 8.1° opposition does not register");

  const inside = computeChart(findDist(187.95), L.lat, L.lng);
  const hitsInside = transitsToNatal(natal, inside).filter(
    (h) => h.transiting === "moon" && h.natalPoint === "sun" && h.aspectKey === "opposition"
  );
  assert(hitsInside.length === 1, "orb gate: 7.95° opposition registers");
  approx(hitsInside[0].orb, 7.95, 0.05, "orb value");
}

// ---- Case A (lunar): Moon opposition natal Sun near the published full moon ----
{
  const FULL_MOON = new Date("2026-10-26T04:12:00Z");
  const targetSun = sunLon(FULL_MOON);
  // natal moment ~40 years earlier whose natal Sun sits at the same longitude
  let bestT = 0, bestD = 1e9;
  const approxBirth = FULL_MOON.getTime() - 40 * 365.2422 * DAY;
  for (let d = -5; d <= 5; d += 0.25) {
    const t = approxBirth + d * DAY;
    const dd = Math.abs(angleDiff(sunLon(t), targetSun));
    if (dd < bestD) { bestD = dd; bestT = t; }
  }
  assert(bestD < 0.02, `natal sun placed within 0.02° (got ${bestD})`);
  const natal = computeChart(new Date(bestT), L.lat, L.lng);
  const current = computeChart(new Date(FULL_MOON.getTime() - 4 * HOUR), L.lat, L.lng);
  const hit = withExact(
    natal,
    current,
    (h) => h.transiting === "moon" && h.natalPoint === "sun" && h.aspectKey === "opposition"
  );
  assert(hit.applying, "lunar case: applying before full");
  assert(hit.exactAt, "lunar case: exactAt found");
  approx(hit.exactAt!.getTime(), FULL_MOON.getTime(), 30 * 60000, "lunar exact vs published full moon");
}

// ---- Case B (Saturn, retrograde): first pass, not a later station pass ----
{
  // direct station ≈ Dec 10-11 2026; use Dec 10 18:00Z, tolerances absorb source spread
  const STATION_DIRECT = new Date("2026-12-10T18:00:00Z");
  const natalLon = saturnLon(STATION_DIRECT) + 5 / 60; // 5 arcmin past the station degree
  // find a birth instant when Saturn held that longitude (scan back from Jul
  // 2026; Saturn descends through natalLon in direct motion ~May 2026)
  let birthB = 0;
  let prevT = Date.UTC(2026, 6, 1);
  let prevD = angleDiff(saturnLon(prevT), natalLon);
  for (let d = 1; d <= 300; d++) {
    const t = Date.UTC(2026, 6, 1) - d * DAY;
    const dd = angleDiff(saturnLon(t), natalLon);
    if (Math.abs(dd) < 0.02) { birthB = t; break; }
    if (prevD > 0 && dd <= 0) {
      let lo = t, hi = prevT;
      for (let j = 0; j < 24; j++) {
        const m = (lo + hi) / 2;
        if (angleDiff(saturnLon(m), natalLon) > 0) lo = m; else hi = m;
      }
      birthB = hi;
      break;
    }
    prevT = t; prevD = dd;
  }
  assert(birthB, "saturn case: natal instant found");
  const natal = computeChart(new Date(birthB), L.lat, L.lng);
  const current = computeChart(new Date("2026-11-15T00:00:00Z"), L.lat, L.lng);
  const hit = withExact(
    natal,
    current,
    (h) => h.transiting === "saturn" && h.natalPoint === "saturn" && h.aspectKey === "conjunction"
  );
  assert(hit.applying, "saturn case: applying as it descends toward the station");
  assert(hit.exactAt, "saturn case: exactAt found");
  assert(
    hit!.exactAt!.getTime() <= STATION_DIRECT.getTime() + DAY,
    "saturn case: first pass — exactness is NOT after the direct station"
  );
  approx(hit!.exactAt!.getTime(), STATION_DIRECT.getTime(), 16 * DAY, "saturn exact near station");
}

// ---- Case C (solar return): transiting Sun conjunct natal Sun on the anniversary ----
{
  const natal = computeChart(new Date("1985-04-12T08:30:00Z"), L.lat, L.lng);
  const current = computeChart(new Date("2026-04-11T00:00:00Z"), L.lat, L.lng);
  const hit = withExact(
    natal,
    current,
    (h) => h.transiting === "sun" && h.natalPoint === "sun" && h.aspectKey === "conjunction"
  );
  assert(hit.exactAt, "solar return: exactAt found");
  approx(hit!.exactAt!.getTime(), Date.UTC(2026, 3, 12, 8, 30), DAY, "solar return exact on anniversary");
}

// ---- sorting helpers + windows sanity ----
{
  assert(EXACT_WINDOW_MS.moon === 2 * DAY, "moon window 2d");
  assert(EXACT_WINDOW_MS.saturn === 90 * DAY, "saturn window 90d");
  const natal = computeChart(new Date("1990-06-15T10:30:00Z"), L.lat, L.lng);
  const current = computeChart(new Date(), L.lat, L.lng);
  const sorted = sortTransitHits(transitsToNatal(natal, current));
  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i - 1], b = sorted[i];
    const rank = (h: typeof a) =>
      (h.transiting === "moon" ? 0 : 1) * 1000 + (h.applying ? 0 : 1) * 100 + h.orb;
    assert(rank(a) <= rank(b) + 1e-9, "sortTransitHits ordering");
  }
  const sky = sortAspectCells(current.aspectsGrid);
  for (let i = 1; i < sky.length; i++) {
    const a = sky[i - 1], b = sky[i];
    const rank = (c: typeof a) =>
      (c.p1 === "moon" || c.p2 === "moon" ? 0 : 1) * 1000 + (c.applying ? 0 : 1) * 100 + c.orb;
    assert(rank(a) <= rank(b) + 1e-9, "sortAspectCells ordering");
  }
}

console.log("check:transits OK");
