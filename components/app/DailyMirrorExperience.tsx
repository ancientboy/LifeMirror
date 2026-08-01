"use client";

import { ArrowLeft, ArrowRight, Check, CircleNotch, ClockCounterClockwise, Eye, FloppyDisk, LockKey, SignOut, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { retrieveLiuyaoKnowledge } from "@/server/knowledge/liuyao-retrieval";
import type { LiuyaoKnowledgeContext } from "@/server/knowledge/liuyao-retrieval";
import { calculateLiuyao } from "@/server/tools/liuyao/engine";
import type { LiuyaoResult } from "@/server/tools/liuyao/types";
import { MemoryControls } from "./MemoryControls";
import styles from "./DailyMirrorExperience.module.css";

type CoinValue = 2 | 3;
type Toss = readonly [CoinValue, CoinValue, CoinValue];
type Stage = "home" | "question" | "cast" | "hexagram" | "traditional" | "mirror" | "reflectionQuestion" | "save" | "memory";
type Hexagram = LiuyaoResult;
type Knowledge = LiuyaoKnowledgeContext;
type Reflection = { observation: string; insight: string; reflectionQuestion: string; actionSuggestion: string };
type ReflectionResponse = { question: string; hexagram: Hexagram; knowledge: Knowledge; reflection: Reflection; draftToken: string; expiresAt: string };
type HistoryEvent = { id: string; question: string; hexagram: Hexagram; reflection: Reflection; savedAt: string };

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787").replace(/\/$/, "");
const GUEST_SESSION_KEY = "life-mirror:guest-session:v1";
const GUEST_HISTORY_KEY = "life-mirror:guest-history:v1";
const suggestions = ["我该如何看待现在的职业选择？", "这段关系正在提醒我什么？", "我为什么迟迟无法开始？"];
const lineNames = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];

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

function createGuestReflection(question: string, hexagram: Hexagram, knowledge: Knowledge): ReflectionResponse {
  const movingContext = hexagram.movingLines.length
    ? `第 ${hexagram.movingLines.join("、")} 爻的变化提示，当前处境并非静止不动。`
    : "没有动爻，提示你先把注意力放回当前处境本身。";
  const reflection: Reflection = {
    observation: `当你带着“${question.trim()}”进入镜像，${hexagram.originalHexagram.name}卦把注意力带向“${knowledge.original.symbolic.meaning}”。${movingContext}`,
    insight: `${knowledge.original.symbolic.interpretation} 从${hexagram.originalHexagram.name}走向${hexagram.changedHexagram.name}，这组象征与你的问题可能相关，因为它把注意力从“立即得到结论”转向“看见自己正在如何回应变化”。`,
    reflectionQuestion: knowledge.original.reflectionMapping.prompt,
    actionSuggestion: `今天先围绕“${knowledge.original.symbolic.keywords[0]}”完成一个可逆的小行动，并记录行动前后的真实感受。`,
  };
  return {
    question: question.trim(),
    hexagram,
    knowledge,
    reflection,
    draftToken: `guest-${crypto.randomUUID()}`,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };
}

function LineGlyph({ polarity, moving }: { polarity: "yin" | "yang"; moving?: boolean }) {
  return <span className={`${styles.lineGlyph} ${styles[polarity]}${moving ? ` ${styles.moving}` : ""}`} aria-label={`${polarity === "yang" ? "阳爻" : "阴爻"}${moving ? "，动爻" : ""}`}><i /><i /></span>;
}

