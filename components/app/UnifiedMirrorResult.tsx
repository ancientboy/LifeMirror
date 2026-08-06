"use client";

import { ArrowRight, CircleNotch, Sparkle, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { ShareQuoteCard } from "./ShareQuoteCard";
import styles from "./UnifiedMirrorResult.module.css";

export type MirrorKind = "tarot" | "bazi" | "astrology";
export type MirrorResult = {
  headline: string;
  interpretation: string;
  action: string;
  reflectionQuestion: string;
  shareCards: { warm: string; roast: string; witty: string };
};

type Props = {
  kind: MirrorKind;
  theme: "east" | "west";
  question: string;
  facts: string;
  fallback: MirrorResult;
  title: string;
  meta: string;
  image: string;
  onResolved?: (result: MirrorResult) => void;
};

const labels: Record<MirrorKind, string> = {
  tarot: "塔罗镜像",
  bazi: "命盘镜像",
  astrology: "星盘镜像",
};

function clean(value: unknown, fallback: string, max = 700) {
  if (typeof value !== "string") return fallback;
  const text = [...value.trim().replace(/^(?:翻译(?:一下|成人话)?|人话(?:版)?)[：:\s]+/u, "")].slice(0, max).join("");
  return text.length >= 4 ? text : fallback;
}

function shareLine(value: unknown, fallback: string, used: string[]) {
  const source = clean(value, fallback, 80)
    .replace(/[。！？!?]+$/u, "")
    .replace(/\s+/g, " ");
  const line = [...source].slice(0, 46).join("");
  const normalized = line.replace(/[，。！？、\s]/g, "");
  if (used.some((item) => item === normalized || item.includes(normalized) || normalized.includes(item))) {
    const replacement = [...fallback.replace(/[。！？!?]+$/u, "")].slice(0, 46).join("");
    used.push(replacement.replace(/[，。！？、\s]/g, ""));
    return replacement;
  }
  used.push(normalized);
  return line;
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const source = fenced ?? text;
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("missing_json");
  return JSON.parse(source.slice(start, end + 1));
}

function sanitize(value: unknown, fallback: MirrorResult): MirrorResult {
  if (!value || typeof value !== "object") return fallback;
  const input = value as Record<string, unknown>;
  const cards = input.shareCards && typeof input.shareCards === "object" ? input.shareCards as Record<string, unknown> : {};
  const used: string[] = [];
  return {
    headline: clean(input.headline, fallback.headline, 260),
    interpretation: clean(input.interpretation, fallback.interpretation),
    action: clean(input.action, fallback.action, 420),
    reflectionQuestion: clean(input.reflectionQuestion, fallback.reflectionQuestion, 300),
    shareCards: {
      warm: shareLine(cards.warm, fallback.shareCards.warm, used),
      roast: shareLine(cards.roast, fallback.shareCards.roast, used),
      witty: shareLine(cards.witty, fallback.shareCards.witty, used),
    },
  };
}

export function UnifiedMirrorResult({ kind, theme, question, facts, fallback, title, meta, image, onResolved }: Props) {
  const [result, setResult] = useState(fallback);
  const [mode, setMode] = useState<"loading" | "ai" | "basic">("loading");
  const requestKey = useMemo(() => JSON.stringify({ kind, question, facts }), [facts, kind, question]);

  useEffect(() => {
    const controller = new AbortController();
    setResult(fallback);
    setMode("loading");
    void fetch("/api/shiguang", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: "mirror_result",
        kind,
        theme,
        context: facts,
        messages: [{ role: "user", content: question }],
      }),
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error("mirror_ai_unavailable");
      const next = sanitize(extractJson(await response.text()), fallback);
      setResult(next);
      setMode("ai");
      onResolved?.(next);
    }).catch((error) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setResult(fallback);
      setMode("basic");
      onResolved?.(fallback);
    });
    return () => controller.abort();
    // fallback and callback intentionally follow the deterministic request key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, theme]);

  return <section className={`${styles.shell} ${styles[theme]}`} aria-live="polite">
    <header><div><small><Sparkle /> 拾光解读 · {labels[kind]}</small><h2>{result.headline}</h2></div>{mode === "loading" && <span><CircleNotch className={styles.spin} />拾光正在组织语言</span>}</header>
    {mode === "basic" && <p className={styles.notice}><WarningCircle /> AI 暂时未完成改写，先显示可靠的基础解读。</p>}
    <div className={styles.grid}>
      <article><small>这对你意味着什么</small><p>{result.interpretation}</p></article>
      <article><small>现在可以做的一步</small><p>{result.action}</p></article>
    </div>
    <aside><small>把它说具体一点</small><p>{result.reflectionQuestion}</p><a href={`/app/home/?continue=${encodeURIComponent(result.reflectionQuestion)}`}>和拾光继续聊 <ArrowRight /></a></aside>
    <ShareQuoteCard theme={theme} title={title} quote={result.shareCards.warm} meta={meta} image={image} contentByVariant={{
      paper: { kicker: `我的此刻 · ${labels[kind]}`, quote: result.shareCards.warm, meta },
      night: { kicker: `关系回应 · ${labels[kind]}`, quote: result.shareCards.roast, meta: "这像我们吗？" },
      character: { kicker: `邀请对照 · ${labels[kind]}`, quote: result.shareCards.witty, meta: "生成你的镜像，和我对照看看" },
    }} />
  </section>;
}
