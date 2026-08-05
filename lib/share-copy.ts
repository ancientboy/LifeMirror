export type ShareCopySet = {
  warm: string;
  roast: string;
  witty: string;
};

const PREFIX = /^(?:翻译(?:一下|成人话)?|人话(?:版)?|暖心(?:版)?|清醒(?:版)?|轻?毒舌(?:版)?|朋友(?:版)?)[：:\s]+/u;
const END_PUNCTUATION = /[。！？!?]$/u;

function compact(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().replace(PREFIX, "").replace(/\s+/g, " ");
}

/** Keep a share card to one self-contained sentence. */
export function oneLineShareCopy(value: unknown, fallback: string, maxCharacters = 46) {
  const source = compact(value) || compact(fallback);
  const firstSentence = source.match(/^.*?[。！？!?](?=\s|$|[^。！？!?])/u)?.[0] ?? source;
  const characters = [...firstSentence.replace(/[。！？!?]+$/u, "")];
  const shortened = characters.length > maxCharacters
    ? `${characters.slice(0, maxCharacters - 1).join("").replace(/[，、；：,:;\s]+$/u, "")}…`
    : characters.join("");
  if (!shortened) return compact(fallback);
  return END_PUNCTUATION.test(shortened) || shortened.endsWith("…") ? shortened : `${shortened}。`;
}

function signature(value: string) {
  return new Set([...value.replace(/[\s，。！？、；：,.!?;:'“”‘’…—-]/gu, "")]);
}

function similarity(first: string, second: string) {
  const a = signature(first);
  const b = signature(second);
  if (!a.size || !b.size) return 0;
  const shared = [...a].filter((character) => b.has(character)).length;
  return shared / Math.min(a.size, b.size);
}

/** Normalize length and reject model output whose variants are effectively duplicates. */
export function distinctShareCopy(input: Partial<ShareCopySet>, fallback: ShareCopySet): ShareCopySet {
  const warm = oneLineShareCopy(input.warm, fallback.warm);
  let roast = oneLineShareCopy(input.roast, fallback.roast);
  let witty = oneLineShareCopy(input.witty, fallback.witty);

  if (similarity(warm, roast) >= 0.82) roast = oneLineShareCopy(fallback.roast, fallback.roast);
  if (similarity(warm, witty) >= 0.82 || similarity(roast, witty) >= 0.82) witty = oneLineShareCopy(fallback.witty, fallback.witty);

  return { warm, roast, witty };
}
