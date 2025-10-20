/**
 * Página de Perfil Profissional
 * 
 * Permite visualização e edição do perfil médico com upload de arquivos
 * 
 * Conector: Integra com services/api.js para chamadas de API
 * IA prompt: Expandir para incluir certificações e publicações
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Calendar
} from 'lucide-react';

/**
 * Perfil vazio para inicialização
 * Hook: Usado como estado inicial do formulário
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
 * 
 * Hook: Exibe informações do perfil em modo marketplace
 * Conector: Usado na tab "Visão Pública"
 */
const PublicCard = React.memo(({ profile }) => {
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  
  return (
    <Card className="w-full max-w-2xl mx-auto bg-theme-card border-theme-border theme-border">
      <CardHeader className="text-center pb-4">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="w-24 h-24">
            <AvatarImage src={profile.avatar_url} alt={profile.nome} />
            <AvatarFallback className="text-2xl">
              {profile.nome?.split(' ').map(n => n[0]).join('').toUpperCase() || 'MD'}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">{profile.nome || 'Nome não informado'}</CardTitle>
            {profile.titulo_profissional && (
              <p className="text-lg text-muted-foreground">
                {profile.titulo_profissional}
              </p>
            )}
            {profile.specialty && (
              <Badge variant="secondary" className="text-sm">
                {profile.specialty}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex justify-center gap-3">
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => navigate('/agenda')}
            className="flex items-center space-x-2 bg-accent/20 text-accent hover:bg-accent/40 border border-transparent hover:border-accent/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40 transition-all duration-200"
          >
            <Calendar className="w-4 h-4 text-accent" />
            <span className="text-accent">Agenda</span>
          </Button>
          {profile.curriculo_url && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open(profile.curriculo_url, '_blank')}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Currículo</span>
            </Button>
          )}
        </div>
        
        {profile.biografia && (
          <div>
            <h3 className="font-semibold mb-2 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Sobre
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {profile.biografia}
            </p>
          </div>
        )}
        
        {profile.formacao && profile.formacao.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center">
              <GraduationCap className="w-4 h-4 mr-2" />
              Formação Acadêmica
            </h3>
            <div className="space-y-3">
              {profile.formacao.map((item, index) => (
                <div key={index} className="p-3 rounded-lg bg-theme-surface">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium">{item.curso}</h4>
                    <span className="text-sm text-muted-foreground">
                      {item.ano_inicio} - {item.ano_fim || 'Atual'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{item.instituicao}</p>
                  {item.descricao && (
                    <p className="text-xs text-muted-foreground">{item.descricao}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {profile.experiencias && profile.experiencias.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center">
              <Briefcase className="w-4 h-4 mr-2" />
              Experiência Profissional
            </h3>
            <div className="space-y-3">
              {profile.experiencias.map((item, index) => (
                <div key={index} className="p-3 rounded-lg bg-theme-surface">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium">{item.cargo}</h4>
                    <span className="text-sm text-muted-foreground">
                      {item.ano_inicio} - {item.atual ? 'Atual' : item.ano_fim}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{item.empresa}</p>
                  {item.descricao && (
                    <p className="text-xs text-muted-foreground">{item.descricao}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

PublicCard.displayName = 'PublicCard';

/**
 * Componente Principal - Página de Perfil
 * 
 * Hook: Gerencia estado do perfil e integração com API
 * Conector: Usa authStore para autenticação e api.js para requisições
 */
const Profile = () => {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  
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
  const avatarInputRef = useRef(null);
  const curriculoInputRef = useRef(null);

  // Limpeza de objectURL ao desmontar
  useEffect(() => {
    return () => {
      if (avatarPreviewUrlRef.current) {
        URL.revokeObjectURL(avatarPreviewUrlRef.current);
        avatarPreviewUrlRef.current = null;
      }
    };
  }, []);
  
  /**
   * Mapear dados da API para o formato do componente
   * Hook: Converte resposta da API para estrutura local
   */
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
  
  /**
   * Carregar perfil da API
   * Hook: Busca dados do perfil no backend
   */
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
  
  // Carregar perfil ao montar o componente (evitar chamada duplicada no StrictMode)
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    const controller = new AbortController();
    loadProfile(controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadProfile]);
  
  /**
   * Manipular mudanças nos campos do formulário
   * Hook: Atualiza estado do formulário de edição
   */
  const handleInputChange = useCallback((field, value) => {
    setEditProfile(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);
  
  /**
   * Manipular upload de avatar
   * Hook: Processa seleção de arquivo de avatar
   */
  // Função utilitária: compactar/redimensionar imagem no cliente para melhorar performance
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
      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de arquivo inválido. Use JPEG, PNG ou WebP.');
        return;
      }
      
      // Validar tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 5MB.');
        return;
      }
      
      // Compactar/redimensionar para otimizar upload
      compressImage(file).then((optimized) => {
        setAvatarFile(optimized);
        // Limpar URL anterior
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
  
  /**
   * Manipular upload de currículo
   * Hook: Processa seleção de arquivo de currículo
   */
  const handleCurriculoChange = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de arquivo inválido. Use PDF, DOC ou DOCX.');
        return;
      }
      
      // Validar tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 5MB.');
        return;
      }
      
      setCurriculoFile(file);
    }
  }, []);
  
  /**
   * Upload de arquivos
   * Hook: Envia arquivos para o backend
   */
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
      // Enviar como multipart/form-data garantindo que o boundary seja definido pelo browser
      const response = await throttledApi.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = response?.data || {};
      // Mapear respostas de forma flexível (suporta vários formatos)
      // Possíveis formatos:
      // 1) { files: { avatar_url, curriculo_url } }
      // 2) { avatar_url, curriculo_url }
      // 3) { files: { avatar, curriculo } } onde valores são URLs
      const filesObj = data.files || data;
      return {
        ...(filesObj.avatar_url ? { avatar_url: filesObj.avatar_url } : {}),
        ...(filesObj.curriculo_url ? { curriculo_url: filesObj.curriculo_url } : {}),
        ...(filesObj.avatar && typeof filesObj.avatar === 'string' ? { avatar_url: filesObj.avatar } : {}),
        ...(filesObj.curriculo && typeof filesObj.curriculo === 'string' ? { curriculo_url: filesObj.curriculo } : {}),
      };
    } catch (error) {
      console.error('Erro no upload:', error);
      // Continuar salvando sem anexos
      return {};
    }
  }, [avatarFile, curriculoFile]);
  
  /**
   * Valida dados do perfil antes de enviar
   * Hook: Valida campos críticos para evitar erros de validação
   */
  const validarDadosPerfil = useCallback((data) => {
    const erros = [];
    
    // Validar nome (mínimo 2 caracteres)
    if (data.nome && data.nome.length < 2) {
      erros.push('Nome deve ter pelo menos 2 caracteres');
    }
    
    // Validar email
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      erros.push('Email inválido');
    }
    
    // Validar título profissional (máximo 100 caracteres)
    if (data.titulo_profissional && data.titulo_profissional.length > 100) {
      erros.push('Título profissional muito longo (máximo 100 caracteres)');
    }
    
    // Validar biografia (máximo 1000 caracteres)
    if (data.biografia && data.biografia.length > 1000) {
      erros.push('Biografia muito longa (máximo 1000 caracteres)');
    }
    
    // Validar URLs apenas se presentes
    if (data.avatar_url && !data.avatar_url.match(/^https?:\/\/.+/)) {
      erros.push('URL do avatar inválida');
    }
    
    if (data.curriculo_url && !data.curriculo_url.match(/^https?:\/\/.+/)) {
      erros.push('URL do currículo inválida');
    }
    
    return erros;
  }, []);
  
  /**
   * Salvar perfil
   * Hook: Envia dados atualizados para o backend
   */
  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      
      // Upload de arquivos primeiro
      const uploadedFiles = await uploadFiles();
      
      // Preparar dados para envio
      const updateData = {
        ...editProfile,
        ...uploadedFiles
      };
      
      // Sanitizar campos vazios para evitar falhas de validação no backend
      ['avatar_url', 'curriculo_url'].forEach((field) => {
        if (updateData[field] === '' || updateData[field] === null || updateData[field] === undefined) {
          delete updateData[field];
        }
      });
      
      // Log detalhado para debug
      console.log('📤 Enviando dados do perfil:', {
        campos: Object.keys(updateData),
        avatar_url: updateData.avatar_url ? 'presente' : 'ausente',
        curriculo_url: updateData.curriculo_url ? 'presente' : 'ausente',
        nome: updateData.nome ? `${updateData.nome.length} caracteres` : 'ausente',
        email: updateData.email ? 'presente' : 'ausente'
      });
      
      // Validar dados antes de enviar
      const errosValidacao = validarDadosPerfil(updateData);
      if (errosValidacao.length > 0) {
        console.warn('⚠️ Validação local falhou:', errosValidacao);
        toast.error(errosValidacao[0]); // Mostrar apenas o primeiro erro
        return;
      }
      
      // Enviar atualização do perfil
      const response = await throttledApi.put('/auth/profile', updateData);
      const updatedProfile = mapApiDataToProfile(response.data);
      
      // Atualizar estados
      setProfile(updatedProfile);
      setEditProfile(updatedProfile);
      
      // Limpar arquivos temporários
      setAvatarFile(null);
      setCurriculoFile(null);
      setAvatarPreview(null);
      
      toast.success('Perfil atualizado com sucesso!');
      setActiveTab('public');
      
    } catch (error) {
      // Tratamento de erro aprimorado para evitar múltiplos logs
      const errorDetails = {
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
        validationErrors: error.response?.data?.errors?.length || 0,
        firstError: error.response?.data?.errors?.[0]?.msg || null
      };
      
      // Log único e estruturado
      console.error('❌ Erro ao salvar perfil:', errorDetails);
      
      // Mostrar mensagem amigável ao usuário
      const userMessage = errorDetails.firstError || 
                         errorDetails.message || 
                         'Erro ao salvar perfil. Verifique os dados e tente novamente.';
      
      toast.error(userMessage);
    } finally {
      setSaving(false);
    }
  }, [editProfile, uploadFiles, mapApiDataToProfile, validarDadosPerfil]);
  
  /**
   * Cancelar edição
   * Hook: Reverte mudanças não salvas
   */
  const handleCancel = useCallback(() => {
    setEditProfile(profile);
    setAvatarFile(null);
    setCurriculoFile(null);
    setAvatarPreview(null);
    setActiveTab('public');
  }, [profile]);
  
  /**
   * Adicionar formação
   * Hook: Adiciona nova entrada de formação acadêmica
   */
  const addFormacao = useCallback(() => {
    setEditProfile(prev => ({
      ...prev,
      formacao: [...prev.formacao, { ...emptyFormacao }]
    }));
  }, []);
  
  /**
   * Remover formação
   * Hook: Remove entrada de formação acadêmica
   */
  const removeFormacao = useCallback((index) => {
    setEditProfile(prev => ({
      ...prev,
      formacao: prev.formacao.filter((_, i) => i !== index)
    }));
  }, []);
  
  /**
   * Atualizar formação
   * Hook: Atualiza entrada específica de formação
   */
  const updateFormacao = useCallback((index, field, value) => {
    setEditProfile(prev => ({
      ...prev,
      formacao: prev.formacao.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  }, []);
  
  /**
   * Adicionar experiência
   * Hook: Adiciona nova entrada de experiência profissional
   */
  const addExperiencia = useCallback(() => {
    setEditProfile(prev => ({
      ...prev,
      experiencias: [...prev.experiencias, { ...emptyExperiencia }]
    }));
  }, []);
  
  /**
   * Remover experiência
   * Hook: Remove entrada de experiência profissional
   */
  const removeExperiencia = useCallback((index) => {
    setEditProfile(prev => ({
      ...prev,
      experiencias: prev.experiencias.filter((_, i) => i !== index)
    }));
  }, []);
  
  /**
   * Atualizar experiência
   * Hook: Atualiza entrada específica de experiência
   */
  const updateExperiencia = useCallback((index, field, value) => {
    setEditProfile(prev => ({
      ...prev,
      experiencias: prev.experiencias.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  }, []);
  
  // Memoizar avatar atual para performance
  const currentAvatar = useMemo(() => {
    return avatarPreview || editProfile.avatar_url || profile.avatar_url;
  }, [avatarPreview, editProfile.avatar_url, profile.avatar_url]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-theme-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Carregando perfil...
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="profile-page min-h-screen p-6 bg-theme-background">
      <div className="max-w-4xl mx-auto">

        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-theme-surface border border-theme-border theme-border">
            <TabsTrigger value="public" className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Visão Pública</span>
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex items-center space-x-2">
              <Edit3 className="w-4 h-4" />
              <span>Editar</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="public" className="mt-6">
            {!profile.public_visibility && (
              <div className="mb-4 p-3 rounded-lg border border-theme-border theme-border bg-theme-card text-muted-foreground">
                Seu perfil está marcado como privado. Altere a visibilidade na aba Editar.
              </div>
            )}
            <PublicCard profile={profile} />
          </TabsContent>
          
          <TabsContent value="edit" className="mt-6">
            <div className="space-y-6">
              {/* Upload de Avatar e Currículo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="w-5 h-5" />
                    <span>Arquivos</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center space-x-6">
                    <div className="flex flex-col items-center space-y-2">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={currentAvatar} alt="Avatar" />
                        <AvatarFallback>
                          {editProfile.nome?.split(' ').map(n => n[0]).join('').toUpperCase() || 'MD'}
                        </AvatarFallback>
                      </Avatar>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleAvatarChange}
                          ref={avatarInputRef}
                          className="hidden"
                        />
                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="flex items-center space-x-2"
                          onClick={() => avatarInputRef.current?.click()}
                        >
                          <Camera className="w-4 h-4" />
                          <span>Alterar Avatar</span>
                        </Button>
                      </label>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium mb-2">Foto do Perfil</h3>
                      <p className="text-sm text-muted-foreground">
                        Formatos aceitos: JPEG, PNG, WebP. Tamanho máximo: 5MB.
                      </p>
                      {avatarFile && (
                        <p className="text-sm text-green-600">
                          ✓ Novo arquivo selecionado: {avatarFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Currículo */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Currículo</h3>
                    <div className="flex items-center space-x-4">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={handleCurriculoChange}
                          ref={curriculoInputRef}
                          className="hidden"
                        />
                        <Button 
                          variant="primary" 
                          className="flex items-center space-x-2"
                          onClick={() => curriculoInputRef.current?.click()}
                        >
                          <FileText className="w-4 h-4" />
                          <span>Selecionar Currículo</span>
                        </Button>
                      </label>
                      
                      {editProfile.curriculo_url && (
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => { const w = window.open(editProfile.curriculo_url, '_blank'); if (w) w.opener = null; }}
                          className="flex items-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Ver Atual</span>
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      Formatos aceitos: PDF, DOC, DOCX. Tamanho máximo: 5MB.
                    </p>
                    
                    {curriculoFile && (
                      <p className="text-sm text-green-600">
                        ✓ Novo arquivo selecionado: {curriculoFile.name}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Informações Básicas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nome Completo</label>
                      <Input
                        value={editProfile.nome}
                        onChange={(e) => handleInputChange('nome', e.target.value)}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <Input
                        type="email"
                        value={editProfile.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="seu@email.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Título Profissional</label>
                      <Input
                        value={editProfile.titulo_profissional}
                        onChange={(e) => handleInputChange('titulo_profissional', e.target.value)}
                        placeholder="Ex: Médico Cardiologista"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Especialidade</label>
                      <Input
                        value={editProfile.specialty}
                        onChange={(e) => handleInputChange('specialty', e.target.value)}
                        placeholder="Ex: Cardiologia"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Biografia</label>
                    <Textarea
                      value={editProfile.biografia}
                      onChange={(e) => handleInputChange('biografia', e.target.value)}
                      placeholder="Conte um pouco sobre sua trajetória profissional..."
                      rows={4}
                      maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {editProfile.biografia?.length || 0}/1000 caracteres
                    </p>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-1">Visibilidade Pública</label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={!!editProfile.public_visibility}
                        onCheckedChange={(checked) => handleInputChange('public_visibility', !!checked)}
                      />
                      <span className="text-sm text-muted-foreground">
                        Exibir seu perfil no marketplace público
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Formação Acadêmica */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="w-5 h-5" />
                      <span>Formação Acadêmica</span>
                    </div>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={addFormacao}
                      className="flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar</span>
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editProfile.formacao.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhuma formação adicionada. Clique em "Adicionar" para começar.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {editProfile.formacao.map((item, index) => (
                        <div key={index} className={`p-4 border rounded-lg border-theme-border theme-border`}>
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-medium">Formação {index + 1}</h4>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeFormacao(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Instituição</label>
                              <Input
                                value={item.instituicao}
                                onChange={(e) => updateFormacao(index, 'instituicao', e.target.value)}
                                placeholder="Nome da instituição"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-1">Curso</label>
                              <Input
                                value={item.curso}
                                onChange={(e) => updateFormacao(index, 'curso', e.target.value)}
                                placeholder="Nome do curso"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-1">Ano de Início</label>
                              <Input
                                type="number"
                                value={item.ano_inicio}
                                onChange={(e) => updateFormacao(index, 'ano_inicio', e.target.value)}
                                placeholder="2020"
                                min="1950"
                                max={new Date().getFullYear()}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-1">Ano de Conclusão</label>
                              <Input
                                type="number"
                                value={item.ano_fim}
                                onChange={(e) => updateFormacao(index, 'ano_fim', e.target.value)}
                                placeholder="2024 (deixe vazio se em andamento)"
                                min="1950"
                                max={new Date().getFullYear() + 10}
                              />
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <label className="block text-sm font-medium mb-1">Descrição (opcional)</label>
                            <Textarea
                              value={item.descricao}
                              onChange={(e) => updateFormacao(index, 'descricao', e.target.value)}
                              placeholder="Descreva brevemente o curso, projetos relevantes, etc."
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Experiência Profissional */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-5 h-5" />
                      <span>Experiência Profissional</span>
                    </div>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={addExperiencia}
                      className="flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar</span>
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editProfile.experiencias.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhuma experiência adicionada. Clique em "Adicionar" para começar.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {editProfile.experiencias.map((item, index) => (
                        <div key={index} className={`p-4 border rounded-lg border-theme-border theme-border`}>
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-medium">Experiência {index + 1}</h4>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeExperiencia(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Empresa/Instituição</label>
                              <Input
                                value={item.empresa}
                                onChange={(e) => updateExperiencia(index, 'empresa', e.target.value)}
                                placeholder="Nome da empresa"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-1">Cargo</label>
                              <Input
                                value={item.cargo}
                                onChange={(e) => updateExperiencia(index, 'cargo', e.target.value)}
                                placeholder="Seu cargo/função"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-1">Ano de Início</label>
                              <Input
                                type="number"
                                value={item.ano_inicio}
                                onChange={(e) => updateExperiencia(index, 'ano_inicio', e.target.value)}
                                placeholder="2020"
                                min="1950"
                                max={new Date().getFullYear()}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-1">Ano de Término</label>
                              <div className="space-y-2">
                                <Input
                                  type="number"
                                  value={item.ano_fim}
                                  onChange={(e) => updateExperiencia(index, 'ano_fim', e.target.value)}
                                  placeholder="2024"
                                  min="1950"
                                  max={new Date().getFullYear() + 1}
                                  disabled={item.atual}
                                />
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={item.atual}
                                    onChange={(e) => {
                                      updateExperiencia(index, 'atual', e.target.checked);
                                      if (e.target.checked) {
                                        updateExperiencia(index, 'ano_fim', '');
                                      }
                                    }}
                                    className="rounded"
                                  />
                                  <span className="text-sm">Trabalho atual</span>
                                </label>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <label className="block text-sm font-medium mb-1">Descrição (opcional)</label>
                            <Textarea
                              value={item.descricao}
                              onChange={(e) => updateExperiencia(index, 'descricao', e.target.value)}
                              placeholder="Descreva suas principais responsabilidades e conquistas..."
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Botões de Ação */}
              <div className="flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                
                <Button 
                  variant="primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  <span>{saving ? 'Salvando...' : 'Salvar Perfil'}</span>
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;