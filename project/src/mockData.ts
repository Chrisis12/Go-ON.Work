import { Job, User } from './types';

export const mockWorker: User = {
  id: '1',
  name: 'John Smith',
  email: 'john@example.com',
  role: 'worker',
  rating: 1250,
  completedJobs: 45,
  location: 'New York, NY',
  skills: ['Plumbing', 'Electrical', 'Carpentry'],
  avatar: 'https://media.licdn.com/dms/image/v2/D4E12AQEud3Ll5MI7cQ/article-inline_image-shrink_1000_1488/article-inline_image-shrink_1000_1488/0/1660833954461?e=1747267200&v=beta&t=xntcRxVZ7GjlG8YfVdGM3BU424kZLyz0lC6bjQJZ504'
};

export const mockEmployer: User = {
  id: '2',
  name: 'Sarah Johnson',
  email: 'sarah@company.com',
  role: 'employer',
  rating: 1350,
  completedJobs: 28,
  location: 'New York, NY',
  skills: [],
  avatar: 'https://media.licdn.com/dms/image/v2/D4E12AQEud3Ll5MI7cQ/article-inline_image-shrink_1000_1488/article-inline_image-shrink_1000_1488/0/1660833954461?e=1747267200&v=beta&t=xntcRxVZ7GjlG8YfVdGM3BU424kZLyz0lC6bjQJZ504'
};

export const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Emergency Plumbing Repair',
    description: 'Need an experienced plumber for fixing a burst pipe in residential building.',
    employer: mockEmployer,
    category: 'Plumbing',
    location: 'Brooklyn, NY',
    wage: 45,
    requiredSkills: ['Plumbing', 'Emergency Response'],
    recommendedSkills: ['Residential Experience'],
    status: 'open',
    createdAt: '2024-03-15T10:00:00Z',
    applications: 3
  },
  {
    id: '2',
    title: 'Kitchen Cabinet Installation',
    description: 'Looking for a skilled carpenter to install new kitchen cabinets.',
    employer: mockEmployer,
    category: 'Carpentry',
    location: 'Queens, NY',
    wage: 35,
    requiredSkills: ['Carpentry', 'Cabinet Installation'],
    recommendedSkills: ['Kitchen Remodeling'],
    status: 'open',
    createdAt: '2024-03-14T15:30:00Z',
    applications: 5
  },
  {
    id: '3',
    title: 'Electrical Wiring Update',
    description: 'Need electrician for updating old wiring in office space.',
    employer: mockEmployer,
    category: 'Electrical',
    location: 'Manhattan, NY',
    wage: 50,
    requiredSkills: ['Electrical', 'Commercial Wiring'],
    recommendedSkills: ['Office Building Experience'],
    status: 'open',
    createdAt: '2024-03-13T09:15:00Z',
    applications: 2
  }
];