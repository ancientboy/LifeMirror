"use client";

import { ArrowClockwise, ArrowUp, Brain, Check, ClockCounterClockwise, Copy, Plus, Sparkle, Stop, ThumbsDown, ThumbsUp, Trash } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { captureExplicitMemory, getMemorySettings, MEMORY_CHANGED_EVENT, retrieveRelevantMemory, type MemorySettings } from "@/lib/shiguang-memory";
import { createClientId } from "@/lib/client-id";
import { ACCOUNT_DATA_CHANGED_EVENT, writeLocalAccountData, type AccountSnapshot } from "@/lib/account-data";
import { CHAT_HISTORY_CHANGED_EVENT, createChatThread, deleteChatThread, getChatThreads, saveChatThread, type ChatMessage, type ChatThread } from "@/lib/shiguang-chat-history";
import { recordProductMetric } from "@/lib/product-metrics";
import { createLifeEventLoop, persistLifeEventLoop, readLifeEventLoops } from "@/lib/life-event-loops";
import { classifyRelationship } from "@/lib/relationships/taxonomy";
import { buildRelationshipContext } from "@/lib/relationships/context-builder";
import { shouldGenerateRelationshipReply } from "@/lib/relationships/reply";
import { saveRelationshipCase, saveRelationshipFeedback } from "@/lib/relationships/repository";
import { extractedConversationText, mergeExtractedConversation } from "@/lib/relationships/vision";
import type { ExtractedConversation, RelationshipCase, RelationshipMemoryContext, RelationshipPerson, RelationshipReplyOption } from "@/lib/relationships/types";
import { AttachmentPicker, type AttachmentDraft } from "./relationship-intake/AttachmentPicker";
import { AttachmentPreview } from "./relationship-intake/AttachmentPreview";
import styles from "./ShiguangChat.module.css";

type ResearchSource = { title: string; url: string; publishedAt?: string };
type StreamState = "ready" | "thinking" | "streaming" | "stopped" | "interrupted" | "error";
type StreamEvent = { type?: "delta" | "done" | "interrupted"; text?: string };
type Props = {
  theme: "east" | "west";
  context: string;
  opening?: string;
  mode?: "home" | "result";
  onboarding?: boolean;
  relationship?: { person?: RelationshipPerson; activeCase?: RelationshipCase; memory?: RelationshipMemoryContext; onActivity?: () => void; onCaseCreated?: (value: RelationshipCase) => void };
};
const assetPath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
const visionInputEnabled = process.env.NEXT_PUBLIC_VISION_INPUT_ENABLED !== "false";

async function readAssistantStream(response: Response, onDelta: (text: string) => void) {
  if (!response.body) throw new Error("missing_stream");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  if (!response.headers.get("content-type")?.includes("text/event-stream")) {
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      text += chunk; onDelta(chunk);
    }
    return { text, interrupted: false };
  }
  let buffer = ""; let text = ""; let interrupted = false;
  const consume = (eventBlock: string) => {
    const raw = eventBlock.split(/\r?\n/).filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart()).join("\n");
    if (!raw) return;
    let event: StreamEvent;
    try { event = JSON.parse(raw) as StreamEvent; } catch { return; }
    if (event.type === "delta" && event.text) { text += event.text; onDelta(event.text); }
    if (event.type === "interrupted") interrupted = true;
  };
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split(/\r?\n\r?\n/); buffer = blocks.pop() ?? "";
    blocks.forEach(consume);
  }
  if (buffer.trim()) consume(buffer);
  return { text, interrupted };
}

