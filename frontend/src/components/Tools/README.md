# Medical Calculators - Nova Arquitetura

## Mapa de Integrações

Este documento descreve a nova arquitetura padronizada para calculadoras médicas implementada na Fase 1 do plano de correção.

### Estrutura de Arquivos

```
frontend/src/
├── components/Tools/
│   ├── CalculatorLayout.jsx          # Componente base padronizado
│   ├── ClinicalInterpretation.jsx    # Interpretação clínica de resultados
│   ├── DynamicCalculator.jsx         # Motor dinâmico existente
│   ├── calculators/
│   │   └── FIB4Calculator.jsx        # Exemplo da nova arquitetura
│   └── README.md                     # Este arquivo
├── services/
│   ├── ValidationService.js          # Sistema de validação centralizado
│   ├── PhysiologicalRanges.js        # Ranges fisiológicos para validação
│   └── __tests__/
│       └── ValidationService.test.js # Testes unitários
backend/src/core/calculators/
└── fib4_score.json                   # Schema JSON da calculadora FIB-4
```

## Componentes Principais

### 1. CalculatorLayout.jsx

**Propósito**: Componente base padronizado para todas as calculadoras médicas.

**Integra com**:
- `services/ValidationService.js` para validação de inputs
- `services/PhysiologicalRanges.js` para ranges fisiológicos
- `components/Tools/ClinicalInterpretation.jsx` para interpretação de resultados
- `components/Tools/DynamicCalculator.jsx` para renderização dinâmica

**Características**:
- Interface padronizada com validação em tempo real
- Suporte a múltiplos modos de cálculo
- Alertas clínicos contextuais
- Resultados copiáveis
- Referências científicas integradas

**Exemplo de uso**:
```jsx
import CalculatorLayout from '../CalculatorLayout';

const MyCalculator = () => {
  const [schema, setSchema] = useState(calculatorSchema);
  const [results, setResults] = useState(null);
  
  const handleCalculate = (inputs, context) => {
    // Lógica de cálculo
    const calculationResults = performCalculation(inputs);
    setResults(calculationResults);
  };
  
  return (
    <CalculatorLayout
      schema={schema}
      onCalculate={handleCalculate}
      results={results}
      context={{ age: 45, sex: 'M' }}
    />
  );
};
```

### 2. ValidationService.js

**Propósito**: Sistema centralizado de validação para inputs médicos.

**Integra com**:
- `services/PhysiologicalRanges.js` para ranges fisiológicos
- `components/Tools/CalculatorLayout.jsx` para validação de inputs
- Todas as calculadoras médicas

**Tipos de validação suportados**:
- `required`: Campos obrigatórios
- `range`: Validação de faixa numérica
- `clinical`: Validação com contexto clínico
- `format`: Validação de formato (regex)
- `custom`: Validação customizada

**Exemplo de uso**:
```javascript
import { ValidationService } from '../../services/ValidationService';

const rules = [
  { type: 'required', message: 'Campo obrigatório' },
  { type: 'range', min: 18, max: 120, message: 'Idade deve estar entre 18 e 120 anos' },
  { 
    type: 'clinical', 
    clinicalContext: 'elderly',
    criticalValues: [{
      min: 65, max: 120,
      message: 'Atenção: Limitações em pacientes > 65 anos',
      action: 'Considerar métodos complementares'
    }]
  }
];

const result = ValidationService.validateInput(value, rules, { age: 70 });
if (!result.isValid) {
  console.log('Erros:', result.errors);
  console.log('Alertas clínicos:', result.clinicalAlerts);
}
```

### 3. PhysiologicalRanges.js

**Propósito**: Biblioteca de ranges fisiológicos para validação médica.

**Integra com**:
- `services/ValidationService.js` para validação automática
- Todas as calculadoras que usam parâmetros fisiológicos

**Parâmetros suportados**:
- Demografia: age, weight, height
- Sinais vitais: systolic_bp, diastolic_bp, heart_rate, temperature
- Laboratório: creatinine, ast, alt, platelets, hemoglobin, etc.
- Gasometria: ph, pco2, po2, bicarbonate

**Exemplo de uso**:
```javascript
import { PHYSIOLOGICAL_RANGES, getAgeAdjustedRange } from '../../services/PhysiologicalRanges';

// Range padrão
const ageRange = PHYSIOLOGICAL_RANGES.age;
console.log(ageRange); // { min: 0, max: 120, unit: 'anos', criticalValues: [...] }

// Range ajustado por idade
const heartRateRange = getAgeAdjustedRange('heart_rate', 70);
console.log(heartRateRange); // Range ajustado para idosos
```

### 4. ClinicalInterpretation.jsx

**Propósito**: Componente para exibição de interpretações clínicas.

**Integra com**:
- `components/Tools/CalculatorLayout.jsx` para exibição de resultados
- Schemas JSON das calculadoras para interpretações

**Níveis de risco suportados**:
- `low`: Baixo risco (verde)
- `moderate`: Risco moderado (amarelo)
- `high`: Alto risco (vermelho)
- `critical`: Risco crítico (vermelho escuro)
- `normal`: Normal (azul)
- `abnormal`: Anormal (laranja)
- `indeterminate`: Indeterminado (cinza)

## Schema JSON das Calculadoras

### Estrutura Padrão

