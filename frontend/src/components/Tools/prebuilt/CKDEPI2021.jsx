import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Check, Calculator, Info } from 'lucide-react';
import { toast } from 'sonner';

const CKDEPI2021 = ({ open, onOpenChange }) => {
  const [age, setAge] = useState('');
  const [creatinine, setCreatinine] = useState('');
  const [sex, setSex] = useState('');
  const [race, setRace] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const calculateCKDEPI = () => {
    if (!age || !creatinine || !sex || !race) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    const ageNum = parseFloat(age);
    const creatNum = parseFloat(creatinine);

    if (ageNum <= 0 || creatNum <= 0) {
      toast.error('Por favor, insira valores válidos');
      return;
    }

    // CKD-EPI 2021 formula (race-free)
    let kappa, alpha;
    
    if (sex === 'female') {
      kappa = 0.7;
      alpha = -0.241;
    } else {
      kappa = 0.9;
      alpha = -0.302;
    }

    const minRatio = Math.min(creatNum / kappa, 1);
    const maxRatio = Math.max(creatNum / kappa, 1);
    
    let eGFR = 142 * Math.pow(minRatio, alpha) * Math.pow(maxRatio, -1.200) * Math.pow(0.9938, ageNum);
    
    if (sex === 'female') {
      eGFR *= 1.012;
    }

    setResult({
      egfr: eGFR.toFixed(1),
      stage: getStage(eGFR)
    });
  };

  const getStage = (egfr) => {
    if (egfr >= 90) return 'G1 (Normal ou alto)';
    if (egfr >= 60) return 'G2 (Levemente diminuída)';
    if (egfr >= 45) return 'G3a (Leve a moderadamente diminuída)';
    if (egfr >= 30) return 'G3b (Moderada a severamente diminuída)';
    if (egfr >= 15) return 'G4 (Severamente diminuída)';
    return 'G5 (Falência renal)';
  };

  const clearForm = () => {
    setAge('');
    setCreatinine('');
    setSex('');
    setRace('');
    setResult(null);
  };

  const copyResult = async () => {
    if (!result) return;
    
    const text = `eGFR (CKD-EPI 2021): ${result.egfr} mL/min/1.73m² - ${result.stage}`;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Resultado copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar resultado');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-theme-background border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <Calculator className="h-6 w-6 text-blue-600" />
            CKD-EPI 2021 - Taxa de Filtração Glomerular
          </DialogTitle>
        </DialogHeader>
        
    <Card className="border-gray-700 bg-gray-800/50">
      <CardHeader>
        <CardTitle className="text-white">Parâmetros do Paciente</CardTitle>
        <CardDescription className="text-gray-300">
          Taxa de Filtração Glomerular Estimada (eGFR) - Fórmula sem ajuste racial
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
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="creatinine">Creatinina Sérica (mg/dL)</Label>
          <Input
            id="creatinine"
            type="number"
            step="0.01"
            placeholder="Ex: 1.2"
            value={creatinine}
            onChange={(e) => setCreatinine(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sex">Sexo</Label>
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
          <Label htmlFor="race">Etnia</Label>
          <Select value={race} onValueChange={setRace}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a etnia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="other">Não-Afroamericano</SelectItem>
              <SelectItem value="african">Afroamericano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fórmula */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Fórmula CKD-EPI 2021:</span>
          </div>
          <div className="text-xs text-gray-600 font-mono space-y-1">
            <div>eGFR = 142 × min(SCr/κ, 1)^α × max(SCr/κ, 1)^(-1.200) × 0.9938^idade</div>
            <div>♀: κ=0.7, α=-0.241, fator=1.012 | ♂: κ=0.9, α=-0.302</div>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button onClick={calculateCKDEPI} className="flex-1">
            Calcular
          </Button>
          <Button onClick={clearForm} variant="outline" className="flex-1">
            Limpar
          </Button>
        </div>

        {result && (
          <div className="space-y-3">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Resultado:</h3>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-blue-900">
                  {result.egfr} <span className="text-lg font-normal text-blue-700">mL/min/1.73m²</span>
                </div>
                <div className="text-sm text-blue-800">
                  <strong>Estágio:</strong> {result.stage}
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
            
            {/* Interpretação Clínica */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Interpretação Clínica:</span>
              </div>
              <div className="text-xs text-blue-700 space-y-1">
                <div>• G1 (≥90): Função renal normal</div>
                <div>• G2 (60-89): Levemente diminuída</div>
                <div>• G3a (45-59): Leve a moderadamente diminuída</div>
                <div>• G3b (30-44): Moderada a severamente diminuída</div>
                <div>• G4 (15-29): Severamente diminuída</div>
                <div>• G5 (&lt;15): Falência renal</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
      </DialogContent>
    </Dialog>
  );
};

export default CKDEPI2021;