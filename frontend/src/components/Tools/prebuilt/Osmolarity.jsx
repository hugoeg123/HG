import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, Calculator, Info } from 'lucide-react';
import { toast } from 'sonner';

const Osmolarity = ({ open, onOpenChange }) => {
  const [sodium, setSodium] = useState('');
  const [glucose, setGlucose] = useState('');
  const [bun, setBun] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const calculateOsmolarity = () => {
    if (!sodium || !glucose || !bun) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    const na = parseFloat(sodium);
    const gluc = parseFloat(glucose);
    const urea = parseFloat(bun);

    if (na <= 0 || gluc <= 0 || urea <= 0) {
      toast.error('Por favor, insira valores válidos (maiores que zero)');
      return;
    }

    // Osmolarity = 2 × Na + Glucose/18 + BUN/2.8
    const osmolarity = 2 * na + (gluc / 18) + (urea / 2.8);

    setResult({
      osmolarity: osmolarity.toFixed(1),
      interpretation: getInterpretation(osmolarity)
    });
  };

  const getInterpretation = (osm) => {
    if (osm < 280) {
      return {
        category: 'Hipoosmolaridade',
        range: '< 280 mOsm/kg',
        description: 'Osmolaridade abaixo do normal'
      };
    } else if (osm > 300) {
      return {
        category: 'Hiperosmolaridade',
        range: '> 300 mOsm/kg',
        description: 'Osmolaridade acima do normal'
      };
    } else {
      return {
        category: 'Normal',
        range: '280 - 300 mOsm/kg',
        description: 'Osmolaridade dentro da faixa normal'
      };
    }
  };

  const clearForm = () => {
    setSodium('');
    setGlucose('');
    setBun('');
    setResult(null);
  };

  const copyResult = async () => {
    if (!result) return;
    
    const text = `Osmolaridade: ${result.osmolarity} mOsm/kg - ${result.interpretation.category}`;
    
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
            Osmolaridade Sérica
          </DialogTitle>
        </DialogHeader>
        
    <Card className="border-gray-700 bg-gray-800/50">
      <CardHeader>
        <CardTitle className="text-white">Parâmetros Laboratoriais</CardTitle>
        <CardDescription className="text-gray-300">
          Cálculo da osmolaridade sérica estimada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sodium">Sódio (mEq/L)</Label>
          <Input
            id="sodium"
            type="number"
            step="0.1"
            placeholder="Ex: 140"
            value={sodium}
            onChange={(e) => setSodium(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="glucose">Glicose (mg/dL)</Label>
          <Input
            id="glucose"
            type="number"
            step="0.1"
            placeholder="Ex: 100"
            value={glucose}
            onChange={(e) => setGlucose(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bun">Ureia (mg/dL)</Label>
          <Input
            id="bun"
            type="number"
            step="0.1"
            placeholder="Ex: 20"
            value={bun}
            onChange={(e) => setBun(e.target.value)}
          />
        </div>


+        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-600">
+          <div className="flex items-center gap-2 mb-2">
+            <Calculator className="h-4 w-4 text-gray-300" />
+            <span className="text-sm font-medium text-gray-100">Fórmula:</span>
+          </div>
+          <div className="text-sm text-gray-300 font-mono">
+            Osmolaridade = 2 × Na + Glicose/18 + Ureia/2,8
+          </div>
+        </div>

        <div className="flex space-x-2">
          <Button onClick={calculateOsmolarity} className="flex-1">
            Calcular
          </Button>
          <Button onClick={clearForm} variant="outline" className="flex-1">
            Limpar
          </Button>
        </div>

        {result && (
          <div className="space-y-3">
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600">
              <h3 className="font-semibold text-gray-100">Resultado:</h3>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-white">
                  {result.osmolarity} <span className="text-lg font-normal text-gray-300">mOsm/kg</span>
                </div>
                <div className="text-sm text-gray-300">
                  <strong>Status:</strong> {result.interpretation.category}
                </div>
                <div className="text-xs text-gray-400">
                  Faixa normal: {result.interpretation.range}
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
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-teal-400" />
                <span className="text-sm font-medium text-gray-100">Interpretação Clínica:</span>
              </div>
              <div className="text-xs text-gray-300 space-y-1">
                <div>• Normal: 280-300 mOsm/kg</div>
                <div>• Hipoosmolaridade: hiponatremia, SIADH, polidipsia</div>
                <div>• Hiperosmolaridade: desidratação, diabetes, uremia</div>
                <div>• Gap osmolar &gt; 10: intoxicação (metanol, etilenoglicol)</div>
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

export default Osmolarity;