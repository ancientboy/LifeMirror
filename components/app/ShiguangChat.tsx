"use client";

import { ArrowUp, Brain, CircleNotch, ClockCounterClockwise, Plus, Sparkle, Trash } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { captureExplicitMemory, getMemorySettings, MEMORY_CHANGED_EVENT, retrieveRelevantMemory, type MemorySettings } from "@/lib/shiguang-memory";
import { createClientId } from "@/lib/client-id";
import { ACCOUNT_DATA_CHANGED_EVENT } from "@/lib/account-data";
import { CHAT_HISTORY_CHANGED_EVENT, createChatThread, deleteChatThread, getChatThreads, saveChatThread, type ChatMessage, type ChatThread } from "@/lib/shiguang-chat-history";
import styles from "./ShiguangChat.module.css";

type Props = { theme: "east" | "west"; context: string; opening?: string; mode?: "home" | "result" };
const assetPath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

function contextExcerpt(context: string) { return context.split(/[。；]/).map((item) => item.trim()).filter(Boolean).slice(0, 3).join("；"); }
function localReply(question: string, context: string) {
  const focus = question.replace(/[？?。！!]/g, "").trim().slice(0, 42);
  return `我先陪你把“${focus}”放回现实里看。${contextExcerpt(context)}。现在是设备内整理模式：你可以告诉我，最想先厘清的是发生了什么、你在担心什么，还是下一步怎么走？`;
}

