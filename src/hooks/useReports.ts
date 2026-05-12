import { useState, useEffect, useRef } from 'react';
import { api, Report } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const useReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch all reports ──────────────────────────────────────────────────────
  const fetchReports = async () => {
    try {
      console.log('Fetching reports from API...');
      setLoading(true);
      const data = await api.get<Report[]>('/reports');
      console.log('Fetched reports:', data);
      setReports(data ?? []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: 'Error loading reports',
        description: 'Failed to load reports. Please try again.',
        variant: 'destructive',
      });
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
      const data = await api.post<Report>('/reports', {
        target_type: targetType,
        target_id: targetId,
        reason,
        custom_reason: customReason,
      });

      setReports((prev) => [data, ...prev]);

      toast({
        title: 'Report Submitted 🚨',
        description: `${
          targetType === 'confession' ? 'Post' : 'Comment'
        } reported for: ${reason}. Our moderation team will review this shortly.`,
      });

      return data;
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
      console.log(`Updating report ${reportId} to status: ${status}`);
      await api.patch(`/reports/${reportId}`, { status });

      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status } : r))
      );

      console.log(`Successfully updated report ${reportId}`);
      toast({ title: 'Report Updated', description: `Report has been ${status}.` });
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: 'Error updating report',
        description: 'Failed to update report status. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // ── Delete reported content ────────────────────────────────────────────────
  const deleteContent = async (report: Report) => {
    try {
      // DELETE /confessions/:id  or  DELETE /comments/:id
      const path =
        report.target_type === 'confession'
          ? `/confessions/${report.target_id}`
          : `/comments/${report.target_id}`;

      await api.delete(path);

      // Mark the report resolved
      await api.patch(`/reports/${report.id}`, { status: 'resolved' });

      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id ? { ...r, status: 'resolved' as const } : r
        )
      );

      toast({
        title: 'Content Deleted',
        description: `${
          report.target_type === 'confession' ? 'Post' : 'Comment'
        } has been permanently deleted.`,
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
    fetchReports();

    // Poll every 15 seconds (replaces Supabase real-time channel)
    pollRef.current = setInterval(fetchReports, 15_000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  return {
    reports,
    loading,
    createReport,
    updateReportStatus,
    deleteContent,
    refetch: fetchReports,
  };
};