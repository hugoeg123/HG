import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTimeSlotStore } from '@/stores/timeSlotStore.js';

const TimeGridHeader = () => {
  const { selectedWeek, setSelectedWeek, viewMode, setViewMode } = useTimeSlotStore();
  
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }); // Segunda-feira
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const handlePreviousWeek = () => {
    setSelectedWeek(subWeeks(selectedWeek, 1));
  };

  const handleNextWeek = () => {
    setSelectedWeek(addWeeks(selectedWeek, 1));
  };

  const handleToday = () => {
    setSelectedWeek(new Date());
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  const weekDays = [
    { key: 'time', label: 'Horário', className: 'w-20' },
    { key: '1', label: 'Seg', fullName: 'Segunda-feira' },
    { key: '2', label: 'Ter', fullName: 'Terça-feira' },
    { key: '3', label: 'Qua', fullName: 'Quarta-feira' },
    { key: '4', label: 'Qui', fullName: 'Quinta-feira' },
    { key: '5', label: 'Sex', fullName: 'Sexta-feira' },
    { key: '6', label: 'Sáb', fullName: 'Sábado' },
    { key: '0', label: 'Dom', fullName: 'Domingo' }
  ];

  const getDayHeaderClass = (dayKey) => {
    const baseClass = "p-3 text-center border-b border-r border-theme-border font-medium";
    
    if (dayKey === 'time') {
      return `${baseClass} bg-theme-card text-theme-text-secondary`;
    }
    
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + (parseInt(dayKey) - 1));
    const isToday = format(dayDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    
    return `${baseClass} ${
      isToday 
        ? 'bg-theme-accent/10 text-theme-accent border-theme-accent/30' 
        : 'bg-theme-card text-theme-text-primary'
    }`;
  };

  return (
    <div className="bg-theme-card border border-theme-border rounded-lg shadow-sm">
      {/* Controles da semana */}
      <div className="flex items-center justify-between p-4 border-b border-theme-border">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousWeek}
            className="hover:bg-theme-hover"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="hover:bg-theme-hover"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Hoje
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextWeek}
            className="hover:bg-theme-hover"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-theme-text-primary">
            {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} - {format(weekEnd, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h3>
          <p className="text-sm text-theme-text-secondary">
            Semana de {format(weekStart, "'dia' dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-theme-hover rounded-lg p-1">
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('day')}
              className={viewMode === 'day' ? 'bg-theme-accent text-white' : 'hover:bg-theme-hover'}
            >
              Dia
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('week')}
              className={viewMode === 'week' ? 'bg-theme-accent text-white' : 'hover:bg-theme-hover'}
            >
              Semana
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('month')}
              className={viewMode === 'month' ? 'bg-theme-accent text-white' : 'hover:bg-theme-hover'}
            >
              Mês
            </Button>
          </div>
        </div>
      </div>

      {/* Cabeçalho dos dias */}
      <div className="grid grid-cols-8 bg-theme-card">
        {weekDays.map((day) => (
          <div
            key={day.key}
            className={getDayHeaderClass(day.key)}
            title={day.fullName}
          >
            <div className="flex flex-col items-center">
              <span className="text-sm font-medium">{day.label}</span>
              {day.key !== 'time' && (
                <span className="text-xs text-theme-text-secondary mt-1">
                  {format(new Date(weekStart.getTime() + (parseInt(day.key) - 1) * 24 * 60 * 60 * 1000), 'dd', { locale: ptBR })}
                </span>
              )}
              {day.key === 'time' && (
                <Clock className="h-3 w-3 text-theme-text-secondary mt-1" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legenda de status */}
      <div className="flex items-center justify-center gap-6 p-3 border-t border-theme-border bg-theme-hover/30">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border border-theme-border bg-[var(--slot-available-bg)]"></div>
          <span className="text-xs text-theme-text-secondary">Disponível</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border border-theme-border bg-[var(--slot-booked-bg)]"></div>
          <span className="text-xs text-theme-text-secondary">Agendado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border border-theme-border bg-[var(--slot-blocked-bg)]"></div>
          <span className="text-xs text-theme-text-secondary">Bloqueado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-theme-accent bg-theme-card"></div>
          <span className="text-xs text-theme-text-secondary">Telemedicina</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-theme-accent bg-theme-accent"></div>
          <span className="text-xs text-theme-text-secondary">Presencial</span>
        </div>
      </div>
    </div>
  );
};

export default TimeGridHeader;