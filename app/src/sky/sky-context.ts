// Shared live sky state: the ticking instant + the observer's location.
// Every page consumes this so time and place stay current everywhere.

import { createContext, useContext } from "react";

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

export const SkyContext = createContext<Sky | null>(null);

export function useSky(): Sky {
  const ctx = useContext(SkyContext);
  if (!ctx) throw new Error("useSky must be used within SkyProvider");
  return ctx;
}
