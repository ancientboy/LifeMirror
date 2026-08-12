"use client";

import { readLocalAccountData, writeLocalAccountData, type AccountSnapshot } from "./account-data";
import { createClientId } from "./client-id";

export type LifeEventLoop = {
  id: string;
  userFact: string;
  shiguangJudgment: string;
  suggestedAction?: string;
  actionStatus: "pending" | "taken" | "skipped";
  outcomeStatus: "waiting" | "better" | "same" | "worse" | "closed";
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
  updatedAt: string;
};

export const LIFE_EVENT_LOOPS_KEY = "lifeEventLoops";

export function readLifeEventLoops(snapshot = readLocalAccountData()): LifeEventLoop[] {
  const value = snapshot.settings[LIFE_EVENT_LOOPS_KEY];
  return Array.isArray(value) ? value.filter((item): item is LifeEventLoop => Boolean(item && typeof item === "object" && typeof (item as LifeEventLoop).id === "string" && typeof (item as LifeEventLoop).userFact === "string")).slice(0, 20) : [];
}

export function writeLifeEventLoops(loops: LifeEventLoop[], snapshot = readLocalAccountData()) {
  const data: AccountSnapshot = { ...snapshot, settings: { ...snapshot.settings, [LIFE_EVENT_LOOPS_KEY]: loops.slice(0, 20) }, updatedAt: new Date().toISOString() };
  writeLocalAccountData(data);
  return data;
}

export function createLifeEventLoop(userFact: string, shiguangJudgment: string): LifeEventLoop {
  const now = new Date().toISOString();
  return { id: createClientId(), userFact: userFact.trim().slice(0, 500), shiguangJudgment: shiguangJudgment.trim().slice(0, 800), actionStatus: "pending", outcomeStatus: "waiting", status: "open", createdAt: now, updatedAt: now };
}

export function upsertLocalLifeEventLoop(loop: LifeEventLoop) {
  const current = readLifeEventLoops();
  return writeLifeEventLoops([loop, ...current.filter((item) => item.id !== loop.id)]);
}

export function patchLocalLifeEventLoop(id: string, patch: Partial<Pick<LifeEventLoop, "actionStatus" | "outcomeStatus" | "status">>) {
  const current = readLifeEventLoops();
  return writeLifeEventLoops(current.map((item) => item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item));
}
