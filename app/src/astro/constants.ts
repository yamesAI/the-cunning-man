// Glyphs, colors and labels in the traditional Renaissance / Solar-Fire style.

export const SIGNS = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
] as const;
export type SignKey = (typeof SIGNS)[number];

export const SIGN_GLYPH: Record<SignKey, string> = {
  aries: "♈", taurus: "♉", gemini: "♊", cancer: "♋", leo: "♌", virgo: "♍",
  libra: "♎", scorpio: "♏", sagittarius: "♐", capricorn: "♑", aquarius: "♒", pisces: "♓",
};

export const SIGN_LABEL: Record<SignKey, string> = {
  aries: "Aries", taurus: "Taurus", gemini: "Gemini", cancer: "Cancer",
  leo: "Leo", virgo: "Virgo", libra: "Libra", scorpio: "Scorpio",
  sagittarius: "Sagittarius", capricorn: "Capricorn", aquarius: "Aquarius", pisces: "Pisces",
};

// Sign colours used by Solar Fire: fire red, earth green/brown, air yellow-orange, water blue
export const SIGN_COLOR: Record<SignKey, string> = {
  aries: "#c0392b", leo: "#c0392b", sagittarius: "#c0392b",
  taurus: "#1e8449", virgo: "#1e8449", capricorn: "#1e8449",
  gemini: "#b9770e", libra: "#b9770e", aquarius: "#b9770e",
  cancer: "#2471a3", scorpio: "#2471a3", pisces: "#2471a3",
};

export const PLANETS = [
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
  "uranus", "neptune", "pluto",
] as const;
export type PlanetKey = (typeof PLANETS)[number];

export const CLASSICAL_PLANETS: PlanetKey[] = [
  "saturn", "jupiter", "mars", "sun", "venus", "mercury", "moon",
]; // Chaldean order

export const PLANET_GLYPH: Record<PlanetKey, string> = {
  sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂",
  jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇",
};

export const PLANET_LABEL: Record<PlanetKey, string> = {
  sun: "Sun", moon: "Moon", mercury: "Mercury", venus: "Venus", mars: "Mars",
  jupiter: "Jupiter", saturn: "Saturn", uranus: "Uranus", neptune: "Neptune", pluto: "Pluto",
};

// Planet colours matching the reference printout
export const PLANET_COLOR: Record<PlanetKey, string> = {
  sun: "#e67e22", moon: "#5dade2", mercury: "#28b463", venus: "#17a589",
  mars: "#cb4335", jupiter: "#7d3c98", saturn: "#5d6d7e",
  uranus: "#148f77", neptune: "#2e4053", pluto: "#884ea0",
};

export const ASPECT_GLYPH: Record<string, string> = {
  conjunction: "☌", opposition: "☍", trine: "△", square: "□",
  sextile: "⚹", quincunx: "⚻", "semi-square": "∠", "semi-sextile": "⚺",
  quintile: "Q", septile: "S",
};
