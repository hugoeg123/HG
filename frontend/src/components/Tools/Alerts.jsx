import { useState, useEffect } from 'react';
import { alertService } from '../../services/api';
import { usePatientStore } from '../../store/patientStore';

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
    title: '',
    description: '',
    type: 'info',
    patientId: null,
    recordId: null,
    dueDate: '',
  });

  const { currentPatient } = usePatientStore();

  // Carregar alertas
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setIsLoading(true);
        const response = await alertService.getAll();
        
        // Connector: Backend retorna { alerts: [...], pagination: {...} }
        // Extrair array de alertas da resposta
        const alertsData = response.data?.alerts || response.data || [];
        
        // Garantir que sempre seja um array
        setAlerts(Array.isArray(alertsData) ? alertsData : []);
        setError(null);
        
        console.log('Alertas carregados:', alertsData);
      } catch (err) {
        console.error('Erro ao carregar alertas:', err);
        setError(err.response?.data?.message || 'Não foi possível carregar os alertas');
        setAlerts([]); // Garantir array vazio em caso de erro
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, []);

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
    
    if (!newAlert.title.trim()) {
      setError('O título do alerta é obrigatório');
      return;
    }

    try {
      setIsLoading(true);
      const response = await alertService.create(newAlert);
      // Hook: Garantir que alerts seja array antes de adicionar novo item
      const currentAlerts = Array.isArray(alerts) ? alerts : [];
      setAlerts([...currentAlerts, response.data]);
      setNewAlert({
        title: '',
        description: '',
        type: 'info',
        patientId: currentPatient?.id || null,
        recordId: null,
        dueDate: '',
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
    try {
      await alertService.markAsDone(alertId);
      // Hook: Garantir que alerts seja array antes de usar map
      const currentAlerts = Array.isArray(alerts) ? alerts : [];
      setAlerts(currentAlerts.map(alert => 
        alert.id === alertId ? { ...alert, status: 'completed' } : alert
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
  const pendingAlerts = safeAlerts.filter(alert => alert.status === 'pending');
  const completedAlerts = safeAlerts.filter(alert => alert.status === 'completed');

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
    <div className="alerts-container">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Alertas e Lembretes</h3>
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
            <label className="block text-gray-300 mb-1">Título</label>
            <input
              id="alert-title"
              type="text"
              name="title"
              value={newAlert.title}
              onChange={handleNewAlertChange}
              className="input w-full"
              placeholder="Título do alerta"
              aria-label="Título do alerta"
            />
          </div>

          <div className="mb-3">
            <label className="block text-gray-300 mb-1">Descrição</label>
            <textarea
              id="alert-description"
              name="description"
              value={newAlert.description}
              onChange={handleNewAlertChange}
              className="input w-full h-20"
              placeholder="Descrição do alerta"
              aria-label="Descrição do alerta"
            ></textarea>
          </div>

          <div className="mb-3">
            <label className="block text-gray-300 mb-1">Tipo</label>
            <select
              id="alert-type"
              name="type"
              value={newAlert.type}
              onChange={handleNewAlertChange}
              className="input w-full"
              aria-label="Tipo do alerta"
            >
              <option value="info">Informação</option>
              <option value="warning">Aviso</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-gray-300 mb-1">Data de Vencimento</label>
            <input
              id="alert-due-date"
              type="date"
              name="dueDate"
              value={newAlert.dueDate}
              onChange={handleNewAlertChange}
              aria-label="Data de vencimento do alerta"
              className="input w-full"
            />
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
                    className={`p-3 rounded ${isOverdue(alert.dueDate) ? 'bg-red-900 bg-opacity-30 border border-red-800' : 
                      alert.type === 'urgent' ? 'bg-red-900 bg-opacity-20 border border-red-800' :
                      alert.type === 'warning' ? 'bg-yellow-900 bg-opacity-20 border border-yellow-800' :
                      'bg-teal-900 bg-opacity-20 border border-teal-800'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="text-white font-medium">{alert.title}</h5>
                        {alert.description && (
                          <p className="text-gray-300 text-sm mt-1">{alert.description}</p>
                        )}
                        {alert.patientId && currentPatient && alert.patientId === currentPatient.id && (
                          <div className="mt-1 text-xs text-gray-400">
                            Paciente: {currentPatient.name}
                          </div>
                        )}
                        {alert.dueDate && (
                          <div className={`mt-1 text-xs ${isOverdue(alert.dueDate) ? 'text-red-400' : 'text-gray-400'}`}>
                            Vencimento: {formatDate(alert.dueDate)}
                            {isOverdue(alert.dueDate) && ' (Atrasado)'}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleMarkAsDone(alert.id)}
                          className="text-green-400 hover:text-green-300"
                          title="Marcar como concluído"
                          aria-label="Marcar alerta como concluído"
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
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="text-red-400 hover:text-red-300"
                          title="Excluir alerta"
                          aria-label="Excluir alerta"
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
                        <h5 className="text-gray-400 font-medium line-through">{alert.title}</h5>
                        {alert.description && (
                          <p className="text-gray-500 text-sm mt-1 line-through">{alert.description}</p>
                        )}
                        {alert.completedAt && (
                          <div className="mt-1 text-xs text-gray-500">
                            Concluído em: {formatDate(alert.completedAt)}
                          </div>
                        )}
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