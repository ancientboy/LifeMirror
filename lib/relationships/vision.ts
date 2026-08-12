export type ChatBubbleSide = "left" | "right" | "center" | "unknown";

export function speakerFromBubbleSide(side: ChatBubbleSide): "user" | "other" | "unknown" {
  if (side === "right") return "user";
  if (side === "left") return "other";
  return "unknown";
}

export function inferredUserSideFromBubbles(sides: ChatBubbleSide[]): "right" | "unknown" {
  return sides.some((side) => side === "left" || side === "right") ? "right" : "unknown";
}
