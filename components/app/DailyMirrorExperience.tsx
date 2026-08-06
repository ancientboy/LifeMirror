Warning: truncated output (original token count: 16756)
Total output lines: 912

"use client";

import { ArrowLeft, ArrowRight, CardsThree, ChartPolar, Check, CircleNotch, ClockCounterClockwise, DownloadSimple, Eye, FloppyDisk, Hexagon, LockKey, ShareNetwork, SignOut, Sparkle, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { LiuyaoKnowledgeContext } from "@/server/knowledge/liuyao-retrieval";
import type { LiuyaoReflectionKnowledge } from "@/server/knowledge/liuyao-reflection-map";
import type { LiuyaoAnalysisContext, LiuyaoIntentSelection, LiuyaoResult, LiuyaoTopicHint } from "@/server/tools/liuyao/types";
import { calculateLiuyao } from "@/server/tools/liuyao/engine";
import { createIntentSelection, resolveLiuyaoContext } from "@/server/tools/liuyao/context-resolver";
import { retrieveLiuyaoKnowledge } from "@/server/knowledge/liuyao-retrieval";
import { retrieveLiuyaoReflectionKnowledge } from "@/server/knowledge/liuyao-reflection-map";
import { buildLiuyaoPresentation, cleanLiuyaoText } from "@/server/reflection/liuyao-presentation";
import { MemoryControls } from "./MemoryControls";
import { ShareQuoteCard } from "./ShareQuoteCard";
import { ShiguangChat } from "./ShiguangChat";
import styles from "./DailyMirrorExperience.module.css";
import { markAccountDataChanged } from "@/lib/account-data";
import { createClientId } from "@/lib/client-id";

type CoinValue = 2 | 3;
type Toss = readonly [CoinValue, CoinValue, CoinValue];
type CastingPhase = "idle" | "shaking" | "tilting" | "falling" | "settling";
type PendingCast = { token: number; toss: Toss; previousTosses: Toss[] };
type ShareArtifact = { blob: Blob; file: File; url: string; canNativeShare: boolean };
type Stage = "home" | "question" | "cast" | "hexagram" | "traditional" | "mirror" | "reflectionQuestion" | "save" | "memory";
type Hexagram = LiuyaoResult;
type Knowledge = LiuyaoKnowledgeContext;
type ReflectionKnowledge = LiuyaoReflectionKnowledge;
type Reflection = {
  traditionalJudgment: string;
  reasoningExplanation: string;
  shiguangInterpretation: string;
  practicalGuidance: string;
  evidenceCards: Array<{ title: string; technical: string; plain: string; effect: "positive" | "negative" | "mixed" }>;
  closing?: { type: "banter" | "follow_up" | "observation" | "reflection"; text: string };
  reflectionQuestion?: string;
  shareableReflection: string;
  shareCards?: {
    warm: { title: string; quote: string; meta: string };
    witty: { title: string; quote: string; meta: string };
    roast: { title: string; quote: string; meta: string };
  };
};
type PreviousReflection = { shiguangSees: string; hexagramMeaning: string; mirrorUnderstanding: string; practicalGuidance: string; reflectionQuestion: string; shareableReflection: string };
type LegacyReflection = { observation: string; insight: string; reflectionQuestion: string; actionSuggestion: string };
type ExplanationTrace = { traditional_basis: string; liuyao_factors: string[]; reflection_mapping: string; final_response: Reflection };
type RuntimeTrace = { mode: { mode: "reflection" | "deep"; confidence: number }; evaluation: { level: string; score: number; flags: string[] }; stages: Array<{ name: string; status: string; detail?: string }> };
type ReflectionResponse = { question: string; hexagram: Hexagram; analysisContext?: LiuyaoAnalysisContext; knowledge: Knowledge; reflectionKnowledge: ReflectionKnowledge; reflection: Reflection; explanationTrace: ExplanationTrace; interactionMode?: "reflection" | "deep"; runtimeTrace?: RuntimeTrace; generationMode?: "ai" | "basic"; generationNotice?: string; draftToken: string; expiresAt: string };
type IntentResolution = {
  status: "resolved" | "confirmation_required";
  source: LiuyaoIntentSelection["resolution"]["source"];
  confidence: number;
  summary: string;
  selection?: LiuyaoIntentSelection;
  clarification?: { question: string; options: Array<{ id: string; label: string; selection: LiuyaoIntentSelection }> };
};
type HistoryEvent = { id: string; question: string; hexagram: Hexagram; reflection: Reflection | PreviousReflection | LegacyReflection; savedAt: string };

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
const GUEST_SESSION_KEY = "life-mirror:guest-session:v1";
const GUEST_HISTORY_KEY = "life-mirror:guest-history:v1";
const suggestions = ["我该如何看待现在的职业选择？", "这段关系正在提醒我什么？", "我为什么迟迟无法开始？"];
const topicOptions: Array<{ value: LiuyaoTopicHint; label: string }> = [
  { value: "career", label: "工作" }, { value: "wealth", label: "财运" },
  { value: "study", label: "考试学习" }, { value: "relationship", label: "感情" },
  { value: "health", label: "健康" }, { value: "family", label: "家庭" },
  { value: "travel", label: "出行日常" }, { value: "partnership", label: "合作" },
  { value: "legal", label: "争议法律" }, { value: "other", label: "其他" },
];
const lineNames = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];
const branchNames = { zi: "子", chou: "丑", yin: "寅", mao: "卯", chen: "辰", si: "巳", wu: "午", wei: "未", shen: "申", you: "酉", xu: "戌", hai: "亥" } as const;
const liuyaoRuleNames: Record<string, string> = {
  analysis_context_required: "判断条件说明", useful_god_by_topic: "按所问主题取用神", useful_god_multiple_candidates: "用神候选比较",
  hidden_spirit: "用神伏藏", month_strength: "月令旺衰", hexagram_body_location: "卦身位置", wandering_soul_structure: "游魂结构", returning_soul_structure: "归魂结构",
  single_moving_line: "独发", single_static_line: "独静", six_combine_structure: "六合结构", six_clash_structure: "六冲结构",
  moving_lines_repeat_fuyin: "伏吟线索", moving_lines_reverse_fanyin: "反吟线索", day_generates_useful: "日辰生用神", day_controls_useful: "日辰克用神",
  month_break: "月破", void_clashed_open: "冲空候选", moving_line_clashed: "动爻逢冲", hidden_movement: "暗动", day_break: "日破",
  moving_line_bound_by_combine: "动爻合绊", day_combine: "日辰相合", branch_harm_on_useful: "用神逢害", shi_line_changes: "世爻发动", ying_line_changes: "应爻发动",
  useful_generates_shi: "用神生世", useful_controls_shi: "用神克世", shi_generates_useful: "世爻生用", shi_controls_useful: "世爻克用",
  shi_use_clash: "世用相冲", shi_use_combine: "世用相合", ying_generates_shi: "应爻生世", ying_controls_shi: "应爻克世", shi_generates_ying: "世爻生应",
  source_god_moves: "原神发动", source_god_transforms_progress: "原神化进", source_god_transforms_retreat: "原神化退",
  avoid_god_moves: "忌神发动", avoid_god_transforms_progress: "忌神化进", avoid_god_transforms_retreat: "忌神化退",
  useful_god_void: "用神旬空", return_generation: "回头生", return_control: "回头克", transforms_progress: "化进神", transforms_retreat: "化退神",
  transforms_void: "化空", transforms_month_break: "化月破", azure_dragon_on_useful: "用神临青龙", vermilion_bird_on_useful: "用神临朱雀", white_tiger_on_useful: "用神临白虎",
  siblings_divide_wealth: "兄弟分财", hidden_spirit_supported: "伏神得扶", hidden_spirit_weak: "伏神偏弱", hidden_spirit_void: "伏神旬空",
  hidden_spirit_month_break: "伏神月破", flying_generates_hidden: "飞神生伏神", hidden_generates_flying: "伏神生飞神", hidden_controls_flying: "伏神克飞神",
  hidden_and_flying_same_element: "飞伏比和", job_search_documents: "求职文书与手续", job_search_employer_relation: "求职世应关系",
  exam_evaluation_conditions: "考试评价条件", relationship_contact_signal: "关系联络信号", reconciliation_shi_ying_clash: "复合世应相冲",
  reconciliation_shi_ying_combine: "复合世应相合", investment_risk_factor: "投资风险因素", health_illness_factor_active: "健康病象活跃",
  health_relief_controls_illness: "缓解力量发动", relationship_ying_generates_shi: "关系中应爻生世", relationship_ying_controls_shi: "关系中应爻克世",
  relationship_shi_generates_ying: "关系中世爻生应", shi_ying_relation_after_change: "变化后的世应关系",
};
const relationNames: Record<string, string> = { self: "兄弟", offspring: "子孙", wealth: "妻财", official: "官鬼", parent: "父母" };
function humanizeLiuyaoRule(rule: string) {
  if (/[㐀-鿿]/.test(rule)) return rule;
  if (liuyaoRuleNames[rule]) return liuyaoRuleNames[rule];
  if (rule.startsWith("shi_holds_")) return `世爻临${relationNames[rule.slice("shi_holds_".length)] ?? "六亲"}`;
  if (rule.startsWith("timing_")) return "应期观察窗口";
  if (rule.startsWith("topic_auxiliary_")) return "主题辅助线索";
  if (rule.startsWith("scenario_focus_")) return "情境重点";
  if (rule.startsWith("three_harmony_")) return "三合局线索";
  if (rule.includes("punishment")) return "用神逢刑";
  if (rule.includes("tomb")) return "用神入墓";
  if (rule.includes("flying_controls_hidden")) return "飞神克伏神";
  return "六爻结构线索";
}
function humanizeLiuyaoFactor(factor: string) {
  const separator = factor.indexOf(":");
  if (separator < 0) return cleanLiuyaoText(factor);
  return `${humanizeLiuyaoRule(factor.slice(0, separator))}：${cleanLiuyaoText(factor.slice(separator + 1))}`;
}
function verdictPresentation(direction: LiuyaoResult["judgment"]["verdicts"][number]["direction"]) {
  return ({
    favorable: { label: "吉", detail: "势可借，宜顺势推进", tone: "good" },
    mixed: { label: "平", detail: "有机会，也有拉扯", tone: "steady" },
    unfavorable: { label: "慎", detail: "阻力偏多，先守后动", tone: "careful" },
    undetermined: { label: "待定", detail: "条件未齐，暂不下断", tone: "unknown" },
  } as const)[direction];
}
const castingPhaseClass: Record<CastingPhase, string> = {
  idle: "",
  shaking: styles.coinShaking,
  tilting: styles.coinTilting,
  falling: styles.coinFalling,
  settling: styles.coinSettling,
};
const assetPath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

function loadCanvasImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const body = response.status === 204 ? undefined : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error ?? `request_failed_${response.status}`);
  return body as T;
}

function readableError(error: unknown): string {
  const code = error instanceof Error ? error.message : "unknown_error";
  const messages: Record<string, string> = {
    authentication_failed: "邮箱或密码不正确。",
    account_exists: "这个邮箱已经注册，请直接登录。",
    invalid_credentials: "请输入有效邮箱，密码至少 12 位。",
    reflection_runtime_unavailable: "AI Reflection 服务尚未配置，请稍后再试。",
    reflection_generation_failed: "这次反思生成没有完成，请重新尝试。",
    invalid_intent_input: "请先选一个方向，并把问题写具体一点。",
    Failed_to_fetch: "暂时无法连接 Life Mirror Runtime。",
  };
  return messages[code] ?? (code === "Failed to fetch" ? messages.Failed_to_fetch : "暂时无法完成操作，请稍后再试。");
}

function createToss(): Toss {
  const random = new Uint8Array(3);
  crypto.getRandomValues(random);
  const coin = (value: number): CoinValue => value % 2 === 0 ? 2 : 3;
  return [coin(random[0]), coin(random[1]), coin(random[2])];
}

function readGuestHistory(): HistoryEvent[] {
  try {
    const value = window.localStorage.getItem(GUEST_HISTORY_KEY);
    return value ? (JSON.parse(value) as HistoryEvent[]).slice(0, 20) : [];
  } catch {
    return [];
  }
}

