# Especificações de Implementação - Calculadoras Médicas Health Guardian

## 1. Visão Geral da Implementação

Este documento detalha as especificações técnicas para implementação das calculadoras médicas prioritárias do Health Guardian, baseado na análise dos documentos de planejamento e na estrutura atual do projeto.

### 1.1 Objetivos da Implementação

* Integrar o núcleo de conversões baseado em catálogos JSON

* Implementar calculadoras de infusão prioritárias com renderização dinâmica

* Manter compatibilidade com calculadoras existentes

* Estabelecer base para expansão futura

* Preservar consistência visual e UX atual

### 1.2 Escopo Prioritário

**Épico 1: Calculadoras de Infusão**

1. Gotas/min ↔ mL/h (com modo Tap)
2. μg/kg/min ↔ mL/h
3. μg/kg/min ↔ gtt/min

**Épico 2: Sistema de Conversões**

1. Conversões dimensionais (massa, volume, tempo)
2. Conversões clínicas (analitos com massa molar)
3. Conversões de valência (mEq/L ↔ mmol/L)

## 2. Estrutura de Arquivos do Núcleo

### 2.1 Diretório Core

```
backend/src/core/
├── README.md
├── conversion_core.js          # Motor de conversão (adaptado do Python)
├── units/
│   ├── units.factors.json      # Fatores de conversão dimensional
│   └── units.synonyms.json     # Sinônimos de unidades
├── analytes/
│   ├── analytes.catalog.json   # Catálogo de analitos clínicos
│   └── analytes.synonyms.json  # Sinônimos de analitos
├── calculators/
│   ├── infusion.drops_mlh.json
│   ├── infusion.mcgkgmin_mlh.json
│   └── infusion.mcgkgmin_gttmin.json
└── tests/
    ├── conversion.test.js
    ├── infusion_drops.cases.json
    ├── infusion_mcgkgmin_mlh.cases.json
    └── infusion_mcgkgmin_gttmin.cases.json
```

### 2.2 Catálogos JSON Essenciais

**units.factors.json**

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
    "concentration_mass_vol": {
      "base_unit": "g/L",
      "units": {
        "mg/mL": { "factor": 1, "precision": 3 },
        "µg/mL": { "factor": 0.001, "precision": 3 },
        "mcg/mL": { "factor": 0.001, "precision": 3 }
      }
    },
    "dose_rate": {
      "base_unit": "mg/kg/min",
      "units": {
        "µg/kg/min": { "factor": 0.001, "precision": 2 },
        "mcg/kg/min": { "factor": 0.001, "precision": 2 },
        "mg/kg/h": { "factor": 60, "precision": 2 }
      }
    }
  }
}
```

## 3. Especificações das Calculadoras Prioritárias

### 3.1 Calculadora: Gotas/min ↔ mL/h

**Schema JSON (infusion.drops\_mlh.json)**

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
    },
    {
      "name": "Exemplo 2: Microgotas",
      "inputs": {
        "drops_count": 20,
        "time_seconds": 60,
        "drop_factor": 60
      },
      "expected_outputs": {
        "gtt_per_min": 20,
        "ml_per_h": 20.0
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

### 3.2 Calculadora: μg/kg/min ↔ mL/h

**Schema JSON (infusion.mcgkgmin\_mlh.json)**

```json
{
  "id": "infusion.mcgkgmin_mlh",
  "name": "μg/kg/min ↔ mL/h",
  "version": "1.0.0",
  "category": "Infusão",
  "description": "Converte doses em μg/kg/min para taxas de bomba em mL/h",
  "inputs": [
    {
      "id": "dose_mcgkgmin",
      "label": "Dose (μg/kg/min)",
      "type": "number",
      "unit": "μg/kg/min",
      "min": 0.001,
      "max": 1000,
      "step": 0.001,
      "required": true
    },
    {
      "id": "weight_kg",
      "label": "Peso (kg)",
      "type": "number",
      "unit": "kg",
      "min": 0.1,
      "max": 300,
      "step": 0.1,
      "required": true
    },
    {
      "id": "concentration_mg_ml",
      "label": "Concentração (mg/mL)",
      "type": "number",
      "unit": "mg/mL",
      "min": 0.001,
      "max": 1000,
      "step": 0.001,
      "required": true,
      "help": "Concentração da solução preparada"
    },
    {
      "id": "rate_mlh_input",
      "label": "Taxa da bomba (mL/h)",
      "type": "number",
      "unit": "mL/h",
      "min": 0.1,
      "max": 1000,
      "step": 0.1,
      "group": "reverse_calc"
    }
  ],
  "expressions": {
    "rate_mlh": "(dose_mcgkgmin * weight_kg * 60) / (1000 * concentration_mg_ml)",
    "dose_mcgkgmin_reverse": "(rate_mlh_input * concentration_mg_ml * 1000) / (60 * weight_kg)"
  },
  "outputs": [
    {
      "id": "rate_mlh",
      "label": "Taxa da bomba (mL/h)",
      "unit": "mL/h",
      "decimals": 2,
      "highlight": true
    },
    {
      "id": "dose_mcgkgmin_reverse",
      "label": "Dose calculada (μg/kg/min)",
      "unit": "μg/kg/min",
      "decimals": 3,
      "highlight": true
    }
  ],
  "modes": [
    {
      "id": "dose_to_rate",
      "name": "Dose → Taxa",
      "description": "Calcular taxa da bomba a partir da dose",
      "inputs": ["dose_mcgkgmin", "weight_kg", "concentration_mg_ml"],
      "outputs": ["rate_mlh"]
    },
    {
      "id": "rate_to_dose",
      "name": "Taxa → Dose",
      "description": "Calcular dose a partir da taxa da bomba",
      "inputs": ["rate_mlh_input", "weight_kg", "concentration_mg_ml"],
      "outputs": ["dose_mcgkgmin_reverse"]
    }
  ],
  "examples": [
    {
      "name": "Noradrenalina - Dose baixa",
      "inputs": {
        "dose_mcgkgmin": 0.1,
        "weight_kg": 70,
        "concentration_mg_ml": 0.064
      },
      "expected_outputs": {
        "rate_mlh": 6.56
      }
    },
    {
      "name": "Dobutamina - Dose moderada",
      "inputs": {
        "dose_mcgkgmin": 5,
        "weight_kg": 80,
        "concentration_mg_ml": 2.5
      },
      "expected_outputs": {
        "rate_mlh": 9.6
      }
    }
  ],
  "notes": [
    "Fórmula: Taxa (mL/h) = (Dose × Peso × 60) / (1000 × Concentração)",
    "Sempre confirme a concentração da solução preparada",
    "Para medicamentos de alta potência, use concentrações padronizadas"
  ],
  "references": [
    "Protocolo institucional de drogas vasoativas",
    "UpToDate - Cálculos de infusão contínua"
  ]
}
```

### 3.3 Calculadora: μg/kg/min ↔ gtt/min

**Schema JSON (infusion.mcgkgmin\_gttmin.json)**

```json
{
  "id": "infusion.mcgkgmin_gttmin",
  "name": "μg/kg/min ↔ gtt/min",
  "version": "1.0.0",
  "category": "Infusão",
  "description": "Converte doses em μg/kg/min para gotas/min (infusão gravitacional)",
  "inputs": [
    {
      "id": "dose_mcgkgmin",
      "label": "Dose (μg/kg/min)",
      "type": "number",
      "unit": "μg/kg/min",
      "min": 0.001,
      "max": 1000,
      "step": 0.001,
      "required": true
    },
    {
      "id": "weight_kg",
      "label": "Peso (kg)",
      "type": "number",
      "unit": "kg",
      "min": 0.1,
      "max": 300,
      "step": 0.1,
      "required": true
    },
    {
      "id": "concentration_mg_ml",
      "label": "Concentração (mg/mL)",
      "type": "number",
      "unit": "mg/mL",
      "min": 0.001,
      "max": 1000,
      "step": 0.001,
      "required": true
    },
    {
      "id": "drop_factor",
      "label": "Fator de gotejamento",
      "type": "number",
      "unit": "gtt/mL",
      "min": 5,
      "max": 120,
      "default": 60,
      "required": true,
      "help": "Microgotas = 60 gtt/mL (recomendado para drogas vasoativas)"
    },
    {
      "id": "gtt_per_min_input",
      "label": "Gotas por minuto",
      "type": "number",
      "unit": "gtt/min",
      "min": 1,
      "max": 500,
      "group": "reverse_calc"
    }
  ],
  "expressions": {
    "rate_mlh": "(dose_mcgkgmin * weight_kg * 60) / (1000 * concentration_mg_ml)",
    "gtt_per_min": "(rate_mlh * drop_factor) / 60",
    "dose_mcgkgmin_reverse": "((gtt_per_min_input * 60 / drop_factor) * concentration_mg_ml * 1000) / (60 * weight_kg)"
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
      "id": "rate_mlh",
      "label": "Taxa equivalente (mL/h)",
      "unit": "mL/h",
      "decimals": 2
    },
    {
      "id": "dose_mcgkgmin_reverse",
      "label": "Dose calculada (μg/kg/min)",
      "unit": "μg/kg/min",
      "decimals": 3,
      "highlight": true
    }
  ],
  "modes": [
    {
      "id": "dose_to_gtt",
      "name": "Dose → Gotas",
      "description": "Calcular gotas/min a partir da dose",
      "inputs": ["dose_mcgkgmin", "weight_kg", "concentration_mg_ml", "drop_factor"],
      "outputs": ["gtt_per_min", "rate_mlh"]
    },
    {
      "id": "gtt_to_dose",
      "name": "Gotas → Dose",
      "description": "Calcular dose a partir das gotas/min",
      "inputs": ["gtt_per_min_input", "weight_kg", "concentration_mg_ml", "drop_factor"],
      "outputs": ["dose_mcgkgmin_reverse"]
    }
  ],
  "examples": [
    {
      "name": "Dopamina - Dose baixa",
      "inputs": {
        "dose_mcgkgmin": 2,
        "weight_kg": 60,
        "concentration_mg_ml": 0.8,
        "drop_factor": 60
      },
      "expected_outputs": {
        "gtt_per_min": 18,
        "rate_mlh": 18.0
      }
    }
  ],
  "notes": [
    "Recomenda-se usar microgotas (60 gtt/mL) para maior precisão",
    "Infusão gravitacional deve ser monitorada constantemente",
    "Considere usar bomba de infusão para medicamentos críticos"
  ],
  "references": [
    "Protocolo de segurança para drogas vasoativas",
    "Manual de infusão gravitacional - HCFMUSP"
  ]
}
```

## 4. Implementação do Motor de Conversão (JavaScript)

### 4.1 Classe ConversionEngine

```javascript
// backend/src/core/conversion_core.js
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
    
    // Carrega catálogos JSON
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

  // Funções auxiliares para calculadoras
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

