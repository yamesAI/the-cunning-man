// Dignities and Correspondences (DIGNITIES-001 v0 + DIGNITIES-002): a study
// reference, not a live chart. Lilly 1647 Book 1 lists for the seven traditional
// planets plus the essential-dignities table, and one child page per planet.
// JSON-LD comes from src/site/structuredData.ts via RouteHead.

import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { PLANET_GLYPH, PLANET_LABEL, SIGN_GLYPH, SIGN_LABEL, type PlanetKey, type SignKey } from "@/astro/constants";
import { LIBRARY_BOOKS } from "@/site/library";
import {
  DIGNITIES_DESCRIPTION, DIGNITIES_PATH, DIGNITIES_SUBTITLE, DIGNITIES_TITLE, DIGNITY_TERMS, DISCLAIMER,
  FURTHER_STUDY_IDS, LATER_BOOK1_POINTERS, LILLY_LABEL, LILLY_SOURCE, LILLY_TABLE_PAGE, LILLY_TABLE_TERMS,
  PLANET_CATALOGS, planetFromPath, planetPageDescription, planetPageName, planetPath, signDignities,
  type PlanetCatalog,
} from "@/site/dignities";
import { useMeta } from "@/hooks/useMeta";

const P = (p: PlanetKey) => (
  <span title={PLANET_LABEL[p]}>
    {PLANET_GLYPH[p]} {PLANET_LABEL[p]}
  </span>
);

function Terms({ terms }: { terms: Array<[PlanetKey, number]> }) {
  return (
    <>
      {terms.map(([p, end], i) => (
        <span key={i} className="whitespace-nowrap">
          {i > 0 ? " · " : ""}
          <span title={PLANET_LABEL[p]}>{PLANET_GLYPH[p]}</span> {i === 0 ? 0 : terms[i - 1][1]}–{end}
        </span>
      ))}
    </>
  );
}

