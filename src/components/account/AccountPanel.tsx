"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  AccountError,
  changePassword,
  createTicket,
  getProfile,
  getTicket,
  listTickets,
  replyTicket,
  updateProfile,
  type Ticket,
  type TicketListItem,
} from "@/lib/account/api";
import {
  clearSession,
  getToken,
  getUser,
  persistSession,
} from "@/lib/auth/auth";

const CATEGORIES = ["news", "event", "support", "human_rights", "other"] as const;
type Category = (typeof CATEGORIES)[number];

const fieldClass =
  "mt-2 h-12 w-full rounded-xl border border-zinc-200 px-3 text-base text-zinc-900 outline-none transition focus:border-[var(--color-gold)] focus:shadow-[0_0_0_3px_rgba(201,162,39,0.2)]";

type Tab = "requests" | "new" | "profile";

export function AccountPanel({ locale }: { locale: string }) {
  const t = useTranslations("Account");
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("requests");
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<TicketListItem[]>([]);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [category, setCategory] = useState<Category>("news");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");

  const [displayName, setDisplayName] = useState(
    () => getUser()?.displayName ?? "",
  );
  const [email, setEmail] = useState(() => getUser()?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [profile, list] = await Promise.all([getProfile(), listTickets()]);
        if (cancelled) return;
        setDisplayName(profile.displayName);
        setEmail(profile.email);
        setItems(list);
        setReady(true);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof AccountError && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : t("failed"));
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, t]);

  function categoryLabel(value: string): string {
    if (value === "news") return t("news");
    if (value === "event") return t("event");
    if (value === "support") return t("support");
    if (value === "human_rights") return t("humanRights");
    return t("other");
  }

  function statusLabel(value: string): string {
    if (value === "answered") return t("statusAnswered");
    if (value === "closed") return t("statusClosed");
    return t("statusOpen");
  }

  function formatWhen(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  async function openTicket(id: string) {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const next = await getTicket(id);
      setTicket(next);
      setReply("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed"));
    } finally {
      setBusy(false);
    }
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (title.trim().length === 0 || body.trim().length === 0) {
      setError(t("required"));
      return;
    }
    setBusy(true);
    try {
      const created = await createTicket(category, title.trim(), body.trim());
      setItems((current) => [
        {
          id: created.id,
          category: created.category,
          title: created.title,
          status: created.status,
          replyCount: 0,
          createdAtUtc: created.createdAtUtc,
          updatedAtUtc: created.updatedAtUtc,
        },
        ...current,
      ]);
      setTitle("");
      setBody("");
      setTicket(created);
      setTab("requests");
      setNotice(t("sent"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed"));
    } finally {
      setBusy(false);
    }
  }

  async function onReply(event: FormEvent) {
    event.preventDefault();
    if (!ticket) return;
    setError(null);
    setNotice(null);
    if (reply.trim().length === 0) {
      setError(t("requiredReply"));
      return;
    }
    setBusy(true);
    try {
      const next = await replyTicket(ticket.id, reply.trim());
      setTicket(next);
      setReply("");
      setItems((current) =>
        current.map((item) =>
          item.id === next.id
            ? { ...item, status: next.status, replyCount: next.replies.length, updatedAtUtc: next.updatedAtUtc }
            : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed"));
    } finally {
      setBusy(false);
    }
  }

  async function onProfile(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (displayName.trim().length === 0 || email.trim().length === 0) {
      setError(t("requiredProfile"));
      return;
    }
    setBusy(true);
    try {
      const saved = await updateProfile(email.trim(), displayName.trim());
      const token = getToken();
      if (token) {
        persistSession(token, {
          id: saved.id,
          email: saved.email,
          displayName: saved.displayName,
          role: saved.role,
        });
      }
      setNotice(t("saved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed"));
    } finally {
      setBusy(false);
    }
  }

  async function onPassword(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (newPassword.length < 6) {
      setError(t("passwordShort"));
      return;
    }
    setBusy(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setNotice(t("passwordChanged"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed"));
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    clearSession();
    router.replace("/login");
  }

  if (!ready) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-10 text-sm text-zinc-500 sm:px-6">
        {t("loading")}
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("title")}>
          {(
            [
              ["requests", t("requests")],
              ["new", t("newRequest")],
              ["profile", t("profile")],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => {
                setTab(key);
                setTicket(null);
                setError(null);
                setNotice(null);
              }}
              className={`min-h-11 rounded-full px-4 text-sm font-bold ${
                tab === key
                  ? "bg-[var(--color-gold)] text-[var(--color-gold-text)]"
                  : "border border-zinc-200 bg-white text-zinc-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={signOut}
          className="min-h-11 rounded-full px-3 text-sm font-semibold text-zinc-600 underline-offset-4 hover:underline"
        >
          {t("signOut")}
        </button>
      </div>

      {notice ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {tab === "requests" && !ticket ? (
        <div className="mt-5">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-5 py-10 text-center">
              <p className="text-base font-semibold text-zinc-800">{t("emptyTitle")}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{t("emptyBody")}</p>
              <button
                type="button"
                onClick={() => setTab("new")}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-gold)] px-5 text-sm font-bold text-[var(--color-gold-text)]"
              >
                {t("newRequest")}
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => void openTicket(item.id)}
                    className="flex w-full flex-col gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-start shadow-[0_18px_50px_-28px_rgba(26,10,46,0.45)] transition hover:border-[var(--color-gold)]"
                  >
                    <span className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-[#fbf6e8] px-2 py-1 text-[var(--color-gold-text)]">
                        {categoryLabel(item.category)}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-700">
                        {statusLabel(item.status)}
                      </span>
                    </span>
                    <span className="text-base font-semibold text-zinc-900">{item.title}</span>
                    <span className="text-xs text-zinc-500">
                      {formatWhen(item.updatedAtUtc)} · {t("replies", { count: item.replyCount })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "requests" && ticket ? (
        <article className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(26,10,46,0.45)] sm:p-7">
          <button
            type="button"
            onClick={() => setTicket(null)}
            className="text-sm font-semibold text-[var(--color-royal-purple)] underline-offset-4 hover:underline"
          >
            {t("back")}
          </button>
          <p className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-[#fbf6e8] px-2 py-1">{categoryLabel(ticket.category)}</span>
            <span className="rounded-full bg-zinc-100 px-2 py-1">{statusLabel(ticket.status)}</span>
          </p>
          <h2 className="mt-3 text-2xl font-bold text-zinc-900">{ticket.title}</h2>
          <p className="mt-1 text-xs text-zinc-500">{formatWhen(ticket.createdAtUtc)}</p>
          <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-zinc-800">{ticket.body}</p>

          <ul className="mt-6 flex flex-col gap-3">
            {ticket.replies.map((item) => (
              <li
                key={item.id}
                className={`rounded-xl px-4 py-3 ${
                  item.fromStaff ? "bg-[#f7f1e4]" : "bg-zinc-50"
                }`}
              >
                <p className="text-sm font-semibold text-zinc-900">
                  {item.fromStaff ? t("editors") : item.authorName}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-800">{item.body}</p>
                <p className="mt-2 text-xs text-zinc-500">{formatWhen(item.createdAtUtc)}</p>
              </li>
            ))}
          </ul>

          {ticket.status === "closed" ? (
            <p className="mt-5 text-sm text-zinc-500">{t("closedNote")}</p>
          ) : (
            <form className="mt-5" onSubmit={onReply}>
              <label className="block text-sm font-semibold text-zinc-800">
                {t("reply")}
                <textarea
                  value={reply}
                  maxLength={4000}
                  rows={4}
                  onChange={(event) => setReply(event.target.value)}
                  className="mt-2 w-full resize-y rounded-xl border border-zinc-200 px-3 py-3 text-base leading-6 outline-none focus:border-[var(--color-gold)]"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="mt-3 inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--color-gold)] px-5 text-sm font-bold text-[var(--color-gold-text)] disabled:opacity-55"
              >
                {t("sendReply")}
              </button>
            </form>
          )}
        </article>
      ) : null}

      {tab === "new" ? (
        <form
          className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(26,10,46,0.45)] sm:p-7"
          onSubmit={onCreate}
        >
          <h2 className="text-lg font-semibold text-zinc-900">{t("newRequest")}</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">{t("newLead")}</p>
          <fieldset className="mt-4">
            <legend className="text-sm font-semibold text-zinc-800">{t("topic")}</legend>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIES.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={category === value}
                  onClick={() => setCategory(value)}
                  className={`min-h-12 rounded-xl border px-3 text-sm font-bold ${
                    category === value
                      ? "border-[var(--color-gold)] bg-[#fbf6e8] text-[var(--color-gold-text)]"
                      : "border-zinc-200 bg-white text-zinc-800"
                  }`}
                >
                  {categoryLabel(value)}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="mt-4 block text-sm font-semibold text-zinc-800">
            {t("titleField")}
            <input
              value={title}
              maxLength={200}
              onChange={(event) => setTitle(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="mt-4 block text-sm font-semibold text-zinc-800">
            {t("message")}
            <textarea
              value={body}
              maxLength={4000}
              rows={7}
              onChange={(event) => setBody(event.target.value)}
              className="mt-2 w-full resize-y rounded-xl border border-zinc-200 px-3 py-3 text-base leading-6 outline-none focus:border-[var(--color-gold)]"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--color-gold)] px-5 text-base font-bold text-[var(--color-gold-text)] disabled:opacity-55"
          >
            {busy ? t("sending") : t("send")}
          </button>
        </form>
      ) : null}

      {tab === "profile" ? (
        <div className="mt-5 grid gap-5">
          <form
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(26,10,46,0.45)] sm:p-7"
            onSubmit={onProfile}
          >
            <h2 className="text-lg font-semibold text-zinc-900">{t("profile")}</h2>
            <label className="mt-4 block text-sm font-semibold text-zinc-800">
              {t("displayName")}
              <input
                value={displayName}
                autoComplete="name"
                maxLength={200}
                onChange={(event) => setDisplayName(event.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="mt-4 block text-sm font-semibold text-zinc-800">
              {t("email")}
              <input
                type="email"
                value={email}
                autoComplete="email"
                maxLength={256}
                onChange={(event) => setEmail(event.target.value)}
                className={fieldClass}
                dir="ltr"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--color-gold)] px-5 text-sm font-bold text-[var(--color-gold-text)] disabled:opacity-55"
            >
              {t("saveProfile")}
            </button>
          </form>

          <form
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(26,10,46,0.45)] sm:p-7"
            onSubmit={onPassword}
          >
            <h2 className="text-lg font-semibold text-zinc-900">{t("password")}</h2>
            <label className="mt-4 block text-sm font-semibold text-zinc-800">
              {t("currentPassword")}
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="mt-4 block text-sm font-semibold text-zinc-800">
              {t("newPassword")}
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className={fieldClass}
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-bold text-zinc-800 disabled:opacity-55"
            >
              {t("changePassword")}
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
