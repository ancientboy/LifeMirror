"use client";

import { ArrowUp, Brain, CircleNotch, Sparkle } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { captureExplicitMemory, getMemorySettings, MEMORY_CHANGED_EVENT, retrieveRelevantMemory, type MemorySettings } from "@/lib/shiguang-memory";
import { createClientId } from "@/lib/client-id";
import styles from "./ShiguangChat.module.css";

type Message = { id: string; role: "user" | "assistant"; text: string };
type Props = {
  theme: "east" | "west";
  context: string;
  opening?: string;
  mode?: "home" | "result";
};

const assetPath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

function contextExcerpt(context: string) {
  const sentences = context.split(/[。；]/).map((item) => item.trim()).filter(Boolean);
  return sentences.slice(0, 3).join("；");
}

function localReply(question: string, context: string, mode: "home" | "result") {
  const focus = question.replace(/[？?。！!]/g, "").trim().slice(0, 42);
  if (mode === "home") {
    if (/你好|在吗|嗨|hello/i.test(question)) return "我在。今天过得怎么样？如果不想从头讲，也可以只告诉我：此刻最占据你心里的，是一件事、一个人，还是一种情绪？";
    if (/难过|焦虑|害怕|累|烦|崩溃|失眠/.test(question)) return `听起来，“${focus}”已经消耗你一阵子了。设备内模式听不懂完整语境，所以我不想假装已经懂你；你可以先只写下两件事：实际发生了什么，以及它让你最担心什么。等拾光 AI 接通后，我会沿着你的原话继续聊。`;
    if (/选择|纠结|犹豫|要不要/.test(question)) return "这像是一个还没法轻易下结论的选择。先别急着算利弊总分：把两个选项各自“最不能承受的代价”写出来，通常会比继续想象结果更快看见你的底线。若想借镜子整理，当下选择可以去探索页试试塔罗。";
    if (/出生|性格|长期|人生|事业运|流年/.test(question)) return "你问的是比较长期的结构。设备内模式只能先帮你分流：命盘偏时间节律、五行和大运流年；占星偏人格动力、关系模式与行星周期。可以从探索页选择，但结果仍应和真实经历相互验证。";
    if (/能不能|会不会|结果|面试|项目|具体/.test(question)) return "这是一个边界比较清楚、可能在近期出现变化的问题。设备内模式无法进行开放式推理；如果你愿意借一面镜子，可以去探索页用六爻拆看助力、阻力与变化条件。";
    return `我收到了你说的“${focus}”。现在拾光 AI 还没接通，我不想用套话假装完全理解。你可以先把它分成三句：发生了什么、你最在意什么、下一步最难在哪里。设备内模式可以陪你整理这三层。`;
  }
  const evidence = contextExcerpt(context);
  if (/最关键|哪张牌|重点|核心/.test(question)) {
    return `我先不绕弯：本次最值得抓住的线索，就在这段盘面里——${evidence}。它不是替你决定结果，而是在提醒你先确认一个现实问题：眼前最强的资源或阻力，是否已经有事实支持？`;
  }
  if (/怎么做|下一步|行动|怎么办/.test(question)) {
    return `如果把“${focus}”落回现实，我建议先做一个可撤回的小实验：从“${evidence}”里选一条最贴近现状的线索，在 24 小时内核实一个事实或完成一个小动作。做完只记录两件事：实际发生了什么，以及它有没有改变你的判断。`;
  }
  if (/为什么|依据|怎么看|意思/.test(question)) {
    return `我的依据不是一句泛泛的安慰，而是本次盘面中的这些可复核信息：${evidence}。在这个基础上，象征解释只能算观察假设。你可以把它和现实逐项对照：哪一条吻合、哪一条不吻合、哪一条还缺证据。`;
  }
  if (/准不准|会不会|一定|结果/.test(question)) {
    return `我不能替你保证“${focus}”的结果。盘面能做的是暴露一种结构或倾向，真正决定下一步的仍是现实条件。就这次而言，可复核的线索是：${evidence}。如果你愿意，我们可以把你最担心的那个结果拆成“已经发生”和“尚未证实”两栏。`;
  }
  return `先把这次结果放回现实里看：${evidence}。设备内模式能做的是帮你核对这条线索，不能理解所有上下文。你可以先判断：它对应的是已经发生的事实、你的解释，还是仍待验证的可能。`;
}

