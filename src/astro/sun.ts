// Sunrise / sunset calculation (Almanac for Computers 1990, zenith 90.833°).
// Accurate to ~1-2 minutes, plenty for planetary hours.
// Takes the civil date explicitly (year, 0-indexed month, day) as observed
// at the location, so results are independent of the system timezone.

const ZENITH = 90.833;

function calc(year: number, month0: number, day: number, lat: number, lng: number, rising: boolean): Date | null {
  const dayOfYear = Math.floor(
    (Date.UTC(year, month0, day) - Date.UTC(year, 0, 0)) / 86400000
  );
  const lngHour = lng / 15;
  const t = dayOfYear + ((rising ? 6 : 18) - lngHour) / 24;

  const M = 0.9856 * t - 3.289; // Sun's mean anomaly
  let L =
    M + 1.916 * Math.sin((M * Math.PI) / 180) + 0.02 * Math.sin((2 * M * Math.PI) / 180) + 282.634;
  L = ((L % 360) + 360) % 360; // Sun's true longitude

  let RA = (Math.atan(0.91764 * Math.tan((L * Math.PI) / 180)) * 180) / Math.PI;
  RA = ((RA % 360) + 360) % 360;
  const Lquadrant = Math.floor(L / 90) * 90;
  const RAquadrant = Math.floor(RA / 90) * 90;
  RA = RA + (Lquadrant - RAquadrant);
  RA /= 15;

  const sinDec = 0.39782 * Math.sin((L * Math.PI) / 180);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH =
    (Math.cos((ZENITH * Math.PI) / 180) - sinDec * Math.sin((lat * Math.PI) / 180)) /
    (cosDec * Math.cos((lat * Math.PI) / 180));
  if (cosH > 1 || cosH < -1) return null; // polar day/night

  let H = rising
    ? 360 - (Math.acos(cosH) * 180) / Math.PI
    : (Math.acos(cosH) * 180) / Math.PI;
  H /= 15;

  const T = H + RA - 0.06571 * t - 6.622;
  let UT = T - lngHour;
  UT = ((UT % 24) + 24) % 24;

  const utcMs = Date.UTC(year, month0, day) + UT * 3600000;
  return new Date(utcMs);
}

export interface SunEvents {
  sunrise: Date | null;
  sunset: Date | null;
  nextSunrise: Date | null; // sunrise of the following civil day
}

export function sunEvents(year: number, month0: number, day: number, lat: number, lng: number): SunEvents {
  const next = new Date(Date.UTC(year, month0, day) + 86400000);
  return {
    sunrise: calc(year, month0, day, lat, lng, true),
    sunset: calc(year, month0, day, lat, lng, false),
    nextSunrise: calc(next.getUTCFullYear(), next.getUTCMonth(), next.getUTCDate(), lat, lng, true),
  };
}
