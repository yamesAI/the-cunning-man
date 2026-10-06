// Synastry Meter — two charts weighed for sympathy.

import { useMemo, useState } from "react";
import { computeSynastry, pointLabel } from "@/astro/synastry";
import { ASPECT_GLYPH } from "@/astro/constants";
import { useMeta } from "@/hooks/useMeta";

function Meter({ score }: { score: number }) {
  // semicircular gauge, needle at score 0..100
  const ang = (-180 + (score / 100) * 180) * (Math.PI / 180);
  const cx = 150, cy = 140, r = 110;
  const nx = cx + r * 0.82 * Math.cos(ang), ny = cy + r * 0.82 * Math.sin(ang);
  return (
    <svg viewBox="0 0 300 165" className="w-full max-w-[340px] mx-auto" role="img" aria-label={`Synastry score ${score} of 100`}>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" style={{ stroke: "hsl(var(--line))" }} strokeWidth="14" />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(ang - Math.PI / 2 + Math.PI / 2 * 0)} ${cy}`}
        fill="none"
      />
      {/* colored arc up to needle */}
      <path
        d={describeArc(cx, cy, r, -180, -180 + (score / 100) * 180)}
        fill="none" style={{ stroke: "hsl(var(--seal))" }} strokeWidth="14"
      />
      {[0, 25, 50, 75, 100].map((v) => {
        const a = (-180 + (v / 100) * 180) * (Math.PI / 180);
        const x1 = cx + (r - 12) * Math.cos(a), y1 = cy + (r - 12) * Math.sin(a);
        const x2 = cx + (r + 8) * Math.cos(a), y2 = cy + (r + 8) * Math.sin(a);
        const tx = cx + (r + 20) * Math.cos(a), ty = cy + (r + 20) * Math.sin(a) + 4;
        return (
          <g key={v}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} style={{ stroke: "hsl(var(--ink))" }} strokeWidth="1.5" />
            <text x={tx} y={ty} fontSize="11" textAnchor="middle" style={{ fill: "hsl(var(--ink))" }}>{v}</text>
          </g>
        );
      })}
      <line x1={cx} y1={cy} x2={nx} y2={ny} style={{ stroke: "hsl(var(--ink))" }} strokeWidth="3" />
      <circle cx={cx} cy={cy} r="6" style={{ fill: "hsl(var(--ink))" }} />
      <text x={cx} y={cy + 24} fontSize="20" fontWeight="bold" textAnchor="middle" style={{ fill: "hsl(var(--seal))" }}>{score}</text>
    </svg>
  );
}

function describeArc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p0 = [cx + r * Math.cos((a0 * Math.PI) / 180), cy + r * Math.sin((a0 * Math.PI) / 180)];
  const p1 = [cx + r * Math.cos((a1 * Math.PI) / 180), cy + r * Math.sin((a1 * Math.PI) / 180)];
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${p0[0]} ${p0[1]} A ${r} ${r} 0 ${large} 1 ${p1[0]} ${p1[1]}`;
}

function BirthInput({ label, dt, setDt }: { label: string; dt: string; setDt: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1 text-[13px]">
      <span className="font-bold font-smallcaps">{label}</span>
      <input
        type="datetime-local"
        value={dt}
        onChange={(e) => setDt(e.target.value)}
        className="border border-line bg-card px-2 py-1"
      />
    </label>
  );
}

export default function SynastryPage() {
  useMeta(
    "Free Synastry Meter — Relationship Compatibility by Renaissance Astrology",
    "Cast two birth charts and read their sympathy the old way: Sun, Moon, Venus, Mars and the Ascendant weighed into one synastry score, free."
  );
  const [dtA, setDtA] = useState("1990-06-15T10:30");
  const [dtB, setDtB] = useState("1992-11-02T18:45");
  const [lat, setLat] = useState("51.5074");
  const [lng, setLng] = useState("-0.1278");
  const [run, setRun] = useState(1);

  const result = useMemo(() => {
    if (!run) return null;
    const la = parseFloat(lat), ln = parseFloat(lng);
    const dA = new Date(dtA), dB = new Date(dtB);
    if (!Number.isFinite(la) || !Number.isFinite(ln) || isNaN(dA.getTime()) || isNaN(dB.getTime())) return null;
    return computeSynastry(dA, dB, la, ln);
  }, [run, dtA, dtB, lat, lng]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1 font-smallcaps">☌ The Synastry Meter</h1>
      <p className="text-[14px] text-ink-soft max-w-3xl mb-4">
        Give the birth moments of two souls. The meter weighs the lights, the lovers' planets and the
        Ascendant of one against the other, by the doctrine of sympathy and antipathy.
      </p>

      <div className="border-2 border-line bg-card p-4 flex flex-wrap items-end gap-4">
        <BirthInput label="First birth moment" dt={dtA} setDt={setDtA} />
        <BirthInput label="Second birth moment" dt={dtB} setDt={setDtB} />
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="font-bold font-smallcaps">Latitude</span>
          <input value={lat} onChange={(e) => setLat(e.target.value)} className="w-24 border border-line bg-card px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="font-bold font-smallcaps">Longitude</span>
          <input value={lng} onChange={(e) => setLng(e.target.value)} className="w-24 border border-line bg-card px-2 py-1" />
        </label>
        <button
          onClick={() => setRun((r) => r + 1)}
          className="bg-seal text-card px-4 py-1.5 border border-line hover:bg-seal-deep font-bold font-smallcaps"
        >
          Weigh the charts
        </button>
      </div>

      {result && (
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="border-2 border-line bg-card p-4 text-center">
            <Meter score={result.score} />
            <p className="text-[14px] italic mt-1">{result.verdict}</p>
            <p className="text-[11px] text-ink-soft mt-2">0 = antipathy · 50 = indifference · 100 = perfect sympathy</p>
          </div>
          <div className="border-2 border-line bg-card p-4">
            <h2 className="font-bold mb-2 font-smallcaps">The testimonies</h2>
            <table className="tbl-ledger">
              <caption className="text-left font-bold mb-2 font-display font-smallcaps">The testimonies</caption>
              <thead>
                <tr>
                  <th scope="col">First chart</th>
                  <th scope="col">Aspect</th>
                  <th scope="col">Second chart</th>
                  <th scope="col">Orb</th>
                  <th scope="col">Points</th>
                </tr>
              </thead>
              <tbody>
                {result.aspects.map((a, i) => (
                  <tr key={i}>
                    <td className="py-1">1st {pointLabel(a.a)}</td>
                    <td className="py-1 text-center"><span aria-hidden="true">{ASPECT_GLYPH[a.aspectKey]}</span> <span className="sr-only">{a.aspectKey}</span></td>
                    <td className="py-1">2nd {pointLabel(a.b)}</td>
                    <td className="py-1 text-right text-[12px] text-ink-soft">{a.orb.toFixed(1)}°</td>
                    <td className={`py-1 text-right font-bold ${a.pts > 0 ? "text-spruce" : "text-seal"}`}>
                      {a.pts > 0 ? `+${a.pts}` : a.pts}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
