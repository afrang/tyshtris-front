"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  createPublicComment,
  listPublicComments,
  type CommentItem,
} from "@/lib/cms/comments";
import {
  Turnstile,
  isTurnstileConfigured,
} from "@/components/captcha/Turnstile";

type Props = {
  postId: string;
  commentsEnabled: boolean;
};

function CommentNode({
  comment,
  depth,
  onReply,
}: {
  comment: CommentItem;
  depth: number;
  onReply: (comment: CommentItem) => void;
}) {
  const t = useTranslations("PostPage");
  const locale = useLocale();

  const dateLabel = useMemo(() => {
    if (!comment.createdAt) return null;
    try {
      return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(comment.createdAt));
    } catch {
      return null;
    }
  }, [comment.createdAt, locale]);

  return (
    <li className={depth > 0 ? "ms-4 border-s border-zinc-200 ps-4 sm:ms-6 sm:ps-5" : ""}>
      <article className="rounded-sm border border-zinc-200 bg-white p-4">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-zinc-900">
            {comment.authorDisplayName}
          </p>
          {dateLabel ? (
            <time className="text-xs text-zinc-500">{dateLabel}</time>
          ) : null}
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700">
          {comment.body}
        </p>
        {depth < 2 ? (
          <button
            type="button"
            className="mt-3 text-xs font-medium text-[var(--color-royal-purple)] transition hover:text-[var(--color-royal-purple-deep)]"
            onClick={() => onReply(comment)}
          >
            {t("commentReply")}
          </button>
        ) : null}
      </article>

      {comment.replies.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function PostComments({ postId, commentsEnabled }: Props) {
  const t = useTranslations("PostPage");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [enabled, setEnabled] = useState(commentsEnabled);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await listPublicComments("blogpost", postId);
        if (cancelled) return;
        setEnabled(list.commentsEnabled);
        setComments(list.comments);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : t("commentsLoadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [postId, t]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || pending) return;

    setError(null);
    setSuccess(null);

    if (isTurnstileConfigured() && !captchaToken) {
      setError(t("captchaRequired"));
      return;
    }

    startTransition(async () => {
      try {
        await createPublicComment({
          component: "blogpost",
          parentId: postId,
          body,
          authorDisplayName: name,
          authorEmail: email || undefined,
          parentCommentId: replyTo?.id ?? null,
          captchaToken: captchaToken ?? undefined,
        });
        setBody("");
        setReplyTo(null);
        setCaptchaToken(null);
        setCaptchaKey((value) => value + 1);
        setSuccess(t("commentSuccess"));
        const list = await listPublicComments("blogpost", postId);
        setComments(list.comments);
        setEnabled(list.commentsEnabled);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("commentsLoadError"));
        setCaptchaToken(null);
        setCaptchaKey((value) => value + 1);
      }
    });
  }

  if (!commentsEnabled && !enabled) {
    return null;
  }

  return (
    <section className="mb-10 border-t border-zinc-200 pt-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-semibold text-zinc-900">
          {t("commentsHeading")}
        </h2>
        <span className="text-sm text-zinc-500">
          {t("commentsCount", { count: comments.length })}
        </span>
      </div>

      {!enabled ? (
        <p className="text-sm text-zinc-600">{t("commentsDisabled")}</p>
      ) : (
        <form
          onSubmit={onSubmit}
          className="mb-8 space-y-4 border border-zinc-200 bg-white p-4 sm:p-5"
        >
          {replyTo ? (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
              <span>
                {t("commentReply")}: <strong>{replyTo.authorDisplayName}</strong>
              </span>
              <button
                type="button"
                className="font-medium text-[var(--color-royal-purple)]"
                onClick={() => setReplyTo(null)}
              >
                {t("commentCancelReply")}
              </button>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-zinc-700">
              <span className="mb-1.5 block font-medium">{t("commentName")}</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-[var(--color-royal-purple)]"
                autoComplete="name"
              />
            </label>
            <label className="block text-sm text-zinc-700">
              <span className="mb-1.5 block font-medium">{t("commentEmail")}</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-[var(--color-royal-purple)]"
                autoComplete="email"
              />
            </label>
          </div>

          <label className="block text-sm text-zinc-700">
            <span className="mb-1.5 block font-medium">{t("commentBody")}</span>
            <textarea
              required
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full resize-y border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-[var(--color-royal-purple)]"
            />
          </label>

          <Turnstile
            key={captchaKey}
            theme="light"
            onToken={setCaptchaToken}
            className="flex justify-start"
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? (
            <p className="text-sm text-[var(--color-royal-purple)]">{success}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending || (isTurnstileConfigured() && !captchaToken)}
            className="inline-flex items-center bg-[var(--color-royal-purple)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-royal-purple-deep)] disabled:opacity-60"
          >
            {pending ? t("commentSubmitting") : t("commentSubmit")}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-zinc-600">{t("commentsEmpty")}</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <CommentNode
              key={comment.id}
              comment={comment}
              depth={0}
              onReply={(item) => {
                setReplyTo(item);
                setSuccess(null);
              }}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
