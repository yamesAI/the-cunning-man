// Charts (R-CHARTS-001 v1.0, D-1–D-10): study pages reading public figures'
// natal charts by Lilly's essential dignities. Birth data is copied from the
// Astro-Databank wiki record of each figure (Rodden AA, A or B only, owner
// t683u/t690u). Positions, sect and dignities are never hand-entered: the page
// computes them with the hub engine (computeChart, as /natal does). Birth time
// and coordinates stay visible text only, never JSON-LD. Lives in src/site/.

import { computeChart, type ChartData } from "@/astro/engine";
import { PLANET_LABEL, SIGN_LABEL, CLASSICAL_PLANETS, type PlanetKey } from "@/astro/constants";
import type { DignityRow } from "@/astro/traditional";

export const CHARTS_PATH = "/charts";
export const CHARTS_TITLE = "The Cunning Man — Charts";
export const CHARTS_SUBTITLE =
  "Study pages that read public figures' natal charts by William Lilly's essential dignities (Christian Astrology, 1647), from Astro-Databank birth data with its Rodden rating. For study and entertainment.";
export const CHARTS_DESCRIPTION =
  "Study pages reading public figures' natal charts by Lilly's essential dignities, with Astro-Databank birth data and its Rodden rating. For entertainment and study.";
export const CHARTS_PRESS_SLUG = "charts";
/** SIM-WALK-001: one plain line for cold landings on /charts and its pages. */
export const SITE_INTRO =
  "The Cunning Man is a free site for studying Renaissance astrology: live chart tools, Lilly's tables of dignities and a library of the old sources. No account, no fee.";
/** SIM-CROWD-001: what the score column means, so a low score is not read as a verdict on the person. */
export const SCORE_NOTE =
  "Score is Lilly's point count of each planet's essential dignity: points added for its own house, exaltation, triplicity, term or face, and taken away for detriment, fall, or none of these (peregrine). It describes where the planet stands by the old rules, not the person.";

export type RoddenRating = "AA" | "A" | "B";
export const ALLOWED_RATINGS: readonly RoddenRating[] = ["AA", "A", "B"];

export interface ChartFigure {
  slug: string;            // Wikipedia title rule (§2)
  name: string;            // display name (D-6)
  wikipediaUrl: string;
  wikidataId: string;
  adbUrl: string;          // public pretty URL
  adbWikiUrl: string;      // the wiki record actually read
  birthDate: string;       // ISO date only
  birthTimeText: string;   // local clock time as Astro-Databank shows it (visible only)
  tzAbbr: string;
  utcOffsetHours: number;  // from the record's time meridian (stmerid), e.g. h8w -> -8
  placeName: string;
  placeRegion: string;
  placeType: "City" | "Place"; // D-7
  placeSameAs: string;
  latLongText: string;     // as Astro-Databank prints it (visible only)
  roddenRating: RoddenRating;
  dataSource: string;
  collector: string;
  adbLastEdit: string;
  verifiedOn: string;
  dataNote?: string;       // one plain line where the record or the read is sensitive
  patternNote?: string;    // one plain line naming an aspect pattern the engine shows (checked in check:schema)
  hook?: { sentence: string; outlet: string; date: string; url: string }; // optional "in the news" line

  pressSlug: string;
  artId: string;
}

const ADB = "https://www.astro.com/astro-databank/";
const ADB_WIKI = "https://www.astro.com/wiki/astro-databank/index.php?title=";