export function ShiguangChat({ theme, context, opening = "如果你对这次结果还有疑问，可以继续问我。我们一起把象征放回真实生活里。", mode = "result", onboarding = mode === "home", relationship }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [input, setInput] = useState("");
  const [streamState, setStreamState] = useState<StreamState>("ready");
  const [memorySettings, setMemorySettings] = useState<MemorySettings>({ enabled: false, explicitFacts: true, mirrorEvidence: true });
  const [temporary, setTemporary] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [identityProvider, setIdentityProvider] = useState("");
  const [loopSavedFor, setLoopSavedFor] = useState<string | null>(null);
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [replyOptions, setReplyOptions] = useState<RelationshipReplyOption[]>([]);
  const [selectedReplyId, setSelectedReplyId] = useState("");
  const [clarificationOpen, setClarificationOpen] = useState(false);
  const [relationshipCase, setRelationshipCase] = useState<RelationshipCase | undefined>(relationship?.activeCase);
  const [outcomeSaved, setOutcomeSaved] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const avatar = theme === "east" ? "/characters/shiguang/shiguang-east-chibi-v2.png" : "/characters/shiguang/shiguang-west-chibi-v2.png";
  const miniThinking = "/characters/shiguang/mini/shiguang-mini-thinking.webp";
  const miniArrival = "/characters/shiguang/mini/shiguang-mini-arrival.webp";
  const quickPrompts = relationship ? ["TA 这句话是什么意思", "我现在应该怎么回", "我要不要主动"] : mode === "home" ? onboarding ? ["有件事我不知道该跟谁说", "我在等一个结果", "最近有点累，想聊聊"] : [] : theme === "east" ? ["这次最该留意什么？", "这层关系接下来该怎么看？", "直接告诉我你的判断"] : ["哪张牌最关键？", "为什么会这样解释？", "直接告诉我你的判断"];
  const generating = streamState === "thinking" || streamState === "streaming";

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
        setMessages(candidates[0].messages); return candidates[0];
      });
    };
    window.addEventListener(ACCOUNT_DATA_CHANGED_EVENT, hydrate);
    return () => window.removeEventListener(ACCOUNT_DATA_CHANGED_EVENT, hydrate);
  }, [context, mode, theme]);
  useEffect(() => { const sync = () => setMemorySettings(getMemorySettings()); sync(); window.addEventListener(MEMORY_CHANGED_EVENT, sync); return () => window.removeEventListener(MEMORY_CHANGED_EVENT, sync); }, []);
  useEffect(() => {
    setRelationshipCase(relationship?.activeCase);
    const saved = relationship?.activeCase?.recommendedReply;
    setReplyOptions(saved ? [{ id: "saved", tone: "natural", text: saved, why: "上次保存的建议" }] : []);
    setSelectedReplyId(saved ? "saved" : ""); setOutcomeSaved(false);
  }, [relationship?.activeCase]);
  useEffect(() => {
    fetch("/api/v1/auth/session", { credentials: "include" }).then(async (response) => {
      setAuthenticated(response.ok);
      if (response.ok) setIdentityProvider(String((await response.json() as { user?: { provider?: string } }).user?.provider ?? ""));
    }).catch(() => setAuthenticated(false));
    try { setOnboardingDismissed(JSON.parse(window.localStorage.getItem("life-mirror:onboarding:v1") ?? "null")?.stage === "complete"); } catch {}
  }, []);
  useEffect(() => { const seed = (event: Event) => { const detail = (event as CustomEvent<string>).detail; if (typeof detail === "string") setInput(detail); }; window.addEventListener("life-mirror:chat-seed", seed); return () => window.removeEventListener("life-mirror:chat-seed", seed); }, []);
  useEffect(() => { if (stickToBottom.current) messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: streamState === "streaming" ? "auto" : "smooth" }); }, [messages, streamState]);
  useEffect(() => {
    const assistant = [...messages].reverse().find((item) => item.role === "assistant" && item.text.trim());
    const user = [...messages].reverse().find((item) => item.role === "user" && item.text.trim());
    if (assistant && user && readLifeEventLoops().some((item) => item.userFact === user.text && item.status === "open")) setLoopSavedFor(assistant.id);
  }, [messages]);
  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    if (mode === "home" && onboarding && authenticated && messages.filter((item) => item.role === "user").length === 0 && thread) recordProductMetric("onboarding_started", "onboarding", `onboarding:${thread.id}`);
  }, [authenticated, mode, onboarding, thread]);

  function startNew() { abortRef.current?.abort(); const next = createChatThread({ theme, mode, context }, opening); setThread(next); setMessages(next.messages); setHistoryOpen(false); setStreamState("ready"); }
  function openThread(next: ChatThread) { abortRef.current?.abort(); setThread(next); setMessages(next.messages); setHistoryOpen(false); setStreamState("ready"); }
  function removeThread(id: string, event: React.MouseEvent) { event.stopPropagation(); deleteChatThread(id); if (thread?.id === id) startNew(); }

  async function extractAttachments(items: AttachmentDraft[]): Promise<ExtractedConversation | undefined> {
    if (!items.length) return undefined;
    setAttachments((current) => current.map((item) => ({ ...item, status: "uploading" })));
    const form = new FormData();
    items.forEach((item) => { form.append("images", item.file); form.append("dimensions", `${item.width}x${item.height}`); });
    const response = await fetch("/api/shiguang/vision/extract", { method: "POST", credentials: "include", body: form });
    if (!response.ok) {
      setAttachments((current) => current.map((item) => ({ ...item, status: "error" })));
      recordProductMetric("vision_parse_failed", "relationship", `vision-fail:${crypto.randomUUID()}`);
      const error = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(error?.error === "vision_rate_limited" ? "vision_rate_limited" : "vision_extract_failed");
    }
    const value = await response.json() as { conversation?: ExtractedConversation };
    if (!value.conversation?.pages?.length) throw new Error("vision_extract_failed");
    setAttachments((current) => current.map((item) => ({ ...item, status: "parsed" })));
    recordProductMetric("relationship_image_submitted", "relationship", `rel-image:${crypto.randomUUID()}`);
    return value.conversation;
  }

  async function generate(activeThread: ChatThread, history: ChatMessage[], assistantId: string, activeSettings: MemorySettings, retried = false, analysisText?: string) {
    const controller = new AbortController(); abortRef.current = controller;
    setSources([]); setStreamState("thinking");
    let finalText = ""; let delivered = false;
    try {
      const latestQuestion = analysisText ?? [...history].reverse().find((item) => item.role === "user")?.text ?? "";
      const memory = retrieveRelevantMemory(latestQuestion, activeSettings);
      const classification = relationship ? classifyRelationship(latestQuestion, relationship.person ? { domain: relationship.person.domain, role: relationship.person.role, stage: relationship.person.stage, powerPosition: relationship.person.powerPosition } : undefined) : undefined;
      const relationshipContext = classification ? buildRelationshipContext({ classification, person: relationship?.person, activeCase: relationshipCase, memory: relationship?.memory }) : "";
      const apiMessages = history.filter((item) => item.text.trim()).map(({ role, text }) => ({ role, content: text }));
      if (analysisText) {
        const index = apiMessages.findLastIndex((message) => message.role === "user");
        if (index >= 0) apiMessages[index] = { ...apiMessages[index], content: analysisText };
      }
      const response = await fetch("/api/shiguang", { method: "POST", credentials: "include", signal: controller.signal, headers: { "content-type": "application/json", accept: "text/event-stream" }, body: JSON.stringify({ theme, mode: relationship ? "relationship" : "chat", context: relationship ? `${context}\n\n${relationshipContext}` : context, relationship: classification ? { ...classification, personId: relationship?.person?.id, caseId: relationshipCase?.id } : undefined, memory, messages: apiMessages }) });
      if (!response.ok) throw new Error("llm_unavailable");
      const sourceHeader = response.headers.get("x-shiguang-sources");
      if (sourceHeader) { try { const value = JSON.parse(decodeURIComponent(sourceHeader)); if (Array.isArray(value)) setSources(value); } catch {} }
      const streamed = await readAssistantStream(response, (chunk) => {
        if (!finalText) setStreamState("streaming");
        delivered = true;
        finalText += chunk;
        setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, text: message.text + chunk } : message));
      });
      if (!finalText.trim()) throw new Error("empty_llm_response");
      setStreamState(streamed.interrupted ? "interrupted" : "ready");
    } catch (cause) {
      if (controller.signal.aborted) {
        setStreamState("stopped");
        if (!finalText) finalText = "已停止生成。";
      } else {
        setStreamState(finalText ? "interrupted" : "error");
        if (!finalText) finalText = "刚才连接没有成功，但你说的话还在。可以直接重新试一次。";
      }
      setMessages((current) => current.map((message) => message.id === assistantId && !message.text ? { ...message, text: finalText } : message));
    } finally {
      abortRef.current = null;
      const completed = history.concat({ id: assistantId, role: "assistant" as const, text: finalText, createdAt: new Date().toISOString() });
      if (!temporary) setThread(saveChatThread({ ...activeThread, messages: completed }));
      if (delivered) {
        recordProductMetric("first_reply_received", "chat", `reply:${assistantId}`);
        if (relationship) recordProductMetric("relationship_answer_received", "relationship", `rel-answer:${assistantId}`);
      }
      if (retried) recordProductMetric("generation_retried", "chat", `retry:${assistantId}`);
    }
    return finalText;
  }

  async function send(relationshipHint = "") {
    const question = input.trim();
    if ((!question && !attachments.length) || generating || !thread) return;
    if (relationship && !relationship.person && !attachments.length && !relationshipHint && classifyRelationship(question).missingCriticalField === "role") {
      setClarificationOpen(true);
      recordProductMetric("relationship_clarification_shown", "relationship", `rel-clarify:${thread.id}:${Date.now()}`);
      return;
    }
    if (relationshipHint) {
      setClarificationOpen(false);
      recordProductMetric("relationship_clarification_answered", "relationship", `rel-clarified:${thread.id}:${Date.now()}`);
    }
    setAttachmentError(""); setReplyOptions([]); setSelectedReplyId(""); setOutcomeSaved(false);
    let extracted: ExtractedConversation | undefined;
    if (attachments.length) {
      try { extracted = await extractAttachments(attachments); }
      catch (error) { setAttachmentError(error instanceof Error && error.message === "vision_rate_limited" ? "图片识别请求有点多，请稍等一分钟再试。图片还在，不需要重新选择。" : "截图暂时没有识别成功。图片还在，你可以重试，或先粘贴聊天文字。"); return; }
    }
    const extractedMessages = mergeExtractedConversation(extracted);
    const extractedText = extractedConversationText(extractedMessages);
    const displayQuestion = question || `请分析这 ${attachments.length} 张聊天截图。`;
    const analysisText = [relationshipHint ? `[用户补充的关系角色]\n${relationshipHint}` : "", question ? `[用户补充／主观感受]\n${question}` : "", extractedText ? `[截图可见事实（按画面左右归属，内容可被用户纠正）]\n${extractedText}` : ""].filter(Boolean).join("\n\n");
    const activeSettings = temporary ? { ...memorySettings, enabled: false } : memorySettings;
    const capturedFact = captureExplicitMemory(displayQuestion, activeSettings);
    if (capturedFact) {
      if (authenticated) void fetch("/api/v1/account/facts", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: capturedFact.text }) }).then(async (response) => response.ok ? await response.json() as { data?: AccountSnapshot } : null).then((value) => { if (value?.data) writeLocalAccountData(value.data); }).catch(() => undefined);
      setSavedNotice(true); window.setTimeout(() => setSavedNotice(false), 2800);
    }
    const now = new Date().toISOString();
    const userMessage: ChatMessage = { id: createClientId(), role: "user", text: displayQuestion, createdAt: now };
    recordProductMetric("chat_message_sent", "chat", `chat:${userMessage.id}`);
    if (messages.some((message) => message.role === "user")) recordProductMetric("conversation_continued", "chat", `continued:${thread.id}:${userMessage.id}`);
    if (mode === "result") recordProductMetric("tool_continued_chat", "mirror", `tool-chat:${userMessage.id}`);
    const pending: ChatMessage = { id: createClientId(), role: "assistant", text: "", createdAt: now };
    const history = [...messages, userMessage];
    setMessages([...history, pending]); if (!temporary) setThread(saveChatThread({ ...thread, messages: [...history, pending] }));
    setInput(""); setFeedbackFor(null); stickToBottom.current = true; relationship?.onActivity?.();
    if (relationship) recordProductMetric("relationship_text_submitted", "relationship", `rel-text:${userMessage.id}`);
    const generated = await generate(thread, history, pending.id, activeSettings, false, analysisText || displayQuestion);
    const classification = relationship ? classifyRelationship(`${question}\n${extractedText}`, relationship.person ? { domain: relationship.person.domain, role: relationship.person.role, stage: relationship.person.stage, powerPosition: relationship.person.powerPosition } : undefined) : undefined;
    let generatedReplies: RelationshipReplyOption[] = [];
    let recommendedReplyId = "";
    if (relationship && classification && shouldGenerateRelationshipReply({ userNote: question, goal: classification.goal, messages: extractedMessages })) {
      const replyResponse = await fetch("/api/shiguang/relationship/reply", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ userNote: question, analysis: generated, context: buildRelationshipContext({ classification, person: relationship.person, activeCase: relationshipCase, memory: relationship.memory }), messages: extractedMessages }) }).catch(() => null);
      if (replyResponse?.ok) {
        const value = await replyResponse.json() as { options?: RelationshipReplyOption[]; recommendedReplyId?: string };
        generatedReplies = Array.isArray(value.options) ? value.options : [];
        recommendedReplyId = generatedReplies.some((option) => option.id === value.recommendedReplyId) ? value.recommendedReplyId! : generatedReplies[0]?.id ?? "";
        setReplyOptions(generatedReplies); setSelectedReplyId(recommendedReplyId);
      }
    }
    if (relationship && generated.trim() && !temporary) {
      const recommendedReply = generatedReplies.find((option) => option.id === recommendedReplyId)?.text;
      const next = await saveRelationshipCase({ personId: relationship.person?.id, text: displayQuestion, userNote: question, source: attachments.length ? "screenshot" : "text", recommendedReply, extractedConversation: extractedMessages, analysisSummary: generated, replyOptions: generatedReplies }).catch(() => null);
      if (next) { setRelationshipCase(next); relationship.onCaseCreated?.(next); }
    }
    attachments.forEach((item) => URL.revokeObjectURL(item.previewUrl)); setAttachments([]);
  }

  function stopGeneration() {
    if (!generating) return;
    abortRef.current?.abort();
    recordProductMetric("generation_stopped", "chat", `stop:${thread?.id ?? "unknown"}:${Date.now()}`);
  }

  async function retryLast() {
    if (!thread || generating) return;
    const lastUserIndex = messages.findLastIndex((item) => item.role === "user");
    if (lastUserIndex < 0) return;
    const history = messages.slice(0, lastUserIndex + 1);
    const pending: ChatMessage = { id: createClientId(), role: "assistant", text: "", createdAt: new Date().toISOString() };
    setMessages([...history, pending]); setFeedbackFor(null); stickToBottom.current = true;
    const activeSettings = temporary ? { ...memorySettings, enabled: false } : memorySettings;
    await generate(thread, history, pending.id, activeSettings, true);
  }

  async function saveAsOpenLoop() {
    const assistant = [...messages].reverse().find((item) => item.role === "assistant" && item.text.trim());
    const user = [...messages].reverse().find((item) => item.role === "user" && item.text.trim());
    if (!assistant || !user || loopSavedFor === assistant.id) return;
    const loop = createLifeEventLoop(user.text, assistant.text, { source: "chat" });
    await persistLifeEventLoop(loop); recordProductMetric("life_loop_created", "chat", `loop-create:${loop.id}`); setLoopSavedFor(assistant.id);
    try { window.localStorage.setItem("life-mirror:onboarding:v1", JSON.stringify({ version: 1, stage: "complete", completedAt: new Date().toISOString() })); } catch {}
  }

  function giveFeedback(assistantId: string, helpful: boolean) {
    setFeedbackFor(assistantId);
    recordProductMetric(helpful ? "chat_feedback_helpful" : "chat_feedback_missed", "chat", `feedback:${assistantId}`);
  }

  async function reportRelationshipOutcome(outcome: "positive" | "mixed" | "negative" | "no_response") {
    if (!relationshipCase) return;
    await saveRelationshipFeedback({ caseId: relationshipCase.id, acted: outcome !== "no_response", outcome }).catch(() => undefined);
    setOutcomeSaved(true);
    recordProductMetric("relationship_feedback_submitted", "relationship", `rel-feedback:${relationshipCase.id}:${outcome}`);
    if (outcome === "positive") recordProductMetric("relationship_outcome_positive", "relationship", `rel-positive:${relationshipCase.id}`);
    if (outcome === "negative") recordProductMetric("relationship_outcome_negative", "relationship", `rel-negative:${relationshipCase.id}`);
  }

  async function copySuggestedReply() {
    const suggestedReply = replyOptions.find((option) => option.id === selectedReplyId)?.text ?? replyOptions[0]?.text;
    if (!suggestedReply) return;
    await navigator.clipboard.writeText(suggestedReply).catch(() => undefined);
    recordProductMetric("relationship_reply_copied", "relationship", `rel-copy:${relationshipCase?.id ?? crypto.randomUUID()}`);
  }

  const latestAssistantId = [...messages].reverse().find((item) => item.role === "assistant" && item.text.trim())?.id;
  const latestLoopSaved = Boolean(latestAssistantId && loopSavedFor === latestAssistantId);
  const userTurnCount = messages.filter((item) => item.role === "user").length;
  const showIntro = mode === "home" && onboarding && userTurnCount === 0 && !onboardingDismissed;
  const showRetry = streamState === "error" || streamState === "interrupted" || streamState === "stopped";

  return <section className={`${styles.chat} ${styles[theme]} ${styles[mode]} ${relationship ? styles.relationship : ""}`} aria-label={relationship ? "把聊天发给拾光" : "继续和拾光聊聊"}>
    <header><img src={assetPath(avatar)} alt={`Q版${theme === "east" ? "东方" : "西方"}拾光`} /><div><small><Sparkle /> {relationship ? "看懂 TA · 想好下一句" : mode === "home" ? "拾光在这里" : "继续和拾光聊聊"}</small><h2>{relationship ? relationship.person ? `继续聊 ${relationship.person.displayName}` : "把聊天发来" : mode === "home" ? "慢慢说，我在听。" : "这件事后来怎么样了？"}</h2></div><div className={styles.headerActions}><button className={styles.historyButton} type="button" onClick={() => setHistoryOpen((value) => !value)} aria-expanded={historyOpen}><ClockCounterClockwise /><span>聊天记录</span></button>{mode === "home" && <button className={`${styles.memoryMode} ${temporary || !memorySettings.enabled ? styles.memoryOff : ""}`} type="button" onClick={() => setTemporary((value) => !value)} aria-pressed={temporary}><Brain /><span>{temporary ? "这次不留下" : memorySettings.enabled ? "记忆已开启" : "记忆未开启"}</span></button>}</div></header>
    {historyOpen && <aside className={styles.historyPanel}><div><b>聊天记录</b><button type="button" onClick={startNew}><Plus /> 新对话</button></div>{threads.length ? <ul>{threads.map((item) => <li key={item.id} className={item.id === thread?.id ? styles.currentThread : ""}><button type="button" onClick={() => openThread(item)}><b>{item.title}</b><small>{new Date(item.updatedAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}</small></button><button type="button" onClick={(event) => removeThread(item.id, event)} aria-label={`删除对话：${item.title}`}><Trash /></button></li>)}</ul> : <p>还没有保存的对话。</p>}</aside>}
    {showIntro && <aside className={styles.onboarding}><button type="button" aria-label="关闭引导" onClick={() => setOnboardingDismissed(true)}>×</button><small>第一次来，不用先建人物</small><b>{relationship ? "贴聊天、发截图，或直接描述发生了什么。" : "直接说一件正在发生的事。"}</b><p>{relationship ? "只有关系类型真的会改变建议时，拾光才会轻轻确认一次。" : "拾光会先理解、给判断，再陪你看后来发生了什么。"}</p></aside>}
    <div className={styles.messages} aria-live="polite" ref={messagesRef} onScroll={(event) => { const node = event.currentTarget; stickToBottom.current = node.scrollHeight - node.clientHeight - node.scrollTop < 90; }}>{messages.map((message) => {
      const waitingForReply = message.role === "assistant" && !message.text && streamState === "thinking";
      const replyArriving = theme === "east" && message.role === "assistant" && Boolean(message.text) && streamState === "streaming" && message.id === messages.at(-1)?.id;
      return <div className={message.role === "assistant" ? styles.assistant : styles.user} key={message.id}>
        {message.role === "assistant" && !waitingForReply && <img src={assetPath(avatar)} alt="" />}
        <div className={`${styles.bubbleWrap} ${waitingForReply && theme === "east" ? styles.thinkingBubble : ""}`}>{waitingForReply && theme === "east" && <img className={styles.miniThinking} src={assetPath(miniThinking)} alt="" />}{replyArriving && <img className={styles.miniArrival} src={assetPath(miniArrival)} alt="" />}<p>{waitingForReply ? <span className={styles.thinking}>拾光正在理一理<span>···</span></span> : message.text}{streamState === "streaming" && message.id === messages.at(-1)?.id && <i />}</p></div>
      </div>;
    })}</div>
    {sources.length > 0 && <aside className={styles.sources} aria-label="拾光本次查证的来源"><small>我刚刚核对的来源</small>{sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}{source.publishedAt ? <span>{source.publishedAt.slice(0, 10)}</span> : null}</a>)}</aside>}
    {showRetry && <div className={styles.recovery}><span>{streamState === "stopped" ? "已停止，刚才的话还在。" : "回答没有完整结束，刚才的话还在。"}</span><button type="button" onClick={() => void retryLast()}><ArrowClockwise /> 重新回答</button></div>}
    {relationship && replyOptions.length > 0 && !generating && <aside className={styles.replyCard}><small>可以直接发</small><p>{replyOptions.find((option) => option.id === selectedReplyId)?.text ?? replyOptions[0].text}</p>{replyOptions.length > 1 && <div className={styles.replyChoices}>{replyOptions.map((option) => <button type="button" key={option.id} className={option.id === selectedReplyId ? styles.selectedReply : ""} onClick={() => setSelectedReplyId(option.id)}>{option.tone === "warm" ? "温柔" : option.tone === "direct" ? "直接" : option.tone === "boundary" ? "有边界" : "自然"}</button>)}</div>}<button className={styles.copyReply} type="button" onClick={() => void copySuggestedReply()} aria-label="复制这句话" title="复制这句话"><Copy /></button></aside>}
    {relationship && relationshipCase && !generating && <aside className={styles.outcomeCard}><b>{outcomeSaved ? "这次现实结果已经记下，下一次判断会参考它。" : "TA 后来怎么回？"}</b>{!outcomeSaved && <div><button type="button" onClick={() => void reportRelationshipOutcome("positive")}>回应不错</button><button type="button" onClick={() => void reportRelationshipOutcome("mixed")}>有来有回</button><button type="button" onClick={() => void reportRelationshipOutcome("negative")}>不太顺利</button><button type="button" onClick={() => void reportRelationshipOutcome("no_response")}>还没回复</button></div>}</aside>}
    {relationship && clarificationOpen && <aside className={styles.clarificationCard}><b>这是谁发来的？</b><p>关系不同，主动程度和边界会不一样。选一个最接近的就好。</p><div>{["暧昧／约会对象", "伴侣", "前任", "朋友", "同事／领导", "家人"].map((label) => <button type="button" key={label} onClick={() => void send(label)}>{label}</button>)}</div></aside>}
    {!generating && latestAssistantId && userTurnCount >= 2 && <div className={styles.feedback}><span>{feedbackFor === latestAssistantId ? <><Check /> 已收到，谢谢你告诉我</> : "这次有帮到你吗？"}</span>{feedbackFor !== latestAssistantId && <><button type="button" onClick={() => giveFeedback(latestAssistantId, true)}><ThumbsUp /> 有帮助</button><button type="button" onClick={() => giveFeedback(latestAssistantId, false)}><ThumbsDown /> 没说中</button></>}</div>}
    {!generating && messages.some((item) => item.role === "user") && <div className={styles.loopAction}><button type="button" onClick={() => void saveAsOpenLoop()} disabled={latestLoopSaved}>{latestLoopSaved ? "✓ 拾光会从这里接着问后来" : "等有结果时提醒我"}</button>{latestLoopSaved && <small>以后有进展，不用重新讲背景。</small>}</div>}
    {identityProvider === "invite" && userTurnCount >= 2 && <aside className={styles.bindPrompt}><span><b>想换设备继续？</b><small>现在再绑定邮箱，当前记录不会丢。</small></span><a href="/app/?bind=1&return=/app/home/">绑定邮箱</a></aside>}
    {quickPrompts.length > 0 && (mode !== "home" || userTurnCount === 0) && <div className={styles.quickPrompts}>{quickPrompts.map((prompt) => <button type="button" key={prompt} disabled={generating} onClick={() => { setInput(prompt); if (mode === "home" && userTurnCount === 0) recordProductMetric("onboarding_prompt_used", "onboarding", `prompt:${quickPrompts.indexOf(prompt)}:${Date.now()}`); }}>{prompt}</button>)}</div>}
    {relationship && <AttachmentPreview className={styles.attachmentPreview} items={attachments} onRemove={(id) => setAttachments((current) => { const item = current.find((value) => value.id === id); if (item) URL.revokeObjectURL(item.previewUrl); return current.filter((value) => value.id !== id); })} />}
    {attachmentError && <div className={styles.attachmentError}>{attachmentError}</div>}
    <div className={`${styles.composer} ${relationship && visionInputEnabled ? styles.attachmentComposer : ""}`}>{relationship && visionInputEnabled && <AttachmentPicker disabled={generating} remaining={3 - attachments.length} onPrepared={(items) => { setAttachmentError(""); setAttachments((current) => [...current, ...items].slice(0, 3)); }} onError={setAttachmentError} />}<textarea value={input} onChange={(event) => setInput(event.target.value)} onFocus={() => { stickToBottom.current = true; }} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder={relationship ? visionInputEnabled ? "粘贴聊天、描述发生了什么，也可以只发截图……" : "粘贴聊天，或直接描述发生了什么……" : mode === "home" ? "说说今天发生了什么，或哪件事一直在心里转……" : "追问、说说困惑，或问下一步怎么做……"} maxLength={relationship || mode === "home" ? 2000 : 300} /><button type="button" disabled={!generating && !input.trim() && !attachments.length} onClick={() => generating ? stopGeneration() : void send()} aria-label={generating ? "停止生成" : "发送给拾光"}>{generating ? <Stop weight="fill" /> : <ArrowUp />}</button></div>
    <footer>{relationship ? "截图原图只用于本次识别，不会写入人物记录；识别结果也可以随时纠正。" : savedNotice ? "已记下这件事；你可以随时在“我的”中删除。" : temporary ? "这次对话不会留在记录里。" : memorySettings.enabled ? "这段对话已保存；拾光只会在相关时想起你授权保留的线索。" : "这段对话已保存。"}</footer>
  </section>;
}
