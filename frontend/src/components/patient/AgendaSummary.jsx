/**
 * AgendaSummary Component
 *
 * Integrates with:
 * - services/agendaService.js for /agenda/appointments (patient scope)
 * - pages/Patient/Profile.jsx dashboard section
 *
 * Connector: Mostra próximos compromissos/eventos do paciente (agenda pessoal).
 */
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import agendaService from '../../services/agendaService';
import { useAuthStore } from '../../store/authStore';

const formatDateTime = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso || '';
  }
};

const AgendaSummary = ({ patientId, rangeDays = 30, limit = 5 }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const { isAuthenticated, token, user } = useAuthStore.getState();
    const isPatientRole = (user?.role || '').toLowerCase() === 'patient';
    if (!patientId || !isAuthenticated || !token || !isPatientRole) return;
    let mounted = true;
    const start = new Date().toISOString();
    const end = new Date(Date.now() + rangeDays * 86400000).toISOString();
    setLoading(true);
    setError(null);
    agendaService
      .getMyAppointments({ status: 'booked', start, end })
      .then((res) => {
        if (!mounted) return;
        const data = res?.data?.data || res?.data || [];
        setItems(Array.isArray(data) ? data.slice(0, limit) : []);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.response?.data?.message || 'Falha ao carregar agenda');
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [patientId, rangeDays, limit]);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Minha Agenda (próximos {rangeDays} dias)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <div className="text-sm">Carregando agenda...</div>}
        {error && <div className="text-sm text-red-500">{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className="text-sm">Nenhum compromisso nos próximos {rangeDays} dias.</div>
        )}
        {!loading && !error && items.length > 0 && (
          <ul className="space-y-2">
            {items.map((item) => {
              const start = item.start_time || item.start || item.date;
              const title = item.title || item.notes || 'Consulta';
              const who = item.doctor?.name || item.professional?.name || item.provider_name || '';
              return (
                <li key={item.id || start} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{title}{who ? ` • ${who}` : ''}</div>
                    <div className="text-muted-foreground">{formatDateTime(start)}</div>
                  </div>
                  <div>
                    <Button variant="outline" size="sm" onClick={() => (window.location.href = '/agenda')}>Detalhes</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="pt-3">
          <Button variant="default" onClick={() => (window.location.href = '/agenda')}>Ver agenda completa</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgendaSummary;