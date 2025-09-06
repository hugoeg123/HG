import React, { useState, useEffect } from 'react';
import { Calculator, Droplets, Activity, Info, Copy, Check } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/card';
import { Separator } from '../../../ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../ui/dialog';
import { toast } from 'sonner';

const ConversaoMcgKgMinGttMin = ({ open, onOpenChange }) => {
  const [dose, setDose] = useState('');
  const [peso, setPeso] = useState('');
  const [concentracao, setConcentracao] = useState('');
  const [fatorGotejamento, setFatorGotejamento] = useState('20'); // Padrão: 20 gtt/mL
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const calculateConversao = () => {
    const doseNum = parseFloat(dose);
    const pesoNum = parseFloat(peso);
    const concentracaoNum = parseFloat(concentracao);
    const fatorNum = parseFloat(fatorGotejamento);

    if (!doseNum || !pesoNum || !concentracaoNum || !fatorNum || 
        doseNum <= 0 || pesoNum <= 0 || concentracaoNum <= 0 || fatorNum <= 0) {
      toast.error('Por favor, insira valores válidos');
      return;
    }

    // Primeiro: mcg/kg/min → mL/h
    const velocidadeInfusao = (doseNum * pesoNum * 60) / concentracaoNum;
    
    // Segundo: mL/h → gtt/min
    const gotejamento = (velocidadeInfusao * fatorNum) / 60;
    
    const doseTotal = doseNum * pesoNum; // mcg/min
    
    setResult({
      velocidadeInfusao: velocidadeInfusao.toFixed(2),
      gotejamento: gotejamento.toFixed(0),
      doseTotal: doseTotal.toFixed(1),
      dose: doseNum,
      peso: pesoNum,
      concentracao: concentracaoNum,
      fator: fatorNum
    });
  };

  const copyResult = async () => {
    if (!result) return;
    
    const text = `Gotejamento: ${result.gotejamento} gtt/min\nVelocidade: ${result.velocidadeInfusao} mL/h\nDose total: ${result.doseTotal} mcg/min`;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Resultado copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar resultado');
    }
  };

  const clearInputs = () => {
    setDose('');
    setPeso('');
    setConcentracao('');
    setFatorGotejamento('20');
    setResult(null);
  };

  useEffect(() => {
    if (dose && peso && concentracao && fatorGotejamento) {
      calculateConversao();
    } else {
      setResult(null);
    }
  }, [dose, peso, concentracao, fatorGotejamento]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex">
              <Activity className="h-6 w-6 text-green-600" />
              <Droplets className="h-6 w-6 text-blue-600 -ml-1" />
            </div>
            mcg/kg/min → gtt/min
          </DialogTitle>
          <DialogDescription>
            Converta dose em mcg/kg/min diretamente para gotejamento
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Inputs */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dose">Dose (mcg/kg/min)</Label>
              <Input
                id="dose"
                type="number"
                placeholder="5"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                step="0.1"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="peso">Peso (kg)</Label>
              <Input
                id="peso"
                type="number"
                placeholder="70"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                step="0.1"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="concentracao">Concentração (mcg/mL)</Label>
              <Input
                id="concentracao"
                type="number"
                placeholder="400"
                value={concentracao}
                onChange={(e) => setConcentracao(e.target.value)}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fator">Fator de Gotejamento (gtt/mL)</Label>
              <Input
                id="fator"
                type="number"
                placeholder="20"
                value={fatorGotejamento}
                onChange={(e) => setFatorGotejamento(e.target.value)}
                min="0"
              />
            </div>
          </div>

          {/* Formula */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Fórmulas:</span>
            </div>
            <div className="text-xs text-gray-600 font-mono space-y-1">
              <div>1. mL/h = (mcg/kg/min × peso × 60) / concentração</div>
              <div>2. gtt/min = (mL/h × fator) / 60</div>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <Separator />
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-blue-600">
                  {result.gotejamento} <span className="text-lg font-normal text-gray-600">gtt/min</span>
                </div>
                <div className="text-lg font-semibold text-green-600">
                  {result.velocidadeInfusao} <span className="text-sm font-normal">mL/h</span>
                </div>
                <div className="text-sm text-gray-600">
                  Dose total: {result.doseTotal} mcg/min
                </div>
              </div>
              
              <Button
                onClick={copyResult}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {copied ? (
                  <><Check className="h-4 w-4 mr-2" /> Copiado!</>
                ) : (
                  <><Copy className="h-4 w-4 mr-2" /> Copiar Resultado</>
                )}
              </Button>
            </div>
          )}

          {/* Information */}
          <div className="bg-amber-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Informações:</span>
            </div>
            <div className="text-xs text-amber-700 space-y-1">
              <div>• Macrogotas: 20 gtt/mL</div>
              <div>• Microgotas: 60 gtt/mL</div>
              <div>• Conversão direta para administração</div>
              <div>• Útil para drogas vasoativas</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button onClick={clearInputs} variant="outline" className="flex-1">
              Limpar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConversaoMcgKgMinGttMin;
