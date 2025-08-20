import React, { useState, useMemo } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Copy, Zap, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";

/**
 * Anion Gap Calculator Component
 * 
 * Calculates anion gap using the formula: (Na + K) - (Cl + HCO3)
 * Provides automatic clinical interpretation for acid-base disorders.
 * 
 * @param {boolean} open - Dialog open state
 * @param {function} onOpenChange - Dialog state change handler
 * 
 * Integrates with:
 * - Calculators.jsx for registration
 * - Used in nephrology and emergency medicine for acid-base assessment
 * 
 * AI prompt: Extend with delta-delta calculation and winter's formula integration
 */
function CopyableValue({ label, value, color = "text-white", icon = null }) {
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
        <div className={`flex items-center gap-2 text-lg font-semibold ${color}`}>
          {icon}
          <span>{value}</span>
        </div>
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

export default function AnionGapDialog({ open, onOpenChange }) {
  const [sodium, setSodium] = useState("");
  const [potassium, setPotassium] = useState("");
  const [chloride, setChloride] = useState("");
  const [bicarbonate, setBicarbonate] = useState("");
  const [includeK, setIncludeK] = useState(true);

  // Parse and validate inputs
  const naNum = useMemo(() => {
    const parsed = parseFloat((sodium || "").replace(",", "."));
    return isNaN(parsed) ? null : parsed;
  }, [sodium]);

  const kNum = useMemo(() => {
    const parsed = parseFloat((potassium || "").replace(",", "."));
    return isNaN(parsed) ? null : parsed;
  }, [potassium]);

  const clNum = useMemo(() => {
    const parsed = parseFloat((chloride || "").replace(",", "."));
    return isNaN(parsed) ? null : parsed;
  }, [chloride]);

  const hco3Num = useMemo(() => {
    const parsed = parseFloat((bicarbonate || "").replace(",", "."));
    return isNaN(parsed) ? null : parsed;
  }, [bicarbonate]);

  // Validation
  const isValid = useMemo(() => {
    const naValid = naNum && naNum >= 120 && naNum <= 160;
    const kValid = !includeK || (kNum && kNum >= 2.5 && kNum <= 6.0);
    const clValid = clNum && clNum >= 80 && clNum <= 120;
    const hco3Valid = hco3Num && hco3Num >= 10 && hco3Num <= 40;
    
    return naValid && kValid && clValid && hco3Valid;
  }, [naNum, kNum, clNum, hco3Num, includeK]);

  // Anion Gap Calculation
  const anionGap = useMemo(() => {
    if (!isValid) return null;
    
    const cations = naNum + (includeK ? (kNum || 0) : 0);
    const anions = clNum + hco3Num;
    
    return cations - anions;
  }, [naNum, kNum, clNum, hco3Num, includeK, isValid]);

  // Clinical interpretation
  const getInterpretation = (gap, withK = true) => {
    if (!gap) return { text: "...", color: "text-gray-400", icon: null, description: "" };
    
    // Normal ranges
    const normalRange = withK ? { min: 12, max: 20 } : { min: 8, max: 16 };
    
    if (gap < normalRange.min) {
      return {
        text: "Diminuído",
        color: "text-blue-400",
        icon: <TrendingDown className="h-4 w-4" />,
        description: "Possível hipoalbuminemia, intoxicação por lítio, ou erro laboratorial"
      };
    } else if (gap <= normalRange.max) {
      return {
        text: "Normal",
        color: "text-green-400",
        icon: <CheckCircle className="h-4 w-4" />,
        description: "Anion gap dentro dos valores de referência"
      };
    } else if (gap <= normalRange.max + 5) {
      return {
        text: "Levemente Elevado",
        color: "text-yellow-400",
        icon: <TrendingUp className="h-4 w-4" />,
        description: "Investigar causas de acidose metabólica com anion gap elevado"
      };
    } else {
      return {
        text: "Elevado",
        color: "text-red-400",
        icon: <AlertTriangle className="h-4 w-4" />,
        description: "Acidose metabólica com anion gap elevado - investigar MUDPILES"
      };
    }
  };

  const interpretation = getInterpretation(anionGap, includeK);

  const formatGap = (value) => {
    if (!value) return "...";
    return `${value.toFixed(1)} mEq/L`;
  };

  const clearFields = () => {
    setSodium("");
    setPotassium("");
    setChloride("");
    setBicarbonate("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Zap className="h-6 w-6 text-yellow-400" />
            Cálculo do Anion Gap
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Instructions Card */}
          <Card className="border-gray-700/50 bg-theme-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Instruções
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-300 space-y-2">
              <p>Insira os valores dos eletrólitos em mEq/L.</p>
              <p>O potássio é opcional (alguns laboratórios não incluem).</p>
              <p><strong>Valores normais:</strong></p>
              <ul className="text-xs space-y-1 ml-4">
                <li>Com K+: 12-20 mEq/L</li>
                <li>Sem K+: 8-16 mEq/L</li>
              </ul>
              <p><strong>Fórmula:</strong></p>
              <p className="text-xs font-mono">(Na + K) - (Cl + HCO₃)</p>
            </CardContent>
          </Card>

          {/* Main Calculation Card */}
          <Card className="border-gray-700/50 bg-theme-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white">Valores Laboratoriais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="sodium" className="text-white">Sódio (Na+) - mEq/L</Label>
                  <Input
                    id="sodium"
                    placeholder="Ex: 140"
                    value={sodium}
                    onChange={(e) => setSodium(e.target.value)}
                    className="bg-theme-surface border-gray-600 text-white"
                    type="number"
                    min="120"
                    max="160"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="includeK"
                      checked={includeK}
                      onChange={(e) => setIncludeK(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="includeK" className="text-white text-sm">Incluir Potássio</Label>
                  </div>
                  {includeK && (
                    <Input
                      id="potassium"
                      placeholder="Ex: 4.0"
                      value={potassium}
                      onChange={(e) => setPotassium(e.target.value)}
                      className="bg-theme-surface border-gray-600 text-white"
                      type="number"
                      min="2.5"
                      max="6.0"
                      step="0.1"
                    />
                  )}
                </div>
                
                <div>
                  <Label htmlFor="chloride" className="text-white">Cloreto (Cl-) - mEq/L</Label>
                  <Input
                    id="chloride"
                    placeholder="Ex: 105"
                    value={chloride}
                    onChange={(e) => setChloride(e.target.value)}
                    className="bg-theme-surface border-gray-600 text-white"
                    type="number"
                    min="80"
                    max="120"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="bicarbonate" className="text-white">Bicarbonato (HCO₃-) - mEq/L</Label>
                  <Input
                    id="bicarbonate"
                    placeholder="Ex: 24"
                    value={bicarbonate}
                    onChange={(e) => setBicarbonate(e.target.value)}
                    className="bg-theme-surface border-gray-600 text-white"
                    type="number"
                    min="10"
                    max="40"
                    step="0.1"
                  />
                </div>
              </div>

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
                  label="Anion Gap"
                  value={formatGap(anionGap)}
                  color={interpretation.color}
                  icon={interpretation.icon}
                />
                
                <div className="rounded-xl border border-gray-600 bg-gray-800/30 px-3 py-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400">Interpretação</span>
                    <div className={`text-sm font-medium ${interpretation.color} mb-1`}>
                      {interpretation.text}
                    </div>
                    <p className="text-xs text-gray-300">{interpretation.description}</p>
                  </div>
                </div>

                {isValid && (
                  <div className="text-xs text-gray-300">
                    <p><strong>Cálculo:</strong></p>
                    <p className="font-mono">
                      ({naNum}{includeK && kNum ? ` + ${kNum}` : ''}) - ({clNum} + {hco3Num}) = {anionGap?.toFixed(1)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reference Card */}
        <Card className="border-gray-700/50 bg-theme-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white">Causas Clínicas e Referências</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Anion Gap Elevado (MUDPILES):</strong></p>
                <ul className="text-xs space-y-1 ml-4 mt-1">
                  <li><strong>M</strong>etanol, <strong>U</strong>remia</li>
                  <li><strong>D</strong>iabetes (cetoacidose)</li>
                  <li><strong>P</strong>araldeído, <strong>I</strong>soniazida</li>
                  <li><strong>L</strong>ático, <strong>E</strong>tileno glicol</li>
                  <li><strong>S</strong>alicilatos</li>
                </ul>
              </div>
              <div>
                <p><strong>Anion Gap Normal/Baixo:</strong></p>
                <ul className="text-xs space-y-1 ml-4 mt-1">
                  <li>Diarreia (perda de HCO₃-)</li>
                  <li>Acidose tubular renal</li>
                  <li>Hipoalbuminemia</li>
                  <li>Intoxicação por lítio</li>
                  <li>Hipercalcemia, hipermagnesemia</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-gray-600">
              <p className="text-xs"><strong>Nota clínica:</strong> O anion gap é fundamental na avaliação de acidose metabólica. Valores elevados sugerem presença de ácidos não mensurados, enquanto valores normais indicam perda de bicarbonato ou defeito na acidificação urinária.</p>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

// Hook: Exported for use in Calculators.jsx registry
// Connector: Integrates with nephrology and emergency medicine workflows