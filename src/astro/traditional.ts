// Traditional (Renaissance / Lilly) astrology tables:
// essential dignities, planetary day & hour rulers, lunar mansions.

import type { PlanetKey, SignKey } from "./constants";
import { SIGNS, CLASSICAL_PLANETS } from "./constants";
import { norm360 } from "./format";

// ---------- Essential dignities (Lilly) ----------

export const RULER: Record<SignKey, PlanetKey> = {
  aries: "mars", taurus: "venus", gemini: "mercury", cancer: "moon",
  leo: "sun", virgo: "mercury", libra: "venus", scorpio: "mars",
  sagittarius: "jupiter", capricorn: "saturn", aquarius: "saturn", pisces: "jupiter",
};

const opposite = (s: SignKey): SignKey => SIGNS[(SIGNS.indexOf(s) + 6) % 12];

export const DETRIMENT: Record<SignKey, PlanetKey> = Object.fromEntries(
  SIGNS.map((s) => [s, RULER[opposite(s)]])
) as Record<SignKey, PlanetKey>;

// Exaltation: sign (degrees within sign for the exact point)
export const EXALTATION_SIGN: Record<PlanetKey, SignKey> = {
  sun: "aries", moon: "taurus", mercury: "virgo", venus: "pisces",
  mars: "capricorn", jupiter: "cancer", saturn: "libra",
  uranus: "scorpio", neptune: "leo", pluto: "aries", // moderns unused
};
export const EXALTATION_DEGREE: Partial<Record<PlanetKey, number>> = {
  sun: 19, moon: 3, mercury: 15, venus: 27, mars: 28, jupiter: 15, saturn: 21,
};
export const FALL_SIGN: Record<PlanetKey, SignKey> = Object.fromEntries(
  (Object.keys(EXALTATION_SIGN) as PlanetKey[]).map((p) => [p, opposite(EXALTATION_SIGN[p])])
) as Record<PlanetKey, SignKey>;

// Triplicity rulers (Dorotheus/Lilly): [day, night]
export const TRIPLICITY: Record<"fire" | "earth" | "air" | "water", [PlanetKey, PlanetKey]> = {
  fire: ["sun", "jupiter"],
  earth: ["venus", "moon"],
  air: ["saturn", "mercury"],
  water: ["mars", "mars"],
};
export const ELEMENT_OF: Record<SignKey, "fire" | "earth" | "air" | "water"> = {
  aries: "fire", leo: "fire", sagittarius: "fire",
  taurus: "earth", virgo: "earth", capricorn: "earth",
  gemini: "air", libra: "air", aquarius: "air",
  cancer: "water", scorpio: "water", pisces: "water",
};

// Egyptian terms: bounds within each sign, cumulative degrees
const TERMS: Record<SignKey, Array<[PlanetKey, number]>> = {
  aries: [["jupiter", 6], ["venus", 6], ["mercury", 8], ["mars", 5], ["saturn", 5]],
  taurus: [["venus", 8], ["mercury", 6], ["jupiter", 8], ["saturn", 5], ["mars", 3]],
  gemini: [["mercury", 6], ["jupiter", 6], ["venus", 5], ["mars", 7], ["saturn", 6]],
  cancer: [["mars", 7], ["venus", 6], ["mercury", 6], ["jupiter", 7], ["saturn", 5]],
  leo: [["jupiter", 6], ["venus", 5], ["saturn", 7], ["mercury", 6], ["mars", 6]],
  virgo: [["mercury", 7], ["venus", 10], ["jupiter", 4], ["mars", 7], ["saturn", 6]],
  libra: [["saturn", 6], ["mercury", 8], ["jupiter", 7], ["venus", 7], ["mars", 5]],
  scorpio: [["mars", 7], ["venus", 4], ["mercury", 8], ["jupiter", 5], ["saturn", 6]],
  sagittarius: [["jupiter", 12], ["venus", 5], ["mercury", 4], ["saturn", 5], ["mars", 4]],
  capricorn: [["mercury", 7], ["jupiter", 7], ["venus", 8], ["saturn", 4], ["mars", 4]],
  aquarius: [["mercury", 7], ["venus", 6], ["jupiter", 7], ["mars", 5], ["saturn", 5]],
  pisces: [["venus", 12], ["jupiter", 4], ["mercury", 3], ["mars", 9], ["saturn", 6]],
};

