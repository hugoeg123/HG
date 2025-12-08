import React, { useMemo } from 'react';
import { Button } from '../../../components/ui/button';

/**
 * PatientDoctorTimeGrid
 * 
 * Integrações:
 * - Recebe `slots` do Marketplace e `bookedByMeSlotIds` de `getMyAppointments`
 * - Exibe apenas slots disponíveis e os meus agendados
 * - `onBook(slot)` agenda consulta via `agendaService.createAppointment`
 * 
 * Conectores:
 * - Usado dentro de AgendaPacienteMedico.jsx
 */
const groupByDate = (slots) => {
  const map = new Map();
  for (const s of slots) {
    const key = String(s.start_time || '').slice(0, 10);
    if (!key) continue;
    const arr = map.get(key) || [];
    arr.push(s);
    map.set(key, arr);
  }
  return map;
};

const formatHour = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

const PatientDoctorTimeGrid = ({ slots = [], bookedByMeSlotIds = new Set(), selectedDate, onBook }) => {
  const filtered = useMemo(() => {
    // Mostrar apenas slots disponíveis e os já agendados pelo próprio paciente
    // Observação: /marketplace/slots retorna apenas slots disponíveis e não inclui "status"
    // Para compatibilidade, consideramos status ausente como "available".
    let base = slots.filter(s => {
      if (!s) return false;
      const isAvailable = !s.status || s.status === 'available';
      const isMyBooked = s.status === 'booked' && bookedByMeSlotIds.has(s.id);
      return isAvailable || isMyBooked;
    });
    if (selectedDate) {
      const key = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
      base = base.filter(s => String(s.start_time || '').startsWith(key));
    }
    return base.sort((a,b) => String(a.start_time).localeCompare(String(b.start_time)));
  }, [slots, bookedByMeSlotIds, selectedDate]);

  const byDate = useMemo(() => groupByDate(filtered), [filtered]);
  const dateKeys = Array.from(byDate.keys()).sort();

  if (filtered.length === 0) {
    return (
      <div className="text-sm text-muted-foreground px-2 py-4">Nenhum horário disponível neste período.</div>
    );
  }

  return (
    <div className="space-y-6">
      {dateKeys.map((day) => {
        const items = byDate.get(day) || [];
        return (
          <div key={day} className="border border-theme-border rounded-md">
            <div className="px-3 py-2 bg-theme-subtle text-sm font-medium">{new Date(day).toLocaleDateString('pt-BR')}</div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-3">
              {items.map((slot) => {
                const isMine = slot.status === 'booked' && bookedByMeSlotIds.has(slot.id);
                return (
                  <div key={slot.id} className="p-3 border rounded-md flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{formatHour(slot.start_time)} — {formatHour(slot.end_time)}</div>
                      <div className="text-xs text-muted-foreground">{slot.modality || 'Consulta'}</div>
                    </div>
                    {isMine ? (
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">Seu agendamento</span>
                    ) : (
                      // Só exibe botão para slots realmente disponíveis
                      <Button variant="primary" size="sm" onClick={() => onBook?.(slot)}>Agendar</Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PatientDoctorTimeGrid;
// Connector: Grid de horários filtrado, apenas disponíveis e meus agendamentos
// Hook: Clique em “Agendar” delega criação ao serviço de agenda
/**
 * PatientDoctorTimeGrid
 *
 * Integrações:
 * - services/marketplaceService.js → getAvailableSlots (slots públicos, sem campo status)
 * - services/agendaService.js → createAppointment (agendamento do paciente)
 * - pages/Patient/AgendaPacienteMedico.jsx → fornece slots e selectedDate
 *
 * Conector: Trata ausência de `status` nos slots do marketplace como "available".
 */