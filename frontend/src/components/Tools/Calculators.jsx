import { useState, useEffect } from 'react';
import { calculatorService } from '../../services/api';
import CalculatorModal from './CalculatorModal';

/**
 * Calculators component - Displays and manages medical calculators
 * 
 * @component
 * @example
 * return (
 *   <Calculators />
 * )
 * 
 * Integra com: services/api.js para calls a /calculators/, e components/Tools/CalculatorModal.jsx
 * 
 * IA prompt: Adicionar categorização de calculadoras por especialidade médica
 */
const Calculators = () => {
  const [calculators, setCalculators] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCalculator, setSelectedCalculator] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Carregar calculadoras
  useEffect(() => {
    const fetchCalculators = async () => {
      try {
        setIsLoading(true);
        const response = await calculatorService.getAll();
        // Backend agora retorna array diretamente
        const calculatorsList = Array.isArray(response.data) ? response.data : [];
        setCalculators(calculatorsList);
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar calculadoras:', err);
        setError('Não foi possível carregar as calculadoras médicas');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalculators();
  }, []);

  // Filtrar calculadoras com base na pesquisa
  const filteredCalculators = Array.isArray(calculators) ? calculators.filter(calculator => {
    if (!calculator) return false;
    return (
      (calculator.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (calculator.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (calculator.category || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) : [];

  // Agrupar calculadoras por tipo (minhas/públicas)
  const myCalculators = filteredCalculators.filter(calc => calc.isPersonal);
  const publicCalculators = filteredCalculators.filter(calc => !calc.isPersonal);

  // Abrir modal da calculadora
  const openCalculator = (calculator) => {
    setSelectedCalculator(calculator);
    setShowModal(true);
  };

  // Fechar modal da calculadora
  const closeCalculator = () => {
    setShowModal(false);
    setSelectedCalculator(null);
  };

  // Criar nova calculadora
  const handleNewCalculator = () => {
    setSelectedCalculator({
      name: '',
      description: '',
      category: '',
      formula: '',
      fields: [],
      isPersonal: true,
    });
    setShowModal(true);
  };

  return (
    <div className="calculator-container">
      {/* Campo de pesquisa */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Procurar calculadora..."
          className="input w-full pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 absolute left-2 top-2.5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Conteúdo principal */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-400 text-center py-4">{error}</div>
      ) : (
        <div>
          {/* Minhas calculadoras */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-3">Minhas Calculadoras</h3>
            {myCalculators.length === 0 ? (
              <div className="text-gray-400 text-center py-4">
                {searchQuery ? 'Nenhuma calculadora pessoal encontrada' : 'Você não tem calculadoras personalizadas'}
              </div>
            ) : (
              <div className="space-y-3">
                {myCalculators.map((calculator) => (
                  <div
                    key={calculator.id}
                    className="calculator-item"
                    onClick={() => openCalculator(calculator)}
                  >
                    <div className="flex items-start">
                      <div className="mr-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-purple-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{calculator.name}</h4>
                        <p className="text-sm text-gray-400">{calculator.description}</p>
                        {calculator.lastUsed && (
                          <p className="text-xs text-gray-500 mt-1">
                            Usado recentemente
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Calculadoras públicas */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Públicas</h3>
            {publicCalculators.length === 0 ? (
              <div className="text-gray-400 text-center py-4">
                {searchQuery ? 'Nenhuma calculadora pública encontrada' : 'Não há calculadoras públicas disponíveis'}
              </div>
            ) : (
              <div className="space-y-3">
                {publicCalculators.map((calculator) => (
                  <div
                    key={calculator.id}
                    className="calculator-item"
                    onClick={() => openCalculator(calculator)}
                  >
                    <div className="flex items-start">
                      <div className="mr-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-blue-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{calculator.name}</h4>
                        <p className="text-sm text-gray-400">{calculator.description}</p>
                        {calculator.category && (
                          <span className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded mt-1 inline-block">
                            {calculator.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botão para criar nova calculadora */}
          <button
            onClick={handleNewCalculator}
            className="mt-6 w-full btn btn-primary flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
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
            Nova Calculadora
          </button>
        </div>
      )}

      {/* Modal da calculadora */}
      {showModal && selectedCalculator && (
        <CalculatorModal
          calculator={selectedCalculator}
          onClose={closeCalculator}
          isNew={!selectedCalculator.id}
        />
      )}
    </div>
  );
};

export default Calculators;

// Conector: Integra com RightSidebar.jsx para exibição na interface e com calculatorService para comunicação com backend