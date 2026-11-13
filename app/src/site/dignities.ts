// Dignities and Correspondences (DIGNITIES-001 v1.1, CEO D-1–D-6 2026-11-12).
// Layer A only: Lilly, Christian Astrology (1647), Book 1, read from the scan
// the hub already cites (DjVu text checked against the page images). Spelling
// as printed; long s modernized; astrological symbols written out. The dignity
// table is derived from src/astro/traditional.ts (not copied into it). Lives in
// src/site/, never src/lib/. No tarot, Agrippa, Al-Biruni or modern planets.

import { CLASSICAL_PLANETS, SIGNS, type PlanetKey, type SignKey } from "@/astro/constants";
import {
  DETRIMENT, ELEMENT_OF, EXALTATION_DEGREE, EXALTATION_SIGN, FALL_SIGN, RULER, TRIPLICITY, faceRuler, termRuler,
} from "@/astro/traditional";
import { LIBRARY_BOOKS } from "./library";

export const DIGNITIES_PATH = "/dignities";
export const DIGNITIES_TITLE = "The Cunning Man — Dignities and Correspondences";
export const DIGNITIES_SUBTITLE =
  "A study reference, not a live chart and not advice: the essential dignities of the seven traditional planets, and the complete planet-signification lists from William Lilly's Christian Astrology (1647), Book 1.";
export const DIGNITIES_DESCRIPTION =
  "Essential dignities of the seven traditional planets and William Lilly's complete Book 1 signification lists (Christian Astrology, 1647), with page references to the public-domain scan. A study reference for entertainment and study.";
export const DISCLAIMER = "For entertainment & study. Not financial, medical, or legal advice.";

const lilly = LIBRARY_BOOKS.find((b) => b.id === "christian-astrology")!;
export const LILLY_SOURCE = { title: lilly.title, author: lilly.author, year: lilly.year, url: lilly.url };
export const LILLY_LABEL = "Lilly, Christian Astrology, 1647";
export const LILLY_TABLE_PAGE = 104;

export function planetPath(key: string): string {
  return `${DIGNITIES_PATH}/${key}`;
}

export function planetPageName(name: string): string {
  return `The Cunning Man — ${name}`;
}

export function planetPageDescription(c: Pick<PlanetCatalog, "name" | "chapter" | "pages">): string {
  return `${c.name} as Lilly describes it in Christian Astrology (1647), Book 1, ${c.chapter}, ${c.pages}.`;
}

export type DayOfWeekName = "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";

export interface CatalogEntry {
  heading: string;        // Lilly's margin heading (regularized)
  page: number;           // printed page in the 1647 scan
  text: string;
  sickness?: true;        // sickness or body-part study note: disclaimer shown beside it
  historical?: true;      // gathering or timing practice: historical study text, not instructions
}

export interface NamedPlace {
  name: string;           // as printed
  type: "Country" | "City";
}

export interface PlanetCatalog {
  key: PlanetKey;
  name: string;
  alternateName: string[];
  chapter: string;        // chapter number and title as printed (regularized)
  pages: string;
  day: DayOfWeekName;
  friends: PlanetKey[];   // only where the chapter names them
  enemies: PlanetKey[];
  occupations: string[];  // named trades and stations from the quality-of-men and profession lists
  places: NamedPlace[];   // only items that honestly are a country or a city (D-6)
  entries: CatalogEntry[];
}

const TERMS_FACE = (page: number, text?: string): CatalogEntry => ({
  heading: "Terms and face",
  page,
  text: text ?? "The chapter prints the degrees of each sign that are this planet's terms and face; they follow Lilly's own table of essential dignities (p. 104), shown in the dignity tables on the Dignities page (/dignities); the chapter's degree lists are not repeated here.",
});

const SATURN: PlanetCatalog = {
  key: "saturn",
  name: "Saturn",
  alternateName: ["Saturne", "Chronos", "Phænon", "Falcifer"],
  chapter: "Chap. VIII. Of the Planet Saturne, and his signification",
  pages: "pp. 57–61",
  day: "Saturday",
  friends: ["jupiter", "sun", "mercury"],
  enemies: ["mars", "venus"],
  occupations: [
    "Husbandmen", "Clownes", "Beggars", "Day-labourers", "Monks", "Jesuits",
    "Curriers", "Night-farmers", "Miners under ground", "Tinners", "Potters", "Broom-men", "Plummers",
    "Brick-makers", "Malsters", "Chimney-sweepers", "Sextons of Churches", "Bearers of dead corps",
    "Scavengers", "Hostlers", "Colliers", "Carters", "Gardiners", "Ditchers", "Chandlers",
    "Diers of black Cloth", "Herdsman", "Shepheard", "Cow-keeper",
  ],
  places: [
    { name: "Ravenna", type: "City" },
    { name: "Constantia", type: "City" },
    { name: "Ingoldstad", type: "City" },
  ],
  entries: [
    { heading: "Names", page: 57, text: "He is called usually Saturne, but in some Authors Chronos, Phænon, Falcifer." },
    { heading: "Colour", page: 57, text: "He is the supreamest or highest of all the Planets; is placed betwixt Jupiter and the Firmament, he is not very bright or glorious, or doth he twinckle or sparkle, but is of a Pale, Wan or Leaden, Ashy colour." },
    { heading: "Motion", page: 57, text: "Slow in Motion, finishing his Course through the twelve Signes of the Zodiack in 29 yeers, 157 dayes, or thereabouts; his middle motion is two minutes and one second; his diurnall motion sometimes is three, four, five, or six minutes, seldome more. He continueth Retrograde 140 dayes. He is five dayes in his first station before Retrogradation, and so many in his second station before Direction (p. 58)." },
    { heading: "Latitude", page: 57, text: "His greatest North latitude from the Ecliptick is two degrees 48 minutes; his South latitude from the Ecliptick is two degrees 49 minutes; and more then this he hath not." },
    { heading: "Houses", page: 57, text: "In the Zodiack he hath two of the twelve Signs for his Houses, viz. Capricorne his Night-house, Aquarius his Day-house; he is Exaltated in Libra, he receives his Fall in Aries; he rejoyceth in the Signe Aquarius." },
    { heading: "Triplicity", page: 57, text: "He governeth the Aiery Triplicity by day, which is composed of these Signes, Gemini, Libra, Aquarius." },
    TERMS_FACE(57, "The chapter prints the degrees of each sign that are his terms (p. 57) and his face or decanate (p. 58); they follow Lilly's own table of essential dignities (p. 104), shown in the dignity tables on the Dignities page (/dignities); the chapter's degree lists are not repeated here. Lilly adds: \"The meaning whereof is, that if Saturn in any Question be in any of these degrees wherein he hath a Terme, he cannot be said to be peregrine, or void of essentiall dignities; or if he be in any of those degrees alotted him for his Face or Decanate, he cannot then be said to be peregrine: understand this in all the other Planets.\""),
    { heading: "Nature", page: 58, text: "He is a Diurnall Planet, Cold and Dry (being farre removed from the heat of the Sun) and moyst Vapours, Melancholick, Earthly, Masculine, the greater Infortune, author of Solitarinesse, Malevolent, &c." },
    { heading: "Manners and actions when well dignified", page: 58, text: "Then he is profound in Imagination, in his Acts severe, in words reserved, in speaking and giving very spare, in labour patient, in arguing or disputing grave, in obtaining the goods of this life studious and solicitous, in all manner of actions austere." },
    { heading: "When ill", page: 58, text: "Then he is envious, covetous, jealous and mistrustfull, timorous, sordid, outwardly dissembling, sluggish, suspitious, stubborne, a contemner of women, a close lyar, malicious, murmuring, never contented, ever repining." },
    { heading: "Corporature", page: 58, text: "Most part his Body more cold and dry, of a middle stature; his Complexion pale, swartish or muddy, his Eyes little and black, looking downward, a broad Forehead, black or sad Haire, and it hard or rugged, great Eares; hanging, lowring Eye-browes, thick Lips and Nose, a rare or thin Beard, a lumpish, unpleasant Countenance, either holding his Head forward or stooping, his Shoulders broad and large, and many times crooked, his Belly somewhat short and lank, his Thighs spare, leane and not long; his Knees and Feet indecent, many times shoveling or hitting one against another, &c. (pp. 58–59)" },
    { heading: "Oriental", page: 59, text: "You must observe, if Saturne be Orientall of the Sun, the stature is more short, but decent and well composed." },
    { heading: "Occidental", page: 59, text: "The man is more black and leane, and fewer Hairs; and againe, if he want latitude, the body is more leane, if he have great latitude, the body is more fat or fleshy; if the latitude be Meridionall or South, more fleshy, but quick in motion. If the latitude be North, hairy and much flesh. Saturn in his first station, a little fat. In his second station, fat, ill favoured Bodies, and weak; and this observe constantly in all the other Planets." },
    { heading: "Quality of men", page: 59, text: "In generall he signifieth Husbandmen, Clownes, Beggars, Day-labourers, Old men, Fathers, Grandfathers, Monks, Jesuits, Sectarists." },
    { heading: "Profession", page: 59, text: "Curriers, Night-farmers, Miners under ground, Tinners, Potters, Broom-men, Plummers, Brick-makers, Malsters, Chimney-sweepers, Sextons of Churches, Bearers of dead corps, Scavengers, Hostlers, Colliers, Carters, Gardiners, Ditchers, Chandlers, Diers of black Cloth, an Herdsman, Shepheard or Cow-keeper." },
    { heading: "Sicknesses", page: 59, sickness: true, text: "All Impediments in the right Eare, Teeth, all quartan Agues proceeding of cold, dry and melancholly Distempers, Leprosies, Rheumes, Consumptions, black Jaundies, Palsies, Tremblings, vaine Feares, Fantasies, Dropsie, the Hand and Foot-gout, Apoplexies, Dog hunger, too much flux of the Hemoroids, Ruptures if in Scorpio or Leo, in any ill aspect with Venus." },
    { heading: "Savours", page: 59, sickness: true, text: "Sower, Bitter, Sharp, in mans body he principally ruleth the Spleen." },
    { heading: "Hearbs", page: 59, text: "He governeth Bearsfoot, Starwort, Woolf-bane, Hemlock, Ferne, Hellebor the white and black, Henbane, Ceterach or Finger-ferne, Clotbur or Burdock, Parsnip, Dragon, Pulse, Vervine, Mandrake, Poppy, Mosse, Nightshade, Bythwind, Angelica, Sage, Box, Tutsan, Orage or golden Hearb, Spinach, Shepheards Purse, Cummin, Horstaile, Fumitory." },
    { heading: "Plants and Trees", page: 59, text: "Tamarisk, Savine, Sene, Capers, Rue or Hearbgrace, Polipody, Willow or Sallow Tree, Yew-tree, Cypresse-tree, Hemp, Pine-tree." },
    { heading: "Beasts, &c.", page: 60, text: "The Asse, Cat, Hare, Mouse, Mole, Elephant, Beare, Dog, Wolfe, Basilisk, Crocodile, Scorpion, Toad, Serpent, Adder, Hog, all manner of creeping Creatures breeding of putrifaction, either in the Earth, Water or Ruines of Houses." },
    { heading: "Fishes", page: 60, text: "The Eele, Tortoise, Shel-fishes." },
    { heading: "Birds, &c.", page: 60, text: "The Bat or Blude-black, Crow, Lapwing, Owle, Gnat, Crane, Peacock, Grashopper, Thrush, Blackbird, Ostritch, Cuckoe." },
    { heading: "Places", page: 60, text: "He delights in Deserts, Woods, obscure Vallies, Caves, Dens, Holes, Mountaines, or where men have been buried, Church-yards, &c. Ruinous Buildings, Cole-mines, Sinks, Dirty or Stinking Muddy Places, Wells and Houses of Offices, &c." },
    { heading: "Minerals", page: 60, text: "He ruleth over Lead, the Load-stone, the Drosse of all Mettals, as also, the Dust and Rubbidge of every thing." },
    { heading: "Stones", page: 60, text: "Saphire, Lapis Lazuli, all black, ugly Country Stones not polishable, and of a sad, ashy or black colour." },
    { heading: "Weather", page: 60, text: "He causeth Cloudy, Darke, obscure Ayre, cold and hurtfull, thick, black and condense Clouds: but of this more particularly in a Treatise by it selfe." },
    { heading: "Winds", page: 60, historical: true, text: "He delighteth in the East quarter of Heaven, and causeth Easterne Winds, at the time of gathering any Plant belonging to him, the Ancients did observe to turne their faces towards the East in his hour, and he, if possible, in an Angle, either in the Ascendant, or tenth, or eleventh house, the Moon applying by a trine or sextile to him." },
    { heading: "Orbe", page: 60, text: "His Orbe is nine degrees before and after; that is, his influence begins to work, when either he applies, or any Planet applies to him, and is within nine degrees of his aspect, and continueth in force untill he is seperate nine degrees from that aspect." },
    { heading: "Generation", page: 60, text: "In Generation he ruleth the first and eighth moneth after Conception." },
    { heading: "Yeers", page: 60, text: "The greatest yeers he signifies 465. His greater 57. His mean yeers 43 and a half. His least 30. The meaning whereof is this; Admit we frame a new Building, erect a Towne or City, or a Family, or principality is begun when Saturne is essentially and accidentally strong, the Astrologer may probably conjecture the Family, Principality, &c. may continue 465 yeers in honour &c. without any sensible alteration: Againe, if in ones Nativity Saturne is well dignified, is Lord of the Geniture, &c. then according to nature he may live 57 yeers, if he be meanly dignified, then the Native may live but 43; if he be Lord of the Nativity, and yet weak, the child may live 30 yeers, hardly any more; for the nature of Saturne is cold and dry, and those qualities are destructive to man, &c. (pp. 60–61)" },
    { heading: "Age", page: 61, text: "As to Age, he relates to decreped old men, Fathers, Grandfathers, the like in Plants, Trees, and all living Creatures." },
    { heading: "Countries", page: 61, text: "Late Authors say he ruleth over Bavaria, Saxony, Stiria, Romandiola, Ravenna, Constantia, Ingoldstad." },
    { heading: "Angel", page: 61, text: "Is Cassiel, alias Captiel." },
    { heading: "Friends and enemies", page: 61, text: "His Friends are Jupiter, Sun and Mercury, his enemies Mars and Venus." },
    { heading: "Day of the week", page: 61, text: "We call Saturday his day, for then he begins to rule at Sun rise, and ruleth the first hour and eighth of that day." },
  ],
};

