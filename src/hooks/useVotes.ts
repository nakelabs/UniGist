import { useState } from 'react';
import { api, generateUserFingerprint, LikeResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const useVotes = () => {
  // We'll track local state of what the user has liked recently.
  // Since there is no batch GET /votes endpoint, we rely on optimistic updates 
  // and local caching of their interactions in this session.
  const [likedConfessions, setLikedConfessions] = useState<Record<number, boolean>>({});
  const [userFingerprint] = useState(() => generateUserFingerprint());
  const { toast } = useToast();

  const checkHasLiked = async (confessionId: number) => {
    try {
      const data = await api.get<{ has_liked: boolean }>(
        `/confessions/${confessionId}/liked?device_id=${encodeURIComponent(userFingerprint)}`
      );
      setLikedConfessions(prev => ({
        ...prev,
        [confessionId]: data.has_liked
      }));
      return data.has_liked;
    } catch (e) {
      console.error('Error checking like status', e);
      return false;
    }
  };

  const toggleLike = async (confessionId: number) => {
    const isCurrentlyLiked = likedConfessions[confessionId] || false;
    
    // Optimistic update
    setLikedConfessions(prev => ({
      ...prev,
      [confessionId]: !isCurrentlyLiked
    }));

    try {
      let data: LikeResponse;
      if (isCurrentlyLiked) {
        data = await api.delete<LikeResponse>(
          `/confessions/${confessionId}/unlike?device_id=${encodeURIComponent(userFingerprint)}`
        );
      } else {
        data = await api.post<LikeResponse>(
          `/confessions/${confessionId}/like?device_id=${encodeURIComponent(userFingerprint)}`,
          {}
        );
      }
      
      return data.likes_count;
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: 'Error',
        description: 'Failed to update like. Please try again.',
        variant: 'destructive',
      });
      // Revert optimistic update
      setLikedConfessions(prev => ({
        ...prev,
        [confessionId]: isCurrentlyLiked
      }));
      return null;
    }
  };

  return { likedConfessions, toggleLike, checkHasLiked };
};