export function ShiguangChat({ theme, context, opening = "如果你对这次结果还有疑问，可以继续问我。我们一起把象征放回真实生活里。", mode = "result" }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [responseMode, setResponseMode] = useState<"ready" | "llm" | "local">("ready");
  const [memorySettings, setMemorySettings] = useState<MemorySettings>({ enabled: false, explicitFacts: true, mirrorEvidence: true });
  const [temporary, setTemporary] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const avatar = theme === "east" ? "/characters/shiguang/shiguang-east-chibi-v2.png" : "/characters/shiguang/shiguang-west-chibi-v2.png";
  const quickPrompts = mode === "home" ? ["我最近总在为一件事焦虑", "我正面临一个选择", "我想更了解自己"] : theme === "east" ? ["这张盘最关键的结构是什么？", "今年这层关系应该怎么看？", "给我一个可验证的下一步"] : ["哪张牌最关键？", "为什么会这样解释？", "给我一个可验证的下一步"];

  useEffect(() => {
    const sync = () => setThreads(getChatThreads());
    const current = getChatThreads().find((item) => item.theme === theme && item.mode === mode && item.context === context) ?? createChatThread({ theme, mode, context }, opening);
    setThread(current); setMessages(current.messages); sync();
    window.addEventListener(CHAT_HISTORY_CHANGED_EVENT, sync);
    return () => window.removeEventListener(CHAT_HISTORY_CHANGED_EVENT, sync);
  }, [context, mode, opening, theme]);
  useEffect(() => {
    const hydrate = () => {
      const candidates = getChatThreads().filter((item) => item.theme === theme && item.mode === mode && item.context === context);
      setThreads(getChatThreads());
      setThread((current) => {
        if (!current || current.messages.length > 1 || !candidates[0] || candidates[0].id === current.id) return current;
        setMessages(candidates[0].messages);
        return candidates[0];
      });
    };
    window.addEventListener(ACCOUNT_DATA_CHANGED_EVENT, hydrate);
    return () => window.removeEventListener(ACCOUNT_DATA_CHANGED_EVENT, hydrate);
  }, [context, mode, theme]);
  useEffect(() => { const sync = () => setMemorySettings(getMemorySettings()); sync(); window.addEventListener(MEMORY_CHANGED_EVENT, sync); return () => window.removeEventListener(MEMORY_CHANGED_EVENT, sync); }, []);
  useEffect(() => { const seed = (event: Event) => { const detail = (event as CustomEvent<string>).detail; if (typeof detail === "string") setInput(detail); }; window.addEventListener("life-mirror:chat-seed", seed); return () => window.removeEventListener("life-mirror:chat-seed", seed); }, []);
  useEffect(() => { messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  function startNew() { const next = createChatThread({ theme, mode, context }, opening); setThread(next); setMessages(next.messages); setHistoryOpen(false); }
  function openThread(next: ChatThread) { setThread(next); setMessages(next.messages); setHistoryOpen(false); }
  function removeThread(id: string, event: React.MouseEvent) { event.stopPropagation(); deleteChatThread(id); if (thread?.id === id) startNew(); }

  async function send() {
    const question = input.trim();
    if (!question || streaming || !thread) return;
    const activeSettings = temporary ? { ...memorySettings, enabled: false } : memorySettings;
    if (captureExplicitMemory(question, activeSettings)) { setSavedNotice(true); window.setTimeout(() => setSavedNotice(false), 2800); }
    const memory = retrieveRelevantMemory(question, activeSettings);
    const now = new Date().toISOString();
    const userMessage: ChatMessage = { id: createClientId(), role: "user", text: question, createdAt: now };
    const assistantId = createClientId();
    const pending: ChatMessage = { id: assistantId, role: "assistant", text: "", createdAt: now };
    const nextMessages = [...messages, userMessage, pending];
    setMessages(nextMessages); if (!temporary) setThread(saveChatThread({ ...thread, messages: nextMessages }));
    setInput(""); setStreaming(true);
    let finalText = "";
    try {
      const response = await fetch("/api/shiguang", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ theme, context, memory, messages: [...messages, userMessage].map(({ role, text }) => ({ role, content: text })) }) });
      if (!response.ok || !response.body) throw new Error("llm_unavailable");
      setResponseMode("llm"); const reader = response.body.getReader(); const decoder = new TextDecoder();
      while (true) { const { done, value } = await reader.read(); if (done) break; const chunk = decoder.decode(value, { stream: true }); finalText += chunk; setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, text: message.text + chunk } : message)); }
      if (!finalText.trim()) throw new Error("empty_llm_response");
    } catch {
      setResponseMode("local"); finalText = localReply(question, context); setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, text: finalText } : message));
    }
    if (!temporary) setThread(saveChatThread({ ...thread, messages: [...messages, userMessage, { ...pending, text: finalText }] }));
    setStreaming(false);
  }

  return <section className={`${styles.chat} ${styles[theme]} ${styles[mode]}`} aria-label="继续和拾光聊聊">
    <header><img src={assetPath(avatar)} alt={`Q版${theme === "east" ? "东方" : "西方"}拾光`} /><div><small><Sparkle /> {mode === "home" ? "和拾光聊聊" : "继续和拾光聊聊"}</small><h2>{mode === "home" ? "今天想从哪里说起？" : "关于这次结果，你还想问什么？"}</h2></div><div className={styles.headerActions}><button className={styles.historyButton} type="button" onClick={() => setHistoryOpen((value) => !value)} aria-expanded={historyOpen}><ClockCounterClockwise /><span>聊天记录</span></button>{mode === "home" && <button className={`${styles.memoryMode} ${temporary || !memorySettings.enabled ? styles.memoryOff : ""}`} type="button" onClick={() => setTemporary((value) => !value)} aria-pressed={temporary}><Brain /><span>{temporary ? "临时对话" : memorySettings.enabled ? "记忆已开启" : "记忆未开启"}</span></button>}</div></header>
    {historyOpen && <aside className={styles.historyPanel}><div><b>聊天记录</b><button type="button" onClick={startNew}><Plus /> 新对话</button></div>{threads.length ? <ul>{threads.map((item) => <li key={item.id} className={item.id === thread?.id ? styles.currentThread : ""}><button type="button" onClick={() => openThread(item)}><b>{item.title}</b><small>{new Date(item.updatedAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}</small></button><button type="button" onClick={(event) => removeThread(item.id, event)} aria-label={`删除对话：${item.title}`}><Trash /></button></li>)}</ul> : <p>还没有保存的对话。</p>}</aside>}
    <div className={styles.messages} aria-live="polite" ref={messagesRef}>{messages.map((message) => <div className={message.role === "assistant" ? styles.assistant : styles.user} key={message.id}>{message.role === "assistant" && <img src={assetPath(avatar)} alt="" />}<p>{message.text}{streaming && message.id === messages.at(-1)?.id && <i />}</p></div>)}</div>
    <div className={styles.quickPrompts}>{quickPrompts.map((prompt) => <button type="button" key={prompt} disabled={streaming} onClick={() => setInput(prompt)}>{prompt}</button>)}</div>
    <div className={styles.composer}><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder={mode === "home" ? "说说今天发生了什么，或哪件事一直在心里转……" : "追问、说说困惑，或问下一步怎么做……"} maxLength={300} /><button type="button" disabled={!input.trim() || streaming} onClick={() => void send()} aria-label="发送给拾光">{streaming ? <CircleNotch className={styles.spin} /> : <ArrowUp />}</button></div>
    <footer>{savedNotice ? "已按你的明确要求记住；你可以随时在“我的”中删除。" : temporary ? "临时对话：退出后不会保留，也不会读取或写入长期记忆。" : responseMode === "local" ? "本次对话已保存 · 拾光 AI 暂未接通，当前为设备内整理模式。" : memorySettings.enabled ? "本次对话已保存；拾光只检索与当前话题相关的已授权记忆。" : "本次对话已保存；长期记忆默认关闭，可在“我的”中开启。"}</footer>
  </section>;
}
