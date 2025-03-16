import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { Mail, Phone, MapPin, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function Community() {
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'worker')
        .eq('is_visible', true)
        .neq('id', currentUser.id); // Exclude current user

      if (error) throw error;

      const transformedWorkers = data.map(worker => ({
        id: worker.id,
        name: worker.name,
        email: worker.email,
        role: worker.role,
        rating: worker.rating || 0,
        completedJobs: worker.completed_jobs || 0,
        location: worker.location || '',
        skills: worker.skills || [],
        avatar: worker.avatar_url || 'https://media.licdn.com/dms/image/v2/D4E12AQEud3Ll5MI7cQ/article-inline_image-shrink_1000_1488/article-inline_image-shrink_1000_1488/0/1660833954461?e=1747267200&v=beta&t=xntcRxVZ7GjlG8YfVdGM3BU424kZLyz0lC6bjQJZ504',
        phone: worker.phone,
      }));

      setWorkers(transformedWorkers);
    } catch (error: any) {
      console.error('Error loading workers:', error);
      toast.error('Failed to load workers');
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Worker Community</h2>
        <p className="text-gray-600">
          Connect with other workers in the community. These workers have made their profiles visible to share their expertise and contact information.
        </p>
      </div>

      {workers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">No visible worker profiles</h3>
          <p className="mt-2 text-gray-600">
            Workers who make their profiles visible will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {workers.map((worker) => (
            <div
              key={worker.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start space-x-4">
                <img
                  src={worker.avatar}
                  alt={worker.name}
                  className="h-16 w-16 rounded-full"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{worker.name}</h3>
                  
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {worker.location || 'No location specified'}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Briefcase className="h-4 w-4 mr-2" />
                      {worker.completedJobs} completed jobs
                    </div>
                  </div>

                  {worker.skills && worker.skills.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {worker.skills.map(skill => (
                          <span
                            key={skill}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Contact Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        <a 
                          href={`mailto:${worker.email}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {worker.email}
                        </a>
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        {worker.phone ? (
                          <a 
                            href={`tel:${worker.phone}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {worker.phone}
                          </a>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}