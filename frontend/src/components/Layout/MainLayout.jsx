import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../ui/Toast';


/**
 * MainLayout - Layout principal com Navbar, LeftSidebar e RightSidebar
 * 
 * Conectores:
 * - Aceita `leftSidebarComponent` opcional para customizar a barra esquerda (ex.: paciente)
 * - Aceita `rightSidebarComponent` opcional para customizar a barra direita (ex.: paciente)
 * - Aceita `topNavComponent` opcional para customizar a barra superior (ex.: PatientTopNav)
 * - Integra com: Navbar.jsx, LeftSidebar.jsx, RightSidebar.jsx
 * 
 * Hook: Os toggles controlam colapso/expansão das barras laterais
 */
/**
 * MainLayout - Layout principal com Navbar, LeftSidebar e RightSidebar
 * 
 * Connector: Recebe flags de colapso inicial vindas das rotas (App.jsx, MarketplaceSwitch.jsx)
 * Hook: Controla estados de sidebars e propaga eventos para componentes filhos
 */
const MainLayout = ({
  leftSidebarComponent: LeftSidebarComponent = LeftSidebar,
  rightSidebarComponent: RightSidebarComponent = RightSidebar,
  topNavComponent: TopNavComponent = Navbar,
  children,
  initialLeftCollapsed = false,
  initialRightCollapsed = false,
}) => {
  // Inicializa colapsos conforme contexto da rota (ex.: paciente logado default oculto)
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(initialLeftCollapsed);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(initialRightCollapsed);
  const [rightSidebarExpanded, setRightSidebarExpanded] = useState(false);
  const { user } = useAuthStore();
  const { toast } = useToast();

  /**
   * Hook: Assina notificações globais do socket para médicos
   * 
   * Connector: Integra com services/socket.js (getSocket)
   * Exibe toasts quando eventos 'notification' chegam, em especial 'appointment:new'
   */
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user || user.role !== 'medico') return;

    const handler = (payload) => {
      try {
        if (payload?.type === 'appointment:new') {
          const start = payload?.slot?.start_time ? new Date(payload.slot.start_time) : null;
          const when = start ? start.toLocaleString() : 'horário indisponível';
          toast({
            title: 'Novo agendamento',
            description: `Paciente ${payload?.patientName || payload?.patientId || 'desconhecido'} marcou para ${when}.`,
            variant: 'info',
            duration: 6000
          });
        } else {
          toast({
            title: 'Notificação',
            description: payload?.message || 'Você recebeu uma nova notificação.',
            variant: 'info',
            duration: 4000
          });
        }
      } catch (e) {
        // Evitar quebra da UI por erro de payload
        console.warn('Falha ao processar notificação:', e);
      }
    };

    socket.on('notification', handler);
    return () => {
      socket.off('notification', handler);
    };
  }, [user?.id, user?.role]);



  const toggleLeftSidebar = () => {
    setLeftSidebarCollapsed(!leftSidebarCollapsed);
  };

  const toggleRightSidebar = () => {
    setRightSidebarCollapsed(!rightSidebarCollapsed);
  };

  const toggleRightSidebarExpansion = () => {
    setRightSidebarExpanded(!rightSidebarExpanded);
  };

  return (
    <div className="app-container">
      {/* Navbar / TopNav - Always visible at top */}
      <TopNavComponent 
        onToggleLeftSidebar={toggleLeftSidebar} 
        onToggleRightSidebar={toggleRightSidebar} 
        rightSidebarCollapsed={rightSidebarCollapsed}
      />
      
      {/* Main content area with sidebars */}
      <div className="main-content"
        data-fill-from=".left-pane .patient-list li .bg-theme-card"
        data-fill-target=".center-pane .stat-card, .center-pane .recent-patients"
        data-fill-count="4"
        data-fill-disable-in-dark="true"
      >
        {/* Left Sidebar */}
        <aside className={`transition-all duration-300 flex-shrink-0 ${leftSidebarCollapsed ? 'w-0 overflow-hidden' : 'w-64 md:w-80'}`}>
          <LeftSidebarComponent collapsed={leftSidebarCollapsed} />
        </aside>
        
        {/* Main Content */}
        {/* Note: center-pane class allows light-mode specific background override */}
        <main
          className="flex-1 p-2 sm:p-4 overflow-y-auto bg-theme-background min-w-0 center-pane"
        >
          {children || <Outlet />}
        </main>
        
        {/* Right Sidebar */}
        <aside className={`transition-all duration-300 flex-shrink-0 ${rightSidebarCollapsed ? 'w-0 overflow-hidden' : rightSidebarExpanded ? 'w-96 lg:w-1/2' : 'w-72 md:w-80 lg:w-96'}`}>
          <RightSidebarComponent 
            collapsed={rightSidebarCollapsed} 
            expanded={rightSidebarExpanded}
            onToggleExpansion={toggleRightSidebarExpansion}
          />
        </aside>
      </div>
    </div>
  );
};

export default MainLayout;