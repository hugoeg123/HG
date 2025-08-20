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
import { Copy, Calculator, Heart, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * APACHE2 - Acute Physiology and Chronic Health Evaluation II
 * 
 * This component calculates the APACHE II score for ICU mortality prediction
 * and severity assessment in critically ill patients.
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
 * <APACHE2 
 *   open={showHardcodedCalculator === 'apache2'} 
 *   onOpenChange={() => setShowHardcodedCalculator(null)} 
 * />
 * 
 * @author Health Guardian Team
 * @since Sprint 3
 * @version 1.0.0
 */
function APACHE2({ open, onOpenChange }) {
  const [inputs, setInputs] = useState({
    age: '',
    temperature: '',
    meanAP: '',
    heartRate: '',
    respiratoryRate: '',
    pao2: '',
    fio2: '',
    arterialPH: '',
    sodium: '',
    potassium: '',
    creatinine: '',
    hematocrit: '',
    wbc: '',
    glasgow: '',
    chronicHealth: 'none',
    admissionType: 'medical'
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  /**
   * Validates input parameters for APACHE II calculation
   */
  const validateInputs = useCallback(() => {
    const newErrors = {};
    
    if (!inputs.age || parseFloat(inputs.age) < 0 || parseFloat(inputs.age) > 120) {
      newErrors.age = 'Idade deve estar entre 0 e 120 anos';
    }
    
    if (!inputs.temperature || parseFloat(inputs.temperature) < 30 || parseFloat(inputs.temperature) > 45) {
      newErrors.temperature = 'Temperatura deve estar entre 30 e 45°C';
    }
    
    if (!inputs.meanAP || parseFloat(inputs.meanAP) < 30 || parseFloat(inputs.meanAP) > 200) {
      newErrors.meanAP = 'PAM deve estar entre 30 e 200 mmHg';
    }
    
    if (!inputs.heartRate || parseFloat(inputs.heartRate) < 20 || parseFloat(inputs.heartRate) > 250) {
      newErrors.heartRate = 'FC deve estar entre 20 e 250 bpm';
    }
    
    if (!inputs.respiratoryRate || parseFloat(inputs.respiratoryRate) < 5 || parseFloat(inputs.respiratoryRate) > 60) {
      newErrors.respiratoryRate = 'FR deve estar entre 5 e 60 irpm';
    }
    
    if (!inputs.glasgow || parseFloat(inputs.glasgow) < 3 || parseFloat(inputs.glasgow) > 15) {
      newErrors.glasgow = 'Glasgow deve estar entre 3 e 15';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs]);

  /**
   * Calculate APACHE II score based on physiological parameters
   */
  const calculate = useCallback(() => {
    if (!validateInputs()) return;
    
    try {
      let totalScore = 0;
      const scoreBreakdown = {};
      
      // Age points
      const age = parseFloat(inputs.age);
      let agePoints = 0;
      if (age >= 75) agePoints = 6;
      else if (age >= 65) agePoints = 5;
      else if (age >= 55) agePoints = 3;
      else if (age >= 45) agePoints = 2;
      scoreBreakdown.age = agePoints;
      totalScore += agePoints;
      
      // Temperature points
      const temp = parseFloat(inputs.temperature);
      let tempPoints = 0;
      if (temp >= 41 || temp <= 29.9) tempPoints = 4;
      else if (temp >= 39 || temp <= 31.9) tempPoints = 3;
      else if (temp >= 38.5 || temp <= 33.9) tempPoints = 1;
      else if (temp <= 35.9) tempPoints = 2;
      scoreBreakdown.temperature = tempPoints;
      totalScore += tempPoints;
      
      // Mean Arterial Pressure points
      const map = parseFloat(inputs.meanAP);
      let mapPoints = 0;
      if (map >= 160 || map <= 49) mapPoints = 4;
      else if (map >= 130 || map <= 69) mapPoints = 2;
      else if (map >= 110) mapPoints = 2;
      scoreBreakdown.meanAP = mapPoints;
      totalScore += mapPoints;
      
      // Heart Rate points
      const hr = parseFloat(inputs.heartRate);
      let hrPoints = 0;
      if (hr >= 180 || hr <= 39) hrPoints = 4;
      else if (hr >= 140 || hr <= 54) hrPoints = 3;
      else if (hr >= 110 || hr <= 69) hrPoints = 2;
      scoreBreakdown.heartRate = hrPoints;
      totalScore += hrPoints;
      
      // Respiratory Rate points
      const rr = parseFloat(inputs.respiratoryRate);
      let rrPoints = 0;
      if (rr >= 50 || rr <= 5) rrPoints = 4;
      else if (rr >= 35) rrPoints = 3;
      else if (rr >= 25 || rr <= 9) rrPoints = 1;
      else if (rr <= 11) rrPoints = 2;
      scoreBreakdown.respiratoryRate = rrPoints;
      totalScore += rrPoints;
      
      // Oxygenation (A-aDO2 or PaO2)
      let oxyPoints = 0;
      if (inputs.pao2 && inputs.fio2) {
        const pao2 = parseFloat(inputs.pao2);
        const fio2 = parseFloat(inputs.fio2) / 100;
        
        if (fio2 >= 0.5) {
          // Use A-aDO2 (simplified calculation)
          const expectedPaO2 = (fio2 * 713) - (40 / 0.8); // Simplified alveolar gas equation
          const aaDO2 = expectedPaO2 - pao2;
          if (aaDO2 >= 500) oxyPoints = 4;
          else if (aaDO2 >= 350) oxyPoints = 3;
          else if (aaDO2 >= 200) oxyPoints = 2;
        } else {
          // Use PaO2
          if (pao2 < 55) oxyPoints = 4;
          else if (pao2 < 61) oxyPoints = 3;
          else if (pao2 < 71) oxyPoints = 1;
        }
      }
      scoreBreakdown.oxygenation = oxyPoints;
      totalScore += oxyPoints;
      
      // Arterial pH points
      let phPoints = 0;
      if (inputs.arterialPH) {
        const ph = parseFloat(inputs.arterialPH);
        if (ph >= 7.7 || ph < 7.15) phPoints = 4;
        else if (ph >= 7.6 || ph < 7.25) phPoints = 3;
        else if (ph >= 7.5 || ph < 7.33) phPoints = 1;
        else if (ph < 7.35) phPoints = 2;
      }
      scoreBreakdown.arterialPH = phPoints;
      totalScore += phPoints;
      
      // Sodium points
      let naPoints = 0;
      if (inputs.sodium) {
        const na = parseFloat(inputs.sodium);
        if (na >= 180 || na <= 110) naPoints = 4;
        else if (na >= 160 || na <= 119) naPoints = 3;
        else if (na >= 155 || na <= 129) naPoints = 2;
        else if (na <= 149) naPoints = 1;
      }
      scoreBreakdown.sodium = naPoints;
      totalScore += naPoints;
      
      // Potassium points
      let kPoints = 0;
      if (inputs.potassium) {
        const k = parseFloat(inputs.potassium);
        if (k >= 7 || k < 2.5) kPoints = 4;
        else if (k >= 6 || k < 3) kPoints = 2;
        else if (k >= 5.5 || k < 3.5) kPoints = 1;
      }
      scoreBreakdown.potassium = kPoints;
      totalScore += kPoints;
      
      // Creatinine points (adjusted for acute renal failure)
      let crPoints = 0;
      if (inputs.creatinine) {
        const cr = parseFloat(inputs.creatinine);
        if (cr >= 3.5) crPoints = 4;
        else if (cr >= 2) crPoints = 3;
        else if (cr >= 1.5) crPoints = 2;
        else if (cr < 0.6) crPoints = 2;
      }
      scoreBreakdown.creatinine = crPoints;
      totalScore += crPoints;
      
      // Hematocrit points
      let hctPoints = 0;
      if (inputs.hematocrit) {
        const hct = parseFloat(inputs.hematocrit);
        if (hct >= 60 || hct < 20) hctPoints = 4;
        else if (hct >= 50 || hct < 30) hctPoints = 2;
        else if (hct >= 46 || hct < 46) hctPoints = 1;
      }
      scoreBreakdown.hematocrit = hctPoints;
      totalScore += hctPoints;
      
      // WBC points
      let wbcPoints = 0;
      if (inputs.wbc) {
        const wbc = parseFloat(inputs.wbc);
        if (wbc >= 40 || wbc < 1) wbcPoints = 4;
        else if (wbc >= 20 || wbc < 3) wbcPoints = 2;
        else if (wbc >= 15) wbcPoints = 1;
      }
      scoreBreakdown.wbc = wbcPoints;
      totalScore += wbcPoints;
      
      // Glasgow Coma Scale points (15 - actual GCS)
      const gcs = parseFloat(inputs.glasgow);
      const gcsPoints = 15 - gcs;
      scoreBreakdown.glasgow = gcsPoints;
      totalScore += gcsPoints;
      
      // Chronic Health points
      let chronicPoints = 0;
      if (inputs.chronicHealth === 'nonoperative' || inputs.chronicHealth === 'emergency') {
        chronicPoints = 5;
      } else if (inputs.chronicHealth === 'elective') {
        chronicPoints = 2;
      }
      scoreBreakdown.chronicHealth = chronicPoints;
      totalScore += chronicPoints;
      
      // Mortality prediction (approximate)
      let mortalityRisk = '';
      let mortalityPercent = 0;
      let riskColor = '';
      
      if (totalScore <= 4) {
        mortalityRisk = 'Muito baixo';
        mortalityPercent = 4;
        riskColor = 'text-green-200';
      } else if (totalScore <= 9) {
        mortalityRisk = 'Baixo';
        mortalityPercent = 8;
        riskColor = 'text-green-200';
      } else if (totalScore <= 14) {
        mortalityRisk = 'Moderado';
        mortalityPercent = 15;
        riskColor = 'text-amber-200';
      } else if (totalScore <= 19) {
        mortalityRisk = 'Alto';
        mortalityPercent = 25;
        riskColor = 'text-orange-200';
      } else if (totalScore <= 24) {
        mortalityRisk = 'Muito alto';
        mortalityPercent = 40;
        riskColor = 'text-red-200';
      } else if (totalScore <= 29) {
        mortalityRisk = 'Extremamente alto';
        mortalityPercent = 55;
        riskColor = 'text-red-200';
      } else {
        mortalityRisk = 'Crítico';
        mortalityPercent = 75;
        riskColor = 'text-red-200';
      }
      
      // Clinical recommendations
      const recommendations = [];
      if (totalScore <= 9) {
        recommendations.push('Paciente de baixo risco');
        recommendations.push('Monitorização padrão de UTI');
        recommendations.push('Considerar step-down quando estável');
      } else if (totalScore <= 19) {
        recommendations.push('Paciente de risco moderado a alto');
        recommendations.push('Monitorização intensiva necessária');
        recommendations.push('Reavaliar diariamente');
        recommendations.push('Considerar medidas de suporte avançado');
      } else {
        recommendations.push('Paciente de altíssimo risco');
        recommendations.push('Cuidados intensivos máximos');
        recommendations.push('Considerar limitação terapêutica se apropriado');
        recommendations.push('Discussão com família sobre prognóstico');
      }
      
      const calculatedResults = {
        totalScore,
        maxScore: 71,
        scoreBreakdown,
        mortalityRisk,
        mortalityPercent,
        riskColor,
        recommendations
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
      age: '',
      temperature: '',
      meanAP: '',
      heartRate: '',
      respiratoryRate: '',
      pao2: '',
      fio2: '',
      arterialPH: '',
      sodium: '',
      potassium: '',
      creatinine: '',
      hematocrit: '',
      wbc: '',
      glasgow: '',
      chronicHealth: 'none',
      admissionType: 'medical'
    });
    setResults(null);
    setErrors({});
  }, []);

  /**
   * Copies calculation results to clipboard
   */
  const copyResults = useCallback(() => {
    if (!results) return;
    
    let resultText = `APACHE II - Resultados:\n`;
    resultText += `Score Total: ${results.totalScore}/${results.maxScore}\n`;
    resultText += `Risco de Mortalidade: ${results.mortalityRisk} (~${results.mortalityPercent}%)\n\n`;
    
    resultText += `Detalhamento do Score:\n`;
    Object.entries(results.scoreBreakdown).forEach(([key, value]) => {
      const labels = {
        age: 'Idade',
        temperature: 'Temperatura',
        meanAP: 'PAM',
        heartRate: 'FC',
        respiratoryRate: 'FR',
        oxygenation: 'Oxigenação',
        arterialPH: 'pH arterial',
        sodium: 'Sódio',
        potassium: 'Potássio',
        creatinine: 'Creatinina',
        hematocrit: 'Hematócrito',
        wbc: 'Leucócitos',
        glasgow: 'Glasgow',
        chronicHealth: 'Saúde crônica'
      };
      resultText += `${labels[key] || key}: ${value} pontos\n`;
    });
    
    resultText += `\nRecomendações:\n${results.recommendations.map(r => `• ${r}`).join('\n')}\n\n`;
    resultText += `Calculado em: ${new Date().toLocaleString('pt-BR')}`;
    
    navigator.clipboard.writeText(resultText);
    toast.success('Resultados copiados!');
  }, [results]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            APACHE II - Acute Physiology and Chronic Health Evaluation
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Cards */}
          <div className="lg:col-span-2 space-y-4">
            {/* Demographics */}
            <Card>
              <CardHeader>
                <CardTitle>Demografia e Sinais Vitais</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Idade (anos)</Label>
                  <Input
                    id="age"
                    type="number"
                    value={inputs.age}
                    onChange={(e) => setInputs(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="Ex: 65"
                    className={errors.age ? 'border-red-500' : ''}
                  />
                  {errors.age && <p className="text-sm text-red-500">{errors.age}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperatura (°C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={inputs.temperature}
                    onChange={(e) => setInputs(prev => ({ ...prev, temperature: e.target.value }))}
                    placeholder="Ex: 37.5"
                    className={errors.temperature ? 'border-red-500' : ''}
                  />
                  {errors.temperature && <p className="text-sm text-red-500">{errors.temperature}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="meanAP">PAM (mmHg)</Label>
                  <Input
                    id="meanAP"
                    type="number"
                    value={inputs.meanAP}
                    onChange={(e) => setInputs(prev => ({ ...prev, meanAP: e.target.value }))}
                    placeholder="Ex: 80"
                    className={errors.meanAP ? 'border-red-500' : ''}
                  />
                  {errors.meanAP && <p className="text-sm text-red-500">{errors.meanAP}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="heartRate">FC (bpm)</Label>
                  <Input
                    id="heartRate"
                    type="number"
                    value={inputs.heartRate}
                    onChange={(e) => setInputs(prev => ({ ...prev, heartRate: e.target.value }))}
                    placeholder="Ex: 90"
                    className={errors.heartRate ? 'border-red-500' : ''}
                  />
                  {errors.heartRate && <p className="text-sm text-red-500">{errors.heartRate}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="respiratoryRate">FR (irpm)</Label>
                  <Input
                    id="respiratoryRate"
                    type="number"
                    value={inputs.respiratoryRate}
                    onChange={(e) => setInputs(prev => ({ ...prev, respiratoryRate: e.target.value }))}
                    placeholder="Ex: 20"
                    className={errors.respiratoryRate ? 'border-red-500' : ''}
                  />
                  {errors.respiratoryRate && <p className="text-sm text-red-500">{errors.respiratoryRate}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="glasgow">Glasgow Coma Scale</Label>
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
              </CardContent>
            </Card>
            
            {/* Laboratory Values */}
            <Card>
              <CardHeader>
                <CardTitle>Valores Laboratoriais</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pao2">PaO2 (mmHg) - Opcional</Label>
                  <Input
                    id="pao2"
                    type="number"
                    value={inputs.pao2}
                    onChange={(e) => setInputs(prev => ({ ...prev, pao2: e.target.value }))}
                    placeholder="Ex: 80"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fio2">FiO2 (%) - Opcional</Label>
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
                
                <div className="space-y-2">
                  <Label htmlFor="arterialPH">pH Arterial - Opcional</Label>
                  <Input
                    id="arterialPH"
                    type="number"
                    step="0.01"
                    value={inputs.arterialPH}
                    onChange={(e) => setInputs(prev => ({ ...prev, arterialPH: e.target.value }))}
                    placeholder="Ex: 7.40"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sodium">Sódio (mEq/L) - Opcional</Label>
                  <Input
                    id="sodium"
                    type="number"
                    value={inputs.sodium}
                    onChange={(e) => setInputs(prev => ({ ...prev, sodium: e.target.value }))}
                    placeholder="Ex: 140"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="potassium">Potássio (mEq/L) - Opcional</Label>
                  <Input
                    id="potassium"
                    type="number"
                    step="0.1"
                    value={inputs.potassium}
                    onChange={(e) => setInputs(prev => ({ ...prev, potassium: e.target.value }))}
                    placeholder="Ex: 4.0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="creatinine">Creatinina (mg/dL) - Opcional</Label>
                  <Input
                    id="creatinine"
                    type="number"
                    step="0.1"
                    value={inputs.creatinine}
                    onChange={(e) => setInputs(prev => ({ ...prev, creatinine: e.target.value }))}
                    placeholder="Ex: 1.0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hematocrit">Hematócrito (%) - Opcional</Label>
                  <Input
                    id="hematocrit"
                    type="number"
                    value={inputs.hematocrit}
                    onChange={(e) => setInputs(prev => ({ ...prev, hematocrit: e.target.value }))}
                    placeholder="Ex: 40"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="wbc">Leucócitos (×10³/μL) - Opcional</Label>
                  <Input
                    id="wbc"
                    type="number"
                    step="0.1"
                    value={inputs.wbc}
                    onChange={(e) => setInputs(prev => ({ ...prev, wbc: e.target.value }))}
                    placeholder="Ex: 8.0"
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Chronic Health */}
            <Card>
              <CardHeader>
                <CardTitle>Saúde Crônica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Condição de Saúde Crônica</Label>
                  <Select value={inputs.chronicHealth} onValueChange={(value) => setInputs(prev => ({ ...prev, chronicHealth: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      <SelectItem value="nonoperative">Não-operatório com doença crônica</SelectItem>
                      <SelectItem value="emergency">Cirurgia de emergência com doença crônica</SelectItem>
                      <SelectItem value="elective">Cirurgia eletiva com doença crônica</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Doença crônica: cirrose, ICC classe IV, DPOC grave, diálise, imunossupressão
                  </p>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={calculate} className="flex-1">
                    <Calculator className="h-4 w-4 mr-2" />
                    Calcular
                  </Button>
                  <Button onClick={clearForm} variant="outline">
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
                  {/* Score Display */}
                  <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-700/50">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-200">{results.totalScore}</div>
                      <div className="text-sm text-blue-300">de {results.maxScore} pontos</div>
                    </div>
                  </div>
                  
                  {/* Mortality Risk */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Risco de Mortalidade:</span>
                    <Badge className={`bg-blue-900/20 text-blue-200 border-blue-400 ${results.riskColor}`}>
                      {results.mortalityRisk}
                    </Badge>
                  </div>
                  
                  <div className="bg-amber-900/20 p-4 rounded-lg border border-amber-700/50">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-amber-200">
                        ~{results.mortalityPercent}%
                      </div>
                      <div className="text-sm text-amber-300">Mortalidade hospitalar estimada</div>
                    </div>
                  </div>
                  
                  {/* Score Breakdown */}
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600/50">
                    <h4 className="font-semibold mb-2 text-gray-200">Detalhamento do Score:</h4>
                    <div className="space-y-1 text-sm">
                      {Object.entries(results.scoreBreakdown).map(([key, value]) => {
                        const labels = {
                          age: 'Idade',
                          temperature: 'Temperatura',
                          meanAP: 'PAM',
                          heartRate: 'FC',
                          respiratoryRate: 'FR',
                          oxygenation: 'Oxigenação',
                          arterialPH: 'pH arterial',
                          sodium: 'Sódio',
                          potassium: 'Potássio',
                          creatinine: 'Creatinina',
                          hematocrit: 'Hematócrito',
                          wbc: 'Leucócitos',
                          glasgow: 'Glasgow',
                          chronicHealth: 'Saúde crônica'
                        };
                        return (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-300">{labels[key] || key}:</span>
                            <span className="font-medium text-gray-200">{value} pts</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Recommendations */}
                  <div className={`p-4 rounded-lg border ${
                    results.totalScore >= 20 
                      ? 'bg-red-900/30 border-red-700/50' 
                      : results.totalScore >= 10
                      ? 'bg-amber-900/20 border-amber-700/50'
                      : 'bg-green-900/20 border-green-700/50'
                  }`}>
                    <h4 className={`font-semibold mb-2 flex items-center gap-2 ${
                      results.totalScore >= 20 
                        ? 'text-red-200' 
                        : results.totalScore >= 10
                        ? 'text-amber-200'
                        : 'text-green-200'
                    }`}>
                      {results.totalScore >= 20 && <AlertTriangle className="h-4 w-4" />}
                      Recomendações:
                    </h4>
                    <ul className={`text-sm space-y-1 ${
                      results.totalScore >= 20 
                        ? 'text-red-300' 
                        : results.totalScore >= 10
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
                  Preencha os campos obrigatórios e clique em "Calcular"
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
                <h4 className="font-semibold mb-2">APACHE II:</h4>
                <p className="text-sm text-muted-foreground">
                  O APACHE II é um sistema de classificação de gravidade amplamente utilizado 
                  em UTI para predizer mortalidade hospitalar. Scores mais altos indicam maior 
                  gravidade e risco de morte.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Interpretação:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>0-4 pontos:</strong> Mortalidade muito baixa (~4%)</li>
                  <li>• <strong>5-9 pontos:</strong> Mortalidade baixa (~8%)</li>
                  <li>• <strong>10-14 pontos:</strong> Mortalidade moderada (~15%)</li>
                  <li>• <strong>15-19 pontos:</strong> Mortalidade alta (~25%)</li>
                  <li>• <strong>20-24 pontos:</strong> Mortalidade muito alta (~40%)</li>
                  <li>• <strong>≥25 pontos:</strong> Mortalidade extremamente alta (≥55%)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Limitações:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Desenvolvido em população específica (anos 80)</li>
                  <li>• Não considera comorbidades específicas</li>
                  <li>• Deve ser usado como ferramenta auxiliar</li>
                  <li>• Não substitui julgamento clínico</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Knaus WA, et al. Crit Care Med. 1985;13(10):818-29</li>
                  <li>• Wagner DP, et al. Crit Care Med. 1984;12(11):975-7</li>
                  <li>• AMIB - Associação de Medicina Intensiva Brasileira</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default APACHE2;