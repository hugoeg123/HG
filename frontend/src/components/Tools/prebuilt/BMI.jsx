import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Copy, Info, Calculator, Check } from 'lucide-react';
import { toast } from 'sonner';

const BMI = ({ open, onOpenChange }) => {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [result, setResult] = useState(null);
  const [category, setCategory] = useState('');
  const [copied, setCopied] = useState(false);

  const calculateBMI = () => {
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (!weightNum || !heightNum || weightNum <= 0 || heightNum <= 0) {
      toast.error('Por favor, insira valores válidos para peso e altura');
      return;
    }

    // Convert height from cm to meters
    const heightInMeters = heightNum / 100;
    const bmi = weightNum / (heightInMeters * heightInMeters);

    let bmiCategory = '';
    if (bmi < 18.5) {
      bmiCategory = 'Abaixo do peso';
    } else if (bmi >= 18.5 && bmi < 25) {
      bmiCategory = 'Peso normal';
    } else if (bmi >= 25 && bmi < 30) {
      bmiCategory = 'Sobrepeso';
    } else if (bmi >= 30 && bmi < 35) {
      bmiCategory = 'Obesidade grau I';
    } else if (bmi >= 35 && bmi < 40) {
      bmiCategory = 'Obesidade grau II';
    } else {
      bmiCategory = 'Obesidade grau III';
    }

    setResult(bmi.toFixed(1));
    setCategory(bmiCategory);
  };

  const copyResult = async () => {
    if (!result) return;
    
    const text = `IMC: ${result} kg/m²\nCategoria: ${category}`;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Resultado copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar resultado');
    }
  };

  const clearFields = () => {
    setWeight('');
    setHeight('');
    setResult(null);
    setCategory('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-theme-background border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <Calculator className="h-6 w-6 text-blue-600" />
            Índice de Massa Corporal (IMC)
          </DialogTitle>
        </DialogHeader>
        
    <Card className="border-gray-700 bg-gray-800/50">
      <CardHeader>
        <CardTitle className="text-white">Parâmetros Antropométricos</CardTitle>
        <CardDescription className="text-gray-300">
          Calcule o IMC baseado no peso e altura do paciente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="weight">Peso (kg)</Label>
          <Input
            id="weight"
            type="number"
            placeholder="Ex: 70"
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
            placeholder="Ex: 175"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            step="0.1"
            min="0"
          />
        </div>

        {/* Fórmula */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Fórmula:</span>
          </div>
          <div className="text-xs text-gray-600 font-mono">
            IMC = Peso (kg) / Altura² (m²)
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={calculateBMI} className="flex-1">
            Calcular
          </Button>
          <Button variant="outline" onClick={clearFields}>
            Limpar
          </Button>
        </div>

        {result && (
          <div className="space-y-3">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Resultado:</h3>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-blue-900">
                  {result} <span className="text-lg font-normal text-blue-700">kg/m²</span>
                </div>
                <div className="text-sm text-blue-800">
                  Índice de Massa Corporal
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
            
            {/* Categoria */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Classificação:</span>
              </div>
              <div className={`text-sm font-medium mb-2 ${
                category === 'Peso normal' ? 'text-green-700' :
                category === 'Abaixo do peso' ? 'text-blue-700' :
                category === 'Sobrepeso' ? 'text-yellow-700' :
                'text-red-700'
              }`}>
                {category}
              </div>
            </div>
          </div>
        )}

        {/* Referências */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Categorias de IMC:</span>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>• &lt; 18,5:</strong> Abaixo do peso</div>
            <div><strong>• 18,5 - 24,9:</strong> Peso normal</div>
            <div><strong>• 25,0 - 29,9:</strong> Sobrepeso</div>
            <div><strong>• 30,0 - 34,9:</strong> Obesidade grau I</div>
            <div><strong>• 35,0 - 39,9:</strong> Obesidade grau II</div>
            <div><strong>• ≥ 40,0:</strong> Obesidade grau III</div>
          </div>
        </div>
      </CardContent>
    </Card>
      </DialogContent>
    </Dialog>
  );
};

export default BMI;