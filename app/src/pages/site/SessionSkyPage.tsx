// Session Sky (SKY-001): the traditional sky across a time window you choose.
// Study and entertainment only. No scores of windows or hours, no outside
// data feeds, no void-of-course Moon (D-3). Does not use astro/election.ts.

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { buildHoroscope, computeChart, lonOf, tzForLocation } from "@/astro/engine";
import { fmtTimeTz, tzOffsetLabel, fmtDur, fmtDegMin } from "@/astro/format";
import { MANSIONS, moonMansion, moonPhase } from "@/astro/traditional";
import {
  PLANET_COLOR, PLANET_GLYPH, PLANET_LABEL, SIGN_COLOR, SIGN_GLYPH, SIGN_LABEL, SIGNS,
  ASPECT_GLYPH, type PlanetKey, type SignKey,
} from "@/astro/constants";
import {
  MAX_WINDOW_HOURS, checkWindow, clampEnd, findChanges, fmtDayTz, fmtLength, fromLocalInput,
  isValidTimeZone, thisPlanetaryDay, toLocalInput, windowHours, type SkyChange,
} from "@/astro/sessionsky";
import { useSky } from "@/sky/sky-context";
import { CitySearch } from "@/components/CitySearch";
import { useMeta } from "@/hooks/useMeta";

type Preset = "custom" | "planetary-day" | "next-4" | "next-12";

const PRESETS: Array<{ id: Preset; label: string }> = [
  { id: "custom", label: "Custom" },
  { id: "planetary-day", label: "This planetary day" },
  { id: "next-4", label: "Next 4 hours" },
  { id: "next-12", label: "Next 12 hours" },
];

const MAJOR = new Set(["conjunction", "sextile", "square", "trine", "opposition"]);

const fmtClockTz = (d: Date, tz: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }).format(d).toLowerCase();

const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const ZONES: string[] = (() => {
  try {
    const list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone") ?? [];
    return list.includes("UTC") ? list : ["UTC", ...list];
  } catch {
    return ["UTC"];
  }
})();

const Glyph = ({ p, size = 14 }: { p: PlanetKey; size?: number }) => (
  <span style={{ color: PLANET_COLOR[p], fontSize: size }} aria-hidden="true">{PLANET_GLYPH[p]}</span>
);

const Sign = ({ s }: { s: SignKey }) => (
  <span className="whitespace-nowrap">
    <span style={{ color: SIGN_COLOR[s] }} aria-hidden="true">{SIGN_GLYPH[s]}</span> {SIGN_LABEL[s]}
  </span>
);

function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="border-2 border-line bg-card p-3">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h2 className="font-bold text-[15px] font-smallcaps">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

const ordinal = (n: number) => {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return n % 10 === 1 ? `${n}st` : n % 10 === 2 ? `${n}nd` : n % 10 === 3 ? `${n}rd` : `${n}th`;
};

interface WindowState {
  preset: Preset;
  start: string; // datetime-local value in `zone` (minute precision)
  end: string;
  startExact?: number; // exact instant from a preset (e.g. sunrise to the second)
  endExact?: number;
  zone: string;
  zoneTouched: boolean; // user picked a zone; it no longer follows the location
}

// Inputs hold minutes; presets keep the exact instant so a sunrise-to-sunrise
// window does not pick up seconds of the previous planetary hour.
function span(s: Date, e: Date, zone: string) {
  return { start: toLocalInput(s, zone), end: toLocalInput(e, zone), startExact: s.getTime(), endExact: e.getTime() };
}

function resolve(text: string, exact: number | undefined, zone: string): number {
  if (exact !== undefined && toLocalInput(new Date(exact), zone) === text) return exact;
  return fromLocalInput(text, zone)?.getTime() ?? NaN;
}

function planetaryDayState(now: Date, lat: number, lng: number): { state: WindowState; note: string | null } {
  const d = thisPlanetaryDay(now, lat, lng);
  return {
    state: { preset: "planetary-day", ...span(d.start, d.end, d.zone), zone: d.zone, zoneTouched: false },
    note: d.note,
  };
}

