// Active Transits — what's exact in the sky right now, and (when a natal
// figure is saved) what the sky is doing to it.

import { useMemo, useState, type ReactElement } from "react";
import { Link } from "react-router";
import type { ChartData } from "@/astro/engine";
import { computeChart } from "@/astro/engine";
import { PLANET_LABEL, ASPECT_GLYPH } from "@/astro/constants";
import { transitsToNatal, sortTransitHits, sortAspectCells, exactTimesForAspects, exactTimesForHits, type TransitHit } from "@/astro/transits";
import { loadNatal } from "@/lib/natal";
import { lookupTestimony } from "@/data/tradition";
import { exactLabel, hitLine, natalPointLabel } from "@/lib/transitFormat";
import { TestimonyCard } from "@/components/TestimonyCard";

function SkyRow({ cell, exactAt }: {
  cell: ChartData["aspectsGrid"][number];
  exactAt: Date | null;
}): ReactElement {
  const p1 = PLANET_LABEL[cell.p1];
  const p2 = PLANET_LABEL[cell.p2];
  return (
    <li className="py-1 border-b border-line/60 last:border-0">
      <span className="font-ui text-[13px]">
        <span className="glyph-pair font-bold">
          {p1} <span aria-hidden="true">{ASPECT_GLYPH[cell.aspectKey]}</span> {p2}
          <span className="sr-only"> {cell.aspectKey}</span>
        </span>
        <span className="text-ink-soft">
          {" "}
          · {cell.orb.toFixed(1)}° {cell.applying ? "applying" : "separating"} ·{" "}
          {exactLabel({ applying: cell.applying, exactAt }, new Date())}
        </span>
      </span>
    </li>
  );
}

function NatalRow({ hit, exactAt, now }: { hit: TransitHit; exactAt: Date | null; now: Date }): ReactElement {
  return (
    <li className="py-2 border-b border-line/60 last:border-0">
      <p className="font-ui text-[13px]" aria-label={hitLine(hit)}>
        <span className="glyph-pair font-bold">
          {PLANET_LABEL[hit.transiting]}{" "}
          <span aria-hidden="true">{ASPECT_GLYPH[hit.aspectKey]}</span>{" "}
          <span className="sr-only">{hit.aspectKey}</span>
        </span>{" "}
        to <span className="font-bold">{natalPointLabel(hit.natalPoint)}</span>
        <span className="text-ink-soft">
          {" "}
          · {hit.orb.toFixed(1)}° {hit.applying ? "applying" : "separating"} ·{" "}
          {exactLabel({ applying: hit.applying, exactAt }, now)}
        </span>
      </p>
      <TestimonyCard testimony={lookupTestimony(hit.transiting, hit.aspectKey)} />
    </li>
  );
}

export function ActiveTransitsPanel({ chart }: { chart: ChartData }): ReactElement {
  const [open, setOpen] = useState(true);

  // Moon-involved exact times recompute every 5 minutes; slow-planet dates
  // barely move and recompute every 30 (buildHoroscope costs ~5.6ms each).
  const bucket5 = Math.floor(chart.date.getTime() / 300000);
  const bucket30 = Math.floor(chart.date.getTime() / 1800000);
  const t5 = useMemo(() => new Date(bucket5 * 300000), [bucket5]);
  const t30 = useMemo(() => new Date(bucket30 * 1800000), [bucket30]);
  const sky = sortAspectCells(chart.aspectsGrid);
  const moonCells = sky.filter((c) => c.p1 === "moon" || c.p2 === "moon");
  const slowCells = sky.filter((c) => c.p1 !== "moon" && c.p2 !== "moon");

  const moonExact = useMemo(
    () => exactTimesForAspects(moonCells, t5, chart.lat, chart.lng),
    [t5, moonCells, chart.lat, chart.lng]
  );
  const slowExact = useMemo(
    () => exactTimesForAspects(slowCells, t30, chart.lat, chart.lng),
    [t30, slowCells, chart.lat, chart.lng]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const natalProfile = useMemo(() => loadNatal(), [bucket5]);
  const natalSection = useMemo(() => {
    if (!natalProfile) return null;
    const natal = computeChart(new Date(natalProfile.birth), natalProfile.lat, natalProfile.lng);
    const cur = computeChart(t5, chart.lat, chart.lng);
    return { hits: sortTransitHits(transitsToNatal(natal, cur)), natal };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket5, natalProfile, chart.lat, chart.lng]);
  const natalMoonExact = useMemo(
    () =>
      natalSection
        ? exactTimesForHits(
            natalSection.hits.filter((h) => h.transiting === "moon"),
            natalSection.natal,
            t5,
            chart.lat,
            chart.lng
          )
        : new Map(),
    [natalSection, t5, chart.lat, chart.lng]
  );
  const natalSlowExact = useMemo(
    () =>
      natalSection
        ? exactTimesForHits(
            natalSection.hits.filter((h) => h.transiting !== "moon"),
            natalSection.natal,
            t30,
            chart.lat,
            chart.lng
          )
        : new Map(),
    [natalSection, t30, chart.lat, chart.lng]
  );

  return (
    <section aria-labelledby="active-transits-h" className="manor-card p-3">
      <h2 id="active-transits-h" className="font-bold font-display font-smallcaps">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="w-full text-left"
        >
          {open ? "▾" : "▸"} Active Transits
        </button>
      </h2>
      {open && (
        <div className="mt-1">
          <h3 className="text-[12px] font-bold uppercase tracking-wide text-ink-soft mt-1">
            In the sky now
          </h3>
          <ul>
            {sky.map((c, i) => (
              <SkyRow
                key={i}
                cell={c}
                exactAt={(c.p1 === "moon" || c.p2 === "moon" ? moonExact : slowExact).get(c) ?? null}
              />
            ))}
          </ul>

          <h3 className="text-[12px] font-bold uppercase tracking-wide text-ink-soft mt-3">
            To your natal figure
          </h3>
          {natalSection ? (
            natalSection.hits.length === 0 ? (
              <p className="text-[13px] text-ink-soft">No transiting aspects within orb just now.</p>
            ) : (
              <ul>
                {natalSection.hits.map((h, i) => (
                  <NatalRow
                    key={i}
                    hit={h}
                    exactAt={(h.transiting === "moon" ? natalMoonExact : natalSlowExact).get(h) ?? null}
                    now={chart.date}
                  />
                ))}
              </ul>
            )
          ) : (
            <p className="text-[13px] text-ink-soft">
              No natal figure cast yet —{" "}
              <Link to="/natal" className="underline font-bold">
                cast your natal figure
              </Link>{" "}
              and this panel will read the sky against it.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
