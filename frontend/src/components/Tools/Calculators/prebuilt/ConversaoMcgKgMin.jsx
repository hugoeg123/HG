import React, { useState, useEffect } from 'react';
import { Calculator, Activity, Info, Copy, Check } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const ConversaoMcgKgMin = ({ open, onOpenChange }) => {
  const [dose, setDose] = useState('');
  const [peso, setPeso] = useState('');
  const [concentracao, setConcentracao] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const calculateConversao = () => {
    const doseNum = parseFloat(dose);
    const pesoNum = parseFloat(peso);
    const concentracaoNum = parseFloat(concentracao);

    if (!doseNum || !pesoNum || !concentracaoNum || doseNum <= 0 || pesoNum <= 0 || concentracaoNum <= 0) {
      toast.error('Por favor, insira valores válidos');
      return;
    }

    // Cálculo: mL/h = (mcg/kg/min × peso × 60) / concentração
    const velocidadeInfusao = (doseNum * pesoNum * 60) / concentracaoNum;
    const doseTotal = doseNum * pesoNum; // mcg/min
    
    setResult({
      velocidadeInfusao: velocidadeInfusao.toFixed(2),
      doseTotal: doseTotal.toFixed(1),
      dose: doseNum,
      peso: pesoNum,
      concentracao: concentracaoNum
    });
  };

  const copyResult = async () => {
    if (!result) return;
    
    const text = `Velocidade: ${result.velocidadeInfusao} mL/h\nDose total: ${result.doseTotal} mcg/min`;
    
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
    setResult(null);
  };

  useEffect(() => {
    if (dose && peso && concentracao) {
      calculateConversao();
    } else {
      setResult(null);
    }
  }, [dose, peso, concentracao]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-green-600" />
            Conversão mcg/kg/min → mL/h
          </DialogTitle>
          <DialogDescription>
            Converta dose em mcg/kg/min para velocidade de infusão em mL/h
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
          </div>

          {/* Formula */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Fórmula:</span>
            </div>
            <div className="text-sm text-gray-600 font-mono">
              mL/h = (mcg/kg/min × peso × 60) / concentração
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <Separator />
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-gray-900">
                  {result.velocidadeInfusao} <span className="text-lg font-normal text-gray-600">mL/h</span>
                </div>
                <div className="text-lg font-semibold text-green-600">
                  {result.doseTotal} <span className="text-sm font-normal">mcg/min</span>
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
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Medicamentos Comuns:</span>
            </div>
            <div className="text-xs text-green-700 space-y-1">
              <div>• Dopamina: 400 mg/250 mL (1600 mcg/mL)</div>
              <div>• Dobutamina: 250 mg/250 mL (1000 mcg/mL)</div>
              <div>• Noradrenalina: 4 mg/250 mL (16 mcg/mL)</div>
              <div>• Adrenalina: 2 mg/250 mL (8 mcg/mL)</div>
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

export default ConversaoMcgKgMin;