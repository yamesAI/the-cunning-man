// Natal & Transits — cast a natal figure once, then watch the living sky
// aspect it, in the words of the tradition.

import { useMemo, useState, type ReactElement } from "react";
import { useSky } from "@/sky/sky-context";
import { computeChart } from "@/astro/engine";
import { transitsToNatal, sortTransitHits, exactTimesForHits, type TransitHit } from "@/astro/transits";
import { ASPECT_GLYPH, PLANET_LABEL, SIGN_GLYPH, SIGN_LABEL } from "@/astro/constants";
import { fmtDegMin } from "@/astro/format";
import { lookupTestimony } from "@/data/tradition";
import { CITIES } from "@/data/cities";
import { loadNatal, saveNatal, clearNatal, type NatalProfile } from "@/lib/natal";
import { hitLine, exactLabel, natalPointLabel } from "@/lib/transitFormat";
import { SquareChart } from "@/components/SquareChart";
import { TestimonyCard } from "@/components/TestimonyCard";
import { CitySearch } from "@/components/CitySearch";
import { useMeta } from "@/hooks/useMeta";
import { useJsonLd } from "@/hooks/useJsonLd";

// datetime-local values are wall time without a zone; shift the stored UTC
// instant into the browser's zone so the field shows the entrant's local moment
function toLocalInputValue(d: Date): string {
  const offMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offMs).toISOString().slice(0, 16);
}

function TransitRow({ hit, exactAt, now }: { hit: TransitHit; exactAt: Date | null; now: Date }): ReactElement {  const testimony = lookupTestimony(hit.transiting, hit.aspectKey);
  return (
    <li className="py-2 border-b border-line/60 last:border-0">
      <p className="font-ui text-[13px]">
        <span className="glyph-pair font-bold">
          {PLANET_LABEL[hit.transiting]}{" "}
          <span aria-hidden="true">{ASPECT_GLYPH[hit.aspectKey]}</span>{" "}
          <span className="sr-only">{hit.aspectKey}</span>
        </span>{" "}
        to <span className="font-bold">{natalPointLabel(hit.natalPoint)}</span>
        <span className="text-ink-soft">
          {" "}
          · {hit.orb.toFixed(1)}° {hit.applying ? "applying" : "separating"} ·{" "}
          {exactLabel({ applying: hit.applying, exactAt }, now)}
        </span>
      </p>
      <p className="sr-only">{hitLine(hit)}</p>
      <TestimonyCard testimony={testimony} />
    </li>
  );
}

