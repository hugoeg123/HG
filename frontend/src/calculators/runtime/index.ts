/**
 * Calculator Runtime Components - Sistema de calculadoras dinâmicas
 * 
 * Integrates with:
 * - Todos os componentes do runtime das calculadoras
 * - Schemas JSON para definição de calculadoras
 * - Sistema de estilos emerald-focus
 * 
 * @module CalculatorRuntime
 * 
 * Hook: Exportações centralizadas do sistema de calculadoras
 * IA prompt: Adicionar lazy loading e tree shaking para otimização
 */

// Core Components
export { CalculatorShell } from './CalculatorShell';
export { DynamicCalculator } from './DynamicCalculator';

// Input Components
export { CalcInput } from './CalcInput';
export { TapCounter } from './TapCounter';

// Output Components
export { CopyableValue } from './CopyableValue';

// Information Components
export { FormulaNote } from './FormulaNote';
export { ReferenceList } from './ReferenceList';

// Type Definitions
export interface CalculatorSchema {
  id: string;
  version: string;
  title: string;
  description?: string;
  category?: string;
  ui: {
    tabs?: Array<{
      id: string;
      label: string;
      inputs: string[];
      outputs: string[];
      howto?: string[];
      formulaNote?: string;
    }>;
    placeholders?: Record<string, string>;
    highlightStyle?: string;
    tap?: {
      targetField: string;
      minTime?: number;
    };
  };
  fields: Record<string, {
    type: 'number' | 'text' | 'select' | 'result';
    label: string;
    min?: number;
    max?: number;
    decimals?: number;
    options?: string[];
    default?: any;
    unit?: string;
  }>;
  expressions: Record<string, string>;
  disclaimer?: string;
  references?: string[];
  metadata?: {
    createdAt?: string;
    author?: string;
    tags?: string[];
    clinicalArea?: string;
    complexity?: 'basic' | 'intermediate' | 'advanced';
  };
}

export interface CalculatorRuntimeProps {
  schema: CalculatorSchema;
  initialValues?: Record<string, any>;
  onValuesChange?: (values: Record<string, any>) => void;
  backendMode?: boolean;
  className?: string;
}

// Utility Functions
export const loadCalculatorSchema = async (schemaId: string): Promise<CalculatorSchema | null> => {
  try {
    const response = await import(`../../data/schemas/calculators/${schemaId}.json`);
    return response.default as CalculatorSchema;
  } catch (error) {
    console.error(`Failed to load calculator schema: ${schemaId}`, error);
    return null;
  }
};

export const validateCalculatorSchema = (schema: any): schema is CalculatorSchema => {
  return (
    typeof schema === 'object' &&
    typeof schema.id === 'string' &&
    typeof schema.version === 'string' &&
    typeof schema.title === 'string' &&
    typeof schema.ui === 'object' &&
    typeof schema.fields === 'object' &&
    typeof schema.expressions === 'object'
  );
};

// Constants
export const CALCULATOR_THEMES = {
  emerald: 'emerald-focus',
  teal: 'teal-focus',
  blue: 'blue-focus'
} as const;

export const CALCULATOR_CATEGORIES = {
  INFUSIONS: 'Infusões',
  CONVERSIONS: 'Conversões',
  SCORES: 'Escores Clínicos',
  DOSAGES: 'Dosagens',
  PHYSIOLOGY: 'Fisiologia'
} as const;

// Connector: Exportações centralizadas para uso em páginas de calculadoras
// Hook: Sistema completo de calculadoras dinâmicas baseado em JSON