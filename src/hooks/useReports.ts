import { useState, useEffect } from 'react';
import { supabase, Report } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export const useReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReports = async () => {
    try {
      console.log('Fetching reports from database...');
      setLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched reports:', data);
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error loading reports",
        description: "Failed to load reports. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createReport = async (
    targetType: 'confession' | 'comment',
    targetId: string,
    reason: string,
    customReason?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .insert({
          target_type: targetType,
          target_id: targetId,
          reason,
          custom_reason: customReason
        })
        .select()
        .single();

      if (error) throw error;

      setReports(prev => [data, ...prev]);

      toast({
        title: "Report Submitted 🚨",
        description: `${targetType === 'confession' ? 'Post' : 'Comment'} reported for: ${reason}. Our moderation team will review this shortly.`,
      });

      return data;
    } catch (error) {
      console.error('Error creating report:', error);
      toast({
        title: "Error submitting report",
        description: "Failed to submit your report. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateReportStatus = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      console.log(`Updating report ${reportId} to status: ${status}`);
      
      const { error } = await supabase
        .from('reports')
        .update({ status })
        .eq('id', reportId);

      if (error) throw error;

      console.log(`Successfully updated report ${reportId} in database`);

      setReports(prev => prev.map(report => 
        report.id === reportId ? { ...report, status } : report
      ));

      console.log(`Updated local state for report ${reportId}`);

      toast({
        title: "Report Updated",
        description: `Report has been ${status}.`,
      });
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: "Error updating report",
        description: "Failed to update report status. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteContent = async (report: Report) => {
    try {
      const tableName = report.target_type === 'confession' ? 'confessions' : 'comments';
      
      // Delete the content first
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', report.target_id);

      if (deleteError) throw deleteError;

      // Update report status to resolved
      const { error: updateError } = await supabase
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', report.id);

      if (updateError) throw updateError;

      // Update local state immediately
      setReports(prev => prev.map(r => 
        r.id === report.id ? { ...r, status: 'resolved' as const } : r
      ));

      toast({
        title: "Content Deleted",
        description: `${report.target_type === 'confession' ? 'Post' : 'Comment'} has been permanently deleted.`,
      });
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error deleting content",
        description: "Failed to delete content. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchReports();

    // Set up real-time subscription
    const subscription = supabase
      .channel('reports_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        (payload) => {
          console.log('Reports table change detected:', payload);
          // Add a small delay to ensure database consistency
          setTimeout(() => {
            fetchReports();
          }, 500);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    reports,
    loading,
    createReport,
    updateReportStatus,
    deleteContent,
    refetch: fetchReports
  };
};