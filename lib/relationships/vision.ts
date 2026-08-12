import type { ExtractedConversation, ExtractedRelationshipMessage } from "./types.js";

export type ChatBubbleSide = "left" | "right" | "center" | "unknown";

export function speakerFromBubbleSide(side: ChatBubbleSide): "user" | "other" | "unknown" {
  if (side === "right") return "user";
  if (side === "left") return "other";
  return "unknown";
}

export function inferredUserSideFromBubbles(sides: ChatBubbleSide[]): "right" | "unknown" {
  return sides.some((side) => side === "left" || side === "right") ? "right" : "unknown";
}

function comparableMessage(message: Pick<ExtractedRelationshipMessage, "speaker" | "text">) {
  return `${message.speaker}:${message.text.replace(/\s+/gu, "").replace(/[，。！？,.!?“”"']/gu, "").toLowerCase()}`;
}

export function mergeExtractedConversation(conversation: ExtractedConversation | undefined): ExtractedRelationshipMessage[] {
  if (!conversation) return [];
  const pages = [...conversation.pages].sort((a, b) => a.order - b.order);
  const merged: ExtractedRelationshipMessage[] = [];
  for (const page of pages) {
    const messages = page.messages.map((message, messageOrder) => ({ ...message, attachmentId: page.attachmentId, pageOrder: page.order, messageOrder }));
    const maximum = Math.min(merged.length, messages.length, 20);
    let overlap = 0;
    for (let size = maximum; size > 0; size -= 1) {
      const tail = merged.slice(-size).map(comparableMessage);
      const head = messages.slice(0, size).map(comparableMessage);
      if (tail.every((item, index) => item === head[index])) { overlap = size; break; }
    }
    merged.push(...messages.slice(overlap));
  }
  return merged;
}

export function extractedConversationText(messages: ExtractedRelationshipMessage[]) {
  return messages.map((message) => `${message.speaker === "user" ? "我" : message.speaker === "other" ? "TA" : "画面提示／说话人待确认"}：${message.text}`).join("\n");
}
