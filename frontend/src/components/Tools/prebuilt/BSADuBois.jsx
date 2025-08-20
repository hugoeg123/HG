import React, { useState, useEffect } from 'react';
import { Calculator, User, Info, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const BSADuBois = ({ onClose }) => {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const calculateBSA = () => {
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (!weightNum || !heightNum || weightNum <= 0 || heightNum <= 0) {
      toast.error('Por favor, insira valores válidos para peso e altura');
      return;
    }

    // Convert height from meters to centimeters for DuBois formula
    const heightCm = heightNum * 100;
    
    // DuBois formula: BSA (m²) = 0.007184 × weight(kg)^0.425 × height(cm)^0.725
    const bsa = 0.007184 * Math.pow(weightNum, 0.425) * Math.pow(heightCm, 0.725);
    
    setResult({
      bsa: bsa.toFixed(2),
      weightKg: weightNum.toFixed(1),
      heightCm: heightCm.toFixed(0)
    });
  };

  const copyResult = async () => {
    if (!result) return;
    
    const text = `ASC (DuBois): ${result.bsa} m²`;
    
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
    setWeight('');
    setHeight('');
    setResult(null);
  };

  useEffect(() => {
    if (weight && height) {
      calculateBSA();
    } else {
      setResult(null);
    }
  }, [weight, height]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <User className="h-6 w-6 text-teal-400" />
            <CardTitle className="text-xl">ASC - Fórmula de DuBois</CardTitle>
          </div>
          <CardDescription>
            Calcule a Área de Superfície Corporal pela fórmula clássica de DuBois
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="70"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                step="0.1"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Altura (m)</Label>
              <Input
                id="height"
                type="number"
                placeholder="1.75"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* Formula */}
          <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-gray-300" />
              <span className="text-sm font-medium text-gray-100">Fórmula de DuBois:</span>
            </div>
            <div className="text-sm text-gray-300 font-mono">
              ASC (m²) = 0,007184 × Peso^0,425 × Altura(cm)^0,725
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <Separator />
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-white">
                  {result.bsa} <span className="text-lg font-normal text-gray-300">m²</span>
                </div>
                <div className="text-sm text-gray-300">
                  Peso: {result.weightKg} kg | Altura: {result.heightCm} cm
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
          <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-teal-400" />
              <span className="text-sm font-medium text-gray-100">Sobre a Fórmula:</span>
            </div>
            <div className="text-xs text-gray-300 space-y-1">
              <div>• Primeira fórmula desenvolvida (1916)</div>
              <div>• Baseada em dados anatômicos diretos</div>
              <div>• Mais precisa para adultos normais</div>
              <div>• Referência histórica em farmacologia</div>
              <div>• Valores normais: 1,5 - 2,0 m² (adultos)</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button onClick={clearInputs} variant="outline" className="flex-1">
              Limpar
            </Button>
            <Button onClick={onClose} className="flex-1">
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BSADuBois;