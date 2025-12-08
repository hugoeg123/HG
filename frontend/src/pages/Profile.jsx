/**
 * Página de Perfil Profissional
 * 
 * Permite visualização e edição do perfil médico com upload de arquivos
 * 
 * Conector: Integra com services/api.js para chamadas de API
 * IA prompt: Expandir para incluir certificações e publicações
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useNavigate } from 'react-router-dom';
import throttledApi from "../services/api";

// Componentes UI
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Checkbox } from '../components/ui/checkbox';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';

// Ícones
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  FileText,
  Camera,
  Upload,
  Save,
  X,
  Plus,
  Trash2,
  Eye,
  Edit3,
  Download,
  Calendar,
  CheckCircle,
  Globe
} from 'lucide-react';

/**
 * Perfil vazio para inicialização
 */
const emptyProfile = {
  nome: '',
  email: '',
  titulo_profissional: '',
  specialty: '',
  biografia: '',
  avatar_url: '',
  curriculo_url: '',
  public_visibility: false,
  formacao: [],
  experiencias: []
};

/**
 * Entrada vazia para formação acadêmica
 */
const emptyFormacao = {
  instituicao: '',
  curso: '',
  ano_inicio: '',
  ano_fim: '',
  descricao: ''
};

/**
 * Entrada vazia para experiência profissional
 */
const emptyExperiencia = {
  empresa: '',
  cargo: '',
  ano_inicio: '',
  ano_fim: '',
  descricao: '',
  atual: false
};

/**
 * Componente de Card Público
 */
