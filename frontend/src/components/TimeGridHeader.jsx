import React from 'react';
import { Button } from './ui/button';
import { useTimeSlotStore } from '@/stores/timeSlotStore.js';
import { useThemeStore } from '@/store/themeStore.js';

const TimeGridHeader = () => {
  const {
    selectedWeek,
    setSelectedWeek,
    getWeekDays,
  } = useTimeSlotStore();
  const { isDarkMode } = useThemeStore();

  const isSameDay = (a, b) => (
    a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );

  const weekDays = getWeekDays();

  const dayLabels = weekDays.map((date) => {
    const isSelected = isSameDay(date, selectedWeek);
    return (
      <button
        key={date.toISOString()}
        onClick={() => setSelectedWeek(date)}
        className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all border border-transparent hover:border-theme-border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-ring_outline focus:ring-offset-theme-background
          ${isSelected ? 'bg-theme-accent text-white' : 'text-theme-text-secondary hover:bg-theme-hover'}
        `}
        aria-pressed={isSelected}
      >
        {date.toLocaleDateString('pt-BR', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
        })}
      </button>
    );
  });

  return (
    <div
      className={`border border-theme-border rounded-lg shadow-sm p-4 ${isDarkMode ? 'bg-theme-card' : 'bg-[#DDDDDD]'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedWeek(prev => { const d = new Date(prev); d.setDate(d.getDate() - 1); return d; })}
          >
            ◀
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedWeek(prev => { const d = new Date(prev); d.setDate(d.getDate() + 1); return d; })}
          >
            ▶
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setSelectedWeek(new Date())}>
            Hoje
          </Button>
        </div>

        <div className="flex gap-2">
          {dayLabels}
        </div>
      </div>
    </div>
  );
};

export default TimeGridHeader;