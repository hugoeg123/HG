# Correção de Problemas das Calculadoras Médicas - Health Guardian

## 1. Análise dos Problemas Identificados

### 1.1 Calculadoras Não Exibidas no Frontend
**Problema:** As calculadoras qSOFA, APACHE2, SOFA, CHA2DS2VASc e HASBLED estão comentadas no código.

**Causa Raiz:**
- Imports comentados em `Calculators.jsx` (linhas 29-34)
- Renderização condicional comentada (linhas 703-718)
- Componentes existem mas não estão sendo utilizados

**Calculadoras Afetadas:**
- qSOFA (Quick SOFA)
- APACHE2 (Acute Physiology and Chronic Health Evaluation)
- SOFA (Sequential Organ Failure Assessment)
- CHA2DS2VASc (Stroke Risk Assessment)
- HASBLED (Bleeding Risk Assessment)

### 1.2 Problemas de Posicionamento de Modal
**Problema:** Algumas calculadoras aparecem inline em vez de modal centralizado.

**Causa Raiz:**
- Inconsistência na implementação de props `open` e `onOpenChange`
- Alguns componentes usam `onClose` em vez de `onOpenChange`
- Falta de padronização na estrutura de Dialog

**Calculadoras Afetadas:**
- BSAMosteller (usa `onClose` em vez de `onOpenChange`)
- BSADuBois (usa `onClose` em vez de `onOpenChange`)
- Várias outras calculadoras antropométricas

### 1.3 Problemas de Estilização e Cores
**Problema:** Cores inconsistentes, divs brancas indesejadas, uso de roxo em vez de verde.

**Causa Raiz:**
- Falta de padronização de classes Tailwind CSS
- Uso inconsistente de variáveis de tema
- Componentes não seguem o design system estabelecido

### 1.4 Calculadoras Sem Conteúdo
**Problema:** Algumas calculadoras abrem mas mostram apenas nome e descrição.

**Causa Raiz:**
- Componentes incompletos ou com lógica de cálculo não implementada
- Estrutura de formulário não definida
- Falta de validação e processamento de dados

## 2. Plano de Implementação

### Fase 1: Ativação das Calculadoras Comentadas

#### 2.1 Descomentando Imports e Renderização
```javascript
// Em Calculators.jsx - Descomentar imports
import ParklandFormula from './prebuilt/ParklandFormula';
import qSOFA from './prebuilt/qSOFA';
import APACHE2 from './prebuilt/APACHE2';
import SOFA from './prebuilt/SOFA';
import CHA2DS2VASc from './prebuilt/CHA2DS2VASc';
import HASBLED from './prebuilt/HASBLED';
```

#### 2.2 Adicionando Lógica de Abertura
```javascript
// Adicionar casos para cada calculadora
if (calculator.isHardcoded && calculator.id === 'qsofa') {
  setShowHardcodedCalculator(calculator.id);
  return;
}
// Repetir para todas as calculadoras
```

#### 2.3 Renderização Condicional
```javascript
// Descomentar e corrigir renderização
{showHardcodedCalculator === 'qsofa' && (
  <qSOFA 
    open={true} 
    onOpenChange={(isOpen) => { if (!isOpen) closeHardcodedCalculator(); }}
  />
)}
```

### Fase 2: Padronização de Modais

#### 2.1 Interface Padrão para Calculadoras
```typescript
interface CalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId?: string;
}
```

#### 2.2 Estrutura de Dialog Padronizada
```javascript
return (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-theme-background border-gray-700">
      <DialogHeader className="border-b border-gray-700/30 pb-4">
        <DialogTitle className="flex items-center gap-2 text-white">
          <Icon className="h-5 w-5" />
          {title}
        </DialogTitle>
      </DialogHeader>
      {/* Conteúdo da calculadora */}
    </DialogContent>
  </Dialog>
);
```

### Fase 3: Padronização de Estilização

