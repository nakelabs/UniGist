import { useState } from 'react';
import { Heart, ArrowUp, ArrowDown, MessageCircle, Send } from 'lucide-react';
import { ConfessionWithComments } from '@/hooks/useConfessions';
import { Comment } from '@/lib/supabase';

interface PostItemProps {
  post: ConfessionWithComments;
  onVote: (id: string, type: 'up' | 'down', isComment?: boolean) => Promise<boolean>;
  onReport: (id: string) => void;
  formatTimeAgo: (date: string) => string;
  userVotes: { upvoted: boolean; downvoted: boolean };
  commentVotes: { [commentId: string]: { upvoted: boolean; downvoted: boolean } };
  onToggleComments: (postId: string) => void;
  onAddComment: (postId: string, content: string, isAnonymous?: boolean) => Promise<void>;
}

const PostItem = ({ 
  post, 
  onVote, 
  onReport, 
  formatTimeAgo, 
  userVotes, 
  commentVotes,
  onToggleComments,
  onAddComment 
}: PostItemProps) => {
  const [newComment, setNewComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleSubmitComment = async () => {
    if (newComment.trim()) {
      setIsSubmittingComment(true);
      try {
        await onAddComment(post.id, newComment.trim(), isAnonymous);
        setNewComment('');
      } catch (error) {
        console.error('Error submitting comment:', error);
      } finally {
        setIsSubmittingComment(false);
      }
    }
  };

  const handleVote = async (id: string, type: 'up' | 'down', isComment: boolean = false) => {
    await onVote(id, type, isComment);
  };

  return (
    <div key={post.id} className="retro-card relative">
      {post.isNew && (
        <div className="absolute -top-2 -right-2 bg-retro-cyber-yellow text-black font-pixel text-xs px-2 py-1 animate-blink">
          NEW!
        </div>
      )}
      
      <div className="flex justify-between items-start mb-3">
        <span className="font-cyber text-sm text-retro-electric-blue">
          Anonymous Ghost #{post.id.slice(-8)}
        </span>
        <div className="flex items-center space-x-2">
          <span className="font-cyber text-xs text-retro-hot-pink">
            {formatTimeAgo(post.created_at)}
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

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {post.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-retro-electric-blue/20 border border-retro-electric-blue/40 text-retro-electric-blue font-pixel text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      
      {post.image_url && (
        <div className="mb-4 border-2 border-retro-hot-pink p-2">
          <img src={post.image_url} alt="Confession" className="max-w-full h-auto" />
        </div>
      )}
      
      {post.video_url && (
        <div className="mb-4 border-2 border-retro-electric-blue p-2">
          <video controls src={post.video_url} className="w-full">
            Your browser does not support video playback
          </video>
        </div>
      )}
      
      {post.audio_url && (
        <div className="mb-4">
          <audio controls src={post.audio_url} className="w-full">
            Your browser does not support audio playback
          </audio>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleVote(post.id, 'up')}
            className={`flex items-center space-x-1 transition-colors group ${
              userVotes.upvoted 
                ? 'text-retro-cyber-yellow' 
                : 'text-retro-neon-green hover:text-retro-cyber-yellow'
            }`}
            disabled={userVotes.upvoted}
          >
            <ArrowUp className="w-4 h-4 group-hover:animate-bounce-retro" />
            <span className="font-cyber text-sm">{post.upvotes}</span>
          </button>
          
          <button
            onClick={() => handleVote(post.id, 'down')}
            className={`flex items-center space-x-1 transition-colors group ${
              userVotes.downvoted 
                ? 'text-retro-cyber-yellow' 
                : 'text-retro-hot-pink hover:text-retro-cyber-yellow'
            }`}
            disabled={userVotes.downvoted}
          >
            <ArrowDown className="w-4 h-4 group-hover:animate-bounce-retro" />
            <span className="font-cyber text-sm">{post.downvotes}</span>
          </button>

          <button
            onClick={() => onToggleComments(post.id)}
            className="flex items-center space-x-1 text-retro-electric-blue hover:text-retro-cyber-yellow transition-colors group"
          >
            <MessageCircle className="w-4 h-4 group-hover:animate-bounce-retro" />
            <span className="font-cyber text-sm">{post.comments.length}</span>
          </button>
        </div>

        <div className="flex items-center space-x-1 text-retro-electric-blue">
          <Heart className="w-4 h-4" />
          <span className="font-cyber text-sm">
            {post.upvotes - post.downvotes} vibes
          </span>
        </div>
      </div>

      {/* Comments Section */}
      {post.showComments && (
        <div className="mt-4 border-t border-retro-hot-pink/30 pt-4">
          {/* Comment Input */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <label className="flex items-center space-x-2 font-cyber text-xs text-retro-neon-green">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="retro-checkbox"
                />
                <span>Anonymous Reply</span>
              </label>
            </div>
            <div className="flex space-x-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add an anonymous reply..."
                className="flex-1 bg-gray-900/50 border border-retro-electric-blue/30 rounded p-2 text-retro-pastel-blue font-cyber text-sm resize-none"
                rows={2}
                maxLength={280}
              />
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmittingComment}
                className="px-3 py-2 bg-retro-cyber-yellow text-black font-pixel text-xs hover:bg-retro-neon-green disabled:opacity-50 disabled:cursor-not-allowed"
                title="Submit comment"
              >
                {isSubmittingComment ? '...' : <Send className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-xs text-retro-hot-pink/70 mt-1">
              {newComment.length}/280 characters
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-3">
            {post.comments.map((comment) => {
              const commentUserVotes = commentVotes[comment.id] || { upvoted: false, downvoted: false };
              return (
                <div key={comment.id} className="bg-gray-900/30 border border-retro-electric-blue/20 rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-cyber text-xs text-retro-electric-blue/80">
                      {comment.is_anonymous ? `Anonymous Reply #${comment.id.slice(-8)}` : comment.username}
                    </span>
                    <span className="font-cyber text-xs text-retro-hot-pink/70">
                      {formatTimeAgo(comment.created_at)}
                    </span>
                  </div>
                  
                  <p className="font-cyber text-sm text-retro-pastel-blue mb-2">
                    {comment.content}
                  </p>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleVote(comment.id, 'up', true)}
                      className={`flex items-center space-x-1 transition-colors ${
                        commentUserVotes.upvoted 
                          ? 'text-retro-cyber-yellow' 
                          : 'text-retro-neon-green/70 hover:text-retro-neon-green'
                      }`}
                      disabled={commentUserVotes.upvoted}
                    >
                      <ArrowUp className="w-3 h-3" />
                      <span className="font-cyber text-xs">{comment.upvotes}</span>
                    </button>
                    
                    <button
                      onClick={() => handleVote(comment.id, 'down', true)}
                      className={`flex items-center space-x-1 transition-colors ${
                        commentUserVotes.downvoted 
                          ? 'text-retro-cyber-yellow' 
                          : 'text-retro-hot-pink/70 hover:text-retro-hot-pink'
                      }`}
                      disabled={commentUserVotes.downvoted}
                    >
                      <ArrowDown className="w-3 h-3" />
                      <span className="font-cyber text-xs">{comment.downvotes}</span>
                    </button>

                    <button
                      onClick={() => onReport(comment.id)}
                      className="flex items-center space-x-1 text-gray-400 hover:text-retro-cyber-yellow transition-colors"
                      title="Report comment"
                    >
                      <span className="font-cyber text-xs">report</span>
                    </button>
                  </div>
                </div>
              );
            })}
            
            {post.comments.length === 0 && (
              <div className="text-center text-retro-electric-blue/50 font-cyber text-sm py-4">
                No replies yet. Be the first to respond anonymously! 👻
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostItem;
