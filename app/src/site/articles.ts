// Articles (R-EDITORIAL-001 v1.0, D-1–D-10): the editorial programme index and
// /articles/<beat>/<slug> Article pages. The celebrity beat lives at /charts
// (D-1, no /articles/celebrity duplicate). Launch scope is the four chart
// figures only, so ARTICLES starts empty; each later item comes from its own
// Research row, Magus review and QC pass. Lives in src/site/.

export const ARTICLES_PATH = "/articles";
export const ARTICLES_TITLE = "The Cunning Man — Articles";
export const ARTICLES_SUBTITLE =
  "The editorial programme in four beats: astro celebrity (the Charts study pages), businesses, magic and occult. For study and entertainment.";
export const ARTICLES_DESCRIPTION =
  "Articles from The Cunning Man in four beats: astro celebrity charts, business founding charts, magic and occult history. For entertainment and study.";

export type ArticleBeat = "companies" | "magic" | "occult";
export const ARTICLE_BEATS: Record<ArticleBeat, string> = { companies: "Businesses", magic: "Magic", occult: "Occult" };

export interface ArticleSource {
  name: string;
  url: string;
  readOn: string;    // ISO date the source was opened
  licence?: string;
}

export interface ArticleItem {
  slug: string;
  beat: ArticleBeat;
  title: string;
  summary: string;
  datePublished: string; // ISO date
  body: string[];
  sources: ArticleSource[];
  checkedBy: string;
  checkedOn: string;
  pressSlug: string;
  related: string[];     // hub paths named in the article (/dignities/<planet>, /library/<id>, /natal)
}

export const ARTICLES: ArticleItem[] = [];

export function articlePath(a: Pick<ArticleItem, "beat" | "slug">): string {
  return `${ARTICLES_PATH}/${a.beat}/${a.slug}`;
}

/** Exact lowercase /articles/<beat>/<slug> only; anything else is a miss. */
export function articleFromPath(pathname: string): ArticleItem | undefined {
  const p = pathname.replace(/\/+$/, "") || "/";
  return ARTICLES.find((a) => articlePath(a) === p);
}
