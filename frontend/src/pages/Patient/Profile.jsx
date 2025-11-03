// Página de Perfil do Paciente — Conector: /auth/patient/me; integra com MainLayout e PatientSidebar
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import throttledApi from '../../services/api';

// UI Components
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';

const PatientProfile = () => {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inputs simples de saúde (placeholder); em iteração futura integrar com TagDefinition e FHIR
  const [healthInputs, setHealthInputs] = useState({
    weight: '',
    height: '',
    notes: ''
  });

  const initialLetter = useMemo(() => (user?.name?.[0] || 'P').toUpperCase(), [user?.name]);
  const activeTab = searchParams.get('tab') || 'dashboard';

  useEffect(() => {
    // Redirecionar se a role não for paciente
    if (user && user.role && user.role !== 'patient') {
      navigate('/profile');
      return;
    }
    let mounted = true;
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        // Interceptors já adicionam Authorization se configurados
        const res = await throttledApi.get('/auth/patient/me');
        if (!mounted) return;
        setProfile(res.data?.user || res.data || user);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || 'Falha ao carregar perfil do paciente');
        setProfile(user || null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => { mounted = false; };
  }, [user, navigate]);

  const handleHealthInputChange = (e) => {
    const { name, value } = e.target;
    setHealthInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveHealthInputs = async () => {
    // Placeholder: salvar inputs de saúde
    // Connector: Enviar para backend (futuro) → records ou um endpoint dedicado
    console.log('Salvar inputs de saúde', healthInputs);
  };

  const setTab = (tab) => setSearchParams((prev) => { const p = new URLSearchParams(prev); p.set('tab', tab); return p; });

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center mb-4">
        <Avatar className="h-12 w-12 mr-3">
          <AvatarFallback>{initialLetter}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold">Perfil do Paciente</h1>
        </div>
      </div>

      {/* Estado de carregamento/erro */}
      {loading && (<Card className="mb-4"><CardContent>Carregando informações...</CardContent></Card>)}
      {error && (<Card className="mb-4"><CardContent className="text-red-500">{error}</CardContent></Card>)}

      {/* Tabs navegáveis com sincronização de URL */}
      <Tabs value={activeTab} onValueChange={setTab}>
        <TabsList aria-label="Selecione a seção">
          <TabsTrigger value="dashboard" title="Dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="edit" title="Editar Perfil">Editar Perfil</TabsTrigger>
          <TabsTrigger value="agenda" title="Agenda">Agenda</TabsTrigger>
          <TabsTrigger value="history" title="Histórico">Histórico</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard">
          {/* Resumo Rápido */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">Nome</label>
                <Input value={profile?.name || user?.name || ''} disabled />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">E-mail</label>
                <Input value={profile?.email || user?.email || ''} disabled />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Telefone</label>
                <Input value={profile?.phone || ''} disabled />
              </div>
              <div className="md:col-span-3 flex gap-2 pt-2">
                <Button onClick={() => navigate('/marketplace')} variant="default">Encontrar profissionais</Button>
                <Button onClick={() => navigate('/agenda')} variant="outline">Ver minha agenda</Button>
              </div>
            </CardContent>
          </Card>

          {/* Informações de Saúde */}
          <Card className="mb-4">
            <CardHeader><CardTitle>Informações de Saúde</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">Peso (kg)</label>
                <Input name="weight" value={healthInputs.weight} onChange={handleHealthInputChange} placeholder="#PESO: 70" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Altura (cm)</label>
                <Input name="height" value={healthInputs.height} onChange={handleHealthInputChange} placeholder="#ALTURA: 175" />
              </div>
              <div className="md:col-span-3">
                <label className="text-sm text-muted-foreground">Notas / sintomas</label>
                <Textarea name="notes" value={healthInputs.notes} onChange={handleHealthInputChange} placeholder="Descreva sintomas e hábitos (#TAG: valor)" />
              </div>
              <div className="md:col-span-3 flex gap-2 pt-2">
                <Button onClick={handleSaveHealthInputs} variant="default">Salvar</Button>
              </div>
            </CardContent>
          </Card>

          
        </TabsContent>

        {/* Editar Perfil */}
        <TabsContent value="edit">
          <Card>
            <CardHeader><CardTitle>Editar Perfil</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">Nome</label>
                <Input defaultValue={profile?.name || user?.name || ''} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">E-mail</label>
                <Input defaultValue={profile?.email || user?.email || ''} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Telefone</label>
                <Input defaultValue={profile?.phone || ''} />
              </div>
              <div className="md:col-span-3 flex gap-2 pt-2">
                <Button onClick={() => console.log('Salvar perfil')} variant="default">Salvar Alterações</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agenda */}
        <TabsContent value="agenda">
          <Card>
            <CardHeader><CardTitle>Minhas Consultas</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm">Em breve: integraremos suas consultas e horários aqui.</div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm">Em breve: registros de histórico e interações.</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientProfile;