"use client";

import { ArrowLeft, ArrowRight, Check, CircleNotch, ClockCounterClockwise, Eye, FloppyDisk, LockKey, SignOut, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { retrieveLiuyaoKnowledge } from "@/server/knowledge/liuyao-retrieval";
import { calculateLiuyao } from "@/server/tools/liuyao/engine";
import styles from "./DailyMirrorExperience.module.css";

type CoinValue = 2 | 3;
type Toss = readonly [CoinValue, CoinValue, CoinValue];
type Stage = "home" | "question" | "cast" | "reveal" | "reflection";
type Hexagram = {
  method: "three_coins";
  lines: Array<{ position: number; coins: Toss; value: 6 | 7 | 8 | 9; polarity: "yin" | "yang"; moving: boolean; changedPolarity: "yin" | "yang" }>;
  movingLines: number[];
  originalHexagram: { number: number; name: string; symbol: string; upperTrigram: { name: string; nature: string }; lowerTrigram: { name: string; nature: string } };
  changedHexagram: { number: number; name: string; symbol: string; upperTrigram: { name: string; nature: string }; lowerTrigram: { name: string; nature: string } };
};
type Knowledge = {
  framing: string;
  original: { meaning: string; traditionalInterpretation: string; symbolicConcepts: string[]; reflectionPrompt: string };
  changed: { meaning: string; traditionalInterpretation: string; symbolicConcepts: string[]; reflectionPrompt: string };
  movingLineMeanings: string[];
};
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
    observation: `当你带着“${question.trim()}”进入镜像，${hexagram.originalHexagram.name}卦把注意力带向“${knowledge.original.meaning}”。${movingContext}`,
    insight: `${knowledge.original.traditionalInterpretation} 从${hexagram.originalHexagram.name}走向${hexagram.changedHexagram.name}，也许重要的不是立即得到结论，而是看见你正在如何回应变化。`,
    reflectionQuestion: knowledge.original.reflectionPrompt,
    actionSuggestion: `今天先围绕“${knowledge.original.symbolicConcepts[0]}”完成一个可逆的小行动，并记录行动前后的真实感受。`,
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

  const progress = useMemo(() => ({ home: 0, question: 1, cast: 2, reveal: 3, reflection: 4 })[stage], [stage]);

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
      setReflectionResult(result); setStage("reflection");
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

      {stage !== "home" && <nav className={styles.progress} aria-label="Daily Mirror 进度">{["提问", "起卦", "卦象", "反思"].map((label, index) => <span className={progress >= index + 1 ? styles.progressActive : ""} key={label}><i>{progress > index + 1 ? <Check /> : index + 1}</i>{label}</span>)}</nav>}

      {stage === "home" && (
        <section className={styles.homeScreen}>
          <div className={styles.homeCopy}><p>今日镜像 · DAILY REFLECTION</p><h1>今天，<br />你想看清什么？</h1><span>提出一个此刻真实困扰你的问题。象征不是答案，而是一种重新看见自己的方式。</span><button className={styles.heroButton} onClick={startMirror}>开始今日镜像 <ArrowRight /></button></div>
          <div className={styles.mirrorPortal}><div><span>☰</span><i /><strong>REFLECTION<br />BEGINS WITH<br />A QUESTION</strong></div></div>
          <aside className={styles.memoryPreview}>
            <header><ClockCounterClockwise /><span><b>你的镜像</b><small>{history.length} 次已保存的反思</small></span></header>
            {history[0] ? <article><time>{new Date(history[0].savedAt).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}</time><p>{history[0].question}</p><span>{history[0].hexagram.originalHexagram.name} → {history[0].hexagram.changedHexagram.name}</span></article> : <p className={styles.emptyMemory}>完成并保存第一次反思后，它会出现在这里。</p>}
          </aside>
        </section>
      )}

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
            {hexagram && <button className={styles.primaryButton} onClick={() => setStage("reveal")}>揭示卦象 <Eye /></button>}
          </div>
        </section>
      )}

      {stage === "reveal" && hexagram && (
        <section className={styles.resultScreen}>
          <button className={styles.backButton} onClick={() => setStage("cast")}><ArrowLeft /> 返回</button>
          <div className={styles.resultHeader}><span>03 · TRADITIONAL INTERPRETATION</span><h1>今日卦象</h1><p>这是传统象征知识的结构化呈现，不是对未来的确定性判断。</p></div>
          <div className={styles.hexagramReveal}>
            <article><span className={styles.hexSymbol}>{hexagram.originalHexagram.symbol}</span><small>本卦 · 第 {hexagram.originalHexagram.number} 卦</small><h2>{hexagram.originalHexagram.name}</h2><p>{hexagram.originalHexagram.upperTrigram.nature}上 · {hexagram.originalHexagram.lowerTrigram.nature}下</p></article>
            <div className={styles.revealLines}>{[...hexagram.lines].reverse().map((line) => <div key={line.position}><small>{lineNames[line.position - 1]}</small><LineGlyph polarity={line.polarity} moving={line.moving} /></div>)}</div>
            <div className={styles.changeArrow}><span>{hexagram.movingLines.length ? `${hexagram.movingLines.join("、")} 爻动` : "无动爻"}</span><ArrowRight /></div>
            <article><span className={styles.hexSymbol}>{hexagram.changedHexagram.symbol}</span><small>变卦 · 第 {hexagram.changedHexagram.number} 卦</small><h2>{hexagram.changedHexagram.name}</h2><p>{hexagram.changedHexagram.upperTrigram.nature}上 · {hexagram.changedHexagram.lowerTrigram.nature}下</p></article>
          </div>
          <div className={styles.traditionalCard}><span>KNOWLEDGE-003 · SYMBOLIC LAYER</span><h2>{knowledge?.original.meaning}</h2><p>{knowledge?.original.traditionalInterpretation}</p>{knowledge && <div className={styles.keywordRow}>{knowledge.original.symbolicConcepts.map((item) => <i key={item}>{item}</i>)}</div>}{knowledge?.movingLineMeanings.map((meaning) => <small key={meaning}>{meaning}</small>)}</div>
          {error && <div className={styles.error} role="alert">{error}</div>}
          <button className={styles.primaryButton} disabled={busy} onClick={generateReflection}>{busy ? <CircleNotch className={styles.spin} /> : <><Sparkle /> 生成我的镜像反思</>}</button>
        </section>
      )}

      {stage === "reflection" && reflectionResult && (
        <section className={styles.reflectionScreen}>
          <div className={styles.reflectionHero}><span>04 · MIRROR REFLECTION</span><h1>镜子不替你回答，<br />它帮助你看见。</h1><p>基于你的问题、卦象结构与 KNOWLEDGE-003 生成。</p></div>
          <div className={styles.reflectionGrid}>
            <article><small>OBSERVATION · 观察</small><p>{reflectionResult.reflection.observation}</p></article>
            <article className={styles.insightCard}><small>INSIGHT · 洞见</small><p>{reflectionResult.reflection.insight}</p></article>
            <article><small>REFLECTION QUESTION · 反思问题</small><p>{reflectionResult.reflection.reflectionQuestion}</p></article>
            <article><small>NEXT ACTION · 下一步</small><p>{reflectionResult.reflection.actionSuggestion}</p></article>
          </div>
          <div className={styles.sourceNote}><Sparkle /><span><b>这不是预测或命令</b><small>{reflectionResult.knowledge.framing} 最终意义由你的真实经验决定。</small></span></div>
          {error && <div className={styles.error} role="alert">{error}</div>}
          <div className={styles.reflectionActions}><button className={styles.secondaryButton} onClick={startMirror}>开启新问题</button><button className={styles.primaryButton} disabled={busy || saved} onClick={saveReflection}>{busy ? <CircleNotch className={styles.spin} /> : saved ? <><Check /> 已保存到镜像</> : <><FloppyDisk /> 保存这次反思</>}</button></div>
          {saved && <p className={styles.savedNote}>Reflection Event 已保存。Pattern 分析不会在本阶段自动运行。</p>}
        </section>
      )}

      <footer className={styles.appFooter}><span>SYMBOLIC REFLECTION + PERSONAL AI MIRROR</span><Link href="/data/personal-mirror-data-specification/">数据与隐私原则</Link></footer>
    </main>
  );
}
