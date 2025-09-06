import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';

/**
 * TapCounter Component - Contador manual de gotas com cronômetro
 * 
 * Integrates with:
 * - components/ui/* para componentes shadcn
 * - DynamicCalculator.tsx quando schema.ui.tap.targetField está definido
 * - CalcInput.tsx para integração com campo de gotas/min
 * 
 * @component
 * @param {Object} props
 * @param {Function} props.onTapResult - Callback com resultado (gotas/min)
 * @param {boolean} props.disabled - Se está desabilitado
 * @param {string} props.className - Classes CSS adicionais
 * @param {number} props.minTime - Tempo mínimo em segundos para cálculo válido
 * 
 * @example
 * return (
 *   <TapCounter
 *     onTapResult={(gttPerMin) => setGotasMin(gttPerMin)}
 *     minTime={10}
 *   />
 * )
 * 
 * Hook: Contador de tap integrado ao sistema de calculadoras
 * IA prompt: Adicionar detecção de ritmo irregular e sugestões de tempo ideal
 */
interface TapCounterProps {
  onTapResult?: (gttPerMin: number, tapCount: number, elapsedSeconds: number) => void;
  disabled?: boolean;
  className?: string;
  minTime?: number;
}

export const TapCounter: React.FC<TapCounterProps> = ({
  onTapResult,
  disabled = false,
  className = '',
  minTime = 5
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update elapsed time when running
  useEffect(() => {
    if (isRunning && startTime) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, startTime]);

  // Calculate and report results when tap count or elapsed time changes
  useEffect(() => {
    if (tapCount > 0 && elapsedTime > 0) {
      const elapsedSeconds = elapsedTime / 1000;
      const gttPerMin = (tapCount / elapsedSeconds) * 60;
      
      if (onTapResult && elapsedSeconds >= minTime) {
        onTapResult(gttPerMin, tapCount, elapsedSeconds);
      }
    }
  }, [tapCount, elapsedTime, onTapResult, minTime]);

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
  };

  const handleTap = () => {
    if (isRunning) {
      setTapCount(prev => prev + 1);
    }
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}.${centiseconds.toString().padStart(2, '0')}`;
  };

  const elapsedSeconds = elapsedTime / 1000;
  const gttPerMin = tapCount > 0 && elapsedSeconds > 0 ? (tapCount / elapsedSeconds) * 60 : 0;
  const isValidMeasurement = elapsedSeconds >= minTime && tapCount > 0;

  return (
    <Card className={`bg-theme-surface border-theme-border ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-teal-400" />
            <span className="text-sm font-medium text-teal-300">Contador Manual</span>
          </div>

          {/* Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-xs text-gray-400">Tempo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {tapCount}
              </div>
              <div className="text-xs text-gray-400">Gotas</div>
            </div>
          </div>

          {/* Result */}
          {tapCount > 0 && elapsedSeconds > 0 && (
            <div className="text-center p-3 bg-gray-900/50 rounded-lg border border-gray-700/30">
              <div className={`text-lg font-semibold ${
                isValidMeasurement ? 'text-emerald-300' : 'text-yellow-400'
              }`}>
                {gttPerMin.toFixed(1)} gtt/min
              </div>
              <div className="text-xs text-gray-400">
                {isValidMeasurement 
                  ? 'Medição válida' 
                  : `Mínimo ${minTime}s para medição confiável`
                }
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            <Button
              onClick={handleStartStop}
              disabled={disabled}
              className={`flex-1 ${
                isRunning 
                  ? 'bg-red-600/20 text-red-300 hover:bg-red-600/30 border-red-500/30' 
                  : 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border-emerald-500/30'
              } border`}
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Parar
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar
                </>
              )}
            </Button>
            
            <Button
              onClick={handleReset}
              disabled={disabled}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Tap Button */}
          <Button
            onClick={handleTap}
            disabled={!isRunning || disabled}
            className={`w-full h-16 text-lg font-semibold ${
              isRunning
                ? 'bg-teal-600/30 text-teal-200 hover:bg-teal-600/50 border-teal-500/50 active:bg-teal-600/70'
                : 'bg-gray-700/30 text-gray-500 cursor-not-allowed'
            } border-2 transition-all duration-150`}
          >
            {isRunning ? 'TAP - Contar Gota' : 'Inicie o cronômetro para contar'}
          </Button>

          {/* Instructions */}
          <div className="text-xs text-gray-400 text-center space-y-1">
            <p>1. Clique "Iniciar" para começar o cronômetro</p>
            <p>2. Toque "TAP" a cada gota que cair</p>
            <p>3. Conte por pelo menos {minTime} segundos para maior precisão</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TapCounter;

// Connector: Integrado em DynamicCalculator.tsx via schema.ui.tap.targetField
// Hook: Contador de tap para calculadoras de gotejamento