import React from 'react';
import {
  X,
  Home,
  Briefcase,
  Users,
  Bell,
  Settings,
  LogOut,
  ClipboardList,
  History,
  UserPlus
} from 'lucide-react';
import { User, SidebarLink } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  user: User;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onLogout: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ 
  user, 
  isOpen, 
  setIsOpen, 
  onLogout,
  currentView,
  onViewChange
}: SidebarProps) {
  const { t } = useTranslation();

  const workerLinks: SidebarLink[] = [
    { icon: Home, label: t('navigation.findJobs'), href: '#jobs' },
    { icon: ClipboardList, label: t('navigation.appliedJobs'), href: '#applied' },
    { icon: UserPlus, label: 'Community', href: '#community' },
    { icon: Bell, label: t('navigation.notifications'), href: '#notifications' },
    { icon: Settings, label: t('navigation.settings'), href: '#settings' }
  ];

  const employerLinks: SidebarLink[] = [
    { icon: Users, label: t('navigation.myJobs'), href: '#jobs' },
    { icon: History, label: t('navigation.pastWorkers'), href: '#past-workers' },
    { icon: Bell, label: t('navigation.notifications'), href: '#notifications' },
    { icon: Settings, label: t('navigation.settings'), href: '#settings' }
  ];

  const links = user.role === 'worker' ? workerLinks : employerLinks;

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      onLogout();
      toast.success(t('common.success'));
    } catch (error: any) {
      toast.error(t('common.error') + ': ' + error.message);
    }
  };

  const handleNavigation = (href: string) => {
    if (href === '#jobs') {
      onViewChange('jobs');
    } else if (href === '#applied') {
      onViewChange('applied');
    } else if (href === '#past-workers') {
      onViewChange('past-workers');
    } else if (href === '#profile') {
      onViewChange('profile');
    } else if (href === '#notifications') {
      onViewChange('notifications');
    } else if (href === '#settings') {
      onViewChange('settings');
    } else if (href === '#community') {
      onViewChange('community');
    }
    setIsOpen(false);
  };

  return (
    <>
      <div
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out z-40 lg:translate-x-0 flex flex-col`}
      >
        {/* Mobile Close Button */}
        <div className="lg:hidden absolute right-2 top-2">
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Top Spacing */}
        <div className="h-16" /> {/* Reduced from h-20 to h-16 */}

        {/* Logo Section */}
        <div className="px-4 py-2"> {/* Reduced py-6 to py-2 */}
          <button
            onClick={() => handleNavigation('#jobs')}
            className="w-full flex items-center justify-center hover:bg-gray-50 rounded-lg p-2 transition-colors"
          >
            <div className="flex items-center text-2xl font-bold">
              <span className="text-gray-900">Go</span>
              <div className="mx-1">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white">O</span>
                </div>
              </div>
              <span className="text-gray-900">n</span>
              <span className="text-blue-600 ml-1">Work</span>
            </div>
          </button>
        </div>

        {/* Profile Section */}
        <div className="px-4">
          <button
            onClick={() => handleNavigation('#profile')}
            className="w-full flex items-center hover:bg-gray-100 rounded-lg p-2 transition-colors"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="h-10 w-10 rounded-full"
            />
            <div className="ml-3 text-left">
              <p className="font-medium text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500 capitalize">{user.role}</p>
            </div>
          </button>
        </div>

        {/* Navigation Links - Scrollable */}
        <nav className="flex-1 px-4 mt-6 space-y-1 overflow-y-auto">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                handleNavigation(link.href);
              }}
              className={`flex items-center px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 ${
                (link.href === '#jobs' && currentView === 'jobs') ||
                (link.href === '#applied' && currentView === 'applied') ||
                (link.href === '#past-workers' && currentView === 'past-workers') ||
                (link.href === '#notifications' && currentView === 'notifications') ||
                (link.href === '#settings' && currentView === 'settings') ||
                (link.href === '#community' && currentView === 'community')
                  ? 'bg-gray-100'
                  : ''
              }`}
            >
              <link.icon className="h-5 w-5" />
              <span className="ml-3">{link.label}</span>
            </a>
          ))}
        </nav>

        {/* Logout Button - Fixed at bottom */}
        <div className="px-4 py-4 border-t border-gray-200 mt-auto">
          <button 
            onClick={handleLogout}
            className="flex items-center text-gray-600 w-full px-4 py-2 hover:bg-gray-100 rounded-lg"
          >
            <LogOut className="h-5 w-5" />
            <span className="ml-3">{t('auth.signOut')}</span>
          </button>
        </div>
      </div>
      
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}