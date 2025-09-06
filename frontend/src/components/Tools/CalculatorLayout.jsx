/**
 * CalculatorLayout - Componente base padronizado para calculadoras médicas
 * 
 * Integrates with:
 * - services/ValidationService.js para validação de inputs
 * - services/PhysiologicalRanges.js para ranges fisiológicos
 * - components/Tools/ClinicalInterpretation.jsx para interpretação de resultados
 * - components/Tools/DynamicCalculator.jsx para renderização dinâmica
 * 
 * Hook: Exportado em components/Tools/CalculatorLayout.jsx e usado em calculadoras médicas
 * IA prompt: Adicionar suporte a múltiplas unidades, conversões automáticas e histórico de cálculos
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Calculator, Info, AlertTriangle, CheckCircle, Copy, RefreshCw } from 'lucide-react';
import { ValidationService } from '../../services/ValidationService';
import ClinicalInterpretation from './ClinicalInterpretation';
import { toast } from 'sonner';

/**
 * CalculatorLayout Component - Base layout for all medical calculators
 * 
 * @param {Object} props
 * @param {Object} props.schema - Calculator schema with inputs, outputs, and validation rules
 * @param {Function} props.onCalculate - Function to perform calculation
 * @param {Object} props.results - Calculation results
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 * @param {Object} props.initialInputs - Initial input values
 * @param {Function} props.onInputChange - Input change handler
 * @param {Object} props.context - Additional context (age, sex, etc.)
 */
