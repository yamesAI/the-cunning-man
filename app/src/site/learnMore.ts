// HUB-ART-001 §6.1 sample only: accepted mapped learn-more links.
// Full-corpus mapping is a later Research pass (D-8). No sickness links.
// sameAs is attached only on existing Occupation, Country or City nodes —
// herbs, animals and stones stay visible text (no Plant/Animal/Taxon/Drug/Medical* types).

export type LearnMoreKind = "place" | "occupation" | "animal" | "stone" | "plant";

export interface LearnMoreRow {
  /** Lilly spelling as it appears (or the sample's term). */
  term: string;
  kind: LearnMoreKind;
  entity: string;
  url: string;
  /** Attach schema.org sameAs on an existing Occupation/Country/City node. */
  sameAs: boolean;
}

const WD = (q: string) => `https://www.wikidata.org/wiki/${q}`;
const GBIF = (id: string) => `https://www.gbif.org/species/${id}`;

export const LEARN_MORE: LearnMoreRow[] = [
  { term: "Italy", kind: "place", entity: "Italy", url: WD("Q38"), sameAs: true },
  { term: "Paris", kind: "place", entity: "Paris", url: WD("Q90"), sameAs: true },
  { term: "Vienna", kind: "place", entity: "Vienna", url: WD("Q1741"), sameAs: true },
  { term: "Austria", kind: "place", entity: "Austria", url: WD("Q40"), sameAs: true },
  { term: "Cyprus", kind: "place", entity: "Cyprus", url: WD("Q229"), sameAs: true },
  { term: "Denmarke", kind: "place", entity: "Denmark", url: WD("Q35"), sameAs: true },
  { term: "Judges", kind: "occupation", entity: "judge", url: WD("Q16533"), sameAs: true },
  { term: "Priests", kind: "occupation", entity: "priest", url: WD("Q42603"), sameAs: true },
  { term: "Carpenters", kind: "occupation", entity: "carpenter", url: WD("Q154549"), sameAs: true },
  { term: "Goldsmiths", kind: "occupation", entity: "goldsmith", url: WD("Q211423"), sameAs: true },
  { term: "Poets", kind: "occupation", entity: "poet", url: WD("Q49757"), sameAs: true },
  // Sample row "Soldiers"; the Lilly catalog spells it "Souldiers".
  { term: "Souldiers", kind: "occupation", entity: "soldier", url: WD("Q4991371"), sameAs: true },
  { term: "Elephant", kind: "animal", entity: "elephant", url: WD("Q7378"), sameAs: false },
  { term: "Hare", kind: "animal", entity: "hare", url: WD("Q46076"), sameAs: false },
  { term: "Peacock", kind: "animal", entity: "peafowl", url: WD("Q201251"), sameAs: false },
  { term: "Saphire", kind: "stone", entity: "sapphire", url: WD("Q127583"), sameAs: false },
  { term: "Amethist", kind: "stone", entity: "amethyst", url: WD("Q79058"), sameAs: false },
  { term: "Lapis Lazuli", kind: "stone", entity: "lapis lazuli", url: WD("Q216798"), sameAs: false },
  { term: "Hemlock", kind: "plant", entity: "Conium maculatum", url: GBIF("3034807"), sameAs: false },
  { term: "Henbane", kind: "plant", entity: "Hyoscyamus niger", url: GBIF("2928978"), sameAs: false },
  { term: "Yew", kind: "plant", entity: "Taxus baccata", url: GBIF("5284517"), sameAs: false },
  { term: "Rue", kind: "plant", entity: "Ruta graveolens", url: GBIF("3190382"), sameAs: false },
  { term: "Borage", kind: "plant", entity: "Borago officinalis", url: GBIF("2926110"), sameAs: false },
];

const BY_TERM = new Map(LEARN_MORE.map((r) => [r.term, r]));

export function learnMoreForName(name: string): LearnMoreRow | undefined {
  return BY_TERM.get(name);
}

function appears(term: string, hay: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![A-Za-z])${escaped}(?![A-Za-z])`).test(hay);
}

export function learnMoreInText(text: string): LearnMoreRow[] {
  return LEARN_MORE.filter((r) => appears(r.term, text));
}

/** Lilly list headings for trades and stations — not "Names" or manners prose. */
export function isOccupationOrProfessionHeading(heading: string): boolean {
  const h = heading.toLowerCase();
  return /\bprofession/.test(h) || h.includes("quality of men") || h.includes("men and their quality") || h === "qualities of men and women";
}

export interface LearnMoreCatalog {
  occupations: string[];
  places: { name: string }[];
  entries: { heading: string; text: string; sickness?: boolean }[];
}

/** Occupation terms match occupations and profession entries only, never Names prose. */
export function occupationHaystack(catalog: LearnMoreCatalog): string {
  return [
    catalog.occupations.join(" "),
    ...catalog.entries.filter((e) => isOccupationOrProfessionHeading(e.heading)).map((e) => e.text),
  ].join("\n");
}

export function learnMoreForCatalog(catalog: LearnMoreCatalog): LearnMoreRow[] {
  const occHay = occupationHaystack(catalog);
  const otherHay = [
    catalog.places.map((pl) => pl.name).join(" "),
    ...catalog.entries.filter((e) => e.heading !== "Names" && !e.sickness).map((e) => e.text),
  ].join("\n");
  const seen = new Set<string>();
  const out: LearnMoreRow[] = [];
  for (const r of LEARN_MORE) {
    const hay = r.kind === "occupation" ? occHay : otherHay;
    if (appears(r.term, hay) && !seen.has(r.term)) {
      seen.add(r.term);
      out.push(r);
    }
  }
  return out;
}
