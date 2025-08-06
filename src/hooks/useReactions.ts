import { useState, useEffect } from 'react';
import { supabase, generateUserFingerprint } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface Reaction {
  id: string;
  user_fingerprint: string;
  target_type: 'confession' | 'comment';
  target_id: string;
  emoji: string;
  created_at: string;
}

export interface ReactionCounts {
  [emoji: string]: number;
}

export interface UserReactions {
  confessions: Record<string, string[]>; // target_id -> array of emojis user reacted with
  comments: Record<string, string[]>;
}

export const useReactions = () => {
  const [userReactions, setUserReactions] = useState<UserReactions>({
    confessions: {},
    comments: {}
  });
  const [userFingerprint] = useState(() => generateUserFingerprint());
  const { toast } = useToast();

  // Available emoji reactions
  const availableEmojis = [
    '😂', '😭', '😱', '🔥', '💯', '❤️', '👏', '😍', 
    '🤔', '😬', '🤯', '👀', '💀', '🙄', '😤', '🥺'
  ];

  const loadUserReactions = async () => {
    try {
      const { data, error } = await supabase
        .from('reactions')
        .select('*')
        .eq('user_fingerprint', userFingerprint);

      if (error) throw error;

      const reactions: UserReactions = {
        confessions: {},
        comments: {}
      };

      data?.forEach(reaction => {
        const targetType = reaction.target_type === 'confession' ? 'confessions' : 'comments';
        if (!reactions[targetType][reaction.target_id]) {
          reactions[targetType][reaction.target_id] = [];
        }
        reactions[targetType][reaction.target_id].push(reaction.emoji);
      });

      setUserReactions(reactions);
    } catch (error) {
      console.error('Error loading user reactions:', error);
    }
  };

  const toggleReaction = async (
    targetId: string,
    emoji: string,
    targetType: 'confession' | 'comment'
  ) => {
    const reactionsKey = targetType === 'confession' ? 'confessions' : 'comments';
    const currentReactions = userReactions[reactionsKey][targetId] || [];
    const hasReacted = currentReactions.includes(emoji);

    try {
      if (hasReacted) {
        // Remove reaction
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('user_fingerprint', userFingerprint)
          .eq('target_type', targetType)
          .eq('target_id', targetId)
          .eq('emoji', emoji);

        if (error) throw error;

        // Update local state
        setUserReactions(prev => ({
          ...prev,
          [reactionsKey]: {
            ...prev[reactionsKey],
            [targetId]: currentReactions.filter(e => e !== emoji)
          }
        }));

        toast({
          title: "Reaction removed",
          description: `Removed ${emoji} reaction`,
        });
      } else {
        // Add reaction
        const { error } = await supabase
          .from('reactions')
          .insert({
            user_fingerprint: userFingerprint,
            target_type: targetType,
            target_id: targetId,
            emoji: emoji
          });

        if (error) throw error;

        // Update local state
        setUserReactions(prev => ({
          ...prev,
          [reactionsKey]: {
            ...prev[reactionsKey],
            [targetId]: [...currentReactions, emoji]
          }
        }));

        toast({
          title: "Reaction added",
          description: `Added ${emoji} reaction`,
        });
      }

      return true;
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast({
        title: "Error",
        description: "Failed to update reaction. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const getReactionCounts = async (targetId: string, targetType: 'confession' | 'comment'): Promise<ReactionCounts> => {
    try {
      const { data, error } = await supabase
        .from('reactions')
        .select('emoji')
        .eq('target_type', targetType)
        .eq('target_id', targetId);

      if (error) throw error;

      const counts: ReactionCounts = {};
      data?.forEach(reaction => {
        counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
      });

      return counts;
    } catch (error) {
      console.error('Error getting reaction counts:', error);
      return {};
    }
  };

  useEffect(() => {
    loadUserReactions();
  }, [userFingerprint]);

  return {
    userReactions,
    availableEmojis,
    toggleReaction,
    getReactionCounts
  };
};
