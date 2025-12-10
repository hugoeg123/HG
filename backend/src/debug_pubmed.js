const knowledgeService = require('./services/knowledge.service');

async function testPubMed() {
    // Contrast PT vs EN
    const pairs = [
        { pt: 'Dipirona', en: 'Metamizole' }, // Dipyrone is also used
        { pt: 'Metformina', en: 'Metformin' },
        { pt: 'Aspirina', en: 'Aspirin' }
    ];

    console.log('=== PubMed Language Test ===');

    for (const pair of pairs) {
        console.log(`\nTesting: ${pair.pt} (PT) vs ${pair.en} (EN)`);

        try {
            const ptRes = await knowledgeService.searchPubMed(pair.pt);
            console.log(`[PT] "${pair.pt}" Results: ${ptRes.length}`);
            if (ptRes.length > 0) console.log(`   First: ${ptRes[0].title}`);
        } catch (e) {
            console.log(`[PT] Error: ${e.message}`);
        }

        try {
            const enRes = await knowledgeService.searchPubMed(pair.en);
            console.log(`[EN] "${pair.en}" Results: ${enRes.length}`);
            if (enRes.length > 0) console.log(`   First: ${enRes[0].title}`);
        } catch (e) {
            console.log(`[EN] Error: ${e.message}`);
        }
    }
}

testPubMed();
