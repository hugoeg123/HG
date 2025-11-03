import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

/**
 * PatientTopNav Component
 * 
 * Integrates with:
 * - store/authStore.js para obter usuário e executar logout
 * - store/themeStore.js para alternar tema dark/light
 * - pages/Marketplace/DoctorsList.jsx como barra superior para paciente
 * 
 * Connector: Exibe ações de perfil, toggle de tema e logout.
 */
const PatientTopNav = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // Connector: Direciona perfil conforme role
  const profileHref = user?.role === 'patient' ? '/patient/profile' : '/profile';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav
      className={`px-4 py-2 flex items-center justify-between transition-all duration-200 ${
        isDarkMode
          ? 'bg-theme-background border-b border-gray-700'
          : 'bg-[#DDDDDD] border-b border-gray-300 shadow-sm'
      }`}
      aria-label="Barra de navegação do paciente"
    >
      {/* Logo / Nome */}
      <Link to="/" className="flex items-center" title="Ir para o Dashboard">
        <div
          className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-lg ${
            isDarkMode ? 'bg-teal-500 text-theme-background' : 'bg-blue-600 text-theme-background'
          }`}
        >
          HG
        </div>
        <span
          className={`ml-2 text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
        >
          Health Guardian
        </span>
      </Link>

      {/* Ações: Toggle de tema + Perfil/Logout */}
      <div className="flex items-center space-x-3">
        {/* Toggle de tema (mesmo padrão visual da Navbar principal) */}
        <div className="relative">
          <button
            onClick={toggleTheme}
            className={`
              theme-toggle-optimized relative inline-flex h-7 w-14 items-center rounded-full border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2
              ${
                isDarkMode
                  ? 'bg-emerald-100 border-emerald-500 focus:ring-emerald-500 focus:ring-offset-theme-background shadow-[0_0_0_3px_rgba(16,185,129,0.25)]'
                  : 'bg-blue-100 border-blue-500 focus:ring-blue-500 focus:ring-offset-[#DDDDDD] shadow-[0_0_0_3px_rgba(59,130,246,0.25)]'
              }
            `}
            aria-label="Alternar tema"
            title={isDarkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
          >
            <span
              className={`
                inline-flex h-5 w-5 transform rounded-full transition-all duration-300 ease-in-out items-center justify-center shadow
                ${isDarkMode ? 'translate-x-8 bg-emerald-600' : 'translate-x-1 bg-blue-600'}
              `}
            >
              {isDarkMode ? (
                <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              ) : (
                <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79 1.8-1.79zm10.48 0l1.79-1.79-1.79-1.79-1.79 1.79 1.79 1.79zM12 4V1h-0v3h0zm0 19v-3h-0v3h0zM4 13H1v-0h3v0zm22 0h-3v-0h3v0zM6.76 19.16l-1.8 1.79 1.79 1.79 1.8-1.79-1.79-1.79zM17.24 19.16l1.79 1.79 1.79-1.79-1.79-1.79-1.79 1.79zM12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              )}
            </span>
            <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
              <svg className={`${isDarkMode ? 'opacity-40 text-emerald-600' : 'opacity-0'} h-3 w-3 transition-opacity duration-300`} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79 1.8-1.79zm10.48 0l1.79-1.79-1.79-1.79-1.79 1.79 1.79 1.79zM12 4V1h-0v3h0zm0 19v-3h-0v3h0zM4 13H1v-0h3v0zm22 0h-3v-0h3v0zM6.76 19.16l-1.8 1.79 1.79 1.79 1.8-1.79-1.79-1.79zM17.24 19.16l1.79 1.79 1.79-1.79-1.79-1.79-1.79 1.79zM12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
              <svg className={`${!isDarkMode ? 'opacity-40 text-blue-600' : 'opacity-0'} h-3 w-3 transition-opacity duration-300`} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            </div>
          </button>
        </div>

        {/* Menu do usuário */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`flex items-center space-x-2 p-1.5 rounded-lg transition-all duration-200 border border-transparent focus:outline-none ${
              isDarkMode
                ? 'bg-theme-background text-gray-300 hover:bg-theme-background hover:text-white hover:border-transparent'
                : 'bg-[#DDDDDD] text-gray-700 hover:bg-[#DDDDDD] hover:text-gray-800 hover:border-transparent'
            }`}
            title="Menu do usuário"
          >
            <div
              className={`w-7 h-7 rounded-full border flex items-center justify-center font-medium ${
                isDarkMode ? 'bg-theme-background border-gray-600/20 text-gray-300' : 'bg-[#DDDDDD] border-gray-400/30 text-gray-700'
              }`}
            >
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} hidden md:inline-block`}>
              {user?.name || 'Usuário'}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          {dropdownOpen && (
            <div
              className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 z-50 border ${
                isDarkMode ? 'bg-theme-card border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              {isAuthenticated ? (
                <>
                  <Link
                    to={profileHref}
                    className={`block px-4 py-2 text-sm transition-all duration-200 flex items-center space-x-2 ${
                      isDarkMode ? 'text-gray-300 hover:bg-theme-surface hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Perfil</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className={`block w-full text-left px-4 py-2 text-sm border border-transparent rounded transition-all duration-200 flex items-center space-x-2 hover:bg-red-600/20 hover:text-red-300 ${
                      isDarkMode ? 'bg-theme-card text-gray-300' : 'bg-white text-gray-700'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sair</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className={`block px-4 py-2 text-sm transition-all duration-200 ${
                    isDarkMode ? 'text-gray-300 hover:bg-theme-surface hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setDropdownOpen(false)}
                >
                  Entrar
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default PatientTopNav;