import type { MirrorReflection, ReflectionDraftPayload, StoredMirrorReflection } from "../reflection/types.js";

export const MEMORY_PROCESSING_VERSION = 1;

export type MemorySourceEvent = {
  id: string;
  user_id: string;
  question: string;
  hexagram_result: ReflectionDraftPayload["hexagram"];
  knowledge_context: ReflectionDraftPayload["knowledge"];
  reflection: StoredMirrorReflection;
  saved_at: Date;
};

export type ExtractedMemory = {
  event: {
    title: string;
    topic: string;
    triggerText: string;
    summary: string;
  };
  reflection: MirrorReflection & { concepts: string[] };
};
