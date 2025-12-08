import React from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../store/themeStore';

const LanguageToggle = () => {
    const { i18n } = useTranslation();
    const { isDarkMode } = useThemeStore();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'pt-BR' ? 'en' : 'pt-BR';
        i18n.changeLanguage(newLang);
    };

    const isPt = i18n.language === 'pt-BR';

    return (
        <div className="relative">
            <button
                onClick={toggleLanguage}
                className={`
          theme-toggle-optimized relative inline-flex h-7 w-14 items-center rounded-full border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2
          ${isDarkMode
                        ? 'bg-theme-card border-gray-600 focus:ring-teal-500 focus:ring-offset-theme-background'
                        : 'bg-white border-gray-300 focus:ring-blue-500 focus:ring-offset-[#DDDDDD]'
                    }
        `}
                aria-label="Toggle language"
                title={isPt ? "Mudar para Inglês" : "Switch to Portuguese"}
            >
                <span
                    className={`
            inline-flex h-5 w-5 transform rounded-full transition-all duration-300 ease-in-out items-center justify-center shadow text-[10px] font-bold
            ${isPt
                            ? 'translate-x-1 bg-teal-600 text-white'
                            : 'translate-x-8 bg-blue-600 text-white'
                        }
          `}
                >
                    {isPt ? 'PT' : 'EN'}
                </span>

                <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none text-[9px] font-medium">
                    <span className={`${!isPt ? 'opacity-100 text-gray-500' : 'opacity-0'} transition-opacity duration-300`}>PT</span>
                    <span className={`${isPt ? 'opacity-100 text-gray-500' : 'opacity-0'} transition-opacity duration-300`}>EN</span>
                </div>
            </button>
        </div>
    );
};

export default LanguageToggle;
