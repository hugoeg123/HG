import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const FriedewaldLDL = () => {
  const [totalCholesterol, setTotalCholesterol] = useState('');
  const [hdl, setHdl] = useState('');
  const [triglycerides, setTriglycerides] = useState('');
  const [result, setResult] = useState(null);

  const calculateLDL = () => {
    if (!totalCholesterol || !hdl || !triglycerides) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    const tc = parseFloat(totalCholesterol);
    const hdlVal = parseFloat(hdl);
    const tg = parseFloat(triglycerides);

    if (tc <= 0 || hdlVal <= 0 || tg <= 0) {
      alert('Por favor, insira valores válidos (maiores que zero)');
      return;
    }

    if (tg > 400) {
      alert('A fórmula de Friedewald não é válida para triglicerídeos > 400 mg/dL');
      return;
    }

    // Friedewald Formula: LDL = TC - HDL - (TG/5)
    const ldl = tc - hdlVal - (tg / 5);

    setResult({
      ldl: ldl.toFixed(1),
      interpretation: getInterpretation(ldl)
    });
  };

  const getInterpretation = (ldl) => {
    if (ldl < 100) {
      return {
        category: 'Ótimo',
        range: '< 100 mg/dL',
        risk: 'Baixo risco cardiovascular',
        color: 'green'
      };
    } else if (ldl < 130) {
      return {
        category: 'Desejável',
        range: '100-129 mg/dL',
        risk: 'Risco cardiovascular baixo a moderado',
        color: 'blue'
      };
    } else if (ldl < 160) {
      return {
        category: 'Limítrofe',
        range: '130-159 mg/dL',
        risk: 'Risco cardiovascular moderado',
        color: 'yellow'
      };
    } else if (ldl < 190) {
      return {
        category: 'Alto',
        range: '160-189 mg/dL',
        risk: 'Alto risco cardiovascular',
        color: 'orange'
      };
    } else {
      return {
        category: 'Muito Alto',
        range: '≥ 190 mg/dL',
        risk: 'Muito alto risco cardiovascular',
        color: 'red'
      };
    }
  };

  const clearForm = () => {
    setTotalCholesterol('');
    setHdl('');
    setTriglycerides('');
    setResult(null);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>LDL Friedewald</CardTitle>
        <CardDescription>
          Cálculo do LDL-colesterol pela fórmula de Friedewald
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="totalCholesterol">Colesterol Total (mg/dL)</Label>
          <Input
            id="totalCholesterol"
            type="number"
            step="0.1"
            placeholder="Ex: 200"
            value={totalCholesterol}
            onChange={(e) => setTotalCholesterol(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hdl">HDL-Colesterol (mg/dL)</Label>
          <Input
            id="hdl"
            type="number"
            step="0.1"
            placeholder="Ex: 50"
            value={hdl}
            onChange={(e) => setHdl(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="triglycerides">Triglicerídeos (mg/dL)</Label>
          <Input
            id="triglycerides"
            type="number"
            step="0.1"
            placeholder="Ex: 150"
            value={triglycerides}
            onChange={(e) => setTriglycerides(e.target.value)}
          />
        </div>

        <div className="flex space-x-2">
          <Button onClick={calculateLDL} className="flex-1">
            Calcular
          </Button>
          <Button onClick={clearForm} variant="outline" className="flex-1">
            Limpar
          </Button>
        </div>

        {result && (
          <div className={`mt-4 p-4 rounded-lg ${
            result.interpretation.color === 'green' ? 'bg-green-50' :
            result.interpretation.color === 'blue' ? 'bg-blue-50' :
            result.interpretation.color === 'yellow' ? 'bg-yellow-50' :
            result.interpretation.color === 'orange' ? 'bg-orange-50' :
            'bg-red-50'
          }`}>
            <h3 className={`font-semibold ${
              result.interpretation.color === 'green' ? 'text-green-900' :
              result.interpretation.color === 'blue' ? 'text-blue-900' :
              result.interpretation.color === 'yellow' ? 'text-yellow-900' :
              result.interpretation.color === 'orange' ? 'text-orange-900' :
              'text-red-900'
            }`}>Resultado:</h3>
            <p className={`${
              result.interpretation.color === 'green' ? 'text-green-800' :
              result.interpretation.color === 'blue' ? 'text-blue-800' :
              result.interpretation.color === 'yellow' ? 'text-yellow-800' :
              result.interpretation.color === 'orange' ? 'text-orange-800' :
              'text-red-800'
            }`}>
              <strong>LDL-Colesterol:</strong> {result.ldl} mg/dL
            </p>
            <div className={`w-full h-px my-2 ${
              result.interpretation.color === 'green' ? 'bg-green-200' :
              result.interpretation.color === 'blue' ? 'bg-blue-200' :
              result.interpretation.color === 'yellow' ? 'bg-yellow-200' :
              result.interpretation.color === 'orange' ? 'bg-orange-200' :
              'bg-red-200'
            }`}></div>
            <div className="space-y-1">
              <p className={`text-sm font-medium ${
                result.interpretation.color === 'green' ? 'text-green-900' :
                result.interpretation.color === 'blue' ? 'text-blue-900' :
                result.interpretation.color === 'yellow' ? 'text-yellow-900' :
                result.interpretation.color === 'orange' ? 'text-orange-900' :
                'text-red-900'
              }`}>
                {result.interpretation.category}
              </p>
              <p className={`text-xs ${
                result.interpretation.color === 'green' ? 'text-green-600' :
                result.interpretation.color === 'blue' ? 'text-blue-600' :
                result.interpretation.color === 'yellow' ? 'text-yellow-600' :
                result.interpretation.color === 'orange' ? 'text-orange-600' :
                'text-red-600'
              }`}>
                Faixa: {result.interpretation.range}
              </p>
              <p className={`text-xs ${
                result.interpretation.color === 'green' ? 'text-green-600' :
                result.interpretation.color === 'blue' ? 'text-blue-600' :
                result.interpretation.color === 'yellow' ? 'text-yellow-600' :
                result.interpretation.color === 'orange' ? 'text-orange-600' :
                'text-red-600'
              }`}>
                {result.interpretation.risk}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FriedewaldLDL;