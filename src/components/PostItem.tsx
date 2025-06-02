import { useState } from 'react';
import { Heart, ArrowUp, ArrowDown } from 'lucide-react';
import { Post } from './PostFeed';

interface PostItemProps {
  post: Post;
  onVote: (id: number, type: 'up' | 'down') => void;
  onReport: (id: number) => void;
  formatTimeAgo: (date: Date) => string;
  userVotes: { upvoted: boolean; downvoted: boolean };
}

const PostItem = ({ post, onVote, onReport, formatTimeAgo, userVotes }: PostItemProps) => {
  return (
    <div key={post.id} className="retro-card relative">
      {post.isNew && (
        <div className="absolute -top-2 -right-2 bg-retro-cyber-yellow text-black font-pixel text-xs px-2 py-1 animate-blink">
          NEW!
        </div>
      )}
      
      <div className="flex justify-between items-start mb-3">
        <span className="font-cyber text-sm text-retro-electric-blue">
          Anonymous Ghost #{post.id}
        </span>
        <div className="flex items-center space-x-2">
          <span className="font-cyber text-xs text-retro-hot-pink">
            {formatTimeAgo(post.timestamp)}
          </span>
          <button
            onClick={() => onReport(post.id)}
            className="font-cyber text-xs text-retro-cyber-yellow hover:text-white transition-colors underline"
          >
            report
          </button>
        </div>
      </div>

      {post.content && (
        <p className="font-cyber text-retro-neon-green mb-4 leading-relaxed">
          {post.content}
        </p>
      )}
      
      {post.imageUrl && (
        <div className="mb-4 border-2 border-retro-hot-pink p-2">
          <img src={post.imageUrl} alt="Confession" className="max-w-full h-auto" />
        </div>
      )}
      
      {post.videoUrl && (
        <div className="mb-4 border-2 border-retro-electric-blue p-2">
          <video controls src={post.videoUrl} className="w-full">
            Your browser does not support video playback
          </video>
        </div>
      )}
      
      {post.audioUrl && (
        <div className="mb-4">
          <audio controls src={post.audioUrl} className="w-full">
            Your browser does not support audio playback
          </audio>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onVote(post.id, 'up')}
            className="flex items-center space-x-1 text-retro-neon-green hover:text-retro-cyber-yellow transition-colors group"
          >
            <ArrowUp className="w-4 h-4 group-hover:animate-bounce-retro" />
            <span className="font-cyber text-sm">{post.upvotes}</span>
          </button>
          
          <button
            onClick={() => onVote(post.id, 'down')}
            className="flex items-center space-x-1 text-retro-hot-pink hover:text-retro-cyber-yellow transition-colors group"
          >
            <ArrowDown className="w-4 h-4 group-hover:animate-bounce-retro" />
            <span className="font-cyber text-sm">{post.downvotes}</span>
          </button>
        </div>

        <div className="flex items-center space-x-1 text-retro-electric-blue">
          <Heart className="w-4 h-4" />
          <span className="font-cyber text-sm">
            {post.upvotes - post.downvotes} vibes
          </span>
        </div>
      </div>
    </div>
  );
};

export default PostItem;
