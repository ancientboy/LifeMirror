import { getPrivatePeople, getRelationshipLoops } from "../relationship-context";
import { adaptLegacyLoop, adaptLegacyPerson } from "./legacy-adapter";
import type { RelationshipCase, RelationshipOutcome, RelationshipPerson } from "./types";

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

export async function saveRelationshipPerson(input: { displayName: string; relationshipLabel?: string; legacyPersonId?: string }) {
  const response = await fetch("/api/v1/account/relationships/people", { method: "POST", credentials: "include", headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: JSON.stringify(input) });
  if (!response.ok) throw new Error("relationship_person_save_failed");
  return (await response.json() as { person: RelationshipPerson }).person;
}

export async function saveRelationshipCase(input: { personId?: string; text: string; source: "text" | "screenshot"; recommendedReply?: string }) {
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
