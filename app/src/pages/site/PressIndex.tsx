// Press index — all releases, newest first.

import { Link } from "react-router";
import { PRESS } from "@/site/press";
import { useMeta } from "@/hooks/useMeta";

export default function PressIndex() {
  useMeta(
    "Press Releases — The Cunning Man",
    "Press releases from The Cunning Man: free Renaissance astrology, chaos magic, and rune tools — launch news, the astro trading clock, synastry meter, sigil engine, and rune cast."
  );
  return (
    <div>
      <h1 className="text-3xl font-bold mb-1 font-smallcaps">✒ Press Room</h1>
      <p className="text-[14px] text-ink-soft max-w-3xl mb-6">
        Releases fit for print. Journalists and advertisers: everything here may be quoted freely
        with a link back.
      </p>
      <div className="space-y-4">
        {PRESS.map((p) => (
          <article key={p.slug} className="border-2 border-line bg-card p-4">
            <p className="text-[11px] text-ink-soft font-bold">{p.dateline} · {p.date}</p>
            <h2 className="text-xl font-bold my-1">
              <Link to={`/press/${p.slug}`} className="hover:text-seal underline decoration-line">
                {p.title}
              </Link>
            </h2>
            <p className="text-[13px] italic text-ink-soft">{p.excerpt}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