function normalizeReflection(reflection: Reflection | PreviousReflection | LegacyReflection): Reflection {
  if ("traditionalJudgment" in reflection) return { ...reflection, evidenceCards: reflection.evidenceCards ?? [] };
  if ("shiguangSees" in reflection) return {
    traditionalJudgment: reflection.shiguangSees,
    reasoningExplanation: reflection.hexagramMeaning,
    shiguangInterpretation: reflection.mirrorUnderstanding,
    practicalGuidance: reflection.practicalGuidance,
    evidenceCards: [],
    reflectionQuestion: reflection.reflectionQuestion,
    shareableReflection: reflection.shareableReflection,
  };
  return {
    traditionalJudgment: reflection.observation,
    reasoningExplanation: reflection.insight,
    shiguangInterpretation: reflection.insight,
    practicalGuidance: reflection.actionSuggestion,
    evidenceCards: [],
    reflectionQuestion: reflection.reflectionQuestion,
    shareableReflection: reflection.insight,
  };
}

function cleanShareQuote(text: string) {
  return [...text.trim().replace(/^(?:翻译(?:一下|成人话)?|人话(?:版)?|暖心(?:版)?|轻毒舌(?:版)?)[：:\s]+/u, "").replace(/[。！？!?]+$/u, "")].slice(0, 46).join("");
}

function cleanReflectionShareCards(reflection: Reflection): Reflection {
  if (!reflection.shareCards) return reflection;
  return {
    ...reflection,
    shareCards: {
      warm: { ...reflection.shareCards.warm, quote: cleanShareQuote(reflection.shareCards.warm.quote) },
      witty: { ...reflection.shareCards.witty, quote: cleanShareQuote(reflection.shareCards.witty.quote) },
      roast: { ...reflection.shareCards.roast, quote: cleanShareQuote(reflection.shareCards.roast.quote) },
    },
  };
}

