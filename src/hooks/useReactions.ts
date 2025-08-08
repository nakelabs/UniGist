import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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
    comments: {}
  });
  
  const { toast } = useToast();

  // Available emojis for reactions
  const availableEmojis = ['😂', '😭', '😱', '🔥', '💯', '❤️', '👏', '😍', '🤔', '😬', '🤯', '👀', '💀', '🙄', '😤', '🥺'];

  // Get user fingerprint for anonymous tracking
  const getUserFingerprint = () => {
    const fingerprint = localStorage.getItem('user_fingerprint');
    if (fingerprint) {
      return fingerprint;
    }
    
    // Create a simple fingerprint based on browser characteristics
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx!.textBaseline = 'top';
    ctx!.font = '14px Arial';
    ctx!.fillText('Browser fingerprint', 2, 2);
    
    const newFingerprint = canvas.toDataURL() + navigator.userAgent + screen.width + screen.height;
    const hash = btoa(newFingerprint).slice(0, 16);
    
    localStorage.setItem('user_fingerprint', hash);
    return hash;
  };

  // Load user reactions from localStorage
  const loadUserReactions = () => {
    const saved = localStorage.getItem('user_reactions');
    if (saved) {
      setUserReactions(JSON.parse(saved));
    }
  };

  // Save user reactions to localStorage
  const saveUserReactions = (reactions: UserReactions) => {
    localStorage.setItem('user_reactions', JSON.stringify(reactions));
    setUserReactions(reactions);
  };

  // Toggle reaction
  const toggleReaction = async (targetId: string, emoji: string, targetType: 'confession' | 'comment'): Promise<boolean> => {
    try {
      const fingerprint = getUserFingerprint();
      const reactionsKey = targetType === 'confession' ? 'confessions' : 'comments';
      const currentReactions = userReactions[reactionsKey][targetId] || [];
      
      let newReactions: string[];
      let action: 'add' | 'remove';

      if (currentReactions.includes(emoji)) {
        // Remove reaction
        newReactions = currentReactions.filter(e => e !== emoji);
        action = 'remove';
      } else {
        // Add reaction
        newReactions = [...currentReactions, emoji];
        action = 'add';
      }

      // Update local state first for immediate feedback
      const updatedUserReactions = {
        ...userReactions,
        [reactionsKey]: {
          ...userReactions[reactionsKey],
          [targetId]: newReactions
        }
      };
      saveUserReactions(updatedUserReactions);

      // Sync with database
      if (action === 'add') {
        const { error } = await supabase
          .from('reactions')
          .insert({
            target_id: targetId,
            target_type: targetType,
            emoji: emoji,
            user_fingerprint: fingerprint
          });

        if (error) {
          console.error('Error adding reaction:', error);
          // Revert on error
          saveUserReactions(userReactions);
          return false;
        }
      } else {
        const { error } = await supabase
          .from('reactions')
          .delete()
          .match({
            target_id: targetId,
            target_type: targetType,
            emoji: emoji,
            user_fingerprint: fingerprint
          });

        if (error) {
          console.error('Error removing reaction:', error);
          // Revert on error
          saveUserReactions(userReactions);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast({
        title: "Reaction Failed 😵",
        description: "Couldn't update your reaction. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Get reaction counts for a target
  const getReactionCounts = async (targetId: string, targetType: 'confession' | 'comment'): Promise<ReactionCounts> => {
    try {
      const { data, error } = await supabase
        .from('reactions')
        .select('emoji')
        .eq('target_id', targetId)
        .eq('target_type', targetType);

      if (error) {
        console.error('Error fetching reaction counts:', error);
        return {};
      }

      // Count reactions by emoji
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

  // Load user reactions on mount
  useEffect(() => {
    loadUserReactions();
  }, []);

  return {
    userReactions,
    availableEmojis,
    toggleReaction,
    getReactionCounts
  };
};
