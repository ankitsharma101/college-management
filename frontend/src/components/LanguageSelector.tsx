import React from 'react';
import { Language } from '../types/chat';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
}) => {
  const languages = [
    { code: 'en' as Language, name: 'En', flag: '🇺🇸' },
    { code: 'hi' as Language, name: 'हि', flag: '🇮🇳' },
    { code: 'raj' as Language, name: 'રા', flag: '🇮🇳' },
  ];

  return (
    <div className="flex space-x-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onLanguageChange(lang.code)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            currentLanguage === lang.code
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span className="mr-1">{lang.flag}</span>
          {lang.name}
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;
