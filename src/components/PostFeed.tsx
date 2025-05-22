
import { useState } from 'react';
import { Heart, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PostItem from './PostItem';

export interface Post {
  id: number;
  content: string;
  timestamp: Date;
  upvotes: number;
  downvotes: number;
  isNew: boolean;
  audioUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
}

interface PostFeedProps {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
}

const PostFeed = ({ posts, setPosts }: PostFeedProps) => {
  const { toast } = useToast();

  const handleVote = (id: number, type: 'up' | 'down') => {
    setPosts(prev => prev.map(post => 
      post.id === id 
        ? { 
            ...post, 
            upvotes: type === 'up' ? post.upvotes + 1 : post.upvotes,
            downvotes: type === 'down' ? post.downvotes + 1 : post.downvotes
          }
        : post
    ));
  };

  const handleReport = (id: number) => {
    toast({
      title: "Post Reported 🚨",
      description: "Thanks for keeping our digital chaos clean!",
    });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="font-pixel text-xl text-center text-retro-neon-green mb-8 animate-glow">
        🔥 THE CONFESSION FEED 🔥
      </h2>
      
      {posts.map((post) => (
        <PostItem 
          key={post.id}
          post={post}
          onVote={handleVote}
          onReport={handleReport}
          formatTimeAgo={formatTimeAgo}
        />
      ))}
    </div>
  );
};

export default PostFeed;
