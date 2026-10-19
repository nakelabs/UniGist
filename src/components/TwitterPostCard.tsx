import React, { useState } from 'react';
import { ConfessionWithComments } from '@/hooks/useConfessions';
import { getGeneratedUser, getPostViews, formatTwitterNumber } from '@/lib/usernameGenerator';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { 
  Heart, 
  MessageCircle, 
  BarChart2, 
  Share, 
  MoreHorizontal, 
  Volume2 
} from 'lucide-react';

import { toast } from 'sonner';
import { timeAgo as formatTimeAgo, expiresIn as formatExpiresIn } from '@/lib/dateUtils';

/**
 * Format text to highlight @mentions and #hashtags in Twitter blue (#1d9bf0)
 */
export function formatTweetContent(text: string) {
  if (!text) return null;

  // Split by whitespace and punctuation while keeping tokens intact
  const tokens = text.split(/(\s+|[@#][\w\d_]+)/g);

  return tokens.map((token, index) => {
    if (token.startsWith('@') && token.length > 1) {
      return (
        <span 
          key={index} 
          onClick={(e) => { e.stopPropagation(); }} 
          className="text-[#1d9bf0] hover:underline cursor-pointer"
        >
          {token}
        </span>
      );
    }
    if (token.startsWith('#') && token.length > 1) {
      return (
        <span 
          key={index} 
          onClick={(e) => { e.stopPropagation(); }} 
          className="text-[#1d9bf0] hover:underline cursor-pointer"
        >
          {token}
        </span>
      );
    }
    return token;
  });
}

interface TwitterPostCardProps {
  post: ConfessionWithComments;
  hasLiked: boolean;
  onLike: (id: number) => Promise<void>;
  onOpenDiscussion: (post: ConfessionWithComments) => void;
  onShare: (post: ConfessionWithComments) => void;
  onReport: (id: string) => void;
  timeAgo?: (dateStr: string) => string;
  expiresIn?: (dateStr: string) => string;
}

export const TwitterPostCard: React.FC<TwitterPostCardProps> = ({
  post,
  hasLiked,
  onLike,
  onOpenDiscussion,
  onShare,
  onReport,
  timeAgo = formatTimeAgo,
  expiresIn = formatExpiresIn,
}) => {
  const [avatarError, setAvatarError] = useState(false);

  const user = getGeneratedUser(post.id);
  const views = getPostViews(post.id, post.likes_count, post.comments?.length || 0);

  return (
    <article
      id={`post-${post.id}`}
      onClick={() => onOpenDiscussion(post)}
      className="px-4 py-3 sm:px-4 sm:py-3.5 flex gap-3 cursor-pointer hover:bg-white/[0.03] transition-colors border-b border-[#2f3336] select-text"
    >
      {/* ── Left Column: Avatar ── */}
      <div className="shrink-0 mt-0.5">
        <div 
          style={{ backgroundColor: user.avatarBg, color: user.avatarText }}
          className="w-10 h-10 rounded-full border border-white/10 overflow-hidden flex items-center justify-center text-sm font-bold select-none"
        >
          {!avatarError ? (
            <img 
              src={user.avatarUrl} 
              alt={user.username}
              className="w-full h-full object-cover"
              onError={() => setAvatarError(true)}
              loading="lazy"
            />
          ) : (
            <span>{user.initials}</span>
          )}
        </div>
      </div>

      {/* ── Right Column: All Post Content ── */}
      <div className="flex-1 min-w-0">
        {/* Header row: Name, @handle, ·, time, and More options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span 
              onClick={(e) => { e.stopPropagation(); onOpenDiscussion(post); }}
              className="font-bold text-[15px] text-[#f7f9f9] hover:underline cursor-pointer truncate max-w-[170px] sm:max-w-[220px]"
            >
              {user.username}
            </span>

            <span className="text-[#71767b] text-[15px] font-normal truncate max-w-[120px] sm:max-w-[150px]">
              {user.handle}
            </span>

            <span className="text-[#71767b] text-[15px]">·</span>

            <span className="text-[#71767b] text-[15px] hover:underline shrink-0 font-normal">
              {timeAgo(post.created_at)}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onReport(post.id.toString());
            }}
            className="w-8 h-8 -mr-1.5 rounded-full flex items-center justify-center text-[#71767b] hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition-colors ml-auto shrink-0"
            title="More"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* Post Text with Mentions & Hashtags */}
        {post.text_content && (
          <p className="mt-1 text-[15px] text-[#e7e9ea] leading-[20px] whitespace-pre-wrap break-words font-sans font-normal">
            {formatTweetContent(post.text_content)}
          </p>
        )}

        {/* Extra Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span 
                key={t} 
                onClick={(e) => e.stopPropagation()}
                className="text-[#1d9bf0] text-[14px] hover:underline font-normal cursor-pointer"
              >
                #{t.replace(/^#/, '')}
              </span>
            ))}
          </div>
        )}

        {/* Attached Media: Image */}
        {post.image_url && (
          <div className="mt-3 rounded-2xl overflow-hidden border border-[#2f3336] bg-black max-h-[510px] relative">
            <img
              src={post.image_url}
              alt="Attached media"
              className="w-full max-h-[510px] object-cover hover:opacity-95 transition-opacity"
              loading="lazy"
            />
          </div>
        )}

        {/* Attached Media: Video */}
        {post.video_url && (
          <div className="mt-3 rounded-2xl overflow-hidden border border-[#2f3336] bg-black relative">
            <video 
              controls 
              playsInline 
              src={post.video_url} 
              className="w-full max-h-[510px] object-cover" 
            />
          </div>
        )}

        {/* Attached Media: Audio */}
        {post.audio_url && (
          <div 
            className="mt-3 p-3 rounded-2xl border border-[#2f3336] bg-[#16181c] flex items-center gap-3" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-9 h-9 rounded-full bg-[#1d9bf0]/15 flex items-center justify-center text-[#1d9bf0] shrink-0">
              <Volume2 size={18} />
            </div>
            <audio controls src={post.audio_url} className="w-full h-8" />
          </div>
        )}

        {/* ── Action Bar (Reply, Like, Views, Bookmark, Share) ── */}
        <div className="mt-3 flex items-center justify-between text-[#71767b] max-w-[420px] text-[13px] select-none -ml-2">
          {/* Reply */}
          <div 
            className="flex items-center gap-1.5 hover:text-[#1d9bf0] transition-colors group/action cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDiscussion(post);
            }}
            title="Reply"
          >
            <div className="p-2 rounded-full group-hover/action:bg-[#1d9bf0]/10 transition-colors">
              <MessageCircle size={18} />
            </div>
            <span className="text-[13px] leading-none min-w-[12px]">
              {post.comments?.length > 0 ? post.comments.length : ''}
            </span>
          </div>

          {/* Like */}
          <div 
            className={`flex items-center gap-1.5 transition-colors group/action cursor-pointer ${
              hasLiked ? 'text-[#f91880]' : 'hover:text-[#f91880]'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onLike(post.id);
            }}
            title="Like"
          >
            <div className="p-2 rounded-full group-hover/action:bg-[#f91880]/10 transition-colors">
              <Heart 
                size={18} 
                fill={hasLiked ? "currentColor" : "none"} 
                strokeWidth={hasLiked ? 0 : 2}
                className={hasLiked ? "scale-110 transition-transform" : ""}
              />
            </div>
            <span className="text-[13px] leading-none min-w-[12px]">
              {post.likes_count > 0 ? formatTwitterNumber(post.likes_count) : ''}
            </span>
          </div>

          {/* Views / Impressions */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className="flex items-center gap-1.5 hover:text-[#1d9bf0] transition-colors group/action cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDiscussion(post);
                }}
              >
                <div className="p-2 rounded-full group-hover/action:bg-[#1d9bf0]/10 transition-colors">
                  <BarChart2 size={18} />
                </div>
                <span className="text-[13px] leading-none font-normal">
                  {views}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-[#1c1c1f] text-[#eee] border-white/10 text-xs">
              {views} views · Vanishes in {expiresIn(post.created_at)}
            </TooltipContent>
          </Tooltip>

          {/* Share */}
          <div 
            className="p-2 rounded-full hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onShare(post);
            }}
            title="Share"
          >
            <Share size={18} />
          </div>
        </div>
      </div>
    </article>
  );
};

export default TwitterPostCard;