const PublicCard = React.memo(({ profile }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800">
        {/* Banner / Header Background */}
        <div className="h-32 bg-gradient-to-r from-teal-500 to-blue-600 relative">
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="flex items-end">
              <Avatar className="w-32 h-32 border-4 border-white dark:border-gray-900 shadow-lg">
                <AvatarImage src={profile.avatar_url} alt={profile.nome} className="object-cover" />
                <AvatarFallback className="text-3xl bg-gray-200 dark:bg-gray-800">
                  {profile.nome?.split(' ').map(n => n[0]).join('').toUpperCase() || 'MD'}
                </AvatarFallback>
              </Avatar>
              <div className="ml-4 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{profile.nome || 'Nome não informado'}</h1>
                <p className="text-lg text-teal-600 dark:text-teal-400 font-medium">{profile.titulo_profissional}</p>
              </div>
            </div>
            <div className="flex gap-3 mb-2">
              <Button
                onClick={() => navigate('/agenda')}
                className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20"
              >
                <Calendar className="w-4 h-4 mr-2" />
                {t('profile.schedule')}
              </Button>
              {profile.curriculo_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(profile.curriculo_url, '_blank')}
                  className="border-gray-300 dark:border-gray-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t('profile.downloadCurriculum')}
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Sobre */}
              {profile.biografia && (
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-900 dark:text-white">
                    <User className="w-5 h-5 mr-2 text-teal-500" />
                    {t('profile.about')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {profile.biografia}
                  </p>
                </section>
              )}

              {/* Experiência */}
              {profile.experiencias && profile.experiencias.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
                    <Briefcase className="w-5 h-5 mr-2 text-teal-500" />
                    {t('profile.experience')}
                  </h3>
                  <div className="space-y-6">
                    {profile.experiencias.map((item, index) => (
                      <div key={index} className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 last:border-0">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-teal-500 border-4 border-white dark:border-gray-900"></div>
                        <div className="mb-1">
                          <h4 className="text-base font-semibold text-gray-900 dark:text-white">{item.cargo}</h4>
                          <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">{item.empresa}</p>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          {item.ano_inicio} - {item.atual ? t('profile.current') : item.ano_fim}
                        </p>
                        {item.descricao && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.descricao}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Specialties */}
              {profile.specialty && (
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">{t('profile.specialty')}</h3>
                  <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 dark:bg-teal-900/30 dark:text-teal-300 border-0 px-3 py-1 text-sm">
                    {profile.specialty}
                  </Badge>
                </section>
              )}

              {/* Education */}
              {profile.formacao && profile.formacao.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
                    <GraduationCap className="w-5 h-5 mr-2 text-teal-500" />
                    {t('profile.education')}
                  </h3>
                  <div className="space-y-4">
                    {profile.formacao.map((item, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                        <h4 className="font-medium text-gray-900 dark:text-white">{item.curso}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.instituicao}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {item.ano_inicio} - {item.ano_fim || t('profile.current')}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

PublicCard.displayName = 'PublicCard';

/**
 * Componente Principal - Página de Perfil
 */
const Profile = () => {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  // Estados do componente
  const [profile, setProfile] = useState(emptyProfile);
  const [editProfile, setEditProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('public');
  const [avatarFile, setAvatarFile] = useState(null);
  const [curriculoFile, setCurriculoFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const hasLoadedRef = useRef(false);
  const avatarPreviewUrlRef = useRef(null);

  // Limpeza de objectURL ao desmontar
  useEffect(() => {
    return () => {
      if (avatarPreviewUrlRef.current) {
        URL.revokeObjectURL(avatarPreviewUrlRef.current);
        avatarPreviewUrlRef.current = null;
      }
    };
  }, []);

  const mapApiDataToProfile = useCallback((apiData) => {
    return {
      nome: apiData.nome || '',
      email: apiData.email || '',
      titulo_profissional: apiData.titulo_profissional || '',
      specialty: apiData.specialty || '',
      biografia: apiData.biografia || '',
      avatar_url: apiData.avatar_url || '',
      curriculo_url: apiData.curriculo_url || '',
      public_visibility: apiData.public_visibility !== undefined ? !!apiData.public_visibility : false,
      formacao: apiData.formacao || [],
      experiencias: apiData.experiencias || []
    };
  }, []);

  const loadProfile = useCallback((abortSignal) => {
    setLoading(true);
    const LOAD_TIMEOUT_MS = 6000;
    let timeoutId;
    let fallbackApplied = false;

    const requestPromise = throttledApi.get('/auth/profile', { signal: abortSignal });

    const applyFallback = () => {
      if (fallbackApplied) return;
      fallbackApplied = true;
      console.warn('Perfil: timeout ao carregar, aplicando fallback local');
      toast.warning('Servidor lento. Exibindo perfil local temporariamente.');
      if (user) {
        const fallbackProfile = mapApiDataToProfile(user);
        setProfile(fallbackProfile);
        setEditProfile(fallbackProfile);
      }
      setLoading(false);
    };

    timeoutId = setTimeout(applyFallback, LOAD_TIMEOUT_MS);

    requestPromise
      .then((response) => {
        clearTimeout(timeoutId);
        const profileData = mapApiDataToProfile(response.data);
        setProfile(profileData);
        setEditProfile(profileData);
        if (!fallbackApplied) {
          setLoading(false);
        } else {
          console.log('Perfil: dados da API chegaram após fallback; atualizando silenciosamente');
        }
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        console.error('Erro ao carregar perfil:', error);
        if (!fallbackApplied) {
          toast.error('Erro ao carregar perfil');
          if (user) {
            const fallbackProfile = mapApiDataToProfile(user);
            setProfile(fallbackProfile);
            setEditProfile(fallbackProfile);
          }
          setLoading(false);
        }
      });

    return requestPromise;
  }, [user, mapApiDataToProfile]);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    const controller = new AbortController();
    loadProfile(controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadProfile]);

  const handleInputChange = useCallback((field, value) => {
    setEditProfile(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const compressImage = useCallback((file, maxSize = 1024, quality = 0.85) => {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const maxDim = Math.max(width, height);
          if (maxDim > maxSize) {
            const scale = maxSize / maxDim;
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob && blob.size < file.size) {
              const compressed = new File([blob], file.name.replace(/\.(jpe?g|png|webp)$/i, '.jpg'), { type: 'image/jpeg' });
              resolve(compressed);
            } else {
              resolve(file);
            }
          }, 'image/jpeg', quality);
        };
        img.onerror = () => resolve(file);
        img.src = URL.createObjectURL(file);
      } catch (e) {
        resolve(file);
      }
    });
  }, []);

  const handleAvatarChange = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de arquivo inválido. Use JPEG, PNG ou WebP.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 5MB.');
        return;
      }

      compressImage(file).then((optimized) => {
        setAvatarFile(optimized);
        if (avatarPreviewUrlRef.current) {
          URL.revokeObjectURL(avatarPreviewUrlRef.current);
          avatarPreviewUrlRef.current = null;
        }
        const objectUrl = URL.createObjectURL(optimized);
        avatarPreviewUrlRef.current = objectUrl;
        setAvatarPreview(objectUrl);
      });
    }
  }, [compressImage]);

  const handleCurriculoChange = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de arquivo inválido. Use PDF, DOC ou DOCX.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 5MB.');
        return;
      }

      setCurriculoFile(file);
    }
  }, []);

  const uploadFiles = useCallback(async () => {
    if (!avatarFile && !curriculoFile) {
      return {};
    }

    const formData = new FormData();
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }
    if (curriculoFile) {
      formData.append('curriculo', curriculoFile);
    }

    try {
      const response = await throttledApi.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = response?.data || {};
      const filesObj = data.files || data;
      return {
        ...(filesObj.avatar_url ? { avatar_url: filesObj.avatar_url } : {}),
        ...(filesObj.curriculo_url ? { curriculo_url: filesObj.curriculo_url } : {}),
        ...(filesObj.avatar && typeof filesObj.avatar === 'string' ? { avatar_url: filesObj.avatar } : {}),
        ...(filesObj.curriculo && typeof filesObj.curriculo === 'string' ? { curriculo_url: filesObj.curriculo } : {}),
      };
    } catch (error) {
      console.error('Erro no upload:', error);
      return {};
    }
  }, [avatarFile, curriculoFile]);

  const validarDadosPerfil = useCallback((data) => {
    const erros = [];
    if (data.nome && data.nome.length < 2) erros.push('Nome deve ter pelo menos 2 caracteres');
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) erros.push('Email inválido');
    if (data.titulo_profissional && data.titulo_profissional.length > 100) erros.push('Título profissional muito longo (máximo 100 caracteres)');
    if (data.biografia && data.biografia.length > 1000) erros.push('Biografia muito longa (máximo 1000 caracteres)');
    return erros;
  }, []);

  const cleanText = useCallback((v) => {
    if (typeof v !== 'string') return '';
    const t = v.trim();
    const hasAlphaNum = /[A-Za-zÀ-ÖØ-öø-ÿ0-9]/.test(t);
    return hasAlphaNum ? t : '';
  }, []);

  const toYearOrNull = useCallback((v) => {
    const n = parseInt(String(v ?? '').trim(), 10);
    if (Number.isNaN(n)) return null;
    const maxYear = new Date().getFullYear() + 1;
    if (n < 1950 || n > maxYear) return null;
    return n;
  }, []);

  const sanitizeFormacao = useCallback((arr) => {
    if (!Array.isArray(arr)) return [];
    return arr
      .map((item) => {
        const obj = {
          instituicao: cleanText(item?.instituicao),
          curso: cleanText(item?.curso),
          ano_inicio: toYearOrNull(item?.ano_inicio),
          ano_fim: toYearOrNull(item?.ano_fim),
          descricao: cleanText(item?.descricao)
        };
        const meaningful = !!(obj.instituicao || obj.curso || obj.descricao || obj.ano_inicio || obj.ano_fim);
        return meaningful ? obj : null;
      })
      .filter(Boolean);
  }, [cleanText, toYearOrNull]);

  const sanitizeExperiencias = useCallback((arr) => {
    if (!Array.isArray(arr)) return [];
    return arr
      .map((item) => {
        const atual = !!item?.atual;
        const obj = {
          empresa: cleanText(item?.empresa),
          cargo: cleanText(item?.cargo),
          ano_inicio: toYearOrNull(item?.ano_inicio),
          ano_fim: atual ? null : toYearOrNull(item?.ano_fim),
          descricao: cleanText(item?.descricao),
          atual
        };
        const meaningful = !!(obj.empresa || obj.cargo || obj.descricao || obj.ano_inicio || obj.ano_fim);
        return meaningful ? obj : null;
      })
      .filter(Boolean);
  }, [cleanText, toYearOrNull]);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      const uploadedFiles = await uploadFiles();
      const updateData = { ...editProfile, ...uploadedFiles };

      updateData.formacao = sanitizeFormacao(updateData.formacao);
      updateData.experiencias = sanitizeExperiencias(updateData.experiencias);

      ['avatar_url', 'curriculo_url'].forEach((field) => {
        if (updateData[field] === '' || updateData[field] === null || updateData[field] === undefined) {
          delete updateData[field];
        }
      });

      const errosValidacao = validarDadosPerfil(updateData);
      if (errosValidacao.length > 0) {
        toast.error(errosValidacao[0]);
        return;
      }

      const response = await throttledApi.put('/auth/profile', updateData);
      const updatedProfile = mapApiDataToProfile(response.data);

      setProfile(updatedProfile);
      setEditProfile(updatedProfile);
      setAvatarFile(null);
      setCurriculoFile(null);
      setAvatarPreview(null);

      toast.success(t('profile.success'));
      setActiveTab('public');

    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast.error(t('profile.error'));
    } finally {
      setSaving(false);
    }
  }, [editProfile, uploadFiles, mapApiDataToProfile, validarDadosPerfil, sanitizeFormacao, sanitizeExperiencias]);

  const handleCancel = useCallback(() => {
    setEditProfile(profile);
    setAvatarFile(null);
    setCurriculoFile(null);
    setAvatarPreview(null);
    setActiveTab('public');
  }, [profile]);

  const addFormacao = useCallback(() => {
    setEditProfile(prev => ({
      ...prev,
      formacao: [...prev.formacao, { ...emptyFormacao }]
    }));
  }, []);

  const removeFormacao = useCallback((index) => {
    setEditProfile(prev => ({
      ...prev,
      formacao: prev.formacao.filter((_, i) => i !== index)
    }));
  }, []);

  const updateFormacao = useCallback((index, field, value) => {
    setEditProfile(prev => ({
      ...prev,
      formacao: prev.formacao.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  }, []);

  const addExperiencia = useCallback(() => {
    setEditProfile(prev => ({
      ...prev,
      experiencias: [...prev.experiencias, { ...emptyExperiencia }]
    }));
  }, []);

  const removeExperiencia = useCallback((index) => {
    setEditProfile(prev => ({
      ...prev,
      experiencias: prev.experiencias.filter((_, i) => i !== index)
    }));
  }, []);

  const updateExperiencia = useCallback((index, field, value) => {
    setEditProfile(prev => ({
      ...prev,
      experiencias: prev.experiencias.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-theme-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-theme-background to-theme-card/30 px-4 py-8">
      <div className="max-w-5xl mx-auto">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md p-1 rounded-full border border-gray-200 dark:border-gray-800">
              <TabsTrigger value="public" className="rounded-full px-6 py-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all">
                <Eye className="w-4 h-4 mr-2" />
                {t('profile.publicView')}
              </TabsTrigger>
              <TabsTrigger value="edit" className="rounded-full px-6 py-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all">
                <Edit3 className="w-4 h-4 mr-2" />
                {t('profile.editProfile')}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="public" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!profile.public_visibility && (
              <div className="max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 text-yellow-800 dark:text-yellow-200 flex items-center justify-center gap-2">
                <Globe className="w-4 h-4" />
                <span>{t('profile.privateWarning')}</span>
              </div>
            )}
            <PublicCard profile={profile} />
          </TabsContent>

          <TabsContent value="edit" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Sidebar - Basic Info & Avatar */}
              <div className="space-y-6">
                <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">{t('profile.profilePhoto')}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <div className="relative group cursor-pointer mb-4">
                      <Avatar className="w-32 h-32 border-4 border-white dark:border-gray-800 shadow-lg group-hover:opacity-90 transition-opacity">
                        <AvatarImage src={avatarPreview || editProfile.avatar_url} />
                        <AvatarFallback className="text-3xl">
                          {editProfile.nome?.split(' ').map(n => n[0]).join('').toUpperCase() || 'MD'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/50 rounded-full p-2 text-white">
                          <Camera className="w-6 h-6" />
                        </div>
                      </div>
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleAvatarChange}
                        accept="image/*"
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      {t('profile.clickToChange')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">{t('profile.visibility')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <Checkbox
                        id="visibility"
                        checked={editProfile.public_visibility}
                        onCheckedChange={(checked) => handleInputChange('public_visibility', checked)}
                      />
                      <label htmlFor="visibility" className="text-sm font-medium cursor-pointer select-none">
                        {t('profile.publicProfile')}
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 ml-1">
                      {t('profile.visibilityHint')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">{t('profile.curriculum')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative">
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {curriculoFile ? curriculoFile.name : t('profile.uploadCurriculum')}
                      </p>
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleCurriculoChange}
                        accept=".pdf,.doc,.docx"
                      />
                    </div>
                    {editProfile.curriculo_url && !curriculoFile && (
                      <div className="flex items-center gap-2 mt-3 text-sm text-teal-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>{t('profile.curriculumSaved')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-gray-200 dark:border-gray-800 shadow-sm mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">{t('common.language')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant={i18n.language === 'pt-BR' ? 'default' : 'outline'}
                        onClick={() => changeLanguage('pt-BR')}
                        className={i18n.language === 'pt-BR' ? 'bg-teal-600 hover:bg-teal-700' : ''}
                      >
                        Português
                      </Button>
                      <Button
                        variant={i18n.language === 'en' ? 'default' : 'outline'}
                        onClick={() => changeLanguage('en')}
                        className={i18n.language === 'en' ? 'bg-teal-600 hover:bg-teal-700' : ''}
                      >
                        English
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content - Forms */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                  <CardHeader>
                    <CardTitle>{t('profile.basicInfo')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('profile.name')}</label>
                        <Input
                          value={editProfile.nome}
                          onChange={(e) => handleInputChange('nome', e.target.value)}
                          placeholder="Dr. João Silva"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('profile.email')}</label>
                        <Input
                          value={editProfile.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="joao@exemplo.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('profile.professionalTitle')}</label>
                        <Input
                          value={editProfile.titulo_profissional}
                          onChange={(e) => handleInputChange('titulo_profissional', e.target.value)}
                          placeholder="Ex: Cardiologista Intervencionista"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('profile.specialty')}</label>
                        <Input
                          value={editProfile.specialty}
                          onChange={(e) => handleInputChange('specialty', e.target.value)}
                          placeholder="Ex: Cardiologia"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('profile.bio')}</label>
                      <Textarea
                        value={editProfile.biografia}
                        onChange={(e) => handleInputChange('biografia', e.target.value)}
                        placeholder={t('profile.bioPlaceholder')}
                        className="min-h-[120px]"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t('profile.education')}</CardTitle>
                    <Button variant="outline" size="sm" onClick={addFormacao}>
                      <Plus className="w-4 h-4 mr-2" /> {t('profile.add')}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {editProfile.formacao.map((item, index) => (
                      <div key={index} className="relative p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg group">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => removeFormacao(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-500">{t('profile.course')}</label>
                            <Input
                              value={item.curso}
                              onChange={(e) => updateFormacao(index, 'curso', e.target.value)}
                              placeholder="Ex: Medicina"
                              className="bg-white dark:bg-gray-900"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-500">{t('profile.institution')}</label>
                            <Input
                              value={item.instituicao}
                              onChange={(e) => updateFormacao(index, 'instituicao', e.target.value)}
                              placeholder="Ex: USP"
                              className="bg-white dark:bg-gray-900"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-500">{t('profile.startYear')}</label>
                            <Input
                              type="number"
                              value={item.ano_inicio || ''}
                              onChange={(e) => updateFormacao(index, 'ano_inicio', e.target.value)}
                              placeholder="2015"
                              className="bg-white dark:bg-gray-900"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-500">{t('profile.endYear')}</label>
                            <Input
                              type="number"
                              value={item.ano_fim || ''}
                              onChange={(e) => updateFormacao(index, 'ano_fim', e.target.value)}
                              placeholder="2021"
                              className="bg-white dark:bg-gray-900"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {editProfile.formacao.length === 0 && (
                      <div className="text-center py-6 text-gray-500 text-sm italic">
                        Nenhuma formação adicionada.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t('profile.experience')}</CardTitle>
                    <Button variant="outline" size="sm" onClick={addExperiencia}>
                      <Plus className="w-4 h-4 mr-2" /> {t('profile.add')}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {editProfile.experiencias.map((item, index) => (
                      <div key={index} className="relative p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg group">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => removeExperiencia(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-500">{t('profile.position')}</label>
                            <Input
                              value={item.cargo}
                              onChange={(e) => updateExperiencia(index, 'cargo', e.target.value)}
                              placeholder="Ex: Médico Residente"
                              className="bg-white dark:bg-gray-900"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-500">{t('profile.company')}</label>
                            <Input
                              value={item.empresa}
                              onChange={(e) => updateExperiencia(index, 'empresa', e.target.value)}
                              placeholder="Ex: Hospital Sírio-Libanês"
                              className="bg-white dark:bg-gray-900"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-500">{t('profile.startYear')}</label>
                            <Input
                              type="number"
                              value={item.ano_inicio || ''}
                              onChange={(e) => updateExperiencia(index, 'ano_inicio', e.target.value)}
                              placeholder="2021"
                              className="bg-white dark:bg-gray-900"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-500">{t('profile.endYear')}</label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                value={item.ano_fim || ''}
                                onChange={(e) => updateExperiencia(index, 'ano_fim', e.target.value)}
                                placeholder="2023"
                                disabled={item.atual}
                                className="bg-white dark:bg-gray-900"
                              />
                              <div className="flex items-center">
                                <Checkbox
                                  id={`atual-${index}`}
                                  checked={item.atual}
                                  onCheckedChange={(checked) => updateExperiencia(index, 'atual', checked)}
                                />
                                <label htmlFor={`atual-${index}`} className="ml-2 text-xs cursor-pointer">{t('profile.current')}</label>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-500">{t('profile.description')}</label>
                          <Textarea
                            value={item.descricao}
                            onChange={(e) => updateExperiencia(index, 'descricao', e.target.value)}
                            placeholder="Principais responsabilidades..."
                            className="bg-white dark:bg-gray-900 min-h-[80px]"
                          />
                        </div>
                      </div>
                    ))}
                    {editProfile.experiencias.length === 0 && (
                      <div className="text-center py-6 text-gray-500 text-sm italic">
                        Nenhuma experiência adicionada.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-3 pt-4 pb-12">
                  <Button variant="outline" onClick={handleCancel} disabled={saving}>
                    {t('profile.cancel')}
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white min-w-[120px]">
                    {saving ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('profile.saving')}
                      </div>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {t('profile.save')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;