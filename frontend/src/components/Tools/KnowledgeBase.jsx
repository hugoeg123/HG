import { useState, useEffect } from 'react';
import { useKnowledgeSearch } from '../../hooks/useKnowledgeSearch';
import { DrugMonographCard } from '../../components/DrugMonographCard';
import { WikipediaCard } from '../../components/WikipediaCard';
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
  Unlock,
  Trash2,
  Edit,
  X,
  Check,
  Star,
  ChevronRight,
  Send
} from 'lucide-react';

/**
 * KnowledgeBase component - Base de conhecimento médico conectada a múltiplas APIs
 * 
 * @component
 * 
 * ## Integration Map
 * - **Hooks**: 
 *   - `useKnowledgeSearch` (hooks/useKnowledgeSearch.ts) for data fetching
 * - **Services**:
 *   - Connects to Backend Knowledge API for Note CRUD
 * - **Components**:
 *   - `DrugMonographCard`, `WikipediaCard`, `Badge`
 * - **Data Flow**:
 *   - Search input -> useKnowledgeSearch -> Backend Proxy/API
 *   - Note actions (Create/Edit/Delete) -> useKnowledgeSearch -> Backend API
 */
const KnowledgeBase = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isPublicNote, setIsPublicNote] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [editingNotePublic, setEditingNotePublic] = useState(false);
  
  // State for My Notes Carousel
  const [showAllMyNotes, setShowAllMyNotes] = useState(false);
  
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
    isSaving,
    searchKnowledge,
    addNote,
    updateNote,
    deleteNote,
    rateNote,
    addComment,
    getComments
  } = useKnowledgeSearch();

  // States for Comments
  const [activeCommentNoteId, setActiveCommentNoteId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [loadedComments, setLoadedComments] = useState({});
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  useEffect(() => {
    console.log('KnowledgeBase mounted - Full Integration');
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setExpandedItems(new Set());
      searchKnowledge(searchQuery);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      console.log('KnowledgeBase query changed:', searchQuery);
    }
  }, [searchQuery]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    
    const success = await addNote(noteText, isPublicNote, 'Eu (Você)', searchQuery);
    
    if (success) {
      setNoteText('');
      setShowNoteInput(false);
    } else {
      alert('Erro ao salvar nota. Tente novamente.');
    }
  };

  const handleStartEditing = (note) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.text);
    setEditingNotePublic(note.isPublic);
  };

  const handleCancelEditing = () => {
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const handleSaveEdit = async () => {
    if (editingNoteText.trim()) {
      await updateNote(editingNoteId, editingNoteText, editingNotePublic);
      handleCancelEditing();
    }
  };

  const handleDeleteNote = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta nota?')) {
      await deleteNote(id);
    }
  };
  
  const handleRateNote = async (id, rating) => {
    try {
      await rateNote(id, rating);
    } catch (e) {
      alert('Erro ao avaliar nota');
    }
  };

  const handleOpenComments = async (id) => {
    if (activeCommentNoteId === id) {
      setActiveCommentNoteId(null);
      return;
    }
    
    setActiveCommentNoteId(id);
    setIsLoadingComments(true);
    try {
      const comments = await getComments(id);
      setLoadedComments(prev => ({ ...prev, [id]: comments }));
    } catch (e) {
      console.error('Erro ao carregar comentários', e);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSubmitComment = async (id) => {
    if (!commentText.trim()) return;
    
    try {
      const newComment = await addComment(id, commentText);
      setLoadedComments(prev => ({
        ...prev,
        [id]: [...(prev[id] || []), newComment]
      }));
      setCommentText('');
    } catch (e) {
      alert('Erro ao enviar comentário');
    }
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
    const [showRating, setShowRating] = useState(false);
    
    return (
      <div className="flex flex-col mt-3 pt-2 border-t border-gray-700/30">
        <div className="flex items-center gap-3">
            <div className="relative" onMouseEnter={() => setShowRating(true)} onMouseLeave={() => setShowRating(false)}>
                 <button
                  className={`flex items-center gap-1 text-xs transition-colors ${item.community_votes > 0 ? 'text-teal-400' : 'text-gray-400 hover:text-teal-400'}`}
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  <ThumbsUp size={12} />
                  <span>{item.community_votes || (item.rating ? item.rating : 0)}</span>
                </button>
                
                {showRating && (
                    <div className="absolute bottom-full left-0 mb-1 flex bg-black/90 p-1.5 rounded-lg gap-1 border border-gray-700 shadow-xl z-20">
                        {[1,2,3,4,5].map(star => (
                            <button 
                                key={star}
                                onClick={(e) => { e.stopPropagation(); handleRateNote(item.id, star); }}
                                className="text-gray-400 hover:text-yellow-500 hover:scale-125 transition-all"
                                title={`Avaliar ${star} estrelas`}
                            >
                                <Star size={12} fill="currentColor" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <button
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-400 transition-colors"
              onClick={(e) => { e.stopPropagation(); handleOpenComments(item.id); }}
            >
              <MessageSquare size={12} />
              <span>{item.comments_count || item.comments?.length || 0}</span>
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
        
        {/* Comments Section */}
        {activeCommentNoteId === item.id && (
            <div className="mt-3 space-y-2 animate-fadeIn bg-black/20 p-2 rounded" onClick={e => e.stopPropagation()}>
                <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                    {isLoadingComments ? (
                        <p className="text-xs text-gray-500 text-center py-2">Carregando comentários...</p>
                    ) : (loadedComments[item.id] || []).length === 0 ? (
                        <p className="text-xs text-gray-500 italic text-center py-2">Seja o primeiro a comentar.</p>
                    ) : (
                        (loadedComments[item.id] || []).map(comment => (
                            <div key={comment.id} className="bg-gray-800/50 p-2 rounded text-xs border border-gray-700/50">
                                <div className="flex justify-between text-gray-500 mb-1">
                                    <span className="font-bold text-gray-400">{comment.author_name}</span>
                                    <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                            </div>
                        ))
                    )}
                </div>
                <div className="flex gap-2 pt-1">
                    <input 
                        type="text" 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Escreva um comentário..."
                        className="flex-1 bg-gray-900/50 border border-gray-700 rounded px-2 py-1.5 text-xs focus:border-teal-500 outline-none transition-colors text-white"
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment(item.id)}
                    />
                    <button 
                        onClick={() => handleSubmitComment(item.id)}
                        className="p-1.5 bg-teal-600/20 text-teal-400 rounded hover:bg-teal-600/40 transition-colors"
                        disabled={!commentText.trim()}
                    >
                        <Send size={12} />
                    </button>
                </div>
            </div>
        )}
      </div>
    );
  };

  // Check if we have any results at all
  const hasAnyResults = drugResults.length > 0 || paperResults.length > 0 ||
    interactionResults.length > 0 || diagnosticResults.length > 0 ||
    pubmedResults.length > 0 || wikiResults.length > 0 || notes.length > 0;
    
  // Filter my notes for carousel
  const myNotes = notes.filter(n => n.isOwner);

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
            autoFocus
            disabled={isSaving}
          />
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setIsPublicNote(!isPublicNote)}
              className={`text-xs flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
                isPublicNote 
                  ? 'border-blue-500 bg-blue-600/10 text-blue-400 dark:border-teal-500 dark:bg-teal-600/20 dark:text-teal-300' 
                  : 'border-gray-600 text-gray-400'
              }`}
              disabled={isSaving}
            >
              {isPublicNote ? <Globe size={12} /> : <Lock size={12} />}
              {isPublicNote ? 'Público' : 'Privado'}
            </button>
            <button
              type="submit"
              disabled={!noteText.trim() || isSaving}
              className={`px-3 py-1 bg-teal-600 text-white text-xs rounded hover:bg-teal-700 transition-colors flex items-center gap-1 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Nota'
              )}
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
      
      {/* My Notes Carousel (Only when search is empty or explicitly shown) */}
      {myNotes.length > 0 && !searchQuery && (
        <div className="mt-2 mb-2 animate-fadeIn">
            <div className="flex justify-between items-center mb-2 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
                <Bookmark size={14} /> Minhas Notas
            </h3>
            <button 
                onClick={() => setShowAllMyNotes(!showAllMyNotes)}
                className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1"
            >
                {showAllMyNotes ? 'Ver menos' : 'Ver todas'} <ChevronRight size={10} className={`transform transition-transform ${showAllMyNotes ? 'rotate-90' : ''}`} />
            </button>
            </div>
            
            <div className={`flex gap-3 overflow-x-auto pb-2 custom-scrollbar snap-x ${showAllMyNotes ? 'flex-wrap overflow-x-hidden' : ''}`}>
            {myNotes.map(note => (
                <div key={note.id} className={`min-w-[200px] w-[200px] bg-theme-card border border-gray-700/50 rounded-lg p-3 snap-start hover:border-teal-500/50 transition-colors cursor-pointer group relative flex flex-col justify-between ${showAllMyNotes ? 'mb-2' : ''}`}>
                    <div>
                        {/* Note Content Preview */}
                        <p className="text-xs text-gray-300 line-clamp-3 mb-2 whitespace-pre-wrap font-mono">{note.text}</p>
                    </div>
                    {/* Footer */}
                    <div className="flex justify-between items-center text-[10px] text-gray-500 mt-2">
                        <span>{new Date(note.timestamp).toLocaleDateString()}</span>
                        <div className="flex items-center gap-2">
                            {note.community_votes > 0 && (
                                <span className="flex items-center text-yellow-500">
                                    <Star size={8} fill="currentColor" /> {note.community_votes}
                                </span>
                            )}
                            {note.isPublic ? <Globe size={10} className="text-blue-400" /> : <Lock size={10} className="text-gray-400" />}
                        </div>
                    </div>
                    
                    {/* Hover Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-black/50 rounded p-1 backdrop-blur-sm">
                        <button onClick={(e) => { e.stopPropagation(); handleStartEditing(note); }} className="hover:text-blue-400 p-0.5">
                            <Edit size={12} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }} className="hover:text-red-400 p-0.5">
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>
            ))}
            </div>
        </div>
      )}

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

        {/* Wikipedia (Top Summary) */}
        {wikiResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2 sticky top-0 bg-theme-background/95 backdrop-blur py-2 z-10">
              <Globe size={14} /> Enciclopédia
              <Badge variant="outline" className="text-[9px] ml-auto border-gray-700">Wikipedia</Badge>
            </h3>
            {wikiResults.map(wiki => (
              <WikipediaCard key={wiki.id} wiki={wiki} />
            ))}
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
              <div key={note.id} className="p-3 bg-theme-card border border-gray-700/50 rounded-lg group">
                {editingNoteId === note.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingNoteText}
                      onChange={(e) => setEditingNoteText(e.target.value)}
                      className="w-full text-sm bg-theme-bg-dark border border-theme-border rounded p-2 focus:outline-none focus:border-theme-primary resize-none h-24"
                    />
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => setEditingNotePublic(!editingNotePublic)}
                        className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
                          editingNotePublic 
                            ? 'border-blue-500 bg-blue-600/10 text-blue-700 dark:border-teal-500 dark:bg-teal-600/20 dark:text-teal-300' 
                            : 'border-slate-600 text-slate-400'
                        }`}
                      >
                        {editingNotePublic ? <Globe size={10} /> : <Lock size={10} />}
                        {editingNotePublic ? 'Público' : 'Privado'}
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCancelEditing}
                          className="p-1 hover:bg-red-900/20 text-red-400 rounded transition-colors"
                          title="Cancelar"
                        >
                          <X size={14} />
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="p-1 hover:bg-green-900/20 text-green-400 rounded transition-colors"
                          title="Salvar"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-200 whitespace-pre-wrap">{note.text}</p>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-700/30 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        {note.isPublic ? <Globe size={10} /> : <Lock size={10} />}
                        {note.author}
                      </span>
                      <div className="flex items-center gap-3">
                        <span>{new Date(note.timestamp).toLocaleDateString()}</span>
                        
                        {note.isOwner && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleStartEditing(note)}
                              className="p-1 hover:bg-blue-900/20 text-blue-400 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1 hover:bg-red-900/20 text-red-400 rounded transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Social Actions */}
                    <SocialActions item={note} />
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Wikipedia section moved to top */}

        {/* ICD-10 Diagnostics */}
        {diagnosticResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2 sticky top-0 bg-theme-background/95 backdrop-blur py-2 z-10">
              <Activity size={14} /> Diagnósticos (ICD-10)
              <Badge variant="outline" className="text-[9px] ml-auto border-gray-700">NLM</Badge>
            </h3>
            <div className="space-y-2">
              {diagnosticResults.map(d => (
                <div key={d.code} className="p-2 bg-theme-card border border-gray-700/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-200 truncate max-w-[70%]">{d.title}</span>
                    <Badge className="bg-emerald-900/30 text-emerald-400 border-emerald-800">{d.code}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{d.definition}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Drug Results */}
        {drugResults.length > 0 && (
            <div className="space-y-3">
                 <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2 sticky top-0 bg-theme-background/95 backdrop-blur py-2 z-10">
                    <Pill size={14} /> Medicamentos
                    <Badge variant="outline" className="text-[9px] ml-auto border-gray-700">OpenFDA</Badge>
                </h3>
                {drugResults.map(drug => (
                    <DrugMonographCard key={drug.id} drug={drug} />
                ))}
            </div>
        )}

        {(pubmedResults.length > 0 || paperResults.length > 0) && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2 sticky top-0 bg-theme-background/95 backdrop-blur py-2 z-10">
              <BookOpen size={14} /> Evidências Científicas
              <Badge variant="outline" className="text-[9px] ml-auto border-gray-700">PUBMED / SEMANTIC</Badge>
            </h3>
            <div className="space-y-2">
              {pubmedResults.length > 0 && pubmedResults.map(p => (
                <div key={p.id} className="p-2 bg-theme-card border border-gray-700/50 rounded-lg">
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-teal-300 hover:underline flex items-center gap-1">
                    {p.title}
                    <ExternalLink size={12} className="opacity-60" />
                  </a>
                  <p className="text-[11px] text-gray-500">{p.authors} • {p.journal} • {p.pubdate.split(' ')[0]}</p>
                </div>
              ))}

              {paperResults.length > 0 && paperResults.map(p => (
                <div key={p.id} className="p-2 bg-theme-card border border-gray-700/50 rounded-lg">
                  <div className="text-sm font-semibold text-gray-200">{p.title}</div>
                  <p className="text-[11px] text-gray-500">{p.authors} • {p.year}</p>
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-teal-300 hover:underline flex items-center gap-1">
                      Abrir
                      <ExternalLink size={12} className="opacity-60" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default KnowledgeBase;
