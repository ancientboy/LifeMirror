import type { KnowledgeConflict, KnowledgeMatch, KnowledgePack, KnowledgeQuery, KnowledgeRetrievalResult } from "./types.js";
import { KnowledgePackRegistry } from "./registry.js";

const tokenize = (value: string) => new Set(value.toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean));
const intersects = (left: string[], right: string[]) => left.some((value) => right.includes(value));

function score(pack: KnowledgePack, entry: KnowledgePack["entries"][number], query: KnowledgeQuery) {
  const reasons: string[] = [];
  let applicability = entry.confidence * 0.25;
  const queryTokens = tokenize(query.text);
  const entryTokens = tokenize([entry.title, entry.content, ...entry.keywords].join(" "));
  const searchableText = [entry.title, entry.content, ...entry.keywords].join(" ").toLocaleLowerCase();
  const normalizedQuery = query.text.toLocaleLowerCase();
  const overlap = [...queryTokens].filter((token) => entryTokens.has(token) || searchableText.includes(token)).length
    + entry.keywords.filter((keyword) => normalizedQuery.includes(keyword.toLocaleLowerCase())).length;
  if (overlap > 0) { applicability += Math.min(0.4, overlap * 0.1); reasons.push("text"); }
  if (query.domains?.length && intersects(query.domains, entry.domains)) { applicability += 0.25; reasons.push("domain"); }
  if (query.intent && entry.intents.includes(query.intent)) { applicability += 0.2; reasons.push("intent"); }
  if (query.locale && pack.scope.locales.includes(query.locale)) { applicability += 0.1; reasons.push("locale"); }
  return { applicability: Math.min(1, applicability), reasons };
}

function detectConflicts(matches: KnowledgeMatch[]): KnowledgeConflict[] {
  const claims = new Map<string, Map<string, KnowledgeMatch[]>>();
  for (const match of matches) for (const claim of match.entry.claims ?? []) {
    const values = claims.get(claim.key) ?? new Map<string, KnowledgeMatch[]>();
    values.set(claim.value, [...(values.get(claim.value) ?? []), match]);
    claims.set(claim.key, values);
  }
  return [...claims.entries()].filter(([, values]) => values.size > 1).map(([key, values]) => ({
    key,
    values: [...values.entries()].map(([value, claimMatches]) => ({ value, trace: claimMatches[0].trace })),
  }));
}

export function retrieveKnowledge(registry: KnowledgePackRegistry, query: KnowledgeQuery): KnowledgeRetrievalResult {
  const minimumConfidence = query.minimumConfidence ?? 0;
  const matches = registry.list().filter((pack) => !query.packIds || query.packIds.includes(pack.id)).flatMap((pack) => pack.entries
    .filter((entry) => entry.confidence >= minimumConfidence)
    .map((entry): KnowledgeMatch | undefined => {
      const { applicability, reasons } = score(pack, entry, query);
      if (reasons.length === 0 && query.text.trim()) return undefined;
      const sources = entry.sourceIds.map((id) => pack.sources.find((source) => source.id === id)).filter((source): source is KnowledgePack["sources"][number] => Boolean(source));
      return { entry, pack: { id: pack.id, version: pack.version, name: pack.name }, applicability, matchedBy: reasons, sources, trace: { packId: pack.id, packVersion: pack.version, entryId: entry.id, sourceIds: entry.sourceIds } };
    }).filter((match): match is KnowledgeMatch => Boolean(match)))
    .sort((a, b) => b.applicability - a.applicability || b.entry.confidence - a.entry.confidence)
    .slice(0, query.limit ?? 10);
  return { matches, conflicts: detectConflicts(matches) };
}
