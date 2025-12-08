import { useState, useCallback, useEffect } from 'react';

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
    searchKnowledge: (query: string) => void;
    addNote: (text: string, isPublic: boolean, author: string, relatedTerm: string) => Promise<void>;
    clearResults: () => void;
}

export const useKnowledgeSearch = (query: string): UseKnowledgeSearchReturn => {
    const [drugResults, setDrugResults] = useState<DrugResult[]>([]);
    const [paperResults, setPaperResults] = useState<PaperResult[]>([]);
    const [interactionResults, setInteractionResults] = useState<InteractionResult[]>([]);
    const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
    const [pubmedResults, setPubmedResults] = useState<PubMedResult[]>([]);
    const [wikiResults, setWikiResults] = useState<WikiResult[]>([]);
    const [notes, setNotes] = useState<NoteResult[]>([]);

    const [isLoading, setIsLoading] = useState(false);

    // Use the local proxy URL
    const PROXY_URL = 'http://localhost:3001/api/knowledge';

    const clearResults = useCallback(() => {
        setDrugResults([]);
        setPaperResults([]);
        setInteractionResults([]);
        setDiagnosticResults([]);
        setPubmedResults([]);
        setWikiResults([]);
        setNotes([]);
    }, []);

    // Debounce Logic
    useEffect(() => {
        const handler = setTimeout(() => {
            if (query && query.trim() !== '') {
                console.log('useKnowledgeSearch start', query);
                fetchData(query);
            } else {
                clearResults();
            }
        }, 800); // 800ms debounce

        return () => clearTimeout(handler);
    }, [query, clearResults]);

    const fetchData = async (searchInfo: string) => {
        setIsLoading(true);
        clearResults();

        const encodedQuery = encodeURIComponent(searchInfo);

        try {
            // Fire all requests in parallel
            await Promise.allSettled([
                // 1. Drugs (OpenFDA)
                fetch(`${PROXY_URL}/drugs?query=${encodedQuery}`)
                    .then(res => res.json())
                    .then(data => setDrugResults(data.results || [])),

                // 2. Papers (Semantic Scholar)
                fetch(`${PROXY_URL}/papers?query=${encodedQuery}`)
                    .then(res => res.json())
                    .then(data => setPaperResults(data.results || [])),

                // 3. Interactions (RxNav)
                fetch(`${PROXY_URL}/interactions?query=${encodedQuery}`)
                    .then(res => res.json())
                    .then(data => setInteractionResults(data.results || [])),

                // 4. Diagnostics (ICD-10)
                fetch(`${PROXY_URL}/icd?query=${encodedQuery}`)
                    .then(res => res.json())
                    .then(data => setDiagnosticResults(data.results || [])),

                // 5. PubMed
                fetch(`${PROXY_URL}/pubmed?query=${encodedQuery}`)
                    .then(res => res.json())
                    .then(data => setPubmedResults(data.results || [])),

                // 6. Wikipedia
                fetch(`${PROXY_URL}/wikipedia?query=${encodedQuery}`)
                    .then(res => res.json())
                    .then(data => setWikiResults(data.results || [])),

                // 7. Notes
                fetch(`${PROXY_URL}/notes?term=${encodedQuery}`)
                    .then(res => res.json())
                    .then(data => setNotes(data.results || []))
            ]);
        } catch (error) {
            console.error("Error fetching knowledge data", error);
        } finally {
            setIsLoading(false);
            console.log('useKnowledgeSearch end', {
                query: searchInfo,
                counts: {
                    drugs: drugResults.length,
                    papers: paperResults.length,
                    interactions: interactionResults.length,
                    diagnostics: diagnosticResults.length,
                    pubmed: pubmedResults.length,
                    wiki: wikiResults.length,
                    notes: notes.length
                }
            });
        }
    };

    const addNote = useCallback(async (text: string, isPublic: boolean, author: string, relatedTerm: string) => {
        try {
            const res = await fetch(`${PROXY_URL}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, isPublic, author, relatedTerm })
            });
            const newNote = await res.json();
            // Optimistic update
            setNotes(prev => [newNote, ...prev]);
        } catch (err) {
            console.error('Failed to add note', err);
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
        searchKnowledge: () => { }, // Deprecated/No-op as search is now reactive
        addNote,
        clearResults
    };
};
