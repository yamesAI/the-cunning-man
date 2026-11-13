// Library catalog (LIB-001 v0, CEO D-1–D-5 2026-11-12 10:25).
// A study collection, not a lending library. v0 lists only the four historical
// works the hub already cites in data/tradition.ts, as metadata-only entries
// with the same verification URLs. Child routes /library/<id> reopen LIB-001 D-5
// (HUB-PAGES-001 D-1). No full text is hosted here. Not press
// items (D-4); "AI vs the Sky" stays the footer download, not a catalog item
// (D-2). Lives in src/site/, never src/lib/ (D-1).

export const LIBRARY_PATH = "/library";
export const LIBRARY_TITLE = "The Cunning Man — Library";
export const LIBRARY_SUBTITLE =
  "A study collection of the old sources behind these arts, not a lending library. Each item links out to a public-domain source; no full text is hosted here.";
export const LIBRARY_DESCRIPTION =
  "A study collection of the historical astrology books cited on The Cunning Man, listed by title, author and year with links to public-domain sources. For entertainment and study.";

export function bookPath(id: string): string {
  return `${LIBRARY_PATH}/${id}`;
}

export function bookPageName(title: string): string {
  return `The Cunning Man — ${title}`;
}

export function bookPageDescription(b: Pick<LibraryBook, "title" | "author" | "translator" | "yearLabel">): string {
  const by = b.translator ? `${b.author}, trans. ${b.translator}` : b.author;
  return `${b.title} by ${by}, ${b.yearLabel}. A study page in The Cunning Man library, linking to a public-domain source. No full text is hosted here.`;
}

export type FacetCode = "esoteric" | "exoteric" | "market-study";

export interface LibraryTerm {
  code: FacetCode;
  name: string;
  definition: string;
}

// LIB-001 §6 (D-3): labels and definitions verbatim from the brief.
export const TERM_SET_NAME = "The Cunning Man library facets";
export const LIBRARY_TERMS: LibraryTerm[] = [
  {
    code: "esoteric",
    name: "esoteric",
    definition:
      "Traditional and hidden-arts sources studied as historical doctrine — astrology, magic, and the runes — offered for study and entertainment, not as a promised result.",
  },
  {
    code: "exoteric",
    name: "exoteric",
    definition:
      "Plain-language public explanations of the same tradition, written so a visitor can learn the terms without being sent a signal or a fee.",
  },
  {
    code: "market-study",
    name: "market-study",
    definition:
      "Historical and traditional sources, and firm study notes, about looking at markets or timing in a scholarly way. Not trading signals, prices, financial advice, or prop-firm claims.",
  },
];

export interface LibraryBook {
  id: string;         // anchor on /library and slug for /library/<id>
  title: string;      // schema.org Book name
  author: string;     // as named in data/tradition.ts
  translator?: string;
  year: number;       // the year field data/tradition.ts records
  yearLabel: string;  // visible year text
  note: string;       // short neutral note (visible + JSON-LD description)
  scanNote?: string;  // visible only; a dating note about the linked copy
  url: string;        // the verification URL data/tradition.ts already cites
  facet: FacetCode;
}

export const LIBRARY_BOOKS: LibraryBook[] = [
  {
    id: "christian-astrology",
    title: "Christian Astrology",
    author: "William Lilly",
    year: 1647,
    yearLabel: "1647",
    note: "William Lilly's English treatise on traditional astrology, cited on the natal page for the natures and significations of the planets.",
    url: "https://archive.org/details/ca-william-lilly",
    facet: "esoteric",
  },
  {
    id: "tetrabiblos",
    title: "Tetrabiblos",
    author: "Claudius Ptolemy",
    translator: "J. M. Ashmand",
    year: 1822,
    yearLabel: "1822 (Ashmand translation)",
    note: "Ptolemy's classical treatise on astrology in J. M. Ashmand's English translation, cited on the natal page for the natures of the planets.",
    url: "https://www.sacred-texts.com/astro/ptb/ptb07.htm",
    facet: "esoteric",
  },
  {
    id: "astrologia-restaurata",
    title: "Astrologia Restaurata",
    author: "William Ramesey",
    year: 1653,
    yearLabel: "1653",
    note: "William Ramesey's seventeenth-century English treatise on traditional astrology, cited on the natal page.",
    scanNote: "The linked scan (Wellcome copy) is dated 1654.",
    url: "https://archive.org/details/b30323149_0001",
    facet: "esoteric",
  },
  {
    id: "liber-astronomiae",
    title: "Liber Astronomiae (146 Considerations)",
    author: "Guido Bonatti",
    translator: "Henry Coley",
    year: 1676,
    yearLabel: "1676 (Coley translation)",
    note: "Guido Bonatti's 146 Considerations in Henry Coley's English translation, also cited as Anima Astrologiae; cited on the natal page.",
    scanNote: "The linked scan is dated 1886 and reproduces the 1676 title page.",
    url: "https://archive.org/details/astrologersguide00lill",
    facet: "esoteric",
  },
];

export function bookFromPath(pathname: string): LibraryBook | undefined {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (!p.startsWith(`${LIBRARY_PATH}/`)) return undefined;
  const slug = p.slice(LIBRARY_PATH.length + 1);
  return LIBRARY_BOOKS.find((b) => b.id === slug);
}
