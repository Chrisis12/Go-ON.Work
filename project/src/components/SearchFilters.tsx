import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SearchFiltersProps {
  isEmployer: boolean;
  onWageFilterChange?: (range: string | null) => void;
  onSearchChange?: (query: string) => void;
}

export default function SearchFilters({ isEmployer, onWageFilterChange, onSearchChange }: SearchFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedWage, setSelectedWage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();

  const handleWageChange = (wage: string) => {
    setSelectedWage(wage);
    onWageFilterChange?.(wage || null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearchChange?.(query);
  };

  const handleClearFilters = () => {
    setSelectedWage('');
    setSearchQuery('');
    onWageFilterChange?.(null);
    onSearchChange?.('');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={isEmployer ? t('jobs.searchApplications') : t('jobs.searchJobs')}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button 
          className={`px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 ${showFilters ? 'bg-gray-50' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          {t('jobs.filters')}
        </button>
        {isEmployer && (
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            {t('jobs.postNewJob')}
          </button>
        )}
      </div>

      {showFilters && (
        <div className="mt-4 flex flex-wrap items-center gap-4 animate-fadeIn">
          {!isEmployer && (
            <select
              value={selectedWage}
              onChange={(e) => handleWageChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="">{t('jobs.selectWage')}</option>
              <option value="5-10">$5 - $10/hr</option>
              <option value="10-15">$10 - $15/hr</option>
              <option value="15-20">$15 - $20/hr</option>
              <option value="20+">$20+/hr</option>
            </select>
          )}

          {isEmployer && (
            <select className="px-3 py-2 border border-gray-300 rounded-lg bg-white">
              <option>{t('jobs.selectStatus')}</option>
              <option>{t('jobs.allApplications')}</option>
              <option>{t('jobs.pendingReview')}</option>
              <option>{t('jobs.accepted')}</option>
              <option>{t('jobs.rejected')}</option>
            </select>
          )}

          {(selectedWage || searchQuery) && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}