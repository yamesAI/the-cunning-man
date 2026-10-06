// Launch Elections — elect the hour to begin a venture.

import { useEffect, useMemo, useState } from "react";
import { scanElections, aspectName } from "@/astro/election";
import { tzForLocation } from "@/astro/engine";
import { fmtTimeTz, tzOffsetLabel } from "@/astro/format";
import { PLANET_GLYPH, PLANET_LABEL } from "@/astro/constants";
import { useMeta } from "@/components/SiteLayout";

function fmtDay(d: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz, weekday: "short", month: "short", day: "numeric",
  }).format(d);
}

export default function LaunchesPage() {
  useMeta(
    "Free Launch Elections — Elect the Hour to Begin a Venture",
    "Electional astrology scanner: find the strongest moment in the next 7 days to launch a business, sign a contract, publish, or open a venture — free."
  );
  const [lat, setLat] = useState("51.5074");
  const [lng, setLng] = useState("-0.1278");
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const la = parseFloat(lat), ln = parseFloat(lng);
  const valid = Number.isFinite(la) && Number.isFinite(ln) && Math.abs(la) <= 90 && Math.abs(ln) <= 180;
  const tz = valid ? tzForLocation(la, ln) : "UTC";

  const minute = new Date(Math.floor(now.getTime() / 60000) * 60000);
  const scan = useMemo(
    () => (valid ? scanElections(minute, la, ln, { hours: 168, sessionOnly: false }) : null),
    // minute changes once per 60s; la/ln derived from lat/lng strings
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [minute.getTime(), lat, lng]
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1" style={{ fontVariant: "small-caps" }}>♃ Launch Elections</h1>
      <p className="text-[14px] text-[#4a351f] max-w-3xl mb-4">
        The old electional art: when a venture is begun under a fortunate heaven, its whole course
        partakes of that moment. This engine scans the <b>next seven days</b> at your place and names
        the single strongest hour to launch, sign, publish, or open — plus the periods best avoided.
      </p>

      <div className="border-2 border-[#5a3d1e] bg-[#f7f0da] p-4 flex flex-wrap items-end gap-4 mb-6">
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="font-bold" style={{ fontVariant: "small-caps" }}>Latitude</span>
          <input value={lat} onChange={(e) => setLat(e.target.value)} className="w-24 border border-[#5a3d1e] bg-white px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="font-bold" style={{ fontVariant: "small-caps" }}>Longitude</span>
          <input value={lng} onChange={(e) => setLng(e.target.value)} className="w-24 border border-[#5a3d1e] bg-white px-2 py-1" />
        </label>
        <span className="text-[12px] text-[#6b5537] italic pb-1">
          Times shown for this place ({tzOffsetLabel(now, tz)}).
        </span>
      </div>

      {!valid && <p className="text-[#7a1f1f] font-bold">Enter a valid latitude and longitude.</p>}

      {scan && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border-2 border-[#5a3d1e] bg-[#f7f0da] p-4">
            <h2 className="font-bold text-[15px] mb-1" style={{ fontVariant: "small-caps" }}>⚜ The elected moment</h2>
            <p className="text-2xl font-bold text-[#7a1f1f]">{fmtDay(scan.best.date, tz)} · {fmtTimeTz(scan.best.date, tz)}</p>
            <p className="text-[13px] mt-1 mb-3">
              Election score <b>{scan.best.score > 0 ? `+${scan.best.score}` : scan.best.score}</b>
              {scan.best.moonAspect && (
                <>
                  {" "}· Moon next perfects {aspectName(scan.best.moonAspect.angle)}{" "}
                  {PLANET_GLYPH[scan.best.moonAspect.other]} {PLANET_LABEL[scan.best.moonAspect.other]}
                  {" "}in ~{scan.best.moonAspect.inHours.toFixed(1)}h
                </>
              )}
              {scan.best.voc && <> · <b className="text-[#7a1f1f]">Moon void of course</b></>}
            </p>
            <table className="w-full border-collapse text-[13px]">
              <tbody>
                {scan.best.factors.map((f, i) => (
                  <tr key={i} className="border-b border-[#d8c9a3]">
                    <td className="py-1">{f.label}</td>
                    <td className={`py-1 text-right font-bold ${f.pts > 0 ? "text-[#1e6b34]" : "text-[#7a1f1f]"}`}>
                      {f.pts > 0 ? `+${f.pts}` : f.pts}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3 className="font-bold text-[13px] mt-4 mb-1" style={{ fontVariant: "small-caps" }}>Next-best moments</h3>
            <ul className="text-[13px]">
              {scan.alternates.map((a, i) => (
                <li key={i} className="flex justify-between border-b border-[#e5d9b8] py-0.5">
                  <span>{fmtDay(a.date, tz)} · {fmtTimeTz(a.date, tz)}</span>
                  <span className="font-bold">{a.score > 0 ? `+${a.score}` : a.score}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-2 border-[#5a3d1e] bg-[#f7f0da] p-4">
            <h2 className="font-bold text-[15px] mb-2" style={{ fontVariant: "small-caps" }}>✖ Do not begin during these hours</h2>
            {scan.blocked.length === 0 && <p className="text-[13px] italic">No hard afflictions found in the next seven days.</p>}
            <ul className="space-y-3">
              {scan.blocked.map((b, i) => (
                <li key={i} className="border border-[#7a1f1f] bg-[#f3e4d4] p-2">
                  <p className="font-bold text-[13px] text-[#7a1f1f]">
                    {fmtDay(b.start, tz)} {fmtTimeTz(b.start, tz)} → {fmtDay(b.end, tz)} {fmtTimeTz(b.end, tz)}
                  </p>
                  <p className="text-[12px] text-[#4a351f]">{b.reasons.join(" · ")}</p>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-[#6b5537] italic mt-4">
              Blockers: Moon void of course, Moon combust, Moon in the via combusta, or a hard
              application to Saturn or Mars. Election scores weigh the Moon's condition, the angularity
              of the benefics and Mercury, and the dignity of the Ascendant ruler — the classical
              doctrine of elections.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