// Faces (decans), Chaldean sequence starting Aries = Mars
const FACES: Record<SignKey, [PlanetKey, PlanetKey, PlanetKey]> = {
  aries: ["mars", "sun", "venus"],
  taurus: ["mercury", "moon", "saturn"],
  gemini: ["jupiter", "mars", "sun"],
  cancer: ["venus", "mercury", "moon"],
  leo: ["saturn", "jupiter", "mars"],
  virgo: ["sun", "venus", "mercury"],
  libra: ["moon", "saturn", "jupiter"],
  scorpio: ["mars", "sun", "venus"],
  sagittarius: ["mercury", "moon", "saturn"],
  capricorn: ["jupiter", "mars", "sun"],
  aquarius: ["venus", "mercury", "moon"],
  pisces: ["saturn", "jupiter", "mars"],
};

export function termRuler(sign: SignKey, deg: number): PlanetKey {
  let acc = 0;
  for (const [p, span] of TERMS[sign]) {
    acc += span;
    if (deg < acc) return p;
  }
  return TERMS[sign][TERMS[sign].length - 1][0];
}

export function faceRuler(sign: SignKey, deg: number): PlanetKey {
  return FACES[sign][Math.min(2, Math.floor(deg / 10))];
}

export interface DignityRow {
  planet: PlanetKey;
  ruler: boolean;
  exalt: boolean;
  trip: PlanetKey[];       // triplicity rulers of the sign [day, night]
  tripActive: boolean;     // planet is the triplicity ruler in current sect
  term: PlanetKey;         // term ruler at this degree
  face: PlanetKey;         // face ruler at this degree
  detriment: boolean;
  fall: boolean;
  peregrine: boolean;
  score: number;           // Lilly accidental-free essential score
}

export function dignity(
  planet: PlanetKey,
  lon: number,
  isDayChart: boolean
): DignityRow | null {
  if (!CLASSICAL_PLANETS.includes(planet)) return null;
  const sign = SIGNS[Math.floor(norm360(lon) / 30)];
  const deg = norm360(lon) % 30;
  const ruler = RULER[sign] === planet;
  const exalt = EXALTATION_SIGN[planet] === sign;
  const trip = TRIPLICITY[ELEMENT_OF[sign]];
  const tripActive = (isDayChart ? trip[0] : trip[1]) === planet;
  const term = termRuler(sign, deg);
  const face = faceRuler(sign, deg);
  const detriment = DETRIMENT[sign] === planet;
  const fall = FALL_SIGN[planet] === sign;

  let score = 0;
  if (ruler) score += 5;
  if (exalt) score += 4;
  if (tripActive) score += 3;
  if (term === planet) score += 2;
  if (face === planet) score += 1;
  if (detriment) score -= 5;
  if (fall) score -= 4;

  const hasEssential = ruler || exalt || tripActive || term === planet || face === planet;
  const peregrine = !hasEssential && !detriment && !fall;
  if (peregrine) score -= 5;

  return { planet, ruler, exalt, trip, tripActive, term, face, detriment, fall, peregrine, score };
}

// ---------- Planetary day & hour ----------

const DAY_RULER: PlanetKey[] = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"]; // Sun..Sat

export function dayRuler(weekdayIdx: number): PlanetKey {
  return DAY_RULER[weekdayIdx];
}

export interface PlanetaryHour {
  index: number;          // 1..24
  ruler: PlanetKey;
  start: Date;
  end: Date;
  isDay: boolean;
}

/**
 * Compute the 24 planetary hours spanning the civil day containing `date`.
 * Day hours divide sunrise->sunset into 12; night hours divide sunset->next sunrise into 12.
 */
export function planetaryHours(
  weekdayIdx: number,
  sunrise: Date,
  sunset: Date,
  nextSunrise: Date
): PlanetaryHour[] {
  const hours: PlanetaryHour[] = [];
  const ruler0 = dayRuler(weekdayIdx);
  const chal = CLASSICAL_PLANETS;
  const startIdx = chal.indexOf(ruler0);
  const dayLen = (sunset.getTime() - sunrise.getTime()) / 12;
  const nightLen = (nextSunrise.getTime() - sunset.getTime()) / 12;
  for (let i = 0; i < 24; i++) {
    const isDay = i < 12;
    const start = isDay
      ? new Date(sunrise.getTime() + i * dayLen)
      : new Date(sunset.getTime() + (i - 12) * nightLen);
    const end = isDay
      ? new Date(sunrise.getTime() + (i + 1) * dayLen)
      : new Date(sunset.getTime() + (i - 11) * nightLen);
    hours.push({ index: i + 1, ruler: chal[(startIdx + i) % 7], start, end, isDay });
  }
  return hours;
}

