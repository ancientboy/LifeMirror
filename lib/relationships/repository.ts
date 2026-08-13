import { getPrivatePeople, getRelationshipLoops } from "../relationship-context";
import { adaptLegacyLoop, adaptLegacyPerson } from "./legacy-adapter";
import type { ExtractedRelationshipMessage, RelationshipCase, RelationshipMemoryContext, RelationshipOutcome, RelationshipPerson, RelationshipReplyOption } from "./types";

export type RelationshipSnapshot = { people: RelationshipPerson[]; cases: RelationshipCase[] };

export function readLegacyRelationshipSnapshot(): RelationshipSnapshot {
  return { people: getPrivatePeople().map(adaptLegacyPerson), cases: getRelationshipLoops().map(adaptLegacyLoop) };
}

export async function fetchRelationshipSnapshot(): Promise<RelationshipSnapshot> {
  try {
    const response = await fetch("/api/v1/account/relationships", { credentials: "include" });
    if (response.ok) {
      const value = await response.json() as RelationshipSnapshot;
      return { people: Array.isArray(value.people) ? value.people : [], cases: Array.isArray(value.cases) ? value.cases : [] };
    }
  } catch {}
  return readLegacyRelationshipSnapshot();
}

export async function saveRelationshipPerson(input: { displayName: string; relationshipLabel?: string; userDescription?: string; communicationNotes?: string; legacyPersonId?: string }) {
  const response = await fetch("/api/v1/account/relationships/people", { method: "POST", credentials: "include", headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: JSON.stringify(input) });
  if (!response.ok) throw new Error("relationship_person_save_failed");
  return (await response.json() as { person: RelationshipPerson }).person;
}

export async function fetchRelationshipPersonContext(personId: string): Promise<RelationshipMemoryContext> {
  const empty: RelationshipMemoryContext = { recentCases: [], extractedMessages: [], priorAnalyses: [], realityFeedback: [] };
  try {
    const response = await fetch(`/api/v1/account/relationships/people/${encodeURIComponent(personId)}/context`, { credentials: "include" });
    if (!response.ok) return empty;
    const value = await response.json() as { context?: Partial<RelationshipMemoryContext> };
    return {
      recentCases: Array.isArray(value.context?.recentCases) ? value.context.recentCases : [],
      extractedMessages: Array.isArray(value.context?.extractedMessages) ? value.context.extractedMessages : [],
      priorAnalyses: Array.isArray(value.context?.priorAnalyses) ? value.context.priorAnalyses : [],
      realityFeedback: Array.isArray(value.context?.realityFeedback) ? value.context.realityFeedback : [],
    };
  } catch { return empty; }
}

export async function saveRelationshipCase(input: { personId?: string; text: string; userNote?: string; source: "text" | "screenshot"; recommendedReply?: string; extractedConversation?: ExtractedRelationshipMessage[]; analysisSummary?: string; replyOptions?: RelationshipReplyOption[] }) {
  const response = await fetch("/api/v1/account/relationships/cases", { method: "POST", credentials: "include", headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: JSON.stringify(input) });
  if (!response.ok) return null;
  return (await response.json() as { case: RelationshipCase }).case;
}

export async function saveRelationshipFeedback(input: { caseId: string; acted: boolean; outcome: RelationshipOutcome; actualReply?: string; note?: string }) {
  const response = await fetch("/api/v1/account/relationships/feedback", { method: "POST", credentials: "include", headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: JSON.stringify(input) });
  if (!response.ok) throw new Error("relationship_feedback_save_failed");
  return response.json();
}

export async function linkRelationshipCase(caseId: string, personId: string) {
  const response = await fetch(`/api/v1/account/relationships/cases/${encodeURIComponent(caseId)}`, { method: "PATCH", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ personId }) });
  if (!response.ok) return null;
  return (await response.json() as { case: RelationshipCase }).case;
}
