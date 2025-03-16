import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { User } from '../types';
import { useTranslation } from 'react-i18next';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
  onCancel?: () => void;
}

export default function Auth({ onAuthSuccess, onCancel }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'worker' | 'employer'>('worker');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const createProfile = async (userId: string, userEmail: string, userRole: 'worker' | 'employer') => {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          email: userEmail,
          role: userRole,
          name: userEmail.split('@')[0],
          rating: 0,
          completed_jobs: 0,
          skills: [],
        },
      ])
      .select()
      .single();

    if (profileError) {
      throw profileError;
    }

    return profile;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message === 'Invalid login credentials') {
            throw new Error('Invalid email or password');
          }
          throw error;
        }

        if (data.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          let userProfile = profile;

          // If profile doesn't exist, create it using the role from user metadata
          if (profileError && profileError.code === 'PGRST116') {
            const metadata = data.user.user_metadata;
            const userRole = metadata?.role || 'worker';
            userProfile = await createProfile(data.user.id, data.user.email!, userRole);
          } else if (profileError) {
            throw profileError;
          }

          onAuthSuccess({
            id: data.user.id,
            email: data.user.email!,
            name: userProfile.name || email.split('@')[0],
            role: userProfile.role,
            rating: userProfile.rating || 0,
            completedJobs: userProfile.completed_jobs || 0,
            location: userProfile.location || '',
            skills: userProfile.skills || [],
            avatar: userProfile.avatar_url || 'https://media.licdn.com/dms/image/v2/D4E12AQEud3Ll5MI7cQ/article-inline_image-shrink_1000_1488/article-inline_image-shrink_1000_1488/0/1660833954461?e=1747267200&v=beta&t=xntcRxVZ7GjlG8YfVdGM3BU424kZLyz0lC6bjQJZ504',
          });
        }
      } else {
        // Validate password
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role,
            },
          },
        });

        if (error) {
          if (error.message === 'User already registered') {
            throw new Error('An account with this email already exists. Please sign in instead.');
          }
          throw error;
        }

        if (data.user) {
          await createProfile(data.user.id, data.user.email!, role);
          toast.success('Account created successfully! You can now sign in.');
          setIsLogin(true); // Switch to login view
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white shadow-md rounded-lg p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            {isLogin ? t('auth.signIn') : t('auth.signUp')}
          </h2>
          {!isLogin && (
            <p className="text-sm text-gray-600 mb-6">
              Password must be at least 6 characters long
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.role.select')}
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'worker' | 'employer')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="worker">{t('auth.role.worker')}</option>
                <option value="employer">{t('auth.role.employer')}</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-between space-x-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {t('common.cancel')}
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.loading') : isLogin ? t('auth.signIn') : t('auth.signUp')}
            </button>
          </div>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}