export function DailyMirrorExperience() {
  const [stage, setStage] = useState<Stage>("home");
  const [authState, setAuthState] = useState<"checking" | "signedOut" | "guest" | "authenticated">("checking");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [question, setQuestion] = useState("");
  const [tosses, setTosses] = useState<Toss[]>([]);
  const [hexagram, setHexagram] = useState<Hexagram | null>(null);
  const [knowledge, setKnowledge] = useState<Knowledge | null>(null);
  const [reflectionResult, setReflectionResult] = useState<ReflectionResponse | null>(null);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [casting, setCasting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

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

  const progress = useMemo(() => ({ home: 0, question: 1, cast: 2, hexagram: 3, traditional: 4, mirror: 5, reflectionQuestion: 6, save: 7, memory: 0 })[stage], [stage]);

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

  function startMirror() {
    setQuestion(""); setTosses([]); setHexagram(null); setKnowledge(null); setReflectionResult(null); setSaved(false); setError(""); setStage("question");
  }

  async function castLine() {
    if (casting || tosses.length >= 6) return;
    setCasting(true); setError("");
    const nextToss = createToss();
    await new Promise((resolve) => window.setTimeout(resolve, 680));
    const next = [...tosses, nextToss];
    setTosses(next); setCasting(false);
    if (next.length === 6) {
      setBusy(true);
      try {
        let result: { hexagram: Hexagram; knowledge: Knowledge };
        if (authState === "guest") {
          const localHexagram = calculateLiuyao(next);
          result = { hexagram: localHexagram, knowledge: retrieveLiuyaoKnowledge(localHexagram) };
        } else {
          result = await api<{ hexagram: Hexagram; knowledge: Knowledge }>("/api/v1/tools/liuyao/calculate", { method: "POST", body: JSON.stringify({ tosses: next }) });
        }
        setHexagram(result.hexagram);
        setKnowledge(result.knowledge);
      } catch (cause) { setError(readableError(cause)); }
      finally { setBusy(false); }
    }
  }

  async function generateReflection() {
    setBusy(true); setError("");
    try {
      const result = authState === "guest" && hexagram && knowledge
        ? createGuestReflection(question, hexagram, knowledge)
        : await api<ReflectionResponse>("/api/v1/daily-mirror/reflections", { method: "POST", body: JSON.stringify({ question, tosses }) });
      setReflectionResult(result); setStage("mirror");
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
            <span>Daily Mirror 通过传统象征、知识检索和 AI Reflection，提供一面温和而诚实的个人镜子。</span>
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
        <Link href="/" className={styles.productBrand}><span className={styles.brandOrb}>◌</span><b>LIFE MIRROR</b><small>DAILY MIRROR</small></Link>
        <div className={styles.headerActions}><span><LockKey />{authState === "guest" ? "游客镜像" : "私人镜像"}</span><button onClick={logout} disabled={busy} aria-label="退出登录"><SignOut /></button></div>
      </header>

      {stage !== "home" && stage !== "memory" && <nav className={styles.progress} aria-label="Daily Mirror 进度">{["提问", "起卦", "卦象", "传统解释", "镜像解读", "反思问题", "保存"].map((label, index) => <span className={progress >= index + 1 ? styles.progressActive : ""} key={label}><i>{progress > index + 1 ? <Check /> : index + 1}</i>{label}</span>)}</nav>}

      {stage === "home" && (
        <section className={styles.homeScreen}>
          <div className={styles.homeCopy}><p>今日镜像 · DAILY REFLECTION</p><h1>今天，<br />你想看清什么？</h1><span>提出一个此刻真实困扰你的问题。象征不是答案，而是一种重新看见自己的方式。</span><button className={styles.heroButton} onClick={startMirror}>开始今日镜像 <ArrowRight /></button></div>
          <div className={styles.mirrorPortal}><div><span>☰</span><i /><strong>REFLECTION<br />BEGINS WITH<br />A QUESTION</strong></div></div>
          <aside className={styles.memoryPreview}>
            <header><ClockCounterClockwise /><span><b>你的镜像</b><small>{history.length} 次已保存的反思</small></span></header>
            {history[0] ? <article><time>{new Date(history[0].savedAt).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}</time><p>{history[0].question}</p><span>{history[0].hexagram.originalHexagram.name} → {history[0].hexagram.changedHexagram.name}</span></article> : <p className={styles.emptyMemory}>完成并保存第一次反思后，它会出现在这里。</p>}
            <button className={styles.manageMemoryButton} onClick={() => setStage("memory")}>管理我的记忆 <ArrowRight /></button>
          </aside>
        </section>
      )}

      {stage === "memory" && <MemoryControls mode={authState} onClose={() => setStage("home")} onChanged={() => { if (authState === "guest") setHistory(readGuestHistory()); else void loadHistory(); }} />}

      {stage === "question" && (
        <section className={styles.stepScreen}>
          <button className={styles.backButton} onClick={() => setStage("home")}><ArrowLeft /> 返回</button>
          <div className={styles.stepIntro}><span>01 · QUESTION</span><h1>把注意力放在一个<br />真正重要的问题上。</h1><p>尽量询问自己的处境、选择与感受，而不是要求一个确定的未来。</p></div>
          <div className={styles.questionCard}><label htmlFor="mirror-question">此刻，我想探索的是</label><textarea id="mirror-question" maxLength={500} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="写下你正在思考的问题……" autoFocus /><div className={styles.questionMeta}><span>{question.length} / 500</span><span>内容只在你请求反思或保存时发送</span></div><div className={styles.suggestions}>{suggestions.map((item) => <button key={item} onClick={() => setQuestion(item)}>{item}</button>)}</div><button className={styles.primaryButton} disabled={question.trim().length < 5} onClick={() => setStage("cast")}>带着问题进入 <ArrowRight /></button></div>
        </section>
      )}

      {stage === "cast" && (
        <section className={`${styles.stepScreen} ${styles.castScreen}`}>
          <button className={styles.backButton} onClick={() => setStage("question")}><ArrowLeft /> 返回问题</button>
          <div className={styles.stepIntro}><span>02 · LIUYAO INTERACTION</span><h1>安静片刻，完成六次投币。</h1><p>六爻由下至上形成。每一次触碰，都只是为思考提供一个新的观察角度。</p></div>
          <div className={styles.castWorkspace}>
            <div className={styles.coinStage}>{[0,1,2].map((index) => <span className={casting ? styles.coinCasting : ""} style={{ animationDelay: `${index * 90}ms` }} key={index}>{tosses.at(-1)?.[index] === 2 ? "字" : "背"}</span>)}</div>
            <div className={styles.lineStack}>{Array.from({ length: 6 }, (_, reverseIndex) => 5 - reverseIndex).map((index) => { const lineValue = tosses[index]?.reduce((sum, value) => sum + value, 0); const polarity = lineValue === 6 || lineValue === 8 ? "yin" : "yang"; return <div className={tosses[index] ? styles.lineReady : ""} key={index}><small>{lineNames[index]}</small>{tosses[index] ? <LineGlyph polarity={polarity} moving={lineValue === 6 || lineValue === 9} /> : <span className={styles.linePlaceholder} />}</div>; })}</div>
            <button className={styles.castButton} onClick={castLine} disabled={casting || busy || tosses.length === 6}>{casting ? <CircleNotch className={styles.spin} /> : tosses.length === 6 ? <Check /> : <><span>投</span><small>第 {tosses.length + 1} 次</small></>}</button>
            <p>{tosses.length} / 6 爻已形成</p>
            {error && <div className={styles.error} role="alert">{error}</div>}
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
          <button className={styles.primaryButton} onClick={() => setStage("traditional")}>阅读六爻传统解释 <ArrowRight /></button>
        </section>
      )}

      {stage === "traditional" && hexagram && knowledge && (
        <section className={styles.resultScreen}>
          <button className={styles.backButton} onClick={() => setStage("hexagram")}><ArrowLeft /> 返回卦象</button>
          <div className={styles.resultHeader}><span>04 · SYMBOLIC LAYER</span><h1>六爻传统解释</h1><p>以下卦辞、象辞与爻辞由 KNOWLEDGE-003 检索，不由模型生成。</p></div>
          <div className={styles.layerBadge}><span>知识系统</span><b>解释卦象</b><small>CLASSICAL KNOWLEDGE</small></div>
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
          {error && <div className={styles.error} role="alert">{error}</div>}
          <button className={styles.primaryButton} disabled={busy} onClick={generateReflection}>{busy ? <CircleNotch className={styles.spin} /> : <><Sparkle /> 进入 Life Mirror 镜像解读</>}</button>
        </section>
      )}

      {stage === "mirror" && reflectionResult && (
        <section className={styles.reflectionScreen}>
          <button className={styles.backButton} onClick={() => setStage("traditional")}><ArrowLeft /> 返回传统解释</button>
          <div className={styles.reflectionHero}><span>05 · MIRROR LAYER</span><h1>Life Mirror 镜像解读</h1><p>现在才把传统象征与你的问题和个人上下文连接起来。</p></div>
          <div className={styles.layerBadge}><span>Runtime + LLM</span><b>连接你的处境</b><small>PERSONAL REFLECTION</small></div>
          <div className={styles.reflectionGrid}>
            <article><small>OBSERVATION · 观察</small><p>{reflectionResult.reflection.observation}</p></article>
            <article className={styles.insightCard}><small>INSIGHT · 为什么可能相关</small><p>{reflectionResult.reflection.insight}</p></article>
          </div>
          <div className={styles.sourceNote}><Sparkle /><span><b>这不是预测或命令</b><small>{reflectionResult.knowledge.framing} 最终意义由你的真实经验决定。</small></span></div>
          <div className={styles.reflectionActions}><button className={styles.primaryButton} onClick={() => setStage("reflectionQuestion")}>查看反思问题如何生成 <ArrowRight /></button></div>
        </section>
      )}

      {stage === "reflectionQuestion" && reflectionResult && (
        <section className={styles.reflectionScreen}>
          <button className={styles.backButton} onClick={() => setStage("mirror")}><ArrowLeft /> 返回镜像解读</button>
          <div className={styles.reflectionHero}><span>06 · REFLECTION QUESTION</span><h1>把解释带回你的经验。</h1><p>这个问题来自前面的传统象征、你的提问和镜像观察，不是突然出现的建议。</p></div>
          <article className={styles.questionFocus}><small>给你的反思问题</small><h2>{reflectionResult.reflection.reflectionQuestion}</h2><div><b>它为何出现</b><p>{reflectionResult.reflection.insight}</p></div><div><b>一个可逆的小行动</b><p>{reflectionResult.reflection.actionSuggestion}</p></div></article>
          <div className={styles.reflectionActions}><button className={styles.primaryButton} onClick={() => setStage("save")}>继续保存这次镜像 <ArrowRight /></button></div>
        </section>
      )}

      {stage === "save" && reflectionResult && (
        <section className={styles.reflectionScreen}>
          <button className={styles.backButton} onClick={() => setStage("reflectionQuestion")}><ArrowLeft /> 返回反思问题</button>
          <div className={styles.reflectionHero}><span>07 · PERSONAL MEMORY</span><h1>保存到你的长期镜像。</h1><p>保存后，问题成为 Event Memory，镜像解读成为 Reflection Memory；Pattern 只会在多次独立证据重复出现后更新。</p></div>
          <article className={styles.saveSummary}><small>本次镜像</small><h2>{reflectionResult.question}</h2><p>{reflectionResult.hexagram.originalHexagram.name} → {reflectionResult.hexagram.changedHexagram.name}</p><blockquote>{reflectionResult.reflection.insight}</blockquote></article>
          {error && <div className={styles.error} role="alert">{error}</div>}
          <div className={styles.reflectionActions}><button className={styles.secondaryButton} onClick={startMirror}>暂不保存，开启新问题</button><button className={styles.primaryButton} disabled={busy || saved} onClick={saveReflection}>{busy ? <CircleNotch className={styles.spin} /> : saved ? <><Check /> 已保存到镜像</> : <><FloppyDisk /> 保存 Event 与 Reflection Memory</>}</button></div>
          {saved && <p className={styles.savedNote}>已保存。没有把未经支持的 AI 假设写入 Pattern Memory。</p>}
        </section>
      )}

      <footer className={styles.appFooter}><span>SYMBOLIC REFLECTION + PERSONAL AI MIRROR</span><Link href="/data/personal-mirror-data-specification/">数据与隐私原则</Link></footer>
    </main>
  );
}
