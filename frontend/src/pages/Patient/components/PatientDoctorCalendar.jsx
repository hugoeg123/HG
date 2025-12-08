import React, { useMemo } from 'react';

/**
 * PatientDoctorCalendar
 * 
 * Integrações:
 * - Utiliza classes de estilo de `agenda-styles.css` (reuso da agenda do profissional)
 * - Recebe `slots` do Marketplace e `myAppointments` do agendaService
 * 
 * Connector/Hook:
 * - Mostra contadores por dia (livres e meus agendamentos)
 * - Clique no dia chama `onSelectDate(date)` para filtrar grid abaixo
 */
const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const formatKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const buildMonthCells = (currentMonthDate) => {
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const cells = [];
  const offset = start.getDay();
  const prevMonthLast = new Date(year, month, 0);
  for (let i = offset - 1; i >= 0; i--) {
    const d = new Date(prevMonthLast.getFullYear(), prevMonthLast.getMonth(), prevMonthLast.getDate() - i);
    cells.push({ date: d, inMonth: false });
  }
  for (let day = 1; day <= end.getDate(); day++) {
    cells.push({ date: new Date(year, month, day), inMonth: true });
  }
  const trailing = 42 - cells.length;
  for (let i = 1; i <= trailing; i++) {
    cells.push({ date: new Date(year, month + 1, i), inMonth: false });
  }
  return cells;
};

const PatientDoctorCalendar = ({
  slots = [],
  myAppointments = [],
  currentMonth,
  selectedDate,
  onSelectDate,
}) => {
  const monthDate = currentMonth || new Date();

  const bookedByMeSlotIds = useMemo(() => {
    const set = new Set();
    for (const ap of myAppointments || []) {
      if (ap?.slot_id) set.add(ap.slot_id);
    }
    return set;
  }, [myAppointments]);

  const { dayMap, todayKey, selectedKey, cells } = useMemo(() => {
    const map = new Map();
    for (const s of slots) {
      const key = String(s.start_time || '').slice(0, 10);
      if (!key) continue;
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    }
    const cells = buildMonthCells(monthDate);
    const todayKey = formatKey(new Date());
    const selectedKey = selectedDate ? formatKey(selectedDate) : null;
    return { dayMap: map, todayKey, selectedKey, cells };
  }, [slots, monthDate, selectedDate]);

  const monthLabel = monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-theme-card border border-theme-border rounded-md">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="font-semibold">{monthLabel}</div>
        <div className="text-xs text-muted-foreground">Clique em um dia para filtrar</div>
      </div>

      <div className="px-4">
        <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground mb-2">
          {weekDays.map((wd) => (<div key={wd} className="py-2">{wd}</div>))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {cells.map(({ date, inMonth }, idx) => {
            const key = formatKey(date);
            const slotsOfDay = dayMap.get(key) || [];
            const availableCount = slotsOfDay.filter(s => s.status !== 'booked').length;
            const myBookedCount = slotsOfDay.filter(s => s.status === 'booked' && bookedByMeSlotIds.has(s.id)).length;
            const isToday = key === todayKey;
            const isSelected = key === selectedKey;
            return (
              <button
                key={idx}
                onClick={() => onSelectDate?.(date)}
                className={[
                  'calendar-day',
                  inMonth ? 'in-month' : 'out-month',
                  isSelected ? 'is-selected' : '',
                  isToday ? 'is-today' : ''
                ].join(' ')}
              >
                <div className="relative w-full h-full">
                  <span className="day-number">{date.getDate()}</span>
                  <div className="calendar-bars">
                    {myBookedCount > 0 && (
                      <div className="calendar-bar bar-scheduled">
                        {myBookedCount} {myBookedCount === 1 ? 'agendado' : 'agendados'}
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
      </div>
    </div>
  );
};

export default PatientDoctorCalendar;
// Connector: Calendário mensal da agenda do profissional visto pelo paciente
// Hook: Seleção de dia filtra o grid de horários inferior