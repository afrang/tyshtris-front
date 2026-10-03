import { clearSession, getToken, type AuthUser } from "@/lib/auth/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5068";

export type AccountProfile = AuthUser & {
  isActive: boolean;
};

export type TicketReply = {
  id: string;
  authorUserId: string;
  authorName: string;
  fromStaff: boolean;
  body: string;
  createdAtUtc: string;
};

export type Ticket = {
  id: string;
  userId: string;
  authorName: string;
  authorEmail: string;
  category: string;
  title: string;
  body: string;
  status: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  replies: TicketReply[];
};

export type TicketListItem = {
  id: string;
  category: string;
  title: string;
  status: string;
  replyCount: number;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export class AccountError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (response.status === 401) {
    clearSession();
    throw new AccountError("Unauthorized.", 401);
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // ignore
    }
    throw new AccountError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function getProfile(): Promise<AccountProfile> {
  return request<AccountProfile>("/api/auth/me");
}

export function updateProfile(email: string, displayName: string): Promise<AccountProfile> {
  return request<AccountProfile>("/api/auth/profile", {
    method: "PUT",
    body: JSON.stringify({ email, displayName }),
  });
}

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return request<void>("/api/auth/password", {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function listTickets(): Promise<TicketListItem[]> {
  return request<TicketListItem[]>("/api/tickets");
}

export function getTicket(id: string): Promise<Ticket> {
  return request<Ticket>(`/api/tickets/${id}`);
}

export function createTicket(category: string, title: string, body: string): Promise<Ticket> {
  return request<Ticket>("/api/tickets", {
    method: "POST",
    body: JSON.stringify({ category, title, body }),
  });
}

export function replyTicket(id: string, body: string): Promise<Ticket> {
  return request<Ticket>(`/api/tickets/${id}/replies`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}
