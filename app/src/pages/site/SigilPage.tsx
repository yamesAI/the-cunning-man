// Sigil Engine — chaos-magic letter reduction drawn as a monogram of intent.

import { useMemo, useState } from "react";
import { useMeta } from "@/components/SiteLayout";

interface SigilData {
  intention: string;
  consonants: string;
  letters: string[];   // unique letters, in order of first appearance
  points: Array<[number, number]>;
}

const CX = 160, CY = 160, R0 = 118;

function buildSigil(raw: string): SigilData | null {
  const intention = raw.toUpperCase().replace(/[^A-Z\s]/g, "").replace(/\s+/g, " ").trim();
  if (!intention) return null;
  const consonants = intention.replace(/[AEIOU\s]/g, "");
  if (!consonants) return null;
  const letters: string[] = [];
  for (const ch of consonants) if (!letters.includes(ch)) letters.push(ch);
  const pts: Array<[number, number]> = letters.map((ch, i) => {
    const idx = ch.charCodeAt(0) - 65;           // A=0 … Z=25
    const ang = (idx / 26) * Math.PI * 2 - Math.PI / 2;
    // gentle inward spiral so repeated rings don't fully overlap
    const r = R0 - (i / Math.max(letters.length - 1, 1)) * 34;
    return [CX + r * Math.cos(ang), CY + r * Math.sin(ang)];
  });
  return { intention, consonants, letters, points: pts };
}

function SigilSvg({ data }: { data: SigilData }) {
  const pts = data.points;
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const first = pts[0], last = pts[pts.length - 1];
  return (
    <svg viewBox="0 0 320 320" className="w-full max-w-[340px] mx-auto" role="img" aria-label="Chaos sigil">
      {/* letter ring */}
      <circle cx={CX} cy={CY} r={R0 + 22} fill="none" stroke="#5a3d1e" strokeWidth="1.5" />
      <circle cx={CX} cy={CY} r={R0 - 40} fill="none" stroke="#c9b98a" strokeWidth="1" strokeDasharray="3 5" />
      {Array.from({ length: 26 }, (_, i) => {
        const ang = (i / 26) * Math.PI * 2 - Math.PI / 2;
        const x = CX + (R0 + 22) * Math.cos(ang), y = CY + (R0 + 22) * Math.sin(ang);
        const used = data.letters.includes(String.fromCharCode(65 + i));
        return (
          <text key={i} x={x} y={y + 4} fontSize="11" textAnchor="middle"
            fill={used ? "#7a1f1f" : "#a5987a"} fontWeight={used ? "bold" : "normal"}>
            {String.fromCharCode(65 + i)}
          </text>
        );
      })}
      {pts.length === 1 ? (
        <circle cx={first[0]} cy={first[1]} r="7" fill="none" stroke="#2b1d0e" strokeWidth="2.5" />
      ) : (
        <>
          <path d={path} fill="none" stroke="#2b1d0e" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {/* start: circle */}
          <circle cx={first[0]} cy={first[1]} r="6" fill="none" stroke="#7a1f1f" strokeWidth="2.5" />
          {/* end: crossbar perpendicular to final segment */}
          {(() => {
            const prev = pts[pts.length - 2];
            const dx = last[0] - prev[0], dy = last[1] - prev[1];
            const len = Math.hypot(dx, dy) || 1;
            const px = (-dy / len) * 8, py = (dx / len) * 8;
            return (
              <line x1={last[0] - px} y1={last[1] - py} x2={last[0] + px} y2={last[1] + py}
                stroke="#7a1f1f" strokeWidth="2.5" strokeLinecap="round" />
            );
          })()}
        </>
      )}
    </svg>
  );
}

export default function SigilPage() {
  useMeta(
    "Free Chaos Sigil Engine — Turn an Intention into a Sigil",
    "The Austin Spare method, automated: write your intention, strike the vowels, keep each letter once, and the engine draws your sigil. Free chaos magic tool."
  );
  const [text, setText] = useState("MY WILL BRINGS WEALTH TO ME");
  const [run, setRun] = useState(1);

  const data = useMemo(() => (run ? buildSigil(text) : null), [run, text]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1" style={{ fontVariant: "small-caps" }}>🜏 The Sigil Engine</h1>
      <p className="text-[14px] text-[#4a351f] max-w-3xl mb-4">
        The chaos-magic method of Austin Osman Spare: write the intention as a plain statement of
        will, strike out the vowels, keep each letter once, and bind the survivors into one glyph.
        Charge it at the height of gnosis, then forget it — the sigil works best forgotten.
      </p>

      <div className="border-2 border-[#5a3d1e] bg-[#f7f0da] p-4 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-[13px] flex-1 min-w-[260px]">
          <span className="font-bold" style={{ fontVariant: "small-caps" }}>State of intent (present tense, no “want”)</span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="border border-[#5a3d1e] bg-white px-2 py-1 tracking-wide uppercase"
            maxLength={60}
          />
        </label>
        <button
          onClick={() => setRun((r) => r + 1)}
          className="bg-[#7a1f1f] text-[#f5eeda] px-4 py-1.5 border border-[#5a3d1e] hover:bg-[#5f1717] font-bold"
          style={{ fontVariant: "small-caps" }}
        >
          Distill the sigil
        </button>
      </div>

      {data && (
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="border-2 border-[#5a3d1e] bg-[#f7f0da] p-4">
            <SigilSvg data={data} />
            <p className="text-center text-[12px] text-[#6b5537] italic mt-1">
              Begin at the red circle; close at the red bar.
            </p>
          </div>
          <div className="border-2 border-[#5a3d1e] bg-[#f7f0da] p-4 text-[14px]">
            <h2 className="font-bold mb-2" style={{ fontVariant: "small-caps" }}>The reduction</h2>
            <p className="mb-1"><span className="text-[#6b5537]">Intention:</span> <b>{data.intention}</b></p>
            <p className="mb-1"><span className="text-[#6b5537]">Vowels struck:</span> <b className="tracking-[0.2em]">{data.consonants}</b></p>
            <p className="mb-3"><span className="text-[#6b5537]">Letters kept once:</span> <b className="tracking-[0.2em] text-[#7a1f1f]">{data.letters.join(" ")}</b></p>
            <h2 className="font-bold mb-1" style={{ fontVariant: "small-caps" }}>Working the sigil</h2>
            <ol className="list-decimal ml-5 space-y-1 text-[13px]">
              <li>Copy the glyph by hand — ink on paper, or carve it into a candle.</li>
              <li>Gaze at it at the peak of excitement, exhaustion, or meditation (gnosis).</li>
              <li>Burn, bury, or hide the drawing, and put the matter out of mind.</li>
            </ol>
            <p className="text-[11px] text-[#6b5537] italic mt-3">
              Pair your working with a fit planetary hour — see the <a href="/spells/love" className="underline">love</a> or{" "}
              <a href="/spells/money" className="underline">money</a> workings.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