#### 3.1 Classes CSS Padronizadas
```css
/* Tema escuro consistente */
.calculator-card {
  @apply bg-theme-card border-gray-700 text-white;
}

.calculator-input {
  @apply bg-theme-card border-gray-700/30 text-white placeholder:text-gray-500;
  @apply focus-visible:ring-teal-500/50 focus-visible:border-teal-500/50;
}

.calculator-button-primary {
  @apply bg-teal-600 hover:bg-teal-700 text-white;
  @apply border-transparent hover:border-teal-500/30;
}

.calculator-button-secondary {
  @apply bg-theme-card text-gray-300 hover:bg-theme-surface hover:text-white;
  @apply border-transparent hover:border-gray-600/30;
}

.calculator-result {
  @apply bg-theme-card border-gray-700/30 text-white;
}

.calculator-result-success {
  @apply bg-green-900/20 border-green-700/50 text-green-300;
}

.calculator-result-warning {
  @apply bg-yellow-900/20 border-yellow-700/50 text-yellow-300;
}

.calculator-result-danger {
  @apply bg-red-900/20 border-red-700/50 text-red-300;
}
```

#### 3.2 Componente de Resultado Padronizado
```javascript
const CalculatorResult = ({ result, status, interpretation }) => {
  const getStatusColor = (status) => {
    const colors = {
      success: 'calculator-result-success',
      warning: 'calculator-result-warning',
      danger: 'calculator-result-danger',
      info: 'bg-blue-900/20 border-blue-700/50 text-blue-300'
    };
    return colors[status] || 'calculator-result';
  };

  return (
    <Card className={`${getStatusColor(status)} mt-4`}>
      <CardHeader>
        <CardTitle className="text-lg">Resultado</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">{result}</div>
        {interpretation && (
          <p className="text-sm opacity-90">{interpretation}</p>
        )}
      </CardContent>
    </Card>
  );
};
```

### Fase 4: Implementação de Calculadoras Incompletas

#### 4.1 Estrutura Base para Calculadoras de Score
```javascript
const ScoreCalculator = ({ open, onOpenChange, config }) => {
  const [inputs, setInputs] = useState({});
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  const validateInputs = useCallback(() => {
    const newErrors = {};
    config.fields.forEach(field => {
      if (field.required && !inputs[field.key]) {
        newErrors[field.key] = `${field.label} é obrigatório`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs, config.fields]);

  const calculate = useCallback(() => {
    if (!validateInputs()) return;
    
    let totalScore = 0;
    const breakdown = {};
    
    config.fields.forEach(field => {
      const value = inputs[field.key];
      const points = field.scoring[value] || 0;
      totalScore += points;
      breakdown[field.key] = { value, points };
    });
    
    const interpretation = config.interpretations.find(
      interp => totalScore >= interp.minScore && totalScore <= interp.maxScore
    );
    
    setResult({
      totalScore,
      breakdown,
      interpretation: interpretation?.text || 'Score calculado',
      riskLevel: interpretation?.level || 'unknown'
    });
  }, [inputs, validateInputs, config]);

  // Renderização do formulário e resultado
};
```

#### 4.2 Configurações Específicas por Calculadora

**qSOFA Configuration:**
```javascript
const qSOFAConfig = {
  title: 'qSOFA (Quick SOFA)',
  description: 'Triagem rápida para sepsis',
  fields: [
    {
      key: 'respiratoryRate',
      label: 'Frequência Respiratória ≥ 22/min',
      type: 'boolean',
      scoring: { true: 1, false: 0 }
    },
    {
      key: 'alteredMentation',
      label: 'Alteração do estado mental',
      type: 'boolean',
      scoring: { true: 1, false: 0 }
    },
    {
      key: 'systolicBP',
      label: 'PAS ≤ 100 mmHg',
      type: 'boolean',
      scoring: { true: 1, false: 0 }
    }
  ],
  interpretations: [
    {
      minScore: 0,
      maxScore: 1,
      level: 'low',
      text: 'Baixo risco de sepsis. qSOFA negativo.'
    },
    {
      minScore: 2,
      maxScore: 3,
      level: 'high',
      text: 'Alto risco de sepsis. qSOFA positivo. Considerar investigação para sepsis.'
    }
  ]
};
```

