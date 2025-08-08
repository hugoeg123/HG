import { useState } from 'react';
import { MessageSquare, Calculator, AlertTriangle, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import AIAssistant from '../AI/AIAssistant';
import Calculators from '../Tools/Calculators';
import Alerts from '../Tools/Alerts';
import KnowledgeBase from '../Tools/KnowledgeBase';
import TabContentPanel from './TabContentPanel';

/**
 * RightSidebar component - Displays AI assistant, calculators, alerts and knowledge base
 * 
 * @component
 * @example
 * return (
 *   <RightSidebar collapsed={false} />
 * )
 * 
 * Integra com: components/AI/AIAssistant.jsx, components/Tools/Calculators.jsx, 
 * components/Tools/Alerts.jsx e components/Tools/KnowledgeBase.jsx
 * 
 * IA prompt: Adicionar histórico de interações com IA e favoritos de calculadoras
 */
const RightSidebar = ({ collapsed, expanded, onToggleExpansion }) => {
  const [activeTab, setActiveTab] = useState('chat');

  const tabConfig = {
    chat: { title: 'Chat', component: <AIAssistant />, icon: <MessageSquare size={16} /> },
    calculators: { title: 'Calculadoras', component: <Calculators />, icon: <Calculator size={16} /> },
    alerts: { title: 'Alertas', component: <Alerts />, icon: <AlertTriangle size={16} /> },
    knowledge: { title: 'Conhecimento', component: <KnowledgeBase />, icon: <BookOpen size={16} /> },
  };

  const ActiveComponent = tabConfig[activeTab].component;
  const activeTitle = tabConfig[activeTab].title;

  return (
    <div className={`h-full bg-theme-background border-l border-theme-border flex flex-col p-4 space-y-4 ${collapsed ? 'hidden' : ''}`}>
      {/* Botão de Expansão */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Ferramentas</h2>
        <button
          onClick={onToggleExpansion}
          className="p-2 bg-theme-card text-gray-300 hover:bg-theme-surface hover:text-white border border-transparent hover:border-teal-500/30 rounded-lg transition-all duration-200"
          title={expanded ? 'Reduzir barra lateral' : 'Expandir barra lateral'}
        >
          {expanded ? <ChevronRight size={16} className="text-gray-400" /> : <ChevronLeft size={16} className="text-gray-400" />}
        </button>
      </div>
      {/* Navegação por Abas Estilizada */}
      <nav className="grid grid-cols-2 lg:grid-cols-4 gap-1 bg-theme-card p-1 rounded-lg" aria-label="Tabs">
        {Object.entries(tabConfig).map(([key, { title, icon }]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-2 py-2 text-xs lg:text-sm font-semibold rounded-md transition-all duration-200 flex items-center justify-center gap-1 lg:gap-2 min-w-0 border
              ${activeTab === key
                ? 'border-teal-500 bg-teal-600/20 text-teal-300'
                : 'bg-theme-card text-gray-300 hover:bg-theme-surface hover:text-white border-transparent hover:border-teal-500/30'
              }`
            }
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

export default RightSidebar;

// Conector: Integra com MainLayout.jsx para exibição na interface principal e com os componentes de ferramentas