const JUPITER: PlanetCatalog = {
  key: "jupiter",
  name: "Jupiter",
  alternateName: ["Zeus", "Phaeton"],
  chapter: "Chap. IX. Of the Planet Jupiter, and his signification",
  pages: "pp. 61–65",
  day: "Thursday",
  friends: ["saturn", "sun", "venus", "mercury", "moon"],
  enemies: ["mars"],
  occupations: [
    "Judges", "Senators", "Councellours", "Ecclesiasticall men", "Bishops", "Priests", "Ministers",
    "Cardinals", "Chancellours", "Doctors of the Civill Law", "Schollers and Students in an University or Colledge",
    "Lawyers", "Clothiers", "Wollen-Drapers",
  ],
  places: [
    { name: "Hungaria", type: "Country" },
    { name: "Spaine", type: "Country" },
    { name: "Cullen", type: "City" },
  ],
  entries: [
    { heading: "Names", page: 61, text: "Jupiter is placed next to Saturne (amongst the Ancients) you shall sometimes finde him called Zeus, or Phaeton: He is the greatest in appearance to our eyes of all the Planets (the Sun, Moon and Venus excepted)." },
    { heading: "Colour", page: 61, text: "In his Colour he is bright, cleer, and of an Azure colour." },
    { heading: "Motion", page: 61, text: "In his Motion he exceeds Saturne, finishing his course through the twelve Signes in twelve yeeres: his midle motion is 4 min. 59 seconds: his Diurnall motion is 8, 10, 12, or 14 min. hardly any more. He is Retrograde about 120 dayes, is five dayes in his first station before retrogradation, and four dayes stationary before Direction (p. 62)." },
    { heading: "Latitude", page: 61, text: "His greatest North latitude is 1° 38′. His greatest South latitude is 1° 40′." },
    { heading: "Houses", page: 61, text: "He hath two of the twelve Signs of the Zodiack for his houses, viz. Sagittarius his Day-house, and Pisces his Night-house; He receives Detriment in Gemini and Virgo: He is Exalted in Cancer, hath his Fall in Capricorn (pp. 61–62)." },
    { heading: "Triplicity", page: 62, text: "He ruleth the Fiery Triplicity by night, viz. Aries, Leo, Sagittarius." },
    TERMS_FACE(62),
    { heading: "Nature", page: 62, text: "He is a Diurnall, Masculine Planet, Temperately Hot and Moyst, Aiery, Sanguine, the greater Fortune, author of Temperance, Modesty, Sobriety, Justice." },
    { heading: "Manners and actions when well placed", page: 62, text: "Then is he Magnanimous, Faithfull, Bashfull, Aspiring in an honourable way at high matters, in all his actions a Lover of faire Dealing, desiring to benefit all men, doing Glorious things, Honourable and Religious, of sweet and affable Conversation, wonderfully indulgent to his Wife and Children, reverencing Aged men, a great Reliever of the Poore, full of Charity and Godlinesse, Liberall, hating all Sordid actions, Just, Wise, Prudent, Thankfull, Vertuous: so that when you find Jupiter the Significator of any man in a Question, or Lord of his Ascendant in a Nativity, and well dignified, you may judge him qualified as abovesaid (pp. 62–63)." },
    { heading: "When ill", page: 63, text: "When Jupiter is unfortunate, then he wastes his Patrimony, suffers every one to cozen him, is Hypocritically Religious, Tenacious, and stiffe in maintaining false Tenents in Religion; he is Ignorant, Carelesse, nothing Delightfull in the love of his Friends; of a grosse, dull Capacity, Schismaticall, abasing himselfe in all Companies, crooching and stooping where no necessity is." },
    { heading: "Corporature", page: 63, text: "He signifies an upright, straight and tall Stature; browne, ruddy and lovely Complexion; of an ovall or long Visage, and it full or fleshy; high Forehead; large gray Eyes; his Haire soft, and a kind of aburne browne; much Beard; a large, deep Belly: strong proportioned Thighs and Legs; his Feet long, being the most indecent parts of his whole Body; in his Speech he is sober, and of grave Discourse." },
    { heading: "Oriental", page: 63, text: "The Skin more cleer, his Complexion Honey-colour, or betwixt a white and red, sanguine, ruddy Colour; great Eyes, the Body more fleshy, usually some Mole or Scarre in the right Foot." },
    { heading: "Occidental", page: 63, text: "A pure and lovely Complexion, the Stature more short, the Haire a light Browne, or near a dark Flaxen; smooth, bald about the Temple or Forehead." },
    { heading: "Men and their quality in generall", page: 63, text: "He signifies Judges, Senators, Councellours, Ecclesiasticall men, Bishops, Priests, Ministers, Cardinals, Chancellours, Doctors of the Civill Law, young Schollers and Students in an University or Colledge, Lawyers, Clothiers, Wollen-Drapers." },
    { heading: "Diseases", page: 63, sickness: true, text: "Plurisies, all Infirmities in the Liver, left Eare, Apoplexies, Inflamation of the Lungs, Palpitation and Trembling of the Heart, Cramps, paine in the Back-bone, all Diseases lying in the Vaines or Ribs, and proceeding from corruption of Blood, Squinzies, Windinesse, all Putrifaction in the Blood, or Feavers proceeding from too great abundance thereof." },
    { heading: "Savours", page: 63, text: "He governeth the Sweet or well-sented Odours, or that Odour which in smell is no way extream or offensive." },
    { heading: "Colours", page: 63, text: "Sea-green or Blew, Purple, Ash-colour, a mixt Yellow and Green." },
    { heading: "Hearbs and Drugs", page: 64, text: "Cloves and Clove-Gilly-flowers, Mace, Nutmeg, Sugar, the Straw-bury, the herb Balsam, Bettony, Centory, Flax, Ars-smart, Fumitory, Lung-wort, Pimpernell, Walwort, Organy or Wild Majorane, Rubarb, Self-heale, Borage, Buglosse, Wheat, Willow-hearb, Thorough-Leafe, Violets, Laskwort, Liverwort, Bazil, Pomegranets, Pyony, Liquorish, Mint, Mastix, the Dazy, Feverfew, Saffron." },
    { heading: "Plants, Trees", page: 64, text: "Cherry-tree, Birch-tree, Mulbury-tree, Corall-tree, the Oake, Barburies, Olive, Goosburies, Almond-tree, the Ivy, Manna, Mace, the Vine, the Fig-tree, the Ash, the Pear-tree, the Hazle, the Beech-tree, the Pyne, Raysons." },
    { heading: "Beasts", page: 64, text: "The Sheep, the Hart or Stag, the Doe, the Oxe, Elephant, Dragon, Tygar, Unicorne, those Beasts which are Mild and Gentle, and yet of great benefit to Mankind, are appropriate to him." },
    { heading: "Birds", page: 64, text: "The Stork, the Snipe, the Lark, the Eagle, the Stock-dove, the Partridge, Bees, Pheasant, Peacock, the Hen." },
    { heading: "Fishes", page: 64, text: "The Dolphin, the Whale, Serpent, Sheath-fish or River-Whale." },
    { heading: "Places", page: 64, text: "He delighteth in or neer Altars of Churches, in publick Conventions, Synods, Convocations, in Places neat, sweet, in Wardrobes, Courts of Justice, Oratories." },
    { heading: "Mineral", page: 64, text: "Tyn." },
    { heading: "Precious Stones", page: 64, text: "Amethist, the Saphire, the Smaragd or Emrald, Hyacinth, Topaz, Chrystall, Bezoar, Marble, and that which in England we call the Free-stone." },
    { heading: "Weather", page: 64, text: "He usually produceth serenity, pleasant and healthful North Winds, and by his gentle Beams allayes the ill weather of any former Malignant Planet." },
    { heading: "Winds", page: 64, text: "He governeth the North Wind, that part which tendeth to the East." },
    { heading: "Orbe", page: 64, text: "His Radiation or Orbe, is nine degrees before and after any of his aspects." },
    { heading: "Generation", page: 64, sickness: true, text: "He governeth the second and tenth Moneth; his proper seat in man is the Liver; and in the Elements he ruleth the Ayre." },
    { heading: "Yeers", page: 64, text: "His greatest yeers are 428. his greater 79. his meane 45. least 12." },
    { heading: "Age", page: 64, text: "Men of middle age, or of a full Judgment and Discretion." },
    { heading: "Climate", page: 65, text: "He governeth the second Climate." },
    { heading: "Countries", page: 65, text: "Babylon, Persia, Hungaria, Spaine, Cullen." },
    { heading: "Number", page: 65, text: "The number of three is attributed to him." },
    { heading: "Angel", page: 65, text: "Zadkiel." },
    { heading: "Day of the week", page: 65, text: "Thursday, and rules the first hour after Sun rise, and the eighth; the length of the Planetary hour you must know by the rising of the Sun, and a Table hereafter following." },
    { heading: "Friends", page: 65, historical: true, text: "All the Planets except Mars are friends to Jupiter. In gathering any Hearb appropriated to Jupiter, see that he be very powerfull either in Essentiall or Accidentall Dignities, and the Moon in some manner in good aspect with him, and if possible, let her be in some of his Dignities, &c." },
  ],
};

