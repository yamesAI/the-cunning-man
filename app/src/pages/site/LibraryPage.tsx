// Library (LIB-001 v0): a study collection, not a lending library. Metadata-only
// listing of the four historical works the hub already cites; each links out to
// a public-domain scan. No full text is hosted. JSON-LD comes from
// src/site/structuredData.ts via RouteHead.

import { LIBRARY_BOOKS, LIBRARY_DESCRIPTION, LIBRARY_SUBTITLE, LIBRARY_TERMS, LIBRARY_TITLE } from "@/site/library";
import { useMeta } from "@/hooks/useMeta";

export default function LibraryPage() {
  useMeta(LIBRARY_TITLE, LIBRARY_DESCRIPTION);
  return (
    <div>
      <h1 className="text-3xl font-bold mb-1 font-smallcaps">📜 {LIBRARY_TITLE}</h1>
      <p className="text-[14px] text-ink-soft max-w-3xl mb-2">{LIBRARY_SUBTITLE}</p>
      <p className="text-[12px] italic text-ink-soft max-w-3xl mb-6">
        For entertainment &amp; study. Not financial, medical, or legal advice.
      </p>

      <section aria-labelledby="library-books" className="mb-8">
        <h2 id="library-books" className="text-xl font-bold mb-3 font-smallcaps">The books</h2>
        <ol className="space-y-4">
          {LIBRARY_BOOKS.map((b) => (
            <li key={b.id} id={b.id} className="border-2 border-line bg-card p-4">
              <h3 className="text-lg font-bold">
                <cite className="not-italic">{b.title}</cite>
              </h3>
              <p className="text-[13px] text-ink-soft font-bold">
                {b.author}
                {b.translator ? `, trans. ${b.translator}` : ""} · {b.yearLabel}
              </p>
              <p className="text-[13px] my-1">{b.note}</p>
              {b.scanNote ? <p className="text-[12px] italic text-ink-soft">{b.scanNote}</p> : null}
              <p className="text-[12px] mt-1">
                <a href={b.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-seal">
                  Read the public-domain scan ↗
                </a>{" "}
                · <span className="text-ink-soft">facet: <a href={`#term-${b.facet}`} className="underline">{b.facet}</a></span>
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section id="facets" aria-labelledby="library-facets">
        <h2 id="library-facets" className="text-xl font-bold mb-3 font-smallcaps">Facets</h2>
        <dl className="space-y-3 max-w-3xl">
          {LIBRARY_TERMS.map((t) => {
            const count = LIBRARY_BOOKS.filter((b) => b.facet === t.code).length;
            return (
              <div key={t.code} id={`term-${t.code}`} className="border border-line bg-card p-3">
                <dt className="font-bold font-display">
                  {t.name} <span className="text-[12px] font-normal text-ink-soft">({count === 0 ? "no items yet" : `${count} ${count === 1 ? "item" : "items"}`})</span>
                </dt>
                <dd className="text-[13px] text-ink-soft">{t.definition}</dd>
              </div>
            );
          })}
        </dl>
      </section>
    </div>
  );
}
