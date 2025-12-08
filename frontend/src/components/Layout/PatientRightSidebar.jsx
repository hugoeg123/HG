import { useState } from 'react';
import { MessageSquare, AlertTriangle, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import AIAssistant from '../AI/AIAssistant';
import Alerts from '../Tools/Alerts';
import KnowledgeBase from '../Tools/KnowledgeBase';
import TabContentPanel from './TabContentPanel';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from 'react-i18next';

/**
 * PatientRightSidebar - Barra lateral direita para páginas do paciente
 * 
 * Conectores:
 * - Abas: Chat IA, Alertas, Conhecimento (sem Calculadoras no contexto do paciente)
 * - Integra com: components/AI/AIAssistant.jsx, Tools/*, TabContentPanel
 * - Usada via MainLayout em rotas `/patient/*`
 * 
 * Hook: Recebe props de colapso/expansão e repassa para RightSidebar
 */
const PatientRightSidebar = ({ collapsed, expanded, onToggleExpansion }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('chat');
  const { isDarkMode } = useThemeStore();

  const tabConfig = {
    chat: { title: t('layout.chat'), component: <AIAssistant />, icon: <MessageSquare size={16} /> },
    alerts: { title: t('layout.alerts'), component: <Alerts />, icon: <AlertTriangle size={16} /> },
    knowledge: { title: t('layout.knowledge'), component: <KnowledgeBase />, icon: <BookOpen size={16} /> },
  };

  const ActiveComponent = tabConfig[activeTab].component;
  const activeTitle = tabConfig[activeTab].title;

  return (
    <div className={`right-pane h-full bg-theme-background flex flex-col p-4 space-y-4 ${collapsed ? 'hidden' : ''}`}>
      {/* Botão de Expansão */}
      <div className="flex justify-between items-center">
        <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('layout.myAssistant')}</h2>
        <button
          onClick={onToggleExpansion}
          className={`p-2 bg-theme-card text-gray-300 hover:bg-theme-surface hover:text-white border border-transparent ${isDarkMode ? 'hover:border-teal-500/30' : 'hover:border-blue-500/30'} rounded-lg transition-all duration-200`}
          title={expanded ? 'Reduzir barra lateral' : 'Expandir barra lateral'}
        >
          {expanded ? <ChevronRight size={16} className="text-gray-400" /> : <ChevronLeft size={16} className="text-gray-400" />}
        </button>
      </div>

      {/* Navegação por Abas Estilizada */}
      <nav className="grid grid-cols-2 lg:grid-cols-3 gap-1 bg-theme-card p-1 rounded-lg" aria-label="Tabs">
        {Object.entries(tabConfig).map(([key, { title, icon }]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-2 py-2 text-xs lg:text-sm font-semibold rounded-md transition-all duration-200 flex items-center justify-center gap-1 lg:gap-2 min-w-0 border ${activeTab === key
                ? (isDarkMode
                  ? 'border-teal-500 bg-teal-600/20 text-teal-300'
                  : 'border-blue-500 bg-blue-600/10 text-blue-700')
                : `bg-theme-card ${isDarkMode ? 'text-gray-300 hover:bg-theme-surface hover:text-white hover:border-teal-500/30' : 'text-gray-700 hover:bg-theme-surface hover:text-gray-900 hover:border-blue-500/30'} border-transparent`
              }`}
            aria-current={activeTab === key ? 'page' : undefined}
            title={title}
          >
            <span className="flex-shrink-0">{icon}</span>
            <span className="hidden lg:inline truncate">{title}</span>
          </button>
        ))}
      </nav>

      {/* Painel de Conteúdo Unificado */}
      <div className="flex-1 overflow-hidden">
        <TabContentPanel title={activeTitle}>
          {ActiveComponent}
        </TabContentPanel>
      </div>
    </div>
  );
};

export default PatientRightSidebar;

// Connector: Específico do paciente; separa contexto de IA/Calculadoras do médico