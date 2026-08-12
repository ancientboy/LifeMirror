import type { PrivatePerson, RelationshipLoop } from "../relationship-context";
import { classifyRelationship } from "./taxonomy";
import type { RelationshipCase, RelationshipPerson } from "./types";

export function adaptLegacyPerson(person: PrivatePerson): RelationshipPerson {
  const classification = classifyRelationship(`${person.relationshipType ?? ""} ${person.userDescription ?? ""}`);
  return { id: person.id, displayName: person.displayName, relationshipLabel: person.relationshipType ?? "", domain: classification.domain, role: classification.role, stage: classification.stage, powerPosition: classification.powerPosition, confirmedByUser: Boolean(person.relationshipType), legacyPersonId: person.id, createdAt: person.createdAt, updatedAt: person.updatedAt };
}

export function adaptLegacyLoop(loop: RelationshipLoop): RelationshipCase {
  const classification = classifyRelationship(`${loop.situation} ${loop.need ?? ""}`);
  return { id: loop.id, personId: loop.personId, goal: classification.goal, status: loop.status === "reported" ? "resolved" : "open", source: "person_mirror", strategyKey: classification.role, summary: loop.situation, createdAt: loop.createdAt, updatedAt: loop.updatedAt, resolvedAt: loop.reportedAt };
}

