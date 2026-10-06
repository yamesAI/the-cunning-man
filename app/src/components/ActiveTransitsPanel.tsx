// Active Transits — what's exact in the sky right now, and (when a natal
// figure is saved) what the sky is doing to it.

import { useMemo, useState, type ReactElement } from "react";
import { Link } from "react-router";
import type { ChartData } from "@/astro/engine";
import { buildHoroscope, lonOf, computeChart } from "@/astro/engine";
import { PLANET_LABEL, ASPECT_GLYPH } from "@/astro/constants";
import { angleDiff } from "@/astro/format";
import {
  findExactSeparation,
  transitsToNatal,
  sortTransitHits,
  sortAspectCells,
  EXACT_WINDOW_MS,
  type TransitHit,
} from "@/astro/transits";
import { loadNatal } from "@/lib/natal";
import { lookupTestimony } from "@/data/tradition";
import { exactLabel, hitLine, natalPointLabel } from "@/lib/transitFormat";
import { TestimonyCard } from "@/components/TestimonyCard";

function SkyRow({ cell, chart }: { cell: ChartData["aspectsGrid"][number]; chart: ChartData }): ReactElement {
  const p1 = PLANET_LABEL[cell.p1];
  const p2 = PLANET_LABEL[cell.p2];
  const windowMs = Math.min(
    EXACT_WINDOW_MS[cell.p1] ?? 30 * 86400000,
    EXACT_WINDOW_MS[cell.p2] ?? 30 * 86400000
  );
  const exactAt = useMemo(() => {
    const sepAt = (t: Date) => {
      const h = buildHoroscope(t, chart.lat, chart.lng);
      return Math.abs(angleDiff(lonOf(h, cell.p1), lonOf(h, cell.p2)));
    };
    return findExactSeparation(sepAt, cell.angle, chart.date, cell.applying ? 1 : -1, windowMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.floor(chart.date.getTime() / 60000), cell.p1, cell.p2, cell.angle, cell.applying, chart.lat, chart.lng]);
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

function NatalRow({ hit, now }: { hit: TransitHit; now: Date }): ReactElement {
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
          {exactLabel(hit, now)}
        </span>
      </p>
      <TestimonyCard testimony={lookupTestimony(hit.transiting, hit.aspectKey)} />
    </li>
  );
}

export function ActiveTransitsPanel({ chart }: { chart: ChartData }): ReactElement {
  const [open, setOpen] = useState(true);

  const bucket = Math.floor(chart.date.getTime() / 60000);
  const sky = sortAspectCells(chart.aspectsGrid);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const natalProfile = useMemo(() => loadNatal(), [bucket]);
  const natalSection = useMemo(() => {
    if (!natalProfile) return null;
    const natal = computeChart(new Date(natalProfile.birth), natalProfile.lat, natalProfile.lng);
    return { hits: sortTransitHits(transitsToNatal(natal, chart)), name: natalProfile.name };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket, natalProfile, chart]);

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
          <ul>{sky.map((c, i) => <SkyRow key={i} cell={c} chart={chart} />)}</ul>

          <h3 className="text-[12px] font-bold uppercase tracking-wide text-ink-soft mt-3">
            To your natal figure
          </h3>
          {natalSection ? (
            natalSection.hits.length === 0 ? (
              <p className="text-[13px] text-ink-soft">No transiting aspects within orb just now.</p>
            ) : (
              <ul>
                {natalSection.hits.map((h, i) => (
                  <NatalRow key={i} hit={h} now={chart.date} />
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
