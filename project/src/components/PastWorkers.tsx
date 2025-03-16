import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface PastWorker extends User {
  jobCount: number;
}

export default function PastWorkers() {
  const [workers, setWorkers] = useState<PastWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    loadPastWorkers();
  }, []);

  const loadPastWorkers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // First get all jobs for this employer
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id')
        .eq('employer_id', user.id);

      if (jobsError) throw jobsError;
      if (!jobs || jobs.length === 0) {
        setWorkers([]);
        return;
      }

      const jobIds = jobs.map(job => job.id);

      // Then get all accepted applications for these jobs
      const { data: applications, error: appError } = await supabase
        .from('applications')
        .select(`
          status,
          job_id,
          worker:worker_id (
            id,
            name,
            email,
            rating,
            completed_jobs,
            skills,
            avatar_url,
            location
          )
        `)
        .eq('status', 'accepted')
        .in('job_id', jobIds);

      if (appError) throw appError;

      if (!applications || applications.length === 0) {
        setWorkers([]);
        return;
      }

      // Count unique workers and their jobs
      const workerMap = new Map<string, PastWorker>();
      
      applications.forEach(app => {
        if (!app.worker) return;
        
        const workerId = app.worker.id;
        if (workerMap.has(workerId)) {
          const worker = workerMap.get(workerId)!;
          worker.jobCount++;
        } else {
          workerMap.set(workerId, {
            id: app.worker.id,
            name: app.worker.name,
            email: app.worker.email,
            role: 'worker',
            rating: app.worker.rating || 100,
            completedJobs: app.worker.completed_jobs || 0,
            location: app.worker.location || '',
            skills: app.worker.skills || [],
            avatar: app.worker.avatar_url || 'https://media.licdn.com/dms/image/v2/D4E12AQEud3Ll5MI7cQ/article-inline_image-shrink_1000_1488/article-inline_image-shrink_1000_1488/0/1660833954461?e=1747267200&v=beta&t=xntcRxVZ7GjlG8YfVdGM3BU424kZLyz0lC6bjQJZ504',
            jobCount: 1
          });
        }
      });

      const workersList = Array.from(workerMap.values());
      setWorkers(workersList);
    } catch (error: any) {
      console.error('Error loading past workers:', error);
      toast.error(t('jobs.loadError'));
    } finally {
      setLoading(false);
    }
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
      {workers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{t('jobs.noAcceptedWorkers')}</h3>
          <p className="mt-2 text-gray-600">{t('jobs.noApplications')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workers.map((worker) => (
            <div
              key={worker.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start space-x-4">
                <img
                  src={worker.avatar}
                  alt={worker.name}
                  className="h-12 w-12 rounded-full"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{worker.name}</h3>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <span>{t('jobs.rating')}: {worker.rating}</span>
                    <span className="mx-2">•</span>
                    <Briefcase className="h-4 w-4 mr-1" />
                    <span>{worker.jobCount} {t('jobs.completedJobs')}</span>
                  </div>
                  {worker.skills && worker.skills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {worker.skills.map(skill => (
                        <span
                          key={skill}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}