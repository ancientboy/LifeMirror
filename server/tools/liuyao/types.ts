export type CoinValue = 2 | 3;
export type Polarity = "yin" | "yang";
export type FiveElement = "wood" | "fire" | "earth" | "metal" | "water";
export type SixRelation = "parents" | "siblings" | "offspring" | "wealth" | "officials";
export type EarthlyBranch = "zi" | "chou" | "yin" | "mao" | "chen" | "si" | "wu" | "wei" | "shen" | "you" | "xu" | "hai";
export type HeavenlyStem = "jia" | "yi" | "bing" | "ding" | "wu" | "ji" | "geng" | "xin" | "ren" | "gui";
export type LiuyaoTopic = "self" | "career" | "wealth" | "study" | "relationship_male" | "relationship_female" | "health" | "family" | "children" | "travel" | "legal" | "partnership";
export type LiuyaoTone = "playful" | "warm" | "grounded" | "careful";
export type LiuyaoTimingScale = "day" | "month";
export type LiuyaoUsefulGodTarget = SixRelation | "shi" | "ying";
export type LiuyaoScenario = "job_search" | "exam" | "reconciliation" | "investment";
export type LiuyaoScenarioFocus =
  | "job_interview" | "job_offer" | "job_start"
  | "exam_performance" | "exam_score" | "exam_admission"
  | "relationship_contact" | "relationship_reconcile" | "relationship_stability"
  | "investment_short_term" | "investment_long_term";

export type LiuyaoTopicHint =
  | "career" | "wealth" | "study" | "relationship" | "health"
  | "family" | "travel" | "legal" | "partnership" | "other";

export type LiuyaoIntent = {
  id: string;
  label: string;
  topic: LiuyaoTopic;
  priority: number;
  usefulGod?: LiuyaoUsefulGodTarget;
  scenario?: LiuyaoScenario;
  scenarioFocus?: LiuyaoScenarioFocus;
};

export type LiuyaoIntentSelection = {
  intents: LiuyaoIntent[];
  topic: LiuyaoTopic;
  usefulGod?: LiuyaoUsefulGodTarget;
  tone: LiuyaoTone;
  timingScale: LiuyaoTimingScale;
  scenario?: LiuyaoScenario;
  scenarioFocus?: LiuyaoScenarioFocus;
  resolution: {
    source: "deterministic" | "llm" | "fallback" | "user_confirmed";
    confidence: number;
    topicHint?: LiuyaoTopicHint;
  };
};

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
  changedBranch: EarthlyBranch | null;
  changedElement: FiveElement | null;
};

export type LiuyaoAnalysisContext = {
  topic: LiuyaoTopic;
  monthBranch: EarthlyBranch;
  dayStem: HeavenlyStem;
  dayBranch: EarthlyBranch;
  intents?: LiuyaoIntent[];
  tone?: LiuyaoTone;
  calendarBoundary?: boolean;
  usefulGod?: LiuyaoUsefulGodTarget;
  occurredAt?: string;
  timezone?: string;
  timingScale?: LiuyaoTimingScale;
  scenario?: LiuyaoScenario;
  scenarioFocus?: LiuyaoScenarioFocus;
  intentResolution?: LiuyaoIntentSelection["resolution"];
};

export type LiuyaoEvidence = {
  id?: string;
  intentId?: string;
  rule: string;
  conclusion: string;
  confidence: number;
  line?: number;
  effect?: "support" | "obstruct" | "mixed" | "neutral";
  strength?: number;
  technicalText?: string;
  plainMeaning?: string;
};

export type LiuyaoVerdict = {
  intentId: string;
  label: string;
  topic: LiuyaoTopic;
  direction: "favorable" | "mixed" | "unfavorable" | "undetermined";
  confidence: number;
  shortReason: string;
  evidenceBalance?: "supporting" | "opposing" | "conflicted" | "insufficient";
  supportScore?: number;
  obstructionScore?: number;
  decisiveEvidenceIds?: string[];
};

export type LiuyaoJudgmentPackage = {
  verdicts: LiuyaoVerdict[];
  keyEvidence: LiuyaoEvidence[];
  limitations: string[];
  tone: LiuyaoTone;
};

export type LiuyaoTimingCandidate = {
  branch: EarthlyBranch;
  scale: LiuyaoTimingScale;
  trigger: "fill" | "clash_open" | "release_combine" | "meet_combine" | "meet_clash" | "hidden_emerges";
  reason: string;
  confidence: number;
  /** Order among traditional timing candidates; it is not an event probability. */
  priority?: number;
  dateWindows?: Array<{
    startDate: string;
    endDate: string;
    label: string;
  }>;
};

export type LiuyaoTraditionalAnalysis = {
  status: "complete" | "context_required";
  usefulGod: { relation: LiuyaoUsefulGodTarget; line: number | null; hidden: boolean; flyingLine: number | null } | null;
  strength: { level: "prosperous" | "supported" | "resting" | "confined" | "dead"; score: number } | null;
  relationships: Array<{ source: string; target: string; relation: "same" | "generates" | "controls" | "generated_by" | "controlled_by" | "clash" | "combine" }>;
  hiddenSpirit: { relation: SixRelation; line: number; branch: EarthlyBranch; element: FiveElement; flyingBranch: EarthlyBranch; flyingLine: number; flyingMoving: boolean; relationToFlying: string; void: boolean; monthStrength: number } | null;
  timing: { candidates: EarthlyBranch[]; details: LiuyaoTimingCandidate[]; basis: string; confidence: number } | null;
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
    hexagramBody: { branch: EarthlyBranch; polarity: Polarity; lines: number[] };
    sixRelations: SixRelation[];
    elements: FiveElement[];
    voidBranches: EarthlyBranch[] | null;
  };
  analysis: LiuyaoTraditionalAnalysis;
  evidence: LiuyaoEvidence[];
  judgment: LiuyaoJudgmentPackage;
};
