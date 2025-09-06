import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../ui/card';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { Copy, Calculator, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';

/**
 * McgKgMinToMLConverter - Conversão μg/kg/min ↔ mL/h
 * 
 * This component provides bidirectional conversion between mcg/kg/min dosing
 * and mL/h infusion rates for continuous medication infusions.
 * 
 * Integrates with:
 * - Calculators.jsx via hardcodedCalculators array
 * - Dialog component for modal display
 * - Cards for structured layout
 * 
 * @param {boolean} open - Controls modal visibility
 * @param {function} onOpenChange - Callback for modal state changes
 * 
 * @example
 * // Basic usage in Calculators.jsx
 * <McgKgMinToMLConverter 
 *   open={showHardcodedCalculator === 'mcg-kg-min-converter'} 
 *   onOpenChange={() => setShowHardcodedCalculator(null)} 
 * />
 * 
 * @example
 * // Calculation example
 * // Input: dose=5 mcg/kg/min, weight=70kg, concentration=4mg/250mL
 * // Output: infusionRate=13.1 mL/h, totalDose=350 mcg/min
 * 
 * @author Health Guardian Team
 * @since Sprint 2
 * @version 1.0.0
 */
function McgKgMinToMLConverter({ open, onOpenChange }) {
  const [mode, setMode] = useState('mcg-to-ml'); // 'mcg-to-ml' | 'ml-to-mcg'
  const [inputs, setInputs] = useState({
    dose: '',
    weight: '',
    concentration: '',
    dilution: '250',
    infusionRate: ''
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  // Common medication concentrations
  const commonMedications = [
    { name: 'Noradrenalina', concentration: '4', dilution: '250', unit: 'mg/250mL' },
    { name: 'Adrenalina', concentration: '2', dilution: '250', unit: 'mg/250mL' },
    { name: 'Dopamina', concentration: '200', dilution: '250', unit: 'mg/250mL' },
    { name: 'Dobutamina', concentration: '250', dilution: '250', unit: 'mg/250mL' },
    { name: 'Vasopressina', concentration: '20', dilution: '50', unit: 'UI/50mL' }
  ];

  /**
   * Validates input parameters for conversion calculation
   * 
   * @returns {boolean} True if all inputs are valid
   */
  const validateInputs = useCallback(() => {
    const newErrors = {};
    
    if (mode === 'mcg-to-ml') {
      if (!inputs.dose || parseFloat(inputs.dose) <= 0) {
        newErrors.dose = 'Dose deve ser maior que 0 μg/kg/min';
      }
      if (!inputs.weight || parseFloat(inputs.weight) <= 0) {
        newErrors.weight = 'Peso deve ser maior que 0 kg';
      }
      if (!inputs.concentration || parseFloat(inputs.concentration) <= 0) {
        newErrors.concentration = 'Concentração deve ser maior que 0';
      }
      if (!inputs.dilution || parseFloat(inputs.dilution) <= 0) {
        newErrors.dilution = 'Volume de diluição deve ser maior que 0 mL';
      }
    } else {
      if (!inputs.infusionRate || parseFloat(inputs.infusionRate) <= 0) {
        newErrors.infusionRate = 'Taxa de infusão deve ser maior que 0 mL/h';
      }
      if (!inputs.weight || parseFloat(inputs.weight) <= 0) {
        newErrors.weight = 'Peso deve ser maior que 0 kg';
      }
      if (!inputs.concentration || parseFloat(inputs.concentration) <= 0) {
        newErrors.concentration = 'Concentração deve ser maior que 0';
      }
      if (!inputs.dilution || parseFloat(inputs.dilution) <= 0) {
        newErrors.dilution = 'Volume de diluição deve ser maior que 0 mL';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs, mode]);

  /**
   * Performs the conversion calculation based on current mode
   * 
   * @returns {Object} Calculated results
   */
  const calculate = useCallback(() => {
    if (!validateInputs()) return;
    
    try {
      const weight = parseFloat(inputs.weight);
      const concentration = parseFloat(inputs.concentration);
      const dilution = parseFloat(inputs.dilution);
      
      let calculatedResults;
      
      if (mode === 'mcg-to-ml') {
        const dose = parseFloat(inputs.dose);
        
        // Calculate total dose per minute
        const totalDosePerMin = dose * weight; // mcg/min
        
        // Convert to mg/min
        const mgPerMin = totalDosePerMin / 1000;
        
        // Calculate mL/h
        const mgPerHour = mgPerMin * 60;
        const infusionRate = (mgPerHour / concentration) * dilution;
        
        calculatedResults = {
          infusionRate: infusionRate.toFixed(1),
          totalDose: totalDosePerMin.toFixed(1),
          mgPerHour: mgPerHour.toFixed(2),
          concentrationUsed: `${concentration} mg/${dilution} mL`
        };
      } else {
        const infusionRate = parseFloat(inputs.infusionRate);
        
        // Calculate mg/h from infusion rate
        const mgPerHour = (infusionRate * concentration) / dilution;
        
        // Convert to mcg/min
        const mgPerMin = mgPerHour / 60;
        const totalDosePerMin = mgPerMin * 1000; // mcg/min
        
        // Calculate dose per kg
        const dosePerKg = totalDosePerMin / weight;
        
        calculatedResults = {
          dose: dosePerKg.toFixed(2),
          totalDose: totalDosePerMin.toFixed(1),
          mgPerHour: mgPerHour.toFixed(2),
          concentrationUsed: `${concentration} mg/${dilution} mL`
        };
      }
      
      setResults(calculatedResults);
    } catch (error) {
      toast.error('Erro no cálculo: ' + error.message);
    }
  }, [inputs, validateInputs, mode]);

  /**
   * Clears all input fields and results
   */
  const clearForm = useCallback(() => {
    setInputs({
      dose: '',
      weight: '',
      concentration: '',
      dilution: '250',
      infusionRate: ''
    });
    setResults(null);
    setErrors({});
  }, []);

  /**
   * Copies calculation results to clipboard
   */
  const copyResults = useCallback(() => {
    if (!results) return;
    
    const modeText = mode === 'mcg-to-ml' ? 'μg/kg/min → mL/h' : 'mL/h → μg/kg/min';
    
    let resultText = `Conversão ${modeText} - Resultados:\n`;
    
    if (mode === 'mcg-to-ml') {
      resultText += `Dose: ${inputs.dose} μg/kg/min\n`;
      resultText += `Peso: ${inputs.weight} kg\n`;
      resultText += `Taxa de infusão: ${results.infusionRate} mL/h\n`;
      resultText += `Dose total: ${results.totalDose} μg/min\n`;
    } else {
      resultText += `Taxa de infusão: ${inputs.infusionRate} mL/h\n`;
      resultText += `Peso: ${inputs.weight} kg\n`;
      resultText += `Dose: ${results.dose} μg/kg/min\n`;
      resultText += `Dose total: ${results.totalDose} μg/min\n`;
    }
    
    resultText += `Concentração: ${results.concentrationUsed}\n`;
    resultText += `\nCalculado em: ${new Date().toLocaleString('pt-BR')}`;
    
    navigator.clipboard.writeText(resultText);
    toast.success('Resultados copiados!');
  }, [results, inputs, mode]);

  /**
   * Sets a common medication concentration
   */
  const setCommonMedication = (medication) => {
    setInputs(prev => ({
      ...prev,
      concentration: medication.concentration,
      dilution: medication.dilution
    }));
  };

  /**
   * Toggles between conversion modes
   */
  const toggleMode = () => {
    setMode(prev => prev === 'mcg-to-ml' ? 'ml-to-mcg' : 'mcg-to-ml');
    setResults(null);
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Conversão μg/kg/min ↔ mL/h
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Dados de Entrada
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleMode}
                  className="flex items-center gap-2"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  {mode === 'mcg-to-ml' ? 'μg/kg/min → mL/h' : 'mL/h → μg/kg/min'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mode-specific inputs */}
              {mode === 'mcg-to-ml' ? (
                <div className="space-y-2">
                  <Label htmlFor="dose">Dose (μg/kg/min)</Label>
                  <Input
                    id="dose"
                    type="number"
                    value={inputs.dose}
                    onChange={(e) => setInputs(prev => ({ ...prev, dose: e.target.value }))}
                    placeholder="Ex: 5"
                    min="0"
                    step="0.1"
                    className={errors.dose ? 'border-red-500' : ''}
                  />
                  {errors.dose && (
                    <p className="text-sm text-red-500">{errors.dose}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="infusionRate">Taxa de Infusão (mL/h)</Label>
                  <Input
                    id="infusionRate"
                    type="number"
                    value={inputs.infusionRate}
                    onChange={(e) => setInputs(prev => ({ ...prev, infusionRate: e.target.value }))}
                    placeholder="Ex: 13.1"
                    min="0"
                    step="0.1"
                    className={errors.infusionRate ? 'border-red-500' : ''}
                  />
                  {errors.infusionRate && (
                    <p className="text-sm text-red-500">{errors.infusionRate}</p>
                  )}
                </div>
              )}
              
              {/* Common inputs */}
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={inputs.weight}
                  onChange={(e) => setInputs(prev => ({ ...prev, weight: e.target.value }))}
                  placeholder="Ex: 70"
                  min="0"
                  step="0.1"
                  className={errors.weight ? 'border-red-500' : ''}
                />
                {errors.weight && (
                  <p className="text-sm text-red-500">{errors.weight}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="concentration">Concentração (mg)</Label>
                  <Input
                    id="concentration"
                    type="number"
                    value={inputs.concentration}
                    onChange={(e) => setInputs(prev => ({ ...prev, concentration: e.target.value }))}
                    placeholder="Ex: 4"
                    min="0"
                    step="0.1"
                    className={errors.concentration ? 'border-red-500' : ''}
                  />
                  {errors.concentration && (
                    <p className="text-sm text-red-500">{errors.concentration}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dilution">Diluição (mL)</Label>
                  <Input
                    id="dilution"
                    type="number"
                    value={inputs.dilution}
                    onChange={(e) => setInputs(prev => ({ ...prev, dilution: e.target.value }))}
                    placeholder="Ex: 250"
                    min="0"
                    step="1"
                    className={errors.dilution ? 'border-red-500' : ''}
                  />
                  {errors.dilution && (
                    <p className="text-sm text-red-500">{errors.dilution}</p>
                  )}
                </div>
              </div>
              
              {/* Common medications */}
              <div className="space-y-2">
                <Label>Medicações Comuns:</Label>
                <div className="flex flex-wrap gap-2">
                  {commonMedications.map((med, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setCommonMedication(med)}
                    >
                      {med.name} ({med.concentration} {med.unit})
                    </Badge>
                  ))}
                </div>
              </div>
              
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
                  {mode === 'mcg-to-ml' ? (
                    <>
                      <div className="p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-200">Taxa de Infusão:</span>
                    <span className="font-bold text-blue-200">{results.infusionRate} mL/h</span>
                  </div>
                </div>
                      
                      <div className="p-3 rounded-lg border">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Dose Total:</span>
                          <span className="font-bold">{results.totalDose} μg/min</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-3 rounded-lg border bg-green-900/20 border-green-700/50">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-200">Dose:</span>
                    <span className="font-bold text-green-200">{results.dose} μg/kg/min</span>
                  </div>
                </div>
                      
                      <div className="p-3 rounded-lg border">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Dose Total:</span>
                          <span className="font-bold">{results.totalDose} μg/min</span>
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="p-3 rounded-lg border">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Concentração:</span>
                      <span className="font-bold">{results.concentrationUsed}</span>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg border">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Equivalente:</span>
                      <span className="font-bold">{results.mgPerHour} mg/h</span>
                    </div>
                  </div>
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
                <h4 className="font-semibold mb-2">Fórmulas:</h4>
                <div className="space-y-2">
                  <code className="bg-muted p-2 rounded block text-sm">
                    μg/kg/min → mL/h: (dose × peso × 60) ÷ (concentração × 1000) × diluição
                  </code>
                  <code className="bg-muted p-2 rounded block text-sm">
                    mL/h → μg/kg/min: (taxa × concentração × 1000) ÷ (diluição × peso × 60)
                  </code>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Interpretação:</h4>
                <p className="text-sm text-muted-foreground">
                  Esta calculadora permite conversão bidirecional entre doses em μg/kg/min e taxas de infusão em mL/h. 
                  Útil para ajuste de drogas vasoativas, sedativos e outros medicamentos de infusão contínua.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Medicações Comuns:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Noradrenalina:</strong> 0,05-2 μg/kg/min (4mg/250mL)</li>
                  <li>• <strong>Adrenalina:</strong> 0,05-1 μg/kg/min (2mg/250mL)</li>
                  <li>• <strong>Dopamina:</strong> 2-20 μg/kg/min (200mg/250mL)</li>
                  <li>• <strong>Dobutamina:</strong> 2,5-15 μg/kg/min (250mg/250mL)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Diretrizes de Terapia Intensiva AMIB 2023</li>
                  <li>• Manual de Medicamentos em UTI - SCCM</li>
                  <li>• Protocolos de Infusão Contínua - Micromedex</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default McgKgMinToMLConverter;