const MARS: PlanetCatalog = {
  key: "mars",
  name: "Mars",
  alternateName: ["Mavors", "Aris", "Pyrois", "Gradivus"],
  chapter: "Chap. X. Of the Planet Mars, and his severall significations",
  pages: "pp. 65–68",
  day: "Tuesday",
  friends: ["venus"],
  enemies: ["saturn", "jupiter", "sun", "mercury", "moon"],
  occupations: [
    "Generals of Armies", "Colonels", "Captaines", "Souldiers", "Physitians", "Apothecaries", "Chirurgions",
    "Alchimists", "Gunners", "Butchers", "Marshals", "Sergeants", "Bailiffs", "Hang-men", "Smiths", "Bakers",
    "Armourers", "Watch-makers", "Botchers", "Tailors", "Cutlers of Swords and Knives", "Barbers", "Dyers",
    "Cooks", "Carpenters", "Bear-wards", "Tanners", "Curriers",
  ],
  places: [{ name: "Ferraria", type: "City" }],
  entries: [
    { heading: "Names", page: 65, text: "Mars doth in order succeed Jupiter, whom the Ancients sometimes called Mavors, Aris, Pyrois, Gradivus; he is lesse in body then Jupiter or Venus." },
    { heading: "Colour in the Element", page: 65, text: "He appeareth to our sight of a shining, fiery, sparkling colour." },
    { heading: "Motion", page: 65, text: "He finisheth his course in the Zodiack in one yeer 321 dayes, or thereabouts. His mean motion is 31 degr. 27 min. His diurnall motion is sometimes 32, 34, 36, 38, 40, 42, 44 min. a day, seldome more. He is retrograde 80 dayes; stationary before he be retrograde, two or three dayes, &c. He is stationary before direction two dayes, after, but one day." },
    { heading: "Latitude", page: 65, text: "His greatest latitude North is 4° 31′. his South is 6 degr. and 47." },
    { heading: "Houses", page: 65, text: "He hath Aries for his Day-house, and Scorpio for his Night-house; he is exalted in 28 degr. of Capricorn, and is depressed in 28 Cancer, he receiveth detriment in Libra and Taurus." },
    { heading: "Triplicity", page: 65, text: "He governeth wholly the Watry Triplicity, viz. Cancer, Scorpio, Pisces." },
    TERMS_FACE(66, "In the whole twelve Signs, Ptolomy assigneth him degrees for his Termes, and degrees for his Face (pp. 65–66); they follow Lilly's own table of essential dignities (p. 104), shown in the dignity tables on the Dignities page (/dignities); the chapter's degree lists are not repeated here."),
    { heading: "Nature", page: 66, text: "He is a Masculine, Nocturnall Planet, in nature hot and dry, cholerick and fiery, the lesser Infortune, author of Quarrels, Strifes, Contentions." },
    { heading: "Manners when well dignified", page: 66, text: "In feats of Warre and Courage invincible, scorning any should exceed him, subject to no Reason; Bold, Confident, Immoveable, Contentious, challenging all Honour to themselves, Valiant, lovers of Warre and things pertaining thereunto, hazarding himselfe to all Perils, willingly will obey no body, or submit to any; a large Reporter of his owne Acts, one that slights all things in comparison of Victory, and yet of prudent behaviour in his owne affaires." },
    { heading: "When ill placed", page: 66, text: "Then he is a Pratler without modesty or honesty, a lover of Slaughter and Quarrels, Murder, Theevery, a promoter of Sedition, Frayes and Commotions, an Highway-Theefe, as wavering as the Wind, a Traytor, of turbulent Spirit, Perjured, Obscene, Rash, Inhumane, neither fearing God or caring for man, Unthankfull, Trecherous, Oppressors, Ravenous, Cheaters, Furious, Violent." },
    { heading: "Corporature", page: 67, text: "Generally Martialists have this forme; they are but of middle Stature, their Bodies strong, and their Bones big, rather leane then fat; their Complexion of a brown, ruddy colour, or of an high colour, their Visage round, their Haire red or sandy flaxen, and many times crisping or curling, sharp hazle Eyes, and they piercing, a bold confident countenance, and the man active and fearlesse." },
    { heading: "Oriental", page: 67, text: "When Mars is Orientall, he signifies Valiant men, some white mixed with their rednesse, a decent talnesse of Body, hairy of his Body." },
    { heading: "Occidental", page: 67, text: "Very ruddy Complexion'd, but mean in Stature, little Head, a smooth Body, and not hairy; yellow Hair, stiffe, the naturall humours generally more dry." },
    { heading: "Qualities of men and profession", page: 67, text: "Princes Ruling by Tyranny and Oppression, or Tyrants, Usurpers, new Conquerours. Generals of Armies, Colonels, Captaines, or any Souldiers having command in Armies, all manner of Souldiers, Physitians, Apothecaries, Chirurgions, Alchimists, Gunners, Butchers, Marshals, Sergeants, Bailiffs, Hang-men, Theeves, Smiths, Bakers, Armourers, Watch-makers, Botchers, Tailors, Cutlers of Swords and Knives, Barbers, Dyers, Cooks, Carpenters, Gamesters, Bear-wards, Tanners, Curriers." },
    { heading: "Diseases", page: 67, sickness: true, text: "The Gall, the left Eare, tertian Feavers, pestilent burning Feavers, Megrams in the Head, Carbunckles, the Plague and all Plague-sores, Burnings, Ring-wormes, Blisters, Phrensies, mad sudden distempers in the Head, Yellow-jaundies, Bloody-flux, Fistulaes, all Wounds and Diseases in mens Genitories, the Stone both in the Reins and Bladder, Scars or smal Pocks in the Face, all hurts by Iron, the Shingles, and such other Diseases as arise by abundance of too much Choller, Anger or Passion." },
    { heading: "Colour and Savours", page: 67, text: "He delighteth in Red colour, or Yellow, fiery and shining like Saffron; and in those Savours which are bitter, sharp and burn the Tongue; of Humours, Choller." },
    { heading: "Hearbs", page: 67, text: "The Hearbs which we attribute to Mars are such as come neare to a rednesse, whose leaves are pointed and sharp, whose taste is costick and burning, love to grow on dry places, are corrosive and penetrating the Flesh and Bones with a most subtill heat: They are as followeth. The Nettle, all manner of Thistles, Rest-harrow or Cammock, Devils-milk or Petty spurge, the white and red Brambles, the white called vulgarly by the Hearbalists Ramme, Lingwort, Onions, Scammony, Garlick, Mustard-seed, Pepper, Ginger, Leeks, Ditander, Hore-hound, Hemlock, red Sanders, Tamarindes, all Hearbs attracting or drawing choller by Sympathy, Raddish, Castoreum, Arsmart, Assarum, Carduus Benedictus, Cantharides (pp. 67–68)." },
    { heading: "Trees", page: 68, text: "All Trees which are prickly, as the Thorne, Chesnut." },
    { heading: "Beasts and Animals", page: 68, text: "Panther, Tygar, Mastiffe, Vulture, Fox; of living creatures, those that are Warlike, Ravenous and Bold, the Castor, Horse, Mule, Ostritch, the Goat, the Wolfe, the Leopard, the wild Asse, the Gnats, Flyes, Lapwing, Cockatrice, the Griffon, Beare." },
    { heading: "Fishes", page: 68, text: "The Pike, the Shark, the Barbell, the Fork-fish, all stinking Wormes, Scorpions." },
    { heading: "Birds", page: 68, text: "The Hawke, the Vultur, the Kite or Glead, (all ravenous Fowle) the Raven, Cormorant, the Owle, (some say the Eagle) the Crow, the Pye." },
    { heading: "Places", page: 68, text: "Smiths Shops, Furnaces, Slaughter-houses, places where Bricks or Charcoales are burned, or have been burned, Chimneys, Forges." },
    { heading: "Minerals", page: 68, text: "Iron, Antimony, Arsenick, Brimston, Ocre." },
    { heading: "Stones", page: 68, text: "Adamant, Loadstone, Blood-stone, Jasper, the many coloured Amatheist, the Touch-stone, red Lead or Vermilion." },
    { heading: "Weather", page: 68, text: "Red Clouds, Thunder, Lightning, Fiery impressions, and pestilent Aires, which usually appeare after a long time of drinesse and faire Weather, by improper and unwholesome Mysts." },
    { heading: "Winds", page: 68, text: "He stirreth up the Westerne Windes." },
    { heading: "Orbe", page: 68, text: "His Orbe is onely seven degrees before and after any of his aspects." },
    { heading: "Yeers", page: 68, text: "In man he governeth the flourishing time of Youth, and from 41 to 56; his greatest yeers are 264, greater 66, meane 40, lesse 15." },
    { heading: "Countries", page: 68, text: "Saromatia, Lumbardy, Batavia, Ferraria, Gothland, and the third Climate." },
    { heading: "Day of the week", page: 68, text: "He governeth Tuesday, and therein the first hour and eighth from Sun rise, and in Conception the third moneth." },
    { heading: "Angel", page: 68, text: "Samael." },
    { heading: "Friends and enemies", page: 68, text: "His Friends are onely Venus; Enemies all the other Planets." },
  ],
};

