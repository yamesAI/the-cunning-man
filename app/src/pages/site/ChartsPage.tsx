// Charts (R-CHARTS-001 v1.0): /charts index, one study page per figure, and a
// miss for unknown slugs. Positions, sect and dignities come from the hub engine
// (computeChart, as on /natal), never from hand-entered values. JSON-LD comes
// from src/site/structuredData.ts via RouteHead; the miss emits none.

import { useMemo, type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import {
  CHARTS_DESCRIPTION, CHARTS_PATH, CHARTS_PRESS_SLUG, CHARTS_SUBTITLE, CHARTS_TITLE, CHART_FIGURES,
  figureChart, figureFromPath, figurePageDescription, figurePageName, figurePath, figureReads, type ChartFigure,
} from "@/site/charts";
import { planetPath } from "@/site/dignities";
import { useMeta } from "@/hooks/useMeta";

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });
}

function Disclaimer() {
  return (
    <p className="text-[12px] italic text-ink-soft max-w-3xl mb-4">
      For entertainment &amp; study. Not financial, medical, or legal advice.
    </p>
  );
}

function ChartsChrome({ children }: { children: ReactNode }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-1 font-smallcaps">☉ Charts</h1>
      <p className="text-[14px] text-ink-soft max-w-3xl mb-2">{CHARTS_SUBTITLE}</p>
      <Disclaimer />
      {children}
    </div>
  );
}

function ChartMiss() {
  useMeta(CHARTS_TITLE, CHARTS_DESCRIPTION);
  return (
    <ChartsChrome>
      <p className="text-[13px] max-w-3xl mb-4">This chart page was not found.</p>
      <p className="text-[13px]">
        <Link to={CHARTS_PATH} className="underline">Back to Charts</Link>
      </p>
    </ChartsChrome>
  );
}

