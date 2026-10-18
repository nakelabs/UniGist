import { useState, useRef, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import ConfessionForm from '@/components/ConfessionForm';
import PageFooter from '@/components/PageFooter';
import ReportModal from '@/components/ReportModal';
import ShareModal from '@/components/ShareModal';
import { useConfessions, ConfessionWithComments } from '@/hooks/useConfessions';
import { useVotes } from '@/hooks/useVotes';
import { useReports } from '@/hooks/useReports';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Heart, Share2, HelpCircle } from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function expiresIn(dateStr: string): string {
  const hrs = Math.max(0, 24 - Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000));
  return hrs === 0 ? 'expiring soon' : `${hrs}h left`;
}

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

  // Deep-link auto-scroll when opened via shared post link
  useEffect(() => {
    if (!loading && confessions.length > 0) {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get('post') || (hash.startsWith('#post-') ? hash.replace('#post-', '') : null);
      if (targetId) {
        setTimeout(() => {
          const el = document.getElementById(`post-${targetId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-[#ff2d55]', 'ring-offset-2', 'ring-offset-[#111]');
            setTimeout(() => {
              el.classList.remove('ring-2', 'ring-[#ff2d55]', 'ring-offset-2', 'ring-offset-[#111]');
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
    <div className="min-h-screen bg-[#111111]">
      <PageHeader />

      <main className="max-w-[680px] mx-auto px-4 py-4 space-y-3">

        {/* ── Compose box ── */}
        {showCompose ? (
          <div className="relative animate-fade-in">
            <button 
              onClick={() => setShowCompose(false)} 
              className="absolute -right-2 -top-2 w-8 h-8 flex items-center justify-center text-[#555] hover:text-[#ff2d55] bg-[#111] hover:bg-[#222] rounded-full text-xl z-10 transition-colors"
              title="Hide form"
            >
              ×
            </button>
            <ConfessionForm onSubmit={handleSubmit} />
          </div>
        ) : (
          <button 
            onClick={() => setShowCompose(true)}
            className="w-full bg-[#1e1e1e]/40 backdrop-blur-md border border-white/5 rounded-[16px] px-5 py-4 text-left text-[#555] hover:border-white/20 transition-all duration-300 flex items-center justify-between group mb-4"
          >
            <span>Share something anonymously...</span>
            <span className="text-[#ff2d55] opacity-0 group-hover:opacity-100 transition-opacity font-semibold">Yarn it</span>
          </button>
        )}

        {/* Quick guide for new users */}
        <div className="flex items-center justify-between px-1 text-xs text-[#666]">
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="flex items-center gap-1.5 hover:text-[#ff2d55] transition-colors py-0.5">
                <HelpCircle size={13} className="text-[#ff2d55]" />
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

          <span className="text-[11px] text-[#555]">All yarns vanish in 24h</span>
        </div>

        {/* ── Filter bar ── */}
        <div className="flex items-center gap-2 py-1">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search yarns..."
              className="w-full bg-[#1e1e1e]/40 backdrop-blur-md border border-white/5 rounded-[16px] pl-4 pr-8 py-2 text-sm text-white placeholder-[#555] focus:outline-none focus:border-white/20 transition-all duration-300"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white text-base leading-none font-bold">
                ×
              </button>
            )}
          </div>

          {/* Sort tabs */}
          <div className="flex items-center gap-0.5 bg-[#1e1e1e]/40 backdrop-blur-md border border-white/5 rounded-[16px] p-1">
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
              <button onClick={() => refetch()} className="action-btn p-2 text-xs font-semibold tracking-wide">
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
          <div className="space-y-3">
            {feed.map((post) => {
              const hasLiked = likedConfessions[post.id] || false;
              const commentsOpen = expandedComments.has(post.id);

              return (
                <article key={post.id} id={`post-${post.id}`} className="post-card animate-fade-up">
                  {/* ── Post header ── */}
                  <div className="flex items-center justify-between px-4 pt-3 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff2d55] to-[#7c3aed] flex-shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-semibold text-[#ccc]">
                            anon #{post.id.toString().slice(-6)}
                          </p>
                        </div>
                        <p className="text-[11px] text-[#555] flex items-center gap-1">
                          {timeAgo(post.created_at)}
                          <span className="text-[#333]">·</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-[#ff2d55]/70 cursor-help">{expiresIn(post.created_at)}</span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#1c1c1f] text-[#eee] border-white/10 text-xs">
                              Auto-deletes 24 hours after creation
                            </TooltipContent>
                          </Tooltip>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleReport(post.id.toString())}
                      className="action-btn p-1.5 text-xs font-medium text-[#444] hover:text-[#ff2d55]"
                      title="Report"
                    >
                      Report
                    </button>
                  </div>

                  {/* ── Content ── */}
                  {post.text_content && (
                    <div className="px-4 pb-3">
                      <p className="text-[15px] text-[#e8e8e8] leading-relaxed whitespace-pre-wrap break-words">
                        {post.text_content}
                      </p>
                    </div>
                  )}

                  {/* ── Tags ── */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                      {post.tags.map((t) => (
                        <span key={t} className="tag-pill">#{t}</span>
                      ))}
                    </div>
                  )}

                  {/* ── Image ── */}
                  {post.image_url && (
                    <div className="px-4 pb-3 flex justify-center bg-black/20 rounded-xl overflow-hidden mx-4">
                      <img
                        src={post.image_url}
                        alt="Post"
                        className="w-full object-contain max-h-[500px]"
                      />
                    </div>
                  )}

                  {/* ── Audio ── */}
                  {post.audio_url && (
                    <div className="px-4 pb-3">
                      <audio controls src={post.audio_url} className="w-full h-10" />
                    </div>
                  )}

                  {/* ── Video ── */}
                  {post.video_url && (
                    <div className="px-4 pb-3">
                      <video controls src={post.video_url} className="w-full rounded-xl" />
                    </div>
                  )}

                  {/* ── Actions ── */}
                  <div className="divider" />
                  <div className="px-4 py-2 flex items-center gap-1">
                    {/* Like */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleToggleLike(post.id)}
                          className={`action-btn text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${hasLiked ? 'active text-[#ff2d55] bg-[#ff2d55]/10' : 'text-[#888] hover:text-white hover:bg-white/5'}`}
                        >
                          <Heart size={16} fill={hasLiked ? "currentColor" : "none"} strokeWidth={hasLiked ? 0 : 2} className={hasLiked ? "scale-110 transition-transform" : ""} />
                          <span className="text-sm">{post.likes_count}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#1c1c1f] text-[#eee] border-white/10 text-xs">
                        {hasLiked ? 'Unlike confession' : 'Like anonymously'}
                      </TooltipContent>
                    </Tooltip>

                    {/* Comments */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => toggleComments(post.id)}
                          className={`action-btn text-xs font-semibold ${commentsOpen ? 'text-white' : ''}`}
                        >
                          <span className="text-xs">{post.comments.length} replies</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#1c1c1f] text-[#eee] border-white/10 text-xs">
                        {commentsOpen ? 'Hide replies' : 'Read or post anonymous replies'}
                      </TooltipContent>
                    </Tooltip>

                    {/* Share */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleShare(post)}
                          className="action-btn text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-[#888] hover:text-white hover:bg-white/5"
                        >
                          <Share2 size={15} />
                          <span className="text-xs">Share</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#1c1c1f] text-[#eee] border-white/10 text-xs">
                        Share to WhatsApp, Telegram, or copy link
                      </TooltipContent>
                    </Tooltip>

                    {/* Report */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleReport(post.id.toString())}
                          className="action-btn ml-auto text-xs font-medium text-[#444] hover:text-[#ff2d55]"
                        >
                          Report
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#1c1c1f] text-[#eee] border-white/10 text-xs">
                        Report inappropriate or harmful content
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* ── Comments ── */}
                  {commentsOpen && (
                    <CommentSection
                      postId={post.id}
                      comments={post.comments}
                      onAddComment={(postId, content) => addComment(postId, content).then(() => {})}
                      onReport={handleReport}
                    />
                  )}
                </article>
              );
            })}

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
    </div>
  );
};

export default Index;
