import { useState, useCallback } from 'react';

// Types for our results
export interface DrugResult {
    id: string;
    brand_name: string;
    generic_name: string;
    manufacturer: string;
    description: string;
    warnings: string;
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
}

export interface DiagnosticResult {
    code: string;
    name: string;
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

export const useKnowledgeSearch = (): UseKnowledgeSearchReturn => {
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

    const searchKnowledge = useCallback(async (query: string) => {
        if (!query.trim()) return;

        clearResults();
        setIsLoading(true);

        const encodedQuery = encodeURIComponent(query);

        // Fire all requests in parallel

        // 1. Drugs (OpenFDA)
        fetch(`${PROXY_URL}/drugs?query=${encodedQuery}`)
            .then(res => res.json())
            .then(data => setDrugResults(data.results || []))
            .catch(console.error);

        // 2. Papers (Semantic Scholar)
        fetch(`${PROXY_URL}/papers?query=${encodedQuery}`)
            .then(res => res.json())
            .then(data => setPaperResults(data.results || []))
            .catch(console.error);

        // 3. Interactions (RxNav)
        fetch(`${PROXY_URL}/interactions?query=${encodedQuery}`)
            .then(res => res.json())
            .then(data => setInteractionResults(data.results || []))
            .catch(console.error);

        // 4. Diagnostics (ICD-10)
        fetch(`${PROXY_URL}/icd?query=${encodedQuery}`)
            .then(res => res.json())
            .then(data => setDiagnosticResults(data.results || []))
            .catch(console.error);

        // 5. PubMed
        fetch(`${PROXY_URL}/pubmed?query=${encodedQuery}`)
            .then(res => res.json())
            .then(data => setPubmedResults(data.results || []))
            .catch(console.error);

        // 6. Wikipedia
        fetch(`${PROXY_URL}/wikipedia?query=${encodedQuery}`)
            .then(res => res.json())
            .then(data => setWikiResults(data.results || []))
            .catch(console.error);

        // 7. Notes
        fetch(`${PROXY_URL}/notes?term=${encodedQuery}`)
            .then(res => res.json())
            .then(data => setNotes(data.results || []))
            .catch(console.error)
            .finally(() => setIsLoading(false));

    }, [clearResults]);

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
        searchKnowledge,
        addNote,
        clearResults
    };
};
