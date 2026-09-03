// Rune Cast — Elder Futhark lots, one or three.

import { useState } from "react";
import { RUNES, drawRunes } from "@/site/runes";
import { useMeta } from "@/components/SiteLayout";

const POSITIONS = ["What has been", "What is", "What may come"];

export default function RunesPage() {
  useMeta(
    "Free Rune Cast — Elder Futhark Rune Reading Online",
    "Cast the Elder Futhark runes free: a single lot for a quick answer, or the three-Norn spread of what has been, what is, and what may come."
  );
  const [count, setCount] = useState<1 | 3>(3);
  const [draw, setDraw] = useState<number[] | null>(() => drawRunes(3));

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1" style={{ fontVariant: "small-caps" }}>ᚱ The Rune Cast</h1>
      <p className="text-[14px] text-[#4a351f] max-w-3xl mb-4">
        Hold your question in mind and draw the lots. One rune for a swift answer; three for the
        way of the Norns — what has been, what is, and what may come.
      </p>

      <div className="border-2 border-[#5a3d1e] bg-[#f7f0da] p-4 flex flex-wrap items-center gap-4">
        <div className="flex gap-2 text-[13px]">
          {([1, 3] as const).map((n) => (
            <button
              key={n}
              onClick={() => { setCount(n); setDraw(null); }}
              className={`px-3 py-1 border border-[#5a3d1e] ${count === n ? "bg-[#7a1f1f] text-[#f5eeda]" : "hover:bg-[#ddce9f]"}`}
              style={{ fontVariant: "small-caps" }}
            >
              {n === 1 ? "Single lot" : "Three Norns"}
            </button>
          ))}
        </div>
        <button
          onClick={() => setDraw(drawRunes(count))}
          className="bg-[#2b1d0e] text-[#f5eeda] px-4 py-1.5 border border-[#5a3d1e] hover:bg-[#1c1106] font-bold"
          style={{ fontVariant: "small-caps" }}
        >
          {draw ? "Cast again" : "Cast the runes"}
        </button>
      </div>

      {draw && (
        <div className={`mt-6 grid gap-6 ${draw.length === 1 ? "md:grid-cols-1 max-w-xl" : "md:grid-cols-3"}`}>
          {draw.map((ri, i) => {
            const r = RUNES[ri];
            return (
              <div key={i} className="border-2 border-[#5a3d1e] bg-[#f7f0da] p-4 text-center">
                {draw.length === 3 && (
                  <p className="text-[12px] font-bold text-[#6b5537] mb-1" style={{ fontVariant: "small-caps" }}>
                    {POSITIONS[i]}
                  </p>
                )}
                <p className="text-[84px] leading-none my-2" style={{ textShadow: "1px 1px 0 #d8c9a3" }}>{r.glyph}</p>
                <p className="font-bold text-[16px]" style={{ fontVariant: "small-caps" }}>
                  {r.name} <span className="text-[#6b5537] font-normal">({r.phonetic})</span>
                </p>
                <p className="text-[13px] mt-2 text-left">{r.meaning}</p>
                <div className="text-left text-[12px] mt-3 space-y-1">
                  <p><b className="text-[#7a1f1f]">In love:</b> {r.love}</p>
                  <p><b className="text-[#1e6b34]">In money:</b> {r.money}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-[#6b5537] italic mt-6">
        The cast is drawn without replacement from the full twenty-four of the Elder Futhark.
        For timing a working by the answer, see the <a href="/launches" className="underline">launch elections</a>.
      </p>
    </div>
  );
}
