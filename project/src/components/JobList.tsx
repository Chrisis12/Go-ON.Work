import React, { useState, useEffect } from 'react';
import { Job } from '../types';
import JobCard from './JobCard';
import SearchFilters from './SearchFilters';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface JobListProps {
  isPublic?: boolean;
}

export default function JobList({ isPublic = false }: JobListProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [wageFilter, setWageFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOtherJobs, setShowOtherJobs] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    loadJobs();
    if (!isPublic) {
      loadAppliedJobs();
    }
  }, [isPublic, retryCount]);

  const loadJobs = async () => {
    try {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
          *,
          employer:profiles!employer_id (
            id,
            name,
            email,
            phone,
            rating,
            avatar_url
          )
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) {
        // If it's a connection error, retry after a delay
        if (error.message.includes('Failed to fetch') && retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000 * (retryCount + 1)); // Exponential backoff
          return;
        }
        throw error;
      }
      
      const transformedJobs = jobs?.map(job => ({
        ...job,
        employer: job.employer ? {
          id: job.employer.id,
          name: job.employer.name,
          email: job.employer.email,
          phone: job.employer.phone,
          role: 'employer',
          rating: job.employer.rating || 0,
          completedJobs: 0,
          location: '',
          skills: [],
          avatar: job.employer.avatar_url || 'https://media.licdn.com/dms/image/v2/D4E12AQEud3Ll5MI7cQ/article-inline_image-shrink_1000_1488/article-inline_image-shrink_1000_1488/0/1660833954461?e=1747267200&v=beta&t=xntcRxVZ7GjlG8YfVdGM3BU424kZLyz0lC6bjQJZ504'
        } : null
      })) || [];

      setJobs(transformedJobs);
      setRetryCount(0); // Reset retry count on success
    } catch (error: any) {
      console.error('Error loading jobs:', error);
      toast.error(t('jobs.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const loadAppliedJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: applications, error } = await supabase
        .from('applications')
        .select('job_id')
        .eq('worker_id', user.id);

      if (error) throw error;
      setAppliedJobIds(applications?.map(app => app.job_id) || []);
    } catch (error: any) {
      console.error('Failed to load applied jobs:', error);
    }
  };

  const handleJobApply = (jobId: string) => {
    setAppliedJobIds(prev => [...prev, jobId]);
  };

  const filterJobs = (jobs: Job[]) => {
    return jobs.filter(job => {
      const matchesSearch = !searchQuery || 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (!wageFilter) return true;

      const [min, max] = wageFilter === '20+' ? [20, Infinity] : wageFilter.split('-').map(Number);
      const wage = typeof job.wage === 'string' ? parseFloat(job.wage) : job.wage;
      return wage >= min && wage <= (max || Infinity);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const availableJobs = isPublic ? jobs : jobs.filter(job => !appliedJobIds.includes(job.id));
  const filteredJobs = filterJobs(availableJobs);
  const otherJobs = availableJobs.filter(job => !filteredJobs.includes(job));

  return (
    <div className="space-y-6">
      <SearchFilters 
        isEmployer={false} 
        onWageFilterChange={setWageFilter}
        onSearchChange={setSearchQuery}
      />
      
      {filteredJobs.length === 0 && otherJobs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{t('jobs.noJobsAvailable')}</h3>
          <p className="mt-2 text-gray-600">{t('jobs.checkBackLater')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filtered Jobs */}
          <div className="space-y-6">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isEmployer={false}
                onApply={() => handleJobApply(job.id)}
                isPublic={isPublic}
              />
            ))}
          </div>

          {/* Show/Hide Other Jobs Button */}
          {otherJobs.length > 0 && (wageFilter || searchQuery) && (
            <div className="flex justify-center">
              <button
                onClick={() => setShowOtherJobs(!showOtherJobs)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {showOtherJobs ? 'Hide other jobs' : `Show other jobs (${otherJobs.length})`}
              </button>
            </div>
          )}

          {/* Other Jobs */}
          {showOtherJobs && otherJobs.length > 0 && (
            <div className="space-y-6 pt-6 border-t">
              {otherJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isEmployer={false}
                  onApply={() => handleJobApply(job.id)}
                  isPublic={isPublic}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}