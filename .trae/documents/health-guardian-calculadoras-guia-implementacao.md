# Guia Prático de Implementação - Calculadoras Médicas Health Guardian

## 1. Visão Geral do Guia

Este guia fornece instruções passo a passo para implementar as calculadoras médicas do Health Guardian, baseado na análise dos documentos de planejamento e na estrutura atual do projeto.

### 1.1 Pré-requisitos

- Node.js 18+ instalado
- Conhecimento em React, Express.js e PostgreSQL
- Acesso ao repositório do Health Guardian
- Ambiente de desenvolvimento configurado

### 1.2 Estrutura de Implementação

```
Implementação em 4 Fases:
├── Fase 1: Infraestrutura Base (2 semanas)
├── Fase 2: Calculadoras Dinâmicas (2 semanas)
├── Fase 3: Integração Frontend (1 semana)
└── Fase 4: Refinamentos (1 semana)
```

## 2. FASE 1: Infraestrutura Base

### 2.1 Passo 1: Criar Estrutura de Diretórios

```bash
# No diretório backend/src
mkdir -p core/{units,analytes,calculators,tests}
touch core/README.md
touch core/conversion_core.js
```

### 2.2 Passo 2: Implementar Catálogos JSON

**Criar `backend/src/core/units/units.factors.json`:**
```json
{
  "dimensions": {
    "mass": {
      "base_unit": "kg",
      "units": {
        "kg": { "factor": 1, "precision": 3 },
        "g": { "factor": 0.001, "precision": 3 },
        "mg": { "factor": 1e-6, "precision": 2 },
        "µg": { "factor": 1e-9, "precision": 1 },
        "mcg": { "factor": 1e-9, "precision": 1 }
      }
    },
    "volume": {
      "base_unit": "L",
      "units": {
        "L": { "factor": 1, "precision": 3 },
        "dL": { "factor": 0.1, "precision": 2 },
        "mL": { "factor": 0.001, "precision": 2 }
      }
    },
    "time": {
      "base_unit": "s",
      "units": {
        "s": { "factor": 1, "precision": 0 },
        "min": { "factor": 60, "precision": 0 },
        "h": { "factor": 3600, "precision": 0 }
      }
    },
    "rate_flow": {
      "base_unit": "mL/s",
      "units": {
        "mL/h": { "factor": 0.000277778, "precision": 1 },
        "mL/min": { "factor": 0.0166667, "precision": 2 }
      }
    },
    "rate_drop": {
      "base_unit": "gtt/s",
      "units": {
        "gtt/min": { "factor": 0.0166667, "precision": 0 }
      }
    },
    "dose_rate": {
      "base_unit": "mg/kg/min",
      "units": {
        "µg/kg/min": { "factor": 0.001, "precision": 2 },
        "mcg/kg/min": { "factor": 0.001, "precision": 2 },
        "mg/kg/h": { "factor": 60, "precision": 2 }
      }
    },
    "concentration_mass_vol": {
      "base_unit": "g/L",
      "units": {
        "mg/mL": { "factor": 1, "precision": 3 },
        "µg/mL": { "factor": 0.001, "precision": 3 },
        "mcg/mL": { "factor": 0.001, "precision": 3 }
      }
    }
  }
}
```

**Criar `backend/src/core/units/units.synonyms.json`:**
```json
{
  "mcg": "µg",
  "ug": "µg",
  "microgram": "µg",
  "micrograms": "µg",
  "cc": "mL",
  "ml": "mL",
  "milliliter": "mL",
  "milliliters": "mL",
  "gtt": "gtt",
  "drop": "gtt",
  "drops": "gtt",
  "gotas": "gtt",
  "gota": "gtt"
}
```

**Criar `backend/src/core/analytes/analytes.catalog.json`:**
```json
{
  "sodium": {
    "name": "Sódio",
    "symbol": "Na+",
    "category": "electrolyte",
    "molar_mass": 22.99,
    "valence": 1,
    "allowed_units": ["mmol/L", "mEq/L", "mg/dL"],
    "canonical_conversions": [
      {
        "from": "mg/dL",
        "to": "mmol/L",
        "factor": 0.4348
      }
    ]
  },
  "potassium": {
    "name": "Potássio",
    "symbol": "K+",
    "category": "electrolyte",
    "molar_mass": 39.1,
    "valence": 1,
    "allowed_units": ["mmol/L", "mEq/L", "mg/dL"],
    "canonical_conversions": [
      {
        "from": "mg/dL",
        "to": "mmol/L",
        "factor": 0.2558
      }
    ]
  },
  "calcium": {
    "name": "Cálcio",
    "symbol": "Ca2+",
    "category": "electrolyte",
    "molar_mass": 40.08,
    "valence": 2,
    "allowed_units": ["mmol/L", "mEq/L", "mg/dL"],
    "canonical_conversions": [
      {
        "from": "mg/dL",
        "to": "mmol/L",
        "factor": 0.2495
      }
    ]
  }
}
```

