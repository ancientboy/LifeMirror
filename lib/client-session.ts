export type ClientSessionUser = { email?: string | null; provider?: string | null };
export type ClientSessionState = { status: "authenticated"; user: ClientSessionUser } | { status: "guest" } | { status: "unknown" };

const SESSION_KEY = "life-mirror:confirmed-session:v1";
const GUEST_SESSION_KEY = "life-mirror:guest-session:v1";

export function classifyClientSession(cached: string | null, guestActive: boolean): ClientSessionState {
  if (cached) {
    try {
      const user = JSON.parse(cached) as ClientSessionUser;
      if (user && typeof user === "object") return { status: "authenticated", user };
    } catch { /* Ignore a damaged navigation cache. */ }
  }
  return guestActive ? { status: "guest" } : { status: "unknown" };
}

export function readClientSession(): ClientSessionState {
  if (typeof window === "undefined") return { status: "unknown" };
  return classifyClientSession(window.sessionStorage.getItem(SESSION_KEY), window.localStorage.getItem(GUEST_SESSION_KEY) === "active");
}

export function rememberAuthenticatedSession(user: ClientSessionUser = {}) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  window.localStorage.removeItem(GUEST_SESSION_KEY);
}

export function rememberGuestSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_KEY);
  window.localStorage.setItem(GUEST_SESSION_KEY, "active");
}

export function forgetClientSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_KEY);
}
