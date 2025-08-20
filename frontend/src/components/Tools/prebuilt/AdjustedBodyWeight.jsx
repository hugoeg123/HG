import React, { useState, useEffect } from 'react';
import { Calculator, User, Info, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const AdjustedBodyWeight = ({ onClose }) => {
  const [currentWeight, setCurrentWeight] = useState('');
  const [height, setHeight] = useState('');
  const [sex, setSex] = useState('');
  const [correctionFactor, setCorrectionFactor] = useState('0.4');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const calculateABW = () => {
    const currentWeightNum = parseFloat(currentWeight);
    const heightNum = parseFloat(height);
    const factorNum = parseFloat(correctionFactor);

    if (!currentWeightNum || !heightNum || !sex || currentWeightNum <= 0 || heightNum <= 0) {
      toast.error('Por favor, preencha todos os campos com valores válidos');
      return;
    }

    // Calculate Ideal Body Weight using Robinson formula
    let ibw;
    if (sex === 'male') {
      ibw = 52 + (1.9 * (heightNum - 60));
    } else {
      ibw = 49 + (1.7 * (heightNum - 60));
    }
    
    // Ensure IBW is not negative
    ibw = Math.max(ibw, 30);
    
    // Calculate Adjusted Body Weight
    // ABW = IBW + CF × (Current Weight - IBW)
    const abw = ibw + (factorNum * (currentWeightNum - ibw));
    
    // Calculate percentage over ideal weight
    const percentOverIdeal = ((currentWeightNum - ibw) / ibw) * 100;
    
    setResult({
      abw: abw.toFixed(1),
      ibw: ibw.toFixed(1),
      currentWeight: currentWeightNum.toFixed(1),
      percentOverIdeal: percentOverIdeal.toFixed(1),
      correctionFactor: (factorNum * 100).toFixed(0),
      heightInches: heightNum.toFixed(0),
      sex: sex === 'male' ? 'Masculino' : 'Feminino'
    });
  };

  const copyResult = async () => {
    if (!result) return;
    
    const text = `Peso Corporal Ajustado: ${result.abw} kg\nPeso Ideal: ${result.ibw} kg\nPeso Atual: ${result.currentWeight} kg`;
    
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
    setCurrentWeight('');
    setHeight('');
    setSex('');
    setCorrectionFactor('0.4');
    setResult(null);
  };

  useEffect(() => {
    if (currentWeight && height && sex) {
      calculateABW();
    } else {
      setResult(null);
    }
  }, [currentWeight, height, sex, correctionFactor]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <User className="h-6 w-6 text-orange-600" />
            <CardTitle className="text-xl">Peso Corporal Ajustado</CardTitle>
          </div>
          <CardDescription>
            Calcule o peso ajustado para dosagem em pacientes obesos
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Inputs */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentWeight">Peso Atual (kg)</Label>
                <Input
                  id="currentWeight"
                  type="number"
                  placeholder="90"
                  value={currentWeight}
                  onChange={(e) => setCurrentWeight(e.target.value)}
                  step="0.1"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Altura (pol)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="70"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  step="1"
                  min="0"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Sexo</Label>
              <Select value={sex} onValueChange={setSex}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o sexo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Fator de Correção</Label>
              <Select value={correctionFactor} onValueChange={setCorrectionFactor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.3">0,3 (Conservador)</SelectItem>
                  <SelectItem value="0.4">0,4 (Padrão)</SelectItem>
                  <SelectItem value="0.5">0,5 (Liberal)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Formula */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Fórmula:</span>
            </div>
            <div className="text-xs text-gray-600 font-mono space-y-1">
              <div>PCA = PCI + FC × (PA - PCI)</div>
              <div className="text-xs text-gray-500 mt-1">
                PCA = Peso Corporal Ajustado<br/>
                PCI = Peso Corporal Ideal<br/>
                PA = Peso Atual<br/>
                FC = Fator de Correção
              </div>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <Separator />
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-gray-900">
                  {result.abw} <span className="text-lg font-normal text-gray-600">kg</span>
                </div>
                <div className="text-sm text-gray-600">
                  Peso Corporal Ajustado
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div>Peso Ideal: {result.ibw} kg</div>
                  <div>Peso Atual: {result.currentWeight} kg</div>
                </div>
                <div className="text-xs text-gray-500">
                  {result.percentOverIdeal > 0 ? '+' : ''}{result.percentOverIdeal}% do peso ideal | FC: {result.correctionFactor}%
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
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Indicações:</span>
            </div>
            <div className="text-xs text-orange-700 space-y-1">
              <div>• Dosagem em pacientes obesos (IMC &gt; 30)</div>
              <div>• Medicamentos lipofílicos</div>
              <div>• Evita subdosagem em obesos</div>
              <div>• Fator 0,4 é o mais usado clinicamente</div>
              <div>• Usar quando peso atual &gt; 130% do ideal</div>
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

export default AdjustedBodyWeight;