// Order is the page and ItemList order. Values copied from the Astro-Databank
// wiki records (action=raw), re-read 2026-11-15; they match R-CHARTS-001 §3.
export const CHART_FIGURES: ChartFigure[] = [
  {
    slug: "charles-iii",
    name: "King Charles III",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Charles_III",
    wikidataId: "Q43274",
    adbUrl: `${ADB}Charles_III,_King_of_the_United_Kingdom`,
    adbWikiUrl: `${ADB_WIKI}Charles_III,_King_of_the_United_Kingdom`,
    birthDate: "1948-11-14",
    birthTimeText: "21:14",
    tzAbbr: "GMT",
    utcOffsetHours: 0,
    placeName: "London",
    placeRegion: "England",
    placeType: "City",
    placeSameAs: "https://en.wikipedia.org/wiki/London",
    latLongText: "51n30, 0w10",
    roddenRating: "A",
    dataSource: "News report",
    collector: "Rodden",
    adbLastEdit: "2026-07-28",
    verifiedOn: "2026-11-15",
    dataNote: "Jupiter sits in the last minutes of Sagittarius, a few arc-minutes from Capricorn, where Lilly would count it in fall rather than in its own house.",
    // HUB-FIX-001 (owner 2026-11-15 16:52): the birthday news line is cut; no hook.
    pressSlug: "chart-charles-iii",
    artId: "apian-astronomicum",
  },
  {
    slug: "liza-minnelli",
    name: "Liza Minnelli",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Liza_Minnelli",
    wikidataId: "Q14441",
    adbUrl: `${ADB}Minnelli,_Liza`,
    adbWikiUrl: `${ADB_WIKI}Minnelli,_Liza`,
    birthDate: "1946-03-12",
    birthTimeText: "07:58",
    tzAbbr: "PST",
    utcOffsetHours: -8,
    placeName: "Los Angeles",
    placeRegion: "California",
    placeType: "City",
    placeSameAs: "https://en.wikipedia.org/wiki/Los_Angeles",
    latLongText: "34n03, 118w15",
    roddenRating: "AA",
    dataSource: "Quoted BC/BR",
    collector: "Rodden",
    adbLastEdit: "2025-11-16",
    verifiedOn: "2026-11-15",
    dataNote: "The Astro-Databank record also notes a 07:28 variant from a biography; this page uses the rated 07:58 time.",
    hook: {
      sentence: "She announced that her autobiography will be adapted for the screen.",
      outlet: "la Repubblica",
      date: "2026-11-14",
      url: "https://www.repubblica.it/en/entertainment/cinema/2026/11/14/news/liza_minnelli_my_life_is_made_for_the_screen_it_will_become_a_film_or_a_series-425723200/",
    },
    pressSlug: "chart-liza-minnelli",
    artId: "apian-astronomicum",
  },
  {
    slug: "billy-idol",
    name: "Billy Idol",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Billy_Idol",
    wikidataId: "Q73437",
    adbUrl: `${ADB}Idol,_Billy`,
    adbWikiUrl: `${ADB_WIKI}Idol,_Billy`,
    birthDate: "1955-11-30",
    birthTimeText: "16:00",
    tzAbbr: "GMT",
    utcOffsetHours: 0,
    placeName: "Stanmore",
    placeRegion: "England",
    placeType: "Place",
    placeSameAs: "https://en.wikipedia.org/wiki/Stanmore",
    latLongText: "51n37, 0w19",
    roddenRating: "A",
    dataSource: "From memory",
    collector: "Treindl",
    adbLastEdit: "2024-02-29",
    verifiedOn: "2026-11-15",
    dataNote: "At the remembered 16:00 the Sun stands just below the western horizon, so the sect (day or night chart) turns on a few minutes of a time given from memory.",
    hook: {
      sentence: "He is among the new Rock & Roll Hall of Fame inductees honoured at the 14 November 2026 ceremony in Los Angeles.",
      outlet: "AP brief via Tuscola Today",
      date: "2026-11-14",
      url: "https://www.tuscolatoday.com/lifestyles/ap-entertainment-summarybrief-at-12-16-a-m-est/article_0e964488-c69c-55e1-95d1-bf532241228e.html",
    },
    pressSlug: "chart-billy-idol",
    artId: "apian-astronomicum",
  },
  {
    slug: "queen-latifah",
    name: "Queen Latifah",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Queen_Latifah",
    wikidataId: "Q1112005",
    adbUrl: `${ADB}Latifah,_Queen`,
    adbWikiUrl: `${ADB_WIKI}Latifah,_Queen`,
    birthDate: "1970-03-18",
    birthTimeText: "08:02",
    tzAbbr: "EST",
    utcOffsetHours: -5,
    placeName: "Newark",
    placeRegion: "New Jersey",
    placeType: "City",
    placeSameAs: "https://en.wikipedia.org/wiki/Newark,_New_Jersey",
    latLongText: "40n44, 74w10",
    roddenRating: "AA",
    dataSource: "Quoted BC/BR",
    collector: "Rodden",
    adbLastEdit: "2024-03-26",
    verifiedOn: "2026-11-15",
    // SIM-CROWD-001 / owner 2026-11-15 16:52: the page carries the pattern the
    // planned post names (wording after SOC-CELEB-001, with its note that the
    // name is modern). check:schema confirms each aspect with the engine.
    patternNote: "The Moon in Leo squares Mars and Saturn in Taurus and Jupiter in Scorpio, and Jupiter opposes Mars and Saturn. Modern astrologers call this shape a fixed T-square; the name is modern, while squares and oppositions are classical aspects.",
    hook: {
      sentence: "She is among the new Rock & Roll Hall of Fame inductees honoured at the same 14 November 2026 ceremony.",
      outlet: "AP brief via Tuscola Today",
      date: "2026-11-14",
      url: "https://www.tuscolatoday.com/lifestyles/ap-entertainment-summarybrief-at-12-16-a-m-est/article_0e964488-c69c-55e1-95d1-bf532241228e.html",
    },
    pressSlug: "chart-queen-latifah",
    artId: "apian-astronomicum",
  },
];

export function figurePath(slug: string): string {
  return `${CHARTS_PATH}/${slug}`;
}

export function figurePageName(f: ChartFigure): string {
  return `The Cunning Man — Chart of ${f.name}`;
}

export function figurePageDescription(f: ChartFigure): string {
  return `A study page reading ${f.name}'s natal chart by Lilly's essential dignities, from Astro-Databank birth data rated ${f.roddenRating}. For entertainment and study.`;
}

/** Exact lowercase /charts/<slug> only; anything else is a miss. */
export function figureFromPath(pathname: string): ChartFigure | undefined {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (!p.startsWith(`${CHARTS_PATH}/`)) return undefined;
  const slug = p.slice(CHARTS_PATH.length + 1);
  return CHART_FIGURES.find((f) => f.slug === slug);
}

/** Astro-Databank "51n30" / "0w10" -> signed decimal degrees. */
export function parseAdbCoord(s: string): number {
  const m = /^(\d+)([nsew])(\d{2})$/.exec(s.trim());
  if (!m) throw new Error(`bad Astro-Databank coordinate ${s}`);
  const v = Number(m[1]) + Number(m[3]) / 60;
  return m[2] === "s" || m[2] === "w" ? -v : v;
}

export function birthInstant(f: ChartFigure): Date {
  const [h, min] = f.birthTimeText.split(":").map(Number);
  const [y, mo, d] = f.birthDate.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h - f.utcOffsetHours, min));
}

/** Engine chart for the figure (same computeChart call as /natal). */
export function figureChart(f: ChartFigure): ChartData {
  const [lat, lng] = f.latLongText.split(",").map(parseAdbCoord);
  return computeChart(birthInstant(f), lat, lng);
}

/** Lilly's terms for one planet's essential condition, from dignity(). */
export function conditionText(d: DignityRow, sect: "day" | "night"): string {
  const bits: string[] = [];
  if (d.ruler) bits.push("in its own house");
  if (d.exalt) bits.push("in its exaltation");
  if (d.tripActive) bits.push(`ruler of the triplicity by ${sect}`);
  if (d.term === d.planet) bits.push("in its own term");
  if (d.face === d.planet) bits.push("in its own face");
  if (d.detriment) bits.push("in its detriment");
  if (d.fall) bits.push("in its fall");
  if (d.peregrine) bits.push("peregrine");
  if (bits.length === 0) bits.push("no essential dignity of its own");
  return bits.join("; ");
}

export interface PlanetRead {
  key: PlanetKey;
  name: string;
  position: string;
  condition: string;
  term: string;
  face: string;
  score: number;
}

export interface AspectRead {
  p1: PlanetKey;
  p2: PlanetKey;
  aspectKey: string;
  orb: number;
}

/** Major aspects between the seven traditional planets, from the engine's aspectarian. */
export function figureAspects(chart: ChartData): AspectRead[] {
  const seven = new Set<PlanetKey>(CLASSICAL_PLANETS);
  return chart.aspectsGrid
    .filter((a) => seven.has(a.p1) && seven.has(a.p2))
    .map((a) => ({ p1: a.p1, p2: a.p2, aspectKey: a.aspectKey, orb: a.orb }));
}

export function figureReads(chart: ChartData): PlanetRead[] {
  return CLASSICAL_PLANETS.map((key) => {
    const b = chart.bodies.find((x) => x.key === key)!;
    const d = chart.dignities.find((x) => x.planet === key)!;
    return {
      key,
      name: PLANET_LABEL[key],
      position: `${b.deg}°${String(b.min).padStart(2, "0")}′ ${SIGN_LABEL[b.sign]}`,
      condition: conditionText(d, chart.sect),
      term: PLANET_LABEL[d.term],
      face: PLANET_LABEL[d.face],
      score: d.score,
    };
  });
}
