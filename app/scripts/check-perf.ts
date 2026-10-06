// Check: transit engine math + perf budget (Tasks 5/12 fix pass).
// The exact-hit searches must not freeze the UI thread.
// Run: npm run check:perf

import { computeChart } from "../src/astro/engine";
import { transitsToNatal, exactTimesForHits, exactTimesForAspects } from "../src/astro/transits";

const L = { lat: 51.5074, lng: -0.1278 };

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

const natal = computeChart(new Date("1990-06-15T10:30:00Z"), L.lat, L.lng);
const current = computeChart(new Date(), L.lat, L.lng);

// warm any lazy ephemeris paths, then measure steady state
transitsToNatal(natal, current);
exactTimesForHits(transitsToNatal(natal, current), natal, current.date, current.lat, current.lng);
exactTimesForAspects(current.aspectsGrid, current.date, current.lat, current.lng);

let t0 = performance.now();
const hits = transitsToNatal(natal, current);
const tDetect = performance.now() - t0;

t0 = performance.now();
const hitTimes = exactTimesForHits(hits, natal, current.date, current.lat, current.lng);
const tHits = performance.now() - t0;

t0 = performance.now();
const skyTimes = exactTimesForAspects(current.aspectsGrid, current.date, current.lat, current.lng);
const tSky = performance.now() - t0;

console.log(`transitsToNatal (detect): ${tDetect.toFixed(0)}ms (${hits.length} hits)`);
console.log(`exactTimesForHits: ${tHits.toFixed(0)}ms (${hitTimes.size} hits)`);
console.log(`exactTimesForAspects: ${tSky.toFixed(0)}ms (${skyTimes.size} cells)`);

assert(tDetect < 200, `hit detection under 200ms (got ${tDetect.toFixed(0)}ms)`);
// full-batch worst case; the UI tiers split this — Moon-involved items every
// 5 min, slow planets every 30 — so the worst single UI beat is ~half these
assert(tHits < 3000, `exactTimesForHits under 3s full-batch (got ${tHits.toFixed(0)}ms)`);
assert(tSky < 3000, `exactTimesForAspects under 3s full-batch (got ${tSky.toFixed(0)}ms)`);

console.log("check:perf OK");
