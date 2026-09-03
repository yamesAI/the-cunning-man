// Traditional Renaissance square chart wheel (Solar Fire style).
// Geometry: outer square + inner rectangle. Lines: 4 outer-corner -> inner-corner
// diagonals, 8 inner-corner -> edge-midpoint lines. Produces 12 triangular houses:
// angular houses (1,4,7,10) have apex on the outer edge, the rest apex at inner corners.

import type { ChartData } from "@/astro/engine";
import { forwardDist, norm360, pad } from "@/astro/format";
import { PLANET_COLOR, PLANET_GLYPH, SIGN_COLOR, SIGN_GLYPH } from "@/astro/constants";

interface Pt { x: number; y: number }
const P = (x: number, y: number): Pt => ({ x, y });
const lerp = (a: Pt, b: Pt, t: number): Pt => P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);

// ---- layout constants (viewBox 1000x1000) ----
const O = 40;            // outer margin
const S = 920;           // outer side
const I = 270;           // inner rect corner coordinate
const IR = 730;          // inner rect far corner
const C = 500;           // center

const CORNER_TL = P(O, O), CORNER_TR = P(O + S, O), CORNER_BR = P(O + S, O + S), CORNER_BL = P(O, O + S);
const A_TL = P(I, I), A_TR = P(IR, I), A_BR = P(IR, IR), A_BL = P(I, IR);
const P1 = P(O, C);          // ASC (left edge)
const P4 = P(C, O + S);      // IC (bottom edge)
const P7 = P(O + S, C);      // DSC (right edge)
const P10 = P(C, O);         // MC (top edge)

// cusp k line: [outer point, inner point]
const CUSP_LINES: Record<number, [Pt, Pt]> = {
  1: [P1, A_TL],
  2: [P1, A_BL],
  3: [CORNER_BL, A_BL],
  4: [P4, A_BL],
  5: [P4, A_BR],
  6: [CORNER_BR, A_BR],
  7: [P7, A_BR],
  8: [P7, A_TR],
  9: [CORNER_TR, A_TR],
  10: [P10, A_TR],
  11: [P10, A_TL],
  12: [CORNER_TL, A_TL],
};

// house number anchor: apex + offset toward base midpoint
const HOUSE_NUMBER_POS: Record<number, { pos: Pt; anchor: "start" | "middle" | "end" }> = {
  1: { pos: P(O + 16, C + 4), anchor: "start" },
  4: { pos: P(C, O + S - 12), anchor: "middle" },
  7: { pos: P(O + S - 16, C + 4), anchor: "end" },
  10: { pos: P(C, O + 18), anchor: "middle" },
  2: { pos: P(I - 16, IR + 16), anchor: "end" },
  3: { pos: P(I + 14, IR - 6), anchor: "start" },
  5: { pos: P(IR - 14, IR - 6), anchor: "end" },
  6: { pos: P(IR + 16, IR + 16), anchor: "start" },
  8: { pos: P(IR + 16, I - 8), anchor: "start" },
  9: { pos: P(IR - 14, I + 14), anchor: "end" },
  11: { pos: P(I + 14, I + 14), anchor: "start" },
  12: { pos: P(I - 16, I - 8), anchor: "end" },
};

const CHART_BG = "#fbfadf";
const LINE = "#8a8a7a";

function housePoint(house: number, f: number, depth: number): Pt {
  const [Os, Is] = CUSP_LINES[house];
  const [Oe, Ie] = CUSP_LINES[(house % 12) + 1];
  return lerp(lerp(Os, Is, depth), lerp(Oe, Ie, depth), f);
}

interface Props {
  chart: ChartData;
  showOuters: boolean;
}

