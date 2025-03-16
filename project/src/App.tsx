import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import JobList from './components/JobList';
import JobDashboard from './components/JobDashboard';
import Profile from './components/Profile';
import Auth from './components/Auth';
import AppliedJobs from './components/AppliedJobs';
import PastWorkers from './components/PastWorkers';
import UnderConstruction from './components/UnderConstruction';
import Settings from './components/Settings';
import Community from './components/Community';
import { Menu } from 'lucide-react';
import { User } from './types';
import { supabase } from './lib/supabase';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import './i18n';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<'jobs' | 'profile' | 'applied' | 'past-workers' | 'notifications' | 'settings' | 'community'>('jobs');
  const { t } = useTranslation();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setCurrentUser({
            id: session.user.id,
            email: session.user.email!,
            name: profile.name || session.user.email!.split('@')[0],
            role: profile.role,
            rating: profile.rating || 0,
            completedJobs: profile.completed_jobs || 0,
            location: profile.location || '',
            skills: profile.skills || [],
            avatar: profile.avatar_url || 'https://media.licdn.com/dms/image/v2/D4E12AQEud3Ll5MI7cQ/article-inline_image-shrink_1000_1488/article-inline_image-shrink_1000_1488/0/1660833954461?e=1747267200&v=beta&t=xntcRxVZ7GjlG8YfVdGM3BU424kZLyz0lC6bjQJZ504',
            phone: profile.phone,
            address: profile.address,
            bio: profile.bio,
          });
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setShowAuth(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setCurrentUser(null);
      setShowAuth(true);
    }
  };

  const getViewTitle = () => {
    if (currentView === 'profile') return t('navigation.profile');
    if (currentView === 'applied') return t('navigation.appliedJobs');
    if (currentView === 'past-workers') return t('navigation.pastWorkers');
    if (currentView === 'notifications') return t('navigation.notifications');
    if (currentView === 'settings') return t('navigation.settings');
    if (currentView === 'community') return 'Community';
    return currentUser?.role === 'worker' ? t('navigation.findJobs') : t('navigation.myJobs');
  };

  // Show JobList for non-authenticated users who haven't clicked sign in
  if (!currentUser && !showAuth) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  {t('navigation.findJobs')}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800"
                >
                  {t('auth.signIn')}
                </button>
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t('auth.signUp')}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <JobList isPublic />
        </div>
        <Toaster position="top-right" />
      </div>
    );
  }

  // Show auth modal for users who clicked sign in or were signed out
  if (showAuth) {
    return (
      <>
        <Auth 
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            setShowAuth(false);
          }} 
          onCancel={() => setShowAuth(false)} 
        />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        user={currentUser!}
        onLogout={handleLogout}
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      
      <div className="flex-1 lg:ml-64">
        {/* App Bar */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-2">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {getViewTitle()}
              </h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto p-8">
          {currentView === 'profile' ? (
            <Profile user={currentUser!} onUpdate={setCurrentUser} />
          ) : currentView === 'applied' ? (
            <AppliedJobs />
          ) : currentView === 'past-workers' ? (
            <PastWorkers />
          ) : currentView === 'notifications' ? (
            <UnderConstruction />
          ) : currentView === 'settings' ? (
            <Settings />
          ) : currentView === 'community' ? (
            <Community />
          ) : currentUser!.role === 'worker' ? (
            <JobList />
          ) : (
            <JobDashboard />
          )}
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

export default App