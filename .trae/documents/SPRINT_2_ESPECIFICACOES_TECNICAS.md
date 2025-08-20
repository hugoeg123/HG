# Sprint 2 - Especificações Técnicas Detalhadas

## 🏗️ Arquitetura e Padrões

### 📋 Template Padrão para Migração

#### Estrutura de Arquivo Base
```jsx
import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Copy, Calculator } from 'lucide-react';
import { toast } from 'sonner';

/**
 * [CalculatorName] - [Brief Description]
 * 
 * Integrates with:
 * - Calculators.jsx via hardcodedCalculators array
 * - Dialog component for modal display
 * - Cards for structured layout
 * 
 * @param {boolean} open - Controls modal visibility
 * @param {function} onOpenChange - Callback for modal state changes
 */
function CalculatorName({ open, onOpenChange }) {
  // State management
  const [inputs, setInputs] = useState({
    // Define input fields
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  // Validation function
  const validateInputs = useCallback(() => {
    const newErrors = {};
    // Add validation logic
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs]);

  // Calculation function
  const calculate = useCallback(() => {
    if (!validateInputs()) return;
    
    try {
      // Calculation logic here
      const calculatedResults = {
        // Results object
      };
      setResults(calculatedResults);
    } catch (error) {
      toast.error('Erro no cálculo: ' + error.message);
    }
  }, [inputs, validateInputs]);

  // Clear function
  const clearForm = useCallback(() => {
    setInputs({
      // Reset to initial state
    });
    setResults(null);
    setErrors({});
  }, []);

  // Copy function
  const copyResults = useCallback(() => {
    if (!results) return;
    
    const resultText = `
[Calculator Name] - Resultados:
${Object.entries(results)
  .map(([key, value]) => `${key}: ${value}`)
  .join('\n')}

Calculado em: ${new Date().toLocaleString('pt-BR')}
    `.trim();
    
    navigator.clipboard.writeText(resultText);
    toast.success('Resultados copiados!');
  }, [results]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            [Calculator Title]
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Dados de Entrada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input fields here */}
              
              <div className="flex gap-2 pt-4">
                <Button onClick={calculate} className="flex-1">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calcular
                </Button>
                <Button variant="outline" onClick={clearForm}>
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Results Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Resultados
                {results && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyResults}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results ? (
                <div className="space-y-3">
                  {/* Results display */}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Preencha os campos e clique em "Calcular"
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Formula Card */}
        <Card>
          <CardHeader>
            <CardTitle>Fórmula e Referências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Fórmula:</h4>
                <code className="bg-muted p-2 rounded block">
                  {/* Formula display */}
                </code>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Interpretação:</h4>
                <p className="text-sm text-muted-foreground">
                  {/* Clinical interpretation */}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {/* References list */}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default CalculatorName;
```

### 🎨 Padrões Visuais

#### Cores e Estados
```jsx
// Cores para resultados
const resultColors = {
  normal: 'text-green-600 bg-green-50 border-green-200',
  warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  danger: 'text-red-600 bg-red-50 border-red-200',
  info: 'text-blue-600 bg-blue-50 border-blue-200'
};

// Componente para exibir resultados com cor
const ResultDisplay = ({ label, value, unit, status = 'normal', interpretation }) => (
  <div className={`p-3 rounded-lg border ${resultColors[status]}`}>
    <div className="flex justify-between items-center">
      <span className="font-medium">{label}:</span>
      <span className="font-bold">{value} {unit}</span>
    </div>
    {interpretation && (
      <p className="text-xs mt-1 opacity-80">{interpretation}</p>
    )}
  </div>
);
```

#### Validação de Entrada
```jsx
// Componente de input com validação
const ValidatedInput = ({ 
  label, 
  value, 
  onChange, 
  error, 
  type = 'number', 
  min, 
  max, 
  step = 'any',
  unit,
  placeholder 
}) => (
  <div className="space-y-2">
    <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>
      {label} {unit && <span className="text-muted-foreground">({unit})</span>}
    </Label>
    <Input
      id={label.toLowerCase().replace(/\s+/g, '-')}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      className={error ? 'border-red-500' : ''}
    />
    {error && (
      <p className="text-sm text-red-500">{error}</p>
    )}
  </div>
);
```

