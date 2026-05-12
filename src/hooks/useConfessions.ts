import { useState, useEffect, useRef } from 'react';
import { api, Confession, Comment } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface ConfessionWithComments extends Confession {
  comments: Comment[];
  showComments: boolean;
  isNew: boolean;
}

interface ConfessionsAndComments {
  confessions: Confession[];
  comments: Comment[];
}

export const useConfessions = () => {
  const [confessions, setConfessions] = useState<ConfessionWithComments[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchConfessions = async () => {
    console.log('Fetching confessions from API...');
    try {
      setLoading(true);

      // GET /confessions returns { confessions, comments } pre-joined
      const data = await api.get<ConfessionsAndComments>('/confessions');

      const confessionsData = data.confessions ?? [];
      const commentsData = data.comments ?? [];

      console.log('Fetched confessions:', confessionsData);
      console.log('Fetched comments:', commentsData);

      // Group comments by confession_id
      const commentsByConfession = commentsData.reduce((acc, comment) => {
        if (!acc[comment.confession_id]) acc[comment.confession_id] = [];
        acc[comment.confession_id].push(comment);
        return acc;
      }, {} as Record<string, Comment[]>);

      const confessionsWithComments: ConfessionWithComments[] =
        confessionsData.map((confession) => ({
          ...confession,
          comments: commentsByConfession[confession.id] ?? [],
          showComments: false,
          isNew: false,
        }));

      console.log('Setting confessions state with:', confessionsWithComments);
      setConfessions(confessionsWithComments);
    } catch (error) {
      console.error('Error fetching confessions:', error);
      toast({
        title: 'Error loading confessions',
        description: 'Failed to load confessions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createConfession = async (confessionData: {
    content: string;
    audioUrl?: string;
    videoUrl?: string;
    videoContext?: string;
    imageUrl?: string;
    imageContext?: string;
    tags?: string[];
  }) => {
    try {
      const data = await api.post<Confession>('/confessions', {
        content: confessionData.content,
        audio_url: confessionData.audioUrl,
        video_url: confessionData.videoUrl,
        video_context: confessionData.videoContext,
        image_url: confessionData.imageUrl,
        image_context: confessionData.imageContext,
        tags: confessionData.tags ?? [],
      });

      const newConfession: ConfessionWithComments = {
        ...data,
        comments: [],
        showComments: false,
        isNew: true,
      };

      setConfessions((prev) => [newConfession, ...prev]);

      toast({
        title: 'Confession Posted! 🎉',
        description: 'Your secret is now part of the digital void...',
      });

      return data;
    } catch (error) {
      console.error('Error creating confession:', error);
      toast({
        title: 'Error posting confession',
        description: 'Failed to post your confession. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const addComment = async (
    confessionId: string,
    content: string,
    isAnonymous: boolean = true
  ) => {
    try {
      const data = await api.post<Comment>(
        `/confessions/${confessionId}/comments`,
        {
          content,
          is_anonymous: isAnonymous,
          username: isAnonymous ? undefined : 'User',
        }
      );

      setConfessions((prev) =>
        prev.map((confession) =>
          confession.id === confessionId
            ? {
                ...confession,
                comments: [...confession.comments, data],
                showComments: true,
              }
            : confession
        )
      );

      toast({
        title: 'Comment Added! 💬',
        description: 'Your anonymous reply has been posted',
      });

      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error adding comment',
        description: 'Failed to add your comment. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const toggleComments = (confessionId: string) => {
    setConfessions((prev) =>
      prev.map((confession) =>
        confession.id === confessionId
          ? { ...confession, showComments: !confession.showComments }
          : confession
      )
    );
  };

  const updateVoteCount = (
    confessionId: string,
    type: 'up' | 'down',
    wasVoted: boolean,
    hadOppositeVote: boolean
  ) => {
    setConfessions((prev) =>
      prev.map((confession) => {
        if (confession.id !== confessionId) return confession;

        let newUpvotes = confession.upvotes || 0;
        let newDownvotes = confession.downvotes || 0;

        if (type === 'up') {
          if (wasVoted) {
            newUpvotes = Math.max(0, newUpvotes - 1);
          } else {
            newUpvotes += 1;
            if (hadOppositeVote) newDownvotes = Math.max(0, newDownvotes - 1);
          }
        } else {
          if (wasVoted) {
            newDownvotes = Math.max(0, newDownvotes - 1);
          } else {
            newDownvotes += 1;
            if (hadOppositeVote) newUpvotes = Math.max(0, newUpvotes - 1);
          }
        }

        return { ...confession, upvotes: newUpvotes, downvotes: newDownvotes };
      })
    );
  };

  useEffect(() => {
    fetchConfessions();

    // Poll every 30 seconds (replaces Supabase real-time subscriptions)
    pollRef.current = setInterval(fetchConfessions, 30_000);

    const handleForceRefresh = () => {
      console.log('Force refresh event received, fetching confessions...');
      fetchConfessions();
    };
    window.addEventListener('forceRefreshFeed', handleForceRefresh);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      window.removeEventListener('forceRefreshFeed', handleForceRefresh);
    };
  }, []);

  return {
    confessions,
    loading,
    createConfession,
    addComment,
    toggleComments,
    updateVoteCount,
    refetch: fetchConfessions,
  };
};