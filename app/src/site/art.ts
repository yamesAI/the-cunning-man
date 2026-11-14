// HUB-ART-001 v1.0: self-hosted PD/CC0 page stills, credits, and art siblings.
// Files live in app/public/art/. No art on /library or book pages (D-5).
// dateCreated is the artwork date from the source only, never an upload time (D-7).

export const CC0_DEED = "https://creativecommons.org/publicdomain/zero/1.0/deed.en";
export const CC0_LICENSE = "https://creativecommons.org/publicdomain/zero/1.0/";
export const PD_MARK = "https://creativecommons.org/publicdomain/mark/1.0/";

export type ArtLicenseKind = "CC0" | "PD-old" | "PD-old-100" | "PD-old-100-1923";

export interface ArtWork {
  id: string;
  file: string;
  title: string;
  artist: string;
  /** Visible date as the source states it; omitted for the NGA Beham planets (D-7). */
  dateText?: string;
  /** Artwork date only, never an upload timestamp. */
  dateCreated?: string;
  licenseKind: ArtLicenseKind;
  license: string;
  acquireLicensePage: string;
  sourceRecord: string;
  creditNote: string;
  periodNote?: string;
  alt: string;
}

const NGA = (id: string) => `https://purl.org/nga/collection/artobject/${id}`;
const COMMONS = (file: string) => `https://commons.wikimedia.org/wiki/File:${file}`;
const MET = (id: string) => `https://www.metmuseum.org/art/collection/search/${id}`;
const NGA_CREDIT = "Open Access donation, National Gallery of Art, Washington.";

function behamPlanet(id: string, file: string, title: string, nga: string): ArtWork {
  return {
    id,
    file,
    title,
    artist: "Sebald Beham",
    licenseKind: "CC0",
    license: CC0_LICENSE,
    acquireLicensePage: CC0_DEED,
    sourceRecord: NGA(nga),
    creditNote: NGA_CREDIT,
    alt: `Sebald Beham engraving of ${title}, National Gallery of Art.`,
  };
}

