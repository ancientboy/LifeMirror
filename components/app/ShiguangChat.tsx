"use client";

import { ArrowUp, CircleNotch, Sparkle } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
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
  const focus = question.replace(/[？?。！!]/g, "").trim();
  if (mode === "home") {
    const recommendation = /出生|性格|长期|人生|事业运|流年/.test(question)
      ? "如果你想看长期结构，可以再进入命盘或占星；命盘偏时间节律与五行结构，占星偏人格动力与关系模式。"
      : /选择|关系|犹豫|情绪|当下/.test(question)
        ? "如果你希望把当下感受摊开来看，塔罗会比预测式提问更合适。"
        : /能不能|会不会|结果|面试|项目|具体/.test(question)
          ? "如果这是一个边界清楚、近期会有结果的具体问题，可以用六爻把条件和变化拆开。"
          : "我们可以先不选工具，把事情分成“已经发生”“你的感受”和“尚未确认”三层。";
    return `我听见你现在最在意的是“${focus}”。先不用急着得出结论：这件事里，哪一个已经发生的事实最让你不安或反复想到？${recommendation}`;
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
  return `我听见你真正拿不准的是“${focus}”。先把这次盘面放在桌上：${evidence}。我不会把它说成命定答案。你现在更想先厘清哪一层——现实中已经发生的事实、你对它的解释，还是下一步可以验证的行动？`;
}

export function ShiguangChat({ theme, context, opening = "如果你对这次结果还有疑问，可以继续问我。我们一起把象征放回真实生活里。", mode = "result" }: Props) {
  const [messages, setMessages] = useState<Message[]>([{ id: "opening", role: "assistant", text: opening }]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [responseMode, setResponseMode] = useState<"ready" | "llm" | "local">("ready");
  const endRef = useRef<HTMLDivElement>(null);
  const avatar = theme === "east" ? "/characters/shiguang/shiguang-east-chibi.png" : "/characters/shiguang/shiguang-west-chibi.png";
  const quickPrompts = mode === "home" ? ["我最近总在为一件事焦虑", "我正面临一个选择", "我想更了解自己"] : theme === "east" ? ["这张盘最关键的结构是什么？", "今年这层关系应该怎么看？", "给我一个可验证的下一步"] : ["哪张牌最关键？", "为什么会这样解释？", "给我一个可验证的下一步"];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages]);

  async function send() {
    const question = input.trim();
    if (!question || streaming) return;
    const userMessage = { id: crypto.randomUUID(), role: "user" as const, text: question };
    const assistantId = crypto.randomUUID();
    setMessages((current) => [...current, userMessage, { id: assistantId, role: "assistant", text: "" }]);
    setInput(""); setStreaming(true);
    try {
      const response = await fetch("/api/shiguang", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ theme, context, messages: [...messages, userMessage].map(({ role, text }) => ({ role, content: text })) }),
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
      const chunks = answer.match(/.{1,3}/g) ?? [answer];
      for (const chunk of chunks) {
        await new Promise((resolve) => window.setTimeout(resolve, 24));
        setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, text: message.text + chunk } : message));
      }
    }
    setStreaming(false);
  }

  return <section className={`${styles.chat} ${styles[theme]}`} aria-label="继续和拾光聊聊">
    <header><img src={assetPath(avatar)} alt={`Q版${theme === "east" ? "东方" : "西方"}拾光`} /><div><small><Sparkle /> {mode === "home" ? "拾光在这里" : "继续和拾光聊聊"}</small><h2>{mode === "home" ? "今天想从哪里说起？" : "关于这次结果，你还想问什么？"}</h2></div></header>
    <div className={styles.messages} aria-live="polite">
      {messages.map((message) => <div className={message.role === "assistant" ? styles.assistant : styles.user} key={message.id}>{message.role === "assistant" && <img src={assetPath(avatar)} alt="" />}<p>{message.text}{streaming && message.id === messages.at(-1)?.id && <i />}</p></div>)}
      <div ref={endRef} />
    </div>
    <div className={styles.quickPrompts}>{quickPrompts.map((prompt) => <button type="button" key={prompt} disabled={streaming} onClick={() => setInput(prompt)}>{prompt}</button>)}</div>
    <div className={styles.composer}><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder={mode === "home" ? "说说今天发生了什么，或哪件事一直在心里转……" : "追问、说说困惑，或问下一步怎么做……"} maxLength={300} /><button type="button" disabled={!input.trim() || streaming} onClick={() => void send()} aria-label="发送给拾光">{streaming ? <CircleNotch className={styles.spin} /> : <ArrowUp />}</button></div>
    <footer>{responseMode === "llm" ? "拾光 AI 正在结合当前对话与你交流；历史记忆只会在你授权后使用。" : responseMode === "local" ? "模型服务尚未配置，本轮由设备内引导模式回应；不会伪装成 AI 对话。" : "优先连接拾光 AI；不可用时会明确切换为设备内引导模式。"}</footer>
  </section>;
}
