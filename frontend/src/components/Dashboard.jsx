import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePatientStore } from '../store/patientStore';

/**
 * Dashboard component - Página principal após login
 * 
 * @component
 * @example
 * return (
 *   <Dashboard />
 * )
 */
const Dashboard = () => {
  const { user } = useAuthStore();
  const { patients, currentPatient, fetchPatients, isLoading, error, createPatient } = usePatientStore();
  const navigate = useNavigate();
  
  // Hook: Removed fetchPatients from dependencies to prevent infinite loop
  // since Zustand functions are recreated on each render
  useEffect(() => {
    fetchPatients();
  }, []);
  
  const handleNewPatient = async () => {
    try {
      const newPatient = await createPatient({
        name: 'Sem Nome',
        dateOfBirth: new Date(),
        gender: 'não informado',
        email: null,
        phone: null,
        cpf: null,
        street: null,
        city: null,
        state: null,
        zipCode: null,
        country: 'Brasil',
        bloodType: 'Desconhecido',
        allergies: [],
        chronicConditions: [],
        medications: [],
        familyHistory: []
      });
      
      if (newPatient && newPatient.id) {
        // Navegar para o novo paciente (mesmo que seja temporário)
        navigate(`/patients/${newPatient.id}`);
      } else {
        console.error('Erro: Paciente criado sem ID');
        alert('Erro ao criar paciente. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao criar paciente:', err);
      alert('Erro ao criar paciente. Verifique sua conexão e tente novamente.');
    }
  };
  
  return (
    <div className="dashboard-container p-6">
      {/* Cabeçalho do paciente selecionado */}
      {currentPatient && (
        <div className="patient-header bg-dark-lighter p-4 rounded-lg mb-6 border border-dark-light">
          <div className="flex items-center">
            <div className="avatar placeholder mr-4">
              <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center">
                <span className="text-xl">{currentPatient.name ? currentPatient.name.charAt(0) : '?'}</span>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">
                {currentPatient.name || 'Sem Nome'}
                {currentPatient.dateOfBirth && (
                  <span className="ml-2 text-gray-400 text-base font-normal">
                    {(() => {
                      const today = new Date();
                      const birth = new Date(currentPatient.dateOfBirth);
                      let age = today.getFullYear() - birth.getFullYear();
                      const monthDiff = today.getMonth() - birth.getMonth();
                      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                        age--;
                      }
                      return `${age} anos`;
                    })()} 
                  </span>
                )}
              </h2>
              <div className="text-gray-400 text-sm flex items-center">
                <span className="mr-3">ID: {currentPatient.id}</span>
                {currentPatient.gender && (
                  <span className="mr-3">{currentPatient.gender}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="welcome-section mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Bem-vindo, {user?.name || 'Médico'}!</h1>
        <p className="text-gray-400">Aqui está um resumo da sua atividade recente e pacientes.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card de estatísticas */}
        <div className="stat-card bg-darkBg border border-gray-700 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-white mb-4">Pacientes Ativos</h3>
          <div className="text-3xl font-bold text-purple-500 mb-2">{patients?.length || 0}</div>
          <p className="text-gray-400 text-sm">Total de pacientes sob seus cuidados</p>
        </div>
        
        {/* Card de consultas */}
        <div className="stat-card bg-darkBg border border-gray-700 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-white mb-4">Consultas Hoje</h3>
          <div className="text-3xl font-bold text-teal-500 mb-2">0</div>
          <p className="text-gray-400 text-sm">Consultas agendadas para hoje</p>
        </div>
        
        {/* Card de tarefas */}
        <div className="stat-card bg-darkBg border border-gray-700 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-white mb-4">Tarefas Pendentes</h3>
          <div className="text-3xl font-bold text-amber-500 mb-2">0</div>
          <p className="text-gray-400 text-sm">Tarefas que precisam de sua atenção</p>
        </div>
      </div>
      
      {/* Lista de pacientes recentes */}
      <div className="recent-patients bg-darkBg border border-gray-700 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Pacientes Recentes</h2>
          <button 
            onClick={handleNewPatient}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white text-sm font-medium flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Novo Paciente
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-center py-4">{error}</div>
        ) : patients?.length === 0 ? (
          <div className="text-gray-400 text-center py-8 flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            <p className="text-lg">Nenhum paciente cadastrado</p>
            <p className="text-sm text-gray-500 mt-2">Clique em "Novo Paciente" para começar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-3 text-gray-400 font-medium">Nome</th>
                  <th className="pb-3 text-gray-400 font-medium">Idade</th>
                  <th className="pb-3 text-gray-400 font-medium">Última Atualização</th>
                  <th className="pb-3 text-gray-400 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient, index) => {
                  // Garantir chave única mesmo para pacientes temporários
                  const patientKey = patient?.id || `temp-dashboard-patient-${index}-${Date.now()}`;
                  const patientName = patient?.name || 'Sem Nome';
                  
                  return (
                    <tr key={patientKey} className="border-b border-gray-700 hover:bg-gray-800">
                      <td className="py-4 text-white">{patientName}</td>
                      <td className="py-4 text-gray-300">
                        {patient.birthDate || patient.dateOfBirth ? (
                          (() => {
                            const today = new Date();
                            const birth = new Date(patient.birthDate || patient.dateOfBirth);
                            let age = today.getFullYear() - birth.getFullYear();
                            const monthDiff = today.getMonth() - birth.getMonth();
                            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                              age--;
                            }
                            return `${age} anos`;
                          })()
                        ) : 'N/A'}
                      </td>
                      <td className="py-4 text-gray-300">
                        {patient.updatedAt ? new Date(patient.updatedAt).toLocaleDateString('pt-BR') : 'N/A'}
                      </td>
                      <td className="py-4">
                        {patient.id && patient.id !== 'undefined' ? (
                          <Link 
                            to={`/patients/${patient.id}`}
                            className="text-purple-500 hover:text-purple-400 font-medium"
                          >
                            Ver Detalhes
                          </Link>
                        ) : (
                          <span className="text-gray-500 text-sm">Salvando...</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;