---

## 🔧 Especificações por Calculadora

### 1. DropsToMLConverter.jsx

```jsx
/**
 * Conversão Gotas/min ↔ mL/h
 * 
 * Fórmulas:
 * - gotas/min = gotas_contadas / (tempo_segundos/60)
 * - mL/h = (gotas/min ÷ relacao_gotas_ml) × 60
 * - gotas/min = (mL/h × relacao_gotas_ml) ÷ 60
 */

const DropsToMLConverter = ({ open, onOpenChange }) => {
  const [mode, setMode] = useState('drops-to-ml'); // 'drops-to-ml' | 'ml-to-drops'
  const [inputs, setInputs] = useState({
    drops: '',
    timeSeconds: '',
    dropsPerML: '20', // Padrão para equipo comum
    mlPerHour: ''
  });

  const equipoOptions = [
    { value: '20', label: 'Equipo comum (20 gtt/mL)' },
    { value: '60', label: 'Microequipo (60 gtt/mL)' },
    { value: '15', label: 'Equipo sangue (15 gtt/mL)' }
  ];

  const calculateDropsToML = () => {
    const drops = parseFloat(inputs.drops);
    const timeSeconds = parseFloat(inputs.timeSeconds);
    const dropsPerML = parseFloat(inputs.dropsPerML);
    
    const dropsPerMin = drops / (timeSeconds / 60);
    const mlPerHour = (dropsPerMin / dropsPerML) * 60;
    
    return {
      dropsPerMin: dropsPerMin.toFixed(1),
      mlPerHour: mlPerHour.toFixed(1)
    };
  };

  const calculateMLToDrops = () => {
    const mlPerHour = parseFloat(inputs.mlPerHour);
    const dropsPerML = parseFloat(inputs.dropsPerML);
    
    const dropsPerMin = (mlPerHour * dropsPerML) / 60;
    
    return {
      dropsPerMin: dropsPerMin.toFixed(1)
    };
  };

  // Validation
  const validateInputs = () => {
    const errors = {};
    
    if (mode === 'drops-to-ml') {
      if (!inputs.drops || inputs.drops <= 0) {
        errors.drops = 'Número de gotas deve ser maior que 0';
      }
      if (!inputs.timeSeconds || inputs.timeSeconds <= 0) {
        errors.timeSeconds = 'Tempo deve ser maior que 0 segundos';
      }
    } else {
      if (!inputs.mlPerHour || inputs.mlPerHour <= 0) {
        errors.mlPerHour = 'Taxa em mL/h deve ser maior que 0';
      }
    }
    
    if (!inputs.dropsPerML || inputs.dropsPerML <= 0) {
      errors.dropsPerML = 'Relação gotas/mL deve ser maior que 0';
    }
    
    return errors;
  };

  // Interface específica para cada modo
  const renderInputs = () => {
    if (mode === 'drops-to-ml') {
      return (
        <>
          <ValidatedInput
            label="Número de gotas contadas"
            value={inputs.drops}
            onChange={(value) => setInputs(prev => ({ ...prev, drops: value }))}
            error={errors.drops}
            min="1"
            placeholder="Ex: 30"
          />
          <ValidatedInput
            label="Tempo de contagem"
            value={inputs.timeSeconds}
            onChange={(value) => setInputs(prev => ({ ...prev, timeSeconds: value }))}
            error={errors.timeSeconds}
            unit="segundos"
            min="1"
            placeholder="Ex: 60"
          />
        </>
      );
    } else {
      return (
        <ValidatedInput
          label="Taxa de infusão"
          value={inputs.mlPerHour}
          onChange={(value) => setInputs(prev => ({ ...prev, mlPerHour: value }))}
          error={errors.mlPerHour}
          unit="mL/h"
          min="0.1"
          step="0.1"
          placeholder="Ex: 125"
        />
      );
    }
  };
};
```

