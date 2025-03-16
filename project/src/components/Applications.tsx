import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, MapPin, Briefcase, Award, Star } from 'lucide-react';
import { Application } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface ApplicationsProps {
  jobId: string;
  onClose: () => void;
  showRating?: boolean;
  onRate?: (workerId: string, rating: number) => void;
  showAcceptedOnly?: boolean;
}

export default function Applications({ jobId, onClose, showRating, onRate, showAcceptedOnly }: ApplicationsProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [pendingCount, setPendingCount] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    loadApplications();
  }, [jobId, showAcceptedOnly]);

  const loadApplications = async () => {
    try {
      let query = supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          updated_at,
          job_id,
          worker_id,
          worker_rating,
          worker:profiles!worker_id (
            id,
            name,
            email,
            rating,
            completed_jobs,
            location,
            skills,
            avatar_url,
            bio
          )
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (showAcceptedOnly) {
        query = query.eq('status', 'accepted');
      }

      const { data, error } = await query;

      if (error) throw error;

      const transformedApplications = data?.map(app => ({
        id: app.id,
        jobId: app.job_id,
        workerId: app.worker_id,
        status: app.status,
        workerRating: app.worker_rating,
        createdAt: app.created_at,
        updatedAt: app.updated_at,
        worker: app.worker ? {
          id: app.worker.id,
          name: app.worker.name,
          email: app.worker.email,
          role: 'worker',
          rating: app.worker.rating || 100,
          completedJobs: app.worker.completed_jobs || 0,
          location: app.worker.location || t('jobs.noLocation'),
          skills: app.worker.skills || [],
          avatar: app.worker.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?fit=facearea&facepad=2&w=256&h=256&q=80',
          bio: app.worker.bio || t('jobs.noBio')
        } : null
      })) || [];

      setApplications(transformedApplications);
      setPendingCount(transformedApplications.filter(app => app.status === 'pending').length);

      const initialRatings: Record<string, number> = {};
      transformedApplications.forEach(app => {
        if (app.worker && !app.workerRating) {
          initialRatings[app.worker.id] = 0;
        }
      });
      setRatings(initialRatings);
    } catch (error: any) {
      console.error('Error loading applications:', error);
      toast.error(t('jobs.loadApplicationsError'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      const updatedApplications = applications.map(app => 
        app.id === applicationId ? { ...app, status } : app
      );
      setApplications(updatedApplications);
      setPendingCount(updatedApplications.filter(app => app.status === 'pending').length);

      toast.success(t(`jobs.${status}`));
    } catch (error: any) {
      console.error('Error updating application:', error);
      toast.error(t('jobs.updateApplicationError'));
    }
  };

  const handleRating = async (workerId: string) => {
    const rating = ratings[workerId];
    if (!rating) {
      toast.error(t('jobs.selectRating'));
      return;
    }

    try {
      const { error } = await supabase
        .from('applications')
        .update({ worker_rating: rating })
        .eq('job_id', jobId)
        .eq('worker_id', workerId);

      if (error) throw error;

      setApplications(applications.map(app => 
        app.worker?.id === workerId ? { ...app, workerRating: rating } : app
      ));

      toast.success(t('jobs.ratingSubmitted'));
    } catch (error: any) {
      toast.error(t('jobs.ratingError'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {showRating ? t('jobs.rateWorkers') : 
               showAcceptedOnly ? t('jobs.acceptedWorkers') : 
               t('jobs.applications')}
              {!showRating && !showAcceptedOnly && pendingCount > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({pendingCount} {t('jobs.pending').toLowerCase()})
                </span>
              )}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {showAcceptedOnly ? t('jobs.noAcceptedWorkers') : t('jobs.noApplications')}
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map(application => (
                <div
                  key={application.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={application.worker?.avatar}
                        alt={application.worker?.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {application.worker?.name}
                        </h3>
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-1" />
                            {application.worker?.location}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Award className="h-4 w-4 mr-1 text-blue-600" />
                            {t('jobs.rating')}: {application.worker?.rating}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Briefcase className="h-4 w-4 mr-1" />
                            {application.worker?.completedJobs || 0} {t('jobs.completedJobs')}
                          </div>
                        </div>
                      </div>
                    </div>
                    {!showRating && !showAcceptedOnly && application.status === 'pending' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleStatusUpdate(application.id, 'accepted')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                          title={t('jobs.accept')}
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(application.id, 'rejected')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                          title={t('jobs.reject')}
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {application.worker?.bio && application.worker.bio !== t('jobs.noBio') && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">{t('jobs.about')}</h4>
                      <p className="text-sm text-gray-600">{application.worker.bio}</p>
                    </div>
                  )}

                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">{t('jobs.skills')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {application.worker?.skills && application.worker.skills.length > 0 ? (
                        application.worker.skills.map(skill => (
                          <span
                            key={skill}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">{t('jobs.noSkills')}</span>
                      )}
                    </div>
                  </div>

                  {showRating && !application.workerRating && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">{t('jobs.rateWorker')}</h4>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => setRatings(prev => ({ ...prev, [application.worker!.id]: rating }))}
                            className={`p-1 rounded-full transition-colors ${
                              ratings[application.worker!.id] >= rating
                                ? 'text-yellow-400 hover:text-yellow-500'
                                : 'text-gray-300 hover:text-gray-400'
                            }`}
                          >
                            <Star className="h-6 w-6 fill-current" />
                          </button>
                        ))}
                        <button
                          onClick={() => handleRating(application.worker!.id)}
                          className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                        >
                          {t('jobs.submitRating')}
                        </button>
                      </div>
                    </div>
                  )}

                  {application.workerRating && (
                    <div className="mt-4 border-t pt-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Star className="h-4 w-4 mr-1 text-yellow-400" />
                        {t('jobs.rated')}: {application.workerRating} / 5
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}