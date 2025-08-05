import { useState, useEffect } from 'react';
import { calculatorService } from '../../services/api';
import CalculatorModal from './CalculatorModal';
import CalculatorCard from './CalculatorCard';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

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
  const [selectedCategory, setSelectedCategory] = useState('all');
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

  // Get unique categories for filter options
  const categories = Array.isArray(calculators) ? 
    [...new Set(calculators.map(calc => calc.category).filter(Boolean))] : [];

  // Filter calculators based on search and category
  const filteredCalculators = Array.isArray(calculators) ? calculators.filter(calculator => {
    if (!calculator) return false;
    
    // Search filter
    const matchesSearch = (
      (calculator.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (calculator.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (calculator.category || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Category filter
    const matchesCategory = selectedCategory === 'all' || 
      calculator.category === selectedCategory ||
      (selectedCategory === 'personal' && calculator.isPersonal) ||
      (selectedCategory === 'public' && !calculator.isPersonal);
    
    return matchesSearch && matchesCategory;
  }) : [];

  // Hook: filteredCalculators now contains all filtered results, no need for separate grouping

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
    <div className="calculator-container h-full flex flex-col">
        {/* Header with search and filters */}
        <div className="mb-6">
        {/* Search field */}
        <div className="relative mb-4">
          <Input
            type="text"
            placeholder="Procurar calculadora..."
            className="input pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 absolute left-2 top-2 text-gray-400"
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

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge
            variant={selectedCategory === 'all' ? 'default' : 'secondary'}
            className={`cursor-pointer transition-colors ${
              selectedCategory === 'all' 
                ? 'bg-teal-600 text-white hover:bg-teal-700'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => setSelectedCategory('all')}
          >
            Todas
          </Badge>
          <Badge
            variant={selectedCategory === 'personal' ? 'default' : 'secondary'}
            className={`cursor-pointer transition-colors ${
              selectedCategory === 'personal' 
                ? 'bg-teal-600 text-white hover:bg-teal-700'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => setSelectedCategory('personal')}
          >
            Minhas
          </Badge>
          <Badge
            variant={selectedCategory === 'public' ? 'default' : 'secondary'}
            className={`cursor-pointer transition-colors ${
              selectedCategory === 'public' 
                ? 'bg-teal-600 text-white hover:bg-teal-700'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => setSelectedCategory('public')}
          >
            Públicas
          </Badge>
          {categories.map(category => (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'default' : 'secondary'}
              className={`cursor-pointer transition-colors ${
                selectedCategory === category 
                  ? 'bg-teal-600 text-white hover:bg-teal-700'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* Create new calculator button */}
        <Button
          onClick={handleNewCalculator}
          className="btn btn-primary w-full md:w-auto mb-4"
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
          + Criar Nova Calculadora
        </Button>
      </div>

      {/* Main content */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-400 text-center py-4">{error}</div>
      ) : (
        <div>
          {/* Results summary */}
          <div className="mb-4">
            <p className="text-gray-400 text-sm">
              {filteredCalculators.length === 0 
                ? 'Nenhuma calculadora encontrada' 
                : `${filteredCalculators.length} calculadora${filteredCalculators.length !== 1 ? 's' : ''} encontrada${filteredCalculators.length !== 1 ? 's' : ''}`
              }
              {searchQuery && ` para "${searchQuery}"`}
              {selectedCategory !== 'all' && ` na categoria "${selectedCategory === 'personal' ? 'Minhas' : selectedCategory === 'public' ? 'Públicas' : selectedCategory}"`}
            </p>
          </div>

          {/* Calculators grid */}
          {filteredCalculators.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-500 mb-4"
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
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'Nenhuma calculadora encontrada' 
                  : 'Nenhuma calculadora disponível'
                }
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Tente ajustar os filtros ou criar uma nova calculadora.'
                  : 'Comece criando sua primeira calculadora médica.'
                }
              </p>
              <Button
                onClick={handleNewCalculator}
                className="btn btn-primary"
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
                Criar Primeira Calculadora
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCalculators.map((calculator) => (
                <CalculatorCard
                  key={calculator.id}
                  calculator={calculator}
                  onUse={openCalculator}
                />
              ))}
            </div>
          )}
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