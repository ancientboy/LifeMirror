export type HomeSnapshot = {
  settings: Record<string, unknown>;
  facts: unknown[];
  history: unknown[];
  tarot: unknown[];
  chats: unknown[];
};

type ChatLike = { messages?: Array<{ role?: string; text?: string }> };

function array(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function hasUserChat(chats: unknown[]) {
  return chats.some((thread) => {
    if (!thread || typeof thread !== "object") return false;
    return array((thread as ChatLike).messages).some((message) => message?.role === "user" && Boolean(message.text?.trim()));
  });
}

/**
 * Home onboarding is only for a genuinely empty mirror. An established user
 * must not be treated as new merely because the current chat thread is empty.
 */
export function isNewHomeExperience(snapshot: HomeSnapshot) {
  const settings = snapshot.settings && typeof snapshot.settings === "object" ? snapshot.settings : {};
  return !settings.birthProfile
    && array(settings.lifeEventLoops).length === 0
    && !array(settings.dailyLoop).some((item) => item && typeof item === "object" && Boolean((item as { status?: unknown }).status))
    && snapshot.facts.length === 0
    && snapshot.history.length === 0
    && snapshot.tarot.length === 0
    && !hasUserChat(snapshot.chats);
}

/** Only inputs that can change today's guidance belong in this signature. */
export function dailyEvidenceFingerprint(snapshot: HomeSnapshot, runtime: unknown = null) {
  const settings = snapshot.settings && typeof snapshot.settings === "object" ? snapshot.settings : {};
  const checkedInDays = array(settings.dailyLoop).filter((item) => item && typeof item === "object" && Boolean((item as { status?: unknown }).status));
  return JSON.stringify({
    birthProfile: settings.birthProfile ?? null,
    history: snapshot.history,
    facts: snapshot.facts,
    lifeEventLoops: array(settings.lifeEventLoops),
    checkedInDays,
    runtime,
  });
}