export default function NatalPage(): ReactElement {
  useMeta(
    "Natal Chart & Live Transits — The Cunning Man",
    "Cast your natal chart by the old art and watch the living sky aspect it: exact transits, applying and separating, with testimony from Lilly, Ptolemy, Bonatti and the tradition."
  );
  const { now, loc } = useSky();
  useJsonLd("ld-app", {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "The Cunning Man — Natal Chart & Live Transits",
    url: "https://cunning-man.vercel.app/natal",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Any (web browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description:
      "Cast your natal chart by the traditional art and watch the living sky aspect it: exact transits, applying and separating, with testimony from Lilly, Ptolemy and the tradition. Free; the figure stays in your browser.",
  });
  const [profile, setProfile] = useState<NatalProfile | null>(() => loadNatal());
  const [editing, setEditing] = useState(false);

  const bucket5 = Math.floor(now.getTime() / 300000);
  const natalChart = useMemo(
    () => (profile ? computeChart(new Date(profile.birth), profile.lat, profile.lng) : null),
    [profile]
  );
  const currentChart = useMemo(
    () => computeChart(now, loc.lat, loc.lng),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bucket5, loc.lat, loc.lng]
  );
  const hits = useMemo(
    () => (natalChart ? sortTransitHits(transitsToNatal(natalChart, currentChart)) : []),
    [natalChart, currentChart]
  );
  // exact-hit dates in two tiers: Moon times move fast (5-min recompute),
  // slow-planet dates barely move (30-min recompute)
  const bucket30 = Math.floor(now.getTime() / 1800000);
  const moonHits = useMemo(() => hits.filter((h) => h.transiting === "moon"), [hits]);
  const slowHits = useMemo(() => hits.filter((h) => h.transiting !== "moon"), [hits]);
  const moonTimes = useMemo(
    () => (natalChart ? exactTimesForHits(moonHits, natalChart, currentChart.date, currentChart.lat, currentChart.lng) : new Map()),
    [moonHits, natalChart, currentChart]
  );
  const slowTimes = useMemo(
    () =>
      natalChart
        ? exactTimesForHits(slowHits, natalChart, new Date(bucket30 * 1800000), currentChart.lat, currentChart.lng)
        : new Map(),
    [bucket30, slowHits, natalChart, currentChart.lat, currentChart.lng]
  );

  if (!profile || editing) {
    return (
      <NatalForm
        initial={profile}
        onSave={(p) => {
          saveNatal(p);
          setProfile(p);
          setEditing(false);
        }}
        onCancel={profile ? () => setEditing(false) : undefined}
      />
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1 font-display font-smallcaps">
        Natal &amp; Transits
      </h1>
      <p className="text-[14px] text-ink-soft max-w-3xl mb-4">
        The figure cast at your first breath, and the sky of this moment moving against it.
        Aspects use the traditional orbs; exact times are computed, not read from a table.
      </p>

      <dl className="manor-card px-4 py-3 mb-4 flex flex-wrap gap-x-6 gap-y-1 text-[13px]">
        <div>
          <dt className="inline font-bold">Figure</dt>{" "}
          <dd className="inline">{profile.name || "Unnamed"}</dd>
        </div>
        <div>
          <dt className="inline font-bold">Born</dt>{" "}
          <dd className="inline">{new Date(profile.birth).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="inline font-bold">Place</dt>{" "}
          <dd className="inline">{profile.placeName}</dd>
        </div>
        <dd className="ml-auto flex gap-2">
          <button onClick={() => setEditing(true)} className="btn-seal text-[12px]">
            Edit
          </button>
          <button
            onClick={() => {
              if (window.confirm("Forget this natal figure?")) {
                clearNatal();
                setProfile(null);
              }
            }}
            className="border border-line px-3 py-1 text-[12px] hover:bg-parchment-deep"
          >
            Clear
          </button>
        </dd>
      </dl>

      {natalChart && (
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <section aria-labelledby="natal-wheel-h">
            <h2 id="natal-wheel-h" className="font-bold mb-2 font-display font-smallcaps">
              The natal figure
            </h2>
            <div className="wheel-frame manor-card aspect-square w-full max-w-[440px] mx-auto">
              <SquareChart chart={natalChart} showOuters={false} centralTitle="Natal Figure" />
            </div>
          </section>

          <section aria-labelledby="natal-positions-h">
            <h2 id="natal-positions-h" className="font-bold mb-2 font-display font-smallcaps">
              Natal positions
            </h2>
            <table className="tbl-ledger">
              <thead>
                <tr>
                  <th scope="col">Planet</th>
                  <th scope="col">Position</th>
                  <th scope="col">House</th>
                  <th scope="col">Speed</th>
                  <th scope="col">Station</th>
                </tr>
              </thead>
              <tbody>
                {natalChart.bodies.map((b) => (
                  <tr key={b.key}>
                    <td className="font-bold">
                      <span className="glyph-pair" aria-hidden="true">
                        {PLANET_LABEL[b.key]}
                      </span>
                    </td>
                    <td>
                      {fmtDegMin(b.lon)} {SIGN_GLYPH[b.sign]}{" "}
                      <span className="sr-only">{SIGN_LABEL[b.sign]}</span>
                    </td>
                    <td>{b.house}</td>
                    <td>{Math.abs(b.speed).toFixed(2)}°/d</td>
                    <td>{b.retro ? "℞ retrograde" : "direct"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}

      <section aria-labelledby="natal-transits-h" className="mt-6">
        <h2 id="natal-transits-h" className="font-bold mb-2 font-display font-smallcaps">
          The sky upon the figure — live
        </h2>
        {hits.length === 0 ? (
          <p className="text-[13px] text-ink-soft">No transiting aspects within orb just now.</p>
        ) : (
          <ul>
            {hits.map((h, i) => (
              <TransitRow
                key={i}
                hit={h}
                exactAt={(h.transiting === "moon" ? moonTimes : slowTimes).get(h) ?? null}
                now={now}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function NatalForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: NatalProfile | null;
  onSave: (p: NatalProfile) => void;
  onCancel?: () => void;
}): ReactElement {
  const { loc, refreshLocation } = useSky();
  const [name, setName] = useState(initial?.name ?? "");
  // datetime-local shows wall time; the stored instant is UTC — convert so the
  // field displays (and re-edits) the entrant's local moment, not a UTC slice
  const [birth, setBirth] = useState(() =>
    initial ? toLocalInputValue(new Date(initial.birth)) : ""
  );
  const [placeName, setPlaceName] = useState(initial?.placeName ?? "");
  const [latText, setLatText] = useState(String(initial?.lat ?? loc.lat));
  const [lngText, setLngText] = useState(String(initial?.lng ?? loc.lng));
  const [error, setError] = useState<string | null>(null);

  // fill the form when a geo acquisition lands — render-adjust pattern, never
  // the click-time closure (that would copy stale coordinates)
  const [prevLoc, setPrevLoc] = useState(loc);
  if (loc !== prevLoc) {
    setPrevLoc(loc);
    if (loc.source === "geo") {
      setLatText(String(loc.lat));
      setLngText(String(loc.lng));
      setPlaceName(loc.name);
    }
  }

  const submit = () => {
    const lat = parseFloat(latText);
    const lng = parseFloat(lngText);
    const birthDate = new Date(birth);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      setError("Latitude and longitude must be numbers within their ranges.");
      return;
    }
    if (!birth || Number.isNaN(birthDate.getTime())) {
      setError("Give the birth moment (date and time).");
      return;
    }
    if (!placeName.trim()) {
      setError("Name the place — a city at minimum.");
      return;
    }
    setError(null);
    onSave({
      name: name.trim() || undefined,
      birth: birthDate.toISOString(),
      lat,
      lng,
      placeName: placeName.trim(),
    });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1 font-display font-smallcaps">
        Natal &amp; Transits
      </h1>
      <p className="text-[14px] text-ink-soft max-w-3xl mb-4">
        The moment and place of your first breath fix the figure the sky returns to visit for
        the rest of your life. It is kept only in this browser — nothing is sent anywhere.
      </p>

      <form
        className="manor-card p-4 flex flex-wrap items-end gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="font-bold font-smallcaps">Name (optional)</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-line bg-card px-2 py-1"
            autoComplete="name"
          />
        </label>
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="font-bold font-smallcaps">Birth moment</span>
          <input
            type="datetime-local"
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
            className="border border-line bg-card px-2 py-1"
            required
          />
        </label>
        <CitySearch
          onPick={(r) => {
            setPlaceName(r.name);
            setLatText(String(r.lat));
            setLngText(String(r.lng));
          }}
        />
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="font-bold font-smallcaps">Place name</span>
          <input
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            placeholder="City"
            className="border border-line bg-card px-2 py-1"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="font-bold font-smallcaps">Latitude</span>
          <input
            value={latText}
            onChange={(e) => setLatText(e.target.value)}
            className="w-24 border border-line bg-card px-2 py-1"
            inputMode="decimal"
          />
        </label>
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="font-bold font-smallcaps">Longitude</span>
          <input
            value={lngText}
            onChange={(e) => setLngText(e.target.value)}
            className="w-24 border border-line bg-card px-2 py-1"
            inputMode="decimal"
          />
        </label>
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="font-bold font-smallcaps">Preset city</span>
          <select
            aria-label="Fill coordinates from a preset city"
            value=""
            onChange={(e) => {
              const c = CITIES.find((x) => x.name === e.target.value);
              if (c) {
                setLatText(String(c.lat));
                setLngText(String(c.lng));
                setPlaceName(c.name);
              }
            }}
            className="border border-line bg-card px-2 py-1"
          >
            <option value="">Choose…</option>
            {CITIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={refreshLocation}
          className="border border-line bg-card px-2 py-1 text-[13px] hover:bg-parchment-deep"
        >
          📍 Use current location
        </button>
        <div className="flex gap-2 ml-auto">
          {onCancel && (
            <button type="button" onClick={onCancel} className="border border-line px-3 py-1 text-[13px] hover:bg-parchment-deep">
              Cancel
            </button>
          )}
          <button type="submit" className="btn-seal text-[13px]">
            Cast the natal figure
          </button>
        </div>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-seal font-bold">
          {error}
        </p>
      )}
    </div>
  );
}
