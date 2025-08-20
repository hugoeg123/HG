import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Info } from 'lucide-react';

const IdealBodyWeight = () => {
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState('');
  const [result, setResult] = useState(null);
  const [formula, setFormula] = useState('');

  const calculateIdealWeight = () => {
    const heightNum = parseFloat(height);

    if (!heightNum || heightNum <= 0) {
      alert('Por favor, insira uma altura válida');
      return;
    }

    if (!gender) {
      alert('Por favor, selecione o sexo');
      return;
    }

    let idealWeight;
    let formulaUsed;

    // Convert height to inches for calculation
    const heightInInches = heightNum / 2.54;

    if (gender === 'male') {
      // Devine formula for men: 50 kg + 2.3 kg for each inch over 5 feet
      idealWeight = 50 + 2.3 * Math.max(0, heightInInches - 60);
      formulaUsed = 'Devine (Homens)';
    } else {
      // Devine formula for women: 45.5 kg + 2.3 kg for each inch over 5 feet
      idealWeight = 45.5 + 2.3 * Math.max(0, heightInInches - 60);
      formulaUsed = 'Devine (Mulheres)';
    }

    setResult(idealWeight.toFixed(1));
    setFormula(formulaUsed);
  };

  const copyResult = () => {
    if (result) {
      const textToCopy = `Peso Ideal (${formula}): ${result} kg`;
      navigator.clipboard.writeText(textToCopy);
      alert('Resultado copiado para a área de transferência');
    }
  };

  const clearFields = () => {
    setHeight('');
    setGender('');
    setResult(null);
    setFormula('');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Peso Corporal Ideal
        </CardTitle>
        <CardDescription>
          Calcule o peso ideal usando a fórmula de Devine
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <div className="space-y-2">
          <Label htmlFor="gender">Sexo</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o sexo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Masculino</SelectItem>
              <SelectItem value="female">Feminino</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={calculateIdealWeight} className="flex-1">
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
                <span className="font-medium">Peso Ideal:</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{result} kg</span>
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
              <div className="flex items-center justify-between">
                <span className="font-medium">Fórmula:</span>
                <span className="text-sm text-muted-foreground">{formula}</span>
              </div>
            </div>
          </>
        )}

        <div className="border-t my-4" />
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Fórmula de Devine:</strong></p>
          <ul className="text-xs space-y-0.5 ml-4">
            <li><strong>Homens:</strong> 50 kg + 2,3 kg × (altura em polegadas - 60)</li>
            <li><strong>Mulheres:</strong> 45,5 kg + 2,3 kg × (altura em polegadas - 60)</li>
          </ul>
          <p className="text-xs mt-2">
            <strong>Nota:</strong> Para alturas menores que 152 cm (60 polegadas), 
            usa-se apenas o peso base (50 kg para homens, 45,5 kg para mulheres).
          </p>
          <p className="text-xs mt-2">
            <strong>Referência:</strong> Devine BJ. Gentamicin therapy. Drug Intell Clin Pharm 1974; 8:650-655.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default IdealBodyWeight;