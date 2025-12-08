import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoctorById } from '../../services/marketplaceService';

// UI Components
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import DoctorBio from './components/DoctorBio';
import DoctorReviews from './components/DoctorReviews';

/**
 * DoctorPublicProfile - Página de perfil público do profissional na interface do paciente
 * 
 * Integra com:
 * - services/marketplaceService.js → getDoctorById(id) para dados públicos
 * - App.jsx → rota protegida /patient/doctor/:id usando MainLayout (LeftSidebar padrão)
 * - Marketplace/DoctorsList.jsx → origem da navegação ao clicar no card
 * 
 * Segurança:
 * - Consome somente endpoint público do marketplace
 * - Não exibe dados sensíveis (apenas: nome, título, especialidade, biografia, avatar, currículo, formação, experiências)
 * 
 * Tema:
 * - Respeita classes bg-theme-*, text-theme-*, border-theme-* para dark/bright mode
 */
const DoctorPublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getDoctorById(id);
        if (mounted) setDoctor(data);
      } catch (e) {
        if (mounted) setError('Não foi possível carregar o perfil público do profissional.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // Normalizadores: convertem arrays de objetos ou strings em array de strings amigáveis
  const normalizeEducationItem = (item) => {
    if (!item) return null;
    if (typeof item === 'string') return item.trim();
    if (typeof item === 'object') {
      const curso = item.curso || item.titulo || '';
      const instituicao = item.instituicao || item.escola || '';
      const inicio = item.ano_inicio || item.inicio || '';
      const fim = item.ano_fim || item.fim || '';
      const periodo = inicio || fim ? ` (${inicio || '...'}–${fim || '...'})` : '';
      const desc = item.descricao ? ` — ${item.descricao}` : '';
      return [curso, instituicao].filter(Boolean).join(' • ') + periodo + desc;
    }
    try { return String(item); } catch { return null; }
  };

  const normalizeExperienceItem = (item) => {
    if (!item) return null;
    if (typeof item === 'string') return item.trim();
    if (typeof item === 'object') {
      const cargo = item.cargo || item.funcao || '';
      const empresa = item.empresa || item.org || '';
      const inicio = item.ano_inicio || item.inicio || '';
      const fim = item.atual ? 'Atual' : (item.ano_fim || item.fim || '...');
      const periodo = inicio || fim ? ` (${inicio || '...'}–${fim})` : '';
      const desc = item.descricao ? ` — ${item.descricao}` : '';
      return [cargo, empresa].filter(Boolean).join(' • ') + periodo + desc;
    }
    try { return String(item); } catch { return null; }
  };

  const toArrayOfStrings = (value, normalizer) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map(normalizer).filter(Boolean);
    }
    if (typeof value === 'string') {
      // Tentar JSON.parse primeiro; se falhar, dividir por linhas/pipe
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.map(normalizer).filter(Boolean);
        if (parsed && typeof parsed === 'object') return [normalizer(parsed)].filter(Boolean);
      } catch {}
      return value.split(/\r?\n|\|/).map(s => normalizer(s)).filter(Boolean);
    }
    if (typeof value === 'object') return [normalizer(value)].filter(Boolean);
    return [];
  };

  const formacao = useMemo(() => toArrayOfStrings(doctor?.formacao, normalizeEducationItem), [doctor]);
  const experiencias = useMemo(() => toArrayOfStrings(doctor?.experiencias, normalizeExperienceItem), [doctor]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-sm text-muted-foreground">Carregando perfil...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-sm text-red-500">{error}</div>
        <Button className="mt-3" variant="secondary" onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="p-6">
        <div className="text-sm text-muted-foreground">Perfil não encontrado.</div>
        <Button className="mt-3" variant="secondary" onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-theme-foreground">Perfil Público do Profissional</h1>
          <div className="flex items-center gap-2">
            <Button variant="primary" onClick={() => navigate(`/patient/doctor/${doctor.id}/agenda`)}>Ver horários</Button>
            {doctor.curriculo_url && (
              <a href={doctor.curriculo_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline text-sm">Baixar Currículo</a>
            )}
          </div>
        </div>

        {/* Card principal com dados públicos */}
        <Card className="bg-theme-card border border-theme-border">
          <CardHeader className="flex items-center gap-3 px-4 py-3">
            <Avatar className="w-20 h-20">
              {doctor.avatar_url ? (
                <img src={doctor.avatar_url} alt={doctor.nome} className="w-full h-full object-cover" />
              ) : (
                <AvatarFallback>{(doctor.nome || 'M')?.[0]}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col justify-center">
              <CardTitle className="text-xl">{doctor.nome}</CardTitle>
              <div className="text-sm text-muted-foreground">
                {[doctor.titulo_profissional, doctor.specialty, doctor.professional_type].filter(Boolean).join(' • ')}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DoctorBio doctor={doctor} />
            <div className="mt-6">
              <DoctorReviews doctorId={doctor.id} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorPublicProfile;

// Connector: Página usada apenas em /patient/doctor/:id, respeitando separação paciente/médico e privacidade