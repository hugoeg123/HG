import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, Settings } from 'lucide-react';

const MarkingModeConfig = ({ 
  appointmentDuration, 
  setAppointmentDuration, 
  intervalBetween, 
  setIntervalBetween,
  markingMode,
  setMarkingMode,
  isDarkModeUI 
}) => {
  const handleDurationChange = (e) => {
    const value = parseInt(e.target.value) || 30;
    setAppointmentDuration(Math.max(15, Math.min(240, value)));
  };

  const handleIntervalChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setIntervalBetween(Math.max(0, Math.min(60, value)));
  };

  const getModeButtonClass = (mode) => {
    const baseClass = "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200";
    const isActive = markingMode === mode;
    
    if (isDarkModeUI) {
      return isActive 
        ? `${baseClass} bg-green-600 text-white shadow-lg`
        : `${baseClass} bg-gray-700 text-gray-300 hover:bg-gray-600`;
    } else {
      return isActive 
        ? `${baseClass} bg-blue-600 text-white shadow-lg`
        : `${baseClass} bg-gray-100 text-gray-700 hover:bg-gray-200`;
    }
  };

  return (
    <Card className={`${isDarkModeUI ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 text-sm font-semibold ${
          isDarkModeUI ? 'text-gray-200' : 'text-gray-800'
        }`}>
          <Settings className="w-4 h-4" />
          Configurações de Marcação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode Selection */}
        <div className="space-y-3">
          <Label className={`text-sm font-medium ${
            isDarkModeUI ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Modo de Marcação
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMarkingMode('availability')}
              className={getModeButtonClass('availability')}
            >
              <Calendar className="w-4 h-4" />
              Disponibilizar
            </button>
            <button
              onClick={() => setMarkingMode('appointment')}
              className={getModeButtonClass('appointment')}
            >
              <Clock className="w-4 h-4" />
              Agendar
            </button>
          </div>
        </div>

        {/* Duration and Interval Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label 
              htmlFor="duration"
              className={`text-sm font-medium ${
                isDarkModeUI ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Duração (min)
            </Label>
            <Input
              id="duration"
              type="number"
              value={appointmentDuration}
              onChange={handleDurationChange}
              min="15"
              max="240"
              step="5"
              className={`text-sm ${
                isDarkModeUI 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
            />
          </div>
          
          <div className="space-y-2">
            <Label 
              htmlFor="interval"
              className={`text-sm font-medium ${
                isDarkModeUI ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Intervalo (min)
            </Label>
            <Input
              id="interval"
              type="number"
              value={intervalBetween}
              onChange={handleIntervalChange}
              min="0"
              max="60"
              step="5"
              className={`text-sm ${
                isDarkModeUI 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
            />
          </div>
        </div>

        {/* Mode Description */}
        <div className={`p-3 rounded-lg text-sm ${
          markingMode === 'availability'
            ? (isDarkModeUI ? 'bg-green-900/20 text-green-300 border border-green-700/30' : 'bg-green-50 text-green-700 border border-green-200')
            : (isDarkModeUI ? 'bg-blue-900/20 text-blue-300 border border-blue-700/30' : 'bg-blue-50 text-blue-700 border border-blue-200')
        }`}>
          <div className="flex items-center gap-2">
            {markingMode === 'availability' ? (
              <>
                <Calendar className="w-4 h-4" />
                <span>Disponibilizar horários com duração de {appointmentDuration}min e intervalo de {intervalBetween}min</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                <span>Agendar paciente com duração de {appointmentDuration}min</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarkingModeConfig;