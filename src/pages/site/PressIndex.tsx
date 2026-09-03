// Press index — all releases, newest first.

import { Link } from "react-router";
import { PRESS } from "@/site/press";
import { useMeta } from "@/components/SiteLayout";

export default function PressIndex() {
  useMeta(
    "Press Releases — The Cunning Man",
    "Press releases from The Cunning Man: free Renaissance astrology, chaos magic, and rune tools — launch news, the astro trading clock, synastry meter, sigil engine, and rune cast."
  );
  return (
    <div>
      <h1 className="text-3xl font-bold mb-1" style={{ fontVariant: "small-caps" }}>✒ Press Room</h1>
      <p className="text-[14px] text-[#4a351f] max-w-3xl mb-6">
        Releases fit for print. Journalists and advertisers: everything here may be quoted freely
        with a link back.
      </p>
      <div className="space-y-4">
        {PRESS.map((p) => (
          <article key={p.slug} className="border-2 border-[#5a3d1e] bg-[#f7f0da] p-4">
            <p className="text-[11px] text-[#6b5537] font-bold">{p.dateline} · {p.date}</p>
            <h2 className="text-xl font-bold my-1">
              <Link to={`/press/${p.slug}`} className="hover:text-[#7a1f1f] underline decoration-[#c9b98a]">
                {p.title}
              </Link>
            </h2>
            <p className="text-[13px] italic text-[#4a351f]">{p.excerpt}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
