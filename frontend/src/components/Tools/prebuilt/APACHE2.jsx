import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Check, Calculator, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * APACHE II Score Calculator Component
 * 
 * Calculates APACHE II (Acute Physiology and Chronic Health Evaluation II) score
 * for ICU mortality prediction using 12 physiological variables, age, and chronic health.
 * 
 * @param {boolean} open - Dialog open state
 * @param {function} onOpenChange - Dialog state change handler
 * 
 * Features:
 * - 12 physiological parameters scoring
 * - Age points calculation
 * - Chronic health evaluation
 * - Mortality risk prediction
 * - Clinical interpretation
 * 
 * AI prompt: Extend with APACHE III/IV versions and organ failure scoring
 */
const APACHE2 = ({ open, onOpenChange }) => {
  // Physiological variables
  const [temperature, setTemperature] = useState('');
  const [meanAP, setMeanAP] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [oxygenation, setOxygenation] = useState('');
  const [fio2, setFio2] = useState('');
  const [arterialPH, setArterialPH] = useState('');
  const [serumSodium, setSerumSodium] = useState('');
  const [serumPotassium, setSerumPotassium] = useState('');
  const [serumCreatinine, setSerumCreatinine] = useState('');
  const [hematocrit, setHematocrit] = useState('');
  const [wbc, setWbc] = useState('');
  const [gcs, setGcs] = useState('');
  
  // Age and chronic health
  const [age, setAge] = useState('');
  const [chronicHealth, setChronicHealth] = useState('');
  const [acuteRenalFailure, setAcuteRenalFailure] = useState(false);
  
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Scoring functions for each parameter
  const getTemperaturePoints = (temp) => {
    if (temp >= 41) return 4;
    if (temp >= 39) return 3;
    if (temp >= 38.5) return 1;
    if (temp >= 36) return 0;
    if (temp >= 34) return 1;
    if (temp >= 32) return 2;
    if (temp >= 30) return 3;
    return 4;
  };

  const getMeanAPPoints = (map) => {
    if (map >= 160) return 4;
    if (map >= 130) return 3;
    if (map >= 110) return 2;
    if (map >= 70) return 0;
    if (map >= 50) return 2;
    return 4;
  };

  const getHeartRatePoints = (hr) => {
    if (hr >= 180) return 4;
    if (hr >= 140) return 3;
    if (hr >= 110) return 2;
    if (hr >= 70) return 0;
    if (hr >= 55) return 2;
    if (hr >= 40) return 3;
    return 4;
  };

  const getRespiratoryRatePoints = (rr) => {
    if (rr >= 50) return 4;
    if (rr >= 35) return 3;
    if (rr >= 25) return 1;
    if (rr >= 12) return 0;
    if (rr >= 10) return 1;
    if (rr >= 6) return 2;
    return 4;
  };

  const getOxygenationPoints = (pao2, fio2Val) => {
    if (fio2Val >= 0.5) {
      // Use A-a gradient if FiO2 >= 0.5
      const aaGradient = (fio2Val * 713) - (pao2 + (40/0.8)); // Simplified
      if (aaGradient >= 500) return 4;
      if (aaGradient >= 350) return 3;
      if (aaGradient >= 200) return 2;
      return 0;
    } else {
      // Use PaO2 if FiO2 < 0.5
      if (pao2 >= 70) return 0;
      if (pao2 >= 61) return 1;
      if (pao2 >= 55) return 3;
      return 4;
    }
  };

  const getArterialPHPoints = (ph) => {
    if (ph >= 7.7) return 4;
    if (ph >= 7.6) return 3;
    if (ph >= 7.5) return 1;
    if (ph >= 7.33) return 0;
    if (ph >= 7.25) return 2;
    if (ph >= 7.15) return 3;
    return 4;
  };

  const getSerumSodiumPoints = (na) => {
    if (na >= 180) return 4;
    if (na >= 160) return 3;
    if (na >= 155) return 2;
    if (na >= 150) return 1;
    if (na >= 130) return 0;
    if (na >= 120) return 2;
    if (na >= 111) return 3;
    return 4;
  };

  const getSerumPotassiumPoints = (k) => {
    if (k >= 7) return 4;
    if (k >= 6) return 3;
    if (k >= 5.5) return 1;
    if (k >= 3.5) return 0;
    if (k >= 3) return 1;
    if (k >= 2.5) return 2;
    return 4;
  };

  const getSerumCreatininePoints = (cr, arf) => {
    const basePoints = (() => {
      if (cr >= 3.5) return 4;
      if (cr >= 2) return 3;
      if (cr >= 1.5) return 2;
      return 0;
    })();
    
    return arf ? basePoints * 2 : basePoints;
  };

  const getHematocritPoints = (hct) => {
    if (hct >= 60) return 4;
    if (hct >= 50) return 2;
    if (hct >= 46) return 1;
    if (hct >= 30) return 0;
    if (hct >= 20) return 2;
    return 4;
  };

  const getWBCPoints = (wbc) => {
    if (wbc >= 40) return 4;
    if (wbc >= 20) return 2;
    if (wbc >= 15) return 1;
    if (wbc >= 3) return 0;
    if (wbc >= 1) return 2;
    return 4;
  };

  const getGCSPoints = (gcs) => {
    return 15 - gcs;
  };

  const getAgePoints = (ageVal) => {
    if (ageVal >= 75) return 6;
    if (ageVal >= 65) return 5;
    if (ageVal >= 55) return 3;
    if (ageVal >= 45) return 2;
    return 0;
  };

  const getChronicHealthPoints = (chronic) => {
    if (chronic === 'none') return 0;
    if (chronic === 'elective') return 2;
    if (chronic === 'emergency') return 5;
    return 0;
  };

  const calculateAPACHE2 = () => {
    // Validate required fields
    const requiredFields = [
      temperature, meanAP, heartRate, respiratoryRate, oxygenation,
      fio2, arterialPH, serumSodium, serumPotassium, serumCreatinine,
      hematocrit, wbc, gcs, age, chronicHealth
    ];

    if (requiredFields.some(field => !field)) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Convert values
    const tempVal = parseFloat(temperature);
    const mapVal = parseFloat(meanAP);
    const hrVal = parseFloat(heartRate);
    const rrVal = parseFloat(respiratoryRate);
    const pao2Val = parseFloat(oxygenation);
    const fio2Val = parseFloat(fio2) / 100; // Convert percentage to decimal
    const phVal = parseFloat(arterialPH);
    const naVal = parseFloat(serumSodium);
    const kVal = parseFloat(serumPotassium);
    const crVal = parseFloat(serumCreatinine);
    const hctVal = parseFloat(hematocrit);
    const wbcVal = parseFloat(wbc);
    const gcsVal = parseFloat(gcs);
    const ageVal = parseFloat(age);

    // Validate ranges
    if (tempVal < 25 || tempVal > 45) {
      toast.error('Temperatura deve estar entre 25-45°C');
      return;
    }
    if (gcsVal < 3 || gcsVal > 15) {
      toast.error('Glasgow deve estar entre 3-15');
      return;
    }
    if (fio2Val < 0.21 || fio2Val > 1) {
      toast.error('FiO2 deve estar entre 21-100%');
      return;
    }

    // Calculate points for each parameter
    const points = {
      temperature: getTemperaturePoints(tempVal),
      meanAP: getMeanAPPoints(mapVal),
      heartRate: getHeartRatePoints(hrVal),
      respiratoryRate: getRespiratoryRatePoints(rrVal),
      oxygenation: getOxygenationPoints(pao2Val, fio2Val),
      arterialPH: getArterialPHPoints(phVal),
      serumSodium: getSerumSodiumPoints(naVal),
      serumPotassium: getSerumPotassiumPoints(kVal),
      serumCreatinine: getSerumCreatininePoints(crVal, acuteRenalFailure),
      hematocrit: getHematocritPoints(hctVal),
      wbc: getWBCPoints(wbcVal),
      gcs: getGCSPoints(gcsVal),
      age: getAgePoints(ageVal),
      chronicHealth: getChronicHealthPoints(chronicHealth)
    };

    const totalScore = Object.values(points).reduce((sum, point) => sum + point, 0);

    // Mortality prediction (approximate)
    let mortalityRisk;
    let riskCategory;
    let interpretation;

    if (totalScore <= 4) {
      mortalityRisk = '4%';
      riskCategory = 'Baixo Risco';
      interpretation = 'Risco de mortalidade muito baixo';
    } else if (totalScore <= 9) {
      mortalityRisk = '8%';
      riskCategory = 'Baixo Risco';
      interpretation = 'Risco de mortalidade baixo';
    } else if (totalScore <= 14) {
      mortalityRisk = '15%';
      riskCategory = 'Risco Moderado';
      interpretation = 'Risco de mortalidade moderado';
    } else if (totalScore <= 19) {
      mortalityRisk = '25%';
      riskCategory = 'Alto Risco';
      interpretation = 'Risco de mortalidade alto';
    } else if (totalScore <= 24) {
      mortalityRisk = '40%';
      riskCategory = 'Alto Risco';
      interpretation = 'Risco de mortalidade muito alto';
    } else if (totalScore <= 29) {
      mortalityRisk = '55%';
      riskCategory = 'Risco Crítico';
      interpretation = 'Risco de mortalidade crítico';
    } else {
      mortalityRisk = '≥70%';
      riskCategory = 'Risco Crítico';
      interpretation = 'Risco de mortalidade extremamente alto';
    }

    setResult({
      totalScore,
      points,
      mortalityRisk,
      riskCategory,
      interpretation
    });
  };

  const copyResult = async () => {
    if (!result) return;
    
    const text = `APACHE II Score: ${result.totalScore}\nRisco de Mortalidade: ${result.mortalityRisk}\nCategoria: ${result.riskCategory}`;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Resultado copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar resultado');
    }
  };

  const clearForm = () => {
    setTemperature('');
    setMeanAP('');
    setHeartRate('');
    setRespiratoryRate('');
    setOxygenation('');
    setFio2('');
    setArterialPH('');
    setSerumSodium('');
    setSerumPotassium('');
    setSerumCreatinine('');
    setHematocrit('');
    setWbc('');
    setGcs('');
    setAge('');
    setChronicHealth('');
    setAcuteRenalFailure(false);
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-theme-background border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <Calculator className="h-6 w-6 text-red-600" />
            APACHE II Score - Escore de Gravidade UTI
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Instructions Card */}
          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                Instruções
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-300 space-y-2">
              <p>Preencha todos os parâmetros fisiológicos das primeiras 24h de UTI.</p>
              <p><strong>Valores de referência:</strong></p>
              <ul className="text-xs space-y-1 ml-4">
                <li>• Temperatura: °C</li>
                <li>• PAM: mmHg</li>
                <li>• FC: bpm</li>
                <li>• FR: rpm</li>
                <li>• PaO2: mmHg</li>
                <li>• FiO2: % (21-100)</li>
                <li>• pH arterial</li>
                <li>• Glasgow: 3-15</li>
              </ul>
            </CardContent>
          </Card>

          {/* Main Input Card */}
          <Card className="lg:col-span-2 border-gray-700 bg-gray-800/50">
            <CardHeader>
              <CardTitle className="text-white">Parâmetros APACHE II</CardTitle>
              <CardDescription className="text-gray-300">
                Variáveis fisiológicas, idade e saúde crônica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Physiological Variables */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Temperatura (°C)</Label>
                  <Input
                    type="number"
                    placeholder="37.0"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    step="0.1"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">PAM (mmHg)</Label>
                  <Input
                    type="number"
                    placeholder="80"
                    value={meanAP}
                    onChange={(e) => setMeanAP(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">FC (bpm)</Label>
                  <Input
                    type="number"
                    placeholder="80"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">FR (rpm)</Label>
                  <Input
                    type="number"
                    placeholder="16"
                    value={respiratoryRate}
                    onChange={(e) => setRespiratoryRate(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">PaO2 (mmHg)</Label>
                  <Input
                    type="number"
                    placeholder="90"
                    value={oxygenation}
                    onChange={(e) => setOxygenation(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">FiO2 (%)</Label>
                  <Input
                    type="number"
                    placeholder="21"
                    value={fio2}
                    onChange={(e) => setFio2(e.target.value)}
                    min="21"
                    max="100"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">pH Arterial</Label>
                  <Input
                    type="number"
                    placeholder="7.40"
                    value={arterialPH}
                    onChange={(e) => setArterialPH(e.target.value)}
                    step="0.01"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Sódio (mEq/L)</Label>
                  <Input
                    type="number"
                    placeholder="140"
                    value={serumSodium}
                    onChange={(e) => setSerumSodium(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Potássio (mEq/L)</Label>
                  <Input
                    type="number"
                    placeholder="4.0"
                    value={serumPotassium}
                    onChange={(e) => setSerumPotassium(e.target.value)}
                    step="0.1"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Creatinina (mg/dL)</Label>
                  <Input
                    type="number"
                    placeholder="1.0"
                    value={serumCreatinine}
                    onChange={(e) => setSerumCreatinine(e.target.value)}
                    step="0.1"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Hematócrito (%)</Label>
                  <Input
                    type="number"
                    placeholder="40"
                    value={hematocrit}
                    onChange={(e) => setHematocrit(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Leucócitos (×10³/μL)</Label>
                  <Input
                    type="number"
                    placeholder="8.0"
                    value={wbc}
                    onChange={(e) => setWbc(e.target.value)}
                    step="0.1"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Glasgow (3-15)</Label>
                  <Input
                    type="number"
                    placeholder="15"
                    value={gcs}
                    onChange={(e) => setGcs(e.target.value)}
                    min="3"
                    max="15"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Idade (anos)</Label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Chronic Health */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Saúde Crônica</Label>
                  <Select value={chronicHealth} onValueChange={setChronicHealth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      <SelectItem value="elective">Cirurgia Eletiva com Doença Crônica</SelectItem>
                      <SelectItem value="emergency">Emergência/Urgência com Doença Crônica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="arf"
                    checked={acuteRenalFailure}
                    onChange={(e) => setAcuteRenalFailure(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="arf" className="text-white text-sm">
                    Insuficiência Renal Aguda
                  </Label>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={calculateAPACHE2} className="flex-1">
                  Calcular APACHE II
                </Button>
                <Button onClick={clearForm} variant="outline" className="flex-1">
                  Limpar
                </Button>
              </div>

              {result && (
                <div className="space-y-3">
                  <div className={`p-4 rounded-lg ${
                    result.totalScore <= 9 ? 'bg-green-50' :
                    result.totalScore <= 19 ? 'bg-yellow-50' :
                    result.totalScore <= 29 ? 'bg-orange-50' :
                    'bg-red-50'
                  }`}>
                    <h3 className={`font-semibold ${
                      result.totalScore <= 9 ? 'text-green-900' :
                      result.totalScore <= 19 ? 'text-yellow-900' :
                      result.totalScore <= 29 ? 'text-orange-900' :
                      'text-red-900'
                    }`}>Resultado APACHE II:</h3>
                    <div className="text-center space-y-2">
                      <div className={`text-3xl font-bold ${
                        result.totalScore <= 9 ? 'text-green-900' :
                        result.totalScore <= 19 ? 'text-yellow-900' :
                        result.totalScore <= 29 ? 'text-orange-900' :
                        'text-red-900'
                      }`}>
                        {result.totalScore} <span className="text-lg font-normal">pontos</span>
                      </div>
                      <div className={`text-sm ${
                        result.totalScore <= 9 ? 'text-green-800' :
                        result.totalScore <= 19 ? 'text-yellow-800' :
                        result.totalScore <= 29 ? 'text-orange-800' :
                        'text-red-800'
                      }`}>
                        Mortalidade Estimada: {result.mortalityRisk}
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
                  
                  {/* Clinical Interpretation */}
                  <div className={`p-3 rounded-lg ${
                    result.totalScore <= 9 ? 'bg-green-50' :
                    result.totalScore <= 19 ? 'bg-yellow-50' :
                    result.totalScore <= 29 ? 'bg-orange-50' :
                    'bg-red-50'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className={`h-4 w-4 ${
                        result.totalScore <= 9 ? 'text-green-600' :
                        result.totalScore <= 19 ? 'text-yellow-600' :
                        result.totalScore <= 29 ? 'text-orange-600' :
                        'text-red-600'
                      }`} />
                      <span className={`text-sm font-medium ${
                        result.totalScore <= 9 ? 'text-green-800' :
                        result.totalScore <= 19 ? 'text-yellow-800' :
                        result.totalScore <= 29 ? 'text-orange-800' :
                        'text-red-800'
                      }`}>Interpretação Clínica:</span>
                    </div>
                    <div className={`text-sm font-medium mb-2 ${
                      result.totalScore <= 9 ? 'text-green-800' :
                      result.totalScore <= 19 ? 'text-yellow-800' :
                      result.totalScore <= 29 ? 'text-orange-800' :
                      'text-red-800'
                    }`}>
                      {result.riskCategory}: {result.interpretation}
                    </div>
                    <div className={`text-xs space-y-1 ${
                      result.totalScore <= 9 ? 'text-green-700' :
                      result.totalScore <= 19 ? 'text-yellow-700' :
                      result.totalScore <= 29 ? 'text-orange-700' :
                      'text-red-700'
                    }`}>
                      <div><strong>• 0-4 pontos:</strong> Mortalidade ~4% (Baixo risco)</div>
                      <div><strong>• 5-9 pontos:</strong> Mortalidade ~8% (Baixo risco)</div>
                      <div><strong>• 10-14 pontos:</strong> Mortalidade ~15% (Moderado)</div>
                      <div><strong>• 15-19 pontos:</strong> Mortalidade ~25% (Alto risco)</div>
                      <div><strong>• 20-24 pontos:</strong> Mortalidade ~40% (Alto risco)</div>
                      <div><strong>• 25-29 pontos:</strong> Mortalidade ~55% (Crítico)</div>
                      <div><strong>• ≥30 pontos:</strong> Mortalidade ≥70% (Crítico)</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default APACHE2;