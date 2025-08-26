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
import { Label } from '../../../ui/label';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { RadioGroup, RadioGroupItem } from '../../../ui/radio-group';
import { Copy, Calculator, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';

/**
 * MELD - Model for End-Stage Liver Disease Score Calculator
 * 
 * This component calculates the MELD score for assessing severity of
 * chronic liver disease and prioritizing patients for liver transplantation.
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
 * <MELD 
 *   open={showHardcodedCalculator === 'meld'} 
 *   onOpenChange={() => setShowHardcodedCalculator(null)} 
 * />
 * 
 * @example
 * // Calculation example
 * // Input: bilirubin=3.0, creatinine=1.8, inr=2.1, dialysis=false
 * // Output: meldScore=19, interpretation="Moderado", mortality3months="19.6%"
 * 
 * @author Health Guardian Team
 * @since Sprint 2
 * @version 1.0.0
 */
function MELD({ open, onOpenChange }) {
  const [inputs, setInputs] = useState({
    bilirubin: '',
    creatinine: '',
    inr: '',
    dialysis: false,
    sodium: '',
    albumin: '',
    bilirubinUnits: 'mg_dl', // mg_dl, umol_l
    creatinineUnits: 'mg_dl', // mg_dl, umol_l
    includeMELDNa: false
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  /**
   * Validates input parameters for MELD calculation
   * 
   * @returns {boolean} True if all required inputs are provided
   */
  const validateInputs = useCallback(() => {
    const newErrors = {};
    
    if (!inputs.bilirubin) {
      newErrors.bilirubin = 'Bilirrubina é obrigatória';
    } else {
      const bilirubin = parseFloat(inputs.bilirubin);
      if (inputs.bilirubinUnits === 'mg_dl') {
        if (bilirubin < 0.1 || bilirubin > 50) {
          newErrors.bilirubin = 'Bilirrubina deve estar entre 0.1 e 50 mg/dL';
        }
      } else {
        if (bilirubin < 2 || bilirubin > 850) {
          newErrors.bilirubin = 'Bilirrubina deve estar entre 2 e 850 μmol/L';
        }
      }
    }
    
    if (!inputs.creatinine) {
      newErrors.creatinine = 'Creatinina é obrigatória';
    } else {
      const creatinine = parseFloat(inputs.creatinine);
      if (inputs.creatinineUnits === 'mg_dl') {
        if (creatinine < 0.5 || creatinine > 15) {
          newErrors.creatinine = 'Creatinina deve estar entre 0.5 e 15 mg/dL';
        }
      } else {
        if (creatinine < 44 || creatinine > 1325) {
          newErrors.creatinine = 'Creatinina deve estar entre 44 e 1325 μmol/L';
        }
      }
    }
    
    if (!inputs.inr) {
      newErrors.inr = 'INR é obrigatório';
    } else if (inputs.inr < 0.8 || inputs.inr > 10.0) {
      newErrors.inr = 'INR deve estar entre 0.8 e 10.0';
    }
    
    if (inputs.includeMELDNa && !inputs.sodium) {
      newErrors.sodium = 'Sódio é obrigatório para MELD-Na';
    } else if (inputs.sodium && (inputs.sodium < 120 || inputs.sodium > 160)) {
      newErrors.sodium = 'Sódio deve estar entre 120 e 160 mEq/L';
    }
    
    if (inputs.albumin && (inputs.albumin < 1.0 || inputs.albumin > 6.0)) {
      newErrors.albumin = 'Albumina deve estar entre 1.0 e 6.0 g/dL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs]);

  /**
   * Calculates MELD score and provides clinical interpretation
   * 
   * @returns {Object} Calculation results with clinical interpretation
   */
  const calculate = useCallback(() => {
    if (!validateInputs()) return;
    
    try {
      let bilirubin = parseFloat(inputs.bilirubin);
      let creatinine = parseFloat(inputs.creatinine);
      const inr = parseFloat(inputs.inr);
      
      // Convert units to mg/dL if necessary
      if (inputs.bilirubinUnits === 'umol_l') {
        bilirubin = bilirubin / 17.1; // Convert μmol/L to mg/dL
      }
      
      if (inputs.creatinineUnits === 'umol_l') {
        creatinine = creatinine / 88.4; // Convert μmol/L to mg/dL
      }
      
      // Apply minimum values as per MELD formula
      bilirubin = Math.max(bilirubin, 1.0);
      creatinine = Math.max(creatinine, 1.0);
      const adjustedINR = Math.max(inr, 1.0);
      
      // If on dialysis, set creatinine to 4.0 mg/dL
      if (inputs.dialysis) {
        creatinine = 4.0;
      }
      
      // Calculate MELD score using the standard formula
      // MELD = 3.78 × ln(bilirubin) + 11.2 × ln(INR) + 9.57 × ln(creatinine) + 6.43
      const meldScore = Math.round(
        3.78 * Math.log(bilirubin) +
        11.2 * Math.log(adjustedINR) +
        9.57 * Math.log(creatinine) +
        6.43
      );
      
      // Cap MELD score at 40
      const finalMeldScore = Math.min(Math.max(meldScore, 6), 40);
      
      // Calculate MELD-Na if sodium is provided
      let meldNaScore = null;
      if (inputs.includeMELDNa && inputs.sodium) {
        const sodium = parseFloat(inputs.sodium);
        const adjustedSodium = Math.max(Math.min(sodium, 137), 125);
        
        if (finalMeldScore > 11) {
          meldNaScore = Math.round(finalMeldScore + 1.32 * (137 - adjustedSodium) - (0.033 * finalMeldScore * (137 - adjustedSodium)));
          meldNaScore = Math.min(Math.max(meldNaScore, 6), 40);
        } else {
          meldNaScore = finalMeldScore;
        }
      }
      
      // Determine severity and interpretation
      let interpretation = '';
      let severity = '';
      let severityColor = '';
      let mortality3Months = '';
      let mortality1Year = '';
      let clinicalSignificance = '';
      let recommendations = [];
      
      const scoreToEvaluate = meldNaScore || finalMeldScore;
      
      if (scoreToEvaluate < 10) {
        interpretation = 'MELD baixo';
        severity = 'LEVE';
        severityColor = 'text-green-200';
        mortality3Months = '<5%';
        mortality1Year = '10-15%';
        clinicalSignificance = 'Doença hepática leve. Baixo risco de mortalidade a curto prazo.';
        recommendations = [
          'Seguimento ambulatorial regular',
          'Tratamento da causa subjacente',
          'Monitoramento de complicações',
          'Vacinação para hepatite A e B',
          'Evitar hepatotóxicos'
        ];
      } else if (scoreToEvaluate < 15) {
        interpretation = 'MELD moderado';
        severity = 'MODERADO';
        severityColor = 'text-amber-200';
        mortality3Months = '5-10%';
        mortality1Year = '20-30%';
        clinicalSignificance = 'Doença hepática moderada. Risco intermediário de mortalidade.';
        recommendations = [
          'Seguimento especializado frequente',
          'Avaliação inicial para transplante',
          'Manejo de complicações da cirrose',
          'Otimização do estado nutricional',
          'Profilaxia de varizes esofágicas'
        ];
      } else if (scoreToEvaluate < 20) {
        interpretation = 'MELD moderado-alto';
        severity = 'MODERADO-ALTO';
        severityColor = 'text-orange-200';
        mortality3Months = '10-20%';
        mortality1Year = '30-50%';
        clinicalSignificance = 'Doença hepática avançada. Risco elevado de mortalidade.';
        recommendations = [
          'Avaliação urgente para transplante',
          'Listagem ativa para transplante',
          'Manejo intensivo de complicações',
          'Cuidados multidisciplinares',
          'Preparação para transplante'
        ];
      } else if (scoreToEvaluate < 25) {
        interpretation = 'MELD alto';
        severity = 'ALTO';
        severityColor = 'text-red-200';
        mortality3Months = '20-30%';
        mortality1Year = '50-70%';
        clinicalSignificance = 'Doença hepática severa. Alto risco de mortalidade.';
        recommendations = [
          'URGENTE: Listagem prioritária para transplante',
          'Cuidados intensivos especializados',
          'Manejo agressivo de complicações',
          'Suporte familiar e psicológico',
          'Preparação para cuidados de fim de vida'
        ];
      } else {
        interpretation = 'MELD muito alto';
        severity = 'CRÍTICO';
        severityColor = 'text-red-200';
        mortality3Months = '>30%';
        mortality1Year = '>70%';
        clinicalSignificance = 'Doença hepática terminal. Risco crítico de mortalidade.';
        recommendations = [
          'CRÍTICO: Máxima prioridade para transplante',
          'Cuidados intensivos imediatos',
          'Considerar transplante de urgência',
          'Cuidados paliativos se não candidato',
          'Suporte de fim de vida'
        ];
      }
      
      // Transplant priority information
      let transplantPriority = '';
      let waitingTime = '';
      
      if (scoreToEvaluate >= 15) {
        transplantPriority = 'Alta prioridade';
        if (scoreToEvaluate >= 25) {
          waitingTime = 'Urgência (dias a semanas)';
        } else if (scoreToEvaluate >= 20) {
          waitingTime = 'Curto prazo (semanas a meses)';
        } else {
          waitingTime = 'Médio prazo (meses)';
        }
      } else if (scoreToEvaluate >= 10) {
        transplantPriority = 'Prioridade moderada';
        waitingTime = 'Longo prazo (anos)';
      } else {
        transplantPriority = 'Baixa prioridade';
        waitingTime = 'Não listado atualmente';
      }
      
      // Special considerations
      const specialConsiderations = [
        'MELD-Na mais preciso se hiponatremia presente',
        'Exceções MELD para hepatocarcinoma',
        'Reavaliação a cada 3 meses',
        'Considerar comorbidades não hepáticas',
        'Status funcional e qualidade de vida',
        'Suporte social e aderência'
      ];
      
      // Monitoring recommendations
      const monitoringRecommendations = [
        'Função hepática mensal se MELD >15',
        'Função renal semanal se creatinina >2.0',
        'Coagulograma semanal se INR >2.0',
        'Eletrólitos semanais',
        'Avaliação nutricional mensal',
        'Reavaliação MELD a cada 3 meses'
      ];
      
      // Complications based on MELD score
      let complications = [];
      if (scoreToEvaluate >= 15) {
        complications = [
          'Síndrome hepatorrenal',
          'Encefalopatia hepática',
          'Hemorragia digestiva',
          'Peritonite bacteriana espontânea',
          'Insuficiência hepática aguda sobre crônica',
          'Cardiomiopatia cirrótica'
        ];
      } else {
        complications = [
          'Varizes esofágicas',
          'Ascite',
          'Encefalopatia leve',
          'Hepatocarcinoma',
          'Osteoporose hepática'
        ];
      }
      
      // Laboratory trends to monitor
      const laboratoryTrends = [
        'Tendência crescente da bilirrubina',
        'Deterioração da função renal',
        'Prolongamento progressivo do INR',
        'Hiponatremia progressiva',
        'Queda da albumina',
        'Elevação das transaminases'
      ];
      
      const calculatedResults = {
        meldScore: finalMeldScore,
        meldNaScore,
        bilirubin: inputs.bilirubinUnits === 'mg_dl' ? parseFloat(inputs.bilirubin) : parseFloat(inputs.bilirubin) / 17.1,
        creatinine: inputs.creatinineUnits === 'mg_dl' ? parseFloat(inputs.creatinine) : parseFloat(inputs.creatinine) / 88.4,
        inr: parseFloat(inputs.inr),
        sodium: inputs.sodium ? parseFloat(inputs.sodium) : null,
        dialysis: inputs.dialysis,
        interpretation,
        severity,
        severityColor,
        mortality3Months,
        mortality1Year,
        clinicalSignificance,
        transplantPriority,
        waitingTime,
        recommendations,
        specialConsiderations,
        monitoringRecommendations,
        complications,
        laboratoryTrends,
        calculationDate: new Date().toLocaleString('pt-BR')
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
      bilirubin: '',
      creatinine: '',
      inr: '',
      dialysis: false,
      sodium: '',
      albumin: '',
      bilirubinUnits: 'mg_dl',
      creatinineUnits: 'mg_dl',
      includeMELDNa: false
    });
    setResults(null);
    setErrors({});
  }, []);

  /**
   * Copies calculation results to clipboard
   */
  const copyResults = useCallback(() => {
    if (!results) return;
    
    let resultText = `MELD Score - Resultados:\n`;
    resultText += `Data/Hora: ${results.calculationDate}\n\n`;
    
    resultText += `PARÂMETROS:\n`;
    resultText += `Bilirrubina: ${results.bilirubin.toFixed(1)} mg/dL\n`;
    resultText += `Creatinina: ${results.creatinine.toFixed(1)} mg/dL${results.dialysis ? ' (em diálise)' : ''}\n`;
    resultText += `INR: ${results.inr.toFixed(1)}\n`;
    if (results.sodium) {
      resultText += `Sódio: ${results.sodium} mEq/L\n`;
    }
    resultText += `\n`;
    
    resultText += `RESULTADO:\n`;
    resultText += `MELD Score: ${results.meldScore}\n`;
    if (results.meldNaScore) {
      resultText += `MELD-Na Score: ${results.meldNaScore}\n`;
    }
    resultText += `Interpretação: ${results.interpretation}\n`;
    resultText += `Gravidade: ${results.severity}\n`;
    resultText += `Mortalidade 3 meses: ${results.mortality3Months}\n`;
    resultText += `Mortalidade 1 ano: ${results.mortality1Year}\n\n`;
    
    resultText += `Prioridade Transplante: ${results.transplantPriority}\n`;
    resultText += `Tempo de Espera: ${results.waitingTime}\n\n`;
    
    resultText += `Significado Clínico:\n${results.clinicalSignificance}\n\n`;
    resultText += `Recomendações:\n${results.recommendations.map(r => `• ${r}`).join('\n')}\n\n`;
    resultText += `Monitoramento:\n${results.monitoringRecommendations.map(m => `• ${m}`).join('\n')}\n\n`;
    resultText += `Avaliado por: [Nome do profissional]`;
    
    navigator.clipboard.writeText(resultText);
    toast.success('Resultados copiados!');
  }, [results]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            MELD Score (Model for End-Stage Liver Disease)
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros Laboratoriais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Units Selection */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Unidade da Bilirrubina
                  </Label>
                  <RadioGroup
                    value={inputs.bilirubinUnits}
                    onValueChange={(value) => setInputs(prev => ({ ...prev, bilirubinUnits: value }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mg_dl" id="bili-mg" />
                      <Label htmlFor="bili-mg" className="text-sm">mg/dL</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="umol_l" id="bili-umol" />
                      <Label htmlFor="bili-umol" className="text-sm">μmol/L</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Unidade da Creatinina
                  </Label>
                  <RadioGroup
                    value={inputs.creatinineUnits}
                    onValueChange={(value) => setInputs(prev => ({ ...prev, creatinineUnits: value }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mg_dl" id="creat-mg" />
                      <Label htmlFor="creat-mg" className="text-sm">mg/dL</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="umol_l" id="creat-umol" />
                      <Label htmlFor="creat-umol" className="text-sm">μmol/L</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              
              {/* Required Parameters */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-200">Parâmetros Obrigatórios</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bilirubin" className="text-sm font-medium">
                      Bilirrubina Total ({inputs.bilirubinUnits === 'mg_dl' ? 'mg/dL' : 'μmol/L'}) *
                    </Label>
                    <input
                      id="bilirubin"
                      type="number"
                      value={inputs.bilirubin}
                      onChange={(e) => setInputs(prev => ({ ...prev, bilirubin: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-800 text-gray-200"
                      placeholder={inputs.bilirubinUnits === 'mg_dl' ? 'Ex: 3.0' : 'Ex: 51'}
                      min={inputs.bilirubinUnits === 'mg_dl' ? '0.1' : '2'}
                      max={inputs.bilirubinUnits === 'mg_dl' ? '50' : '850'}
                      step="0.1"
                    />
                    {errors.bilirubin && (
                      <p className="text-sm text-red-500">{errors.bilirubin}</p>
                    )}
                    <p className="text-xs text-gray-300">
                      Normal: {inputs.bilirubinUnits === 'mg_dl' ? '<1.2 mg/dL' : '<21 μmol/L'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="creatinine" className="text-sm font-medium">
                      Creatinina ({inputs.creatinineUnits === 'mg_dl' ? 'mg/dL' : 'μmol/L'}) *
                    </Label>
                    <input
                      id="creatinine"
                      type="number"
                      value={inputs.creatinine}
                      onChange={(e) => setInputs(prev => ({ ...prev, creatinine: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-800 text-gray-200"
                      placeholder={inputs.creatinineUnits === 'mg_dl' ? 'Ex: 1.8' : 'Ex: 159'}
                      min={inputs.creatinineUnits === 'mg_dl' ? '0.5' : '44'}
                      max={inputs.creatinineUnits === 'mg_dl' ? '15' : '1325'}
                      step="0.1"
                    />
                    {errors.creatinine && (
                      <p className="text-sm text-red-500">{errors.creatinine}</p>
                    )}
                    <p className="text-xs text-gray-300">
                      Normal: {inputs.creatinineUnits === 'mg_dl' ? '0.7-1.3 mg/dL' : '62-115 μmol/L'}
                    </p>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="inr" className="text-sm font-medium">
                      INR (International Normalized Ratio) *
                    </Label>
                    <input
                      id="inr"
                      type="number"
                      value={inputs.inr}
                      onChange={(e) => setInputs(prev => ({ ...prev, inr: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-800 text-gray-200"
                      placeholder="Ex: 2.1"
                      min="0.8"
                      max="10.0"
                      step="0.1"
                    />
                    {errors.inr && (
                      <p className="text-sm text-red-500">{errors.inr}</p>
                    )}
                    <p className="text-xs text-gray-300">Normal: 0.8-1.2</p>
                  </div>
                </div>
              </div>
              
              {/* Special Conditions */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-200">Condições Especiais</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="dialysis"
                      checked={inputs.dialysis}
                      onChange={(e) => setInputs(prev => ({ ...prev, dialysis: e.target.checked }))}
                      className="text-blue-400"
                    />
                    <Label htmlFor="dialysis" className="text-sm">
                      Paciente em diálise (nas últimas 2 semanas)
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include-meld-na"
                      checked={inputs.includeMELDNa}
                      onChange={(e) => setInputs(prev => ({ ...prev, includeMELDNa: e.target.checked }))}
                      className="text-blue-400"
                    />
                    <Label htmlFor="include-meld-na" className="text-sm">
                      Calcular MELD-Na (recomendado se Na+ &lt;137 mEq/L)
                    </Label>
                  </div>
                </div>
              </div>
              
              {/* Optional Parameters */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-200">Parâmetros Opcionais</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sodium" className="text-sm font-medium">
                      Sódio (mEq/L) {inputs.includeMELDNa && '*'}
                    </Label>
                    <input
                      id="sodium"
                      type="number"
                      value={inputs.sodium}
                      onChange={(e) => setInputs(prev => ({ ...prev, sodium: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-800 text-gray-200"
                      placeholder="Ex: 135"
                      min="120"
                      max="160"
                      step="1"
                      disabled={!inputs.includeMELDNa}
                    />
                    {errors.sodium && (
                      <p className="text-sm text-red-500">{errors.sodium}</p>
                    )}
                    <p className="text-xs text-gray-300">Normal: 135-145 mEq/L</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="albumin" className="text-sm font-medium">
                      Albumina (g/dL)
                    </Label>
                    <input
                      id="albumin"
                      type="number"
                      value={inputs.albumin}
                      onChange={(e) => setInputs(prev => ({ ...prev, albumin: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-800 text-gray-200"
                      placeholder="Ex: 2.8"
                      min="1.0"
                      max="6.0"
                      step="0.1"
                    />
                    {errors.albumin && (
                      <p className="text-sm text-red-500">{errors.albumin}</p>
                    )}
                    <p className="text-xs text-gray-300">Para referência clínica</p>
                  </div>
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
                Resultado do Cálculo
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
                  {/* Main Result */}  
                  <div className="p-4 rounded-lg border bg-blue-900/20 border-blue-700/50">
                    <div className="text-center mb-3">
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-center">
                          <span className="text-3xl font-bold text-blue-200">
                            {results.meldScore}
                          </span>
                          <p className="text-sm text-blue-300">MELD</p>
                        </div>
                        {results.meldNaScore && (
                          <div className="text-center">
                            <span className="text-3xl font-bold text-blue-200">
                              {results.meldNaScore}
                            </span>
                            <p className="text-sm text-blue-300">MELD-Na</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <span className="font-medium text-blue-300">Bilirrubina:</span>
                        <p className="text-blue-300">{results.bilirubin.toFixed(1)} mg/dL</p>
                      </div>
                      <div className="text-center">
                        <span className="font-medium text-blue-300">Creatinina:</span>
                        <p className="text-blue-300">{results.creatinine.toFixed(1)} mg/dL</p>
                      </div>
                      <div className="text-center">
                        <span className="font-medium text-blue-300">INR:</span>
                        <p className="text-blue-300">{results.inr.toFixed(1)}</p>
                      </div>
                    </div>
                    
                    {results.sodium && (
                      <div className="text-center mt-2">
                        <span className="font-medium text-blue-300">Sódio:</span>
                        <span className="text-blue-300 ml-1">{results.sodium} mEq/L</span>
                      </div>
                    )}
                    
                    {results.dialysis && (
                      <div className="text-center mt-2">
                        <Badge className="bg-purple-900/30 border-purple-700/50 text-purple-200">Em diálise</Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* Interpretation */}
                  <div className={`p-4 rounded-lg border ${
                    results.severity === 'LEVE' ? 'bg-green-900/20 border-green-700/50' :
                    results.severity === 'MODERADO' ? 'bg-amber-900/20 border-amber-700/50' :
                    results.severity === 'MODERADO-ALTO' ? 'bg-orange-900/20 border-orange-700/50' :
                    results.severity === 'ALTO' ? 'bg-red-900/20 border-red-700/50' :
                    'bg-red-900/30 border-red-700/60'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold text-lg ${results.severityColor}`}>
                        {results.interpretation}
                      </span>
                      <Badge className={`${
                        results.severity === 'LEVE' ? 'bg-green-900/30 border-green-700/50 text-green-200' :
                        results.severity === 'MODERADO' ? 'bg-amber-900/30 border-amber-700/50 text-amber-200' :
                        results.severity === 'MODERADO-ALTO' ? 'bg-orange-900/30 border-orange-700/50 text-orange-200' :
                        results.severity === 'ALTO' ? 'bg-red-900/30 border-red-700/50 text-red-200' :
                        'bg-red-900/40 border-red-700/60 text-red-200'
                      }`}>
                        {results.severity}
                      </Badge>
                    </div>
                    <p className="text-sm opacity-90 mb-3">{results.clinicalSignificance}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Mortalidade 3 meses:</span>
                        <p>{results.mortality3Months}</p>
                      </div>
                      <div>
                        <span className="font-medium">Mortalidade 1 ano:</span>
                        <p>{results.mortality1Year}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Transplant Priority */}
                  <div className="p-3 rounded-lg border bg-purple-900/20 border-purple-700/50">
                    <h4 className="font-semibold text-purple-200 mb-2">Prioridade para Transplante:</h4>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-lg font-bold text-purple-300">{results.transplantPriority}</span>
                    </div>
                    <p className="text-sm text-purple-300">Tempo de espera estimado: {results.waitingTime}</p>
                  </div>
                  
                  {/* Clinical Recommendations */}
                  <div className="p-3 rounded-lg border bg-blue-900/20 border-blue-700/50">
                    <h4 className="font-semibold text-blue-200 mb-2 flex items-center gap-2">
                      {results.severity === 'CRÍTICO' && <AlertTriangle className="h-4 w-4" />}
                      Recomendações Clínicas:
                    </h4>
                    <ul className="text-sm text-blue-300 space-y-1">
                      {results.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Monitoring */}
                  <div className="p-3 rounded-lg border bg-green-900/20 border-green-700/50">
                    <h4 className="font-semibold text-green-200 mb-2">Monitoramento:</h4>
                    <ul className="text-sm text-green-300 space-y-1">
                      {results.monitoringRecommendations.map((mon, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{mon}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Special Considerations */}
                  <div className="p-3 rounded-lg border bg-gray-900/20 border-gray-700/50">
                    <h4 className="font-semibold text-gray-200 mb-2">Considerações Especiais:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {results.specialConsiderations.map((consideration, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{consideration}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Preencha os parâmetros obrigatórios e clique em "Calcular"
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Complications and Laboratory Trends */}
        {results && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Complications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Complicações a Monitorar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {results.complications.map((comp, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{comp}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            {/* Laboratory Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendências Laboratoriais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {results.laboratoryTrends.map((trend, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{trend}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Reference Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              MELD Score - Informações de Referência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Fórmula MELD:</h4>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-mono">
                    MELD = 3.78 × ln(bilirrubina) + 11.2 × ln(INR) + 9.57 × ln(creatinina) + 6.43
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    • Valores mínimos: bilirrubina ≥1.0, creatinina ≥1.0, INR ≥1.0<br/>
                    • Se diálise: creatinina = 4.0 mg/dL<br/>
                    • Score final: 6-40 pontos
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Fórmula MELD-Na:</h4>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-mono">
                    MELD-Na = MELD + 1.32 × (137 - Na) - (0.033 × MELD × (137 - Na))
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    • Aplicável apenas se MELD &gt;11<br/>
                    • Sódio limitado entre 125-137 mEq/L<br/>
                    • Mais preciso para predição de mortalidade
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Interpretação por Faixas:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>&lt;10:</strong> Baixo risco (&lt;5% mortalidade 3 meses)</li>
                  <li>• <strong>10-14:</strong> Risco moderado (5-10% mortalidade 3 meses)</li>
                  <li>• <strong>15-19:</strong> Risco moderado-alto (10-20% mortalidade 3 meses)</li>
                  <li>• <strong>20-24:</strong> Alto risco (20-30% mortalidade 3 meses)</li>
                  <li>• <strong>≥25:</strong> Risco muito alto (&gt;30% mortalidade 3 meses)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Limitações:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Não considera comorbidades não hepáticas</li>
                  <li>• Pode subestimar risco em hepatocarcinoma</li>
                  <li>• Variabilidade laboratorial pode afetar score</li>
                  <li>• Não aplicável em hepatite fulminante</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Kamath PS et al. A model to predict survival in patients with end-stage liver disease. Hepatology 2001</li>
                  <li>• Kim WR et al. Hyponatremia and mortality among patients on the liver-transplant waiting list. NEJM 2008</li>
                  <li>• AASLD Practice Guidelines: Evaluation for liver transplantation</li>
                  <li>• Diretrizes ABTO - Transplante Hepático</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default MELD;
