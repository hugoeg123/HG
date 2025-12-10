const knowledgeService = require('./services/knowledge.service');

async function testAPIs() {
    const terms = ['Dipirona', 'Metformina', 'Aspirina', 'Diabetes'];

    console.log('=== STARTING DEBUG ===');

    for (const term of terms) {
        console.log(`\n--- Testing Term: "${term}" ---`);

        // 1. PubMed
        console.log(`[PubMed] Searching...`);
        try {
            const pubmed = await knowledgeService.searchPubMed(term);
            console.log(`[PubMed] Result Count: ${pubmed.length}`);
            if (pubmed.length > 0) console.log(`[PubMed] First Title: ${pubmed[0].title}`);
        } catch (e) {
            console.log(`[PubMed] ERROR: ${e.message}`);
        }

        // 2. Wikipedia
        console.log(`[Wikipedia] Searching...`);
        try {
            const wiki = await knowledgeService.searchWikipedia(term);
            console.log(`[Wikipedia] Result Count: ${wiki.length}`);
            if (wiki.length > 0) {
                console.log(`[Wikipedia] Title: ${wiki[0].title}`);
                console.log(`[Wikipedia] Summary: ${wiki[0].description.substring(0, 100)}...`);
            }
        } catch (e) {
            console.log(`[Wikipedia] ERROR: ${e.message}`);
        }

        // 3. Semantic Scholar
        console.log(`[Semantic] Searching...`);
        try {
            const papers = await knowledgeService.searchPapers(term);
            console.log(`[Semantic] Result Count: ${papers.length}`);
            if (papers.length > 0) console.log(`[Semantic] First Title: ${papers[0].title}`);
        } catch (e) {
            console.log(`[Semantic] ERROR: ${e.message}`);
        }
    }
}

testAPIs();
