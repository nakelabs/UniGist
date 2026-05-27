import { useState, useRef, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import ConfessionForm from '@/components/ConfessionForm';
import PageFooter from '@/components/PageFooter';
import ReportModal from '@/components/ReportModal';
import { useConfessions } from '@/hooks/useConfessions';
import { useVotes } from '@/hooks/useVotes';
import { useReports } from '@/hooks/useReports';
import { Heart } from 'lucide-react';

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

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSubmit = async (data: {
    content: string; 
    imageFile?: File;
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
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`sort-tab text-xs capitalize px-3 py-1 ${sortBy === s ? 'active' : ''}`}
              >
                {s === 'newest' ? 'New' : 'Top'}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button onClick={refetch} className="action-btn p-2 text-xs font-semibold tracking-wide" title="Refresh">
            ↺
          </button>
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
                <article key={post.id} className="post-card animate-fade-up">
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
                          <span className="text-[#ff2d55]/70">{expiresIn(post.created_at)}</span>
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
                    <div className="px-4 pb-3">
                      <img
                        src={post.image_url}
                        alt="Post"
                        className="w-full rounded-xl object-cover max-h-80"
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
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`action-btn text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${hasLiked ? 'active text-[#ff2d55] bg-[#ff2d55]/10' : 'text-[#888] hover:text-white hover:bg-white/5'}`}
                    >
                      <Heart size={16} fill={hasLiked ? "currentColor" : "none"} strokeWidth={hasLiked ? 0 : 2} className={hasLiked ? "scale-110 transition-transform" : ""} />
                      <span className="text-sm">{post.likes_count}</span>
                    </button>

                    {/* Comments */}
                    <button
                      onClick={() => toggleComments(post.id)}
                      className={`action-btn text-xs font-semibold ${commentsOpen ? 'text-white' : ''}`}
                    >
                      <span className="text-xs">{post.comments.length} replies</span>
                    </button>

                    {/* Report */}
                    <button
                      onClick={() => handleReport(post.id.toString())}
                      className="action-btn ml-auto text-xs font-medium text-[#444] hover:text-[#ff2d55]"
                      title="Report"
                    >
                      Report
                    </button>
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
    </div>
  );
};

export default Index;
