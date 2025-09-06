import React, { useState } from 'react';
import { Calculator, X, Copy, RotateCcw, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { Badge } from '../../../ui/badge';

/**
 * CKD-EPI 2021 GFR Calculator (without race correction)
 * 
 * Integrates with:
 * - Calculators.jsx for modal display
 * - calculatorStore.js for seeded calculator data
 * - Mobile optimization for touch interfaces
 * 
 * Medical validation:
 * - Current standard for CKD classification
 * - Removes controversial racial correction
 * - More accurate than Cockcroft-Gault
 */
const CKDEPI2021 = ({ onClose }) => {
  const [inputs, setInputs] = useState({
    creatinine: '',
    age: '',
    sex: 'male'
  });
  const [result, setResult] = useState(null);

  const handleInputChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    // Clear result when inputs change
    if (result) setResult(null);
  };

  const validateInputs = () => {
    const errors = [];
    const warnings = [];

    if (!inputs.creatinine || inputs.creatinine < 0.1 || inputs.creatinine > 20) {
      errors.push('Creatinina deve estar entre 0.1 e 20 mg/dL');
    }

    if (!inputs.age || inputs.age < 18 || inputs.age > 120) {
      errors.push('Idade deve estar entre 18 e 120 anos');
    }

    // Medical warnings
    if (inputs.creatinine > 3) {
      warnings.push('Creatinina muito elevada - verificar se está correta');
    }

    if (inputs.age > 90) {
      warnings.push('Validação limitada em idades muito avançadas');
    }

    return { errors, warnings };
  };

  const calculate = () => {
    const validation = validateInputs();
    
    if (validation.errors.length > 0) {
      toast.error(validation.errors[0]);
      return;
    }

    const creatinine = parseFloat(inputs.creatinine);
    const age = parseFloat(inputs.age);
    const isFemale = inputs.sex === 'female';

    // CKD-EPI 2021 formula (without race)
    let gfr;
    
    if (isFemale) {
      // Female formula
      const kappa = 0.7;
      const alpha = -0.241;
      const minTerm = Math.min(creatinine / kappa, 1) ** alpha;
      const maxTerm = Math.max(creatinine / kappa, 1) ** (-1.200);
      gfr = 142 * minTerm * maxTerm * (0.9938 ** age);
    } else {
      // Male formula
      const kappa = 0.9;
      const alpha = -0.302;
      const minTerm = Math.min(creatinine / kappa, 1) ** alpha;
      const maxTerm = Math.max(creatinine / kappa, 1) ** (-1.200);
      gfr = 142 * minTerm * maxTerm * (0.9938 ** age);
    }

    // Round to nearest integer as per guidelines
    gfr = Math.round(gfr);

    // CKD Stage Classification
    let stage = '';
    let stageColor = '';
    let description = '';
    
    if (gfr >= 90) {
      stage = 'G1';
      description = 'Normal ou elevada';
      stageColor = 'text-green-200';
    } else if (gfr >= 60) {
      stage = 'G2';
      description = 'Levemente diminuída';
      stageColor = 'text-yellow-200';
    } else if (gfr >= 45) {
      stage = 'G3a';
      description = 'Moderadamente diminuída';
      stageColor = 'text-orange-200';
    } else if (gfr >= 30) {
      stage = 'G3b';
      description = 'Moderada a severamente diminuída';
      stageColor = 'text-red-200';
    } else if (gfr >= 15) {
      stage = 'G4';
      description = 'Severamente diminuída';
      stageColor = 'text-red-200';
    } else {
      stage = 'G5';
      description = 'Falência renal';
      stageColor = 'text-red-200';
    }

    // Reporting recommendation
    let reportValue = gfr;
    let reportNote = '';
    
    if (gfr > 60) {
      reportValue = '>60';
      reportNote = 'Reportar como >60 se não houver outros sinais de DRC';
    }

    setResult({
      gfr: gfr,
      reportValue: reportValue,
      reportNote: reportNote,
      stage,
      description,
      stageColor,
      warnings: validation.warnings
    });

    // Show warnings if any
    validation.warnings.forEach(warning => {
      toast.warning(warning);
    });
  };

  const copyResult = () => {
    if (!result) return;
    
    const text = `TFG CKD-EPI 2021 (sem correção racial)\n` +
                `Creatinina: ${inputs.creatinine} mg/dL\n` +
                `Idade: ${inputs.age} anos\n` +
                `Sexo: ${inputs.sex === 'male' ? 'Masculino' : 'Feminino'}\n\n` +
                `TFG: ${result.gfr} mL/min/1.73m²\n` +
                `Estágio: ${result.stage} - ${result.description}\n` +
                (result.reportNote ? `\nNota: ${result.reportNote}` : '');
    
    navigator.clipboard.writeText(text);
    toast.success('Resultado copiado!');
  };

  const clearInputs = () => {
    setInputs({
      creatinine: '',
      age: '',
      sex: 'male'
    });
    setResult(null);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-200" />
            TFG CKD-EPI 2021
          </DialogTitle>
          <DialogDescription>
            Calculadora de Taxa de Filtração Glomerular sem correção racial
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="space-y-4 pt-6">
            {/* Formula Info */}
            <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-700/50">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-200 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-200">
                  <p className="font-medium mb-1">CKD-EPI 2021 (sem correção racial)</p>
                  <p className="text-xs text-blue-300">
                    Padrão atual para classificação de DRC. Mais precisa que Cockcroft-Gault.
                  </p>
                </div>
              </div>
            </div>

            {/* Input Fields */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="creatinine">
                  Creatinina sérica (mg/dL)
                </Label>
                <Input
                  id="creatinine"
                  type="number"
                  value={inputs.creatinine}
                  onChange={(e) => handleInputChange('creatinine', e.target.value)}
                  placeholder="Ex: 1.2"
                  min="0.1"
                  max="20"
                  step="0.1"
                />
              </div>

              <div>
                <Label htmlFor="age">
                  Idade (anos)
                </Label>
                <Input
                  id="age"
                  type="number"
                  value={inputs.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Ex: 65"
                  min="18"
                  max="120"
                />
              </div>

              <div>
                <Label htmlFor="sex">
                  Sexo
                </Label>
                <Select value={inputs.sex} onValueChange={(value) => handleInputChange('sex', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Calculate Button */}
            <Button
              onClick={calculate}
              disabled={!inputs.creatinine || !inputs.age}
              className="w-full"
            >
              Calcular TFG
            </Button>

            {/* Result */}
            {result && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">
                    <div className="text-2xl font-bold text-gray-200">
                      {result.reportValue} <span className="text-lg font-normal">mL/min/1.73m²</span>
                    </div>
                    <Badge variant="outline" className={`mt-2 bg-blue-900/20 text-blue-200 border-blue-400 ${result.stageColor}`}>
                      {result.stage} - {result.description}
                    </Badge>
                    {result.gfr !== result.reportValue && (
                      <div className="text-xs text-gray-300 mt-1">
                        (Valor calculado: {result.gfr} mL/min/1.73m²)
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.reportNote && (
                    <div className="bg-blue-900/20 p-2 rounded border-l-4 border-blue-400">
                      <div className="text-xs text-blue-200">
                        <strong>Nota:</strong> {result.reportNote}
                      </div>
                    </div>
                  )}

                  {result.warnings.length > 0 && (
                    <div className="bg-yellow-900/20 p-2 rounded border-l-4 border-yellow-400">
                      <div className="text-xs text-yellow-200">
                        <strong>Atenção:</strong>
                        <ul className="mt-1 list-disc list-inside">
                          {result.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-300">
                    <p><strong>Referência:</strong> Inker et al, NEJM 2021</p>
                    <p><strong>Aplicação:</strong> Padrão atual para classificação de DRC</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={clearInputs}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpar
              </Button>
              
              {result && (
                <Button
                  onClick={copyResult}
                  variant="outline"
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default CKDEPI2021;
