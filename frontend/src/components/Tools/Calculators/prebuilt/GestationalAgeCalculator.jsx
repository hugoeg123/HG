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
import { Copy, Calculator, Calendar, Baby, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * GestationalAgeCalculator - Gestational Age and Due Date Calculator
 * 
 * This component calculates gestational age, due date, and provides
 * clinical information based on last menstrual period or ultrasound dating.
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
 * <GestationalAgeCalculator 
 *   open={showHardcodedCalculator === 'gestational-age-calculator'} 
 *   onOpenChange={() => setShowHardcodedCalculator(null)} 
 * />
 * 
 * @example
 * // Calculation example
 * // Input: lmpDate="2024-01-01", currentDate="2024-04-01"
 * // Output: gestationalAge="12 weeks 6 days", dueDate="2024-10-08"
 * 
 * @author Health Guardian Team
 * @since Sprint 2
 * @version 1.0.0
 */
function GestationalAgeCalculator({ open, onOpenChange }) {
  const [inputs, setInputs] = useState({
    calculationMethod: 'lmp', // lmp, ultrasound, ivf
    lmpDate: '',
    ultrasoundDate: '',
    ultrasoundGA: '', // weeks
    ultrasoundGADays: '', // days
    ivfDate: '',
    ivfType: 'fresh', // fresh, frozen
    currentDate: new Date().toISOString().split('T')[0]
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  /**
   * Validates input parameters for gestational age calculation
   * 
   * @returns {boolean} True if all required inputs are provided
   */
  const validateInputs = useCallback(() => {
    const newErrors = {};
    
    if (!inputs.calculationMethod) {
      newErrors.calculationMethod = 'Método de cálculo deve ser selecionado';
    }
    
    if (!inputs.currentDate) {
      newErrors.currentDate = 'Data atual é obrigatória';
    }
    
    if (inputs.calculationMethod === 'lmp') {
      if (!inputs.lmpDate) {
        newErrors.lmpDate = 'Data da última menstruação é obrigatória';
      } else if (new Date(inputs.lmpDate) > new Date(inputs.currentDate)) {
        newErrors.lmpDate = 'DUM não pode ser posterior à data atual';
      }
    }
    
    if (inputs.calculationMethod === 'ultrasound') {
      if (!inputs.ultrasoundDate) {
        newErrors.ultrasoundDate = 'Data do ultrassom é obrigatória';
      }
      if (!inputs.ultrasoundGA) {
        newErrors.ultrasoundGA = 'Idade gestacional do ultrassom é obrigatória';
      } else if (inputs.ultrasoundGA < 4 || inputs.ultrasoundGA > 42) {
        newErrors.ultrasoundGA = 'IG deve estar entre 4 e 42 semanas';
      }
      if (inputs.ultrasoundGADays && (inputs.ultrasoundGADays < 0 || inputs.ultrasoundGADays > 6)) {
        newErrors.ultrasoundGADays = 'Dias devem estar entre 0 e 6';
      }
    }
    
    if (inputs.calculationMethod === 'ivf') {
      if (!inputs.ivfDate) {
        newErrors.ivfDate = 'Data da transferência embrionária é obrigatória';
      }
      if (!inputs.ivfType) {
        newErrors.ivfType = 'Tipo de transferência deve ser selecionado';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs]);

  /**
   * Calculates gestational age and due date based on selected method
   * 
   * @returns {Object} Calculation results with clinical interpretation
   */
  const calculate = useCallback(() => {
    if (!validateInputs()) return;
    
    try {
      const currentDate = new Date(inputs.currentDate);
      let conceptionDate;
      let dueDate;
      let gestationalAgeInDays;
      let calculationAccuracy;
      
      // Calculate based on method
      if (inputs.calculationMethod === 'lmp') {
        const lmpDate = new Date(inputs.lmpDate);
        conceptionDate = new Date(lmpDate.getTime() + (14 * 24 * 60 * 60 * 1000)); // LMP + 14 days
        dueDate = new Date(lmpDate.getTime() + (280 * 24 * 60 * 60 * 1000)); // LMP + 280 days
        gestationalAgeInDays = Math.floor((currentDate - lmpDate) / (24 * 60 * 60 * 1000));
        calculationAccuracy = 'Moderada (±7-10 dias)';
      } else if (inputs.calculationMethod === 'ultrasound') {
        const ultrasoundDate = new Date(inputs.ultrasoundDate);
        const ultrasoundGADays = parseInt(inputs.ultrasoundGA) * 7 + (parseInt(inputs.ultrasoundGADays) || 0);
        const daysSinceUltrasound = Math.floor((currentDate - ultrasoundDate) / (24 * 60 * 60 * 1000));
        gestationalAgeInDays = ultrasoundGADays + daysSinceUltrasound;
        
        // Calculate conception and due date from ultrasound
        const gestationalAgeAtUltrasound = ultrasoundGADays;
        conceptionDate = new Date(ultrasoundDate.getTime() - ((gestationalAgeAtUltrasound - 14) * 24 * 60 * 60 * 1000));
        dueDate = new Date(ultrasoundDate.getTime() + ((280 - gestationalAgeAtUltrasound) * 24 * 60 * 60 * 1000));
        
        // Accuracy depends on when ultrasound was performed
        if (ultrasoundGADays <= 70) { // ≤10 weeks
          calculationAccuracy = 'Alta (±3-5 dias)';
        } else if (ultrasoundGADays <= 140) { // 10-20 weeks
          calculationAccuracy = 'Boa (±7 dias)';
        } else if (ultrasoundGADays <= 196) { // 20-28 weeks
          calculationAccuracy = 'Moderada (±10-14 dias)';
        } else {
          calculationAccuracy = 'Baixa (±21-28 dias)';
        }
      } else if (inputs.calculationMethod === 'ivf') {
        const ivfDate = new Date(inputs.ivfDate);
        
        // For IVF, conception date is more precise
        if (inputs.ivfType === 'fresh') {
          conceptionDate = new Date(ivfDate.getTime() - (3 * 24 * 60 * 60 * 1000)); // Transfer - 3 days
        } else {
          conceptionDate = new Date(ivfDate.getTime() - (5 * 24 * 60 * 60 * 1000)); // Transfer - 5 days
        }
        
        const lmpEquivalent = new Date(conceptionDate.getTime() - (14 * 24 * 60 * 60 * 1000));
        dueDate = new Date(lmpEquivalent.getTime() + (280 * 24 * 60 * 60 * 1000));
        gestationalAgeInDays = Math.floor((currentDate - lmpEquivalent) / (24 * 60 * 60 * 1000));
        calculationAccuracy = 'Muito Alta (±1-2 dias)';
      }
      
      // Convert gestational age to weeks and days
      const gestationalWeeks = Math.floor(gestationalAgeInDays / 7);
      const gestationalDays = gestationalAgeInDays % 7;
      
      // Determine pregnancy trimester
      let trimester;
      let trimesterDescription;
      if (gestationalWeeks < 14) {
        trimester = 1;
        trimesterDescription = 'Primeiro trimestre';
      } else if (gestationalWeeks < 28) {
        trimester = 2;
        trimesterDescription = 'Segundo trimester';
      } else {
        trimester = 3;
        trimesterDescription = 'Terceiro trimester';
      }
      
      // Determine pregnancy viability and risks
      let viabilityStatus;
      let viabilityColor;
      let clinicalConsiderations = [];
      
      if (gestationalWeeks < 20) {
        viabilityStatus = 'Pré-viabilidade';
        viabilityColor = 'text-red-200';
        clinicalConsiderations = [
          'Período crítico de organogênese',
          'Alto risco de malformações se exposição a teratógenos',
          'Rastreamento de anomalias cromossômicas',
          'Suplementação com ácido fólico'
        ];
      } else if (gestationalWeeks < 24) {
        viabilityStatus = 'Limiar de viabilidade';
        viabilityColor = 'text-orange-200';
        clinicalConsiderations = [
          'Viabilidade fetal limitada',
          'Necessidade de cuidados intensivos neonatais',
          'Discussão sobre prognóstico com a família',
          'Corticoterapia para maturação pulmonar se risco de parto'
        ];
      } else if (gestationalWeeks < 28) {
        viabilityStatus = 'Prematuridade extrema';
        viabilityColor = 'text-orange-200';
        clinicalConsiderations = [
          'Sobrevida possível com cuidados intensivos',
          'Alto risco de sequelas neurológicas',
          'Corticoterapia antenatal indicada',
          'Planejamento para parto em centro terciário'
        ];
      } else if (gestationalWeeks < 32) {
        viabilityStatus = 'Prematuridade severa';
        viabilityColor = 'text-amber-200';
        clinicalConsiderations = [
          'Boa sobrevida com cuidados adequados',
          'Risco moderado de complicações',
          'Corticoterapia se risco de parto',
          'Monitoramento do crescimento fetal'
        ];
      } else if (gestationalWeeks < 34) {
        viabilityStatus = 'Prematuridade moderada';
        viabilityColor = 'text-amber-200';
        clinicalConsiderations = [
          'Excelente sobrevida',
          'Risco baixo de sequelas graves',
          'Corticoterapia se parto iminente',
          'Preparação para possível UTI neonatal'
        ];
      } else if (gestationalWeeks < 37) {
        viabilityStatus = 'Prematuridade tardia';
        viabilityColor = 'text-blue-200';
        clinicalConsiderations = [
          'Baixo risco de complicações',
          'Possível necessidade de suporte respiratório',
          'Monitoramento da maturidade pulmonar',
          'Preparação para cuidados neonatais'
        ];
      } else if (gestationalWeeks < 42) {
        viabilityStatus = 'Termo';
        viabilityColor = 'text-green-200';
        clinicalConsiderations = [
          'Gestação a termo',
          'Baixo risco de complicações',
          'Preparação para o parto',
          'Monitoramento do bem-estar fetal'
        ];
      } else {
        viabilityStatus = 'Pós-termo';
        viabilityColor = 'text-red-200';
        clinicalConsiderations = [
          'Risco aumentado de complicações',
          'Monitoramento intensivo do bem-estar fetal',
          'Considerar indução do parto',
          'Avaliação do líquido amniótico'
        ];
      }
      
      // Calculate important dates
      const importantDates = {
        viabilityDate: new Date(conceptionDate.getTime() + (154 * 24 * 60 * 60 * 1000)), // 22 weeks from LMP
        termDate: new Date(conceptionDate.getTime() + (245 * 24 * 60 * 60 * 1000)), // 37 weeks from LMP
        postTermDate: new Date(conceptionDate.getTime() + (280 * 24 * 60 * 60 * 1000)) // 42 weeks from LMP
      };
      
      // Screening and monitoring recommendations
      let screeningRecommendations = [];
      let monitoringRecommendations = [];
      
      if (gestationalWeeks < 12) {
        screeningRecommendations = [
          'Ultrassom para datação (6-12 semanas)',
          'Rastreamento de anomalias cromossômicas (10-14 semanas)',
          'Exames laboratoriais de rotina pré-natal',
          'Avaliação de fatores de risco'
        ];
        monitoringRecommendations = [
          'Consultas mensais',
          'Suplementação vitamínica',
          'Orientações sobre estilo de vida',
          'Vacinação conforme calendário'
        ];
      } else if (gestationalWeeks < 20) {
        screeningRecommendations = [
          'Ultrassom morfológico (18-22 semanas)',
          'Ecocardiografia fetal se indicado',
          'Rastreamento de diabetes gestacional (24-28 semanas)',
          'Avaliação cervical se fatores de risco'
        ];
        monitoringRecommendations = [
          'Consultas mensais',
          'Monitoramento do crescimento fetal',
          'Avaliação da pressão arterial',
          'Pesquisa de proteinúria'
        ];
      } else if (gestationalWeeks < 28) {
        screeningRecommendations = [
          'Teste de tolerância à glicose (se não realizado)',
          'Ultrassom para avaliação do crescimento',
          'Pesquisa de estreptococo do grupo B (35-37 semanas)',
          'Avaliação da apresentação fetal'
        ];
        monitoringRecommendations = [
          'Consultas quinzenais',
          'Monitoramento da vitalidade fetal',
          'Controle da pressão arterial',
          'Avaliação de sinais de trabalho de parto prematuro'
        ];
      } else {
        screeningRecommendations = [
          'Cultura para estreptococo do grupo B (se não realizada)',
          'Ultrassom para apresentação e peso fetal',
          'Avaliação da maturidade cervical',
          'Cardiotocografia se indicado'
        ];
        monitoringRecommendations = [
          'Consultas semanais após 36 semanas',
          'Monitoramento da vitalidade fetal',
          'Avaliação de sinais de trabalho de parto',
          'Preparação para o parto'
        ];
      }
      
      // Risk factors assessment
      const riskFactors = {
        maternal: [
          'Idade materna <18 ou >35 anos',
          'Diabetes mellitus ou gestacional',
          'Hipertensão arterial',
          'Doenças autoimunes',
          'Infecções (TORCH, Zika, COVID-19)',
          'Uso de medicamentos teratogênicos',
          'Tabagismo, alcoolismo, drogas'
        ],
        fetal: [
          'Anomalias cromossômicas',
          'Malformações congênitas',
          'Restrição do crescimento intrauterino',
          'Polidrâmnio ou oligodrâmnio',
          'Apresentação anômala',
          'Gestação múltipla'
        ],
        obstetric: [
          'Trabalho de parto prematuro',
          'Ruptura prematura de membranas',
          'Placenta prévia ou descolamento',
          'Incompetência cervical',
          'Pré-eclâmpsia/eclâmpsia',
          'Diabetes gestacional'
        ]
      };
      
      const calculatedResults = {
        gestationalWeeks,
        gestationalDays,
        gestationalAgeInDays,
        trimester,
        trimesterDescription,
        dueDate: dueDate.toLocaleDateString('pt-BR'),
        conceptionDate: conceptionDate.toLocaleDateString('pt-BR'),
        viabilityStatus,
        viabilityColor,
        calculationAccuracy,
        clinicalConsiderations,
        importantDates: {
          viability: importantDates.viabilityDate.toLocaleDateString('pt-BR'),
          term: importantDates.termDate.toLocaleDateString('pt-BR'),
          postTerm: importantDates.postTermDate.toLocaleDateString('pt-BR')
        },
        screeningRecommendations,
        monitoringRecommendations,
        riskFactors,
        calculationMethod: inputs.calculationMethod,
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
      calculationMethod: 'lmp',
      lmpDate: '',
      ultrasoundDate: '',
      ultrasoundGA: '',
      ultrasoundGADays: '',
      ivfDate: '',
      ivfType: 'fresh',
      currentDate: new Date().toISOString().split('T')[0]
    });
    setResults(null);
    setErrors({});
  }, []);

  /**
   * Copies calculation results to clipboard
   */
  const copyResults = useCallback(() => {
    if (!results) return;
    
    let resultText = `Cálculo de Idade Gestacional - Resultados:\n`;
    resultText += `Data do Cálculo: ${results.calculationDate}\n\n`;
    
    resultText += `IDADE GESTACIONAL: ${results.gestationalWeeks} semanas e ${results.gestationalDays} dias\n`;
    resultText += `Trimestre: ${results.trimesterDescription}\n`;
    resultText += `Status: ${results.viabilityStatus}\n`;
    resultText += `Data Provável do Parto: ${results.dueDate}\n`;
    resultText += `Data da Concepção: ${results.conceptionDate}\n`;
    resultText += `Precisão do Cálculo: ${results.calculationAccuracy}\n\n`;
    
    resultText += `Datas Importantes:\n`;
    resultText += `• Viabilidade (22 sem): ${results.importantDates.viability}\n`;
    resultText += `• Termo (37 sem): ${results.importantDates.term}\n`;
    resultText += `• Pós-termo (42 sem): ${results.importantDates.postTerm}\n\n`;
    
    resultText += `Considerações Clínicas:\n${results.clinicalConsiderations.map(c => `• ${c}`).join('\n')}\n\n`;
    resultText += `Rastreamentos Recomendados:\n${results.screeningRecommendations.map(s => `• ${s}`).join('\n')}\n\n`;
    resultText += `Monitoramento:\n${results.monitoringRecommendations.map(m => `• ${m}`).join('\n')}\n\n`;
    resultText += `Calculado por: [Nome do profissional]`;
    
    navigator.clipboard.writeText(resultText);
    toast.success('Resultados copiados!');
  }, [results]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5" />
            Calculadora de Idade Gestacional
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Dados para Cálculo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Calculation Method */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-800">
                  Método de Cálculo
                </Label>
                <RadioGroup
                  value={inputs.calculationMethod}
                  onValueChange={(value) => setInputs(prev => ({ ...prev, calculationMethod: value }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lmp" id="method-lmp" />
                    <Label htmlFor="method-lmp" className="text-sm">
                      Data da Última Menstruação (DUM)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ultrasound" id="method-us" />
                    <Label htmlFor="method-us" className="text-sm">
                      Ultrassom com Datação
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ivf" id="method-ivf" />
                    <Label htmlFor="method-ivf" className="text-sm">
                      Fertilização In Vitro (FIV)
                    </Label>
                  </div>
                </RadioGroup>
                {errors.calculationMethod && (
                  <p className="text-sm text-red-500">{errors.calculationMethod}</p>
                )}
              </div>
              
              {/* Current Date */}
              <div className="space-y-2">
                <Label htmlFor="current-date" className="text-sm font-medium">
                  Data Atual
                </Label>
                <input
                  id="current-date"
                  type="date"
                  value={inputs.currentDate}
                  onChange={(e) => setInputs(prev => ({ ...prev, currentDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.currentDate && (
                  <p className="text-sm text-red-500">{errors.currentDate}</p>
                )}
              </div>
              
              {/* LMP Method */}
              {inputs.calculationMethod === 'lmp' && (
                <div className="space-y-2">
                  <Label htmlFor="lmp-date" className="text-sm font-medium">
                    Data da Última Menstruação (DUM)
                  </Label>
                  <input
                    id="lmp-date"
                    type="date"
                    value={inputs.lmpDate}
                    onChange={(e) => setInputs(prev => ({ ...prev, lmpDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.lmpDate && (
                    <p className="text-sm text-red-500">{errors.lmpDate}</p>
                  )}
                  <p className="text-xs text-gray-600">
                    Primeiro dia da última menstruação normal
                  </p>
                </div>
              )}
              
              {/* Ultrasound Method */}
              {inputs.calculationMethod === 'ultrasound' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="us-date" className="text-sm font-medium">
                      Data do Ultrassom
                    </Label>
                    <input
                      id="us-date"
                      type="date"
                      value={inputs.ultrasoundDate}
                      onChange={(e) => setInputs(prev => ({ ...prev, ultrasoundDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.ultrasoundDate && (
                      <p className="text-sm text-red-500">{errors.ultrasoundDate}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="us-ga" className="text-sm font-medium">
                        IG no Ultrassom (semanas)
                      </Label>
                      <input
                        id="us-ga"
                        type="number"
                        value={inputs.ultrasoundGA}
                        onChange={(e) => setInputs(prev => ({ ...prev, ultrasoundGA: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="4"
                        max="42"
                        placeholder="Ex: 12"
                      />
                      {errors.ultrasoundGA && (
                        <p className="text-sm text-red-500">{errors.ultrasoundGA}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="us-ga-days" className="text-sm font-medium">
                        Dias (0-6)
                      </Label>
                      <input
                        id="us-ga-days"
                        type="number"
                        value={inputs.ultrasoundGADays}
                        onChange={(e) => setInputs(prev => ({ ...prev, ultrasoundGADays: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max="6"
                        placeholder="Ex: 3"
                      />
                      {errors.ultrasoundGADays && (
                        <p className="text-sm text-red-500">{errors.ultrasoundGADays}</p>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600">
                    Idade gestacional determinada pelo ultrassom
                  </p>
                </div>
              )}
              
              {/* IVF Method */}
              {inputs.calculationMethod === 'ivf' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ivf-date" className="text-sm font-medium">
                      Data da Transferência Embrionária
                    </Label>
                    <input
                      id="ivf-date"
                      type="date"
                      value={inputs.ivfDate}
                      onChange={(e) => setInputs(prev => ({ ...prev, ivfDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.ivfDate && (
                      <p className="text-sm text-red-500">{errors.ivfDate}</p>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Tipo de Transferência
                    </Label>
                    <RadioGroup
                      value={inputs.ivfType}
                      onValueChange={(value) => setInputs(prev => ({ ...prev, ivfType: value }))}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fresh" id="ivf-fresh" />
                        <Label htmlFor="ivf-fresh" className="text-sm">
                          Embrião Fresco (D3)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="frozen" id="ivf-frozen" />
                        <Label htmlFor="ivf-frozen" className="text-sm">
                          Blastocisto Congelado (D5)
                        </Label>
                      </div>
                    </RadioGroup>
                    {errors.ivfType && (
                      <p className="text-sm text-red-500">{errors.ivfType}</p>
                    )}
                  </div>
                </div>
              )}
              
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
                Resultados do Cálculo
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
                  <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                    <div className="text-center mb-3">
                      <span className="text-2xl font-bold text-blue-800">
                        {results.gestationalWeeks} semanas e {results.gestationalDays} dias
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-700">Trimestre:</span>
                        <p className="text-blue-600">{results.trimesterDescription}</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">DPP:</span>
                        <p className="text-blue-600">{results.dueDate}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status */}
                  <div className="p-3 rounded-lg border bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold ${results.viabilityColor}`}>
                        {results.viabilityStatus}
                      </span>
                      <Badge className="bg-gray-200 text-gray-800">
                        {results.calculationAccuracy}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Concepção estimada: {results.conceptionDate}
                    </p>
                  </div>
                  
                  {/* Important Dates */}
                  <div className="p-3 rounded-lg border bg-green-50 border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Datas Importantes:
                    </h4>
                    <div className="text-sm text-green-700 space-y-1">
                      <div className="flex justify-between">
                        <span>Viabilidade (22 sem):</span>
                        <span className="font-medium">{results.importantDates.viability}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Termo (37 sem):</span>
                        <span className="font-medium">{results.importantDates.term}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pós-termo (42 sem):</span>
                        <span className="font-medium">{results.importantDates.postTerm}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Clinical Considerations */}
                  <div className="p-3 rounded-lg border bg-orange-50 border-orange-200">
                    <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                      {results.viabilityStatus.includes('Pré-viabilidade') && <AlertTriangle className="h-4 w-4" />}
                      Considerações Clínicas:
                    </h4>
                    <ul className="text-sm text-orange-700 space-y-1">
                      {results.clinicalConsiderations.map((consideration, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{consideration}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Screening Recommendations */}
                  <div className="p-3 rounded-lg border bg-purple-50 border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-2">Rastreamentos Recomendados:</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      {results.screeningRecommendations.map((screening, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{screening}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Monitoring */}
                  <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Monitoramento:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {results.monitoringRecommendations.map((monitoring, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{monitoring}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Preencha os dados e clique em "Calcular"
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Risk Factors Card */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Fatores de Risco e Monitoramento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-red-800">Fatores de Risco Maternos:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {results.riskFactors.maternal.map((risk, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 text-orange-800">Fatores de Risco Fetais:</h4>
                  <ul className="text-sm text-orange-700 space-y-1">
                    {results.riskFactors.fetal.map((risk, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 text-purple-800">Complicações Obstétricas:</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    {results.riskFactors.obstetric.map((risk, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Informações sobre Métodos de Cálculo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Método DUM (Data da Última Menstruação):</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Baseado na Regra de Naegele: DPP = DUM + 280 dias (40 semanas)
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Precisão: ±7-10 dias</li>
                  <li>• Requer ciclos regulares de 28 dias</li>
                  <li>• Pode ser impreciso se ovulação tardia</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Método Ultrassom:</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Baseado em medidas biométricas fetais para datação
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 6-10 semanas: ±3-5 dias (CCN)</li>
                  <li>• 10-20 semanas: ±7 dias (DBP, CC, CA, CF)</li>
                  <li>• 20-28 semanas: ±10-14 dias</li>
                  <li>• >28 semanas: ±21-28 dias</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Método FIV:</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Baseado na data conhecida da fertilização
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Precisão: ±1-2 dias</li>
                  <li>• D3: Transferência - 3 dias = concepção</li>
                  <li>• D5: Transferência - 5 dias = concepção</li>
                  <li>• Método mais preciso disponível</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• ACOG Practice Bulletin No. 175 - Ultrasound in Pregnancy</li>
                  <li>• ISUOG Practice Guidelines - First Trimester Screening</li>
                  <li>• Protocolo FEBRASGO - Assistência Pré-natal</li>
                  <li>• WHO Recommendations on Antenatal Care</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default GestationalAgeCalculator;
