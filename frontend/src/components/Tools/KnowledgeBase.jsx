import { useState, useEffect } from 'react';
import { useKnowledgeSearch } from '../../hooks/useKnowledgeSearch';
import { Badge } from '../ui/badge';
import SidebarItem from '../ui/SidebarItem';
import {
  BookOpen,
  Pill,
  Search,
  ThumbsUp,
  MessageSquare,
  Bookmark,
  AlertTriangle,
  ExternalLink,
  Activity,
  Globe,
  PenTool,
  Plus,
  Lock,
  Unlock
} from 'lucide-react';

/**
 * KnowledgeBase component - Base de conhecimento médico conectada a múltiplas APIs
 * 
 * @component
 * Integra com: 
 * - hooks/useKnowledgeSearch.ts (Backend for Frontend Proxy)
 * - server/src/index.ts (OpenFDA, Semantic Scholar, PubMed, RxNav, ICD, Wikipedia)
 */
const KnowledgeBase = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isPublicNote, setIsPublicNote] = useState(true);
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('hg_knowledge_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Erro ao ler favoritos:', e);
      return [];
    }
  });

  // Updated hook with all new data sources
  const {
    drugResults,
    paperResults,
    interactionResults,
    diagnosticResults,
    pubmedResults,
    wikiResults,
    notes,
    isLoading,
    searchKnowledge,
    addNote
  } = useKnowledgeSearch();

  useEffect(() => {
    console.log('KnowledgeBase mounted - Full Integration');
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchKnowledge(searchQuery);
      setExpandedItems(new Set());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    await addNote(noteText, isPublicNote, 'Eu (Você)', searchQuery);
    setNoteText('');
    setShowNoteInput(false);
  };

  const toggleExpand = (id) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleFavorite = (e, item) => {
    e.stopPropagation();
    setFavorites(prev => {
      const isFav = prev.some(f => f.id === item.id);
      let newFavs;
      if (isFav) {
        newFavs = prev.filter(f => f.id !== item.id);
      } else {
        newFavs = [...prev, item];
      }
      localStorage.setItem('hg_knowledge_favorites', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const isFavorite = (id) => favorites.some(f => f.id === id);

  // Social actions component
  const SocialActions = ({ item }) => {
    const isFav = isFavorite(item.id);
    return (
      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-700/30">
        <button
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-teal-400 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ThumbsUp size={12} />
          <span>{item.community_votes || 0}</span>
        </button>
        <button
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-400 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <MessageSquare size={12} />
          <span>{item.comments?.length || 0}</span>
        </button>
        <button
          className={`flex items-center gap-1 text-xs transition-colors ml-auto ${isFav ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
            }`}
          onClick={(e) => toggleFavorite(e, item)}
        >
          <Bookmark size={12} fill={isFav ? "currentColor" : "none"} />
          <span>{isFav ? 'Salvo' : 'Salvar'}</span>
        </button>
      </div>
    );
  };

  // Check if we have any results at all
  const hasAnyResults = drugResults.length > 0 || paperResults.length > 0 ||
    interactionResults.length > 0 || diagnosticResults.length > 0 ||
    pubmedResults.length > 0 || wikiResults.length > 0 || notes.length > 0;

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header with Create Note Button */}
      <div className="flex justify-between items-start">
        <p className="text-gray-300 text-sm">
          Pesquise medicamentos e artigos científicos em tempo real.
        </p>
        <button
          onClick={() => setShowNoteInput(!showNoteInput)}
          className="p-1.5 rounded hover:bg-theme-card text-gray-400 hover:text-teal-400 transition-colors"
          title="Criar Nota"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Note Creation Form */}
      {showNoteInput && (
        <form onSubmit={handleAddNote} className="p-3 bg-theme-card rounded-lg border border-gray-700 space-y-2 animate-fadeIn">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={`Adicionar nota sobre "${searchQuery || '...'}"`}
            className="w-full bg-theme-background text-white p-2 rounded text-sm focus:ring-1 focus:ring-teal-500 outline-none resize-none border border-gray-700"
            rows={3}
          />
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setIsPublicNote(!isPublicNote)}
              className={`text-xs flex items-center gap-1 px-2 py-1 rounded border transition-colors ${isPublicNote
                  ? 'border-green-800 text-green-400 bg-green-900/20'
                  : 'border-gray-600 text-gray-400'
                }`}
            >
              {isPublicNote ? <><Unlock size={12} /> Público</> : <><Lock size={12} /> Privado</>}
            </button>
            <button
              type="submit"
              className="text-xs bg-teal-600 text-white px-3 py-1 rounded hover:bg-teal-500 transition-colors"
            >
              Salvar Nota
            </button>
          </div>
        </form>
      )}

      {/* Search Input */}
      <div className="relative shrink-0">
        <input
          type="text"
          placeholder="Ex: Metformina, Diabetes, Warfarin..."
          className="w-full pl-9 pr-4 py-2 bg-theme-card border border-theme-border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleSearch}
          className="absolute left-3 top-2.5 text-gray-400 hover:text-white transition-colors"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="h-1 w-full bg-teal-500 animate-pulse rounded"></div>
      )}

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">

        {/* Empty State */}
        {!isLoading && !hasAnyResults && (
          <div className="text-center py-10 text-gray-500 flex flex-col items-center">
            <div className="bg-theme-card/50 p-4 rounded-full mb-3">
              <BookOpen className="h-8 w-8 opacity-40 text-teal-500" />
            </div>
            <p className="text-sm font-medium text-gray-300">Base de Conhecimento</p>
            <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
              Digite um termo para buscar em OpenFDA, PubMed, Wikipedia, ICD-10 e mais.
            </p>
            <div className="flex flex-wrap gap-1 justify-center mt-4 opacity-60">
              <Badge variant="outline" className="text-[10px]">FDA</Badge>
              <Badge variant="outline" className="text-[10px]">PubMed</Badge>
              <Badge variant="outline" className="text-[10px]">Wikipedia</Badge>
              <Badge variant="outline" className="text-[10px]">ICD-10</Badge>
              <Badge variant="outline" className="text-[10px]">RxNav</Badge>
            </div>
          </div>
        )}

        {/* Community Notes */}
        {notes.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-2 sticky top-0 bg-theme-background/95 backdrop-blur py-2 z-10">
              <PenTool size={14} /> Notas da Comunidade
              <Badge variant="outline" className="text-[9px] ml-auto border-gray-700">Health Guardian</Badge>
            </h3>
            {notes.map(note => (
              <div key={note.id} className="p-3 bg-theme-card border border-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-200 whitespace-pre-wrap">{note.text}</p>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-700/30 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    {note.isPublic ? <Globe size={10} /> : <Lock size={10} />}
                    {note.author}
                  </span>
                  <span>{new Date(note.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Wikipedia (Encyclopedia) */}
        {wikiResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 sticky top-0 bg-theme-background/95 backdrop-blur py-2 z-10">
              <Globe size={14} /> Enciclopédia
              <Badge variant="outline" className="text-[9px] ml-auto border-gray-700">Wikipedia</Badge>
            </h3>
            {wikiResults.map(wiki => (
              <div key={wiki.id} className="p-3 bg-theme-card border border-gray-700/50 rounded-lg hover:border-cyan-500/30 transition-colors">
                <a
                  href={wiki.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-cyan-400 hover:underline text-sm block mb-1"
                >
                  {wiki.title} <ExternalLink size={10} className="inline ml-1" />
                </a>
                <p className="text-xs text-gray-400 leading-relaxed">{wiki.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* ICD-10 Diagnostics */}
        {diagnosticResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2 sticky top-0 bg-theme-background/95 backdrop-blur py-2 z-10">
              <Activity size={14} /> Diagnósticos (ICD-10)
              <Badge variant="outline" className="text-[9px] ml-auto border-gray-700">NLM</Badge>
            </h3>
            <div className="space-y-2">
              {diagnosticResults.map(d => (
                <div key={d.code} className="flex justify-between items-center p-2 bg-theme-card border border-gray-700/50 rounded-lg">
                  <span className="text-sm text-gray-200 truncate max-w-[70%]">{d.name}</span>
                  <Badge className="bg-emerald-900/30 text-emerald-400 border-emerald-800 font-mono text-[10px]">
                    {d.code}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drug Interactions (RxNav) */}
        {interactionResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 sticky top-0 bg-theme-background/95 backdrop-blur py-2 z-10">
              <AlertTriangle size={14} /> Interações Medicamentosas
              <Badge variant="outline" className="text-[9px] ml-auto border-gray-700">RxNav</Badge>
            </h3>
            {interactionResults.map(inter => (
              <div key={inter.id} className="p-3 bg-amber-900/10 border border-amber-700/30 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-amber-500 text-sm">{inter.drug_b}</span>
                  <Badge className="bg-amber-900/50 text-amber-300 border-amber-700 text-[10px] uppercase">
                    {inter.severity || 'Info'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{inter.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Pharmacology (OpenFDA) */}
        {drugResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2 sticky top-0 bg-theme-background/95 backdrop-blur py-2 z-10">
              <Pill size={14} /> Segurança Farmacológica
              <Badge variant="outline" className="text-[9px] ml-auto border-gray-700">OpenFDA</Badge>
            </h3>

            {drugResults.map(drug => {
              const isExpanded = expandedItems.has(drug.id);
              return (
                <SidebarItem
                  key={drug.id}
                  title={drug.brand_name}
                  subtitle={drug.generic_name}
                  isActive={isExpanded}
                  onClick={() => toggleExpand(drug.id)}
                  className="bg-theme-card border border-gray-700/50 hover:border-teal-500/30 transition-all duration-200"
                >
                  <div className="mt-2 space-y-2">
                    <p className={`text-xs text-gray-400 ${isExpanded ? '' : 'line-clamp-2'}`}>
                      {drug.description}
                    </p>

                    {drug.warnings && drug.warnings !== 'No specific warnings' && (
                      <div className="bg-red-900/10 border border-red-900/30 rounded p-2 flex gap-2 items-start">
                        <AlertTriangle size={12} className="text-red-400 shrink-0 mt-0.5" />
                        <p className={`text-[10px] text-red-300 ${isExpanded ? '' : 'line-clamp-2'}`}>
                          {drug.warnings}
                        </p>
                      </div>
                    )}

                    {isExpanded && (
                      <div className="pt-2 space-y-2 border-t border-gray-800 mt-2">
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <span className="text-gray-500 block">Fabricante</span>
                            <span className="text-gray-300">{drug.manufacturer}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1 mt-1">
                      {!isExpanded && (
                        <Badge variant="outline" className="text-[10px] border-gray-700 text-gray-400">
                          {drug.manufacturer?.slice(0, 15)}...
                        </Badge>
                      )}
                    </div>

                    <SocialActions item={drug} />
                  </div>
                </SidebarItem>
              );
            })}
          </div>
        )}

        {/* Medical Literature (PubMed + Semantic Scholar) */}
        {(pubmedResults.length > 0 || paperResults.length > 0) && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2 sticky top-0 bg-theme-background/95 backdrop-blur py-2 z-10">
              <BookOpen size={14} /> Evidências Científicas
              <Badge variant="outline" className="text-[9px] ml-auto border-gray-700">PubMed / Semantic</Badge>
            </h3>

            {/* PubMed Results */}
            {pubmedResults.map(p => (
              <div key={p.id} className="p-3 bg-theme-card border-l-2 border-blue-500 rounded-r-lg">
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-400 hover:underline text-sm block mb-1"
                >
                  {p.title} <ExternalLink size={10} className="inline ml-1" />
                </a>
                <p className="text-[10px] text-gray-500">
                  {p.authors} • {p.journal} • {p.pubdate?.split(' ')[0]}
                </p>
              </div>
            ))}

            {/* Semantic Scholar Results */}
            {paperResults.map(paper => {
              const isExpanded = expandedItems.has(paper.id);
              return (
                <SidebarItem
                  key={paper.id}
                  title={paper.title}
                  subtitle={`${paper.authors} • ${paper.year}`}
                  isActive={isExpanded}
                  onClick={() => toggleExpand(paper.id)}
                  className="bg-theme-card border border-gray-700/50 hover:border-blue-500/30 transition-all duration-200"
                >
                  <div className="mt-2 space-y-2">
                    <p className={`text-xs text-gray-400 italic ${isExpanded ? '' : 'line-clamp-3'}`}>
                      "{paper.abstract}"
                    </p>

                    {paper.url && (
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:underline w-fit mt-1"
                      >
                        Ler artigo completo <ExternalLink size={10} />
                      </a>
                    )}

                    <SocialActions item={paper} />
                  </div>
                </SidebarItem>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;