**Criar `backend/src/core/analytes/analytes.synonyms.json`:**
```json
{
  "na": "sodium",
  "na+": "sodium",
  "sodio": "sodium",
  "k": "potassium",
  "k+": "potassium",
  "potassio": "potassium",
  "ca": "calcium",
  "ca2+": "calcium",
  "calcio": "calcium"
}
```

### 2.3 Passo 3: Implementar Motor de Conversão

**Criar `backend/src/core/conversion_core.js`:**
```javascript
const fs = require('fs');
const path = require('path');

class ConversionEngine {
  constructor() {
    this.unitsData = null;
    this.unitsSynonyms = null;
    this.analytesData = null;
    this.analytesSynonyms = null;
    this.loadCatalogs();
  }

  loadCatalogs() {
    const coreDir = __dirname;
    
    try {
      this.unitsData = JSON.parse(
        fs.readFileSync(path.join(coreDir, 'units/units.factors.json'), 'utf8')
      );
      
      this.unitsSynonyms = JSON.parse(
        fs.readFileSync(path.join(coreDir, 'units/units.synonyms.json'), 'utf8')
      );
      
      this.analytesData = JSON.parse(
        fs.readFileSync(path.join(coreDir, 'analytes/analytes.catalog.json'), 'utf8')
      );
      
      this.analytesSynonyms = JSON.parse(
        fs.readFileSync(path.join(coreDir, 'analytes/analytes.synonyms.json'), 'utf8')
      );
    } catch (error) {
      console.error('Erro ao carregar catálogos:', error);
      throw error;
    }
  }

  normalizeUnit(unit) {
    return this.unitsSynonyms[unit.toLowerCase()] || unit;
  }

  getAnalyte(keyOrName) {
    const key = this.analytesSynonyms[keyOrName.toLowerCase()] || keyOrName.toLowerCase();
    return this.analytesData[key];
  }

  getDimensionAndBaseFactor(unit) {
    for (const [dimension, data] of Object.entries(this.unitsData.dimensions)) {
      if (data.units[unit]) {
        return [dimension, data.units[unit].factor];
      }
    }
    return [null, null];
  }

  convertValue(value, fromUnit, toUnit, analyte = null) {
    const fromUnitNorm = this.normalizeUnit(fromUnit);
    const toUnitNorm = this.normalizeUnit(toUnit);

    // 1. Conversão canônica baseada em analito
    if (analyte) {
      const analyteData = this.getAnalyte(analyte);
      if (analyteData && analyteData.canonical_conversions) {
        for (const conv of analyteData.canonical_conversions) {
          if (conv.from === fromUnitNorm && conv.to === toUnitNorm) {
            return value * conv.factor;
          }
          if (conv.from === toUnitNorm && conv.to === fromUnitNorm) {
            return value / conv.factor;
          }
        }
      }
    }

    // 2. Conversão mEq/L ↔ mmol/L
    const isMeqToMmol = fromUnitNorm === 'mEq/L' && toUnitNorm === 'mmol/L';
    const isMmolToMeq = fromUnitNorm === 'mmol/L' && toUnitNorm === 'mEq/L';
    
    if ((isMeqToMmol || isMmolToMeq) && analyte) {
      const analyteData = this.getAnalyte(analyte);
      if (!analyteData || !analyteData.valence) {
        throw new Error(`Valência não encontrada para o analito ${analyte}`);
      }
      const valence = analyteData.valence;
      if (valence === 0) {
        throw new Error(`Conversão mEq/mmol não aplicável para ${analyte} (valência 0)`);
      }
      return isMeqToMmol ? value / Math.abs(valence) : value * Math.abs(valence);
    }

    // 3. Conversão dimensional via SI
    const [dimFrom, factorFrom] = this.getDimensionAndBaseFactor(fromUnitNorm);
    const [dimTo, factorTo] = this.getDimensionAndBaseFactor(toUnitNorm);

    if (!dimFrom || !dimTo || dimFrom !== dimTo) {
      throw new Error(`Unidades incompatíveis: ${fromUnit} para ${toUnit}`);
    }

    const valueInBase = value * factorFrom;
    return valueInBase / factorTo;
  }

  listUnits() {
    return this.unitsData;
  }

  listAnalytes(category = null) {
    if (category) {
      return Object.fromEntries(
        Object.entries(this.analytesData)
          .filter(([key, data]) => data.category === category)
      );
    }
    return this.analytesData;
  }
}

// Instância singleton
const conversionEngine = new ConversionEngine();

function convertValue(value, fromUnit, toUnit, analyte = null) {
  return conversionEngine.convertValue(value, fromUnit, toUnit, analyte);
}

function normalizeUnit(unit) {
  return conversionEngine.normalizeUnit(unit);
}

function getAnalyte(keyOrName) {
  return conversionEngine.getAnalyte(keyOrName);
}

function listUnits() {
  return conversionEngine.listUnits();
}

function listAnalytes(category = null) {
  return conversionEngine.listAnalytes(category);
}

module.exports = {
  ConversionEngine,
  convertValue,
  normalizeUnit,
  getAnalyte,
  listUnits,
  listAnalytes
};
```

