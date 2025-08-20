import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Check, Calculator, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

const IronDeficit = ({ open, onOpenChange }) => {
  const [weight, setWeight] = useState('');
  const [currentHb, setCurrentHb] = useState('');
  const [targetHb, setTargetHb] = useState('');
  const [sex, setSex] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const calculateIronDeficit = () => {
    if (!weight || !currentHb || !targetHb || !sex) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    const wt = parseFloat(weight);
    const currentHbVal = parseFloat(currentHb);
    const targetHbVal = parseFloat(targetHb);

    if (wt <= 0 || currentHbVal <= 0 || targetHbVal <= 0) {
      toast.error('Por favor, insira valores válidos (maiores que zero)');
      return;
    }

    if (targetHbVal <= currentHbVal) {
      toast.error('A hemoglobina alvo deve ser maior que a atual');
      return;
    }

    // Iron deficit = Weight × (Target Hb - Current Hb) × 2.4 + Iron stores
    // Iron stores: 500mg for women, 1000mg for men
    const ironStores = sex === 'female' ? 500 : 1000;
    const ironDeficit = wt * (targetHbVal - currentHbVal) * 2.4 + ironStores;

    setResult({
      deficit: Math.round(ironDeficit),
      doses: calculateDoses(ironDeficit)
    });
  };

  const calculateDoses = (totalDeficit) => {
    // Common iron preparations
    return {
      ferroSulfate: {
        name: 'Sulfato Ferroso (325mg)',
        elementalIron: 65, // mg per tablet
        tablets: Math.ceil(totalDeficit / 65),
        duration: Math.ceil(totalDeficit / (65 * 3)) // 3 tablets per day
      },
      ironSucrose: {
        name: 'Sacarato de Ferro IV (100mg/5mL)',
        dose: 100, // mg per vial
        vials: Math.ceil(totalDeficit / 100),
        sessions: Math.ceil(totalDeficit / 200) // 200mg per session
      }
    };
  };

  const clearForm = () => {
    setWeight('');
    setCurrentHb('');
    setTargetHb('');
    setSex('');
    setResult(null);
  };

  const copyResult = async () => {
    if (!result) return;
    
    const text = `Déficit de Ferro: ${result.deficit} mg\nVia Oral: ${result.doses.ferroSulfate.tablets} comprimidos\nVia IV: ${result.doses.ironSucrose.vials} ampolas`;
    
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
            <Calculator className="h-6 w-6 text-teal-400" />
            Déficit de Ferro - Anemia Ferropriva
          </DialogTitle>
        </DialogHeader>
        
    <Card className="border-gray-700 bg-gray-800/50">
      <CardHeader>
        <CardTitle className="text-white">Parâmetros do Paciente</CardTitle>
        <CardDescription className="text-gray-300">
          Cálculo do déficit de ferro total para correção da anemia
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="weight">Peso (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            placeholder="Ex: 70"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentHb">Hemoglobina Atual (g/dL)</Label>
          <Input
            id="currentHb"
            type="number"
            step="0.1"
            placeholder="Ex: 8.5"
            value={currentHb}
            onChange={(e) => setCurrentHb(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetHb">Hemoglobina Alvo (g/dL)</Label>
          <Input
            id="targetHb"
            type="number"
            step="0.1"
            placeholder="Ex: 12.0"
            value={targetHb}
            onChange={(e) => setTargetHb(e.target.value)}
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

        {/* Fórmula */}
        <div className="bg-gray-800/50 border border-gray-600 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-4 w-4 text-teal-400" />
            <span className="text-sm font-medium text-gray-100">Fórmula:</span>
          </div>
          <div className="text-xs text-gray-300 font-mono space-y-1">
            <div>Déficit = Peso × (Hb alvo - Hb atual) × 2,4 + Reservas</div>
            <div>Reservas: ♂ 1000mg | ♀ 500mg</div>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button onClick={calculateIronDeficit} className="flex-1">
            Calcular
          </Button>
          <Button onClick={clearForm} variant="outline" className="flex-1">
            Limpar
          </Button>
        </div>

        {result && (
          <div className="space-y-3">
            <div className="bg-gray-800/50 border border-gray-600 p-4 rounded-lg">
              <h3 className="font-semibold text-white">Resultado:</h3>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-white">
                  {result.deficit} <span className="text-lg font-normal text-gray-300">mg</span>
                </div>
                <div className="text-sm text-gray-300">
                  Déficit Total de Ferro
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
            
            {/* Opções de Tratamento */}
            <div className="bg-gray-800/50 border border-gray-600 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="h-4 w-4 text-teal-400" />
                <span className="text-sm font-medium text-gray-100">Opções de Tratamento:</span>
              </div>
              <div className="text-xs text-gray-300 space-y-1">
                <div><strong>VO:</strong> Ferrosos 120-200 mg/dia (divididos)</div>
                <div><strong>EV:</strong> Sacarato férrico, Carboximaltose férrica (dose conforme cálculo)</div>
                <div><strong>Reavaliar:</strong> Hemoglobina e ferritina em 4-8 semanas</div>
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

export default IronDeficit;