export function SquareChart({ chart, showOuters }: Props) {
  const lines: Array<[Pt, Pt]> = [
    // outer square
    [CORNER_TL, CORNER_TR], [CORNER_TR, CORNER_BR], [CORNER_BR, CORNER_BL], [CORNER_BL, CORNER_TL],
    // corner diagonals
    [CORNER_TL, A_TL], [CORNER_TR, A_TR], [CORNER_BR, A_BR], [CORNER_BL, A_BL],
    // inner-corner -> edge-midpoint
    [A_TL, P1], [A_BL, P1], [A_TL, P10], [A_TR, P10],
    [A_TR, P7], [A_BR, P7], [A_BL, P4], [A_BR, P4],
    // inner rectangle
    [A_TL, A_TR], [A_TR, A_BR], [A_BR, A_BL], [A_BL, A_TL],
  ];

  const bodies = chart.bodies.filter((b) => showOuters || !["uranus", "neptune", "pluto"].includes(b.key));

  // cluster de-collision: initial placement, then iterative relaxation
  const items = bodies.map((b) => {
    const cuspStart = chart.cusps[b.house - 1];
    const cuspEnd = chart.cusps[b.house % 12];
    const span = forwardDist(cuspStart, cuspEnd) || 1;
    const f = Math.min(0.96, Math.max(0.04, forwardDist(cuspStart, b.lon) / span));
    return { b, pt: housePoint(b.house, f, 0.62) };
  });
  for (let iter = 0; iter < 8; iter++) {
    for (let i = 0; i < items.length; i++) {
      for (let j = 0; j < i; j++) {
        const a = items[i].pt, c = items[j].pt;
        const d = Math.hypot(a.x - c.x, a.y - c.y);
        if (d < 135) {
          const ux = (a.x - c.x) / (d || 1), uy = (a.y - c.y) / (d || 1);
          const push = (135 - d) / 2 + 6;
          items[i].pt = P(a.x + ux * push, a.y + uy * push);
          items[j].pt = P(c.x - ux * push * 0.5, c.y - uy * push * 0.5);
        }
      }
    }
  }
  const planetEls = items;

  const cuspLabel = (k: number) => {
    const [Op, Ip] = CUSP_LINES[k];
    const pos = lerp(Op, Ip, 0.13);
    const lon = chart.cusps[k - 1];
    const signIdx = Math.floor(norm360(lon) / 30) as number;
    const dis = norm360(lon) % 30;
    const deg = Math.floor(dis);
    const min = Math.floor((dis - deg) * 60 + 1e-9);
    const signKey = (Object.keys(SIGN_GLYPH) as Array<keyof typeof SIGN_GLYPH>)[signIdx];
    return (
      <text key={`cusp-${k}`} x={pos.x} y={pos.y} textAnchor="middle" fontSize="17"
        fill="#333" style={{ paintOrder: "stroke", stroke: CHART_BG, strokeWidth: 5 }}>
        {pad(deg)}°<tspan fill={SIGN_COLOR[signKey]} fontSize="18">{SIGN_GLYPH[signKey]}</tspan>{pad(min)}'
      </text>
    );
  };

  return (
    <svg viewBox="-25 -25 1050 1050" className="w-full h-full" role="img" aria-label="Astrological chart wheel">
      <rect x={O} y={O} width={S} height={S} fill={CHART_BG} stroke={LINE} strokeWidth={2} />
      {lines.map(([a, b], i) => (
        <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={LINE} strokeWidth={1.2} />
      ))}

      {/* angle labels outside the square */}
      <text x={O - 10} y={C + 6} textAnchor="end" fontSize="20" fontWeight="bold" fill="#333">Asc</text>
      <text x={O + S + 10} y={C + 6} textAnchor="start" fontSize="20" fontWeight="bold" fill="#333">Dsc</text>
      <text x={C} y={O - 12} textAnchor="middle" fontSize="20" fontWeight="bold" fill="#333">MC</text>
      <text x={C} y={O + S + 26} textAnchor="middle" fontSize="20" fontWeight="bold" fill="#333">IC</text>

      {/* house numbers */}
      {Object.entries(HOUSE_NUMBER_POS).map(([h, v]) => (
        <text key={`hn-${h}`} x={v.pos.x} y={v.pos.y} textAnchor={v.anchor} fontSize="17" fill="#555">
          {h}
        </text>
      ))}

      {/* cusp degree labels */}
      {Array.from({ length: 12 }, (_, i) => cuspLabel(i + 1))}

      {/* planets */}
      {planetEls.map(({ b, pt }) => (
        <g key={b.key}>
          <text x={pt.x} y={pt.y - 22} textAnchor="middle" fontSize="44" fill={PLANET_COLOR[b.key]}
            style={{ paintOrder: "stroke", stroke: CHART_BG, strokeWidth: 6 }}>
            {PLANET_GLYPH[b.key]}
          </text>
          <text x={pt.x} y={pt.y + 8} textAnchor="middle" fontSize="18"
            style={{ paintOrder: "stroke", stroke: CHART_BG, strokeWidth: 5 }}>
            <tspan fill="#333">{pad(b.deg)}° </tspan>
            <tspan fill={SIGN_COLOR[b.sign]} fontSize="20">{SIGN_GLYPH[b.sign]}</tspan>
            <tspan fill="#333"> {pad(b.min)}'</tspan>
            {b.retro && <tspan fill="#c0392b" fontSize="16"> ℞</tspan>}
          </text>
        </g>
      ))}

      {/* center info panel */}
      <g>
        <rect x={I + 14} y={I + 14} width={IR - I - 28} height={266} fill="#fdfdf2" stroke="#555" strokeWidth={1.2} />
        <text x={C} y={I + 46} textAnchor="middle" fontSize="21" fontWeight="bold" fill="#222">Live Chart</text>
        <text x={C} y={I + 72} textAnchor="middle" fontSize="17" fill="#222">
          {chart.wallDateStr}
        </text>
        <text x={C} y={I + 106} textAnchor="middle" fontSize="30" fontWeight="bold" fill="#111" fontFamily="monospace">
          {chart.wallClock}
        </text>
        <text x={C} y={I + 132} textAnchor="middle" fontSize="15" fill="#333">
          {`${chart.tzLabel}  ·  ${Math.abs(chart.lat).toFixed(2)}°${chart.lat >= 0 ? "N" : "S"} ${Math.abs(chart.lng).toFixed(2)}°${chart.lng >= 0 ? "E" : "W"}`}
        </text>
        <text x={C} y={I + 160} textAnchor="middle" fontSize="15" fontStyle="italic" fill="#333">Geocentric · Tropical</text>
        <text x={C} y={I + 182} textAnchor="middle" fontSize="15" fontStyle="italic" fill="#333">Regiomontanus</text>
        <text x={C} y={I + 218} textAnchor="middle" fontSize="18" fill="#111">
          {`ASC ${fmtLon(chart.asc)}   MC ${fmtLon(chart.mc)}`}
        </text>
        <text x={C} y={I + 246} textAnchor="middle" fontSize="15" fill="#444">
          {chart.sect === "day" ? "Day chart" : "Night chart"}
        </text>
      </g>
    </svg>
  );
}

function fmtLon(lon: number): string {
  const signs = Object.keys(SIGN_GLYPH) as Array<keyof typeof SIGN_GLYPH>;
  const s = signs[Math.floor(norm360(lon) / 30)];
  const dis = norm360(lon) % 30;
  const deg = Math.floor(dis);
  const min = Math.floor((dis - deg) * 60 + 1e-9);
  return `${pad(deg)}° ${SIGN_GLYPH[s]} ${pad(min)}'`;
}
