import { createClientId } from "./client-id";
import { rememberAuthenticatedSession, type ClientSessionUser } from "./client-session";

export type AccountSnapshot = {
  settings: Record<string, unknown>;
  facts: unknown[];
  history: unknown[];
  tarot: unknown[];
  chats: unknown[];
  updatedAt?: string | null;
};

const KEYS = {
  settings: "life-mirror:memory-settings:v1",
  facts: "life-mirror:saved-facts:v1",
  history: "life-mirror:guest-history:v1",
  tarot: "lifemirror.tarot.readings.v1",
  chats: "life-mirror:chat-threads:v1",
  updatedAt: "life-mirror:account-updated-at:v1",
} as const;
const MIGRATION_KEY = "life-mirror:guest-migration-id:v1";
export const ACCOUNT_DATA_CHANGED_EVENT = "life-mirror:account-data-changed";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

export function readLocalAccountData(): AccountSnapshot {
  return {
    settings: readJson<Record<string, unknown>>(KEYS.settings, {}),
    facts: readJson<unknown[]>(KEYS.facts, []),
    history: readJson<unknown[]>(KEYS.history, []),
    tarot: readJson<unknown[]>(KEYS.tarot, []),
    chats: readJson<unknown[]>(KEYS.chats, []),
    updatedAt: window.localStorage.getItem(KEYS.updatedAt),
  };
}

export function writeLocalAccountData(data: AccountSnapshot) {
  window.localStorage.setItem(KEYS.settings, JSON.stringify(data.settings ?? {}));
  window.localStorage.setItem(KEYS.facts, JSON.stringify(data.facts ?? []));
  window.localStorage.setItem(KEYS.history, JSON.stringify(data.history ?? []));
  window.localStorage.setItem(KEYS.tarot, JSON.stringify(data.tarot ?? []));
  window.localStorage.setItem(KEYS.chats, JSON.stringify(data.chats ?? []));
  if (data.updatedAt) window.localStorage.setItem(KEYS.updatedAt, data.updatedAt);
  else window.localStorage.removeItem(KEYS.updatedAt);
  window.dispatchEvent(new CustomEvent("life-mirror:memory-changed"));
  window.dispatchEvent(new CustomEvent(ACCOUNT_DATA_CHANGED_EVENT));
}

export function getGuestMigrationId() {
  let id = window.localStorage.getItem(MIGRATION_KEY);
  if (!id) {
    id = createClientId();
    window.localStorage.setItem(MIGRATION_KEY, id);
  }
  return id;
}

export function markAccountDataChanged() {
  // This timestamp marks an intentional local mutation.  The Worker compares
  // it with the authoritative D1 snapshot before accepting scalar settings,
  // while record collections are still merged by stable id and tombstone.
  window.localStorage.setItem(KEYS.updatedAt, new Date().toISOString());
  window.dispatchEvent(new CustomEvent(ACCOUNT_DATA_CHANGED_EVENT));
}

export function accountLoginPayload() {
  return { guestData: readLocalAccountData(), migrationId: getGuestMigrationId() };
}

export function finishAccountLogin(data: AccountSnapshot, user?: ClientSessionUser) {
  writeLocalAccountData(data);
  rememberAuthenticatedSession(user);
  window.localStorage.removeItem("life-mirror:guest-session:v1");
}