export function currentHour(hours: PlanetaryHour[], now: Date): PlanetaryHour | null {
  return hours.find((h) => now >= h.start && now < h.end) ?? null;
}

// ---------- Lunar mansions (Picatrix order, tropical) ----------

export const MANSIONS: Array<{ name: string; arabic: string; meaning: string }> = [
  { name: "Alnath", arabic: "Al Sharatain", meaning: "The Two Signs" },
  { name: "Albotain", arabic: "Al Butain", meaning: "The Belly" },
  { name: "Azoraya", arabic: "Al Thurayya", meaning: "The Many Little Ones" },
  { name: "Aldebaran", arabic: "Al Dabaran", meaning: "The Follower" },
  { name: "Almices", arabic: "Al Hak'ah", meaning: "The White Spot" },
  { name: "Athaya", arabic: "Al Han'ah", meaning: "The Scar" },
  { name: "Aldirah", arabic: "Al Dhira", meaning: "The Forearm" },
  { name: "Annathra", arabic: "Al Nathrah", meaning: "The Gap" },
  { name: "Atarf", arabic: "Al Tarf", meaning: "The Glance" },
  { name: "Algebha", arabic: "Al Jabhah", meaning: "The Forehead" },
  { name: "Azobra", arabic: "Al Zubrah", meaning: "The Mane" },
  { name: "Alzarpha", arabic: "Al Sarfah", meaning: "The Changer" },
  { name: "Alhayre", arabic: "Al Awwa", meaning: "The Howler" },
  { name: "Achumac", arabic: "Al Simak", meaning: "The Unarmed" },
  { name: "Argafra", arabic: "Al Ghafr", meaning: "The Covering" },
  { name: "Azubene", arabic: "Al Jubana", meaning: "The Horns" },
  { name: "Alichil", arabic: "Iklil al Jabhah", meaning: "The Crown" },
  { name: "Alcalb", arabic: "Al Kalb", meaning: "The Heart" },
  { name: "Exaula", arabic: "Al Shaulah", meaning: "The Sting" },
  { name: "Nahaym", arabic: "Al Na'am", meaning: "The Ostriches" },
  { name: "Elbelda", arabic: "Al Baldah", meaning: "The City" },
  { name: "Caadaldeba", arabic: "Sa'd al Dhabih", meaning: "The Lucky Sacrifice" },
  { name: "Caadebolah", arabic: "Sa'd al Bula", meaning: "The Lucky Swallower" },
  { name: "Caadacohot", arabic: "Sa'd al Su'ud", meaning: "The Wretched of the Wretched" },
  { name: "Caadalhacia", arabic: "Sa'd al Akhbiya", meaning: "The Lucky Hidden One" },
  { name: "Alargam", arabic: "Al Fargh al Awwal", meaning: "The First Spout" },
  { name: "Alchaa", arabic: "Al Fargh al Thani", meaning: "The Second Spout" },
  { name: "Albotham", arabic: "Al Batn al Hut", meaning: "The Belly of the Fish" },
];

const MANSION_SPAN = 360 / 28;

export function moonMansion(moonLon: number): { index: number; name: string; arabic: string; meaning: string } {
  const i = Math.floor(norm360(moonLon) / MANSION_SPAN) % 28;
  return { index: i + 1, ...MANSIONS[i] };
}

// ---------- Moon phases ----------

export interface MoonPhase {
  angle: number;        // elongation 0..360 (0 = new, 180 = full)
  illumination: number; // 0..1
  label: string;
  waxing: boolean;
}

export function moonPhase(sunLon: number, moonLon: number): MoonPhase {
  const angle = norm360(moonLon - sunLon);
  const illumination = (1 - Math.cos((angle * Math.PI) / 180)) / 2;
  const waxing = angle < 180;
  const labels: Array<[number, string]> = [
    [22.5, waxing ? "New Moon" : "Full Moon"],
    [67.5, "Waxing Crescent"],
    [112.5, "First Quarter"],
    [157.5, "Waxing Gibbous"],
    [202.5, "Full Moon"],
    [247.5, "Waning Gibbous"],
    [292.5, "Last Quarter"],
    [337.5, "Waning Crescent"],
    [360, "New Moon"],
  ];
  const label = labels.find(([lim]) => angle < lim)?.[1] ?? "New Moon";
  return { angle, illumination, label, waxing };
}
