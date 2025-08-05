import { useState } from 'react';
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
const RightSidebar = ({ collapsed }) => {
  const [activeTab, setActiveTab] = useState('chat');

  // Tab configuration with titles and components
  const tabConfig = {
    chat: { title: 'Chat IA', component: AIAssistant },
    calculators: { title: 'Calculadoras Médicas', component: Calculators },
    alerts: { title: 'Alertas e Lembretes', component: Alerts },
    knowledge: { title: 'Base de Conhecimento', component: KnowledgeBase }
  };

  const currentTab = tabConfig[activeTab] || tabConfig.chat;
  const CurrentComponent = currentTab.component;

  return (
    <div className={`h-full bg-theme-background border-l border-gray-700 flex flex-col ${collapsed ? 'collapsed' : ''}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <nav className="flex" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
              activeTab === 'chat'
                ? 'border-teal-500 text-teal-400 bg-teal-600/10'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600 hover:bg-gray-700/30'
            }`}
            aria-current={activeTab === 'chat' ? 'page' : undefined}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="hidden lg:inline">Chat</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('calculators')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
              activeTab === 'calculators'
                ? 'border-teal-500 text-teal-400 bg-teal-600/10'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600 hover:bg-gray-700/30'
            }`}
            aria-current={activeTab === 'calculators' ? 'page' : undefined}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="hidden lg:inline">Calculadoras</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
              activeTab === 'alerts'
                ? 'border-teal-500 text-teal-400 bg-teal-600/10'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600 hover:bg-gray-700/30'
            }`}
            aria-current={activeTab === 'alerts' ? 'page' : undefined}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="hidden lg:inline">Alertas</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
              activeTab === 'knowledge'
                ? 'border-teal-500 text-teal-400 bg-teal-600/10'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600 hover:bg-gray-700/30'
            }`}
            aria-current={activeTab === 'knowledge' ? 'page' : undefined}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="hidden lg:inline">Conhecimento</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <TabContentPanel title={currentTab.title}>
          <CurrentComponent />
        </TabContentPanel>
      </div>
    </div>
  );
};

export default RightSidebar;

// Conector: Integra com MainLayout.jsx para exibição na interface principal e com os componentes de ferramentas