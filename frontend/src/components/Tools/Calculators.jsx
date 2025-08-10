import { useState, useEffect } from 'react';
import { calculatorService } from '../../services/api';
import CalculatorModal from './CalculatorModal';
import CalculatorCard from './CalculatorCard';
import ConversaoGotejamentoDialog from './prebuilt/ConversaoGotejamento';
import ConversaoMcgKgMinDialog from './prebuilt/ConversaoMcgKgMin';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useCalculatorStore } from '../../store/calculatorStore';
import { useTagCatalogStore } from '../../store/tagCatalogStore';
import { eventUtils, EVENT_TYPES } from '../../lib/events';

/**
 * Calculators component - Displays and manages medical calculators
 * 
 * @component
 * @example
 * return (
 *   <Calculators patientId="patient-123" />
 * )
 * 
 * Integrates with:
 * - store/calculatorStore.js for calculator management and execution
 * - store/tagCatalogStore.js for tag definitions
 * - components/Tools/CalculatorModal.jsx for calculator editing/usage
 * - lib/events.js for reactive updates
 * 
 * @param {Object} props
 * @param {string} props.patientId - ID of the current patient for calculations
 * 
 * IA prompt: Add calculator marketplace, formula builder, and calculation history
 */
const Calculators = ({ patientId = null }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCalculator, setSelectedCalculator] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showHardcodedCalculator, setShowHardcodedCalculator] = useState(null);
  
  // Store hooks
  const { calculators, getAll, seedCalculators } = useCalculatorStore();
  const { refresh: refreshTags } = useTagCatalogStore();

  // Load calculators and tags on mount
  useEffect(() => {
    const initializeData = () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Refresh tags first
        refreshTags();
        
        // Load calculators from store
        let loadedCalculators = getAll();
        
        // Seed with default calculators if none exist
        if (loadedCalculators.length === 0) {
          seedCalculators();
          loadedCalculators = getAll();
        }
        
      } catch (err) {
        console.error('Erro ao carregar calculadoras:', err);
        setError('Não foi possível carregar as calculadoras médicas');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [getAll, refreshTags, seedCalculators]);
  
  // Listen for calculator events
  useEffect(() => {
    const handleCalculatorUpdate = () => {
      // Force re-render by updating loading state
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 100);
    };
    
    eventUtils.on(EVENT_TYPES.CALCULATOR_CREATED, handleCalculatorUpdate);
    eventUtils.on(EVENT_TYPES.CALCULATOR_UPDATED, handleCalculatorUpdate);
    eventUtils.on(EVENT_TYPES.CALCULATOR_DELETED, handleCalculatorUpdate);
    
    return () => {
      eventUtils.off(EVENT_TYPES.CALCULATOR_CREATED, handleCalculatorUpdate);
      eventUtils.off(EVENT_TYPES.CALCULATOR_UPDATED, handleCalculatorUpdate);
      eventUtils.off(EVENT_TYPES.CALCULATOR_DELETED, handleCalculatorUpdate);
    };
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

  // Filtered calculators ready for display

  // Abrir modal da calculadora
  const openCalculator = (calculator) => {
    // Check if it's a hardcoded calculator
    if (calculator.isHardcoded && calculator.id === 'conv-gotejamento') {
      setShowHardcodedCalculator(calculator.id);
      return;
    }
    if (calculator.isHardcoded && calculator.id === 'conv-mcg-kg-min') {
      setShowHardcodedCalculator(calculator.id);
      return;
    }
    
    setSelectedCalculator(calculator);
    setShowModal(true);
  };

  // Fechar modal da calculadora
  const closeCalculator = () => {
    setShowModal(false);
    setSelectedCalculator(null);
  };

  // Fechar calculadora hardcoded
  const closeHardcodedCalculator = () => {
    setShowHardcodedCalculator(null);
  };

  // Create new calculator
  const handleNewCalculator = () => {
    setSelectedCalculator({
      id: '',
      name: '',
      description: '',
      category: '',
      expression: '',
      inputs: [],
      outputs: [{
        key: 'result',
        label: 'Resultado',
        type: 'number',
        unit: '',
        rounding: 2
      }],
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
        </div>

        {/* Create new calculator button */}
        <div className="flex justify-end mb-4">
          <Button 
            onClick={handleNewCalculator} 
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Nova Calculadora
          </Button>
        </div>
      </div>

      {/* Grid of calculators */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400">Carregando calculadoras...</div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-400">{error}</div>
        </div>
      ) : (
        <div className="flex-1">
          {filteredCalculators.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              <div className="mb-4">Nenhuma calculadora encontrada</div>
              <Button 
                onClick={handleNewCalculator} 
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
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

        {/* Hardcoded Calculator - Conversão de Gotejamento */}
        {showHardcodedCalculator === 'conv-gotejamento' && (
          <ConversaoGotejamentoDialog 
            open={true} 
            onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
          />
        )}

        {/* Hardcoded Calculator - Conversão mcg/kg/min ↔ mL/h */}
        {showHardcodedCalculator === 'conv-mcg-kg-min' && (
          <ConversaoMcgKgMinDialog
            open={true}
            onOpenChange={closeHardcodedCalculator}
          />
        )}

        {/* Calculator Modal */}
        {showModal && selectedCalculator && (
          <CalculatorModal
            isOpen={showModal}
            calculator={selectedCalculator}
            onClose={closeCalculator}
            mode={!selectedCalculator.id ? 'create' : 'use'}
            patientId={patientId}
          />
        )}
    </div>
  );
};

export default Calculators;

// Conector: Integra com RightSidebar.jsx para exibição na interface e com calculatorService para comunicação com backend