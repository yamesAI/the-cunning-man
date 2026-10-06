// Keyless city search for place entry — Nominatim (OpenStreetMap), free and
// CORS-enabled. Debounced and rate-polite (<= 1 request/sec), graceful when
// offline or rate-limited: the caller's manual fields remain the fallback.

import { useEffect, useRef, useState, type ReactElement } from "react";

export interface CityResult {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
}

export function CitySearch({ onPick }: { onPick: (r: CityResult) => void }): ReactElement {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CityResult[] | null>(null);
  const [open, setOpen] = useState(false);
  const lastReqAt = useRef(0);
  const seq = useRef(0);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setResults(null);
      return;
    }
    const spacingWait = Math.max(0, 1000 - (Date.now() - lastReqAt.current));
    const t = setTimeout(
      async () => {
        lastReqAt.current = Date.now();
        const id = ++seq.current;
        try {
          const url =
            "https://nominatim.openstreetmap.org/search?format=jsonv2" +
            "&featuretype=city&limit=5&accept-language=en&q=" +
            encodeURIComponent(query);
          const res = await fetch(url, { headers: { Accept: "application/json" } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data: unknown = await res.json();
          if (id !== seq.current) return; // stale response
          const mapped: CityResult[] = (Array.isArray(data) ? data : [])
            .filter(
              (d): d is { name?: string; display_name?: string; lat?: string; lon?: string } =>
                typeof d === "object" && d !== null && "lat" in d && "lon" in d
            )
            .map((d) => ({
              name: d.name ?? d.display_name?.split(",")[0] ?? query,
              displayName: d.display_name ?? d.name ?? query,
              lat: +(+d.lat!).toFixed(4),
              lng: +(+d.lon!).toFixed(4),
            }));
          setResults(mapped);
          setOpen(true);
        } catch {
          if (id === seq.current) {
            setResults([]);
            setOpen(true);
          }
        }
      },
      Math.max(450, spacingWait)
    );
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="relative">
      <label className="flex flex-col gap-1 text-[13px]">
        <span className="font-bold font-smallcaps">Search your city</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results !== null && results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="e.g. Kraków, Leeds, Osaka"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls="city-search-results"
          aria-autocomplete="list"
          className="w-56 border border-line bg-card px-2 py-1"
        />
      </label>
      {open && results !== null && (
        <ul
          id="city-search-results"
          role="listbox"
          aria-label="City matches"
          className="absolute z-20 left-0 top-full mt-0.5 w-[26rem] max-w-[80vw] max-h-52 overflow-y-auto bg-card border border-line shadow-md"
        >
          {results.length === 0 && (
            <li className="px-2 py-1 text-[12px] text-ink-soft italic">
              No matches found — pick a preset city or enter coordinates below.
            </li>
          )}
          {results.map((r) => (
            <li key={`${r.lat}|${r.lng}`} role="option" aria-selected="false">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(r);
                  setOpen(false);
                  setQ(r.name);
                }}
                className="w-full text-left px-2 py-1 text-[12px] font-ui hover:bg-parchment-deep"
              >
                {r.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[10px] text-ink-soft italic mt-0.5">
        City search by OpenStreetMap (Nominatim) · your query is sent to nominatim.openstreetmap.org
      </p>
    </div>
  );
}
