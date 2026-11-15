// Articles (R-EDITORIAL-001 v1.0): /articles index, /articles/<beat>/<slug>
// Article pages, and a miss for unknown paths (no JSON-LD, canonical /articles).
// The celebrity beat is /charts (D-1). JSON-LD via structuredData.ts/RouteHead.

import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import {
  ARTICLES, ARTICLES_DESCRIPTION, ARTICLES_PATH, ARTICLES_SUBTITLE, ARTICLES_TITLE, ARTICLE_BEATS,
  articleFromPath, articlePath, type ArticleItem,
} from "@/site/articles";
import { CHARTS_PATH, CHART_FIGURES, figurePath } from "@/site/charts";
import { useMeta } from "@/hooks/useMeta";

function ArticlesChrome({ children }: { children: ReactNode }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-1 font-smallcaps">✒ Articles</h1>
      <p className="text-[14px] text-ink-soft max-w-3xl mb-2">{ARTICLES_SUBTITLE}</p>
      <p className="text-[12px] italic text-ink-soft max-w-3xl mb-4">
        For entertainment &amp; study. Not financial, medical, or legal advice.
      </p>
      {children}
    </div>
  );
}

function ArticleMiss() {
  useMeta(ARTICLES_TITLE, ARTICLES_DESCRIPTION);
  return (
    <ArticlesChrome>
      <p className="text-[13px] max-w-3xl mb-4">This article was not found.</p>
      <p className="text-[13px]">
        <Link to={ARTICLES_PATH} className="underline">Back to Articles</Link>
      </p>
    </ArticlesChrome>
  );
}

function ArticlePage({ article }: { article: ArticleItem }) {
  useMeta(`${article.title} — The Cunning Man`, article.summary);
  const related = ARTICLES.filter((a) => a.beat === article.beat && a.slug !== article.slug);
  return (
    <article className="max-w-3xl">
      <nav aria-label="Breadcrumb" className="text-[13px] mb-4">
        <ol className="flex flex-wrap gap-x-2">
          <li><Link to="/" className="underline">The Cunning Man</Link> <span aria-hidden="true">›</span></li>
          <li><Link to={ARTICLES_PATH} className="underline">Articles</Link> <span aria-hidden="true">›</span></li>
          <li aria-current="page">{article.title}</li>
        </ol>
      </nav>
      <p className="text-[12px] text-ink-soft font-bold">{ARTICLE_BEATS[article.beat]} · {article.datePublished}</p>
      <h1 className="text-2xl md:text-3xl font-bold my-2 leading-tight">{article.title}</h1>
      <p className="text-[12px] italic text-ink-soft mb-4">
        For entertainment &amp; study. Not financial, medical, or legal advice.
      </p>
      {article.body.map((para, i) => <p key={i} className="text-[14px] leading-relaxed mb-3">{para}</p>)}
      <h2 className="text-lg font-bold mt-4 mb-1 font-smallcaps">Sources</h2>
      <ul className="text-[13px] list-disc pl-5 mb-4">
        {article.sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">{s.name} ↗</a> (read {s.readOn})
          </li>
        ))}
      </ul>
      <nav aria-label="Related pages" className="text-[13px] flex flex-wrap gap-x-3 gap-y-1">
        {article.related.map((to) => <Link key={to} to={to} className="underline">{to}</Link>)}
        {related.map((a) => <Link key={a.slug} to={articlePath(a)} className="underline">{a.title}</Link>)}
        <Link to={`/press/${article.pressSlug}`} className="underline">Press release</Link>
      </nav>
    </article>
  );
}

function ArticlesIndex() {
  useMeta(ARTICLES_TITLE, ARTICLES_DESCRIPTION);
  return (
    <ArticlesChrome>
      <section aria-labelledby="beat-celebrity" className="mb-6 max-w-3xl">
        <h2 id="beat-celebrity" className="text-xl font-bold mb-2 font-smallcaps">
          Astro celebrity: <Link to={CHARTS_PATH} className="underline">Charts</Link>
        </h2>
        <ul className="text-[13px] list-disc pl-5">
          {CHART_FIGURES.map((f) => (
            <li key={f.slug}><Link to={figurePath(f.slug)} className="underline">{f.name}</Link></li>
          ))}
        </ul>
      </section>
      {ARTICLES.length > 0 ? (
        <section aria-labelledby="beat-articles" className="max-w-3xl">
          <h2 id="beat-articles" className="text-xl font-bold mb-2 font-smallcaps">Businesses, magic and occult</h2>
          <ul className="text-[13px] list-disc pl-5">
            {ARTICLES.map((a) => (
              <li key={a.slug}>{ARTICLE_BEATS[a.beat]}: <Link to={articlePath(a)} className="underline">{a.title}</Link></li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-[13px] text-ink-soft max-w-3xl">Business, magic and occult articles are in preparation.</p>
      )}
    </ArticlesChrome>
  );
}

export default function ArticlesPage() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === ARTICLES_PATH) return <ArticlesIndex />;
  const article = articleFromPath(path);
  if (article) return <ArticlePage article={article} />;
  return <ArticleMiss />;
}
