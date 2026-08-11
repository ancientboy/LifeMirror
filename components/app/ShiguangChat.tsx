Warning: truncated output (original token count: 3082)
Total output lines: 120

"use client";

import { ArrowUp, Brain, CircleNotch, ClockCounterClockwise, Plus, Sparkle, Trash } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { captureExplicitMemory, getMemorySettings, MEMORY_CHANGED_EVENT, retrieveRelevantMemory, type MemorySettings } from "@/lib/shiguang-memory";
import { createClientId } from "@/lib/client-id";
import { ACCOUNT_DATA_CHANGED_EVENT, writeLocalAccountData, type AccountSnapshot } from "@/lib/account-data";
import { AccountDataSync } from "./AccountDataSync";
import { CHAT_HISTORY_CHANGED_EVENT, createChatThread, deleteChatThread, getChatThreads, saveChatThread, type ChatMessage, type ChatThread } from "@/lib/shiguang-chat-history";
import styles from "./ShiguangChat.module.css";

type ResearchSource = { title: string; url: string; publishedAt?: string };

type Props = { theme: "east" | "west"; context: string; opening?: string; mode?: "home" | "result" };
const assetPath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

function contextExcerpt(context: string) { return context.split(/[。；]/).map((item) => item.trim()).filter(Boolean).slice(0, 3).join("；"); }
function localReply(question: string, context: string) {
  const focus = question.replace(/[？?。！!]/g, "").trim().slice(0, 42);
  const clue = contextExcerpt(context);
  return clue ? `“${focus}”我记下了。${clue}。先别急着把所有事都想明白，眼下最值得留意的是：这件事有没有给你一个真实、持续的回应。` : `“${focus}”我记下了。你现在像是已经感觉到哪里不对，只是还不想太早把它说死。先不用替谁找答案，看看对方或现实接下来有没有拿出实际回应。`;
}

export function ShiguangChat({ theme, context, opening = "如果你对这次结果还有疑问，可以继续问我。我们一起把象征放回真实生活里。", mode = "result" }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(…2082 tokens truncated…m.id, event)} aria-label={`删除对话：${item.title}`}><Trash /></button></li>)}</ul> : <p>还没有保存的对话。</p>}</aside>}
    <div className={styles.messages} aria-live="polite" ref={messagesRef}>{messages.map((message) => <div className={message.role === "assistant" ? styles.assistant : styles.user} key={message.id}>{message.role === "assistant" && <img src={assetPath(avatar)} alt="" />}<p>{message.text}{streaming && message.id === messages.at(-1)?.id && <i />}</p></div>)}</div>
    {sources.length > 0 && <aside className={styles.sources} aria-label="拾光本次查证的来源"><small>我刚刚核对的来源</small>{sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}{source.publishedAt ? <span>{source.publishedAt.slice(0, 10)}</span> : null}</a>)}</aside>}
    <div className={styles.quickPrompts}>{quickPrompts.map((prompt) => <button type="button" key={prompt} disabled={streaming} onClick={() => setInput(prompt)}>{prompt}</button>)}</div>
    <div className={styles.composer}><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder={mode === "home" ? "说说今天发生了什么，或哪件事一直在心里转……" : "追问、说说困惑，或问下一步怎么做……"} maxLength={300} /><button type="button" disabled={!input.trim() || streaming} onClick={() => void send()} aria-label="发送给拾光">{streaming ? <CircleNotch className={styles.spin} /> : <ArrowUp />}</button></div>
    <footer>{savedNotice ? "已记下这件事；你可以随时在“我的”中删除。" : temporary ? "这次对话不会留在记录里。" : responseMode === "local" ? "这段对话已保存。" : memorySettings.enabled ? "这段对话已保存；拾光只会在相关时想起你授权保留的线索。" : "这段对话已保存。"}</footer>
  </section>;
}