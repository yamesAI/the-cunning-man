// Press releases — written for pickup: clear headline, dateline, quotes, links.

export interface PressItem {
  slug: string;
  title: string;
  date: string;      // display date
  dateline: string;
  excerpt: string;
  body: string[];    // paragraphs
  links?: { to: string; label: string }[]; // visible hub links under the body (R-CHARTS-001 §9)
}

export const PRESS: PressItem[] = [
  {
    slug: "launch",
    title: "The Cunning Man Opens: A Free Online Grimoire of Renaissance Astrology, Chaos Magic and the Runes",
    date: "September 1, 2026",
    dateline: "LONDON",
    excerpt:
      "A new public collection of free working tools — a live astrological clock, a synastry meter, launch elections, a chaos sigil engine, and Elder Futhark rune casts — opens to all comers, free of charge.",
    body: [
      "The Cunning Man, a new online grimoire of practical folk magic, opened its doors today. The site gathers the working instruments of the old cunning craft — Renaissance astrology, chaos magic, and the Elder Futhark runes — and puts them in the hands of any visitor, free of charge and without sign-up.",
      "The heart of the collection is a live astrological clock in the shield style of the Renaissance masters: the Ascendant and the seven classical planets drawn against the signs in real time, with planetary hours, lunar condition, and the half-grid of aspects, recomputed every second for any place on Earth.",
      "Around it stand the working tools: a synastry meter that weighs two birth charts for sympathy, an electional engine that names the strongest hour in the coming week to launch a venture, a chaos sigil engine after the method of Austin Osman Spare, and rune casts in the manner of the Norns.",
      "“The cunning man of the village never charged for the sight of the sky,” said the site's keeper. “He charged for the work of interpretation. The sky is free, so these instruments are free.”",
      "Every tool runs in the browser with its own astronomical engine — tropical, geocentric, Regiomontanus houses — and keeps its honest disclaimer: these arts are offered for study and entertainment, not as financial, medical, or legal advice.",
      "The full collection is open now at cunning-man.vercel.app — no account, no fee, no catch.",
    ],
  },
  {
    slug: "trading-clock",
    title: "Free Astrological Clock for Day Traders Adds Do-Not-Trade Windows and 3-Day Election Scanner",
    date: "September 1, 2026",
    dateline: "NEW YORK",
    excerpt:
      "A free Renaissance-style astrological clock now scans three days ahead for the strongest trading entry windows and flags hours when tradition says to sit on your hands.",
    body: [
      "The Cunning Man today announced its Astro Clock, a free browser instrument built for day traders who keep an eye on the sky. The clock draws the Ascendant and planets in real time and continuously scans the next three days of the 6 a.m.–3 p.m. UTC-5 session for the single strongest electional window.",
      "The scanner follows the classical doctrine of elections: the condition of the Moon, her next perfecting aspect, the angularity of Jupiter, Venus and Mercury, and the dignity of the Ascendant ruler. Periods when the Moon is void of course, combust, or in the via combusta are displayed plainly as hours not to trade.",
      "“Traders already watch clocks, sessions, and calendars,” the site's keeper said. “This is simply the oldest clock of all, drawn properly, with the hours marked where the old books say to stand aside.”",
      "The instrument is free and requires no account. It is offered for study and entertainment, and is not financial advice.",
      "The clock is live now at cunning-man.vercel.app/clock.",
    ],
  },
  {
    slug: "synastry-meter",
    title: "Free Synastry Meter Weighs Two Birth Charts by the Old Doctrine of Sympathy",
    date: "September 1, 2026",
    dateline: "LONDON",
    excerpt:
      "Two birth moments in, one sympathy score out — a free synastry instrument scores relationships the Renaissance way, with every testimony shown.",
    body: [
      "The Cunning Man has released its Synastry Meter, a free tool that casts two natal charts and weighs one against the other by the classical doctrine of sympathy and antipathy.",
      "Where most compatibility gadgets report a silent number, the Synastry Meter shows its work: each testimony — Sun to Moon, Venus to Mars, Ascendant to the lights, and the heaviness of Saturn — is listed with its aspect, its orb, and its weight, before the needle settles on a score from 0 to 100.",
      "“Lovers have asked the stars about each other since there were stars and lovers,” said the keeper. “We only insist the arithmetic be visible.”",
      "The meter is free, instant, and requires no sign-up: cunning-man.vercel.app/synastry.",
    ],
  },
  {
    slug: "sigil-engine",
    title: "Chaos Sigil Engine Automates the Austin Spare Method, Free in the Browser",
    date: "September 1, 2026",
    dateline: "LONDON",
    excerpt:
      "Write an intention, strike the vowels, keep each letter once — a free engine draws the resulting sigil on the letter wheel and shows every step of the reduction.",
    body: [
      "The Cunning Man today added a Sigil Engine to its free collection, automating the letter-reduction method of Austin Osman Spare, the foundation of modern chaos magic.",
      "A visitor writes a statement of intent in the present tense; the engine strikes the vowels, removes repeated letters, and binds the survivors into a single glyph drawn across the wheel of the alphabet, with a marked beginning and end. The full reduction is displayed so the method can be learned, not merely consumed.",
      "Traditional charging instructions accompany each sigil: copy it by hand, gaze at it at the height of gnosis, then destroy or bury the drawing and put the matter out of mind.",
      "The engine is free at cunning-man.vercel.app/sigil, and pairs with the site's planetary-hour spell timing for love and money workings.",
    ],
  },
  {
    slug: "rune-cast",
    title: "Free Rune Cast Brings the Elder Futhark to the Browser, Norns Spread Included",
    date: "September 1, 2026",
    dateline: "REYKJAVIK",
    excerpt:
      "A free rune instrument casts single lots and the three-Norn spread from the full Elder Futhark, each stave read for love and for money.",
    body: [
      "The Cunning Man has opened its Rune Cast, a free instrument drawing lots from the full twenty-four staves of the Elder Futhark without replacement — as a handful of runes drawn from a bag, not a shuffled deck.",
      "Visitors may draw a single rune for a swift answer or the three-Norn spread — what has been, what is, and what may come. Each stave is read plainly: its core meaning first, then its counsel in love and in money, in the manner of the old cunning-folk readers.",
      "“The runes were always a poor man's oracle — carved on sticks, cast on cloth,” said the keeper. “They cost nothing then. They cost nothing now.”",
      "The cast is free and instant at cunning-man.vercel.app/runes.",
    ],
  },
  // R-CHARTS-001 §9 (owner t695u): chart releases, appended so PRESS[0] stays "launch".
  // Wording is a draft for the owner to see before any deploy.
  {
    slug: "charts",
    title: "The Cunning Man Opens Charts: Study Pages Reading Public Figures by Lilly's Dignities",
    date: "November 15, 2026",
    dateline: "LONDON",
    excerpt:
      "A new free section reads the natal charts of public figures by William Lilly's 1647 essential dignities, using Astro-Databank birth data with its Rodden rating, for study and entertainment.",
    body: [
      "The Cunning Man today opened Charts, a free section of study pages that read the natal charts of public figures by the essential dignities William Lilly set out in Christian Astrology (1647).",
      "Every page takes its birth date, time and place from the figure's Astro-Databank record and shows the Rodden rating beside it; only records rated AA, A or B are used. The positions are computed in the browser by the same engine as the site's natal page, and each planet is described in Lilly's terms: house, exaltation, triplicity, term and face, or detriment, fall and peregrine.",
      "The first four pages read the charts of King Charles III, Liza Minnelli, Billy Idol and Queen Latifah. The pages describe the chart only. They say nothing about anyone's private life and make no predictions.",
      "Visitors can cast their own chart on the natal page and compare it with Lilly's tables on the Dignities page.",
    ],
    links: [
      { to: "/charts", label: "Charts" },
      { to: "/natal", label: "Cast your own chart" },
      { to: "/dignities", label: "Dignities and Correspondences" },
    ],
  },
  {
    slug: "chart-charles-iii",
    title: "On His 78th Birthday, a Study of King Charles III's Chart by Lilly's Rules",
    date: "November 15, 2026",
    dateline: "LONDON",
    excerpt:
      "A study page reads the King's natal chart, a night chart with Venus and Jupiter in their own houses, from Astro-Databank data rated A.",
    body: [
      "The King marked his 78th birthday on 14 November 2026. The Cunning Man has published a study page reading his natal chart by William Lilly's essential dignities.",
      "The page uses the Astro-Databank record (rated A, from a news report): 14 November 1948, 21:14 GMT, London. By Lilly's rules it is a night chart. Venus stands in her own house of Libra and Jupiter in his own house of Sagittarius, in its last minutes before Capricorn; the Moon is in her exaltation in Taurus.",
      "The page reads the chart only and links each planet to its page in the site's Dignities section.",
    ],
    links: [
      { to: "/charts/charles-iii", label: "Study page: King Charles III" },
      { to: "/natal", label: "Cast your own chart" },
      { to: "/dignities/venus", label: "Venus" },
      { to: "/dignities/jupiter", label: "Jupiter" },
      { to: "/dignities/moon", label: "Moon" },
    ],
  },
  {
    slug: "chart-liza-minnelli",
    title: "Liza Minnelli's Chart, Read by the Old Rules, as Her Life Story Heads to the Screen",
    date: "November 15, 2026",
    dateline: "LONDON",
    excerpt:
      "A study page reads her day chart, with the Moon in her own house of Cancer, from Astro-Databank data rated AA.",
    body: [
      "Liza Minnelli has announced that her autobiography will be adapted for the screen. The Cunning Man has published a study page reading her natal chart by William Lilly's essential dignities.",
      "The page uses the Astro-Databank record (rated AA, quoted birth certificate or record): 12 March 1946, 07:58 PST, Los Angeles. By Lilly's rules it is a day chart, and the Moon stands in her own house of Cancer. The record also notes a 07:28 variant; the page uses the rated time.",
      "The page reads the chart only and links each planet to its page in the site's Dignities section.",
    ],
    links: [
      { to: "/charts/liza-minnelli", label: "Study page: Liza Minnelli" },
      { to: "/natal", label: "Cast your own chart" },
      { to: "/dignities/moon", label: "Moon" },
    ],
  },
  {
    slug: "chart-billy-idol",
    title: "Hall of Fame Night: A Study of Billy Idol's Natal Chart by Lilly's Dignities",
    date: "November 15, 2026",
    dateline: "LOS ANGELES",
    excerpt:
      "A study page reads his chart, with Mars in his own house of Scorpio and a sect that turns on the minutes around sunset, from Astro-Databank data rated A.",
    body: [
      "Billy Idol is among the new Rock & Roll Hall of Fame inductees honoured at the 14 November 2026 ceremony in Los Angeles. The Cunning Man has published a study page reading his natal chart by William Lilly's essential dignities.",
      "The page uses the Astro-Databank record (rated A, from memory): 30 November 1955, 16:00 GMT, Stanmore, England. Mars stands in his own house of Scorpio. At that time the Sun is just below the western horizon, so the engine reads a night chart, and the page says plainly that the sect turns on a few minutes of a remembered time.",
      "The page reads the chart only and links each planet to its page in the site's Dignities section.",
    ],
    links: [
      { to: "/charts/billy-idol", label: "Study page: Billy Idol" },
      { to: "/natal", label: "Cast your own chart" },
      { to: "/dignities/mars", label: "Mars" },
      { to: "/dignities/sun", label: "Sun" },
    ],
  },
  {
    slug: "chart-queen-latifah",
    title: "Hall of Fame Night: A Study of Queen Latifah's Natal Chart by Lilly's Dignities",
    date: "November 15, 2026",
    dateline: "LOS ANGELES",
    excerpt:
      "A study page reads her day chart, with the Sun late in Pisces, from Astro-Databank data rated AA.",
    body: [
      "Queen Latifah is among the new Rock & Roll Hall of Fame inductees honoured at the 14 November 2026 ceremony in Los Angeles. The Cunning Man has published a study page reading her natal chart by William Lilly's essential dignities.",
      "The page uses the Astro-Databank record (rated AA, quoted birth certificate or record): 18 March 1970, 08:02 EST, Newark, New Jersey. By Lilly's rules it is a day chart, with the Sun late in Pisces.",
      "The page reads the chart only and links each planet to its page in the site's Dignities section.",
    ],
    links: [
      { to: "/charts/queen-latifah", label: "Study page: Queen Latifah" },
      { to: "/natal", label: "Cast your own chart" },
      { to: "/dignities/sun", label: "Sun" },
    ],
  },
];
