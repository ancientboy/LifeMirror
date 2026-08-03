export type ReviewCadence = "weekly" | "monthly";

export type ReviewMemory = {
  sourceEventId: string;
  occurredAt: Date;
  title: string;
  topic: string;
  summary: string;
  insight: string;
  reflectionQuestion: string;
  actionSuggestion: string;
  concepts: string[];
};

export type ReviewPattern = {
  id: string;
  title: string;
  summary: string;
  signalCount: number;
  confidence: number;
  sourceEventIds: string[];
};

export type ReviewEvidence = {
  id: string;
  sourceEventId: string;
  occurredAt: string;
  title: string;
  summary: string;
};

export type MirrorReview = {
  cadence: ReviewCadence;
  period: { start: string; end: string; timezone: string };
  status: "ready" | "insufficient_evidence";
  summary: string;
  themes: Array<{ name: string; signalCount: number; evidenceIds: string[] }>;
  changes: Array<{ kind: "emerging" | "recurring"; description: string; evidenceIds: string[] }>;
  reflectionQuestions: string[];
  gentleSuggestions: string[];
  evidence: ReviewEvidence[];
  trust: {
    confidence: number;
    evidenceCount: number;
    limitations: string[];
  };
};

export type ProactiveReflectionPreferences = {
  enabled: boolean;
  weeklyEnabled: boolean;
  monthlyEnabled: boolean;
  cooldownHours: number;
};

export type ProactiveReflectionDecision = {
  shouldSuggest: boolean;
  reason: "ready" | "disabled" | "cadence_disabled" | "insufficient_evidence" | "cooldown" | "already_suggested";
  suggestion?: {
    cadence: ReviewCadence;
    title: string;
    prompt: string;
    evidenceCount: number;
  };
};
