import React, { useState, useEffect } from 'react';
import { Calculator, User, Info, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const LeanBodyWeight = ({ onClose }) => {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [sex, setSex] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const calculateLBW = () => {
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (!weightNum || !heightNum || !sex || weightNum <= 0 || heightNum <= 0) {
      toast.error('Por favor, preencha todos os campos com valores válidos');
      return;
    }

    // Convert height to cm if needed
    const heightCm = heightNum > 3 ? heightNum : heightNum * 100;
    
    let lbw;
    
    // Boer formula for Lean Body Weight
    if (sex === 'male') {
      lbw = (0.407 * weightNum) + (0.267 * heightCm) - 19.2;
    } else {
      lbw = (0.252 * weightNum) + (0.473 * heightCm) - 48.3;
    }
    
    // Calculate body fat percentage
    const bodyFatPercentage = ((weightNum - lbw) / weightNum) * 100;
    
    setResult({
      lbw: Math.max(0, lbw).toFixed(1),
      bodyFat: Math.max(0, bodyFatPercentage).toFixed(1),
      totalWeight: weightNum.toFixed(1),
      heightCm: heightCm.toFixed(0),
      sex: sex === 'male' ? 'Masculino' : 'Feminino'
    });
  };

  const copyResult = async () => {
    if (!result) return;
    
    const text = `Massa Corporal Magra: ${result.lbw} kg\nGordura corporal: ${result.bodyFat}%`;
    
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
    setSex('');
    setResult(null);
  };

  useEffect(() => {
    if (weight && height && sex) {
      calculateLBW();
    } else {
      setResult(null);
    }
  }, [weight, height, sex]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <User className="h-6 w-6 text-green-600" />
            <CardTitle className="text-xl">Massa Corporal Magra</CardTitle>
          </div>
          <CardDescription>
            Calcule a massa corporal magra pela fórmula de Boer
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Inputs */}
          <div className="space-y-4">
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
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="175"
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
          </div>

          {/* Formula */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Fórmula de Boer:</span>
            </div>
            <div className="text-xs text-gray-600 font-mono space-y-1">
              <div>♂: MCM = (0,407 × Peso) + (0,267 × Altura) - 19,2</div>
              <div>♀: MCM = (0,252 × Peso) + (0,473 × Altura) - 48,3</div>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <Separator />
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-gray-900">
                  {result.lbw} <span className="text-lg font-normal text-gray-600">kg</span>
                </div>
                <div className="text-sm text-gray-600">
                  Massa Corporal Magra
                </div>
                <div className="text-sm text-gray-500">
                  Gordura corporal: {result.bodyFat}%
                </div>
                <div className="text-xs text-gray-500">
                  {result.sex} | {result.totalWeight} kg | {result.heightCm} cm
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
              <span className="text-sm font-medium text-green-800">Aplicações Clínicas:</span>
            </div>
            <div className="text-xs text-green-700 space-y-1">
              <div>• Dosagem de medicamentos hidrofílicos</div>
              <div>• Avaliação da composição corporal</div>
              <div>• Cálculo de necessidades proteicas</div>
              <div>• Planejamento nutricional</div>
              <div>• Valores normais: 60-80% do peso total</div>
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

export default LeanBodyWeight;