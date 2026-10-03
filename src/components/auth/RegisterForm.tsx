"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import {
  register as apiRegister,
  verifyEmailOtp,
  resendVerificationOtp,
} from "@/lib/auth/api";
import {
  isAuthenticated,
  persistSession,
} from "@/lib/auth/auth";
import { isRtlLocale } from "@/i18n/routing";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegisterStep = "form" | "verify" | "success";

export function RegisterForm({ locale }: { locale: string }) {
  const t = useTranslations("Auth");
  const router = useRouter();

  const dir: "ltr" | "rtl" = isRtlLocale(locale) ? "rtl" : "ltr";

  const [step, setStep] = useState<RegisterStep>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldownSec, setResendCooldownSec] = useState(60);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/account");
    }
  }, [router]);

  useEffect(() => {
    if (step === "success") {
      const id = window.setTimeout(() => {
        router.replace("/account");
      }, 2000);
      return () => window.clearTimeout(id);
    }
  }, [step, router]);

  useEffect(() => {
    if (step !== "verify") return;
    if (resendCooldownSec <= 0) return;
    const id = window.setInterval(() => {
      setResendCooldownSec((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [step, resendCooldownSec]);

  const otpCode = useMemo(() => otpDigits.join(""), [otpDigits]);

  async function handleFormSubmit(e: React.FormEvent) {
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
    if (password !== confirmPassword) {
      setError(t("signInFailed"));
      return;
    }
    try {
      setLoading(true);
      await apiRegister({ email, password, confirmPassword });
      setStep("verify");
      setResendCooldownSec(60);
      setOtpDigits(["", "", "", "", "", ""]);
      window.setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 0);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("invalidCodeOrEmail");
      setError(message || t("invalidCodeOrEmail"));
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

  async function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const code = otpDigits.join("");
    if (code.length !== 6) {
      setError(t("invalidCodeOrEmail"));
      return;
    }
    try {
      setLoading(true);
      const res = await verifyEmailOtp({ email, code });
      persistSession(res.token, res.user);
      setStep("success");
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
      await resendVerificationOtp({ email });
      setResendCooldownSec(60);
      setOtpDigits(["", "", "", "", "", ""]);
      window.setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 0);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("invalidCodeOrEmail");
      setError(message || t("invalidCodeOrEmail"));
    } finally {
      setLoading(false);
    }
  }

  function handleBackToForm() {
    setStep("form");
    setOtpDigits(["", "", "", "", "", ""]);
    setError(null);
  }

  return (
    <AuthShell
      title={t("registerTitle")}
      dir={dir}
      showLoginActive={false}
      onNavigateLogin={() => router.push("/login")}
      onNavigateRegister={() => router.push("/register")}
      loginActiveLabel={t("authHeaderLogin")}
      registerActiveLabel={t("authHeaderRegister")}
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {step === "success" ? (
        <div className="space-y-4 text-center py-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#e6c98d] to-[#c9a45c]">
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 text-[#1a1208]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">{t("registrationSuccess")}</h2>
          <p className="text-sm text-white/70">{t("redirectingToAccount")}</p>
        </div>
      ) : step === "form" ? (
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="register-email"
              className="mb-1.5 block text-sm font-medium text-white/85"
            >
              {t("email")}
            </label>
            <input
              id="register-email"
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
              htmlFor="register-password"
              className="mb-1.5 block text-sm font-medium text-white/85"
            >
              {t("password")}
            </label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("password")}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-[#c9a45c]/70 focus:ring-2 focus:ring-[#c9a45c]/30"
              required
              minLength={6}
            />
          </div>
          <div>
            <label
              htmlFor="register-confirm-password"
              className="mb-1.5 block text-sm font-medium text-white/85"
            >
              {t("confirmPassword")}
            </label>
            <input
              id="register-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("confirmPassword")}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-[#c9a45c]/70 focus:ring-2 focus:ring-[#c9a45c]/30"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#e6c98d] to-[#c9a45c] px-4 text-sm font-bold text-[#1a1208] shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_7px_18px_-10px_rgba(201,162,39,0.9)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {loading ? t("creatingAccount") : t("createAccount")}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifySubmit} className="space-y-4">
          <h2 className="text-center text-lg font-bold text-white">
            {t("verifyEmail")}
          </h2>
          <p className="text-sm text-white/80">
            {t("otpSentHint", { email })}
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
              onClick={handleBackToForm}
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
            {loading ? t("verifying") : t("verifyEmail")}
          </button>
        </form>
      )}

      <div className="mt-6 text-center text-sm text-white/70">
        {t("alreadyHaveAccount")}{" "}
        <Link
          href="/login"
          className="font-semibold text-[#e6c98d] hover:text-[#f0d699] transition"
        >
          {t("authHeaderLogin")}
        </Link>
      </div>
    </AuthShell>
  );
}
