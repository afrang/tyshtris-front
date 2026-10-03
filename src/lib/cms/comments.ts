export type CommentItem = {
  id: string;
  component: string;
  parentId: string;
  parentCommentId: string | null;
  userId: string;
  authorDisplayName: string;
  authorEmail: string | null;
  body: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  replies: CommentItem[];
};

export type CommentList = {
  component: string;
  parentId: string;
  commentsEnabled: boolean;
  comments: CommentItem[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5068";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function mapComment(raw: Record<string, unknown>): CommentItem {
  const repliesRaw = (raw.replies ?? raw.Replies ?? []) as Array<
    Record<string, unknown>
  >;

  return {
    id: String(raw.id ?? raw.Id ?? ""),
    component: String(raw.component ?? raw.Component ?? ""),
    parentId: String(raw.parentId ?? raw.ParentId ?? ""),
    parentCommentId: (raw.parentCommentId ??
      raw.ParentCommentId ??
      null) as string | null,
    userId: String(raw.userId ?? raw.UserId ?? ""),
    authorDisplayName: String(
      raw.authorDisplayName ?? raw.AuthorDisplayName ?? "",
    ),
    authorEmail: (raw.authorEmail ?? raw.AuthorEmail ?? null) as string | null,
    body: String(raw.body ?? raw.Body ?? ""),
    status: String(raw.status ?? raw.Status ?? ""),
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? ""),
    updatedAt: String(raw.updatedAt ?? raw.UpdatedAt ?? ""),
    replies: repliesRaw.map(mapComment),
  };
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    if (body.error) return body.error;
  } catch {
    // ignore
  }
  return `Request failed (${response.status}).`;
}

export async function listPublicComments(
  component: string,
  parentId: string,
): Promise<CommentList> {
  const response = await fetch(
    `${API_URL}/api/public/comments/${encodeURIComponent(component)}/${parentId}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const raw = asRecord(await response.json());
  const commentsRaw = (raw.comments ?? raw.Comments ?? []) as Array<
    Record<string, unknown>
  >;

  return {
    component: String(raw.component ?? raw.Component ?? component),
    parentId: String(raw.parentId ?? raw.ParentId ?? parentId),
    commentsEnabled: Boolean(raw.commentsEnabled ?? raw.CommentsEnabled ?? false),
    comments: commentsRaw.map(mapComment),
  };
}

export async function createPublicComment(input: {
  component: string;
  parentId: string;
  body: string;
  authorDisplayName: string;
  authorEmail?: string;
  parentCommentId?: string | null;
}): Promise<CommentItem> {
  const response = await fetch(
    `${API_URL}/api/public/comments/${encodeURIComponent(input.component)}/${input.parentId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: input.body,
        parentCommentId: input.parentCommentId ?? null,
        authorDisplayName: input.authorDisplayName,
        authorEmail: input.authorEmail || null,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return mapComment(asRecord(await response.json()));
}
