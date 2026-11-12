// Route structured data (schema.org JSON-LD) and canonical URLs — SCHEMA-001 §3.
// One place for every route so url, canonical and @type stay in step.
// Rules: no Offer / price / MonetaryAmount anywhere (free tools use
// isAccessibleForFree); press items, including trading-clock, are Article,
// not NewsArticle (owner 2026-11-12 09:05). Unknown paths and slugs get no
// route JSON-LD. No publisher/creator. Visible disclaimers live in the page,
// not here (schema.org has no disclaimer property).

import { PRESS } from "./press";
import {
  LIBRARY_BOOKS, LIBRARY_DESCRIPTION, LIBRARY_PATH, LIBRARY_TERMS, LIBRARY_TITLE, TERM_SET_NAME,
  type FacetCode,
} from "./library";

export const SITE_ORIGIN = "https://cunning-man.vercel.app";
export const SITE_NAME = "The Cunning Man";

type Json = Record<string, unknown>;

const IS_PART_OF: Json = { "@type": "WebSite", name: SITE_NAME, url: `${SITE_ORIGIN}/` };

export function absUrl(path: string): string {
  return path === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`;
}

function base(type: string, path: string, name: string, description: string): Json {
  return {
    "@context": "https://schema.org",
    "@type": type,
    name,
    url: absUrl(path),
    description,
    isPartOf: IS_PART_OF,
    inLanguage: "en",
  };
}

function webApp(path: string, name: string, description: string, featureList?: string[]): Json {
  return {
    ...base("WebApplication", path, name, description),
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Any (web browser)",
    isAccessibleForFree: true,
    ...(featureList ? { featureList } : {}),
  };
}

const MONTHS: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
};

/** "September 1, 2026" -> "2026-09-01"; null if the display date is not in that form. */
export function isoDate(display: string): string | null {
  const m = /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/.exec(display.trim());
  if (!m) return null;
  const mm = MONTHS[m[1].toLowerCase()];
  const day = Number(m[2]);
  if (!mm || day < 1 || day > 31) return null;
  return `${m[3]}-${mm}-${String(day).padStart(2, "0")}`;
}

const FAQ: Json[] = [
  {
    "@type": "Question",
    name: "What is The Cunning Man?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "A free public grimoire of the old village arts: Renaissance astrology, chaos magic, and the Elder Futhark runes, computed live and honest in the browser. No coin asked, no account, no gate.",
    },
  },
  {
    "@type": "Question",
    name: "Are the tools really free?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "All instruments are free of charge. Natal figures stay in your own browser; nothing is sold and no reading is charged for.",
    },
  },
  {
    "@type": "Question",
    name: "What tradition does the astrology follow?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "The art of Lilly and the masters of the shield chart: tropical zodiac, Regiomontanus houses, essential dignities with Egyptian terms, planetary days and hours, and elections for the fit moment.",
    },
  },
];

// LIB-001 §4: /library is a CollectionPage whose mainEntity is an ItemList of
// metadata-only Books (the works data/tradition.ts already cites) and whose
// hasPart is the facet DefinedTermSet. Not schema.org Library/LibrarySystem;
// no invented types. Books carry author/translator as Person with name only.
const LIBRARY_URL = absUrl(LIBRARY_PATH);
const TERM_SET_REF: Json = { "@type": "DefinedTermSet", name: TERM_SET_NAME, url: `${LIBRARY_URL}#facets` };

function termUrl(code: FacetCode): string {
  return `${LIBRARY_URL}#term-${code}`;
}

function termRef(code: FacetCode): Json {
  const t = LIBRARY_TERMS.find((x) => x.code === code)!;
  return { "@type": "DefinedTerm", name: t.name, termCode: t.code, url: termUrl(t.code) };
}

function libraryPage(): Json {
  return {
    ...base("CollectionPage", LIBRARY_PATH, LIBRARY_TITLE, LIBRARY_DESCRIPTION),
    isAccessibleForFree: true,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: LIBRARY_BOOKS.length,
      itemListElement: LIBRARY_BOOKS.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Book",
          name: b.title,
          description: b.note,
          url: b.url,
          inLanguage: "en",
          isAccessibleForFree: true,
          keywords: termRef(b.facet),
          author: { "@type": "Person", name: b.author },
          ...(b.translator ? { translator: { "@type": "Person", name: b.translator } } : {}),
          datePublished: String(b.year),
        },
      })),
    },
    hasPart: {
      ...TERM_SET_REF,
      inLanguage: "en",
      isAccessibleForFree: true,
      isPartOf: IS_PART_OF,
      hasDefinedTerm: LIBRARY_TERMS.map((t) => ({
        "@type": "DefinedTerm",
        name: t.name,
        description: t.definition,
        termCode: t.code,
        url: termUrl(t.code),
        inDefinedTermSet: TERM_SET_REF,
      })),
    },
  };
}

