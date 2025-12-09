import React from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../store/themeStore';

/**
 * LanguageToggle Component
 * 
 * @description Alterna entre Português e Inglês usando i18next.
 * 
 * Integration Map
 * - Hooks: `useThemeStore` para estilos condicionais por tema
 * - Services: `react-i18next` para gerenciamento de idioma
 * - Used By: `components/Layout/Navbar.jsx`, `components/Layout/PatientTopNav.jsx`
 * 
 * Data Flow
 * - Click → `toggleLanguage` → `i18n.changeLanguage(newLang)`
 */

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
          theme-toggle-optimized relative inline-flex h-11 w-6 flex-col items-center rounded-full border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2
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
            inline-flex h-4 w-4 transform rounded-full transition-all duration-300 ease-in-out items-center justify-center shadow text-[9px] font-bold z-10
            ${isPt
                            ? 'translate-y-1'
                            : 'translate-y-5'
                        }
            ${isDarkMode
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 text-white'
                        }
          `}
                >
                    {isPt ? 'PT' : 'EN'}
                </span>

                <div className="absolute inset-0 flex flex-col items-center justify-between py-1 pointer-events-none text-[8px] font-medium">
                    <span className={`${!isPt ? 'opacity-100 text-gray-500' : 'opacity-0'} transition-opacity duration-300`}>PT</span>
                    <span className={`${isPt ? 'opacity-100 text-gray-500' : 'opacity-0'} transition-opacity duration-300`}>EN</span>
                </div>
            </button>
        </div>
    );
};

export default LanguageToggle;
