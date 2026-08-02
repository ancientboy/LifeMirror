import { createHmac, timingSafeEqual } from "node:crypto";
import type { ReflectionDraftPayload } from "./types.js";

function signature(content: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(content).digest();
}

export function sealReflectionDraft(payload: ReflectionDraftPayload, secret: string): string {
  const content = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${content}.${signature(content, secret).toString("base64url")}`;
}

export function openReflectionDraft(token: string, secret: string): ReflectionDraftPayload {
  const [content, encodedSignature, ...rest] = token.split(".");
  if (!content || !encodedSignature || rest.length > 0) throw new Error("invalid_reflection_token");

  const supplied = Buffer.from(encodedSignature, "base64url");
  const expected = signature(content, secret);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    throw new Error("invalid_reflection_token");
  }

  const payload = JSON.parse(Buffer.from(content, "base64url").toString("utf8")) as ReflectionDraftPayload;
  if ((payload.version !== 1 && payload.version !== 2 && payload.version !== 3 && payload.version !== 4 && payload.version !== 5) || new Date(payload.expiresAt).getTime() <= Date.now()) {
    throw new Error("expired_reflection_token");
  }
  return payload;
}
