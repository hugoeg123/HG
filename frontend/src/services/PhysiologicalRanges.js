/**
 * PhysiologicalRanges - Biblioteca de ranges fisiológicos para validação médica
 * 
 * Integrates with:
 * - services/ValidationService.js para validação de parâmetros médicos
 * - components/Tools/CalculatorLayout.jsx para validação de inputs
 * - backend/src/core/calculators/ para definições JSON
 * 
 * Hook: Exportado em services/PhysiologicalRanges.js e usado em ValidationService
 * IA prompt: Adicionar ranges específicos por idade, sexo e população brasileira
 */

/**
 * Physiological parameter ranges for medical validation
 * Based on standard clinical references and medical literature
 * 
 * Connector: Usado em ValidationService.js para validação clínica
 */
export const PHYSIOLOGICAL_RANGES = {
  // Demographics
  age: {
    min: 0,
    max: 120,
    unit: 'anos',
    criticalValues: [
      { min: 0, max: 1, message: 'Atenção: Fórmulas podem não ser válidas para neonatos', action: 'Consultar pediatra' },
      { min: 90, max: 120, message: 'Atenção: Validar adequação da fórmula para idade muito avançada', action: 'Considerar limitações' }
    ]
  },
  
  weight: {
    min: 0.5,
    max: 500,
    unit: 'kg',
    criticalValues: [
      { min: 0.5, max: 2.5, message: 'Peso muito baixo - verificar se é neonato/prematuro', action: 'Usar fórmulas pediátricas' },
      { min: 200, max: 500, message: 'Peso extremamente elevado - validar medição', action: 'Considerar obesidade mórbida' }
    ]
  },
  
  height: {
    min: 30,
    max: 250,
    unit: 'cm',
    criticalValues: [
      { min: 30, max: 50, message: 'Altura muito baixa - verificar se é neonato', action: 'Usar percentis pediátricos' }
    ]
  },

  // Vital Signs
  systolic_bp: {
    min: 50,
    max: 300,
    unit: 'mmHg',
    criticalValues: [
      { min: 50, max: 90, message: 'Hipotensão severa - risco de choque', action: 'Avaliação urgente' },
      { min: 180, max: 300, message: 'Hipertensão severa - risco de emergência hipertensiva', action: 'Monitorização intensiva' }
    ]
  },
  
  diastolic_bp: {
    min: 20,
    max: 200,
    unit: 'mmHg',
    criticalValues: [
      { min: 20, max: 40, message: 'Hipotensão diastólica severa', action: 'Investigar causa' },
      { min: 120, max: 200, message: 'Hipertensão diastólica severa', action: 'Tratamento urgente' }
    ]
  },
  
  heart_rate: {
    min: 20,
    max: 300,
    unit: 'bpm',
    criticalValues: [
      { min: 20, max: 40, message: 'Bradicardia severa - risco de parada cardíaca', action: 'Avaliação cardiológica urgente' },
      { min: 150, max: 300, message: 'Taquicardia severa - investigar causa', action: 'Monitorização cardíaca' }
    ]
  },
  
  respiratory_rate: {
    min: 5,
    max: 60,
    unit: 'irpm',
    criticalValues: [
      { min: 5, max: 8, message: 'Bradipneia severa - risco de insuficiência respiratória', action: 'Suporte ventilatório' },
      { min: 35, max: 60, message: 'Taquipneia severa - investigar causa', action: 'Avaliação respiratória' }
    ]
  },
  
  temperature: {
    min: 25,
    max: 45,
    unit: '°C',
    criticalValues: [
      { min: 25, max: 32, message: 'Hipotermia severa - risco de vida', action: 'Reaquecimento urgente' },
      { min: 40, max: 45, message: 'Hipertermia severa - risco de lesão cerebral', action: 'Resfriamento urgente' }
    ]
  },

  // Laboratory - Biochemistry
  creatinine: {
    min: 0.1,
    max: 20,
    unit: 'mg/dL',
    criticalValues: [
      { min: 5, max: 20, message: 'Insuficiência renal severa - considerar diálise', action: 'Avaliação nefrológica urgente' }
    ]
  },
  
  urea: {
    min: 5,
    max: 300,
    unit: 'mg/dL',
    criticalValues: [
      { min: 100, max: 300, message: 'Uremia severa', action: 'Avaliação nefrológica' }
    ]
  },
  
  sodium: {
    min: 100,
    max: 200,
    unit: 'mEq/L',
    criticalValues: [
      { min: 100, max: 125, message: 'Hiponatremia severa - risco de convulsões', action: 'Correção cuidadosa' },
      { min: 160, max: 200, message: 'Hipernatremia severa - risco neurológico', action: 'Correção gradual' }
    ]
  },
  
  potassium: {
    min: 1,
    max: 10,
    unit: 'mEq/L',
    criticalValues: [
      { min: 1, max: 2.5, message: 'Hipocalemia severa - risco de arritmias', action: 'Reposição urgente' },
      { min: 6.5, max: 10, message: 'Hipercalemia severa - risco de parada cardíaca', action: 'Tratamento emergencial' }
    ]
  },
  
  glucose: {
    min: 10,
    max: 1000,
    unit: 'mg/dL',
    criticalValues: [
      { min: 10, max: 40, message: 'Hipoglicemia severa - risco de coma', action: 'Correção imediata' },
      { min: 400, max: 1000, message: 'Hiperglicemia severa - risco de cetoacidose', action: 'Protocolo diabetes' }
    ]
  },

  // Laboratory - Liver Function
  ast: {
    min: 1,
    max: 5000,
    unit: 'U/L',
    criticalValues: [
      { min: 1000, max: 5000, message: 'Elevação severa de AST - hepatite fulminante?', action: 'Avaliação hepatológica urgente' }
    ]
  },
  
  alt: {
    min: 1,
    max: 5000,
    unit: 'U/L',
    criticalValues: [
      { min: 1000, max: 5000, message: 'Elevação severa de ALT - hepatotoxicidade?', action: 'Investigar causa' }
    ]
  },
  
  bilirubin_total: {
    min: 0.1,
    max: 50,
    unit: 'mg/dL',
    criticalValues: [
      { min: 20, max: 50, message: 'Hiperbilirrubinemia severa - risco de kernicterus', action: 'Tratamento urgente' }
    ]
  },
  
  albumin: {
    min: 1,
    max: 6,
    unit: 'g/dL',
    criticalValues: [
      { min: 1, max: 2, message: 'Hipoalbuminemia severa - desnutrição/hepatopatia', action: 'Investigar causa' }
    ]
  },

  // Laboratory - Hematology
  platelets: {
    min: 1,
    max: 2000,
    unit: '×10³/μL',
    criticalValues: [
      { min: 1, max: 20, message: 'Plaquetopenia severa - risco de sangramento', action: 'Transfusão de plaquetas' },
      { min: 1000, max: 2000, message: 'Plaquetose severa - risco de trombose', action: 'Investigar causa' }
    ]
  },
  
  hemoglobin: {
    min: 2,
    max: 25,
    unit: 'g/dL',
    criticalValues: [
      { min: 2, max: 6, message: 'Anemia severa - risco de insuficiência cardíaca', action: 'Transfusão sanguínea' },
      { min: 20, max: 25, message: 'Policitemia severa - risco de trombose', action: 'Flebotomia' }
    ]
  },
  
  hematocrit: {
    min: 5,
    max: 80,
    unit: '%',
    criticalValues: [
      { min: 5, max: 18, message: 'Hematócrito muito baixo - anemia severa', action: 'Transfusão sanguínea' },
      { min: 60, max: 80, message: 'Hematócrito muito alto - policitemia', action: 'Investigar causa' }
    ]
  },
  
  wbc: {
    min: 0.1,
    max: 100,
    unit: '×10³/μL',
    criticalValues: [
      { min: 0.1, max: 1, message: 'Leucopenia severa - risco de infecção', action: 'Isolamento protetor' },
      { min: 50, max: 100, message: 'Leucocitose severa - leucemia?', action: 'Avaliação hematológica' }
    ]
  },

  // Blood Gas Analysis
  ph: {
    min: 6.8,
    max: 8.0,
    unit: '',
    criticalValues: [
      { min: 6.8, max: 7.1, message: 'Acidemia severa - risco de vida', action: 'Correção urgente' },
      { min: 7.6, max: 8.0, message: 'Alcalemia severa - risco de arritmias', action: 'Investigar causa' }
    ]
  },
  
  pco2: {
    min: 10,
    max: 120,
    unit: 'mmHg',
    criticalValues: [
      { min: 10, max: 20, message: 'Hipocapnia severa - alcalose respiratória', action: 'Ajustar ventilação' },
      { min: 80, max: 120, message: 'Hipercapnia severa - acidose respiratória', action: 'Suporte ventilatório' }
    ]
  },
  
  po2: {
    min: 30,
    max: 600,
    unit: 'mmHg',
    criticalValues: [
      { min: 30, max: 60, message: 'Hipoxemia severa - insuficiência respiratória', action: 'Oxigenoterapia urgente' }
    ]
  },
  
  bicarbonate: {
    min: 5,
    max: 50,
    unit: 'mEq/L',
    criticalValues: [
      { min: 5, max: 10, message: 'Acidose metabólica severa', action: 'Correção com bicarbonato' },
      { min: 35, max: 50, message: 'Alcalose metabólica severa', action: 'Investigar causa' }
    ]
  },

  // Cardiac Markers
  troponin: {
    min: 0,
    max: 100,
    unit: 'ng/mL',
    criticalValues: [
      { min: 0.1, max: 100, message: 'Troponina elevada - infarto do miocárdio?', action: 'Protocolo síndrome coronariana aguda' }
    ]
  },

  // Coagulation
  inr: {
    min: 0.5,
    max: 10,
    unit: '',
    criticalValues: [
      { min: 5, max: 10, message: 'INR muito elevado - risco de sangramento', action: 'Reverter anticoagulação' }
    ]
  },
  
  aptt: {
    min: 15,
    max: 200,
    unit: 'segundos',
    criticalValues: [
      { min: 100, max: 200, message: 'APTT muito prolongado - risco de sangramento', action: 'Investigar coagulopatia' }
    ]
  },

  // Endocrine
  hba1c: {
    min: 4,
    max: 20,
    unit: '%',
    criticalValues: [
      { min: 12, max: 20, message: 'HbA1c muito elevada - diabetes descompensado', action: 'Otimizar controle glicêmico' }
    ]
  },

  // Calculated Parameters
  bmi: {
    min: 10,
    max: 80,
    unit: 'kg/m²',
    criticalValues: [
      { min: 10, max: 16, message: 'Desnutrição severa', action: 'Suporte nutricional' },
      { min: 40, max: 80, message: 'Obesidade mórbida', action: 'Avaliação multidisciplinar' }
    ]
  },
  
  gfr: {
    min: 1,
    max: 200,
    unit: 'mL/min/1.73m²',
    criticalValues: [
      { min: 1, max: 15, message: 'Insuficiência renal terminal', action: 'Considerar terapia renal substitutiva' },
      { min: 15, max: 30, message: 'Insuficiência renal severa', action: 'Preparar para diálise' }
    ]
  }
};

