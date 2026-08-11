const PRIVATE_MARKERS = [
  /(?:\+?86[-\s]?)?1[3-9]\d{9}/u,
  /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/u,
  /(?:19|20)\d{2}[年./-]\d{1,2}[月./-]\d{1,2}(?:日)?/u,
  /(?:经度|纬度|坐标|出生(?:时间|日期|地点)|身份证|住址|地址|电话|手机号|邮箱)/u,
  /(?:-?\d{1,3}\.\d{4,}\s*[,，]\s*-?\d{1,3}\.\d{4,})/u,
];

const FALLBACKS = {
  paper: "此刻先把自己听清，也是一种向前。",
  night: "我们不急着猜，愿意说清就有下一步。",
  character: "也生成你的镜像，看看我们各自看见什么。",
} as const;

export type PublicShareVariant = keyof typeof FALLBACKS;

function clean(value: string, max: number) {
  return [...value.replace(/\s+/g, " ").trim()].slice(0, max).join("");
}

/** A share is public by default. If a model ever returns an identifying detail, prefer a safe generic line. */
export function safePublicShareText(value: string, variant: PublicShareVariant) {
  const candidate = clean(value, 52);
  if (!candidate || PRIVATE_MARKERS.some((pattern) => pattern.test(candidate))) return FALLBACKS[variant];
  return candidate;
}

/** Metadata is less visible than the quote but crosses the same public boundary. */
export function safePublicShareMeta(value: string, variant: PublicShareVariant) {
  const candidate = clean(value, 56);
  if (!candidate || PRIVATE_MARKERS.some((pattern) => pattern.test(candidate))) {
    return variant === "character" ? "生成你的镜像，和我对照看看" : variant === "night" ? "这像我们吗？" : "一段来自拾光的镜像";
  }
  return candidate;
}
