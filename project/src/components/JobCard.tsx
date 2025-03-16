import React, { useState } from 'react';
import { MapPin, Clock, DollarSign, Mail, Phone, Star } from 'lucide-react';
import { Job } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import Applications from './Applications';
import { useTranslation } from 'react-i18next';

interface JobCardProps {
  job: Job;
  isEmployer: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  hideApply?: boolean;
  applicationStatus?: string;
  onApply?: () => void;
  onStatusChange?: () => void;
  isPublic?: boolean;
}

export default function JobCard({ 
  job, 
  isEmployer, 
  onEdit, 
  onDelete,
  hideApply = false,
  applicationStatus,
  onApply,
  onStatusChange,
  isPublic = false
}: JobCardProps) {
  const [showApplications, setShowApplications] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const { t } = useTranslation();

  const handleApply = async () => {
    if (isPublic) {
      toast.error(t('jobs.signInToApply'));
      return;
    }

    try {
      setApplying(true);
      const { error } = await supabase
        .from('applications')
        .insert([{
          job_id: job.id,
          worker_id: (await supabase.auth.getUser()).data.user?.id,
        }]);

      if (error) {
        if (error.code === '23505') {
          throw new Error(t('jobs.alreadyApplied'));
        }
        throw error;
      }

      toast.success(t('jobs.applicationSubmitted'));
      onApply?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setApplying(false);
    }
  };

  const handleStatusChange = async (newStatus: 'closed' | 'completed') => {
    try {
      const { data: pendingApps, error: countError } = await supabase
        .from('applications')
        .select('id', { count: 'exact' })
        .eq('job_id', job.id)
        .eq('status', 'pending');

      if (countError) throw countError;

      if (pendingApps && pendingApps.length > 0) {
        throw new Error(t('jobs.pendingApplicationsError'));
      }

      const { error } = await supabase
        .from('jobs')
        .update({ 
          status: newStatus,
          ...(newStatus === 'completed' ? { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', job.id);

      if (error) throw error;

      toast.success(t(`jobs.${newStatus}Success`));
      onStatusChange?.();

      if (newStatus === 'completed') {
        setShowRating(true);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      closed: 'bg-gray-100 text-gray-800',
      completed: 'bg-blue-100 text-blue-800',
      open: 'bg-green-100 text-green-800'
    };

    const statusText = status === 'open' ? 'Open' :
                      status === 'closed' ? 'Closed' :
                      status === 'completed' ? 'Completed' :
                      status === 'pending' ? 'Pending' :
                      status === 'accepted' ? 'Accepted' :
                      'Rejected';

    return (
      <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusColors[status as keyof typeof statusColors]}`}>
        {statusText}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <MapPin className="h-4 w-4 mr-1" />
              {job.location}
              <span className="mx-2">•</span>
              <Clock className="h-4 w-4 mr-1" />
              {new Date(job.created_at).toLocaleDateString()}
              {isEmployer && (
                <>
                  <span className="mx-2">•</span>
                  <span>{job.applications} {t('jobs.applications')}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <span className="font-semibold text-green-600">${job.wage}/hr</span>
          </div>
        </div>

        <p className="mt-4 text-gray-600 line-clamp-2">{job.description}</p>

        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {job.required_skills?.map((skill) => (
              <span
                key={skill}
                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
              >
                {skill}
              </span>
            ))}
            {job.recommended_skills?.map((skill) => (
              <span
                key={skill}
                className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {!isEmployer ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <img
                    src={job.employer?.avatar}
                    alt={job.employer?.name}
                    className="h-8 w-8 rounded-full"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{job.employer?.name}</p>
                    <p className="text-xs text-gray-500">{t('jobs.rating')}: {job.employer?.rating}</p>
                  </div>
                </div>
                {applicationStatus === 'accepted' && (
                  <button
                    onClick={() => setShowContact(!showContact)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    {showContact ? t('jobs.hideContact') : t('jobs.showContact')}
                  </button>
                )}
              </div>
              {!hideApply && job.status === 'open' ? (
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {applying ? t('jobs.applying') : t('jobs.applyNow')}
                </button>
              ) : applicationStatus && (
                <div className="flex items-center">
                  {getStatusBadge(applicationStatus)}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {job.status === 'open' && (
                  <button
                    onClick={() => setShowApplications(true)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {t('jobs.viewApplications')} ({job.applications || 0})
                  </button>
                )}
                {job.status === 'closed' && (
                  <button
                    onClick={() => {
                      setShowApplications(true);
                      setShowRating(false);
                    }}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {t('jobs.viewWorkers')}
                  </button>
                )}
                {job.status === 'completed' && (
                  <button
                    onClick={() => {
                      setShowApplications(true);
                      setShowRating(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {t('jobs.rateWorkers')}
                  </button>
                )}
                {job.status === 'open' && (
                  <button
                    onClick={() => handleStatusChange('closed')}
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {t('jobs.closeJob')}
                  </button>
                )}
                {job.status === 'closed' && (
                  <button
                    onClick={() => handleStatusChange('completed')}
                    className="text-green-600 hover:text-green-800 transition-colors"
                  >
                    {t('jobs.markCompleted')}
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {getStatusBadge(job.status)}
                {job.status === 'open' && (
                  <>
                    <button
                      onClick={onEdit}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {t('jobs.editJob')}
                    </button>
                    <button
                      onClick={onDelete}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      {t('jobs.deleteJob')}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {showApplications && (
          <Applications
            jobId={job.id}
            onClose={() => {
              setShowApplications(false);
              setShowRating(false);
            }}
            showRating={showRating}
            showAcceptedOnly={job.status === 'closed' || job.status === 'completed'}
          />
        )}
      </div>

      {/* Contact Info Panel */}
      {!isEmployer && applicationStatus === 'accepted' && showContact && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-fadeIn">
          <h4 className="font-medium text-gray-900 mb-3">{t('jobs.contactInformation')}</h4>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Mail className="h-4 w-4 mr-2 text-gray-500" />
              <a 
                href={`mailto:${job.employer?.email}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {job.employer?.email}
              </a>
            </div>
            <div className="flex items-center text-sm">
              <Phone className="h-4 w-4 mr-2 text-gray-500" />
              {job.employer?.phone ? (
                <a 
                  href={`tel:${job.employer.phone}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {job.employer.phone}
                </a>
              ) : (
                <span className="text-gray-500">-</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}