Com certeza. Aqui está o pacote completo para o programador, consolidando toda a documentação gerada pelo processo BMad e o código final para implementação da página de perfil.

-----

## **Pacote de Entrega para o Desenvolvedor: Página de Perfil do Profissional**

Este documento contém todos os artefatos de planejamento e o código necessário para implementar a nova funcionalidade de perfil de usuário.

### **1. Documentação do Projeto**

A seguir estão os resumos dos documentos de planejamento que guiaram a criação desta funcionalidade.

#### **A. Resumo do Projeto (Project Brief)**

  * **Objetivo:** Criar uma nova página na rota `/profile`.
  * **Funcionalidade Principal (MVP):** Permitir que profissionais visualizem e editem suas informações de perfil.
  * **Campos do MVP:** Nome, Título Profissional, Especialidade, Biografia, Foto de Perfil (upload), Currículo (upload), Formação Acadêmica (lista dinâmica) e Experiências Profissionais (lista dinâmica).
  * **Melhorias Futuras (Backlog):** Adicionar um seletor de perfil público/privado, validação de CRM/UF, campos para modalidade de atendimento (teleconsulta) e faixa de preço, e funcionalidade de compartilhamento social.

#### **B. Requisitos do Produto (Product Requirements Document - PRD)**

  * **História de Usuário 1 (Visualização):** Como profissional, quero acessar minha página de perfil para ver como minhas informações são exibidas publicamente.
      * *Critérios de Aceite:* A página deve exibir todos os campos do MVP e mostrar textos de placeholder caso a informação não esteja preenchida. Um link para o currículo deve aparecer se o arquivo tiver sido enviado.
  * **História de Usuário 2 (Edição):** Como profissional, quero um modo de edição para atualizar minhas informações e mantê-las precisas.
      * *Critérios de Aceite:* A página deve ter uma aba ou botão "Editar". Todos os campos devem ser editáveis através de um formulário. O usuário deve poder adicionar e remover itens das listas de "Formação" e "Experiências". Um botão "Salvar" deve persistir os dados via `PUT` para o endpoint `/api/auth/profile/`.
  * **História de Usuário 3 (Upload de Arquivos):** Como profissional, quero poder enviar uma foto de perfil e um arquivo de currículo.
      * *Critérios de Aceite:* O formulário de edição deve conter campos de upload para imagem e documentos (`.pdf`, `.doc`, `.docx`). O upload deve usar o endpoint `POST /api/files/upload/`. A nova foto deve ser exibida como pré-visualização imediatamente.

#### **C. Arquitetura Frontend**

  * **Novo Componente:** `frontend/src/pages/Profile.jsx`. Este componente será responsável por buscar dados, gerenciar o estado (loading, saving, dados do perfil) e enviar as atualizações para a API.
  * **Roteamento:** O arquivo `frontend/src/App.jsx` será modificado para incluir uma nova rota protegida (`<ProtectedRoute>`) para o caminho `/profile`, que renderizará o componente `ProfilePage`.
  * **Fluxo de Dados:**
    1.  Ao montar, o componente fará uma requisição `GET` para `/api/auth/profile/` para carregar os dados.
    2.  As alterações do usuário atualizarão o estado local do React.
    3.  Uploads de arquivos farão requisições `POST` para `/api/files/upload/` e atualizarão a URL do arquivo no estado local.
    4.  Ao clicar em "Salvar", uma requisição `PUT` com o objeto completo do perfil será enviada para `/api/auth/profile/`.
  * **Integração:** O `apiClient` existente será usado para todas as chamadas HTTP, garantindo a consistência com o restante da aplicação. Os componentes de UI da biblioteca interna (`/components/ui/*`) serão utilizados para construir a interface.

-----

### **2. Código e Instruções de Implementação**

#### **A. Arquivo 1: Criar `frontend/src/pages/Profile.jsx`**

Copie e cole o conteúdo abaixo para criar o novo arquivo da página.

