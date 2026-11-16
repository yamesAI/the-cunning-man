// About, Contact and Privacy (HUB-FIX-001). Brand only: the operator is
// OPERATOR_NAME, never a personal name. Contact states that no public channel
// exists yet. Privacy lists only what the code does (checked 2026-11-16).
// Head tags and JSON-LD come from RouteHead.

import type { ReactNode } from "react";
import { Link } from "react-router";
import { OPERATOR_NAME } from "@/site/info";

function Disclaimer() {
  return <p className="text-[12px] italic text-ink-soft max-w-3xl mb-4">For entertainment &amp; study. Not financial, medical, or legal advice.</p>;
}

function InfoLinks({ here }: { here: string }) {
  const links = [
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
    { to: "/privacy", label: "Privacy" },
  ].filter((l) => l.to !== here);
  return (
    <p className="text-[13px] flex flex-wrap gap-x-4 mt-6">
      {links.map((l) => (
        <Link key={l.to} to={l.to} className="inline-block py-1 underline hover:text-seal">{l.label}</Link>
      ))}
    </p>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="max-w-3xl mb-5">
      <h2 className="text-lg font-bold mb-1 font-smallcaps">{title}</h2>
      <div className="text-[14px] space-y-2">{children}</div>
    </section>
  );
}

const TOOLS = [
  { to: "/clock", label: "Astro Clock" },
  { to: "/sky", label: "Session Sky" },
  { to: "/natal", label: "Natal & Transits" },
  { to: "/synastry", label: "Synastry Meter" },
  { to: "/launches", label: "Launch Elections" },
  { to: "/sigil", label: "Sigil Engine" },
  { to: "/runes", label: "Rune Cast" },
  { to: "/spells/love", label: "Love Spell" },
  { to: "/spells/money", label: "Money Spell" },
  { to: "/dignities", label: "Dignities" },
  { to: "/library", label: "Library" },
  { to: "/charts", label: "Charts" },
  { to: "/press", label: "Press" },
];

export function AboutPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-1 font-smallcaps">About The Cunning Man</h1>
      <p className="text-[14px] text-ink-soft max-w-3xl mb-2">
        A free public grimoire of the old village arts: Renaissance astrology, chaos magic, and the Elder Futhark runes,
        computed live in your browser. No coin asked, no account, no gate.
      </p>
      <Disclaimer />
      <Block title="Who runs it">
        <p>The Cunning Man is run by {OPERATOR_NAME}.</p>
      </Block>
      <Block title="What is here">
        <ul className="flex flex-wrap gap-x-4">
          {TOOLS.map((t) => (
            <li key={t.to}><Link to={t.to} className="inline-block py-1 underline hover:text-seal">{t.label}</Link></li>
          ))}
        </ul>
      </Block>
      <Block title="Method">
        <p>
          The art of Lilly and the masters of the shield chart: tropical zodiac, geocentric positions, Regiomontanus
          houses, essential dignities with Egyptian terms, planetary days and hours, and elections for the fit moment.
        </p>
        <p>Nothing on this site is a trading signal, a price or financial advice.</p>
      </Block>
      <InfoLinks here="/about" />
    </div>
  );
}

export function ContactPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-1 font-smallcaps">Contact</h1>
      <Disclaimer />
      <Block title="How to reach us">
        <p>The Cunning Man has no public contact address or account yet. If one is added, it will be listed here.</p>
        <p>The site is run by {OPERATOR_NAME}.</p>
      </Block>
      <InfoLinks here="/contact" />
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-1 font-smallcaps">Privacy</h1>
      <p className="text-[14px] text-ink-soft max-w-3xl mb-4">
        What The Cunning Man stores and sends. There is no account, no sign-up and no fee.
      </p>
      <Block title="What stays in your browser">
        <p>
          Your place for the clock and sky tools (a city you pick, coordinates you type, or your device's location if you
          allow it) is saved in your browser's local storage under <code>cunning-man:location</code>, so the tools remember
          it. It is not sent to the site.
        </p>
        <p>
          If you save a natal chart, its optional name, birth moment and place are saved in your browser's local storage
          under <code>cunning-man:natal</code>. They are not sent anywhere. You can clear them on the{" "}
          <Link to="/natal" className="underline">natal page</Link> or in your browser settings.
        </p>
        <p>Everything else (charts, sigils, rune casts, spell timings) is worked out in your browser and is not stored or sent.</p>
      </Block>
      <Block title="What is sent to others">
        <p>
          City search on the natal and Session Sky pages sends what you type to OpenStreetMap's Nominatim service
          (nominatim.openstreetmap.org) to look up the place.
        </p>
        <p>
          On a first visit, or when you press the 📍 button, your browser asks whether to share your device's location. If
          you allow it, the coordinates are used in your browser only and saved as above.
        </p>
        <p>
          The fonts load from Google Fonts (fonts.googleapis.com and fonts.gstatic.com), so your browser contacts Google
          when a page loads.
        </p>
        <p>The site is hosted on Vercel. As with any website, your browser's requests for pages and files reach the host's servers.</p>
      </Block>
      <Block title="What the site does not do">
        <p>
          No analytics or tracking scripts, no advertising, no cookies set by the site, no forms that send data to the
          site, and no embedded content from other sites. Links to other sites open only when you click them.
        </p>
      </Block>
      <p className="text-[12px] italic text-ink-soft max-w-3xl">Checked against the site's code on 16 November 2026.</p>
      <InfoLinks here="/privacy" />
    </div>
  );
}
