export type ConversationMode = "general" | "relationship";

/**
 * Ordinary conversation is the neutral default. Relationship mode is entered
 * only through an explicit product action or a dedicated deep link; mentioning
 * another person inside a message must never change the surrounding UI mode.
 */
export function initialConversationMode(search: string, relationshipEntryEnabled = true): ConversationMode {
  if (!relationshipEntryEnabled) return "general";
  const scene = new URLSearchParams(search).get("scene");
  return scene === "relationship" ? "relationship" : "general";
}
