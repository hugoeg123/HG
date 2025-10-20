import React, { useMemo, useState, useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Importar novos componentes
import WeeklyTimeGrid from '../components/WeeklyTimeGrid';
import TimeSlotConfig from '../components/TimeSlotConfig';
import TimeGridHeader from '../components/TimeGridHeader';
import TimeGridControls from '../components/TimeGridControls';

import { useTimeSlotStore } from '../stores/timeSlotStore';

/**
 * Página de Agenda (Calendário Mensal + Grid Visual)
 * 
 * - Exibe meses atualizados com navegação entre meses
 * - Grid visual semanal com slots de tempo
 * - Configuração de faixas horárias
 * - Sistema de temas com suporte dark/bright
 * - Integração com novo sistema de estado Zustand
 */
const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const formatDateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const monthLabel = (date) => {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

const buildMonthDays = (current) => {
  const year = current.getFullYear();
  const month = current.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const days = [];
  // Offset for week start (Sunday=0)
  const offset = start.getDay();
  // Previous month days to fill leading cells
  const prevMonth = new Date(year, month, 0);
  for (let i = offset - 1; i >= 0; i--) {
    const d = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonth.getDate() - i);
    days.push({ date: d, inMonth: false });
  }
  // Current month days
  for (let day = 1; day <= end.getDate(); day++) {
    days.push({ date: new Date(year, month, day), inMonth: true });
  }
  // Fill trailing cells to reach 6 weeks (42 cells)
  const trailing = 42 - days.length;
  for (let i = 1; i <= trailing; i++) {
    days.push({ date: new Date(year, month + 1, i), inMonth: false });
  }
  return days;
};

const Agenda = () => {
  const { isDarkMode } = useThemeStore();
  const { 
    setSelectedWeek,
    timeRanges,
    timeSlots,
    getSlotsForDay,
    loadFromLocalStorage,
    loadSlotsForMonth
  } = useTimeSlotStore();
  
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  // Prefetch mensal de slots ao mudar de mês
  useEffect(() => {
    loadSlotsForMonth(currentMonth);
  }, [currentMonth, loadSlotsForMonth]);

  const days = useMemo(() => buildMonthDays(currentMonth), [currentMonth]);
  const todayKey = formatDateKey(new Date());
  const selectedKey = formatDateKey(selectedDate);
  const arrowColorClass = isDarkMode ? 'text-emerald-500' : 'text-blue-600';



  const gotoPrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const gotoNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  const gotoToday = () => {
    const d = new Date();
    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDate(d);
  };
  
  const gotoPrevDay = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      setSelectedWeek(d);
      return d;
    });
  };

  const gotoNextDay = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      setSelectedWeek(d);
      return d;
    });
  };




  return (
    <div className="min-h-screen p-6 bg-theme-background">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Agenda</h1>
            <p className="text-sm text-muted-foreground">Gerencie sua disponibilidade e horários</p>
          </div>
          
        </div>

        {/* Página única: calendário, configuração do dia e grid */}
        <Card className="bg-theme-card border-theme-border">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              <span>{monthLabel(currentMonth)}</span>
            </CardTitle>
            <div className="flex items-center gap-1 px-1 rounded-md border border-theme-border bg-theme-hover/40">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Mês anterior"
                onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                className="hover:bg-theme-hover h-8 w-8 p-0 rounded"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Próximo mês"
                onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                className="hover:bg-theme-hover h-8 w-8 p-0 rounded"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-7 gap-2 text-center text-xs sm:text-sm text-muted-foreground mb-2">
              {weekDays.map((wd) => (
                <div key={wd} className="py-2">{wd}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {days.map(({ date, inMonth }, idx) => {
                const key = formatDateKey(date);
                const isToday = key === todayKey;
                const isSelected = key === selectedKey;
                const slots = getSlotsForDay(date);
                const availableCount = slots.filter(s => s.status === 'available').length;
                const bookedCount = slots.filter(s => s.status === 'booked').length;
                return (
                  <button
                    key={idx}
                    onClick={() => { setSelectedDate(date); setSelectedWeek(date); }}
                    className={[
                      'calendar-day',
                      inMonth ? 'in-month' : 'out-month',
                      isSelected ? 'is-selected' : '',
                      isToday ? 'is-today' : ''
                    ].join(' ')}
                    style={{ borderWidth: isSelected ? '3px' : '1px' }}
                  >
                    <div className="relative w-full h-full">
                      <span className="day-number">
                        {date.getDate()}
                      </span>
                      <div className="calendar-bars">
                        {bookedCount > 0 && (
                          <div className="calendar-bar bar-scheduled">
                            {bookedCount} {bookedCount === 1 ? 'agendado' : 'agendados'}
                          </div>
                        )}
                        {availableCount > 0 && (
                          <div className="calendar-bar bar-available">
                            {availableCount} {availableCount === 1 ? 'livre' : 'livres'}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-start justify-center mb-4">
          <div className="relative w-full max-w-[680px]">
            <div className="absolute inset-y-0 left-0 w-12 flex">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={gotoPrevDay}
                  aria-label="Dia anterior"
                  className="w-full h-full p-0 rounded-md bg-transparent hover:bg-theme-hover/10 flex items-center justify-center"
                >
                  <ChevronLeft className={`h-8 w-8 ${arrowColorClass}`} />
                </Button>
              </div>
            <div className="absolute inset-y-0 right-0 w-12 flex">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={gotoNextDay}
                  aria-label="Próximo dia"
                  className="w-full h-full p-0 rounded-md bg-transparent hover:bg-theme-hover/10 flex items-center justify-center"
                >
                  <ChevronRight className={`h-8 w-8 ${arrowColorClass}`} />
                </Button>
              </div>
            <div className="px-14">
                <TimeSlotConfig selectedDate={selectedDate} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <TimeGridHeader />
          <TimeGridControls />
          <WeeklyTimeGrid selectedDate={selectedDate} />
        </div>
      </div>
    </div>
  );
};

export default Agenda;