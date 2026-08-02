export type CoinValue = 2 | 3;
export type Polarity = "yin" | "yang";
export type FiveElement = "wood" | "fire" | "earth" | "metal" | "water";
export type SixRelation = "parents" | "siblings" | "offspring" | "wealth" | "officials";
export type EarthlyBranch = "zi" | "chou" | "yin" | "mao" | "chen" | "si" | "wu" | "wei" | "shen" | "you" | "xu" | "hai";
export type HeavenlyStem = "jia" | "yi" | "bing" | "ding" | "wu" | "ji" | "geng" | "xin" | "ren" | "gui";
export type LiuyaoTopic = "self" | "career" | "wealth" | "study" | "relationship_male" | "relationship_female" | "health" | "family" | "children" | "travel" | "legal" | "partnership";

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

export type LiuyaoCastingLine = {
  position: number;
  coins: CoinToss;
  value: 6 | 7 | 8 | 9;
  polarity: Polarity;
  moving: boolean;
  changedPolarity: Polarity;
};

export type LiuyaoLine = LiuyaoCastingLine & {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  element: FiveElement;
  relation: SixRelation;
  spirit: "azure_dragon" | "vermilion_bird" | "hooked_earth" | "soaring_serpent" | "white_tiger" | "black_tortoise" | null;
  role: "shi" | "ying" | null;
  void: boolean | null;
};

export type LiuyaoAnalysisContext = {
  topic: LiuyaoTopic;
  monthBranch: EarthlyBranch;
  dayStem: HeavenlyStem;
  dayBranch: EarthlyBranch;
};

export type LiuyaoEvidence = {
  rule: string;
  conclusion: string;
  confidence: number;
  line?: number;
};

export type LiuyaoTraditionalAnalysis = {
  status: "complete" | "context_required";
  usefulGod: { relation: SixRelation | "shi"; line: number | null; hidden: boolean; flyingLine: number | null } | null;
  strength: { level: "prosperous" | "supported" | "resting" | "confined" | "dead"; score: number } | null;
  relationships: Array<{ source: string; target: string; relation: "same" | "generates" | "controls" | "generated_by" | "controlled_by" | "clash" | "combine" }>;
  hiddenSpirit: { relation: SixRelation; line: number; branch: EarthlyBranch; flyingBranch: EarthlyBranch; relationToFlying: string } | null;
  timing: { candidates: EarthlyBranch[]; basis: string; confidence: number } | null;
  tendency: "favorable" | "mixed" | "unfavorable" | "undetermined";
  uncertainty: "medium" | "high";
  missingContext: Array<keyof LiuyaoAnalysisContext>;
};

export type LiuyaoResult = {
  method: "three_coins";
  lines: LiuyaoLine[];
  movingLines: number[];
  originalHexagram: HexagramIdentity;
  changedHexagram: HexagramIdentity;
  divination: {
    originalHexagram: HexagramIdentity;
    changedHexagram: HexagramIdentity;
    movingLines: number[];
  };
  structure: {
    palace: string;
    palaceElement: FiveElement;
    palaceStage: "pure" | "first" | "second" | "third" | "fourth" | "fifth" | "wandering_soul" | "returning_soul";
    shi: number;
    ying: number;
    sixRelations: SixRelation[];
    elements: FiveElement[];
    voidBranches: EarthlyBranch[] | null;
  };
  analysis: LiuyaoTraditionalAnalysis;
  evidence: LiuyaoEvidence[];
};
