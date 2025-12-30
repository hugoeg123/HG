import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare, Calculator, AlertTriangle, BookOpen, ChevronLeft, ChevronRight, Database, Plus, History as HistoryIcon, Trash2 } from 'lucide-react';
import AIAssistant from '../AI/AIAssistant';
import Calculators from '../Tools/Calculators';
import Alerts from '../Tools/Alerts';
import KnowledgeBase from '../Tools/KnowledgeBase';
import ContextManager from '../AI/ContextManager';
import TabContentPanel from './TabContentPanel';
import { useThemeStore } from '../../store/themeStore';
import { useChatStore } from '../../store/chatStore';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

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
 * Hook: Uses useParams to get current patientId and pass to Calculators component
 * IA prompt: Adicionar histórico de interações com IA e favoritos de calculadoras
 */
const RightSidebar = ({ collapsed, expanded, onToggleExpansion }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('chat');
  const [showHistory, setShowHistory] = useState(false);
  const { id: patientId } = useParams(); // Get current patient ID from URL
  const { isDarkMode } = useThemeStore();
  const { startNewChat, history, loadChat, deleteChat } = useChatStore();

  const tabConfig = {
    chat: { title: t('layout.chat'), component: <AIAssistant />, icon: <MessageSquare size={16} /> },
    context: { title: t('layout.context'), component: <ContextManager />, icon: <Database size={16} /> },
    calculators: { title: t('layout.calculators'), component: <Calculators patientId={patientId} />, icon: <Calculator size={16} /> },
    alerts: { title: t('layout.alerts'), component: <Alerts />, icon: <AlertTriangle size={16} /> },
    knowledge: { title: t('layout.knowledge'), component: <KnowledgeBase />, icon: <BookOpen size={16} /> },
  };

  const ActiveComponent = tabConfig[activeTab].component;
  const activeTitle = tabConfig[activeTab].title;

  const chatActions = (
    <>
      <button 
        onClick={() => startNewChat()} 
        className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-500 hover:text-black'}`}
        title="Nova Conversa"
      >
        <Plus size={18} />
      </button>
      <button 
        onClick={() => setShowHistory(true)} 
        className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-500 hover:text-black'}`}
        title="Histórico"
      >
        <HistoryIcon size={18} />
      </button>
    </>
  );

  return (
    <div className={`right-pane h-full bg-theme-background flex flex-col p-4 space-y-4 ${collapsed ? 'hidden' : ''}`}>
      {/* Botão de Expansão */}
      <div className="flex justify-between items-center">
        <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('layout.tools')}</h2>
        <button
          onClick={onToggleExpansion}
          className={`p-2 bg-theme-card text-gray-300 hover:bg-theme-surface hover:text-white border border-transparent ${isDarkMode ? 'hover:border-teal-500/30' : 'hover:border-blue-500/30'} rounded-lg transition-all duration-200`}
          title={expanded ? 'Reduzir barra lateral' : 'Expandir barra lateral'}
        >
          {expanded ? <ChevronRight size={16} className="text-gray-400" /> : <ChevronLeft size={16} className="text-gray-400" />}
        </button>
      </div>
      {/* Navegação por Abas Estilizada */}
      <nav className="grid grid-cols-2 lg:grid-cols-5 gap-1 bg-theme-card p-1 rounded-lg" aria-label="Tabs">
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
        <TabContentPanel 
          title={activeTitle}
          actions={activeTab === 'chat' ? chatActions : null}
        >
          {ActiveComponent}
        </TabContentPanel>
      </div>

      {/* Dialog de Histórico */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Histórico de Conversas</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 mt-4">
            {history.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhuma conversa salva.</p>
            ) : (
              history.map(chat => (
                <div 
                  key={chat.id} 
                  className={`group flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                    isDarkMode 
                      ? 'border-gray-700/50 hover:border-teal-500/30 bg-theme-card hover:bg-theme-surface' 
                      : 'border-gray-200 hover:border-blue-500/30 bg-white hover:bg-gray-50'
                  }`} 
                  onClick={() => { loadChat(chat.id); setShowHistory(false); }}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium text-sm truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{chat.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{new Date(chat.date).toLocaleDateString()} • {chat.messages.length} msgs</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }} 
                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-all"
                    title="Excluir conversa"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RightSidebar;