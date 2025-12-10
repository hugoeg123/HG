import { useState, useCallback } from 'react';
// @ts-ignore
import api from '../services/api';

// Types for our results
export interface DrugResult {
    id: string;
    brand_name: string;
    generic_name: string;
    manufacturer: string;
    description: string;
    warnings: string;
    // New fields
    boxed_warning?: string;
    indications?: string;
    mechanism?: string;
    contraindications?: string;
    adverse_reactions?: string;

    community_votes: number;
    comments: string[];
}

export interface PaperResult {
    id: string;
    title: string;
    year: number;
    authors: string;
    abstract: string;
    url: string;
    community_votes: number;
    comments: string[];
}

export interface InteractionResult {
    id: string;
    description: string;
    severity: string;
    drug_b: string;
    drug_a?: string;
    source?: string;
}

export interface DiagnosticResult {
    code: string;
    title: string; // Changed from name
    definition: string;
    source: string;
}

export interface PubMedResult {
    id: string;
    title: string;
    authors: string;
    journal: string;
    pubdate: string;
    url: string;
}

export interface WikiResult {
    id: string;
    title: string;
    description: string;
    url: string;
    thumbnail?: string;
    source: string;
}

export interface NoteResult {
    id: string;
    text: string;
    author: string;
    isPublic: boolean;
    timestamp: number;
    relatedTerm?: string;
    isOwner?: boolean;
    community_votes?: number;
    votes_count?: number;
    comments_count?: number;
}

interface UseKnowledgeSearchReturn {
    drugResults: DrugResult[];
    paperResults: PaperResult[];
    interactionResults: InteractionResult[];
    diagnosticResults: DiagnosticResult[];
    pubmedResults: PubMedResult[];
    wikiResults: WikiResult[];
    notes: NoteResult[];
    isLoading: boolean;
    isSaving: boolean;
    searchKnowledge: (query: string) => void;
    addNote: (text: string, isPublic: boolean, author: string, relatedTerm: string) => Promise<boolean>;
    updateNote: (id: string, text: string, isPublic: boolean) => Promise<void>;
    deleteNote: (id: string) => Promise<void>;
    rateNote: (id: string, rating: number) => Promise<any>;
    addComment: (id: string, content: string) => Promise<any>;
    getComments: (id: string) => Promise<any[]>;
    clearResults: () => void;
}