**APACHE2 Configuration:**
```javascript
const APACHE2Config = {
  title: 'APACHE II',
  description: 'Acute Physiology and Chronic Health Evaluation',
  fields: [
    {
      key: 'temperature',
      label: 'Temperatura (°C)',
      type: 'number',
      scoring: {
        // Implementar tabela de pontuação APACHE II
      }
    },
    {
      key: 'meanArterialPressure',
      label: 'PAM (mmHg)',
      type: 'number',
      scoring: {
        // Implementar tabela de pontuação
      }
    }
    // Adicionar todos os campos APACHE II
  ],
  interpretations: [
    {
      minScore: 0,
      maxScore: 4,
      level: 'low',
      text: 'Mortalidade prevista: 4%'
    }
    // Adicionar todas as faixas de interpretação
  ]
};
```

## 3. Estratégia de Correção de Bugs

### 3.1 Checklist de Validação
- [ ] Modal abre centralizado na tela
- [ ] Cores seguem o tema escuro (teal/green para primário)
- [ ] Formulário aceita entrada de dados
- [ ] Cálculo é executado corretamente
- [ ] Resultado é exibido com interpretação
- [ ] Botão "Copiar Resultado" funciona
- [ ] Botão "Limpar" reseta o formulário
- [ ] Modal fecha corretamente

### 3.2 Testes Automatizados
```javascript
// Exemplo de teste para calculadora
describe('qSOFA Calculator', () => {
  test('should calculate score correctly', () => {
    const inputs = {
      respiratoryRate: true,
      alteredMentation: false,
      systolicBP: true
    };
    
    const result = calculateQSOFA(inputs);
    expect(result.totalScore).toBe(2);
    expect(result.interpretation).toContain('Alto risco');
  });
  
  test('should validate required fields', () => {
    const inputs = {};
    const errors = validateQSOFAInputs(inputs);
    expect(Object.keys(errors)).toHaveLength(3);
  });
});
```

## 4. Cronograma de Implementação

### Semana 1: Ativação das Calculadoras
- Descomentar imports e renderização
- Testar abertura de modais
- Corrigir problemas de posicionamento

### Semana 2: Padronização de UI/UX
- Implementar classes CSS padronizadas
- Corrigir cores e estilização
- Padronizar estrutura de modais

### Semana 3: Implementação de Lógica
- Completar calculadoras qSOFA e APACHE2
- Implementar SOFA e CHA2DS2VASc
- Finalizar HASBLED

### Semana 4: Testes e Validação
- Testes unitários para cada calculadora
- Testes de integração
- Validação de UX/UI
- Documentação final

## 5. Métricas de Sucesso

- ✅ Todas as 5 calculadoras comentadas funcionando
- ✅ 100% das calculadoras abrindo em modal centralizado
- ✅ Consistência visual em todas as calculadoras
- ✅ Tempo de carregamento < 2 segundos
- ✅ Taxa de erro < 1% nos cálculos
- ✅ Cobertura de testes > 80%

## 6. Considerações de Manutenibilidade

### 6.1 Padrão de Componente Reutilizável
```javascript
// Hook personalizado para calculadoras
const useCalculator = (config) => {
  const [inputs, setInputs] = useState({});
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});
  
  const validate = useCallback(() => {
    // Lógica de validação genérica
  }, [inputs, config]);
  
  const calculate = useCallback(() => {
    // Lógica de cálculo genérica
  }, [inputs, config]);
  
  const clear = useCallback(() => {
    setInputs({});
    setResult(null);
    setErrors({});
  }, []);
  
  return { inputs, setInputs, result, errors, validate, calculate, clear };
};
```

### 6.2 Documentação de Integração
```javascript
/**
 * Calculator Component Integration Guide
 * 
 * Connectors:
 * - Calculators.jsx → renders calculator modals
 * - calculatorStore.js → manages calculator definitions
 * - Dialog components → provides modal functionality
 * 
 * Usage:
 * <CalculatorName 
 *   open={showModal} 
 *   onOpenChange={setShowModal}
 *   patientId={currentPatientId}
 * />
 */
```

Este documento fornece um plano abrangente para resolver todos os problemas identificados nas calculadoras médicas, garantindo consistência, funcionalidade e manutenibilidade do sistema.