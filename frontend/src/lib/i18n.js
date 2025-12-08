import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ptBR from '../locales/pt-BR/translation.json';
import en from '../locales/en/translation.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            'pt-BR': {
                translation: ptBR
            },
            'pt': {
                translation: ptBR
            },
            'en': {
                translation: en
            }
        },
        fallbackLng: 'pt-BR',
        supportedLngs: ['pt-BR', 'pt', 'en'],
        debug: import.meta.env.DEV,

        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },

        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });

export default i18n;
