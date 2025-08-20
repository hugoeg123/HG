import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, Calculator, Info } from 'lucide-react';
import { toast } from 'sonner';

const FeUrea = ({ open, onOpenChange }) => {
  const [serumUrea, setSerumUrea] = useState('');
  const [urineUrea, setUrineUrea] = useState('');
  const [serumCr, setSerumCr] = useState('');
  const [urineCr, setUrineCr] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const calculateFeUrea = () => {
    if (!serumUrea || !urineUrea || !serumCr || !urineCr) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    const sUrea = parseFloat(serumUrea);
    const uUrea = parseFloat(urineUrea);
    const sCr = parseFloat(serumCr);
    const uCr = parseFloat(urineCr);

    if (sUrea <= 0 || uUrea <= 0 || sCr <= 0 || uCr <= 0) {
      toast.error('Por favor, insira valores válidos (maiores que zero)');
      return;
    }

    // FeUrea = (UUrea × SCr) / (SUrea × UCr) × 100
    const feUrea = ((uUrea * sCr) / (sUrea * uCr)) * 100;

    setResult({
      feurea: feUrea.toFixed(2),
      interpretation: getInterpretation(feUrea)
    });
  };

  const getInterpretation = (feurea) => {
    if (feurea < 35) {
      return {
        category: 'FeUrea < 35%',
        meaning: 'Sugere azotemia pré-renal',
        description: 'Indica reabsorção aumentada de ureia pelos túbulos, típica de hipoperfusão renal'
      };
    } else if (feurea > 50) {
      return {
        category: 'FeUrea > 50%',
        meaning: 'Sugere necrose tubular aguda',
        description: 'Indica perda da capacidade de reabsorção tubular de ureia'
      };
    } else {
      return {
        category: 'FeUrea 35-50%',
        meaning: 'Zona intermediária',
        description: 'Pode ocorrer em ambas as condições, avaliar contexto clínico'
      };
    }
  };

  const clearForm = () => {
    setSerumUrea('');
    setUrineUrea('');
    setSerumCr('');
    setUrineCr('');
    setResult(null);
  };

  const copyResult = async () => {
    if (!result) return;
    
    const text = `Excreção Fracionada de Ureia: ${result.feurea}%\nInterpretação: ${result.interpretation.meaning}`;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Resultado copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar resultado');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-theme-background border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <Calculator className="h-6 w-6 text-teal-400" />
            Excreção Fracionada de Ureia (FeUrea)
          </DialogTitle>
        </DialogHeader>
        
    <Card className="border-gray-700 bg-gray-800/50">
      <CardHeader>
        <CardTitle className="text-white">Parâmetros Laboratoriais</CardTitle>
        <CardDescription className="text-gray-300">
          Avaliação da função renal e diferenciação de IRA pré-renal vs renal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="serumUrea">Ureia Sérica (mg/dL)</Label>
          <Input
            id="serumUrea"
            type="number"
            step="0.1"
            placeholder="Ex: 60"
            value={serumUrea}
            onChange={(e) => setSerumUrea(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="urineUrea">Ureia Urinária (mg/dL)</Label>
          <Input
            id="urineUrea"
            type="number"
            step="0.1"
            placeholder="Ex: 300"
            value={urineUrea}
            onChange={(e) => setUrineUrea(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="serumCr">Creatinina Sérica (mg/dL)</Label>
          <Input
            id="serumCr"
            type="number"
            step="0.01"
            placeholder="Ex: 1.2"
            value={serumCr}
            onChange={(e) => setSerumCr(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="urineCr">Creatinina Urinária (mg/dL)</Label>
          <Input
            id="urineCr"
            type="number"
            step="0.1"
            placeholder="Ex: 80"
            value={urineCr}
            onChange={(e) => setUrineCr(e.target.value)}
          />
        </div>

        {/* Fórmula */}
        <div className="bg-gray-800/50 border border-gray-600 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-4 w-4 text-teal-400" />
            <span className="text-sm font-medium text-gray-100">Fórmula:</span>
          </div>
          <div className="text-xs text-gray-300 font-mono">
            FeUrea = [(Ureia urina / Ureia plasma) / (Creatinina urina / Creatinina plasma)] × 100
          </div>
        </div>

        <div className="flex space-x-2">
          <Button onClick={calculateFeUrea} className="flex-1">
            Calcular
          </Button>
          <Button onClick={clearForm} variant="outline" className="flex-1">
            Limpar
          </Button>
        </div>

        {result && (
          <div className="space-y-3">
            <div className="bg-gray-800/50 border border-gray-600 p-4 rounded-lg">
              <h3 className="font-semibold text-white">Resultado:</h3>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-white">
                  {result.feurea}<span className="text-lg font-normal text-gray-300">%</span>
                </div>
                <div className="text-sm text-gray-300">
                  Excreção Fracionada de Ureia
                </div>
              </div>
              
              <Button
                onClick={copyResult}
                variant="outline"
                size="sm"
                className="w-full mt-3"
              >
                {copied ? (
                  <><Check className="h-4 w-4 mr-2" /> Copiado!</>
                ) : (
                  <><Copy className="h-4 w-4 mr-2" /> Copiar Resultado</>
                )}
              </Button>
            </div>
            
            {/* Interpretação Clínica */}
            <div className="bg-gray-800/50 border border-gray-600 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-teal-400" />
                <span className="text-sm font-medium text-gray-100">Interpretação Clínica:</span>
              </div>
              <div className="text-sm text-white font-medium mb-2">
                {result.interpretation.meaning}
              </div>
              <div className="text-xs text-gray-300 space-y-1">
                <div><strong>• FeUrea &lt; 35%:</strong> IRA pré-renal (hipovolemia, baixo débito cardíaco)</div>
                <div><strong>• FeUrea ≥ 35%:</strong> IRA renal (necrose tubular aguda, glomerulonefrite)</div>
                <div><strong>Vantagem:</strong> Menos afetada por diuréticos que a FeNa</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
      </DialogContent>
    </Dialog>
  );
};

export default FeUrea;