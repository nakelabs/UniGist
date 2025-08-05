import { useState, useEffect } from 'react';
import { supabase, Confession, Comment } from '@/lib/supabase';
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

  const fetchConfessions = async () => {
    try {
      setLoading(true);
      
      // Fetch confessions
      const { data: confessionsData, error: confessionsError } = await supabase
        .from('confessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (confessionsError) throw confessionsError;

      // Fetch comments for all confessions
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Group comments by confession_id
      const commentsByConfession = commentsData?.reduce((acc, comment) => {
        if (!acc[comment.confession_id]) {
          acc[comment.confession_id] = [];
        }
        acc[comment.confession_id].push(comment);
        return acc;
      }, {} as Record<string, Comment[]>) || {};

      // Combine confessions with their comments
      const confessionsWithComments: ConfessionWithComments[] = confessionsData?.map(confession => ({
        ...confession,
        comments: commentsByConfession[confession.id] || [],
        showComments: false,
        isNew: false
      })) || [];

      setConfessions(confessionsWithComments);
    } catch (error) {
      console.error('Error fetching confessions:', error);
      toast({
        title: "Error loading confessions",
        description: "Failed to load confessions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createConfession = async (confessionData: {
    content: string;
    audioUrl?: string;
    videoUrl?: string;
    imageUrl?: string;
    tags?: string[];
  }) => {
    try {
      const { data, error } = await supabase
        .from('confessions')
        .insert({
          content: confessionData.content,
          audio_url: confessionData.audioUrl,
          video_url: confessionData.videoUrl,
          image_url: confessionData.imageUrl,
          tags: confessionData.tags || []
        })
        .select()
        .single();

      if (error) throw error;

      // Add the new confession to the top of the list
      const newConfession: ConfessionWithComments = {
        ...data,
        comments: [],
        showComments: false,
        isNew: true
      };

      setConfessions(prev => [newConfession, ...prev]);

      toast({
        title: "Confession Posted! 🎉",
        description: "Your secret is now part of the digital void...",
      });

      return data;
    } catch (error) {
      console.error('Error creating confession:', error);
      toast({
        title: "Error posting confession",
        description: "Failed to post your confession. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const addComment = async (confessionId: string, content: string, isAnonymous: boolean = true) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          confession_id: confessionId,
          content,
          is_anonymous: isAnonymous,
          username: isAnonymous ? undefined : 'User'
        })
        .select()
        .single();

      if (error) throw error;

      // Update the confession with the new comment
      setConfessions(prev => prev.map(confession => 
        confession.id === confessionId 
          ? { 
              ...confession, 
              comments: [...confession.comments, data],
              showComments: true
            }
          : confession
      ));

      toast({
        title: "Comment Added! 💬",
        description: "Your anonymous reply has been posted",
      });

      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error adding comment",
        description: "Failed to add your comment. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const toggleComments = (confessionId: string) => {
    setConfessions(prev => prev.map(confession => 
      confession.id === confessionId 
        ? { ...confession, showComments: !confession.showComments }
        : confession
    ));
  };

  useEffect(() => {
    fetchConfessions();

    // Set up real-time subscriptions
    const confessionsSubscription = supabase
      .channel('confessions_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'confessions' },
        () => {
          fetchConfessions();
        }
      )
      .subscribe();

    const commentsSubscription = supabase
      .channel('comments_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        () => {
          fetchConfessions();
        }
      )
      .subscribe();

    return () => {
      confessionsSubscription.unsubscribe();
      commentsSubscription.unsubscribe();
    };
  }, []);

  return {
    confessions,
    loading,
    createConfession,
    addComment,
    toggleComments,
    refetch: fetchConfessions
  };
};