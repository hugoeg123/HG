import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Check, Heart, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Framingham Risk Score Calculator Component
 * 
 * Calculates 10-year cardiovascular disease risk using the Framingham Risk Score
 * based on age, gender, cholesterol levels, blood pressure, diabetes, and smoking status.
 * 
 * @param {boolean} open - Dialog open state
 * @param {function} onOpenChange - Dialog state change handler
 * 
 * Features:
 * - Gender-specific risk calculation
 * - Age-adjusted scoring
 * - Multiple risk factors integration
 * - 10-year CVD risk prediction
 * - Clinical recommendations
 * 
 * AI prompt: Extend with ASCVD Risk Calculator and European SCORE system
 */
const FraminghamRisk = ({ open, onOpenChange }) => {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [totalCholesterol, setTotalCholesterol] = useState('');
  const [hdlCholesterol, setHdlCholesterol] = useState('');
  const [systolicBP, setSystolicBP] = useState('');
  const [bpTreatment, setBpTreatment] = useState('');
  const [diabetes, setDiabetes] = useState('');
  const [smoking, setSmoking] = useState('');
  
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Framingham Risk Score Points Tables
  const getAgePoints = (ageVal, genderVal) => {
    if (genderVal === 'male') {
      if (ageVal >= 70) return 11;
      if (ageVal >= 65) return 10;
      if (ageVal >= 60) return 8;
      if (ageVal >= 55) return 6;
      if (ageVal >= 50) return 4;
      if (ageVal >= 45) return 2;
      if (ageVal >= 40) return 1;
      if (ageVal >= 35) return 0;
      return -1;
    } else {
      if (ageVal >= 75) return 16;
      if (ageVal >= 70) return 14;
      if (ageVal >= 65) return 12;
      if (ageVal >= 60) return 10;
      if (ageVal >= 55) return 8;
      if (ageVal >= 50) return 6;
      if (ageVal >= 45) return 4;
      if (ageVal >= 40) return 2;
      if (ageVal >= 35) return 1;
      return 0;
    }
  };

  const getTotalCholesterolPoints = (tcVal, ageVal, genderVal) => {
    const ageGroup = ageVal < 40 ? 'young' : ageVal < 50 ? 'middle1' : ageVal < 60 ? 'middle2' : ageVal < 70 ? 'older1' : 'older2';
    
    if (genderVal === 'male') {
      if (tcVal >= 280) {
        return { young: 11, middle1: 8, middle2: 5, older1: 3, older2: 1 }[ageGroup];
      } else if (tcVal >= 240) {
        return { young: 8, middle1: 6, middle2: 3, older1: 1, older2: 0 }[ageGroup];
      } else if (tcVal >= 200) {
        return { young: 5, middle1: 3, middle2: 1, older1: 0, older2: 0 }[ageGroup];
      } else if (tcVal >= 160) {
        return { young: 1, middle1: 0, middle2: 0, older1: 0, older2: 0 }[ageGroup];
      } else {
        return 0;
      }
    } else {
      if (tcVal >= 280) {
        return { young: 13, middle1: 10, middle2: 7, older1: 4, older2: 2 }[ageGroup];
      } else if (tcVal >= 240) {
        return { young: 10, middle1: 7, middle2: 4, older1: 2, older2: 1 }[ageGroup];
      } else if (tcVal >= 200) {
        return { young: 6, middle1: 4, middle2: 2, older1: 1, older2: 1 }[ageGroup];
      } else if (tcVal >= 160) {
        return { young: 2, middle1: 1, middle2: 1, older1: 0, older2: 0 }[ageGroup];
      } else {
        return 0;
      }
    }
  };

  const getHDLPoints = (hdlVal, genderVal) => {
    if (genderVal === 'male') {
      if (hdlVal >= 60) return -1;
      if (hdlVal >= 50) return 0;
      if (hdlVal >= 40) return 1;
      return 2;
    } else {
      if (hdlVal >= 60) return -1;
      if (hdlVal >= 50) return 0;
      if (hdlVal >= 40) return 1;
      return 2;
    }
  };

  const getSystolicBPPoints = (sbpVal, treatmentVal, ageVal, genderVal) => {
    const ageGroup = ageVal < 40 ? 'young' : ageVal < 50 ? 'middle1' : ageVal < 60 ? 'middle2' : ageVal < 70 ? 'older1' : 'older2';
    const treated = treatmentVal === 'yes';
    
    if (genderVal === 'male') {
      if (sbpVal >= 160) {
        return treated ? 
          { young: 6, middle1: 4, middle2: 2, older1: 1, older2: 0 }[ageGroup] :
          { young: 4, middle1: 2, middle2: 1, older1: 0, older2: 0 }[ageGroup];
      } else if (sbpVal >= 140) {
        return treated ? 
          { young: 4, middle1: 2, middle2: 1, older1: 0, older2: 0 }[ageGroup] :
          { young: 2, middle1: 1, middle2: 0, older1: 0, older2: 0 }[ageGroup];
      } else if (sbpVal >= 130) {
        return treated ? 
          { young: 2, middle1: 1, middle2: 0, older1: 0, older2: 0 }[ageGroup] :
          { young: 1, middle1: 0, middle2: 0, older1: 0, older2: 0 }[ageGroup];
      } else if (sbpVal >= 120) {
        return 0;
      } else {
        return 0;
      }
    } else {
      if (sbpVal >= 160) {
        return treated ? 
          { young: 8, middle1: 6, middle2: 4, older1: 2, older2: 1 }[ageGroup] :
          { young: 6, middle1: 4, middle2: 2, older1: 1, older2: 0 }[ageGroup];
      } else if (sbpVal >= 140) {
        return treated ? 
          { young: 6, middle1: 4, middle2: 2, older1: 1, older2: 0 }[ageGroup] :
          { young: 4, middle1: 2, middle2: 1, older1: 0, older2: 0 }[ageGroup];
      } else if (sbpVal >= 130) {
        return treated ? 
          { young: 4, middle1: 2, middle2: 1, older1: 0, older2: 0 }[ageGroup] :
          { young: 2, middle1: 1, middle2: 0, older1: 0, older2: 0 }[ageGroup];
      } else if (sbpVal >= 120) {
        return treated ? 1 : 0;
      } else {
        return 0;
      }
    }
  };

  const getDiabetesPoints = (diabetesVal, ageVal, genderVal) => {
    if (diabetesVal !== 'yes') return 0;
    
    const ageGroup = ageVal < 40 ? 'young' : ageVal < 50 ? 'middle1' : ageVal < 60 ? 'middle2' : ageVal < 70 ? 'older1' : 'older2';
    
    if (genderVal === 'male') {
      return { young: 4, middle1: 3, middle2: 2, older1: 1, older2: 0 }[ageGroup];
    } else {
      return { young: 6, middle1: 4, middle2: 3, older1: 2, older2: 1 }[ageGroup];
    }
  };

  const getSmokingPoints = (smokingVal, ageVal, genderVal) => {
    if (smokingVal !== 'yes') return 0;
    
    const ageGroup = ageVal < 40 ? 'young' : ageVal < 50 ? 'middle1' : ageVal < 60 ? 'middle2' : ageVal < 70 ? 'older1' : 'older2';
    
    if (genderVal === 'male') {
      return { young: 9, middle1: 6, middle2: 3, older1: 1, older2: 0 }[ageGroup];
    } else {
      return { young: 9, middle1: 7, middle2: 4, older1: 2, older2: 1 }[ageGroup];
    }
  };

  const calculateRiskPercentage = (totalPoints, genderVal) => {
    // Risk percentage tables based on total points
    const maleRiskTable = {
      '-3': 1, '-2': 1, '-1': 1, '0': 1, '1': 1, '2': 1, '3': 1, '4': 1, '5': 2,
      '6': 2, '7': 3, '8': 4, '9': 5, '10': 6, '11': 8, '12': 10, '13': 12,
      '14': 16, '15': 20, '16': 25, '17': 30
    };
    
    const femaleRiskTable = {
      '-9': 1, '-7': 1, '-3': 1, '0': 1, '3': 1, '6': 2, '8': 2, '10': 3,
      '11': 4, '12': 4, '13': 5, '14': 6, '15': 8, '16': 11, '17': 14,
      '18': 17, '19': 22, '20': 27, '21': 30
    }
    
    const riskTable = genderVal === 'male' ? maleRiskTable : femaleRiskTable;
    
    // Find closest match
    const pointsStr = totalPoints.toString();
    if (riskTable[pointsStr]) {
      return riskTable[pointsStr];
    }
    
    // Find closest lower value
    const availablePoints = Object.keys(riskTable).map(Number).sort((a, b) => a - b);
    let closestPoints = availablePoints[0];
    
    for (const points of availablePoints) {
      if (points <= totalPoints) {
        closestPoints = points;
      } else {
        break;
      }
    }
    
    return riskTable[closestPoints.toString()] || (totalPoints >= 17 ? 30 : 1);
  };

  const calculateFraminghamRisk = () => {
    // Validate required fields
    const requiredFields = [age, gender, totalCholesterol, hdlCholesterol, systolicBP, bpTreatment, diabetes, smoking];

    if (requiredFields.some(field => !field)) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Convert values
    const ageVal = parseInt(age);
    const tcVal = parseInt(totalCholesterol);
    const hdlVal = parseInt(hdlCholesterol);
    const sbpVal = parseInt(systolicBP);

    // Validate ranges
    if (ageVal < 30 || ageVal > 79) {
      toast.error('Idade deve estar entre 30-79 anos');
      return;
    }
    if (tcVal < 100 || tcVal > 400) {
      toast.error('Colesterol total deve estar entre 100-400 mg/dL');
      return;
    }
    if (hdlVal < 20 || hdlVal > 100) {
      toast.error('HDL deve estar entre 20-100 mg/dL');
      return;
    }
    if (sbpVal < 90 || sbpVal > 200) {
      toast.error('Pressão sistólica deve estar entre 90-200 mmHg');
      return;
    }

    // Calculate points for each factor
    const points = {
      age: getAgePoints(ageVal, gender),
      totalCholesterol: getTotalCholesterolPoints(tcVal, ageVal, gender),
      hdlCholesterol: getHDLPoints(hdlVal, gender),
      systolicBP: getSystolicBPPoints(sbpVal, bpTreatment, ageVal, gender),
      diabetes: getDiabetesPoints(diabetes, ageVal, gender),
      smoking: getSmokingPoints(smoking, ageVal, gender)
    };

    const totalPoints = Object.values(points).reduce((sum, point) => sum + point, 0);
    const riskPercentage = calculateRiskPercentage(totalPoints, gender);

    // Risk categorization
    let riskCategory;
    let interpretation;
    let recommendations;

    if (riskPercentage < 10) {
      riskCategory = 'Baixo Risco';
      interpretation = 'Risco cardiovascular baixo em 10 anos';
      recommendations = [
        'Manter estilo de vida saudável',
        'Atividade física regular',
        'Dieta balanceada',
        'Controle de peso',
        'Reavaliação em 4-6 anos'
      ];
    } else if (riskPercentage < 20) {
      riskCategory = 'Risco Intermediário';
      interpretation = 'Risco cardiovascular intermediário em 10 anos';
      recommendations = [
        'Modificações intensivas do estilo de vida',
        'Considerar estatina se LDL > 100 mg/dL',
        'Controle rigoroso da pressão arterial',
        'Cessação do tabagismo se aplicável',
        'Reavaliação anual'
      ];
    } else {
      riskCategory = 'Alto Risco';
      interpretation = 'Alto risco cardiovascular em 10 anos';
      recommendations = [
        'Terapia com estatina indicada',
        'Meta de LDL < 70 mg/dL',
        'Controle agressivo da PA (< 130/80 mmHg)',
        'Cessação imediata do tabagismo',
        'Considerar aspirina profilática',
        'Acompanhamento cardiológico'
      ];
    }

    setResult({
      totalPoints,
      points,
      riskPercentage,
      riskCategory,
      interpretation,
      recommendations
    });
  };

  const copyResult = async () => {
    if (!result) return;
    
    const text = `Framingham Risk Score: ${result.totalPoints} pontos\nRisco 10 anos: ${result.riskPercentage}%\nCategoria: ${result.riskCategory}`;
    
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
    setAge('');
    setGender('');
    setTotalCholesterol('');
    setHdlCholesterol('');
    setSystolicBP('');
    setBpTreatment('');
    setDiabetes('');
    setSmoking('');
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-theme-background border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <Heart className="h-6 w-6 text-red-600" />
            Framingham Risk Score - Risco Cardiovascular 10 Anos
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
              <p>Calcule o risco de doença cardiovascular em 10 anos.</p>
              <p><strong>Parâmetros necessários:</strong></p>
              <ul className="text-xs space-y-1 ml-4">
                <li>• Idade: 30-79 anos</li>
                <li>• Colesterol total: mg/dL</li>
                <li>• HDL colesterol: mg/dL</li>
                <li>• Pressão sistólica: mmHg</li>
                <li>• Diabetes mellitus</li>
                <li>• Tabagismo atual</li>
                <li>• Tratamento para hipertensão</li>
              </ul>
              <p className="text-xs text-yellow-400 mt-2">
                <strong>Nota:</strong> Válido para prevenção primária (sem doença cardiovascular prévia).
              </p>
            </CardContent>
          </Card>

          {/* Main Input Card */}
          <Card className="lg:col-span-2 border-gray-700 bg-gray-800/50">
            <CardHeader>
              <CardTitle className="text-white">Dados do Paciente</CardTitle>
              <CardDescription className="text-gray-300">
                Fatores de risco cardiovascular
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Basic Demographics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Idade (anos)</Label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min="30"
                    max="79"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Sexo</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Cholesterol */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Colesterol Total (mg/dL)</Label>
                  <Input
                    type="number"
                    placeholder="200"
                    value={totalCholesterol}
                    onChange={(e) => setTotalCholesterol(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">HDL Colesterol (mg/dL)</Label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={hdlCholesterol}
                    onChange={(e) => setHdlCholesterol(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Blood Pressure */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Pressão Sistólica (mmHg)</Label>
                  <Input
                    type="number"
                    placeholder="120"
                    value={systolicBP}
                    onChange={(e) => setSystolicBP(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Tratamento para Hipertensão</Label>
                  <Select value={bpTreatment} onValueChange={setBpTreatment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">Não</SelectItem>
                      <SelectItem value="yes">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Risk Factors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Diabetes Mellitus</Label>
                  <Select value={diabetes} onValueChange={setDiabetes}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">Não</SelectItem>
                      <SelectItem value="yes">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Tabagismo Atual</Label>
                  <Select value={smoking} onValueChange={setSmoking}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">Não</SelectItem>
                      <SelectItem value="yes">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={calculateFraminghamRisk} className="flex-1">
                  Calcular Risco Framingham
                </Button>
                <Button onClick={clearForm} variant="outline" className="flex-1">
                  Limpar
                </Button>
              </div>

              {result && (
                <div className="space-y-3">
                  <div className={`p-4 rounded-lg ${
                    result.riskPercentage < 10 ? 'bg-green-50' :
                    result.riskPercentage < 20 ? 'bg-yellow-50' :
                    'bg-red-50'
                  }`}>
                    <h3 className={`font-semibold ${
                      result.riskPercentage < 10 ? 'text-green-900' :
                      result.riskPercentage < 20 ? 'text-yellow-900' :
                      'text-red-900'
                    }`}>Resultado Framingham:</h3>
                    <div className="text-center space-y-2">
                      <div className={`text-3xl font-bold ${
                        result.riskPercentage < 10 ? 'text-green-900' :
                        result.riskPercentage < 20 ? 'text-yellow-900' :
                        'text-red-900'
                      }`}>
                        {result.riskPercentage}% <span className="text-lg font-normal">em 10 anos</span>
                      </div>
                      <div className={`text-sm ${
                        result.riskPercentage < 10 ? 'text-green-800' :
                        result.riskPercentage < 20 ? 'text-yellow-800' :
                        'text-red-800'
                      }`}>
                        Pontuação Total: {result.totalPoints} pontos
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
                    result.riskPercentage < 10 ? 'bg-green-50' :
                    result.riskPercentage < 20 ? 'bg-yellow-50' :
                    'bg-red-50'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className={`h-4 w-4 ${
                        result.riskPercentage < 10 ? 'text-green-600' :
                        result.riskPercentage < 20 ? 'text-yellow-600' :
                        'text-red-600'
                      }`} />
                      <span className={`text-sm font-medium ${
                        result.riskPercentage < 10 ? 'text-green-800' :
                        result.riskPercentage < 20 ? 'text-yellow-800' :
                        'text-red-800'
                      }`}>Interpretação Clínica:</span>
                    </div>
                    <div className={`text-sm font-medium mb-2 ${
                      result.riskPercentage < 10 ? 'text-green-800' :
                      result.riskPercentage < 20 ? 'text-yellow-800' :
                      'text-red-800'
                    }`}>
                      {result.riskCategory}: {result.interpretation}
                    </div>
                    
                    <div className={`text-xs space-y-1 ${
                      result.riskPercentage < 10 ? 'text-green-700' :
                      result.riskPercentage < 20 ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>
                      <div><strong>Recomendações:</strong></div>
                      {result.recommendations.map((rec, index) => (
                        <div key={index}>• {rec}</div>
                      ))}
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

export default FraminghamRisk;