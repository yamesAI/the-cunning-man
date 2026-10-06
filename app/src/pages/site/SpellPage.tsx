// Spell workings — love (Venus) and money (Jupiter), timed by planetary hour.

import { useEffect, useMemo, useState } from "react";
import { upcomingHours } from "@/astro/spelltime";
import { tzForLocation } from "@/astro/engine";
import { fmtTimeTz, tzOffsetLabel } from "@/astro/format";
import { PLANET_GLYPH } from "@/astro/constants";
import { Link } from "react-router";
import { useMeta } from "@/components/SiteLayout";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const ART = {
  love: {
    title: "♀ The Love Working",
    meta: "Free Love Spell Timing — Venus Hours, Runes & Sigils",
    desc: "A traditional love working timed by the hour of Venus: candle, rune, and chaos sigil method, with the next fit Venus hours computed live for your place.",
    glyph: PLANET_GLYPH.venus,
    planet: "Venus",
    rulerKey: "venus" as const,
    day: "Friday",
    candle: "a green or pink candle",
    incense: "rose, or a little honey on the charcoal",
    signs: "Taurus or Libra, or in easy aspect to your own Ascendant",
    runes: ["ᚷ Gebo — the mutual gift", "ᛒ Berkana — new growth", "ᚹ Wunjo — joy"],
    rite: [
      "On a Friday in the waxing Moon, dress the candle with a drop of honey toward yourself.",
      "Scratch the sigil of your intention (make one in the Sigil Engine) into the wax.",
      "At the hour of Venus, light the candle and speak the intention once, plainly, in the present tense.",
      "Let the candle burn down safely, or pinch it out and relight at the next Venus hour until done.",
      "Carry Gebo with you; give some small gift freely — the current of exchange must move.",
    ],
    caution: "Work for love to come to you, not upon a named soul — bindings on another's will turn sour.",
  },
  money: {
    title: "♃ The Money Working",
    meta: "Free Money Spell Timing — Jupiter Hours, Runes & Sigils",
    desc: "A traditional prosperity working timed by the hour of Jupiter: candle, rune, and chaos sigil method, with the next fit Jupiter hours computed live for your place.",
    glyph: PLANET_GLYPH.jupiter,
    planet: "Jupiter",
    rulerKey: "jupiter" as const,
    day: "Thursday",
    candle: "a green or gold candle",
    incense: "cinnamon, or a coin set by the flame",
    signs: "Sagittarius or Pisces, or conjoined with the greater fortune",
    runes: ["ᚠ Fehu — wealth in motion", "ᛃ Jera — the harvest", "ᛋ Sowilo — victory"],
    rite: [
      "On a Thursday in the waxing Moon, dress the candle with oil from bottom to top — drawing in.",
      "Scratch the sigil of your intention (make one in the Sigil Engine) into the wax.",
      "At the hour of Jupiter, light the candle and name the sum or the venture plainly.",
      "Set a coin beside the flame; when the work is done, spend that coin first and keep its replacement.",
      "Carry Fehu; wealth is cattle — it must move to multiply.",
    ],
    caution: "Ask for a channel, not a miracle: name the work, the trade, or the venture through which money may honestly come.",
  },
} as const;

export default function SpellPage({ kind }: { kind: keyof typeof ART }) {
  const a = ART[kind];
  useMeta(a.meta, a.desc);

  const [lat, setLat] = useState("51.5074");
  const [lng, setLng] = useState("-0.1278");
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const la = parseFloat(lat), ln = parseFloat(lng);
  const valid = Number.isFinite(la) && Number.isFinite(ln) && Math.abs(la) <= 90 && Math.abs(ln) <= 180;
  const tz = valid ? tzForLocation(la, ln) : "UTC";

  const minute = new Date(Math.floor(now.getTime() / 60000) * 60000);
  const hours = useMemo(
    () => (valid ? upcomingHours(a.rulerKey, minute, la, ln, 8, 5) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [a.rulerKey, minute.getTime(), lat, lng]
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1" style={{ fontVariant: "small-caps" }}>{a.title}</h1>
      <p className="text-[14px] text-[#4a351f] max-w-3xl mb-4">
        A working of {a.planet} {a.glyph}, kept in the old manner: the fit day is <b>{a.day}</b>,
        the fit hours are those of {a.planet} — strongest of all when the hour of {a.planet} falls
        on {a.day} itself. The Moon should be waxing and free of combustion.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border-2 border-[#5a3d1e] bg-[#f7f0da] p-4">
          <h2 className="font-bold mb-2" style={{ fontVariant: "small-caps" }}>The rite</h2>
          <ul className="text-[13px] space-y-1 mb-3">
            <li><b>Candle:</b> {a.candle}</li>
            <li><b>Incense:</b> {a.incense}</li>
            <li><b>Moon:</b> waxing, ideally in {a.signs}</li>
          </ul>
          <ol className="list-decimal ml-5 space-y-1 text-[13px]">
            {a.rite.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
          <p className="text-[12px] italic text-[#7a1f1f] mt-3">{a.caution}</p>
          <h3 className="font-bold mt-4 mb-1" style={{ fontVariant: "small-caps" }}>Runes for the working</h3>
          <ul className="text-[13px] space-y-0.5">
            {a.runes.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>

        <div className="border-2 border-[#5a3d1e] bg-[#f7f0da] p-4">
          <h2 className="font-bold mb-2" style={{ fontVariant: "small-caps" }}>Next fit hours — live</h2>
          <div className="flex flex-wrap items-end gap-3 mb-3">
            <label className="flex flex-col gap-1 text-[12px]">
              <span className="font-bold" style={{ fontVariant: "small-caps" }}>Latitude</span>
              <input value={lat} onChange={(e) => setLat(e.target.value)} className="w-24 border border-[#5a3d1e] bg-white px-2 py-1" />
            </label>
            <label className="flex flex-col gap-1 text-[12px]">
              <span className="font-bold" style={{ fontVariant: "small-caps" }}>Longitude</span>
              <input value={lng} onChange={(e) => setLng(e.target.value)} className="w-24 border border-[#5a3d1e] bg-white px-2 py-1" />
            </label>
            <span className="text-[11px] text-[#6b5537] italic pb-1">({tzOffsetLabel(now, tz)})</span>
          </div>
          {!valid && <p className="text-[#7a1f1f] font-bold text-[13px]">Enter a valid latitude and longitude.</p>}
          <ul className="text-[13px]">
            {hours.map((h, i) => (
              <li key={i} className={`flex justify-between items-baseline border-b border-[#e5d9b8] py-1 ${h.dayRulerMatches ? "font-bold" : ""}`}>
                <span>
                  {new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric" }).format(h.start)}
                  {h.dayRulerMatches && <span className="text-[#7a1f1f]"> ★</span>}
                  {h.dayRulerMatches && WEEKDAYS[h.weekdayIdx] !== new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" }).format(h.start) && (
                    <span className="text-[#6b5537] font-normal text-[11px]"> ({WEEKDAYS[h.weekdayIdx]} night)</span>
                  )}
                </span>
                <span>{fmtTimeTz(h.start, tz)} → {fmtTimeTz(h.end, tz)}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-[#6b5537] italic mt-3">
            ★ marks an hour of {a.planet} within {a.day}'s planetary day (sunrise to sunrise) — the doubly fit time.
          </p>
          <p className="text-[12px] mt-3">
            Bind the working with a <Link to="/sigil" className="underline">sigil</Link> and confirm
            the day with a <Link to="/runes" className="underline">rune cast</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
