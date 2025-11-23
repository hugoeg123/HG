import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import agendaService from '../../../services/agendaService';
import { useAuthStore } from '../../../store/authStore';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
/** PatientAgenda
 * Integrates: agendaService.getMyAppointments; Profile.jsx aba "agenda"; agenda-styles.css
 * Connector: Carrega agendamentos do mês; clique no dia filtra lista diária */

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

const PatientAgenda = () => {
  const [monthDate, setMonthDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Buscar agendamentos para o mês visível
  useEffect(() => {
    const { isAuthenticated, token, user } = useAuthStore.getState();
    const isPatientRole = (user?.role || '').toLowerCase() === 'patient';
    if (!isAuthenticated || !token || !isPatientRole) return;
    let mounted = true;
    const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).toISOString();
    const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1).toISOString();
    setLoading(true);
    setError('');
    agendaService
      .getMyAppointments({ status: 'booked', start, end })
      .then((res) => {
        if (!mounted) return;
        const data = res?.data?.data || res?.data || [];
        setAppointments(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.response?.data?.message || 'Falha ao carregar meus agendamentos');
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [monthDate]);

  const { cells, todayKey, selectedKey, dayMap } = useMemo(() => {
    const map = new Map();
    for (const ap of appointments) {
      const slot = ap.slot || {};
      const key = String(slot.start_time || ap.start_time || ap.start || '').slice(0, 10);
      if (!key) continue;
      const arr = map.get(key) || [];
      arr.push(ap);
      map.set(key, arr);
    }
    return {
      cells: buildMonthCells(monthDate),
      todayKey: formatKey(new Date()),
      selectedKey: selectedDate ? formatKey(selectedDate) : null,
      dayMap: map,
    };
  }, [appointments, monthDate, selectedDate]);

  const monthLabel = monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const gotoPrevMonth = () => setMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const gotoNextMonth = () => setMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const selectedItems = useMemo(() => {
    const key = selectedKey;
    return key ? (dayMap.get(key) || []) : [];
  }, [dayMap, selectedKey]);

  return (
    <div className="space-y-4">
      <Card className="bg-theme-card border border-theme-border">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            <span>{monthLabel}</span>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" aria-label="Mês anterior" onClick={gotoPrevMonth} className="h-8 w-8 p-0 rounded">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" aria-label="Próximo mês" onClick={gotoNextMonth} className="h-8 w-8 p-0 rounded">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && (<div className="text-sm">Carregando minha agenda...</div>)}
          {error && (<div className="text-sm text-red-500">{error}</div>)}
          <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground mb-2">
            {weekDays.map((wd) => (<div key={wd} className="py-2">{wd}</div>))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {cells.map(({ date, inMonth }, idx) => {
              const key = formatKey(date);
              const items = dayMap.get(key) || [];
              const myBookedCount = items.length;
              const isToday = key === todayKey;
              const isSelected = key === selectedKey;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(date)}
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
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-theme-card border border-theme-border">
        <CardHeader>
          <CardTitle>Compromissos do dia selecionado</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedItems.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum compromisso para o dia selecionado.</div>
          ) : (
            <ul className="space-y-2">
              {selectedItems.map((ap) => {
                const slot = ap.slot || {};
                const start = slot.start_time || ap.start_time || ap.start;
                const d = start ? new Date(start) : null;
                const hour = d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                const who = slot.medico?.nome || ap.doctor?.name || '';
                const title = ap.title || ap.notes || 'Consulta';
                return (
                  <li key={ap.id} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{title}{who ? ` • ${who}` : ''}</div>
                      <div className="text-muted-foreground">{hour}</div>
                    </div>
                    <div>
                      <Button variant="outline" size="sm" onClick={() => (window.location.href = '/marketplace')}>Detalhes</Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default PatientAgenda;