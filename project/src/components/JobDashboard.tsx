import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Job } from '../types';
import JobForm from './JobForm';
import JobCard from './JobCard';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function JobDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      // First get the jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          *,
          employer:profiles(*)
        `)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // Then get the application counts for each job
      const jobsWithApplications = await Promise.all(
        (jobsData || []).map(async (job) => {
          const { count, error: countError } = await supabase
            .from('applications')
            .select('*', { count: 'exact' })
            .eq('job_id', job.id);

          if (countError) throw countError;

          return {
            ...job,
            applications: count || 0
          };
        })
      );

      setJobs(jobsWithApplications);
    } catch (error: any) {
      toast.error('Failed to load jobs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setShowForm(true);
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;
      
      setJobs(jobs.filter(job => job.id !== jobId));
      toast.success('Job deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete job: ' + error.message);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingJob(null);
  };

  const handleFormSubmit = async () => {
    await loadJobs();
    handleFormClose();
  };

  const handleStatusChange = async (jobId: string, newStatus: 'closed' | 'completed') => {
    // Update local state immediately
    setJobs(prevJobs => 
      prevJobs.map(job => 
        job.id === jobId 
          ? { 
              ...job, 
              status: newStatus,
              ...(newStatus === 'completed' ? { completed_at: new Date().toISOString() } : {})
            }
          : job
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Post New Job
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">No jobs posted yet</h3>
          <p className="mt-2 text-gray-600">Click the button above to post your first job.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isEmployer={true}
              onEdit={() => handleEdit(job)}
              onDelete={() => handleDelete(job.id)}
              onStatusChange={() => handleStatusChange(job.id, job.status === 'open' ? 'closed' : 'completed')}
            />
          ))}
        </div>
      )}

      {showForm && (
        <JobForm
          job={editingJob}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}