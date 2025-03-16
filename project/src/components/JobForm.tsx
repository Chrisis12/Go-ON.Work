import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Job, JobFormData } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import SkillsSelect from './SkillsSelect';

interface JobFormProps {
  job?: Job | null;
  onClose: () => void;
  onSubmit: () => void;
}

const CATEGORIES = [
  'Domestic workers',
  'Construction',
  'Specialised',
  'Farming',
  'Waste collection',
  'Cleaning',
  'General'
];

export default function JobForm({ job, onClose, onSubmit }: JobFormProps) {
  const [formData, setFormData] = useState<JobFormData>({
    title: job?.title || '',
    description: job?.description || '',
    category: job?.category || CATEGORIES[0],
    location: job?.location || '',
    wage: job?.wage || '',
    required_skills: job?.required_skills || [],
    recommended_skills: job?.recommended_skills || []
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const jobData = {
        ...formData,
        wage: parseFloat(formData.wage.toString()) || 0
      };

      if (job) {
        // Update existing job
        const { error } = await supabase
          .from('jobs')
          .update({
            ...jobData,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);

        if (error) throw error;
        toast.success('Job updated successfully');
      } else {
        // Create new job
        const { error } = await supabase
          .from('jobs')
          .insert([{
            ...jobData,
            employer_id: user.id,
            status: 'open',
            applications: 0
          }]);

        if (error) throw error;
        toast.success('Job posted successfully');
      }

      onSubmit();
    } catch (error: any) {
      toast.error('Failed to save job: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {job ? 'Edit Job' : 'Post New Job'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="e.g., Experienced Plumber Needed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                required
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Describe the job requirements and responsibilities..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Hourly Wage ($)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.wage}
                  onChange={e => setFormData({ ...formData, wage: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="e.g., New York, NY"
              />
            </div>

            <div className="relative z-20">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Required Skills
              </label>
              <SkillsSelect
                selectedSkills={formData.required_skills}
                onChange={skills => setFormData({ ...formData, required_skills: skills })}
                placeholder="Select required skills..."
              />
            </div>

            <div className="relative z-10">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recommended Skills
              </label>
              <SkillsSelect
                selectedSkills={formData.recommended_skills}
                onChange={skills => setFormData({ ...formData, recommended_skills: skills })}
                placeholder="Select recommended skills..."
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : job ? 'Update Job' : 'Post Job'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}