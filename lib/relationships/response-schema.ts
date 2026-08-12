import { z } from "zod";

export const relationshipAnswerSchema = z.object({
  judgment: z.object({ summary: z.string().min(2).max(500), facts: z.array(z.string().max(300)).max(6), hypotheses: z.array(z.string().max(300)).max(6), uncertainty: z.array(z.string().max(300)).max(4) }),
  replyOptions: z.array(z.object({ id: z.string().max(40), tone: z.enum(["natural", "warm", "direct", "boundary"]), text: z.string().min(1).max(500), why: z.string().max(300) })).min(1).max(4),
  recommendedReplyId: z.string().max(40).optional(),
  nextSignals: z.array(z.string().max(300)).min(1).max(5),
  safety: z.object({ level: z.enum(["normal", "caution", "urgent"]), reasonCodes: z.array(z.string().max(80)).max(8) }).optional(),
});

export type RelationshipAnswer = z.infer<typeof relationshipAnswerSchema>;

