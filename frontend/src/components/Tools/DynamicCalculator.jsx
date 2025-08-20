import React, { useState, useEffect } from 'react';
import { dynamicCalculatorService } from '../../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Calculator, AlertTriangle, Info, CheckCircle } from 'lucide-react';

/**
 * DynamicCalculator Component - Renders and executes dynamic calculators
 * 
 * Integrates with:
 * - services/api.js dynamicCalculatorService for backend communication
 * - backend/src/controllers/DynamicCalculatorController.js for calculations
 * - backend/src/core/calculators/ JSON schemas for calculator definitions
 * 
 * @component
 * @param {Object} props
 * @param {string} props.calculatorId - ID of the calculator to render
 * @param {boolean} props.open - Whether the dialog is open
 * @param {function} props.onOpenChange - Callback when dialog open state changes
 * @param {Object} props.initialInputs - Initial input values
 * 
 * Hook: Provides dynamic calculator interface with real-time calculations
 * IA prompt: Add calculation history, favorite inputs, and result export
 */
const DynamicCalculator = ({ 
  calculatorId, 
  open = false, 
  onOpenChange, 
  initialInputs = {} 
}) => {
  const [schema, setSchema] = useState(null);
  const [inputs, setInputs] = useState(initialInputs);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeMode, setActiveMode] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Load calculator schema when component mounts or calculatorId changes
  useEffect(() => {
    if (calculatorId && open) {
      loadCalculatorSchema();
    }
  }, [calculatorId, open]);

  // Set initial active mode when schema loads
  useEffect(() => {
    if (schema && schema.modes && schema.modes.length > 0 && !activeMode) {
      setActiveMode(schema.modes[0].id);
    }
  }, [schema, activeMode]);

  // Load calculator schema from backend
  const loadCalculatorSchema = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await dynamicCalculatorService.getCalculatorSchema(calculatorId);
      setSchema(response.data);
      
      // Initialize inputs with default values
      const defaultInputs = {};
      if (response.data.inputs) {
        response.data.inputs.forEach(input => {
          if (input.default !== undefined) {
            defaultInputs[input.key] = input.default;
          }
        });
      }
      setInputs({ ...defaultInputs, ...initialInputs });
      
    } catch (err) {
      console.error('Error loading calculator schema:', err);
      setError('Erro ao carregar calculadora: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Handle input value changes
  const handleInputChange = (inputKey, value) => {
    setInputs(prev => ({ ...prev, [inputKey]: value }));
    
    // Clear validation error for this input
    if (validationErrors[inputKey]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[inputKey];
        return newErrors;
      });
    }
    
    // Auto-calculate if enabled
    if (schema?.autoCalculate) {
      setTimeout(() => handleCalculate(), 300);
    }
  };

  // Validate inputs before calculation
  const validateInputs = () => {
    const errors = {};
    
    if (!schema || !schema.inputs) return errors;
    
    schema.inputs.forEach(input => {
      const value = inputs[input.key];
      
      // Required field validation
      if (input.required && (value === undefined || value === null || value === '')) {
        errors[input.key] = 'Campo obrigatório';
        return;
      }
      
      // Skip validation if field is empty and not required
      if (value === undefined || value === null || value === '') {
        return;
      }
      
      // Type validation
      if (input.type === 'number') {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          errors[input.key] = 'Deve ser um número válido';
          return;
        }
        
        // Range validation
        if (input.min !== undefined && numValue < input.min) {
          errors[input.key] = `Valor mínimo: ${input.min}`;
        }
        if (input.max !== undefined && numValue > input.max) {
          errors[input.key] = `Valor máximo: ${input.max}`;
        }
      }
    });
    
    return errors;
  };

  // Perform calculation
  const handleCalculate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate inputs
      const errors = validateInputs();
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setLoading(false);
        return;
      }
      
      setValidationErrors({});
      
      // Prepare calculation data
      const calculationData = {
        inputs,
        mode: activeMode
      };
      
      const response = await dynamicCalculatorService.calculate(calculatorId, calculationData);
      setResults(response.data);
      
    } catch (err) {
      console.error('Error performing calculation:', err);
      setError('Erro no cálculo: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Clear all inputs and results
  const handleClear = () => {
    setInputs({});
    setResults(null);
    setValidationErrors({});
    setError(null);
  };

  // Get current mode configuration
  const getCurrentMode = () => {
    if (!schema || !schema.modes || !activeMode) return null;
    return schema.modes.find(mode => mode.id === activeMode);
  };

  // Render input field based on type
  const renderInput = (input) => {
    const value = inputs[input.key] || '';
    const hasError = validationErrors[input.key];
    
    switch (input.type) {
      case 'select':
        return (
          <div key={input.key} className="space-y-2">
            <Label htmlFor={input.key}>
              {input.label}
              {input.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={value} onValueChange={(val) => handleInputChange(input.key, val)}>
              <SelectTrigger className={hasError ? 'border-red-500' : ''}>
                <SelectValue placeholder={input.placeholder || 'Selecione...'} />
              </SelectTrigger>
              <SelectContent>
                {input.options?.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && (
              <p className="text-sm text-red-500">{validationErrors[input.key]}</p>
            )}
            {input.description && (
              <p className="text-sm text-gray-500">{input.description}</p>
            )}
          </div>
        );
        
      default:
        return (
          <div key={input.key} className="space-y-2">
            <Label htmlFor={input.key}>
              {input.label}
              {input.required && <span className="text-red-500 ml-1">*</span>}
              {input.unit && <span className="text-gray-500 ml-1">({input.unit})</span>}
            </Label>
            <Input
              id={input.key}
              type={input.type || 'text'}
              value={value}
              onChange={(e) => handleInputChange(input.key, e.target.value)}
              placeholder={input.placeholder}
              className={hasError ? 'border-red-500' : ''}
              min={input.min}
              max={input.max}
              step={input.step}
            />
            {hasError && (
              <p className="text-sm text-red-500">{validationErrors[input.key]}</p>
            )}
            {input.description && (
              <p className="text-sm text-gray-500">{input.description}</p>
            )}
          </div>
        );
    }
  };

  // Render calculation results
  const renderResults = () => {
    if (!results || !results.outputs) return null;
    
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Resultados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(results.outputs).map(([key, output]) => (
            <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">{output.label || key}</div>
                {output.description && (
                  <div className="text-sm text-gray-600">{output.description}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-teal-600">
                  {output.value}
                  {output.unit && <span className="text-sm font-normal ml-1">{output.unit}</span>}
                </div>
                {output.interpretation && (
                  <div className="text-sm text-gray-600">{output.interpretation}</div>
                )}
              </div>
            </div>
          ))}
          
          {/* Safety alerts */}
          {results.alerts && results.alerts.length > 0 && (
            <div className="space-y-2">
              {results.alerts.map((alert, index) => (
                <Alert key={index} className={`border-${alert.type === 'warning' ? 'yellow' : 'red'}-500`}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}
          
          {/* Clinical notes */}
          {results.notes && results.notes.length > 0 && (
            <div className="space-y-2">
              {results.notes.map((note, index) => (
                <Alert key={index}>
                  <Info className="h-4 w-4" />
                  <AlertDescription>{note}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!schema) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              {loading ? 'Carregando...' : 'Calculadora'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            {loading ? (
              <div className="text-gray-500">Carregando calculadora...</div>
            ) : (
              <div className="text-red-500">Erro ao carregar calculadora</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentMode = getCurrentMode();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {schema.name}
          </DialogTitle>
          {schema.description && (
            <p className="text-sm text-gray-600">{schema.description}</p>
          )}
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Mode selection */}
          {schema.modes && schema.modes.length > 1 && (
            <div>
              <Label>Modo de Cálculo</Label>
              <Tabs value={activeMode} onValueChange={setActiveMode} className="mt-2">
                <TabsList className="grid w-full grid-cols-3">
                  {schema.modes.map(mode => (
                    <TabsTrigger key={mode.id} value={mode.id}>
                      {mode.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          )}
          
          {/* Current mode description */}
          {currentMode && currentMode.description && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>{currentMode.description}</AlertDescription>
            </Alert>
          )}
          
          {/* Input fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schema.inputs?.map(input => renderInput(input))}
          </div>
          
          {/* Error display */}
          {error && (
            <Alert className="border-red-500">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Results */}
          {renderResults()}
        </div>
        
        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClear}>
              Limpar
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button 
              onClick={handleCalculate} 
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {loading ? 'Calculando...' : 'Calcular'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DynamicCalculator;

// Connector: Integrates with Calculators.jsx for dynamic calculator display
// Hook: Provides interface for JSON-defined calculators with real-time calculations