### 2.4 Passo 4: Criar Controlador de Conversões

**Criar `backend/src/controllers/conversion.controller.js`:**
```javascript
const { convertValue, listUnits, listAnalytes } = require('../core/conversion_core');
const { validationResult } = require('express-validator');

class ConversionController {
  async convertUnits(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { value, from, to, analyte } = req.body;

      const convertedValue = convertValue(value, from, to, analyte);

      res.json({
        success: true,
        data: {
          value: convertedValue,
          unit: to,
          original: {
            value,
            unit: from
          },
          analyte: analyte || null
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getUnits(req, res) {
    try {
      const units = listUnits();
      res.json({
        success: true,
        data: units
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getAnalytes(req, res) {
    try {
      const { category } = req.query;
      const analytes = listAnalytes(category);
      
      res.json({
        success: true,
        data: analytes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new ConversionController();
```

### 2.5 Passo 5: Configurar Rotas

**Criar `backend/src/routes/conversion.routes.js`:**
```javascript
const express = require('express');
const { body } = require('express-validator');
const conversionController = require('../controllers/conversion.controller');

const router = express.Router();

// Validações
const validateConversion = [
  body('value').isNumeric().withMessage('Valor deve ser numérico'),
  body('from').isLength({ min: 1, max: 20 }).withMessage('Unidade de origem inválida'),
  body('to').isLength({ min: 1, max: 20 }).withMessage('Unidade de destino inválida'),
  body('analyte').optional().isLength({ max: 50 }).withMessage('Analito inválido')
];

// Rotas
router.post('/units', validateConversion, conversionController.convertUnits);
router.get('/units', conversionController.getUnits);
router.get('/analytes', conversionController.getAnalytes);

module.exports = router;
```

### 2.6 Passo 6: Integrar Rotas no App Principal

**Atualizar `backend/src/app.js`:**
```javascript
// ... imports existentes ...
const conversionRoutes = require('./routes/conversion.routes');

// ... middlewares existentes ...

// Rotas
app.use('/api/v1/convert', conversionRoutes);
// ... outras rotas existentes ...
```

### 2.7 Passo 7: Instalar Dependências

```bash
cd backend
npm install express-validator mathjs winston express-rate-limit
```

### 2.8 Passo 8: Criar Testes Básicos

**Criar `backend/src/core/tests/conversion.test.js`:**
```javascript
const { convertValue, normalizeUnit } = require('../conversion_core');

describe('ConversionEngine', () => {
  test('deve converter kg para g', () => {
    expect(convertValue(1, 'kg', 'g')).toBe(1000);
  });
  
  test('deve converter mL/h para mL/min', () => {
    expect(convertValue(60, 'mL/h', 'mL/min')).toBeCloseTo(1, 5);
  });
  
  test('deve normalizar sinônimos', () => {
    expect(normalizeUnit('mcg')).toBe('µg');
  });
  
  test('deve converter mEq/L para mmol/L (Na+)', () => {
    expect(convertValue(140, 'mEq/L', 'mmol/L', 'sodium')).toBe(140);
  });
});
```

