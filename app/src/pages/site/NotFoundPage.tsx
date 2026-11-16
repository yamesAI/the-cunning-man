// Not-found page (QC-SITE-001 M-2): unknown paths and unknown press slugs.
// RouteHead gives it noindex, no canonical and no route JSON-LD; on Vercel the
// static 404.html (written by scripts/prerender.ts) serves it with HTTP 404.

import { Link } from "react-router";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/clock", label: "Astro Clock" },
  { to: "/charts", label: "Charts" },
  { to: "/dignities", label: "Dignities" },
  { to: "/library", label: "Library" },
  { to: "/press", label: "Press" },
];

export default function NotFoundPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 font-smallcaps">Page not found</h1>
      <p className="text-[14px] text-ink-soft max-w-3xl mb-4">There is no page at this address.</p>
      <ul className="text-[13px] flex flex-wrap gap-x-4 gap-y-1">
        {LINKS.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="inline-block py-1 underline hover:text-seal">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
