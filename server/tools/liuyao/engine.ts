import { getHexagramNumber, HEXAGRAM_NAMES, TRIGRAMS } from "./catalog.js";
import type { CoinToss, HexagramIdentity, LiuyaoLine, LiuyaoResult, Polarity } from "./types.js";

function identityFromPolarities(polarities: Polarity[]): HexagramIdentity {
  const bits = polarities.map((polarity) => polarity === "yang" ? "1" : "0").join("");
  const lowerTrigram = TRIGRAMS[bits.slice(0, 3)];
  const upperTrigram = TRIGRAMS[bits.slice(3, 6)];
  if (!lowerTrigram || !upperTrigram) throw new Error("A hexagram requires six valid lines");

  const number = getHexagramNumber(upperTrigram.bits, lowerTrigram.bits);
  return {
    number,
    name: HEXAGRAM_NAMES.get(number)!,
    symbol: String.fromCodePoint(0x4dbf + number),
    upperTrigram,
    lowerTrigram,
  };
}

export function calculateLiuyao(tosses: readonly CoinToss[]): LiuyaoResult {
  if (tosses.length !== 6) throw new Error("Exactly six coin tosses are required");

  const lines: LiuyaoLine[] = tosses.map((coins, index) => {
    if (coins.length !== 3 || coins.some((coin) => coin !== 2 && coin !== 3)) {
      throw new Error(`Toss ${index + 1} must contain exactly three coin values`);
    }

    const value = coins.reduce<number>((sum, coin) => sum + coin, 0) as 6 | 7 | 8 | 9;
    const polarity: Polarity = value === 6 || value === 8 ? "yin" : "yang";
    const moving = value === 6 || value === 9;
    return {
      position: index + 1,
      coins: [...coins] as CoinToss,
      value,
      polarity,
      moving,
      changedPolarity: moving ? (polarity === "yin" ? "yang" : "yin") : polarity,
    };
  });

  return {
    method: "three_coins",
    lines,
    movingLines: lines.filter((line) => line.moving).map((line) => line.position),
    originalHexagram: identityFromPolarities(lines.map((line) => line.polarity)),
    changedHexagram: identityFromPolarities(lines.map((line) => line.changedPolarity)),
  };
}
