// Live shield-style astrological clock — traditional Renaissance layout.

import { useMemo, useState } from "react";
import { computeChart, findAscSignChange } from "@/astro/engine";
import { scanElections } from "@/astro/election";
import { fmtDur } from "@/astro/format";
import { useSky } from "@/sky/sky-context";
import { useJsonLd } from "@/hooks/useJsonLd";
import { CITIES } from "@/data/cities";
import { SquareChart } from "@/components/SquareChart";
import { useTilt } from "@/hooks/useTilt";
import { ActiveTransitsPanel } from "@/components/ActiveTransitsPanel";
import {
  PositionsPanel, DignitiesPanel, MoonAspectsPanel, AspectGridPanel, PlanetaryHoursPanel, MoonPanel, ElectionPanel,
} from "@/components/panels";

export default function Home() {
  useJsonLd("ld-app", {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "The Cunning Man — Shield Astrological Clock",
    url: "https://the-cunning-man-davids-projects-76350782.vercel.app/clock",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Any (web browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description:
      "A living Renaissance shield chart: Ascendant, houses, essential dignities, planetary hours, Moon, live aspects and active transits, recomputed every second for your horizon. Free.",
  });
  const { now, loc, setLoc, refreshLocation } = useSky();
  const [offsetMs, setOffsetMs] = useState(0);
  const [latText, setLatText] = useState(String(loc.lat));
  const [lngText, setLngText] = useState(String(loc.lng));
  const [showOuters, setShowOuters] = useState(true);
  const tiltRef = useTilt<HTMLDivElement>();

  // the moment being displayed: live time plus any manual offset
  const viewTime = new Date(now.getTime() + offsetMs);
  const secBucket = Math.floor(viewTime.getTime() / 1000);
  const min5Bucket = Math.floor(viewTime.getTime() / (5 * 60000));

  // memo callbacks close over the buckets only, so memoization is preserved
  const chart = useMemo(
    () => computeChart(new Date(secBucket * 1000), loc.lat, loc.lng),
    [secBucket, loc.lat, loc.lng]
  );

  // election scan over the next 72h — recomputed every 5 minutes
  const election = useMemo(
    () => scanElections(new Date(min5Bucket * 5 * 60000), loc.lat, loc.lng),
    [min5Bucket, loc.lat, loc.lng]
  );

  const stepTime = (ms: number) => setOffsetMs((o) => o + ms);
  const stepAsc = (dir: 1 | -1) => {
    const t = findAscSignChange(viewTime, dir, loc.lat, loc.lng);
    if (t) setOffsetMs(t.getTime() - Date.now());
  };

  const applyCoords = () => {
    const lat = parseFloat(latText);
    const lng = parseFloat(lngText);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      setLoc({ lat, lng, name: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`, source: "manual" });
    }
  };

  const currentCity =
    CITIES.find((c) => Math.abs(c.lat - loc.lat) < 0.01 && Math.abs(c.lng - loc.lng) < 0.01)?.name ?? "";

  return (
    <div data-kimi-root className="kimi-host-safe-context min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-parchment text-ink font-ui">
      {/* header */}
      <header data-kimi-priority="p1" className="kimi-host-safe-header shrink-0 border-b-2 border-line bg-parchment-deep px-4 py-2 flex flex-wrap items-center gap-x-6 gap-y-2">
        <div>
          <h1 className="text-xl font-bold tracking-wide">Shield Astrological Clock</h1>
          <p className="text-[11px] italic text-ink-soft">Live traditional chart · updates every second</p>
        </div>
        <div className="font-mono text-lg tabular-nums" aria-live="off">
          {chart.wallClock} <span className="text-[12px] text-ink-soft">{chart.tzLabel}</span>
          {offsetMs !== 0 && (
            <span className="ml-2 text-[11px] font-bold text-seal-deep bg-brass/20 border border-line px-1">
              {offsetMs > 0 ? "+" : "−"}{fmtDur(Math.abs(offsetMs))} from live
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[12px] flex-wrap">
          <span className="font-bold shrink-0">Time</span>
          <button onClick={() => stepTime(-86400000)} className="border border-line bg-card px-1.5 py-0.5 hover:bg-parchment-deep">◀ day</button>
          <button onClick={() => stepTime(-3600000)} className="border border-line bg-card px-1.5 py-0.5 hover:bg-parchment-deep">◀ hr</button>
          <button onClick={() => stepAsc(-1)} title="Jump to previous Ascendant sign change" className="border border-line bg-card px-1.5 py-0.5 hover:bg-parchment-deep">◀ asc</button>
          <button
            onClick={() => setOffsetMs(0)}
            disabled={offsetMs === 0}
            className="border border-brass bg-brass/15 px-1.5 py-0.5 hover:bg-brass/25 disabled:opacity-40 font-bold"
          >
            ⟲ live
          </button>
          <button onClick={() => stepAsc(1)} title="Jump to next Ascendant sign change" className="border border-line bg-card px-1.5 py-0.5 hover:bg-parchment-deep">asc ▶</button>
          <button onClick={() => stepTime(3600000)} className="border border-line bg-card px-1.5 py-0.5 hover:bg-parchment-deep">hr ▶</button>
          <button onClick={() => stepTime(86400000)} className="border border-line bg-card px-1.5 py-0.5 hover:bg-parchment-deep">day ▶</button>
        </div>
        <div className="flex items-center gap-2 text-[12px] flex-wrap">
          <label className="flex items-center gap-1 shrink-0">
            Place
            <select
              aria-label="Set location by preset city"
              value={currentCity}
              onChange={(e) => {
                const city = CITIES.find((c) => c.name === e.target.value);
                if (city) {
                  setLoc({ ...city, source: "manual" });
                  setLatText(String(city.lat));
                  setLngText(String(city.lng));
                }
              }}
              className="border border-line bg-card px-1 py-0.5"
            >
              <option value="">{loc.name}</option>
              {CITIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1 shrink-0">
            Lat
            <input value={latText} onChange={(e) => setLatText(e.target.value)}
              className="w-20 border border-line bg-card px-1 py-0.5" />
          </label>
          <label className="flex items-center gap-1 shrink-0">
            Lng
            <input value={lngText} onChange={(e) => setLngText(e.target.value)}
              className="w-20 border border-line bg-card px-1 py-0.5" />
          </label>
          <button onClick={applyCoords} className="shrink-0 border border-line bg-card px-2 py-0.5 hover:bg-parchment-deep">
            Set
          </button>
          <button
            onClick={() => {
              refreshLocation();
              setLatText(String(loc.lat));
              setLngText(String(loc.lng));
            }}
            className="shrink-0 border border-line bg-card px-2 py-0.5 hover:bg-parchment-deep"
          >
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
          <ActiveTransitsPanel chart={chart} />
          <DignitiesPanel chart={chart} />
          <MoonAspectsPanel chart={chart} />
          <AspectGridPanel chart={chart} />
        </div>

        {/* center wheel — P0: first on narrow surfaces, as large as the viewport allows */}
        <div data-kimi-priority="p0" className="order-first lg:order-none flex-1 min-w-[280px] min-h-0 flex items-center justify-center">
          <div ref={tiltRef} className="wheel-frame manor-card aspect-square w-full lg:w-auto lg:h-full max-h-full max-w-full mx-auto transition-transform duration-150">
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

      <footer data-kimi-priority="p3" className="shrink-0 px-4 pb-2 text-[11px] italic text-ink-soft">
        Tropical zodiac · Geocentric · Regiomontanus houses · Egyptian terms · Live geocentric positions
        recomputed in your browser — in the tradition of Renaissance astrology.
      </footer>
    </div>
  );
}
