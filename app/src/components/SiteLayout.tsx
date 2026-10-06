// Site chrome for The Cunning Man: header nav + footer + live sky pill.

import type { ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { useSky } from "@/sky/SkyContext";
import { CITIES } from "@/data/cities";
import { inIframe } from "@/lib/env";
import { tzForLocation } from "@/astro/engine";
import { wallParts, tzOffsetLabel, pad } from "@/astro/format";

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

// (inIframe lives in src/lib/env.ts so this file only exports components.)

function SkyPill() {
  const { now, loc, setLoc, refreshLocation } = useSky();
  const tz = tzForLocation(loc.lat, loc.lng);
  const w = wallParts(now, tz);
  const clock = `${pad(w.hour)}:${pad(w.minute)}:${pad(w.second)}`;
  const currentCity =
    CITIES.find((c) => Math.abs(c.lat - loc.lat) < 0.01 && Math.abs(c.lng - loc.lng) < 0.01)?.name ??
    "";
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <time
        dateTime={now.toISOString()}
        aria-label={`Current time at ${loc.name}`}
        className="font-ui tabular-nums text-[13px]"
      >
        {clock} <span className="opacity-70">{tzOffsetLabel(now, tz)}</span>
      </time>
      <span aria-hidden="true">·</span>
      <span className="italic">{loc.name}</span>
      <select
        aria-label="Set location by preset city"
        value={currentCity}
        onChange={(e) => {
          const city = CITIES.find((c) => c.name === e.target.value);
          if (city) setLoc({ ...city, source: "manual" });
        }}
        className="border border-[#5a3d1e] bg-white px-1 py-0.5"
      >
        <option value="" disabled>
          City…
        </option>
        {CITIES.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        onClick={refreshLocation}
        title="Use my current location"
        className="border border-[#5a3d1e] bg-white px-1.5 py-0.5 hover:bg-neutral-100"
      >
        📍
      </button>
    </div>
  );
}

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
          <div className="ml-auto">
            <SkyPill />
          </div>
          <nav aria-label="Site tools" className="flex flex-wrap gap-x-1 gap-y-1 text-[13px] w-full sm:w-auto">
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
