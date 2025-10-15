import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { calculatorService, dynamicCalculatorService } from '../../services/api';
import CalculatorModal from './CalculatorModal';
import CalculatorCard from './CalculatorCard';
import DynamicCalculator from './DynamicCalculator';
import ConversaoGotejamentoDialog from './Calculators/prebuilt/ConversaoGotejamento';
import ConversaoMcgKgMinDialog from './Calculators/prebuilt/ConversaoMcgKgMin';
import ConversaoMcgKgMinGttMinDialog from './Calculators/prebuilt/ConversaoMcgKgMinGttMin';
import BMI from './Calculators/prebuilt/BMI';
import BSAMosteller from './Calculators/prebuilt/BSAMosteller';
import BSADuBois from './Calculators/prebuilt/BSADuBois';
import IdealBodyWeight from './Calculators/prebuilt/IdealBodyWeight';
import LeanBodyWeight from './Calculators/prebuilt/LeanBodyWeight';
import AdjustedBodyWeight from './Calculators/prebuilt/AdjustedBodyWeight';
import CockcroftGault from './Calculators/prebuilt/CockcroftGault';
import CKDEPI2021 from './Calculators/prebuilt/CKDEPI2021';
import FeNa from './Calculators/prebuilt/FeNa';
import FeUrea from './Calculators/prebuilt/FeUrea';
import CorrectedCalcium from './Calculators/prebuilt/CorrectedCalcium';
import Osmolarity from './Calculators/prebuilt/Osmolarity';
import IronDeficit from './Calculators/prebuilt/IronDeficit';
import FriedewaldLDL from './Calculators/prebuilt/FriedewaldLDL';
import PaO2FiO2 from './Calculators/prebuilt/PaO2FiO2';
import QTcCalculation from './Calculators/prebuilt/QTcCalculation';
import AnionGap from './Calculators/prebuilt/AnionGap';
import SpO2FiO2Ratio from './Calculators/prebuilt/SpO2FiO2Ratio';
import ChildPugh from './Calculators/prebuilt/ChildPugh';
import MELD from './Calculators/prebuilt/MELD';
// import ParklandFormula from './prebuilt/ParklandFormula';
import QSOFA from './Calculators/prebuilt/qSOFA';
import APACHE2 from './Calculators/prebuilt/APACHE2';
import SOFA from './Calculators/prebuilt/SOFA';
import CHA2DS2VASc from './Calculators/prebuilt/CHA2DS2VASc';
import HASBLED from './Calculators/prebuilt/HASBLED';
// Cardiology Risk Calculators
import HEART from './Calculators/prebuilt/HEART';
import GRACE from './Calculators/prebuilt/GRACE';
import TIMISTEMI from './Calculators/prebuilt/TIMISTEMI';
import TIMINSTE from './Calculators/prebuilt/TIMINSTE';
// New Architecture Calculators
import CAGECalculator from './Calculators/CAGECalculator';
import MAPCalculator from './Calculators/MAPCalculator';
import GASACalculator from './Calculators/GASACalculator';
import HbA1cEAGCalculator from './Calculators/HbA1cEAGCalculator';
import ISTCalculator from './Calculators/ISTCalculator';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ExternalLink } from 'lucide-react';
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
  const [dynamicCalculators, setDynamicCalculators] = useState([]);
  const [showDynamicCalculator, setShowDynamicCalculator] = useState(null);
  
  // Store hooks
  const { calculators, getAll, seedCalculators } = useCalculatorStore();
  const { refresh: refreshTags } = useTagCatalogStore();

  // Load calculators and tags on mount
  useEffect(() => {
    const initializeData = async () => {
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
        
        // Load dynamic calculators from backend
        try {
          const dynamicResponse = await dynamicCalculatorService.listCalculators();
          if (dynamicResponse.data && Array.isArray(dynamicResponse.data)) {
            setDynamicCalculators(dynamicResponse.data.map(calc => ({
              ...calc,
              isDynamic: true,
              category: calc.domain || 'Conversões'
            })));
          }
        } catch (dynamicErr) {
          console.warn('Erro ao carregar calculadoras dinâmicas:', dynamicErr);
          // Don't fail the entire load if dynamic calculators fail
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
  const allCalculators = [...(Array.isArray(calculators) ? calculators : []), ...dynamicCalculators];
  const categories = [...new Set(allCalculators.map(calc => calc.category).filter(Boolean))];

  // Filter calculators based on search and category
  const filteredCalculators = allCalculators.filter(calculator => {
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
      (selectedCategory === 'public' && !calculator.isPersonal) ||
      (selectedCategory === 'dynamic' && calculator.isDynamic) ||
      // Filter by medical categories
      (['Cardiologia', 'Hepatologia', 'Pneumologia', 'Função Renal', 'Metabólico', 'Antropometria', 'Conversões'].includes(selectedCategory) && calculator.category === selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  // Filtered calculators ready for display

  // Abrir modal da calculadora
  const openCalculator = (calculator) => {
    // Check if it's a dynamic calculator
    if (calculator.isDynamic) {
      setShowDynamicCalculator(calculator.id);
      return;
    }
    
    // Check if it's a hardcoded calculator
    if (calculator.isHardcoded && calculator.id === 'conv-gotejamento') {
      setShowHardcodedCalculator(calculator.id);
      return;
    }
    if (calculator.isHardcoded && calculator.id === 'conv-mcg-kg-min') {
      setShowHardcodedCalculator(calculator.id);
      return;
    }
    if (calculator.isHardcoded && calculator.id === 'conv-mcg-kg-min-gtt-min') {
      setShowHardcodedCalculator(calculator.id);
      return;
    }
    if (calculator.isHardcoded && calculator.id === 'bmi-calculator') {
      setShowHardcodedCalculator(calculator.id);
      return;
    }
    if (calculator.isHardcoded && calculator.id === 'bsa-mosteller') {
      setShowHardcodedCalculator(calculator.id);
      return;
    }
    if (calculator.isHardcoded && calculator.id === 'bsa-dubois') {
      setShowHardcodedCalculator(calculator.id);
      return;
    }
    if (calculator.isHardcoded && calculator.id === 'ideal-body-weight') {
      setShowHardcodedCalculator(calculator.id);
      return;
    }
    if (calculator.isHardcoded && calculator.id === 'lean-body-weight') {
      setShowHardcodedCalculator(calculator.id);
      return;
    }
    if (calculator.isHardcoded && calculator.id === 'adjusted-body-weight') {
      setShowHardcodedCalculator(calculator.id);
      return;
    }
    if (calculator.isHardcoded && calculator.id === 'cockcroft-gault') {
      setShowHardcodedCalculator(calculator.id);
      return;
    }
    if (calculator.isHardcoded && calculator.id === 'ckd-epi-2021') {
      setShowHardcodedCalculator(calculator.id);
      return;
    }
    if (calculator.isHardcoded && calculator.id === 'fena') {
      setShowHardcodedCalculator(calculator.id);
      return;
    }
    if (calculator.isHardcoded && calculator.id === 'feurea') {
      setShowHardcodedCalculator(calculator.id);
      return;
    }
    if (calculator.isHardcoded && calculator.id === 'corrected-calcium') {
      setShowHardcodedCalculator(calculator.id);
      return;
    }
    if (calculator.isHardcoded && calculator.id === 'osmolarity') {
      setShowHardcodedCalculator(calculator.id);
      return;
    }
    if (calculator.isHardcoded && calculator.id === 'iron-deficit') {
       setShowHardcodedCalculator(calculator.id);
       return;
     }
     if (calculator.isHardcoded && calculator.id === 'friedewald-ldl') {
       setShowHardcodedCalculator(calculator.id);
       return;
     }
     if (calculator.isHardcoded && calculator.id === 'pao2-fio2') {
       setShowHardcodedCalculator(calculator.id);
       return;
     }
     if (calculator.isHardcoded && calculator.id === 'qtc-calculation') {
       setShowHardcodedCalculator(calculator.id);
       return;
     }
     if (calculator.isHardcoded && calculator.id === 'anion-gap') {
       setShowHardcodedCalculator(calculator.id);
       return;
     }
     if (calculator.isHardcoded && calculator.id === 'spo2-fio2-ratio') {
       setShowHardcodedCalculator(calculator.id);
       return;
     }
     if (calculator.isHardcoded && calculator.id === 'child-pugh') {
       setShowHardcodedCalculator(calculator.id);
       return;
     }
     if (calculator.isHardcoded && calculator.id === 'meld-score') {
       setShowHardcodedCalculator(calculator.id);
       return;
     }
     if (calculator.isHardcoded && calculator.id === 'parkland-formula') {
       setShowHardcodedCalculator(calculator.id);
       return;
     }
     if (calculator.isHardcoded && calculator.id === 'qsofa') {
       setShowHardcodedCalculator(calculator.id);
       return;
     }
     if (calculator.isHardcoded && calculator.id === 'apache2') {
       setShowHardcodedCalculator(calculator.id);
       return;
     }
     if (calculator.isHardcoded && calculator.id === 'sofa') {
       setShowHardcodedCalculator(calculator.id);
       return;
     }
     if (calculator.isHardcoded && calculator.id === 'cha2ds2-vasc') {
       setShowHardcodedCalculator(calculator.id);
       return;
     }
     if (calculator.isHardcoded && calculator.id === 'has-bled') {
       setShowHardcodedCalculator(calculator.id);
       return;
     }
     
     // New Architecture Calculators
     if (calculator.id === 'cage-calculator') {
       setShowHardcodedCalculator(calculator.id);
       return;
     }
     if (calculator.id === 'map-calculator') {
       setShowHardcodedCalculator(calculator.id);
       return;
     }
     if (calculator.id === 'gasa-calculator') {
       setShowHardcodedCalculator(calculator.id);
       return;
     }
     if (calculator.id === 'hba1c-eag-calculator') {
       setShowHardcodedCalculator(calculator.id);
       return;
     }
     if (calculator.id === 'ist-calculator') {
       setShowHardcodedCalculator(calculator.id);
       return;
     }
     
     // Cardiology Risk Calculators
     if (calculator.id === 'heart-score') {
       setShowHardcodedCalculator(calculator.id);
       return;
     }
     if (calculator.id === 'grace-score') {
       setShowHardcodedCalculator(calculator.id);
       return;
     }
     if (calculator.id === 'timi-stemi') {
       setShowHardcodedCalculator(calculator.id);
       return;
     }
     if (calculator.id === 'timi-nste') {
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
  
  // Fechar calculadora dinâmica
  const closeDynamicCalculator = () => {
    setShowDynamicCalculator(null);
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
        {/* Header with navigation */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Calculadoras Médicas</h2>
          <Link to="/calculators">
            <Button 
              variant="outline" 
              size="sm"
              className="bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/40 border-emerald-500/30"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Todas
            </Button>
          </Link>
        </div>
        
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
          <Badge
            variant={selectedCategory === 'dynamic' ? 'default' : 'secondary'}
            className={`cursor-pointer transition-colors ${
              selectedCategory === 'dynamic' 
                ? 'bg-teal-600 text-white hover:bg-teal-700'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => setSelectedCategory('dynamic')}
          >
            Dinâmicas
          </Badge>
          
          {/* Medical Category Filters */}
          {categories.includes('Cardiologia') && (
            <Badge
              variant={selectedCategory === 'Cardiologia' ? 'default' : 'secondary'}
              className={`cursor-pointer transition-colors ${
                selectedCategory === 'Cardiologia' 
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setSelectedCategory('Cardiologia')}
            >
              Cardiologia
            </Badge>
          )}
          
          {categories.includes('Hepatologia') && (
            <Badge
              variant={selectedCategory === 'Hepatologia' ? 'default' : 'secondary'}
              className={`cursor-pointer transition-colors ${
                selectedCategory === 'Hepatologia' 
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setSelectedCategory('Hepatologia')}
            >
              Hepatologia
            </Badge>
          )}
          
          {categories.includes('Pneumologia') && (
            <Badge
              variant={selectedCategory === 'Pneumologia' ? 'default' : 'secondary'}
              className={`cursor-pointer transition-colors ${
                selectedCategory === 'Pneumologia' 
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setSelectedCategory('Pneumologia')}
            >
              Pneumologia
            </Badge>
          )}
          
          {categories.includes('Função Renal') && (
            <Badge
              variant={selectedCategory === 'Função Renal' ? 'default' : 'secondary'}
              className={`cursor-pointer transition-colors ${
                selectedCategory === 'Função Renal' 
                  ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setSelectedCategory('Função Renal')}
            >
              Função Renal
            </Badge>
          )}
          
          {categories.includes('Metabólico') && (
            <Badge
              variant={selectedCategory === 'Metabólico' ? 'default' : 'secondary'}
              className={`cursor-pointer transition-colors ${
                selectedCategory === 'Metabólico' 
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setSelectedCategory('Metabólico')}
            >
              Metabólico
            </Badge>
          )}
          
          {categories.includes('Antropometria') && (
            <Badge
              variant={selectedCategory === 'Antropometria' ? 'default' : 'secondary'}
              className={`cursor-pointer transition-colors ${
                selectedCategory === 'Antropometria' 
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setSelectedCategory('Antropometria')}
            >
              Antropometria
            </Badge>
          )}
          
          {categories.includes('Conversões') && (
            <Badge
              variant={selectedCategory === 'Conversões' ? 'default' : 'secondary'}
              className={`cursor-pointer transition-colors ${
                selectedCategory === 'Conversões' 
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setSelectedCategory('Conversões')}
            >
              Conversões
            </Badge>
          )}
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

        {/* Hardcoded Calculator - Conversão mcg/kg/min ↔ gtt/min */}
        {showHardcodedCalculator === 'conv-mcg-kg-min-gtt-min' && (
          <ConversaoMcgKgMinGttMinDialog
            open={true}
            onOpenChange={closeHardcodedCalculator}
          />
        )}

        {/* Anthropometric Calculators */}
        {showHardcodedCalculator === 'bmi-calculator' && (
          <BMI 
            open={true} 
            onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
          />
        )}

        {showHardcodedCalculator === 'bsa-mosteller' && (
          <BSAMosteller 
            open={true} 
            onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
          />
        )}

        {showHardcodedCalculator === 'bsa-dubois' && (
          <BSADuBois 
            open={true} 
            onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
          />
        )}

        {showHardcodedCalculator === 'ideal-body-weight' && (
          <IdealBodyWeight 
            open={true} 
            onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
          />
        )}

        {showHardcodedCalculator === 'lean-body-weight' && (
          <LeanBodyWeight 
            open={true} 
            onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
          />
        )}

        {showHardcodedCalculator === 'adjusted-body-weight' && (
          <AdjustedBodyWeight 
            open={true} 
            onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
          />
        )}
        
        {showHardcodedCalculator === 'cockcroft-gault' && (
          <CockcroftGault 
            open={true} 
            onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
          />
        )}
        
        {showHardcodedCalculator === 'ckd-epi-2021' && (
          <CKDEPI2021 
            open={true} 
            onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
          />
        )}
        
        {showHardcodedCalculator === 'fena' && (
          <FeNa 
            open={true} 
            onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
          />
        )}
        
        {showHardcodedCalculator === 'feurea' && (
          <FeUrea 
            open={true} 
            onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
          />
        )}

        {/* Metabolic Calculators */}
        {showHardcodedCalculator === 'corrected-calcium' && (
          <CorrectedCalcium 
            open={true} 
            onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
          />
        )}

        {showHardcodedCalculator === 'osmolarity' && (
          <Osmolarity 
            open={true} 
            onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
          />
        )}

        {showHardcodedCalculator === 'iron-deficit' && (
           <IronDeficit 
             open={true} 
             onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
           />
         )}

         {/* Cardiology Calculators */}
         {showHardcodedCalculator === 'friedewald-ldl' && (
           <FriedewaldLDL 
             open={true} 
             onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
           />
         )}

         {showHardcodedCalculator === 'pao2-fio2' && (
           <PaO2FiO2 
             open={true} 
             onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
           />
         )}

         {/* New Calculators - Phase 1 & 2 */}
         {showHardcodedCalculator === 'qtc-calculation' && (
           <QTcCalculation 
             open={true} 
             onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
           />
         )}

         {showHardcodedCalculator === 'anion-gap' && (
           <AnionGap 
             open={true} 
             onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
           />
         )}

         {showHardcodedCalculator === 'spo2-fio2-ratio' && (
           <SpO2FiO2Ratio 
             open={true} 
             onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
           />
         )}

         {showHardcodedCalculator === 'child-pugh' && (
           <ChildPugh 
             open={true} 
             onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
           />
         )}

         {showHardcodedCalculator === 'meld-score' && (
           <MELD 
             open={true} 
             onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
           />
         )}

         {/* {showHardcodedCalculator === 'parkland-formula' && (
           <ParklandFormula 
             open={true} 
             onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
           />
         )} */}
         
         {showHardcodedCalculator === 'qsofa' && (
           <QSOFA
             open={showHardcodedCalculator === 'qsofa'}
             onOpenChange={() => setShowHardcodedCalculator(null)}
           />
         )}
         
         {showHardcodedCalculator === 'apache2' && (
           <APACHE2 
             open={true} 
             onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
           />
         )}
         
         {showHardcodedCalculator === 'sofa' && (
           <SOFA 
             open={true} 
             onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
           />
         )}
         
         {showHardcodedCalculator === 'cha2ds2-vasc' && (
           <CHA2DS2VASc 
             open={true} 
             onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
           />
         )}
         
         {showHardcodedCalculator === 'has-bled' && (
           <HASBLED 
             open={true} 
             onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
           />
         )}
         
         {/* New Architecture Calculators - Phase 2 */}
         {showHardcodedCalculator === 'cage-calculator' && (
           <CAGECalculator 
             open={true} 
             onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
           />
         )}
         
         {showHardcodedCalculator === 'map-calculator' && (
           <MAPCalculator 
             open={true} 
             onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
           />
         )}
         
         {showHardcodedCalculator === 'gasa-calculator' && (
           <GASACalculator 
             open={true} 
             onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
           />
         )}
         
         {showHardcodedCalculator === 'hba1c-eag-calculator' && (
           <HbA1cEAGCalculator 
             open={true} 
             onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
           />
         )}
         
         {showHardcodedCalculator === 'ist-calculator' && (
           <ISTCalculator 
             open={true} 
             onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
           />
         )}
         
         {/* Cardiology Risk Calculators */}
         {showHardcodedCalculator === 'heart-score' && (
           <HEART 
             open={true} 
             onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
           />
         )}
         
         {showHardcodedCalculator === 'grace-score' && (
           <GRACE 
             open={true} 
             onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
           />
         )}
         
         {showHardcodedCalculator === 'timi-stemi' && (
           <TIMISTEMI 
             open={true} 
             onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
           />
         )}
         
         {showHardcodedCalculator === 'timi-nste' && (
           <TIMINSTE 
             open={true} 
             onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
           />
         )}
         
         {/* Dynamic Calculator */}
        {showDynamicCalculator && (
          <DynamicCalculator
            calculatorId={showDynamicCalculator}
            open={true}
            onOpenChange={(isOpen) => { if (!isOpen) closeDynamicCalculator(); }}
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