function createGuestReflection(question: string, hexagram: Hexagram, knowledge: Knowledge, reflectionKnowledge: ReflectionKnowledge, analysisContext?: LiuyaoAnalysisContext | null): ReflectionResponse {
  const directionText = { favorable: "偏向可以", mixed: "可以，但别把期待拉太满", unfavorable: "眼下不太占优势", undetermined: "暂时还不能定" } as const;
  const verdictText = hexagram.judgment.verdicts.map((item) => `${item.label}：${directionText[item.direction]}`).join("；");
  const decisive = hexagram.judgment.keyEvidence.slice(0, 4);
  const evidenceCards = decisive.map((item) => ({
    title: humanizeLiuyaoRule(item.rule),
    technical: item.technicalText ?? item.conclusion,
    plain: item.plainMeaning ?? item.conclusion,
    effect: item.effect === "support" ? "positive" as const : item.effect === "obstruct" ? "negative" as const : "mixed" as const,
  }));
  const technicalStory = decisive.map((item) => cleanLiuyaoText(item.technicalText ?? item.conclusion)).join("；");
  const plainStory = decisive.map((item) => cleanLiuyaoText(item.plainMeaning ?? item.conclusion)).join(" ");
  const playful = hexagram.judgment.tone === "playful";
  const investment = analysisContext?.scenario === "investment" || analysisContext?.intents?.some((intent) => intent.scenario === "investment");
  const careful = hexagram.judgment.tone === "careful";
  const reflection: Reflection = {
    traditionalJudgment: `${playful ? "先说结果" : "先说结论"}：${verdictText || "暂时还不能定"}。`,
    reasoningExplanation: technicalStory || `${hexagram.originalHexagram.name}之${hexagram.changedHexagram.name}，目前只保留卦象层面的方向。`,
    shiguangInterpretation: plainStory || knowledge.original.symbolic.interpretation,
    practicalGuidance: playful ? "把它当成开心局，安排别太死，也别为了输赢把气氛打紧。" : investment ? "先核验标的、仓位、最大可承受损失和退出条件；卦里的方向不能代替财务判断。" : careful ? "把卦里的线索当成风险提醒，再交给现实检查、证据或专业意见确认。" : "先照卦里最强的助力和阻力各核实一件现实条件，再决定投入多少。",
    evidenceCards,
    closing: playful ? { type: "follow_up", text: "真去了回来跟我说说，这卦到底猜中了几分。" } : { type: "observation", text: "先看现实有没有回应卦里这股力，再决定下一步。" },
    shareableReflection: playful ? "今天更值得赢到开心，不必把每一分输赢都算得太重。" : `${knowledge.original.name}走向${knowledge.changed.name}：先按眼前最清楚的条件，决定下一步。`,
    shareCards: {
      warm: {
        title: "",
        quote: playful ? "今天值得赢到开心，不必把快乐也做成绩效" : `我不是没有答案，只是还想给变化留一点余地`,
        meta: `${knowledge.original.name} → ${knowledge.changed.name} · 我的此刻`,
      },
      witty: {
        title: "",
        quote: playful ? "换你来照一次，看看谁更会把快乐想复杂" : `也生成一次你的镜像，看看我们会不会困在同一处`,
        meta: `${knowledge.original.name} → ${knowledge.changed.name} · 邀请对照`,
      },
      roast: {
        title: "",
        quote: playful ? "我想要的是一起开心，不是再比一次谁输谁赢" : "我们都在等对方先靠近，所以这件事才一直悬着",
        meta: `${knowledge.original.name} → ${knowledge.changed.name} · 关系回应`,
      },
    },
  };
  return {
    question: question.trim(),
    hexagram,
    analysisContext: analysisContext ?? undefined,
    knowledge,
    reflectionKnowledge,
    reflection,
    explanationTrace: {
      traditional_basis: knowledge.readingRule.focus.map((item) => `${item.label}: ${item.text}`).join("；"),
      liuyao_factors: hexagram.evidence.map((item) => `${item.rule}: ${item.conclusion}`),
      reflection_mapping: reflectionKnowledge.mappings.map((item) => `${item.traditionalConcept} → ${item.humanMeaning}`).join("；"),
      final_response: reflection,
    },
    generationMode: "basic",
    generationNotice: "本次为基础解读",
    draftToken: `guest-${createClientId()}`,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };
}

function LineGlyph({ polarity, moving }: { polarity: "yin" | "yang"; moving?: boolean }) {
  return <span className={`${styles.lineGlyph} ${styles[polarity]}${moving ? ` ${styles.moving}` : ""}`} aria-label={`${polarity === "yang" ? "阳爻" : "阴爻"}${moving ? "，动爻" : ""}`}><i /><i /></span>;
}

