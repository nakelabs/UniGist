import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface ReactionCounts {
  [emoji: string]: number;
}

interface UserReactions {
  confessions: { [confessionId: string]: string[] };
  comments: { [commentId: string]: string[] };
}

export const useReactions = () => {
  const [userReactions, setUserReactions] = useState<UserReactions>({
    confessions: {},
    comments: {},
  });

  const { toast } = useToast();

  const availableEmojis = [
    '😂', '😭', '😱', '🔥', '💯', '❤️', '👏',
    '😍', '🤔', '😬', '🤯', '👀', '💀', '🙄', '😤', '🥺',
  ];

  // ── Fingerprint ────────────────────────────────────────────────────────────
  const getUserFingerprint = () => {
    const stored = localStorage.getItem('user_fingerprint');
    if (stored) return stored;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx!.textBaseline = 'top';
    ctx!.font = '14px Arial';
    ctx!.fillText('Browser fingerprint', 2, 2);

    const raw = canvas.toDataURL() + navigator.userAgent + screen.width + screen.height;
    const hash = btoa(raw).slice(0, 16);
    localStorage.setItem('user_fingerprint', hash);
    return hash;
  };

  // ── Local persistence ──────────────────────────────────────────────────────
  const loadUserReactions = () => {
    const saved = localStorage.getItem('user_reactions');
    if (saved) setUserReactions(JSON.parse(saved));
  };

  const saveUserReactions = (reactions: UserReactions) => {
    localStorage.setItem('user_reactions', JSON.stringify(reactions));
    setUserReactions(reactions);
  };

  // ── Toggle a reaction ──────────────────────────────────────────────────────
  const toggleReaction = async (
    targetId: string,
    emoji: string,
    targetType: 'confession' | 'comment'
  ): Promise<boolean> => {
    try {
      const fingerprint = getUserFingerprint();
      const reactionsKey = targetType === 'confession' ? 'confessions' : 'comments';
      const current = userReactions[reactionsKey][targetId] ?? [];

      const isAdding = !current.includes(emoji);
      const newReactions = isAdding
        ? [...current, emoji]
        : current.filter((e) => e !== emoji);

      // Optimistic local update
      const updatedUserReactions: UserReactions = {
        ...userReactions,
        [reactionsKey]: { ...userReactions[reactionsKey], [targetId]: newReactions },
      };
      saveUserReactions(updatedUserReactions);

      // Sync with API
      if (isAdding) {
        // POST /reactions
        await api.post('/reactions', {
          target_id: targetId,
          target_type: targetType,
          emoji,
          user_fingerprint: fingerprint,
        });
      } else {
        // DELETE /reactions
        await api.delete('/reactions', {
          target_id: targetId,
          target_type: targetType,
          emoji,
          user_fingerprint: fingerprint,
        });
      }

      return true;
    } catch (error) {
      console.error('Error toggling reaction:', error);
      // Revert optimistic update
      loadUserReactions();
      toast({
        title: 'Reaction Failed 😵',
        description: "Couldn't update your reaction. Please try again.",
        variant: 'destructive',
      });
      return false;
    }
  };

  // ── Fetch counts for a single target ──────────────────────────────────────
  const getReactionCounts = async (
    targetId: string,
    targetType: 'confession' | 'comment'
  ): Promise<ReactionCounts> => {
    try {
      // GET /reactions?target_id=…&target_type=…
      const data = await api.get<{ emoji: string }[]>(
        `/reactions?target_id=${encodeURIComponent(targetId)}&target_type=${encodeURIComponent(targetType)}`
      );

      const counts: ReactionCounts = {};
      data.forEach((r) => {
        counts[r.emoji] = (counts[r.emoji] ?? 0) + 1;
      });
      return counts;
    } catch (error) {
      console.error('Error getting reaction counts:', error);
      return {};
    }
  };

  useEffect(() => {
    loadUserReactions();
  }, []);

  return { userReactions, availableEmojis, toggleReaction, getReactionCounts };
};
