import { useState, useEffect } from 'react';
import { alertService } from '../../services/api';
import { usePatientStore } from '../../store/patientStore';
import { subscribeToAlerts, initSocket } from '../../services/socket';
import { useEventListener } from '../../lib/events';

/**
 * Alerts component - Exibe e gerencia alertas médicos
 * 
 * @component
 * @example
 * return (
 *   <Alerts />
 * )
 */
const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    message: '',
    severity: 'info',
    patientId: null,
    recordId: null,
  });

  const { currentPatient } = usePatientStore();

  // Carregar alertas
  useEffect(() => {
    // Garantir socket inicializado
    initSocket();

    const fetchAlerts = async () => {
      try {
        const response = await alertService.getAll({ params: { unread: true } });

        // Connector: Backend retorna { alerts: [...], pagination: {...} }
        const alertsData = response.data?.alerts || response.data || [];

        setAlerts(prevAlerts => {
          const newAlerts = Array.isArray(alertsData) ? alertsData : [];
          // Comparação simples para evitar re-render
          if (JSON.stringify(prevAlerts) === JSON.stringify(newAlerts)) return prevAlerts;
          return newAlerts;
        });
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar alertas:', err);
        if (alerts.length === 0) {
          setError(err.response?.data?.message || 'Não foi possível carregar os alertas');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();

    // Inscrição no Socket para novos alertas (Real-time)
    const unsubscribe = subscribeToAlerts((newAlertData) => {
      console.log('⚡ Novo alerta recebido via Socket:', newAlertData);

      // Tocar som de notificação (opcional)
      try {
        const audio = new Audio('/sounds/alert.mp3'); // Assumindo path, se não existir falha silenciosamente
        audio.play().catch(() => { });
      } catch (e) { }

      setAlerts(prev => [newAlertData, ...prev]);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEventListener('alert.local', (localAlert) => {
    setAlerts(prev => [localAlert, ...prev]);
  }, [setAlerts], 'Alerts');

  // Atualizar patientId quando o paciente atual mudar
  useEffect(() => {
    if (currentPatient) {
      setNewAlert(prev => ({
        ...prev,
        patientId: currentPatient.id,
      }));
    }
  }, [currentPatient]);

  // Manipular mudanças no formulário de novo alerta
  const handleNewAlertChange = (e) => {
    const { name, value } = e.target;
    setNewAlert({
      ...newAlert,
      [name]: value,
    });
  };

  // Criar novo alerta
  const handleCreateAlert = async (e) => {
    e.preventDefault();

    if (!newAlert.message.trim()) {
      setError('A mensagem do alerta é obrigatória');
      return;
    }

    try {
      setIsLoading(true);
      const response = await alertService.create({
        message: newAlert.message,
        severity: newAlert.severity,
        record_id: newAlert.recordId || null
      });
      // Hook: Garantir que alerts seja array antes de adicionar novo item
      const currentAlerts = Array.isArray(alerts) ? alerts : [];
      setAlerts([...currentAlerts, response.data]);
      setNewAlert({
        message: '',
        severity: 'info',
        patientId: currentPatient?.id || null,
        recordId: null,
      });
      setShowCreateForm(false);
      setError(null);
    } catch (err) {
      console.error('Erro ao criar alerta:', err);
      setError(err.response?.data?.message || 'Erro ao criar alerta');
    } finally {
      setIsLoading(false);
    }
  };

  // Marcar alerta como concluído
  const handleMarkAsDone = async (alertId) => {
    const isEphemeral = String(alertId).startsWith('ephem_');
    if (isEphemeral) {
      const currentAlerts = Array.isArray(alerts) ? alerts : [];
      setAlerts(currentAlerts.filter(a => a.id !== alertId));
      return;
    }
    try {
      await alertService.markAsRead(alertId);
      const currentAlerts = Array.isArray(alerts) ? alerts : [];
      setAlerts(currentAlerts.map(alert =>
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ));
    } catch (err) {
      console.error('Erro ao marcar alerta como concluído:', err);
      setError('Erro ao atualizar o status do alerta');
    }
  };

  // Excluir alerta
  const handleDeleteAlert = async (alertId) => {
    if (!window.confirm('Tem certeza que deseja excluir este alerta?')) {
      return;
    }

    try {
      await alertService.delete(alertId);
      // Hook: Garantir que alerts seja array antes de usar filter
      const currentAlerts = Array.isArray(alerts) ? alerts : [];
      setAlerts(currentAlerts.filter(alert => alert.id !== alertId));
    } catch (err) {
      console.error('Erro ao excluir alerta:', err);
      setError('Erro ao excluir o alerta');
    }
  };

  // Filtrar alertas por status - Hook: Proteção contra dados inválidos
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const pendingAlerts = safeAlerts.filter(alert => alert.is_read === false);
  const completedAlerts = safeAlerts.filter(alert => alert.is_read === true);

  // Verificar se um alerta está atrasado
  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alertDate = new Date(dueDate);
    alertDate.setHours(0, 0, 0, 0);
    return alertDate < today;
  };

  // Formatar data
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="alerts-container h-full flex flex-col">
      {/* Header with create button */}
      <div className="flex justify-between items-center mb-4">
        <div></div> {/* Empty div for spacing */}
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="text-teal-400 hover:text-teal-300"
          aria-label={showCreateForm ? "Fechar formulário de criação" : "Abrir formulário de criação"}
        >
          {showCreateForm ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
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
          )}
        </button>
      </div>
      {/* Mensagem de erro */}
      {error && (
        <div className="mb-4 p-3 bg-red-900 bg-opacity-30 border border-red-800 text-red-300 rounded">
          {error}
        </div>
      )}

      {/* Formulário de criação de alerta */}
      {showCreateForm && (
        <form onSubmit={handleCreateAlert} className="mb-6 bg-gray-700 p-3 rounded">
          <div className="mb-3">
            <label className="block text-gray-300 mb-1">Mensagem</label>
            <input
              id="alert-message"
              type="text"
              name="message"
              value={newAlert.message}
              onChange={handleNewAlertChange}
              className="input w-full"
              placeholder="Mensagem do alerta"
              aria-label="Mensagem do alerta"
            />
          </div>

          <div className="mb-3">
            <label className="block text-gray-300 mb-1">Registro (opcional)</label>
            <input
              id="alert-record-id"
              type="text"
              name="recordId"
              value={newAlert.recordId || ''}
              onChange={handleNewAlertChange}
              className="input w-full"
              placeholder="ID do registro relacionado"
              aria-label="ID do registro relacionado"
            />
          </div>

          <div className="mb-3">
            <label className="block text-gray-300 mb-1">Severidade</label>
            <select
              id="alert-severity"
              name="severity"
              value={newAlert.severity}
              onChange={handleNewAlertChange}
              className="input w-full"
              aria-label="Severidade do alerta"
            >
              <option value="info">Informação</option>
              <option value="warning">Aviso</option>
              <option value="critical">Crítico</option>
            </select>
          </div>

          <div className="mb-3">
            <div className="text-xs text-gray-400">Alertas automáticos são exibidos abaixo</div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Criando...' : 'Criar Alerta'}
            </button>
          </div>
        </form>
      )}

      {/* Conteúdo principal */}
      {isLoading && !showCreateForm ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      ) : (
        <div>
          {/* Alertas pendentes */}
          <div className="mb-6">
            <h4 className="text-white font-medium mb-2">Pendentes</h4>
            {pendingAlerts.length === 0 ? (
              <div className="text-gray-400 text-center py-4 bg-gray-700 bg-opacity-30 rounded">
                Nenhum alerta pendente
              </div>
            ) : (
              <div className="space-y-3">
                {pendingAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`relative p-4 rounded-lg shadow-sm border-l-4 transition-all duration-200 hover:shadow-md ${alert.severity === 'critical'
                        ? 'bg-red-900/20 border-red-500 text-red-100'
                        : alert.severity === 'warning'
                          ? 'bg-yellow-900/20 border-yellow-500 text-yellow-100'
                          : 'bg-teal-900/20 border-teal-500 text-teal-100'
                      }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {alert.severity === 'critical' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                        {alert.severity === 'warning' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                        {(alert.severity === 'info' || !alert.severity) && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>

                      <div className="flex-1">
                        <h5 className="font-semibold text-sm leading-tight">{alert.message}</h5>
                        {alert.patientId && currentPatient && alert.patientId === currentPatient.id && (
                          <div className="mt-1 text-xs opacity-70 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            <span>Paciente: {currentPatient.name}</span>
                          </div>
                        )}
                        <div className="mt-2 text-xs opacity-60">
                          {formatDate(alert.created_at || new Date())}
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleMarkAsDone(alert.id)}
                          className="p-1 rounded-full hover:bg-white/10 transition-colors text-green-400"
                          title="Marcar como lido"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="p-1 rounded-full hover:bg-white/10 transition-colors text-red-400"
                          title="Excluir"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alertas concluídos */}
          {completedAlerts.length > 0 && (
            <div>
              <h4 className="text-white font-medium mb-2">Concluídos</h4>
              <div className="space-y-3">
                {completedAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded bg-gray-700 bg-opacity-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="text-gray-400 font-medium line-through">{alert.message}</h5>
                      </div>
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="text-gray-500 hover:text-gray-400"
                        title="Excluir alerta"
                        aria-label="Excluir alerta concluído"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Alerts;

// Conector: Integra com RightSidebar.jsx para exibição na interface e com alertService para comunicação com backend
