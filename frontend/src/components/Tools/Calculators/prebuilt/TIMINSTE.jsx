import React, { useState } from 'react';
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
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { Label } from '../../../ui/label';
import { Checkbox } from '../../../ui/checkbox';
import { Copy, Calculator, Heart, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * TIMINSTE - TIMI Risk Score for UA/NSTEMI
 * 
 * This component calculates the TIMI risk score for unstable angina/
 * non-ST elevation myocardial infarction (UA/NSTEMI) patients.
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
 * <TIMINSTE 
 *   open={showHardcodedCalculator === 'timi-nste'} 
 *   onOpenChange={() => setShowHardcodedCalculator(null)} 
 * />
 * 
 * @author Health Guardian Team
 * @since Sprint 3
 * @version 1.0.0
 */
function TIMINSTE({ open, onOpenChange }) {
  const [input, setInput] = useState({
    ageGte65: false,
    threeOrMoreRiskFactors: false,
    knownCadGte50: false,
    aspirinLast7d: false,
    recentSevereAngina24h: false,
    elevatedMarkers: false,
    stDeviationGte05mm: false,
  });
  const [results, setResults] = useState(null);

  /**
   * Translations for TIMI NSTE labels
   */
  const t = (key) => {
    const translations = {
      title: "TIMI UA/NSTEMI — risco em 14 dias",
      ageGte65: "Idade ≥ 65 anos",
      threeOrMoreRiskFactors: "≥ 3 fatores de risco para coronariopatia",
      knownCadGte50: "Coronariopatia com obstrução ≥ 50%",
      aspirinLast7d: "Uso de AAS nos últimos 7 dias",
      recentSevereAngina24h: "Angina instável nas últimas 24 horas",
      elevatedMarkers: "Elevação dos marcadores de necrose miocárdica",
      stDeviationGte05mm: "Alteração do segmento ST ≥ 0,5 mm",
      score: "Valor (pontos)",
      meaning: "Significado",
      riskLow: "Baixo risco (0–2)",
      riskIntermediate: "Risco intermediário (3–4)",
      riskHigh: "Alto risco (≥5)",
      riskRange: "Risco (14 dias)",
      advice: "Considerar estratégia invasiva precoce conforme estrato e contexto clínico.",
      copyNote: "Copiar nota",
      save: "Salvar",
      reset: "Limpar",
    };
    return translations[key] || key;
  };

  /**
   * Maps TIMI NSTE score to risk category and percentage
   */
  const mapRisk = (score) => {
    if (score <= 1) return { band: "low", pct: "3–5%", label: t("riskLow") };
    if (score === 2) return { band: "low", pct: "3–8%", label: t("riskLow") };
    if (score === 3) return { band: "intermediate", pct: "5–13%", label: t("riskIntermediate") };
    if (score === 4) return { band: "intermediate", pct: "7–20%", label: t("riskIntermediate") };
    if (score === 5) return { band: "high", pct: "12–26%", label: t("riskHigh") };
    return { band: "high", pct: "19–41%", label: t("riskHigh") }; // 6–7
  };

  /**
   * Computes TIMI NSTE score and risk assessment
   */
  const computeTimiNste = (inputData) => {
    const vals = Object.values(inputData).map(Boolean);
    const score = vals.reduce((a, b) => a + (b ? 1 : 0), 0);
    const m = mapRisk(score);
    const advice = `${t("advice")} (${m.label}; ${m.pct}).`;
    
    const flags = {
      AGE: inputData.ageGte65 ? "Sim" : "Não",
      RISKFACT: inputData.threeOrMoreRiskFactors ? "Sim" : "Não",
      CAD: inputData.knownCadGte50 ? "Sim" : "Não",
      ASA: inputData.aspirinLast7d ? "Sim" : "Não",
      ANG: inputData.recentSevereAngina24h ? "Sim" : "Não",
      MARK: inputData.elevatedMarkers ? "Sim" : "Não",
      ST: inputData.stDeviationGte05mm ? "Sim" : "Não",
    };
    
    const structuredNote = [
      `TIMI UA/NSTEMI (14 dias)`,
      `Critérios: idade≥65 ${flags.AGE}; ≥3 FR ${flags.RISKFACT}; DAC≥50% ${flags.CAD}; AAS7d ${flags.ASA}; angina24h ${flags.ANG}; marcadores ${flags.MARK}; ST≥0,5mm ${flags.ST}`,
      `Escore: ${score} → ${m.label} — risco: ${m.pct}`,
      `Conduta: ${advice}`,
      `Obs.: usar com avaliação clínica/HEART quando apropriado. Ref.: Antman JAMA 2000.`,
    ].join("\n");
    
    return { score, riskBand: m.band, riskPercentRange: m.pct, advice, structuredNote };
  };

  /**
   * Calculate TIMI NSTE score
   */
  const calculate = () => {
    const result = computeTimiNste(input);
    setResults(result);
  };

  /**
   * Reset all inputs
   */
  const reset = () => {
    setInput({
      ageGte65: false,
      threeOrMoreRiskFactors: false,
      knownCadGte50: false,
      aspirinLast7d: false,
      recentSevereAngina24h: false,
      elevatedMarkers: false,
      stDeviationGte05mm: false,
    });
    setResults(null);
  };

  /**
   * Copy structured note to clipboard
   */
  const copyNote = async () => {
    if (results?.structuredNote) {
      try {
        await navigator.clipboard.writeText(results.structuredNote);
        toast.success('Nota copiada para a área de transferência');
      } catch (error) {
        toast.error('Erro ao copiar nota');
      }
    }
  };

  /**
   * Update input field
   */
  const setInputField = (key, value) => {
    setInput(prev => ({ ...prev, [key]: value }));
  };

  /**
   * Risk band badge component
   */
  const BandBadge = ({ band }) => {
    const colorMap = {
      low: "bg-green-600 text-white",
      intermediate: "bg-amber-600 text-white",
      high: "bg-red-700 text-white",
    };
    
    const label = band === "low" ? t("riskLow") : 
                  band === "intermediate" ? t("riskIntermediate") : 
                  t("riskHigh");
    
    return <Badge className={colorMap[band]}>{label}</Badge>;
  };

  /**
   * Checkbox row component
   */
  const Row = ({ id, label, field }) => (
    <div className="flex items-center space-x-2">
      <Checkbox 
        id={id} 
        checked={input[field]} 
        onCheckedChange={(checked) => setInputField(field, Boolean(checked))} 
      />
      <Label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </Label>
    </div>
  );

  // Auto-calculate when inputs change
  React.useEffect(() => {
    calculate();
  }, [input]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            {t("title")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Critérios TIMI UA/NSTEMI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <fieldset className="space-y-3">
                <legend className="sr-only">Critérios TIMI UA/NSTEMI</legend>
                <Row id="age" label={t("ageGte65")} field="ageGte65" />
                <Row id="rf" label={t("threeOrMoreRiskFactors")} field="threeOrMoreRiskFactors" />
                <Row id="cad" label={t("knownCadGte50")} field="knownCadGte50" />
                <Row id="asa" label={t("aspirinLast7d")} field="aspirinLast7d" />
                <Row id="ang" label={t("recentSevereAngina24h")} field="recentSevereAngina24h" />
                <Row id="mark" label={t("elevatedMarkers")} field="elevatedMarkers" />
                <Row id="st" label={t("stDeviationGte05mm")} field="stDeviationGte05mm" />
              </fieldset>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={reset} className="flex-1">
                  {t("reset")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Resultado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="text-sm text-muted-foreground">{t("score")}:</div>
                      <Badge variant="secondary" className="text-base px-3">{results.score}</Badge>
                      <div className="ml-4 text-sm text-muted-foreground">{t("meaning")}:</div>
                      <BandBadge band={results.riskBand} />
                    </div>
                    
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="text-sm text-muted-foreground">{t("riskRange")}:</div>
                      <Badge variant="outline" className="text-base px-3">{results.riskPercentRange}</Badge>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 font-medium mb-2">Recomendação Clínica:</p>
                      <p className="text-sm text-blue-700">{results.advice}</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <p className="text-xs text-gray-600 font-medium mb-2">Nota Estruturada:</p>
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                        {results.structuredNote}
                      </pre>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={copyNote} className="flex items-center gap-2">
                      <Copy className="h-4 w-4" />
                      {t("copyNote")}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Clinical Information */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">Informações Clínicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-600 space-y-2">
              <p><strong>Fatores de Risco (≥3):</strong> Tabagismo, HAS, dislipidemia, DM, história familiar de DAC precoce, idade &gt; 45 anos (homens) ou &gt; 55 anos (mulheres).</p>
              <p><strong>Alteração ST ≥ 0,5 mm:</strong> Considerar depressão ou elevação do segmento ST no contexto de SCASSST.</p>
              <p><strong>Referência:</strong> Antman EM, et al. The TIMI risk score for unstable angina/non-ST elevation MI. JAMA. 2000;284(7):835-842.</p>
              <p><strong>Nota:</strong> Usar em conjunto com avaliação clínica e outros escores (ex: HEART) quando apropriado.</p>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default TIMINSTE;
