// The Cunning Man — homepage / directory of free arts.

import { Link } from "react-router";
import { useMeta } from "@/components/SiteLayout";

const TOOLS = [
  {
    to: "/clock", glyph: "♈", title: "Shield Astrological Clock",
    blurb: "A living Renaissance shield chart — Ascendant, houses, dignities, planetary hours and Moon, recomputed every second for your horizon.",
    tag: "Live",
  },
  {
    to: "/synastry", glyph: "☌", title: "Synastry Meter",
    blurb: "Two birth moments weighed against each other — the old sympathy of Sun, Moon, Venus and Mars, read as one score.",
    tag: "Love",
  },
  {
    to: "/launches", glyph: "♃", title: "Launch Elections",
    blurb: "Elect the hour to begin: the scanner finds the strongest windows in the next seven days and warns you off the cursed ones.",
    tag: "Business",
  },
  {
    to: "/sigil", glyph: "🝰", title: "Chaos Sigil Engine",
    blurb: "Write your desire, and watch it distilled into a sigil by the letter-reduction method of the chaos current.",
    tag: "Chaos Magic",
  },
  {
    to: "/runes", glyph: "ᚠ", title: "Rune Cast",
    blurb: "Cast the Elder Futhark — one rune for counsel, three for the road past, present and to come.",
    tag: "Runes",
  },
  {
    to: "/spells/love", glyph: "♀", title: "The Love Spell",
    blurb: "A traditional working for love: Venus her day and hour, the waxing Moon, the runes of union — with the next fit times computed for you.",
    tag: "Spell",
  },
  {
    to: "/spells/money", glyph: "♃", title: "The Money Spell",
    blurb: "A traditional working for money: Jupiter's bounty, Fehu's flow, and the hours that carry the charge.",
    tag: "Spell",
  },
];

const PRESS_TEASERS = [
  { to: "/press/launch", title: "The Cunning Man Opens Its Doors: Centuries-Old Arts, Free for All" },
  { to: "/press/trading-clock", title: "Renaissance Astrological Clock Built for Day Traders" },
  { to: "/press/synastry-meter", title: "Free Synastry Meter Reads Relationships the Old Way" },
];

export default function SiteHome() {
  useMeta(
    "The Cunning Man — Free Renaissance Astrology, Chaos Magic & Rune Tools",
    "Free cunning-man arts online: a live Renaissance astrological clock, synastry meter, launch elections, chaos sigil engine, rune casting, and traditional spells for love and money."
  );
  return (
    <div>
      {/* hero */}
      <section className="text-center border-4 border-double border-[#5a3d1e] bg-[#f7f0da] px-6 py-10 mb-8">
        <p className="text-[13px] tracking-[0.3em] uppercase text-[#7a1f1f] mb-2">Est. in the old tradition</p>
        <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ fontVariant: "small-caps" }}>
          The Cunning Man
        </h1>
        <p className="max-w-2xl mx-auto text-[15px] leading-relaxed text-[#4a351f]">
          In every village there was one who kept the old arts — reading the stars, casting the runes,
          and knowing the hour to act. These are those arts, made free for all: Renaissance astrology,
          chaos magic, and the Elder Futhark, computed live and honest.
        </p>
        <p className="mt-4 text-[13px] italic text-[#6b5537]">No coin asked. No account. No gate.</p>
      </section>

      {/* tools grid */}
      <section aria-label="Free tools">
        <h2 className="text-xl font-bold mb-3" style={{ fontVariant: "small-caps" }}>The Free Arts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="border-2 border-[#5a3d1e] bg-[#f7f0da] p-4 hover:bg-[#efe3c0] hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-3xl">{t.glyph}</span>
                <span className="text-[10px] uppercase tracking-widest bg-[#7a1f1f] text-[#f5eeda] px-1.5 py-0.5">{t.tag}</span>
              </div>
              <h3 className="text-lg font-bold mt-2" style={{ fontVariant: "small-caps" }}>{t.title}</h3>
              <p className="text-[13px] leading-snug mt-1 text-[#4a351f]">{t.blurb}</p>
              <span className="text-[12px] mt-3 underline">Enter →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* traditions */}
      <section className="grid md:grid-cols-3 gap-4 mt-10">
        <article className="border border-[#5a3d1e] bg-[#f7f0da] p-4">
          <h3 className="font-bold" style={{ fontVariant: "small-caps" }}>Renaissance Astrology</h3>
          <p className="text-[13px] mt-1 text-[#4a351f]">
            The art of Lilly, Ficino and the masters of the shield chart: essential dignities,
            planetary days and hours, the Moon's applications, and elections for the fit moment.
          </p>
        </article>
        <article className="border border-[#5a3d1e] bg-[#f7f0da] p-4">
          <h3 className="font-bold" style={{ fontVariant: "small-caps" }}>Chaos Magic</h3>
          <p className="text-[13px] mt-1 text-[#4a351f]">
            The pragmatic current: belief as a tool, the sigil as the vehicle, gnosis as the key.
            Our engine distils intention into symbol by the classic letter method.
          </p>
        </article>
        <article className="border border-[#5a3d1e] bg-[#f7f0da] p-4">
          <h3 className="font-bold" style={{ fontVariant: "small-caps" }}>The Runes</h3>
          <p className="text-[13px] mt-1 text-[#4a351f]">
            The Elder Futhark — twenty-four staves of the North, cast for counsel as they were
            for a thousand years before the printed book.
          </p>
        </article>
      </section>

      {/* press teasers */}
      <section className="mt-10 border-t-2 border-[#5a3d1e] pt-4">
        <h2 className="text-lg font-bold mb-2" style={{ fontVariant: "small-caps" }}>From the Press Room</h2>
        <ul className="text-[13px] space-y-1">
          {PRESS_TEASERS.map((p) => (
            <li key={p.to}>
              <Link to={p.to} className="underline hover:text-[#7a1f1f]">{p.title}</Link>
            </li>
          ))}
        </ul>
        <Link to="/press" className="inline-block mt-2 text-[13px] underline">All press releases →</Link>
      </section>
    </div>
  );
}