### 2. ParklandFormula.jsx

```jsx
/**
 * Fórmula de Parkland para reposição volêmica em queimaduras
 * 
 * Fórmulas:
 * - Volume total = fator × peso × %TBSA
 * - Fator: 4 mL/kg/%TBSA (adulto) ou 3 mL/kg/%TBSA (criança)
 * - Primeira 8h: 50% do volume total
 * - Próximas 16h: 50% restante
 */

const ParklandFormula = ({ open, onOpenChange }) => {
  const [inputs, setInputs] = useState({
    weight: '',
    burnPercentage: '',
    isPediatric: false,
    injuryTime: '' // Para calcular tempo desde lesão
  });

  const calculate = () => {
    const weight = parseFloat(inputs.weight);
    const burnPercentage = parseFloat(inputs.burnPercentage);
    const factor = inputs.isPediatric ? 3 : 4;
    
    const totalVolume = factor * weight * burnPercentage;
    const first8Hours = totalVolume / 2;
    const next16Hours = totalVolume / 2;
    
    // Cálculo da taxa horária
    const rateFirst8h = first8Hours / 8;
    const rateNext16h = next16Hours / 16;
    
    return {
      totalVolume: totalVolume.toFixed(0),
      first8Hours: first8Hours.toFixed(0),
      next16Hours: next16Hours.toFixed(0),
      rateFirst8h: rateFirst8h.toFixed(1),
      rateNext16h: rateNext16h.toFixed(1),
      factor
    };
  };

  const validateInputs = () => {
    const errors = {};
    
    if (!inputs.weight || inputs.weight <= 0) {
      errors.weight = 'Peso deve ser maior que 0 kg';
    }
    
    if (!inputs.burnPercentage || inputs.burnPercentage <= 0 || inputs.burnPercentage > 100) {
      errors.burnPercentage = 'Percentual deve estar entre 1 e 100%';
    }
    
    return errors;
  };

  const getInterpretation = (results) => {
    const burnPercentage = parseFloat(inputs.burnPercentage);
    
    let severity = '';
    if (burnPercentage < 10) severity = 'leve';
    else if (burnPercentage < 20) severity = 'moderada';
    else if (burnPercentage < 40) severity = 'grave';
    else severity = 'crítica';
    
    return {
      severity,
      recommendations: [
        'Iniciar reposição imediatamente após avaliação',
        'Monitorar débito urinário (0,5-1 mL/kg/h adulto, 1-2 mL/kg/h criança)',
        'Ajustar taxa conforme resposta clínica',
        'Reavaliar necessidade de fluidos a cada 2-4 horas'
      ]
    };
  };
};
```

### 3. VancomycinDosing.jsx