// Funções de interface
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

## 5. Implementação dos Endpoints da API

### 5.1 Controlador de Conversões

```javascript
// backend/src/controllers/conversion.controller.js
const { convertValue, listUnits, listAnalytes } = require('../core/conversion_core');
const { validationResult } = require('express-validator');

class ConversionController {
  /**
   * Converte valor entre unidades
   */
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

  /**
   * Lista unidades disponíveis
   */
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

  /**
   * Lista analitos disponíveis
   */
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

### 5.2 Controlador de Calculadoras Dinâmicas

```javascript
// backend/src/controllers/dynamic-calculator.controller.js
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

  /**
   * Lista calculadoras disponíveis
   */
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

  /**
   * Obtém schema de uma calculadora
   */
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

  /**
   * Executa cálculo de uma calculadora
   */
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

## 6. Implementação Frontend - Componente de Calculadora Dinâmica

### 6.1 Componente Principal

```jsx
// frontend/src/components/Tools/DynamicCalculator.jsx
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
    
    // Cálculo em tempo real para alguns casos
    if (schema?.realtime_calculation) {
      debounceCalculate();
    }
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

## 7. Integração com o Sistema Existente

### 7.1 Atualização do calculatorStore

```javascript
// frontend/src/store/calculatorStore.js - Adições
const useCalculatorStore = create((set, get) => ({
  // ... estado existente ...
  
  // Novas funcionalidades para calculadoras dinâmicas
  dynamicCalculators: [],
  
  loadDynamicCalculators: async () => {
    try {
      const response = await calculatorService.getDynamicCalculators();
      set({ dynamicCalculators: response.data });
    } catch (error) {
      console.error('Erro ao carregar calculadoras dinâmicas:', error);
    }
  },
  
  executeDynamicCalculation: async (calculatorId, inputs) => {
    try {
      const response = await calculatorService.computeCalculation(calculatorId, {
        inputs
      });
      
      // Salvar no histórico
      const result = {
        calculatorId,
        inputs,
        outputs: response.data.outputs,
        timestamp: new Date().toISOString(),
        type: 'dynamic'
      };
      
      set(state => ({
        results: {
          ...state.results,
          [calculatorId]: result
        }
      }));
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Migração gradual - fallback para calculadoras existentes
  executeCalculationWithFallback: async (calculatorId, inputs) => {
    try {
      // Tentar calculadora dinâmica primeiro
      return await get().executeDynamicCalculation(calculatorId, inputs);
    } catch (error) {
      // Fallback para calculadora hardcoded
      console.warn(`Fallback para calculadora hardcoded: ${calculatorId}`);
      return get().executeCalculation(calculatorId, inputs);
    }
  }
}));
```

### 7.2 Serviços de API

```javascript
// frontend/src/services/api.js - Adições
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
```

## 8. Plano de Implementação por Fases

### Fase 1: Infraestrutura Base (Semana 1-2)

1. ✅ Criar estrutura de diretórios `/core`
2. ✅ Implementar catálogos JSON básicos
3. ✅ Desenvolver `conversion_core.js`
4. ✅ Criar endpoints de conversão
5. ✅ Testes unitários do núcleo

### Fase 2: Calculadoras Dinâmicas (Semana 3-4)

1. ✅ Implementar controlador de calculadoras dinâmicas
2. ✅ Criar schemas das 3 calculadoras prioritárias
3. ✅ Desenvolver componente `DynamicCalculator`
4. ✅ Implementar modo Tap para gotejamento
5. ✅ Testes de integração

### Fase 3: Integração Frontend (Semana 5)

1. 🔄 Atualizar `calculatorStore` com fallback
2. 🔄 Integrar componentes dinâmicos na UI existente
3. 🔄 Migrar calculadoras existentes gradualmente
4. 🔄 Implementar histórico de cálculos
5. 🔄 Testes de regressão

### Fase 4: Refinamentos (Semana 6)

1. ⏳ Otimizações de performance
2. ⏳ Melhorias na UX
3. ⏳ Documentação completa
4. ⏳ Deploy e monitoramento

## 9. Critérios de Aceitação

### 9.1 Funcionalidades Essenciais

* [ ] Conversão de unidades via API funciona corretamente

* [ ] Calculadoras dinâmicas renderizam a partir de schemas JSON

* [ ] Modo Tap para contagem de gotas está operacional

* [ ] Fallback para calculadoras existentes funciona

* [ ] Histórico de cálculos é salvo e recuperado

* [ ] Interface mantém consistência visual

### 9.2 Performance

* [ ] Tempo de resposta da API < 200ms

* [ ] Carregamento de calculadoras < 1s

* [ ] Cálculos em tempo real < 100ms

### 9.3 Qualidade

* [ ] Cobertura de testes > 80%

* [ ] Validação de entrada robusta

* [ ] Tratamento de erros adequado

* [ ] Logs de auditoria implementados

## 10. Considerações de Segurança e Validação

### 10.1 Validação de Entrada

```javascript
// Middleware de validação
const { body } = require('express-validator');

const validateConversion = [
  body('value').isNumeric().withMessage('Valor deve ser numérico'),
  body('from').isLength({ min: 1, max: 20 }).withMessage('Unidade de origem inválida'),
  body('to').isLength({ min: 1, max: 20 }).withMessage('Unidade de destino inválida'),
  body('analyte').optional().isLength({ max: 50 }).withMessage('Analito inválido')
];

const validateCalculation = [
  body('inputs').isObject().withMessage('Inputs devem ser um objeto'),
  body('inputs.*').isNumeric().withMessage('Todos os inputs devem ser numéricos')
];
```

### 10.2 Sanitização de Expressões
```javascript
// Função para sanitizar expressões matemáticas
function sanitizeExpression(expression) {
  // Lista branca de operadores e funções permitidas
  const allowedTokens = /^[0-9+\-*/().\s_a-zA-Z]+$/;
  const forbiddenFunctions = /\b(eval|function|import|require|process|global|window)\b/i;
  
  if (!allowedTokens.test(expression)) {
    throw new Error('Expressão contém caracteres não permitidos');
  }
  
  if (forbiddenFunctions.test(expression)) {
    throw new Error('Expressão contém funções proibidas');
  }
  
  return expression;
}
```

### 10.3 Rate Limiting
```javascript
// Rate limiting para APIs de cálculo
const rateLimit = require('express-rate-limit');

const calculationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // máximo 100 cálculos por minuto
  message: {
    success: false,
    error: 'Muitas solicitações. Tente novamente em 1 minuto.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
```

## 11. Estrutura de Testes

### 11.1 Testes do Núcleo de Conversão
```javascript
// backend/src/core/tests/conversion.test.js
const { convertValue, normalizeUnit, getAnalyte } = require('../conversion_core');

describe('ConversionEngine', () => {
  describe('Conversões Dimensionais', () => {
    test('deve converter kg para g', () => {
      expect(convertValue(1, 'kg', 'g')).toBe(1000);
    });
    
    test('deve converter mL/h para mL/min', () => {
      expect(convertValue(60, 'mL/h', 'mL/min')).toBe(1);
    });
    
    test('deve converter μg/kg/min para mg/kg/h', () => {
      expect(convertValue(1000, 'μg/kg/min', 'mg/kg/h')).toBe(60);
    });
  });
  
  describe('Conversões de Valência', () => {
    test('deve converter mEq/L para mmol/L (Na+)', () => {
      expect(convertValue(140, 'mEq/L', 'mmol/L', 'sodium')).toBe(140);
    });
    
    test('deve converter mEq/L para mmol/L (Ca2+)', () => {
      expect(convertValue(10, 'mEq/L', 'mmol/L', 'calcium')).toBe(5);
    });
  });
  
  describe('Normalização de Unidades', () => {
    test('deve normalizar sinônimos', () => {
      expect(normalizeUnit('mcg')).toBe('μg');
      expect(normalizeUnit('cc')).toBe('mL');
    });
  });
});
```

### 11.2 Testes das Calculadoras
```javascript
// backend/src/core/tests/infusion.test.js
const DynamicCalculatorController = require('../../controllers/dynamic-calculator.controller');

describe('Calculadoras de Infusão', () => {
  describe('Gotas/min ↔ mL/h', () => {
    test('deve calcular mL/h a partir de gotas/min', async () => {
      const inputs = {
        drops_count: 30,
        time_seconds: 20,
        drop_factor: 20
      };
      
      const result = await DynamicCalculatorController.computeCalculation(
        { params: { id: 'infusion.drops_mlh' }, body: { inputs } },
        { json: jest.fn() }
      );
      
      expect(result.data.outputs.gtt_per_min).toBe(90);
      expect(result.data.outputs.ml_per_h).toBe(270);
    });
  });
  
  describe('μg/kg/min ↔ mL/h', () => {
    test('deve calcular taxa da bomba', async () => {
      const inputs = {
        dose_mcgkgmin: 0.1,
        weight_kg: 70,
        concentration_mg_ml: 0.064
      };
      
      const result = await DynamicCalculatorController.computeCalculation(
        { params: { id: 'infusion.mcgkgmin_mlh' }, body: { inputs } },
        { json: jest.fn() }
      );
      
      expect(result.data.outputs.rate_mlh).toBeCloseTo(6.56, 2);
    });
  });
});
```

## 12. Monitoramento e Logs

### 12.1 Estrutura de Logs
```javascript
// backend/src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'health-guardian-calculators' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Middleware de log para cálculos
const logCalculation = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('Calculation performed', {
      calculatorId: req.params.id,
      inputs: req.body.inputs,
      duration,
      statusCode: res.statusCode,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
};

module.exports = { logger, logCalculation };
```

## 13. Documentação de Deployment

### 13.1 Variáveis de Ambiente
```bash
# .env.example
# Calculadoras
CALCULATOR_CORE_PATH=/app/src/core
CALCULATOR_CACHE_TTL=3600
CALCULATOR_MAX_PRECISION=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logs
LOG_LEVEL=info
LOG_FILE_PATH=/app/logs

# Segurança
EXPRESSION_TIMEOUT_MS=5000
MAX_INPUT_SIZE=1000
```

### 13.2 Docker Configuration
```dockerfile
# Dockerfile - Adições para calculadoras
FROM node:18-alpine

# ... configuração existente ...

# Copiar arquivos do núcleo de conversão
COPY backend/src/core /app/src/core

# Instalar dependências matemáticas
RUN npm install mathjs express-validator express-rate-limit winston

# Criar diretório de logs
RUN mkdir -p /app/logs

# ... resto da configuração ...
```

## 14. Checklist de Implementação

### 14.1 Backend
- [ ] Estrutura de diretórios `/core` criada
- [ ] Catálogos JSON implementados
  - [ ] `units.factors.json`
  - [ ] `units.synonyms.json`
  - [ ] `analytes.catalog.json`
  - [ ] `analytes.synonyms.json`
- [ ] `conversion_core.js` implementado
- [ ] Controladores criados
  - [ ] `conversion.controller.js`
  - [ ] `dynamic-calculator.controller.js`
- [ ] Rotas configuradas
- [ ] Middlewares de validação
- [ ] Testes unitários
- [ ] Logs e monitoramento

### 14.2 Frontend
- [ ] Componente `DynamicCalculator` criado
- [ ] Modo Tap implementado
- [ ] Integração com `calculatorStore`
- [ ] Serviços de API atualizados
- [ ] Fallback para calculadoras existentes
- [ ] Testes de componentes
- [ ] Responsividade verificada

### 14.3 Schemas de Calculadoras
- [ ] `infusion.drops_mlh.json`
- [ ] `infusion.mcgkgmin_mlh.json`
- [ ] `infusion.mcgkgmin_gttmin.json`
- [ ] Casos de teste para cada calculadora
- [ ] Validação de exemplos

### 14.4 Integração
- [ ] APIs testadas com Postman/Insomnia
- [ ] Frontend conectado ao backend
- [ ] Histórico de cálculos funcionando
- [ ] Performance otimizada
- [ ] Tratamento de erros robusto

## 15. Próximos Passos

### 15.1 Expansão Futura
1. **Calculadoras de Função Renal**
   - Clearance de creatinina
   - eGFR (CKD-EPI, MDRD)
   - Ajuste de doses

2. **Calculadoras Pediátricas**
   - Doses por peso/superfície corporal
   - Calculadoras específicas por idade

3. **Calculadoras de Farmacologia**
   - Farmacocinética
   - Interações medicamentosas
   - Ajustes por função hepática

### 15.2 Melhorias Técnicas
1. **Cache Inteligente**
   - Redis para resultados frequentes
   - Cache de schemas

2. **Otimizações**
   - Lazy loading de calculadoras
   - Compressão de responses
   - CDN para assets

3. **Analytics**
   - Métricas de uso
   - Performance monitoring
   - Error tracking

---

**Status do Documento**: ✅ Completo  
**Última Atualização**: Janeiro 2024  
**Versão**: 1.0.0
  
```

