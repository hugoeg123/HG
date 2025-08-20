import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const FeNa = () => {
  const [serumNa, setSerumNa] = useState('');
  const [urineNa, setUrineNa] = useState('');
  const [serumCr, setSerumCr] = useState('');
  const [urineCr, setUrineCr] = useState('');
  const [result, setResult] = useState(null);

  const calculateFeNa = () => {
    if (!serumNa || !urineNa || !serumCr || !urineCr) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    const sNa = parseFloat(serumNa);
    const uNa = parseFloat(urineNa);
    const sCr = parseFloat(serumCr);
    const uCr = parseFloat(urineCr);

    if (sNa <= 0 || uNa <= 0 || sCr <= 0 || uCr <= 0) {
      alert('Por favor, insira valores válidos (maiores que zero)');
      return;
    }

    // FeNa = (UNa × SCr) / (SNa × UCr) × 100
    const feNa = ((uNa * sCr) / (sNa * uCr)) * 100;

    setResult({
      fena: feNa.toFixed(2),
      interpretation: getInterpretation(feNa)
    });
  };

  const getInterpretation = (fena) => {
    if (fena < 1) {
      return {
        category: 'FeNa < 1%',
        meaning: 'Sugere azotemia pré-renal',
        description: 'Indica retenção de sódio pelos rins, típica de hipoperfusão renal'
      };
    } else if (fena > 2) {
      return {
        category: 'FeNa > 2%',
        meaning: 'Sugere necrose tubular aguda',
        description: 'Indica perda da capacidade de reabsorção tubular de sódio'
      };
    } else {
      return {
        category: 'FeNa 1-2%',
        meaning: 'Zona intermediária',
        description: 'Pode ocorrer em ambas as condições, avaliar contexto clínico'
      };
    }
  };

  const clearForm = () => {
    setSerumNa('');
    setUrineNa('');
    setSerumCr('');
    setUrineCr('');
    setResult(null);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>FeNa</CardTitle>
        <CardDescription>
          Fração de Excreção de Sódio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="serumNa">Sódio Sérico (mEq/L)</Label>
          <Input
            id="serumNa"
            type="number"
            step="0.1"
            placeholder="Ex: 140"
            value={serumNa}
            onChange={(e) => setSerumNa(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="urineNa">Sódio Urinário (mEq/L)</Label>
          <Input
            id="urineNa"
            type="number"
            step="0.1"
            placeholder="Ex: 20"
            value={urineNa}
            onChange={(e) => setUrineNa(e.target.value)}
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

        <div className="flex space-x-2">
          <Button onClick={calculateFeNa} className="flex-1">
            Calcular
          </Button>
          <Button onClick={clearForm} variant="outline" className="flex-1">
            Limpar
          </Button>
        </div>

        {result && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900">Resultado:</h3>
            <p className="text-blue-800">
              <strong>FeNa:</strong> {result.fena}%
            </p>
            <div className="w-full h-px bg-blue-200 my-2"></div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">
                {result.interpretation.category}
              </p>
              <p className="text-sm text-blue-800">
                <strong>{result.interpretation.meaning}</strong>
              </p>
              <p className="text-xs text-blue-600">
                {result.interpretation.description}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeNa;