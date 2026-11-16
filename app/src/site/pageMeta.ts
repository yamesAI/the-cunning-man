// Per-route <title> and meta description (QC-SITE-001 M-3, M-4, m-1). One table
// for the pages, RouteHead (og/twitter tags) and the build-time pre-render.

import { PRESS } from "./press";
import { LIBRARY_DESCRIPTION, LIBRARY_PATH, LIBRARY_TITLE, bookFromPath, bookPageDescription, bookPageName } from "./library";
import { DIGNITIES_DESCRIPTION, DIGNITIES_PATH, DIGNITIES_TITLE, planetFromPath, planetPageDescription, planetPageName } from "./dignities";
import { CHARTS_DESCRIPTION, CHARTS_PATH, CHARTS_TITLE, figureFromPath, figurePageDescription, figurePageName } from "./charts";
import { ARTICLES_DESCRIPTION, ARTICLES_PATH, ARTICLES_TITLE, articleFromPath } from "./articles";
import {
  ABOUT_DESCRIPTION, ABOUT_PATH, ABOUT_TITLE, CONTACT_DESCRIPTION, CONTACT_PATH, CONTACT_TITLE,
  NOT_FOUND_DESCRIPTION, NOT_FOUND_TITLE, PRIVACY_DESCRIPTION, PRIVACY_PATH, PRIVACY_TITLE,
} from "./info";

export interface PageMeta {
  title: string;
  description: string;
}

export const STATIC_META = {
  "/": {
    title: "The Cunning Man — Free Renaissance Astrology, Chaos Magic & Rune Tools",
    description: "Free cunning-man arts online: a live Renaissance astrological clock, synastry meter, launch elections, chaos sigil engine, rune casting, and traditional spells for love and money.",
  },
  "/clock": {
    title: "Shield Astrological Clock — The Cunning Man",
    description: "A living Renaissance shield chart: Ascendant, houses, essential dignities, planetary hours, Moon, and the live aspectarian, recomputed every second for your horizon.",
  },
  "/sky": {
    title: "The Cunning Man — Session Sky",
    description: "Traditional sky for a time window you choose: essential dignities, planetary hours and the Moon, computed in your browser. For entertainment and study.",
  },
  "/natal": {
    title: "Natal Chart & Live Transits — The Cunning Man",
    description: "Cast your natal chart by the old art and watch the living sky aspect it: exact transits, applying and separating, with testimony from Lilly, Ptolemy, Bonatti and the tradition.",
  },
  "/synastry": {
    title: "Free Synastry Meter — Relationship Compatibility by Renaissance Astrology",
    description: "Cast two birth charts and read their sympathy the old way: Sun, Moon, Venus, Mars and the Ascendant weighed into one synastry score, free.",
  },
  "/launches": {
    title: "Free Launch Elections — Elect the Hour to Begin a Venture",
    description: "Electional astrology scanner: find the strongest moment in the next 7 days to launch a business, sign a contract, publish, or open a venture — free.",
  },
  "/sigil": {
    title: "Free Chaos Sigil Engine — Turn an Intention into a Sigil",
    description: "The Austin Spare method, automated: write your intention, strike the vowels, keep each letter once, and the engine draws your sigil. Free chaos magic tool.",
  },
  "/runes": {
    title: "Free Rune Cast — Elder Futhark Rune Reading Online",
    description: "Cast the Elder Futhark runes free: a single lot for a quick answer, or the three-Norn spread of what has been, what is, and what may come.",
  },
  "/spells/love": {
    title: "Free Love Spell Timing — Venus Hours, Runes & Sigils",
    description: "A traditional love working timed by the hour of Venus: candle, rune, and chaos sigil method, with the next fit Venus hours computed live for your place.",
  },
  "/spells/money": {
    title: "Free Money Spell Timing — Jupiter Hours, Runes & Sigils",
    description: "A traditional prosperity working timed by the hour of Jupiter: candle, rune, and chaos sigil method, with the next fit Jupiter hours computed live for your place.",
  },
  "/press": {
    title: "Press Releases — The Cunning Man",
    description: "Press releases from The Cunning Man: free Renaissance astrology, chaos magic, and rune tools — launch news, the astrological clock, synastry meter, sigil engine, and rune cast.",
  },
  [LIBRARY_PATH]: { title: LIBRARY_TITLE, description: LIBRARY_DESCRIPTION },
  [DIGNITIES_PATH]: { title: DIGNITIES_TITLE, description: DIGNITIES_DESCRIPTION },
  [CHARTS_PATH]: { title: CHARTS_TITLE, description: CHARTS_DESCRIPTION },
  [ARTICLES_PATH]: { title: ARTICLES_TITLE, description: ARTICLES_DESCRIPTION },
  [ABOUT_PATH]: { title: ABOUT_TITLE, description: ABOUT_DESCRIPTION },
  [CONTACT_PATH]: { title: CONTACT_TITLE, description: CONTACT_DESCRIPTION },
  [PRIVACY_PATH]: { title: PRIVACY_TITLE, description: PRIVACY_DESCRIPTION },
} satisfies Record<string, PageMeta>;

export const NOT_FOUND_META: PageMeta = { title: NOT_FOUND_TITLE, description: NOT_FOUND_DESCRIPTION };

/**
 * Title and description for a pathname, matching what the page renders:
 * known pages get their own, section misses get their index's, and anything
 * else gets the not-found pair.
 */
export function pageMeta(pathname: string): PageMeta {
  const p = pathname.replace(/\/+$/, "") || "/";
  const key = p.toLowerCase() as keyof typeof STATIC_META;
  if (STATIC_META[key]) return STATIC_META[key];
  const press = /^\/press\/([^/]+)$/.exec(p);
  if (press) {
    const item = PRESS.find((x) => x.slug === press[1]);
    return item ? { title: `${item.title} — The Cunning Man`, description: item.excerpt } : NOT_FOUND_META;
  }
  if (/^\/charts\//i.test(p)) {
    const f = figureFromPath(p);
    return f ? { title: figurePageName(f), description: figurePageDescription(f) } : STATIC_META[CHARTS_PATH];
  }
  if (/^\/articles\//i.test(p)) {
    const a = articleFromPath(p);
    return a ? { title: `${a.title} — The Cunning Man`, description: a.summary } : STATIC_META[ARTICLES_PATH];
  }
  if (/^\/dignities\//i.test(p)) {
    const c = planetFromPath(p);
    return c ? { title: planetPageName(c.name), description: planetPageDescription(c) } : STATIC_META[DIGNITIES_PATH];
  }
  if (/^\/library\//i.test(p)) {
    const b = bookFromPath(p);
    return b ? { title: bookPageName(b.title), description: bookPageDescription(b) } : STATIC_META[LIBRARY_PATH];
  }
  return NOT_FOUND_META;
}