```json
{
  "name": "Nome da Calculadora",
  "description": "Descrição clínica",
  "category": "especialidade",
  "version": "1.0.0",
  "clinicalContext": {
    "indication": "Indicações clínicas",
    "contraindications": ["Lista de contraindicações"],
    "limitations": ["Lista de limitações"]
  },
  "inputs": [
    {
      "key": "parameter_name",
      "label": "Rótulo do campo",
      "description": "Descrição detalhada",
      "type": "number|select|text",
      "unit": "unidade",
      "required": true,
      "validations": [
        {
          "type": "required|range|clinical|custom",
          "message": "Mensagem de erro",
          "min": 0,
          "max": 100
        }
      ],
      "clinicalNote": "Nota clínica sobre o parâmetro"
    }
  ],
  "formulas": {
    "result_name": "formula_expression"
  },
  "interpretations": [
    {
      "condition": "result > 3.25",
      "riskLevel": "high",
      "result": "Alto risco",
      "clinicalSignificance": "Significado clínico",
      "recommendation": "Recomendações",
      "nextSteps": ["Lista de próximos passos"],
      "warnings": [
        {
          "level": "warning|critical",
          "message": "Mensagem de alerta",
          "action": "Ação recomendada"
        }
      ]
    }
  ],
  "references": [
    "Referências científicas"
  ]
}
```

## Como Criar uma Nova Calculadora

### Passo 1: Criar o Schema JSON

1. Crie um arquivo JSON em `backend/src/core/calculators/`
2. Defina inputs com validações apropriadas
3. Especifique fórmulas e interpretações clínicas
4. Inclua referências científicas

### Passo 2: Implementar o Componente

```jsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import CalculatorLayout from '../CalculatorLayout';

const MyCalculator = ({ open, onOpenChange, initialInputs = {}, context = {} }) => {
  const [schema, setSchema] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar schema
  useEffect(() => {
    loadSchema();
  }, []);

  const loadSchema = async () => {
    try {
      const schemaModule = await import('../../../../backend/src/core/calculators/my_calculator.json');
      setSchema(schemaModule.default || schemaModule);
    } catch (err) {
      setError('Erro ao carregar calculadora');
    }
  };

  const handleCalculate = async (inputs, clinicalContext) => {
    try {
      setLoading(true);
      
      // Implementar lógica de cálculo
      const result = performCalculation(inputs);
      const interpretation = getInterpretation(result, clinicalContext);
      
      setResults({
        outputs: [{
          label: 'Resultado',
          value: result.toFixed(2),
          unit: 'unidade'
        }],
        interpretation
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl text-white">
            Minha Calculadora
          </DialogTitle>
        </DialogHeader>
        
        <CalculatorLayout
          schema={schema}
          onCalculate={handleCalculate}
          results={results}
          loading={loading}
          error={error}
          initialInputs={initialInputs}
          context={context}
        />
      </DialogContent>
    </Dialog>
  );
};

export default MyCalculator;
```

### Passo 3: Adicionar Testes

```javascript
import { ValidationService } from '../ValidationService';

describe('MyCalculator', () => {
  test('should validate inputs correctly', () => {
    const schema = { /* schema da calculadora */ };
    const inputs = { /* inputs de teste */ };
    
    const result = ValidationService.validateCalculatorInputs(inputs, schema);
    expect(result.isValid).toBe(true);
  });
  
  test('should calculate result correctly', () => {
    const inputs = { param1: 10, param2: 20 };
    const result = calculateMyFormula(inputs);
    expect(result).toBeCloseTo(expectedValue, 2);
  });
});
```

## Migração de Calculadoras Existentes

### Para migrar uma calculadora existente:

1. **Analisar a calculadora atual**:
   - Identificar inputs e validações
   - Extrair lógica de cálculo
   - Documentar interpretações clínicas

2. **Criar schema JSON**:
   - Definir inputs com validações apropriadas
   - Especificar interpretações clínicas
   - Adicionar referências científicas

3. **Refatorar componente**:
   - Usar CalculatorLayout como base
   - Mover lógica de cálculo para função separada
   - Implementar interpretações clínicas

4. **Adicionar testes**:
   - Testes de validação
   - Testes de cálculo
   - Testes de interpretação

## Exemplo Completo: FIB-4 Calculator

Veja `calculators/FIB4Calculator.jsx` e `backend/src/core/calculators/fib4_score.json` para um exemplo completo da nova arquitetura.

## Benefícios da Nova Arquitetura

1. **Consistência**: Interface padronizada em todas as calculadoras
2. **Robustez**: Validação centralizada com ranges fisiológicos
3. **Manutenibilidade**: Lógica separada da apresentação
4. **Escalabilidade**: Fácil adição de novas calculadoras
5. **Qualidade**: Testes automatizados e validação científica
6. **Usabilidade**: Alertas clínicos contextuais e interpretações

## Próximos Passos

1. Migrar calculadoras existentes para nova arquitetura
2. Implementar calculadoras faltantes (MAP, GASA, CAGE, etc.)
3. Adicionar integração com backend dinâmico
4. Expandir testes de cobertura
5. Implementar sistema de histórico de cálculos

---

**Connector**: Este README integra com todos os componentes da nova arquitetura de calculadoras médicas e serve como guia de desenvolvimento para a equipe.