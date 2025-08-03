import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Hash, Save, ChevronDown, ChevronRight, BookText, Stethoscope, FlaskConical, ClipboardList, Pill, X, UserCircle, Sparkles } from 'lucide-react';

// --- TIPOS DE DADOS ---
type Tag = {
  id: string;
  code: string;
  name: string;
  category: string;
  parentId?: string;
};

type Section = {
  id: string;
  content: string;
};

// --- DADOS INICIAIS (MOCK) ---
const initialTags: Tag[] = [
  { id: '1', code: '#QP', name: 'Queixa Principal', category: 'Anamnese' },
  { id: '2', code: '#HDA', name: 'História da Doença Atual', category: 'Anamnese' },
  { id: '3', code: '>>INICIO', name: 'Início dos Sintomas', category: 'Anamnese', parentId: '2' },
  { id: '4', code: '>>CARACTERISTICA', name: 'Característica da Dor', category: 'Anamnese', parentId: '2' },
  { id: '5', code: '#HMP', name: 'Hist. Médica Pregressa', category: 'Anamnese' },
  { id: '6', code: '#SV', name: 'Sinais Vitais', category: 'Exame Físico' },
  { id: '7', code: '>>PA', name: 'Pressão Arterial', category: 'Exame Físico', parentId: '6' },
  { id: '8', code: '>>FC', name: 'Frequência Cardíaca', category: 'Exame Físico', parentId: '6' },
  { id: '9', code: '#EX_LAB', name: 'Exames Laboratoriais', category: 'Investigação' },
  { id: '10', code: '#HD', name: 'Hipótese Diagnóstica', category: 'Diagnóstico' },
  { id: '11', code: '#PL_TX', name: 'Plano Terapêutico', category: 'Plano' },
];

const initialText = '#QP: Dor torácica há 2 dias, 8/10.\n\n#HDA: Paciente refere dor precordial em aperto, iniciada há 2 dias, sem irradiação.\n>>CARACTERISTICA: Aperto\n\n#SV: \n>>PA: 140/90 mmHg\n>>FC: 95 bpm';

const categoriesConfig = {
  'Anamnese': { icon: <BookText size={16} />, order: 1 },
  'Exame Físico': { icon: <Stethoscope size={16} />, order: 2 },
  'Investigação': { icon: <FlaskConical size={16} />, order: 3 },
  'Diagnóstico': { icon: <ClipboardList size={16} />, order: 4 },
  'Plano': { icon: <Pill size={16} />, order: 5 },
};