### 2.9 Passo 9: Testar API

**Testar com curl ou Postman:**
```bash
# Teste de conversão simples
curl -X POST http://localhost:3000/api/v1/convert/units \
  -H "Content-Type: application/json" \
  -d '{
    "value": 1,
    "from": "kg",
    "to": "g"
  }'

# Teste de conversão com analito
curl -X POST http://localhost:3000/api/v1/convert/units \
  -H "Content-Type: application/json" \
  -d '{
    "value": 140,
    "from": "mEq/L",
    "to": "mmol/L",
    "analyte": "sodium"
  }'

# Listar unidades
curl http://localhost:3000/api/v1/convert/units

# Listar analitos
curl http://localhost:3000/api/v1/convert/analytes
```

## 3. FASE 2: Calculadoras Dinâmicas

### 3.1 Passo 10: Criar Schema da Primeira Calculadora

**Criar `backend/src/core/calculators/infusion.drops_mlh.json`:**
```json
{
  "id": "infusion.drops_mlh",
  "name": "Gotas/min ↔ mL/h",
  "version": "1.0.0",
  "category": "Infusão",
  "description": "Converte taxas de gotejamento em mL/h e vice-versa, com modo Tap para contagem",
  "inputs": [
    {
      "id": "drops_count",
      "label": "Gotas contadas",
      "type": "integer",
      "unit": "gtt",
      "min": 1,
      "max": 1000,
      "required": true,
      "group": "tap_mode"
    },
    {
      "id": "time_seconds",
      "label": "Tempo de contagem (s)",
      "type": "number",
      "unit": "s",
      "min": 1,
      "max": 300,
      "required": true,
      "group": "tap_mode"
    },
    {
      "id": "drop_factor",
      "label": "Fator de gotejamento",
      "type": "number",
      "unit": "gtt/mL",
      "min": 5,
      "max": 120,
      "default": 20,
      "required": true,
      "help": "Comum: Macrogotas=20, Microgotas=60"
    },
    {
      "id": "gtt_per_min_input",
      "label": "Gotas por minuto",
      "type": "number",
      "unit": "gtt/min",
      "min": 1,
      "max": 500,
      "group": "direct_input"
    },
    {
      "id": "ml_per_h_input",
      "label": "Taxa em mL/h",
      "type": "number",
      "unit": "mL/h",
      "min": 0.1,
      "max": 2000,
      "group": "direct_input"
    }
  ],
  "expressions": {
    "gtt_per_min": "(drops_count) / (time_seconds / 60)",
    "ml_per_h": "(gtt_per_min / drop_factor) * 60",
    "gtt_per_min_from_ml": "(ml_per_h_input * drop_factor) / 60",
    "ml_per_h_from_gtt": "(gtt_per_min_input / drop_factor) * 60"
  },
  "outputs": [
    {
      "id": "gtt_per_min",
      "label": "Gotas por minuto",
      "unit": "gtt/min",
      "decimals": 0,
      "highlight": true
    },
    {
      "id": "ml_per_h",
      "label": "Taxa em mL/h",
      "unit": "mL/h",
      "decimals": 1,
      "highlight": true
    },
    {
      "id": "gtt_per_min_from_ml",
      "label": "Gotas por minuto",
      "unit": "gtt/min",
      "decimals": 0,
      "highlight": true
    },
    {
      "id": "ml_per_h_from_gtt",
      "label": "Taxa em mL/h",
      "unit": "mL/h",
      "decimals": 1,
      "highlight": true
    }
  ],
  "modes": [
    {
      "id": "tap_mode",
      "name": "Modo Tap",
      "description": "Conte as gotas tocando na tela",
      "inputs": ["drops_count", "time_seconds", "drop_factor"],
      "outputs": ["gtt_per_min", "ml_per_h"]
    },
    {
      "id": "gtt_to_ml",
      "name": "Gotas → mL/h",
      "description": "Converter gotas/min para mL/h",
      "inputs": ["gtt_per_min_input", "drop_factor"],
      "outputs": ["ml_per_h_from_gtt"]
    },
    {
      "id": "ml_to_gtt",
      "name": "mL/h → Gotas",
      "description": "Converter mL/h para gotas/min",
      "inputs": ["ml_per_h_input", "drop_factor"],
      "outputs": ["gtt_per_min_from_ml"]
    }
  ],
  "examples": [
    {
      "name": "Exemplo 1: Contagem de gotas",
      "inputs": {
        "drops_count": 30,
        "time_seconds": 20,
        "drop_factor": 20
      },
      "expected_outputs": {
        "gtt_per_min": 90,
        "ml_per_h": 270.0
      }
    }
  ],
  "notes": [
    "Modo Tap: Toque na tela a cada gota para contagem automática",
    "Fatores comuns: Macrogotas = 20 gtt/mL, Microgotas = 60 gtt/mL",
    "Sempre confirme o fator de gotejamento do equipo utilizado"
  ],
  "references": [
    "Consenso institucional para fatores de gotejamento",
    "Whitebook - Cálculos de infusão"
  ]
}
```

