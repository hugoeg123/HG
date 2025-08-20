import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PaO2FiO2 = () => {
  const [pao2, setPao2] = useState('');
  const [fio2, setFio2] = useState('');
  const [result, setResult] = useState(null);

  const calculateRatio = () => {
    if (!pao2 || !fio2) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    const pao2Val = parseFloat(pao2);
    let fio2Val = parseFloat(fio2);

    if (pao2Val <= 0 || fio2Val <= 0) {
      alert('Por favor, insira valores válidos (maiores que zero)');
      return;
    }

    // Convert FiO2 percentage to decimal if needed
    if (fio2Val > 1) {
      fio2Val = fio2Val / 100;
    }

    if (fio2Val > 1) {
      alert('FiO2 deve ser entre 0.21 e 1.0 (ou 21% a 100%)');
      return;
    }

    // PaO2/FiO2 ratio
    const ratio = pao2Val / fio2Val;

    setResult({
      ratio: Math.round(ratio),
      fio2Decimal: fio2Val,
      fio2Percent: Math.round(fio2Val * 100),
      interpretation: getInterpretation(ratio)
    });
  };

  const getInterpretation = (ratio) => {
    if (ratio >= 400) {
      return {
        category: 'Normal',
        severity: 'Sem lesão pulmonar aguda',
        description: 'Função pulmonar normal',
        color: 'green'
      };
    } else if (ratio >= 300) {
      return {
        category: 'Lesão Pulmonar Leve',
        severity: 'SDRA Leve',
        description: 'Lesão pulmonar aguda leve',
        color: 'yellow'
      };
    } else if (ratio >= 200) {
      return {
        category: 'Lesão Pulmonar Moderada',
        severity: 'SDRA Moderada',
        description: 'Síndrome do desconforto respiratório agudo moderada',
        color: 'orange'
      };
    } else {
      return {
        category: 'Lesão Pulmonar Grave',
        severity: 'SDRA Grave',
        description: 'Síndrome do desconforto respiratório agudo grave',
        color: 'red'
      };
    }
  };

  const clearForm = () => {
    setPao2('');
    setFio2('');
    setResult(null);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Relação PaO2/FiO2</CardTitle>
        <CardDescription>
          Índice de oxigenação para avaliação da função pulmonar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pao2">PaO2 (mmHg)</Label>
          <Input
            id="pao2"
            type="number"
            step="0.1"
            placeholder="Ex: 80"
            value={pao2}
            onChange={(e) => setPao2(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fio2">FiO2 (decimal ou %)</Label>
          <Input
            id="fio2"
            type="number"
            step="0.01"
            placeholder="Ex: 0.21 ou 21"
            value={fio2}
            onChange={(e) => setFio2(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Digite como decimal (0.21-1.0) ou porcentagem (21-100)
          </p>
        </div>

        <div className="flex space-x-2">
          <Button onClick={calculateRatio} className="flex-1">
            Calcular
          </Button>
          <Button onClick={clearForm} variant="outline" className="flex-1">
            Limpar
          </Button>
        </div>

        {result && (
          <div className={`mt-4 p-4 rounded-lg ${
            result.interpretation.color === 'green' ? 'bg-green-50' :
            result.interpretation.color === 'yellow' ? 'bg-yellow-50' :
            result.interpretation.color === 'orange' ? 'bg-orange-50' :
            'bg-red-50'
          }`}>
            <h3 className={`font-semibold ${
              result.interpretation.color === 'green' ? 'text-green-900' :
              result.interpretation.color === 'yellow' ? 'text-yellow-900' :
              result.interpretation.color === 'orange' ? 'text-orange-900' :
              'text-red-900'
            }`}>Resultado:</h3>
            <p className={`${
              result.interpretation.color === 'green' ? 'text-green-800' :
              result.interpretation.color === 'yellow' ? 'text-yellow-800' :
              result.interpretation.color === 'orange' ? 'text-orange-800' :
              'text-red-800'
            }`}>
              <strong>PaO2/FiO2:</strong> {result.ratio}
            </p>
            <p className={`text-sm ${
              result.interpretation.color === 'green' ? 'text-green-700' :
              result.interpretation.color === 'yellow' ? 'text-yellow-700' :
              result.interpretation.color === 'orange' ? 'text-orange-700' :
              'text-red-700'
            }`}>
              FiO2: {result.fio2Percent}% ({result.fio2Decimal.toFixed(2)})
            </p>
            <div className={`w-full h-px my-2 ${
              result.interpretation.color === 'green' ? 'bg-green-200' :
              result.interpretation.color === 'yellow' ? 'bg-yellow-200' :
              result.interpretation.color === 'orange' ? 'bg-orange-200' :
              'bg-red-200'
            }`}></div>
            <div className="space-y-1">
              <p className={`text-sm font-medium ${
                result.interpretation.color === 'green' ? 'text-green-900' :
                result.interpretation.color === 'yellow' ? 'text-yellow-900' :
                result.interpretation.color === 'orange' ? 'text-orange-900' :
                'text-red-900'
              }`}>
                {result.interpretation.category}
              </p>
              <p className={`text-sm ${
                result.interpretation.color === 'green' ? 'text-green-800' :
                result.interpretation.color === 'yellow' ? 'text-yellow-800' :
                result.interpretation.color === 'orange' ? 'text-orange-800' :
                'text-red-800'
              }`}>
                <strong>{result.interpretation.severity}</strong>
              </p>
              <p className={`text-xs ${
                result.interpretation.color === 'green' ? 'text-green-600' :
                result.interpretation.color === 'yellow' ? 'text-yellow-600' :
                result.interpretation.color === 'orange' ? 'text-orange-600' :
                'text-red-600'
              }`}>
                {result.interpretation.description}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaO2FiO2;