export function DailyMirrorExperience({ initialStage = "home" }: { initialStage?: "home" | "question" } = {}) {
  const [stage, setStage] = useState<Stage>(initialStage);
  const [authState, setAuthState] = useState<"checking" | "signedOut" | "guest" | "authenticated">("checking");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [question, setQuestion] = useState("");
  const [topicHint, setTopicHint] = useState<LiuyaoTopicHint | "">("");
  const [intentSelection, setIntentSelection] = useState<LiuyaoIntentSelection | null>(null);
  const [intentClarification, setIntentClarification] = useState<IntentResolution["clarification"] | null>(null);
  const [tosses, setTosses] = useState<Toss[]>([]);
  const [hexagram, setHexagram] = useState<Hexagram | null>(null);
  const [knowledge, setKnowledge] = useState<Knowledge | null>(null);
  const [reflectionKnowledge, setReflectionKnowledge] = useState<ReflectionKnowledge | null>(null);
  const [analysisContext, setAnalysisContext] = useState<LiuyaoAnalysisContext | null>(null);
  const [reflectionResult, setReflectionResult] = useState<ReflectionResponse | null>(null);
  const [interactionMode, setInteractionMode] = useState<"reflection" | "deep">("reflection");
  const [history, setHistory] = useState<HistoryEvent[]>([]…6756 tokens truncated…ack}>{Array.from({ length: 6 }, (_, reverseIndex) => 5 - reverseIndex).map((index) => { const lineValue = tosses[index]?.reduce((sum, value) => sum + value, 0); const polarity = lineValue === 6 || lineValue === 8 ? "yin" : "yang"; return <div className={tosses[index] ? styles.lineReady : ""} key={index}><small>{lineNames[index]}</small>{tosses[index] ? <LineGlyph polarity={polarity} moving={lineValue === 6 || lineValue === 9} /> : <span className={styles.linePlaceholder} />}</div>; })}</div>
            <div className={styles.castControls}>
              <button className={styles.castButton} onClick={castLine} disabled={casting || busy || tosses.length === 6}>{casting ? <><CircleNotch className={styles.spin} /><span>正在成爻…</span></> : tosses.length === 6 ? <><Check /><span>六爻已成</span></> : <><span>{tosses.length === 0 ? "开始摇卦" : "再摇一次"}</span><small>第 {tosses.length + 1} 次</small></>}</button>
              <button className={styles.quickCastButton} type="button" onClick={completeCastRandomly} disabled={casting || busy || tosses.length === 6} aria-label={tosses.length === 0 ? "一键随机生成完整六爻" : `随机完成剩余 ${6 - tosses.length} 爻`}><Sparkle /><span>{tosses.length === 0 ? "一键随机六爻" : `随机完成剩余 ${6 - tosses.length} 爻`}</span></button>
              <p>{tosses.length} / 6 爻已形成</p>
            </div>
            {error && <div className={styles.error} role="alert">{error}</div>}
            {tosses.length === 6 && !hexagram && !busy && <button className={styles.secondaryButton} onClick={() => { setError(""); void calculateCompletedHexagram(tosses); }}>重新计算卦象</button>}
            {hexagram && <button className={styles.primaryButton} onClick={() => setStage("hexagram")}>揭示卦象 <Eye /></button>}
          </div>
        </section>
      )}

      {stage === "hexagram" && hexagram && knowledge && (
        <section className={styles.resultScreen}>
          <button className={styles.backButton} onClick={() => setStage("cast")}><ArrowLeft /> 返回</button>
          <div className={styles.resultHeader}><span>03 · YOUR HEXAGRAM</span><h1>你的卦象</h1><p>先看清本卦、动爻与变卦，再进入传统解释。</p></div>
          <div className={styles.verdictStrip} aria-label="本次卦象倾向">
            {hexagram.judgment.verdicts.map((verdict) => { const display = verdictPresentation(verdict.direction); return <article className={styles[display.tone]} key={verdict.intentId}><b>{display.label}</b><div><small>{verdict.label} · 整体倾向</small><strong>{display.detail}</strong><p>{verdict.shortReason}</p></div></article>; })}
            <span>这是卦象的阶段性倾向，不替代现实核验与决定。</span>
          </div>
          <div className={styles.hexagramReveal}>
            <article><span className={styles.hexSymbol}>{hexagram.originalHexagram.symbol}</span><small>本卦 · 第 {hexagram.originalHexagram.number} 卦</small><h2>{hexagram.originalHexagram.name}</h2><p>{hexagram.originalHexagram.upperTrigram.nature}上 · {hexagram.originalHexagram.lowerTrigram.nature}下</p></article>
            <div className={styles.revealLines}>{[...hexagram.lines].reverse().map((line) => <div key={line.position}><small>{lineNames[line.position - 1]}</small><LineGlyph polarity={line.polarity} moving={line.moving} /></div>)}</div>
            <div className={styles.changeArrow}><span>{hexagram.movingLines.length ? `${hexagram.movingLines.join("、")} 爻动` : "无动爻"}</span><ArrowRight /></div>
            <article><span className={styles.hexSymbol}>{hexagram.changedHexagram.symbol}</span><small>变卦 · 第 {hexagram.changedHexagram.number} 卦</small><h2>{hexagram.changedHexagram.name}</h2><p>{hexagram.changedHexagram.upperTrigram.nature}上 · {hexagram.changedHexagram.lowerTrigram.nature}下</p></article>
          </div>
          <div className={styles.hexagramSummary}>
            <article><small>本卦象征</small><h2>{knowledge.original.symbolic.meaning}</h2><p>{knowledge.original.symbolic.interpretation}</p></article>
            <article><small>变卦象征</small><h2>{knowledge.changed.symbolic.meaning}</h2><p>{knowledge.changed.symbolic.interpretation}</p></article>
          </div>
          {error && <div className={styles.error} role="alert">{error}</div>}
          {authState === "authenticated" && <div className={styles.modeSelector} role="group" aria-label="分析深度"><button type="button" aria-pressed={interactionMode === "reflection"} className={interactionMode === "reflection" ? styles.modeActive : ""} onClick={() => setInteractionMode("reflection")}><b>清晰解读</b><small>直接回答，给出重点依据</small></button><button type="button" aria-pressed={interactionMode === "deep"} className={interactionMode === "deep" ? styles.modeActive : ""} onClick={() => setInteractionMode("deep")}><b>深度分析</b><small>展开推理、反向信号与条件</small></button></div>}
          <button className={styles.primaryButton} disabled={busy} onClick={generateReflection}>{busy ? <><CircleNotch className={styles.spin} /> 正在整理传统判断…</> : <>查看这次卦象的判断 <ArrowRight /></>}</button>
        </section>
      )}

      {stage === "traditional" && reflectionResult && hexagram && knowledge && (
        <section className={styles.resultScreen}>
          <button className={styles.backButton} onClick={() => setStage("hexagram")}><ArrowLeft /> 返回卦象</button>
          <div className={styles.resultHeader}><span>04 · LIUYAO READING</span><h1>先回答你的问题。</h1><p>先给结果，再说这卦怎么看。反思不会抢在答案前面。</p></div>
          <article className={styles.judgmentCard}><small>拾光先说</small><h2>{reflectionResult.question}</h2><p>{reflectionResult.reflection.traditionalJudgment}</p></article>
          {reflectionResult.generationMode === "basic" && reflectionResult.generationNotice && <div className={styles.basicNotice} role="status">{reflectionResult.generationNotice}</div>}
          <section className={styles.reasoningCard}><small>这卦怎么看 · LIUYAO REASONING</small><h2>{reflectionResult.hexagram.originalHexagram.name} → {reflectionResult.hexagram.changedHexagram.name}</h2><p>{reflectionResult.reflection.reasoningExplanation}</p></section>
          {reflectionResult.reflection.evidenceCards.length > 0 && <div className={styles.classicalGrid}>{reflectionResult.reflection.evidenceCards.map((card) => <article key={`${card.title}-${card.technical}`}><small>{card.effect === "positive" ? "助力" : card.effect === "negative" ? "阻力" : "拉扯"}</small><h3>{humanizeLiuyaoRule(card.title)}</h3><p>{card.plain}</p><span>{card.technical}</span></article>)}</div>}
          {reflectionResult.hexagram.analysis.timing?.details.some((item) => item.dateWindows?.length) && <section className={styles.readingFocus}><small>应期观察窗口</small><p>这些日期只是按问题时间尺度换算的观察窗口，不代表事情一定发生。</p>{reflectionResult.hexagram.analysis.timing.details.filter((item) => item.dateWindows?.length).slice(0, 3).map((item) => <p key={`${item.branch}-${item.trigger}`}><b>{branchNames[item.branch]}{item.scale === "month" ? "月" : "日"} · {item.reason}</b>{item.dateWindows?.map((window) => window.startDate === window.endDate ? window.startDate : `${window.startDate} 至 ${window.endDate}`).join("、")}</p>)}</section>}
          <details className={styles.classicalDetails}><summary>展开查看卦辞、象辞与动爻原文</summary>
          <div className={styles.layerBadge}><span>知识系统</span><b>经典依据</b><small>CLASSICAL KNOWLEDGE</small></div>
          <div className={styles.classicalGrid}>
            <article className={styles.classicalPrimary}><small>本卦 · {knowledge.original.name}</small><h2>{knowledge.original.symbolic.meaning}</h2><p>{knowledge.original.symbolic.interpretation}</p><div className={styles.keywordRow}>{knowledge.original.symbolic.keywords.map((item) => <i key={item}>{item}</i>)}</div></article>
            <article><small>卦辞 · JUDGMENT</small><blockquote>{knowledge.original.classical.judgment}</blockquote></article>
            <article><small>大象 · IMAGE</small><blockquote>{knowledge.original.classical.image}</blockquote></article>
          </div>
          <section className={styles.movingSection}>
            <header><span>动爻</span><h2>{knowledge.movingLines.length ? `${knowledge.movingLines.length} 条变化线索` : "此卦无动爻"}</h2><p>{knowledge.readingRule.summary}</p></header>
            {knowledge.movingLines.length > 0 ? <div className={styles.movingList}>{knowledge.movingLines.map((line) => <article key={line.position}><small>第 {line.position} 爻 · {line.name}</small><h3>{line.text}</h3><p>{line.image}</p><span>{line.positionMeaning}</span></article>)}</div> : <div className={styles.stillLineNote}>六爻皆静，本次以本卦卦辞与大象作为主要传统参照。</div>}
          </section>
          <div className={styles.sourceNote}><Sparkle /><span><b>传统依据说明</b><small>本卦、变卦、卦辞、象辞与动爻原文属于经典象义层；用神、世应、月日与生克冲合属于纳甲判断层。不同流派取法可能不同，本页会把两层分开呈现，并完整列出本次全部动爻。</small></span></div>
          <details className={styles.allLines}><summary>查看本卦全部六爻原文</summary><div>{knowledge.original.classical.lines.filter((line) => line.id <= 6).map((line) => <article className={hexagram.movingLines.includes(line.id) ? styles.activeLine : ""} key={line.id}><small>{line.name}</small><p>{line.text}</p><span>{line.image}</span></article>)}</div></details>
          <section className={styles.changedMeaning}><span className={styles.hexSymbol}>{hexagram.changedHexagram.symbol}</span><div><small>变卦 · 第 {knowledge.changed.number} 卦 · {knowledge.changed.name}</small><h2>{knowledge.changed.symbolic.meaning}</h2><p>{knowledge.changed.symbolic.interpretation}</p><blockquote><b>卦辞</b>{knowledge.changed.classical.judgment}</blockquote><blockquote><b>大象</b>{knowledge.changed.classical.image}</blockquote></div></section>
          <div className={styles.readingFocus}><small>本次传统判读顺序</small>{knowledge.readingRule.focus.map((item) => <p key={`${item.hexagram}-${item.label}`}><b>{item.label}</b>{item.text}</p>)}</div>
          </details>
          <button className={styles.primaryButton} onClick={() => setStage("mirror")}><Sparkle /> 听拾光翻成人话 <ArrowRight /></button>
        </section>
      )}

      {stage === "mirror" && reflectionResult && (
        <section className={styles.reflectionScreen}>
          <button className={styles.backButton} onClick={() => setStage("hexagram")}><ArrowLeft /> 返回卦象</button>
          <div className={styles.reflectionHero}><span>拾光解读</span><h1>先说结论。</h1><p>传统依据保留在下方，需要验证时再展开。</p></div>
          <article className={styles.judgmentCard}><small>拾光先说</small><h2>{reflectionResult.question}</h2><p>{reflectionResult.reflection.traditionalJudgment}</p></article>
          {reflectionResult.generationMode === "basic" && reflectionResult.generationNotice && <div className={styles.basicNotice} role="status">AI 暂时未完成本次改写，当前先显示可靠的基础解读。</div>}
          <div className={styles.shiguangIntro}><img className={styles.shiguangAvatar} src={assetPath("/characters/shiguang/shiguang-east-chibi-v2.png")} alt="Q版东方拾光" /><div><small>拾光 · SHIGUANG</small><p>我不会否定你想知道答案的心情。卦象已经先回应了你，接下来我只陪你看看，这个方向落到现实里意味着什么。</p></div></div>
          <div className={styles.personaFlow}>
            <article className={styles.understandingCard}><small>现实里的助力与阻力</small><h2>这对你意味着什么</h2><p>{reflectionResult.reflection.shiguangInterpretation}</p></article>
            <article className={styles.guidanceCard}><small>给你的建议</small><h2>接下来可以怎么做</h2><p>{reflectionResult.reflection.practicalGuidance}</p></article>
          </div>
          {reflectionResult.reflection.closing && <article className={styles.closingCard}><div><Sparkle /><span>留给你的下一步</span></div><p>{reflectionResult.reflection.closing.text}</p><small>不用马上得出答案，先让现实给你一个回应。</small></article>}
          <ShareQuoteCard theme="east" title="我的六爻镜像" quote={reflectionResult.reflection.shareableReflection} meta={`${reflectionResult.hexagram.originalHexagram.symbol} ${reflectionResult.hexagram.originalHexagram.name} → ${reflectionResult.hexagram.changedHexagram.symbol} ${reflectionResult.hexagram.changedHexagram.name}`} image={assetPath("/characters/shiguang/shiguang-east-chibi-v2.png")} contentByVariant={reflectionResult.reflection.shareCards ? {
            paper: { kicker: "我的此刻 · FOR ME", ...reflectionResult.reflection.shareCards.warm },
            night: { kicker: "关系回应 · FOR US", ...reflectionResult.reflection.shareCards.roast },
            character: { kicker: "邀请对照 · COMPARE", ...reflectionResult.reflection.shareCards.witty },
          } : undefined} />
          <div className={styles.sourceNote}><Sparkle /><span><b>拾光提供的是理解与行动线索</b><small>{reflectionResult.knowledge.framing} 决定仍然属于你。</small></span></div>
          <ShiguangChat theme="east" context={`本次卦象为${reflectionResult.hexagram.originalHexagram.name}变${reflectionResult.hexagram.changedHexagram.name}；页面中的传统依据与规则证据可供复核。`} />
          <details className={styles.explanationTrace}>
            <summary>为什么拾光这样说 · 查看传统依据</summary>
            <div><small>六爻判断</small><p>{reflectionResult.reflection.reasoningExplanation}</p></div>
            {reflectionResult.reflection.evidenceCards.length > 0 && <div><small>关键线索</small><ul>{reflectionResult.reflection.evidenceCards.map((card) => <li key={`${card.title}-${card.technical}`}>{card.effect === "positive" ? "助力" : card.effect === "negative" ? "阻力" : "拉扯"} · {card.title}：{card.plain}</li>)}</ul></div>}
            <div><small>传统依据</small><p>{reflectionResult.explanationTrace.traditional_basis}</p></div>
            <div><small>反思映射</small><p>{reflectionResult.explanationTrace.reflection_mapping}</p></div>
            {reflectionResult.explanationTrace.liuyao_factors.length > 0 && <div><small>六爻规则证据</small><ul>{reflectionResult.explanationTrace.liuyao_factors.map((item) => <li key={item}>{humanizeLiuyaoFactor(item)}</li>)}</ul></div>}
            {reflectionResult.runtimeTrace && <div><small>解读过程检查</small><p>{reflectionResult.runtimeTrace.mode.mode === "deep" ? "深度分析" : "清晰解读"} · 已完成一致性与边界检查</p>{reflectionResult.runtimeTrace.evaluation.flags.length > 0 && <ul>{reflectionResult.runtimeTrace.evaluation.flags.map((flag) => <li key={flag}>{flag}</li>)}</ul>}</div>}
          </details>
          {error && <div className={styles.error} role="alert">{error}</div>}
          <div className={styles.reflectionActions}><button className={styles.secondaryButton} onClick={startMirror}>问一个新问题</button><button className={styles.primaryButton} disabled={busy || saved} onClick={saveReflection}>{busy ? <CircleNotch className={styles.spin} /> : saved ? <><Check /> 已保存</> : <><FloppyDisk /> 保存这次记录</>}</button></div>
          {saved && <p className={styles.savedNote}>已保存到“我的镜像”。</p>}
        </section>
      )}

      {stage === "reflectionQuestion" && reflectionResult?.reflection.reflectionQuestion && (
        <section className={styles.reflectionScreen}>
          <button className={styles.backButton} onClick={() => setStage("mirror")}><ArrowLeft /> 返回镜像解读</button>
          <div className={styles.reflectionHero}><span>OPTIONAL · REFLECTION QUESTION</span><h1>顺便问一句。</h1><p>这部分完全可选，也不会推翻前面的判断。</p></div>
          <article className={styles.questionFocus}><small>留给你的问题</small><h2>{reflectionResult.reflection.reflectionQuestion}</h2><div><b>拾光为什么问它</b><p>{reflectionResult.reflection.shiguangInterpretation}</p></div><div><b>现在可以做的事</b><p>{reflectionResult.reflection.practicalGuidance}</p></div></article>
          <div className={styles.reflectionActions}><button className={styles.secondaryButton} onClick={startMirror}>不保存，问一个新问题</button><button className={styles.primaryButton} onClick={() => setStage("save")}>保存这次解读 <ArrowRight /></button></div>
        </section>
      )}

      {stage === "save" && reflectionResult && (
        <section className={styles.reflectionScreen}>
          <button className={styles.backButton} onClick={() => setStage("mirror")}><ArrowLeft /> 返回拾光解释</button>
          <div className={styles.reflectionHero}><span>07 · 保存</span><h1>保存这次解读。</h1><p>保存后可以在“我的镜像”里再次查看。</p></div>
          <article className={styles.saveSummary}><small>本次镜像</small><h2>{reflectionResult.question}</h2><p>{reflectionResult.hexagram.originalHexagram.name} → {reflectionResult.hexagram.changedHexagram.name}</p><blockquote>{reflectionResult.reflection.shareableReflection}</blockquote></article>
          {error && <div className={styles.error} role="alert">{error}</div>}
          <div className={styles.reflectionActions}><button className={styles.secondaryButton} onClick={startMirror}>暂不保存，开启新问题</button><button className={styles.primaryButton} disabled={busy || saved} onClick={saveReflection}>{busy ? <CircleNotch className={styles.spin} /> : saved ? <><Check /> 已保存</> : <><FloppyDisk /> 保存</>}</button></div>
          {saved && <p className={styles.savedNote}>已保存到“我的镜像”。</p>}
        </section>
      )}

      {sharePreviewOpen && shareArtifact && reflectionResult && (
        <div className={styles.sharePreviewBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSharePreviewOpen(false); }}>
          <section className={styles.sharePreview} role="dialog" aria-modal="true" aria-labelledby="share-preview-title">
            <header>
              <div><small>SHIGUANG · SHARE MIRROR</small><h2 id="share-preview-title">这是拾光为你留下的今日镜像。</h2></div>
              <button type="button" onClick={() => setSharePreviewOpen(false)} aria-label="关闭分享卡预览"><X /></button>
            </header>
            <div className={styles.sharePreviewImage}><img src={shareArtifact.url} alt="实际生成的 1080 × 1350 Life Mirror 分享卡" /></div>
            {shareFallback && <p className={styles.shareFallback} role="status">{shareFallback}</p>}
            <div className={styles.sharePreviewActions}>
              <button type="button" className={styles.shareFriendButton} onClick={shareWithFriends}><ShareNetwork /> 分享给朋友</button>
              <button type="button" className={styles.saveImageButton} onClick={saveShareCard}><DownloadSimple /> 保存到相册</button>
              <button type="button" className={styles.returnButton} onClick={() => setSharePreviewOpen(false)}><ArrowLeft /> 返回解读</button>
            </div>
          </section>
        </div>
      )}

      <footer className={styles.appFooter}><span>SYMBOLIC REFLECTION + PERSONAL AI MIRROR</span><Link href="/data/personal-mirror-data-specification/">数据与隐私原则</Link></footer>
    </main>
  );
}
