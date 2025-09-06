import React, { useState, useMemo } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Copy, Info, Beaker } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import { toast } from 'sonner';

/**
 * MeasuredCreatinineClearance Component - Modal para cálculo do clearance de creatinina medido
 * 
 * @component
 * @example
 * return (
 *   <MeasuredCreatinineClearance open={true} onOpenChange={setOpen} />
 * )
 * 
 * Integrates with:
 * - components/ui/* para componentes de interface
 * - Calculators.jsx via propriedades open/onOpenChange
 * - sonner para notificações toast
 * 
 * Features:
 * - Cálculo do clearance de creatinina medido (coleta 24h)
 * - Normalização por superfície corporal
 * - Interpretação da função renal
 * - Comparação com valores estimados
 * - Valores copiáveis
 * 
 * IA prompt: Expandir com correção por coleta incompleta, comparação com outros métodos, histórico de clearances
 */

function formatNumber(n, digits = 1) {
  if (!isFinite(n)) return "--";
  try {
    return new Intl.NumberFormat("pt-BR", { 
      maximumFractionDigits: digits, 
      minimumFractionDigits: digits 
    }).format(n);
  } catch {
    return String(n.toFixed ? n.toFixed(digits) : n);
  }
}

function CopyableValue({ label, value, suffix = "", className = "" }) {
  const copyToClipboard = () => {
    const textToCopy = `${value}${suffix}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast.success(`${label} copiado: ${textToCopy}`);
    }).catch(() => {
      toast.error('Erro ao copiar valor');
    });
  };

  return (
    <div className={`flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-600 ${className}`}>
      <span className="text-gray-300 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-white font-medium">
          {value}{suffix}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="h-6 w-6 p-0 hover:bg-gray-700"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export default function MeasuredCreatinineClearance({ open, onOpenChange }) {
  const [inputs, setInputs] = useState({
    serumCreatinine: '',
    urineCreatinine: '',
    urineVolume: '',
    collectionTime: '24',
    weight: '',
    height: '',
    age: '',
    sex: 'male'
  });

  const updateInput = (key, value) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const results = useMemo(() => {
    const { serumCreatinine, urineCreatinine, urineVolume, collectionTime, weight, height, age, sex } = inputs;
    
    if (!serumCreatinine || !urineCreatinine || !urineVolume || !collectionTime) {
      return null;
    }

    const serumCrNum = parseFloat(serumCreatinine);
    const urineCrNum = parseFloat(urineCreatinine);
    const urineVolNum = parseFloat(urineVolume);
    const collectionTimeNum = parseFloat(collectionTime);
    const weightNum = weight ? parseFloat(weight) : null;
    const heightNum = height ? parseFloat(height) : null;
    const ageNum = age ? parseFloat(age) : null;

    if (serumCrNum <= 0 || urineCrNum <= 0 || urineVolNum <= 0 || collectionTimeNum <= 0) {
      return { error: "Todos os valores devem ser positivos" };
    }

    if (collectionTimeNum < 12 || collectionTimeNum > 48) {
      return { error: "Tempo de coleta deve estar entre 12 e 48 horas" };
    }

    // Fórmula do clearance de creatinina medido
    // ClCr = (Cr_urina × Volume_urina) / (Cr_soro × Tempo_coleta_min)
    // Resultado em mL/min
    
    const collectionTimeMin = collectionTimeNum * 60; // converter horas para minutos
    const clearance = (urineCrNum * urineVolNum) / (serumCrNum * collectionTimeMin);

    // Cálculo da superfície corporal (BSA) se peso e altura disponíveis
    let bsa = null;
    let clearanceNormalized = null;
    
    if (weightNum && heightNum) {
      // Fórmula de Du Bois: BSA = 0.007184 × peso^0.425 × altura^0.725
      bsa = 0.007184 * Math.pow(weightNum, 0.425) * Math.pow(heightNum, 0.725);
      clearanceNormalized = clearance * (1.73 / bsa); // Normalizar para 1.73 m²
    }

    // Estimativa por Cockcroft-Gault para comparação (se dados disponíveis)
    let cockcroftGault = null;
    if (ageNum && weightNum && sex) {
      cockcroftGault = ((140 - ageNum) * weightNum) / (72 * serumCrNum);
      if (sex === 'female') {
        cockcroftGault *= 0.85;
      }
    }

    // Interpretação da função renal
    const interpretation = getRenalFunctionInterpretation(clearanceNormalized || clearance, ageNum);

    // Avaliação da adequação da coleta
    const collectionAssessment = assessCollection(collectionTimeNum, urineVolNum);

    return {
      clearance: formatNumber(clearance, 1),
      clearanceNormalized: clearanceNormalized ? formatNumber(clearanceNormalized, 1) : null,
      bsa: bsa ? formatNumber(bsa, 2) : null,
      cockcroftGault: cockcroftGault ? formatNumber(cockcroftGault, 1) : null,
      interpretation,
      collectionAssessment
    };
  }, [inputs]);

  const getRenalFunctionInterpretation = (clearance, age) => {
    // Valores normais ajustados por idade
    let normalMin = 90;
    if (age) {
      if (age > 40) {
        // Declínio de ~1 mL/min/1.73m² por ano após os 40
        normalMin = 90 - (age - 40);
      }
    }

    if (clearance >= normalMin) {
      return {
        category: "Função Renal Normal",
        color: "green",
        stage: "G1",
        description: "Função renal normal ou alta",
        recommendation: "Manter acompanhamento de rotina"
      };
    } else if (clearance >= 60) {
      return {
        category: "Disfunção Renal Leve",
        color: "yellow",
        stage: "G2",
        description: "Redução leve da função renal",
        recommendation: "Monitorização anual, investigar causas"
      };
    } else if (clearance >= 45) {
      return {
        category: "Disfunção Renal Leve-Moderada",
        color: "orange",
        stage: "G3a",
        description: "Redução leve a moderada da função renal",
        recommendation: "Avaliação nefrológica, controle de fatores de risco"
      };
    } else if (clearance >= 30) {
      return {
        category: "Disfunção Renal Moderada-Grave",
        color: "orange",
        stage: "G3b",
        description: "Redução moderada a grave da função renal",
        recommendation: "Acompanhamento nefrológico, preparar para TRS"
      };
    } else if (clearance >= 15) {
      return {
        category: "Disfunção Renal Grave",
        color: "red",
        stage: "G4",
        description: "Redução grave da função renal",
        recommendation: "Preparação para terapia renal substitutiva"
      };
    } else {
      return {
        category: "Falência Renal",
        color: "red",
        stage: "G5",
        description: "Falência renal",
        recommendation: "Terapia renal substitutiva indicada"
      };
    }
  };

  const assessCollection = (collectionTime, urineVolume) => {
    const expectedVolume24h = 1200; // Volume mínimo esperado em 24h (mL)
    const expectedVolumeForTime = (expectedVolume24h / 24) * collectionTime;
    
    if (urineVolume < expectedVolumeForTime * 0.7) {
      return {
        category: "Coleta Possivelmente Inadequada",
        color: "red",
        description: "Volume de urina abaixo do esperado",
        recommendation: "Repetir coleta com orientações reforçadas"
      };
    } else if (urineVolume < expectedVolumeForTime * 0.9) {
      return {
        category: "Coleta Limítrofe",
        color: "yellow",
        description: "Volume de urina no limite inferior",
        recommendation: "Considerar repetir se resultado discrepante"
      };
    } else {
      return {
        category: "Coleta Adequada",
        color: "green",
        description: "Volume de urina dentro do esperado",
        recommendation: "Resultado confiável"
      };
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      green: "bg-green-900/30 border-green-700/50 text-green-100",
      yellow: "bg-yellow-900/30 border-yellow-700/50 text-yellow-100",
      orange: "bg-orange-900/30 border-orange-700/50 text-orange-100",
      red: "bg-red-900/30 border-red-700/50 text-red-100"
    };
    return colors[color] || colors.green;
  };

  const clearForm = () => {
    setInputs({
      serumCreatinine: '',
      urineCreatinine: '',
      urineVolume: '',
      collectionTime: '24',
      weight: '',
      height: '',
      age: '',
      sex: 'male'
    });
    toast.success('Formulário limpo');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-theme-background border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <Beaker className="h-6 w-6" />
            Clearance de Creatinina Medido
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-5 w-5 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Calcula o clearance de creatinina baseado na coleta de urina de 24 horas</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* Card de Instruções */}
          <Card className="bg-blue-900/20 border-blue-700/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-100 text-base">Instruções</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-200 text-sm space-y-2">
              <p>• Preencha os dados da coleta de urina (preferencialmente 24 horas)</p>
              <p>• Creatinina sérica deve ser coletada durante o período de coleta</p>
              <p>• Peso e altura são opcionais para normalização por superfície corporal</p>
              <p>• Resultado mais preciso que fórmulas estimativas em situações especiais</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inputs */}
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white text-lg">Dados Laboratoriais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="serumCreatinine" className="text-gray-300">Creatinina Sérica (mg/dL) *</Label>
                    <Input
                      id="serumCreatinine"
                      type="number"
                      step="0.01"
                      min="0.1"
                      max="20"
                      value={inputs.serumCreatinine}
                      onChange={(e) => updateInput('serumCreatinine', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Ex: 1.2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="urineCreatinine" className="text-gray-300">Creatinina Urinária (mg/dL) *</Label>
                    <Input
                      id="urineCreatinine"
                      type="number"
                      step="1"
                      min="1"
                      max="500"
                      value={inputs.urineCreatinine}
                      onChange={(e) => updateInput('urineCreatinine', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Ex: 80"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="urineVolume" className="text-gray-300">Volume Urinário (mL) *</Label>
                    <Input
                      id="urineVolume"
                      type="number"
                      min="100"
                      max="5000"
                      value={inputs.urineVolume}
                      onChange={(e) => updateInput('urineVolume', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Ex: 1500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="collectionTime" className="text-gray-300">Tempo de Coleta (horas) *</Label>
                    <Input
                      id="collectionTime"
                      type="number"
                      min="12"
                      max="48"
                      value={inputs.collectionTime}
                      onChange={(e) => updateInput('collectionTime', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="24"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-600">
                  <h4 className="text-white font-medium">Dados do Paciente (Opcional)</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="weight" className="text-gray-300">Peso (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        min="20"
                        max="200"
                        value={inputs.weight}
                        onChange={(e) => updateInput('weight', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="Ex: 70"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height" className="text-gray-300">Altura (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        min="100"
                        max="220"
                        value={inputs.height}
                        onChange={(e) => updateInput('height', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="Ex: 170"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="age" className="text-gray-300">Idade (anos)</Label>
                      <Input
                        id="age"
                        type="number"
                        min="18"
                        max="120"
                        value={inputs.age}
                        onChange={(e) => updateInput('age', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="Ex: 45"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sex" className="text-gray-300">Sexo</Label>
                      <Select value={inputs.sex} onValueChange={(value) => updateInput('sex', value)}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Masculino</SelectItem>
                          <SelectItem value="female">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={clearForm}
                  variant="outline" 
                  className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  Limpar
                </Button>
              </CardContent>
            </Card>

            {/* Resultados */}
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white text-lg">Resultados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {results?.error ? (
                  <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-lg">
                    <p className="text-red-200 text-sm">{results.error}</p>
                  </div>
                ) : results ? (
                  <>
                    <CopyableValue
                      label="Clearance de Creatinina"
                      value={results.clearance}
                      suffix=" mL/min"
                    />
                    
                    {results.clearanceNormalized && (
                      <CopyableValue
                        label="Clearance Normalizado"
                        value={results.clearanceNormalized}
                        suffix=" mL/min/1.73m²"
                      />
                    )}

                    {results.bsa && (
                      <CopyableValue
                        label="Superfície Corporal"
                        value={results.bsa}
                        suffix=" m²"
                      />
                    )}

                    {results.cockcroftGault && (
                      <CopyableValue
                        label="Cockcroft-Gault (comparação)"
                        value={results.cockcroftGault}
                        suffix=" mL/min"
                      />
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-gray-700/50 border border-gray-600 rounded-lg">
                    <p className="text-gray-300 text-sm">Preencha os campos obrigatórios (*) para calcular o clearance</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Interpretações */}
          {(results?.interpretation || results?.collectionAssessment) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {results.interpretation && (
                <Card className="bg-gray-800/50 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Interpretação da Função Renal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`p-4 rounded-lg border ${getColorClasses(results.interpretation.color)}`}>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-lg">{results.interpretation.category}</h4>
                          <span className="text-sm font-medium">{results.interpretation.stage}</span>
                        </div>
                        <p className="text-sm opacity-90">{results.interpretation.description}</p>
                        <p className="text-sm font-medium">{results.interpretation.recommendation}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {results.collectionAssessment && (
                <Card className="bg-gray-800/50 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Avaliação da Coleta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`p-4 rounded-lg border ${getColorClasses(results.collectionAssessment.color)}`}>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-lg">{results.collectionAssessment.category}</h4>
                        <p className="text-sm opacity-90">{results.collectionAssessment.description}</p>
                        <p className="text-sm font-medium">{results.collectionAssessment.recommendation}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Fórmulas e Referências */}
          <Card className="bg-gray-800/50 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white text-lg">Fórmulas e Interpretação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">Fórmulas:</h4>
                  <div className="space-y-1 text-xs">
                    <p>• ClCr = (Cr_urina × Vol_urina) / (Cr_soro × Tempo_min)</p>
                    <p>• BSA = 0.007184 × peso^0.425 × altura^0.725</p>
                    <p>• ClCr normalizado = ClCr × (1.73 / BSA)</p>
                    <p>• Cockcroft-Gault = ((140-idade) × peso) / (72 × Cr_soro)</p>
                    <p>• Se mulher: × 0.85</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Classificação (mL/min/1.73m²):</h4>
                  <div className="space-y-1 text-xs">
                    <p>• <span className="text-green-400">G1 Normal</span>: ≥90</p>
                    <p>• <span className="text-yellow-400">G2 Leve</span>: 60-89</p>
                    <p>• <span className="text-orange-400">G3a Leve-Moderada</span>: 45-59</p>
                    <p>• <span className="text-orange-400">G3b Moderada-Grave</span>: 30-44</p>
                    <p>• <span className="text-red-400">G4 Grave</span>: 15-29</p>
                    <p>• <span className="text-red-400">G5 Falência</span>: &lt;15</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-600">
                <h4 className="font-semibold text-white mb-2">Considerações Clínicas:</h4>
                <div className="space-y-1 text-xs">
                  <p>• Clearance medido é mais preciso que fórmulas estimativas</p>
                  <p>• Coleta inadequada pode subestimar o clearance</p>
                  <p>• Volume esperado: ~20-25 mL/kg/dia ou 1200-2000 mL/24h</p>
                  <p>• Normalização por BSA permite comparação entre pacientes</p>
                  <p>• Função renal declina ~1 mL/min/1.73m² por ano após os 40 anos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