function FigurePage({ figure }: { figure: ChartFigure }) {
  useMeta(figurePageName(figure), figurePageDescription(figure));
  const chart = useMemo(() => figureChart(figure), [figure]);
  const reads = figureReads(chart);
  const siblings = CHART_FIGURES.filter((f) => f.slug !== figure.slug);
  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-[13px] mb-4">
        <ol className="flex flex-wrap gap-x-2">
          <li><Link to="/" className="underline">The Cunning Man</Link> <span aria-hidden="true">›</span></li>
          <li>
            <Link to={CHARTS_PATH} className="underline">Charts</Link> <span aria-hidden="true">›</span>
          </li>
          <li aria-current="page">{figure.name}</li>
        </ol>
      </nav>
      <h1 className="text-3xl font-bold mb-1 font-smallcaps">☉ The chart of {figure.name}</h1>
      <p className="text-[14px] text-ink-soft max-w-3xl mb-2">{figurePageDescription(figure)}</p>
      <Disclaimer />
      <p className="text-[13px] mb-4">
        <Link to={CHARTS_PATH} className="underline">Back to Charts</Link>
      </p>

      <section aria-labelledby="chart-data" className="border-2 border-line bg-card p-4 max-w-3xl mb-6">
        <h2 id="chart-data" className="text-lg font-bold mb-2 font-smallcaps">Birth data</h2>
        <dl className="text-[13px] grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="font-bold">Date</dt><dd>{longDate(figure.birthDate)}</dd>
          <dt className="font-bold">Time</dt><dd>{figure.birthTimeText} {figure.tzAbbr}</dd>
          <dt className="font-bold">Place</dt><dd>{figure.placeName}, {figure.placeRegion} ({figure.latLongText})</dd>
          <dt className="font-bold">Rodden rating</dt><dd>{figure.roddenRating} · data source: {figure.dataSource} · collector: {figure.collector}</dd>
          <dt className="font-bold">Source</dt>
          <dd>
            <a href={figure.adbUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-seal">Astro-Databank record ↗</a>{" "}
            <span className="text-ink-soft">(last edited {figure.adbLastEdit}; read {figure.verifiedOn})</span>
          </dd>
        </dl>
        {figure.dataNote ? <p className="text-[12px] italic text-ink-soft mt-2">{figure.dataNote}</p> : null}
      </section>

      <section aria-labelledby="chart-read" className="max-w-3xl mb-6">
        <h2 id="chart-read" className="text-lg font-bold mb-2 font-smallcaps">The seven planets by Lilly's essential dignities</h2>
        <p className="text-[13px] mb-2">
          A {chart.sect} chart: the Sun is {chart.sect === "day" ? "above" : "below"} the horizon. Tropical zodiac,
          geocentric, computed in your browser by the same engine as the natal page.
        </p>
        <div className="overflow-x-auto">
          <table className="text-[13px] w-full border-collapse">
            <thead>
              <tr className="text-left border-b border-line">
                <th className="py-1 pr-3">Planet</th><th className="py-1 pr-3">Position</th><th className="py-1 pr-3">Condition</th>
                <th className="py-1 pr-3">Term</th><th className="py-1 pr-3">Face</th><th className="py-1">Score</th>
              </tr>
            </thead>
            <tbody>
              {reads.map((r) => (
                <tr key={r.key} className="border-b border-line align-top">
                  <td className="py-1 pr-3"><Link to={planetPath(r.key)} className="underline">{r.name}</Link></td>
                  <td className="py-1 pr-3 tabular-nums">{r.position}</td>
                  <td className="py-1 pr-3">{r.condition}</td>
                  <td className="py-1 pr-3">{r.term}</td>
                  <td className="py-1 pr-3">{r.face}</td>
                  <td className="py-1 tabular-nums">{r.score > 0 ? `+${r.score}` : r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[12px] text-ink-soft mt-2">
          This page reads the birth chart only. It says nothing about the person's character, private life or future.
        </p>
      </section>

      <section aria-labelledby="chart-links" className="max-w-3xl mb-6 text-[13px] space-y-1">
        <h2 id="chart-links" className="text-lg font-bold mb-1 font-smallcaps">Method and more</h2>
        <p>
          Method: <Link to="/library/christian-astrology" className="underline">Lilly, Christian Astrology (1647)</Link> in the{" "}
          <Link to="/library" className="underline">Library</Link>, with the tables on{" "}
          <Link to="/dignities" className="underline">Dignities and Correspondences</Link>.
        </p>
        <p><Link to="/natal" className="underline">Cast your own chart</Link></p>
        <p>
          In the news ({figure.hook.date}): {figure.hook.sentence}{" "}
          <a href={figure.hook.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-seal">{figure.hook.outlet} ↗</a>
        </p>
        <p><Link to={`/press/${figure.pressSlug}`} className="underline">Press release</Link></p>
      </section>

      <nav aria-label="Other charts" className="text-[13px] flex flex-wrap gap-x-3 gap-y-1">
        {siblings.map((f) => (
          <Link key={f.slug} to={figurePath(f.slug)} className="underline">{f.name}</Link>
        ))}
      </nav>
    </div>
  );
}

function ChartsIndex() {
  useMeta(CHARTS_TITLE, CHARTS_DESCRIPTION);
  return (
    <ChartsChrome>
      <ol className="space-y-3 max-w-3xl mb-6">
        {CHART_FIGURES.map((f) => (
          <li key={f.slug} className="border-2 border-line bg-card p-4">
            <h2 className="text-lg font-bold">
              <Link to={figurePath(f.slug)} className="underline hover:text-seal">{f.name}</Link>
            </h2>
            <p className="text-[13px] text-ink-soft">
              Born {longDate(f.birthDate)}, {f.birthTimeText} {f.tzAbbr}, {f.placeName} · Astro-Databank Rodden rating {f.roddenRating}
            </p>
          </li>
        ))}
      </ol>
      <p className="text-[13px] space-x-3">
        <Link to="/natal" className="underline">Cast your own chart</Link>
        <Link to="/dignities" className="underline">Dignities and Correspondences</Link>
        <Link to={`/press/${CHARTS_PRESS_SLUG}`} className="underline">Press release</Link>
        <Link to="/articles" className="underline">Articles</Link>
      </p>
    </ChartsChrome>
  );
}

export default function ChartsPage() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === CHARTS_PATH) return <ChartsIndex />;
  const figure = figureFromPath(path);
  if (figure) return <FigurePage figure={figure} />;
  return <ChartMiss />;
}