### 3.2 Passo 11: Implementar Controlador de Calculadoras Dinâmicas

**Criar `backend/src/controllers/dynamic-calculator.controller.js`:**
```javascript
const fs = require('fs');
const path = require('path');
const { create, all } = require('mathjs');
const { validationResult } = require('express-validator');

// Configuração segura do mathjs
const math = create(all, {
  number: 'BigNumber',
  precision: 64
});

// Limitar escopo para segurança
const limitedEvaluate = math.evaluate;
math.import({
  import: function () { throw new Error('Function import is disabled') },
  createUnit: function () { throw new Error('Function createUnit is disabled') },
  evaluate: function () { throw new Error('Function evaluate is disabled') },
  parse: function () { throw new Error('Function parse is disabled') }
}, { override: true });

class DynamicCalculatorController {
  constructor() {
    this.calculatorsPath = path.join(__dirname, '../core/calculators');
    this.loadCalculatorSchemas();
  }

  loadCalculatorSchemas() {
    this.schemas = new Map();
    
    try {
      const files = fs.readdirSync(this.calculatorsPath);
      
      files.filter(file => file.endsWith('.json')).forEach(file => {
        const filePath = path.join(this.calculatorsPath, file);
        const schema = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        this.schemas.set(schema.id, schema);
      });
    } catch (error) {
      console.error('Erro ao carregar schemas de calculadoras:', error);
    }
  }

  async listCalculators(req, res) {
    try {
      const calculators = Array.from(this.schemas.values()).map(schema => ({
        id: schema.id,
        name: schema.name,
        version: schema.version,
        category: schema.category,
        description: schema.description
      }));

      res.json({
        success: true,
        data: calculators
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getCalculatorSchema(req, res) {
    try {
      const { id } = req.params;
      const schema = this.schemas.get(id);

      if (!schema) {
        return res.status(404).json({
          success: false,
          error: 'Calculadora não encontrada'
        });
      }

      res.json({
        success: true,
        data: schema
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async computeCalculation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { inputs } = req.body;

      const schema = this.schemas.get(id);
      if (!schema) {
        return res.status(404).json({
          success: false,
          error: 'Calculadora não encontrada'
        });
      }

      // Validar inputs obrigatórios
      const requiredInputs = schema.inputs.filter(input => input.required);
      for (const input of requiredInputs) {
        if (inputs[input.id] === undefined || inputs[input.id] === null) {
          return res.status(400).json({
            success: false,
            error: `Campo obrigatório ausente: ${input.label}`
          });
        }
      }

      // Executar expressões
      const outputs = {};
      const scope = { ...inputs };

      for (const [outputId, expression] of Object.entries(schema.expressions)) {
        try {
          const result = limitedEvaluate(expression, scope);
          const outputConfig = schema.outputs.find(o => o.id === outputId);
          
          if (outputConfig && outputConfig.decimals !== undefined) {
            outputs[outputId] = Number(result.toFixed(outputConfig.decimals));
          } else {
            outputs[outputId] = Number(result);
          }
          
          // Adicionar resultado ao escopo para próximas expressões
          scope[outputId] = outputs[outputId];
        } catch (evalError) {
          return res.status(400).json({
            success: false,
            error: `Erro na expressão ${outputId}: ${evalError.message}`
          });
        }
      }

      res.json({
        success: true,
        data: {
          outputs,
          calculator: {
            id: schema.id,
            name: schema.name,
            version: schema.version
          },
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new DynamicCalculatorController();
```

### 3.3 Passo 12: Configurar Rotas das Calculadoras

