import React, { useState, useMemo } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { Copy, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../ui/tooltip";

/**
 * Parkland Component - Modal para cálculo de reposição volêmica em queimaduras
 * 
 * @component
 * @example
 * return (
 *   <Parkland open={true} onOpenChange={setOpen} />
 * )
 * 
 * Integrates with:
 * - components/ui/* para componentes de interface (Dialog, Button, etc.)
 * - Calculators.jsx via propriedades open/onOpenChange
 * 
 * Features:
 * - Cálculo automático baseado na fórmula de Parkland
 * - Diferenciação entre pacientes adultos e pediátricos
 * - Distribuição temporal do volume (0-8h e 8-24h)
 * - Valores copiáveis para clipboard
 * - Validação de entrada em tempo real
 * 
 * IA prompt: Adicionar histórico de cálculos, templates por tipo de queimadura, e integração com monitoramento de balanço hídrico
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

function CopyableValue({ label, value, suffix }) {
  const text = suffix ? `${value} ${suffix}` : value;
  const [copied, setCopied] = useState(false);
  
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border bg-gray-800/30 px-3 py-2">
      <div className="flex flex-col">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-lg font-semibold text-white">{text}</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 hover:bg-gray-700"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          } catch {
            // Fallback silencioso
          }
        }}
        aria-label={`Copiar ${label}`}
      >
        <Copy className="h-4 w-4" />
      </Button>
      {copied && <span className="text-xs text-green-400 animate-fade-in">Copiado!</span>}
    </div>
  );
}

export default function Parkland({ open, onOpenChange }) {
  // Estados dos inputs
  const [peso, setPeso] = useState("");
  const [superficieQueimada, setSuperficieQueimada] = useState("");
  const [isPediatrico, setIsPediatrico] = useState(false);

  // Validação de inputs
  const isValidPeso = (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0 && num <= 500; // Peso entre 0.1 e 500 kg
  };

  const isValidSuperficie = (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 100; // Percentual entre 0 e 100%
  };

  // Cálculos automáticos
  const resultados = useMemo(() => {
    const pesoNum = parseFloat(peso.replace(",", "."));
    const superficieNum = parseFloat(superficieQueimada.replace(",", "."));
    
    if (!isValidPeso(pesoNum) || !isValidSuperficie(superficieNum)) {
      return {
        volumeTotal: 0,
        volume0a8h: 0,
        volume8a24h: 0,
        fator: isPediatrico ? 3 : 4
      };
    }

    const fator = isPediatrico ? 3 : 4; // 3 mL/kg/%TBSA para pediátrico, 4 para adulto
    const volumeTotal = fator * pesoNum * superficieNum;
    const volume0a8h = volumeTotal / 2; // Metade nas primeiras 8h
    const volume8a24h = volumeTotal / 2; // Metade nas próximas 16h

    return {
      volumeTotal,
      volume0a8h,
      volume8a24h,
      fator
    };
  }, [peso, superficieQueimada, isPediatrico]);

  const hasValidInputs = isValidPeso(parseFloat(peso.replace(",", "."))) && 
                        isValidSuperficie(parseFloat(superficieQueimada.replace(",", ".")));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-theme-background border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            Reposição Volêmica em Queimaduras (Parkland)
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* Card de instruções */}
          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white">Como usar</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-300">
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>Fórmula:</strong> Volume (mL) = Fator × Peso (kg) × %TBSA</li>
                <li><strong>Fator:</strong> 4 mL/kg/%TBSA para adultos, 3 mL/kg/%TBSA para crianças</li>
                <li><strong>Distribuição:</strong> Metade do volume nas primeiras 8h, metade nas próximas 16h</li>
                <li><strong>Fluido:</strong> Ringer lactato ou solução salina balanceada</li>
                <li><strong>Monitorização:</strong> Ajustar conforme débito urinário (0,5-1 mL/kg/h adulto, 1-2 mL/kg/h criança)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Card principal */}
          <Card className="border-gray-700 bg-gray-800/50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Inputs */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="peso" className="text-white">Peso do paciente</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="peso"
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        min="0.1"
                        max="500"
                        value={peso}
                        onChange={(e) => setPeso(e.target.value)}
                        className="bg-theme-surface border-gray-600 text-white"
                        placeholder="Ex: 70"
                      />
                      <span className="text-gray-400 text-sm">kg</span>
                    </div>
                    {peso && !isValidPeso(parseFloat(peso.replace(",", "."))) && (
                      <p className="text-red-400 text-xs mt-1">Peso deve estar entre 0,1 e 500 kg</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="superficie" className="text-white">Superfície corporal queimada</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="superficie"
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        min="0"
                        max="100"
                        value={superficieQueimada}
                        onChange={(e) => setSuperficieQueimada(e.target.value)}
                        className="bg-theme-surface border-gray-600 text-white"
                        placeholder="Ex: 25"
                      />
                      <span className="text-gray-400 text-sm">%TBSA</span>
                    </div>
                    {superficieQueimada && !isValidSuperficie(parseFloat(superficieQueimada.replace(",", "."))) && (
                      <p className="text-red-400 text-xs mt-1">Percentual deve estar entre 0 e 100%</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="pediatrico"
                      checked={isPediatrico}
                      onCheckedChange={setIsPediatrico}
                    />
                    <Label htmlFor="pediatrico" className="text-white">
                      Paciente pediátrico
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Crianças usam fator 3 mL/kg/%TBSA</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {/* Resultados */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-semibold mb-3">Resultados</h3>
                    <div className="space-y-3">
                      <CopyableValue
                        label="Volume total (24h)"
                        value={formatNumber(resultados.volumeTotal, 0)}
                        suffix="mL"
                      />
                      <CopyableValue
                        label="Volume 0-8h (50%)"
                        value={formatNumber(resultados.volume0a8h, 0)}
                        suffix="mL"
                      />
                      <CopyableValue
                        label="Volume 8-24h (50%)"
                        value={formatNumber(resultados.volume8a24h, 0)}
                        suffix="mL"
                      />
                    </div>
                  </div>

                  {hasValidInputs && (
                    <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                      <p className="text-blue-200 text-sm">
                        <strong>Fórmula aplicada:</strong><br/>
                        {formatNumber(resultados.volumeTotal, 0)} mL = {resultados.fator} × {peso} kg × {superficieQueimada}%
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Alertas importantes */}
              {hasValidInputs && (
                <div className="mt-6 p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
                  <h4 className="text-yellow-200 font-semibold mb-2">⚠️ Alertas Importantes</h4>
                  <ul className="text-yellow-200 text-sm space-y-1 list-disc pl-5">
                    <li>Esta é uma estimativa inicial. Ajustar conforme resposta clínica</li>
                    <li>Monitorar débito urinário: {isPediatrico ? "1-2" : "0,5-1"} mL/kg/h</li>
                    <li>Avaliar sinais de sobrecarga ou hipovolemia</li>
                    <li>Considerar albumina se queimadura {'>'} 30% TBSA</li>
                    {parseFloat(superficieQueimada.replace(",", ".")) > 20 && (
                      <li>Queimadura {'>'} 20%: considerar transferência para centro especializado</li>
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Referências */}
          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white">Referências</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-300">
              <ul className="space-y-1">
                <li>• StatPearls – Parkland formula. NCBI Bookshelf.</li>
                <li>• American Burn Association. Guidelines for burn care.</li>
                <li>• Baxter CR. Fluid volume and electrolyte changes of the early postburn period. Clin Plast Surg. 1974.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook: Exportado para uso em Calculators.jsx
// Conector: Integra com sistema de calculadoras via props open/onOpenChange
// Teste: Verificar cálculos com casos conhecidos (adulto 70kg, 30% = 8400mL total)