export const TOKEN_KEY = "tishtrya.empire.token";
export const USER_KEY = "tishtrya.empire.user";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
};

export type Session = {
  token: string;
  user: AuthUser;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function setSession({ token, user }: Session): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore storage errors (e.g. private mode)
  }
}

export function persistSession(token: string, user: AuthUser): void {
  setSession({ token, user });
}

export function clearSession(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}

export function getToken(): string | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as string;
  } catch {
    return null;
  }
}

export function getUser(): AuthUser | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  const token = getToken();
  return typeof token === "string" && token.length > 0;
}