export const ART_WORKS: Record<string, ArtWork> = {
  "beham-saturn": behamPlanet("beham-saturn", "beham-saturn.webp", "Saturn, from The Seven Planets", "4279"),
  "beham-jupiter": behamPlanet("beham-jupiter", "beham-jupiter.webp", "Jupiter, from The Seven Planets", "4280"),
  "beham-mars": behamPlanet("beham-mars", "beham-mars.webp", "Mars, from The Seven Planets", "4281"),
  "beham-sol": behamPlanet("beham-sol", "beham-sol.webp", "Sol, from The Seven Planets", "4282"),
  "beham-venus": behamPlanet("beham-venus", "beham-venus.webp", "Venus, from The Seven Planets", "4283"),
  "beham-mercury": behamPlanet("beham-mercury", "beham-mercury.webp", "Mercury, from The Seven Planets", "4284"),
  "beham-luna": behamPlanet("beham-luna", "beham-luna.webp", "Luna, from The Seven Planets", "4285"),
  "beham-astrologia": {
    id: "beham-astrologia",
    file: "beham-astrologia.webp",
    title: 'Astrologia, from "The Seven Liberal Arts"',
    artist: "Sebald Beham",
    dateText: "first half of the 16th century",
    licenseKind: "CC0",
    license: CC0_LICENSE,
    acquireLicensePage: CC0_DEED,
    sourceRecord: MET("416541"),
    creditNote: "The Elisha Whittelsey Collection, The Elisha Whittelsey Fund, 1966.",
    alt: 'Sebald Beham engraving Astrologia, from The Seven Liberal Arts, Metropolitan Museum of Art.',
  },
  "metzger-clock": {
    id: "metzger-clock",
    file: "metzger-clock.webp",
    title: "Astronomical table clock",
    artist: "Jeremias Metzger",
    dateText: "1568, late 16th century",
    dateCreated: "1568",
    licenseKind: "CC0",
    license: CC0_LICENSE,
    acquireLicensePage: CC0_DEED,
    sourceRecord: MET("209211"),
    creditNote: "Gift of J. Pierpont Morgan, 1917.",
    periodNote: "Late Renaissance or early modern, not High Renaissance.",
    alt: "Jeremias Metzger astronomical table clock of 1568, Metropolitan Museum of Art.",
  },
  "durer-northern-hemisphere": {
    id: "durer-northern-hemisphere",
    file: "durer-northern-hemisphere.webp",
    title: "The Celestial Map, Northern Hemisphere",
    artist: "Albrecht Dürer",
    dateText: "1515",
    dateCreated: "1515",
    licenseKind: "CC0",
    license: CC0_LICENSE,
    acquireLicensePage: CC0_DEED,
    sourceRecord: MET("358366"),
    creditNote: "Harris Brisbane Dick Fund, 1951.",
    alt: "Albrecht Dürer woodcut of the northern celestial hemisphere, 1515, Metropolitan Museum of Art.",
  },
  "apian-astronomicum": {
    id: "apian-astronomicum",
    file: "apian-astronomicum.webp",
    title: "Astronomicum Caesareum",
    artist: "Petrus Apianus / Michael Ostendorfer",
    dateText: "May 1540",
    dateCreated: "1540-05",
    licenseKind: "CC0",
    license: CC0_LICENSE,
    acquireLicensePage: CC0_DEED,
    sourceRecord: MET("337061"),
    creditNote: "Gift of Herbert N. Straus, 1925.",
    alt: "Astronomicum Caesareum, Petrus Apianus and Michael Ostendorfer, May 1540, Metropolitan Museum of Art.",
  },
  "olaus-alphabet-geats": {
    id: "olaus-alphabet-geats",
    file: "olaus-alphabet-geats.webp",
    title: "The Alphabet of the Geats",
    artist: "Olaus Magnus",
    dateText: "published 1555, Historia de gentibus septentrionalibus, book 1",
    dateCreated: "1555",
    licenseKind: "PD-old",
    license: PD_MARK,
    acquireLicensePage: COMMONS("The_Alphabet_of_the_Geats.jpg"),
    sourceRecord: COMMONS("The_Alphabet_of_the_Geats.jpg"),
    creditNote: "Public-domain plate as stated on the Wikimedia Commons file (PD-old).",
    alt: "Olaus Magnus plate The Alphabet of the Geats, published 1555.",
  },
  "dee-monas": {
    id: "dee-monas",
    file: "dee-monas.webp",
    title: "Monas Hieroglyphica frontispiece",
    artist: "John Dee",
    dateText: "1564",
    dateCreated: "1564",
    licenseKind: "PD-old-100-1923",
    license: PD_MARK,
    acquireLicensePage: COMMONS("Monas_Hieroglyphica.jpg"),
    sourceRecord: COMMONS("Monas_Hieroglyphica.jpg"),
    creditNote: "Public-domain plate as stated on the Wikimedia Commons file (PD-old-100-1923).",
    alt: "John Dee Monas Hieroglyphica frontispiece, 1564.",
  },
  "cellarius-harmonia": {
    id: "cellarius-harmonia",
    file: "cellarius-harmonia.webp",
    title: "Harmonia Macrocosmica, Hypothesis Ptolemaica",
    artist: "Andreas Cellarius",
    dateText: "1661",
    dateCreated: "1661",
    licenseKind: "PD-old-100",
    license: PD_MARK,
    acquireLicensePage: COMMONS("Cellarius_Harmonia_Macrocosmica_-_Hypothesis_Ptolemaica.jpg"),
    sourceRecord: COMMONS("Cellarius_Harmonia_Macrocosmica_-_Hypothesis_Ptolemaica.jpg"),
    creditNote: "Public-domain plate as stated on the Wikimedia Commons file (PD-old-100).",
    periodNote: "Early modern, not Renaissance.",
    alt: "Andreas Cellarius Harmonia Macrocosmica plate Hypothesis Ptolemaica, 1661.",
  },
};

const BEHAM_PLANETS = [
  "/dignities/saturn", "/dignities/jupiter", "/dignities/mars", "/dignities/sun",
  "/dignities/venus", "/dignities/mercury", "/dignities/moon",
];

export interface ArtAssignment {
  path: string;
  artId: string;
  siblings: string[];
  about: string[];
}

const ORIGIN = "https://cunning-man.vercel.app";

function assignment(path: string, artId: string, siblings: string[], about: string[]): ArtAssignment {
  return { path, artId, siblings, about };
}

