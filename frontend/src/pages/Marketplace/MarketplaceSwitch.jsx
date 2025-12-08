import ProtectedRoute from '../../components/ProtectedRoute';
import MainLayout from '../../components/Layout/MainLayout';
import PatientSidebar from '../../components/Layout/PatientSidebar';
import PatientRightSidebar from '../../components/Layout/PatientRightSidebar';
import PatientTopNav from '../../components/Layout/PatientTopNav';
import DoctorsList from './DoctorsList';
import { useAuthStore } from '../../store/authStore';

/**
 * MarketplaceSwitch
 * 
 * Exibe o Marketplace com layout do paciente quando o usuário
 * está autenticado como paciente. Caso contrário, mostra o
 * Marketplace público sem layout.
 * 
 * Conectores:
 * - store/authStore.js para verificar autenticação e role
 * - MainLayout.jsx com PatientSidebar/RightSidebar/TopNav
 */
const MarketplaceSwitch = () => {
  const { isAuthenticated, user } = useAuthStore();
  const isPatient = isAuthenticated && user?.role === 'patient';

  if (isPatient) {
    return (
      <ProtectedRoute>
        <MainLayout 
          leftSidebarComponent={PatientSidebar}
          rightSidebarComponent={PatientRightSidebar}
          topNavComponent={PatientTopNav}
          initialLeftCollapsed={true}
          initialRightCollapsed={true}
        >
          <DoctorsList />
        </MainLayout>
      </ProtectedRoute>
    );
  }

  // Público (não logado ou não paciente)
  return <DoctorsList />;
};

export default MarketplaceSwitch;

// Hook: Condiciona layout por role sem duplicar rotas
// Connector: Mantém Marketplace acessível publicamente e padroniza experiência do paciente