const SUN: PlanetCatalog = {
  key: "sun",
  name: "Sun",
  alternateName: ["Sol", "Titan", "Ilios", "Phebus", "Apollo", "Pean", "Osyris", "Diespiter"],
  chapter: "Chap. XI. Of the Sun, and his generall and particular significations",
  pages: "pp. 69–72",
  day: "Sunday",
  friends: ["jupiter", "mars", "venus", "mercury", "moon"],
  enemies: ["saturn"],
  occupations: [
    "Kings", "Princes", "Emperours", "Dukes", "Marquesses", "Earles", "Barons", "Lieutenants",
    "Deputy-Lieutenants of Counties", "Magistrates", "Gentlemen", "Courtiers", "Justices of Peace", "Majors",
    "High-Sheriffs", "High-Constables", "Huntsmen", "Stewards of Noble-mens houses", "Constables",
    "Goldsmiths", "Brasiers", "Pewterers", "Copper-smiths", "Minters of Money",
  ],
  places: [{ name: "Italy", type: "Country" }],
  entries: [
    { heading: "Names", page: 69, text: "The Sun is placed in the middle of all the Planets, and is called amongst the Ancients, both Poets and Historians, Sol, Titan, Ilios, Phebus, Apollo, Pean, Osyris, Diespiter." },
    { heading: "Colour", page: 69, text: "It's needlesse to mention his Colour, being so continually visible to all mortall men." },
    { heading: "Motion", page: 69, text: "He passeth through all the twelve Signes of the Zodiack in one yeer, or in 365 dayes and certaine hours: His meane motion is 59′ 8″; yet his diurnall motion is sometimes 57′ 16 seconds, sometimes more, never exceeding [figures blotted in the scan] minutes and [blotted] seconds. The Sun is alwayes direct, and never can be said to be Retrograde; it's true, he moveth more slowly at one time then another." },
    { heading: "Latitude", page: 69, text: "He alwayes moves in the Ecliptick, and is ever voyd of latitude, so that it is very improper in any Astrologian to speak of the Sun his latitude." },
    { heading: "House", page: 69, text: "He hath onely the Signe of Leo for his House, and Aquarius for his Detriment. He is Exalted in the 19 degree of Aries, and receives his Fall in 19 Libra." },
    { heading: "Triplicity", page: 69, text: "The Sunne governeth the fiery Triplicity, viz. Aries, Leo, Sagittarius by day." },
    { heading: "Terms", page: 69, text: "He hath no degrees of the twelve Signs admitted him for his Termes, though some affirme, if he be in the six Northerne Signes, viz. Aries, Taurus, Gemini, Cancer, Leo, Virgo, he shall be said to be in his Termes, but because there is no reason for it, I leave it as Idle." },
    { heading: "Face", page: 69, text: "In the twelve Signes he hath degrees for his Decanate or Faces (printed in the chapter); they follow Lilly's own table of essential dignities (p. 104), shown in the dignity tables on the Dignities page (/dignities); the chapter's degree lists are not repeated here." },
    { heading: "Nature", page: 70, text: "He is naturally Hot, Dry, but more temperate then Mars; is a Masculine, Diurnall Planet, Equivalent, if well dignified to a Fortune." },
    { heading: "Manners when well dignified", page: 70, text: "Very faithfull, keeping their Promises with all punctuality, a kind of itching desire to Rule and Sway where he comes: Prudent, and of incomparable Judgment; of great Majesty and Statelinesse, Industrious to acquire Honour and a large Patrimony, yet as willingly departing therewith againe; the Solar man usually speaks with gravity, but not many words, and those with great confidence and command of his owne affection; full of Thought, Secret, Trusty, speaks deliberately, and notwithstanding his great Heart, yet is he Affable, Tractable, and very humane to all people, one loving Sumptuousnesse and Magnificence, and whatsoever is honorable; no sordid thoughts can enter his heart, &c." },
    { heading: "When ill dignified", page: 70, text: "Then the Solar man is Arrogant and Proud, disdaining all men, cracking of his Pedegree, he is Pur-blind in Sight and Judgment, restlesse, troublesome, domineering, a meer vapour, expensive, foolish, endued with no gravity in words, or sobernesse in Actions, a Spend-thrift, wasting his Patrimony, and hanging on other mens charity, yet thinks all men are bound to him, because a Gentleman borne." },
    { heading: "Corporature", page: 70, text: "Usually the Sun presents a man of a good, large and strong Corporature, a yellow, saffron Complexion, a round, large Forehead: goggle Eyes or large, sharp and piercing; a Body strong and well composed, not so beautifull as lovely, full of heat, their haire yellowish, and therefore quickly bald, much Haire on their Beard, and usually an high ruddy Complexion, their bodies fleshy, in conditions they are very bountifull, honest, sincere, wel-minded, of great and large Heart, High-minded, of healthfull Constitution, very humane, yet sufficiently Spirited, not Loquacious." },
    { heading: "Oriental and occidental", page: 70, text: "In the Sun, we can onely say he is Orientall in the Figure, or in the Orientall quarter of the Figure, or Occidentall, &c. all other Planets are either Oriental when they rise, or appeare before him in the morning. Occidentall, when they are seen above the Earth after he is set." },
    { heading: "Quality of men and their professions", page: 71, text: "He signifieth Kings, Princes, Emperours, &c. Dukes, Marquesses, Earles, Barons, Lieutenants, Deputy-Lieutenants of Counties, Magistrates, Gentlemen in generall, Courtiers, desirers of Honour and preferment, Justices of Peace, Majors, High-Sheriffs, High-Constables, great Huntsmen, Lieutenants, Deputy-Lieutenants, Stewards of Noble-mens houses, the principall Magistrate of any City, Towne, Castle or Country-Village, yea, though a petty Constable, where no better, or greater Officer is; Goldsmiths, Brasiers, Pewterers, Copper-smiths, Minters of Money." },
    { heading: "Sicknesse", page: 71, sickness: true, text: "Pimples in the Face, Palpitation or Trembling, or any Diseases of the Braine or Heart, Timpanies, Infirmities of the Eyes, Cramps, sudden swoonings, Diseases of the Mouth, and stinking Breaths, Catars, rotten Feavers; principally in man he governeth the Heart, the Braine and right Eye, and vitall Spirit, in Women the left Eye." },
    { heading: "Colours and Savours", page: 71, text: "Of Colours he ruleth the Yellow, the colour of Gold, the Scarlet or the cleer Red, some say Purple: In Savours, he liketh well a mixture of Sower and Sweet together, or the Aromatical savour, being a little Bitter and Stiptical, but withall Confortative and a little sharp." },
    { heading: "Hearbs and Plants", page: 71, text: "Those Plants which are subject to the Sun doe smell pleasantly, are of good savour, their Flowers are yellow or reddish, are in growth of Majestical forme, they love open and Sunshine places, their principall Vertue is to strengthen the Heart, and comfort the Vitals; to cleer the Eye-sight, resist Poyson, or to dissolve any Witchery, or Malignant Planetary Influences; and they are Saffron, the Lawrell, the Pomecitron, the Vine, Enula Campana, Saint Johns-wort, Ambre, Musk, Ginger, Hearb-grace, Balme, Marigold, Rosemary, Rosa solis, Cinamon, Celendine, Eye-bright, Pyony, Barley, Cynqfoile, Spikenard, Lignum Aloes, Arsnick." },
    { heading: "Trees", page: 71, text: "Ash-tree, Palm, Lawrel-tree, the Myrrhe-tree, Frankinsence, the Cane-tree or plant, the Cedar, Heletropion, the Orange and Lemon-tree." },
    { heading: "Beasts", page: 71, text: "The Lyon, the Horse, the Ram, the Crocodile, the Bul, Goat, Night-wormes or Glow-wormes." },
    { heading: "Fishes", page: 71, text: "The Sea-Calf or Sea-Fox, the Crabfish, the Starfish." },
    { heading: "Birds", page: 72, text: "The Eagle, the Cock, the Phœnix, Nightingale, Pecock, the Swan, the Buzzard, the flye Cantharis, the Goshawke." },
    { heading: "Places", page: 72, text: "Houses, Courts of Princes, Pallaces, Theators, all magnificent Structures being clear and decent, Hals, Dining-Rooms." },
    { heading: "Minerals or Mettals", page: 72, text: "Amongst the Elements the Sun hath dominion of fire and cleere shining flames, over mettals he ruleth Gold." },
    { heading: "Stones", page: 72, text: "The Hyacinth, Chrisolite, Adamant, Carbuncle, the Etites stone found in Eagles nests, the Pantaure if such a stone be, the Ruby." },
    { heading: "Weather", page: 72, text: "He produceth weather according to the season; in the Spring gentle moysting Showers; in the Summer heat in extremity if with Mars: in Autum mists; in Winter small Raine." },
    { heading: "Winds", page: 72, text: "He loves the East part of the World; and that winde which proceeds from that quarter." },
    { heading: "Orbe", page: 72, text: "Is 15 degrees before any aspect; and so many after separation." },
    { heading: "Yeers", page: 72, text: "In age he ruleth youth, or when one is at the strongest; his greatest yeers are 1460. greater 120. mean 69. least 19." },
    { heading: "Countries", page: 72, text: "Italy, Sicilia, Bohemia; and the fourth Climate, Phenicia, Chaldea." },
    { heading: "Angel", page: 72, text: "Michael." },
    { heading: "Day of the week", page: 72, text: "He ruleth Sunday the first houre thereof, and the eight; and in numbers the first and fourth; and in conceptions the fourth moneth. His Friends are all the Planets except Saturn, who is his Enemy." },
  ],
};

