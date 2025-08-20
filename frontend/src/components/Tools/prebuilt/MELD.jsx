import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator, Copy, RotateCcw, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import CopyableValue from '@/components/ui/CopyableValue.jsx';

/**
 * MELD Score Calculator Component
 * 
 * Calculates Model for End-Stage Liver Disease (MELD) score for liver transplant prioritization.
 * Uses 4 parameters: bilirubin, INR, creatinine, and sodium.
 * Provides mortality prediction and transplant priority assessment.
 * 
 * @param {boolean} open - Dialog open state
 * @param {function} onOpenChange - Dialog state change handler
 * 
 * Integrates with:
 * - components/ui/* for interface components
 * - Calculators.jsx via open/onOpenChange props
 * - ChildPugh.jsx for complementary liver assessment
 * 
 * Features:
 * - Real-time calculation with validation
 * - Mortality prediction with color-coded results
 * - Transplant priority interpretation
 * - Copyable results with CopyableValue component
 * 
 * IA prompt: Extend with MELD-Na integration and exception points for specific conditions
 */
function MELD({ open, onOpenChange }) {
  const [inputs, setInputs] = useState({
    bilirubin: '',
    inr: '',
    creatinine: '',
    sodium: '',
    dialysis: false
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

    if (!inputs.bilirubin || inputs.bilirubin < 0.1 || inputs.bilirubin > 50) {
      errors.push('Bilirrubina deve estar entre 0.1 e 50 mg/dL');
    }

    if (!inputs.inr || inputs.inr < 0.8 || inputs.inr > 10) {
      errors.push('INR deve estar entre 0.8 e 10');
    }

    if (!inputs.creatinine || inputs.creatinine < 0.3 || inputs.creatinine > 15) {
      errors.push('Creatinina deve estar entre 0.3 e 15 mg/dL');
    }

    if (!inputs.sodium || inputs.sodium < 120 || inputs.sodium > 160) {
      errors.push('Sódio deve estar entre 120 e 160 mEq/L');
    }

    // Clinical warnings
    if (inputs.bilirubin > 20) {
      warnings.push('Bilirrubina extremamente elevada - considerar causas obstrutivas');
    }

    if (inputs.inr > 5) {
      warnings.push('INR muito elevado - risco de sangramento severo');
    }

    if (inputs.creatinine > 4 && !inputs.dialysis) {
      warnings.push('Creatinina muito elevada - considerar diálise');
    }

    if (inputs.sodium < 130) {
      warnings.push('Hiponatremia significativa - pode afetar prognóstico');
    }

    return { errors, warnings };
  };

  const calculateMELD = () => {
    const validation = validateInputs();
    
    if (validation.errors.length > 0) {
      toast.error(validation.errors[0]);
      return;
    }

    let bilirubin = Math.max(1.0, parseFloat(inputs.bilirubin));
    let inr = Math.max(1.0, parseFloat(inputs.inr));
    let creatinine = Math.max(1.0, parseFloat(inputs.creatinine));
    let sodium = Math.max(125, Math.min(137, parseFloat(inputs.sodium)));

    // If on dialysis, creatinine is set to 4.0
    if (inputs.dialysis) {
      creatinine = 4.0;
    }

    // MELD Score calculation
    // MELD = 3.78 × ln(bilirubin) + 11.2 × ln(INR) + 9.57 × ln(creatinine) + 6.43
    const meldScore = Math.round(
      3.78 * Math.log(bilirubin) + 
      11.2 * Math.log(inr) + 
      9.57 * Math.log(creatinine) + 
      6.43
    );

    // MELD-Na Score (includes sodium)
    // MELD-Na = MELD + 1.32 × (137 - Na) - [0.033 × MELD × (137 - Na)]
    const meldNaScore = Math.round(
      meldScore + 1.32 * (137 - sodium) - (0.033 * meldScore * (137 - sodium))
    );

    // Ensure scores are within valid range (6-40)
    const finalMELD = Math.max(6, Math.min(40, meldScore));
    const finalMELDNa = Math.max(6, Math.min(40, meldNaScore));

    // Determine mortality risk and transplant priority
    let mortalityRisk, priority, color, threeMonthMortality;
    
    if (finalMELDNa < 10) {
      mortalityRisk = 'Baixo risco';
      priority = 'Baixa prioridade';
      color = 'text-green-200';
      threeMonthMortality = '< 5%';
    } else if (finalMELDNa < 15) {
      mortalityRisk = 'Risco moderado';
      priority = 'Prioridade moderada';
      color = 'text-yellow-600';
      threeMonthMortality = '5-10%';
    } else if (finalMELDNa < 20) {
      mortalityRisk = 'Risco elevado';
      priority = 'Prioridade alta';
      color = 'text-orange-600';
      threeMonthMortality = '10-20%';
    } else if (finalMELDNa < 25) {
      mortalityRisk = 'Risco muito elevado';
      priority = 'Prioridade muito alta';
      color = 'text-red-600';
      threeMonthMortality = '20-30%';
    } else {
      mortalityRisk = 'Risco crítico';
      priority = 'Prioridade máxima';
      color = 'text-red-800';
      threeMonthMortality = '> 30%';
    }

    // Transplant eligibility assessment
    let transplantEligibility;
    if (finalMELDNa >= 15) {
      transplantEligibility = 'Elegível para lista de transplante';
    } else if (finalMELDNa >= 10) {
      transplantEligibility = 'Considerar avaliação para transplante';
    } else {
      transplantEligibility = 'Transplante não indicado no momento';
    }

    setResult({
      meldScore: finalMELD,
      meldNaScore: finalMELDNa,
      mortalityRisk,
      priority,
      color,
      threeMonthMortality,
      transplantEligibility,
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
      inr: '',
      creatinine: '',
      sodium: '',
      dialysis: false
    });
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-theme-background border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <Calculator className="h-6 w-6" />
            Escore MELD (Model for End-Stage Liver Disease)
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
              <p>O escore MELD prediz mortalidade em 3 meses e prioriza pacientes para transplante hepático:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>MELD &lt; 10:</strong> Baixo risco de mortalidade (&lt; 5%)</li>
                <li><strong>MELD 10-14:</strong> Risco moderado (5-10%)</li>
                <li><strong>MELD 15-19:</strong> Risco elevado (10-20%) - Elegível para transplante</li>
                <li><strong>MELD ≥ 20:</strong> Risco muito elevado (&gt; 20%) - Prioridade alta</li>
              </ul>
              <p className="text-yellow-400 mt-2">
                <strong>Importante:</strong> MELD-Na (com sódio) é mais preciso que MELD tradicional.
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
                      placeholder="Ex: 3.5"
                      min="0.1"
                      max="50"
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
                      placeholder="Ex: 2.1"
                      min="0.8"
                      max="10"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">Creatinina Sérica (mg/dL)</Label>
                    <Input
                      type="number"
                      value={inputs.creatinine}
                      onChange={(e) => handleInputChange('creatinine', e.target.value)}
                      className="bg-theme-surface border-gray-600 text-white"
                      placeholder="Ex: 1.8"
                      min="0.3"
                      max="15"
                      step="0.1"
                      disabled={inputs.dialysis}
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">Sódio Sérico (mEq/L)</Label>
                    <Input
                      type="number"
                      value={inputs.sodium}
                      onChange={(e) => handleInputChange('sodium', e.target.value)}
                      className="bg-theme-surface border-gray-600 text-white"
                      placeholder="Ex: 135"
                      min="120"
                      max="160"
                      step="1"
                    />
                  </div>
                </div>

                {/* Clinical Parameters */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Parâmetros Clínicos</h3>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="dialysis"
                      checked={inputs.dialysis}
                      onChange={(e) => handleInputChange('dialysis', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Label htmlFor="dialysis" className="text-gray-300">
                      Paciente em diálise (últimos 7 dias)
                    </Label>
                  </div>

                  {inputs.dialysis && (
                    <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-700">
                      <p className="text-blue-300 text-sm">
                        <Info className="h-4 w-4 inline mr-1" />
                        Para pacientes em diálise, a creatinina é automaticamente definida como 4.0 mg/dL
                      </p>
                    </div>
                  )}

                  {/* Formula Display */}
                  <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-300">Fórmulas:</span>
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                      <p><strong>MELD:</strong> 3.78×ln(Bil) + 11.2×ln(INR) + 9.57×ln(Cr) + 6.43</p>
                      <p><strong>MELD-Na:</strong> MELD + 1.32×(137-Na) - [0.033×MELD×(137-Na)]</p>
                      <p className="text-yellow-400 mt-2">Valores mínimos: Bil≥1, INR≥1, Cr≥1, Na 125-137</p>
                    </div>
                  </div>

                  {/* Transplant Info */}
                  <div className="mt-4 p-4 bg-green-900/20 rounded-lg border border-green-700">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-green-400" />
                      <span className="text-sm font-medium text-green-300">Critérios de Transplante</span>
                    </div>
                    <div className="text-xs text-green-300 space-y-1">
                      <p>• MELD ≥ 15: Elegível para lista de transplante</p>
                      <p>• MELD ≥ 20: Prioridade alta</p>
                      <p>• Exceções: Carcinoma hepatocelular, outras condições específicas</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={calculateMELD}
                  disabled={!inputs.bilirubin || !inputs.inr || !inputs.creatinine || !inputs.sodium}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Calcular MELD
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
                      label="MELD Score"
                      value={result.meldScore}
                      suffix="pontos"
                    />
                    <CopyableValue
                      label="MELD-Na Score"
                      value={result.meldNaScore}
                      suffix="pontos"
                      className={result.color}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CopyableValue
                      label="Mortalidade 3 meses"
                      value={result.threeMonthMortality}
                      className={result.color}
                    />
                    <CopyableValue
                      label="Prioridade Transplante"
                      value={result.priority}
                      className={result.color}
                    />
                  </div>

                  {/* Clinical Interpretation */}
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Interpretação Clínica</h4>
                    <div className="space-y-2">
                      <p className={`text-sm ${result.color} font-medium`}>
                        {result.mortalityRisk} - {result.transplantEligibility}
                      </p>
                      <div className="text-xs text-gray-400 space-y-1">
                        <p><strong>MELD tradicional:</strong> {result.meldScore} pontos</p>
                        <p><strong>MELD-Na (recomendado):</strong> {result.meldNaScore} pontos</p>
                        <p><strong>Mortalidade estimada em 3 meses:</strong> {result.threeMonthMortality}</p>
                      </div>
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
              <p>• Kamath PS, Kim WR. The model for end-stage liver disease (MELD). Hepatology. 2007;45(3):797-805.</p>
              <p>• Kim WR, Biggins SW, Kremers WK, et al. Hyponatremia and mortality among patients on the liver-transplant waiting list. N Engl J Med. 2008;359(10):1018-26.</p>
              <p>• OPTN/UNOS Liver and Intestinal Organ Transplantation Committee. MELD Calculator Documentation.</p>
              <p>• Usado em conjunto com Child-Pugh para avaliação completa da função hepática.</p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MELD;