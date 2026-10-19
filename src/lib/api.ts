export const BASE_URL = (
  import.meta.env.VITE_API_URL || 'https://yarnz-backend-kaevx6-ca79f6-187-77-177-128.sslip.io'
).replace(/\/+$/, '');

/**
 * Returns a persistent UUID for this device/browser client.
 * Stored in localStorage so requests and heartbeats share the exact same ID.
 */
export const getOrCreateDeviceId = (): string => {
  try {
    let id = localStorage.getItem('device_id');
    if (!id) {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        id = crypto.randomUUID();
      } else {
        id = 'dev-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
      }
      localStorage.setItem('device_id', id);
    }
    return id;
  } catch {
    return 'anonymous-device';
  }
};

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const deviceId = getOrCreateDeviceId();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Device-ID': deviceId,
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
  deleteConfession: (id: number | string) =>
    request<DeleteResponse>(`/confessions/${id}`, { method: 'DELETE' }),
  deleteComment: (id: number | string) =>
    request<DeleteResponse>(`/comments/${id}`, { method: 'DELETE' }),
  postFormData: async <T>(path: string, formData: FormData): Promise<T> => {
    const deviceId = getOrCreateDeviceId();
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'X-Device-ID': deviceId,
      },
      body: formData,
    });
    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`API error ${res.status}: ${errorBody}`);
    }
    return res.json() as Promise<T>;
  }
};

/**
 * Ping backend heartbeat to keep user counted as "online" when idle.
 */
export async function sendHeartbeat(): Promise<void> {
  try {
    const deviceId = getOrCreateDeviceId();
    await fetch(`${BASE_URL}/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': deviceId,
      },
      body: JSON.stringify({ device_id: deviceId }),
    });
  } catch (err) {
    console.debug('Heartbeat ping failed:', err);
  }
}

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
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  confession_id: number;
  content: string;
  is_anonymous: boolean;
  username?: string | null;
  tagged_comment_id?: number | null;
  tagged_username?: string | null;
  is_deleted?: boolean;
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

export interface DeleteResponse {
  status: string;
  message: string;
  id: number;
}

export interface MediaBreakdown {
  text: number;
  image: number;
  video: number;
  audio: number;
}

export interface AdminStats {
  total_posts?: number;
  total_confessions?: number;
  active_confessions?: number;
  deleted_confessions?: number;
  total_comments?: number;
  active_comments?: number;
  deleted_comments?: number;
  total_likes?: number;
  online_users?: number;
  media_breakdown?: MediaBreakdown;
  total_reports?: number;
  pending_reports?: number;
  total_users?: number;
  total_visits?: number;
  active_users?: number;
}

export interface OnlineUsersResponse {
  online_users: number;
  window_minutes: number;
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
  return getOrCreateDeviceId();
};