export const useKnowledgeSearch = (): UseKnowledgeSearchReturn => {
    const [drugResults, setDrugResults] = useState<DrugResult[]>([]);
    const [paperResults, setPaperResults] = useState<PaperResult[]>([]);
    const [interactionResults, setInteractionResults] = useState<InteractionResult[]>([]);
    const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
    const [pubmedResults, setPubmedResults] = useState<PubMedResult[]>([]);
    const [wikiResults, setWikiResults] = useState<WikiResult[]>([]);
    const [notes, setNotes] = useState<NoteResult[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Initial fetch for notes (feed)
    useState(() => { // Using lazy state initialization-like effect or simple useEffect
        const fetchInitialNotes = async () => {
            try {
                const res = await api.get('/knowledge/notes');
                setNotes(res.data.results || []);
            } catch (err) {
                console.error('Error fetching initial notes:', err);
            }
        };
        fetchInitialNotes();
    });

    const clearResults = useCallback(() => {
        setDrugResults([]);
        setPaperResults([]);
        setInteractionResults([]);
        setDiagnosticResults([]);
        setPubmedResults([]);
        setWikiResults([]);
        // setNotes([]); // Don't clear notes on simple clear, only on new search
    }, []);

    const searchKnowledge = async (searchInfo: string) => {
        console.log('searchKnowledge triggered manually:', searchInfo);
        setIsLoading(true);

        // If empty query, we clear external results but keep/fetch notes
        if (!searchInfo.trim()) {
            setDrugResults([]);
            setPaperResults([]);
            setInteractionResults([]);
            setDiagnosticResults([]);
            setPubmedResults([]);
            setWikiResults([]);

            try {
                // Only fetch notes when query is empty
                const res = await api.get('/knowledge/notes');
                setNotes(res.data.results || []);
            } catch (err: any) {
                console.error('Error fetching notes:', err);
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // If we have a query, clear everything before new search
        clearResults();

        const encodedQuery = encodeURIComponent(searchInfo);

        try {
            // --- Phase 1: Drugs (OpenFDA) & Discovery ---
            // We search drugs first to try and find the English Generic Name
            // This is crucial for PubMed/Semantic Scholar which work best with English terms
            let englishSearchTerm = searchInfo;

            // 1a. Dictionary Lookup (Fastest & Most Reliable for common PT terms)
            const COMMON_TRANSLATIONS: Record<string, string> = {
                'dipirona': 'dipyrone',
                'metformina': 'metformin',
                'paracetamol': 'acetaminophen',
                'amoxicilina': 'amoxicillin',
                'ibuprofeno': 'ibuprofen',
                'omeprazol': 'omeprazole',
                'simvastatina': 'simvastatin',
                'losartana': 'losartan',
                'azitromicina': 'azithromycin',
                'clonazepam': 'clonazepam',
                'sertralina': 'sertraline',
                'fluoxetina': 'fluoxetine'
            };

            const lowerQuery = searchInfo.toLowerCase().trim();
            if (COMMON_TRANSLATIONS[lowerQuery]) {
                englishSearchTerm = COMMON_TRANSLATIONS[lowerQuery];
                console.log(`[Smart Chain] Dictionary translation: "${searchInfo}" -> "${englishSearchTerm}"`);
            }

            const drugsPromise = api.get(`/knowledge/drugs?query=${encodedQuery}`)
                .then((res: any) => {
                    const raw = res.data.results || [];
                    const uniqueMap = new Map();
                    raw.forEach((item: any) => {
                        const key = (item.brand_name || item.generic_name || '').toLowerCase().trim();
                        if (!uniqueMap.has(key)) {
                            uniqueMap.set(key, item);
                        }
                    });
                    const uniqueDrugs = Array.from(uniqueMap.values());
                    setDrugResults(uniqueDrugs as DrugResult[]);

                    // Smart Extraction: Try to find a valid English generic name
                    // Only override if we haven't found one via dictionary yet OR if the API result is high confidence
                    if (uniqueDrugs.length > 0) {
                        const bestMatch = uniqueDrugs[0] as DrugResult;
                        if (bestMatch.generic_name && bestMatch.generic_name !== 'Nome Genérico não disponível') {
                            // If we didn't use dictionary, take this one. 
                            // Or maybe trust the API more? Let's stick with dictionary as priority for simplicity/robustness for now.
                            if (englishSearchTerm === searchInfo) {
                                englishSearchTerm = bestMatch.generic_name;
                                console.log(`[Smart Chain] API found English term: "${englishSearchTerm}"`);
                            }
                        }
                    }
                })
                .catch((err: any) => {
                    console.error('Error fetching drugs:', err);
                    setDrugResults([]);
                });

            // Wait for Phase 1 to complete
            await drugsPromise;

            // --- Phase 2: Everything Else (Parallel) ---
            const encodedEnglishQuery = encodeURIComponent(englishSearchTerm);

            await Promise.allSettled([
                // 2. Papers (Semantic Scholar) - Use English Term
                api.get(`/knowledge/papers?query=${encodedEnglishQuery}`)
                    .then((res: any) => setPaperResults(res.data.results || []))
                    .catch((err: any) => {
                        if (err.response?.status === 429) console.warn('Semantic Scholar Rate Limit');
                        setPaperResults([]);
                    }),

                // 3. Interactions (RxNav)
                api.get(`/knowledge/interactions?query=${encodedQuery}`)
                    .then((res: any) => setInteractionResults(res.data.results || [])),

                // 4. Diagnostics (ICD-10)
                api.get(`/knowledge/icd?query=${encodedQuery}`)
                    .then((res: any) => setDiagnosticResults(res.data.results || [])),

                // 5. PubMed - Use English Term
                api.get(`/knowledge/pubmed?query=${encodedEnglishQuery}`)
                    .then((res: any) => setPubmedResults(res.data.results || []))
                    .catch((err: any) => {
                        if (err.response?.status === 429) console.warn('PubMed Rate Limit');
                        setPubmedResults([]);
                    }),

                // 6. Wikipedia
                api.get(`/knowledge/wikipedia?query=${encodedQuery}`)
                    .then((res: any) => setWikiResults(res.data.results || [])),

                // 7. Notes
                api.get(`/knowledge/notes?term=${encodedQuery}`)
                    .then((res: any) => setNotes(res.data.results || []))
                    .catch((err: any) => console.error('Error fetching notes:', err))
            ]);

        } catch (error) {
            console.error("Error fetching knowledge data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const addNote = useCallback(async (text: string, isPublic: boolean, author: string, relatedTerm: string) => {
        setIsSaving(true);
        try {
            const res = await api.post('/knowledge/notes', { text, isPublic, author, relatedTerm });
            const newNote = res.data;
            // Optimistic update
            setNotes((prev: any) => [newNote, ...prev]);
            return true;
        } catch (err: any) {
            console.error('Failed to add note', err);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, []);

    const updateNote = useCallback(async (id: string, text: string, isPublic: boolean) => {
        try {
            const res = await api.put(`/knowledge/notes/${id}`, { text, isPublic });
            const updatedNote = res.data;
            setNotes((prev: any) => prev.map((note: any) => note.id === id ? updatedNote : note));
        } catch (err: any) {
            console.error('Failed to update note', err);
        }
    }, []);

    const deleteNote = useCallback(async (id: string) => {
        try {
            await api.delete(`/knowledge/notes/${id}`);
            setNotes(prev => prev.filter(note => note.id !== id));
        } catch (err) {
            console.error('Failed to delete note', err);
        }
    }, []);

    const rateNote = useCallback(async (id: string, rating: number) => {
        try {
            const res = await api.post(`/knowledge/notes/${id}/rate`, { rating });
            // Update local state
            setNotes(prev => prev.map(n => {
                if (n.id === id) {
                    return { ...n, community_votes: res.data.average, votes_count: res.data.count };
                }
                return n;
            }));
            return res.data;
        } catch (error) {
            console.error('Error rating note:', error);
            throw error;
        }
    }, []);

    const addComment = useCallback(async (id: string, content: string) => {
        try {
            const res = await api.post(`/knowledge/notes/${id}/comments`, { content });
            // Update local state
            setNotes(prev => prev.map(n => {
                if (n.id === id) {
                    return { ...n, comments_count: (n.comments_count || 0) + 1 };
                }
                return n;
            }));
            return res.data;
        } catch (error) {
            console.error('Error commenting note:', error);
            throw error;
        }
    }, []);

    const getComments = useCallback(async (id: string) => {
        try {
            const res = await api.get(`/knowledge/notes/${id}/comments`);
            return res.data.results;
        } catch (error) {
            console.error('Error fetching comments:', error);
            return [];
        }
    }, []);

    return {
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
        getComments,
        clearResults
    };
};
