import { useState } from 'react';
import AIAssistant from '../AI/AIAssistant';
import Calculators from '../Tools/Calculators';
import Alerts from '../Tools/Alerts';
import KnowledgeBase from '../Tools/KnowledgeBase';

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

  // Renderizar o conteúdo com base na aba ativa
  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <AIAssistant />;
      case 'calculators':
        return <Calculators />;
      case 'alerts':
        return <Alerts />;
      case 'knowledge':
        return <KnowledgeBase />;
      default:
        return <AIAssistant />;
    }
  };

  return (
    <div className={`right-pane ${collapsed ? 'collapsed' : ''}`}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-purple-500 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h2 className="text-xl font-semibold">Assistente IA</h2>
          </div>

          {/* Abas de navegação */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </button>
            <button
              className={`tab ${activeTab === 'calculators' ? 'active' : ''}`}
              onClick={() => setActiveTab('calculators')}
            >
              Calculadoras
            </button>
            <button
              className={`tab ${activeTab === 'alerts' ? 'active' : ''}`}
              onClick={() => setActiveTab('alerts')}
            >
              Alertas
            </button>
            <button
              className={`tab ${activeTab === 'knowledge' ? 'active' : ''}`}
              onClick={() => setActiveTab('knowledge')}
            >
              Conhecimento
            </button>
          </div>
        </div>

        {/* Conteúdo da aba selecionada */}
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;

// Conector: Integra com MainLayout.jsx para exibição na interface principal e com os componentes de ferramentas