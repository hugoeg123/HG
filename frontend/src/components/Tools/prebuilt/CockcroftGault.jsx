import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Info } from 'lucide-react';

const CockcroftGault = () => {
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [creatinine, setCreatinine] = useState('');
  const [gender, setGender] = useState('');
  const [result, setResult] = useState(null);

  const calculateClearance = () => {
    const ageNum = parseFloat(age);
    const weightNum = parseFloat(weight);
    const creatinineNum = parseFloat(creatinine);

    if (!ageNum || !weightNum || !creatinineNum || ageNum <= 0 || weightNum <= 0 || creatinineNum <= 0) {
      alert('Por favor, insira valores válidos para todos os campos');
      return;
    }

    if (!gender) {
      alert('Por favor, selecione o sexo');
      return;
    }

    // Cockcroft-Gault formula: ((140 - age) × weight) / (72 × creatinine)
    // For females, multiply by 0.85
    let clearance = ((140 - ageNum) * weightNum) / (72 * creatinineNum);
    
    if (gender === 'female') {
      clearance = clearance * 0.85;
    }

    setResult(clearance.toFixed(1));
  };

  const copyResult = () => {
    if (result) {
      const textToCopy = `Clearance de Creatinina (Cockcroft-Gault): ${result} mL/min`;
      navigator.clipboard.writeText(textToCopy);
      alert('Resultado copiado para a área de transferência');
    }
  };

  const clearFields = () => {
    setAge('');
    setWeight('');
    setCreatinine('');
    setGender('');
    setResult(null);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Clearance de Creatinina (Cockcroft-Gault)
        </CardTitle>
        <CardDescription>
          Calcule o clearance de creatinina estimado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="age">Idade (anos)</Label>
          <Input
            id="age"
            type="number"
            placeholder="Ex: 65"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min="0"
            max="120"
          />
        </div>

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
          <Label htmlFor="creatinine">Creatinina Sérica (mg/dL)</Label>
          <Input
            id="creatinine"
            type="number"
            placeholder="Ex: 1.2"
            value={creatinine}
            onChange={(e) => setCreatinine(e.target.value)}
            step="0.01"
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
          <Button onClick={calculateClearance} className="flex-1">
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
                <span className="font-medium">Clearance:</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{result} mL/min</span>
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
              <div className="text-sm text-muted-foreground">
                {parseFloat(result) < 60 && (
                  <p className="text-orange-600 font-medium">
                    ⚠️ Clearance reduzido (&lt; 60 mL/min)
                  </p>
                )}
                {parseFloat(result) < 30 && (
                  <p className="text-red-600 font-medium">
                    ⚠️ Insuficiência renal significativa (&lt; 30 mL/min)
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        <div className="border-t my-4" />
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Fórmula de Cockcroft-Gault:</strong></p>
          <p className="text-xs">
            Clearance = ((140 - idade) × peso) / (72 × creatinina)
          </p>
          <p className="text-xs">
            Para mulheres: multiplicar por 0,85
          </p>
          <p className="text-xs mt-2">
            <strong>Valores de referência:</strong>
          </p>
          <ul className="text-xs space-y-0.5 ml-4">
            <li>Normal: &gt; 90 mL/min</li>
            <li>Leve redução: 60-89 mL/min</li>
            <li>Moderada redução: 30-59 mL/min</li>
            <li>Severa redução: 15-29 mL/min</li>
            <li>Falência renal: &lt; 15 mL/min</li>
          </ul>
          <p className="text-xs mt-2">
            <strong>Referência:</strong> Cockcroft DW, Gault MH. Nephron 1976; 16:31-41.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CockcroftGault;