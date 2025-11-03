import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { getPublicDoctors, getAvailableSlots } from '../../services/marketplaceService';
import { Stethoscope, MapPin, Video } from 'lucide-react';
import PatientTopNav from '../../components/Layout/PatientTopNav';

const modalityIcon = (modality) => {
  if (modality === 'telemedicina') return <Video className="w-4 h-4" />;
  if (modality === 'presencial') return <MapPin className="w-4 h-4" />;
  return <Stethoscope className="w-4 h-4" />;
};

const DoctorsList = () => {
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [professionalType, setProfessionalType] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState({});
  const [slotsByDoctor, setSlotsByDoctor] = useState({});

  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPublicDoctors({
        q: query || undefined,
        specialty: specialty || undefined,
        professional_type: professionalType || undefined,
        page,
        limit
      });
      setDoctors(data.data || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError('Não foi possível carregar médicos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, specialty, professionalType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDoctors();
  };

  const toggleSlots = async (medicoId) => {
    setExpanded((prev) => ({ ...prev, [medicoId]: !prev[medicoId] }));
    if (!slotsByDoctor[medicoId]) {
      try {
        const slots = await getAvailableSlots({ medico_id: medicoId });
        setSlotsByDoctor((prev) => ({ ...prev, [medicoId]: slots }));
      } catch (e) {
        // silently ignore for MVP
      }
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="min-h-screen bg-theme-background px-4 py-6">
      {/* Barra de navegação superior do paciente */}
      <PatientTopNav />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold text-theme-foreground mb-2">Marketplace de Médicos</h1>
        <p className="text-sm text-muted-foreground mb-6">Encontre profissionais e visualize horários disponíveis.</p>

        {/* Filtros */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou especialidade"
            className="md:col-span-2"
          />
          <Input
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="Especialidade (ex: cardiologia)"
          />
          <select
            value={professionalType}
            onChange={(e) => setProfessionalType(e.target.value)}
            className="border rounded px-3 py-2 bg-theme-card text-theme-foreground"
          >
            <option value="">Tipo Profissional</option>
            <option value="medico">Médico</option>
            <option value="enfermeiro">Enfermeiro(a)</option>
            <option value="fisioterapeuta">Fisioterapeuta</option>
            <option value="nutricionista">Nutricionista</option>
          </select>
          <Button type="submit" className="w-full md:w-auto">Buscar</Button>
        </form>

        {/* Lista */}
        {loading ? (
          <div className="text-center text-sm text-muted-foreground">Carregando...</div>
        ) : error ? (
          <div className="text-center text-sm text-red-500">{error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doc) => (
              <Card key={doc.id} className="bg-theme-card">
                <CardHeader className="flex flex-row items-center gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                    {doc.avatar_url ? (
                      <img src={doc.avatar_url} alt={doc.nome} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">{doc.nome?.[0] || 'M'}</div>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">{doc.nome}</CardTitle>
                    <CardDescription className="text-xs">{doc.specialty || 'Especialidade não informada'}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline">{doc.professional_type || 'profissional'}</Badge>
                    {doc.titulo_profissional && (
                      <Badge variant="secondary">{doc.titulo_profissional}</Badge>
                    )}
                  </div>

                  {doc.biografia && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{doc.biografia}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <Button variant="secondary" onClick={() => toggleSlots(doc.id)}>
                      {expanded[doc.id] ? 'Ocultar horários' : 'Ver horários'}
                    </Button>
                    {doc.curriculo_url && (
                      <a href={doc.curriculo_url} target="_blank" rel="noreferrer" className="text-xs text-teal-600">Ver currículo</a>
                    )}
                  </div>

                  {expanded[doc.id] && (
                    <div className="mt-3 space-y-2">
                      {(slotsByDoctor[doc.id] || []).length === 0 ? (
                        <div className="text-xs text-muted-foreground">Nenhum horário disponível.</div>
                      ) : (
                        (slotsByDoctor[doc.id] || []).slice(0, 5).map((slot) => (
                          <div key={slot.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{new Date(slot.start_time).toLocaleString()}</span>
                              <span>→ {new Date(slot.end_time).toLocaleTimeString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="flex items-center gap-1">
                                {modalityIcon(slot.modality)}
                                <span className="ml-1 capitalize">{slot.modality || 'n/a'}</span>
                              </Badge>
                              {slot.location && (
                                <Badge variant="secondary">{slot.location}</Badge>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</Button>
            <span className="text-sm">Página {page} de {totalPages}</span>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Próxima</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorsList;