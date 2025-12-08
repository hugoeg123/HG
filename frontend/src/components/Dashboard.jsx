import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePatientStore } from '../store/patientStore';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { patients, fetchPatients, isLoading, error, createPatient } = usePatientStore();
  const navigate = useNavigate();

  // Hook: Guard against React.StrictMode double-invocation and duplicate data loads
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    if (!patients || patients.length === 0) {
      fetchPatients();
    }
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
      {/* Removed welcome-section to comply with request to delete the welcome card */}
      {/* Conector: Esta remoção afeta apenas a página / (Dashboard). PatientView mantém seu fluxo próprio. */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card de estatísticas */}
        <div className="stat-card theme-bg-primary border theme-border p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold theme-text-primary mb-4">{t('dashboard.activePatients')}</h3>
          <div className="text-3xl font-bold text-teal-400 mb-2">{patients?.length || 0}</div>
          <p className="theme-text-secondary text-sm">{t('dashboard.totalPatients')}</p>
        </div>

        {/* Card de consultas */}
        <div className="stat-card theme-bg-primary border theme-border p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold theme-text-primary mb-4">{t('dashboard.consultationsToday')}</h3>
          <div className="text-3xl font-bold text-teal-400 mb-2">0</div>
          <p className="theme-text-secondary text-sm">{t('dashboard.consultationsScheduled')}</p>
        </div>

        {/* Card de tarefas */}
        <div className="stat-card theme-bg-primary border theme-border p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold theme-text-primary mb-4">{t('dashboard.pendingTasks')}</h3>
          <div className="text-3xl font-bold text-teal-400 mb-2">0</div>
          <p className="theme-text-secondary text-sm">{t('dashboard.tasksAttention')}</p>
        </div>
      </div>

      {/* Lista de pacientes recentes */}
      <div className="recent-patients theme-bg-primary border theme-border p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold theme-text-primary">{t('dashboard.recentPatients')}</h2>
          <button
            onClick={handleNewPatient}
            className="bg-teal-600/20 text-teal-300 hover:bg-teal-600/40 hover:text-teal-100 px-4 py-2 rounded-lg transition-colors border border-teal-500/30 hover:border-teal-400/50"
          >
            + {t('dashboard.newPatient')}
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="loading loading-spinner loading-lg text-teal-400"></div>
            <p className="theme-text-secondary mt-2">{t('dashboard.loadingPatients')}</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">{t('dashboard.errorLoading')}: {error}</p>
            <button
              onClick={() => fetchPatients(false)}
              className="bg-theme-card text-gray-300 hover:bg-theme-surface hover:text-white px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-teal-500/30"
            >
              {t('dashboard.retry')}
            </button>
          </div>
        ) : patients && patients.length > 0 ? (
          <div className="grid gap-4">
            {patients.slice(0, 5).map((patient) => (
              <Link
                key={patient.id}
                to={`/patients/${patient.id}`}
                className="patient-card theme-card theme-text-secondary theme-hover hover:theme-text-primary border theme-border hover:border-teal-500/30 p-4 rounded-lg transition-all duration-200 block"
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
                      <h3 className="font-semibold theme-text-primary">{patient.name || 'Sem Nome'}</h3>
                      <div className="text-sm theme-text-secondary flex items-center">
                        <span className="mr-3">{t('dashboard.id')}: {patient.id.slice(0, 8)}...</span>
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
                              return t('dashboard.age', { count: age });
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
                <p className="theme-text-secondary text-sm">
                  {t('dashboard.showingXofY', { count: 5, total: patients.length })}
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
              <p className="text-lg mb-2">{t('dashboard.noPatientsFound')}</p>
              <p className="text-sm">{t('dashboard.startCreating')}</p>
            </div>
            <button
              onClick={handleNewPatient}
              className="bg-teal-600/20 text-teal-300 hover:bg-teal-600/40 hover:text-teal-100 px-6 py-2 rounded-lg transition-colors border border-teal-500/30 hover:border-teal-400/50"
            >
              + {t('dashboard.createFirstPatient')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;