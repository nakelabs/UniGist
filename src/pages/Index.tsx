import { useState, useRef, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import ConfessionForm from '@/components/ConfessionForm';
import PageFooter from '@/components/PageFooter';
import EmojiReactions from '@/components/EmojiReactions';
import ReportModal from '@/components/ReportModal';
import { useConfessions } from '@/hooks/useConfessions';
import { useVotes } from '@/hooks/useVotes';
import { useReports } from '@/hooks/useReports';

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
  postId: string;
  comments: { id: string; content: string; created_at: string; upvotes: number; downvotes: number }[];
  onAddComment: (postId: string, content: string) => Promise<void>;
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
              <span className="text-xs text-[#555]">{c.upvotes} likes</span>
              <button
                onClick={() => onReport(c.id, true)}
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

function SelfDestructImage({ src, alt, context }: { src: string; alt: string; context?: string }) {
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  const [destroyed, setDestroyed] = useState(false);

  useEffect(() => {
    if (revealed && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (revealed && timeLeft === 0) {
      setDestroyed(true);
      setRevealed(false);
    }
  }, [revealed, timeLeft]);

  if (destroyed) {
    return (
      <div className="w-full h-48 bg-[#1a1a1a] border border-[#333] rounded-xl flex flex-col items-center justify-center text-[#555]">
        <span className="text-3xl mb-2 opacity-40">&#x2715;</span>
        <span className="text-sm font-medium">Image self-destructed</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {context && <p className="text-xs text-[#777] mb-2 italic">{context}</p>}
      <div className="relative group rounded-xl overflow-hidden">
        <img
          src={src}
          alt={alt}
          className={`w-full max-h-80 object-cover transition-all duration-300 ${!revealed ? 'blur-2xl scale-110' : ''}`}
        />
        {!revealed ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white">
            <button
              onClick={() => setRevealed(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full font-medium transition-colors text-sm"
            >
              Tap to reveal (5s)
            </button>
          </div>
        ) : (
          <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-xs font-bold font-mono">
            00:0{timeLeft}
          </div>
        )}
      </div>
    </div>
  );
}

function PollCard({ 
  poll, 
  onVote, 
  hasVotedId 
}: { 
  poll: { question: string; options: { id: string; text: string; votes: number }[] }; 
  onVote: (optionId: string) => void;
  hasVotedId?: string;
}) {
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);

  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 my-2">
      <p className="font-medium text-[#e0e0e0] mb-3">{poll.question}</p>
      <div className="space-y-2">
        {poll.options.map(opt => {
          const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          const isWinner = hasVotedId && opt.votes === Math.max(...poll.options.map(o => o.votes));
          const isSelected = hasVotedId === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => !hasVotedId && onVote(opt.id)}
              disabled={!!hasVotedId}
              className={`relative w-full text-left p-3 rounded-lg border transition-all duration-300 overflow-hidden ${
                hasVotedId 
                  ? 'border-transparent bg-[#1e1e1e] cursor-default' 
                  : 'border-[#333] hover:border-[#555] hover:bg-[#1a1a1a]'
              }`}
            >
              {hasVotedId && (
                <div 
                  className={`absolute inset-0 opacity-20 ${isWinner ? 'bg-[#ff2d55]' : 'bg-white'}`}
                  style={{ width: `${percentage}%`, transition: 'width 1s ease-out' }}
                />
              )}
              <div className="relative flex justify-between items-center z-10">
                <span className={`text-sm ${isSelected ? 'font-bold text-white' : 'text-[#ccc]'}`}>
                  {opt.text} {isSelected && '✓'}
                </span>
                {hasVotedId && (
                  <span className={`text-xs font-medium ${isWinner ? 'text-[#ff2d55]' : 'text-[#777]'}`}>
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-right text-[10px] text-[#555] mt-2 uppercase tracking-wider">
        {totalVotes} votes
      </p>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'top' | 'controversial'>('newest');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [isReportingComment, setIsReportingComment] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const { confessions, loading, createConfession, addComment, updateVoteCount, votePoll, refetch } = useConfessions();
  const { userVotes, vote } = useVotes();
  const { createReport } = useReports();

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSubmit = async (data: {
    content: string; audioUrl?: string; videoUrl?: string;
    videoContext?: string; imageUrl?: string; imageContext?: string; 
    imageSelfDestruct?: boolean; tags?: string[]; buildingFlair?: string;
    poll?: { question: string; options: string[] };
  }) => {
    try { await createConfession(data); } catch { /* toast handled inside hook */ }
  };

  const handleVote = async (id: string, type: 'up' | 'down', isComment = false) => {
    const targetType = isComment ? 'comment' : 'confession';
    if (!isComment) {
      const cur = userVotes.confessions[id];
      const success = await vote(id, type, targetType);
      if (success) updateVoteCount(id, type, type === 'up' ? !!cur?.upvoted : !!cur?.downvoted, type === 'up' ? !!cur?.downvoted : !!cur?.upvoted);
      return success;
    }
    return vote(id, type, targetType);
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

  const toggleComments = (id: string) => {
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
      return c.content.toLowerCase().includes(q) || c.tags?.some((t) => t.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'top') return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      return Math.min(b.upvotes, b.downvotes) - Math.min(a.upvotes, a.downvotes);
    });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#111111]">
      <PageHeader />

      <main className="max-w-[680px] mx-auto px-4 py-4 space-y-3">

        {/* ── Compose box ── */}
        <ConfessionForm onSubmit={handleSubmit} />

        {/* ── Filter bar ── */}
        <div className="flex items-center gap-2 py-1">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] text-xs select-none">&#9906;</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search posts..."
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-8 pr-8 py-2 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#333] transition-colors"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white text-base leading-none font-bold">
                ×
              </button>
            )}
          </div>

          {/* Sort tabs */}
          <div className="flex items-center gap-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-1">
            {(['newest', 'top', 'controversial'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`sort-tab text-xs capitalize px-3 py-1 ${sortBy === s ? 'active' : ''}`}
              >
                {s === 'newest' ? '🕐' : s === 'top' ? '🔥' : '💥'}
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
            <div className="text-4xl mb-3">👻</div>
            <p className="text-[#555] font-medium">
              {searchTerm ? `No posts matching "${searchTerm}"` : 'Nothing here yet — be the first!'}
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
              const votes = userVotes.confessions[post.id];
              const commentsOpen = expandedComments.has(post.id);

              return (
                <article key={post.id} className="post-card animate-fade-up">
                  {/* ── Post header ── */}
                  <div className="flex items-center justify-between px-4 pt-3 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff2d55] to-[#7c3aed] flex items-center justify-center text-sm flex-shrink-0">
                        👤
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-semibold text-[#ccc]">
                            anon #{post.id.slice(-6)}
                          </p>
                          {post.building_flair && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/10 text-white flex items-center gap-1">
                              {post.building_flair}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#555] flex items-center gap-1">
                          {timeAgo(post.created_at)}
                          <span className="text-[#333]">·</span>
                          <span className="text-[#ff2d55]/70">{expiresIn(post.created_at)}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleReport(post.id)}
                      className="action-btn p-1.5 text-xs font-medium text-[#444] hover:text-[#ff2d55]"
                      title="Report"
                    >
                      Report
                    </button>
                  </div>

                  {/* ── Content ── */}
                  {post.content && (
                    <div className="px-4 pb-3">
                      <p className="text-[15px] text-[#e8e8e8] leading-relaxed whitespace-pre-wrap break-words">
                        {post.content}
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
                      {post.image_self_destruct ? (
                         <SelfDestructImage src={post.image_url} alt="Confession" context={post.image_context} />
                      ) : (
                        <>
                          {post.image_context && (
                            <p className="text-xs text-[#777] mb-2 italic">{post.image_context}</p>
                          )}
                          <img
                            src={post.image_url}
                            alt="Post"
                            className="w-full rounded-xl object-cover max-h-80"
                          />
                        </>
                      )}
                    </div>
                  )}

                  {/* ── Poll ── */}
                  {post.poll && (
                    <div className="px-4 pb-2">
                      <PollCard 
                        poll={post.poll} 
                        onVote={(optId) => votePoll(post.id, optId)}
                        hasVotedId={JSON.parse(localStorage.getItem('votedPolls') || '{}')[post.id]}
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
                      {post.video_context && (
                        <p className="text-xs text-[#777] mb-2 italic">{post.video_context}</p>
                      )}
                      <video controls src={post.video_url} className="w-full rounded-xl" />
                    </div>
                  )}

                  {/* ── Emoji reactions ── */}
                  <div className="px-4 pb-2">
                    <EmojiReactions targetId={post.id} targetType="confession" />
                  </div>

                  {/* ── Actions ── */}
                  <div className="divider" />
                  <div className="px-4 py-2 flex items-center gap-1">
                    {/* Upvote */}
                    <button
                      onClick={() => handleVote(post.id, 'up')}
                      className={`action-btn text-xs font-semibold ${votes?.upvoted ? 'active text-[#ff2d55]' : ''}`}
                    >
                      <span className="text-base leading-none">↑</span>
                      <span className="text-xs">{post.upvotes}</span>
                    </button>

                    {/* Downvote */}
                    <button
                      onClick={() => handleVote(post.id, 'down')}
                      className={`action-btn text-xs font-semibold ${votes?.downvoted ? 'active text-[#7c3aed]' : ''}`}
                    >
                      <span className="text-base leading-none">↓</span>
                      <span className="text-xs">{post.downvotes}</span>
                    </button>

                    {/* Comments */}
                    <button
                      onClick={() => toggleComments(post.id)}
                      className={`action-btn text-xs font-semibold ${commentsOpen ? 'text-white' : ''}`}
                    >
                      <span className="text-sm leading-none">&#x1F4AC;</span>
                      <span className="text-xs">{post.comments.length}</span>
                    </button>

                    {/* Report */}
                    <button
                      onClick={() => handleReport(post.id)}
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
