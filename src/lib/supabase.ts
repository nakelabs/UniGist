import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Confession {
  id: string;
  content: string;
  audio_url?: string;
  video_url?: string;
  image_url?: string;
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

// Helper function to generate user fingerprint
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
    canvas.toDataURL()
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
};