/** Exact known static paths -> JSON-LD. Lower-case, no trailing slash. */
const STATIC: Record<string, () => Json> = {
  "/": () => ({
    ...base(
      "FAQPage",
      "/",
      "The Cunning Man — Free Renaissance Astrology, Chaos Magic & Rune Tools",
      "Free cunning-man arts online: a live Renaissance astrological clock, synastry meter, launch elections, chaos sigil engine, rune casting, and traditional spells for love and money."
    ),
    mainEntity: FAQ,
  }),
  "/clock": () =>
    webApp(
      "/clock",
      "The Cunning Man — Shield Astrological Clock",
      "A living Renaissance shield chart: Ascendant, houses, essential dignities, planetary hours, Moon, and the live aspectarian, recomputed every second for your horizon."
    ),
  // SKY-001 §5: WebApplication, free, featureList limited to these three; no
  // Offer, no result CreativeWork in v0.
  "/sky": () =>
    webApp(
      "/sky",
      "The Cunning Man — Session Sky",
      "Traditional sky for a time window you choose: essential dignities, planetary hours and the Moon, computed in your browser. For entertainment and study.",
      ["Essential dignities", "Planetary hours", "Moon phase, sign and mansion"]
    ),
  "/natal": () =>
    webApp(
      "/natal",
      "The Cunning Man — Natal Chart & Live Transits",
      "Cast your natal chart by the traditional art and watch the living sky aspect it: exact transits, applying and separating, with testimony from Lilly, Ptolemy and the tradition. The figure stays in your browser."
    ),
  "/synastry": () =>
    webApp(
      "/synastry",
      "The Cunning Man — Synastry Meter",
      "Cast two birth charts and read their sympathy the old way: Sun, Moon, Venus, Mars and the Ascendant weighed into one synastry score."
    ),
  "/launches": () =>
    webApp(
      "/launches",
      "The Cunning Man — Launch Elections",
      "Traditional electional astrology for study and entertainment: a scanner that names the strongest electional moment in the next 7 days."
    ),
  "/sigil": () =>
    webApp(
      "/sigil",
      "The Cunning Man — Sigil Engine",
      "The Austin Spare method, automated: write your intention, strike the vowels, keep each letter once, and the engine draws your sigil."
    ),
  "/runes": () =>
    webApp(
      "/runes",
      "The Cunning Man — Rune Cast",
      "Cast the Elder Futhark runes: a single lot for a quick answer, or the three-Norn spread of what has been, what is, and what may come."
    ),
  "/spells/love": () => ({
    ...base(
      "WebPage",
      "/spells/love",
      "The Cunning Man — The Love Working",
      "A traditional love working timed by the hour of Venus: candle, rune, and chaos sigil method, with the next Venus hours computed live for your place."
    ),
    about: "traditional love working",
  }),
  "/spells/money": () =>
    base(
      "WebPage",
      "/spells/money",
      "The Cunning Man — The Money Working",
      "A traditional money working timed by the hour of Jupiter: candle, rune, and chaos sigil method, with the next Jupiter hours computed live for your place."
    ),
  "/press": () => ({
    ...base(
      "CollectionPage",
      "/press",
      "Press Releases — The Cunning Man",
      "Press releases from The Cunning Man: free Renaissance astrology, chaos magic, and rune tools."
    ),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: PRESS.length,
      itemListElement: PRESS.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absUrl(`/press/${p.slug}`),
        name: p.title,
      })),
    },
  }),
  [LIBRARY_PATH]: libraryPage,
};

/** Normalise a location pathname for lookup: strip trailing slashes. */
function norm(pathname: string): string {
  const p = pathname.replace(/\/+$/, "");
  return p === "" ? "/" : p;
}

export interface RouteHead {
  /** Absolute canonical URL for the content this path renders. */
  canonical: string;
  /** Route JSON-LD, or null when the path or slug is unknown. */
  jsonLd: Json | null;
}

export function routeHead(pathname: string): RouteHead {
  const p = norm(pathname);
  const key = p.toLowerCase();
  if (STATIC[key]) return { canonical: absUrl(key), jsonLd: STATIC[key]() };

  const m = /^\/press\/([^/]+)$/i.exec(p);
  if (m) {
    // Slug match is exact, as in PressRelease.tsx.
    const item = PRESS.find((x) => x.slug === m[1]);
    if (!item) {
      // Unknown slug: the page falls back to PRESS[0]; point canonical at that
      // content but emit no Article (never inherit another item's JSON-LD).
      return { canonical: absUrl(`/press/${PRESS[0].slug}`), jsonLd: null };
    }
    const canonical = absUrl(`/press/${item.slug}`);
    const date = isoDate(item.date);
    return {
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: item.title,
        name: item.title,
        description: item.excerpt,
        ...(date ? { datePublished: date } : {}),
        url: canonical,
        isPartOf: IS_PART_OF,
        inLanguage: "en",
      },
    };
  }

  // Unknown path: the catch-all renders the home content; canonical is the
  // root, and no FAQPage or other route JSON-LD is emitted.
  return { canonical: absUrl("/"), jsonLd: null };
}
