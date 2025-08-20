import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, Calculator, Info } from 'lucide-react';
import { toast } from 'sonner';

const CorrectedCalcium = ({ open, onOpenChange }) => {
  const [totalCalcium, setTotalCalcium] = useState('');
  const [albumin, setAlbumin] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const calculateCorrectedCalcium = () => {
    if (!totalCalcium || !albumin) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    const ca = parseFloat(totalCalcium);
    const alb = parseFloat(albumin);

    if (ca <= 0 || alb <= 0) {
      toast.error('Por favor, insira valores válidos (maiores que zero)');
      return;
    }

    // Corrected Calcium = Total Calcium + 0.8 × (4.0 - Albumin)
    const correctedCa = ca + 0.8 * (4.0 - alb);

    setResult({
      corrected: correctedCa.toFixed(2),
      interpretation: getInterpretation(correctedCa)
    });
  };

  const getInterpretation = (correctedCa) => {
    if (correctedCa < 8.5) {
      return {
        category: 'Hipocalcemia',
        range: '< 8.5 mg/dL',
        description: 'Cálcio corrigido abaixo do normal'
      };
    } else if (correctedCa > 10.5) {
      return {
        category: 'Hipercalcemia',
        range: '> 10.5 mg/dL',
        description: 'Cálcio corrigido acima do normal'
      };
    } else {
      return {
        category: 'Normal',
        range: '8.5 - 10.5 mg/dL',
        description: 'Cálcio corrigido dentro da faixa normal'
      };
    }
  };

  const clearForm = () => {
    setTotalCalcium('');
    setAlbumin('');
    setResult(null);
  };

  const copyResult = async () => {
    if (!result) return;
    
    const text = `Cálcio Corrigido: ${result.corrected} mg/dL - ${result.interpretation.category}`;
    
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
            <Calculator className="h-6 w-6 text-green-600" />
            Cálcio Corrigido pela Albumina
          </DialogTitle>
        </DialogHeader>
        
    <Card className="border-gray-700 bg-gray-800/50">
      <CardHeader>
        <CardTitle className="text-white">Parâmetros Laboratoriais</CardTitle>
        <CardDescription className="text-gray-300">
          Correção do cálcio total pela albumina sérica
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="totalCalcium">Cálcio Total (mg/dL)</Label>
          <Input
            id="totalCalcium"
            type="number"
            step="0.1"
            placeholder="Ex: 9.2"
            value={totalCalcium}
            onChange={(e) => setTotalCalcium(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="albumin">Albumina (g/dL)</Label>
          <Input
            id="albumin"
            type="number"
            step="0.1"
            placeholder="Ex: 3.5"
            value={albumin}
            onChange={(e) => setAlbumin(e.target.value)}
          />
        </div>

        {/* Fórmula */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Fórmula:</span>
          </div>
          <div className="text-sm text-gray-600 font-mono">
            Cálcio Corrigido = Cálcio Total + 0,8 × (4,0 - Albumina)
          </div>
        </div>

        <div className="flex space-x-2">
          <Button onClick={calculateCorrectedCalcium} className="flex-1">
            Calcular
          </Button>
          <Button onClick={clearForm} variant="outline" className="flex-1">
            Limpar
          </Button>
        </div>

        {result && (
          <div className="space-y-3">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Resultado:</h3>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-green-900">
                  {result.corrected} <span className="text-lg font-normal text-green-700">mg/dL</span>
                </div>
                <div className="text-sm text-green-800">
                  <strong>Status:</strong> {result.interpretation.category}
                </div>
                <div className="text-xs text-green-600">
                  Faixa normal: {result.interpretation.range}
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
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Interpretação Clínica:</span>
              </div>
              <div className="text-xs text-green-700 space-y-1">
                <div>• Normal: 8,5 - 10,5 mg/dL</div>
                <div>• Hipocalcemia: &lt; 8,5 mg/dL (tetania, parestesias)</div>
                <div>• Hipercalcemia: &gt; 10,5 mg/dL (nefrolitíase, arritmias)</div>
                <div>• Correção necessária quando albumina &lt; 4,0 g/dL</div>
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

export default CorrectedCalcium;