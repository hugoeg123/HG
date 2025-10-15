### **Bmad Orchestrator Log**

**STATUS:** User has approved the continuation of the workflow. The project is now in the final validation stage.
**ANALYSIS:** The `greenfield` workflow dictates that the Product Owner Agent performs the final review before development begins. All necessary artifacts have been produced and are ready for inspection.
**ACTION:** Activating the Product Owner Agent.

-----

### **Product Owner Agent Activated**

Greetings. I am the Product Owner Agent. I have received the complete set of planning artifacts from the Architect:

  * `$docs/project-brief.md`
  * `$docs/prd.md`
  * `$docs/front-end-architecture.md`

My responsibility is to perform a final validation, ensuring that the initial business requirements have been consistently translated through each stage of the planning process, from the brief to the final technical design.

**Validation Process:**

1.  **Brief-to-PRD Alignment:** The Product Requirements Document (`prd.md`) accurately captures the MVP scope defined in the `project-brief.md`, correctly prioritizing the core features (view/edit profile, file uploads) while moving additional suggestions (privacy, CRM, etc.) to a documented backlog. **Result: PASS**

2.  **PRD-to-Architecture Alignment:** The Frontend Architecture (`front-end-architecture.md`) directly addresses every user story and acceptance criterion in the `prd.md`. The proposed `Profile.jsx` component, its state management, and API integration plan are a perfect technical representation of the product requirements. **Result: PASS**

3.  **Overall Cohesion:** All documents are consistent. The terminology, feature scope, and technical approach are coherent across the entire planning phase. The provided code from your colleague was instrumental in ensuring this seamless alignment. **Result: PASS**

**Validation Complete:** All artifacts have been validated and approved. There are no inconsistencies.

-----

### **Bmad Orchestrator Log**

**STATUS:** All planning artifacts have been successfully validated by the Product Owner. The `greenfield` planning workflow is now complete.

**ANALYSIS:** The project has successfully passed through the Analyst, Project Manager, Architect, and Product Owner agents. The objective is clear, the requirements are detailed, and the technical plan is sound.

**ACTION:** The planning phase is officially concluded. The project is now ready for implementation. Transitioning from the planning environment to the development environment.

**Handoff:** Activating the **Engineer Agent** to write the code based on the approved architectural documents.

-----

### **Engineer Agent Activated**

Greetings. I am the Engineer Agent. I have received the validated project documents and am ready to begin implementation.

Based on the `front-end-architecture.md` and the provided `ProfilePage.jsx` code, I will now generate the necessary files.

**Action:** Creating the following files:

1.  **`frontend/src/pages/Profile.jsx`** - The main page component.
2.  **`frontend/src/App.jsx` (Modification)** - Instructions to add the new route.

Here is the code. Please add these files to your project as specified.

-----

### **File 1: `frontend/src/pages/Profile.jsx`**

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

-----

### **File 2: `frontend/src/App.jsx` (Modification Instructions)**

In your `frontend/src/App.jsx` file, add the import for the new page and then add the new route inside your `<Routes>` definition, wrapped in `ProtectedRoute`.

```jsx
// frontend/src/App.jsx

// 1. Add this import at the top with your other page imports
import ProfilePage from './pages/Profile.jsx'; 

// ... other code ...

// 2. Add this Route within your <Routes> component, alongside other protected routes
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

-----

**Task Complete.** The necessary code has been delivered. Please integrate it into your project. The BMad process for this feature request is now concluded.