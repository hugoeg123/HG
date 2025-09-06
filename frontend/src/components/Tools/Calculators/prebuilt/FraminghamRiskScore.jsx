import React, { useState, useMemo } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Switch } from '../../ui/switch';
import { Copy, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';

/**
 * FraminghamRiskScore Component - Modal para cálculo do Escore de Risco de Framingham
 * 
 * @component
 * @example
 * return (
 *   <FraminghamRiskScore open={true} onOpenChange={setOpen} />
 * )
 * 
 * Integrates with:
 * - components/ui/* para componentes de interface
 * - Calculators.jsx via propriedades open/onOpenChange
 * 
 * Features:
 * - Cálculo de risco cardiovascular em 10 anos
 * - Separação por sexo (masculino/feminino)
 * - Fatores de risco: idade, colesterol, HDL, PA, diabetes, tabagismo
 * - Interpretação automática do risco
 * - Valores copiáveis
 * 
 * IA prompt: Expandir com calculadora de idade vascular, risco em 30 anos, comparação com outros escores
 */

function formatNumber(n, digits = 0) {
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
    navigator.clipboard.writeText(`${value}${suffix}`);
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

export default function FraminghamRiskScore({ open, onOpenChange }) {
  const [inputs, setInputs] = useState({
    age: '',
    sex: 'male',
    totalCholesterol: '',
    hdlCholesterol: '',
    systolicBP: '',
    bpTreatment: false,
    diabetes: false,
    smoking: false
  });

  const updateInput = (key, value) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const results = useMemo(() => {
    const { age, sex, totalCholesterol, hdlCholesterol, systolicBP, bpTreatment, diabetes, smoking } = inputs;
    
    if (!age || !totalCholesterol || !hdlCholesterol || !systolicBP) {
      return null;
    }

    const ageNum = parseFloat(age);
    const tcNum = parseFloat(totalCholesterol);
    const hdlNum = parseFloat(hdlCholesterol);
    const sbpNum = parseFloat(systolicBP);

    if (ageNum < 30 || ageNum > 74) {
      return { error: "Idade deve estar entre 30 e 74 anos" };
    }

    let points = 0;

    if (sex === 'male') {
      // Pontos por idade - Homens
      if (ageNum >= 30 && ageNum <= 34) points += -9;
      else if (ageNum >= 35 && ageNum <= 39) points += -4;
      else if (ageNum >= 40 && ageNum <= 44) points += 0;
      else if (ageNum >= 45 && ageNum <= 49) points += 3;
      else if (ageNum >= 50 && ageNum <= 54) points += 6;
      else if (ageNum >= 55 && ageNum <= 59) points += 8;
      else if (ageNum >= 60 && ageNum <= 64) points += 10;
      else if (ageNum >= 65 && ageNum <= 69) points += 11;
      else if (ageNum >= 70 && ageNum <= 74) points += 12;

      // Pontos por colesterol total - Homens
      if (tcNum < 160) points += 0;
      else if (tcNum >= 160 && tcNum <= 199) {
        if (ageNum >= 30 && ageNum <= 39) points += 4;
        else if (ageNum >= 40 && ageNum <= 49) points += 3;
        else if (ageNum >= 50 && ageNum <= 59) points += 2;
        else if (ageNum >= 60 && ageNum <= 69) points += 1;
        else points += 0;
      }
      else if (tcNum >= 200 && tcNum <= 239) {
        if (ageNum >= 30 && ageNum <= 39) points += 7;
        else if (ageNum >= 40 && ageNum <= 49) points += 5;
        else if (ageNum >= 50 && ageNum <= 59) points += 3;
        else if (ageNum >= 60 && ageNum <= 69) points += 1;
        else points += 0;
      }
      else if (tcNum >= 240 && tcNum <= 279) {
        if (ageNum >= 30 && ageNum <= 39) points += 9;
        else if (ageNum >= 40 && ageNum <= 49) points += 6;
        else if (ageNum >= 50 && ageNum <= 59) points += 4;
        else if (ageNum >= 60 && ageNum <= 69) points += 2;
        else points += 1;
      }
      else if (tcNum >= 280) {
        if (ageNum >= 30 && ageNum <= 39) points += 11;
        else if (ageNum >= 40 && ageNum <= 49) points += 8;
        else if (ageNum >= 50 && ageNum <= 59) points += 5;
        else if (ageNum >= 60 && ageNum <= 69) points += 3;
        else points += 1;
      }

      // Pontos por HDL - Homens
      if (hdlNum >= 60) points += -1;
      else if (hdlNum >= 50 && hdlNum <= 59) points += 0;
      else if (hdlNum >= 40 && hdlNum <= 49) points += 1;
      else if (hdlNum < 40) points += 2;

      // Pontos por PA sistólica - Homens
      if (sbpNum < 120) points += 0;
      else if (sbpNum >= 120 && sbpNum <= 129) {
        points += bpTreatment ? 1 : 0;
      }
      else if (sbpNum >= 130 && sbpNum <= 139) {
        points += bpTreatment ? 2 : 1;
      }
      else if (sbpNum >= 140 && sbpNum <= 159) {
        points += bpTreatment ? 2 : 1;
      }
      else if (sbpNum >= 160) {
        points += bpTreatment ? 3 : 2;
      }

      // Diabetes e tabagismo - Homens
      if (diabetes) points += 2;
      if (smoking) {
        if (ageNum >= 30 && ageNum <= 39) points += 8;
        else if (ageNum >= 40 && ageNum <= 49) points += 5;
        else if (ageNum >= 50 && ageNum <= 59) points += 3;
        else if (ageNum >= 60 && ageNum <= 69) points += 1;
        else points += 1;
      }

      // Conversão pontos para risco - Homens
      const riskTable = {
        '-3': 1, '-2': 1, '-1': 1, '0': 1, '1': 1, '2': 1, '3': 1, '4': 1,
        '5': 2, '6': 2, '7': 3, '8': 4, '9': 5, '10': 6, '11': 8, '12': 10,
        '13': 12, '14': 16, '15': 20, '16': 25, '17': 30
      };
      
      let risk = riskTable[points.toString()] || (points < -3 ? 1 : 30);
      
      return {
        points,
        risk,
        interpretation: getRiskInterpretation(risk)
      };
    } else {
      // Cálculo para mulheres
      // Pontos por idade - Mulheres
      if (ageNum >= 30 && ageNum <= 34) points += -7;
      else if (ageNum >= 35 && ageNum <= 39) points += -3;
      else if (ageNum >= 40 && ageNum <= 44) points += 0;
      else if (ageNum >= 45 && ageNum <= 49) points += 3;
      else if (ageNum >= 50 && ageNum <= 54) points += 6;
      else if (ageNum >= 55 && ageNum <= 59) points += 8;
      else if (ageNum >= 60 && ageNum <= 64) points += 10;
      else if (ageNum >= 65 && ageNum <= 69) points += 12;
      else if (ageNum >= 70 && ageNum <= 74) points += 14;

      // Pontos por colesterol total - Mulheres
      if (tcNum < 160) points += 0;
      else if (tcNum >= 160 && tcNum <= 199) {
        if (ageNum >= 30 && ageNum <= 39) points += 4;
        else if (ageNum >= 40 && ageNum <= 49) points += 3;
        else if (ageNum >= 50 && ageNum <= 59) points += 2;
        else if (ageNum >= 60 && ageNum <= 69) points += 1;
        else points += 1;
      }
      else if (tcNum >= 200 && tcNum <= 239) {
        if (ageNum >= 30 && ageNum <= 39) points += 8;
        else if (ageNum >= 40 && ageNum <= 49) points += 6;
        else if (ageNum >= 50 && ageNum <= 59) points += 4;
        else if (ageNum >= 60 && ageNum <= 69) points += 2;
        else points += 1;
      }
      else if (tcNum >= 240 && tcNum <= 279) {
        if (ageNum >= 30 && ageNum <= 39) points += 11;
        else if (ageNum >= 40 && ageNum <= 49) points += 8;
        else if (ageNum >= 50 && ageNum <= 59) points += 5;
        else if (ageNum >= 60 && ageNum <= 69) points += 3;
        else points += 2;
      }
      else if (tcNum >= 280) {
        if (ageNum >= 30 && ageNum <= 39) points += 13;
        else if (ageNum >= 40 && ageNum <= 49) points += 10;
        else if (ageNum >= 50 && ageNum <= 59) points += 7;
        else if (ageNum >= 60 && ageNum <= 69) points += 4;
        else points += 2;
      }

      // Pontos por HDL - Mulheres
      if (hdlNum >= 60) points += -1;
      else if (hdlNum >= 50 && hdlNum <= 59) points += 0;
      else if (hdlNum >= 40 && hdlNum <= 49) points += 1;
      else if (hdlNum < 40) points += 2;

      // Pontos por PA sistólica - Mulheres
      if (sbpNum < 120) points += 0;
      else if (sbpNum >= 120 && sbpNum <= 129) {
        points += bpTreatment ? 3 : 1;
      }
      else if (sbpNum >= 130 && sbpNum <= 139) {
        points += bpTreatment ? 4 : 2;
      }
      else if (sbpNum >= 140 && sbpNum <= 159) {
        points += bpTreatment ? 5 : 3;
      }
      else if (sbpNum >= 160) {
        points += bpTreatment ? 6 : 4;
      }

      // Diabetes e tabagismo - Mulheres
      if (diabetes) points += 3;
      if (smoking) {
        if (ageNum >= 30 && ageNum <= 39) points += 9;
        else if (ageNum >= 40 && ageNum <= 49) points += 7;
        else if (ageNum >= 50 && ageNum <= 59) points += 4;
        else if (ageNum >= 60 && ageNum <= 69) points += 2;
        else points += 1;
      }

      // Conversão pontos para risco - Mulheres
      const riskTableFemale = {
        '-9': 1, '-8': 1, '-7': 1, '-6': 1, '-5': 1, '-4': 1, '-3': 1, '-2': 1, '-1': 1,
        '0': 1, '1': 1, '2': 1, '3': 1, '4': 1, '5': 2, '6': 2, '7': 3, '8': 4,
        '9': 5, '10': 6, '11': 8, '12': 11, '13': 14, '14': 17, '15': 22, '16': 27, '17': 30
      };
      
      let risk = riskTableFemale[points.toString()] || (points < -9 ? 1 : 30);
      
      return {
        points,
        risk,
        interpretation: getRiskInterpretation(risk)
      };
    }
  }, [inputs]);

  const getRiskInterpretation = (risk) => {
    if (risk < 10) {
      return {
        category: "Baixo Risco",
        color: "green",
        description: "Risco cardiovascular baixo em 10 anos",
        recommendation: "Manter estilo de vida saudável e controle dos fatores de risco"
      };
    } else if (risk >= 10 && risk < 20) {
      return {
        category: "Risco Intermediário",
        color: "yellow",
        description: "Risco cardiovascular intermediário em 10 anos",
        recommendation: "Considerar intervenção farmacológica e mudanças no estilo de vida"
      };
    } else {
      return {
        category: "Alto Risco",
        color: "red",
        description: "Risco cardiovascular alto em 10 anos",
        recommendation: "Intervenção farmacológica indicada e controle rigoroso dos fatores de risco"
      };
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      green: "bg-green-900/30 border-green-700/50 text-green-100",
      yellow: "bg-yellow-900/30 border-yellow-700/50 text-yellow-100",
      red: "bg-red-900/30 border-red-700/50 text-red-100"
    };
    return colors[color] || colors.green;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-theme-background border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            Escore de Risco de Framingham
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-5 w-5 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Calcula o risco de eventos cardiovasculares em 10 anos baseado nos fatores de risco tradicionais</p>
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
              <p>• Preencha todos os campos obrigatórios para calcular o risco cardiovascular</p>
              <p>• Válido para idades entre 30 e 74 anos</p>
              <p>• Baseado no estudo original de Framingham</p>
              <p>• Considera risco de infarto do miocárdio e morte coronariana</p>
            </CardContent>
          </Card>

          {/* Card Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inputs */}
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white text-lg">Dados do Paciente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age" className="text-gray-300">Idade (anos) *</Label>
                    <Input
                      id="age"
                      type="number"
                      min="30"
                      max="74"
                      value={inputs.age}
                      onChange={(e) => updateInput('age', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="30-74"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sex" className="text-gray-300">Sexo *</Label>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalCholesterol" className="text-gray-300">Colesterol Total (mg/dL) *</Label>
                    <Input
                      id="totalCholesterol"
                      type="number"
                      min="100"
                      max="400"
                      value={inputs.totalCholesterol}
                      onChange={(e) => updateInput('totalCholesterol', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="150-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hdlCholesterol" className="text-gray-300">HDL Colesterol (mg/dL) *</Label>
                    <Input
                      id="hdlCholesterol"
                      type="number"
                      min="20"
                      max="100"
                      value={inputs.hdlCholesterol}
                      onChange={(e) => updateInput('hdlCholesterol', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="30-80"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="systolicBP" className="text-gray-300">Pressão Arterial Sistólica (mmHg) *</Label>
                  <Input
                    id="systolicBP"
                    type="number"
                    min="90"
                    max="200"
                    value={inputs.systolicBP}
                    onChange={(e) => updateInput('systolicBP', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="100-180"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bpTreatment" className="text-gray-300">Em tratamento para hipertensão</Label>
                    <Switch
                      id="bpTreatment"
                      checked={inputs.bpTreatment}
                      onCheckedChange={(checked) => updateInput('bpTreatment', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="diabetes" className="text-gray-300">Diabetes mellitus</Label>
                    <Switch
                      id="diabetes"
                      checked={inputs.diabetes}
                      onCheckedChange={(checked) => updateInput('diabetes', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="smoking" className="text-gray-300">Tabagismo atual</Label>
                    <Switch
                      id="smoking"
                      checked={inputs.smoking}
                      onCheckedChange={(checked) => updateInput('smoking', checked)}
                    />
                  </div>
                </div>
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
                      label="Pontuação Total"
                      value={results.points}
                      suffix=" pontos"
                    />
                    <CopyableValue
                      label="Risco em 10 anos"
                      value={results.risk}
                      suffix="%"
                    />
                    
                    <div className={`p-4 rounded-lg border ${getColorClasses(results.interpretation.color)}`}>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-lg">{results.interpretation.category}</h4>
                        <p className="text-sm opacity-90">{results.interpretation.description}</p>
                        <p className="text-sm font-medium">{results.interpretation.recommendation}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-gray-700/50 border border-gray-600 rounded-lg">
                    <p className="text-gray-300 text-sm">Preencha todos os campos obrigatórios (*) para ver os resultados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Fórmula e Referências */}
          <Card className="bg-gray-800/50 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white text-lg">Fórmula e Interpretação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300 text-sm">
              <div>
                <h4 className="font-semibold text-white mb-2">Sistema de Pontuação:</h4>
                <p>• Pontos atribuídos por: idade, colesterol total, HDL, pressão arterial, diabetes, tabagismo</p>
                <p>• Pontuação diferenciada por sexo</p>
                <p>• Conversão da pontuação total em percentual de risco</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Interpretação:</h4>
                <p>• <span className="text-green-400">Baixo risco</span>: &lt;10% - Prevenção primária com mudanças no estilo de vida</p>
                <p>• <span className="text-yellow-400">Risco intermediário</span>: 10-19% - Considerar terapia farmacológica</p>
                <p>• <span className="text-red-400">Alto risco</span>: ≥20% - Terapia farmacológica indicada</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Referências:</h4>
                <p>• Wilson PWF, et al. Circulation. 1998;97:1837-1847</p>
                <p>• ATP III Guidelines (NCEP, 2001)</p>
                <p>• D'Agostino RB, et al. Circulation. 2008;117:743-753</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