const VENUS: PlanetCatalog = {
  key: "venus",
  name: "Venus",
  alternateName: ["Cytherea", "Aphrodite", "Phosphoros", "Vesperugo", "Erycina", "Hesperus", "Lucifer"],
  chapter: "Chap. XII. Of the Planet Venus and her severall significations and nature",
  pages: "pp. 72–76",
  day: "Friday",
  friends: [],
  enemies: [],
  occupations: [
    "Musitions", "Silk-men", "Mercers", "Linnen-Drapers", "Painters", "Jewellers", "Players", "Lapidaries",
    "Embroiderers", "Women-tailors", "Choristers", "Fidlers", "Pipers", "Ballad-singers", "Perfumers",
    "Semsters", "Picture-drawers", "Gravers", "Upholdsters", "Limners", "Glovers",
  ],
  places: [
    { name: "Austria", type: "Country" },
    { name: "Vienna", type: "City" },
    { name: "Cyprus", type: "Country" },
  ],
  entries: [
    { heading: "Name", page: 72, text: "After the Sunne succeedeth Venus; who is sometimes called Cytherea, Aphrodite, Phosphoros, Vesperugo, Erycina." },
    { heading: "Colour in the Element", page: 72, text: "She is of a bright shining colour, and is well known amongst the vulgar by the name of the evening Starre or Hesperus; and that is when she appeares after the Sunne is set: common people call her the morning Starre, and the learned Lucifer, when she is seen long before the rising of the Sunne." },
    { heading: "Motion", page: 72, text: "Her meane motion is 59 min. and 8 seconds: her diurnall motion is sometimes 62 min. a day, 64, 65, 66, or 70, 74, 76 minutes; but 82 min. shee never exceedeth (pp. 72–73). She is two dayes stationary before retrogradation, and so many before direction, and doth usually continue retrograde 42 dayes (p. 73)." },
    { heading: "Latitude", page: 73, text: "Her greatest North or South latitude is two degr. and two min. in February 1643. she had eight degr. and 36 min. for her North latitude." },
    { heading: "Houses", page: 73, text: "Shee hath Taurus and Libra for her houses, she is exalted in 27 Pisces, she receiveth detriment in Aries and Scorpio, and hath her fall in 27 Virgo." },
    { heading: "Triplicity", page: 73, text: "She governeth the Earthly Triplicity by day viz. Taurus, Virgo, Capricorn." },
    TERMS_FACE(73),
    { heading: "Element and nature", page: 73, text: "Shee is a Feminine Planet, temperately Cold and Moyst, Nocturnall, the lesser Fortune, author of Mirth and Jolity; the Elements, the Ayre and Water are Veneriall; in the Humours, Flegme with Blood, with the Spirit and Genitall seed." },
    { heading: "Manners and quality when well placed", page: 73, text: "Shee signifies a quiet man, not given to Law, Quarrel or Wrangling; not Vitious, Pleasant, Neat and Spruce, loving Mirth in his words and actions, cleanly in Apparel, rather Drinking much then Gluttonous, prone to Venery, oft entangled in Love-matters, Zealous in their affections, Musicall, delighting in Baths, and all honest merry Meetings, or Maskes and Stage-playes, easie of Beliefe, and not given to Labour, or take any Pains, a Company-keeper, Cheerful, nothing Mistrustful, a right vertuous Man or Woman, oft had in some Jealousie, yet no cause for it (pp. 73–74)." },
    { heading: "When ill", page: 74, text: "Then he is Riotous, Expensive, wholly given to Loosnesse and Lewd companies of Women, nothing regarding his Reputation, coveting unlawful Beds, Incestuous, an Adulterer, Fantastical, a meer Skip-jack, of no Faith, no Repute, no Credit; spending his Meanes in Ale-houses, Taverns, and amongst Scandalous, Loose people; a meer Lazy companion, nothing careful of the things of this Life, or any thing Religious; a meer Atheist and natural man." },
    { heading: "Corporature", page: 74, text: "A man of faire, but not tall Stature, his Complexion being white, tending to a little darknesse, which makes him more Lovely; very fair Lovely Eyes, and a little black; a round Face, and not large, faire Haire, smooth, and plenty of it, and it usually of a light browne colour, a lovely Mouth and cherry Lips, the Face pretty fleshy, a rolling wandring Eye, a Body very delightfull, lovely and exceeding well shaped, one desirous of Trimming and making himself neat and compleat both in Cloaths and Body, a love dimple in his Cheeks, a stedfast Eye, and full of amarous enticements." },
    { heading: "Oriental", page: 74, text: "When Orientall the Body inclines to talnesse, or a kind of upright straightnesse in Person, not corpulent or very tall, but neatly composed: A right Venerian person, is such as we say, is a pretty, compleat, handsome Man or Woman." },
    { heading: "Occidental", page: 74, text: "When she is Occidental, the Man is of more short stature, yet very decent and comely in Shape and Forme, well liked of all." },
    { heading: "Quality of men and professions", page: 74, text: "Musitions, Gamesters, Silk-men, Mercers, Linnen-Drapers, Painters, Jewellers, Players, Lapidaries, Embroiderers, Women-tailors, Wives, Mothers, Virgins, Choristers, Fidlers, Pipers, when joyned with the Moon Ballad-singers, Perfumers, Semsters, Picture-drawers, Gravers, Upholdsters, Limners, Glovers, all such as sell those Commodities which adorne Women, either in Body (as Cloaths) or in Face, (as Complexion-waters.) (pp. 74–75)" },
    { heading: "Sicknesse", page: 75, sickness: true, text: "Diseases by her signified, are principally in the Matrix and members of Generation; in the reines, belly, backe, navill and those parts; the Gonorrea or running of the Reines, French or Spanish Pox; any disease arising by inordinate lust, Priapisme, impotency in generation, Hernias, &c. the Diabetes or pissing disease." },
    { heading: "Savours and colours", page: 75, text: "In colours she signifieth White, or milky Skie-colour mixed with browne, or a little Greene. In Savours she delights in that which is pleasant and toothsome; usually in moyst and sweet, or what is very delectable; in smels what is unctious and Aromaticall, and incites to wantonnesse." },
    { heading: "Herbs and Plants", page: 75, text: "Myrtle alwayes greene; all hearbs which she governeth have a sweet savour, a pleasant smell, a white flower; of a gentle humour, whose leaves are smooth and not jagged. She governeth the Lilly white and yellow, and the Lilly of the valley, and of the water. The Satyrion or Cuckoe-pintle, Maidenhaire, Violet; the white and yellow Daffadil." },
    { heading: "Trees", page: 75, text: "Sweet Apples, the white Rose, the Fig, the white Sycamore, wilde Ash, Turpentine-tree, Olive, sweet Oringes, Mugwort, Ladies-mantle, Sanicle, Balme, Vervin, Walnuts, Almonds, Millet, Valerian, Thyme, Ambre, Ladanum, Civet or Musk, Coriander, French Wheat, Peaches, Apricocks, Plums, Raisons." },
    { heading: "Beasts", page: 75, text: "The Hart, the Panther, small cattle, Coney, the Calfe, the Goat." },
    { heading: "Birds", page: 75, text: "Stockdove, Wagtayle, the Sparrow, Hen, the Nightingale, the Thrush, Pellican, Partridge, Ficedula, a little Bird Feeding on Grapes; the Wren, Eagle, the Swan, the Swallow, the Owsel or Black-bird, the Pye." },
    { heading: "Fishes", page: 75, text: "The Dolphin." },
    { heading: "Places", page: 75, text: "Gardens, Fountaines, Bride-chambers, faire lodgings, Beds, Hangings, Dancing-Schooles, Wardrobes." },
    { heading: "Mettals and Minerals", page: 75, text: "Copper, especially the Corinthian and White; Brasse, all Latten ware." },
    { heading: "Stones", page: 75, text: "Cornelian, the Sky-colour'd Saphyre, white and red Coral, Margasite, Alablaster, Lapis lazuli, because it expels Melancholy, the Berill, Chrisolite." },
    { heading: "Winde and Weather", page: 76, text: "She governeth the South-winde being hot and moyst; in the temperance of the Ayre, she ruleth the Ætesiæ; she foretelleth Summer, Serenity or cleer weather; in Winter raine or snow." },
    { heading: "Orbe", page: 76, text: "Her Orbe is 7 before and after any aspect of hers." },
    { heading: "Yeers", page: 76, text: "Her greatest yeers are 151. her greater 82. her mean 45. her least 8. In Man she governeth Youth from 14. to 28." },
    { heading: "Countries", page: 76, text: "Arabia, Austria, Campania, Vienna, Polonia the greater, Turing, Parthia, Media, Cyprus, and the sixt climate." },
    { heading: "Angell", page: 76, text: "Her Angel is Anael." },
    { heading: "Day of the week", page: 76, text: "Her day of the weeke Friday, of which she rules the first and eight houre; and in conception the fift Mouth [as printed; read moneth]." },
  ],
};

