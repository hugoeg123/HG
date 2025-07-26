import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

const Navbar = ({ onToggleLeftSidebar, onToggleRightSidebar }) => {
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="px-4 py-2 flex items-center justify-between border-b border-color-border" style={{ backgroundColor: 'var(--color-bg-dark)' }}>
      <div className="flex items-center">
        {/* Botão para alternar a barra lateral esquerda */}
        <button 
          onClick={onToggleLeftSidebar}
          className="mr-4 p-1 rounded hover:bg-gray-700 focus:outline-none"
          aria-label="Toggle left sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {/* Logo e nome do aplicativo */}
        <Link to="/dashboard" className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <span className="ml-2 text-xl font-semibold text-white">Health Guardian</span>
        </Link>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Botão para alternar o tema (dark/light mode) */}
        <button 
          onClick={toggleTheme}
          className="p-1 rounded hover:bg-gray-700 focus:outline-none"
          aria-label="Toggle theme"
        >
          {isDarkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        
        {/* Botão para alternar a barra lateral direita */}
        <button 
          onClick={onToggleRightSidebar}
          className="p-1 rounded hover:bg-gray-700 focus:outline-none"
          aria-label="Toggle right sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        {/* Menu do usuário */}
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-medium">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span className="text-gray-300 hidden md:inline-block">{user?.name || 'Usuário'}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-10">
              <Link 
                to="/profile" 
                className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                onClick={() => setDropdownOpen(false)}
              >
                Perfil
              </Link>
              <Link 
                to="/settings" 
                className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                onClick={() => setDropdownOpen(false)}
              >
                Configurações
              </Link>
              <button 
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;