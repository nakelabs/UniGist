import React, { useState, useRef, useEffect } from 'react';
import { ConfessionWithComments } from '@/hooks/useConfessions';
import { ArrowLeft, Heart, MessageCircle, Share2, Clock, Send, MoreHorizontal, Bookmark, BarChart2 } from 'lucide-react';
import { getGeneratedUser, getPostViews, formatTwitterNumber } from '@/lib/usernameGenerator';
import { formatTweetContent } from './TwitterPostCard';
import { timeAgo as formatTimeAgo, expiresIn as formatExpiresIn } from '@/lib/dateUtils';

interface PostDiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: ConfessionWithComments | null;
  onVote: (id: number) => Promise<void>;
  hasLiked: boolean;
  onAddComment: (postId: number, content: string) => Promise<void>;
  onReport: (id: string, isComment?: boolean) => void;
  onShare: (post: ConfessionWithComments) => void;
  timeAgo?: (dateStr: string) => string;
  expiresIn?: (dateStr: string) => string;
}

export const PostDiscussionModal: React.FC<PostDiscussionModalProps> = ({
  isOpen,
  onClose,
  post,
  onVote,
  hasLiked,
  onAddComment,
  onReport,
  onShare,
  timeAgo = formatTimeAgo,
  expiresIn = formatExpiresIn,
}) => {
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Auto-focus input slightly delayed
      setTimeout(() => inputRef.current?.focus(), 200);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !post) return null;

  const postId = post.id.toString();
  const postUser = getGeneratedUser(post.id);
  const views = getPostViews(post.id, post.likes_count, post.comments?.length || 0);

  const handleSubmitReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(post.id, replyText.trim());
      setReplyText('');
      // Scroll to bottom of comments
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center overflow-hidden overscroll-none">
      {/* Container - full screen on mobile with dynamic viewport height, styled card on desktop */}
      <div 
        className="w-full h-[100dvh] sm:max-w-[620px] sm:h-[90vh] bg-black sm:border sm:border-[#2f3336] sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-fade-in"
      >
        {/* Top App Bar (X Style) */}
        <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-[#2f3336] px-4 h-14 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-colors active:scale-95"
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Post</h2>
              <span className="text-[12px] text-[#71767b]">
                {post.comments.length} {post.comments.length === 1 ? 'reply' : 'replies'}
              </span>
            </div>
          </div>

          <button
            onClick={() => onReport(postId, false)}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-[#71767b] hover:text-[#1d9bf0] transition-colors"
            title="More options"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* Scrollable thread content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Main Original Post */}
          <div className="space-y-3 pb-3 border-b border-[#2f3336]">
            {/* Author row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  style={{ backgroundColor: postUser.avatarBg, color: postUser.avatarText }}
                  className="w-11 h-11 rounded-full border border-white/10 overflow-hidden flex items-center justify-center font-bold text-sm shrink-0"
                >
                  {!avatarError ? (
                    <img 
                      src={postUser.avatarUrl} 
                      alt={postUser.username}
                      className="w-full h-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <span>{postUser.initials}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[15px] text-white hover:underline cursor-pointer">
                      {postUser.username}
                    </span>
                  </div>
                  <span className="text-xs text-[#71767b]">{postUser.handle}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-[#71767b] bg-[#16181c] px-2.5 py-1 rounded-full border border-[#2f3336]">
                <Clock size={12} className="text-[#1d9bf0]" />
                <span>{expiresIn(post.created_at)}</span>
              </div>
            </div>

            {/* Post text */}
            {post.text_content && (
              <p className="text-[17px] text-[#e7e9ea] leading-relaxed whitespace-pre-wrap break-words font-sans pt-1">
                {formatTweetContent(post.text_content)}
              </p>
            )}


            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {post.tags.map((t) => (
                  <span key={t} className="text-[#1d9bf0] text-sm hover:underline cursor-pointer">
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Attached media: Image */}
            {post.image_url && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-[#2f3336] bg-black">
                <img
                  src={post.image_url}
                  alt="Post attachment"
                  className="w-full max-h-[480px] object-contain"
                />
              </div>
            )}

            {/* Attached media: Video */}
            {post.video_url && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-[#2f3336] bg-black">
                <video
                  src={post.video_url}
                  controls
                  playsInline
                  className="w-full max-h-[480px] object-contain"
                />
              </div>
            )}

            {/* Attached media: Audio */}
            {post.audio_url && (
              <div className="mt-3 p-3 rounded-2xl border border-[#2f3336] bg-[#16181c]">
                <audio controls src={post.audio_url} className="w-full h-8" />
              </div>
            )}

            {/* Timestamp */}
            <div className="text-[13px] text-[#71767b] pt-2 flex items-center gap-1.5">
              <span>{timeAgo(post.created_at)}</span>
              <span>·</span>
              <span className="text-[#e7e9ea] font-medium">{views} Views</span>
            </div>

            {/* X-style metrics bar */}
            <div className="py-3 border-y border-[#2f3336] flex items-center gap-6 text-[14px] text-[#71767b]">
              <div>
                <strong className="text-white font-bold">{post.comments.length}</strong>{' '}
                <span className="text-[#71767b]">Replies</span>
              </div>
              <div>
                <strong className="text-white font-bold">{post.likes_count}</strong>{' '}
                <span className="text-[#71767b]">Likes</span>
              </div>
              <div>
                <strong className="text-white font-bold">{views}</strong>{' '}
                <span className="text-[#71767b]">Views</span>
              </div>
            </div>

            {/* X-style action icons bar */}
            <div className="flex items-center justify-around py-1.5 text-[#71767b] border-b border-[#2f3336]">
              <button
                onClick={() => inputRef.current?.focus()}
                className="p-2 hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 rounded-full transition-colors"
                title="Reply"
              >
                <MessageCircle size={20} />
              </button>

              <button
                onClick={() => onVote(post.id)}
                className={`p-2 rounded-full transition-colors ${
                  hasLiked 
                    ? 'text-[#f91880]' 
                    : 'hover:text-[#f91880] hover:bg-[#f91880]/10'
                }`}
                title="Like"
              >
                <Heart 
                  size={20} 
                  fill={hasLiked ? "currentColor" : "none"} 
                  strokeWidth={hasLiked ? 0 : 2}
                  className={hasLiked ? "scale-110 transition-transform" : ""}
                />
              </button>

              <button
                onClick={() => onShare(post)}
                className="p-2 hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 rounded-full transition-colors"
                title="Share"
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>


          {/* Discussion / Replies list (Twitter Thread Style) */}
          <div className="space-y-4 pt-1 pb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#71767b]">
              Replies & Discussion ({post.comments.length})
            </h3>

            {post.comments.length === 0 ? (
              <div className="text-center py-8 space-y-1">
                <p className="text-sm font-semibold text-[#888]">No replies yet</p>
                <p className="text-xs text-[#555]">Be the first to speak your mind anonymously!</p>
              </div>
            ) : (
              post.comments.map((comment, index) => {
                const commentUser = getGeneratedUser(comment.id, 'reply');

                return (
                  <div key={comment.id} className="flex gap-3 relative group">
                    {/* Connecting thread line */}
                    {index !== post.comments.length - 1 && (
                      <div className="absolute left-[17px] top-10 bottom-[-16px] w-[2px] bg-white/10" />
                    )}

                    {/* Commenter avatar */}
                    <div 
                      style={{ backgroundColor: commentUser.avatarBg, color: commentUser.avatarText }}
                      className="w-9 h-9 rounded-full border border-white/10 flex-shrink-0 flex items-center justify-center text-xs font-bold z-10"
                    >
                      {commentUser.initials}
                    </div>

                    {/* Comment content */}
                    <div className="flex-1 bg-[#16181c] border border-[#2f3336] rounded-2xl p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white hover:underline cursor-pointer">
                            {commentUser.username}
                          </span>
                          <span className="text-[11px] text-[#71767b]">
                            {commentUser.handle} · {timeAgo(comment.created_at)}
                          </span>
                        </div>
                        <button
                          onClick={() => onReport(comment.id.toString(), true)}
                          className="text-[11px] text-[#555] hover:text-[#ff2d55] opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Report reply"
                        >
                          Report
                        </button>
                      </div>

                      <p className="text-sm text-[#e7e9ea] leading-relaxed break-words whitespace-pre-wrap font-sans">
                        {formatTweetContent(comment.content)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>


        {/* Sticky Reply Input Bar at Bottom (X / Twitter style) */}
        <div className="sticky bottom-0 z-20 bg-black sm:bg-[#121214] border-t border-[#2f3336] px-3 py-2.5 sm:px-4 sm:py-3 shrink-0 pb-[max(12px,env(safe-area-inset-bottom))]">
          <form onSubmit={handleSubmitReply} className="flex items-center gap-2 sm:gap-3 w-full">
            <div className="hidden xs:flex w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#202327] border border-white/10 items-center justify-center text-xs text-[#aaa] shrink-0">
              💬
            </div>
            <div className="flex-1 min-w-0 relative">
              <input
                ref={inputRef}
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Post your reply anonymously..."
                maxLength={300}
                className="w-full bg-[#16181c] border border-[#2f3336] rounded-full px-3.5 py-2 sm:px-4 sm:py-2.5 text-[16px] sm:text-sm text-white placeholder-[#71767b] focus:outline-none focus:border-[#1d9bf0] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={!replyText.trim() || isSubmitting}
              className="bg-[#1d9bf0] hover:bg-[#1a8cd8] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm px-3.5 py-2 sm:px-4.5 sm:py-2.5 rounded-full transition-all active:scale-95 shrink-0 whitespace-nowrap flex items-center gap-1.5 shadow-md shadow-[#1d9bf0]/20"
            >
              {isSubmitting ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={13} />
                  <span>Reply</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostDiscussionModal;
