export type CoinValue = 2 | 3;
export type Polarity = "yin" | "yang";

export type CoinToss = readonly [CoinValue, CoinValue, CoinValue];

export type Trigram = {
  key: string;
  name: string;
  nature: string;
  bits: string;
};

export type HexagramIdentity = {
  number: number;
  name: string;
  symbol: string;
  upperTrigram: Trigram;
  lowerTrigram: Trigram;
};

export type LiuyaoLine = {
  position: number;
  coins: CoinToss;
  value: 6 | 7 | 8 | 9;
  polarity: Polarity;
  moving: boolean;
  changedPolarity: Polarity;
};

export type LiuyaoResult = {
  method: "three_coins";
  lines: LiuyaoLine[];
  movingLines: number[];
  originalHexagram: HexagramIdentity;
  changedHexagram: HexagramIdentity;
};