export function ShiguangChat({ theme, context, opening = "如果你对这次结果还有疑问，可以继续问我。我们一起把象征放回真实生活里。", mode = "result" }: Props) {
  const [messages, setMessages] = useState<Message[]>([{ id: "opening", role: "assistant", text: opening }]);
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
    const sync = () => setMemorySettings(getMemorySettings());
    sync();
    window.addEventListener(MEMORY_CHANGED_EVENT, sync);
    return () => window.removeEventListener(MEMORY_CHANGED_EVENT, sync);
  }, []);

  useEffect(() => {
    const seed = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (typeof detail === "string") setInput(detail);
    };
    window.addEventListener("life-mirror:chat-seed", seed);
    return () => window.removeEventListener("life-mirror:chat-seed", seed);
  }, []);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send() {
    const question = input.trim();
    if (!question || streaming) return;
    const activeSettings = temporary ? { ...memorySettings, enabled: false } : memorySettings;
    const savedFact = captureExplicitMemory(question, activeSettings);
    if (savedFact) {
      setSavedNotice(true);
      window.setTimeout(() => setSavedNotice(false), 2800);
    }
    const memory = retrieveRelevantMemory(question, activeSettings);
    const userMessage = { id: createClientId(), role: "user" as const, text: question };
    const assistantId = createClientId();
    setMessages((current) => [...current, userMessage, { id: assistantId, role: "assistant", text: "" }]);
    setInput(""); setStreaming(true);
    try {
      const response = await fetch("/api/shiguang", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ theme, context, memory, messages: [...messages, userMessage].map(({ role, text }) => ({ role, content: text })) }),
      });
      if (!response.ok || !response.body) throw new Error("llm_unavailable");
      setResponseMode("llm");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        streamedText += chunk;
        setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, text: message.text + chunk } : message));
      }
      if (!streamedText.trim()) throw new Error("empty_llm_response");
    } catch {
      setResponseMode("local");
      const answer = localReply(question, context, mode);
      setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, text: answer } : message));
    }
    setStreaming(false);
  }

  return <section className={`${styles.chat} ${styles[theme]} ${styles[mode]}`} aria-label="继续和拾光聊聊">
    <header><img src={assetPath(avatar)} alt={`Q版${theme === "east" ? "东方" : "西方"}拾光`} /><div><small><Sparkle /> {mode === "home" ? "和拾光聊聊" : "继续和拾光聊聊"}</small><h2>{mode === "home" ? "今天想从哪里说起？" : "关于这次结果，你还想问什么？"}</h2></div>{mode === "home" && <button className={`${styles.memoryMode} ${temporary || !memorySettings.enabled ? styles.memoryOff : ""}`} type="button" onClick={() => setTemporary((value) => !value)} aria-pressed={temporary}><Brain /><span>{temporary ? "临时对话" : memorySettings.enabled ? "记忆已开启" : "记忆未开启"}</span></button>}</header>
    <div className={styles.messages} aria-live="polite" ref={messagesRef}>
      {messages.map((message) => <div className={message.role === "assistant" ? styles.assistant : styles.user} key={message.id}>{message.role === "assistant" && <img src={assetPath(avatar)} alt="" />}<p>{message.text}{streaming && message.id === messages.at(-1)?.id && <i />}</p></div>)}
    </div>
    <div className={styles.quickPrompts}>{quickPrompts.map((prompt) => <button type="button" key={prompt} disabled={streaming} onClick={() => setInput(prompt)}>{prompt}</button>)}</div>
    <div className={styles.composer}><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder={mode === "home" ? "说说今天发生了什么，或哪件事一直在心里转……" : "追问、说说困惑，或问下一步怎么做……"} maxLength={300} /><button type="button" disabled={!input.trim() || streaming} onClick={() => void send()} aria-label="发送给拾光">{streaming ? <CircleNotch className={styles.spin} /> : <ArrowUp />}</button></div>
    <footer>{savedNotice ? "已按你的明确要求记住；你可以随时在“我的”中删除。" : temporary ? "临时对话：本轮不读取，也不写入长期记忆。" : responseMode === "llm" ? memorySettings.enabled ? "拾光 AI 正在回应；只检索与当前话题相关的已授权记忆。" : "拾光 AI 正在回应；长期记忆目前未开启。" : responseMode === "local" ? "拾光 AI 暂未接通 · 当前为设备内整理模式。" : memorySettings.enabled ? "长期记忆已开启；镜像只作为可核对的证据。" : "长期记忆默认关闭，可在“我的”中开启。"}</footer>
  </section>;
}
