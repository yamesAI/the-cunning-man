// Live shield-style astrological clock — traditional Renaissance layout.

import { useEffect, useMemo, useState } from "react";
import { computeChart, findAscSignChange } from "@/astro/engine";
import { scanElections } from "@/astro/election";
import { fmtDur } from "@/astro/format";
import { SquareChart } from "@/components/SquareChart";
import {
  PositionsPanel, DignitiesPanel, MoonAspectsPanel, AspectGridPanel, PlanetaryHoursPanel, MoonPanel, ElectionPanel,
} from "@/components/panels";

const STORAGE_KEY = "shield-astro-location";

interface Loc {
  lat: number;
  lng: number;
  name: string;
}

const DEFAULT_LOC: Loc = { lat: 51.5074, lng: -0.1278, name: "London" };

// Widget iframes can run with an opaque origin where localStorage throws.
function loadLoc(): Loc {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const v = JSON.parse(raw);
      if (typeof v.lat === "number" && typeof v.lng === "number") return v;
    }
  } catch { /* storage unavailable */ }
  return DEFAULT_LOC;
}

function saveLoc(loc: Loc) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  } catch { /* storage unavailable */ }
}

export default function Home() {
  const [now, setNow] = useState(() => new Date());
  const [offsetMs, setOffsetMs] = useState(0);
  const [loc, setLoc] = useState<Loc>(loadLoc);
  const [latText, setLatText] = useState(String(loc.lat));
  const [lngText, setLngText] = useState(String(loc.lng));
  const [showOuters, setShowOuters] = useState(true);

  // live tick — once per second
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    saveLoc(loc);
  }, [loc]);

  // the moment being displayed: live time plus any manual offset
  const viewTime = new Date(now.getTime() + offsetMs);

  const chart = useMemo(() => computeChart(viewTime, loc.lat, loc.lng), [
    Math.floor(viewTime.getTime() / 1000), loc.lat, loc.lng,
  ]);

  // election scan over the next 72h — recomputed every 5 minutes
  const election = useMemo(() => scanElections(viewTime, loc.lat, loc.lng), [
    Math.floor(viewTime.getTime() / (5 * 60000)), loc.lat, loc.lng,
  ]);

  const stepTime = (ms: number) => setOffsetMs((o) => o + ms);
  const stepAsc = (dir: 1 | -1) => {
    const t = findAscSignChange(viewTime, dir, loc.lat, loc.lng);
    if (t) setOffsetMs(t.getTime() - Date.now());
  };

  const applyCoords = () => {
    const lat = parseFloat(latText);
    const lng = parseFloat(lngText);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      setLoc({ lat, lng, name: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°` });
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = +pos.coords.latitude.toFixed(4);
      const lng = +pos.coords.longitude.toFixed(4);
      setLatText(String(lat));
      setLngText(String(lng));
      setLoc({ lat, lng, name: "My location" });
    });
  };

  return (
    <div data-kimi-root className="kimi-host-safe-context min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-[#f3f1df] text-neutral-900" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      {/* header */}
      <header data-kimi-priority="p1" className="kimi-host-safe-header shrink-0 border-b-2 border-neutral-700 bg-[#efeedd] px-4 py-2 flex flex-wrap items-center gap-x-6 gap-y-2">
        <div>
          <h1 className="text-xl font-bold tracking-wide">Shield Astrological Clock</h1>
          <p className="text-[11px] italic text-neutral-600">Live traditional chart · updates every second</p>
        </div>
        <div className="font-mono text-lg tabular-nums" aria-live="off">
          {chart.wallClock} <span className="text-[12px] text-neutral-600">{chart.tzLabel}</span>
          {offsetMs !== 0 && (
            <span className="ml-2 text-[11px] font-bold text-red-800 bg-yellow-200 border border-neutral-600 px-1">
              {offsetMs > 0 ? "+" : "−"}{fmtDur(Math.abs(offsetMs))} from live
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[12px] flex-wrap">
          <span className="font-bold shrink-0">Time</span>
          <button onClick={() => stepTime(-86400000)} className="border border-neutral-600 bg-white px-1.5 py-0.5 hover:bg-neutral-100">◀ day</button>
          <button onClick={() => stepTime(-3600000)} className="border border-neutral-600 bg-white px-1.5 py-0.5 hover:bg-neutral-100">◀ hr</button>
          <button onClick={() => stepAsc(-1)} title="Jump to previous Ascendant sign change" className="border border-neutral-600 bg-white px-1.5 py-0.5 hover:bg-neutral-100">◀ asc</button>
          <button
            onClick={() => setOffsetMs(0)}
            disabled={offsetMs === 0}
            className="border border-neutral-600 bg-yellow-100 px-1.5 py-0.5 hover:bg-yellow-200 disabled:opacity-40 font-bold"
          >
            ⟲ live
          </button>
          <button onClick={() => stepAsc(1)} title="Jump to next Ascendant sign change" className="border border-neutral-600 bg-white px-1.5 py-0.5 hover:bg-neutral-100">asc ▶</button>
          <button onClick={() => stepTime(3600000)} className="border border-neutral-600 bg-white px-1.5 py-0.5 hover:bg-neutral-100">hr ▶</button>
          <button onClick={() => stepTime(86400000)} className="border border-neutral-600 bg-white px-1.5 py-0.5 hover:bg-neutral-100">day ▶</button>
        </div>
        <div className="flex items-center gap-2 text-[12px] flex-wrap">
          <label className="flex items-center gap-1 shrink-0">
            Lat
            <input value={latText} onChange={(e) => setLatText(e.target.value)}
              className="w-20 border border-neutral-500 bg-white px-1 py-0.5" />
          </label>
          <label className="flex items-center gap-1 shrink-0">
            Lng
            <input value={lngText} onChange={(e) => setLngText(e.target.value)}
              className="w-20 border border-neutral-500 bg-white px-1 py-0.5" />
          </label>
          <button onClick={applyCoords} className="shrink-0 border border-neutral-600 bg-white px-2 py-0.5 hover:bg-neutral-100">
            Set
          </button>
          <button onClick={useMyLocation} className="shrink-0 border border-neutral-600 bg-white px-2 py-0.5 hover:bg-neutral-100">
            📍 My location
          </button>
          <label className="flex items-center gap-1 ml-2 shrink-0">
            <input type="checkbox" checked={showOuters} onChange={(e) => setShowOuters(e.target.checked)} />
            Outer planets
          </label>
        </div>
      </header>

      {/* main layout — fills the viewport on large screens */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 p-3">
        {/* left column */}
        <div data-kimi-priority="p2" className="flex lg:flex-col flex-wrap gap-3 lg:w-[350px] shrink-0 [&>*]:w-full lg:overflow-y-auto lg:overflow-x-hidden lg:pr-1">
          <DignitiesPanel chart={chart} />
          <MoonAspectsPanel chart={chart} />
          <AspectGridPanel chart={chart} />
        </div>

        {/* center wheel — P0: first on narrow surfaces, as large as the viewport allows */}
        <div data-kimi-priority="p0" className="order-first lg:order-none flex-1 min-w-[280px] min-h-0 flex items-center justify-center">
          <div className="wheel-frame border border-neutral-600 bg-[#fbfadf] shadow-sm aspect-square w-full lg:w-auto lg:h-full max-h-full max-w-full mx-auto">
            <SquareChart chart={chart} showOuters={showOuters} />
          </div>
        </div>

        {/* right column */}
        <div data-kimi-priority="p2" className="flex lg:flex-col flex-wrap gap-3 lg:w-[350px] shrink-0 [&>*]:w-full lg:overflow-y-auto lg:overflow-x-hidden lg:pr-1">
          <ElectionPanel scan={election} chart={chart} now={viewTime} />
          <PositionsPanel chart={chart} />
          <PlanetaryHoursPanel chart={chart} now={viewTime} />
          <MoonPanel chart={chart} now={viewTime} />
        </div>
      </main>

      <footer data-kimi-priority="p3" className="shrink-0 px-4 pb-2 text-[11px] italic text-neutral-500">
        Tropical zodiac · Geocentric · Regiomontanus houses · Egyptian terms · Live geocentric positions
        recomputed in your browser — in the tradition of Renaissance astrology.
      </footer>
    </div>
  );
}
