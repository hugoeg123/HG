import React, { useEffect, useMemo, useState } from 'react';
import { useThemeStore } from '../store/themeStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Plus, Trash2 } from 'lucide-react';

/**
 * Página de Agenda (Calendário Mensal)
 * 
 * - Exibe meses atualizados com navegação entre meses
 * - Seleção de dias e horários disponíveis
 * - Consistência visual com modos dark/bright
 * - Responsivo e otimizado para UX
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
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [newTime, setNewTime] = useState('');
  const [newMode, setNewMode] = useState('presencial');
  const [availability, setAvailability] = useState(() => {
    try {
      const raw = localStorage.getItem('agendaAvailability');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('agendaAvailability', JSON.stringify(availability));
    } catch {}
  }, [availability]);

  const days = useMemo(() => buildMonthDays(currentMonth), [currentMonth]);
  const todayKey = formatDateKey(new Date());
  const selectedKey = formatDateKey(selectedDate);

  const addSlot = () => {
    if (!newTime) return;
    const key = selectedKey;
    const existing = availability[key] || [];
    const next = [...existing, { time: newTime, mode: newMode }];
    setAvailability({ ...availability, [key]: next });
    setNewTime('');
    setNewMode('presencial');
  };

  const removeSlot = (idx) => {
    const key = selectedKey;
    const existing = availability[key] || [];
    const next = existing.filter((_, i) => i !== idx);
    setAvailability({ ...availability, [key]: next });
  };

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

  const slotsForSelected = availability[selectedKey] || [];

  return (
    <div className="min-h-screen p-6 bg-theme-background">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-theme-card border-theme-border">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CalendarIcon className="w-5 h-5" />
              <span>Agenda</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={gotoPrevMonth} aria-label="Mês anterior">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="px-3 py-1 rounded-md border border-theme-border bg-theme-surface text-sm">
                {monthLabel(currentMonth)}
              </div>
              <Button variant="outline" size="sm" onClick={gotoNextMonth} aria-label="Próximo mês">
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={gotoToday}>Hoje</Button>
            </div>
          </CardHeader>
        </Card>

        {/* Calendar Grid */}
        <Card className="bg-theme-card border-theme-border">
          <CardContent className="pt-6">
            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs sm:text-sm text-muted-foreground mb-2">
              {weekDays.map((wd) => (
                <div key={wd} className="py-2">{wd}</div>
              ))}
            </div>
            {/* Days */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {days.map(({ date, inMonth }, idx) => {
                const key = formatDateKey(date);
                const isToday = key === todayKey;
                const isSelected = key === selectedKey;
                const slots = availability[key]?.length || 0;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(date)}
                    className={[
                      'relative rounded-md p-2 sm:p-3 text-left border transition-colors focus:outline-none focus:ring-1 focus:ring-teal-500',
                      inMonth ? 'bg-theme-surface border-theme-border' : 'bg-theme-background border-transparent opacity-60',
                      isSelected ? (isDarkMode ? 'ring-2 ring-teal-400' : 'ring-2 ring-blue-600') : '',
                      isToday ? 'shadow-inner' : ''
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-base font-medium text-foreground">
                        {date.getDate()}
                      </span>
                      {slots > 0 && (
                        <Badge variant="secondary" className="text-[10px] sm:text-xs">
                          {slots} horários
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day & Slots */}
        <Card className="bg-theme-card border-theme-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>Horários de {new Date(selectedDate).toLocaleDateString('pt-BR')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Horário</label>
                <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Modalidade</label>
                <Select value={newMode} onValueChange={setNewMode}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Escolha a modalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial (residência)</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                    <SelectItem value="flex">Tanto faz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={addSlot} className="w-full md:w-auto" disabled={!newTime}>
                  <Plus className="w-4 h-4 mr-2" /> Adicionar horário
                </Button>
              </div>
            </div>

            {slotsForSelected.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhum horário cadastrado para este dia.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {slotsForSelected.map((slot, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-md border bg-theme-surface border-theme-border">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {slot.time}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {slot.mode === 'presencial' ? 'Presencial' : slot.mode === 'virtual' ? 'Virtual' : 'Tanto faz'}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeSlot(idx)} aria-label="Remover">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Agenda;