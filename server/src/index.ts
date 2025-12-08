import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Fake social data generator (REMOVED per user request)
// Now returns neutral/empty data structure
const getSocialStructure = () => ({
    community_votes: 0,
    comments: [] as string[],
    is_verified: false
});

// Helper to clean and capitalize text
// Helper to clean and capitalize text
const cleanText = (textArray: string[] | undefined): string | undefined => {
    if (!textArray || textArray.length === 0) return undefined;

    // Join array if multiple lines (OpenFDA often returns arrays of paragraphs)
    const text = Array.isArray(textArray) ? textArray.join(' ') : textArray;

    if (!text) return undefined;

    // Remove common ALL CAPS headers like "1 INDICATIONS AND USAGE", "DESCRIPTION", etc.
    let cleaned = text
        .replace(/^\s*(\d+\s*)?[A-Z\s\(\)-:]{3,}\s*/gm, '') // Remove obvious headers
        .replace(/SPL UNCLASSIFIED SECTION/g, '')
        .trim();

    return cleaned;
};

// Proxy to OpenFDA
app.get('/api/knowledge/drugs', async (req: express.Request, res: express.Response) => {
    const query = req.query.query as string;
    if (!query) {
        return res.json({ results: [] });
    }

    try {
        const safeQuery = query.replace(/[":]/g, '');
        // limit=1 to get the most relevant result (Monograph style) of branded or generic
        // prioritize specific clinical fields
        const fdaQuery = `openfda.brand_name:"${safeQuery}"+OR+openfda.generic_name:"${safeQuery}"+OR+openfda.substance_name:"${safeQuery}"`;

        const response = await axios.get(`https://api.fda.gov/drug/label.json?search=${fdaQuery}&limit=1`);

        const results = response.data.results.map((item: any) => ({
            id: item.id || Math.random().toString(36).substr(2, 9),
            brand_name: item.openfda?.brand_name?.[0] || 'Unknown Brand',
            generic_name: item.openfda?.generic_name?.[0] || 'Unknown Generic',
            manufacturer: item.openfda?.manufacturer_name?.[0] || 'Unknown Manufacturer',
            // Monograph fields cleaned and prioritized
            boxed_warning: cleanText(item.boxed_warning),
            indications: cleanText(item.indications_and_usage),
            mechanism: cleanText(item.mechanism_of_action) || cleanText(item.clinical_pharmacology),
            contraindications: cleanText(item.contraindications),
            adverse_reactions: cleanText(item.adverse_reactions),
            description: cleanText(item.description), // Fallback
            // Social structure (empty)
            ...getSocialStructure()
        }));

        console.log(`[OpenFDA] Found ${results.length} items for "${query}". Top result: ${results[0]?.generic_name}`);
        res.json({ results });
    } catch (error) {
        console.error('[OpenFDA] Error:', error);
        res.json({ results: [] });
    }
});

// Proxy to Semantic Scholar
app.get('/api/knowledge/papers', async (req: express.Request, res: express.Response) => {
    const query = req.query.query as string;
    if (!query) {
        return res.json({ results: [] });
    }

    try {
        // Semantic Scholar API
        const response = await axios.get(`https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=5&fields=title,authors,year,abstract,url`);

        const results = response.data.data.map((paper: any) => ({
            id: paper.paperId,
            title: paper.title,
            year: paper.year,
            authors: paper.authors?.map((a: any) => a.name).join(', ') || 'Unknown Authors',
            abstract: paper.abstract || 'No abstract available',
            url: paper.url,
            // Social structure (empty)
            ...getSocialStructure()
        }));

        res.json({ results });
    } catch (error) {
        res.json({ results: [] });
    }
});

// Proxy to RxNav (Interactions)
app.get('/api/knowledge/interactions', async (req: express.Request, res: express.Response) => {
    const query = req.query.query as string;
    if (!query) return res.json({ results: [] });

    // Logic: Split query. If > 1 word, assume interaction check.
    const terms = query.split(' ').filter(t => t.length > 2); // Filter small words

    if (terms.length < 2) {
        return res.json({ results: [] });
    }

    try {
        // 1. Resolve RxCUIs for all terms
        const rxcuiPromises = terms.map(term =>
            axios.get(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${term}`)
                .then(r => r.data.idGroup?.rxnormId?.[0])
                .catch(() => null)
        );

        const rxcuis = (await Promise.all(rxcuiPromises)).filter(id => id);

        if (rxcuis.length < 2) {
            return res.json({ results: [] }); // Need at least 2 drugs identified
        }

        // 2. Check interactions using list endpoint
        const idsJoined = rxcuis.join('+');
        const interactRes = await axios.get(`https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${idsJoined}`);

        const fullInteractionTypeGroup = interactRes.data.fullInteractionTypeGroup;
        const results: any[] = [];

        if (fullInteractionTypeGroup) {
            fullInteractionTypeGroup.forEach((group: any) => {
                group.fullInteractionType?.forEach((type: any) => {
                    type.interactionPair?.forEach((pair: any) => {
                        results.push({
                            id: Math.random().toString(36).substr(2, 9),
                            source: 'RxNav',
                            type: 'interaction',
                            severity: pair.severity,
                            description: pair.description,
                            drug_a: pair.interactionConcept?.[0]?.minConceptItem?.name,
                            drug_b: pair.interactionConcept?.[1]?.minConceptItem?.name
                        });
                    });
                });
            });
        }

        res.json({ results });
    } catch (error) {
        // console.error('RxNav Error:', error);
        res.json({ results: [] });
    }
});

// Proxy to ICD
app.get('/api/knowledge/icd', async (req: express.Request, res: express.Response) => {
    const query = req.query.query as string;
    if (!query) return res.json({ results: [] });

    try {
        // 1. Search NLM for codes
        const response = await axios.get(`https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&terms=${query}&maxList=5`);
        const items = response.data[3] || [];

        const results = items.map((item: any[]) => ({
            code: item[0],
            title: item[1],
            // Use title as definition for now, avoiding "Definição clínica:" prefix if it's just the name.
            // Ideally we'd fetch a real definition, but NLM doesn't provide one easily.
            definition: item[1],
            source: 'ICD-10-CM'
        }));

        console.log(`[ICD] Found ${results.length} items for "${query}"`);
        res.json({ results });
    } catch (error) {
        console.error('[ICD] Error:', error);
        res.json({ results: [] });
    }
});

// ... (previous code)

// Proxy to PubMed
app.get('/api/knowledge/pubmed', async (req: express.Request, res: express.Response) => {
    // ... (existing code)
    const query = req.query.query as string;
    if (!query) return res.json({ results: [] });

    try {
        // 1. ESearch
        const searchRes = await axios.get(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${query}&retmode=json&retmax=5`);
        const ids = searchRes.data.esearchresult?.idlist || [];

        if (ids.length === 0) return res.json({ results: [] });

        // 2. ESummary
        const summaryRes = await axios.get(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`);

        const results = ids.map((id: string) => {
            const doc = summaryRes.data.result[id];
            return {
                id: id,
                title: doc.title,
                authors: doc.authors?.map((a: any) => a.name).join(', ') || 'Unknown',
                journal: doc.source,
                pubdate: doc.pubdate,
                url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
            };
        });

        res.json({ results });
    } catch (error) {
        // console.error('PubMed Error:', error);
        res.json({ results: [] });
    }
});

// Proxy to Wikipedia (Summary REST API)
app.get('/api/knowledge/wikipedia', async (req: express.Request, res: express.Response) => {
    const query = req.query.query as string;
    if (!query) return res.json({ results: [] });

    try {
        // Step 1: Opensearch to get best match title
        const searchRes = await axios.get(`https://pt.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&namespace=0&format=json`);
        const bestTitle = searchRes.data?.[1]?.[0];

        if (!bestTitle) {
            return res.json({ results: [] });
        }

        // Step 2: Get Summary for best title
        const summaryRes = await axios.get(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestTitle)}`);
        const data = summaryRes.data;

        const results = [{
            id: `wiki-${data.pageid}`,
            title: data.title,
            description: data.extract,
            url: data.content_urls?.desktop?.page,
            thumbnail: data.thumbnail?.source,
            source: 'Wikipedia (PT)'
        }];

        res.json({ results });
    } catch (error) {
        res.json({ results: [] });
    }
});


// --- Community Notes (In-Memory MVP) ---
interface Note {
    id: string;
    text: string;
    author: string;
    isPublic: boolean;
    timestamp: number;
    relatedTerm?: string;
}

let notesDB: Note[] = [];

app.get('/api/knowledge/notes', (req: express.Request, res: express.Response) => {
    // Return all public notes + private notes (in a real app, strict auth filtering would apply)
    const term = req.query.term as string;

    let filtered = notesDB;
    if (term) {
        filtered = notesDB.filter(n =>
            n.relatedTerm?.toLowerCase().includes(term.toLowerCase()) ||
            n.text.toLowerCase().includes(term.toLowerCase())
        );
    }

    res.json({ results: filtered });
});

app.post('/api/knowledge/notes', (req: express.Request, res: express.Response) => {
    const { text, isPublic, author, relatedTerm } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text required' });
    }

    const newNote: Note = {
        id: Math.random().toString(36).substr(2, 9),
        text,
        author: author || 'Anônimo',
        isPublic: !!isPublic,
        timestamp: Date.now(),
        relatedTerm
    };

    notesDB.unshift(newNote); // Add to top

    res.json(newNote);
});


// --- Server ---

app.listen(PORT, () => {
    console.log(`HG Knowledge Proxy running on http://localhost:${PORT}`);
});
