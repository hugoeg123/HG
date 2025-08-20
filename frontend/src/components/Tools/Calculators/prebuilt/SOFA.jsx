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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Calculator, Activity, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * SOFA - Sequential Organ Failure Assessment
 * 
 * This component calculates the SOFA score for organ dysfunction assessment
 * in critically ill patients, particularly useful in sepsis evaluation.
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
 * <SOFA 
 *   open={showHardcodedCalculator === 'sofa'} 
 *   onOpenChange={() => setShowHardcodedCalculator(null)} 
 * />
 * 
 * @author Health Guardian Team
 * @since Sprint 3
 * @version 1.0.0
 */
function SOFA({ open, onOpenChange }) {
  const [inputs, setInputs] = useState({
    pao2: '',
    fio2: '',
    mechanicalVentilation: 'no',
    platelets: '',
    bilirubin: '',
    meanAP: '',
    vasopressors: 'none',
    dopamine: '',
    dobutamine: '',
    epinephrine: '',
    norepinephrine: '',
    glasgow: '',
    creatinine: '',
    urineOutput: ''
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  /**
   * Validates input parameters for SOFA calculation
   */
  const validateInputs = useCallback(() => {
    const newErrors = {};
    
    if (!inputs.glasgow || parseFloat(inputs.glasgow) < 3 || parseFloat(inputs.glasgow) > 15) {
      newErrors.glasgow = 'Glasgow deve estar entre 3 e 15';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs]);

  /**
   * Calculate SOFA score for each organ system
   */
  const calculate = useCallback(() => {
    if (!validateInputs()) return;
    
    try {
      let totalScore = 0;
      const organScores = {};
      const organDetails = {};
      
      // 1. Respiratory System (PaO2/FiO2 ratio)
      let respiratoryScore = 0;
      let respiratoryDetail = 'Normal';
      
      if (inputs.pao2 && inputs.fio2) {
        const pao2 = parseFloat(inputs.pao2);
        const fio2 = parseFloat(inputs.fio2) / 100;
        const pf_ratio = pao2 / fio2;
        
        if (pf_ratio < 100) {
          respiratoryScore = 4;
          respiratoryDetail = `PaO2/FiO2 < 100 (${pf_ratio.toFixed(0)})`;
        } else if (pf_ratio < 200) {
          respiratoryScore = 3;
          respiratoryDetail = `PaO2/FiO2 < 200 (${pf_ratio.toFixed(0)})`;
        } else if (pf_ratio < 300) {
          respiratoryScore = 2;
          respiratoryDetail = `PaO2/FiO2 < 300 (${pf_ratio.toFixed(0)})`;
        } else if (pf_ratio < 400) {
          respiratoryScore = 1;
          respiratoryDetail = `PaO2/FiO2 < 400 (${pf_ratio.toFixed(0)})`;
        }
        
        // Additional points for mechanical ventilation
        if (inputs.mechanicalVentilation === 'yes' && respiratoryScore >= 2) {
          respiratoryDetail += ' + VM';
        }
      }
      
      organScores.respiratory = respiratoryScore;
      organDetails.respiratory = respiratoryDetail;
      totalScore += respiratoryScore;
      
      // 2. Coagulation (Platelets)
      let coagulationScore = 0;
      let coagulationDetail = 'Normal';
      
      if (inputs.platelets) {
        const platelets = parseFloat(inputs.platelets);
        
        if (platelets < 20) {
          coagulationScore = 4;
          coagulationDetail = `Plaquetas < 20 (${platelets})`;
        } else if (platelets < 50) {
          coagulationScore = 3;
          coagulationDetail = `Plaquetas < 50 (${platelets})`;
        } else if (platelets < 100) {
          coagulationScore = 2;
          coagulationDetail = `Plaquetas < 100 (${platelets})`;
        } else if (platelets < 150) {
          coagulationScore = 1;
          coagulationDetail = `Plaquetas < 150 (${platelets})`;
        }
      }
      
      organScores.coagulation = coagulationScore;
      organDetails.coagulation = coagulationDetail;
      totalScore += coagulationScore;
      
      // 3. Liver (Bilirubin)
      let liverScore = 0;
      let liverDetail = 'Normal';
      
      if (inputs.bilirubin) {
        const bilirubin = parseFloat(inputs.bilirubin);
        
        if (bilirubin >= 12) {
          liverScore = 4;
          liverDetail = `Bilirrubina ≥ 12 (${bilirubin})`;
        } else if (bilirubin >= 6) {
          liverScore = 3;
          liverDetail = `Bilirrubina ≥ 6 (${bilirubin})`;
        } else if (bilirubin >= 2) {
          liverScore = 2;
          liverDetail = `Bilirrubina ≥ 2 (${bilirubin})`;
        } else if (bilirubin >= 1.2) {
          liverScore = 1;
          liverDetail = `Bilirrubina ≥ 1.2 (${bilirubin})`;
        }
      }
      
      organScores.liver = liverScore;
      organDetails.liver = liverDetail;
      totalScore += liverScore;
      
      // 4. Cardiovascular (MAP and Vasopressors)
      let cardiovascularScore = 0;
      let cardiovascularDetail = 'Normal';
      
      if (inputs.vasopressors !== 'none') {
        // Vasopressor doses (μg/kg/min)
        const dopamine = parseFloat(inputs.dopamine) || 0;
        const dobutamine = parseFloat(inputs.dobutamine) || 0;
        const epinephrine = parseFloat(inputs.epinephrine) || 0;
        const norepinephrine = parseFloat(inputs.norepinephrine) || 0;
        
        if (dopamine > 15 || epinephrine > 0.1 || norepinephrine > 0.1) {
          cardiovascularScore = 4;
          cardiovascularDetail = 'Vasopressores altas doses';
        } else if (dopamine > 5 || epinephrine <= 0.1 || norepinephrine <= 0.1) {
          cardiovascularScore = 3;
          cardiovascularDetail = 'Vasopressores baixas doses';
        } else if (dopamine <= 5 || dobutamine > 0) {
          cardiovascularScore = 2;
          cardiovascularDetail = 'Dopamina ≤ 5 ou dobutamina';
        }
      } else if (inputs.meanAP) {
        const map = parseFloat(inputs.meanAP);
        if (map < 70) {
          cardiovascularScore = 1;
          cardiovascularDetail = `PAM < 70 (${map})`;
        }
      }
      
      organScores.cardiovascular = cardiovascularScore;
      organDetails.cardiovascular = cardiovascularDetail;
      totalScore += cardiovascularScore;
      
      // 5. Central Nervous System (Glasgow Coma Scale)
      const glasgow = parseFloat(inputs.glasgow);
      let cnsScore = 0;
      let cnsDetail = 'Normal';
      
      if (glasgow < 6) {
        cnsScore = 4;
        cnsDetail = `Glasgow < 6 (${glasgow})`;
      } else if (glasgow < 10) {
        cnsScore = 3;
        cnsDetail = `Glasgow 6-9 (${glasgow})`;
      } else if (glasgow < 13) {
        cnsScore = 2;
        cnsDetail = `Glasgow 10-12 (${glasgow})`;
      } else if (glasgow < 15) {
        cnsScore = 1;
        cnsDetail = `Glasgow 13-14 (${glasgow})`;
      }
      
      organScores.cns = cnsScore;
      organDetails.cns = cnsDetail;
      totalScore += cnsScore;
      
      // 6. Renal (Creatinine or Urine Output)
      let renalScore = 0;
      let renalDetail = 'Normal';
      
      if (inputs.creatinine) {
        const creatinine = parseFloat(inputs.creatinine);
        
        if (creatinine >= 5) {
          renalScore = 4;
          renalDetail = `Creatinina ≥ 5 (${creatinine})`;
        } else if (creatinine >= 3.5) {
          renalScore = 3;
          renalDetail = `Creatinina ≥ 3.5 (${creatinine})`;
        } else if (creatinine >= 2) {
          renalScore = 2;
          renalDetail = `Creatinina ≥ 2 (${creatinine})`;
        } else if (creatinine >= 1.2) {
          renalScore = 1;
          renalDetail = `Creatinina ≥ 1.2 (${creatinine})`;
        }
      }
      
      if (inputs.urineOutput) {
        const urineOutput = parseFloat(inputs.urineOutput);
        let urineScore = 0;
        
        if (urineOutput < 200) {
          urineScore = 4;
          renalDetail += ` + Diurese < 200mL/dia (${urineOutput})`;
        } else if (urineOutput < 500) {
          urineScore = 3;
          renalDetail += ` + Diurese < 500mL/dia (${urineOutput})`;
        }
        
        renalScore = Math.max(renalScore, urineScore);
      }
      
      organScores.renal = renalScore;
      organDetails.renal = renalDetail;
      totalScore += renalScore;
      
      // Risk stratification
      let riskLevel = '';
      let riskColor = '';
      let mortalityRisk = '';
      
      if (totalScore <= 6) {
        riskLevel = 'Baixo';
        riskColor = 'text-green-200';
        mortalityRisk = '< 10%';
      } else if (totalScore <= 9) {
        riskLevel = 'Moderado';
        riskColor = 'text-amber-200';
        mortalityRisk = '15-20%';
      } else if (totalScore <= 12) {
        riskLevel = 'Alto';
        riskColor = 'text-orange-200';
        mortalityRisk = '40-50%';
      } else {
        riskLevel = 'Muito Alto';
        riskColor = 'text-red-200';
        mortalityRisk = '> 80%';
      }
      
      // Clinical recommendations
      const recommendations = [];
      if (totalScore <= 6) {
        recommendations.push('Disfunção orgânica leve');
        recommendations.push('Monitorização padrão');
        recommendations.push('Reavaliar SOFA diariamente');
      } else if (totalScore <= 9) {
        recommendations.push('Disfunção orgânica moderada');
        recommendations.push('Intensificar monitorização');
        recommendations.push('Considerar medidas de suporte');
        recommendations.push('Avaliar para sepsis se contexto infeccioso');
      } else {
        recommendations.push('Disfunção orgânica grave');
        recommendations.push('Cuidados intensivos máximos');
        recommendations.push('Suporte multiorgânico');
        recommendations.push('Considerar prognóstico e limitação terapêutica');
      }
      
      // Sepsis-specific interpretation
      const sepsisInterpretation = [];
      if (totalScore >= 2) {
        sepsisInterpretation.push('Critério SOFA ≥ 2 para sepsis ATENDIDO');
        sepsisInterpretation.push('Aumento ≥ 2 pontos sugere sepsis');
      } else {
        sepsisInterpretation.push('Critério SOFA < 2 para sepsis');
        sepsisInterpretation.push('Baixa probabilidade de sepsis por SOFA');
      }
      
      const calculatedResults = {
        totalScore,
        maxScore: 24,
        organScores,
        organDetails,
        riskLevel,
        riskColor,
        mortalityRisk,
        recommendations,
        sepsisInterpretation
      };
      
      setResults(calculatedResults);
    } catch (error) {
      toast.error('Erro no cálculo: ' + error.message);
    }
  }, [inputs, validateInputs]);

  /**
   * Clears all input fields and results
   */
  const clearForm = useCallback(() => {
    setInputs({
      pao2: '',
      fio2: '',
      mechanicalVentilation: 'no',
      platelets: '',
      bilirubin: '',
      meanAP: '',
      vasopressors: 'none',
      dopamine: '',
      dobutamine: '',
      epinephrine: '',
      norepinephrine: '',
      glasgow: '',
      creatinine: '',
      urineOutput: ''
    });
    setResults(null);
    setErrors({});
  }, []);

  /**
   * Copies calculation results to clipboard
   */
  const copyResults = useCallback(() => {
    if (!results) return;
    
    let resultText = `SOFA Score - Resultados:\n`;
    resultText += `Score Total: ${results.totalScore}/${results.maxScore}\n`;
    resultText += `Risco: ${results.riskLevel} (Mortalidade: ${results.mortalityRisk})\n\n`;
    
    resultText += `Scores por Órgão:\n`;
    const organNames = {
      respiratory: 'Respiratório',
      coagulation: 'Coagulação',
      liver: 'Hepático',
      cardiovascular: 'Cardiovascular',
      cns: 'Neurológico',
      renal: 'Renal'
    };
    
    Object.entries(results.organScores).forEach(([organ, score]) => {
      resultText += `${organNames[organ]}: ${score}/4 - ${results.organDetails[organ]}\n`;
    });
    
    resultText += `\nInterpretação Sepsis:\n${results.sepsisInterpretation.map(s => `• ${s}`).join('\n')}\n\n`;
    resultText += `Recomendações:\n${results.recommendations.map(r => `• ${r}`).join('\n')}\n\n`;
    resultText += `Calculado em: ${new Date().toLocaleString('pt-BR')}`;
    
    navigator.clipboard.writeText(resultText);
    toast.success('Resultados copiados!');
  }, [results]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            SOFA - Sequential Organ Failure Assessment
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Cards */}
          <div className="lg:col-span-2 space-y-4">
            {/* Respiratory System */}
            <Card>
              <CardHeader>
                <CardTitle>Sistema Respiratório</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pao2">PaO2 (mmHg)</Label>
                  <Input
                    id="pao2"
                    type="number"
                    value={inputs.pao2}
                    onChange={(e) => setInputs(prev => ({ ...prev, pao2: e.target.value }))}
                    placeholder="Ex: 80"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fio2">FiO2 (%)</Label>
                  <Input
                    id="fio2"
                    type="number"
                    min="21"
                    max="100"
                    value={inputs.fio2}
                    onChange={(e) => setInputs(prev => ({ ...prev, fio2: e.target.value }))}
                    placeholder="Ex: 21"
                  />
                </div>
                
                <div className="col-span-2 space-y-2">
                  <Label>Ventilação Mecânica</Label>
                  <Select value={inputs.mechanicalVentilation} onValueChange={(value) => setInputs(prev => ({ ...prev, mechanicalVentilation: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">Não</SelectItem>
                      <SelectItem value="yes">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            {/* Coagulation and Liver */}
            <Card>
              <CardHeader>
                <CardTitle>Coagulação e Fígado</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platelets">Plaquetas (×10³/μL)</Label>
                  <Input
                    id="platelets"
                    type="number"
                    value={inputs.platelets}
                    onChange={(e) => setInputs(prev => ({ ...prev, platelets: e.target.value }))}
                    placeholder="Ex: 150"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bilirubin">Bilirrubina (mg/dL)</Label>
                  <Input
                    id="bilirubin"
                    type="number"
                    step="0.1"
                    value={inputs.bilirubin}
                    onChange={(e) => setInputs(prev => ({ ...prev, bilirubin: e.target.value }))}
                    placeholder="Ex: 1.0"
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Cardiovascular */}
            <Card>
              <CardHeader>
                <CardTitle>Sistema Cardiovascular</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meanAP">PAM (mmHg)</Label>
                  <Input
                    id="meanAP"
                    type="number"
                    value={inputs.meanAP}
                    onChange={(e) => setInputs(prev => ({ ...prev, meanAP: e.target.value }))}
                    placeholder="Ex: 80"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Uso de Vasopressores</Label>
                  <Select value={inputs.vasopressors} onValueChange={(value) => setInputs(prev => ({ ...prev, vasopressors: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      <SelectItem value="yes">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {inputs.vasopressors === 'yes' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dopamine">Dopamina (μg/kg/min)</Label>
                      <Input
                        id="dopamine"
                        type="number"
                        step="0.1"
                        value={inputs.dopamine}
                        onChange={(e) => setInputs(prev => ({ ...prev, dopamine: e.target.value }))}
                        placeholder="Ex: 5"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dobutamine">Dobutamina (μg/kg/min)</Label>
                      <Input
                        id="dobutamine"
                        type="number"
                        step="0.1"
                        value={inputs.dobutamine}
                        onChange={(e) => setInputs(prev => ({ ...prev, dobutamine: e.target.value }))}
                        placeholder="Ex: 2.5"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="epinephrine">Epinefrina (μg/kg/min)</Label>
                      <Input
                        id="epinephrine"
                        type="number"
                        step="0.01"
                        value={inputs.epinephrine}
                        onChange={(e) => setInputs(prev => ({ ...prev, epinephrine: e.target.value }))}
                        placeholder="Ex: 0.1"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="norepinephrine">Norepinefrina (μg/kg/min)</Label>
                      <Input
                        id="norepinephrine"
                        type="number"
                        step="0.01"
                        value={inputs.norepinephrine}
                        onChange={(e) => setInputs(prev => ({ ...prev, norepinephrine: e.target.value }))}
                        placeholder="Ex: 0.1"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* CNS and Renal */}
            <Card>
              <CardHeader>
                <CardTitle>Sistema Nervoso Central e Renal</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="glasgow">Glasgow Coma Scale *</Label>
                  <Input
                    id="glasgow"
                    type="number"
                    min="3"
                    max="15"
                    value={inputs.glasgow}
                    onChange={(e) => setInputs(prev => ({ ...prev, glasgow: e.target.value }))}
                    placeholder="Ex: 15"
                    className={errors.glasgow ? 'border-red-500' : ''}
                  />
                  {errors.glasgow && <p className="text-sm text-red-500">{errors.glasgow}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="creatinine">Creatinina (mg/dL)</Label>
                  <Input
                    id="creatinine"
                    type="number"
                    step="0.1"
                    value={inputs.creatinine}
                    onChange={(e) => setInputs(prev => ({ ...prev, creatinine: e.target.value }))}
                    placeholder="Ex: 1.0"
                  />
                </div>
                
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="urineOutput">Débito Urinário (mL/dia) - Opcional</Label>
                  <Input
                    id="urineOutput"
                    type="number"
                    value={inputs.urineOutput}
                    onChange={(e) => setInputs(prev => ({ ...prev, urineOutput: e.target.value }))}
                    placeholder="Ex: 1500"
                  />
                </div>
                
                <div className="col-span-2 flex gap-2 pt-4">
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
          </div>
          
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
                  {/* Total Score */}
                  <div className="p-4 rounded-lg border bg-blue-900/20 border-blue-700/50">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-200">{results.totalScore}</div>
                      <div className="text-sm text-blue-300">de {results.maxScore} pontos</div>
                    </div>
                  </div>
                  
                  {/* Risk Level */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Risco:</span>
                    <Badge className={results.riskColor}>
                      {results.riskLevel}
                    </Badge>
                  </div>
                  
                  <div className="p-3 rounded-lg border bg-amber-900/30 border-amber-700/50">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-amber-200">
                        {results.mortalityRisk}
                      </div>
                      <div className="text-sm text-amber-300">Mortalidade estimada</div>
                    </div>
                  </div>
                  
                  {/* Organ Scores */}
                  <div className="p-3 rounded-lg border bg-gray-900/20 border-gray-700/50">
                    <h4 className="font-semibold text-gray-200 mb-2">Scores por Órgão:</h4>
                    <div className="space-y-2 text-sm">
                      {Object.entries(results.organScores).map(([organ, score]) => {
                        const organNames = {
                          respiratory: 'Respiratório',
                          coagulation: 'Coagulação',
                          liver: 'Hepático',
                          cardiovascular: 'Cardiovascular',
                          cns: 'Neurológico',
                          renal: 'Renal'
                        };
                        
                        return (
                          <div key={organ} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{organNames[organ]}:</span>
                              <Badge variant={score === 0 ? 'secondary' : score <= 2 ? 'default' : 'destructive'}>
                                {score}/4
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-300 ml-2">
                              {results.organDetails[organ]}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Sepsis Interpretation */}
                  <div className={`p-3 rounded-lg border ${
                    results.totalScore >= 2 
                      ? 'bg-red-900/30 border-red-700/50' 
                      : 'bg-green-900/20 border-green-700/50'
                  }`}>
                    <h4 className={`font-semibold mb-2 ${
                      results.totalScore >= 2 ? 'text-red-200' : 'text-green-200'
                    }`}>
                      Interpretação Sepsis:
                    </h4>
                    <ul className={`text-sm space-y-1 ${
                      results.totalScore >= 2 ? 'text-red-300' : 'text-green-300'
                    }`}>
                      {results.sepsisInterpretation.map((interp, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{interp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Recommendations */}
                  <div className={`p-3 rounded-lg border ${
                    results.totalScore >= 12 
                      ? 'bg-red-900/30 border-red-700/50' 
                      : results.totalScore >= 7
                      ? 'bg-amber-900/30 border-amber-700/50'
                      : 'bg-green-900/20 border-green-700/50'
                  }`}>
                    <h4 className={`font-semibold mb-2 flex items-center gap-2 ${
                      results.totalScore >= 12 
                        ? 'text-red-200' 
                        : results.totalScore >= 7
                        ? 'text-amber-200'
                        : 'text-green-200'
                    }`}>
                      {results.totalScore >= 12 && <AlertTriangle className="h-4 w-4" />}
                      Recomendações:
                    </h4>
                    <ul className={`text-sm space-y-1 ${
                      results.totalScore >= 12 
                        ? 'text-red-300' 
                        : results.totalScore >= 7
                        ? 'text-amber-300'
                        : 'text-green-300'
                    }`}>
                      {results.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Preencha pelo menos o Glasgow e clique em "Calcular"
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Reference Card */}
        <Card>
          <CardHeader>
            <CardTitle>Referências e Interpretação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">SOFA Score:</h4>
                <p className="text-sm text-muted-foreground">
                  O SOFA avalia disfunção de 6 sistemas orgânicos (0-4 pontos cada). 
                  É usado para monitorar evolução de pacientes críticos e definir sepsis 
                  (aumento ≥ 2 pontos do baseline).
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Interpretação:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>0-6 pontos:</strong> Baixo risco (mortalidade &lt; 10%)</li>
                  <li>• <strong>7-9 pontos:</strong> Risco moderado (mortalidade 15-20%)</li>
                  <li>• <strong>10-12 pontos:</strong> Alto risco (mortalidade 40-50%)</li>
                  <li>• <strong>≥13 pontos:</strong> Muito alto risco (mortalidade &gt; 80%)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Critério Sepsis:</h4>
                <p className="text-sm text-muted-foreground">
                  Aumento ≥ 2 pontos do SOFA baseline em paciente com suspeita de infecção 
                  define sepsis (Sepsis-3 Consensus).
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Vincent JL, et al. Intensive Care Med. 1996;22(7):707-10</li>
                  <li>• Singer M, et al. JAMA. 2016;315(8):801-810</li>
                  <li>• Ferreira FL, et al. JAMA. 2001;286(14):1754-8</li>
                  <li>• ILAS - Instituto Latino Americano de Sepse</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default SOFA;