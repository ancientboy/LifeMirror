"use client";

import { ArrowRight, CircleNotch, Sparkle, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { ShareQuoteCard } from "./ShareQuoteCard";
import styles from "./UnifiedMirrorResult.module.css";
import { buildJudgmentFactPack } from "@/lib/shiguang-judgment";
import { saveMirrorHistory } from "@/lib/mirror-history";

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
  initialResult?: MirrorResult;
  historical?: boolean;
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

function shareLine(value: unknown, fallback: string, used: string[], variant: "warm" | "roast" | "witty") {
  const source = clean(value, fallback, 80)
    .replace(/[。！？!?]+$/u, "")
    .replace(/\s+/g, " ");
  const line = [...source].slice(0, 46).join("");
  const normalized = line.replace(/[，。！？、\s]/g, "");
  const overlap = (left: string, right: string) => {
    const grams = (text: string) => new Set(Array.from({ length: Math.max(0, text.length - 1) }, (_, index) => text.slice(index, index + 2)));
    const a = grams(left), b = grams(right);
    const common = [...a].filter((item) => b.has(item)).length;
    return common / Math.max(1, Math.min(a.size, b.size));
  };
  const wrongScene = variant === "warm" ? /(?:对照|回应|发给|TA)/u.test(line)
    : variant === "roast" ? !/(?:你|我们|回应|说清|沉默|一起)/u.test(line)
      : !/(?:你|对照|也看看|一起)/u.test(line);
  if (wrongScene || used.some((item) => item === normalized || item.includes(normalized) || normalized.includes(item) || overlap(item, normalized) >= 0.72)) {
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
      warm: shareLine(cards.warm, fallback.shareCards.warm, used, "warm"),
      roast: shareLine(cards.roast, fallback.shareCards.roast, used, "roast"),
      witty: shareLine(cards.witty, fallback.shareCards.witty, used, "witty"),
    },
  };
}

function isCompleteModelResult(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const input = value as Record<string, unknown>;
  const forbidden = /翻译(?:一下|成人话)?|人话(?:版)?|基础规则|拾光\s*AI|模型|系统提示/u;
  const prose = [input.headline, input.interpretation, input.action, input.reflectionQuestion];
  if (prose.some((item) => typeof item !== "string" || item.trim().length < 8 || forbidden.test(item))) return false;
  if (!input.shareCards || typeof input.shareCards !== "object") return false;
  const cards = input.shareCards as Record<string, unknown>;
  return [cards.warm, cards.roast, cards.witty].every((item) => typeof item === "string" && item.trim().length >= 8 && item.trim().length <= 70 && !forbidden.test(item));
}

function contextualFallback(fallback: MirrorResult, question: string, facts: string): MirrorResult {
  const anchor = clean(fallback.headline, "此刻有一件事值得认真对待", 52).replace(/[。！？!?]+$/u, "");
  const detail = clean(fallback.interpretation, anchor, 120)
    .split(/[。；]/u).map((item) => item.trim()).find((item) => item.length >= 8) ?? anchor;
  const relationship = /关系|对方|彼此|感情|伴侣|朋友|联系|复合/u.test(`${question}${facts}`);
  const career = /工作|职业|事业|项目|面试|方向|行动/u.test(`${question}${facts}`);
  const subject = relationship ? "我们" : career ? "这一步" : "这件事";
  return {
    ...fallback,
    shareCards: {
      warm: `${anchor}。`,
      roast: relationship ? `${subject}卡住的，不只是沉默，还有谁先认真回应。` : `${subject}别只停在猜测里，愿意说清才有下一步。`,
      witty: `我的镜像落在“${detail.slice(0, 18)}”，也看看你的会指向哪里。`,
    },
  };
}

export function UnifiedMirrorResult({ kind, theme, question, facts, fallback, title, meta, image, onResolved, initialResult, historical = false }: Props) {
  const [result, setResult] = useState(initialResult ?? fallback);
  const [mode, setMode] = useState<"loading" | "ai" | "basic">(historical ? "ai" : "loading");
  const [saved, setSaved] = useState(false);
  const requestKey = useMemo(() => JSON.stringify({ kind, question, facts }), [facts, kind, question]);
  const resultFallback = useMemo(() => contextualFallback(fallback, question, facts), [fallback, facts, question]);
  const factPack = useMemo(() => buildJudgmentFactPack(kind, facts), [facts, kind]);

  useEffect(() => {
    if (historical) {
      const saved = initialResult ? sanitize(initialResult, resultFallback) : resultFallback;
      setResult(saved);
      setMode("ai");
      onResolved?.(saved);
      return;
    }
    const controller = new AbortController();
    setResult(resultFallback);
    setMode("loading");
    void fetch("/api/shiguang", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: "mirror_result",
        kind,
        theme,
        context: facts,
        factPack,
        messages: [{ role: "user", content: question }],
      }),
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error("mirror_ai_unavailable");
      const raw = extractJson(await response.text());
      if (!isCompleteModelResult(raw)) throw new Error("mirror_ai_quality_rejected");
      const next = sanitize(raw, resultFallback);
      setResult(next);
      setMode("ai");
      onResolved?.(next);
    }).catch((error) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setResult(resultFallback);
      setMode("basic");
      onResolved?.(resultFallback);
    });
    return () => controller.abort();
    // fallback and callback intentionally follow the deterministic request key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historical, initialResult, requestKey, resultFallback, theme]);

  function saveToMirror() {
    saveMirrorHistory({
      source: kind, sourceLabel: labels[kind], question, summary: result.headline,
      meta, factIds: factPack.facts.map((fact) => fact.id),
      reflection: {
        headline: result.headline, shareableReflection: result.shareCards.warm,
        shiguangInterpretation: result.interpretation, practicalGuidance: result.action,
        reflectionQuestion: result.reflectionQuestion,
      },
    });
    setSaved(true);
  }

  return <section className={`${styles.shell} ${styles[theme]}`} aria-live="polite">
    <header><div><small><Sparkle /> 拾光解读 · {labels[kind]}{historical ? " · 上次测算" : ""}</small><h2>{result.headline}</h2></div>{mode === "loading" && <span><CircleNotch className={styles.spin} />拾光正在组织语言</span>}</header>
    {mode === "basic" && <p className={styles.notice}><WarningCircle /> 拾光暂时无法完成本次解读。以下仅是基于已展示盘面生成的基础提示，不是 AI 改写结果。</p>}
    <div className={styles.grid}>
      <article><small>这对你意味着什么</small><p>{result.interpretation}</p></article>
      <article><small>现在可以做的一步</small><p>{result.action}</p></article>
    </div>
    <aside><small>想接着说的话</small><p>{result.reflectionQuestion}</p><a href={`/app/home/?continue=${encodeURIComponent(result.reflectionQuestion)}`}>和拾光继续聊 <ArrowRight /></a></aside>
    <button type="button" className={styles.notice} onClick={saveToMirror} disabled={saved}>{saved ? "已保存到我的镜像" : "保存这次镜像"}</button>
    <ShareQuoteCard theme={theme} title={title} quote={result.shareCards.warm} meta={meta} image={image} contentByVariant={{
      paper: { kicker: `我的此刻 · ${labels[kind]}`, quote: result.shareCards.warm, meta },
      night: { kicker: `关系回应 · ${labels[kind]}`, quote: result.shareCards.roast, meta: "这像我们吗？" },
      character: { kicker: `邀请对照 · ${labels[kind]}`, quote: result.shareCards.witty, meta: "生成你的镜像，和我对照看看" },
    }} />
  </section>;
}
