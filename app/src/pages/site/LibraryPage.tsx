// Library (LIB-001 v0 + HUB-PAGES-001 library pages): a study collection, not a
// lending library. Metadata-only listing of the four historical works the hub
// already cites, plus one child page per book; each links out to a public-domain
// source. No full text is hosted. JSON-LD comes from src/site/structuredData.ts
// via RouteHead.

import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import {
  LIBRARY_BOOKS, LIBRARY_DESCRIPTION, LIBRARY_PATH, LIBRARY_SUBTITLE, LIBRARY_TERMS, LIBRARY_TITLE,
  bookFromPath, bookPageDescription, bookPageName, bookPath, type LibraryBook,
} from "@/site/library";
import { useMeta } from "@/hooks/useMeta";

function LibraryChrome({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-1 font-smallcaps">{title}</h1>
      <p className="text-[14px] text-ink-soft max-w-3xl mb-2">{LIBRARY_SUBTITLE}</p>
      <p className="text-[12px] italic text-ink-soft max-w-3xl mb-6">
        For entertainment &amp; study. Not financial, medical, or legal advice.
      </p>
      {children}
    </div>
  );
}

function BookMiss() {
  useMeta(LIBRARY_TITLE, LIBRARY_DESCRIPTION);
  return (
    <LibraryChrome title={`📜 ${LIBRARY_TITLE}`}>
      <p className="text-[13px] max-w-3xl mb-4">This book page was not found.</p>
      <p className="text-[13px]">
        <Link to={LIBRARY_PATH} className="underline">Back to Library</Link>
      </p>
    </LibraryChrome>
  );
}

function BookPage({ book }: { book: LibraryBook }) {
  useMeta(bookPageName(book.title), bookPageDescription(book));
  const siblings = LIBRARY_BOOKS.filter((b) => b.id !== book.id);
  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-[13px] mb-4">
        <ol className="flex flex-wrap gap-x-2">
          <li><Link to="/" className="underline">The Cunning Man</Link> <span aria-hidden="true">›</span></li>
          <li>
            <Link to={LIBRARY_PATH} className="underline">Library</Link>{" "}
            <span aria-hidden="true">›</span>
          </li>
          <li aria-current="page">{book.title}</li>
        </ol>
      </nav>
      <h1 className="text-3xl font-bold mb-1 font-smallcaps">
        📜 <cite className="not-italic">{book.title}</cite>
      </h1>
      <p className="text-[14px] text-ink-soft max-w-3xl mb-2">{bookPageDescription(book)}</p>
      <p className="text-[12px] italic text-ink-soft max-w-3xl mb-4">
        For entertainment &amp; study. Not financial, medical, or legal advice.
      </p>
      <p className="text-[13px] mb-4">
        <Link to={LIBRARY_PATH} className="underline">Back to Library</Link>
      </p>
      <div className="border-2 border-line bg-card p-4 max-w-3xl mb-8">
        <p className="text-[13px] text-ink-soft font-bold">
          {book.author}
          {book.translator ? `, trans. ${book.translator}` : ""} · {book.yearLabel}
        </p>
        <p className="text-[13px] my-1">{book.note}</p>
        {book.scanNote ? <p className="text-[12px] italic text-ink-soft">{book.scanNote}</p> : null}
        <p className="text-[12px] mt-1">
          <a href={book.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-seal">
            Read the public-domain source ↗
          </a>{" "}
          · <span className="text-ink-soft">facet: <Link to={`${LIBRARY_PATH}#term-${book.facet}`} className="underline">{book.facet}</Link></span>
        </p>
      </div>
      <nav aria-label="Other books" className="text-[13px] flex flex-wrap gap-x-3 gap-y-1">
        {siblings.map((b) => (
          <Link key={b.id} to={bookPath(b.id)} className="underline">{b.title}</Link>
        ))}
      </nav>
    </div>
  );
}

function LibraryIndex() {
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
                <Link to={bookPath(b.id)} className="underline hover:text-seal">
                  <cite className="not-italic">{b.title}</cite>
                </Link>
              </h3>
              <p className="text-[13px] text-ink-soft font-bold">
                {b.author}
                {b.translator ? `, trans. ${b.translator}` : ""} · {b.yearLabel}
              </p>
              <p className="text-[13px] my-1">{b.note}</p>
              {b.scanNote ? <p className="text-[12px] italic text-ink-soft">{b.scanNote}</p> : null}
              <p className="text-[12px] mt-1">
                <a href={b.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-seal">
                  Read the public-domain source ↗
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

export default function LibraryPage() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === LIBRARY_PATH) return <LibraryIndex />;
  const book = bookFromPath(path);
  if (book) return <BookPage book={book} />;
  return <BookMiss />;
}
