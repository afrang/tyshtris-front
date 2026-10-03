const API_BASE =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:5068";

const BASE_PATH = "/api/auth";

type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
};

type AuthResponse = {
  token: string;
  user: AuthUser;
};

type RawAuth = {
  accessToken?: string | null;
  userId?: string;
  email?: string | null;
  displayName?: string | null;
  role?: string | null;
  token?: string;
  user?: AuthUser;
};

function toAuth(data: RawAuth): AuthResponse {
  if (data.token && data.user?.email) {
    return { token: data.token, user: data.user };
  }

  const token = data.accessToken ?? "";
  if (!token) {
    throw new Error("Login failed.");
  }

  return {
    token,
    user: {
      id: data.userId ?? "",
      email: data.email ?? "",
      displayName: data.displayName ?? "",
      role: data.role ?? "User",
    },
  };
}

const jsonHeaders = {
  "Content-Type": "application/json",
};

async function post<T>(
  path: string,
  body: unknown,
  swallowErrors = false,
): Promise<T> {
  const url = `${API_BASE}${BASE_PATH}${path}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      if (swallowErrors) {
        return { ok: true } as T;
      }
      let message = `HTTP ${res.status}`;
      try {
        const err = await res.json();
        if (typeof err?.error === "string") message = err.error;
        else if (typeof err?.message === "string") message = err.message;
      } catch {
        try {
          const text = await res.text();
          if (text) message = text;
        } catch {
          // ignore
        }
      }
      throw new Error(message);
    }
    if (res.status === 204 || res.status === 202) {
      const text = await res.text();
      if (!text) return { ok: true } as T;
      return JSON.parse(text) as T;
    }
    const data = (await res.json()) as T;
    return data;
  } catch (err) {
    if (swallowErrors) {
      return { ok: true } as T;
    }
    throw err;
  }
}

export type LoginBody = {
  email: string;
  password: string;
  captchaToken?: string;
};

export type RegisterBody = {
  email: string;
  password: string;
  confirmPassword: string;
};

export type VerifyOtpBody = {
  email: string;
  code: string;
};

export async function login(body: LoginBody): Promise<AuthResponse> {
  return toAuth(await post<RawAuth>("/login", body));
}

export function register(body: RegisterBody): Promise<{ ok: true }> {
  return post<{ ok: true }>("/register", body);
}

export async function verifyEmailOtp(body: VerifyOtpBody): Promise<AuthResponse> {
  return toAuth(await post<RawAuth>("/verify-otp", body));
}

export function resendVerificationOtp(body: {
  email: string;
}): Promise<{ ok: true }> {
  return post<{ ok: true }>("/resend-otp", body);
}

export function requestLoginOtp(body: {
  email: string;
}): Promise<{ ok: true }> {
  return post<{ ok: true }>("/request-login-otp", body, true);
}

export async function loginWithOtp(body: VerifyOtpBody): Promise<AuthResponse> {
  return toAuth(await post<RawAuth>("/login-otp", body));
}
