// Synastry: inter-aspects between two charts, scored the cunning way.

import type { PlanetKey } from "./constants";
import { PLANETS, PLANET_LABEL } from "./constants";
import { buildHoroscope, lonOf } from "./engine";
import { angleDiff, norm360 } from "./format";

export interface SynastryAspect {
  a: PlanetKey | "asc";
  b: PlanetKey | "asc";
  aspectKey: string;
  orb: number;
  pts: number;
}

export interface SynastryResult {
  score: number; // 0..100
  aspects: SynastryAspect[];
  verdict: string;
}

// points used from each chart (classical planets + Ascendant)
const POINTS: Array<PlanetKey | "asc"> = [
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "asc",
];

// weight of each pair for love & sympathy (negative = Saturn-style heaviness)
const PAIR_WEIGHT: Record<string, number> = {
  "sun-moon": 12, "venus-mars": 10, "moon-moon": 8, "sun-venus": 8,
  "moon-venus": 8, "sun-sun": 6, "venus-venus": 5, "mars-mars": 4,
  "mercury-mercury": 4, "asc-sun": 8, "asc-moon": 9, "asc-venus": 9,
  "asc-mars": 6, "sun-mars": 4, "moon-mars": 5, "sun-jupiter": 6,
  "moon-jupiter": 6, "venus-jupiter": 6, "sun-mercury": 3, "moon-mercury": 3,
  "venus-mercury": 3, "mars-jupiter": 3, "mercury-mars": 2,
  "asc-mercury": 4, "asc-jupiter": 5, "jupiter-jupiter": 3,
  "sun-saturn": -6, "moon-saturn": -8, "venus-saturn": -7, "mars-saturn": -6,
  "mercury-saturn": -3, "asc-saturn": -6, "saturn-saturn": 2,
};

const ASPECT_MOD: Record<number, number> = { 0: 1, 120: 1, 60: 0.7, 90: -1.1, 180: -0.9 };
const ASPECTS = [0, 60, 90, 120, 180];
const ORBS: Record<number, number> = { 0: 8, 60: 5, 90: 6, 120: 7, 180: 8 };
const ASPECT_NAME: Record<number, string> = {
  0: "conjunction", 60: "sextile", 90: "square", 120: "trine", 180: "opposition",
};

function pairWeight(a: PlanetKey | "asc", b: PlanetKey | "asc"): number {
  return PAIR_WEIGHT[`${a}-${b}`] ?? PAIR_WEIGHT[`${b}-${a}`] ?? 0;
}

export const pointLabel = (p: PlanetKey | "asc") => (p === "asc" ? "Ascendant" : PLANET_LABEL[p]);

export function computeSynastry(
  dateA: Date, dateB: Date, lat: number, lng: number
): SynastryResult {
  const hA = buildHoroscope(dateA, lat, lng);
  const hB = buildHoroscope(dateB, lat, lng);
  const lon = (h: ReturnType<typeof buildHoroscope>) => {
    const m = new Map<PlanetKey | "asc", number>();
    for (const p of PLANETS.slice(0, 7)) m.set(p, lonOf(h, p));
    m.set("asc", norm360(h.Ascendant.ChartPosition.Ecliptic.DecimalDegrees));
    return m;
  };
  const lonA = lon(hA);
  const lonB = lon(hB);

  const aspects: SynastryAspect[] = [];
  for (const a of POINTS) {
    for (const b of POINTS) {
      if (a === b && a === "asc") continue;
      const w = pairWeight(a, b);
      if (w === 0) continue;
      const sep = Math.abs(angleDiff(lonA.get(a)!, lonB.get(b)!));
      let bestAngle = -1, bestOrb = 99;
      for (const ang of ASPECTS) {
        const orb = Math.abs(sep - ang);
        if (orb <= ORBS[ang] && orb < bestOrb) { bestAngle = ang; bestOrb = orb; }
      }
      if (bestAngle < 0) continue;
      const orbFactor = 1 - bestOrb / ORBS[bestAngle];
      // Saturn-style pairs are heavy under any aspect — a square to Saturn must
      // not come out positive, so negative weights keep the aspect's magnitude.
      const mod = w < 0 ? Math.abs(ASPECT_MOD[bestAngle]) : ASPECT_MOD[bestAngle];
      const pts = Math.round(w * mod * orbFactor);
      if (pts === 0) continue;
      aspects.push({ a, b, aspectKey: ASPECT_NAME[bestAngle], orb: bestOrb, pts });
    }
  }
  aspects.sort((x, y) => Math.abs(y.pts) - Math.abs(x.pts));
  const raw = aspects.reduce((s, x) => s + x.pts, 0);
  const score = Math.max(0, Math.min(100, 50 + raw));
  const verdict =
    score >= 75 ? "A rare and powerful bond — the stars conspire with you." :
    score >= 60 ? "Strong sympathy between these charts — nurture it." :
    score >= 45 ? "A workable mixture of ease and friction." :
    score >= 30 ? "Considerable friction — patience and humour required." :
    "The charts pull against each other — proceed with open eyes.";
  return { score, aspects: aspects.slice(0, 14), verdict };
}
