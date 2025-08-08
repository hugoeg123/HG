import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.tsx';
import { Input } from '../ui/input.tsx';
import { Label } from '../ui/label.tsx';
// import { Separator } from '../ui/separator.tsx'; // Componente não existe
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs.tsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip.tsx';
import { Copy, Info, Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { useToast } from '../ui/Toast';

/**
 * ConversaoGotejamento Component - Calculadora de conversão de gotejamento
 * 
 * @component
 * @example
 * return (
 *   <ConversaoGotejamento />
 * )
 * 
 * Integrates with:
 * - components/ui/* para componentes de interface
 * - useToast para notificações
 * 
 * IA prompt: Adicionar histórico de conversões, presets de equipos comuns, e validação de ranges médicos
 */
const ConversaoGotejamento = () => {
  const { toast } = useToast();
  
  // Estados para conversão direta
  const [gotasMin, setGotasMin] = useState('');
  const [mlHora, setMlHora] = useState('');
  const [fatorGotejamento, setFatorGotejamento] = useState('20'); // padrão 20 gotas/mL
  
  // Estados para tap (contagem de gotas)
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const intervalRef = useRef(null);
  
  // Resultados calculados
  const [resultados, setResultados] = useState({
    gotasMinCalculado: null,
    mlHoraCalculado: null,
    tempoDecorrido: null,
    velocidadeInfusao: null
  });

  /**
   * Formatar número para exibição
   * @param {number} num - Número para formatar
   * @param {number} decimals - Casas decimais
   * @returns {string} Número formatado
   */
  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined || isNaN(num)) return '--';
    return Number(num).toFixed(decimals);
  };

  /**
   * Componente para valores copiáveis
   */
  const CopyableValue = ({ label, value, unit = '', decimals = 2 }) => {
    const formattedValue = formatNumber(value, decimals);
    
    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(`${label}: ${formattedValue}${unit}`);
        toast.success('Valor copiado para a área de transferência!');
      } catch (err) {
        toast.error('Erro ao copiar valor');
      }
    };

    return (
      <div className="flex items-center justify-between p-3 bg-theme-surface rounded-lg border border-gray-700/30">
        <div className="flex-1">
          <div className="text-sm text-gray-400">{label}</div>
          <div className="text-lg font-semibold text-white">
            {formattedValue}{unit && <span className="text-sm text-gray-300 ml-1">{unit}</span>}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="ml-2 h-8 w-8 p-0"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  // Efeito para atualizar o cronômetro
  useEffect(() => {
    if (isRunning && startTime) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, startTime]);

  // Cálculos automáticos
  useEffect(() => {
    const fator = parseFloat(fatorGotejamento) || 20;
    
    // Conversão de gotas/min para mL/h
    if (gotasMin && !isNaN(gotasMin)) {
      const gotas = parseFloat(gotasMin);
      const mlH = (gotas * 60) / fator;
      setResultados(prev => ({ ...prev, mlHoraCalculado: mlH }));
    }
    
    // Conversão de mL/h para gotas/min
    if (mlHora && !isNaN(mlHora)) {
      const ml = parseFloat(mlHora);
      const gotasM = (ml * fator) / 60;
      setResultados(prev => ({ ...prev, gotasMinCalculado: gotasM }));
    }
    
    // Cálculo baseado no tap
    if (tapCount > 0 && elapsedTime > 0) {
      const tempoMinutos = elapsedTime / (1000 * 60);
      const gotasPorMinuto = tapCount / tempoMinutos;
      const mlPorHora = (gotasPorMinuto * 60) / fator;
      
      setResultados(prev => ({
        ...prev,
        gotasMinCalculado: gotasPorMinuto,
        mlHoraCalculado: mlPorHora,
        tempoDecorrido: tempoMinutos,
        velocidadeInfusao: mlPorHora
      }));
    }
  }, [gotasMin, mlHora, fatorGotejamento, tapCount, elapsedTime]);

  const handleStartStop = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      setStartTime(Date.now());
      setIsRunning(true);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setStartTime(null);
    setElapsedTime(0);
    setTapCount(0);
    setResultados({
      gotasMinCalculado: null,
      mlHoraCalculado: null,
      tempoDecorrido: null,
      velocidadeInfusao: null
    });
  };

  const handleTap = () => {
    if (isRunning) {
      setTapCount(prev => prev + 1);
    }
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header com informações */}
      <Card className="bg-theme-card border-theme-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Timer className="h-5 w-5 text-teal-400" />
            Conversão de Gotejamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Info className="h-4 w-4" />
            <span>Converte entre gotas/min e mL/h com contagem manual ou direta</span>
          </div>
        </CardContent>
      </Card>

      {/* Configuração do fator de gotejamento */}
      <Card className="bg-theme-card border-theme-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base">Configuração do Equipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="fator" className="text-gray-300">Fator de Gotejamento</Label>
            <div className="flex gap-2">
              <Input
                id="fator"
                type="number"
                value={fatorGotejamento}
                onChange={(e) => setFatorGotejamento(e.target.value)}
                className="bg-theme-surface border-gray-600 text-white"
                placeholder="20"
              />
              <div className="flex items-center px-3 bg-theme-surface border border-gray-600 rounded-md">
                <span className="text-sm text-gray-400">gotas/mL</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Padrão: Macrogotas = 20 gotas/mL, Microgotas = 60 gotas/mL
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para diferentes métodos */}
      <Tabs defaultValue="tap" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-theme-surface">
          <TabsTrigger value="tap" className="data-[state=active]:bg-theme-card data-[state=active]:text-white">
            Tap (Contar Gotas)
          </TabsTrigger>
          <TabsTrigger value="direct" className="data-[state=active]:bg-theme-card data-[state=active]:text-white">
            Conversão Direta
          </TabsTrigger>
        </TabsList>

        {/* Tab de contagem manual */}
        <TabsContent value="tap" className="space-y-4">
          <Card className="bg-theme-card border-theme-border">
            <CardHeader>
              <CardTitle className="text-white text-base">Contagem Manual de Gotas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cronômetro e controles */}
              <div className="text-center space-y-4">
                <div className="text-3xl font-mono text-white">
                  {formatTime(elapsedTime)}
                </div>
                
                <div className="text-lg text-gray-300">
                  Gotas contadas: <span className="font-semibold text-white">{tapCount}</span>
                </div>
                
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={handleStartStop}
                    variant={isRunning ? "destructive" : "default"}
                    className="flex items-center gap-2"
                  >
                    {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {isRunning ? 'Parar' : 'Iniciar'}
                  </Button>
                  
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </div>
              
              <div className="h-px bg-gray-700 my-4" />
              
              {/* Botão de tap */}
              <div className="text-center">
                <Button
                  onClick={handleTap}
                  disabled={!isRunning}
                  size="lg"
                  className="h-20 w-full text-lg font-semibold bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
                >
                  TAP - Contar Gota
                </Button>
                <div className="text-xs text-gray-500 mt-2">
                  Toque a cada gota que cair
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de conversão direta */}
        <TabsContent value="direct" className="space-y-4">
          <Card className="bg-theme-card border-theme-border">
            <CardHeader>
              <CardTitle className="text-white text-base">Conversão Direta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Input gotas/min */}
                <div className="space-y-2">
                  <Label htmlFor="gotas" className="text-gray-300">Gotas por minuto</Label>
                  <Input
                    id="gotas"
                    type="number"
                    value={gotasMin}
                    onChange={(e) => setGotasMin(e.target.value)}
                    className="bg-theme-surface border-gray-600 text-white"
                    placeholder="Ex: 30"
                  />
                </div>
                
                {/* Input mL/h */}
                <div className="space-y-2">
                  <Label htmlFor="ml" className="text-gray-300">mL por hora</Label>
                  <Input
                    id="ml"
                    type="number"
                    value={mlHora}
                    onChange={(e) => setMlHora(e.target.value)}
                    className="bg-theme-surface border-gray-600 text-white"
                    placeholder="Ex: 90"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resultados */}
      <Card className="bg-theme-card border-theme-border">
        <CardHeader>
          <CardTitle className="text-white text-base">Resultados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <CopyableValue
            label="Gotas por minuto"
            value={resultados.gotasMinCalculado}
            unit="gotas/min"
            decimals={1}
          />
          
          <CopyableValue
            label="mL por hora"
            value={resultados.mlHoraCalculado}
            unit="mL/h"
            decimals={1}
          />
          
          {resultados.tempoDecorrido && (
            <CopyableValue
              label="Tempo de medição"
              value={resultados.tempoDecorrido}
              unit="min"
              decimals={2}
            />
          )}
        </CardContent>
      </Card>

      {/* Informações adicionais */}
      <Card className="bg-theme-card border-theme-border">
        <CardContent className="pt-6">
          <div className="text-sm text-gray-400 space-y-2">
            <div className="font-medium text-gray-300">Fórmulas utilizadas:</div>
            <div>• mL/h = (gotas/min × 60) ÷ fator de gotejamento</div>
            <div>• gotas/min = (mL/h × fator de gotejamento) ÷ 60</div>
            <div className="mt-3 font-medium text-gray-300">Fatores comuns:</div>
            <div>• Macrogotas: 20 gotas/mL</div>
            <div>• Microgotas: 60 gotas/mL</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversaoGotejamento;

// Hook: Componente hardcoded para conversão de gotejamento
// Conector: Integra com CalculatorModal.jsx via registro no calculatorStore