const CalculatorLayout = ({
  schema,
  onCalculate,
  results,
  loading = false,
  error = null,
  initialInputs = {},
  onInputChange,
  context = {}
}) => {
  const [inputs, setInputs] = useState(initialInputs);
  const [validationErrors, setValidationErrors] = useState({});
  const [clinicalAlerts, setClinicalAlerts] = useState([]);
  const [activeMode, setActiveMode] = useState(null);
  const [copied, setCopied] = useState({});

  // Set initial active mode
  useEffect(() => {
    if (schema?.modes && schema.modes.length > 0 && !activeMode) {
      setActiveMode(schema.modes[0].id);
    }
  }, [schema, activeMode]);

  // Update inputs when initialInputs change
  useEffect(() => {
    setInputs(prev => ({ ...prev, ...initialInputs }));
  }, [initialInputs]);

  // Validate inputs in real-time
  const validationResult = useMemo(() => {
    if (!schema) return { isValid: true, fieldErrors: {}, clinicalAlerts: [] };
    
    return ValidationService.validateCalculatorInputs(inputs, schema, context);
  }, [inputs, schema, context]);

  // Update validation state
  useEffect(() => {
    setValidationErrors(validationResult.fieldErrors);
    setClinicalAlerts(validationResult.clinicalAlerts);
  }, [validationResult]);

  /**
   * Handle input value changes
   * @param {string} inputKey - Input field key
   * @param {*} value - New value
   */
  const handleInputChange = (inputKey, value) => {
    const newInputs = { ...inputs, [inputKey]: value };
    setInputs(newInputs);
    
    // Call external handler if provided
    if (onInputChange) {
      onInputChange(inputKey, value, newInputs);
    }
  };

  /**
   * Handle calculation trigger
   */
  const handleCalculate = () => {
    if (!validationResult.isValid) {
      toast.error('Por favor, corrija os erros de validação antes de calcular');
      return;
    }
    
    if (onCalculate) {
      onCalculate(inputs, context);
    }
  };

  /**
   * Clear all inputs and results
   */
  const handleClear = () => {
    setInputs({});
    setValidationErrors({});
    setClinicalAlerts([]);
    if (onInputChange) {
      onInputChange(null, null, {});
    }
  };

  /**
   * Copy result to clipboard
   * @param {string} key - Result key
   * @param {string} value - Value to copy
   */
  const handleCopy = async (key, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(prev => ({ ...prev, [key]: true }));
      toast.success('Copiado para a área de transferência');
      setTimeout(() => {
        setCopied(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  /**
   * Render input field based on type
   * @param {Object} inputDef - Input definition from schema
   * @returns {JSX.Element} Input component
   */
  const renderInput = (inputDef) => {
    const value = inputs[inputDef.key] || '';
    const hasError = validationErrors[inputDef.key];
    const errorMessage = hasError ? validationErrors[inputDef.key][0] : null;

    const inputProps = {
      id: inputDef.key,
      value,
      onChange: (e) => handleInputChange(inputDef.key, e.target.value),
      className: `${hasError ? 'border-red-500' : 'border-gray-600'} bg-theme-surface text-white`,
      placeholder: inputDef.placeholder,
      min: inputDef.min,
      max: inputDef.max,
      step: inputDef.step
    };

    let inputElement;

    switch (inputDef.type) {
      case 'select':
        inputElement = (
          <Select value={value} onValueChange={(val) => handleInputChange(inputDef.key, val)}>
            <SelectTrigger className={inputProps.className}>
              <SelectValue placeholder={inputDef.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {inputDef.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        break;
      
      case 'number':
        inputElement = (
          <Input
            {...inputProps}
            type="number"
            inputMode="decimal"
          />
        );
        break;
      
      default:
        inputElement = <Input {...inputProps} />;
    }

    return (
      <div key={inputDef.key} className="space-y-2">
        <Label htmlFor={inputDef.key} className="text-white flex items-center gap-2">
          {inputDef.label}
          {inputDef.required && <span className="text-red-500">*</span>}
          {inputDef.unit && <span className="text-gray-400">({inputDef.unit})</span>}
          {inputDef.description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{inputDef.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Label>
        {inputElement}
        {errorMessage && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            {errorMessage}
          </p>
        )}
        {inputDef.clinicalNote && (
          <p className="text-xs text-gray-400">{inputDef.clinicalNote}</p>
        )}
      </div>
    );
  };

  /**
   * Render calculation results
   * @returns {JSX.Element} Results component
   */
  const renderResults = () => {
    if (!results || !results.outputs) return null;

    return (
      <Card className="mt-6 border-gray-700/50 bg-theme-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Resultados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {results.outputs.map((output, index) => (
            <div key={index} className="flex items-center justify-between gap-2 rounded-xl border border-gray-600 bg-gray-800/30 px-3 py-2">
              <div className="flex flex-col">
                <span className="text-xs text-gray-400">{output.label}</span>
                <span className="text-lg font-semibold text-white">
                  {output.value} {output.unit && <span className="text-sm text-gray-400">{output.unit}</span>}
                </span>
                {output.description && (
                  <span className="text-xs text-gray-300">{output.description}</span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopy(`${output.label}-${index}`, `${output.value}${output.unit ? ` ${output.unit}` : ''}`)}
                className="text-gray-400 hover:text-white hover:bg-gray-700"
              >
                {copied[`${output.label}-${index}`] ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
          
          {/* Clinical Interpretation */}
          {results.interpretation && (
            <ClinicalInterpretation 
              interpretation={results.interpretation}
              context={context}
            />
          )}
        </CardContent>
      </Card>
    );
  };

  /**
   * Render clinical alerts
   * @returns {JSX.Element} Alerts component
   */
  const renderClinicalAlerts = () => {
    if (clinicalAlerts.length === 0) return null;

    return (
      <div className="space-y-2 mt-4">
        {clinicalAlerts.map((alert, index) => (
          <Alert key={index} className={`border-${alert.level === 'critical' ? 'red' : 'yellow'}-500`}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex flex-col gap-1">
                <span>{alert.message}</span>
                {alert.action && (
                  <span className="text-xs text-gray-400">Ação: {alert.action}</span>
                )}
              </div>
            </AlertDescription>
          </Alert>
        ))}
      </div>
    );
  };

  if (!schema) {
    return (
      <Card className="border-gray-700/50 bg-theme-card">
        <CardContent className="pt-6">
          <p className="text-gray-400 text-center">Schema da calculadora não encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-gray-700/50 bg-theme-card">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl text-white">
            <Calculator className="h-6 w-6" />
            {schema.name}
          </CardTitle>
          <CardDescription className="text-gray-300">
            {schema.description}
          </CardDescription>
          {schema.category && (
            <div className="flex justify-center mt-2">
              <Badge variant="secondary" className="bg-teal-600/20 text-teal-400">
                {schema.category}
              </Badge>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Clinical Context */}
      {schema.clinicalContext && (
        <Card className="border-gray-700/50 bg-theme-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Info className="h-4 w-4" />
              Contexto Clínico
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-300 space-y-2">
            {schema.clinicalContext.indication && (
              <p><strong>Indicação:</strong> {schema.clinicalContext.indication}</p>
            )}
            {schema.clinicalContext.contraindications && (
              <p><strong>Contraindicações:</strong> {
                Array.isArray(schema.clinicalContext.contraindications) 
                  ? schema.clinicalContext.contraindications.join(', ')
                  : schema.clinicalContext.contraindications
              }</p>
            )}
            {schema.clinicalContext.limitations && (
              <p><strong>Limitações:</strong> {
                Array.isArray(schema.clinicalContext.limitations)
                  ? schema.clinicalContext.limitations.join(', ')
                  : schema.clinicalContext.limitations
              }</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Calculator */}
      <Card className="border-gray-700/50 bg-theme-card">
        <CardContent className="pt-6">
          {/* Mode Selection */}
          {schema.modes && schema.modes.length > 1 && (
            <div className="mb-6">
              <Label className="text-white mb-2 block">Modo de Cálculo</Label>
              <Tabs value={activeMode} onValueChange={setActiveMode} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-700">
                  {schema.modes.map(mode => (
                    <TabsTrigger 
                      key={mode.id} 
                      value={mode.id}
                      className="data-[state=active]:bg-teal-600 data-[state=active]:text-white"
                    >
                      {mode.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* Input Fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {schema.inputs?.map(renderInput)}
          </div>

          {/* Clinical Alerts */}
          {renderClinicalAlerts()}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-6">
            <Button 
              onClick={handleCalculate}
              disabled={loading || !validationResult.isValid}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calcular
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClear}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Limpar
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="mt-4 border-red-500">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalculatorLayout;

// Conector: Integra com calculadoras prebuilt para layout padronizado