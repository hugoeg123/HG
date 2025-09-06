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
import { Checkbox } from '../../../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { Copy, Calculator, Heart, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * CHA2DS2VASc - Stroke Risk Assessment in Atrial Fibrillation
 * 
 * This component calculates the CHA₂DS₂-VASc score for stroke risk assessment
 * in patients with atrial fibrillation to guide anticoagulation decisions.
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
 * <CHA2DS2VASc 
 *   open={showHardcodedCalculator === 'cha2ds2vasc'} 
 *   onOpenChange={() => setShowHardcodedCalculator(null)} 
 * />
 * 
 * @author Health Guardian Team
 * @since Sprint 3
 * @version 1.0.0
 */
function CHA2DS2VASc({ open, onOpenChange }) {
  const [inputs, setInputs] = useState({
    age: '',
    sex: '',
    congestiveHeartFailure: false,
    hypertension: false,
    diabetes: false,
    strokeTIA: false,
    vascularDisease: false
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  /**
   * Validates input parameters for CHA₂DS₂-VASc calculation
   */
  const validateInputs = useCallback(() => {
    const newErrors = {};
    
    if (!inputs.age || parseFloat(inputs.age) < 0 || parseFloat(inputs.age) > 120) {
      newErrors.age = 'Idade deve estar entre 0 e 120 anos';
    }
    
    if (!inputs.sex) {
      newErrors.sex = 'Sexo é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs]);

  /**
   * Calculate CHA₂DS₂-VASc score based on risk factors
   */
  const calculate = useCallback(() => {
    if (!validateInputs()) return;
    
    try {
      let totalScore = 0;
      const scoreBreakdown = {};
      const riskFactors = [];
      
      const age = parseFloat(inputs.age);
      const isFemale = inputs.sex === 'female';
      
      // Congestive Heart Failure (1 point)
      if (inputs.congestiveHeartFailure) {
        totalScore += 1;
        scoreBreakdown.chf = 1;
        riskFactors.push('Insuficiência cardíaca congestiva');
      } else {
        scoreBreakdown.chf = 0;
      }
      
      // Hypertension (1 point)
      if (inputs.hypertension) {
        totalScore += 1;
        scoreBreakdown.hypertension = 1;
        riskFactors.push('Hipertensão arterial');
      } else {
        scoreBreakdown.hypertension = 0;
      }
      
      // Age scoring (0, 1, or 2 points)
      let agePoints = 0;
      if (age >= 75) {
        agePoints = 2;
        riskFactors.push('Idade ≥ 75 anos');
      } else if (age >= 65) {
        agePoints = 1;
        riskFactors.push('Idade 65-74 anos');
      }
      scoreBreakdown.age = agePoints;
      totalScore += agePoints;
      
      // Diabetes (1 point)
      if (inputs.diabetes) {
        totalScore += 1;
        scoreBreakdown.diabetes = 1;
        riskFactors.push('Diabetes mellitus');
      } else {
        scoreBreakdown.diabetes = 0;
      }
      
      // Stroke/TIA/Thromboembolism (2 points)
      if (inputs.strokeTIA) {
        totalScore += 2;
        scoreBreakdown.stroke = 2;
        riskFactors.push('AVC/AIT/Tromboembolismo prévio');
      } else {
        scoreBreakdown.stroke = 0;
      }
      
      // Vascular Disease (1 point)
      if (inputs.vascularDisease) {
        totalScore += 1;
        scoreBreakdown.vascular = 1;
        riskFactors.push('Doença vascular');
      } else {
        scoreBreakdown.vascular = 0;
      }
      
      // Sex (Female = 1 point)
      if (isFemale) {
        totalScore += 1;
        scoreBreakdown.sex = 1;
        riskFactors.push('Sexo feminino');
      } else {
        scoreBreakdown.sex = 0;
      }
      
      // Risk stratification and annual stroke risk
      let riskLevel = '';
      let riskColor = '';
      let annualStrokeRisk = '';
      let anticoagulationRecommendation = '';
      let riskDescription = '';
      
      if (totalScore === 0) {
        riskLevel = 'Muito baixo';
        riskColor = 'text-green-200';
        annualStrokeRisk = '0%';
        anticoagulationRecommendation = 'Não recomendada';
        riskDescription = 'Risco muito baixo de AVC';
      } else if (totalScore === 1) {
        riskLevel = 'Baixo';
        riskColor = 'text-green-200';
        annualStrokeRisk = '1.3%';
        anticoagulationRecommendation = 'Considerar (preferência do paciente)';
        riskDescription = 'Risco baixo de AVC';
      } else if (totalScore === 2) {
        riskLevel = 'Moderado';
        riskColor = 'text-amber-200';
        annualStrokeRisk = '2.2%';
        anticoagulationRecommendation = 'Recomendada';
        riskDescription = 'Risco moderado de AVC';
      } else if (totalScore === 3) {
        riskLevel = 'Moderado-Alto';
        riskColor = 'text-orange-200';
        annualStrokeRisk = '3.2%';
        anticoagulationRecommendation = 'Recomendada';
        riskDescription = 'Risco moderado a alto de AVC';
      } else if (totalScore === 4) {
        riskLevel = 'Alto';
        riskColor = 'text-red-200';
        annualStrokeRisk = '4.0%';
        anticoagulationRecommendation = 'Fortemente recomendada';
        riskDescription = 'Risco alto de AVC';
      } else if (totalScore === 5) {
        riskLevel = 'Alto';
        riskColor = 'text-red-200';
        annualStrokeRisk = '6.7%';
        anticoagulationRecommendation = 'Fortemente recomendada';
        riskDescription = 'Risco alto de AVC';
      } else if (totalScore === 6) {
        riskLevel = 'Muito Alto';
        riskColor = 'text-red-200';
        annualStrokeRisk = '9.8%';
        anticoagulationRecommendation = 'Fortemente recomendada';
        riskDescription = 'Risco muito alto de AVC';
      } else {
        riskLevel = 'Extremamente Alto';
        riskColor = 'text-red-200';
        annualStrokeRisk = '>15%';
        anticoagulationRecommendation = 'Fortemente recomendada';
        riskDescription = 'Risco extremamente alto de AVC';
      }
      
      // Clinical recommendations based on score
      const clinicalRecommendations = [];
      
      if (totalScore === 0) {
        clinicalRecommendations.push('Anticoagulação não recomendada');
        clinicalRecommendations.push('Considerar AAS 75-100mg/dia');
        clinicalRecommendations.push('Reavaliar anualmente');
      } else if (totalScore === 1) {
        clinicalRecommendations.push('Anticoagulação pode ser considerada');
        clinicalRecommendations.push('Discutir riscos e benefícios com paciente');
        clinicalRecommendations.push('Considerar preferência do paciente');
        clinicalRecommendations.push('Avaliar risco de sangramento (HAS-BLED)');
      } else {
        clinicalRecommendations.push('Anticoagulação oral recomendada');
        clinicalRecommendations.push('Preferir DOACs (dabigatrana, rivaroxabana, apixabana)');
        clinicalRecommendations.push('Warfarina se DOACs contraindicados');
        clinicalRecommendations.push('Avaliar risco de sangramento (HAS-BLED)');
        clinicalRecommendations.push('Monitorização regular da anticoagulação');
      }
      
      // Additional considerations
      const additionalConsiderations = [
        'Score deve ser usado em pacientes com FA não-valvar',
        'Reavaliar periodicamente (mudanças na idade/comorbidades)',
        'Considerar sempre risco de sangramento (HAS-BLED)',
        'Discutir benefícios e riscos com o paciente',
        'Contraindicações absolutas devem ser respeitadas'
      ];
      
      // Anticoagulant options
      const anticoagulantOptions = [
        'DOACs (Anticoagulantes Orais Diretos):',
        '• Dabigatrana 150mg 2x/dia',
        '• Rivaroxabana 20mg 1x/dia',
        '• Apixabana 5mg 2x/dia',
        '• Edoxabana 60mg 1x/dia',
        '',
        'Warfarina:',
        '• Dose ajustada para INR 2,0-3,0',
        '• Monitorização regular do INR',
        '• Interações medicamentosas frequentes'
      ];
      
      const calculatedResults = {
        totalScore,
        maxScore: 9,
        scoreBreakdown,
        riskFactors,
        riskLevel,
        riskColor,
        riskDescription,
        annualStrokeRisk,
        anticoagulationRecommendation,
        clinicalRecommendations,
        additionalConsiderations,
        anticoagulantOptions
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
      sex: '',
      congestiveHeartFailure: false,
      hypertension: false,
      diabetes: false,
      strokeTIA: false,
      vascularDisease: false
    });
    setResults(null);
    setErrors({});
  }, []);

  /**
   * Copies calculation results to clipboard
   */
  const copyResults = useCallback(() => {
    if (!results) return;
    
    let resultText = `CHA₂DS₂-VASc Score - Resultados:\n`;
    resultText += `Score Total: ${results.totalScore}/${results.maxScore}\n`;
    resultText += `Risco: ${results.riskLevel}\n`;
    resultText += `Risco anual de AVC: ${results.annualStrokeRisk}\n`;
    resultText += `Anticoagulação: ${results.anticoagulationRecommendation}\n\n`;
    
    if (results.riskFactors.length > 0) {
      resultText += `Fatores de risco presentes:\n${results.riskFactors.map(f => `• ${f}`).join('\n')}\n\n`;
    }
    
    resultText += `Recomendações:\n${results.clinicalRecommendations.map(r => `• ${r}`).join('\n')}\n\n`;
    resultText += `Calculado em: ${new Date().toLocaleString('pt-BR')}`;
    
    navigator.clipboard.writeText(resultText);
    toast.success('Resultados copiados!');
  }, [results]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            CHA₂DS₂-VASc - Risco de AVC em Fibrilação Atrial
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Fatores de Risco</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Idade (anos) *</Label>
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
                  <Label>Sexo *</Label>
                  <Select value={inputs.sex} onValueChange={(value) => setInputs(prev => ({ ...prev, sex: value }))}>
                    <SelectTrigger className={errors.sex ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.sex && <p className="text-sm text-red-500">{errors.sex}</p>}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="chf"
                    checked={inputs.congestiveHeartFailure}
                    onCheckedChange={(checked) => setInputs(prev => ({ ...prev, congestiveHeartFailure: checked }))}
                  />
                  <Label htmlFor="chf">Insuficiência cardíaca congestiva (1 ponto)</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hypertension"
                    checked={inputs.hypertension}
                    onCheckedChange={(checked) => setInputs(prev => ({ ...prev, hypertension: checked }))}
                  />
                  <Label htmlFor="hypertension">Hipertensão arterial (1 ponto)</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="diabetes"
                    checked={inputs.diabetes}
                    onCheckedChange={(checked) => setInputs(prev => ({ ...prev, diabetes: checked }))}
                  />
                  <Label htmlFor="diabetes">Diabetes mellitus (1 ponto)</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="stroke"
                    checked={inputs.strokeTIA}
                    onCheckedChange={(checked) => setInputs(prev => ({ ...prev, strokeTIA: checked }))}
                  />
                  <Label htmlFor="stroke">AVC/AIT/Tromboembolismo prévio (2 pontos)</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vascular"
                    checked={inputs.vascularDisease}
                    onCheckedChange={(checked) => setInputs(prev => ({ ...prev, vascularDisease: checked }))}
                  />
                  <Label htmlFor="vascular">Doença vascular (1 ponto)</Label>
                </div>
              </div>
              
              <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-700/50">
                <h4 className="font-semibold text-blue-200 mb-2">Pontuação por Idade:</h4>
                <ul className="text-sm text-blue-300 space-y-1">
                  <li>• <strong>65-74 anos:</strong> 1 ponto</li>
                  <li>• <strong>≥ 75 anos:</strong> 2 pontos</li>
                </ul>
                <p className="text-xs text-blue-400 mt-2">Sexo feminino: +1 ponto</p>
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
                  {/* Score Display */}
                  <div className="p-4 rounded-lg border bg-blue-900/20 border-blue-700/50">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-200">{results.totalScore}</div>
                      <div className="text-sm text-blue-300">de {results.maxScore} pontos</div>
                      <div className="text-lg font-semibold text-blue-200 mt-2">{results.riskDescription}</div>
                    </div>
                  </div>
                  
                  {/* Risk Assessment */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border bg-gray-800/50 border-gray-600/50">
                      <div className="text-center">
                        <div className="font-medium text-gray-200">Nível de Risco</div>
                        <Badge className={results.riskColor}>
                          {results.riskLevel}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg border bg-amber-900/30 border-amber-700/50">
                      <div className="text-center">
                        <div className="font-medium text-amber-200">Risco Anual de AVC</div>
                        <div className="text-lg font-bold text-amber-300">{results.annualStrokeRisk}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Anticoagulation Recommendation */}
                  <div className={`p-3 rounded-lg border ${
                    results.totalScore >= 2 
                      ? 'bg-green-900/20 border-green-700/50' 
                      : results.totalScore === 1
                      ? 'bg-amber-900/20 border-amber-700/50'
                      : 'bg-gray-800/50 border-gray-600/50'
                  }`}>
                    <div className="text-center">
                      <div className={`font-medium ${
                        results.totalScore >= 2 
                          ? 'text-green-200' 
                          : results.totalScore === 1
                          ? 'text-amber-200'
                          : 'text-gray-200'
                      }`}>
                        Anticoagulação
                      </div>
                      <div className={`text-lg font-bold ${
                        results.totalScore >= 2 
                          ? 'text-green-300' 
                          : results.totalScore === 1
                          ? 'text-amber-300'
                          : 'text-gray-300'
                      }`}>
                        {results.anticoagulationRecommendation}
                      </div>
                    </div>
                  </div>
                  
                  {/* Risk Factors Present */}
                  {results.riskFactors.length > 0 && (
                    <div className="p-3 rounded-lg border bg-purple-900/20 border-purple-700/50">
                      <h4 className="font-semibold text-purple-200 mb-2">Fatores de Risco Presentes:</h4>
                      <ul className="text-sm text-purple-300 space-y-1">
                        {results.riskFactors.map((factor, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Clinical Recommendations */}
                  <div className={`p-3 rounded-lg border ${
                    results.totalScore >= 2 
                      ? 'bg-green-900/20 border-green-700/50' 
                      : results.totalScore === 1
                      ? 'bg-amber-900/20 border-amber-700/50'
                      : 'bg-gray-800/50 border-gray-600/50'
                  }`}>
                    <h4 className={`font-semibold mb-2 flex items-center gap-2 ${
                      results.totalScore >= 2 
                        ? 'text-green-200' 
                        : results.totalScore === 1
                        ? 'text-amber-200'
                        : 'text-gray-200'
                    }`}>
                      {results.totalScore >= 2 && <Heart className="h-4 w-4" />}
                      Recomendações Clínicas:
                    </h4>
                    <ul className={`text-sm space-y-1 ${
                      results.totalScore >= 2 
                        ? 'text-green-300' 
                        : results.totalScore === 1
                        ? 'text-amber-300'
                        : 'text-gray-300'
                    }`}>
                      {results.clinicalRecommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Additional Considerations */}
                  <div className="p-3 rounded-lg border bg-gray-800/50 border-gray-600/50">
                    <h4 className="font-semibold text-gray-200 mb-2">Considerações Adicionais:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {results.additionalConsiderations.map((consideration, index) => (
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
                  Preencha os campos obrigatórios e clique em "Calcular"
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Anticoagulant Options Card */}
        {results && results.totalScore >= 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Opções de Anticoagulação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results.anticoagulantOptions.map((option, index) => (
                  <div key={index} className={`text-sm ${
                    option.includes(':') ? 'font-semibold text-gray-200 mt-3' : 'text-gray-300'
                  }`}>
                    {option}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Reference Card */}
        <Card>
          <CardHeader>
            <CardTitle>Referências e Interpretação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">CHA₂DS₂-VASc Score:</h4>
                <p className="text-sm text-muted-foreground">
                  O CHA₂DS₂-VASc é o score recomendado pelas diretrizes internacionais para 
                  avaliação do risco de AVC em pacientes com fibrilação atrial não-valvar, 
                  orientando a decisão sobre anticoagulação oral.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Interpretação:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>0 pontos:</strong> Risco muito baixo - anticoagulação não recomendada</li>
                  <li>• <strong>1 ponto:</strong> Risco baixo - considerar anticoagulação</li>
                  <li>• <strong>≥2 pontos:</strong> Risco moderado a alto - anticoagulação recomendada</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Componentes do Score:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>C:</strong> Congestive heart failure (ICC)</li>
                  <li>• <strong>H:</strong> Hypertension (HAS)</li>
                  <li>• <strong>A₂:</strong> Age ≥75 years (2 pontos)</li>
                  <li>• <strong>D:</strong> Diabetes mellitus</li>
                  <li>• <strong>S₂:</strong> Stroke/TIA/Thromboembolism (2 pontos)</li>
                  <li>• <strong>V:</strong> Vascular disease (doença vascular)</li>
                  <li>• <strong>A:</strong> Age 65-74 years (1 ponto)</li>
                  <li>• <strong>Sc:</strong> Sex category (sexo feminino)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Referências:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Lip GY, et al. Chest. 2010;137(2):263-72</li>
                  <li>• ESC Guidelines 2020 - Atrial Fibrillation</li>
                  <li>• AHA/ACC/HRS Guidelines 2019</li>
                  <li>• Diretrizes Brasileiras de Fibrilação Atrial - SBC 2016</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default CHA2DS2VASc;
