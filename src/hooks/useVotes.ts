import { useState, useEffect } from 'react';
import { supabase, generateUserFingerprint } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface UserVotes {
  confessions: Record<string, { upvoted: boolean; downvoted: boolean }>;
  comments: Record<string, { upvoted: boolean; downvoted: boolean }>;
}

export const useVotes = () => {
  const [userVotes, setUserVotes] = useState<UserVotes>({
    confessions: {},
    comments: {}
  });
  const [userFingerprint] = useState(() => generateUserFingerprint());
  const { toast } = useToast();

  const loadUserVotes = async () => {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('user_fingerprint', userFingerprint);

      if (error) throw error;

      const votes: UserVotes = {
        confessions: {},
        comments: {}
      };

      data?.forEach(vote => {
        const targetType = vote.target_type === 'confession' ? 'confessions' : 'comments';
        votes[targetType][vote.target_id] = {
          upvoted: vote.vote_type === 'up',
          downvoted: vote.vote_type === 'down'
        };
      });

      setUserVotes(votes);
    } catch (error) {
      console.error('Error loading user votes:', error);
    }
  };

  const vote = async (
    targetId: string, 
    voteType: 'up' | 'down', 
    targetType: 'confession' | 'comment'
  ) => {
    const votesKey = targetType === 'confession' ? 'confessions' : 'comments';
    const currentVote = userVotes[votesKey][targetId];

    // Check if user already voted this way
    if ((voteType === 'up' && currentVote?.upvoted) || 
        (voteType === 'down' && currentVote?.downvoted)) {
      toast({
        title: "Already voted",
        description: `You can only vote once per ${targetType}`,
      });
      return false;
    }

    try {
      // Insert or update vote
      const { error: voteError } = await supabase
        .from('votes')
        .upsert({
          user_fingerprint: userFingerprint,
          target_type: targetType,
          target_id: targetId,
          vote_type: voteType
        });

      if (voteError) throw voteError;

      // Update vote counts in the target table
      const tableName = targetType === 'confession' ? 'confessions' : 'comments';
      const incrementField = voteType === 'up' ? 'upvotes' : 'downvotes';
      const decrementField = voteType === 'up' ? 'downvotes' : 'upvotes';

      // Get current counts
      const { data: currentData, error: fetchError } = await supabase
        .from(tableName)
        .select(`${incrementField}, ${decrementField}`)
        .eq('id', targetId)
        .single();

      if (fetchError) throw fetchError;

      let newIncrementValue = (currentData[incrementField] || 0) + 1;
      let newDecrementValue = currentData[decrementField] || 0;

      // If user previously voted the opposite way, decrement that count
      if ((voteType === 'up' && currentVote?.downvoted) || 
          (voteType === 'down' && currentVote?.upvoted)) {
        newDecrementValue = Math.max(0, newDecrementValue - 1);
      }

      // Update the counts
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          [incrementField]: newIncrementValue,
          [decrementField]: newDecrementValue
        })
        .eq('id', targetId);

      if (updateError) throw updateError;

      // Update local state
      setUserVotes(prev => ({
        ...prev,
        [votesKey]: {
          ...prev[votesKey],
          [targetId]: {
            upvoted: voteType === 'up',
            downvoted: voteType === 'down'
          }
        }
      }));

      return true;
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error voting",
        description: "Failed to record your vote. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    loadUserVotes();
  }, [userFingerprint]);

  return {
    userVotes,
    vote
  };
};