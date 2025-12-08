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

// Proxy to OpenFDA
app.get('/api/knowledge/drugs', async (req: express.Request, res: express.Response) => {
    const query = req.query.query as string;
    if (!query) {
        return res.json({ results: [] });
    }

    try {
        // OpenFDA API for drug labeling
        // Improved query: Search in brand_name OR generic_name using Solr syntax
        // We treat the user query as a single phrase or simple terms
        const safeQuery = query.replace(/[":]/g, ''); // Simple sanitization
        const fdaQuery = `openfda.brand_name:"${safeQuery}"+OR+openfda.generic_name:"${safeQuery}"+OR+openfda.substance_name:"${safeQuery}"`;

        const response = await axios.get(`https://api.fda.gov/drug/label.json?search=${fdaQuery}&limit=5`);

        const results = response.data.results.map((item: any) => ({
            id: item.id || Math.random().toString(36).substr(2, 9),
            brand_name: item.openfda?.brand_name?.[0] || 'Unknown Brand',
            generic_name: item.openfda?.generic_name?.[0] || 'Unknown Generic',
            manufacturer: item.openfda?.manufacturer_name?.[0] || 'Unknown Manufacturer',
            description: item.description?.[0] || item.indications_and_usage?.[0] || 'No description available',
            warnings: item.warnings?.[0] || 'No specific warnings',
            // Social structure (empty)
            ...getSocialStructure()
        }));

        res.json({ results });
    } catch (error) {
        // console.error('OpenFDA Error:', error); // Silent fail or log
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
        // Using graph/v1/paper/search
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
        // console.error('Semantic Scholar Error:', error);
        res.json({ results: [] });
    }
});

// Proxy to RxNav (Interactions)
app.get('/api/knowledge/interactions', async (req: express.Request, res: express.Response) => {
    const query = req.query.query as string;
    if (!query) return res.json({ results: [] });

    try {
        // 1. Get RxNorm ID (rxcui)
        const findRes = await axios.get(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${query}`);
        const rxcui = findRes.data.idGroup?.rxnormId?.[0];

        if (!rxcui) {
            return res.json({ results: [], message: 'Drug not found in RxNorm' });
        }

        // 2. Get Interactions
        const interactRes = await axios.get(`https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=${rxcui}`);

        // Parse complex RxNav structure
        const interactionTypeGroup = interactRes.data.interactionTypeGroup;
        const results: any[] = [];

        if (interactionTypeGroup) {
            interactionTypeGroup.forEach((group: any) => {
                group.interactionType?.forEach((type: any) => {
                    type.interactionPair?.forEach((pair: any) => {
                        results.push({
                            id: Math.random().toString(36).substr(2, 9),
                            description: pair.description,
                            severity: pair.severity,
                            drug_b: pair.interactionConcept?.[1]?.minConceptItem?.name || 'Unknown'
                        });
                    });
                });
            });
        }

        res.json({ results: results.slice(0, 10) }); // Limit to 10
    } catch (error) {
        // console.error('RxNav Error:', error);
        res.json({ results: [] });
    }
});

// Proxy to NLM Clinical Tables (ICD-10)
app.get('/api/knowledge/icd', async (req: express.Request, res: express.Response) => {
    const query = req.query.query as string;
    if (!query) return res.json({ results: [] });

    try {
        // NLM Clinical Tables public API
        // searching ICD-10-CM
        const response = await axios.get(`https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&terms=${query}&maxList=5`);

        // Response format: [total, codes[], null, [[code, name], ...]]
        const items = response.data[3] || [];
        const results = items.map((item: any[]) => ({
            code: item[0],
            name: item[1],
            source: 'ICD-10-CM'
        }));

        res.json({ results });
    } catch (error) {
        // console.error('ICD Error:', error);
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

// Proxy to Wikipedia (General Info Fallback)
app.get('/api/knowledge/wikipedia', async (req: express.Request, res: express.Response) => {
    const query = req.query.query as string;
    if (!query) return res.json({ results: [] });

    try {
        // Wikipedia Opensearch
        // Limit to 3 for brevity
        const response = await axios.get(`https://pt.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&namespace=0&format=json`);

        // Response: [query, [titles], [descriptions], [urls]]
        const titles = response.data[1];
        const descriptions = response.data[2];
        const urls = response.data[3];

        const results = titles.map((title: string, index: number) => ({
            id: `wiki-${index}`,
            title: title,
            description: descriptions[index] || 'Sem descrição disponível.',
            url: urls[index],
            source: 'Wikipedia (PT)'
        }));

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