// --- COMPONENTE PRINCIPAL ---
const ProntuarioHibrido = () => {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [sections, setSections] = useState<Section[]>([]);
  const [singleText, setSingleText] = useState('');
  const [isSegmented, setIsSegmented] = useState(true);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTag, setNewTag] = useState({ code: '', name: '', category: 'Anamnese' });
  const sectionRefs = useRef<Record<string, HTMLTextAreaElement>>({});

  useEffect(() => {
    // Inicializa ambos os modos com base no texto inicial
    const initialSectionsArray = initialText.split('\n\n').map((content, index) => ({
      id: `s_${Date.now()}_${index}`,
      content: content,
    }));
    setSections(initialSectionsArray);
    setSingleText(initialText);
  }, []);

  const tagMap = useMemo(() => new Map(tags.map(t => [t.code, t])), [tags]);
  
  const groupedTags = useMemo(() => {
    const grouped = Object.fromEntries(Object.keys(categoriesConfig).map(cat => [cat, { main: [] as Tag[], subs: {} as Record<string, Tag[]> }]));
    tags.forEach(tag => {
      if (!grouped[tag.category]) return;
      if (tag.parentId) {
        if (!grouped[tag.category].subs[tag.parentId]) grouped[tag.category].subs[tag.parentId] = [];
        grouped[tag.category].subs[tag.parentId].push(tag);
      } else {
        grouped[tag.category].main.push(tag);
      }
    });
    return grouped;
  }, [tags]);

  const handleToggleView = () => {
    const newIsSegmented = !isSegmented;
    if (newIsSegmented) {
      // De texto único para segmentado: parseia o texto
      const sectionsArray = singleText.split('\n\n').map((content, index) => ({
        id: `s_${Date.now()}_${index}`,
        content: content,
      }));
      setSections(sectionsArray);
    } else {
      // De segmentado para texto único: junta as seções
      setSingleText(sections.map(s => s.content).join('\n\n'));
    }
    setIsSegmented(newIsSegmented);
  };

  const handleTextChange = (id: string, newContent: string) => {
    const mainTagRegex = /\n(#\w+:\s*.*)/;
    const match = newContent.match(mainTagRegex);
    
    if (isSegmented && match && match.index !== undefined) {
        const contentBefore = newContent.substring(0, match.index);
        const newSectionContent = match[1].trim();
        const currentSectionIndex = sections.findIndex(s => s.id === id);
        const updatedSections = [...sections];
        updatedSections[currentSectionIndex].content = contentBefore.trim();
        const newSection = { id: `s_${Date.now()}`, content: newSectionContent };
        updatedSections.splice(currentSectionIndex + 1, 0, newSection);
        setSections(updatedSections);
        setTimeout(() => sectionRefs.current[newSection.id]?.focus(), 50);
    } else {
        setSections(sections.map(s => s.id === id ? { ...s, content: newContent } : s));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, id: string) => {
    const target = e.target as HTMLTextAreaElement;
    if (isSegmented && e.key === 'Backspace' && target.value === '' && sections.length > 1) {
        e.preventDefault();
        const currentSectionIndex = sections.findIndex(s => s.id === id);
        if (currentSectionIndex > 0) {
            const previousSection = sections[currentSectionIndex - 1];
            const newSections = sections.filter(s => s.id !== id);
            setSections(newSections);
            setTimeout(() => {
                const prevRef = sectionRefs.current[previousSection.id];
                if (prevRef) {
                    prevRef.focus();
                    prevRef.setSelectionRange(prevRef.value.length, prevRef.value.length);
                }
            }, 50);
        }
    }
  };
  
  const insertTag = (tagCode: string) => {
    if (isSegmented) {
        const lastSection = sections[sections.length - 1];
        if (lastSection && lastSection.content.trim() !== '') {
            if (!tagCode.startsWith('>>')) {
                const newSection = { id: `s_${Date.now()}`, content: `${tagCode}: ` };
                setSections([...sections, newSection]);
                setTimeout(() => sectionRefs.current[newSection.id]?.focus(), 50);
            } else {
                handleTextChange(lastSection.id, `${lastSection.content.trim()}\n${tagCode}: `);
                setTimeout(() => sectionRefs.current[lastSection.id]?.focus(), 50);
            }
        } else if (lastSection) {
            handleTextChange(lastSection.id, `${tagCode}: `);
        } else {
            setSections([{ id: `s_${Date.now()}`, content: `${tagCode}: ` }]);
        }
    } else {
        setSingleText(prev => `${prev.trim()}\n\n${tagCode}: `);
    }
  };

  const handleCreateTag = () => {
    if (!newTag.code || !newTag.name) return;
    const finalTagCode = (newTag.code.startsWith('#') || newTag.code.startsWith('>>')) ? newTag.code : `#${newTag.code}`;
    const newTagData: Tag = { id: `t_${Date.now()}`, code: finalTagCode.toUpperCase(), name: newTag.name, category: newTag.category };
    setTags(prev => [...prev, newTagData]);
    setNewTag({ code: '', name: '', category: 'Anamnese' });
    setIsModalOpen(false);
  };

  const handleSave = () => {
    const fullText = isSegmented ? sections.map(s => s.content).join('\n\n') : singleText;
    console.log("--- TEXTO COMPLETO PARA SALVAR ---", fullText);
    alert('Texto completo salvo no console!');
  };
  
  const handleAddToChat = (content: string) => {
    console.log("--- ADICIONANDO AO CHAT ---", content);
    alert(`Conteúdo adicionado ao chat (ver console).`);
  }

  const parseSectionContent = (content: string) => {
    const match = content.match(/^(#\w+):/);
    if (match) {
        return { tag: match[1], value: content.substring(match[0].length).trimStart() };
    }
    return { tag: null, value: content };
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-[#1a1d21] text-gray-300 font-sans">
      <header className="flex items-center pb-4 mb-6 border-b border-gray-700">
        <UserCircle size={48} className="text-teal-400 mr-4"/>
        <div>
            <h1 className="text-2xl font-bold text-gray-100">João Silva, 45 anos</h1>
            <p className="text-gray-400">ID: 12345 | Prontuário: 789012</p>
        </div>
      </header>
      
      <main className="flex flex-col items-center w-full">
        <div className="w-full bg-[#22262b] p-4 rounded-xl mb-6">
            <button onClick={() => setIsModalOpen(true)} className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold px-3 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ease-in-out hover:from-teal-600 hover:to-cyan-600 shadow-md hover:shadow-lg hover:shadow-cyan-500/30 transform hover:-translate-y-0.5 mb-4">
                <Plus size={18} /> Criar Nova Tag
            </button>
            <div className="space-y-2">
                {Object.entries(categoriesConfig).sort(([, a], [, b]) => a.order - b.order).map(([category]) => (
                    <div key={category}>
                        <button onClick={() => setOpenCategories(prev => ({...prev, [category]: !prev[category]}))} className="w-full flex justify-between items-center p-2 text-gray-300 font-semibold rounded-md hover:bg-gray-700/60">
                            <span className="flex items-center gap-2">{categoriesConfig[category].icon} {category}</span>
                            {openCategories[category] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                        {openCategories[category] && (
                            <div className="pl-4 pt-2 space-y-2">
                                {groupedTags[category]?.main.map(tag => (
                                    <div key={tag.id}>
                                        <button onClick={() => insertTag(tag.code)} className="w-full text-left p-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 rounded flex items-center gap-2" title={`Inserir: ${tag.name}`}>
                                            <Hash size={14} className="text-teal-400"/> {tag.name}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>

        <div className="w-full space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-300">Registro da Consulta</h2>
                <div className="flex items-center gap-4">
                     {/* Toggle Switch */}
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isSegmented ? 'text-teal-400' : 'text-gray-400'}`}>Visão Segmentada</span>
                        <button onClick={handleToggleView} role="switch" aria-checked={isSegmented} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${isSegmented ? 'bg-teal-600' : 'bg-gray-600'}`}>
                            <span aria-hidden="true" className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isSegmented ? 'translate-x-5' : 'translate-x-0'}`}/>
                        </button>
                    </div>
                    <button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                      <Save size={16} /> Salvar
                    </button>
                </div>
            </div>
            
            {isSegmented ? (
                <div className="w-full space-y-4">
                    {sections.map((section) => {
                        const { tag, value } = parseSectionContent(section.content);
                        return (
                            <div key={section.id} className="group relative bg-[#22262b] rounded-lg border-l-4 border-teal-500 shadow-lg focus-within:ring-2 focus-within:ring-teal-500/50 transition flex flex-col">
                                <button onClick={() => handleAddToChat(section.content)} className="absolute top-2 right-2 p-1.5 bg-gray-700/50 rounded-full text-teal-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity" title="Adicionar ao Chat">
                                    <Sparkles size={16} />
                                </button>
                                {tag && <div className="px-4 pt-3 pb-1 font-semibold text-teal-400">{tagMap.get(tag)?.name || tag}</div>}
                                <textarea
                                    ref={(el) => { if(el) sectionRefs.current[section.id] = el; }}
                                    value={value}
                                    onChange={(e) => {
                                        const fullNewContent = tag ? `${tag}: ${e.target.value}` : e.target.value;
                                        handleTextChange(section.id, fullNewContent);
                                    }}
                                    onKeyDown={(e) => handleKeyDown(e, section.id)}
                                    className={`w-full bg-transparent resize-none outline-none block p-4 ${tag ? 'pt-1' : ''} text-gray-300 placeholder-gray-500 flex-grow`}
                                    rows={value.split('\n').length || 1}
                                    placeholder="Digite aqui..."
                                />
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="relative group">
                     <button onClick={() => handleAddToChat(singleText)} className="absolute top-2 right-2 p-1.5 bg-gray-700/50 rounded-full text-teal-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity" title="Adicionar todo o texto ao Chat">
                        <Sparkles size={16} />
                    </button>
                    <textarea
                        value={singleText}
                        onChange={(e) => setSingleText(e.target.value)}
                        className="w-full h-96 p-4 bg-[#22262b] border border-gray-700 rounded-xl text-gray-300 placeholder-gray-500 resize-y focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                        placeholder="Digite o registro completo aqui..."
                    />
                </div>
            )}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-[#22262b] p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-200">Criar Nova Tag</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
                </div>
                <div className="space-y-4">
                    <input type="text" placeholder="Código (Ex: #TAG ou >>SUB)" value={newTag.code} onChange={(e) => setNewTag({ ...newTag, code: e.target.value })} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white" />
                    <input type="text" placeholder="Nome (Ex: Exame Físico)" value={newTag.name} onChange={(e) => setNewTag({ ...newTag, name: e.target.value })} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white" />
                    <select value={newTag.category} onChange={(e) => setNewTag({ ...newTag, category: e.target.value })} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                        {Object.keys(categoriesConfig).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <button onClick={handleCreateTag} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 rounded-lg">Criar Tag</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ProntuarioHibrido;
