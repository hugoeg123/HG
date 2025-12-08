import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuthStore } from '../../store/authStore';
import { getDoctorById, getAvailableSlots } from '../../services/marketplaceService';
import agendaService from '../../services/agendaService';
import PatientDoctorCalendar from './components/PatientDoctorCalendar';
import PatientDoctorTimeGrid from './components/PatientDoctorTimeGrid';

/**
 * AgendaPacienteMedico
 * 
 * Integrações:
 * - services/marketplaceService.js → getDoctorById, getAvailableSlots
 * - services/agendaService.js → createAppointment
 * - App.jsx → rota protegida: /patient/doctor/:id/agenda
 * - store/authStore.js → obtém paciente autenticado (user.id)
 * 
 * Connector/Hook:
 * - Carrega slots públicos do médico e permite agendamento pelo paciente
 * - Feedback de sucesso/erro via estados locais (propaga via API response → RightPane)
 */
const AgendaPacienteMedico = () => {
  const { id } = useParams(); // medico_id
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [start, setStart] = useState(() => new Date().toISOString());
  const [end, setEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString();
  });
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [doc, list] = await Promise.all([
          getDoctorById(id),
          getAvailableSlots({ medico_id: id, start, end })
        ]);
        if (!mounted) return;
        setDoctor(doc);
        setSlots(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!mounted) return;
        setError('Falha ao carregar horários disponíveis do profissional.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, start, end]);

  // Carregar meus agendamentos do paciente autenticado, no mesmo intervalo
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.id) return;
      try {
        const list = await agendaService.getMyAppointments({ start, end, status: 'booked' });
        if (!mounted) return;
        const items = Array.isArray(list?.data) ? list.data : Array.isArray(list) ? list : [];
        setMyAppointments(items);
      } catch (e) {
        // silencioso para não atrapalhar UX; agenda mensal ainda funciona sem isso
      }
    })();
    return () => { mounted = false; };
  }, [user?.id, start, end]);

  const bookedByMeSlotIds = useMemo(() => {
    const set = new Set();
    for (const ap of myAppointments) {
      if (ap?.slot_id) set.add(ap.slot_id);
    }
    return set;
  }, [myAppointments]);

  const handleBook = async (slot) => {
    setError('');
    setSuccess('');
    if (!user?.id) {
      setError('É necessário estar autenticado como paciente para agendar.');
      return;
    }
    try {
      await agendaService.createAppointment({ slot_id: slot.id, patient_id: user.id });
      setSuccess('Agendamento confirmado! Você pode consultar em "Minha agenda".');
      // marca slot localmente para feedback imediato
      setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, status: 'booked' } : s));
    } catch (e) {
      // Log detalhado para diagnóstico sem alterar UX do paciente
      const status = e?.response?.status;
      const backendMessage = e?.response?.data?.message || e?.message || '';
      console.warn('Falha ao agendar horário', { status, backendMessage, slotId: slot?.id });
      setError('Não foi possível confirmar este horário. Tente novamente.');
    }
  };

  const Header = () => (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-semibold text-theme-foreground">Agenda de {doctor?.nome || 'Profissional'}</h1>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        <Header />

        <Card className="bg-theme-card border border-theme-border">
          <CardHeader>
            <CardTitle className="text-base">Filtrar período</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Início</label>
                <Input type="datetime-local" value={start.slice(0,16)} onChange={(e) => {
                  const iso = new Date(e.target.value).toISOString();
                  setStart(iso);
                }} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Fim</label>
                <Input type="datetime-local" value={end.slice(0,16)} onChange={(e) => {
                  const iso = new Date(e.target.value).toISOString();
                  setEnd(iso);
                }} />
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Mostrando horários dentro do período selecionado.</div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando horários...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (
          <div className="space-y-6">
            <PatientDoctorCalendar
              slots={slots}
              myAppointments={myAppointments}
              currentMonth={selectedDate || new Date()}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
            <PatientDoctorTimeGrid
              slots={slots}
              bookedByMeSlotIds={bookedByMeSlotIds}
              selectedDate={selectedDate}
              onBook={handleBook}
            />
          </div>
        )}

        {success && (
          <div className="text-sm text-green-600">{success}</div>
        )}
      </div>
    </div>
  );
};

export default AgendaPacienteMedico;

// Connector: Página de agenda do médico na interface do paciente
// Hook: Navegada a partir de Patient/DoctorPublicProfile.jsx via botão "Ver horários"