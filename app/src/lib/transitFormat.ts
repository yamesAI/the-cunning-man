// Shared phrasing for transit rows (natal page + active-transits panel).

import { format } from "date-fns";
import type { TransitHit } from "../astro/transits";
import { ASPECT_GLYPH, PLANET_LABEL } from "../astro/constants";

function natalLabel(point: TransitHit["natalPoint"]): string {
  if (point === "asc") return "natal Ascendant";
  if (point === "mc") return "natal Midheaven";
  return `natal ${PLANET_LABEL[point]}`;
}

function whenLabel(d: Date, now: Date): string {
  const sameDay =
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate();
  return sameDay ? format(d, "HH:mm") : format(d, "d MMM yyyy");
}

// "perfects 12 Mar 2027" / "was exact 3 Oct" / "no perfection in window"
export function exactLabel(hit: Pick<TransitHit, "applying" | "exactAt">, now: Date): string {
  if (!hit.exactAt) return hit.applying ? "applying — no perfection in window" : "separating — no perfection in window";
  const when = whenLabel(hit.exactAt, now);
  return hit.applying ? `perfects ${when}` : `was exact ${when}`;
}

// "Saturn □ square · natal Moon · 1.2° applying"
export function hitLine(hit: TransitHit): string {
  const t = `${PLANET_LABEL[hit.transiting]} ${ASPECT_GLYPH[hit.aspectKey]} ${hit.aspectKey}`;
  const state = hit.applying ? "applying" : "separating";
  return `${t} · ${natalLabel(hit.natalPoint)} · ${hit.orb.toFixed(1)}° ${state}`;
}

export function natalPointLabel(point: TransitHit["natalPoint"]): string {
  return natalLabel(point);
}
