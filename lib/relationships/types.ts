export type RelationshipDomain = "romance" | "friendship" | "work" | "family" | "other";
export type RelationshipRole = "dating" | "partner" | "ex" | "friend" | "colleague" | "manager" | "report" | "client" | "parent" | "child" | "sibling" | "relative" | "other";
export type RelationshipStage = "unknown" | "new" | "developing" | "stable" | "conflict" | "cooling" | "separated" | "repairing";
export type PowerPosition = "roughly_equal" | "user_lower_power" | "user_higher_power" | "dependent" | "unknown";
export type RelationshipGoal = "interpret_signal" | "draft_reply" | "decide_initiation" | "repair" | "set_boundary" | "refuse" | "prepare_conversation" | "other";
export type RelationshipHomeMode = "first_visit" | "returning_unlinked" | "relationship_active" | "multi_relationship";

export type RelationshipClassification = {
  domain: RelationshipDomain;
  role: RelationshipRole;
  stage: RelationshipStage;
  powerPosition: PowerPosition;
  goal: RelationshipGoal;
  confidence: number;
  missingCriticalField?: "role" | "speaker" | "goal";
  reasonCodes: string[];
};

export type RelationshipPerson = {
  id: string;
  displayName: string;
  relationshipLabel: string;
  domain: RelationshipDomain;
  role: RelationshipRole;
  stage: RelationshipStage;
  powerPosition: PowerPosition;
  confirmedByUser: boolean;
  /** Private, owner-authored perspective shared by analysis and rehearsal. */
  userDescription?: string;
  communicationNotes?: string;
  legacyPersonId?: string;
  createdAt: string;
  updatedAt: string;
};

export type RelationshipCase = {
  id: string;
  personId?: string;
  goal: RelationshipGoal;
  status: "open" | "awaiting_reply" | "resolved" | "archived";
  source: "text" | "screenshot" | "person_mirror" | "followup";
  strategyKey: string;
  summary?: string;
  recommendedReply?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
};

export type RelationshipOutcome = "positive" | "mixed" | "negative" | "no_response" | "not_yet";

export type ExtractedConversation = {
  pages: Array<{
    attachmentId: string;
    order: number;
    messages: Array<{ speaker: "user" | "other" | "unknown"; text: string; visibleTime?: string; signals?: string[]; uncertain?: boolean }>;
  }>;
  inferredUserSide: "left" | "right" | "mixed" | "unknown";
  missingRegions: string[];
  warnings: string[];
};

export type ExtractedRelationshipMessage = {
  speaker: "user" | "other" | "unknown";
  text: string;
  visibleTime?: string;
  signals?: string[];
  uncertain?: boolean;
  attachmentId?: string;
  pageOrder?: number;
  messageOrder?: number;
};

export type RelationshipReplyOption = {
  id: string;
  tone: "natural" | "warm" | "direct" | "boundary";
  text: string;
  why: string;
};

export type RelationshipMemoryContext = {
  recentCases: RelationshipCase[];
  extractedMessages: Array<ExtractedRelationshipMessage & { createdAt: string; caseId?: string }>;
  priorAnalyses: Array<{ summary: string; createdAt: string; caseId?: string }>;
  realityFeedback: Array<{ outcome: RelationshipOutcome; acted: boolean; note?: string; createdAt: string; caseId?: string }>;
};

export type RelationshipPolicy = {
  key: string;
  label: string;
  priorities: string[];
  avoid: string[];
  replyStyle: string;
  nextSignals: string[];
};
