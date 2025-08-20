import React, { useState, useMemo } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Copy, Heart, AlertTriangle, CheckCircle } from "lucide-react";

/**
 * QTc Calculation Component
 * 
 * Calculates corrected QT interval using three main formulas:
 * - Bazett: QTc = QT / √RR
 * - Fridericia: QTc = QT / ∛RR  
 * - Framingham: QTc = QT + 154(1 - RR)
 * 
 * Provides automatic clinical interpretation with color-coded results.
 * 
 * @param {boolean} open - Dialog open state
 * @param {function} onOpenChange - Dialog state change handler
 * 
 * Integrates with:
 * - Calculators.jsx for registration
 * - Used in cardiology assessments for arrhythmia risk evaluation
 * 
 * AI prompt: Extend with additional formulas (Hodges, Rautaharju) and pediatric ranges
 */
function CopyableValue({ label, value, color = "text-white" }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-600 bg-gray-800/30 px-3 py-2">
      <div className="flex flex-col">
        <span className="text-xs text-gray-400">{label}</span>
        <span className={`text-lg font-semibold ${color}`}>{value}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        aria-label={`Copiar ${label}`}
        className="text-gray-400 hover:text-white hover:bg-gray-700"
      >
        <Copy className="h-4 w-4" />
      </Button>
      {copied && <span className="text-xs text-teal-400">Copiado!</span>}
    </div>
  );
}