**Criar `backend/src/routes/dynamic-calculator.routes.js`:**
```javascript
const express = require('express');
const { body } = require('express-validator');
const dynamicCalculatorController = require('../controllers/dynamic-calculator.controller');

const router = express.Router();

// Validações
const validateCalculation = [
  body('inputs').isObject().withMessage('Inputs devem ser um objeto')
];

// Rotas
router.get('/', dynamicCalculatorController.listCalculators);
router.get('/:id', dynamicCalculatorController.getCalculatorSchema);
router.post('/:id/compute', validateCalculation, dynamicCalculatorController.computeCalculation);

module.exports = router;
```

**Atualizar `backend/src/app.js`:**
```javascript
// ... imports existentes ...
const dynamicCalculatorRoutes = require('./routes/dynamic-calculator.routes');

// ... middlewares existentes ...

// Rotas
app.use('/api/v1/convert', conversionRoutes);
app.use('/api/v1/dynamic-calculators', dynamicCalculatorRoutes);
// ... outras rotas existentes ...
```

### 3.4 Passo 13: Testar Calculadora Dinâmica

```bash
# Listar calculadoras
curl http://localhost:3000/api/v1/dynamic-calculators

# Obter schema da calculadora
curl http://localhost:3000/api/v1/dynamic-calculators/infusion.drops_mlh

# Executar cálculo - Modo Tap
curl -X POST http://localhost:3000/api/v1/dynamic-calculators/infusion.drops_mlh/compute \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": {
      "drops_count": 30,
      "time_seconds": 20,
      "drop_factor": 20
    }
  }'
```

## 4. FASE 3: Integração Frontend

### 4.1 Passo 14: Atualizar Serviços de API

**Atualizar `frontend/src/services/api.js`:**
```javascript
// ... código existente ...

const calculatorService = {
  // ... métodos existentes ...
  
  // Novos métodos para calculadoras dinâmicas
  getDynamicCalculators: () => api.get('/api/v1/dynamic-calculators'),
  
  getCalculatorSchema: (calculatorId) => 
    api.get(`/api/v1/dynamic-calculators/${calculatorId}`),
  
  computeCalculation: (calculatorId, data) => 
    api.post(`/api/v1/dynamic-calculators/${calculatorId}/compute`, data),
  
  // Conversões
  convertUnits: (data) => api.post('/api/v1/convert/units', data),
  getUnits: () => api.get('/api/v1/convert/units'),
  getAnalytes: (category = null) => 
    api.get('/api/v1/convert/analytes', { params: { category } })
};

export { calculatorService };
```

### 4.2 Passo 15: Criar Componente de Calculadora Dinâmica