// /spells parent is not in this tree, so it is omitted from sibling lists (open note).
export const ART_ASSIGNMENTS: ArtAssignment[] = [
  assignment("/", "beham-astrologia", ["/dignities", "/press", "/press/launch"], [`${ORIGIN}/`]),
  assignment("/dignities", "beham-astrologia", ["/", "/press", "/press/launch"], [`${ORIGIN}/dignities`]),
  assignment("/dignities/saturn", "beham-saturn", BEHAM_PLANETS.filter((p) => p !== "/dignities/saturn"), [`${ORIGIN}/dignities/saturn`, `${ORIGIN}/dignities#saturn`]),
  assignment("/dignities/jupiter", "beham-jupiter", [...BEHAM_PLANETS.filter((p) => p !== "/dignities/jupiter"), "/spells/money"], [`${ORIGIN}/dignities/jupiter`, `${ORIGIN}/dignities#jupiter`]),
  assignment("/dignities/mars", "beham-mars", BEHAM_PLANETS.filter((p) => p !== "/dignities/mars"), [`${ORIGIN}/dignities/mars`, `${ORIGIN}/dignities#mars`]),
  assignment("/dignities/sun", "beham-sol", BEHAM_PLANETS.filter((p) => p !== "/dignities/sun"), [`${ORIGIN}/dignities/sun`, `${ORIGIN}/dignities#sun`]),
  assignment("/dignities/venus", "beham-venus", [...BEHAM_PLANETS.filter((p) => p !== "/dignities/venus"), "/spells/love"], [`${ORIGIN}/dignities/venus`, `${ORIGIN}/dignities#venus`]),
  assignment("/dignities/mercury", "beham-mercury", BEHAM_PLANETS.filter((p) => p !== "/dignities/mercury"), [`${ORIGIN}/dignities/mercury`, `${ORIGIN}/dignities#mercury`]),
  assignment("/dignities/moon", "beham-luna", BEHAM_PLANETS.filter((p) => p !== "/dignities/moon"), [`${ORIGIN}/dignities/moon`, `${ORIGIN}/dignities#moon`]),
  assignment("/clock", "metzger-clock", ["/press/trading-clock"], [`${ORIGIN}/clock`]),
  assignment("/press/trading-clock", "metzger-clock", ["/clock"], [`${ORIGIN}/press/trading-clock`]),
  assignment("/sky", "durer-northern-hemisphere", [], [`${ORIGIN}/sky`]),
  assignment("/natal", "apian-astronomicum", ["/launches"], [`${ORIGIN}/natal`]),
  assignment("/launches", "apian-astronomicum", ["/natal"], [`${ORIGIN}/launches`]),
  assignment("/synastry", "cellarius-harmonia", ["/press/synastry-meter"], [`${ORIGIN}/synastry`]),
  assignment("/press/synastry-meter", "cellarius-harmonia", ["/synastry"], [`${ORIGIN}/press/synastry-meter`]),
  assignment("/sigil", "dee-monas", ["/press/sigil-engine"], [`${ORIGIN}/sigil`]),
  assignment("/press/sigil-engine", "dee-monas", ["/sigil"], [`${ORIGIN}/press/sigil-engine`]),
  assignment("/runes", "olaus-alphabet-geats", ["/press/rune-cast"], [`${ORIGIN}/runes`]),
  assignment("/press/rune-cast", "olaus-alphabet-geats", ["/runes"], [`${ORIGIN}/press/rune-cast`]),
  assignment("/spells/love", "beham-venus", ["/dignities/venus", ...BEHAM_PLANETS.filter((p) => p !== "/dignities/venus")], [`${ORIGIN}/spells/love`]),
  assignment("/spells/money", "beham-jupiter", ["/dignities/jupiter", ...BEHAM_PLANETS.filter((p) => p !== "/dignities/jupiter")], [`${ORIGIN}/spells/money`]),
  assignment("/press", "beham-astrologia", ["/", "/dignities", "/press/launch"], [`${ORIGIN}/press`]),
  assignment("/press/launch", "beham-astrologia", ["/", "/dignities", "/press"], [`${ORIGIN}/press/launch`]),
];

const BY_PATH = new Map(ART_ASSIGNMENTS.map((a) => [a.path, a]));

export function creditText(work: ArtWork): string {
  const bits = [work.title, work.artist];
  if (work.dateText) bits.push(work.dateText);
  bits.push(work.licenseKind);
  if (work.periodNote) bits.push(work.periodNote);
  bits.push(work.creditNote);
  return bits.join(", ");
}

export function contentPath(work: ArtWork): string {
  return `/art/${work.file}`;
}

export const SHIPPED_FILES = new Set<string>([
  "apian-astronomicum.webp",
  "beham-astrologia.webp",
  "beham-jupiter.webp",
  "beham-luna.webp",
  "beham-mars.webp",
  "beham-mercury.webp",
  "beham-saturn.webp",
  "beham-sol.webp",
  "beham-venus.webp",
  "cellarius-harmonia.webp",
  "dee-monas.webp",
  "durer-northern-hemisphere.webp",
  "metzger-clock.webp",
  "olaus-alphabet-geats.webp",
]);

/** Exact path after trailing-slash normalisation. No art on library routes (D-5). */
export function artForPath(pathname: string): { work: ArtWork; assignment: ArtAssignment } | null {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/library" || p.startsWith("/library/")) return null;
  const assignment = BY_PATH.get(p);
  if (!assignment) return null;
  const work = ART_WORKS[assignment.artId];
  if (!work || !SHIPPED_FILES.has(work.file)) return null;
  return { work, assignment };
}

export const ART_ASSIGNMENT_PATHS = ART_ASSIGNMENTS.map((a) => a.path);