const MERCURY: PlanetCatalog = {
  key: "mercury",
  name: "Mercury",
  alternateName: ["Hermes", "Stilbon", "Cyllenius", "Archas"],
  chapter: "Chap. XIII. Of Mercury, and his signification, nature and property",
  pages: "pp. 76–80",
  day: "Wednesday",
  friends: [],
  enemies: [],
  occupations: [
    "Philosophers", "Mathematicians", "Astrologians", "Merchants", "Secretaries", "Scriveners", "Diviners",
    "Sculptors", "Poets", "Orators", "Advocates", "School-masters", "Stationers", "Printers",
    "Exchangers of Money", "Atturneys", "Embassadours", "Commissioners", "Clerks", "Artificers", "Accomptants",
    "Solicitors", "Gramarians", "Taylors", "Carriers", "Messengers", "Foot-men", "Userers",
  ],
  places: [
    { name: "Grecia", type: "Country" },
    { name: "Ægypt", type: "Country" },
    { name: "Paris", type: "City" },
  ],
  entries: [
    { heading: "Name", page: 76, text: "It is called Hermes, Stilbon, Cyllenius, Archas." },
    { heading: "Colour", page: 76, text: "Mercury is the least of all the Planets, ever distant from the Sun above 27. degrees; by which reason he is seldome visible to our sight: He is of a duskie silver colour." },
    { heading: "Motion", page: 76, text: "His mean motion is 59 min. and 8 seconds; but he is sometimes so swift that he moveth one degree and 40 min. in a day, never more; so that you are not to marvaile if you finde him sometimes goe 66, 68, 70, 80, 86 or 100 in a day: he is Stationary one day, and retrograde 24 dayes." },
    { heading: "Latitude", page: 76, text: "His greatest South Latitude is 3 degr. 33 min. His greatest North Latit. is 3 deg. 33 min." },
    { heading: "House", page: 76, text: "He hath Gemini and Virgo for his Houses, and is exalted in the 15 of Virgo: he receives detriment in Sagittarius and Pisces, his fall is in Pisces." },
    { heading: "Triplicity", page: 76, text: "He ruleth the aery triplicity by night, viz. Gemini, Libra, Aquarius." },
    TERMS_FACE(77, "He hath degrees in every Signe for his Termes (pp. 76–77) and degrees for his Face or Decanate (p. 77); they follow Lilly's own table of essential dignities (p. 104), shown in the dignity tables on the Dignities page (/dignities); the chapter's degree lists are not repeated here."),
    { heading: "Nature", page: 77, text: "We may not call him either Masculine or Feminine, for he is either the one or other as joyned to any Planet; for if in conjunction with a Masculine Planet, he becomes Masculine; if with a Feminine, then Feminine, but of his owne nature he is cold and dry, and therefore Melancholly; with the good he is good, with the evill Planets ill; in the Elements the Water, amongst the humours, the mixt, he rules the animall spirit: he is author of subtilty, tricks and devices, perjury, &c." },
    { heading: "Manners when well placed", page: 77, text: "Being well dignified, he represents a man of a subtill and politick braine, intellect, and cogitation; an excellent disputant or Logician, arguing with learning and discretion, and using much eloquence in his speech, a searcher into all kinds of Mysteries, Learning, sharpe and witty, learning almost any thing without a Teacher; ambitious of being exquisite in every Science, desirous naturally of travell and seeing foraign parts, a man of an unwearied fancie, curious in the search of any occult knowledge; able by his owne Genius to produce wonders; given to Divination and the more secret knowledge; if he turne Merchant no man exceeds him in way of Trade or invention of new wayes whereby to obtain wealth." },
    { heading: "Manners when ill placed", page: 77, text: "A troublesome wit, a kinde of Phrenetick man, his tongue and Pen against every man, wholly bent to foole his estate and time in prating and trying nice conclusions to no purpose; a great lyar, boaster, pratler, busibody, false, a tale-carrier, given to wicked Arts, as Necromancy, and such like ungodly knowledges; easie of beleefe, an asse or very ideot, constant in no place or opinion, cheating and theeving every where; a newes-monger, pretending all manner of knowledge, but guilty of no true or solid learning; a trifler; a meere frantick fellow; if he prove a Divine, then a meer verball fellow, frothy, of no judgement, easily perverted, constant in nothing but idle words, and bragging (pp. 77–78)." },
    { heading: "Corporature", page: 78, text: "Vulgarly he denotes one of an high stature and straight thin spare body, an high forehead and somewhat narrow long face, long nose, fair eyes neither perfectly black or gray, thin lips and nose; little haire on the chin, but much on his head, and it a sad browne inclining to blacknesse; long armes, fingers and hands; his complexion like an Olive or Chesnut colour. You must more observe Mercury then all the Planets; for having any aspect to a Planet, he doth more usually partake of the influence of that Planet then any other doth: if with Saturn then heavy, with Jupiter more temperate, with Mars more rash, with the Sun more genteele, with Venus more jesting, with the Moon more shifter." },
    { heading: "Oriental", page: 78, text: "When he is Orientall, his complexion is honey colour, or like one well Sun-burnt; in the stature of his body not very high, but well joynted, small eyes, not much haire; in very truth, according to the height of body, very well composed, but still a defect in the complexion, viz. swarty brown, and in the tongue, viz. all for his owne ends." },
    { heading: "Occidental", page: 78, text: "When Occidentall, a tawny visage, lanke body, small slender limbs, hollow eyes, and sparkling and red or fiery; the whole frame of body inclining to drinesse." },
    { heading: "Quality of men and professions", page: 78, text: "He generally signifies all literated men, Philosophers, Mathematicians, Astrologians, Merchants, Secretaries, Scriveners, Diviners, Sculptors, Poets, Orators, Advocates, School-masters, Stationers, Printers, Exchangers of Money, Atturneys, Emperours Embassadours, Commissioners, Clerks, Artificers, generally Accomptants, Solicitors, sometimes Theeves, pratling muddy Ministers, busie Sectaries, and they unlearned; Gramarians, Taylors, Carriers, Messengers, Foot-men, Userers." },
    { heading: "Sicknesse", page: 78, sickness: true, text: "All Vertigoe's, Lethargies or giddinesse in the Head, Madnesse, either Lightnesse, or any Disease of the Braine; Ptisick; all stammering and imperfection in the Tongue; vaine and fond Imaginations, all defects in the Memory, Hoarcenesse, dry Coughs, too much abundance of Spettle, all snaffling and snuffling in the Head or Nose; the Hand and Feet Gout, Dumnesse, Tongue-evil, all evils in the Fancy and intellectuall parts (pp. 78–79)." },
    { heading: "Colours and Savours", page: 79, text: "Mixed and new colours, the Gray mixed with Sky-colour, such as is on the Neck of the Stock-dove, Linsie-woolsie colours, or consisting of many colours mixed in one: Of Savours an hodg-podge of all things together, so that none can give it any true name; yet usually such as doe quicken the Spirits, are subtill and penetrate, and in a manner insensible." },
    { heading: "Hearbs and Plants", page: 79, text: "Herbs attributed to Mercury are known by the various colour of the flower, and love sandy barren places, they bear their seed in husks or cods, they smell rarely or subtilly, and have principall relation to the tongue, braine, lungs or memory; they dispell winde, and comfort the Annimall spirits, and open obstructions. Beanes, three leaved-grasse, the Walnut and Walnut-tree; the Filbert-tree and Nut; the Elder-tree, Adders-tongue, Dragon-wort, Twopenny-grasse, Lungwort, Anniseeds, Cubebs, Marioran. What hearbs are used for the Muses and Divination, as Vervine, the Reed; of Drugs, Treacle, Hiera, Diambra." },
    { heading: "Beasts", page: 79, text: "The Hyæna, Ape, Fox, Squirrel, Weasel, the Spider, the Grayhound, the Hermophradite, being partaker of both sexes; all cunning creatures." },
    { heading: "Birds", page: 79, text: "The Lynnet, the Parrot, the Popinian, the Swallow, the Pye, the Beetle, Pismires, Locusts, Bees, Serpent, the Crane." },
    { heading: "Fishes", page: 79, text: "The Forke-fish, Mullet." },
    { heading: "Places", page: 79, text: "Tradesmens-shops, Markets, Fayres, Schooles, Common-Hals, Bowling-Allyes, Ordinaries, Tennis-Courts." },
    { heading: "Minerals", page: 79, text: "Quicksilver." },
    { heading: "Stones", page: 79, text: "The Milstone, Marchasite or fire-stone, the Achates, Topaz, Vitriol, all stones of divers colours." },
    { heading: "Winds and Weather", page: 79, text: "He delights in Windy, Stormy and Violent, Boistrous Weather, and stirs up that Wind which the Planet signifies to which he applyes; sometimes Raine, at other times Haile, Lightning, Thunder and Tempests, in hot Countries Earthquakes, but this must be observed really from the Signe and Season of the yeere (pp. 79–80)." },
    { heading: "Orbe", page: 80, text: "His Orbe is seven degrees before and after any aspect." },
    { heading: "Yeers", page: 80, text: "His greatest yeers are 450; his greater 76; his meane 48; his little or least 20: in Conceptions he governeth the sixth moneth." },
    { heading: "Countries", page: 80, text: "He hath Grecia, Flanders, Ægypt, Paris." },
    { heading: "Angel", page: 80, text: "His Angel is named Raphael." },
    { heading: "Day of the week", page: 80, text: "He governeth Wednesday, the first hour thereof, and the eighth." },
  ],
};

