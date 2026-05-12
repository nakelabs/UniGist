import { useState, useEffect } from 'react';
import { api, generateUserFingerprint } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface UserVotes {
  confessions: Record<string, { upvoted: boolean; downvoted: boolean }>;
  comments: Record<string, { upvoted: boolean; downvoted: boolean }>;
}

export const useVotes = () => {
  const [userVotes, setUserVotes] = useState<UserVotes>({
    confessions: {},
    comments: {},
  });
  const [userFingerprint] = useState(() => generateUserFingerprint());
  const { toast } = useToast();

  // ── Load this user's existing votes on mount ──────────────────────────────
  const loadUserVotes = async () => {
    try {
      // GET /votes?user_fingerprint=…
      const data = await api.get<
        { target_type: 'confession' | 'comment'; target_id: string; vote_type: 'up' | 'down' }[]
      >(`/votes?user_fingerprint=${encodeURIComponent(userFingerprint)}`);

      const votes: UserVotes = { confessions: {}, comments: {} };
      data?.forEach((v) => {
        const key = v.target_type === 'confession' ? 'confessions' : 'comments';
        votes[key][v.target_id] = {
          upvoted: v.vote_type === 'up',
          downvoted: v.vote_type === 'down',
        };
      });
      setUserVotes(votes);
    } catch (error) {
      console.error('Error loading user votes:', error);
    }
  };

  // ── Cast or change a vote ─────────────────────────────────────────────────
  const vote = async (
    targetId: string,
    voteType: 'up' | 'down',
    targetType: 'confession' | 'comment'
  ) => {
    const votesKey = targetType === 'confession' ? 'confessions' : 'comments';
    const currentVote = userVotes[votesKey][targetId];

    if (
      (voteType === 'up' && currentVote?.upvoted) ||
      (voteType === 'down' && currentVote?.downvoted)
    ) {
      toast({
        title: 'Already voted',
        description: `You can only vote once per ${targetType}`,
      });
      return false;
    }

    try {
      // POST /votes  — server handles upsert + count update atomically
      await api.post('/votes', {
        user_fingerprint: userFingerprint,
        target_type: targetType,
        target_id: targetId,
        vote_type: voteType,
      });

      setUserVotes((prev) => ({
        ...prev,
        [votesKey]: {
          ...prev[votesKey],
          [targetId]: { upvoted: voteType === 'up', downvoted: voteType === 'down' },
        },
      }));

      return true;
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: 'Error voting',
        description: 'Failed to record your vote. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    loadUserVotes();
  }, [userFingerprint]);

  return { userVotes, vote };
};