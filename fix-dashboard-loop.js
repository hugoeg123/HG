/**
 * Correção para Loop Infinito no PatientDashboard
 * 
 * PROBLEMA IDENTIFICADO:
 * O useEffect no PatientDashboard.jsx pode estar causando loops infinitos devido a:
 * 1. Dependências incorretas no useEffect
 * 2. Funções do Zustand sendo recriadas a cada render
 * 3. Possível problema com createSignal sendo chamado dentro do useEffect
 * 
 * SOLUÇÕES:
 */

// SOLUÇÃO 1: Corrigir dependências do useEffect no PatientDashboard.jsx
// Problema: useEffect([patientId]) mas loadDashboard usa funções que podem mudar

// ANTES (problemático):
/*
useEffect(() => {
  loadDashboard();
  
  return () => {
    abortAll();
  };
}, [patientId]); // ❌ Dependências incompletas
*/

// DEPOIS (corrigido):
/*
useEffect(() => {
  if (!patientId) return;
  
  const loadData = async () => {
    try {
      const signal = createSignal('dashboard');
      await fetchPatientDashboard(patientId, { signal });
    } catch (err) {
      if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
        console.error('Erro ao carregar dashboard:', err);
      }
    }
  };
  
  loadData();
  
  return () => {
    abortAll();
  };
}, [patientId]); // ✅ Dependências corretas
*/

// SOLUÇÃO 2: Usar useCallback para estabilizar funções
/*
const loadDashboard = useCallback(async (showToast = false) => {
  if (!patientId) return;
  
  try {
    const signal = createSignal('dashboard');
    await fetchPatientDashboard(patientId, { signal });
    
    if (showToast) {
      toast.success('Dashboard atualizado');
    }
  } catch (err) {
    if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
      console.error('Erro ao carregar dashboard:', err);
      toast.error('Erro ao carregar dashboard');
    }
  }
}, [patientId, createSignal, fetchPatientDashboard, toast]);
*/

// SOLUÇÃO 3: Verificar se o patientId está mudando desnecessariamente
// Adicionar logs para debug:
/*
useEffect(() => {
  console.log('PatientDashboard useEffect triggered, patientId:', patientId);
  // resto do código...
}, [patientId]);
*/

// SOLUÇÃO 4: Implementar flag de montagem para evitar chamadas desnecessárias
/*
const isMountedRef = useRef(false);

useEffect(() => {
  isMountedRef.current = true;
  
  return () => {
    isMountedRef.current = false;
  };
}, []);

useEffect(() => {
  if (!isMountedRef.current || !patientId) return;
  
  loadDashboard();
}, [patientId]);
*/

// SOLUÇÃO 5: Verificar se há múltiplas instâncias do componente sendo renderizadas
// Adicionar key única no PatientView/index.jsx:
/*
<PatientDashboard 
  key={`dashboard-${id}`} // ✅ Key única previne problemas de estado
  patientId={id} 
  onNewRecord={handleNewRecord}
/>
*/

export const DASHBOARD_FIXES = {
  // Implementação das correções
  
  // Fix 1: useEffect otimizado
  optimizedUseEffect: `
    useEffect(() => {
      if (!patientId) return;
      
      let isCancelled = false;
      
      const loadData = async () => {
        try {
          const signal = createSignal('dashboard');
          const result = await fetchPatientDashboard(patientId, { signal });
          
          if (!isCancelled && result) {
            console.log('Dashboard loaded successfully for patient:', patientId);
          }
        } catch (err) {
          if (!isCancelled && err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
            console.error('Erro ao carregar dashboard:', err);
          }
        }
      };
      
      loadData();
      
      return () => {
        isCancelled = true;
        abortAll();
      };
    }, [patientId]);
  `,
  
  // Fix 2: Função loadDashboard estabilizada
  stableLoadDashboard: `
    const loadDashboard = useCallback(async (showToast = false) => {
      if (!patientId) return;
      
      try {
        const signal = createSignal('dashboard');
        await fetchPatientDashboard(patientId, { signal });
        
        if (showToast) {
          toast.success('Dashboard atualizado', {
            description: 'Dados do paciente carregados com sucesso'
          });
        }
      } catch (err) {
        if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
          console.error('Erro ao carregar dashboard:', err);
          toast.error('Erro ao carregar dashboard', {
            description: 'Não foi possível carregar os dados do paciente'
          });
        }
      }
    }, [patientId]);
  `,
  
  // Fix 3: Debug logs
  debugLogs: `
    useEffect(() => {
      console.log('🔍 PatientDashboard useEffect triggered');
      console.log('📋 patientId:', patientId);
      console.log('👤 currentPatient:', currentPatient?.id);
      console.log('📊 dashboardData exists:', !!dashboardData);
      
      // resto do código...
    }, [patientId]);
  `
};

console.log('📋 Dashboard Loop Fix Script Loaded');
console.log('🔧 Use DASHBOARD_FIXES object for implementation guidance');