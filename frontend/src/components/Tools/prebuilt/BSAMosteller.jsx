import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
// import { Separator } from '@/components/ui/separator';
import { Copy, Info } from 'lucide-react';

const BSAMosteller = () => {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [result, setResult] = useState(null);

  const calculateBSA = () => {
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (!weightNum || !heightNum || weightNum <= 0 || heightNum <= 0) {
      alert('Por favor, insira valores válidos para peso e altura');
      return;
    }

    // Mosteller formula: BSA = √((height × weight) / 3600)
    const bsa = Math.sqrt((heightNum * weightNum) / 3600);
    setResult(bsa.toFixed(2));
  };

  const copyResult = () => {
    if (result) {
      const textToCopy = `ASC (Mosteller): ${result} m²`;
      navigator.clipboard.writeText(textToCopy);
      alert('Resultado copiado para a área de transferência');
    }
  };

  const clearFields = () => {
    setWeight('');
    setHeight('');
    setResult(null);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Área de Superfície Corporal (Mosteller)
        </CardTitle>
        <CardDescription>
          Calcule a ASC usando a fórmula de Mosteller
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

        <div className="flex gap-2">
          <Button onClick={calculateBSA} className="flex-1">
            Calcular
          </Button>
          <Button variant="outline" onClick={clearFields}>
            Limpar
          </Button>
        </div>

        {result && (
          <>
            <div className="border-t my-4" />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">ASC (Mosteller):</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{result} m²</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyResult}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="border-t my-4" />
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Fórmula de Mosteller:</strong></p>
          <p>ASC = √((altura × peso) / 3600)</p>
          <p className="text-xs">
            Onde altura está em cm e peso em kg.
            Resultado em m².
          </p>
          <p className="text-xs mt-2">
            <strong>Referência:</strong> Mosteller RD. Simplified calculation of body-surface area. N Engl J Med 1987; 317:1098.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BSAMosteller;