// Site chrome for The Cunning Man: header nav + footer + per-page meta.

import { useEffect, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router";

export function useMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    let m = document.querySelector('meta[name="description"]');
    if (!m) {
      m = document.createElement("meta");
      m.setAttribute("name", "description");
      document.head.appendChild(m);
    }
    m.setAttribute("content", description);
  }, [title, description]);
}

const NAV = [
  { to: "/clock", label: "Astro Clock" },
  { to: "/synastry", label: "Synastry Meter" },
  { to: "/launches", label: "Launch Elections" },
  { to: "/sigil", label: "Sigil Engine" },
  { to: "/runes", label: "Rune Cast" },
  { to: "/spells/love", label: "Love Spell" },
  { to: "/spells/money", label: "Money Spell" },
  { to: "/press", label: "Press" },
];

// Inside a widget iframe the URL path is a resource path we don't control and
// host chrome already frames the page — render content bare, no site chrome.
export const inIframe = typeof window !== "undefined" && window.self !== window.top;

export function SiteLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const onClock = pathname === "/clock";
  if (inIframe) return <>{children}</>;
  return (
    <div className="min-h-screen bg-[#f0e8d0] text-[#2b1d0e]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <header className="border-b-4 border-double border-[#5a3d1e] bg-[#e8dcbc]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link to="/" className="text-2xl font-bold tracking-wide" style={{ fontVariant: "small-caps" }}>
            ⛥ The Cunning Man
          </Link>
          <span className="text-[12px] italic text-[#6b5537]">Free arts of Renaissance astrology · chaos magic · the runes</span>
          <nav className="flex flex-wrap gap-x-1 gap-y-1 text-[13px] ml-auto">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `px-2 py-1 border ${isActive ? "bg-[#7a1f1f] text-[#f5eeda] border-[#7a1f1f]" : "border-[#5a3d1e] hover:bg-[#ddce9f]"}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      {onClock ? (
        children
      ) : (
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      )}
      <footer className="border-t-4 border-double border-[#5a3d1e] bg-[#e8dcbc] mt-8">
        <div className="max-w-6xl mx-auto px-4 py-4 text-[12px] text-[#6b5537] flex flex-wrap gap-x-6 gap-y-1">
          <span>☿ The Cunning Man — all arts free of charge</span>
          <span className="italic">For entertainment &amp; study. Not financial, medical, or legal advice.</span>
          <span className="ml-auto italic">Tropical · Geocentric · Regiomontanus</span>
        </div>
      </footer>
    </div>
  );
}