const MOON: PlanetCatalog = {
  key: "moon",
  name: "Moon",
  alternateName: ["Lucina", "Cynthia", "Diana", "Phœbe", "Latona", "Noctiluca", "Proserpina"],
  chapter: "Chap. XIIII. Of the Moon her properties and significations",
  pages: "pp. 80–83",
  day: "Monday",
  friends: [],
  enemies: ["saturn", "mars"],
  occupations: [
    "Queens", "Countesses", "Ladies", "Sailors", "Fishermen", "Fish-mongers", "Brewers", "Tapsters",
    "Vintners", "Letter-carriers", "Coach-men", "Huntsmen", "Messengers", "the Popes Legats", "Marriners",
    "Millers", "Ale-wives", "Malsters", "Oister-wives", "Fisher-women", "Chare-women", "Tripe-women",
    "Midwives", "Nurses", "Hackney-men", "Water-men", "Water-bearers",
  ],
  places: [
    { name: "Denmarke", type: "Country" },
    { name: "Norimberge", type: "City" },
  ],
  entries: [
    { heading: "Name", page: 80, text: "The Moon we find called by the Ancients, Lucina, Cynthia, Diana, Phœbe, Latona, Noctiluca, Proserpina; she is the neerest to the Earth of all the Planets; her colour in the Element is vulgarly knowne." },
    { heading: "Motion", page: 80, text: "She finisheth her course through the whole twelve Signs in 27 days, 7 hours and 43 min. or thereabouts; her meane motion is 13 degr. 10 min. and 36 seconds, but she moveth sometimes lesse and sometimes more, never exceeding 15 degr. and two min. in 24 hours space." },
    { heading: "Latitude", page: 80, text: "Her greatest North latitude is 5 degr. and 17 min. or thereabouts. Her greatest South latitude is 5 degr. and 12 min. She is never Retrograde, but alwayes direct; when she is slow in motion, and goeth lesse in 24 hours then 13 degr. and 10 min. she is then equivalent to a Retrograde Planet." },
    { heading: "House", page: 80, text: "She hath the Signe Cancer for her house, and Capricorn for her detriment; she is exalted in 3 Taurus, and hath her fall in 3 grad. Scorpio." },
    { heading: "Triplicity", page: 80, text: "She governeth the Earthly Triplicity by night, viz. Taurus, Virgo, Capricorn: The Sun and she hath no Termes assigned them." },
    { heading: "Face", page: 80, text: "In the twelve Signes she hath degrees for her Decanate or Face (pp. 80–81); they follow Lilly's own table of essential dignities (p. 104), shown in the dignity tables on the Dignities page (/dignities); the chapter's degree lists are not repeated here." },
    { heading: "Nature", page: 81, text: "She is a Feminine, Nocturnall Planet, Cold, Moyst and Flegmatique." },
    { heading: "Manners or actions when well placed or dignified", page: 81, text: "She signifieth one of composed Manners, a soft, tender creature, a Lover of all honest and ingenuous Sciences, a Searcher of, and Delighter in Novelties, naturally propense to flit and shift his Habitation, unstedfast, wholly caring for the present Times, Timorous, Prodigal, and easily Frighted, however loving Peace, and to live free from the cares of this Life; if a Mechanick, the man learnes many Occupations, and frequently will be tampering with many wayes to trade in." },
    { heading: "When ill", page: 81, text: "A meer Vagabond, idle Person, hating Labour, a Drunkard, a Sot, one of no Spirit or Forecast, delighting to live beggarly and carelesly, one content in no condition of Life, either good or ill." },
    { heading: "Corporature", page: 81, text: "She generally presenteth a man of faire stature, whitely coloured, the Face round, gray Eyes, and a little louring; much Haire both on the Head, Face, and other parts; usually one Eye a little larger then the other; short Hands and fleshy, the whole Body inclining to be fleshy, plump, corpulent and flegmatique: if she be impedited of the Sun in a Nativity or Question, she usually signifies some blemish in, or neer the Eye; a blemish neer the Eye, if she be impedited in Succedant Houses; in the Sight, if she be unfortunate in Angles and with fixed Starres, called Nebulosæ." },
    { heading: "Qualities of Men and Women", page: 81, text: "She signifieth Queens, Countesses, Ladies, all manner of Women; as also, the common People, Travellers, Pilgrims, Sailors, Fishermen, Fish-mongers, Brewers, Tapsters, Vintners, Letter-carriers, Coach-men, Huntsmen, Messengers, (some say the Popes Legats) Marriners, Millers, Ale-wives, Malsters, Drunkards, Oister-wives, Fisher-women, Chare-women, Tripe-women, and generally such Women as carry Commodities in the Streets; as also, Midwives, Nurses, &c. Hackney-men, Water-men, Water-bearers." },
    { heading: "Sicknesse", page: 81, sickness: true, text: "Apoplexies, Palsie, the Chollick, the Belly-ake, Diseases in the left Side, Stones, the Bladder and members of Generation, the Menstrues and Liver in Women, Dropsies, Fluxes of the Belly, all cold rheumatick Diseases, cold Stomack, the Gout in the Rists and Feet, Sciatica, Chollick, Wormes in Children and men, Rheumes or Hurts in the Eyes, viz. in the Left of Men, and Right of Women: Surfets, rotten Coughs, Convulsion fits, the Falling sicknesse, Kings-evil, Apostems, small Pox and Measels (pp. 81–82)." },
    { heading: "Colours and Savours", page: 82, text: "Of Colours the White, or pale Yellowish white, pale Green, or a little of the Silver-colour: Of Savours, the Fresh, or without any savour, such as is in Hearbs before they be ripe, or such as doe moysten the Braine, &c." },
    { heading: "Hearbs, Plants and Trees", page: 82, text: "Those Hearbs which are subject to the Moon have soft and thick juicy leaves, of a waterish or a little sweetish taste, they love to grow in watry places, and grow quickly into a juicy magnitude; and are The Colwort, Cabbage, Melon, Gourd, Pompion, Onion, Mandrake, Poppy, Lettice, Rape, the Linden-tree, Mushromes, Endive, all Trees or Hearbs who have round, shady, great spreading Leaves, and are little Fruitfull." },
    { heading: "Beasts or Birds", page: 82, text: "All such Beasts, or the like, as live in the water; as Frogs, the Otter, Snailes, &c. the Weasell, the Cunny, all Sea Fowle, Coockoe, Geese and Duck, the Night-Owle." },
    { heading: "Fishes", page: 82, text: "The Oyster and Cockle, all Shel-fish, the Crab and Lobster, Tortoise, Eeles." },
    { heading: "Places", page: 82, text: "Fields, Fountaines, Baths, Havens of the Sea, Highwayes and Desert places, Port Townes, Rivers, Fish-ponds, standing Pools, Boggy places, Common-shoares, little Brooks, Springs, Harbours for Ships or Docks." },
    { heading: "Minerals", page: 82, text: "Silver." },
    { heading: "Stones", page: 82, text: "The Selenite, all soft Stones, Christals." },
    { heading: "Weather", page: 82, text: "With Saturn cold Ayre; with Jupiter Serene; with Mars Winds red Clouds; with the Sun according to the Season; with Venus and Mercury Showres and Winds." },
    { heading: "Winds", page: 82, historical: true, text: "In Hermeticall operation, she delighteth towards the North, and usually when she is the strongest Planet in the Scheame, viz. in any Lunation, she stirs up Wind, according to the nature of the Planet she next applies unto." },
    { heading: "Orbe", page: 83, text: "Is 12 degrees before and after any Aspect." },
    { heading: "Yeers", page: 83, text: "Her greatest yeers are 320. greater 108. meane 66, least 25. in conceptions she ruleth the seventh moneth." },
    { heading: "Countries", page: 83, text: "Holland, Zealand, Denmarke, Norimberge, Flanders." },
    { heading: "Angel", page: 83, text: "Gabriel." },
    { heading: "Day of the week", page: 83, text: "Her day is Monday the first houre and the eight, after the rise of the Sun are hers. Her Enemy is Saturn, and also Mars." },
  ],
};

