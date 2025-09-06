import React, { useState, useEffect } from 'react';
import { Calculator, Droplets, Info, Copy, Check } from 'lucide-react';
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

const ConversaoGotejamento = ({ open, onOpenChange }) => {
  const [volume, setVolume] = useState('');
  const [tempo, setTempo] = useState('');
  const [fatorGotejamento, setFatorGotejamento] = useState('20'); // Padrão: 20 gtt/mL
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const calculateGotejamento = () => {
    const volumeNum = parseFloat(volume);
    const tempoNum = parseFloat(tempo);
    const fatorNum = parseFloat(fatorGotejamento);

    if (!volumeNum || !tempoNum || !fatorNum || volumeNum <= 0 || tempoNum <= 0 || fatorNum <= 0) {
      toast.error('Por favor, insira valores válidos');
      return;
    }

    // Cálculo: Gotejamento (gtt/min) = (Volume × Fator) / Tempo
    const gotejamento = (volumeNum * fatorNum) / tempoNum;
    const velocidadeInfusao = volumeNum / tempoNum; // mL/h
    
    setResult({
      gotejamento: gotejamento.toFixed(0),
      velocidadeInfusao: velocidadeInfusao.toFixed(1),
      volume: volumeNum,
      tempo: tempoNum,
      fator: fatorNum
    });
  };

  const copyResult = async () => {
    if (!result) return;
    
    const text = `Gotejamento: ${result.gotejamento} gtt/min\nVelocidade: ${result.velocidadeInfusao} mL/h`;
    
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
    setVolume('');
    setTempo('');
    setFatorGotejamento('20');
    setResult(null);
  };

  useEffect(() => {
    if (volume && tempo && fatorGotejamento) {
      calculateGotejamento();
    } else {
      setResult(null);
    }
  }, [volume, tempo, fatorGotejamento]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="h-6 w-6 text-blue-600" />
            Conversão de Gotejamento
          </DialogTitle>
          <DialogDescription>
            Calcule o gotejamento e velocidade de infusão
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Inputs */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="volume">Volume (mL)</Label>
              <Input
                id="volume"
                type="number"
                placeholder="500"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tempo">Tempo (horas)</Label>
              <Input
                id="tempo"
                type="number"
                placeholder="8"
                value={tempo}
                onChange={(e) => setTempo(e.target.value)}
                step="0.1"
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
              <span className="text-sm font-medium text-gray-700">Fórmula:</span>
            </div>
            <div className="text-sm text-gray-600 font-mono">
              Gotejamento = (Volume × Fator) / Tempo
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <Separator />
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-gray-900">
                  {result.gotejamento} <span className="text-lg font-normal text-gray-600">gtt/min</span>
                </div>
                <div className="text-lg font-semibold text-blue-600">
                  {result.velocidadeInfusao} <span className="text-sm font-normal">mL/h</span>
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
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Fatores Comuns:</span>
            </div>
            <div className="text-xs text-blue-700 space-y-1">
              <div>• Macrogotas: 20 gtt/mL</div>
              <div>• Microgotas: 60 gtt/mL</div>
              <div>• Equipo pediátrico: 60 gtt/mL</div>
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

export default ConversaoGotejamento;
