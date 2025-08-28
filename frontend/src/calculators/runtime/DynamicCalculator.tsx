import React, { useState, useEffect, useMemo } from 'react';
import { CalculatorShell } from './CalculatorShell';
import { CalcInput } from './CalcInput';
import { CopyableValue } from './CopyableValue';
import { TapCounter } from './TapCounter';
import { create as mathCreate, all } from 'mathjs';

/**
 * DynamicCalculator Component - Renderizador dinâmico de calculadoras baseado em schema JSON
 * 
 * Integrates with:
 * - CalculatorShell.tsx como container principal
 * - CalcInput.tsx para campos de entrada
 * - CopyableValue.tsx para resultados
 * - TapCounter.tsx quando schema.ui.tap está definido
 * - store/calculatorStore.js para persistência de valores
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.schema - Schema JSON da calculadora
 * @param {Object} props.initialValues - Valores iniciais dos campos
 * @param {Function} props.onValuesChange - Callback quando valores mudam
 * @param {boolean} props.backendMode - Se deve usar backend para cálculos
 * @param {string} props.className - Classes CSS adicionais
 * 
 * @example
 * return (
 *   <DynamicCalculator
 *     schema={infusionSchema}
 *     initialValues={{weightKg: 70}}
 *     onValuesChange={handleChange}
 *   />
 * )
 * 
 * Hook: Renderizador dinâmico principal do sistema de calculadoras
 * IA prompt: Adicionar cache de cálculos e validação de schemas em tempo real
 */

// Create safe MathJS instance
const math = mathCreate(all, {
  number: 'number',
  precision: 64
});

// Remove dangerous functions for security
math.import({
  'import': function () { throw new Error('Function import is disabled') },
  'createUnit': function () { throw new Error('Function createUnit is disabled') },
  'evaluate': function () { throw new Error('Function evaluate is disabled') },
  'parse': function () { throw new Error('Function parse is disabled') }
}, { override: true });

interface CalculatorSchema {
  id: string;
  version: string;
  title: string;
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
}

interface DynamicCalculatorProps {
  schema: CalculatorSchema;
  initialValues?: Record<string, any>;
  onValuesChange?: (values: Record<string, any>) => void;
  backendMode?: boolean;
  className?: string;
}