export default function SessionSkyPage() {
  useMeta(
    "The Cunning Man — Session Sky",
    "Traditional sky for a time window you choose: essential dignities, planetary hours and the Moon, computed in your browser. For entertainment and study."
  );
  const { now, loc, setLoc, refreshLocation } = useSky();
  const locZone = tzForLocation(loc.lat, loc.lng);

  const [initial] = useState(() => planetaryDayState(new Date(), loc.lat, loc.lng));
  const [win, setWin] = useState<WindowState>(initial.state);
  const [defaultNote, setDefaultNote] = useState<string | null>(initial.note);

  // Location changed: refill the D-1 default if it is still selected, and let
  // the window zone follow the location unless the user picked a zone.
  const [prevLoc, setPrevLoc] = useState(loc);
  if (loc !== prevLoc) {
    setPrevLoc(loc);
    if (win.preset === "planetary-day") {
      const d = thisPlanetaryDay(new Date(), loc.lat, loc.lng);
      const zone = win.zoneTouched ? win.zone : d.zone;
      setWin({ ...win, zone, ...span(d.start, d.end, zone) });
      setDefaultNote(d.note);
    } else if (!win.zoneTouched) {
      const s = resolve(win.start, win.startExact, win.zone), e = resolve(win.end, win.endExact, win.zone);
      if (Number.isFinite(s) && Number.isFinite(e)) setWin({ ...win, zone: locZone, ...span(new Date(s), new Date(e), locZone) });
    }
  }

  const applyPreset = (p: Preset) => {
    const t = new Date();
    if (p === "custom") return setWin({ ...win, preset: "custom" });
    if (p === "planetary-day") {
      const d = planetaryDayState(t, loc.lat, loc.lng);
      setWin(d.state);
      setDefaultNote(d.note);
      return;
    }
    const hrs = p === "next-4" ? 4 : 12;
    const zone = isValidTimeZone(win.zone) ? win.zone : locZone;
    setDefaultNote(null);
    setWin({ ...win, preset: p, zone, ...span(t, new Date(t.getTime() + hrs * 3600000), zone) });
  };

  const [zoneText, setZoneText] = useState(win.zone);
  const [prevZone, setPrevZone] = useState(win.zone);
  if (win.zone !== prevZone) {
    setPrevZone(win.zone);
    setZoneText(win.zone);
  }
  const zoneOk = isValidTimeZone(zoneText);
  const setZone = (z: string) => {
    setZoneText(z);
    if (!isValidTimeZone(z)) return;
    // keep the same instants, shown in the new zone
    const s = resolve(win.start, win.startExact, win.zone), e = resolve(win.end, win.endExact, win.zone);
    setWin(Number.isFinite(s) && Number.isFinite(e)
      ? { ...win, zone: z, zoneTouched: true, ...span(new Date(s), new Date(e), z) }
      : { ...win, zone: z, zoneTouched: true });
  };

  const tz = win.zone;
  const rawStart = resolve(win.start, win.startExact, tz);
  const rawEnd = resolve(win.end, win.endExact, tz);
  const check = checkWindow(Number.isFinite(rawStart) ? new Date(rawStart) : null, Number.isFinite(rawEnd) ? new Date(rawEnd) : null);
  const startMs = check.ok ? rawStart : NaN;
  const endMs = check.ok ? rawEnd : NaN;

  // Everything at window start, and the hours across the window.
  const startChart = useMemo(
    () => (Number.isFinite(startMs) ? computeChart(new Date(startMs), loc.lat, loc.lng) : null),
    [startMs, loc.lat, loc.lng]
  );
  const wh = useMemo(
    () => (Number.isFinite(startMs) ? windowHours(new Date(startMs), new Date(endMs), loc.lat, loc.lng) : null),
    [startMs, endMs, loc.lat, loc.lng]
  );

  // The change scan takes up to about a second for 48h, so it runs after paint.
  const scanKey = `${startMs}|${endMs}|${loc.lat}|${loc.lng}`;
  const [scan, setScan] = useState<{ key: string; changes: SkyChange[] } | null>(null);
  useEffect(() => {
    if (!Number.isFinite(startMs)) return;
    const id = setTimeout(() => {
      setScan({ key: scanKey, changes: findChanges(new Date(startMs), new Date(endMs), loc.lat, loc.lng) });
    }, 30);
    return () => clearTimeout(id);
  }, [scanKey, startMs, endMs, loc.lat, loc.lng]);
  const changes = scan && scan.key === scanKey ? scan.changes : null;

  const phaseMoments = startChart
    ? startChart.nearestPhases.filter((p) => p.date.getTime() >= startMs && p.date.getTime() <= endMs)
    : [];

  // Now marker: only when now falls inside the window; ticks with the hub clock.
  const nowIn = Number.isFinite(startMs) && now.getTime() >= startMs && now.getTime() < endMs;
  const secBucket = Math.floor(now.getTime() / 1000);
  const nowMoon = useMemo(() => {
    if (!nowIn) return null;
    const h = buildHoroscope(new Date(secBucket * 1000), loc.lat, loc.lng);
    const moon = lonOf(h, "moon"), sun = lonOf(h, "sun");
    return { lon: moon, sign: SIGNS[Math.floor(moon / 30) % 12], phase: moonPhase(sun, moon), mansion: moonMansion(moon) };
  }, [nowIn, secBucket, loc.lat, loc.lng]);
  const nowHour = nowIn && wh ? wh.hours.find((h) => now >= h.start && now < h.end) ?? null : null;

  const t = (d: Date) => `${fmtDayTz(d, tz)} · ${fmtTimeTz(d, tz)}`;
  const sectFlips = wh && startChart
    ? wh.days.flatMap((d) => [
        { time: d.sunrise, to: "day" as const },
        { time: d.sunset, to: "night" as const },
      ]).filter((f) => f.time.getTime() >= startMs && f.time.getTime() < endMs)
    : [];
  const signChanges = (changes ?? []).filter((c) => c.kind === "sign");
  const moonChanges = (changes ?? []).filter((c) => c.planet === "moon");
  const moonAspects = startChart ? startChart.moonAspects.filter((a) => MAJOR.has(a.aspectKey)) : [];
  const notes = [...(defaultNote && win.preset === "planetary-day" ? [defaultNote] : []), ...(wh?.notes ?? [])];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1 font-smallcaps">☉ Session Sky</h1>
      <p className="text-[14px] text-ink-soft max-w-3xl mb-1">
        Choose a time window, a timezone and a place, and read the traditional sky across it: the
        essential dignities of the seven planets, every planetary hour, and the Moon's sign, phase and
        mansion. Computed live in your browser.
      </p>
      <p className="text-[13px] italic text-ink-soft mb-4">For entertainment and study. Not financial, medical, or legal advice.</p>

      {/* window settings */}
      <div className="border-2 border-line bg-card p-4 mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Window presets">
          <span className="text-[13px] font-bold font-smallcaps mr-1">Window</span>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              aria-pressed={win.preset === p.id}
              className={`px-2 py-1 border text-[13px] font-display ${win.preset === p.id ? "bg-seal text-card border-seal-deep" : "border-line hover:bg-parchment-deep"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-[13px]">
            <span className="font-bold font-smallcaps">Start</span>
            <input type="datetime-local" value={win.start}
              onChange={(e) => setWin({ ...win, preset: "custom", start: e.target.value, startExact: undefined })}
              className="border border-line bg-card px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1 text-[13px]">
            <span className="font-bold font-smallcaps">End</span>
            <input type="datetime-local" value={win.end}
              onChange={(e) => setWin({ ...win, preset: "custom", end: e.target.value, endExact: undefined })}
              className="border border-line bg-card px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1 text-[13px]">
            <span className="font-bold font-smallcaps">Window timezone</span>
            <input list="sky-zones" value={zoneText} onChange={(e) => setZone(e.target.value.trim())}
              aria-invalid={!zoneOk} spellCheck={false}
              className="w-56 border border-line bg-card px-2 py-1" />
            <datalist id="sky-zones">
              {ZONES.map((z) => <option key={z} value={z} />)}
            </datalist>
          </label>
          <button type="button" onClick={() => setZone(locZone)}
            className="border border-line bg-card px-2 py-1 text-[12px] hover:bg-parchment-deep">
            Use the place's zone ({locZone})
          </button>
        </div>
        {!zoneOk && <p className="text-[13px] font-bold">Unknown timezone. Use an IANA name such as America/Chicago or Europe/London.</p>}
        {!check.ok && (
          <p className="text-[13px] font-bold" role="alert">
            {check.message}
            {rawEnd - rawStart > MAX_WINDOW_HOURS * 3600000 && (
              <button type="button" className="ml-2 underline font-normal"
                onClick={() => setWin({ ...win, preset: "custom", ...span(new Date(rawStart), clampEnd(new Date(rawStart), new Date(rawEnd)), tz) })}>
                Set the end to {MAX_WINDOW_HOURS} hours after the start
              </button>
            )}
          </p>
        )}
        <div className="flex flex-wrap items-end gap-4 border-t border-line pt-3">
          <div className="text-[13px]">
            <span className="font-bold font-smallcaps">Place</span>{" "}
            <span className="italic">{loc.name}</span>{" "}
            <span className="text-ink-soft">({loc.lat.toFixed(4)}, {loc.lng.toFixed(4)} · {locZone})</span>
            <button type="button" onClick={refreshLocation} title="Use my current location"
              className="ml-2 border border-line bg-card px-1.5 py-0.5 hover:bg-parchment-deep">📍</button>
          </div>
          <CitySearch onPick={(r) => setLoc({ lat: r.lat, lng: r.lng, name: r.name, source: "manual" })} />
        </div>
      </div>

      {notes.length > 0 && (
        <div className="border-2 border-line bg-parchment-deep p-3 mb-6 text-[13px] space-y-1" role="note">
          {notes.map((n, i) => <p key={i}>{n}</p>)}
        </div>
      )}

      {check.ok && startChart && wh && (
        <div className="space-y-6">
          {/* window summary + now */}
          <Section title="The window">
            <table className="tbl-ledger">
              <tbody>
                <tr><td>Start</td><td>{t(new Date(startMs))} <span className="text-ink-soft">({tzOffsetLabel(new Date(startMs), tz)})</span></td></tr>
                <tr><td>End</td><td>{t(new Date(endMs))} <span className="text-ink-soft">({tzOffsetLabel(new Date(endMs), tz)})</span></td></tr>
                <tr><td>Length</td><td>{fmtLength(endMs - startMs)}</td></tr>
                <tr><td>Timezone</td><td>{tz}{tz !== locZone && <span className="text-ink-soft"> · place zone {locZone}</span>}</td></tr>
                <tr><td>Sect at start</td><td>{startChart.sect === "day" ? "Day" : "Night"} chart</td></tr>
              </tbody>
            </table>
            {sectFlips.length > 0 && (
              <p className="text-[12px] text-ink-soft mt-2">
                Sect turns at sunrise and sunset:{" "}
                {sectFlips.map((f, i) => (
                  <span key={i}>{i > 0 && "; "}{f.to} from {t(f.time)}</span>
                ))}
              </p>
            )}
          </Section>

          {nowIn && (
            <Section title="Now" right={<span className="text-[12px] tabular-nums">{fmtDayTz(now, tz)} · {fmtClockTz(now, tz)}</span>}>
              <table className="tbl-ledger">
                <tbody>
                  <tr>
                    <td>Planetary hour</td>
                    <td>
                      {nowHour ? (
                        <>
                          <Glyph p={nowHour.ruler} /> {PLANET_LABEL[nowHour.ruler]} · {ordinal(nowHour.isDay ? nowHour.index : nowHour.index - 12)} hour of the {nowHour.isDay ? "day" : "night"} ·{" "}
                          {fmtDur(now.getTime() - nowHour.start.getTime())} in, {fmtDur(nowHour.end.getTime() - now.getTime())} left
                        </>
                      ) : "No planetary hour can be formed here now."}
                    </td>
                  </tr>
                  {nowMoon && (
                    <tr>
                      <td>Moon</td>
                      <td>
                        {fmtDegMin(nowMoon.lon)} <Sign s={nowMoon.sign} /> · {nowMoon.phase.label} ({Math.round(nowMoon.phase.illumination * 100)}%) ·
                        mansion {nowMoon.mansion.index}. {nowMoon.mansion.name}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Section>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* dignities */}
            <Section title="Essential dignities at window start" right={<span className="text-[11px] italic">{startChart.sect} chart · Lilly</span>}>
              <div className="overflow-x-auto">
                <table className="tbl-ledger">
                  <thead>
                    <tr>
                      {["Planet", "Position", "Ruler", "Exalt", "Trip", "Term", "Face", "Detn", "Fall", "Pereg", "Score"].map((h) => (
                        <th key={h} scope="col" className="!text-[10px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {startChart.dignities.map((r) => {
                      const b = startChart.bodies.find((x) => x.key === r.planet)!;
                      const yes = (on: boolean) => (on ? "yes" : <span className="text-ink-soft/60">--</span>);
                      return (
                        <tr key={r.planet}>
                          <td className="whitespace-nowrap"><Glyph p={r.planet} /> {PLANET_LABEL[r.planet]}{b.retro && " ℞"}</td>
                          <td className="whitespace-nowrap">{fmtDegMin(b.lon)} <span style={{ color: SIGN_COLOR[b.sign] }} aria-hidden="true">{SIGN_GLYPH[b.sign]}</span><span className="sr-only">{SIGN_LABEL[b.sign]}</span></td>
                          <td>{yes(r.ruler)}</td>
                          <td>{yes(r.exalt)}</td>
                          <td className="whitespace-nowrap" title="Triplicity rulers, day then night; the ruler in sect is full strength">
                            {r.trip.map((p, i) => (
                              <span key={i} style={{ opacity: (startChart.sect === "day") === (i === 0) ? 1 : 0.35 }}><Glyph p={p} /></span>
                            ))}
                          </td>
                          <td><Glyph p={r.term} /></td>
                          <td><Glyph p={r.face} /></td>
                          <td>{yes(r.detriment)}</td>
                          <td>{yes(r.fall)}</td>
                          <td>{yes(r.peregrine)}</td>
                          <td className="text-right font-bold">{r.score > 0 ? `+${r.score}` : r.score}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-ink-soft mt-1">Term and face columns show the ruler of the degree. Score is Lilly's essential score.</p>
              <h3 className="font-bold text-[13px] mt-3 mb-1 font-smallcaps">Sign changes inside the window</h3>
              {changes === null ? (
                <p className="text-[12px] italic">Working through the window…</p>
              ) : signChanges.length === 0 ? (
                <p className="text-[12px] italic">No planet changes sign inside this window.</p>
              ) : (
                <table className="tbl-ledger">
                  <tbody>
                    {signChanges.map((c, i) => c.kind === "sign" && (
                      <tr key={i}>
                        <td className="whitespace-nowrap"><Glyph p={c.planet} /> {PLANET_LABEL[c.planet]}</td>
                        <td><Sign s={c.from} /> → <Sign s={c.to} /></td>
                        <td className="text-right whitespace-nowrap">{t(c.time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>

            {/* Moon */}
            <Section title="The Moon at window start">
              {(() => {
                const m = startChart.bodies.find((x) => x.key === "moon")!;
                return (
                  <table className="tbl-ledger">
                    <tbody>
                      <tr><td>Position</td><td>{fmtDegMin(m.lon)} <Sign s={m.sign} /></td></tr>
                      <tr><td>Phase</td><td>{startChart.phase.label} · {Math.round(startChart.phase.illumination * 100)}% lit · {startChart.phase.waxing ? "waxing" : "waning"}</td></tr>
                      <tr>
                        <td>Mansion</td>
                        <td>{startChart.mansion.index}. {startChart.mansion.name} <span className="italic text-[11px]">({startChart.mansion.arabic}, {startChart.mansion.meaning})</span></td>
                      </tr>
                    </tbody>
                  </table>
                );
              })()}
              <h3 className="font-bold text-[13px] mt-3 mb-1 font-smallcaps">Major aspects</h3>
              {moonAspects.length === 0 ? (
                <p className="text-[12px] italic">No major aspects at window start.</p>
              ) : (
                <table className="tbl-ledger">
                  <tbody>
                    {moonAspects.map((a, i) => (
                      <tr key={i}>
                        <td><span aria-hidden="true">{ASPECT_GLYPH[a.aspectKey] ?? ""}</span> {a.aspectKey}</td>
                        <td><Glyph p={a.other as PlanetKey} /> {PLANET_LABEL[a.other as PlanetKey]}</td>
                        <td className="text-right">{a.orb.toFixed(2)}°</td>
                        <td>{a.applying ? "applying" : "separating"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <h3 className="font-bold text-[13px] mt-3 mb-1 font-smallcaps">Moon changes and phases inside the window</h3>
              {changes === null ? (
                <p className="text-[12px] italic">Working through the window…</p>
              ) : moonChanges.length === 0 && phaseMoments.length === 0 ? (
                <p className="text-[12px] italic">The Moon keeps its sign and mansion, and no quarter falls, inside this window.</p>
              ) : (
                <table className="tbl-ledger">
                  <tbody>
                    {[
                      ...moonChanges.map((c) => ({
                        time: c.time,
                        label: c.kind === "sign"
                          ? <>Sign: <Sign s={c.from} /> → <Sign s={c.to} /></>
                          : <>Mansion: {c.from}. {MANSIONS[c.from - 1].name} → {c.to}. {MANSIONS[c.to - 1].name}</>,
                      })),
                      ...phaseMoments.map((p) => ({ time: p.date, label: <>Phase: {p.label}</> })),
                    ]
                      .sort((a, b) => a.time.getTime() - b.time.getTime())
                      .map((r, i) => (
                        <tr key={i}>
                          <td>{r.label}</td>
                          <td className="text-right whitespace-nowrap">{t(r.time)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </Section>
          </div>

          {/* planetary days and hours */}
          <Section title="Planetary days and hours" right={<span className="text-[11px] italic">times in {tz}</span>}>
            {wh.days.length === 0 ? (
              <p className="text-[12px] italic">No planetary hours can be formed for this window at this place.</p>
            ) : (
              <>
                <table className="tbl-ledger mb-3">
                  <thead>
                    <tr><th scope="col">Planetary day</th><th scope="col">Day ruler</th><th scope="col">Sunrise</th><th scope="col">Sunset</th></tr>
                  </thead>
                  <tbody>
                    {wh.days.map((d) => (
                      <tr key={d.sunrise.getTime()}>
                        <td>{WEEKDAY[d.weekdayIdx]}</td>
                        <td><Glyph p={d.ruler} /> {PLANET_LABEL[d.ruler]}</td>
                        <td className="whitespace-nowrap">{t(d.sunrise)}</td>
                        <td className="whitespace-nowrap">{t(d.sunset)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="overflow-x-auto">
                  <table className="tbl-ledger">
                    <thead>
                      <tr>
                        <th scope="col">#</th><th scope="col">Hour ruler</th><th scope="col">Day or night</th>
                        <th scope="col">Start</th><th scope="col">End</th><th scope="col">Planetary day</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wh.hours.map((h) => {
                        const cur = nowHour && nowHour.start.getTime() === h.start.getTime();
                        return (
                          <tr key={h.start.getTime()} className={cur ? "bg-brass/25 outline outline-1 outline-line" : ""} aria-current={cur ? "time" : undefined}>
                            <td>{h.index}</td>
                            <td className="whitespace-nowrap"><Glyph p={h.ruler} /> {PLANET_LABEL[h.ruler]}{cur && <span className="text-[11px] italic"> · now</span>}</td>
                            <td>{h.isDay ? "Day" : "Night"} {h.isDay ? h.index : h.index - 12}</td>
                            <td className="whitespace-nowrap">{t(h.start)}</td>
                            <td className="whitespace-nowrap">{t(h.end)}</td>
                            <td>{WEEKDAY[h.weekdayIdx]}{h.clipped && <span className="text-[11px] italic text-ink-soft"> · runs past the window start or end</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Section>
        </div>
      )}

      <p className="text-[12px] text-ink-soft italic mt-6">
        Tropical zodiac, geocentric. Sunrise and sunset to about two minutes; sign and mansion changes to
        about one minute. For entertainment and study. Not financial, medical, or legal advice.
      </p>
    </div>
  );
}
