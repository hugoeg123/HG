import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, UserCog, CalendarDays, History, Search } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import SidebarItem from '../ui/SidebarItem';
import { useTranslation } from 'react-i18next';

/**
 * PatientSidebar - Barra lateral de navegação/busca para o perfil do paciente
 *
 * Conectores:
 * - Navega entre tabs via query param: /patient/profile?tab=<dashboard|edit|agenda|history>
 * - Integra com: pages/Patient/Profile.jsx (Tabs com URL sync)
 * - Não interfere na versão do médico por ser usada apenas na rota do paciente
 *
 * Hook: Usa useNavigate/useLocation para manter URL e estado de seleção
 */
const PatientSidebar = ({ collapsed }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useThemeStore();

  const currentParams = new URLSearchParams(location.search);
  const activeTab = currentParams.get('tab') || 'dashboard';

  const goToTab = (tab) => {
    const params = new URLSearchParams(location.search);
    params.set('tab', tab);
    navigate(`/patient/profile?${params.toString()}`);
  };

  const actions = [
    { key: 'dashboard', title: t('layout.patientDashboard'), icon: <Home className="h-4 w-4" />, onClick: () => goToTab('dashboard') },
    { key: 'edit', title: t('profile.editProfile'), icon: <UserCog className="h-4 w-4" />, onClick: () => goToTab('edit') },
    { key: 'agenda', title: t('agenda.title'), icon: <CalendarDays className="h-4 w-4" />, onClick: () => goToTab('agenda') },
    { key: 'history', title: t('layout.history'), icon: <History className="h-4 w-4" />, onClick: () => goToTab('history') },
    // Connector: Acesso rápido ao Marketplace (médicos e serviços)
    { key: 'marketplace', title: t('layout.marketplace'), icon: <Search className="h-4 w-4" />, onClick: () => navigate('/marketplace') },
  ];

  return (
    <div className={`left-pane ${collapsed ? 'collapsed' : ''} bg-theme-background`}>
      <div className="p-4 pb-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('layout.navigation')}
          </h2>
        </div>

        {/* Campo de busca (marketplace style) */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder={t('layout.searchServices')}
            className="w-full pl-10 pr-4 py-2 bg-theme-card border border-theme-border rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        </div>

        {/* Ações rápidas para tabs do perfil */}
        <div className="space-y-2">
          {actions.map(({ key, title, icon, onClick }) => (
            <SidebarItem
              key={key}
              isActive={key === 'marketplace' ? location.pathname.startsWith('/marketplace') : activeTab === key}
              title={title}
              icon={icon}
              onClick={onClick}
            />
          ))}
        </div>

        {/* Futuro: resultados de busca/marketplace */}
        <div className="mt-6 text-xs text-gray-400">
          {/* Connector: Integrar marketplaceService.js para preencher resultados de busca */}
          {/* Hook: Exibir sugestões baseadas em histórico do paciente e tags */}
          Sugestões e resultados aparecerão aqui.
        </div>
      </div>
    </div>
  );
};

export default PatientSidebar;

// Conector: Usado apenas em `/patient/profile` via MainLayout.jsx para evitar impacto no layout do médico