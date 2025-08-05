import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Report {
  id: string;
  type: 'post' | 'comment';
  targetId: string;
  reason: string;
  customReason?: string;
  timestamp: number;
  content: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

interface AdminStats {
  totalPosts: number;
  totalComments: number;
  totalReports: number;
  pendingReports: number;
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalPosts: 0,
    totalComments: 0,
    totalReports: 0,
    pendingReports: 0
  });
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Check if already authenticated
  useEffect(() => {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession) {
      const sessionData = JSON.parse(adminSession);
      const now = Date.now();
      
      // Check if session is still valid (30 minutes)
      if (now - sessionData.loginTime < 30 * 60 * 1000) {
        setIsAuthenticated(true);
        loadAdminData();
      } else {
        // Session expired
        localStorage.removeItem('adminSession');
      }
    }
  }, []);

  // Listen for localStorage changes to update stats in real-time
  useEffect(() => {
    const handleStorageChange = () => {
      if (isAuthenticated) {
        loadAdminData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also set up a periodic refresh every 5 seconds when authenticated
    let interval: NodeJS.Timeout;
    if (isAuthenticated) {
      interval = setInterval(loadAdminData, 5000);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAuthenticated]);

  const handleLogin = () => {
    // In production, use a secure hash comparison
    const correctPassword = 'ghost2025!admin';
    
    if (password === correctPassword) {
      const sessionData = {
        loginTime: Date.now(),
        fingerprint: navigator.userAgent + screen.width + screen.height
      };
      localStorage.setItem('adminSession', JSON.stringify(sessionData));
      setIsAuthenticated(true);
      setPassword('');
      loadAdminData();
    } else {
      alert('Invalid password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    setIsAuthenticated(false);
    setReports([]);
  };

  const loadAdminData = () => {
    // Load reports from localStorage
    const storedReports = localStorage.getItem('reportedContent');
    let reportData = [];
    if (storedReports) {
      reportData = JSON.parse(storedReports);
      setReports(reportData);
    }

    // Load posts and calculate stats
    const storedPosts = localStorage.getItem('confessions');
    const posts = storedPosts ? JSON.parse(storedPosts) : [];
    
    let totalComments = 0;
    posts.forEach((post: any) => {
      if (post.comments) {
        totalComments += post.comments.length;
      }
    });

    const pendingReports = reportData.filter((r: any) => r.status === 'pending').length;

    setStats({
      totalPosts: posts.length,
      totalComments,
      totalReports: reportData.length,
      pendingReports
    });
  };

  const handleReportAction = (reportId: string, action: 'resolve' | 'dismiss') => {
    const updatedReports = reports.map(report => 
      report.id === reportId 
        ? { ...report, status: action === 'resolve' ? 'resolved' as const : 'dismissed' as const }
        : report
    );
    
    setReports(updatedReports);
    localStorage.setItem('reportedContent', JSON.stringify(updatedReports));
    
    // Update stats immediately
    setTimeout(() => loadAdminData(), 100);
  };

  const deleteContent = (report: Report) => {
    setIsDeleting(report.id);
    
    if (report.type === 'post') {
      // Delete post
      const storedPosts = localStorage.getItem('confessions');
      if (storedPosts) {
        const posts = JSON.parse(storedPosts);
        const updatedPosts = posts.filter((post: any) => post.id.toString() !== report.targetId);
        localStorage.setItem('confessions', JSON.stringify(updatedPosts));
      }
    } else {
      // Delete comment
      const storedPosts = localStorage.getItem('confessions');
      if (storedPosts) {
        const posts = JSON.parse(storedPosts);
        const updatedPosts = posts.map((post: any) => {
          if (post.comments) {
            post.comments = post.comments.filter((comment: any) => comment.id.toString() !== report.targetId);
          }
          return post;
        });
        localStorage.setItem('confessions', JSON.stringify(updatedPosts));
      }
    }
    
    // Mark report as resolved and reload stats
    handleReportAction(report.id, 'resolve');
    
    // Reload stats after content deletion
    setTimeout(() => {
      loadAdminData();
      setIsDeleting(null);
    }, 100);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center p-4">
        <div className="retro-border bg-black p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-mono mb-2 glow-text">ADMIN ACCESS</h1>
            <p className="text-green-300 text-sm font-mono">AUTHORIZATION REQUIRED</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-mono mb-2">PASSWORD:</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="bg-black border-green-400 text-green-400 font-mono"
                placeholder="Enter admin password"
              />
            </div>
            
            <Button
              onClick={handleLogin}
              className="w-full bg-green-900 hover:bg-green-800 text-green-400 border border-green-400 font-mono"
            >
              AUTHENTICATE
            </Button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-green-600 font-mono">
              UNAUTHORIZED ACCESS DETECTED<br/>
              ALL ATTEMPTS ARE LOGGED
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-mono glow-text">ADMIN DASHBOARD</h1>
          <div className="flex gap-2">
            <Button
              onClick={loadAdminData}
              variant="outline"
              className="border-green-500 text-green-400 hover:bg-green-900 font-mono"
            >
              REFRESH
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-500 text-red-400 hover:bg-red-900 font-mono"
            >
              LOGOUT
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-black border-green-400">
            <CardHeader className="pb-2">
              <CardTitle className="text-green-400 font-mono text-sm">TOTAL POSTS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-mono text-green-300">{stats.totalPosts}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-black border-green-400">
            <CardHeader className="pb-2">
              <CardTitle className="text-green-400 font-mono text-sm">TOTAL COMMENTS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-mono text-green-300">{stats.totalComments}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-black border-green-400">
            <CardHeader className="pb-2">
              <CardTitle className="text-green-400 font-mono text-sm">TOTAL REPORTS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-mono text-green-300">{stats.totalReports}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-black border-red-400">
            <CardHeader className="pb-2">
              <CardTitle className="text-red-400 font-mono text-sm">PENDING REPORTS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-mono text-red-300">{stats.pendingReports}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="bg-black border border-green-400">
            <TabsTrigger value="reports" className="font-mono data-[state=active]:bg-green-900 data-[state=active]:text-green-400">
              REPORTS ({stats.pendingReports})
            </TabsTrigger>
            <TabsTrigger value="content" className="font-mono data-[state=active]:bg-green-900 data-[state=active]:text-green-400">
              CONTENT
            </TabsTrigger>
            <TabsTrigger value="analytics" className="font-mono data-[state=active]:bg-green-900 data-[state=active]:text-green-400">
              ANALYTICS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
            {reports.length === 0 ? (
              <Card className="bg-black border-green-400">
                <CardContent className="text-center py-8">
                  <p className="text-green-300 font-mono">NO REPORTS FOUND</p>
                </CardContent>
              </Card>
            ) : (
              reports.map((report) => (
                <Card key={report.id} className="bg-black border-green-400">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-green-400 font-mono text-sm">
                          {report.type.toUpperCase()} REPORT
                        </CardTitle>
                        <CardDescription className="text-green-600 font-mono text-xs">
                          {new Date(report.timestamp).toLocaleString()}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={report.status === 'pending' ? 'destructive' : 'secondary'}
                        className="font-mono"
                      >
                        {report.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-green-600 font-mono mb-1">REASON:</p>
                      <p className="text-green-300 font-mono text-sm">{report.reason}</p>
                      {report.customReason && (
                        <>
                          <p className="text-xs text-green-600 font-mono mb-1 mt-2">CUSTOM REASON:</p>
                          <p className="text-green-300 font-mono text-sm">{report.customReason}</p>
                        </>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-xs text-green-600 font-mono mb-1">CONTENT:</p>
                      <div className="bg-gray-900 border border-green-700 p-3 rounded">
                        <p className="text-green-200 font-mono text-sm">{report.content}</p>
                      </div>
                    </div>

                    {report.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleReportAction(report.id, 'dismiss')}
                          variant="outline"
                          size="sm"
                          className="border-yellow-500 text-yellow-400 hover:bg-yellow-900 font-mono"
                        >
                          DISMISS
                        </Button>
                        <Button
                          onClick={() => handleReportAction(report.id, 'resolve')}
                          variant="outline"
                          size="sm"
                          className="border-green-500 text-green-400 hover:bg-green-900 font-mono"
                        >
                          RESOLVE
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500 text-red-400 hover:bg-red-900 font-mono"
                            >
                              DELETE CONTENT
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-black border-red-400">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-red-400 font-mono">DELETE CONTENT</AlertDialogTitle>
                              <AlertDialogDescription className="text-red-300 font-mono">
                                This will permanently delete the reported {report.type}. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="font-mono">CANCEL</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteContent(report)}
                                disabled={isDeleting === report.id}
                                className="bg-red-900 hover:bg-red-800 font-mono disabled:opacity-50"
                              >
                                {isDeleting === report.id ? 'DELETING...' : 'DELETE'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <Card className="bg-black border-green-400">
              <CardHeader>
                <CardTitle className="text-green-400 font-mono">CONTENT MANAGEMENT</CardTitle>
                <CardDescription className="text-green-600 font-mono">
                  Manage posts and comments across the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-green-300 font-mono text-sm">
                  Content management features coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card className="bg-black border-green-400">
              <CardHeader>
                <CardTitle className="text-green-400 font-mono">PLATFORM ANALYTICS</CardTitle>
                <CardDescription className="text-green-600 font-mono">
                  Platform usage and engagement metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-green-300 font-mono text-sm">
                  Analytics dashboard coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
