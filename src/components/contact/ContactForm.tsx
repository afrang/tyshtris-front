"use client";

import { type FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Turnstile,
  isTurnstileConfigured,
} from "@/components/captcha/Turnstile";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5068";

const fieldClass =
  "mt-2 h-12 w-full rounded-xl border border-zinc-200 px-3 text-base text-zinc-900 outline-none transition focus:border-[var(--color-gold)] focus:shadow-[0_0_0_3px_rgba(201,162,39,0.2)]";

type Props = {
  locale: string;
};

export function ContactForm({ locale }: Props) {
  const t = useTranslations("Contact");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);

  const nameInvalid = error === t("required") && name.trim().length === 0;
  const emailInvalid =
    error === t("invalidEmail") ||
    (error === t("required") && email.trim().length === 0);
  const subjectInvalid = error === t("required") && subject.trim().length === 0;
  const messageInvalid = error === t("required") && message.trim().length === 0;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (company.trim().length > 0) {
      setSent(true);
      return;
    }

    if (
      name.trim().length === 0 ||
      email.trim().length === 0 ||
      subject.trim().length === 0 ||
      message.trim().length === 0
    ) {
      setError(t("required"));
      return;
    }

    if (!EMAIL_RE.test(email.trim()) || email.trim().length > 200) {
      setError(t("invalidEmail"));
      return;
    }

    if (isTurnstileConfigured() && !captchaToken) {
      setError(t("captchaRequired"));
      return;
    }

    setSending(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/public/forms/contactus/submit?lang=${encodeURIComponent(locale)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            values: {
              name: name.trim(),
              email: email.trim(),
              phone: phone.trim(),
              subject: subject.trim(),
              message: message.trim(),
            },
            captchaToken: captchaToken ?? null,
          }),
        },
      );

      if (response.status === 404) {
        setError(t("unavailable"));
        return;
      }

      if (!response.ok) {
        let messageText = t("failed");
        try {
          const body = (await response.json()) as { error?: string };
          if (body.error) messageText = body.error;
        } catch {
          // ignore
        }
        setError(messageText);
        setCaptchaToken(null);
        setCaptchaKey((value) => value + 1);
        return;
      }

      setSent(true);
    } catch {
      setError(t("failed"));
      setCaptchaToken(null);
      setCaptchaKey((value) => value + 1);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div
        className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-emerald-950"
        role="status"
      >
        <p className="text-lg font-semibold">{t("thanksTitle")}</p>
        <p className="mt-2 text-sm leading-6">{t("thanksBody")}</p>
      </div>
    );
  }

  return (
    <form
      className="relative rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(26,10,46,0.45)] sm:p-7"
      onSubmit={onSubmit}
      noValidate
    >
      <h2 className="text-lg font-semibold text-zinc-900">{t("formTitle")}</h2>

      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Company
          <input
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-semibold text-zinc-800">
        {t("name")}
        <input
          name="name"
          autoComplete="name"
          maxLength={120}
          value={name}
          aria-invalid={nameInvalid}
          onChange={(event) => setName(event.target.value)}
          className={fieldClass}
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-zinc-800">
        {t("emailField")}
        <input
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          maxLength={200}
          value={email}
          aria-invalid={emailInvalid}
          onChange={(event) => setEmail(event.target.value)}
          className={fieldClass}
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-zinc-800">
        {t("phoneField")}
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          maxLength={40}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className={fieldClass}
          dir="ltr"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-zinc-800">
        {t("subject")}
        <input
          name="subject"
          autoComplete="off"
          maxLength={200}
          value={subject}
          aria-invalid={subjectInvalid}
          onChange={(event) => setSubject(event.target.value)}
          className={fieldClass}
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-zinc-800">
        {t("message")}
        <textarea
          name="message"
          rows={6}
          maxLength={4000}
          value={message}
          aria-invalid={messageInvalid}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-2 w-full resize-y rounded-xl border border-zinc-200 px-3 py-3 text-base leading-6 text-zinc-900 outline-none transition focus:border-[var(--color-gold)] focus:shadow-[0_0_0_3px_rgba(201,162,39,0.2)]"
        />
      </label>

      <Turnstile
        key={captchaKey}
        theme="light"
        onToken={setCaptchaToken}
        className="mt-5 flex justify-center"
      />

      {error ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={sending || (isTurnstileConfigured() && !captchaToken)}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--color-gold)] px-5 text-base font-bold text-[var(--color-gold-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition hover:bg-[#d8b33d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)] disabled:cursor-not-allowed disabled:opacity-55"
      >
        {sending ? t("sending") : t("submit")}
      </button>
    </form>
  );
}
