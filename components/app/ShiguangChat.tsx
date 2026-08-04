"use client";

import { ArrowUp, CircleNotch, Sparkle } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import styles from "./ShiguangChat.module.css";

type Message = { id: string; role: "user" | "assistant"; text: string };
type Props = {
  theme: "east" | "west";
  context: string;
  opening?: string;
};

const assetPath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

function localReply(question: string, context: string) {
  const focus = question.replace(/[？?。！!]/g, "").trim();
  if (/怎么做|下一步|行动|怎么办/.test(question)) {
    return `如果把“${focus}”落回现实，我建议先不追求一次想透。请从这次镜像里挑出一个你能在 24 小时内验证的小动作，完成后再观察：事实发生了什么、你的感受有什么变化。${context}`;
  }
  if (/为什么|依据|怎么看|意思/.test(question)) {
    return `我这样理解，是因为当前盘面提供的是一种观察角度，不是替你下结论。先把它和你已经知道的现实证据逐项对照：哪些吻合，哪些不吻合，哪些仍需要验证。${context}`;
  }
  return `我听见你还在关心“${focus}”。我们可以先把它拆成两层：已经发生、可以确认的事实；以及你对这些事实的解释。你愿意先说说，哪一部分最让你拿不准？${context}`;
}

export function ShiguangChat({ theme, context, opening = "如果你对这次结果还有疑问，可以继续问我。我们一起把象征放回真实生活里。" }: Props) {
  const [messages, setMessages] = useState<Message[]>([{ id: "opening", role: "assistant", text: opening }]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const avatar = theme === "east" ? "/characters/shiguang/shiguang-east-chibi.png" : "/characters/shiguang/shiguang-west-chibi.png";

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages]);

  async function send() {
    const question = input.trim();
    if (!question || streaming) return;
    const userMessage = { id: crypto.randomUUID(), role: "user" as const, text: question };
    const assistantId = crypto.randomUUID();
    setMessages((current) => [...current, userMessage, { id: assistantId, role: "assistant", text: "" }]);
    setInput(""); setStreaming(true);
    const answer = localReply(question, context);
    const chunks = answer.match(/.{1,3}/g) ?? [answer];
    for (const chunk of chunks) {
      await new Promise((resolve) => window.setTimeout(resolve, 28));
      setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, text: message.text + chunk } : message));
    }
    setStreaming(false);
  }

  return <section className={`${styles.chat} ${styles[theme]}`} aria-label="继续和拾光聊聊">
    <header><img src={assetPath(avatar)} alt={`Q版${theme === "east" ? "东方" : "西方"}拾光`} /><div><small><Sparkle /> 继续和拾光聊聊</small><h2>关于这次结果，你还想问什么？</h2></div></header>
    <div className={styles.messages} aria-live="polite">
      {messages.map((message) => <div className={message.role === "assistant" ? styles.assistant : styles.user} key={message.id}>{message.role === "assistant" && <img src={assetPath(avatar)} alt="" />}<p>{message.text}{streaming && message.id === messages.at(-1)?.id && <i />}</p></div>)}
      <div ref={endRef} />
    </div>
    <div className={styles.composer}><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder="追问、说说困惑，或问下一步怎么做……" maxLength={300} /><button type="button" disabled={!input.trim() || streaming} onClick={() => void send()} aria-label="发送给拾光">{streaming ? <CircleNotch className={styles.spin} /> : <ArrowUp />}</button></div>
    <footer>当前为设备内即时陪伴模式；接入个人镜像服务器后，将能结合你授权的历史记录继续对话。</footer>
  </section>;
}
