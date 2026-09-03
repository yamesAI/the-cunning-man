// Side panels: positions, dignities, moon aspects, planetary hours, moon phase.

import type { ChartData } from "@/astro/engine";
import type { ElectionScan } from "@/astro/election";
import {
  PLANET_COLOR, PLANET_GLYPH, PLANET_LABEL, SIGN_COLOR, SIGN_GLYPH,
  ASPECT_GLYPH, PLANETS, type PlanetKey,
} from "@/astro/constants";
import { fmtTimeTz, fmtDur, pad } from "@/astro/format";
import type { ReactNode } from "react";

const th = "border border-neutral-500 px-1.5 py-0.5 text-[12px] font-bold bg-[#efeedd]";
const td = "border border-neutral-500 px-1.5 py-0.5 text-[13px]";

export function Panel({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="border border-neutral-600 bg-[#fdfdf2]">
      <header className="border-b border-neutral-600 bg-[#efeedd] px-2 py-1 flex items-baseline justify-between">
        <h2 className="text-[12px] font-bold tracking-wide uppercase">{title}</h2>
        {right}
      </header>
      <div className="p-1">{children}</div>
    </section>
  );
}

const Glyph = ({ p, size = 14 }: { p: PlanetKey; size?: number }) => (
  <span style={{ color: PLANET_COLOR[p], fontSize: size }}>{PLANET_GLYPH[p]}</span>
);

