export const norm360 = (deg: number): number => ((deg % 360) + 360) % 360;

/** smallest signed angular distance a-b in (-180, 180] */
export const angleDiff = (a: number, b: number): number => {
  let d = norm360(a - b);
  if (d > 180) d -= 360;
  return d;
};

/** forward zodiacal distance from `from` to `to`, 0..360 */
export const forwardDist = (from: number, to: number): number => norm360(to - from);

export const signOf = (lon: number): number => Math.floor(norm360(lon) / 30);
export const degInSign = (lon: number): number => norm360(lon) % 30;

/** 126.483 -> { deg: 6, min: 28 } within sign */
export const toDegMin = (lon: number): { deg: number; min: number } => {
  const d = degInSign(lon);
  const deg = Math.floor(d);
  const min = Math.floor((d - deg) * 60 + 1e-9);
  return { deg, min: min === 60 ? 59 : min };
};

export const pad = (n: number, len = 2): string => String(n).padStart(len, "0");

export const fmtDegMin = (lon: number): string => {
  const { deg, min } = toDegMin(lon);
  return `${pad(deg)}°${pad(min)}'`;
};

export const fmtTime = (d: Date): string =>
  `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

export const fmtTimeShort = (d: Date): string => {
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${h}:${pad(m)} ${ap}`;
};

export const fmtDur = (ms: number): string => {
  const neg = ms < 0;
  const s = Math.abs(Math.round(ms / 1000));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const core = hh > 0 ? `${hh}h ${pad(mm)}m` : `${mm}m ${pad(ss)}s`;
  return neg ? `-${core}` : core;
};

// ---- timezone-aware wall-time helpers (location tz, not system tz) ----

export interface WallParts {
  year: number;
  month: number; // 0-indexed
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export function wallParts(date: Date, tz: string): WallParts {
  const dtf = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  const p = Object.fromEntries(dtf.formatToParts(date).map((x) => [x.type, x.value]));
  return {
    year: +p.year, month: +p.month - 1, day: +p.day,
    hour: +p.hour % 24, minute: +p.minute, second: +p.second,
  };
}

export function tzOffsetLabel(date: Date, tz: string): string {
  const dtf = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" });
  const name = dtf.formatToParts(date).find((p) => p.type === "timeZoneName")?.value ?? "";
  return name.replace("GMT", "UTC");
}

export function fmtTimeTz(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true,
  }).format(date).toLowerCase();
}
