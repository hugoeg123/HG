// Página de Perfil do Paciente — Conector: /auth/patient/me; integra com MainLayout e PatientSidebar
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import throttledApi, { patientInputService, profileService } from '../../services/api';
import { useTranslation } from 'react-i18next';

// UI Components
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import AgendaSummary from '../../components/patient/AgendaSummary';
import TagHistoryTimeline from '../../components/patient/TagHistoryTimeline';
import PatientAgenda from './components/PatientAgenda';
import ContactCard from '../../components/PatientProfile/ContactCard';
import IdentificationCard from '../../components/PatientProfile/IdentificationCard';
import AnthropometricsCard from '../../components/PatientProfile/AnthropometricsCard';
import VitalSignsCard from '../../components/PatientProfile/VitalSignsCard';
import LifestyleCard from '../../components/PatientProfile/LifestyleCard';
import AntecedentsCard from '../../components/PatientProfile/AntecedentsCard';
import { Activity, Calendar, User, FileText, Search, Save } from 'lucide-react';

const PatientProfile = () => {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();

  const [profileData, setProfileData] = useState(null);
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
    if (!token) {
      setLoading(false);
      setError(t('patientProfile.sessionUnauthenticated'));
      return;
    }
    let mounted = true;
    const fetchProfile = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch full profile data including anthropometrics, lifestyle, conditions
        const res = await profileService.getProfile(user.id);
        if (!mounted) return;
        setProfileData(res.data);
      } catch (err) {
        if (!mounted) return;
        console.error('Error fetching profile:', err);
        setError(err?.response?.data?.message || t('patientProfile.errorLoadingProfile'));
        // Fallback to basic user data if full profile fetch fails
        setProfileData({ patient: user });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => { mounted = false; };
  }, [user, navigate, token, t]);

  const handleHealthInputChange = (e) => {
    const { name, value } = e.target;
    setHealthInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveHealthInputs = async () => {
    try {
      // Connector: Envia dados para backend via patientInputService
      await patientInputService.create(healthInputs);
      setHealthInputs({ weight: '', height: '', notes: '' });
    } catch (err) {
      console.error('Falha ao salvar inputs de saúde:', err);
    }
  };

  const setTab = (tab) => setSearchParams((prev) => { const p = new URLSearchParams(prev); p.set('tab', tab); return p; });

  const patient = profileData?.patient || user;

  return (
    <div className="min-h-screen bg-gradient-to-br from-theme-background to-theme-card/30 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <Avatar className="h-20 w-20 mr-6 border-4 border-white dark:border-gray-800 shadow-lg">
            <AvatarFallback className="bg-gradient-to-br from-teal-400 to-blue-500 text-white text-2xl font-bold">
              {initialLetter}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {patient?.name || 'Paciente'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {t('patientProfile.activeProfile')}
            </p>
          </div>
        </div>

        {/* Estado de carregamento/erro */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        )}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-500 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Tabs navegáveis com sincronização de URL */}
        <Tabs value={activeTab} onValueChange={setTab} className="space-y-6">
          <TabsList className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md p-1 rounded-xl border border-gray-200 dark:border-gray-800 w-full md:w-auto inline-flex">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-teal-100 dark:data-[state=active]:bg-teal-900/30 data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-300 rounded-lg px-4 py-2">
              <Activity className="w-4 h-4 mr-2" />
              {t('patientProfile.dashboard')}
            </TabsTrigger>
            <TabsTrigger value="edit" className="data-[state=active]:bg-teal-100 dark:data-[state=active]:bg-teal-900/30 data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-300 rounded-lg px-4 py-2">
              <User className="w-4 h-4 mr-2" />
              {t('patientProfile.editProfile')}
            </TabsTrigger>
            <TabsTrigger value="agenda" className="data-[state=active]:bg-teal-100 dark:data-[state=active]:bg-teal-900/30 data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-300 rounded-lg px-4 py-2">
              <Calendar className="w-4 h-4 mr-2" />
              {t('patientProfile.agenda')}
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-teal-100 dark:data-[state=active]:bg-teal-900/30 data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-300 rounded-lg px-4 py-2">
              <FileText className="w-4 h-4 mr-2" />
              {t('patientProfile.history')}
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Resumo Rápido */}
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">{t('patientProfile.personalSummary')}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('patientProfile.name')}</label>
                  <Input value={patient?.name || ''} disabled className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('patientProfile.email')}</label>
                  <Input value={patient?.email || ''} disabled className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('patientProfile.phone')}</label>
                  <Input value={patient?.phone || ''} disabled className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700" />
                </div>
                <div className="md:col-span-3 pt-2">
                  <Button onClick={() => navigate('/marketplace')} className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20">
                    <Search className="w-4 h-4 mr-2" />
                    {t('patientProfile.findProfessionals')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <AgendaSummary patientId={patient?.id} />

            {/* Informações de Saúde */}
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">{t('patientProfile.quickHealthRecord')}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('patientProfile.weight')}</label>
                  <Input
                    name="weight"
                    value={healthInputs.weight}
                    onChange={handleHealthInputChange}
                    placeholder="Ex: 70.5"
                    className="focus:ring-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('patientProfile.height')}</label>
                  <Input
                    name="height"
                    value={healthInputs.height}
                    onChange={handleHealthInputChange}
                    placeholder="Ex: 175"
                    className="focus:ring-teal-500"
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('patientProfile.notesSymptoms')}</label>
                  <Textarea
                    name="notes"
                    value={healthInputs.notes}
                    onChange={handleHealthInputChange}
                    placeholder={t('patientProfile.describeFeeling')}
                    className="min-h-[100px] focus:ring-teal-500"
                  />
                </div>
                <div className="md:col-span-3 pt-2">
                  <Button onClick={handleSaveHealthInputs} variant="outline" className="border-teal-500 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20">
                    <Save className="w-4 h-4 mr-2" />
                    {t('patientProfile.saveRecord')}
                  </Button>
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* Editar Perfil */}
          <TabsContent value="edit">
            <div className="grid grid-cols-1 gap-6">
              <ContactCard patient={patient} />
              <IdentificationCard patient={patient} />
              <VitalSignsCard patient={patient} lastSnapshot={profileData?.vitalSigns} />
              <AnthropometricsCard data={profileData?.anthropometrics} />
              <LifestyleCard data={profileData?.lifestyle} />
              <AntecedentsCard patient={patient} conditions={profileData?.conditions} />
            </div>
          </TabsContent>

          {/* Agenda */}
          <TabsContent value="agenda">
            <PatientAgenda />
          </TabsContent>

          {/* Histórico */}
          <TabsContent value="history">
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">{t('patientProfile.healthHistory')}</CardTitle>
              </CardHeader>
              <CardContent>
                <TagHistoryTimeline patientId={patient?.id} tagKey="PESO" title={t('patientProfile.weightEvolution')} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PatientProfile;
