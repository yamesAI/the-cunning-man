// Shared live sky state: the ticking instant + the observer's location.
// Every page consumes this so time and place stay current everywhere.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

export interface Loc {
  lat: number;
  lng: number;
  name: string;
  source: "geo" | "manual";
}

export const DEFAULT_LOC: Loc = { lat: 51.5074, lng: -0.1278, name: "London", source: "manual" };

export interface Sky {
  now: Date;
  loc: Loc;
  setLoc: (loc: Loc) => void;
  refreshLocation: () => void;
}

const STORAGE_KEY = "cunning-man:location";
const LEGACY_KEY = "shield-astro-location";

// After a denial we don't re-prompt in the same session (page reload resets).
let deniedThisSession = false;

function readRaw(key: string): string | null {
  try {
    return (globalThis as { localStorage?: Storage }).localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string): void {
  try {
    (globalThis as { localStorage?: Storage }).localStorage?.setItem(key, value);
  } catch {
    /* opaque origin */
  }
}

function parseLoc(raw: string | null): Loc | null {
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (
      typeof v === "object" && v !== null &&
      typeof (v as Loc).lat === "number" &&
      typeof (v as Loc).lng === "number" &&
      Math.abs((v as Loc).lat) <= 90 &&
      Math.abs((v as Loc).lng) <= 180
    ) {
      return v as Loc;
    }
  } catch {
    /* fall through */
  }
  return null;
}

function loadLoc(): Loc {
  const saved = parseLoc(readRaw(STORAGE_KEY));
  if (saved) return saved;
  const legacy = parseLoc(readRaw(LEGACY_KEY));
  if (legacy) {
    const migrated: Loc = { ...legacy, source: "manual" };
    writeRaw(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  }
  return DEFAULT_LOC;
}

const SkyContext = createContext<Sky | null>(null);

export function SkyProvider({ children }: { children: ReactNode }): ReactElement {
  const [now, setNow] = useState(() => new Date());
  const [loc, setLocState] = useState<Loc>(loadLoc);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const setLoc = (l: Loc) => {
    setLocState(l);
    writeRaw(STORAGE_KEY, JSON.stringify(l));
  };

  const acquire = () => {
    if (deniedThisSession) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLoc({
          lat: +pos.coords.latitude.toFixed(4),
          lng: +pos.coords.longitude.toFixed(4),
          name: "My location",
          source: "geo",
        }),
      () => {
        deniedThisSession = true;
      },
      { timeout: 8000, maximumAge: 300000 }
    );
  };

  const refreshLocation = () => {
    deniedThisSession = false;
    acquire();
  };

  useEffect(() => {
    // Initial acquisition: re-acquire a previously geo-sourced location, or
    // ask on first visit when nothing is saved.
    if (readRaw(STORAGE_KEY) === null || loadLoc().source === "geo") acquire();
    const onFocus = () => {
      if (loadLoc().source === "geo") acquire();
    };
    const t = setInterval(() => {
      if (loadLoc().source === "geo") acquire();
    }, 5 * 60000);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SkyContext.Provider value={{ now, loc, setLoc, refreshLocation }}>
      {children}
    </SkyContext.Provider>
  );
}

export function useSky(): Sky {
  const ctx = useContext(SkyContext);
  if (!ctx) throw new Error("useSky must be used within SkyProvider");
  return ctx;
}
