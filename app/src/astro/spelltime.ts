// Spell timing: find upcoming planetary hours for a working.

import type { PlanetKey } from "./constants";
import { tzForLocation } from "./engine";
import { wallParts } from "./format";
import { sunEvents } from "./sun";
import { planetaryHours, type PlanetaryHour } from "./traditional";

export interface SpellWindow extends PlanetaryHour {
  dayRulerMatches: boolean; // e.g. Venus hour on a Friday
  weekdayIdx: number;
}

// Scan the next `days` civil days at the location for hours ruled by `ruler`.
export function upcomingHours(
  ruler: PlanetKey,
  from: Date,
  lat: number,
  lng: number,
  days = 8,
  maxResults = 6
): SpellWindow[] {
  const tz = tzForLocation(lat, lng);
  const w = wallParts(from, tz);
  const out: SpellWindow[] = [];
  const RULER_DAY: Partial<Record<PlanetKey, number>> = {
    sun: 0, moon: 1, mars: 2, mercury: 3, jupiter: 4, venus: 5, saturn: 6,
  };
  for (let d = 0; d < days && out.length < maxResults * 3; d++) {
    const dayDate = new Date(Date.UTC(w.year, w.month, w.day + d));
    const ev = sunEvents(dayDate.getUTCFullYear(), dayDate.getUTCMonth(), dayDate.getUTCDate(), lat, lng);
    if (!ev.sunrise || !ev.sunset || !ev.nextSunrise) continue;
    const weekdayIdx = dayDate.getUTCDay();
    const hours = planetaryHours(weekdayIdx, ev.sunrise, ev.sunset, ev.nextSunrise);
    for (const h of hours) {
      if (h.ruler !== ruler || h.end <= from) continue;
      out.push({ ...h, dayRulerMatches: RULER_DAY[ruler] === weekdayIdx, weekdayIdx });
    }
  }
  // preferred: hour whose planetary day also matches
  out.sort((a, b) => {
    if (a.dayRulerMatches !== b.dayRulerMatches) return a.dayRulerMatches ? -1 : 1;
    return a.start.getTime() - b.start.getTime();
  });
  return out.slice(0, maxResults);
}
