export const BASE_URL = (
  import.meta.env.VITE_API_URL || 'https://yarnz-backend-kaevx6-ca79f6-187-77-177-128.sslip.io'
).replace(/\/+$/, '');

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
  postFormData: async <T>(path: string, formData: FormData): Promise<T> => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      body: formData,
      // Note: do not set Content-Type header when sending FormData
      // fetch will automatically set it to multipart/form-data with the correct boundary
    });
    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`API error ${res.status}: ${errorBody}`);
    }
    return res.json() as Promise<T>;
  }
};

// ─── Database types ──────────────────────────────────────────────

export interface Confession {
  id: number;
  text_content?: string | null;
  audio_url?: string | null;
  video_url?: string | null;
  image_url?: string | null;
  media_type?: 'text' | 'audio' | 'video' | 'image' | null;
  caption?: string | null;
  tags: string[];
  likes_count: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  confession_id: number;
  content: string;
  is_anonymous: boolean;
  username?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedConfessionsResponse {
  confessions: Confession[];
  comments: Comment[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PaginatedCommentsResponse {
  comments: Comment[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface LikeResponse {
  confession_id: number;
  likes_count: number;
  message: string;
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