```jsx
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import api from '../services/api/apiClient';
import { AUTH_ENDPOINTS, FILE_ENDPOINTS } from '../services/api/endpoints';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';

const emptyProfile = {
  name: '',
  professional_title: '',
  specialty: '',
  bio: '',
  avatar_url: '',
  cv_url: '',
  education: [],   // array de strings
  experiences: []  // array de strings
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(emptyProfile);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);

  // Carrega perfil
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(AUTH_ENDPOINTS.PROFILE);
        // aceita formatos {user: {...}} ou payload direto
        const payload = data?.user || data?.data || data;
        setProfile(p => ({ ...p, ...mapFromApi(payload) }));
      } catch (err) {
        toast.error('Não foi possível carregar o perfil.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const mapFromApi = (u = {}) => ({
    name: u.name || u.nome || '',
    professional_title: u.professional_title || u.cargo || '',
    specialty: u.specialty || u.especialidade || '',
    bio: u.bio || u.biografia || '',
    avatar_url: u.avatar_url || u.avatar || '',
    cv_url: u.cv_url || u.curriculum_url || '',
    education: Array.isArray(u.education) ? u.education : (u.education ? String(u.education).split('\n').filter(Boolean) : []),
    experiences: Array.isArray(u.experiences) ? u.experiences : (u.experiences ? String(u.experiences).split('\n').filter(Boolean) : []),
  });

  const mapToApi = (p) => ({
    name: p.name,
    professional_title: p.professional_title,
    specialty: p.specialty,
    bio: p.bio,
    avatar_url: p.avatar_url || null,
    cv_url: p.cv_url || null,
    education: p.education,
    experiences: p.experiences,
  });

  const handleChange = (field) => (e) => {
    setProfile(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleListChange = (field, index, value) => {
    setProfile(prev => {
      const arr = [...prev[field]];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
  };

  const handleAddItem = (field) => {
    setProfile(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const handleRemoveItem = (field, index) => {
    setProfile(prev => {
      const arr = prev[field].filter((_, i) => i !== index);
      return { ...prev, [field]: arr };
    });
  };

  const uploadFile = async (file, setUploading) => {
    if (!file) return null;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.upload(FILE_ENDPOINTS.UPLOAD, formData);
      const payload = res?.data || {};
      // tenta várias chaves comuns
      return payload.url || payload.file?.url || payload.path || payload.location || null;
    } catch (e) {
      toast.error('Falha no upload do arquivo.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, setUploadingAvatar);
    if (url) {
      setProfile(prev => ({ ...prev, avatar_url: url }));
      toast.success('Foto atualizada (pré-visualização). Não esqueça de salvar.');
    }
  };

  const onCVSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, setUploadingCV);
    if (url) {
      setProfile(prev => ({ ...prev, cv_url: url }));
      toast.success('Currículo anexado. Não esqueça de salvar.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = mapToApi(profile);
      await api.put(AUTH_ENDPOINTS.PROFILE, payload);
      toast.success('Perfil salvo com sucesso!');
    } catch (e) {
      toast.error('Erro ao salvar perfil. Verifique os campos.');
    } finally {
      setSaving(false);
    }
  };

  const PublicCard = useMemo(() => (
    <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <CardHeader className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700 bg-gray-100 dark:bg-gray-800">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Sem foto</div>
          )}
        </div>
        <div className="flex-1">
          <CardTitle className="text-xl">{profile.name || 'Profissional'}</CardTitle>
          <CardDescription className="mt-1">
            {[profile.professional_title, profile.specialty].filter(Boolean).join(' · ') || 'defina seu cargo/especialidade'}
          </CardDescription>
          {profile.cv_url && (
            <a href={profile.cv_url} target="_blank" rel="noreferrer" className="text-sm mt-2 inline-block text-blue-600 dark:text-blue-400 underline">
              Ver currículo (PDF/Doc)
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid gap-6">
        <section>
          <h3 className="font-medium mb-2">Biografia</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {profile.bio || 'Conte um pouco sobre você, sua abordagem e experiência.'}
          </p>
        </section>

        <section>
          <h3 className="font-medium mb-2">Formação</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
            {profile.education?.length ? profile.education.map((e, i) => (<li key={i}>{e}</li>)) : <li>Adicione sua formação acadêmica.</li>}
          </ul>
        </section>

        <section>
          <h3 className="font-medium mb-2">Experiências</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
            {profile.experiences?.length ? profile.experiences.map((e, i) => (<li key={i}>{e}</li>)) : <li>Adicione suas experiências profissionais.</li>}
          </ul>
        </section>
      </CardContent>
    </Card>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [profile]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-sm text-gray-500">Carregando perfil…</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Perfil</h1>

      <Tabs defaultValue="view" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="view">Visão pública</TabsTrigger>
          <TabsTrigger value="edit">Editar</TabsTrigger>
        </TabsList>

        <TabsContent value="view">
          {PublicCard}
        </TabsContent>

        <TabsContent value="edit">
          <div className="grid gap-6">
            {/* Cabeçalho + avatar */}
            <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardContent className="pt-6 grid gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700 bg-gray-100 dark:bg-gray-800">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Sem foto</div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="avatar" className="text-sm block mb-2">Foto do perfil</label>
                    <Input id="avatar" type="file" accept="image/*" onChange={onAvatarSelect} disabled={uploadingAvatar} />
                    <p className="text-xs text-gray-500 mt-1">JPG/PNG/WebP até 10MB.</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm block mb-1">Nome</label>
                    <Input value={profile.name} onChange={handleChange('name')} placeholder="Seu nome completo" />
                  </div>
                  <div>
                    <label className="text-sm block mb-1">Cargo/Título</label>
                    <Input value={profile.professional_title} onChange={handleChange('professional_title')} placeholder="Ex.: Médico(a) Cardiologista" />
                  </div>
                  <div>
                    <label className="text-sm block mb-1">Especialidade</label>
                    <Input value={profile.specialty} onChange={handleChange('specialty')} placeholder="Ex.: Cardiologia" />
                  </div>
                  <div>
                    <label htmlFor="cv" className="text-sm block mb-1">Currículo (PDF/DOC)</label>
                    <Input id="cv" type="file" accept=".pdf,.doc,.docx,.txt" onChange={onCVSelect} disabled={uploadingCV} />
                    {profile.cv_url && (
                      <a href={profile.cv_url} target="_blank" rel="noreferrer" className="text-xs mt-1 inline-block text-blue-600 dark:text-blue-400 underline">
                        Ver arquivo atual
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm block mb-1">Biografia</label>
                  <Textarea rows={5} value={profile.bio} onChange={handleChange('bio')} placeholder="Conte sobre sua formação, linha de cuidado e experiência." />
                </div>
              </CardContent>
            </Card>

            {/* Formação */}
            <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle>Formação</CardTitle>
                <CardDescription>Ex.: Graduação, Residência, Pós, Títulos.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {profile.education.map((item, idx) => (
                  <div key={`edu-${idx}`} className="flex gap-2">
                    <Input value={item} onChange={(e) => handleListChange('education', idx, e.target.value)} placeholder="Ex.: Residência em Clínica Médica - USP (2018–2020)" />
                    <Button variant="destructive" type="button" onClick={() => handleRemoveItem('education', idx)}>Remover</Button>
                  </div>
                ))}
                <div>
                  <Button type="button" onClick={() => handleAddItem('education')}>+ Adicionar formação</Button>
                </div>
              </CardContent>
            </Card>

            {/* Experiências */}
            <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle>Experiências</CardTitle>
                <CardDescription>Ex.: Hospitais, clínicas, pesquisas, docência.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {profile.experiences.map((item, idx) => (
                  <div key={`exp-${idx}`} className="flex gap-2">
                    <Input value={item} onChange={(e) => handleListChange('experiences', idx, e.target.value)} placeholder="Ex.: Cardiologista - HCor (2020–atual)" />
                    <Button variant="destructive" type="button" onClick={() => handleRemoveItem('experiences', idx)}>Remover</Button>
                  </div>
                ))}
                <div>
                  <Button type="button" onClick={() => handleAddItem('experiences')}>+ Adicionar experiência</Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={() => window.history.back()}>Voltar</Button>
              <Button type="button" onClick={handleSave} disabled={saving || uploadingAvatar || uploadingCV}>
                {saving ? 'Salvando…' : 'Salvar perfil'}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

#### **B. Arquivo 2: Modificar `frontend/src/App.jsx`**

Siga as duas etapas abaixo para registrar a nova página no roteador principal da aplicação.

```jsx
// Em: frontend/src/App.jsx

// 1. Adicione este import no topo do arquivo, junto com as outras páginas.
import ProfilePage from './pages/Profile.jsx'; 

// ... (resto do seu código) ...

// 2. Dentro do seu componente <Routes>, adicione a nova rota,
//    preferencialmente junto com as outras rotas protegidas.
<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Layout>
        <ProfilePage />
      </Layout>
    </ProtectedRoute>
  }
/>
```