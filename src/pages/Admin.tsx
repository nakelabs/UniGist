import { useState, useEffect } from 'react';
import { api, AdminStats, Confession, Comment, PaginatedConfessionsResponse, Report } from '@/lib/api';
import { useReports } from '@/hooks/useReports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { 
  Users, 
  MessageCircle, 
  FileText, 
  Heart, 
  Trash2, 
  RefreshCw, 
  Search, 
  LogOut, 
  ShieldAlert, 
  Check, 
  X,
  Lock,
  ArrowRight
} from 'lucide-react';

interface ReportWithContent {
  id: string;
  target_type: 'confession' | 'comment';
  target_id: string;
  reason: string;
  custom_reason?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
  reported_content?: {
    content: string;
    type: 'confession' | 'comment';
    confession_id?: string;
  };
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const { reports, updateReportStatus, deleteContent, refetch: refetchReports } = useReports({ autoFetch: isAuthenticated });
  const [reportsWithContent, setReportsWithContent] = useState<ReportWithContent[]>([]);
  
  const [stats, setStats] = useState<AdminStats>({
    total_posts: 0,
    total_confessions: 0,
    active_confessions: 0,
    deleted_confessions: 0,
    total_comments: 0,
    active_comments: 0,
    deleted_comments: 0,
    total_likes: 0,
    online_users: 0,
    media_breakdown: {
      text: 0,
      image: 0,
      video: 0,
      audio: 0,
    },
    total_reports: 0,
    pending_reports: 0,
  });

  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Content management tab
  const [confessionsList, setConfessionsList] = useState<Confession[]>([]);
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentSearch, setContentSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'reports' | 'content' | 'analytics'>('content');
  const [contentFilter, setContentFilter] = useState<'all' | 'confessions' | 'comments'>('all');

