import { useState, useRef, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import ConfessionForm from '@/components/ConfessionForm';
import PageFooter from '@/components/PageFooter';
import ReportModal from '@/components/ReportModal';
import ShareModal from '@/components/ShareModal';
import PostDiscussionModal from '@/components/PostDiscussionModal';
import TwitterPostCard from '@/components/TwitterPostCard';
import { useConfessions, ConfessionWithComments } from '@/hooks/useConfessions';
import { useVotes } from '@/hooks/useVotes';
import { useReports } from '@/hooks/useReports';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Heart, Share, Share2, HelpCircle, MessageCircle, Clock, MoreHorizontal, Repeat2, BarChart2 } from 'lucide-react';
import { getGeneratedUser } from '@/lib/usernameGenerator';
import { timeAgo, expiresIn } from '@/lib/dateUtils';


// ── Sub-components ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="post-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="skeleton w-8 h-8 rounded-full" />
        <div className="skeleton w-32 h-3 rounded" />
      </div>
      <div className="skeleton w-full h-4 rounded" />
      <div className="skeleton w-3/4 h-4 rounded" />
      <div className="skeleton w-1/2 h-3 rounded" />
    </div>
  );
}

interface CommentSectionProps {
  postId: number;
  comments: { id: number; content: string; created_at: string }[];
  onAddComment: (postId: number, content: string) => Promise<void>;
  onReport: (id: string, isComment: boolean) => void;
}

