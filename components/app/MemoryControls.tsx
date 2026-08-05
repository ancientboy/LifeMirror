"use client";

import { ArrowLeft, CircleNotch, DownloadSimple, Eye, EyeSlash, FloppyDisk, Trash } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import styles from "./MemoryControls.module.css";
import { markAccountDataChanged } from "@/lib/account-data";

type Mode = "guest" | "authenticated";
type MemoryEvent = {
  id: string;
  sourceEventId: string;
  title: string;
  topic: string;
  triggerText: string;
  summary: string;
  occurredAt: string;
  visibility: "visible" | "hidden";
  userCorrected: boolean;
};
type PatternMemory = {
  id: string;
  title: string;
  summary: string;
  signalCount: number;
  confidence: number;
  visibility: "visible" | "hidden";
};
type GuestEvent = {
  id: string;
  question: string;
  savedAt: string;
  reflection: { insight?: string; mirrorUnderstanding?: string; shiguangInterpretation?: string; traditionalJudgment?: string; shareableReflection?: string };
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
const GUEST_HISTORY_KEY = "life-mirror:guest-history:v1";

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

function downloadJson(filename: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function readGuestEvents(): GuestEvent[] {
  try {
    return JSON.parse(window.localStorage.getItem(GUEST_HISTORY_KEY) ?? "[]") as GuestEvent[];
  } catch {
    return [];
  }
}

export function MemoryControls({ mode, onClose, onChanged }: { mode: Mode; onClose: () => void; onChanged: () => void }) {
  const [events, setEvents] = useState<MemoryEvent[]>([]);
  const [patterns, setPatterns] = useState<PatternMemory[]>([]);
  const [guestEvents, setGuestEvents] = useState<GuestEvent[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { title: string; summary: string }>>({});
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    if (mode === "guest") {
      setGuestEvents(readGuestEvents());
      return;
    }
    try {
      const data = await api<{ events: MemoryEvent[]; patterns: PatternMemory[] }>("/api/v1/memories?includeHidden=true");
      setEvents(data.events);
      setPatterns(data.patterns);
      setDrafts(Object.fromEntries(data.events.map((event) => [event.id, { title: event.title, summary: event.summary }])));
    } catch {
      setError("暂时无法读取你的记忆。");
    }
  }, [mode]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function updateEvent(event: MemoryEvent, values: Partial<{ title: string; summary: string; visibility: "visible" | "hidden" }>) {
    setBusyId(event.id); setError("");
    try {
      await api(`/api/v1/memories/event/${event.id}`, { method: "PATCH", body: JSON.stringify(values) });
      await load(); onChanged();
    } catch { setError("记忆更新失败，请稍后再试。"); }
    finally { setBusyId(""); }
  }

  async function deleteSource(event: MemoryEvent) {
    if (!window.confirm("删除后，这次反思及其派生记忆将无法恢复。确定删除吗？")) return;
    setBusyId(event.id); setError("");
    try {
      await api(`/api/v1/memories/source-events/${event.sourceEventId}`, { method: "DELETE" });
      await load(); onChanged();
    } catch { setError("记忆删除失败，请稍后再试。"); }
    finally { setBusyId(""); }
  }

  async function controlPattern(pattern: PatternMemory, action: "visibility" | "delete") {
    setBusyId(pattern.id); setError("");
    try {
      if (action === "delete") await api(`/api/v1/memories/pattern/${pattern.id}`, { method: "DELETE" });
      else await api(`/api/v1/memories/pattern/${pattern.id}`, { method: "PATCH", body: JSON.stringify({ visibility: pattern.visibility === "visible" ? "hidden" : "visible" }) });
      await load();
    } catch { setError("长期线索更新失败。"); }
    finally { setBusyId(""); }
  }

  function updateGuest(event: GuestEvent, question: string) {
    const next = guestEvents.map((item) => item.id === event.id ? { ...item, question } : item);
    window.localStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(next));
    markAccountDataChanged();
    setGuestEvents(next); onChanged();
  }

  function deleteGuest(event: GuestEvent) {
    if (!window.confirm("确定删除这次本地反思吗？")) return;
    const next = guestEvents.filter((item) => item.id !== event.id);
    window.localStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(next));
    markAccountDataChanged();
    setGuestEvents(next); onChanged();
  }

  async function exportMemories() {
    if (mode === "guest") {
      downloadJson("life-mirror-guest-memory.json", { ownership: "user", trainingData: false, events: guestEvents });
      return;
    }
    setBusyId("export");
    try {
      const data = await api<unknown>("/api/v1/memories/export");
      downloadJson("life-mirror-memory.json", data);
    } catch { setError("记忆导出失败，请稍后再试。"); }
    finally { setBusyId(""); }
  }

  const total = mode === "guest" ? guestEvents.length : events.length;
  return (
    <section className={styles.screen}>
      <button className={styles.back} onClick={onClose}><ArrowLeft /> 返回今日镜像</button>
      <header className={styles.hero}>
        <div><span>我的记录</span><h1>你的记录，<br />由你决定。</h1><p>你可以随时查看、纠正、隐藏、删除或导出。这些内容只用于你的个人镜像，不会用于训练模型。</p></div>
        <button className={styles.exportButton} onClick={exportMemories} disabled={busyId === "export"}>{busyId === "export" ? <CircleNotch className={styles.spin} /> : <DownloadSimple />} 导出全部</button>
      </header>
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.sectionHeader}><span>保存的镜像</span><small>{total} 条个人记录</small></div>
      <div className={styles.memoryList}>
        {mode === "guest" ? guestEvents.map((event) => (
          <article className={styles.card} key={event.id}>
            <time>{new Date(event.savedAt).toLocaleDateString("zh-CN")}</time>
            <input value={event.question} maxLength={500} onChange={(input) => updateGuest(event, input.target.value)} aria-label="事件内容" />
            <p>{event.reflection.shareableReflection ?? event.reflection.shiguangInterpretation ?? event.reflection.mirrorUnderstanding ?? event.reflection.traditionalJudgment ?? event.reflection.insight}</p>
            <div className={styles.actions}><button onClick={() => deleteGuest(event)}><Trash /> 删除</button></div>
          </article>
        )) : events.map((event) => {
          const draft = drafts[event.id] ?? { title: event.title, summary: event.summary };
          return (
            <article className={`${styles.card} ${event.visibility === "hidden" ? styles.hidden : ""}`} key={event.id}>
              <time>{new Date(event.occurredAt).toLocaleDateString("zh-CN")} · {event.topic}</time>
              <input value={draft.title} maxLength={160} onChange={(input) => setDrafts({ ...drafts, [event.id]: { ...draft, title: input.target.value } })} aria-label="记忆标题" />
              <textarea value={draft.summary} maxLength={1000} onChange={(input) => setDrafts({ ...drafts, [event.id]: { ...draft, summary: input.target.value } })} aria-label="记忆摘要" />
              <small>原始触发：{event.triggerText}</small>
              <div className={styles.actions}>
                <button disabled={busyId === event.id} onClick={() => updateEvent(event, draft)}><FloppyDisk /> 保存纠正</button>
                <button disabled={busyId === event.id} onClick={() => updateEvent(event, { visibility: event.visibility === "visible" ? "hidden" : "visible" })}>{event.visibility === "visible" ? <EyeSlash /> : <Eye />} {event.visibility === "visible" ? "隐藏" : "恢复"}</button>
                <button className={styles.danger} disabled={busyId === event.id} onClick={() => deleteSource(event)}><Trash /> 删除</button>
              </div>
            </article>
          );
        })}
        {total === 0 && <p className={styles.empty}>保存第一次镜像后，它会出现在这里。</p>}
      </div>

      {mode === "authenticated" && (
        <>
          <div className={styles.sectionHeader}><span>反复出现的线索</span><small>至少两条独立记录支持才会形成</small></div>
          <div className={styles.patternGrid}>
            {patterns.map((pattern) => <article className={`${styles.patternCard} ${pattern.visibility === "hidden" ? styles.hidden : ""}`} key={pattern.id}><small>{pattern.signalCount} 条证据 · {Math.round(pattern.confidence * 100)}% 置信度</small><h2>{pattern.title}</h2><p>{pattern.summary}</p><div className={styles.actions}><button onClick={() => controlPattern(pattern, "visibility")}>{pattern.visibility === "visible" ? <EyeSlash /> : <Eye />} {pattern.visibility === "visible" ? "隐藏" : "恢复"}</button><button className={styles.danger} onClick={() => controlPattern(pattern, "delete")}><Trash /> 删除</button></div></article>)}
            {patterns.length === 0 && <p className={styles.empty}>当相同主题在多次镜像中出现，有记录支持的长期线索会显示在这里。</p>}
          </div>
        </>
      )}
    </section>
  );
}
