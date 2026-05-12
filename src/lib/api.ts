// Central API client — points at your FastAPI backend.
// Change this URL when deploying to production.
const BASE_URL = 'http://localhost:8000';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API error ${res.status}: ${errorBody}`);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'DELETE',
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
};

// ─── Database types (unchanged) ──────────────────────────────────────────────

export interface Confession {
  id: string;
  content: string;
  audio_url?: string;
  video_url?: string;
  video_context?: string;
  image_url?: string;
  image_context?: string;
  tags: string[];
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  confession_id: string;
  content: string;
  upvotes: number;
  downvotes: number;
  is_anonymous: boolean;
  username?: string;
  created_at: string;
  updated_at: string;
}

export interface Vote {
  id: string;
  user_fingerprint: string;
  target_type: 'confession' | 'comment';
  target_id: string;
  vote_type: 'up' | 'down';
  created_at: string;
}

export interface Report {
  id: string;
  target_type: 'confession' | 'comment';
  target_id: string;
  reason: string;
  custom_reason?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
}

// ─── User fingerprint helper ──────────────────────────────────────────────────

export const generateUserFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx!.textBaseline = 'top';
  ctx!.font = '14px Arial';
  ctx!.fillText('User fingerprint', 2, 2);

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
  ].join('|');

  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};