**Criar `frontend/src/components/Tools/DynamicCalculator.jsx`:**
```jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Copy, Calculator, Info } from 'lucide-react';
import { calculatorService } from '../../services/api';
import { toast } from 'react-hot-toast';

const DynamicCalculator = ({ calculatorId, onClose }) => {
  const [schema, setSchema] = useState(null);
  const [inputs, setInputs] = useState({});
  const [outputs, setOutputs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState(null);
  const [tapMode, setTapMode] = useState({
    counting: false,
    startTime: null,
    dropCount: 0
  });

  useEffect(() => {
    loadCalculatorSchema();
  }, [calculatorId]);

  const loadCalculatorSchema = async () => {
    try {
      setLoading(true);
      const response = await calculatorService.getCalculatorSchema(calculatorId);
      setSchema(response.data);
      
      // Definir modo padrão
      if (response.data.modes && response.data.modes.length > 0) {
        setActiveMode(response.data.modes[0].id);
      }
      
      // Inicializar inputs com valores padrão
      const defaultInputs = {};
      response.data.inputs.forEach(input => {
        if (input.default !== undefined) {
          defaultInputs[input.id] = input.default;
        }
      });
      setInputs(defaultInputs);
    } catch (error) {
      toast.error('Erro ao carregar calculadora');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (inputId, value) => {
    setInputs(prev => ({
      ...prev,
      [inputId]: value
    }));
  };

  const handleCalculate = async () => {
    try {
      setLoading(true);
      const response = await calculatorService.computeCalculation(calculatorId, {
        inputs
      });
      setOutputs(response.data.outputs);
      toast.success('Cálculo realizado com sucesso');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro no cálculo');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTapStart = () => {
    setTapMode({
      counting: true,
      startTime: Date.now(),
      dropCount: 0
    });
    setInputs(prev => ({
      ...prev,
      drops_count: 0,
      time_seconds: 0
    }));
  };

  const handleTapDrop = () => {
    if (!tapMode.counting) return;
    
    const newDropCount = tapMode.dropCount + 1;
    const timeElapsed = (Date.now() - tapMode.startTime) / 1000;
    
    setTapMode(prev => ({
      ...prev,
      dropCount: newDropCount
    }));
    
    setInputs(prev => ({
      ...prev,
      drops_count: newDropCount,
      time_seconds: Math.round(timeElapsed)
    }));
  };

  const handleTapStop = () => {
    setTapMode(prev => ({
      ...prev,
      counting: false
    }));
    handleCalculate();
  };

  const copyResult = (value, unit) => {
    navigator.clipboard.writeText(`${value} ${unit}`);
    toast.success('Resultado copiado!');
  };

  const getCurrentModeInputs = () => {
    if (!schema?.modes || !activeMode) return schema?.inputs || [];
    
    const mode = schema.modes.find(m => m.id === activeMode);
    if (!mode) return schema.inputs;
    
    return schema.inputs.filter(input => 
      mode.inputs.includes(input.id) || !input.group
    );
  };

  const getCurrentModeOutputs = () => {
    if (!schema?.modes || !activeMode) return schema?.outputs || [];
    
    const mode = schema.modes.find(m => m.id === activeMode);
    if (!mode) return schema.outputs;
    
    return schema.outputs.filter(output => 
      mode.outputs.includes(output.id)
    );
  };

  if (loading && !schema) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-400">Calculadora não encontrada</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="bg-theme-surface border-theme-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                {schema.name}
              </CardTitle>
              <p className="text-gray-400 mt-1">{schema.description}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">{schema.category}</Badge>
                <Badge variant="outline">v{schema.version}</Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Modos de Cálculo */}
          {schema.modes && schema.modes.length > 1 && (
            <Tabs value={activeMode} onValueChange={setActiveMode} className="mb-6">
              <TabsList className="grid w-full grid-cols-3">
                {schema.modes.map(mode => (
                  <TabsTrigger key={mode.id} value={mode.id}>
                    {mode.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Inputs */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Dados de Entrada</h3>
              
              {/* Modo Tap Especial */}
              {activeMode === 'tap_mode' && (
                <Card className="bg-teal-900/20 border-teal-600/30 p-4">
                  <div className="text-center space-y-4">
                    <div className="text-2xl font-bold text-teal-400">
                      {tapMode.dropCount} gotas
                    </div>
                    <div className="text-lg text-gray-300">
                      {inputs.time_seconds || 0}s
                    </div>
                    
                    {!tapMode.counting ? (
                      <Button
                        onClick={handleTapStart}
                        className="bg-teal-600 hover:bg-teal-700 w-full"
                      >
                        Iniciar Contagem
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          onClick={handleTapDrop}
                          className="bg-green-600 hover:bg-green-700 w-full h-16 text-lg"
                        >
                          TAP - Contar Gota
                        </Button>
                        <Button
                          onClick={handleTapStop}
                          variant="outline"
                          className="w-full"
                        >
                          Parar e Calcular
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              )}
              
              {getCurrentModeInputs().map(input => (
                <div key={input.id} className="space-y-2">
                  <Label className="text-white">
                    {input.label}
                    {input.required && <span className="text-red-400 ml-1">*</span>}
                  </Label>
                  <Input
                    type={input.type === 'integer' ? 'number' : input.type}
                    value={inputs[input.id] || ''}
                    onChange={(e) => handleInputChange(input.id, 
                      input.type === 'number' || input.type === 'integer' 
                        ? parseFloat(e.target.value) || 0 
                        : e.target.value
                    )}
                    min={input.min}
                    max={input.max}
                    step={input.step}
                    placeholder={`${input.label} (${input.unit})`}
                    className="bg-theme-background border-theme-border text-white"
                    disabled={activeMode === 'tap_mode' && 
                      (input.id === 'drops_count' || input.id === 'time_seconds')}
                  />
                  {input.help && (
                    <p className="text-xs text-gray-400">{input.help}</p>
                  )}
                </div>
              ))}
              
              {activeMode !== 'tap_mode' && (
                <Button
                  onClick={handleCalculate}
                  disabled={loading}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  {loading ? 'Calculando...' : 'Calcular'}
                </Button>
              )}
            </div>

            {/* Outputs */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Resultados</h3>
              
              {outputs ? (
                <div className="space-y-3">
                  {getCurrentModeOutputs().map(output => {
                    const value = outputs[output.id];
                    if (value === undefined) return null;
                    
                    return (
                      <Card key={output.id} className={`p-4 ${
                        output.highlight 
                          ? 'bg-teal-900/30 border-teal-600/50' 
                          : 'bg-theme-background border-theme-border'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-400">
                              {output.label || output.id}
                            </div>
                            <div className="text-xl font-bold text-white">
                              {value} {output.unit}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyResult(value, output.unit)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Preencha os campos e clique em Calcular</p>
                </div>
              )}
            </div>
          </div>

          {/* Notas e Referências */}
          {(schema.notes || schema.references) && (
            <div className="mt-6 pt-6 border-t border-theme-border">
              {schema.notes && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Notas Importantes
                  </h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    {schema.notes.map((note, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-teal-400 mt-1">•</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {schema.references && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Referências</h4>
                  <ul className="text-xs text-gray-500 space-y-1">
                    {schema.references.map((ref, index) => (
                      <li key={index}>• {ref}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DynamicCalculator;
```

### 4.3 Passo 16: Integrar com Sistema Existente

**Atualizar `frontend/src/components/Tools/Calculators.jsx`:**
```jsx
// ... imports existentes ...
import DynamicCalculator from './DynamicCalculator';
import { calculatorService } from '../../services/api';

const Calculators = () => {
  // ... estado existente ...
  const [dynamicCalculators, setDynamicCalculators] = useState([]);
  const [selectedDynamicCalculator, setSelectedDynamicCalculator] = useState(null);

  useEffect(() => {
    loadDynamicCalculators();
  }, []);

  const loadDynamicCalculators = async () => {
    try {
      const response = await calculatorService.getDynamicCalculators();
      setDynamicCalculators(response.data);
    } catch (error) {
      console.error('Erro ao carregar calculadoras dinâmicas:', error);
    }
  };

  // ... resto do componente ...

  return (
    <div className="p-6">
      {selectedDynamicCalculator ? (
        <DynamicCalculator 
          calculatorId={selectedDynamicCalculator}
          onClose={() => setSelectedDynamicCalculator(null)}
        />
      ) : (
        <>
          {/* ... interface existente ... */}
          
          {/* Seção de Calculadoras Dinâmicas */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Calculadoras Avançadas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dynamicCalculators.map(calc => (
                <Card 
                  key={calc.id} 
                  className="bg-theme-surface border-theme-border hover:border-teal-600/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedDynamicCalculator(calc.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Calculator className="h-5 w-5 text-teal-400" />
                      <h3 className="font-semibold text-white">{calc.name}</h3>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{calc.description}</p>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{calc.category}</Badge>
                      <Badge variant="outline">v{calc.version}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
```

## 5. FASE 4: Testes e Refinamentos

### 5.1 Passo 17: Executar Testes

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### 5.2 Passo 18: Verificar Funcionalidades

**Checklist de Verificação:**
- [ ] API de conversões responde corretamente
- [ ] Calculadoras dinâmicas carregam schemas
- [ ] Modo Tap funciona no frontend
- [ ] Cálculos retornam resultados corretos
- [ ] Interface mantém tema escuro/teal
- [ ] Responsividade funciona em mobile
- [ ] Tratamento de erros está adequado

### 5.3 Passo 19: Otimizações Finais

**Performance:**
- Cache de schemas no frontend
- Debounce em cálculos em tempo real
- Lazy loading de calculadoras

**UX:**
- Feedback visual durante cálculos
- Validação em tempo real
- Histórico de cálculos

## 6. Próximos Passos

### 6.1 Expansão das Calculadoras
1. Criar schemas para `infusion.mcgkgmin_mlh.json`
2. Criar schemas para `infusion.mcgkgmin_gttmin.json`
3. Implementar calculadoras de função renal
4. Adicionar calculadoras pediátricas

### 6.2 Melhorias Técnicas
1. Implementar cache Redis
2. Adicionar métricas de uso
3. Configurar monitoramento
4. Otimizar performance

---

**Status**: ✅ Guia Completo  
**Tempo Estimado**: 6 semanas  
**Complexidade**: Média-Alta