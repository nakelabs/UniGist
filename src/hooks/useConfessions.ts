import { useState, useEffect, useRef } from 'react';
import { api, Confession, Comment, PaginatedConfessionsResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface ConfessionWithComments extends Confession {
  comments: Comment[];
  showComments: boolean;
  isNew: boolean;
}

export const useConfessions = () => {
  const [confessions, setConfessions] = useState<ConfessionWithComments[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchConfessions = async (isBackground = false) => {
    console.log('Fetching confessions from API...');
    try {
      if (!isBackground) setLoading(true);

      // GET /confessions returns { confessions, comments } pre-joined
      const data = await api.get<PaginatedConfessionsResponse>('/confessions');

      const confessionsData = data.confessions ?? [];
      const commentsData = data.comments ?? [];

      console.log('Fetched confessions:', confessionsData);
      console.log('Fetched comments:', commentsData);

      // Group comments by confession_id
      const commentsByConfession = commentsData.reduce((acc, comment) => {
        if (!acc[comment.confession_id]) acc[comment.confession_id] = [];
        acc[comment.confession_id].push(comment);
        return acc;
      }, {} as Record<number, Comment[]>);

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
      if (!isBackground) setLoading(false);
    }
  };

  const createConfession = async (confessionData: {
    content: string;
    audioFile?: File;
    videoFile?: File;
    imageFile?: File;
    tags?: string[];
  }) => {
    try {
      const formData = new FormData();
      if (confessionData.content) {
        formData.append('text_content', confessionData.content);
      }
      if (confessionData.audioFile) {
        formData.append('audio_file', confessionData.audioFile);
      }
      if (confessionData.videoFile) {
        formData.append('video_file', confessionData.videoFile);
      }
      if (confessionData.imageFile) {
        formData.append('image_file', confessionData.imageFile);
      }
      if (confessionData.tags && confessionData.tags.length > 0) {
        formData.append('tags', confessionData.tags.join(','));
      }

      const data = await api.postFormData<Confession>('/confessions', formData);

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
    confessionId: number,
    content: string,
    isAnonymous: boolean = true,
    taggedCommentId?: number | null
  ) => {
    try {
      const data = await api.post<Comment>(
        `/confessions/${confessionId}/comments`,
        {
          content,
          is_anonymous: isAnonymous,
          username: isAnonymous ? undefined : 'User',
          tagged_comment_id: taggedCommentId ?? null,
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
        description: data.tagged_username 
          ? `Replying to @${data.tagged_username}` 
          : 'Your anonymous reply has been posted',
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

  const deleteConfession = async (id: number) => {
    try {
      const res = await api.deleteConfession(id);
      setConfessions((prev) => prev.filter((c) => c.id !== id));
      toast({
        title: 'Post Deleted',
        description: res?.message || `Confession ${id} and associated comments were soft-deleted`,
      });
      return res;
    } catch (error) {
      console.error('Error deleting confession:', error);
      toast({
        title: 'Error deleting post',
        description: 'Failed to delete confession. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteComment = async (commentId: number, confessionId?: number) => {
    try {
      const res = await api.deleteComment(commentId);
      setConfessions((prev) =>
        prev.map((c) => {
          if (confessionId && c.id !== confessionId) return c;
          return {
            ...c,
            comments: c.comments.filter((cm) => cm.id !== commentId),
          };
        })
      );
      toast({
        title: 'Comment Deleted',
        description: res?.message || `Comment ${commentId} was soft-deleted`,
      });
      return res;
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error deleting comment',
        description: 'Failed to delete comment. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const toggleComments = (confessionId: number) => {
    setConfessions((prev) =>
      prev.map((confession) =>
        confession.id === confessionId
          ? { ...confession, showComments: !confession.showComments }
          : confession
      )
    );
  };

  const updateVoteCount = (
    confessionId: number,
    newLikesCount: number
  ) => {
    setConfessions((prev) =>
      prev.map((confession) => {
        if (confession.id !== confessionId) return confession;
        return { ...confession, likes_count: newLikesCount };
      })
    );
  };

  useEffect(() => {
    fetchConfessions();

    // Poll every 30 seconds
    pollRef.current = setInterval(() => fetchConfessions(true), 30_000);

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
    deleteConfession,
    deleteComment,
    toggleComments,
    updateVoteCount,
    refetch: fetchConfessions,
  };
};