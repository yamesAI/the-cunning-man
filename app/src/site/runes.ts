// Elder Futhark runes with cunning-folk meanings.

export interface Rune {
  glyph: string;
  name: string;
  phonetic: string;
  meaning: string;
  love: string;
  money: string;
}

export const RUNES: Rune[] = [
  { glyph: "ᚠ", name: "Fehu", phonetic: "F", meaning: "Cattle, wealth, mobile property. Flowing abundance that must keep moving.", love: "Generosity kindles affection.", money: "Income, new earnings, wealth in motion." },
  { glyph: "ᚢ", name: "Uruz", phonetic: "U", meaning: "The aurochs — raw strength, vitality, untamed potential.", love: "Magnetism and vital attraction.", money: "The strength to seize an opportunity." },
  { glyph: "ᚦ", name: "Thurisaz", phonetic: "TH", meaning: "The thorn — directed force, defense, the hammer that breaks or protects.", love: "Passion with an edge; guard your heart.", money: "Break through a blockage; defend what is yours." },
  { glyph: "ᚨ", name: "Ansuz", phonetic: "A", meaning: "The god Odin — speech, breath, inspiration, messages.", love: "Speak what you feel; words carry the charm.", money: "Negotiation, contracts, a message about money." },
  { glyph: "ᚱ", name: "Raidho", phonetic: "R", meaning: "The wheel, the ride — journeys, right ordering, rhythm.", love: "A relationship that moves; travel together.", money: "Steady progress; money on the road." },
  { glyph: "ᚲ", name: "Kenaz", phonetic: "K", meaning: "The torch — knowledge, craft, controlled fire.", love: "Warmth and revelation; seeing clearly.", money: "Skill turned to profit; a bright idea." },
  { glyph: "ᚷ", name: "Gebo", phonetic: "G", meaning: "The gift — exchange, partnership, sacred balance.", love: "The classic love-rune: mutual gift, union.", money: "A gift, grant, or fair exchange." },
  { glyph: "ᚹ", name: "Wunjo", phonetic: "W", meaning: "Joy — harmony, fellowship, wishes granted.", love: "Delight, shared happiness.", money: "Contentment; enough and a little more." },
  { glyph: "ᚺ", name: "Hagalaz", phonetic: "H", meaning: "Hail — disruption from the sky, forces beyond control.", love: "A storm to weather; do not force it.", money: "Sudden loss or delay; hold reserves." },
  { glyph: "ᚾ", name: "Nauthiz", phonetic: "N", meaning: "Need-fire — constraint, necessity, friction that kindles.", love: "Patience; need teaches what matters.", money: "Tight times; the need-fire of invention." },
  { glyph: "ᛁ", name: "Isa", phonetic: "I", meaning: "Ice — stillness, stasis, the frozen moment.", love: "Cooled ardour; wait for thaw.", money: "Frozen funds; stand still, do not invest." },
  { glyph: "ᛃ", name: "Jera", phonetic: "J", meaning: "The year, the harvest — cycles turning, rewards in season.", love: "What was sown now ripens.", money: "Harvest time: returns on past effort." },
  { glyph: "ᛇ", name: "Eihwaz", phonetic: "EI", meaning: "The yew — endurance, the axis between worlds, reliability.", love: "Steadfastness through trials.", money: "Long-term security; hold the course." },
  { glyph: "ᛈ", name: "Perthro", phonetic: "P", meaning: "The dice-cup — chance, fate, hidden things revealed.", love: "A gamble on the heart; mystery.", money: "Luck in play; risk what you can lose." },
  { glyph: "ᛉ", name: "Algiz", phonetic: "Z", meaning: "The elk, the sedge — protection, higher shield, instinct.", love: "Protected love; trust your instinct.", money: "Guarded assets; a warning heeded." },
  { glyph: "ᛋ", name: "Sowilo", phonetic: "S", meaning: "The sun — victory, guidance, life-force, success.", love: "Radiant attraction; be the light.", money: "Success, recognition, winning." },
  { glyph: "ᛏ", name: "Tiwaz", phonetic: "T", meaning: "Tyr — justice, sacrifice, the warrior's honor.", love: "Honourable intent; keep your word.", money: "Fair dealing wins; legal matters favor the just." },
  { glyph: "ᛒ", name: "Berkana", phonetic: "B", meaning: "The birch — new growth, fertility, nurturing beginnings.", love: "New love, fertility, family.", money: "Seed capital; nurture a young venture." },
  { glyph: "ᛖ", name: "Ehwaz", phonetic: "E", meaning: "The horse — trust, partnership, steady progress.", love: "Trust and teamwork; moving as one.", money: "A reliable partner or vehicle of income." },
  { glyph: "ᛗ", name: "Mannaz", phonetic: "M", meaning: "Mankind — the self, community, mutual aid.", love: "Know yourself first; aid from friends.", money: "Networks pay; ask for help." },
  { glyph: "ᛚ", name: "Laguz", phonetic: "L", meaning: "Water — flow, intuition, the unconscious, dreams.", love: "Deep feeling; follow the current.", money: "Cash flow; intuition about timing." },
  { glyph: "ᛜ", name: "Ingwaz", phonetic: "NG", meaning: "The god Ing — gestation, stored potential, the seed.", love: "Something quietly growing.", money: "Stored value; wait for the sprout." },
  { glyph: "ᛞ", name: "Dagaz", phonetic: "D", meaning: "Daylight — breakthrough, awakening, clarity.", love: "A new day for the heart.", money: "Breakthrough; things come to light." },
  { glyph: "ᛟ", name: "Othala", phonetic: "O", meaning: "Inheritance — ancestral property, homeland, lasting wealth.", love: "Roots, home, family blessing.", money: "Property, inheritance, lasting wealth." },
];

export function drawRunes(n: number, rand: () => number = Math.random): number[] {
  const pool = RUNES.map((_, i) => i);
  const out: number[] = [];
  for (let k = 0; k < n; k++) {
    const j = Math.floor(rand() * pool.length);
    out.push(pool.splice(j, 1)[0]);
  }
  return out;
}