```jsx
/**
 * Ajuste de dose de vancomicina baseado em função renal
 * 
 * Utiliza CKD-EPI 2021 para calcular TFGe
 * Dose de ataque: 15-35 mg/kg
 * Dose de manutenção baseada em TFGe
 */

const VancomycinDosing = ({ open, onOpenChange }) => {
  const [inputs, setInputs] = useState({
    weight: '',
    age: '',
    sex: 'male',
    creatinine: '',
    renalFunction: 'stable', // 'stable' | 'unstable' | 'dialysis'
    indication: 'standard' // 'standard' | 'cns' | 'endocarditis'
  });

  // Cálculo CKD-EPI 2021 (sem correção racial)
  const calculateGFR = (creatinine, age, sex) => {
    const kappa = sex === 'female' ? 0.7 : 0.9;
    const alpha = sex === 'female' ? -0.241 : -0.302;
    const sexFactor = sex === 'female' ? 1.012 : 1;
    
    const gfr = 142 * 
      Math.pow(Math.min(creatinine / kappa, 1), alpha) * 
      Math.pow(Math.max(creatinine / kappa, 1), -1.200) * 
      Math.pow(0.9938, age) * 
      sexFactor;
    
    return gfr;
  };

  const calculate = () => {
    const weight = parseFloat(inputs.weight);
    const age = parseFloat(inputs.age);
    const creatinine = parseFloat(inputs.creatinine);
    
    const gfr = calculateGFR(creatinine, age, inputs.sex);
    
    // Dose de ataque (15-35 mg/kg baseado na indicação)
    let loadingDose;
    switch (inputs.indication) {
      case 'cns':
      case 'endocarditis':
        loadingDose = { min: 25 * weight, max: 35 * weight };
        break;
      default:
        loadingDose = { min: 15 * weight, max: 25 * weight };
    }
    
    // Dose de manutenção baseada na TFGe
    let maintenanceDose, interval;
    
    if (inputs.renalFunction === 'dialysis') {
      maintenanceDose = { min: 15 * weight, max: 20 * weight };
      interval = 'Após cada sessão de hemodiálise';
    } else if (gfr >= 90) {
      maintenanceDose = { min: 15 * weight, max: 20 * weight };
      interval = '8-12h';
    } else if (gfr >= 60) {
      maintenanceDose = { min: 10 * weight, max: 15 * weight };
      interval = '12h';
    } else if (gfr >= 30) {
      maintenanceDose = { min: 10 * weight, max: 15 * weight };
      interval = '24h';
    } else {
      maintenanceDose = { min: 5 * weight, max: 10 * weight };
      interval = '24-48h';
    }
    
    return {
      gfr: gfr.toFixed(1),
      loadingDose,
      maintenanceDose,
      interval,
      targetLevel: inputs.indication === 'cns' || inputs.indication === 'endocarditis' 
        ? '15-20 mg/L' : '10-15 mg/L'
    };
  };

  const getMonitoringRecommendations = () => [
    'Coletar nível sérico antes da 4ª dose (steady-state)',
    'Monitorar função renal (creatinina) diariamente',
    'Avaliar sinais de nefrotoxicidade e ototoxicidade',
    'Ajustar dose conforme níveis séricos e função renal'
  ];
};
```

---

## 🧪 Padrões de Teste

### Estrutura de Teste Unitário

```jsx
// __tests__/DropsToMLConverter.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DropsToMLConverter from '../DropsToMLConverter';

describe('DropsToMLConverter', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly', () => {
    render(<DropsToMLConverter {...defaultProps} />);
    expect(screen.getByText('Conversão Gotas/min ↔ mL/h')).toBeInTheDocument();
  });

  test('calculates drops to mL/h correctly', async () => {
    render(<DropsToMLConverter {...defaultProps} />);
    
    // Input: 20 gotas em 60 segundos com equipo 20 gtt/mL
    fireEvent.change(screen.getByLabelText(/número de gotas/i), {
      target: { value: '20' }
    });
    fireEvent.change(screen.getByLabelText(/tempo de contagem/i), {
      target: { value: '60' }
    });
    
    fireEvent.click(screen.getByText('Calcular'));
    
    await waitFor(() => {
      expect(screen.getByText(/60.0 mL\/h/)).toBeInTheDocument();
    });
  });

  test('validates input correctly', async () => {
    render(<DropsToMLConverter {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Calcular'));
    
    await waitFor(() => {
      expect(screen.getByText(/número de gotas deve ser maior que 0/i)).toBeInTheDocument();
    });
  });

  test('copies results to clipboard', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn()
      }
    });
    
    render(<DropsToMLConverter {...defaultProps} />);
    
    // Perform calculation first
    fireEvent.change(screen.getByLabelText(/número de gotas/i), {
      target: { value: '20' }
    });
    fireEvent.change(screen.getByLabelText(/tempo de contagem/i), {
      target: { value: '60' }
    });
    
    fireEvent.click(screen.getByText('Calcular'));
    
    await waitFor(() => {
      const copyButton = screen.getByText('Copiar');
      fireEvent.click(copyButton);
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });
});
```