function CommentSection({ postId, comments, onAddComment, onReport }: CommentSectionProps) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const submit = async () => {
    const text = value.trim();
    if (!text) return;
    setBusy(true);
    try {
      await onAddComment(postId, text);
      setValue('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t border-[#2a2a2a] bg-[#141414] px-4 pt-3 pb-4 space-y-3 animate-fade-in">
      {/* Comments list */}
      {comments.map((c) => (
        <div key={c.id} className="flex gap-3 group">
          <div className="w-7 h-7 rounded-full bg-[#252525] flex-shrink-0 flex items-center justify-center text-xs text-[#555] font-bold">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] text-[#e0e0e0] leading-relaxed break-words">{c.content}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-[#555]">{timeAgo(c.created_at)}</span>
              <button
                onClick={() => onReport(c.id.toString(), true)}
                className="text-xs text-[#444] hover:text-[#ff2d55] transition-colors opacity-0 group-hover:opacity-100"
              >
                Report
              </button>
            </div>
          </div>
        </div>
      ))}

      {comments.length === 0 && (
        <p className="text-xs text-[#444] text-center py-2">No replies yet — be the first</p>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 pt-1 border-t border-[#222]">
        <div className="w-7 h-7 rounded-full bg-[#252525] flex-shrink-0 flex items-center justify-center text-xs text-[#555] font-bold">
          G
        </div>
        <input
          ref={textareaRef as any}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }}}
          placeholder="Add a reply..."
          className="flex-1 bg-transparent text-[14px] text-white placeholder-[#444] focus:outline-none"
          maxLength={280}
        />
        <button
          onClick={submit}
          disabled={!value.trim() || busy}
          className="text-[#ff2d55] disabled:text-[#444] transition-colors text-xs font-semibold tracking-wide"
        >
          Reply
        </button>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompose, setShowCompose] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'top'>('newest');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [isReportingComment, setIsReportingComment] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharingPost, setSharingPost] = useState<ConfessionWithComments | null>(null);
  const [discussionPost, setDiscussionPost] = useState<ConfessionWithComments | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());

  const { confessions, loading, createConfession, addComment, updateVoteCount, refetch } = useConfessions();
  const { likedConfessions, toggleLike, checkHasLiked } = useVotes();
  const { createReport } = useReports();

  // Load like status for visible confessions
  useEffect(() => {
    confessions.forEach(confession => {
      if (likedConfessions[confession.id] === undefined) {
        checkHasLiked(confession.id);
      }
    });
  }, [confessions]);

  // Keep active discussion post in sync with refreshed confessions data
  useEffect(() => {
    if (discussionPost) {
      const fresh = confessions.find((c) => c.id === discussionPost.id);
      if (fresh) setDiscussionPost(fresh);
    }
  }, [confessions]);

  // Deep-link auto-open or scroll when opened via shared post link
  useEffect(() => {
    if (!loading && confessions.length > 0) {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get('post') || (hash.startsWith('#post-') ? hash.replace('#post-', '') : null);
      if (targetId) {
        const matchingPost = confessions.find((c) => c.id.toString() === targetId);
        if (matchingPost) {
          setDiscussionPost(matchingPost);
        }
        setTimeout(() => {
          const el = document.getElementById(`post-${targetId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-[#1d9bf0]', 'ring-offset-2', 'ring-offset-[#111]');
            setTimeout(() => {
              el.classList.remove('ring-2', 'ring-[#1d9bf0]', 'ring-offset-2', 'ring-offset-[#111]');
            }, 3000);
          }
        }, 350);
      }
    }
  }, [loading, confessions.length]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSubmit = async (data: {
    content: string; 
    imageFile?: File;
    videoFile?: File;
    audioFile?: File;
    tags?: string[]; 
  }) => {
    try { await createConfession(data); } catch { /* toast handled inside hook */ }
  };

  const handleToggleLike = async (id: number) => {
    const newCount = await toggleLike(id);
    if (newCount !== null) {
      updateVoteCount(id, newCount);
    }
  };

  const handleReport = (id: string, isComment = false) => {
    setReportingId(id);
    setIsReportingComment(isComment);
    setReportModalOpen(true);
  };

  const handleReportSubmit = async (reason: string, customReason?: string) => {
    if (!reportingId) return;
    try {
      await createReport(isReportingComment ? 'comment' : 'confession', reportingId, reason, customReason);
    } finally {
      setReportModalOpen(false);
      setReportingId(null);
    }
  };

  const toggleComments = (id: number) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleShare = (post: ConfessionWithComments) => {
    setSharingPost(post);
    setShareModalOpen(true);
  };

  // ── Filter + sort ──────────────────────────────────────────────────────────

  const feed = [...confessions]
    .filter((c) => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (c.text_content && c.text_content.toLowerCase().includes(q)) || c.tags?.some((t) => t.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return b.likes_count - a.likes_count;
    });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black text-[#e7e9ea]">
      <PageHeader />

      <main className="max-w-[600px] mx-auto min-h-screen border-x border-[#2f3336] bg-black">

        {/* ── Compose box ── */}
        <div className="border-b border-[#2f3336] p-4">
          {showCompose ? (
            <div className="relative animate-fade-in">
              <button 
                onClick={() => setShowCompose(false)} 
                className="absolute -right-1 -top-1 w-7 h-7 flex items-center justify-center text-[#555] hover:text-[#ff2d55] bg-[#111] hover:bg-[#222] rounded-full text-base z-10 transition-colors"
                title="Hide form"
              >
                ×
              </button>
              <ConfessionForm onSubmit={handleSubmit} />
            </div>
          ) : (
            <button 
              onClick={() => setShowCompose(true)}
              className="w-full bg-[#16181c] border border-white/5 rounded-full px-5 py-3 text-left text-[#555] hover:border-white/20 transition-all flex items-center justify-between group"
            >
              <span>Share something anonymously...</span>
              <span className="text-[#1d9bf0] opacity-0 group-hover:opacity-100 transition-opacity font-semibold text-xs">Yarn it</span>
            </button>
          )}
        </div>

        {/* Quick guide for new users */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#2f3336] text-xs text-[#71767b] bg-[#16181c]/30">
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="flex items-center gap-1.5 hover:text-[#1d9bf0] transition-colors py-0.5">
                <HelpCircle size={13} className="text-[#1d9bf0]" />
                <span>How Yarnz works</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-[#1c1c1f] text-[#ccc] border-white/10 text-xs max-w-xs p-3 space-y-1.5 shadow-2xl z-50">
              <p className="font-semibold text-white">How Yarnz Works</p>
              <ul className="space-y-1 text-[11px] list-disc list-inside text-[#aaa]">
                <li><strong className="text-white">100% Anonymous:</strong> No signups, tracking, or names attached.</li>
                <li><strong className="text-white">24h Vanish:</strong> Every confession & reply self-destructs after 24 hours.</li>
                <li><strong className="text-white">Media:</strong> Yarn via text, photos, video clips, or audio notes.</li>
                <li><strong className="text-white">Share:</strong> Send yarns directly into WhatsApp & Telegram groups.</li>
              </ul>
            </TooltipContent>
          </Tooltip>

          <span className="text-[11px] text-[#71767b]">All yarns vanish in 24h</span>
        </div>

        {/* ── Filter bar ── */}
        <div className="px-4 py-2.5 border-b border-[#2f3336] flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search yarns..."
              className="w-full bg-[#16181c] border border-transparent rounded-full pl-4 pr-8 py-2 text-sm text-white placeholder-[#71767b] focus:outline-none focus:border-[#1d9bf0] transition-colors"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71767b] hover:text-white text-base leading-none font-bold">
                ×
              </button>
            )}
          </div>

          {/* Sort tabs */}
          <div className="flex items-center gap-0.5 bg-[#16181c] border border-white/5 rounded-full p-1">
            {(['newest', 'top'] as const).map((s) => (
              <Tooltip key={s}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSortBy(s)}
                    className={`sort-tab text-xs capitalize px-3 py-1 ${sortBy === s ? 'active' : ''}`}
                  >
                    {s === 'newest' ? 'New' : 'Top'}
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-[#1c1c1f] text-[#eee] border-white/10 text-xs">
                  {s === 'newest' ? 'Most recent confessions' : 'Highest-voted confessions'}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Refresh */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => refetch()} className="w-8 h-8 rounded-full flex items-center justify-center text-[#71767b] hover:text-white hover:bg-white/10 transition-colors">
                ↺
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-[#1c1c1f] text-[#eee] border-white/10 text-xs">
              Check for new yarns
            </TooltipContent>
          </Tooltip>
        </div>

        {/* ── Feed ── */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : feed.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[#555] font-medium">
              {searchTerm ? `No posts matching "${searchTerm}"` : "What's the yarn?"}
            </p>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="mt-4 btn-ghost text-xs">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#2f3336]">
            {feed.map((post) => (
              <TwitterPostCard
                key={post.id}
                post={post}
                hasLiked={likedConfessions[post.id] || false}
                onLike={handleToggleLike}
                onOpenDiscussion={setDiscussionPost}
                onShare={handleShare}
                onReport={(id) => handleReport(id, false)}
                timeAgo={timeAgo}
                expiresIn={expiresIn}
              />
            ))}


            {/* Bottom count */}
            {feed.length > 0 && (
              <p className="text-center text-xs text-[#333] py-4">
                {feed.length} post{feed.length !== 1 ? 's' : ''} · all posts expire in 24h
              </p>
            )}
          </div>
        )}

        <PageFooter />
      </main>

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSubmit={handleReportSubmit}
        postId={reportingId || ''}
        isComment={isReportingComment}
      />

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        post={sharingPost}
      />

      <PostDiscussionModal
        isOpen={!!discussionPost}
        onClose={() => setDiscussionPost(null)}
        post={discussionPost}
        onVote={handleToggleLike}
        hasLiked={discussionPost ? (likedConfessions[discussionPost.id] || false) : false}
        onAddComment={addComment}
        onReport={handleReport}
        onShare={handleShare}
        timeAgo={timeAgo}
        expiresIn={expiresIn}
      />
    </div>
  );
};

export default Index;
