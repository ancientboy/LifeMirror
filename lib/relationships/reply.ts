import type { ExtractedRelationshipMessage, RelationshipGoal, RelationshipReplyOption } from "./types.js";

const META_REPLY = /截图|识别|气泡|左边|右边|这句是.{0,8}(谁|你).{0,4}(说|问)|你问的吗|我以为|跟你聊/u;
const REPLY_GOALS = new Set<RelationshipGoal>(["draft_reply", "repair", "set_boundary", "refuse", "prepare_conversation"]);

function comparableText(value: string) {
  return value.replace(/^[“"「]|[”"」]$/gu, "").replace(/\s+/gu, "").replace(/[，。！？,.!?～~“”"']/gu, "").toLowerCase();
}

export function shouldGenerateRelationshipReply(input: { userNote: string; goal: RelationshipGoal; messages: ExtractedRelationshipMessage[] }) {
  if (REPLY_GOALS.has(input.goal) || /怎么回|如何回|回什么|回复什么|发什么|说什么|补一句|帮我回|帮我写/u.test(input.userNote)) return true;
  return !input.userNote.trim() && [...input.messages].reverse().find((message) => message.speaker !== "unknown")?.speaker === "other";
}

export function validRelationshipReply(option: RelationshipReplyOption, messages: ExtractedRelationshipMessage[]) {
  const text = option.text.trim();
  if (text.length < 1 || text.length > 180 || META_REPLY.test(text)) return false;
  const comparable = comparableText(text);
  if (!comparable) return false;
  return !messages.some((message) => message.speaker === "other" && comparableText(message.text) === comparable);
}

export function filterRelationshipReplies(options: RelationshipReplyOption[], messages: ExtractedRelationshipMessage[]) {
  const unique = new Set<string>();
  return options.filter((option) => {
    const key = comparableText(option.text);
    if (unique.has(key) || !validRelationshipReply(option, messages)) return false;
    unique.add(key); return true;
  }).slice(0, 3);
}
