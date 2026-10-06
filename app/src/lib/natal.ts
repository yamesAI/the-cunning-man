// Natal profile persistence (localStorage, tolerant of opaque origins).

export interface NatalProfile {
  name?: string;
  birth: string; // ISO instant
  lat: number;
  lng: number;
  placeName: string;
}

const KEY = "cunning-man:natal";

function storage(): Storage | null {
  try {
    const s = (globalThis as { localStorage?: Storage }).localStorage;
    // probe: opaque-origin iframes throw on access
    if (s) s.getItem(KEY);
    return s ?? null;
  } catch {
    return null;
  }
}

function isValid(p: unknown): p is NatalProfile {
  if (typeof p !== "object" || p === null) return false;
  const v = p as Record<string, unknown>;
  if (typeof v.birth !== "string" || Number.isNaN(new Date(v.birth).getTime())) return false;
  if (typeof v.lat !== "number" || typeof v.lng !== "number") return false;
  if (Math.abs(v.lat) > 90 || Math.abs(v.lng) > 180) return false;
  if (typeof v.placeName !== "string") return false;
  if (v.name !== undefined && typeof v.name !== "string") return false;
  return true;
}

export function loadNatal(): NatalProfile | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveNatal(p: NatalProfile): void {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable */
  }
}

export function clearNatal(): void {
  const s = storage();
  if (!s) return;
  try {
    s.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}
