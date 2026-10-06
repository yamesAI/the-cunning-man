// Traditional testimony for transits — every entry source-verified.
// kind "quote": verbatim wording confirmed against the URL in verifiedUrl
// (spelling normalized from long-s; […] marks omitted text).
// kind "doctrine": labeled paraphrase where verbatim was not confirmable.

import type { PlanetKey } from "../astro/constants";
import type { AspectKey } from "../astro/constants";

export interface Testimony {
  match: { planet: PlanetKey; aspect?: AspectKey };
  kind: "quote" | "doctrine";
  text: string;
  author: string;
  work: string;
  year: number;
  citation: string;
  verifiedUrl?: string;
}

const LILLY = "https://archive.org/details/ca-william-lilly"; // Christian Astrology, 1647 (OCR of the first edition)
const RAMESEY = "https://archive.org/details/b30323149_0001"; // Astrologia Restaurata, 1654 (Wellcome copy)
const PTOLEMY = "https://www.sacred-texts.com/astro/ptb/ptb07.htm"; // Tetrabiblos I.4, trans. Ashmand 1822
const BONATTI = "https://archive.org/details/astrologersguide00lill"; // Anima Astrologiae: Bonatti's 146 Considerations, trans. Coley

export const TESTIMONY: Testimony[] = [
  // ---- SATURN ----
  {
    match: { planet: "saturn" },
    kind: "quote",
    text: "He is a Diurnall Planet, Cold and Dry […] Melanchollick, Earthly, Masculine, the greater Infortune, author of Solitarinesse, Malevolent.",
    author: "William Lilly",
    work: "Christian Astrology",
    year: 1647,
    citation: "Bk 1, Of the Planet Saturne, and his significations, p. 58",
    verifiedUrl: LILLY,
  },
  {
    match: { planet: "saturn" },
    kind: "quote",
    text: "Saturn produces cold and dryness, for he is most remote both from the Sun's heat and from the earth's vapours. But he is more effective in the production of cold than of dryness.",
    author: "Claudius Ptolemy",
    work: "Tetrabiblos",
    year: 1822,
    citation: "Bk I, ch. IV (trans. J. M. Ashmand)",
    verifiedUrl: PTOLEMY,
  },
  {
    match: { planet: "saturn", aspect: "square" },
    kind: "quote",
    text: "There is none born that hath either the Sun, Moon, Mercury, or the Lord of the Ascendant disposed of by Saturn, and he located in the ascendant, or in square or opposition thereunto […] but the native will be much addicted to melancholy.",
    author: "William Ramesey",
    work: "Astrologia Restaurata",
    year: 1653,
    citation: "Lib. 1, A Vindication of Astrology",
    verifiedUrl: RAMESEY,
  },
  {
    match: { planet: "saturn", aspect: "opposition" },
    kind: "quote",
    text: "At the square, opposition or conjunction of the Sun and him, cold ayr and wet weather is thereby produced, according to the season of the yeer.",
    author: "William Ramesey",
    work: "Astrologia Restaurata",
    year: 1653,
    citation: "Lib. 1, A Vindication of Astrology",
    verifiedUrl: RAMESEY,
  },
  {
    match: { planet: "saturn", aspect: "trine" },
    kind: "quote",
    text: "In gathering of his herbs, turn thy face towards the East, in his hour when he is in an Angle, and well fortified essentially […] and let Luna apply by a Sextile or Trine to him.",
    author: "William Ramesey",
    work: "Astrologia Restaurata",
    year: 1653,
    citation: "Lib. 2, An Introduction to the Judgement of the Stars",
    verifiedUrl: RAMESEY,
  },

  // ---- JUPITER ----
  {
    match: { planet: "jupiter" },
    kind: "quote",
    text: "He is a Diurnall, Masculine Planet, Temperately Hot and Moyst, Aiery, Sanguine, the greater Fortune, author of Temperance, Modesty, Sobriety, Justice.",
    author: "William Lilly",
    work: "Christian Astrology",
    year: 1647,
    citation: "Bk 1, Of the Planet Jupiter, p. 62",
    verifiedUrl: LILLY,
  },
  {
    match: { planet: "jupiter" },
    kind: "quote",
    text: "Jupiter revolves in an intermediate sphere between the extreme cold of Saturn and the burning heat of Mars, and has consequently a temperate influence […] and hence he produces fertilizing breezes.",
    author: "Claudius Ptolemy",
    work: "Tetrabiblos",
    year: 1822,
    citation: "Bk I, ch. IV (trans. J. M. Ashmand)",
    verifiedUrl: PTOLEMY,
  },
  {
    match: { planet: "jupiter", aspect: "trine" },
    kind: "quote",
    text: "Then is he Magnanimous, Faithfull, Bashfull, Aspiring in an honourable way at high matters […] Honourable and Religious, of sweet and affable Conversation […] a great Reliever of the Poore, full of Charity and Godlinesse.",
    author: "William Lilly",
    work: "Christian Astrology",
    year: 1647,
    citation: "Bk 1, Jupiter when well dignified, pp. 62–63",
    verifiedUrl: LILLY,
  },
  {
    match: { planet: "jupiter", aspect: "square" },
    kind: "quote",
    text: "If a Fortune, that is, Jupiter, Venus, the Sun or Moon shall behold them, it slackens and dissolves the rigours of such Infortune.",
    author: "Guido Bonatti",
    work: "Liber Astronomiae (146 Considerations, trans. Henry Coley)",
    year: 1676,
    citation: "The 50th Consideration, in Anima Astrologiae",
    verifiedUrl: BONATTI,
  },

  // ---- MARS ----
  {
    match: { planet: "mars" },
    kind: "quote",
    text: "He is a Masculine, Nocturnall Planet, in nature hot and dry, cholerick and fiery, the lesser Infortune, author of Quarrels, Strifes, Contentions.",
    author: "William Lilly",
    work: "Christian Astrology",
    year: 1647,
    citation: "Bk 1, Of the Planet Mars, p. 66",
    verifiedUrl: LILLY,
  },
  {
    match: { planet: "mars" },
    kind: "quote",
    text: "Mars chiefly causes dryness, and is also strongly heating, by means of his own fiery nature, which is indicated by his colour, and in consequence of his vicinity to the Sun.",
    author: "Claudius Ptolemy",
    work: "Tetrabiblos",
    year: 1822,
    citation: "Bk I, ch. IV (trans. J. M. Ashmand)",
    verifiedUrl: PTOLEMY,
  },
  {
    match: { planet: "mars", aspect: "square" },
    kind: "quote",
    text: "Then he is a Pratler without modesty or honesty, a lover of Slaughter and Quarrels, Murder, Theevery, a promoter of Sedition […] a Traytor, of turbulent Spirit, Perjured, Obscene, Rash, Inhumane.",
    author: "William Lilly",
    work: "Christian Astrology",
    year: 1647,
    citation: "Bk 1, Mars when ill placed, pp. 66–67",
    verifiedUrl: LILLY,
  },
  {
    match: { planet: "mars", aspect: "trine" },
    kind: "quote",
    text: "Saturn and Mars are naturally bad […] they signify evil and damage and hindrance […] but if they be in Opposition or Square, their malice is increased; and so much the more if they be not received: for in Sextile or Trine the mischief is less.",
    author: "Guido Bonatti",
    work: "Liber Astronomiae (146 Considerations, trans. Henry Coley)",
    year: 1676,
    citation: "The 11th Consideration, in Anima Astrologiae",
    verifiedUrl: BONATTI,
  },

  // ---- SUN ----
  {
    match: { planet: "sun" },
    kind: "quote",
    text: "He is naturally Hot, Dry; but more temperate then Mars, is a Masculine, Diurnall Planet, Equivalent, if well dignified, to a Fortune.",
    author: "William Lilly",
    work: "Christian Astrology",
    year: 1647,
    citation: "Bk 1, Of the Sun, p. 70",
    verifiedUrl: LILLY,
  },
  {
    match: { planet: "sun", aspect: "trine" },
    kind: "quote",
    text: "A kind of itching desire to Rule and Sway where he comes: Prudent, and of incomparable Judgment; of great Majesty and Statelinesse, Industrious to acquire Honour […] speaks deliberately […] Affable, Tractable, and very humane to all people.",
    author: "William Lilly",
    work: "Christian Astrology",
    year: 1647,
    citation: "Bk 1, The Sun when well dignified, p. 70",
    verifiedUrl: LILLY,
  },
  {
    match: { planet: "sun", aspect: "opposition" },
    kind: "quote",
    text: "Then the Solar man is Arrogant and Proud, disdaining all men, cracking of his Pedegree […] restlesse, troublesome, domineering, a meer vapour, expensive, foolish.",
    author: "William Lilly",
    work: "Christian Astrology",
    year: 1647,
    citation: "Bk 1, The Sun when ill dignified, pp. 70–71",
    verifiedUrl: LILLY,
  },

  // ---- VENUS ----
  {
    match: { planet: "venus" },
    kind: "quote",
    text: "Shee is a Feminine Planet, temperately Cold and Moyst, Nocturnall, the lesser Fortune, author of Mirth and Jollity.",
    author: "William Lilly",
    work: "Christian Astrology",
    year: 1647,
    citation: "Bk 1, Of the Planet Venus, pp. 73–74",
    verifiedUrl: LILLY,
  },
  {
    match: { planet: "venus", aspect: "trine" },
    kind: "quote",
    text: "Shee signifies a quiet man, not given to Law, Quarrel or Wrangling; not Vicious, Pleasant, Neat and Spruce, loving Mirth in his words and actions […] Cheerful, nothing Mistrustful, a right vertuous Man or Woman.",
    author: "William Lilly",
    work: "Christian Astrology",
    year: 1647,
    citation: "Bk 1, Venus when well placed, p. 74",
    verifiedUrl: LILLY,
  },
  {
    match: { planet: "venus", aspect: "square" },
    kind: "quote",
    text: "Then he is Riotous, Expensive, wholly given to Loosenesse and Lewd companies of Women, nothing regarding his Reputation […] spending his Means in Alehouses, Taverns, and amongst Scandalous, Loose people.",
    author: "William Lilly",
    work: "Christian Astrology",
    year: 1647,
    citation: "Bk 1, Venus when ill dignified, p. 74",
    verifiedUrl: LILLY,
  },

  // ---- MERCURY ----
  {
    match: { planet: "mercury" },
    kind: "quote",
    text: "We may not call him either Masculine or Feminine, for he is either the one or the other as joyned to any Planet […] of his owne nature he is cold and dry […] with the good he is good, with the evill Planets ill.",
    author: "William Lilly",
    work: "Christian Astrology",
    year: 1647,
    citation: "Bk 1, Of Mercury, p. 77",
    verifiedUrl: LILLY,
  },
  {
    match: { planet: "mercury", aspect: "sextile" },
    kind: "quote",
    text: "Being well dignified, he represents a man of a subtile and politick braine, intellect, and cogitation; an excellent disputant or Logician […] a searcher into all kinds of Mysteries, Learning, sharpe and witty.",
    author: "William Lilly",
    work: "Christian Astrology",
    year: 1647,
    citation: "Bk 1, Mercury when well dignified, p. 77",
    verifiedUrl: LILLY,
  },
  {
    match: { planet: "mercury", aspect: "square" },
    kind: "quote",
    text: "A troublesome wit, a kind of heterodox man, his tongue and Pen against every man […] a great lyar, boaster, prattler, busibody, false, a tale-carrier […] constant in no place or opinion.",
    author: "William Lilly",
    work: "Christian Astrology",
    year: 1647,
    citation: "Bk 1, Mercury when ill placed, pp. 77–78",
    verifiedUrl: LILLY,
  },

  // ---- MOON ----
  {
    match: { planet: "moon" },
    kind: "quote",
    text: "She is a Feminine, Nocturnall Planet, Cold, Moyst and Phlegmatique.",
    author: "William Lilly",
    work: "Christian Astrology",
    year: 1647,
    citation: "Bk 1, Of the Moon, p. 78",
    verifiedUrl: LILLY,
  },
  {
    match: { planet: "moon" },
    kind: "quote",
    text: "The Moon principally generates moisture; her proximity to the earth renders her highly capable of exciting damp vapours, and of thus operating sensibly upon animal bodies by relaxation and putrefaction.",
    author: "Claudius Ptolemy",
    work: "Tetrabiblos",
    year: 1822,
    citation: "Bk I, ch. IV (trans. J. M. Ashmand)",
    verifiedUrl: PTOLEMY,
  },
  {
    match: { planet: "moon", aspect: "trine" },
    kind: "quote",
    text: "She signifieth one of composed Manners, a soft, tender creature, a Lover of all honest and ingenuous Sciences, a Searcher of, and Delighter in Novelties […] however loving Peace, and to live free from the cares of this Life.",
    author: "William Lilly",
    work: "Christian Astrology",
    year: 1647,
    citation: "Bk 1, The Moon when well placed, p. 78",
    verifiedUrl: LILLY,
  },
  {
    match: { planet: "moon", aspect: "opposition" },
    kind: "quote",
    text: "A meer Vagabond, idle Person, hating Labour, a Drunkard, a Sot, one of no Spirit or Forecast, delighting to live beggarly and carelessly, one content in no condition of Life, either good or ill.",
    author: "William Lilly",
    work: "Christian Astrology",
    year: 1647,
    citation: "Bk 1, The Moon when ill dignified, p. 78",
    verifiedUrl: LILLY,
  },
];

export function lookupTestimony(planet: PlanetKey, aspect: AspectKey): Testimony {
  return (
    TESTIMONY.find((t) => t.match.planet === planet && t.match.aspect === aspect) ??
    TESTIMONY.find((t) => t.match.planet === planet && !t.match.aspect) ??
    TESTIMONY[0]
  );
}
