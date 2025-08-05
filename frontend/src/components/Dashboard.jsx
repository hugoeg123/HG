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
      <div className="welcome-section mb-8 bg-gradient-to-r from-teal-600/20 to-blue-600/20 border border-teal-600/30 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Bem-vindo, {user?.name || 'Médico'}!</h1>
        <p className="text-gray-300">Aqui está um resumo da sua atividade recente e pacientes.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card de estatísticas */}
        <div className="stat-card bg-theme-background border border-gray-700 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-white mb-4">Pacientes Ativos</h3>
          <div className="text-3xl font-bold text-teal-400 mb-2">{patients?.length || 0}</div>
          <p className="text-gray-400 text-sm">Total de pacientes sob seus cuidados</p>
        </div>
        
        {/* Card de consultas */}
        <div className="stat-card bg-theme-background border border-gray-700 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-white mb-4">Consultas Hoje</h3>
          <div className="text-3xl font-bold text-teal-400 mb-2">0</div>
          <p className="text-gray-400 text-sm">Consultas agendadas para hoje</p>
        </div>
        
        {/* Card de tarefas */}
        <div className="stat-card bg-theme-background border border-gray-700 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-white mb-4">Tarefas Pendentes</h3>
          <div className="text-3xl font-bold text-amber-400 mb-2">0</div>
          <p className="text-gray-400 text-sm">Tarefas que precisam de sua atenção</p>
        </div>
      </div>
      
      {/* Lista de pacientes recentes */}
      <div className="recent-patients bg-theme-background border border-gray-700 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Pacientes Recentes</h2>
          <button 
            onClick={handleNewPatient}
            className="btn btn-primary bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            + Novo Paciente
          </button>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="loading loading-spinner loading-lg text-teal-400"></div>
            <p className="text-gray-400 mt-2">Carregando pacientes...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">Erro ao carregar pacientes: {error}</p>
            <button 
              onClick={() => fetchPatients()}
              className="btn btn-outline border-teal-600 text-teal-400 hover:bg-teal-600 hover:text-white px-4 py-2 rounded-lg transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        ) : patients && patients.length > 0 ? (
          <div className="grid gap-4">
            {patients.slice(0, 5).map((patient) => (
              <Link 
                key={patient.id} 
                to={`/patients/${patient.id}`}
                className="patient-card bg-theme-card/50 hover:bg-gray-700/50 border border-gray-700 hover:border-teal-600/50 p-4 rounded-lg transition-all duration-200 block"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="avatar placeholder mr-4">
                      <div className="bg-teal-600 text-white rounded-full w-10 h-10 flex items-center justify-center">
                        <span className="text-sm font-semibold">
                          {patient.name ? patient.name.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{patient.name || 'Sem Nome'}</h3>
                      <div className="text-sm text-gray-400 flex items-center">
                        <span className="mr-3">ID: {patient.id.slice(0, 8)}...</span>
                        {patient.dateOfBirth && (
                          <span className="mr-3">
                            {(() => {
                              const today = new Date();
                              const birth = new Date(patient.dateOfBirth);
                              let age = today.getFullYear() - birth.getFullYear();
                              const monthDiff = today.getMonth() - birth.getMonth();
                              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                                age--;
                              }
                              return `${age} anos`;
                            })()} 
                          </span>
                        )}
                        {patient.gender && (
                          <span>{patient.gender}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-teal-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
            
            {patients.length > 5 && (
              <div className="text-center mt-4">
                <p className="text-gray-400 text-sm">
                  Mostrando 5 de {patients.length} pacientes
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-lg mb-2">Nenhum paciente encontrado</p>
              <p className="text-sm">Comece criando seu primeiro paciente</p>
            </div>
            <button 
              onClick={handleNewPatient}
              className="btn btn-primary bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              + Criar Primeiro Paciente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;