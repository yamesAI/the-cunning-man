// Single press release.

import { Link, useParams } from "react-router";
import { PRESS } from "@/site/press";
import { useMeta } from "@/hooks/useMeta";

export default function PressRelease() {
  const { slug } = useParams();
  const p = PRESS.find((x) => x.slug === slug) ?? PRESS[0];
  useMeta(`${p.title} — The Cunning Man`, p.excerpt);
  return (
    <article className="max-w-3xl">
      <p className="text-[12px] mb-2"><Link to="/press" className="underline text-ink-soft">← All releases</Link></p>
      <div className="border-2 border-line bg-card p-6">
        <p className="text-[12px] font-bold text-ink-soft tracking-wide">
          FOR IMMEDIATE RELEASE · {p.dateline} · {p.date}
        </p>
        <h1 className="text-2xl md:text-3xl font-bold my-3 leading-tight">{p.title}</h1>
        {p.body.map((para, i) => (
          <p key={i} className={`text-[14px] leading-relaxed mb-3 ${i === 0 ? "first-letter:text-3xl first-letter:font-bold first-letter:text-seal first-letter:mr-0.5" : ""}`}>
            {para}
          </p>
        ))}
        <p className="text-[13px] text-center font-bold mt-4 font-smallcaps">— 30 —</p>
        <div className="border-t border-line mt-4 pt-3 text-[12px] text-ink-soft">
          <p className="font-bold font-smallcaps">About The Cunning Man</p>
          <p>
            The Cunning Man is a free public grimoire of Renaissance astrology, chaos magic, and the
            Elder Futhark runes: a live astrological clock, synastry meter, launch elections, sigil
            engine, rune casts, and planetary-hour spell timing. All instruments are free of charge.
            Offered for study and entertainment — not financial, medical, or legal advice.
          </p>
        </div>
      </div>
    </article>
  );
}
