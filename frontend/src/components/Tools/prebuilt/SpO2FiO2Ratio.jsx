import React, { useState, useMemo } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Copy, Stethoscope, AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";

/**
 * SpO2/FiO2 Ratio Calculator Component
 * 
 * Calculates SpO2/FiO2 ratio as a non-invasive alternative to PaO2/FiO2.
 * Useful for continuous monitoring and screening of respiratory function.
 * 
 * @param {boolean} open - Dialog open state
 * @param {function} onOpenChange - Dialog state change handler
 * 
 * Integrates with:
 * - Calculators.jsx for registration
 * - Used in intensive care and emergency medicine for respiratory assessment
 * - Correlates with PaO2/FiO2 for ARDS evaluation
 * 
 * AI prompt: Extend with SpO2/FiO2 to PaO2/FiO2 conversion algorithms and trending analysis
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

export default function SpO2FiO2RatioDialog({ open, onOpenChange }) {
  const [spo2, setSpo2] = useState("");
  const [fio2, setFio2] = useState("");
  const [fio2Type, setFio2Type] = useState("decimal"); // "decimal" or "percent"

  // Parse and validate inputs
  const spo2Num = useMemo(() => {
    const parsed = parseFloat((spo2 || "").replace(",", "."));
    return isNaN(parsed) ? null : parsed;
  }, [spo2]);

  const fio2Num = useMemo(() => {
    let parsed = parseFloat((fio2 || "").replace(",", "."));
    if (isNaN(parsed)) return null;
    
    // Convert percentage to decimal if needed
    if (fio2Type === "percent") {
      parsed = parsed / 100;
    }
    
    return parsed;
  }, [fio2, fio2Type]);

  // Validation
  const isValid = useMemo(() => {
    const spo2Valid = spo2Num && spo2Num >= 70 && spo2Num <= 100;
    const fio2Valid = fio2Num && fio2Num >= 0.21 && fio2Num <= 1.0;
    
    return spo2Valid && fio2Valid;
  }, [spo2Num, fio2Num]);

  // SpO2/FiO2 Calculation
  const ratio = useMemo(() => {
    if (!isValid) return null;
    return spo2Num / fio2Num;
  }, [spo2Num, fio2Num, isValid]);

  // Clinical interpretation based on SpO2/FiO2 thresholds
  const getInterpretation = (ratioValue) => {
    if (!ratioValue) return { text: "...", color: "text-gray-400", icon: null, description: "" };
    
    // SpO2/FiO2 thresholds (different from PaO2/FiO2)
    if (ratioValue >= 315) {
      return {
        text: "Normal",
        color: "text-green-400",
        icon: <CheckCircle className="h-4 w-4" />,
        description: "Função respiratória normal, sem comprometimento significativo",
        severity: "Sem lesão pulmonar"
      };
    } else if (ratioValue >= 235) {
      return {
        text: "Comprometimento Leve",
        color: "text-yellow-400",
        icon: <TrendingDown className="h-4 w-4" />,
        description: "Comprometimento respiratório leve, monitorização recomendada",
        severity: "Equivale a SDRA leve"
      };
    } else if (ratioValue >= 150) {
      return {
        text: "Comprometimento Moderado",
        color: "text-orange-400",
        icon: <AlertTriangle className="h-4 w-4" />,
        description: "Comprometimento respiratório moderado, intervenção pode ser necessária",
        severity: "Equivale a SDRA moderada"
      };
    } else {
      return {
        text: "Comprometimento Grave",
        color: "text-red-400",
        icon: <AlertTriangle className="h-4 w-4" />,
        description: "Comprometimento respiratório grave, intervenção urgente necessária",
        severity: "Equivale a SDRA grave"
      };
    }
  };

  const interpretation = getInterpretation(ratio);

  // Estimate PaO2/FiO2 from SpO2/FiO2 (Rice et al. correlation)
  const estimatedPaO2FiO2 = useMemo(() => {
    if (!ratio) return null;
    // Simplified correlation: PaO2/FiO2 ≈ SpO2/FiO2 × 0.64 + 44
    return ratio * 0.64 + 44;
  }, [ratio]);

  const formatRatio = (value) => {
    if (!value) return "...";
    return Math.round(value).toString();
  };

  const toggleFio2Type = () => {
    const newType = fio2Type === "decimal" ? "percent" : "decimal";
    setFio2Type(newType);
    
    // Convert existing value if valid
    if (fio2Num) {
      if (newType === "percent") {
        setFio2((fio2Num * 100).toString());
      } else {
        setFio2((fio2Num / 100).toString());
      }
    }
  };

  const clearFields = () => {
    setSpo2("");
    setFio2("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Stethoscope className="h-6 w-6 text-blue-400" />
            Relação SpO₂/FiO₂ (Índice de Oxigenação Não-Invasivo)
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Instructions Card */}
          <Card className="border-gray-700/50 bg-theme-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Instruções
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-300 space-y-2">
              <p>Insira a saturação de oxigênio (SpO₂) e a fração inspirada de oxigênio (FiO₂).</p>
              <p>Alternativa não-invasiva ao PaO₂/FiO₂ para monitorização contínua.</p>
              <p><strong>Valores de referência:</strong></p>
              <ul className="text-xs space-y-1 ml-4">
                <li>Normal: ≥ 315</li>
                <li>Leve: 235-314</li>
                <li>Moderado: 150-234</li>
                <li>Grave: &lt; 150</li>
              </ul>
            </CardContent>
          </Card>

          {/* Main Calculation Card */}
          <Card className="border-gray-700/50 bg-theme-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white">Parâmetros Respiratórios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="spo2" className="text-white">SpO₂ (Saturação de Oxigênio) - %</Label>
                  <Input
                    id="spo2"
                    placeholder="Ex: 95"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    className="bg-theme-surface border-gray-600 text-white"
                    type="number"
                    min="70"
                    max="100"
                    step="0.1"
                  />
                  {spo2 && spo2Num && (spo2Num < 70 || spo2Num > 100) && (
                    <p className="text-red-400 text-xs mt-1">SpO₂ deve estar entre 70% e 100%</p>
                  )}
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="fio2" className="text-white">FiO₂ (Fração Inspirada de O₂)</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleFio2Type}
                      className="text-xs"
                    >
                      {fio2Type === "decimal" ? "Decimal" : "Percentual"}
                    </Button>
                  </div>
                  <Input
                    id="fio2"
                    placeholder={fio2Type === "decimal" ? "Ex: 0.4" : "Ex: 40"}
                    value={fio2}
                    onChange={(e) => setFio2(e.target.value)}
                    className="bg-theme-surface border-gray-600 text-white"
                    type="number"
                    step={fio2Type === "decimal" ? "0.01" : "1"}
                    min={fio2Type === "decimal" ? "0.21" : "21"}
                    max={fio2Type === "decimal" ? "1.0" : "100"}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {fio2Type === "decimal" ? "(0.21-1.0)" : "(21%-100%)"}
                  </p>
                  {fio2 && fio2Num && (fio2Num < 0.21 || fio2Num > 1.0) && (
                    <p className="text-red-400 text-xs mt-1">
                      FiO₂ deve estar entre {fio2Type === "decimal" ? "0.21 e 1.0" : "21% e 100%"}
                    </p>
                  )}
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
                  label="Relação SpO₂/FiO₂"
                  value={formatRatio(ratio)}
                  color={interpretation.color}
                  icon={interpretation.icon}
                />
                
                <div className="rounded-xl border border-gray-600 bg-gray-800/30 px-3 py-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400">Interpretação</span>
                    <div className={`text-sm font-medium ${interpretation.color} mb-1`}>
                      {interpretation.text}
                    </div>
                    <div className={`text-xs ${interpretation.color} mb-1`}>
                      {interpretation.severity}
                    </div>
                    <p className="text-xs text-gray-300">{interpretation.description}</p>
                  </div>
                </div>

                {estimatedPaO2FiO2 && (
                  <CopyableValue 
                    label="PaO₂/FiO₂ Estimado"
                    value={Math.round(estimatedPaO2FiO2).toString()}
                    color="text-blue-300"
                  />
                )}

                {isValid && (
                  <div className="text-xs text-gray-300">
                    <p><strong>Cálculo:</strong></p>
                    <p className="font-mono">
                      {spo2Num}% ÷ {fio2Num?.toFixed(2)} = {formatRatio(ratio)}
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
            <CardTitle className="text-base text-white">Referências Clínicas e Correlações</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Vantagens do SpO₂/FiO₂:</strong></p>
                <ul className="text-xs space-y-1 ml-4 mt-1">
                  <li>Monitorização contínua e não-invasiva</li>
                  <li>Não requer gasometria arterial</li>
                  <li>Útil em triagem e acompanhamento</li>
                  <li>Correlação boa com PaO₂/FiO₂</li>
                </ul>
              </div>
              <div>
                <p><strong>Limitações:</strong></p>
                <ul className="text-xs space-y-1 ml-4 mt-1">
                  <li>Menos preciso que PaO₂/FiO₂</li>
                  <li>Afetado por hemoglobina e perfusão</li>
                  <li>Saturação &lt; 90% menos confiável</li>
                  <li>Não substitui gasometria em casos graves</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-gray-600">
              <p className="text-xs"><strong>Correlação:</strong> PaO₂/FiO₂ ≈ SpO₂/FiO₂ × 0.64 + 44 (Rice et al.). <strong>Aplicação clínica:</strong> Triagem de SDRA, monitorização de pacientes em ventilação mecânica, avaliação de resposta terapêutica.</p>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

// Hook: Exported for use in Calculators.