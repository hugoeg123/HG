/**
 * Store para gerenciamento do tema da aplicação
 * 
 * Gerencia o estado do tema (dark/light mode) e persiste a preferência no localStorage
 * 
 * Conector: Integra com components/Layout/Navbar.jsx para alternar o tema
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Hook para gerenciamento do tema da aplicação
 * @example
 * const { isDarkMode, toggleTheme } = useThemeStore();
 * 
 * Hook: Exportado em store/themeStore.js e usado em Layout/Navbar.jsx e App.jsx
 */
export const useThemeStore = create(
  persist(
    (set) => ({
      // Estado
      isDarkMode: true, // Padrão é dark mode
      
      // Ações
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setDarkMode: (value) => set({ isDarkMode: value }),
    }),
    {
      name: 'theme-storage', // Nome para o localStorage
    }
  )
);