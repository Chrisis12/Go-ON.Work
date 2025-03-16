export interface User {
  id: string;
  name: string;
  email: string;
  role: 'worker' | 'employer';
  rating: number;
  completedJobs: number;
  location: string;
  skills: string[];
  avatar: string;
  phone?: string;
  address?: string;
  bio?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  employer_id: string;
  employer: User;
  category: string;
  location: string;
  wage: string | number;
  required_skills: string[];
  recommended_skills: string[];
  status: 'open' | 'in-progress' | 'completed';
  created_at: string;
  applications: number;
}

export interface Application {
  id: string;
  job_id: string;
  worker_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  job?: Job;
  worker?: User;
}

export interface SidebarLink {
  icon: React.ComponentType;
  label: string;
  href: string;
}

export interface JobFormData {
  title: string;
  description: string;
  category: string;
  location: string;
  wage: string | number;
  required_skills: string[];
  recommended_skills: string[];
}

export interface ProfileFormData {
  name: string;
  location: string;
  phone: string;
  address: string;
  bio: string;
  skills: string[];
}