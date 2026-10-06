// A piece of traditional testimony attached to a transit.

import type { ReactElement } from "react";
import type { Testimony } from "@/data/tradition";

export function TestimonyCard({ testimony }: { testimony: Testimony }): ReactElement {
  if (testimony.kind === "quote") {
    return (
      <blockquote
        className="manor-card mt-1 px-3 py-2 font-display italic text-[13px]"
        aria-label={`Testimony from ${testimony.author}`}
      >
        <p>“{testimony.text}”</p>
        <footer className="mt-1 not-italic font-ui text-[11px] text-ink-soft">
          — {testimony.author}, <cite>{testimony.work}</cite> ({testimony.year})
        </footer>
      </blockquote>
    );
  }
  return (
    <aside
      className="manor-card mt-1 px-3 py-2 font-display italic text-[13px]"
      aria-label={`Doctrine after ${testimony.author}`}
    >
      <p>
        After {testimony.author}, <cite>{testimony.work}</cite> ({testimony.year}):{" "}
        {testimony.text}
      </p>
    </aside>
  );
}