  // Verify existing session
  useEffect(() => {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession) {
      try {
        const sessionData = JSON.parse(adminSession);
        const now = Date.now();
        if (now - sessionData.loginTime < 30 * 60 * 1000) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('adminSession');
        }
      } catch {
        localStorage.removeItem('adminSession');
      }
    }
  }, []);

  // Sync reports with content
  useEffect(() => {
    if (reports.length > 0) {
      loadReportsWithContent(reports);
    } else {
      setReportsWithContent([]);
    }
  }, [reports]);

  // Periodic polling when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    loadAdminData();
    loadContentData();

    const interval = setInterval(() => {
      loadAdminData();
    }, 10_000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');
    const correctPassword = 'ghost2025!admin';

    if (password.trim() === correctPassword) {
      const sessionData = {
        loginTime: Date.now(),
        fingerprint: navigator.userAgent + screen.width + screen.height
      };
      localStorage.setItem('adminSession', JSON.stringify(sessionData));
      setIsAuthenticated(true);
      setPassword('');
      loadAdminData();
      loadContentData();
    } else {
      setAuthError('Incorrect password. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    setIsAuthenticated(false);
  };

  const loadAdminData = async () => {
    try {
      const data = await api.get<AdminStats>('/admin/stats');
      if (data) {
        setStats({
          total_posts: data.total_posts ?? data.total_confessions ?? 0,
          total_confessions: data.total_confessions ?? data.total_posts ?? 0,
          active_confessions: data.active_confessions ?? 0,
          deleted_confessions: data.deleted_confessions ?? 0,
          total_comments: data.total_comments ?? 0,
          active_comments: data.active_comments ?? 0,
          deleted_comments: data.deleted_comments ?? 0,
          total_likes: data.total_likes ?? 0,
          online_users: data.online_users ?? 0,
          media_breakdown: {
            text: data.media_breakdown?.text ?? 0,
            image: data.media_breakdown?.image ?? 0,
            video: data.media_breakdown?.video ?? 0,
            audio: data.media_breakdown?.audio ?? 0,
          },
          total_reports: data.total_reports ?? 0,
          pending_reports: data.pending_reports ?? 0,
        });
      }

      // Check online users counter
      try {
        const onlineRes = await api.get<{ online_users: number }>('/admin/online-users');
        if (onlineRes && typeof onlineRes.online_users === 'number') {
          setStats((prev) => ({ ...prev, online_users: onlineRes.online_users }));
        }
      } catch {
        // fallback to stats
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const loadContentData = async () => {
    setContentLoading(true);
    try {
      const data = await api.get<PaginatedConfessionsResponse>('/confessions');
      setConfessionsList(data.confessions || []);
      setCommentsList(data.comments || []);
    } catch (error) {
      console.error('Error loading content data:', error);
    } finally {
      setContentLoading(false);
    }
  };

  const refreshAll = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadAdminData(),
        loadContentData(),
        refetchReports()
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadReportsWithContent = async (reportsList: Report[]) => {
    try {
      const enriched: ReportWithContent[] = await Promise.all(
        reportsList.map(async (report) => {
          let content: { content: string; type: 'confession' | 'comment'; confession_id?: string } | null = null;
          try {
            if (report.target_type === 'confession') {
              const data = await api.get<{ content?: string; text_content?: string }>(
                `/confessions/${report.target_id}`
              );
              if (data) content = { content: data.text_content || data.content || '', type: 'confession' };
            } else if (report.target_type === 'comment') {
              const data = await api.get<{ content: string; confession_id: string }>(
                `/comments/${report.target_id}`
              );
              if (data)
                content = {
                  content: data.content,
                  type: 'comment',
                  confession_id: data.confession_id,
                };
            }
          } catch {
            // content might be soft-deleted already
          }
          return { ...report, reported_content: content || undefined };
        })
      );
      setReportsWithContent(enriched);
    } catch (error) {
      console.error('Error loading reports with content:', error);
    }
  };

  const handleReportAction = async (reportId: string, action: 'resolved' | 'dismissed') => {
    try {
      await updateReportStatus(reportId, action);
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  };

  const handleDeleteReportedContent = async (report: ReportWithContent) => {
    setIsDeleting(report.id);
    try {
      await deleteContent({
        id: report.id,
        target_type: report.target_type,
        target_id: report.target_id,
        reason: report.reason,
        custom_reason: report.custom_reason,
        status: report.status,
        created_at: report.created_at,
        updated_at: report.updated_at,
      });
      window.dispatchEvent(new CustomEvent('forceRefreshFeed'));
      await loadAdminData();
      await loadContentData();
    } catch (error) {
      console.error('Error deleting reported content:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSoftDeleteConfession = async (id: number) => {
    setIsDeleting(`confession-${id}`);
    try {
      await api.deleteConfession(id);
      setConfessionsList((prev) => prev.filter((c) => c.id !== id));
      window.dispatchEvent(new CustomEvent('forceRefreshFeed'));
      await loadAdminData();
    } catch (error) {
      console.error('Error deleting confession:', error);
      alert('Failed to soft delete confession.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSoftDeleteComment = async (commentId: number) => {
    setIsDeleting(`comment-${commentId}`);
    try {
      await api.deleteComment(commentId);
      setCommentsList((prev) => prev.filter((c) => c.id !== commentId));
      window.dispatchEvent(new CustomEvent('forceRefreshFeed'));
      await loadAdminData();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to soft delete comment.');
    } finally {
      setIsDeleting(null);
    }
  };

  // ── Login Screen ───────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-[#e7e9ea] flex items-center justify-center p-4">
        <div className="w-full max-w-[380px] bg-[#16181c] border border-[#2f3336] rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-white">
              <Lock size={20} />
            </div>
            <h1 className="text-xl font-bold text-white">The Boss</h1>
            <p className="text-sm text-[#71767b] mt-1">Admin Dashboard Login</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (authError) setAuthError('');
                }}
                placeholder="Enter password"
                autoFocus
                className="bg-black border-[#2f3336] text-white text-sm placeholder-[#71767b] h-11 focus:border-[#1d9bf0] focus:ring-0 rounded-xl"
              />
              {authError && (
                <p className="text-xs text-[#f4212e] mt-2 font-medium">{authError}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-white hover:bg-neutral-200 text-black font-semibold h-11 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Content Filtering
  const filteredConfessions = confessionsList.filter((c) => {
    if (!contentSearch.trim()) return true;
    const q = contentSearch.toLowerCase();
    return (
      c.id.toString().includes(q) ||
      (c.text_content && c.text_content.toLowerCase().includes(q)) ||
      (c.tags && c.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });

  const filteredComments = commentsList.filter((c) => {
    if (!contentSearch.trim()) return true;
    const q = contentSearch.toLowerCase();
    return (
      c.id.toString().includes(q) ||
      c.confession_id.toString().includes(q) ||
      (c.content && c.content.toLowerCase().includes(q)) ||
      (c.tagged_username && c.tagged_username.toLowerCase().includes(q))
    );
  });

  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-black text-[#e7e9ea] font-sans antialiased">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-[#2f3336] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">The Boss</h1>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#16181c] border border-[#2f3336] text-xs">
            <span className="w-2 h-2 rounded-full bg-[#00ba7c] animate-pulse" />
            <span className="text-[#00ba7c] font-medium">{stats.online_users} online</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshAll}
            disabled={isRefreshing}
            className="h-8 px-3 rounded-full border border-[#2f3336] hover:bg-[#16181c] text-[#71767b] hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
            title="Refresh dashboard data"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleLogout}
            className="h-8 px-3 rounded-full border border-[#2f3336] hover:bg-[#201015] text-[#71767b] hover:text-[#f4212e] text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Simple Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Live Online */}
          <div className="bg-[#16181c] border border-[#2f3336] rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-[#71767b]">
              <span>Online Users</span>
              <Users size={15} />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mt-2">
              {stats.online_users}
            </div>
            <div className="text-xs text-[#00ba7c] font-medium mt-1 flex items-center gap-1">
              <span>● Active within 5m</span>
            </div>
          </div>

          {/* Card 2: Confessions */}
          <div className="bg-[#16181c] border border-[#2f3336] rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-[#71767b]">
              <span>Confessions</span>
              <FileText size={15} />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mt-2">
              {stats.total_confessions}
            </div>
            <div className="text-xs text-[#71767b] mt-1">
              <span className="text-white font-medium">{stats.active_confessions}</span> active · {stats.deleted_confessions} deleted
            </div>
          </div>

          {/* Card 3: Comments */}
          <div className="bg-[#16181c] border border-[#2f3336] rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-[#71767b]">
              <span>Replies</span>
              <MessageCircle size={15} />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mt-2">
              {stats.total_comments}
            </div>
            <div className="text-xs text-[#71767b] mt-1">
              <span className="text-white font-medium">{stats.active_comments}</span> active · {stats.deleted_comments} deleted
            </div>
          </div>

          {/* Card 4: Likes */}
          <div className="bg-[#16181c] border border-[#2f3336] rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-[#71767b]">
              <span>Total Likes</span>
              <Heart size={15} className="text-[#f91880]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mt-2">
              {stats.total_likes}
            </div>
            <div className="text-xs text-[#71767b] mt-1">
              Total reactions
            </div>
          </div>
        </div>

        {/* Clean Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#2f3336] pb-3">
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'bg-white text-black'
                : 'text-[#71767b] hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Reports</span>
            {pendingReportsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                activeTab === 'reports' ? 'bg-[#f4212e] text-white' : 'bg-[#f4212e]/20 text-[#f4212e]'
              }`}>
                {pendingReportsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'content'
                ? 'bg-white text-black'
                : 'text-[#71767b] hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Content</span>
            <span className="text-[11px] opacity-70">({confessionsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
              activeTab === 'analytics'
                ? 'bg-white text-black'
                : 'text-[#71767b] hover:text-white hover:bg-white/5'
            }`}
          >
            Analytics
          </button>
        </div>

        {/* ── TAB 1: REPORTS ── */}
        {activeTab === 'reports' && (
          <div className="space-y-3">
            {reportsWithContent.length === 0 && reports.length === 0 ? (
              <div className="bg-[#16181c] border border-[#2f3336] rounded-2xl py-14 text-center">
                <Check className="mx-auto text-[#00ba7c] mb-2" size={28} />
                <h3 className="text-sm font-semibold text-white">All clear</h3>
                <p className="text-xs text-[#71767b] mt-1">There are no pending moderation reports right now.</p>
              </div>
            ) : (
              reportsWithContent.map((report) => (
                <div
                  key={report.id}
                  className="bg-[#16181c] border border-[#2f3336] rounded-2xl p-4 sm:p-5 space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-white/10 text-white">
                        {report.target_type} #{report.target_id}
                      </span>
                      <span className="text-xs text-[#71767b]">
                        {new Date(report.created_at).toLocaleString()}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        report.status === 'pending'
                          ? 'bg-[#f4212e]/10 text-[#f4212e] border border-[#f4212e]/30'
                          : 'bg-white/5 text-[#71767b]'
                      }`}
                    >
                      {report.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Reason */}
                  <div>
                    <span className="text-xs text-[#71767b]">Reason: </span>
                    <span className="text-xs font-medium text-white">{report.reason}</span>
                    {report.custom_reason && (
                      <p className="text-xs text-[#e7e9ea] mt-1 bg-black/40 p-2.5 rounded-lg border border-[#2f3336]">
                        "{report.custom_reason}"
                      </p>
                    )}
                  </div>

                  {/* Reported Content */}
                  {report.reported_content ? (
                    <div className="bg-black/50 border border-[#2f3336] rounded-xl p-3">
                      <span className="text-[11px] font-medium text-[#71767b] block mb-1">
                        Reported {report.reported_content.type}:
                      </span>
                      <p className="text-sm text-[#e7e9ea] leading-relaxed break-words whitespace-pre-wrap">
                        "{report.reported_content.content}"
                      </p>
                    </div>
                  ) : (
                    <div className="bg-black/30 border border-[#2f3336]/60 rounded-xl p-2.5 text-xs text-[#71767b]">
                      Content has already been soft-deleted.
                    </div>
                  )}

                  {/* Action buttons */}
                  {report.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2f3336]">
                      <button
                        onClick={() => handleReportAction(report.id, 'dismissed')}
                        className="px-3 py-1.5 rounded-full border border-[#2f3336] text-xs text-[#71767b] hover:text-white hover:bg-white/5 transition-colors"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleReportAction(report.id, 'resolved')}
                        className="px-3 py-1.5 rounded-full border border-[#2f3336] text-xs text-[#00ba7c] hover:bg-[#00ba7c]/10 transition-colors"
                      >
                        Resolve
                      </button>

                      {report.reported_content && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              disabled={isDeleting === report.id}
                              className="px-3.5 py-1.5 rounded-full bg-[#f4212e] hover:bg-[#d01b24] text-white text-xs font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              <Trash2 size={12} />
                              <span>{isDeleting === report.id ? 'Deleting...' : 'Delete Content'}</span>
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-[#16181c] border-[#2f3336] text-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Delete Reported Content?</AlertDialogTitle>
                              <AlertDialogDescription className="text-[#71767b] text-xs">
                                This will soft-delete the reported {report.target_type}. It will be removed from the public feed while preserving record history.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-transparent border-[#2f3336] text-white hover:bg-white/10">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteReportedContent(report)}
                                className="bg-[#f4212e] hover:bg-[#d01b24] text-white"
                              >
                                Confirm Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── TAB 2: CONTENT MANAGEMENT ── */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            {/* Filter toolbar */}
            <div className="bg-[#16181c] border border-[#2f3336] rounded-2xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setContentFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    contentFilter === 'all'
                      ? 'bg-white text-black'
                      : 'text-[#71767b] hover:text-white hover:bg-white/5'
                  }`}
                >
                  All ({filteredConfessions.length + filteredComments.length})
                </button>
                <button
                  onClick={() => setContentFilter('confessions')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    contentFilter === 'confessions'
                      ? 'bg-white text-black'
                      : 'text-[#71767b] hover:text-white hover:bg-white/5'
                  }`}
                >
                  Posts ({filteredConfessions.length})
                </button>
                <button
                  onClick={() => setContentFilter('comments')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    contentFilter === 'comments'
                      ? 'bg-white text-black'
                      : 'text-[#71767b] hover:text-white hover:bg-white/5'
                  }`}
                >
                  Replies ({filteredComments.length})
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-2.5 text-[#71767b]" />
                <input
                  type="text"
                  value={contentSearch}
                  onChange={(e) => setContentSearch(e.target.value)}
                  placeholder="Search by text or ID..."
                  className="w-full bg-black border border-[#2f3336] rounded-full pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#71767b] focus:outline-none focus:border-[#1d9bf0]"
                />
              </div>
            </div>

            {/* Content items */}
            {contentLoading ? (
              <div className="text-center py-12 text-[#71767b]">
                <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                <p className="text-xs">Loading items...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Confessions */}
                {(contentFilter === 'all' || contentFilter === 'confessions') &&
                  filteredConfessions.map((post) => (
                    <div
                      key={`conf-${post.id}`}
                      className="bg-[#16181c] border border-[#2f3336] rounded-xl p-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:border-white/20 transition-colors"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                            Post #{post.id}
                          </span>
                          {post.media_type && (
                            <span className="text-[10px] text-[#1d9bf0] bg-[#1d9bf0]/10 px-2 py-0.5 rounded uppercase font-medium">
                              {post.media_type}
                            </span>
                          )}
                          <span className="text-xs text-[#71767b]">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-[#f91880]">♥ {post.likes_count}</span>
                        </div>
                        <p className="text-xs text-[#e7e9ea] line-clamp-2 break-words">
                          {post.text_content || post.caption || '[Attachment Only]'}
                        </p>
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            disabled={isDeleting === `confession-${post.id}`}
                            className="self-start sm:self-center px-3 py-1.5 rounded-full border border-[#f4212e]/40 hover:bg-[#f4212e] text-[#f4212e] hover:text-white text-xs font-semibold transition-colors flex items-center gap-1 shrink-0"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-[#16181c] border-[#2f3336] text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Delete Post #{post.id}?</AlertDialogTitle>
                            <AlertDialogDescription className="text-[#71767b] text-xs">
                              This will soft-delete the post and cascade to delete all its replies. It will be hidden from the public feed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-transparent border-[#2f3336] text-white hover:bg-white/10">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleSoftDeleteConfession(post.id)}
                              className="bg-[#f4212e] hover:bg-[#d01b24] text-white"
                            >
                              Confirm Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}

                {/* Comments */}
                {(contentFilter === 'all' || contentFilter === 'comments') &&
                  filteredComments.map((comment) => (
                    <div
                      key={`comment-${comment.id}`}
                      className="bg-[#16181c] border border-[#2f3336] rounded-xl p-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:border-white/20 transition-colors"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                            Reply #{comment.id}
                          </span>
                          <span className="text-xs text-[#71767b]">
                            on Post #{comment.confession_id}
                          </span>
                          {comment.tagged_username && (
                            <span className="text-[11px] text-[#1d9bf0] font-medium">
                              replying to @{comment.tagged_username}
                            </span>
                          )}
                          <span className="text-xs text-[#71767b]">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-[#e7e9ea] line-clamp-2 break-words">
                          {comment.content}
                        </p>
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            disabled={isDeleting === `comment-${comment.id}`}
                            className="self-start sm:self-center px-3 py-1.5 rounded-full border border-[#f4212e]/40 hover:bg-[#f4212e] text-[#f4212e] hover:text-white text-xs font-semibold transition-colors flex items-center gap-1 shrink-0"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-[#16181c] border-[#2f3336] text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Delete Comment #{comment.id}?</AlertDialogTitle>
                            <AlertDialogDescription className="text-[#71767b] text-xs">
                              This will directly soft-delete this comment and remove it from the discussion thread.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-transparent border-[#2f3336] text-white hover:bg-white/10">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleSoftDeleteComment(comment.id)}
                              className="bg-[#f4212e] hover:bg-[#d01b24] text-white"
                            >
                              Confirm Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}

                {filteredConfessions.length === 0 && filteredComments.length === 0 && (
                  <div className="text-center py-12 text-[#71767b] text-xs">
                    No content found matching "{contentSearch}".
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: ANALYTICS ── */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Media Formats Card */}
            <div className="bg-[#16181c] border border-[#2f3336] rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Media Formats</h3>
                <p className="text-xs text-[#71767b] mt-0.5">Breakdown of uploaded confession media</p>
              </div>

              {(() => {
                const total = 
                  (stats.media_breakdown?.text || 0) +
                  (stats.media_breakdown?.image || 0) +
                  (stats.media_breakdown?.video || 0) +
                  (stats.media_breakdown?.audio || 0);

                const getPct = (val: number) => (total > 0 ? Math.round((val / total) * 100) : 0);

                return (
                  <div className="space-y-3 pt-1">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white">Text Posts</span>
                        <span className="text-[#71767b]">{stats.media_breakdown?.text || 0} ({getPct(stats.media_breakdown?.text || 0)}%)</span>
                      </div>
                      <div className="w-full bg-black rounded-full h-1.5 overflow-hidden">
                        <div className="bg-white h-full" style={{ width: `${getPct(stats.media_breakdown?.text || 0)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white">Images</span>
                        <span className="text-[#71767b]">{stats.media_breakdown?.image || 0} ({getPct(stats.media_breakdown?.image || 0)}%)</span>
                      </div>
                      <div className="w-full bg-black rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#1d9bf0] h-full" style={{ width: `${getPct(stats.media_breakdown?.image || 0)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white">Videos</span>
                        <span className="text-[#71767b]">{stats.media_breakdown?.video || 0} ({getPct(stats.media_breakdown?.video || 0)}%)</span>
                      </div>
                      <div className="w-full bg-black rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#ffd400] h-full" style={{ width: `${getPct(stats.media_breakdown?.video || 0)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white">Audio Notes</span>
                        <span className="text-[#71767b]">{stats.media_breakdown?.audio || 0} ({getPct(stats.media_breakdown?.audio || 0)}%)</span>
                      </div>
                      <div className="w-full bg-black rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#7856ff] h-full" style={{ width: `${getPct(stats.media_breakdown?.audio || 0)}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Retention & Moderation Ratios */}
            <div className="bg-[#16181c] border border-[#2f3336] rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Content Retention</h3>
                <p className="text-xs text-[#71767b] mt-0.5">Active content vs soft-deleted history</p>
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white">Confessions</span>
                    <span className="text-[#71767b]">
                      <span className="text-[#00ba7c] font-medium">{stats.active_confessions ?? 0} active</span> · {stats.deleted_confessions ?? 0} deleted
                    </span>
                  </div>
                  {(() => {
                    const activeC = stats.active_confessions ?? 0;
                    const deletedC = stats.deleted_confessions ?? 0;
                    const totalC = activeC + deletedC;
                    const activePct = totalC > 0 ? Math.round((activeC / totalC) * 100) : 100;
                    return (
                      <div className="w-full bg-[#f4212e]/30 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#00ba7c] h-full" style={{ width: `${activePct}%` }} />
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white">Comments & Replies</span>
                    <span className="text-[#71767b]">
                      <span className="text-[#00ba7c] font-medium">{stats.active_comments ?? 0} active</span> · {stats.deleted_comments ?? 0} deleted
                    </span>
                  </div>
                  {(() => {
                    const activeCm = stats.active_comments ?? 0;
                    const deletedCm = stats.deleted_comments ?? 0;
                    const totalCm = activeCm + deletedCm;
                    const activePct = totalCm > 0 ? Math.round((activeCm / totalCm) * 100) : 100;
                    return (
                      <div className="w-full bg-[#f4212e]/30 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#00ba7c] h-full" style={{ width: `${activePct}%` }} />
                      </div>
                    );
                  })()}
                </div>

                <div className="pt-3 border-t border-[#2f3336] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#71767b]">Avg. Likes per Post</span>
                    <span className="text-white font-medium">
                      {(stats.total_confessions ?? 0) > 0 
                        ? ((stats.total_likes ?? 0) / (stats.total_confessions ?? 1)).toFixed(1) 
                        : '0.0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#71767b]">Avg. Replies per Post</span>
                    <span className="text-white font-medium">
                      {(stats.total_confessions ?? 0) > 0 
                        ? ((stats.total_comments ?? 0) / (stats.total_confessions ?? 1)).toFixed(1) 
                        : '0.0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