export default function QTcCalculationDialog({ open, onOpenChange }) {
  const [qt, setQt] = useState("");
  const [hr, setHr] = useState("");
  const [selectedFormula, setSelectedFormula] = useState("bazett");

  // Parse and validate inputs
  const qtNum = useMemo(() => {
    const parsed = parseFloat((qt || "").replace(",", "."));
    return isNaN(parsed) ? null : parsed;
  }, [qt]);

  const hrNum = useMemo(() => {
    const parsed = parseFloat((hr || "").replace(",", "."));
    return isNaN(parsed) ? null : parsed;
  }, [hr]);

  // Calculate RR interval from heart rate
  const rrInterval = useMemo(() => {
    if (!hrNum || hrNum <= 0) return null;
    return 60 / hrNum; // RR in seconds
  }, [hrNum]);

  // Validation
  const isValid = useMemo(() => {
    return qtNum && qtNum > 0 && qtNum < 1000 && 
           hrNum && hrNum >= 30 && hrNum <= 250;
  }, [qtNum, hrNum]);

  // QTc Calculations
  const calculations = useMemo(() => {
    if (!isValid || !rrInterval) {
      return {
        bazett: null,
        fridericia: null,
        framingham: null
      };
    }

    // Convert QT from ms to seconds for calculations
    const qtSeconds = qtNum / 1000;
    
    return {
      bazett: (qtSeconds / Math.sqrt(rrInterval)) * 1000,
      fridericia: (qtSeconds / Math.pow(rrInterval, 1/3)) * 1000,
      framingham: qtNum + 154 * (1 - rrInterval)
    };
  }, [qtNum, rrInterval, isValid]);

  // Clinical interpretation
  const getInterpretation = (qtcValue, gender = "male") => {
    if (!qtcValue) return { text: "...", color: "text-gray-400", icon: null };
    
    // Standard thresholds (ms)
    const thresholds = {
      male: { normal: 440, borderline: 470, prolonged: 500 },
      female: { normal: 460, borderline: 480, prolonged: 500 }
    };
    
    const limits = thresholds[gender];
    
    if (qtcValue < limits.normal) {
      return { 
        text: "Normal", 
        color: "text-green-400", 
        icon: <CheckCircle className="h-4 w-4" />
      };
    } else if (qtcValue < limits.borderline) {
      return { 
        text: "Limítrofe", 
        color: "text-yellow-400", 
        icon: <AlertTriangle className="h-4 w-4" />
      };
    } else if (qtcValue < limits.prolonged) {
      return { 
        text: "Prolongado", 
        color: "text-orange-400", 
        icon: <AlertTriangle className="h-4 w-4" />
      };
    } else {
      return { 
        text: "Muito Prolongado", 
        color: "text-red-400", 
        icon: <AlertTriangle className="h-4 w-4" />
      };
    }
  };

  const currentQtc = calculations[selectedFormula];
  const interpretation = getInterpretation(currentQtc);

  const formatQtc = (value) => {
    if (!value) return "...";
    return `${Math.round(value)} ms`;
  };

  const clearFields = () => {
    setQt("");
    setHr("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Heart className="h-6 w-6 text-red-400" />
            Cálculo do QTc (QT Corrigido)
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Instructions Card */}
          <Card className="border-gray-700/50 bg-theme-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Instruções
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-300 space-y-2">
              <p>Insira o intervalo QT (ms) e a frequência cardíaca (bpm).</p>
              <p>Selecione a fórmula desejada para correção.</p>
              <p><strong>Valores normais:</strong></p>
              <ul className="text-xs space-y-1 ml-4">
                <li>♂ Homens: &lt; 440 ms</li>
                <li>♀ Mulheres: &lt; 460 ms</li>
                <li>Prolongado: &gt; 500 ms</li>
              </ul>
            </CardContent>
          </Card>

          {/* Main Calculation Card */}
          <Card className="border-gray-700/50 bg-theme-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white">Cálculo Principal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="qt" className="text-white">Intervalo QT (ms)</Label>
                  <Input
                    id="qt"
                    placeholder="Ex: 400"
                    value={qt}
                    onChange={(e) => setQt(e.target.value)}
                    className="bg-theme-surface border-gray-600 text-white"
                    type="number"
                    min="200"
                    max="800"
                  />
                </div>
                
                <div>
                  <Label htmlFor="hr" className="text-white">Frequência Cardíaca (bpm)</Label>
                  <Input
                    id="hr"
                    placeholder="Ex: 75"
                    value={hr}
                    onChange={(e) => setHr(e.target.value)}
                    className="bg-theme-surface border-gray-600 text-white"
                    type="number"
                    min="30"
                    max="250"
                  />
                </div>
              </div>

              <Tabs value={selectedFormula} onValueChange={setSelectedFormula} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-700">
                  <TabsTrigger value="bazett" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-xs">Bazett</TabsTrigger>
                  <TabsTrigger value="fridericia" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-xs">Fridericia</TabsTrigger>
                  <TabsTrigger value="framingham" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-xs">Framingham</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex gap-2">
                <Button 
                  onClick={clearFields} 
                  variant="outline" 
                  className="flex-1"
                >
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results & Interpretation Card */}
          <Card className="border-gray-700/50 bg-theme-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white">Resultado e Interpretação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <CopyableValue 
                  label={`QTc (${selectedFormula.charAt(0).toUpperCase() + selectedFormula.slice(1)})`}
                  value={formatQtc(currentQtc)}
                  color={interpretation.color}
                />
                
                <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-600 bg-gray-800/30 px-3 py-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400">Interpretação</span>
                    <div className={`flex items-center gap-2 text-lg font-semibold ${interpretation.color}`}>
                      {interpretation.icon}
                      <span>{interpretation.text}</span>
                    </div>
                  </div>
                </div>

                {rrInterval && (
                  <CopyableValue 
                    label="Intervalo RR"
                    value={`${rrInterval.toFixed(2)} s`}
                  />
                )}
              </div>

              {/* All formulas comparison */}
              {isValid && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <h4 className="text-sm font-medium text-white mb-2">Comparação de Fórmulas:</h4>
                  <div className="space-y-1 text-xs text-gray-300">
                    <div>Bazett: {formatQtc(calculations.bazett)}</div>
                    <div>Fridericia: {formatQtc(calculations.fridericia)}</div>
                    <div>Framingham: {formatQtc(calculations.framingham)}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reference Card */}
        <Card className="border-gray-700/50 bg-theme-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white">Referências e Fórmulas</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-300 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p><strong>Bazett (1920):</strong></p>
                <p className="text-xs font-mono">QTc = QT / √RR</p>
                <p className="text-xs">Mais comum, superestima em FC altas</p>
              </div>
              <div>
                <p><strong>Fridericia (1920):</strong></p>
                <p className="text-xs font-mono">QTc = QT / ∛RR</p>
                <p className="text-xs">Melhor para FC extremas</p>
              </div>
              <div>
                <p><strong>Framingham (1992):</strong></p>
                <p className="text-xs font-mono">QTc = QT + 154(1-RR)</p>
                <p className="text-xs">Linear, boa para estudos populacionais</p>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-gray-600">
              <p className="text-xs"><strong>Indicações clínicas:</strong> Avaliação de risco de Torsades de Pointes, monitoramento de medicamentos que prolongam QT, triagem de canalopatias.</p>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

// Hook: Exported for use in Calculators.jsx registry
// Connector: Integrates with cardiology assessment workflows