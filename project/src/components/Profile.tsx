import React, { useState, useEffect } from 'react';
import { User, ProfileFormData } from '../types';
import { supabase } from '../lib/supabase';
import { MapPin, Phone, Home, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import SkillsSelect from './SkillsSelect';

interface ProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

export default function Profile({ user, onUpdate }: ProfileProps) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const [formData, setFormData] = useState<ProfileFormData>({
    name: user.name,
    location: user.location || '',
    phone: user.phone || '',
    address: user.address || '',
    bio: user.bio || '',
    skills: user.skills || [],
  });

  useEffect(() => {
    // Load visibility setting
    const loadVisibility = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_visible')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setIsVisible(data.is_visible);
      }
    };

    loadVisibility();
  }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          location: formData.location,
          phone: formData.phone,
          address: formData.address,
          bio: formData.bio,
          skills: formData.skills,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      onUpdate({
        ...user,
        name: formData.name,
        location: formData.location,
        phone: formData.phone,
        address: formData.address,
        bio: formData.bio,
        skills: formData.skills,
      });

      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error('Error updating profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_visible: !isVisible })
        .eq('id', user.id);

      if (error) throw error;

      setIsVisible(!isVisible);
      toast.success(`Profile is now ${!isVisible ? 'visible' : 'hidden'} to other workers`);
    } catch (error: any) {
      toast.error('Error updating visibility: ' + error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center">
            <img
              src={user.avatar}
              alt={user.name}
              className="h-20 w-20 rounded-full"
            />
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user.role === 'worker' && (
              <button
                onClick={toggleVisibility}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isVisible 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {isVisible ? (
                  <>
                    <Eye className="h-4 w-4" />
                    Visible to Community
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Hidden from Community
                  </>
                )}
              </button>
            )}
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            {user.role === 'worker' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills (hold Ctrl/Cmd to select multiple)
                </label>
                <SkillsSelect
                  selectedSkills={formData.skills}
                  onChange={skills => setFormData({ ...formData, skills })}
                />
              </div>
            )}

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {formData.bio ? (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">About</h3>
                <p className="text-gray-600">{formData.bio}</p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">About</h3>
                <p className="text-gray-600">-</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{formData.location || '-'}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Phone className="h-5 w-5 mr-2" />
                  <span>{formData.phone || '-'}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Home className="h-5 w-5 mr-2" />
                  <span>{formData.address || '-'}</span>
                </div>
              </div>

              {user.role === 'worker' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills && formData.skills.length > 0 ? (
                      formData.skills.map(skill => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{user.completedJobs}</div>
                  <div className="text-sm text-gray-500">Completed Jobs</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{user.rating}</div>
                  <div className="text-sm text-gray-500">Rating</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}