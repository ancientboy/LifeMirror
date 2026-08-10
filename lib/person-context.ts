import type { PrivatePerson, RelationshipLoop, RelationshipObservation } from "./relationship-context";

/**
 * A derived, read-only view for a single person mirror. This is deliberately
 * not another memory store: deleting a source record immediately removes it
 * from the next rehearsal.
 */
export type PersonContext = {
  person: Pick<PrivatePerson, "id" | "displayName" | "relationshipType" | "birthProfile" | "isMinor">;
  ownerObservations: RelationshipObservation[];
  simulationCorrections: RelationshipObservation[];
  realInteractions: RelationshipLoop[];
  openLoops: RelationshipLoop[];
  provenance: { excluded: string[]; ranking: string[] };
};

export function buildPersonContext(person: PrivatePerson, loops: RelationshipLoop[]): PersonContext {
  const observations = [...(person.observations ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const related = loops.filter((loop) => loop.personId === person.id);
  return {
    person: { id: person.id, displayName: person.displayName, relationshipType: person.relationshipType, birthProfile: person.birthProfile, isMinor: person.isMinor },
    ownerObservations: observations.filter((item) => item.source === "owner_observation"),
    simulationCorrections: observations.filter((item) => item.source === "owner_correction"),
    realInteractions: related.filter((item) => item.status === "reported" && item.actionTaken),
    openLoops: related.filter((item) => item.status === "awaiting_action"),
    provenance: {
      excluded: ["simulation_output_as_person_fact", "unconfirmed_other_person_claim", "deleted_owner_observation"],
      ranking: ["real_world_feedback", "owner_correction", "repeated_owner_observation", "single_owner_observation", "symbolic_birth_reference"],
    },
  };
}

export function personMirrorInsight(context: PersonContext) {
  const latest = context.realInteractions[0];
  if (latest?.reflection) return `最近一次真实互动里，你记下了「${latest.reflection.slice(0, 84)}」。下一次先从这一点继续验证，不急着把它变成结论。`;
  if (latest) return "你已经把一次练习带回现实了。下一次先沿着真实发生过的部分继续，而不是重新猜 TA 的想法。";
  if (context.ownerObservations.length) return `你已经留下 ${context.ownerObservations.length} 条自己的观察。下一次最值得区分的，是 TA 在抗拒事情本身，还是在抗拒目前的沟通方式。`;
  return "先从一件最近发生的具体事开始；不急着判断 TA 是怎样的人。";
}