### Testes de Integração

```jsx
// __tests__/integration/CalculatorsIntegration.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import Calculators from '../Calculators';

describe('Calculators Integration', () => {
  test('opens DropsToMLConverter from main menu', () => {
    render(<Calculators />);
    
    const converterButton = screen.getByText(/conversão gotas/i);
    fireEvent.click(converterButton);
    
    expect(screen.getByText('Conversão Gotas/min ↔ mL/h')).toBeInTheDocument();
  });

  test('all calculators use correct props pattern', () => {
    // Test que verifica se todas as calculadoras seguem o padrão open/onOpenChange
    const calculatorComponents = [
      'DropsToMLConverter',
      'ParklandFormula',
      'VancomycinDosing'
      // ... outras calculadoras
    ];
    
    calculatorComponents.forEach(componentName => {
      // Verificar se o componente aceita props open/onOpenChange
      // e não usa onClose
    });
  });
});
```

---

## 📚 Documentação JSDoc

### Template JSDoc Padrão

```jsx
/**
 * Calculator component for [specific medical calculation]
 * 
 * This component provides a standardized interface for [brief description]
 * following the Health Guardian Dialog+Cards pattern.
 * 
 * @component
 * @param {Object} props - Component properties
 * @param {boolean} props.open - Controls modal visibility
 * @param {function} props.onOpenChange - Callback function when modal state changes
 * 
 * @example
 * // Basic usage in Calculators.jsx
 * <CalculatorName 
 *   open={showHardcodedCalculator === 'calculator-id'} 
 *   onOpenChange={() => setShowHardcodedCalculator(null)} 
 * />
 * 
 * @example
 * // Calculation example
 * // Input: weight=70kg, burnPercentage=20%
 * // Output: totalVolume=5600mL, first8h=2800mL, next16h=2800mL
 * 
 * @integrates
 * - Calculators.jsx: Main calculator registry
 * - Dialog: Modal display component
 * - Cards: Layout structure components
 * - Toast: User feedback system
 * 
 * @medical_validation
 * - Formula: [Medical formula with source]
 * - Reference: [Medical reference/guideline]
 * - Validation: [Input validation rules]
 * 
 * @author Health Guardian Team
 * @since Sprint 2
 * @version 1.0.0
 */
function CalculatorName({ open, onOpenChange }) {
  // Component implementation
}

/**
 * Validates input parameters for medical calculation
 * 
 * @private
 * @param {Object} inputs - Input values to validate
 * @param {number} inputs.weight - Patient weight in kg
 * @param {number} inputs.burnPercentage - Burn percentage (0-100)
 * @returns {Object} Validation errors object
 * 
 * @example
 * const errors = validateInputs({ weight: 70, burnPercentage: 20 });
 * // Returns: {} (no errors)
 * 
 * const errors = validateInputs({ weight: -5, burnPercentage: 150 });
 * // Returns: { weight: 'Weight must be positive', burnPercentage: 'Must be 0-100%' }
 */
const validateInputs = (inputs) => {
  // Validation logic
};

/**
 * Performs the core medical calculation
 * 
 * @private
 * @param {Object} inputs - Validated input parameters
 * @returns {Object} Calculation results
 * 
 * @throws {Error} When calculation fails due to invalid parameters
 * 
 * @medical_formula
 * Parkland Formula: Volume (mL) = Factor × Weight (kg) × Burn % TBSA
 * - Adult factor: 4 mL/kg/%TBSA
 * - Pediatric factor: 3 mL/kg/%TBSA
 * - First 8 hours: 50% of total volume
 * - Next 16 hours: remaining 50%
 * 
 * @reference
 * StatPearls - Parkland Formula
 * https://www.ncbi.nlm.nih.gov/books/NBK537190/
 */
const calculate = (inputs) => {
  // Calculation logic
};
```

