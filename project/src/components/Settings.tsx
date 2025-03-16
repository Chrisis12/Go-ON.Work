import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { LANGUAGES } from '../i18n';

export default function Settings() {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    document.documentElement.dir = LANGUAGES[newLang as keyof typeof LANGUAGES].dir;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {t('settings.language.title')}
            </h2>
            <div className="flex items-center gap-4">
              <Globe className="h-5 w-5 text-gray-500" />
              <select
                value={i18n.language}
                onChange={handleLanguageChange}
                className="block w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2"
              >
                {Object.entries(LANGUAGES).map(([code, { nativeName }]) => (
                  <option key={code} value={code}>
                    {nativeName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}