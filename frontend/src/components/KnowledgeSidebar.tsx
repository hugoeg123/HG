import React, { useState } from 'react';
import { useKnowledgeSearch } from '../hooks/useKnowledgeSearch';
import { DrugMonographCard } from './DrugMonographCard';
import { WikipediaCard } from './WikipediaCard';
import { InteractionAlert } from './InteractionAlert';
import { Search, PenTool, Database, Globe, Lock, Unlock, Plus, Activity, BookOpen, ExternalLink } from 'lucide-react';

const KnowledgeSidebar: React.FC = () => {
    const [query, setQuery] = useState('');
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [isPublic, setIsPublic] = useState(true);

    const {
        drugResults,
        paperResults,
        interactionResults,
        diagnosticResults,
        pubmedResults,
        wikiResults,
        notes,
        isLoading,
        addNote
    } = useKnowledgeSearch(query);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!noteText.trim()) return;
        await addNote(noteText, isPublic, 'Eu (Você)', query);
        setNoteText('');
        setShowNoteInput(false);
    };

    return (
        <div className="flex flex-col h-full w-80 bg-[var(--color-bg-dark)] border-l border-[var(--color-border)] shadow-xl overflow-hidden text-sm font-sans">
            {/* Header */}
            <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-light)]">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                        <Database className="w-5 h-5 text-[var(--color-primary)]" />
                        Knowledge Hub
                    </h2>
                    <button
                        onClick={() => setShowNoteInput(!showNoteInput)}
                        className="p-1 rounded hover:bg-[var(--color-bg-dark)] text-[var(--color-text-secondary)] transition-colors"
                        title="Criar Nota"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {showNoteInput && (
                    <form onSubmit={handleAddNote} className="mb-3 p-2 bg-[var(--color-bg-dark)] rounded border border-[var(--color-border)] animate-fadeIn">
                        <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder={`Adicionar nota sobre "${query || '...'}"`}
                            className="w-full bg-[var(--color-bg-light)] text-[var(--color-text-primary)] p-2 rounded text-xs focus:ring-1 focus:ring-[var(--color-primary)] outline-none resize-none mb-2"
                            rows={3}
                        />
                        <div className="flex justify-between items-center">
                            <button
                                type="button"
                                onClick={() => setIsPublic(!isPublic)}
                                className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded border ${isPublic ? 'border-green-800 text-green-400 bg-green-900/20' : 'border-slate-600 text-slate-400'}`}
                            >
                                {isPublic ? <><Unlock className="w-3 h-3" /> Público</> : <><Lock className="w-3 h-3" /> Privado</>}
                            </button>
                            <button type="submit" className="text-[10px] bg-[var(--color-primary)] text-white px-3 py-1 rounded hover:opacity-90">
                                Salvar
                            </button>
                        </div>
                    </form>
                )}

                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Pesquise por termo clínico..."
                        className="w-full pl-9 pr-3 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all placeholder-[var(--color-text-secondary)] text-[var(--color-text-primary)] text-xs"
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--color-text-secondary)]" />
                </form>
                {isLoading && <div className="h-1 w-full bg-[var(--color-primary)] mt-2 animate-pulse rounded"></div>}
            </div>

            {/* Gadgets Container */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-[var(--color-bg-dark)] custom-scrollbar">

                {/* Wikipedia Card (Top Context) */}
                {wikiResults.length > 0 && (
                    <div className="mb-4">
                        {wikiResults.map(wiki => (
                            <WikipediaCard key={wiki.id} wiki={wiki} />
                        ))}
                    </div>
                )}


                {/* Interaction Alerts (Top Priority) */}
                {interactionResults.length > 0 && (
                    <div className="mb-4">
                        {interactionResults.map(inter => (
                            <InteractionAlert key={inter.id} interaction={inter} />
                        ))}
                    </div>
                )}

                {/* Drug Monographs */}
                {drugResults.length > 0 && (
                    <div className="mb-4">
                        {drugResults.map(drug => (
                            <DrugMonographCard key={drug.id} drug={drug} />
                        ))}
                    </div>
                )}

                {/* Gadget: Community Notes */}
                {notes.length > 0 && (
                    <GadgetBox title="Notas da Comunidade" icon={<PenTool className="w-4 h-4 text-yellow-500" />} source="Health Guardian">
                        <div className="space-y-2">
                            {notes.map(note => (
                                <div key={note.id} className="p-2 bg-[var(--color-bg-light)] rounded border border-[var(--color-border)] relative group">
                                    <p className="text-xs text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed">{note.text}</p>
                                    <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-[var(--color-border)] opacity-70">
                                        <span className="text-[10px] items-center flex gap-1">
                                            {note.isPublic ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                                            {note.author}
                                        </span>
                                        <span className="text-[9px]">{new Date(note.timestamp).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GadgetBox>
                )}

                {/* Gadget: Diagnostics (ICD) */}
                {diagnosticResults.length > 0 && (
                    <GadgetBox title="Diagnósticos (ICD-10/11)" icon={<Activity className="w-4 h-4 text-emerald-500" />} source="NLM / OMS">
                        <ul className="space-y-2">
                            {diagnosticResults.map((d) => (
                                <li key={d.code} className="p-2 bg-[var(--color-bg-light)] rounded border border-[var(--color-border)]">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs text-[var(--color-text-primary)] font-bold">{d.title}</span>
                                        <span className="text-[10px] bg-[var(--color-bg-dark)] text-[var(--color-text-secondary)] px-1.5 py-0.5 rounded border border-[var(--color-border)] font-mono shrink-0 ml-2">{d.code}</span>
                                    </div>
                                    <p className="text-[10px] text-[var(--color-text-secondary)] italic">{d.definition}</p>
                                </li>
                            ))}
                        </ul>
                    </GadgetBox>
                )}

                {/* Gadget: Literature (PubMed + Semantic) */}
                {(pubmedResults.length > 0 || paperResults.length > 0) && (
                    <GadgetBox title="Literatura Médica" icon={<BookOpen className="w-4 h-4 text-purple-500" />} source="PubMed / Semantic">
                        <div className="space-y-3">
                            {/* PubMed Section */}
                            {pubmedResults.length > 0 && (
                                <div className="space-y-2">
                                    {pubmedResults.map(p => (
                                        <div key={p.id} className="p-2 bg-[var(--color-bg-light)] border-l-2 border-blue-500 rounded-r text-xs">
                                            <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-400 hover:underline line-clamp-2 block mb-1">
                                                {p.title} <ExternalLink className="w-2 h-2 inline ml-1" />
                                            </a>
                                            <p className="text-[var(--color-text-secondary)] text-[10px]">{p.authors} • {p.journal} • {p.pubdate.split(' ')[0]}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Divider */}
                            {pubmedResults.length > 0 && paperResults.length > 0 && <div className="h-px bg-[var(--color-border)]" />}

                            {/* Semantic Scholar Section */}
                            {paperResults.map(p => (
                                <div key={p.id} className="p-2 bg-[var(--color-bg-light)] border-l-2 border-purple-500 rounded-r text-xs">
                                    <h4 className="font-semibold text-[var(--color-text-primary)] line-clamp-2">{p.title}</h4>
                                    <p className="text-[var(--color-text-secondary)] text-[10px] mt-1">{p.authors} • {p.year}</p>
                                </div>
                            ))}
                        </div>
                    </GadgetBox>
                )}



                {!isLoading && !query && notes.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-[var(--color-text-muted)] space-y-4">
                        <Database className="w-12 h-12 opacity-20" />
                        <p className="text-xs">Digite um termo clínico, nome de droga ou condição para pesquisar em múltiplas bases de dados.</p>
                    </div>
                )}

            </div>
        </div>
    );
};

// -- Reusable Gadget Component --
const GadgetBox: React.FC<{ title: string, icon: React.ReactNode, source: string, children: React.ReactNode }> = ({ title, icon, source, children }) => (
    <div className="bg-[var(--color-theme-surface)] rounded-lg border border-[var(--color-border)] shadow-sm overflow-hidden animate-fadeIn">
        <div className="bg-[var(--color-bg-light)] px-3 py-2 border-b border-[var(--color-border)] flex justify-between items-center">
            <h3 className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-2 uppercase tracking-wide">
                {icon} {title}
            </h3>
            <span className="text-[9px] bg-[var(--color-bg-dark)] text-[var(--color-text-secondary)] px-1.5 py-0.5 rounded border border-[var(--color-border)]">{source}</span>
        </div>
        <div className="p-2">
            {children}
        </div>
    </div>
);

export default KnowledgeSidebar;
