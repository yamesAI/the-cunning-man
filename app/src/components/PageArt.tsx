// Visible page still, credit, and art-sibling links (HUB-ART-001).
// JSON-LD is injected via structuredData.ts / RouteHead, not here.

import { Link, useLocation } from "react-router";
import { artForPath, contentPath, creditText } from "@/site/art";

function SiblingLink({ to }: { to: string }) {
  const label = to === "/" ? "Home" : to;
  if (to.startsWith("http")) {
    return <a href={to} className="underline hover:text-seal">{label}</a>;
  }
  return <Link to={to} className="underline hover:text-seal">{label}</Link>;
}

export function PageArt() {
  const { pathname } = useLocation();
  const hit = artForPath(pathname);
  if (!hit) return null;
  const { work, assignment } = hit;
  const src = contentPath(work);
  return (
    <figure className="mb-6 max-w-xl">
      <img
        src={src}
        alt={work.alt}
        width={800}
        height={1000}
        className="w-full h-auto max-h-[28rem] object-contain border border-line bg-card"
      />
      <figcaption className="text-[12px] text-ink-soft mt-2 leading-relaxed">
        <span>{creditText(work)} </span>
        <a href={work.sourceRecord} target="_blank" rel="noopener noreferrer" className="underline hover:text-seal">
          Source record ↗
        </a>
        {assignment.siblings.length > 0 ? (
          <span>
            {" "}Also on:{" "}
            {assignment.siblings.map((s, i) => (
              <span key={s}>
                {i > 0 ? ", " : ""}
                <SiblingLink to={s} />
              </span>
            ))}
            .
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}