// ---------- positions ----------
export function PositionsPanel({ chart }: { chart: ChartData }) {
  return (
    <Panel title="Positions">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={th}></th><th className={th}>Planet</th>
            <th className={th}>Longitude</th><th className={th}>Hse</th><th className={th}>Speed</th>
          </tr>
        </thead>
        <tbody>
          {chart.bodies.map((b) => (
            <tr key={b.key}>
              <td className={`${td} text-center`}><Glyph p={b.key} /></td>
              <td className={td}>{PLANET_LABEL[b.key]}{b.retro && <span className="text-red-700"> ℞</span>}</td>
              <td className={`${td} text-center whitespace-nowrap`}>
                {pad(b.deg)}° <span style={{ color: SIGN_COLOR[b.sign] }}>{SIGN_GLYPH[b.sign]}</span> {pad(b.min)}'
              </td>
              <td className={`${td} text-center`}>{b.house}</td>
              <td className={`${td} text-right`}>{b.speed >= 0 ? "+" : ""}{b.speed.toFixed(2)}°</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

// ---------- essential dignities ----------
export function DignitiesPanel({ chart }: { chart: ChartData }) {
  const head = ["", "Ruler", "Exalt", "Trip", "Term", "Face", "Detn", "Fall", "Score"];
  return (
    <Panel title="Essential Dignities" right={<span className="text-[10px] italic">{chart.sect} chart</span>}>
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr>{head.map((h) => <th key={h} className={`${th} !px-0.5 !text-[11px]`}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {chart.dignities.map((r) => {
            const mark = (on: boolean, p?: PlanetKey) =>
              on ? <Glyph p={r.planet} /> : p ? <Glyph p={p} /> : <span className="text-neutral-400">--</span>;
            return (
              <tr key={r.planet}>
                <td className={`${td} !px-0.5 !text-[12px] text-center`}><Glyph p={r.planet} /></td>
                <td className={`${td} !px-0.5 !text-[12px] text-center`}>{r.ruler ? <Glyph p={r.planet} /> : <span className="text-neutral-400">--</span>}</td>
                <td className={`${td} !px-0.5 !text-[12px] text-center`}>{r.exalt ? <Glyph p={r.planet} /> : <span className="text-neutral-400">--</span>}</td>
                <td className={`${td} !px-0.5 !text-[12px] text-center whitespace-nowrap`}>
                  {r.trip.map((p, i) => (
                    <span key={i} style={{ opacity: (chart.sect === "day") === (i === 0) ? 1 : 0.35 }}>
                      <Glyph p={p} />
                    </span>
                  ))}
                </td>
                <td className={`${td} !px-0.5 !text-[12px] text-center`}>{mark(r.term === r.planet, r.term)}</td>
                <td className={`${td} !px-0.5 !text-[12px] text-center`}>{mark(r.face === r.planet, r.face)}</td>
                <td className={`${td} !px-0.5 !text-[12px] text-center`}>{r.detriment ? <Glyph p={r.planet} /> : <span className="text-neutral-400">--</span>}</td>
                <td className={`${td} !px-0.5 !text-[12px] text-center`}>{r.fall ? <Glyph p={r.planet} /> : <span className="text-neutral-400">--</span>}</td>
                <td className={`${td} !px-0.5 !text-[12px] text-right font-bold`}>
                  {r.score > 0 ? `+${r.score}` : r.score}
                  {r.peregrine && <span title="Peregrine" className="text-red-700"> p</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Panel>
  );
}

// ---------- moon aspects ----------
export function MoonAspectsPanel({ chart }: { chart: ChartData }) {
  return (
    <Panel title="Moon Aspects">
      {chart.moonAspects.length === 0 ? (
        <p className="text-[12px] italic px-1 py-1">No major aspects</p>
      ) : (
        <table className="w-full border-collapse">
          <tbody>
            {chart.moonAspects.map((a, i) => (
              <tr key={i}>
                <td className={`${td} text-center`}><Glyph p="moon" /></td>
                <td className={`${td} text-center`}>{ASPECT_GLYPH[a.aspectKey] ?? a.aspectKey}</td>
                <td className={`${td} text-center`}><Glyph p={a.other} /> <span className="text-[11px]">{PLANET_LABEL[a.other]}</span></td>
                <td className={`${td} text-right`}>{a.orb.toFixed(2)}°</td>
                <td className={`${td} text-center text-[11px]`}>{a.applying ? "appl" : "sep"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}

// ---------- half-grid aspectarian ----------
const ASPECT_STYLE: Record<string, string> = {
  conjunction: "#b9770e", sextile: "#1e8449", trine: "#2471a3",
  square: "#c0392b", opposition: "#c0392b",
};

export function AspectGridPanel({ chart }: { chart: ChartData }) {
  const cell = (p1: PlanetKey, p2: PlanetKey) =>
    chart.aspectsGrid.find(
      (a) => (a.p1 === p1 && a.p2 === p2) || (a.p1 === p2 && a.p2 === p1)
    );
  const gth = "border border-neutral-500 text-center font-bold bg-[#efeedd]";
  return (
    <Panel title="Aspectarian">
      <table className="border-collapse mx-auto">
        <thead>
          <tr>
            <th className={gth}></th>
            {PLANETS.slice(0, -1).map((p) => (
              <th key={p} className={gth} style={{ color: PLANET_COLOR[p], fontSize: 17, width: 30 }}>
                {PLANET_GLYPH[p]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PLANETS.slice(1).map((row, ri) => (
            <tr key={row}>
              <th className={gth} style={{ color: PLANET_COLOR[row], fontSize: 17 }}>
                {PLANET_GLYPH[row]}
              </th>
              {PLANETS.slice(0, -1).map((col, ci) => {
                if (ci > ri) return <td key={col} className="border border-neutral-300 bg-[#f6f5e8]"></td>;
                const a = cell(row, col);
                if (!a) return <td key={col} className="border border-neutral-400"></td>;
                return (
                  <td
                    key={col}
                    className="border border-neutral-500 text-center leading-tight"
                    title={`${PLANET_LABEL[a.p1]} ${a.aspectKey} ${PLANET_LABEL[a.p2]} — orb ${a.orb.toFixed(1)}° ${a.applying ? "applying" : "separating"}`}
                  >
                    <span style={{ color: ASPECT_STYLE[a.aspectKey], fontSize: 16, fontWeight: 700 }}>
                      {ASPECT_GLYPH[a.aspectKey]}
                    </span>
                    <span className="block text-[9px] text-neutral-600 -mt-0.5">
                      {a.orb.toFixed(1)}°{a.applying ? "a" : "s"}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

// ---------- planetary day & hour ----------
export function PlanetaryHoursPanel({ chart, now }: { chart: ChartData; now: Date }) {
  const { curHour, nextHour, rulerOfDay } = chart;
  const ordinal = (n: number) =>
    n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;
  return (
    <Panel title="Planetary Hours">
      <table className="w-full border-collapse mb-1">
        <tbody>
          <tr>
            <td className={td}>Day of <Glyph p={rulerOfDay} size={16} /></td>
            <td className={td}>
              {curHour ? <>Hour of <Glyph p={curHour.ruler} size={16} /></> : "--"}
            </td>
          </tr>
          <tr>
            <td className={td} colSpan={2}>
              {chart.hourOfDay
                ? `${ordinal(chart.hourOfDay.n)} hour of the ${chart.hourOfDay.isDay ? "day" : "night"}`
                : "--"}
            </td>
          </tr>
          <tr>
            <td className={td}>
              {curHour ? <>This hr <Glyph p={curHour.ruler} /> {fmtDur(now.getTime() - curHour.start.getTime())} in</> : "--"}
            </td>
            <td className={td}>
              {nextHour ? <>Next hr <Glyph p={nextHour.ruler} /> in {fmtDur(nextHour.start.getTime() - now.getTime())}</> : "--"}
            </td>
          </tr>
        </tbody>
      </table>
      {chart.sunEv.sunrise && chart.sunEv.sunset && (
        <p className="text-[11px] px-1 pb-1">
          Sunrise {fmtTimeTz(chart.sunEv.sunrise, chart.tzName)} · Sunset {fmtTimeTz(chart.sunEv.sunset, chart.tzName)}
        </p>
      )}
      <div className="flex flex-wrap gap-x-1 px-1 pb-1">
        {chart.hours.map((h) => (
          <span
            key={h.index}
            title={`${h.isDay ? "Day" : "Night"} hour ${h.index}: ${fmtTimeTz(h.start, chart.tzName)} – ${fmtTimeTz(h.end, chart.tzName)}`}
            className={`text-[13px] px-0.5 rounded ${curHour?.index === h.index ? "bg-yellow-200 outline outline-1 outline-neutral-600" : ""} ${!h.isDay ? "opacity-60" : ""}`}
          >
            <Glyph p={h.ruler} />
          </span>
        ))}
      </div>
    </Panel>
  );
}

// ---------- day trading election ----------
const ANGLE_GLYPH: Record<number, string> = { 0: "☌", 60: "⚹", 90: "□", 120: "△", 180: "☍" };

export function ElectionPanel({
  scan, chart, now,
}: {
  scan: ElectionScan;
  chart: ChartData;
  now: Date;
}) {
  const { best, alternates, blocked } = scan;
  const fmtD = (d: Date) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: chart.tzName, weekday: "short", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    }).format(d);
  const fmtT = (d: Date) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: chart.tzName, hour: "numeric", minute: "2-digit", hour12: true,
    }).format(d);
  const inMs = best.date.getTime() - now.getTime();
  return (
    <Panel title="Day Trading Election" right={<span className="text-[10px] italic">next 72h · session 6a–3p UTC-5</span>}>
      <div className="px-1.5 py-1.5 border border-neutral-500 bg-yellow-100 mb-1">
        <div className="text-[11px] uppercase tracking-wide text-neutral-600">Strongest entry window</div>
        <div className="text-[16px] font-bold leading-tight">{fmtD(best.date)}</div>
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-bold">
            Score {best.score > 0 ? `+${best.score}` : best.score}
          </span>
          <span className="text-[12px]">
            {inMs > 0 ? <>in {fmtDur(inMs)}</> : <span className="font-bold text-green-800">now</span>}
          </span>
        </div>
        <div className="text-[12px] mt-0.5">
          {best.voc ? (
            <span className="text-red-800">☽ void of course</span>
          ) : best.moonAspect ? (
            <>
              ☽ {ANGLE_GLYPH[best.moonAspect.angle]}{" "}
              <Glyph p={best.moonAspect.other} /> {PLANET_LABEL[best.moonAspect.other]}
              {inMs > 0 ? ` — exact in ${fmtDur(best.moonAspect.inHours * 3600000)}` : ""}
            </>
          ) : null}
        </div>
      </div>
      <table className="w-full border-collapse mb-1">
        <tbody>
          {best.factors.slice(0, 8).map((f, i) => (
            <tr key={i}>
              <td className={`${td} !text-[12px]`}>{f.label}</td>
              <td className={`${td} !text-[12px] text-right font-bold ${f.pts > 0 ? "text-green-800" : "text-red-800"}`}>
                {f.pts > 0 ? `+${f.pts}` : f.pts}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {alternates.length > 0 && (
        <div className="px-1.5 pb-1 text-[11px] text-neutral-700">
          <span className="font-bold">Also strong: </span>
          {alternates.map((a, i) => (
            <span key={i}>
              {i > 0 && " · "}
              {fmtD(a.date)} ({a.score > 0 ? `+${a.score}` : a.score})
            </span>
          ))}
        </div>
      )}
      {blocked.length > 0 && (
        <div className="border border-red-800 bg-red-100 mx-1 mb-1 px-1.5 py-1">
          <div className="text-[11px] font-bold uppercase tracking-wide text-red-900">
            ⛔ Do not trade — session blocks
          </div>
          {blocked.map((b, i) => {
            const active = b.start.getTime() <= now.getTime() && now.getTime() <= b.end.getTime();
            return (
              <div key={i} className={`text-[11px] leading-snug ${active ? "font-bold text-red-900" : "text-red-800"}`}>
                {fmtD(b.start)} – {fmtT(b.end)}
                {active && " (now)"}
                <span className="block pl-3 text-[10px] font-normal">{b.reasons.join(" · ")}</span>
              </div>
            );
          })}
        </div>
      )}
      <div className="px-1.5 pb-0.5 text-[10px] italic text-neutral-500">
        Traditional electional astrology — not financial advice.
      </div>
    </Panel>
  );
}

export function MoonPanel({ chart, now }: { chart: ChartData; now: Date }) {
  const past = chart.nearestPhases.filter((p) => p.date <= now).slice(-2);
  const future = chart.nearestPhases.filter((p) => p.date > now).slice(0, 3);
  const phaseGlyph = (t: number) => (t === 0 ? "🌑" : t === 90 ? "🌓" : t === 180 ? "🌕" : "🌗");
  const fmtD = (d: Date) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: chart.tzName, month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    }).format(d).toLowerCase();
  return (
    <Panel title="Moon">
      <table className="w-full border-collapse mb-1">
        <tbody>
          <tr>
            <td className={td}>Phase</td>
            <td className={td}>{chart.phase.label} ({Math.round(chart.phase.illumination * 100)}%)</td>
          </tr>
          <tr>
            <td className={td}>Mansion</td>
            <td className={td}>
              {chart.mansion.index}. {chart.mansion.name} <span className="italic text-[11px]">({chart.mansion.arabic})</span>
            </td>
          </tr>
          <tr>
            <td className={td} colSpan={2}>
              <span className="italic text-[11px]">{chart.mansion.meaning}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <table className="w-full border-collapse">
        <thead>
          <tr><th className={th} colSpan={2}>Nearest lunar phases</th></tr>
        </thead>
        <tbody>
          {[...past, ...future].map((p, i) => (
            <tr key={i} className={p.date <= now ? "text-neutral-500" : ""}>
              <td className={td}>{phaseGlyph(p.target)} {p.label}</td>
              <td className={`${td} text-right`}>{fmtD(p.date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
