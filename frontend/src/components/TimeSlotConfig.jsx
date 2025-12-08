import React, { useState, useEffect } from 'react';
import { useTimeSlotStore } from '../store/timeSlotStore';
import { useThemeStore } from '../store/themeStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

import { Badge } from '../components/ui/badge';

const TimeSlotConfig = ({ selectedDate }) => {
  const { timeRanges, addTimeRange, removeTimeRange, generateSlotsFromRanges, createSlotsFromRangeInBackend } = useTimeSlotStore();
  const { isDarkMode } = useThemeStore();

  const dayId = selectedDate ? selectedDate.getDay() : new Date().getDay();
  const selectedLabel = selectedDate ? selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Dia selecionado';
  const [expandedDays, setExpandedDays] = useState({ [dayId]: true });
  useEffect(() => { setExpandedDays({ [dayId]: true }); }, [dayId]);
  const [newRange, setNewRange] = useState({
    startTime: '08:00',
    endTime: '12:00',
    duration: 30,
    interval: 15,
    modalities: ['presencial']
  });

  const weekDays = [
    { id: 0, name: 'Domingo', short: 'Dom' },
    { id: 1, name: 'Segunda-feira', short: 'Seg' },
    { id: 2, name: 'Terça-feira', short: 'Ter' },
    { id: 3, name: 'Quarta-feira', short: 'Qua' },
    { id: 4, name: 'Quinta-feira', short: 'Qui' },
    { id: 5, name: 'Sexta-feira', short: 'Sex' },
    { id: 6, name: 'Sábado', short: 'Sáb' }
  ];

  const modalityOptions = [
    { id: 'presencial', label: 'Presencial' },
    { id: 'telemedicina', label: 'Telemedicina' },
    { id: 'domiciliar', label: 'Domiciliar' }
  ];

  const durationOptions = [15, 30, 45, 60, 90, 120, 180];
  const intervalOptions = [0, 5, 10, 15, 20, 30, 45, 60];
  const singleWeekDays = weekDays.filter(day => day.id === dayId);

  const toggleDay = (dayId) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayId]: !prev[dayId]
    }));
  };

  const handleModalityChange = (modalityId) => {
    const currentModalities = newRange.modalities;
    const updatedModalities = currentModalities.includes(modalityId)
      ? currentModalities.filter(m => m !== modalityId)
      : [...currentModalities, modalityId];

    setNewRange(prev => ({
      ...prev,
      modalities: updatedModalities
    }));
  };

  const handleRemoveRange = (dayId, rangeId) => {
    if (window.confirm('Tem certeza que deseja remover esta faixa horária?')) {
      removeTimeRange(dayId, rangeId);
    }
  };

  const formatTime = (time) => {
    return time.substring(0, 5);
  };

  const getTotalHours = (ranges) => {
    return ranges.reduce((total, range) => {
      const start = timeToMinutes(range.startTime);
      const end = timeToMinutes(range.endTime);
      return total + (end - start) / 60;
    }, 0);
  };

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const handleAddRange = async (dayId) => {
    const result = addTimeRange(dayId, { ...newRange, interval: newRange.interval });
    if (!result.success) {
      alert(`Falha ao validar faixa: ${result.errors?.join(', ')}`);
      return;
    }
    const saveRes = await createSlotsFromRangeInBackend(dayId, result.range);
    if (saveRes.errors?.length) {
      if (import.meta.env.DEV) {
        console.warn('Slots não criados por conflito/erro (dev):', saveRes.errors);
      }
    }
    alert(`Faixa salva! ${saveRes.created.length} slot(s) criado(s).`);
  };

  return (
    <Card className={`w-full max-w-3xl mx-auto border-transparent ${isDarkMode ? 'bg-theme-card' : 'bg-[#F3F3F3]'}`}>
      <CardHeader>
        <CardTitle className="text-theme-text text-center">Configuração de Faixas Horárias</CardTitle>
        <p className="text-sm text-theme-text opacity-70">
          Configure os horários de atendimento por dia da semana
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {singleWeekDays.map(day => {
          const dayRanges = timeRanges[day.id] || [];
          const totalHours = getTotalHours(dayRanges);

          return (
            <div key={day.id} className="border border-transparent rounded-lg p-4">
              <div
                className="flex items-center justify-between cursor-pointer hover:bg-theme-surface p-2 rounded transition-colors"
                onClick={() => toggleDay(day.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-theme-surface rounded-full">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-theme-text' : 'text-black'}`}>
                      {day.short}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-theme-text">{day.name}</h3>
                    <p className="text-sm text-theme-text opacity-70">
                      {dayRanges.length} faixa(s) • {totalHours.toFixed(1)}h total
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {dayRanges.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {dayRanges.length} ativa(s)
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDay(day.id);
                    }}
                  >
                    Abrir
                  </Button>
                </div>
              </div>

              {expandedDays[day.id] && (
                <div className="mt-4 space-y-4 border-t border-theme-border pt-4">
                  {/* Existing ranges */}
                  {dayRanges.length > 0 && (
                    <div className="space-y-2 max-w-2xl mx-auto">
                      <h4 className="text-sm font-medium text-theme-text">Faixas existentes:</h4>
                      {dayRanges.map(range => (
                        <div key={range.id} className="flex items-center justify-between p-3 bg-theme-surface rounded-lg">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">

                              <span className={`font-mono ${isDarkMode ? 'text-theme-text' : 'text-black'}`}>
                                {formatTime(range.startTime)} - {formatTime(range.endTime)}
                              </span>
                            </div>
                            <div className="text-theme-text opacity-70">
                              {range.duration}min duração • intervalo {range.interval}min
                            </div>
                            <div className="flex gap-1">
                              {range.modalities.map(mod => {
                                const option = modalityOptions.find(o => o.id === mod);
                                if (!option) return null;
                                const Icon = option.icon;
                                return (
                                  <Badge key={mod} variant="secondary" className="text-xs">

                                    {option.label.substring(0, 3)}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRange(day.id, range.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remover
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New range form */}
                  <div className="space-y-4 p-4 bg-theme-card border border-theme-border rounded-lg max-w-2xl mx-auto">
                    <h4 className="text-sm font-medium text-theme-text">Adicionar nova faixa:</h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`start-${day.id}`} className="text-theme-text">Horário inicial</Label>
                        <Input
                          id={`start-${day.id}`}
                          type="time"
                          value={newRange.startTime}
                          onChange={(e) => setNewRange(prev => ({ ...prev, startTime: e.target.value }))}
                          className="bg-theme-card border-theme-border text-theme-text"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`end-${day.id}`} className="text-theme-text">Horário final</Label>
                        <Input
                          id={`end-${day.id}`}
                          type="time"
                          value={newRange.endTime}
                          onChange={(e) => setNewRange(prev => ({ ...prev, endTime: e.target.value }))}
                          className="bg-theme-card border-theme-border text-theme-text"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`duration-${day.id}`} className="text-theme-text">Duração (min)</Label>
                        <Select
                          value={newRange.duration.toString()}
                          onValueChange={(value) => setNewRange(prev => ({ ...prev, duration: parseInt(value) }))}
                        >
                          <SelectTrigger className="bg-theme-card border-theme-border text-theme-text">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {durationOptions.map(dur => (
                              <SelectItem key={dur} value={dur.toString()}>
                                {dur} minutos
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`interval-${day.id}`} className="text-theme-text">Intervalo (min)</Label>
                        <Select
                          value={newRange.interval.toString()}
                          onValueChange={(value) => setNewRange(prev => ({ ...prev, interval: parseInt(value) }))}
                        >
                          <SelectTrigger className="bg-theme-card border-theme-border text-theme-text">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {intervalOptions.map(intv => (
                              <SelectItem key={intv} value={intv.toString()}>
                                {intv} minutos
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2 max-w-md mx-auto">
                      <Label className="text-theme-text">Modalidades de atendimento</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {modalityOptions.map(option => {
                          const Icon = option.icon;
                          const isSelected = newRange.modalities.includes(option.id);

                          return (
                            <div
                              key={option.id}
                              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected
                                  ? 'bg-theme-accent border-theme-accent text-white'
                                  : 'bg-theme-card border-theme-border hover:bg-theme-surface'
                                }`}
                              onClick={() => handleModalityChange(option.id)}
                            >
                              <Checkbox
                                checked={isSelected}
                                onChange={() => { }} // Handled by parent click
                                className="border-theme-border"
                              />

                              <span className={`text-sm ${isDarkMode ? (isSelected ? 'text-white' : 'text-theme-text') : 'text-black'}`}>
                                {option.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-center">
                      <Button
                        onClick={() => handleAddRange(day.id)}
                        className=""
                      >

                        Salvar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setExpandedDays(prev => ({ ...prev, [day.id]: false }))}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}


      </CardContent>
    </Card>
  );
};

export default TimeSlotConfig;