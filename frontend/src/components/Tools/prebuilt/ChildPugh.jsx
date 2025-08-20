import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator, Copy, RotateCcw, Info } from 'lucide-react';
import { toast } from 'sonner';
import CopyableValue from '@/components/ui/CopyableValue.jsx';

/**
 * Child-Pugh Score Calculator Component
 * 
 * Calculates Child-Pugh score for liver cirrhosis severity classification.
 * Uses 5 parameters: bilirubin, albumin, INR, ascites, and encephalopathy.
 * Classifies patients into Child-Pugh classes A, B, or C.
 * 
 * @param {boolean} open - Dialog open state
 * @param {function} onOpenChange - Dialog state change handler
 * 
 * Integrates with:
 * - components/ui/* for interface components
 * - Calculators.jsx via open/onOpenChange props
 * 
 * Features:
 * - Real-time calculation with validation
 * - Clinical interpretation with color-coded results
 * - Copyable results with CopyableValue component
 * - Clear form functionality
 * 
 * IA prompt: Extend with MELD score comparison and transplant eligibility assessment
 */
function ChildPugh({ open, onOpenChange }) {
  const [inputs, setInputs] = useState({
    bilirubin: '',
    albumin: '',
    inr: '',
    ascites: '',
    encephalopathy: ''
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

    if (!inputs.bilirubin || inputs.bilirubin < 0 || inputs.bilirubin > 50) {
      errors.push('Bilirrubina deve estar entre 0 e 50 mg/dL');
    }

    if (!inputs.albumin || inputs.albumin < 1 || inputs.albumin > 6) {
      errors.push('Albumina deve estar entre 1 e 6 g/dL');
    }

    if (!inputs.inr || inputs.inr < 0.5 || inputs.inr > 10) {
      errors.push('INR deve estar entre 0.5 e 10');
    }

    if (!inputs.ascites || !['1', '2', '3'].includes(inputs.ascites)) {
      errors.push('Selecione o grau de ascite (1-3)');
    }

    if (!inputs.encephalopathy || !['1', '2', '3'].includes(inputs.encephalopathy)) {
      errors.push('Selecione o grau de encefalopatia (1-3)');
    }

    // Clinical warnings
    if (inputs.bilirubin > 10) {
      warnings.push('Bilirrubina muito elevada - considerar causas obstrutivas');
    }

    if (inputs.albumin < 2.5) {
      warnings.push('Hipoalbuminemia severa - avaliar estado nutricional');
    }

    if (inputs.inr > 3) {
      warnings.push('INR muito elevado - risco de sangramento aumentado');
    }

    return { errors, warnings };
  };

  const calculateChildPugh = () => {
    const validation = validateInputs();
    
    if (validation.errors.length > 0) {
      toast.error(validation.errors[0]);
      return;
    }

    const bilirubin = parseFloat(inputs.bilirubin);
    const albumin = parseFloat(inputs.albumin);
    const inr = parseFloat(inputs.inr);
    const ascites = parseInt(inputs.ascites);
    const encephalopathy = parseInt(inputs.encephalopathy);

    // Calculate points for each parameter
    let bilirubinPoints = 1;
    if (bilirubin > 2 && bilirubin <= 3) bilirubinPoints = 2;
    else if (bilirubin > 3) bilirubinPoints = 3;

    let albuminPoints = 1;
    if (albumin >= 2.8 && albumin < 3.5) albuminPoints = 2;
    else if (albumin < 2.8) albuminPoints = 3;

    let inrPoints = 1;
    if (inr > 1.7 && inr <= 2.3) inrPoints = 2;
    else if (inr > 2.3) inrPoints = 3;

    const ascitesPoints = ascites;
    const encephalopathyPoints = encephalopathy;

    const totalScore = bilirubinPoints + albuminPoints + inrPoints + ascitesPoints + encephalopathyPoints;

    // Determine Child-Pugh class
    let childClass, severity, color, prognosis, oneYearSurvival;
    
    if (totalScore <= 6) {
      childClass = 'A';
      severity = 'Compensada';
      color = 'text-green-600';
      prognosis = 'Bom prognóstico';
      oneYearSurvival = '95-100%';
    } else if (totalScore <= 9) {
      childClass = 'B';
      severity = 'Descompensada moderada';
      color = 'text-yellow-600';
      prognosis = 'Prognóstico intermediário';
      oneYearSurvival = '80-85%';
    } else {
      childClass = 'C';
      severity = 'Descompensada severa';
      color = 'text-red-600';
      prognosis = 'Prognóstico reservado';
      oneYearSurvival = '45-50%';
    }

    setResult({
      totalScore,
      childClass,
      severity,
      color,
      prognosis,
      oneYearSurvival,
      breakdown: {
        bilirubin: bilirubinPoints,
        albumin: albuminPoints,
        inr: inrPoints,
        ascites: ascitesPoints,
        encephalopathy: encephalopathyPoints
      },
      warnings: validation.warnings
    });

    // Show warnings if any
    validation.warnings.forEach(warning => {
      toast.warning(warning);
    });
  };

  const clearForm = () => {
    setInputs({
      bilirubin: '',
      albumin: '',
      inr: '',
      ascites: '',
      encephalopathy: ''
    });
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-theme-background border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <Calculator className="h-6 w-6" />
            Escore Child-Pugh
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-6">
          {/* Instructions Card */}
          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Info className="h-4 w-4" />
                Como usar
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-300 space-y-2">
              <p>O escore Child-Pugh classifica a gravidade da cirrose hepática em três classes:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Classe A (5-6 pontos):</strong> Cirrose compensada - bom prognóstico</li>
                <li><strong>Classe B (7-9 pontos):</strong> Cirrose descompensada moderada</li>
                <li><strong>Classe C (10-15 pontos):</strong> Cirrose descompensada severa</li>
              </ul>
              <p className="text-yellow-400 mt-2">
                <strong>Importante:</strong> Usado para prognóstico e avaliação para transplante hepático.
              </p>
            </CardContent>
          </Card>

          {/* Main Calculator Card */}
          <Card className="border-gray-700 bg-gray-800/50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Laboratory Parameters */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Parâmetros Laboratoriais</h3>
                  
                  <div>
                    <Label className="text-gray-300">Bilirrubina Total (mg/dL)</Label>
                    <Input
                      type="number"
                      value={inputs.bilirubin}
                      onChange={(e) => handleInputChange('bilirubin', e.target.value)}
                      className="bg-theme-surface border-gray-600 text-white"
                      placeholder="Ex: 2.5"
                      min="0"
                      max="50"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">Albumina Sérica (g/dL)</Label>
                    <Input
                      type="number"
                      value={inputs.albumin}
                      onChange={(e) => handleInputChange('albumin', e.target.value)}
                      className="bg-theme-surface border-gray-600 text-white"
                      placeholder="Ex: 3.2"
                      min="1"
                      max="6"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">INR (Razão Internacional Normalizada)</Label>
                    <Input
                      type="number"
                      value={inputs.inr}
                      onChange={(e) => handleInputChange('inr', e.target.value)}
                      className="bg-theme-surface border-gray-600 text-white"
                      placeholder="Ex: 1.8"
                      min="0.5"
                      max="10"
                      step="0.1"
                    />
                  </div>
                </div>

                {/* Clinical Parameters */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Parâmetros Clínicos</h3>
                  
                  <div>
                    <Label className="text-gray-300">Ascite</Label>
                    <select
                      value={inputs.ascites}
                      onChange={(e) => handleInputChange('ascites', e.target.value)}
                      className="w-full px-3 py-2 bg-theme-surface border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione...</option>
                      <option value="1">1 - Ausente</option>
                      <option value="2">2 - Leve/moderada (controlada com diuréticos)</option>
                      <option value="3">3 - Tensa (refratária)</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-gray-300">Encefalopatia Hepática</Label>
                    <select
                      value={inputs.encephalopathy}
                      onChange={(e) => handleInputChange('encephalopathy', e.target.value)}
                      className="w-full px-3 py-2 bg-theme-surface border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione...</option>
                      <option value="1">1 - Ausente</option>
                      <option value="2">2 - Grau I-II (leve/moderada)</option>
                      <option value="3">3 - Grau III-IV (severa)</option>
                    </select>
                  </div>

                  {/* Formula Display */}
                  <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-300">Pontuação:</span>
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                      <p>• Bilirrubina: &lt;2 (1pt), 2-3 (2pts), &gt;3 (3pts)</p>
                      <p>• Albumina: &gt;3.5 (1pt), 2.8-3.5 (2pts), &lt;2.8 (3pts)</p>
                      <p>• INR: &lt;1.7 (1pt), 1.7-2.3 (2pts), &gt;2.3 (3pts)</p>
                      <p>• Ascite/Encefalopatia: Ausente (1pt), Leve (2pts), Severa (3pts)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={calculateChildPugh}
                  disabled={!inputs.bilirubin || !inputs.albumin || !inputs.inr || !inputs.ascites || !inputs.encephalopathy}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Calcular Child-Pugh
                </Button>
                <Button
                  onClick={clearForm}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>

              {/* Results */}
              {result && (
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CopyableValue
                      label="Pontuação Total"
                      value={result.totalScore}
                      suffix="pontos"
                    />
                    <CopyableValue
                      label="Classe Child-Pugh"
                      value={result.childClass}
                      className={result.color}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CopyableValue
                      label="Classificação"
                      value={result.severity}
                      className={result.color}
                    />
                    <CopyableValue
                      label="Sobrevida 1 ano"
                      value={result.oneYearSurvival}
                    />
                  </div>

                  {/* Clinical Interpretation */}
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Interpretação Clínica</h4>
                    <p className={`text-sm ${result.color} font-medium`}>
                      {result.prognosis}
                    </p>
                    <div className="text-xs text-gray-400 mt-2 space-y-1">
                      <p>Pontuação detalhada:</p>
                      <p>• Bilirrubina: {result.breakdown.bilirubin} ponto(s)</p>
                      <p>• Albumina: {result.breakdown.albumin} ponto(s)</p>
                      <p>• INR: {result.breakdown.inr} ponto(s)</p>
                      <p>• Ascite: {result.breakdown.ascites} ponto(s)</p>
                      <p>• Encefalopatia: {result.breakdown.encephalopathy} ponto(s)</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* References Card */}
          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white">Referências</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-300 space-y-2">
              <p>• Child CG, Turcotte JG. Surgery and portal hypertension. Major Probl Clin Surg. 1964;1:1-85.</p>
              <p>• Pugh RN, Murray-Lyon IM, Dawson JL, et al. Transection of the oesophagus for bleeding oesophageal varices. Br J Surg. 1973;60(8):646-9.</p>
              <p>• Usado em conjunto com MELD score para avaliação de transplante hepático.</p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ChildPugh;