const axios = require('axios');

/**
 * Service for fetching medical knowledge from external APIs
 * Integrates with:
 * - OpenFDA (Drugs)
 * - Semantic Scholar (Papers)
 * - RxNav (Interactions)
 * - Clinical Tables (ICD-10)
 * - NCBI E-utilities (PubMed)
 * - Wikipedia API
 */
class KnowledgeService {
  constructor() {
    this.axios = axios.create({
      timeout: 10000, // 10s timeout
      headers: {
        'User-Agent': 'HealthGuardian/1.0 (Research/Educational use)'
      }
    });
  }

  async searchDrugs(query) {
    if (!query) return [];
    try {
      // Limit to 1 result to avoid duplicates and get the most relevant "monograph"
      const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(query)}"&limit=1`;
      const response = await this.axios.get(url);

      if (!response.data.results || response.data.results.length === 0) return [];

      const drug = response.data.results[0]; // Take the first best match

      // Clean mapping focusing on clinical utility
      return [{
        id: drug.id || Math.random().toString(36).substr(2, 9),
        brand_name: drug.openfda?.brand_name?.[0] || query.toUpperCase(),
        generic_name: drug.openfda?.generic_name?.[0] || 'Nome Genérico não disponível',
        manufacturer: drug.openfda?.manufacturer_name?.[0] || 'Fabricante desconhecido',
        description: '', // Intentionally empty to avoid chemical description
        // Priority Clinical Fields
        boxed_warning: drug.boxed_warning?.[0],
        indications: drug.indications_and_usage?.[0],
        mechanism: drug.mechanism_of_action?.[0],
        contraindications: drug.contraindications?.[0],
        adverse_reactions: drug.adverse_reactions?.[0],
        warnings: drug.warnings?.[0]
      }];
    } catch (error) {
      console.error('OpenFDA API Error:', error.message);
      return [];
    }
  }

  async searchPapers(query) {
    if (!query) return [];
    try {
      const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=5&fields=title,authors,year,abstract,url`;
      const response = await this.axios.get(url);

      if (!response.data.data) return [];

      return response.data.data.map(paper => ({
        id: paper.paperId,
        title: paper.title,
        year: paper.year,
        authors: paper.authors?.map(a => a.name).join(', ') || 'Unknown',
        abstract: paper.abstract || 'No abstract available',
        url: paper.url
      }));
    } catch (error) {
      console.error('Semantic Scholar API Error:', error.message);
      if (error.response) console.error('Response data:', error.response.data);
      return [];
    }
  }

  async searchInteractions(query) {
    if (!query) return [];
    try {
      // Step 1: Get RXCUI for the drug name
      const rxcuiUrl = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(query)}`;
      const rxcuiResponse = await this.axios.get(rxcuiUrl);

      const rxcui = rxcuiResponse.data.idGroup?.rxnormId?.[0];
      if (!rxcui) return [];

      // Step 2: Get interactions
      const interactionUrl = `https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=${rxcui}`;
      const response = await this.axios.get(interactionUrl);

      const interactionTypeGroup = response.data.interactionTypeGroup;
      if (!interactionTypeGroup || interactionTypeGroup.length === 0) return [];

      const results = [];
      interactionTypeGroup.forEach(group => {
        group.interactionType.forEach(type => {
          type.interactionPair.forEach(pair => {
            results.push({
              id: Math.random().toString(36).substr(2, 9),
              description: pair.description,
              severity: pair.severity,
              drug_a: type.minConceptItem?.name || query,
              drug_b: pair.interactionConcept?.[1]?.minConceptItem?.name || 'Unknown',
              source: group.sourceName
            });
          });
        });
      });

      return results.slice(0, 5);
    } catch (error) {
      console.error('RxNav API Error:', error.message);
      if (error.response) console.error('Response data:', error.response.data);
      return [];
    }
  }

  async searchDiagnostics(query) {
    if (!query) return [];
    try {
      // Using Clinical Tables API for ICD-10
      const url = `https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&terms=${encodeURIComponent(query)}&maxList=5`;
      const response = await this.axios.get(url);

      // Response format: [count, codes[], null, [ [code, name], ... ]]
      const data = response.data;
      if (!data || data[0] === 0 || !data[3]) return [];

      return data[3].map(item => ({
        code: item[0],
        title: item[1],
        definition: 'ICD-10-CM Diagnosis Code',
        source: 'NLM'
      }));
    } catch (error) {
      console.error('Clinical Tables API Error:', error.message);
      return [];
    }
  }

  async searchPubMed(query) {
    if (!query) return [];
    try {
      console.log(`[PubMed] Searching for: ${query}`);
      const apiKey = process.env.NCBI_API_KEY;
      const commonParams = `tool=healthguardian&email=support@healthguardian.local${apiKey ? `&api_key=${apiKey}` : ''}`;
      // Step 1: Search for IDs
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmode=json&retmax=5&${commonParams}`;
      const searchResponse = await this.axios.get(searchUrl);

      const ids = searchResponse.data.esearchresult?.idlist;
      if (!ids || ids.length === 0) {
        console.log('[PubMed] No IDs found.');
        return [];
      }

      console.log(`[PubMed] IDs found: ${ids.join(',')}`);

      // Step 2: Get summaries
      const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json&${commonParams}`;
      const summaryResponse = await this.axios.get(summaryUrl);

      const result = summaryResponse.data.result;
      if (!result) return [];

      return ids.map(id => {
        const item = result[id];
        if (!item) return null;
        return {
          id: item.uid,
          title: item.title,
          authors: item.authors?.map(a => a.name).join(', ') || 'Unknown',
          journal: item.fulljournalname || item.source,
          pubdate: item.pubdate,
          url: `https://pubmed.ncbi.nlm.nih.gov/${item.uid}/`
        };
      }).filter(Boolean);
    } catch (error) {
      console.error('PubMed API Error:', error.message);
      if (error.response) {
        console.error('[PubMed] Response Status:', error.response.status);
        console.error('[PubMed] Response Data:', JSON.stringify(error.response.data));
      }
      return [];
    }
  }

  async searchWikipedia(query) {
    if (!query) return [];
    try {
      // Step 1: Search for the best matching page title (Fuzzy search)
      const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=1`;
      const searchResponse = await this.axios.get(searchUrl);

      const searchResults = searchResponse.data.query?.search;
      if (!searchResults || searchResults.length === 0) return [];

      const bestMatchRequest = searchResults[0];
      const bestTitle = bestMatchRequest.title;

      // Step 2: Get the summary for the best title (Exact title required for summary API)
      const summaryUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestTitle)}`;
      const summaryResponse = await this.axios.get(summaryUrl);

      const data = summaryResponse.data;
      if (!data || data.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found') return [];

      return [{
        id: data.pageid?.toString() || Math.random().toString(),
        title: data.title,
        description: data.extract,
        url: data.content_urls?.desktop?.page || `https://pt.wikipedia.org/wiki/${encodeURIComponent(bestTitle)}`,
        thumbnail: data.thumbnail?.source,
        source: 'Wikipedia'
      }];
    } catch (error) {
      console.error('Wikipedia API Error:', error.message);
      return [];
    }
  }
}

module.exports = new KnowledgeService();
