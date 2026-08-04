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
import { MemoryControls } from "./MemoryControls";
import { ShiguangChat } from "./ShiguangChat";
import styles from "./DailyMirrorExperience.module.css";

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
};
type PreviousReflection = { shiguangSees: string; hexagramMeaning: string; mirrorUnderstanding: string; practicalGuidance: string; reflectionQuestion: string; shareableReflection: string };
type LegacyReflection = { observation: string; insight: string; reflectionQuestion: string; actionSuggestion: string };
type ExplanationTrace = { traditional_basis: string; liuyao_factors: string[]; reflection_mapping: string; final_response: Reflection };
type RuntimeTrace = { mode: { mode: "reflection" | "deep"; confidence: number }; evaluation: { level: string; score: number; flags: string[] }; stages: Array<{ name: string; status: string; detail?: string }> };
type ReflectionResponse = { question: string; hexagram: Hexagram; analysisContext?: LiuyaoAnalysisContext; knowledge: Knowledge; reflectionKnowledge: ReflectionKnowledge; reflection: Reflection; explanationTrace: ExplanationTrace; interactionMode?: "reflection" | "deep"; runtimeTrace?: RuntimeTrace; draftToken: string; expiresAt: string };
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

function createGuestReflection(question: string, hexagram: Hexagram, knowledge: Knowledge, reflectionKnowledge: ReflectionKnowledge, analysisContext?: LiuyaoAnalysisContext | null): ReflectionResponse {
  const directionText = { favorable: "偏向可以", mixed: "可以，但别把期待拉太满", unfavorable: "眼下不太占优势", undetermined: "暂时还不能定" } as const;
  const verdictText = hexagram.judgment.verdicts.map((item) => `${item.label}：${directionText[item.direction]}`).join("；");
  const decisive = hexagram.judgment.keyEvidence.slice(0, 4);
  const evidenceCards = decisive.map((item) => ({
    title: item.rule,
    technical: item.technicalText ?? item.conclusion,
    plain: item.plainMeaning ?? item.conclusion,
    effect: item.effect === "support" ? "positive" as const : item.effect === "obstruct" ? "negative" as const : "mixed" as const,
  }));
  const technicalStory = decisive.map((item) => item.technicalText ?? item.conclusion).join("；");
  const plainStory = decisive.map((item) => item.plainMeaning ?? item.conclusion).join(" ");
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
    shareableReflection: playful ? "今天更值得赢到开心，不必把每一分输赢都算得太重。" : "看清助力与阻力，再把决定落回现实。",
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
    draftToken: `guest-${crypto.randomUUID()}`,
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
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [castingPhase, setCastingPhase] = useState<CastingPhase>("idle");
  const [pendingToss, setPendingToss] = useState<Toss | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [shareArtifact, setShareArtifact] = useState<ShareArtifact | null>(null);
  const [sharePreviewOpen, setSharePreviewOpen] = useState(false);
  const [shareGenerating, setShareGenerating] = useState(false);
  const [shareFallback, setShareFallback] = useState("");
  const pendingCastRef = useRef<PendingCast | null>(null);
  const castTokenRef = useRef(0);
  const castTimersRef = useRef<number[]>([]);
  const shareArtifactRef = useRef<ShareArtifact | null>(null);
  const shareGeneratingRef = useRef(false);
  const casting = castingPhase !== "idle";

  const loadHistory = useCallback(async () => {
    const data = await api<{ events: HistoryEvent[] }>("/api/v1/daily-mirror/reflections");
    setHistory(data.events);
  }, []);

  useEffect(() => {
    api<{ authenticated: boolean }>("/api/v1/auth/session")
      .then(() => { setAuthState("authenticated"); void loadHistory(); })
      .catch(() => {
        if (window.localStorage.getItem(GUEST_SESSION_KEY) === "active") {
          setHistory(readGuestHistory());
          setAuthState("guest");
        } else {
          setAuthState("signedOut");
        }
      });
  }, [loadHistory]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => () => {
    castTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    shareArtifactRef.current && URL.revokeObjectURL(shareArtifactRef.current.url);
  }, []);

  useEffect(() => {
    if (!sharePreviewOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSharePreviewOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [sharePreviewOpen]);

  const progress = useMemo(() => ({ home: 0, question: 1, cast: 2, hexagram: 3, traditional: 4, mirror: 5, reflectionQuestion: 5, save: 6, memory: 0 })[stage], [stage]);

  async function authenticate(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      await api(`/api/v1/auth/${authMode}`, { method: "POST", body: JSON.stringify({ email, password }) });
      setAuthState("authenticated"); setPassword("");
      await loadHistory();
    } catch (cause) { setError(readableError(cause)); }
    finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);
    if (authState === "authenticated") {
      try { await api("/api/v1/auth/logout", { method: "POST" }); } catch { /* local state still clears */ }
    } else {
      window.localStorage.removeItem(GUEST_SESSION_KEY);
    }
    setAuthState("signedOut"); setHistory([]); setStage("home"); setBusy(false);
  }

  function enterAsGuest() {
    window.localStorage.setItem(GUEST_SESSION_KEY, "active");
    setHistory(readGuestHistory());
    setError("");
    setAuthState("guest");
  }

  function clearCastTimers() {
    castTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    castTimersRef.current = [];
  }

  function releaseShareArtifact() {
    if (shareArtifactRef.current) URL.revokeObjectURL(shareArtifactRef.current.url);
    shareArtifactRef.current = null;
    setShareArtifact(null);
    setSharePreviewOpen(false);
    setShareFallback("");
  }

  function startMirror() {
    clearCastTimers();
    pendingCastRef.current = null;
    setPendingToss(null);
    setCastingPhase("idle");
    releaseShareArtifact();
    setQuestion(""); setTopicHint(""); setIntentSelection(null); setIntentClarification(null); setTosses([]); setHexagram(null); setKnowledge(null); setReflectionKnowledge(null); setAnalysisContext(null); setReflectionResult(null); setSaved(false); setError(""); setShareStatus(""); setStage("question");
  }

  async function resolveIntentAndContinue() {
    if (question.trim().length < 5 || !topicHint) return;
    setBusy(true); setError(""); setIntentClarification(null);
    try {
      const selection = createIntentSelection({ question, topicHint, source: "deterministic" });
      const resolution = { status: "resolved", source: "deterministic", confidence: selection.resolution.confidence, summary: selection.intents.map((item) => item.label).join("；"), selection } satisfies IntentResolution;
      if (!resolution.selection) throw new Error("invalid_intent_resolution");
      setIntentSelection(resolution.selection);
      setStage("cast");
    } catch (cause) { setError(readableError(cause)); }
    finally { setBusy(false); }
  }

  function confirmIntent(selection: LiuyaoIntentSelection) {
    setIntentSelection(selection);
    setIntentClarification(null);
    setError("");
    setStage("cast");
  }

  async function generateShareCard() {
    if (!reflectionResult || shareGeneratingRef.current) return;
    if (shareArtifactRef.current) {
      setSharePreviewOpen(true);
      return;
    }
    shareGeneratingRef.current = true;
    setShareGenerating(true);
    setShareStatus("");
    setShareFallback("");
    const canvas = document.createElement("canvas");
    canvas.width = 1080; canvas.height = 1350;
    const context = canvas.getContext("2d");
    if (!context) {
      shareGeneratingRef.current = false;
      setShareGenerating(false);
      setShareStatus("暂时无法生成分享卡，请稍后再试");
      return;
    }
    const gradient = context.createLinearGradient(0, 0, 1080, 1350);
    gradient.addColorStop(0, "#153f39"); gradient.addColorStop(0.58, "#0f302d"); gradient.addColorStop(1, "#081f20");
    context.fillStyle = gradient; context.fillRect(0, 0, 1080, 1350);
    const shiguangImage = await loadCanvasImage(assetPath("/characters/shiguang/shiguang-share.webp"));
    if (shiguangImage) {
      context.save();
      context.globalAlpha = .82;
      context.drawImage(shiguangImage, 690, 660, 390, 690);
      const imageFade = context.createLinearGradient(620, 0, 890, 0);
      imageFade.addColorStop(0, "#0f302d"); imageFade.addColorStop(1, "rgba(15,48,45,0)");
      context.globalAlpha = 1;
      context.fillStyle = imageFade; context.fillRect(600, 620, 310, 730);
      context.restore();
    }
    context.fillStyle = "rgba(216, 186, 111, .22)"; context.beginPath(); context.arc(900, 160, 260, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#d8ba6f"; context.font = "500 28px sans-serif"; context.fillText("LIFE MIRROR · 拾光", 90, 110);
    context.fillStyle = "#f5efe2"; context.font = "64px serif"; context.fillText(`${reflectionResult.hexagram.originalHexagram.symbol}  ${reflectionResult.hexagram.originalHexagram.name}  →  ${reflectionResult.hexagram.changedHexagram.symbol}  ${reflectionResult.hexagram.changedHexagram.name}`, 90, 255);
    context.fillStyle = "rgba(245,239,226,.72)"; context.font = "28px sans-serif"; context.fillText("今天的镜像", 90, 345);
    context.fillStyle = "#ffffff"; context.font = "600 58px serif";
    const characters = [...reflectionResult.reflection.shareableReflection];
    const lines: string[] = []; let line = "";
    for (const character of characters) {
      if (context.measureText(line + character).width > 850 && line) { lines.push(line); line = character; } else line += character;
    }
    if (line) lines.push(line);
    lines.slice(0, 6).forEach((item, index) => context.fillText(item, 90, 475 + index * 86));
    context.strokeStyle = "rgba(216,186,111,.5)"; context.beginPath(); context.moveTo(90, 1035); context.lineTo(650, 1035); context.stroke();
    context.fillStyle = "#d8ba6f"; context.font = "500 23px sans-serif"; context.fillText("拾光给你的提醒", 90, 1100);
    context.fillStyle = "rgba(245,239,226,.76)"; context.font = "25px sans-serif";
    const reminderCharacters = [...reflectionResult.reflection.practicalGuidance];
    const reminderLines: string[] = []; let reminderLine = "";
    for (const character of reminderCharacters) {
      if (context.measureText(reminderLine + character).width > 540 && reminderLine) { reminderLines.push(reminderLine); reminderLine = character; } else reminderLine += character;
    }
    if (reminderLine) reminderLines.push(reminderLine);
    reminderLines.slice(0, 2).forEach((item, index) => context.fillText(item, 90, 1150 + index * 42));
    context.fillStyle = "rgba(245,239,226,.7)"; context.font = "25px sans-serif"; context.fillText("Life Mirror · 人生镜像", 90, 1285);
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("share_card_blob_failed");
      const file = new File([blob], "life-mirror-reflection.png", { type: "image/png" });
      const artifact: ShareArtifact = {
        blob,
        file,
        url: URL.createObjectURL(blob),
        canNativeShare: typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] }),
      };
      shareArtifactRef.current = artifact;
      setShareArtifact(artifact);
      setSharePreviewOpen(true);
      setShareStatus("分享卡已生成，可以先预览再分享或保存");
    } catch {
      setShareStatus("暂时无法生成分享卡，请稍后重试");
    } finally {
      shareGeneratingRef.current = false;
      setShareGenerating(false);
    }
  }

  async function shareWithFriends() {
    if (!shareArtifact || !reflectionResult) return;
    if (!shareArtifact.canNativeShare) {
      setShareFallback("当前浏览器暂不支持直接分享图片。请先保存到相册，再从微信、信息或其他应用中发送给朋友。");
      return;
    }
    try {
      await navigator.share({
        title: "我的 Life Mirror 镜像",
        text: reflectionResult.reflection.shareableReflection,
        files: [shareArtifact.file],
      });
      setShareFallback("");
      setShareStatus("已打开系统分享面板");
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setShareFallback("系统分享没有完成。你也可以先保存到相册，再手动分享这张图片。");
    }
  }

  function saveShareCard() {
    if (!shareArtifact) return;
    const anchor = document.createElement("a");
    anchor.href = shareArtifact.url;
    anchor.download = shareArtifact.file.name;
    anchor.click();
    setShareStatus("分享卡已保存");
  }

  async function calculateCompletedHexagram(next: Toss[]) {
    if (next.length !== 6) return;
    setBusy(true);
    try {
      const occurredAt = new Date().toISOString();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const resolvedContext = resolveLiuyaoContext({ question, occurredAt, timezone, intentSelection: intentSelection ?? undefined });
      const calculated = calculateLiuyao(next, resolvedContext);
      const retrieved = retrieveLiuyaoKnowledge(calculated);
      const result = { hexagram: calculated, analysisContext: resolvedContext, knowledge: retrieved, reflectionKnowledge: retrieveLiuyaoReflectionKnowledge(calculated, retrieved) };
      setHexagram(result.hexagram);
      setAnalysisContext(result.analysisContext ?? null);
      setKnowledge(result.knowledge);
      setReflectionKnowledge(result.reflectionKnowledge);
    } catch (cause) { setError(readableError(cause)); }
    finally { setBusy(false); }
  }

  function finishCast(token: number) {
    const pending = pendingCastRef.current;
    if (!pending || pending.token !== token) return;
    clearCastTimers();
    pendingCastRef.current = null;
    const next = [...pending.previousTosses, pending.toss];
    setTosses(next);
    setPendingToss(null);
    setCastingPhase("idle");
    if (navigator.vibrate) navigator.vibrate(12);
    void calculateCompletedHexagram(next);
  }

  function scheduleCastPhase(phase: CastingPhase, delay: number, token: number) {
    const timer = window.setTimeout(() => {
      if (pendingCastRef.current?.token === token) setCastingPhase(phase);
    }, delay);
    castTimersRef.current.push(timer);
  }

  function castLine() {
    if (pendingCastRef.current || busy || tosses.length >= 6) return;
    setError("");
    const token = ++castTokenRef.current;
    const nextToss = createToss();
    pendingCastRef.current = { token, toss: nextToss, previousTosses: [...tosses] };
    setPendingToss(nextToss);
    setCastingPhase("shaking");
    if (navigator.vibrate) navigator.vibrate(8);

    if (reducedMotion) {
      const timer = window.setTimeout(() => finishCast(token), 80);
      castTimersRef.current.push(timer);
      return;
    }

    scheduleCastPhase("tilting", 700, token);
    scheduleCastPhase("falling", 980, token);
    scheduleCastPhase("settling", 1900, token);
    const timer = window.setTimeout(() => finishCast(token), 2280);
    castTimersRef.current.push(timer);
  }

  function skipCastAnimation() {
    const pending = pendingCastRef.current;
    if (pending) finishCast(pending.token);
  }

  async function generateReflection() {
    setBusy(true); setError("");
    try {
      if (!hexagram || !knowledge || !reflectionKnowledge) throw new Error("reflection_generation_failed");
      let result: ReflectionResponse;
      if (authState === "authenticated" && API_BASE) {
        try {
          result = await api<ReflectionResponse>("/api/v1/daily-mirror/reflections", { method: "POST", body: JSON.stringify({ question, tosses, analysisContext, requestedMode: interactionMode }) });
        } catch {
          result = createGuestReflection(question, hexagram, knowledge, reflectionKnowledge, analysisContext);
        }
      } else result = createGuestReflection(question, hexagram, knowledge, reflectionKnowledge, analysisContext);
      setReflectionResult(result); setStage("traditional");
    } catch (cause) { setError(readableError(cause)); }
    finally { setBusy(false); }
  }

  async function saveReflection() {
    if (!reflectionResult || saved) return;
    setBusy(true); setError("");
    try {
      if (authState === "guest") {
        const event: HistoryEvent = {
          id: crypto.randomUUID(),
          question: reflectionResult.question,
          hexagram: reflectionResult.hexagram,
          reflection: reflectionResult.reflection,
          savedAt: new Date().toISOString(),
        };
        const events = [event, ...readGuestHistory()].slice(0, 20);
        window.localStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(events));
        setHistory(events);
      } else {
        await api("/api/v1/daily-mirror/reflections/save", { method: "POST", body: JSON.stringify({ draftToken: reflectionResult.draftToken }) });
        await loadHistory();
      }
      setSaved(true);
    } catch (cause) { setError(readableError(cause)); }
    finally { setBusy(false); }
  }

  if (authState === "checking" || authState === "signedOut") {
    return (
      <main className={styles.appShell}>
        <div className={styles.ambient} />
        <header className={styles.brandBar}><Link href="/"><span className={styles.brandOrb}>◌</span><b>LIFE MIRROR</b></Link><Link href="/">研究院</Link></header>
        <section className={styles.authLayout}>
          <div className={styles.authIntro}>
            <p>PERSONAL AI MIRROR</p>
            <h1>看见此刻，<br />也看见正在成为的自己。</h1>
            <span>拾光会陪你先读懂传统卦意，再把它带回你真正关心的生活处境。</span>
          </div>
          <form className={styles.authCard} onSubmit={authenticate}>
            <LockKey weight="thin" />
            <h2>{authMode === "login" ? "回到你的镜像" : "建立第一面镜子"}</h2>
            <p>你的反思属于你，不用于模型训练。</p>
            <label>邮箱<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
            <label>密码<input type="password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 12 位" /></label>
            {error && <div className={styles.error} role="alert">{error}</div>}
            <button className={styles.primaryButton} disabled={busy || authState === "checking"}>{busy || authState === "checking" ? <CircleNotch className={styles.spin} /> : authMode === "login" ? "登录" : "创建账户"}</button>
            <div className={styles.authDivider}><span>或</span></div>
            <button className={styles.guestButton} type="button" onClick={enterAsGuest}>以游客身份登录 <ArrowRight /></button>
            <button className={styles.textButton} type="button" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setError(""); }}>{authMode === "login" ? "第一次使用？创建账户" : "已有账户？直接登录"}</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.appShell}>
      <div className={styles.ambient} />
      <header className={styles.appHeader}>
        <Link href="/app/home/" className={styles.productBrand}><span className={styles.brandOrb}>◌</span><b>LIFE MIRROR</b><small>DAILY MIRROR</small></Link>
        <div className={styles.headerActions}>{authState === "authenticated" && <Link href="/app/review/">周期回顾</Link>}<span><LockKey />{authState === "guest" ? "游客镜像" : "私人镜像"}</span><button onClick={logout} disabled={busy} aria-label="退出登录"><SignOut /></button></div>
      </header>

      {stage !== "home" && stage !== "memory" && <nav className={styles.progress} aria-label="Daily Mirror 进度">{["提问", "起卦", "卦象", "六爻判断", "拾光解释", "保存"].map((label, index) => <span className={progress >= index + 1 ? styles.progressActive : ""} key={label}><i>{progress > index + 1 ? <Check /> : index + 1}</i>{label}</span>)}</nav>}

      {stage === "home" && (
        <section className={styles.companionHome}>
          <div className={styles.companionWelcome}><div><p>今日镜像 · 拾光在这里</p><h1>今天，想从<br />哪里开始？</h1><span>你可以先自由聊聊，也可以选择一种镜像工具。工具只是观察角度，拾光会留在整个过程里。</span></div><img src={assetPath("/characters/shiguang/shiguang-hero.webp")} alt="拾光" /></div>
          <div className={styles.homeConversation}><ShiguangChat mode="home" theme="east" context="这是用户进入 LifeMirror 后的常规陪伴首页。当前还没有选择六爻、命盘、塔罗或占星；先自然回应用户当下的困惑，帮助澄清问题，不主动制造占卜结论。" opening="我在。你不必先选择工具——可以直接告诉我，今天哪件事最留在心里。我们先把它说清楚，再决定要不要借一种镜像来看。" /></div>
          <section className={styles.toolHub}><header><div><small>CHOOSE A MIRROR · 按需要选择</small><h2>换一个角度看此刻</h2></div><span>体验结束后仍可回到拾光对话</span></header><div>
            <button type="button" onClick={startMirror}><Hexagon /><span><b>六爻</b><small>适合具体事件与变化中的选择</small></span><ArrowRight /></button>
            <Link href="/app/chart/"><ChartPolar /><span><b>命盘</b><small>从出生时间结构理解长期节奏</small></span><ArrowRight /></Link>
            <Link href="/app/tarot/"><CardsThree /><span><b>塔罗</b><small>从象征画面厘清内在感受</small></span><ArrowRight /></Link>
            <Link href="/app/astrology/"><Sparkle /><span><b>占星</b><small>从行星、宫位与相位观察心理结构</small></span><ArrowRight /></Link>
          </div></section>
          <aside className={styles.homeMemory}><header><ClockCounterClockwise /><span><b>你的镜像</b><small>{history.length} 次已保存的反思</small></span></header>{history[0] ? <article><time>{new Date(history[0].savedAt).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}</time><p>{history[0].question}</p><span>{history[0].hexagram.originalHexagram.name} → {history[0].hexagram.changedHexagram.name}</span></article> : <p className={styles.emptyMemory}>完成并保存第一次反思后，它会出现在这里。</p>}<button className={styles.manageMemoryButton} onClick={() => setStage("memory")}>管理我的记忆 <ArrowRight /></button></aside>
        </section>
      )}

      {stage === "memory" && <MemoryControls mode={authState} onClose={() => setStage("home")} onChanged={() => { if (authState === "guest") setHistory(readGuestHistory()); else void loadHistory(); }} />}

      {stage === "question" && (
        <section className={styles.stepScreen}>
          <button className={styles.backButton} onClick={() => setStage("home")}><ArrowLeft /> 返回</button>
          <div className={styles.stepIntro}><span>01 · QUESTION</span><h1>先说清楚，<br />这次到底想问什么。</h1><p>方向由你选择，具体目标由系统理解；有歧义时会先请你确认。</p></div>
          <div className={styles.questionCard}>
            <fieldset className={styles.topicPicker}><legend>先选一个最接近的方向</legend><div>{topicOptions.map((item) => <button type="button" aria-pressed={topicHint === item.value} className={topicHint === item.value ? styles.selectedTopic : ""} key={item.value} onClick={() => { setTopicHint(item.value); setIntentSelection(null); setIntentClarification(null); }}>{item.label}</button>)}</div><small>这只是理解提示，不会直接决定卦的结果。</small></fieldset>
            <label htmlFor="mirror-question">此刻，我想探索的是</label>
            <textarea id="mirror-question" maxLength={500} value={question} onChange={(event) => { setQuestion(event.target.value); setIntentSelection(null); setIntentClarification(null); }} placeholder="例如：这次面试能不能拿到 offer？" autoFocus />
            <div className={styles.questionMeta}><span>{question.length} / 500</span><span>问题会先结构化，再进入断卦</span></div>
            <div className={styles.suggestions}>{suggestions.map((item) => <button type="button" key={item} onClick={() => { setQuestion(item); setIntentSelection(null); setIntentClarification(null); }}>{item}</button>)}</div>
            {intentClarification && <section className={styles.intentClarification} aria-live="polite"><small>还需要你确认一下</small><h2>{intentClarification.question}</h2><div>{intentClarification.options.map((option) => <button type="button" key={option.id} onClick={() => confirmIntent(option.selection)}>{option.label}<ArrowRight /></button>)}</div></section>}
            {error && <div className={styles.error} role="alert">{error}</div>}
            <button className={styles.primaryButton} disabled={busy || question.trim().length < 5 || !topicHint} onClick={resolveIntentAndContinue}>{busy ? <><CircleNotch className={styles.spin} /> 正在理解你的问题…</> : <>确认问题方向 <ArrowRight /></>}</button>
          </div>
        </section>
      )}

      {stage === "cast" && (
        <section className={`${styles.stepScreen} ${styles.castScreen}`}>
          <button className={styles.backButton} disabled={casting} onClick={() => setStage("question")}><ArrowLeft /> 返回问题</button>
          <div className={styles.stepIntro}><span>02 · LIUYAO INTERACTION</span><h1>把问题放在心里，<br />慢慢摇动龟壳。</h1><p>不必刻意控制结果，让三枚铜钱自然落下。六次结果仍由初爻至上爻、从下向上形成。</p></div>
          {intentSelection && <div className={styles.intentSummary}><small>本次判断目标</small><b>{intentSelection.intents.map((intent) => intent.label).join("；")}</b><span>理解置信度 {Math.round(intentSelection.resolution.confidence * 100)}% · 只用于选取断卦规则，不参与吉凶计分</span></div>}
          <div className={styles.castWorkspace}>
            <div className={styles.ritualStage} data-phase={castingPhase}>
              <div className={styles.shellGlow} />
              <img className={styles.shellImage} src={assetPath("/rituals/liuyao/shiguang-tortoise-shell.webp")} alt="用于六爻起卦的现代东方龟壳容器" />
              <div className={styles.ritualCoins} aria-live="polite">
                {[0, 1, 2].map((index) => {
                  const displayedToss = pendingToss ?? tosses.at(-1);
                  const showFace = castingPhase === "settling" || (!casting && Boolean(tosses.length));
                  const coinValue = displayedToss?.[index];
                  const coinFaceSrc = coinValue === 2
                    ? assetPath("/rituals/liuyao/shiguang-coin-obverse.webp")
                    : assetPath("/rituals/liuyao/shiguang-coin-reverse.webp");
                  const coinStyle = {
                    "--coin-index": index,
                    "--coin-start-x": `${(index - 1) * 45}px`,
                    "--coin-mid-x": `${(index - 1) * 55}px`,
                    "--coin-end-x": `${(index - 1) * 88}px`,
                    "--coin-turn": `${index % 2 === 0 ? -12 + index * 11 : 8}deg`,
                    animationDelay: castingPhase === "falling" || castingPhase === "shaking" ? `${index * 105}ms` : "0ms",
                  } as CSSProperties;
                  return <span aria-label={showFace ? `第 ${index + 1} 枚铜钱，${coinValue === 2 ? "正面" : "反面"}` : undefined} className={`${styles.ritualCoin} ${castingPhaseClass[castingPhase]} ${showFace ? styles.coinFaceVisible : ""} ${!casting && tosses.length === 0 ? styles.coinInside : ""}`} style={coinStyle} key={index}>{coinValue && <img src={coinFaceSrc} alt="" aria-hidden="true" />}</span>;
                })}
              </div>
              {casting && <button type="button" className={styles.skipAnimation} onClick={skipCastAnimation}>跳过动画</button>}
            </div>
            <div className={styles.lineStack}>{Array.from({ length: 6 }, (_, reverseIndex) => 5 - reverseIndex).map((index) => { const lineValue = tosses[index]?.reduce((sum, value) => sum + value, 0); const polarity = lineValue === 6 || lineValue === 8 ? "yin" : "yang"; return <div className={tosses[index] ? styles.lineReady : ""} key={index}><small>{lineNames[index]}</small>{tosses[index] ? <LineGlyph polarity={polarity} moving={lineValue === 6 || lineValue === 9} /> : <span className={styles.linePlaceholder} />}</div>; })}</div>
            <button className={styles.castButton} onClick={castLine} disabled={casting || busy || tosses.length === 6}>{casting ? <><CircleNotch className={styles.spin} /><span>正在成爻…</span></> : tosses.length === 6 ? <><Check /><span>六爻已成</span></> : <><span>{tosses.length === 0 ? "开始摇卦" : "再摇一次"}</span><small>第 {tosses.length + 1} 次</small></>}</button>
            <p>{tosses.length} / 6 爻已形成</p>
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
          <section className={styles.reasoningCard}><small>这卦怎么看 · LIUYAO REASONING</small><h2>{reflectionResult.hexagram.originalHexagram.name} → {reflectionResult.hexagram.changedHexagram.name}</h2><p>{reflectionResult.reflection.reasoningExplanation}</p></section>
          {reflectionResult.reflection.evidenceCards.length > 0 && <div className={styles.classicalGrid}>{reflectionResult.reflection.evidenceCards.map((card) => <article key={`${card.title}-${card.technical}`}><small>{card.effect === "positive" ? "助力" : card.effect === "negative" ? "阻力" : "拉扯"}</small><h3>{card.title}</h3><p>{card.plain}</p><span>{card.technical}</span></article>)}</div>}
          {reflectionResult.hexagram.analysis.timing?.details.some((item) => item.dateWindows?.length) && <section className={styles.readingFocus}><small>应期候选 · TIMING WINDOWS</small><p>这些日期只是按问题时间尺度换算的观察窗口，不代表事情一定发生。</p>{reflectionResult.hexagram.analysis.timing.details.filter((item) => item.dateWindows?.length).slice(0, 3).map((item) => <p key={`${item.branch}-${item.trigger}`}><b>{branchNames[item.branch]}{item.scale === "month" ? "月" : "日"} · {item.reason}</b>{item.dateWindows?.map((window) => window.startDate === window.endDate ? window.startDate : `${window.startDate} 至 ${window.endDate}`).join("、")}（可信度 {Math.round(item.confidence * 100)}%）</p>)}</section>}
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
          <details className={styles.allLines}><summary>查看本卦全部六爻原文</summary><div>{knowledge.original.classical.lines.filter((line) => line.id <= 6).map((line) => <article className={hexagram.movingLines.includes(line.id) ? styles.activeLine : ""} key={line.id}><small>{line.name}</small><p>{line.text}</p><span>{line.image}</span></article>)}</div></details>
          <section className={styles.changedMeaning}><span className={styles.hexSymbol}>{hexagram.changedHexagram.symbol}</span><div><small>变卦 · 第 {knowledge.changed.number} 卦 · {knowledge.changed.name}</small><h2>{knowledge.changed.symbolic.meaning}</h2><p>{knowledge.changed.symbolic.interpretation}</p><blockquote><b>卦辞</b>{knowledge.changed.classical.judgment}</blockquote><blockquote><b>大象</b>{knowledge.changed.classical.image}</blockquote></div></section>
          <div className={styles.readingFocus}><small>本次传统判读顺序</small>{knowledge.readingRule.focus.map((item) => <p key={`${item.hexagram}-${item.label}`}><b>{item.label}</b>{item.text}</p>)}</div>
          </details>
          <button className={styles.primaryButton} onClick={() => setStage("mirror")}><Sparkle /> 听拾光翻成人话 <ArrowRight /></button>
        </section>
      )}

      {stage === "mirror" && reflectionResult && (
        <section className={styles.reflectionScreen}>
          <button className={styles.backButton} onClick={() => setStage("traditional")}><ArrowLeft /> 返回六爻判断</button>
          <div className={styles.reflectionHero}><span>05 · SHIGUANG EXPLAINS</span><h1>让拾光翻成人话。</h1><p>前面已经给出判断和依据；这里说清楚，它落到你眼前的处境意味着什么。</p></div>
          <div className={styles.shiguangIntro}><img className={styles.shiguangAvatar} src={assetPath("/characters/shiguang/shiguang-east-chibi.png")} alt="Q版东方拾光" /><div><small>拾光 · SHIGUANG</small><p>我不会否定你想知道答案的心情。卦象已经先回应了你，接下来我只陪你看看，这个方向落到现实里意味着什么。</p></div></div>
          <div className={styles.personaFlow}>
            <article className={styles.understandingCard}><small>拾光翻成人话</small><h2>这对你意味着什么</h2><p>{reflectionResult.reflection.shiguangInterpretation}</p></article>
            <article className={styles.guidanceCard}><small>给你的建议</small><h2>接下来可以怎么做</h2><p>{reflectionResult.reflection.practicalGuidance}</p></article>
          </div>
          {reflectionResult.reflection.closing && <article className={styles.guidanceCard}><small>拾光收个尾</small><p>{reflectionResult.reflection.closing.text}</p></article>}
          <article className={styles.shareCard}>
            <div><small>可分享的今日镜像</small><blockquote>“{reflectionResult.reflection.shareableReflection}”</blockquote><span>{reflectionResult.hexagram.originalHexagram.symbol} {reflectionResult.hexagram.originalHexagram.name} → {reflectionResult.hexagram.changedHexagram.symbol} {reflectionResult.hexagram.changedHexagram.name}</span></div>
            <img src={assetPath("/characters/shiguang/shiguang-share.webp")} alt="" />
            <button disabled={shareGenerating} onClick={generateShareCard}>{shareGenerating ? <><CircleNotch className={styles.spin} /> 正在生成…</> : shareArtifact ? <><Eye /> 查看分享卡</> : <><ShareNetwork /> 生成分享卡</>}</button>
          </article>
          {shareStatus && <p className={styles.shareStatus}><Sparkle /> {shareStatus}</p>}
          <div className={styles.sourceNote}><Sparkle /><span><b>拾光提供的是理解与行动线索</b><small>{reflectionResult.knowledge.framing} 决定仍然属于你。</small></span></div>
          <ShiguangChat theme="east" context={`本次卦象为${reflectionResult.hexagram.originalHexagram.name}变${reflectionResult.hexagram.changedHexagram.name}；页面中的传统依据与规则证据可供复核。`} />
          <details className={styles.explanationTrace}>
            <summary>为什么拾光这样说</summary>
            <div><small>传统依据</small><p>{reflectionResult.explanationTrace.traditional_basis}</p></div>
            <div><small>反思映射</small><p>{reflectionResult.explanationTrace.reflection_mapping}</p></div>
            {reflectionResult.explanationTrace.liuyao_factors.length > 0 && <div><small>六爻规则证据</small><ul>{reflectionResult.explanationTrace.liuyao_factors.map((item) => <li key={item}>{item}</li>)}</ul></div>}
            {reflectionResult.runtimeTrace && <div><small>Runtime 信任检查</small><p>{reflectionResult.runtimeTrace.mode.mode === "deep" ? "深度分析" : "清晰解读"} · 可信评分 {Math.round(reflectionResult.runtimeTrace.evaluation.score * 100)}% · {reflectionResult.runtimeTrace.evaluation.level}</p><p>{reflectionResult.runtimeTrace.stages.filter((stage) => stage.status === "completed").map((stage) => stage.name).join(" → ")}</p>{reflectionResult.runtimeTrace.evaluation.flags.length > 0 && <ul>{reflectionResult.runtimeTrace.evaluation.flags.map((flag) => <li key={flag}>{flag}</li>)}</ul>}</div>}
          </details>
          <div className={styles.reflectionActions}>{reflectionResult.reflection.reflectionQuestion && <button className={styles.secondaryButton} onClick={() => setStage("reflectionQuestion")}>如果愿意，再想一个问题</button>}<button className={styles.primaryButton} onClick={() => setStage("save")}>保存这次解读 <ArrowRight /></button></div>
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
          <div className={styles.reflectionHero}><span>07 · PERSONAL MEMORY</span><h1>保存到你的长期镜像。</h1><p>保存后，问题成为 Event Memory，镜像解读成为 Reflection Memory；Pattern 只会在多次独立证据重复出现后更新。</p></div>
          <article className={styles.saveSummary}><small>本次镜像</small><h2>{reflectionResult.question}</h2><p>{reflectionResult.hexagram.originalHexagram.name} → {reflectionResult.hexagram.changedHexagram.name}</p><blockquote>{reflectionResult.reflection.shareableReflection}</blockquote></article>
          {error && <div className={styles.error} role="alert">{error}</div>}
          <div className={styles.reflectionActions}><button className={styles.secondaryButton} onClick={startMirror}>暂不保存，开启新问题</button><button className={styles.primaryButton} disabled={busy || saved} onClick={saveReflection}>{busy ? <CircleNotch className={styles.spin} /> : saved ? <><Check /> 已保存到镜像</> : <><FloppyDisk /> 保存 Event 与 Reflection Memory</>}</button></div>
          {saved && <p className={styles.savedNote}>已保存。没有把未经支持的 AI 假设写入 Pattern Memory。</p>}
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
