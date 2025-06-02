import { useState, useEffect } from 'react';
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

// Track user votes
interface UserVotes {
  [postId: number]: {
    upvoted: boolean;
    downvoted: boolean;
  }
}

const PostFeed = ({ posts, setPosts }: PostFeedProps) => {
  const { toast } = useToast();
  const [userVotes, setUserVotes] = useState<UserVotes>({});
  
  // Load user votes from localStorage on component mount
  useEffect(() => {
    const savedVotes = localStorage.getItem('userVotes');
    if (savedVotes) {
      setUserVotes(JSON.parse(savedVotes));
    }
  }, []);

  // Save user votes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userVotes', JSON.stringify(userVotes));
  }, [userVotes]);

  const handleVote = (id: number, type: 'up' | 'down') => {
    // Check if user has already voted on this post
    const postVotes = userVotes[id] || { upvoted: false, downvoted: false };
    
    // If already voted this type, show a toast and return
    if ((type === 'up' && postVotes.upvoted) || (type === 'down' && postVotes.downvoted)) {
      toast({
        title: "Already voted",
        description: "You can only vote once per post",
      });
      return;
    }
    
    // If previously voted the other type, remove that vote first
    const updatePosts = prev => prev.map(post => {
      if (post.id === id) {
        let updatedUpvotes = post.upvotes;
        let updatedDownvotes = post.downvotes;
        
        if (type === 'up') {
          updatedUpvotes += 1;
          // If previously downvoted, remove that downvote
          if (postVotes.downvoted) {
            updatedDownvotes = Math.max(0, updatedDownvotes - 1);
          }
        } else {
          updatedDownvotes += 1;
          // If previously upvoted, remove that upvote
          if (postVotes.upvoted) {
            updatedUpvotes = Math.max(0, updatedUpvotes - 1);
          }
        }
        
        return { 
          ...post, 
          upvotes: updatedUpvotes,
          downvotes: updatedDownvotes
        };
      }
      return post;
    });
    
    setPosts(updatePosts);
    
    // Update user votes state
    setUserVotes(prev => ({
      ...prev,
      [id]: {
        upvoted: type === 'up' ? true : false,
        downvoted: type === 'down' ? true : false,
      }
    }));
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
          userVotes={userVotes[post.id] || { upvoted: false, downvoted: false }}
        />
      ))}
    </div>
  );
};

export default PostFeed;