/**
 * Get age-adjusted ranges for specific parameters
 * @param {string} parameter - Parameter name
 * @param {number} age - Patient age in years
 * @returns {Object|null} Adjusted range or null if not found
 */
export function getAgeAdjustedRange(parameter, age) {
  const baseRange = PHYSIOLOGICAL_RANGES[parameter];
  if (!baseRange) return null;

  // Age-specific adjustments
  const adjustments = {
    heart_rate: {
      pediatric: age < 18 ? { min: 60, max: 180 } : null,
      elderly: age > 65 ? { min: 50, max: 120 } : null
    },
    systolic_bp: {
      pediatric: age < 18 ? { min: 80, max: 120 } : null,
      elderly: age > 65 ? { min: 90, max: 160 } : null
    },
    respiratory_rate: {
      pediatric: age < 18 ? { min: 15, max: 30 } : null
    }
  };

  const paramAdjustments = adjustments[parameter];
  if (paramAdjustments) {
    if (age < 18 && paramAdjustments.pediatric) {
      return { ...baseRange, ...paramAdjustments.pediatric };
    }
    if (age > 65 && paramAdjustments.elderly) {
      return { ...baseRange, ...paramAdjustments.elderly };
    }
  }

  return baseRange;
}

/**
 * Get sex-adjusted ranges for specific parameters
 * @param {string} parameter - Parameter name
 * @param {string} sex - Patient sex ('M' or 'F')
 * @returns {Object|null} Adjusted range or null if not found
 */
export function getSexAdjustedRange(parameter, sex) {
  const baseRange = PHYSIOLOGICAL_RANGES[parameter];
  if (!baseRange) return null;

  // Sex-specific adjustments
  const adjustments = {
    hemoglobin: {
      M: { min: 13.5, max: 17.5 },
      F: { min: 12.0, max: 15.5 }
    },
    hematocrit: {
      M: { min: 41, max: 53 },
      F: { min: 36, max: 46 }
    },
    creatinine: {
      M: { min: 0.7, max: 1.3 },
      F: { min: 0.6, max: 1.1 }
    }
  };

  const paramAdjustments = adjustments[parameter];
  if (paramAdjustments && paramAdjustments[sex]) {
    return { ...baseRange, ...paramAdjustments[sex] };
  }

  return baseRange;
}

export default PHYSIOLOGICAL_RANGES;