// Chaldean order, as Lilly's chapters run.
export const PLANET_CATALOGS: PlanetCatalog[] = [SATURN, JUPITER, MARS, SUN, VENUS, MERCURY, MOON];

// Short attributed pointers only (CEO 14:21 ruling 4): not catalogs, not a new layer.
export const LATER_BOOK1_POINTERS = [
  { title: "The Head and Tail of the Dragon", page: "p. 83", note: "Lilly describes the Moon's nodes just after the Moon chapter. They are not among the seven planets and are not catalogued here." },
  { title: "The colours of the Planets, and Signes", page: "p. 86", note: "A short note later in Book 1 giving a colour for each planet and sign. Read it in the scan." },
];

// Lilly's own table of essential dignities (p. 104, "according to Ptolomy"):
// the planet and end degree of each term, read from the page image. The live
// /clock tables (traditional.ts) use Egyptian terms, which differ in every sign.
export const LILLY_TABLE_TERMS: Record<SignKey, Array<[PlanetKey, number]>> = {
  aries: [["jupiter", 6], ["venus", 14], ["mercury", 21], ["mars", 26], ["saturn", 30]],
  taurus: [["venus", 8], ["mercury", 15], ["jupiter", 22], ["saturn", 26], ["mars", 30]],
  gemini: [["mercury", 7], ["jupiter", 14], ["venus", 21], ["saturn", 25], ["mars", 30]],
  cancer: [["mars", 6], ["jupiter", 13], ["mercury", 20], ["venus", 27], ["saturn", 30]],
  leo: [["saturn", 6], ["mercury", 13], ["venus", 19], ["jupiter", 25], ["mars", 30]],
  virgo: [["mercury", 7], ["venus", 13], ["jupiter", 18], ["saturn", 24], ["mars", 30]],
  libra: [["saturn", 6], ["venus", 11], ["jupiter", 19], ["mercury", 24], ["mars", 30]],
  scorpio: [["mars", 6], ["jupiter", 14], ["venus", 21], ["mercury", 27], ["saturn", 30]],
  sagittarius: [["jupiter", 8], ["venus", 14], ["mercury", 19], ["saturn", 25], ["mars", 30]],
  capricorn: [["venus", 6], ["mercury", 12], ["jupiter", 19], ["mars", 25], ["saturn", 30]],
  aquarius: [["saturn", 6], ["mercury", 12], ["venus", 20], ["jupiter", 25], ["mars", 30]],
  pisces: [["venus", 8], ["jupiter", 14], ["mercury", 20], ["mars", 26], ["saturn", 30]],
};

export interface DignityTermDef {
  code: string;
  name: string;
  definition: string;
}

// "Essential dignities" DefinedTermSet (brief §4): the categories the /clock panel shows.
export const DIGNITY_TERMS: DignityTermDef[] = [
  { code: "house", name: "house (sign rulership)", definition: "The sign or signs a planet rules. Lilly gives each planet a day house and a night house, and the Sun and Moon one house each." },
  { code: "exaltation", name: "exaltation", definition: "The sign, and in Lilly's table a degree, where a planet is held to be exalted." },
  { code: "triplicity", name: "triplicity", definition: "Rulership of the fire, earth, air or water signs, given to one planet by day and one by night (Dorotheus/Lilly)." },
  { code: "term", name: "term", definition: "A run of degrees within a sign assigned to one of the five planets other than the Sun and Moon." },
  { code: "face", name: "face", definition: "One of the three ten-degree divisions of a sign (decanate), assigned in the Chaldean order." },
  { code: "detriment", name: "detriment", definition: "The sign opposite a planet's house; a debility." },
  { code: "fall", name: "fall", definition: "The sign opposite a planet's exaltation; a debility." },
  { code: "peregrine", name: "peregrine", definition: "A planet with none of the five essential dignities where it stands: house, exaltation, triplicity, term or face." },
];

export function planetFromPath(pathname: string): PlanetCatalog | undefined {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (!p.startsWith(`${DIGNITIES_PATH}/`)) return undefined;
  const slug = p.slice(DIGNITIES_PATH.length + 1);
  return PLANET_CATALOGS.find((c) => c.key === slug);
}

export const FURTHER_STUDY_IDS = ["tetrabiblos", "astrologia-restaurata", "liber-astronomiae"];

// Our layout of the hub's live dignity tables (src/astro/traditional.ts), read-only.
export interface SignDignities {
  sign: SignKey;
  house: PlanetKey;
  exaltation: { planet: PlanetKey; degree?: number } | null;
  element: "fire" | "earth" | "air" | "water";
  triplicity: { day: PlanetKey; night: PlanetKey };
  terms: Array<[PlanetKey, number]>; // Egyptian terms: planet, end degree
  faces: [PlanetKey, PlanetKey, PlanetKey];
  detriment: PlanetKey;
  fall: PlanetKey | null;
}

export function signDignities(): SignDignities[] {
  return SIGNS.map((sign) => {
    const ex = CLASSICAL_PLANETS.find((p) => EXALTATION_SIGN[p] === sign);
    const terms: Array<[PlanetKey, number]> = [];
    for (let d = 0; d < 30; d++) {
      const p = termRuler(sign, d);
      if (terms.length && terms[terms.length - 1][0] === p) terms[terms.length - 1][1] = d + 1;
      else terms.push([p, d + 1]);
    }
    const [day, night] = TRIPLICITY[ELEMENT_OF[sign]];
    return {
      sign,
      house: RULER[sign],
      exaltation: ex ? { planet: ex, degree: EXALTATION_DEGREE[ex] } : null,
      element: ELEMENT_OF[sign],
      triplicity: { day, night },
      terms,
      faces: [faceRuler(sign, 0), faceRuler(sign, 10), faceRuler(sign, 20)],
      detriment: DETRIMENT[sign],
      fall: CLASSICAL_PLANETS.find((p) => FALL_SIGN[p] === sign) ?? null,
    };
  });
}