---

## 🔄 Processo de Migração

### Checklist de Migração por Calculadora

```markdown
## [CalculatorName].jsx Migration Checklist

### ✅ Pre-Migration
- [ ] Backup original file
- [ ] Document current functionality
- [ ] Identify input/output parameters
- [ ] Note any special validation rules
- [ ] Check for external dependencies

### ✅ Code Migration
- [ ] Update props from `onClose` to `open, onOpenChange`
- [ ] Implement Dialog+Cards structure
- [ ] Add state management (useState)
- [ ] Implement validation function
- [ ] Add calculation function with error handling
- [ ] Implement clear function
- [ ] Add copy functionality
- [ ] Update styling to match standard

### ✅ Content Migration
- [ ] Preserve all input fields
- [ ] Maintain calculation accuracy
- [ ] Keep clinical interpretation
- [ ] Add formula display
- [ ] Include references
- [ ] Add JSDoc documentation

### ✅ Testing
- [ ] Test modal open/close
- [ ] Verify all calculations
- [ ] Test input validation
- [ ] Test copy functionality
- [ ] Test responsive design
- [ ] Cross-browser testing

### ✅ Integration
- [ ] Update Calculators.jsx import
- [ ] Update hardcodedCalculators array
- [ ] Update switch statement
- [ ] Test from main calculator menu
- [ ] Verify no regressions

### ✅ Documentation
- [ ] Update component JSDoc
- [ ] Add usage examples
- [ ] Document integration points
- [ ] Update medical references
- [ ] Add to migration log
```

---

## 🚀 Deployment e Rollback

### Estratégia de Deploy Incremental

```bash
# 1. Deploy por lotes (5 calculadoras por vez)
git checkout -b sprint2-batch1
# Migrar 5 calculadoras
git commit -m "Sprint 2 Batch 1: Migrate 5 calculators to Dialog+Cards"
git push origin sprint2-batch1

# 2. Teste em staging
npm run test
npm run build
npm run preview

# 3. Deploy para produção após validação
git checkout main
git merge sprint2-batch1
git push origin main

# 4. Repetir para próximo lote
```

### Plano de Rollback

```bash
# Em caso de problemas críticos
git revert HEAD~1  # Reverter último commit
# ou
git checkout [commit-hash-anterior]  # Voltar para versão estável

# Rollback específico de calculadora
git checkout HEAD~1 -- src/components/Tools/prebuilt/[CalculatorName].jsx
git commit -m "Rollback [CalculatorName] due to critical issue"
```

---

## 📊 Métricas e Monitoramento

### KPIs Técnicos

```javascript
// Performance monitoring
const performanceMetrics = {
  modalOpenTime: 'Time to open calculator modal',
  calculationTime: 'Time to complete calculation',
  errorRate: 'Percentage of calculation errors',
  userEngagement: 'Time spent in calculator'
};

// Error tracking
const errorTracking = {
  validationErrors: 'Input validation failures',
  calculationErrors: 'Mathematical calculation failures',
  uiErrors: 'UI component failures',
  integrationErrors: 'Integration with main app failures'
};

// Usage analytics
const usageAnalytics = {
  mostUsedCalculators: 'Top 10 most accessed calculators',
  conversionRates: 'Percentage of users who complete calculations',
  copyRates: 'Percentage of users who copy results',
  mobileUsage: 'Percentage of mobile vs desktop usage'
};
```

### Alertas e Monitoramento

```javascript
// Critical alerts
const criticalAlerts = {
  calculationAccuracy: 'Alert if calculation results deviate from expected',
  performanceDegradation: 'Alert if modal open time > 500ms',
  errorSpike: 'Alert if error rate > 5%',
  userDropoff: 'Alert if completion rate < 80%'
};
```

---

*Documento técnico criado para Sprint 2*  
*Versão: 1.0*  
*Data: Janeiro 2025*