import React, { useState, useEffect } from 'react';
import { Job, Application } from '../types';
import JobCard from './JobCard';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AppliedJobs() {
  const [activeJobs, setActiveJobs] = useState<JobWithApplication[]>([]);
  const [completedJobs, setCompletedJobs] = useState<JobWithApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const { t } = useTranslation();

  interface JobWithApplication extends Job {
    application_status: string;
    employer_rating?: number;
  }

  useEffect(() => {
    loadAppliedJobs();
  }, []);

  const loadAppliedJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: applications, error } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          job:jobs!inner(
            id,
            title,
            description,
            employer_id,
            category,
            location,
            wage,
            required_skills,
            recommended_skills,
            status,
            created_at,
            applications,
            employer:profiles!employer_id(
              id,
              name,
              email,
              phone,
              rating,
              avatar_url
            )
          )
        `)
        .eq('worker_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get existing ratings
      const { data: existingRatings } = await supabase
        .from('employer_ratings')
        .select('job_id, rating')
        .eq('worker_id', user.id);

      const ratingsByJob = existingRatings?.reduce((acc, curr) => {
        acc[curr.job_id] = curr.rating;
        return acc;
      }, {} as Record<string, number>) || {};

      const transformedJobs = applications.map(app => ({
        ...app.job,
        employer: app.job.employer ? {
          id: app.job.employer.id,
          name: app.job.employer.name,
          email: app.job.employer.email,
          phone: app.job.employer.phone,
          role: 'employer',
          rating: app.job.employer.rating || 0,
          completedJobs: 0,
          location: '',
          skills: [],
          avatar: app.job.employer.avatar_url || 'https://media.licdn.com/dms/image/v2/D4E12AQEud3Ll5MI7cQ/article-inline_image-shrink_1000_1488/article-inline_image-shrink_1000_1488/0/1660833954461?e=1747267200&v=beta&t=xntcRxVZ7GjlG8YfVdGM3BU424kZLyz0lC6bjQJZ504'
        } : null,
        application_status: app.status,
        employer_rating: ratingsByJob[app.job.id]
      }));

      // Separate active and completed jobs
      const active = transformedJobs.filter(job => job.status !== 'completed');
      const completed = transformedJobs.filter(job => job.status === 'completed');

      setActiveJobs(active);
      setCompletedJobs(completed);
      setRatings(ratingsByJob);
    } catch (error: any) {
      console.error('Error loading applied jobs:', error);
      toast.error(t('jobs.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (jobId: string, employerId: string, rating: number) => {
    try {
      const { error } = await supabase
        .from('employer_ratings')
        .insert({
          job_id: jobId,
          employer_id: employerId,
          worker_id: (await supabase.auth.getUser()).data.user?.id,
          rating
        });

      if (error) throw error;

      // Update local state
      setCompletedJobs(prev => 
        prev.map(job => 
          job.id === jobId ? { ...job, employer_rating: rating } : job
        )
      );

      toast.success(t('jobs.ratingSubmitted'));
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      toast.error(t('jobs.ratingError'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const displayJobs = showCompleted ? completedJobs : activeJobs;

  return (
    <div className="space-y-6">
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => setShowCompleted(false)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            !showCompleted 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('jobs.activeJobs')} ({activeJobs.length})
        </button>
        <button
          onClick={() => setShowCompleted(true)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            showCompleted 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('jobs.completedJobs')} ({completedJobs.length})
        </button>
      </div>

      {displayJobs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {showCompleted ? t('jobs.noCompletedJobs') : t('jobs.noActiveApplications')}
          </h3>
          <p className="mt-2 text-gray-600">
            {showCompleted 
              ? t('jobs.completedJobsWillAppear')
              : t('jobs.startApplying')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayJobs.map((job) => (
            <div key={job.id} className="space-y-4">
              <JobCard
                job={job}
                isEmployer={false}
                hideApply={true}
                applicationStatus={job.application_status}
              />
              
              {/* Rating Section for Completed Jobs */}
              {job.status === 'completed' && job.application_status === 'accepted' && !job.employer_rating && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {t('jobs.rateEmployer')}
                  </h4>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleRating(job.id, job.employer!.id, rating)}
                        className="p-1 rounded-full transition-colors hover:bg-gray-100"
                      >
                        <Star 
                          className={`h-6 w-6 ${
                            rating <= (ratings[job.id] || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Show Rating if Already Rated */}
              {job.employer_rating && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                    {t('jobs.employerRated')}: {job.employer_rating} / 5
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}