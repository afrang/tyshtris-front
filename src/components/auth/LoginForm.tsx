"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import {
  login as apiLogin,
  requestLoginOtp,
  loginWithOtp,
} from "@/lib/auth/api";
import {
  isAuthenticated,
  persistSession,
} from "@/lib/auth/auth";
import { isRtlLocale } from "@/i18n/routing";
import {
  Turnstile,
  isTurnstileConfigured,
} from "@/components/captcha/Turnstile";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoginMode = "password" | "otp";
type OtpStep = "request" | "verify";

export function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations("Auth");
  const router = useRouter();

  const dir: "ltr" | "rtl" = isRtlLocale(locale) ? "rtl" : "ltr";

  const [mode] = useState<LoginMode>("password");
  const [otpStep, setOtpStep] = useState<OtpStep>("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldownSec, setResendCooldownSec] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/account");
    }
  }, [router]);

  useEffect(() => {
    if (resendCooldownSec <= 0) return;
    const id = window.setInterval(() => {
      setResendCooldownSec((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendCooldownSec]);

  const otpCode = useMemo(() => otpDigits.join(""), [otpDigits]);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email)) {
      setError(t("invalidCodeOrEmail"));
      return;
    }
    if (password.length < 6) {
      setError(t("signInFailed"));
      return;
    }
    if (isTurnstileConfigured() && !captchaToken) {
      setError(t("captchaRequired"));
      return;
    }
    try {
      setLoading(true);
      const res = await apiLogin({
        email,
        password,
        captchaToken: captchaToken ?? undefined,
      });
      persistSession(res.token, res.user);
      router.push("/account");
    } catch (err) {
      const message = err instanceof Error ? err.message : t("signInFailed");
      setError(message || t("signInFailed"));
      setCaptchaToken(null);
      setCaptchaKey((value) => value + 1);
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email)) {
      setError(t("invalidCodeOrEmail"));
      return;
    }
    try {
      setLoading(true);
      await requestLoginOtp({ email });
      setOtpStep("verify");
      setResendCooldownSec(60);
      setOtpDigits(["", "", "", "", "", ""]);
      window.setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 0);
    } catch {
      setOtpStep("verify");
      setResendCooldownSec(60);
      setOtpDigits(["", "", "", "", "", ""]);
    } finally {
      setLoading(false);
    }
  }

  function handleOtpDigitChange(
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const value = e.target.value;
    const lastChar = value.slice(-1);
    const isDigit = /^\d$/.test(lastChar);
    const next = [...otpDigits];
    next[index] = isDigit ? lastChar : "";
    setOtpDigits(next);
    if (isDigit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        e.preventDefault();
        const next = [...otpDigits];
        next[index - 1] = "";
        setOtpDigits(next);
        otpRefs.current[index - 1]?.focus();
      }
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email)) {
      setError(t("invalidCodeOrEmail"));
      return;
    }
    const code = otpDigits.join("");
    if (code.length !== 6) {
      setError(t("invalidCodeOrEmail"));
      return;
    }
    try {
      setLoading(true);
      const res = await loginWithOtp({ email, code });
      persistSession(res.token, res.user);
      router.push("/account");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("invalidCodeOrEmail");
      setError(message || t("invalidCodeOrEmail"));
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (resendCooldownSec > 0) return;
    setError(null);
    try {
      setLoading(true);
      await requestLoginOtp({ email });
      setResendCooldownSec(60);
      setOtpDigits(["", "", "", "", "", ""]);
      window.setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 0);
    } catch {
      setResendCooldownSec(60);
    } finally {
      setLoading(false);
    }
  }

  function handleBackToRequest() {
    setOtpStep("request");
    setOtpDigits(["", "", "", "", "", ""]);
    setError(null);
  }

  return (
    <AuthShell
      title={t("loginTitle")}
      dir={dir}
      showLoginActive
      onNavigateLogin={() => router.push("/login")}
      onNavigateRegister={() => router.push("/register")}
      loginActiveLabel={t("authHeaderLogin")}
      registerActiveLabel={t("authHeaderRegister")}
    >
        {/* <button
          type="button"
          onClick={() => handleModeChange("password")}
          className={`flex-1 h-9 rounded-lg text-sm font-semibold transition ${
            mode === "password"
              ? "bg-gradient-to-r from-[#e6c98d] to-[#c9a45c] text-[#1a1208] shadow-sm"
              : "text-white/70 hover:text-white"
          }`}
        >
          {t("signInWithPassword")}
        </button> */}
        {/* <button
          type="button"
          onClick={() => handleModeChange("otp")}
          className={`flex-1 h-9 rounded-lg text-sm font-semibold transition ${
            mode === "otp"
              ? "bg-gradient-to-r from-[#e6c98d] to-[#c9a45c] text-[#1a1208] shadow-sm"
              : "text-white/70 hover:text-white"
          }`}
        >
          {t("signInWithOtp")}
        </button> */}
     

      {error ? (
        <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {mode === "password" ? (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="mb-1.5 block text-sm font-medium text-white/85"
            >
              {t("email")}
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("email")}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-[#c9a45c]/70 focus:ring-2 focus:ring-[#c9a45c]/30"
              required
            />
          </div>
          <div>
            <label
              htmlFor="login-password"
              className="mb-1.5 block text-sm font-medium text-white/85"
            >
              {t("password")}
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("password")}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-[#c9a45c]/70 focus:ring-2 focus:ring-[#c9a45c]/30"
              required
              minLength={6}
            />
          </div>
          <Turnstile
            key={captchaKey}
            theme="dark"
            onToken={setCaptchaToken}
            className="flex justify-center"
          />
          <button
            type="submit"
            disabled={loading || (isTurnstileConfigured() && !captchaToken)}
            className="mt-2 inline-flex w-full h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#e6c98d] to-[#c9a45c] px-4 text-sm font-bold text-[#1a1208] shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_7px_18px_-10px_rgba(201,162,39,0.9)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {loading ? t("signingIn") : t("signIn")}
          </button>
        </form>
      ) : otpStep === "request" ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <label
              htmlFor="login-otp-email"
              className="mb-1.5 block text-sm font-medium text-white/85"
            >
              {t("email")}
            </label>
            <input
              id="login-otp-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("email")}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-[#c9a45c]/70 focus:ring-2 focus:ring-[#c9a45c]/30"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#e6c98d] to-[#c9a45c] px-4 text-sm font-bold text-[#1a1208] shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_7px_18px_-10px_rgba(201,162,39,0.9)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {loading ? t("sendingCode") : t("sendCode")}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <p className="text-sm text-white/80">
            {t("codeSentHint", { email })}
          </p>
          <div
            className={`flex gap-2 sm:gap-3 justify-center ${
              dir === "rtl" ? "flex-row-reverse" : ""
            }`}
          >
            {otpDigits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  otpRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={d}
                onChange={(e) => handleOtpDigitChange(i, e)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                aria-label={`${t("enter6DigitCode")} ${i + 1}/6`}
                className="h-12 w-11 sm:h-14 sm:w-12 rounded-xl border border-white/15 bg-white/5 text-center text-lg font-bold text-white outline-none transition focus:border-[#c9a45c]/70 focus:ring-2 focus:ring-[#c9a45c]/30"
              />
            ))}
          </div>
          <p className="text-center text-xs text-white/50">
            {t("enter6DigitCode")}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleBackToRequest}
              className="inline-flex h-10 items-center justify-center rounded-lg text-sm font-semibold text-white/70 hover:text-white transition"
            >
              ← {t("back")}
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldownSec > 0 || loading}
              className="inline-flex h-10 items-center justify-center rounded-lg px-3 text-sm font-semibold text-[#e6c98d] hover:text-[#f0d699] transition disabled:text-white/40 disabled:cursor-not-allowed"
            >
              {resendCooldownSec > 0
                ? t("resendIn", { seconds: resendCooldownSec })
                : t("resendCode")}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading || otpCode.length !== 6}
            className="mt-2 inline-flex w-full h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#e6c98d] to-[#c9a45c] px-4 text-sm font-bold text-[#1a1208] shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_7px_18px_-10px_rgba(201,162,39,0.9)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {loading ? t("signingIn") : t("signIn")}
          </button>
        </form>
      )}

      <div className="mt-6 text-center text-sm text-white/70">
        {t("alreadyHaveAccount")}{" "}
        <Link
          href="/register"
          className="font-semibold text-[#e6c98d] hover:text-[#f0d699] transition"
        >
          {t("authHeaderRegister")}
        </Link>
      </div>
    </AuthShell>
  );
}