export const DynamicCalculator: React.FC<DynamicCalculatorProps> = ({
  schema,
  initialValues = {},
  onValuesChange,
  backendMode = false,
  className = ''
}) => {
  const [values, setValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    
    // Initialize with defaults from schema
    Object.entries(schema.fields).forEach(([key, field]) => {
      if (field.default !== undefined) {
        initial[key] = field.default;
      } else if (field.type === 'number') {
        initial[key] = '';
      } else {
        initial[key] = '';
      }
    });
    
    // Override with initial values
    return { ...initial, ...initialValues };
  });
  
  const [activeTab, setActiveTab] = useState(() => {
    return schema.ui.tabs?.[0]?.id || 'default';
  });
  
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  // Safe expression evaluation
  const evaluateExpression = (expression: string, context: Record<string, any>): number | null => {
    try {
      // Replace variables in expression with actual values
      let processedExpression = expression;
      
      Object.entries(context).forEach(([key, value]) => {
        const numValue = parseFloat(value) || 0;
        processedExpression = processedExpression.replace(
          new RegExp(`\\b${key}\\b`, 'g'), 
          numValue.toString()
        );
      });
      
      // Handle conditional expressions (ternary operator)
      processedExpression = processedExpression.replace(
        /(\w+)\s*==\s*'([^']+)'\s*\?\s*([^:]+)\s*:\s*(.+)/g,
        (match, variable, value, trueExpr, falseExpr) => {
          const varValue = context[variable];
          return varValue === value ? trueExpr : falseExpr;
        }
      );
      
      const result = math.evaluate(processedExpression);
      return typeof result === 'number' ? result : null;
    } catch (error) {
      console.warn('Expression evaluation error:', error);
      return null;
    }
  };

  // Calculate results based on expressions
  const calculatedResults = useMemo(() => {
    const newResults: Record<string, any> = {};
    
    Object.entries(schema.expressions).forEach(([key, expression]) => {
      const result = evaluateExpression(expression, values);
      if (result !== null) {
        const field = schema.fields[key];
        const decimals = field?.decimals || 2;
        newResults[key] = parseFloat(result.toFixed(decimals));
      }
    });
    
    return newResults;
  }, [values, schema.expressions, schema.fields]);

  // Update results when calculations change
  useEffect(() => {
    setResults(calculatedResults);
  }, [calculatedResults]);

  // Notify parent of value changes
  useEffect(() => {
    if (onValuesChange) {
      onValuesChange({ ...values, ...results });
    }
  }, [values, results, onValuesChange]);

  const handleValueChange = (fieldKey: string, newValue: any) => {
    setValues(prev => ({
      ...prev,
      [fieldKey]: newValue
    }));
  };

  const handleTapResult = (gttPerMin: number, tapCount: number, elapsedSeconds: number) => {
    if (schema.ui.tap?.targetField) {
      handleValueChange(schema.ui.tap.targetField, gttPerMin.toFixed(1));
    }
  };

  const renderField = (fieldKey: string, isOutput: boolean = false) => {
    const field = schema.fields[fieldKey];
    if (!field) return null;

    const currentValue = isOutput ? results[fieldKey] : values[fieldKey];
    const placeholder = schema.ui.placeholders?.[fieldKey];

    if (isOutput || field.type === 'result') {
      return (
        <CopyableValue
          key={fieldKey}
          label={field.label}
          value={currentValue}
          unit={field.unit}
          decimals={field.decimals}
          loading={loading}
        />
      );
    }

    const options = field.options?.map(opt => ({ value: opt, label: opt })) || [];

    return (
      <div key={fieldKey} className="calculator-input-group">
        <CalcInput
          id={fieldKey}
          label={field.label}
          type={field.type}
          value={currentValue || ''}
          onChange={(value) => handleValueChange(fieldKey, value)}
          placeholder={placeholder}
          unit={field.unit}
          min={field.min}
          max={field.max}
          decimals={field.decimals}
          options={options}
          required={true}
        />
        
        {/* Render TapCounter if this field is the tap target */}
        {schema.ui.tap?.targetField === fieldKey && (
          <div className="mt-3">
            <TapCounter
              onTapResult={handleTapResult}
              minTime={schema.ui.tap.minTime || 5}
            />
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = (tab: any) => {
    return (
      <div className="space-y-6">
        {/* Input Fields */}
        {tab.inputs.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-300 border-b border-gray-700 pb-2">
              Dados de Entrada
            </h3>
            <div className="grid gap-4">
              {tab.inputs.map((fieldKey: string) => renderField(fieldKey, false))}
            </div>
          </div>
        )}

        {/* Output Fields */}
        {tab.outputs.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-emerald-300 border-b border-emerald-700/30 pb-2">
              Resultados
            </h3>
            <div className="grid gap-3">
              {tab.outputs.map((fieldKey: string) => renderField(fieldKey, true))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const currentTab = schema.ui.tabs?.find(tab => tab.id === activeTab) || schema.ui.tabs?.[0];
  const formulaNote = currentTab?.formulaNote;

  return (
    <div className={className}>
      <CalculatorShell
        title={schema.title}
        tabs={schema.ui.tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        disclaimer={schema.disclaimer}
        references={schema.references}
        formulaNote={formulaNote}
      >
        {schema.ui.tabs ? (
          currentTab && renderTabContent(currentTab)
        ) : (
          <div className="space-y-6">
            {/* Render all fields if no tabs */}
            <div className="grid gap-4">
              {Object.keys(schema.fields)
                .filter(key => schema.fields[key].type !== 'result')
                .map(fieldKey => renderField(fieldKey, false))}
            </div>
            
            <div className="grid gap-3">
              {Object.keys(schema.fields)
                .filter(key => schema.fields[key].type === 'result')
                .map(fieldKey => renderField(fieldKey, true))}
            </div>
          </div>
        )}
      </CalculatorShell>
    </div>
  );
};

export default DynamicCalculator;

// Connector: Componente principal usado em páginas de calculadoras
// Hook: Renderizador dinâmico baseado em schemas JSON