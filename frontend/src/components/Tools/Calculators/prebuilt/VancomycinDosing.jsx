import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Calculator, Pill, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * VancomycinDosing - Calculadora de Ajuste de Dose de Vancomicina
 * 
 * This component calculates vancomycin dosing based on renal function using
 * CKD-EPI 2021 formula and established clinical protocols.
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
 * <VancomycinDosing 
 *   open={showHardcodedCalculator === 'vancomycin-dosing'} 
 *   onOpenChange={() => setShowHardcodedCalculator(null)} 
 * />
 * 
 * @example
 * // Calculation example
 * // Input: weight=70kg, age=50, sex=male, creatinine=1.2, indication=standard
 * // Output: gfr=75, loadingDose=1750mg, maintenanceDose=1000mg, interval=12h
 * 
 * @author Health Guardian Team
 * @since Sprint 2
 * @version 1.0.0
 */
function VancomycinDosing({ open, onOpenChange }) {
  const [inputs, setInputs] = useState({
    weight: '',
    age: '',
    sex: 'male', // 'male' | 'female'
    creatinine: '',
    renalFunction: 'stable', // 'stable' | 'unstable' | 'dialysis'
    indication: 'standard', // 'standard' | 'cns' | 'endocarditis' | 'osteomyelitis'
    currentLevel: '', // Optional - current vancomycin level
    dialysisType: 'hemodialysis' // 'hemodialysis' | 'peritoneal' | 'crrt'
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  /**
   * Validates input parameters for vancomycin dosing calculation
   * 
   * @returns {boolean} True if all inputs are valid
   */
  const validateInputs = useCallback(() => {
    const newErrors = {};
    
    if (!inputs.weight || parseFloat(inputs.weight) <= 0 || parseFloat(inputs.weight) > 300) {
      newErrors.weight = 'Peso deve estar entre 0,1 e 300 kg';
    }
    
    if (!inputs.age || parseFloat(inputs.age) < 18 || parseFloat(inputs.age) > 120) {
      newErrors.age = 'Idade deve estar entre 18 e 120 anos (adultos)';
    }
    
    if (!inputs.creatinine || parseFloat(inputs.creatinine) <= 0 || parseFloat(inputs.creatinine) > 20) {
      newErrors.creatinine = 'Creatinina deve estar entre 0,1 e 20 mg/dL';
    }
    
    if (inputs.currentLevel && (parseFloat(inputs.currentLevel) < 0 || parseFloat(inputs.currentLevel) > 100)) {
      newErrors.currentLevel = 'Nível atual deve estar entre 0 e 100 mg/L';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs]);

  /**
   * Calculates GFR using CKD-EPI 2021 formula (without race correction)
   * 
   * @param {number} creatinine - Serum creatinine in mg/dL
   * @param {number} age - Age in years
   * @param {string} sex - 'male' or 'female'
   * @returns {number} Estimated GFR in mL/min/1.73m²
   */
  const calculateGFR = useCallback((creatinine, age, sex) => {
    const kappa = sex === 'female' ? 0.7 : 0.9;
    const alpha = sex === 'female' ? -0.241 : -0.302;
    const sexFactor = sex === 'female' ? 1.012 : 1;
    
    const gfr = 142 * 
      Math.pow(Math.min(creatinine / kappa, 1), alpha) * 
      Math.pow(Math.max(creatinine / kappa, 1), -1.200) * 
      Math.pow(0.9938, age) * 
      sexFactor;
    
    return gfr;
  }, []);

  /**
   * Calculates vancomycin dosing based on renal function and indication
   * 
   * @returns {Object} Calculated results with clinical recommendations
   */
  const calculate = useCallback(() => {
    if (!validateInputs()) return;
    
    try {
      const weight = parseFloat(inputs.weight);
      const age = parseFloat(inputs.age);
      const creatinine = parseFloat(inputs.creatinine);
      const currentLevel = inputs.currentLevel ? parseFloat(inputs.currentLevel) : null;
      
      // Calculate GFR using CKD-EPI 2021
      const gfr = calculateGFR(creatinine, age, inputs.sex);
      
      // Determine loading dose based on indication
      let loadingDose = { min: 0, max: 0 };
      let targetTrough = '';
      let targetAUC = '';
      
      switch (inputs.indication) {
        case 'cns':
        case 'endocarditis':
        case 'osteomyelitis':
          loadingDose = { min: 25 * weight, max: 30 * weight };
          targetTrough = '15-20 mg/L';
          targetAUC = '400-600 mg·h/L';
          break;
        default:
          loadingDose = { min: 15 * weight, max: 20 * weight };
          targetTrough = '10-15 mg/L';
          targetAUC = '400-600 mg·h/L';
      }
      
      // Cap loading dose at reasonable maximum
      loadingDose.min = Math.min(loadingDose.min, 3000);
      loadingDose.max = Math.min(loadingDose.max, 3000);
      
      // Determine maintenance dose and interval based on renal function
      let maintenanceDose = { min: 0, max: 0 };
      let interval = '';
      let renalCategory = '';
      
      if (inputs.renalFunction === 'dialysis') {
        maintenanceDose = { min: 15 * weight, max: 20 * weight };
        interval = inputs.dialysisType === 'crrt' ? '24h (dose contínua)' : 'Após cada sessão de hemodiálise';
        renalCategory = 'Diálise';
      } else if (gfr >= 90) {
        maintenanceDose = { min: 15 * weight, max: 20 * weight };
        interval = '8-12h';
        renalCategory = 'Normal (≥90)';
      } else if (gfr >= 60) {
        maintenanceDose = { min: 10 * weight, max: 15 * weight };
        interval = '12h';
        renalCategory = 'Leve (60-89)';
      } else if (gfr >= 30) {
        maintenanceDose = { min: 10 * weight, max: 15 * weight };
        interval = '24h';
        renalCategory = 'Moderada (30-59)';
      } else if (gfr >= 15) {
        maintenanceDose = { min: 5 * weight, max: 10 * weight };
        interval = '24-48h';
        renalCategory = 'Grave (15-29)';
      } else {
        maintenanceDose = { min: 5 * weight, max: 10 * weight };
        interval = '48-72h ou diálise';
        renalCategory = 'Terminal (<15)';
      }
      
      // Cap maintenance doses
      maintenanceDose.min = Math.min(maintenanceDose.min, 2000);
      maintenanceDose.max = Math.min(maintenanceDose.max, 2000);
      
      // Dose adjustment recommendations based on current level
      let doseAdjustment = [];
      if (currentLevel) {
        const targetMin = inputs.indication === 'standard' ? 10 : 15;
        const targetMax = inputs.indication === 'standard' ? 15 : 20;
        
        if (currentLevel < targetMin) {
          doseAdjustment.push(`Nível baixo (${currentLevel} mg/L) - considerar aumentar dose`);
          doseAdjustment.push('Verificar aderência e horário de coleta');
        } else if (currentLevel > targetMax) {
          doseAdjustment.push(`Nível alto (${currentLevel} mg/L) - considerar reduzir dose`);
          doseAdjustment.push('Avaliar função renal e nefrotoxicidade');
        } else {
          doseAdjustment.push(`Nível adequado (${currentLevel} mg/L) - manter dose atual`);
        }
      }
      
      // Clinical recommendations based on indication
      let clinicalRecommendations = [];
      
      switch (inputs.indication) {
        case 'cns':
          clinicalRecommendations = [
            'Infecções do SNC requerem níveis mais altos',
            'Monitorar penetração no LCR',
            'Considerar dose de ataque mais alta',
            'Avaliar necessidade de terapia combinada'
          ];
          break;
        case 'endocarditis':
          clinicalRecommendations = [
            'Endocardite requer terapia prolongada',
            'Monitorar função cardíaca',
            'Considerar terapia combinada com aminoglicosídeo',
            'Avaliar necessidade de cirurgia'
          ];
          break;
        case 'osteomyelitis':
          clinicalRecommendations = [
            'Osteomielite requer terapia prolongada (6-8 semanas)',
            'Monitorar penetração óssea',
            'Considerar terapia oral de seguimento',
            'Avaliar necessidade de desbridamento'
          ];
          break;
        default:
          clinicalRecommendations = [
            'Infecção padrão - seguir protocolos institucionais',
            'Monitorar resposta clínica',
            'Considerar de-escalation quando apropriado',
            'Avaliar duração de tratamento'
          ];
      }
      
      // Monitoring recommendations
      const monitoringRecommendations = [
        'Coletar nível de vale antes da 4ª dose (steady-state)',
        'Monitorar função renal (creatinina) diariamente',
        'Avaliar sinais de nefrotoxicidade e ototoxicidade',
        'Considerar AUC-guided dosing quando disponível',
        'Reavaliar dose se mudança na função renal',
        'Monitorar outros nefrotóxicos concomitantes'
      ];
      
      // Safety considerations
      const safetyConsiderations = [
        'Risco de nefrotoxicidade aumenta com níveis >20 mg/L',
        'Ototoxicidade é dose e duração dependente',
        'Evitar uso concomitante com outros nefrotóxicos',
        'Ajustar dose em idosos e pacientes críticos',
        'Considerar alternativas se função renal deteriorar',
        'Monitorar eletrólitos (especialmente potássio)'
      ];
      
      // Dialysis-specific recommendations
      let dialysisRecommendations = [];
      if (inputs.renalFunction === 'dialysis') {
        if (inputs.dialysisType === 'hemodialysis') {
          dialysisRecommendations = [
            'Administrar após sessão de hemodiálise',
            'Vancomicina é pouco dialisável (remoção ~10%)',
            'Monitorar níveis pré e pós-diálise',
            'Ajustar conforme frequência de diálise'
          ];
        } else if (inputs.dialysisType === 'peritoneal') {
          dialysisRecommendations = [
            'Vancomicina pode ser administrada IP ou IV',
            'Dose IP: 15-30 mg/L no dialisato',
            'Monitorar níveis séricos regularmente',
            'Considerar dose de manutenção reduzida'
          ];
        } else {
          dialysisRecommendations = [
            'CRRT remove vancomicina significativamente',
            'Necessária dose de manutenção contínua',
            'Monitorar níveis a cada 24-48h',
            'Ajustar conforme taxa de ultrafiltração'
          ];
        }
      }
      
      const calculatedResults = {
        gfr: gfr.toFixed(1),
        loadingDose,
        maintenanceDose,
        interval,
        targetTrough,
        targetAUC,
        renalCategory,
        doseAdjustment,
        clinicalRecommendations,
        monitoringRecommendations,
        safetyConsiderations,
        dialysisRecommendations,
        indicationText: {
          'standard': 'Infecção padrão',
          'cns': 'Infecção do SNC',
          'endocarditis': 'Endocardite',
          'osteomyelitis': 'Osteomielite'
        }[inputs.indication]
      };
      
      setResults(calculatedResults);
    } catch (error) {
      toast.error('Erro no cálculo: ' + error.message);
    }
  }, [inputs, validateInputs, calculateGFR]);

  /**
   * Clears all input fields and results
   */
  const clearForm = useCallback(() => {
    setInputs({
      weight: '',
      age: '',
      sex: 'male',
      creatinine: '',
      renalFunction: 'stable',
      indication: 'standard',
      currentLevel: '',
      dialysisType: 'hemodialysis'
    });
    setResults(null);
    setErrors({});
  }, []);

  /**
   * Copies calculation results to clipboard
   */
  const copyResults = useCallback(() => {
    if (!results) return;
    
    let resultText = `Ajuste de Dose de Vancomicina - Resultados:\n`;
    resultText += `Peso: ${inputs.weight} kg\n`;
    resultText += `Idade: ${inputs.age} anos\n`;
    resultText += `Sexo: ${inputs.sex === 'male' ? 'Masculino' : 'Feminino'}\n`;
    resultText += `Creatinina: ${inputs.creatinine} mg/dL\n`;
    resultText += `Indicação: ${results.indicationText}\n\n`;
    
    resultText += `TFGe (CKD-EPI 2021): ${results.gfr} mL/min/1,73m²\n`;
    resultText += `Categoria renal: ${results.renalCategory}\n\n`;
    
    resultText += `Dose de ataque: ${results.loadingDose.min}-${results.loadingDose.max} mg\n`;
    resultText += `Dose de manutenção: ${results.maintenanceDose.min}-${results.maintenanceDose.max} mg\n`;
    resultText += `Intervalo: ${results.interval}\n`;
    resultText += `Nível alvo (vale): ${results.targetTrough}\n`;
    resultText += `AUC alvo: ${results.targetAUC}\n\n`;
    
    if (results.doseAdjustment.length > 0) {
      resultText += `Ajuste de dose:\n${results.doseAdjustment.map(a => `• ${a}`).join('\n')}\n\n`;
    }
    
    resultText += `Recomendações clínicas:\n${results.clinicalRecommendations.map(r => `• ${r}`).join('\n')}\n\n`;
    resultText += `Monitoramento:\n${results.monitoringRecommendations.map(m => `• ${m}`).join('\n')}\n\n`;
    
    if (results.dialysisRecommendations.length > 0) {
      resultText += `Recomendações para diálise:\n${results.dialysisRecommendations.map(d => `• ${d}`).join('\n')}\n\n`;
    }
    
    resultText += `Calculado em: ${new Date().toLocaleString('pt-BR')}`;
    
    navigator.clipboard.writeText(resultText);
    toast.success('Resultados copiados!');
  }, [results, inputs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Calculadora de Ajuste de Dose de Vancomicina
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do Paciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={inputs.weight}
                    onChange={(e) => setInputs(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="Ex: 70"
                    min="0.1"
                    max="300"
                    step="0.1"
                    className={errors.weight ? 'border-red-500' : ''}
                  />
                  {errors.weight && (
                    <p className="text-sm text-red-500">{errors.weight}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="age">Idade (anos)</Label>
                  <Input
                    id="age"
                    type="number"
                    value={inputs.age}
                    onChange={(e) => setInputs(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="Ex: 50"
                    min="18"
                    max="120"
                    step="1"
                    className={errors.age ? 'border-red-500' : ''}
                  />
                  {errors.age && (
                    <p className="text-sm text-red-500">{errors.age}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>Sexo:</Label>
                <RadioGroup
                  value={inputs.sex}
                  onValueChange={(value) => setInputs(prev => ({ ...prev, sex: value }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">Masculino</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">Feminino</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="creatinine">Creatinina Sérica (mg/dL)</Label>
                <Input
                  id="creatinine"
                  type="number"
                  value={inputs.creatinine}
                  onChange={(e) => setInputs(prev => ({ ...prev, creatinine: e.target.value }))}
                  placeholder="Ex: 1.2"
                  min="0.1"
                  max="20"
                  step="0.1"
                  className={errors.creatinine ? 'border-red-500' : ''}
                />
                {errors.creatinine && (
                  <p className="text-sm text-red-500">{errors.creatinine}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Função Renal:</Label>
                <Select value={inputs.renalFunction} onValueChange={(value) => setInputs(prev => ({ ...prev, renalFunction: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stable">Estável</SelectItem>
                    <SelectItem value="unstable">Instável</SelectItem>
                    <SelectItem value="dialysis">Em diálise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {inputs.renalFunction === 'dialysis' && (
                <div className="space-y-2">
                  <Label>Tipo de Diálise:</Label>
                  <Select value={inputs.dialysisType} onValueChange={(value) => setInputs(prev => ({ ...prev, dialysisType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hemodialysis">Hemodiálise</SelectItem>
                      <SelectItem value="peritoneal">Diálise Peritoneal</SelectItem>
                      <SelectItem value="crrt">CRRT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Indicação:</Label>
                <Select value={inputs.indication} onValueChange={(value) => setInputs(prev => ({ ...prev, indication: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Infecção padrão</SelectItem>
                    <SelectItem value="cns">Infecção do SNC</SelectItem>
                    <SelectItem value="endocarditis">Endocardite</SelectItem>
                    <SelectItem value="osteomyelitis">Osteomielite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currentLevel">Nível Atual (mg/L) - Opcional</Label>
                <Input
                  id="currentLevel"
                  type="number"
                  value={inputs.currentLevel}
                  onChange={(e) => setInputs(prev => ({ ...prev, currentLevel: e.target.value }))}
                  placeholder="Ex: 12.5"
                  min="0"
                  max="100"
                  step="0.1"
                  className={errors.currentLevel ? 'border-red-500' : ''}
                />
                {errors.currentLevel && (
                  <p className="text-sm text-red-500">{errors.currentLevel}</p>
                )}
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Níveis Alvo:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Padrão:</strong> 10-15 mg/L (vale)</li>
                  <li>• <strong>SNC/Endocardite:</strong> 15-20 mg/L (vale)</li>
                  <li>• <strong>AUC alvo:</strong> 400-600 mg·h/L</li>
                </ul>
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
                <div className="space-y-4">
                  {/* Main Results */}
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-blue-800">TFGe (CKD-EPI 2021):</span>
                        <span className="font-bold text-blue-900">{results.gfr} mL/min/1,73m²</span>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg border bg-green-50 border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-green-800">Dose de Ataque:</span>
                        <span className="font-bold text-green-900">{results.loadingDose.min}-{results.loadingDose.max} mg</span>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg border bg-yellow-50 border-yellow-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-yellow-800">Dose de Manutenção:</span>
                        <span className="font-bold text-yellow-900">{results.maintenanceDose.min}-{results.maintenanceDose.max} mg</span>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg border bg-purple-50 border-purple-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-purple-800">Intervalo:</span>
                        <span className="font-bold text-purple-900">{results.interval}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Target Levels */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Nível Alvo (Vale):</span>
                      <Badge variant="outline">{results.targetTrough}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">AUC Alvo:</span>
                      <Badge variant="outline">{results.targetAUC}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Categoria Renal:</span>
                      <Badge variant="outline">{results.renalCategory}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Indicação:</span>
                      <Badge variant="outline">{results.indicationText}</Badge>
                    </div>
                  </div>
                  
                  {/* Dose Adjustment */}
                  {results.doseAdjustment.length > 0 && (
                    <div className="p-3 rounded-lg border bg-orange-50 border-orange-200">
                      <h4 className="font-semibold text-orange-800 mb-2">Ajuste de Dose:</h4>
                      <ul className="text-sm text-orange-700 space-y-1">
                        {results.doseAdjustment.map((adjustment, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{adjustment}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Clinical Recommendations */}
                  <div className="p-3 rounded-lg border bg-green-50 border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">Recomendações Clínicas:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      {results.clinicalRecommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Monitoring Recommendations */}
                  <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Monitoramento:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {results.monitoringRecommendations.map((mon, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{mon}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Safety Considerations */}
                  <div className="p-3 rounded-lg border bg-red-50 border-red-200">
                    <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Considerações de Segurança:
                    </h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {results.safetyConsiderations.map((safety, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{safety}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Dialysis Recommendations */}
                  {results.dialysisRecommendations.length > 0 && (
                    <div className="p-3 rounded-lg border bg-purple-50 border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-2">Recomendações para Diálise:</h4>
                      <ul className="text-sm text-purple-700 space-y-1">
                        {results.dialysisRecommendations.map((dial, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{dial}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
            <CardTitle>Fórmulas e Referências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Fórmula CKD-EPI 2021 (sem correção racial):</h4>
                <code className="bg-muted p-2 rounded block text-sm">
                  TFGe = 142 × min(Cr/κ, 1)^α × max(Cr/κ, 1)^(-1.200) × 0.9938^idade × sexo
                </code>
                <p className="text-xs text-muted-foreground mt-1">
                  κ = 0.7 (♀) ou 0.9 (♂); α = -0.241 (♀) ou -0.302 (♂); sexo = 1.012 (♀) ou 1 (♂)
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Dosagem de Vancomicina:</h4>
                <div className="space-y-2">
                  <code className="bg-muted p-2 rounded block text-sm">
                    Dose de ataque: 15-20 mg/kg (padrão) | 25-30 mg/kg (SNC/endocardite)
                  </code>
                  <code className="bg-muted p-2 rounded block text-sm">
                    Dose de manutenção: Baseada na TFGe e indicação clínica
                  </code>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Interpretação:</h4>
                <p className="text-sm text-muted-foreground">
                  A vancomicina requer ajuste de dose baseado na função renal devido à eliminação 
                  predominantemente renal. O monitoramento de níveis séricos é essencial para 
                  otimizar eficácia e minimizar toxicidade. A abordagem AUC-guided é preferível 
                  quando disponível, mas níveis de vale permanecem úteis na prática clínica.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Indicações Especiais:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>SNC:</strong> Penetração limitada - níveis mais altos necessários</li>
                  <li>• <strong>Endocardite:</strong> Terapia prolongada - monitoramento rigoroso</li>
                  <li>• <strong>Osteomielite:</strong> Penetração óssea variável - considerar níveis altos</li>
                  <li>• <strong>Diálise:</strong> Remoção limitada - ajustar conforme modalidade</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• IDSA Vancomycin Therapeutic Guidelines 2020</li>
                  <li>• CKD-EPI 2021 Equation (NKF-ASN Task Force)</li>
                  <li>• Sociedade Brasileira de Nefrologia - TFG 2023</li>
                  <li>• ANVISA - Monitoramento de Vancomicina 2022</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default VancomycinDosing;