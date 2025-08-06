import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useReports } from '@/hooks/useReports';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Users, 
  MessageSquare, 
  Flag, 
  TrendingUp, 
  Eye, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  BarChart3,
  Settings,
  Download,
  Calendar,
  Clock,
  AlertTriangle,
  Activity
} from 'lucide-react';

interface AdminStats {
  totalConfessions: number;
  totalComments: number;
  totalReports: number;
  pendingReports: number;
  totalVotes: number;
  totalReactions: number;
  todayConfessions: number;
  activeUsers: number;
}

interface DetailedReport {
  id: string;
  target_type: 'confession' | 'comment';
  target_id: string;
  reason: string;
  custom_reason?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  content?: string;
  upvotes?: number;
  downvotes?: number;
  reactions?: number;
}

interface RecentActivity {
  id: string;
  type: 'confession' | 'comment' | 'vote' | 'reaction';
  content: string;
  created_at: string;
  user_fingerprint?: string;
}

const reportReasonLabels: Record<string, { label: string; icon: string; color: string }> = {
  'spam': { label: 'Spam or Repetitive Content', icon: '🚫', color: 'text-orange-400' },
  'harassment': { label: 'Harassment or Bullying', icon: '🎯', color: 'text-red-400' },
  'hate-speech': { label: 'Hate Speech', icon: '⚠️', color: 'text-red-500' },
  'violence': { label: 'Violence or Threats', icon: '🔴', color: 'text-red-600' },
  'inappropriate': { label: 'Inappropriate Content', icon: '🔞', color: 'text-purple-400' },
  'personal-info': { label: 'Personal Information', icon: '📱', color: 'text-blue-400' },
  'false-info': { label: 'False Information', icon: '❌', color: 'text-yellow-400' },
  'copyright': { label: 'Copyright Violation', icon: '©️', color: 'text-cyan-400' },
  'other': { label: 'Other Reason', icon: '💭', color: 'text-gray-400' }
};

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'content' | 'users' | 'settings'>('dashboard');
  
  const [stats, setStats] = useState<AdminStats>({
    totalConfessions: 0,
    totalComments: 0,
    totalReports: 0,
    pendingReports: 0,
    totalVotes: 0,
    totalReactions: 0,
    todayConfessions: 0,
    activeUsers: 0,
  });

  const [reports, setReports] = useState<DetailedReport[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [confessions, setConfessions] = useState<any[]>([]);
  
  const { toast } = useToast();

  // Check authentication on mount
  useEffect(() => {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession) {
      try {
        const sessionData = JSON.parse(adminSession);
        const isValid = Date.now() - sessionData.loginTime < 24 * 60 * 60 * 1000; // 24 hours
        if (isValid) {
          setIsAuthenticated(true);
          loadDashboardData();
        } else {
          localStorage.removeItem('adminSession');
        }
      } catch {
        localStorage.removeItem('adminSession');
      }
    }
  }, []);

  const handleLogin = async () => {
    if (password === 'ghost2025!admin') {
      const sessionData = {
        loginTime: Date.now(),
        fingerprint: navigator.userAgent + screen.width + screen.height
      };
      localStorage.setItem('adminSession', JSON.stringify(sessionData));
      setIsAuthenticated(true);
      setPassword('');
      await loadDashboardData();
      
      toast({
        title: "Welcome Admin! 👑",
        description: "Successfully logged into admin panel",
      });
    } else {
      toast({
        title: "Access Denied ❌",
        description: "Invalid admin password",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    setIsAuthenticated(false);
    setPassword('');
    
    toast({
      title: "Logged Out 👋",
      description: "Admin session ended",
    });
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadReports(),
        loadRecentActivity(),
        loadConfessions()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load admin dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      confessionsResult,
      commentsResult,
      reportsResult,
      votesResult,
      reactionsResult,
      todayConfessionsResult
    ] = await Promise.all([
      supabase.from('confessions').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }),
      supabase.from('votes').select('*', { count: 'exact', head: true }),
      supabase.from('reactions').select('*', { count: 'exact', head: true }),
      supabase.from('confessions').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString())
    ]);

    const { count: pendingReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get unique active users (last 24 hours)
    const { data: activeUsersData } = await supabase
      .from('votes')
      .select('user_fingerprint')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const uniqueUsers = new Set(activeUsersData?.map(u => u.user_fingerprint) || []);

    setStats({
      totalConfessions: confessionsResult.count || 0,
      totalComments: commentsResult.count || 0,
      totalReports: reportsResult.count || 0,
      pendingReports: pendingReports || 0,
      totalVotes: votesResult.count || 0,
      totalReactions: reactionsResult.count || 0,
      todayConfessions: todayConfessionsResult.count || 0,
      activeUsers: uniqueUsers.size,
    });
  };

  const loadReports = async () => {
    console.log('Loading reports...');
    const { data: reportsData, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading reports:', error);
      throw error;
    }

    console.log('Raw reports data:', reportsData);

    const detailedReports: DetailedReport[] = [];
    
    for (const report of reportsData || []) {
      console.log('Processing report:', report);
      let content = '';
      let upvotes = 0;
      let downvotes = 0;
      let reactions = 0;

      if (report.target_type === 'confession') {
        const { data: confessionData } = await supabase
          .from('confessions')
          .select('content, upvotes, downvotes')
          .eq('id', report.target_id)
          .single();
        
        if (confessionData) {
          content = confessionData.content;
          upvotes = confessionData.upvotes || 0;
          downvotes = confessionData.downvotes || 0;
        }
      } else if (report.target_type === 'comment') {
        const { data: commentData } = await supabase
          .from('comments')
          .select('content, upvotes, downvotes')
          .eq('id', report.target_id)
          .single();
        
        if (commentData) {
          content = commentData.content;
          upvotes = commentData.upvotes || 0;
          downvotes = commentData.downvotes || 0;
        }
      }

      // Get reaction count
      const { count: reactionCount } = await supabase
        .from('reactions')
        .select('*', { count: 'exact', head: true })
        .eq('target_type', report.target_type)
        .eq('target_id', report.target_id);

      detailedReports.push({
        ...report,
        content,
        upvotes,
        downvotes,
        reactions: reactionCount || 0
      });
    }

    setReports(detailedReports);
  };

  const loadRecentActivity = async () => {
    const { data: recent } = await supabase
      .from('confessions')
      .select('id, content, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    const activity: RecentActivity[] = recent?.map(item => ({
      id: item.id,
      type: 'confession',
      content: item.content.substring(0, 100) + (item.content.length > 100 ? '...' : ''),
      created_at: item.created_at
    })) || [];

    setRecentActivity(activity);
  };

  const loadConfessions = async () => {
    const { data } = await supabase
      .from('confessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    setConfessions(data || []);
  };

  const handleReportAction = async (reportId: string, action: 'resolved' | 'dismissed') => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: action, updated_at: new Date().toISOString() })
        .eq('id', reportId);

      if (error) throw error;

      await loadReports();
      
      toast({
        title: `Report ${action}`,
        description: `Report has been marked as ${action}`,
      });
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: "Error",
        description: "Failed to update report status",
        variant: "destructive"
      });
    }
  };

  // Add function to delete all data
  const deleteAllData = async () => {
    try {
      setLoading(true);
      
      console.log('Starting delete all operation...');
      
      // First try to get current counts for verification
      const { count: currentCount } = await supabase
        .from('confessions')
        .select('*', { count: 'exact', head: true });
      
      console.log('Current confession count:', currentCount || 0);
      
      // Use the efficient SQL function to delete everything
      const { data, error } = await supabase.rpc('delete_all_data');
      
      console.log('Delete function response:', { data, error });
      
      if (error) {
        console.error('SQL function error:', error);
        throw new Error(`SQL function failed: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        console.log('No data returned from function, trying manual deletion...');
        
        // Fallback: manual deletion
        await supabase.from('reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('reactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('confessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        toast({
          title: "Database Cleared ✅",
          description: "Successfully deleted all data using manual method",
        });
      } else {
        const result = data[0];
        const totalDeleted = 
          (result.deleted_confessions || 0) + 
          (result.deleted_comments || 0) + 
          (result.deleted_votes || 0) + 
          (result.deleted_reactions || 0) + 
          (result.deleted_reports || 0);

        console.log('Deletion results:', result);

        toast({
          title: "Database Cleared ✅",
          description: `Successfully deleted ${totalDeleted} total records: ${result.deleted_confessions} confessions, ${result.deleted_comments} comments, ${result.deleted_votes} votes, ${result.deleted_reactions} reactions, ${result.deleted_reports} reports`,
        });
      }
      
      // Force reload all data
      await loadDashboardData();
      
      // Also trigger a full page refresh to ensure the main feed updates
      setTimeout(() => {
        if (window.opener) {
          window.opener.location.reload();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error deleting all data:', error);
      toast({
        title: "Error",
        description: `Failed to clear database: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteConfessionCompletely = async (confessionId: string) => {
    try {
      console.log(`Deleting confession ${confessionId} using SQL function...`);
      
      // Use the SQL function to delete confession and all related data
      const { data, error } = await supabase.rpc('delete_confession_cascade', {
        confession_id_param: confessionId
      });
      
      console.log('SQL function response:', { data, error });
      
      if (error) {
        console.error('SQL function error:', error);
        throw new Error(`SQL function failed: ${error.message}`);
      }
      
      if (data === false) {
        throw new Error('SQL function returned false - deletion failed');
      }
      
      console.log(`Successfully deleted confession ${confessionId} using SQL function, result:`, data);
      return true;
    } catch (error) {
      console.error('Error in deleteConfessionCompletely:', error);
      throw error;
    }
  };

  const deleteContent = async (report: DetailedReport) => {
    try {
      console.log(`Deleting ${report.target_type} with ID: ${report.target_id}`);
      
      if (report.target_type === 'confession') {
        // Use SQL function for confession deletion
        const { data, error } = await supabase.rpc('delete_confession_cascade', {
          confession_id_param: report.target_id
        });
        
        console.log('Confession deletion result:', { data, error });
        
        if (error) throw new Error(`SQL error: ${error.message}`);
        if (data === false) throw new Error('SQL function returned false');
        
      } else {
        // Use SQL function for comment deletion
        const { data, error } = await supabase.rpc('delete_comment_cascade', {
          comment_id_param: report.target_id
        });
        
        console.log('Comment deletion result:', { data, error });
        
        if (error) throw new Error(`SQL error: ${error.message}`);
        if (data === false) throw new Error('SQL function returned false');
      }
      
      // Reload data to reflect changes
      await loadDashboardData();
      
      toast({
        title: "Content Deleted ✅",
        description: `${report.target_type} and all related data permanently deleted`,
      });
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error",
        description: `Failed to delete content: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="bg-black/80 backdrop-blur-sm border border-green-500/30 rounded-lg p-8 max-w-md w-full shadow-2xl">
          <div className="text-center mb-6">
            <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-400 mb-2">ADMIN ACCESS</h1>
            <p className="text-green-300/70 text-sm font-mono">AUTHORIZATION REQUIRED</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-mono mb-2 text-green-400">PASSWORD:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full bg-black/50 border border-green-400/50 rounded p-3 text-green-400 font-mono focus:border-green-400 focus:outline-none"
                placeholder="Enter admin password"
              />
            </div>
            
            <button
              onClick={handleLogin}
              className="w-full bg-green-900/50 hover:bg-green-800/50 text-green-400 border border-green-400/50 hover:border-green-400 font-mono py-3 rounded transition-all"
            >
              AUTHENTICATE
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-green-600/70 font-mono">
              UNAUTHORIZED ACCESS DETECTED<br/>
              ALL ATTEMPTS ARE LOGGED
            </p>
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue' }: {
    icon: any;
    title: string;
    value: number | string;
    subtitle?: string;
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  }) => {
    const colorClasses = {
      blue: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
      green: 'border-green-500/30 bg-green-500/10 text-green-400',
      red: 'border-red-500/30 bg-red-500/10 text-red-400',
      yellow: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
      purple: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
    };

    return (
      <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80 font-mono">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs opacity-60">{subtitle}</p>}
          </div>
          <Icon className="w-8 h-8 opacity-60" />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-green-400" />
              <div>
                <h1 className="text-xl font-bold text-green-400">Admin Panel</h1>
                <p className="text-sm text-gray-400 font-mono">Ghost Board Control Center</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={loadDashboardData}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded hover:bg-blue-600/30 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 bg-red-600/20 border border-red-500/30 text-red-400 rounded hover:bg-red-600/30 transition-all"
              >
                <XCircle className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-gray-800 bg-black/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'reports', label: 'Reports', icon: Flag },
              { id: 'content', label: 'Content', icon: MessageSquare },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-all ${
                  activeTab === id
                    ? 'border-green-400 text-green-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={MessageSquare}
                title="Total Confessions"
                value={stats.totalConfessions}
                subtitle={`${stats.todayConfessions} today`}
                color="blue"
              />
              <StatCard
                icon={Users}
                title="Comments"
                value={stats.totalComments}
                color="green"
              />
              <StatCard
                icon={Flag}
                title="Reports"
                value={stats.totalReports}
                subtitle={`${stats.pendingReports} pending`}
                color={stats.pendingReports > 0 ? 'red' : 'yellow'}
              />
              <StatCard
                icon={Activity}
                title="Active Users"
                value={stats.activeUsers}
                subtitle="Last 24h"
                color="purple"
              />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-gray-700 rounded-lg p-6 bg-black/30">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Recent Confessions
                </h3>
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="border-l-2 border-blue-500/30 pl-3 py-2">
                      <p className="text-sm text-gray-300">{activity.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-gray-700 rounded-lg p-6 bg-black/30">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  Pending Reports ({reports.filter(r => r.status === 'pending').length})
                </h3>
                <div className="space-y-3">
                  {reports.filter(r => r.status === 'pending').slice(0, 5).map((report) => (
                    <div key={report.id} className="border-l-2 border-red-500/30 pl-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">
                          {reportReasonLabels[report.reason]?.icon || '🚩'}
                        </span>
                        <p className={`text-sm font-semibold ${reportReasonLabels[report.reason]?.color || 'text-red-400'}`}>
                          {reportReasonLabels[report.reason]?.label || report.reason}
                        </p>
                      </div>
                      {report.custom_reason && (
                        <p className="text-xs text-yellow-400 mb-1">
                          "{report.custom_reason}"
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(report.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {reports.filter(r => r.status === 'pending').length === 0 && (
                    <p className="text-gray-500 text-sm">No pending reports ✅</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Reports Management</h2>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-red-600/20 border border-red-500/30 text-red-400 rounded text-sm">
                  {stats.pendingReports} Pending
                </span>
                <span className="px-3 py-1 bg-gray-600/20 border border-gray-500/30 text-gray-400 rounded text-sm">
                  {stats.totalReports} Total
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="border border-gray-700 rounded-lg p-6 bg-black/20">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-mono ${
                        report.status === 'pending' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' :
                        report.status === 'resolved' ? 'bg-green-600/20 text-green-400 border border-green-500/30' :
                        'bg-gray-600/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {report.status.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-xs font-mono">
                        {report.target_type.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(report.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">
                        {reportReasonLabels[report.reason]?.icon || '🚩'}
                      </span>
                      <p className={`text-sm font-semibold ${reportReasonLabels[report.reason]?.color || 'text-red-400'}`}>
                        <strong>Reason:</strong> {reportReasonLabels[report.reason]?.label || report.reason.replace('-', ' ').toUpperCase()}
                      </p>
                    </div>
                    {report.custom_reason && (
                      <div className="bg-yellow-900/20 border border-yellow-600/30 rounded p-3 mb-2">
                        <p className="text-sm text-yellow-400">
                          <strong>📝 Additional Details:</strong> {report.custom_reason}
                        </p>
                      </div>
                    )}
                    {report.content && (
                      <div className="bg-gray-800/50 rounded p-3 mt-2">
                        <p className="text-sm text-gray-300">
                          <strong>📄 Reported Content:</strong> {report.content}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>👍 {report.upvotes}</span>
                          <span>👎 {report.downvotes}</span>
                          <span>😊 {report.reactions} reactions</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {report.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReportAction(report.id, 'dismissed')}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-600/20 border border-gray-500/30 text-gray-400 rounded hover:bg-gray-600/30 transition-all"
                      >
                        <XCircle className="w-4 h-4" />
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleReportAction(report.id, 'resolved')}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600/20 border border-green-500/30 text-green-400 rounded hover:bg-green-600/30 transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Resolve
                      </button>
                      <button
                        onClick={() => deleteContent(report)}
                        className="flex items-center gap-2 px-3 py-2 bg-red-600/20 border border-red-500/30 text-red-400 rounded hover:bg-red-600/30 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Content
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Content Management</h2>
            <div className="space-y-4">
              {confessions.map((confession) => (
                <div key={confession.id} className="border border-gray-700 rounded-lg p-6 bg-black/20">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs text-gray-500">
                      ID: {confession.id}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(confession.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-gray-300 mb-3">{confession.content}</p>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>👍 {confession.upvotes || 0}</span>
                      <span>👎 {confession.downvotes || 0}</span>
                      <span>💬 {confession.comments?.length || 0}</span>
                    </div>
                    
                    <button
                      onClick={async () => {
                        if (confirm('Are you sure you want to delete this confession? This will also delete all comments, votes, reactions, and reports related to it.')) {
                          try {
                            await deleteConfessionCompletely(confession.id);
                            await loadDashboardData();
                            
                            toast({
                              title: "Confession Deleted ✅",
                              description: "Confession and all related data permanently deleted",
                            });
                          } catch (error) {
                            console.error('Error deleting confession:', error);
                            toast({
                              title: "Error",
                              description: "Failed to delete confession",
                              variant: "destructive"
                            });
                          }
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-500/30 text-red-400 rounded hover:bg-red-600/30 transition-all text-sm"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">User Analytics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StatCard
                icon={Users}
                title="Total Active Users"
                value={stats.activeUsers}
                subtitle="Last 24 hours"
                color="blue"
              />
              <StatCard
                icon={TrendingUp}
                title="Total Interactions"
                value={stats.totalVotes + stats.totalReactions}
                subtitle="Votes + Reactions"
                color="green"
              />
            </div>
            
            <div className="border border-gray-700 rounded-lg p-6 bg-black/20">
              <h3 className="text-lg font-semibold mb-4">Activity Overview</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">{stats.totalVotes}</p>
                  <p className="text-sm text-gray-400">Total Votes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">{stats.totalReactions}</p>
                  <p className="text-sm text-gray-400">Total Reactions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{stats.totalComments}</p>
                  <p className="text-sm text-gray-400">Total Comments</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">{stats.todayConfessions}</p>
                  <p className="text-sm text-gray-400">Today's Posts</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">System Settings</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-gray-700 rounded-lg p-6 bg-black/20">
                <h3 className="text-lg font-semibold mb-4">Database Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={async () => {
                      const confirmMessage = `⚠️ DANGER ZONE ⚠️

This will PERMANENTLY DELETE ALL DATA from the database:
• All confessions
• All comments  
• All votes
• All reactions
• All reports

This action CANNOT be undone!

Type "DELETE ALL" to confirm:`;
                      
                      const userInput = prompt(confirmMessage);
                      
                      if (userInput === 'DELETE ALL') {
                        const finalConfirm = confirm('Are you absolutely sure? This will destroy everything in the database!');
                        if (finalConfirm) {
                          console.log('User confirmed DELETE ALL - executing...');
                          await deleteAllData();
                        } else {
                          console.log('User cancelled at final confirmation');
                        }
                      } else if (userInput !== null) {
                        console.log('User input was:', userInput, 'but required "DELETE ALL"');
                        toast({
                          title: "Action Cancelled",
                          description: "You must type 'DELETE ALL' exactly to confirm",
                          variant: "destructive"
                        });
                      } else {
                        console.log('User cancelled at first prompt');
                      }
                    }}
                    disabled={loading}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-500/30 text-red-400 rounded hover:bg-red-600/30 transition-all disabled:opacity-50"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    🚨 DELETE ALL DATA 🚨
                  </button>
                  
                  <button
                    onClick={async () => {
                      if (confirm('This will delete all confessions older than 7 days and their related data. Continue?')) {
                        try {
                          setLoading(true);
                          
                          // Use SQL function to clean old confessions
                          const { data: deletedCount, error } = await supabase.rpc('clean_old_confessions', {
                            days_old: 7
                          });
                          
                          if (error) throw error;
                          
                          if (deletedCount && deletedCount > 0) {
                            toast({
                              title: "Cleanup Complete ✅",
                              description: `Deleted ${deletedCount} old confessions and related data`,
                            });
                          } else {
                            toast({
                              title: "No Old Content",
                              description: "No confessions older than 7 days found",
                            });
                          }
                          
                          await loadDashboardData();
                        } catch (error) {
                          console.error('Error cleaning old confessions:', error);
                          toast({
                            title: "Error",
                            description: `Failed to clean old confessions: ${error.message}`,
                            variant: "destructive"
                          });
                        } finally {
                          setLoading(false);
                        }
                      }
                    }}
                    disabled={loading}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-yellow-600/20 border border-yellow-500/30 text-yellow-400 rounded hover:bg-yellow-600/30 transition-all disabled:opacity-50"
                  >
                    <Clock className="w-4 h-4" />
                    Clean Old Confessions (7+ days)
                  </button>
                  
                  <button
                    onClick={async () => {
                      if (confirm('This will export all confession data to a JSON file. Continue?')) {
                        try {
                          setLoading(true);
                          
                          // Get all data
                          const [confessionsData, commentsData, votesData, reactionsData, reportsData] = await Promise.all([
                            supabase.from('confessions').select('*'),
                            supabase.from('comments').select('*'),
                            supabase.from('votes').select('*'),
                            supabase.from('reactions').select('*'),
                            supabase.from('reports').select('*')
                          ]);
                          
                          const exportData = {
                            exportDate: new Date().toISOString(),
                            stats: stats,
                            confessions: confessionsData.data || [],
                            comments: commentsData.data || [],
                            votes: votesData.data || [],
                            reactions: reactionsData.data || [],
                            reports: reportsData.data || []
                          };
                          
                          // Create and download file
                          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `ghost-board-export-${new Date().toISOString().split('T')[0]}.json`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          
                          toast({
                            title: "Export Complete ✅",
                            description: "Data exported successfully",
                          });
                        } catch (error) {
                          console.error('Error exporting data:', error);
                          toast({
                            title: "Error",
                            description: "Failed to export data",
                            variant: "destructive"
                          });
                        } finally {
                          setLoading(false);
                        }
                      }
                    }}
                    disabled={loading}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded hover:bg-blue-600/30 transition-all disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    Export All Data
                  </button>
                </div>
              </div>
              
              <div className="border border-gray-700 rounded-lg p-6 bg-black/20">
                <h3 className="text-lg font-semibold mb-4">System Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Updated:</span>
                    <span className="text-gray-300">{new Date().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Admin Session:</span>
                    <span className="text-green-400">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Database:</span>
                    <span className="text-green-400">Connected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
