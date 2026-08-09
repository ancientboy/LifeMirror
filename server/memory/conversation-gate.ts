export type ExplicitFactKind = "explicit_memory" | "confirmed_event" | "communication_preference";

export type AcceptedConversationMemory = { text: string; kind: ExplicitFactKind };

/**
 * The only automatic conversation-to-memory gate. Ordinary chat is deliberately
 * excluded: a transcript may be History, but is not a durable user fact.
 */
export function acceptConversationMemory(message: string): AcceptedConversationMemory | null {
  const text = message.replace(/\s+/g, " ").trim();
  const explicit = text.match(/^(?:请|帮我|你)?记住(?:一下)?[：:，,\s]*(.{2,500})$/);
  if (explicit?.[1]) return { text: explicit[1].trim(), kind: "explicit_memory" };
  const preference = text.match(/(?:我(?:比较)?喜欢|我希望你|请你以后)(.{2,500})$/);
  if (preference?.[1] && /(?:直接|别|不要|少|多|详细|简洁|追问|鸡汤|结论|语气)/.test(preference[1])) {
    return { text, kind: "communication_preference" };
  }
  const confirmed = text.match(/^(?:我确认|已经确定|后来证实)[：:，,\s]*(.{2,500})$/);
  if (confirmed?.[1]) return { text: confirmed[1].trim(), kind: "confirmed_event" };
  return null;
}
