import { createClientId } from "./client-id";
import { markAccountDataChanged } from "./account-data";

export type ChatMessage = { id: string; role: "user" | "assistant"; text: string; createdAt: string };
export type ChatThread = { id: string; title: string; theme: "east" | "west"; mode: "home" | "result"; context: string; createdAt: string; updatedAt: string; messages: ChatMessage[] };

const KEY = "life-mirror:chat-threads:v1";
export const CHAT_HISTORY_CHANGED_EVENT = "life-mirror:chat-history-changed";
const MAX_THREADS = 20;
const MAX_MESSAGES = 80;

function read() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value as ChatThread[] : [];
  } catch { return [] as ChatThread[]; }
}

function write(threads: ChatThread[]) {
  window.localStorage.setItem(KEY, JSON.stringify(threads.slice(0, MAX_THREADS)));
  window.dispatchEvent(new CustomEvent(CHAT_HISTORY_CHANGED_EVENT));
  markAccountDataChanged();
}

export function getChatThreads() {
  return read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, MAX_THREADS);
}

export function createChatThread(input: Pick<ChatThread, "theme" | "mode" | "context">, opening: string) {
  const now = new Date().toISOString();
  const thread: ChatThread = { id: createClientId(), title: "和拾光聊聊", ...input, createdAt: now, updatedAt: now, messages: [{ id: "opening", role: "assistant", text: opening, createdAt: now }] };
  write([thread, ...getChatThreads()]);
  return thread;
}

export function saveChatThread(thread: ChatThread) {
  const lastUser = [...thread.messages].reverse().find((item) => item.role === "user")?.text.trim();
  const next = { ...thread, title: (lastUser || thread.title || "和拾光聊聊").slice(0, 28), updatedAt: new Date().toISOString(), messages: thread.messages.slice(-MAX_MESSAGES) };
  write([next, ...getChatThreads().filter((item) => item.id !== next.id)]);
  return next;
}

export function deleteChatThread(id: string) {
  write(getChatThreads().filter((item) => item.id !== id));
}
