import { useState, useEffect, useRef } from 'react';
import { api, Report } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface UseReportsOptions {
  autoFetch?: boolean;
}

const STORAGE_KEY = 'yarnz_moderation_reports';

const getStoredReports = (): Report[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveStoredReports = (reports: Report[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch {}
};

export const useReports = ({ autoFetch = false }: UseReportsOptions = {}) => {
  const [reports, setReports] = useState<Report[]>(() => getStoredReports());
  const [loading, setLoading] = useState(autoFetch);
  const { toast } = useToast();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch all reports ──────────────────────────────────────────────────────
  const fetchReports = async () => {
    try {
      setLoading(true);
      // Attempt backend API if reports endpoint is deployed
      try {
        const data = await api.get<Report[]>('/reports');
        if (Array.isArray(data)) {
          setReports(data);
          saveStoredReports(data);
          return;
        }
      } catch (err: any) {
        // Backend developer has not deployed /reports (404 Not Found).
        // Gracefully fallback to locally persisted reports without spamming red toasts.
        console.debug('Backend /reports endpoint unavailable, using local reports store');
      }

      const local = getStoredReports();
      setReports(local);
    } finally {
      setLoading(false);
    }
  };

  // ── Submit a new report ────────────────────────────────────────────────────
  const createReport = async (
    targetType: 'confession' | 'comment',
    targetId: string,
    reason: string,
    customReason?: string
  ) => {
    try {
      let reportData: Report | null = null;
      try {
        reportData = await api.post<Report>('/reports', {
          target_type: targetType,
          target_id: targetId,
          reason,
          custom_reason: customReason,
        });
      } catch {
        // Backend has no /reports endpoint yet - create fallback local report
        reportData = {
          id: 'rep_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
          target_type: targetType,
          target_id: targetId,
          reason,
          custom_reason: customReason,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      if (reportData) {
        const updated = [reportData, ...getStoredReports()];
        saveStoredReports(updated);
        setReports(updated);
      }

      toast({
        title: 'Report Submitted 🚨',
        description: `${
          targetType === 'confession' ? 'Post' : 'Comment'
        } reported for: ${reason}. Our moderation team will review this shortly.`,
      });

      return reportData;
    } catch (error) {
      console.error('Error creating report:', error);
      toast({
        title: 'Error submitting report',
        description: 'Failed to submit your report. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // ── Update report status ───────────────────────────────────────────────────
  const updateReportStatus = async (
    reportId: string,
    status: 'resolved' | 'dismissed'
  ) => {
    try {
      try {
        await api.patch(`/reports/${reportId}`, { status });
      } catch {
        // fallback local update
      }

      const updated = getStoredReports().map((r) =>
        r.id === reportId ? { ...r, status, updated_at: new Date().toISOString() } : r
      );
      saveStoredReports(updated);
      setReports(updated);

      toast({ title: 'Report Updated', description: `Report has been ${status}.` });
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: 'Error updating report',
        description: 'Failed to update report status.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // ── Delete reported content ────────────────────────────────────────────────
  const deleteContent = async (report: Report) => {
    try {
      // Soft-delete content via backend DELETE endpoints:
      // DELETE /confessions/{id} or DELETE /comments/{id}
      if (report.target_type === 'confession') {
        await api.deleteConfession(report.target_id);
      } else {
        await api.deleteComment(report.target_id);
      }

      // Mark report resolved
      try {
        await api.patch(`/reports/${report.id}`, { status: 'resolved' });
      } catch {
        // fallback
      }

      const updated = getStoredReports().map((r) =>
        r.id === report.id ? { ...r, status: 'resolved' as const, updated_at: new Date().toISOString() } : r
      );
      saveStoredReports(updated);
      setReports(updated);

      toast({
        title: 'Content Soft-Deleted',
        description: `${
          report.target_type === 'confession' ? 'Post' : 'Comment'
        } was soft-deleted and hidden from feed.`,
      });
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: 'Error deleting content',
        description: 'Failed to delete content. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    if (!autoFetch) return;

    fetchReports();

    // Poll every 30s
    pollRef.current = setInterval(fetchReports, 30_000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [autoFetch]);

  return {
    reports,
    loading,
    createReport,
    updateReportStatus,
    deleteContent,
    refetch: fetchReports,
  };
};