const ScanLink = ({ label }: { label: string }) => (
  <a href={LILLY_SOURCE.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-seal">
    {label} ↗
  </a>
);

function CatalogEntries({ catalog }: { catalog: PlanetCatalog }) {
  return (
    <dl className="space-y-2 max-w-3xl">
      {catalog.entries.map((e, i) => (
        <div key={i} className="border-l-2 border-line pl-3">
          <dt className="font-bold font-display text-[13px]">
            {e.heading} <span className="font-normal text-ink-soft text-[11px]">p. {e.page}</span>
          </dt>
          <dd className="text-[13px]">
            {e.historical ? (
              <span className="block text-[11px] italic text-ink-soft">
                Historical practice as Lilly reports it; study text, not instructions.
              </span>
            ) : null}
            {e.text}
            {e.sickness ? <span className="block text-[11px] italic text-ink-soft">{DISCLAIMER}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function DignitiesChrome({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-1 font-smallcaps">{title}</h1>
      <p className="text-[14px] text-ink-soft max-w-3xl mb-2">{DIGNITIES_SUBTITLE}</p>
      <p className="text-[12px] italic text-ink-soft max-w-3xl mb-4">{DISCLAIMER}</p>
      {children}
    </div>
  );
}

function PlanetMiss() {
  useMeta(DIGNITIES_TITLE, DIGNITIES_DESCRIPTION);
  return (
    <DignitiesChrome title={`♄ ${DIGNITIES_TITLE}`}>
      <p className="text-[13px] max-w-3xl mb-4">This planet page was not found.</p>
      <p className="text-[13px]">
        <Link to={DIGNITIES_PATH} className="underline">Back to Dignities and Correspondences</Link>
      </p>
    </DignitiesChrome>
  );
}

function PlanetPage({ catalog }: { catalog: PlanetCatalog }) {
  useMeta(planetPageName(catalog.name), planetPageDescription(catalog));
  const siblings = PLANET_CATALOGS.filter((p) => p.key !== catalog.key);
  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-[13px] mb-4">
        <ol className="flex flex-wrap gap-x-2">
          <li><Link to="/" className="underline">The Cunning Man</Link> <span aria-hidden="true">›</span></li>
          <li>
            <Link to={DIGNITIES_PATH} className="underline">Dignities and Correspondences</Link>{" "}
            <span aria-hidden="true">›</span>
          </li>
          <li aria-current="page">{catalog.name}</li>
        </ol>
      </nav>
      <h1 className="text-3xl font-bold mb-1 font-smallcaps">
        {PLANET_GLYPH[catalog.key]} {catalog.name}
      </h1>
      <p className="text-[14px] text-ink-soft max-w-3xl mb-2">{planetPageDescription(catalog)}</p>
      <p className="text-[12px] italic text-ink-soft max-w-3xl mb-4">{DISCLAIMER}</p>
      <p className="text-[13px] mb-4">
        <Link to={DIGNITIES_PATH} className="underline">Back to Dignities and Correspondences</Link>
      </p>
      <p className="text-[13px] max-w-3xl mb-4 border border-line bg-card p-3">
        Source: {LILLY_LABEL}, Book 1, <cite className="not-italic">{catalog.chapter}</cite>, {catalog.pages} —{" "}
        <ScanLink label="read the public-domain scan" />. The lists below are transcribed from that scan, with the
        printed page for each heading. Spelling is kept as printed; the long s is modernized and astrological symbols
        are written out. Sickness and body-part notes, and the old notes on gathering herbs, are historical study
        text only.
      </p>
      <p className="text-[12px] text-ink-soft mb-3">Also called: {catalog.alternateName.join(", ")}.</p>
      <CatalogEntries catalog={catalog} />
      <nav aria-label="Other planets" className="text-[13px] mt-8 flex flex-wrap gap-x-3 gap-y-1">
        {siblings.map((p) => (
          <Link key={p.key} to={planetPath(p.key)} className="underline">{p.name}</Link>
        ))}
      </nav>
    </div>
  );
}

function DignitiesIndex() {
  useMeta(DIGNITIES_TITLE, DIGNITIES_DESCRIPTION);
  const rows = signDignities();
  const further = LIBRARY_BOOKS.filter((b) => FURTHER_STUDY_IDS.includes(b.id));
  return (
    <div>
      <h1 className="text-3xl font-bold mb-1 font-smallcaps">♄ {DIGNITIES_TITLE}</h1>
      <p className="text-[14px] text-ink-soft max-w-3xl mb-2">{DIGNITIES_SUBTITLE}</p>
      <p className="text-[12px] italic text-ink-soft max-w-3xl mb-4">{DISCLAIMER}</p>
      <p className="text-[13px] max-w-3xl mb-4 border border-line bg-card p-3">
        Source: {LILLY_LABEL}, Book 1 — <ScanLink label="read the public-domain scan" />. The lists below are
        transcribed from that scan, chapter by chapter, with the printed page for each heading. Spelling is kept as
        printed; the long s is modernized and astrological symbols are written out. Sickness and body-part notes,
        and the old notes on gathering herbs, are historical study text only.
      </p>
      <nav aria-label="On this page" className="text-[13px] mb-6 flex flex-wrap gap-x-3 gap-y-1">
        <a href="#dignities" className="underline">Essential dignities</a>
        {PLANET_CATALOGS.map((c) => (
          <Link key={c.key} to={planetPath(c.key)} className="underline">{c.name}</Link>
        ))}
        <a href="#later-book-1" className="underline">Dragon and colours</a>
        <a href="#further-study" className="underline">Further study</a>
      </nav>

      <section id="dignities" aria-labelledby="dignities-h" className="mb-10">
        <h2 id="dignities-h" className="text-xl font-bold mb-2 font-smallcaps">Essential dignities</h2>
        <p className="text-[13px] max-w-3xl mb-3">
          Our layout of the same tables the live Astro Clock uses: sign rulership (house), exaltation, triplicity by
          sect (Dorotheus/Lilly), Egyptian terms, Chaldean faces, detriment and fall. Lilly prints his own{" "}
          <cite>Table of the Essentiall Dignities of the Planets</cite> on p. {LILLY_TABLE_PAGE} (<ScanLink label="scan" />).
        </p>
        <div className="overflow-x-auto">
          <table className="text-[12px] border-collapse border border-line bg-card">
            <caption className="text-left text-[12px] italic text-ink-soft pb-1">
              Essential dignities of the seven traditional planets (terms: degree ranges within the sign)
            </caption>
            <thead>
              <tr className="bg-parchment-deep">
                {["Sign", "House", "Exaltation", "Triplicity (day / night)", "Terms (Egyptian)", "Faces (0–10, 10–20, 20–30)", "Detriment", "Fall"].map((h) => (
                  <th key={h} scope="col" className="border border-line px-2 py-1 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.sign} id={`sign-${r.sign}`}>
                  <th scope="row" className="border border-line px-2 py-1 text-left whitespace-nowrap">
                    {SIGN_GLYPH[r.sign]} {SIGN_LABEL[r.sign]}
                  </th>
                  <td className="border border-line px-2 py-1">{P(r.house)}</td>
                  <td className="border border-line px-2 py-1">
                    {r.exaltation ? <>{P(r.exaltation.planet)} {r.exaltation.degree}°</> : "—"}
                  </td>
                  <td className="border border-line px-2 py-1 whitespace-nowrap">
                    {PLANET_GLYPH[r.triplicity.day]} / {PLANET_GLYPH[r.triplicity.night]} <span className="text-ink-soft">({r.element})</span>
                  </td>
                  <td className="border border-line px-2 py-1"><Terms terms={r.terms} /></td>
                  <td className="border border-line px-2 py-1 whitespace-nowrap">
                    {r.faces.map((f) => PLANET_GLYPH[f]).join(" · ")}
                  </td>
                  <td className="border border-line px-2 py-1">{P(r.detriment)}</td>
                  <td className="border border-line px-2 py-1">{r.fall ? P(r.fall) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[12px] text-ink-soft max-w-3xl mt-2">
          Houses, exaltations, triplicities, faces, detriments and falls above agree with Lilly&apos;s p. {LILLY_TABLE_PAGE}{" "}
          table. His terms do not: his table is headed &ldquo;according to Ptolomy&rdquo; and its term bounds differ
          from the Egyptian terms in every sign. His own term column, and the term degrees printed in each
          planet chapter, follow it:
        </p>
        <div className="overflow-x-auto mt-2">
          <table className="text-[12px] border-collapse border border-line bg-card">
            <caption className="text-left text-[12px] italic text-ink-soft pb-1">
              Terms in Lilly&apos;s table, p. {LILLY_TABLE_PAGE} ({LILLY_LABEL})
            </caption>
            <tbody>
              {(Object.keys(LILLY_TABLE_TERMS) as SignKey[]).map((s) => (
                <tr key={s}>
                  <th scope="row" className="border border-line px-2 py-1 text-left whitespace-nowrap">
                    {SIGN_GLYPH[s]} {SIGN_LABEL[s]}
                  </th>
                  <td className="border border-line px-2 py-1"><Terms terms={LILLY_TABLE_TERMS[s]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl id="dignity-terms" className="space-y-2 max-w-3xl mt-4">
          {DIGNITY_TERMS.map((t) => (
            <div key={t.code} id={`dignity-${t.code}`}>
              <dt className="font-bold font-display inline">{t.name}: </dt>
              <dd className="text-[13px] text-ink-soft inline">{t.definition}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div id="planets">
      {PLANET_CATALOGS.map((c) => (
        <section key={c.key} id={c.key} aria-labelledby={`${c.key}-h`} className="mb-10">
          <h2 id={`${c.key}-h`} className="text-xl font-bold font-smallcaps">
            <Link to={planetPath(c.key)} className="underline hover:text-seal">
              {PLANET_GLYPH[c.key]} {c.name}
            </Link>
          </h2>
          <p className="text-[12px] text-ink-soft mb-1">
            {LILLY_LABEL}, Book 1, <cite className="not-italic">{c.chapter}</cite>, {c.pages} — <ScanLink label="scan" />
          </p>
          <p className="text-[12px] text-ink-soft mb-3">Also called: {c.alternateName.join(", ")}.</p>
          <CatalogEntries catalog={c} />
        </section>
      ))}
      </div>

      <section id="later-book-1" aria-labelledby="later-h" className="mb-10">
        <h2 id="later-h" className="text-xl font-bold mb-2 font-smallcaps">Later in Book 1</h2>
        <ul className="space-y-1 max-w-3xl text-[13px]">
          {LATER_BOOK1_POINTERS.map((x) => (
            <li key={x.title}>
              <cite>{x.title}</cite>, {x.page}: {x.note} (<ScanLink label={LILLY_LABEL} />)
            </li>
          ))}
        </ul>
      </section>

      <section id="further-study" aria-labelledby="further-h">
        <h2 id="further-h" className="text-xl font-bold mb-2 font-smallcaps">Further study</h2>
        <p className="text-[13px] max-w-3xl mb-2">
          Other sources in the <Link to="/library" className="underline">library</Link>. They are not mixed into the
          tables or lists above.
        </p>
        <ul className="space-y-1 text-[13px]">
          {further.map((b) => (
            <li key={b.id}>
              <cite>{b.title}</cite>, {b.author}
              {b.translator ? `, trans. ${b.translator}` : ""}, {b.yearLabel} —{" "}
              <a href={b.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-seal">
                public-domain source ↗
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function DignitiesPage() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === DIGNITIES_PATH) return <DignitiesIndex />;
  const catalog = planetFromPath(path);
  if (catalog) return <PlanetPage catalog={catalog} />;
  return <PlanetMiss />;
}
