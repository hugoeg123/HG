/**
 * Parser para análise de texto médico com tags e seções
 * Baseado nos requisitos do HybridEditor e mocks fornecidos
 */

/**
 * Divide o texto em seções baseadas em tags (#TAG: ou ##SUBTAG:) ou quebras de linha duplas
 * @param {string} text - Texto completo a ser analisado
 * @param {Array} availableTags - Array de tags disponíveis para referência
 * @returns {Array} Array de seções com id, content, tag, category
 */
export const parseSections = (text, availableTags = []) => {
  if (!text || typeof text !== 'string') {
    return [{ id: 'section-0', content: '', tag: null, category: null }];
  }

  // Regex para identificar tags principais (#TAG:) e subtags (##SUBTAG: ou >>SUBTAG:)
  const tagRegex = /^(#[A-Z_]+:|##[A-Z_]+:|>>[A-Z_]+:)/gmi;
  const sections = [];
  let currentIndex = 0;
  let sectionId = 0;

  // Encontrar todas as posições de tags
  const tagMatches = [...text.matchAll(tagRegex)];
  
  if (tagMatches.length === 0) {
    // Se não há tags, dividir por quebras de linha duplas
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    return paragraphs.map((paragraph, index) => ({
      id: `section-${index}`,
      content: paragraph.trim(),
      tag: null,
      category: null
    }));
  }

  // Processar seções com tags
  tagMatches.forEach((match, index) => {
    const tagStart = match.index;
    const nextTagStart = tagMatches[index + 1]?.index || text.length;
    
    // Extrair conteúdo da seção
    const sectionContent = text.slice(tagStart, nextTagStart).trim();
    const tagMatch = sectionContent.match(/^(#[A-Z_]+:|##[A-Z_]+:|>>[A-Z_]+:)(.*)$/is);
    
    if (tagMatch) {
      const tagName = tagMatch[1].replace(/[#:>]/g, '').trim();
      const content = tagMatch[2].trim();
      
      // Encontrar categoria da tag
      const tagInfo = availableTags.find(t => t.name === tagName);
      
      sections.push({
        id: `section-${sectionId++}`,
        content: sectionContent,
        tag: tagName,
        category: tagInfo?.category || 'outros',
        isMainTag: match[0].startsWith('#') && !match[0].startsWith('##'),
        isSubTag: match[0].startsWith('##') || match[0].startsWith('>>')
      });
    }
  });

  // Se há texto antes da primeira tag
  if (tagMatches[0]?.index > 0) {
    const preContent = text.slice(0, tagMatches[0].index).trim();
    if (preContent) {
      sections.unshift({
        id: `section-pre`,
        content: preContent,
        tag: null,
        category: null
      });
    }
  }

  return sections.length > 0 ? sections : [{ id: 'section-0', content: text, tag: null, category: null }];
};

/**
 * Extrai o valor de uma tag específica do texto
 * @param {string} text - Texto para análise
 * @param {string} tagCode - Código da tag a ser extraída
 * @returns {string|null} Valor da tag ou null se não encontrada
 */
export const extractValueFromTag = (text, tagCode) => {
  const regex = new RegExp(`(?:#${tagCode}:|##${tagCode}:|>>${tagCode}:)\\s*(.+?)(?=\\n#|\\n##|\\n>>|$)`, 'is');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
};

/**
 * Reconstrói o texto completo a partir de um array de seções
 * @param {Array} sections - Array de seções
 * @returns {string} Texto completo reconstruído
 */
export const reconstructText = (sections) => {
  if (!Array.isArray(sections)) return '';
  
  return sections
    .filter(section => section.content && section.content.trim())
    .map(section => section.content.trim())
    .join('\n\n');
};

/**
 * Extrai dados numéricos de tags específicas (ex: pressão arterial, peso, etc.)
 * @param {string} text - Texto para análise
 * @param {string} tagCode - Código da tag
 * @returns {Object} Objeto com valores numéricos extraídos
 */
export const extractNumericData = (text, tagCode) => {
  const value = extractValueFromTag(text, tagCode);
  if (!value) return null;

  // Padrões específicos para diferentes tipos de dados
  const patterns = {
    PA: /(?<sistolica>\d+)\s*\/\s*(?<diastolica>\d+)/, // Pressão arterial
    PESO: /(?<peso>\d+(?:\.\d+)?)\s*kg?/i,
    ALTURA: /(?<altura>\d+(?:\.\d+)?)\s*(?:cm|m)?/i,
    TEMP: /(?<temperatura>\d+(?:[\.,]\d+)?)\s*°?[cf]?/i,
    FC: /(?<frequencia>\d+)\s*bpm?/i,
    FR: /(?<frequencia>\d+)\s*(?:rpm|irpm|respiracoes\/min|respirações\/min)?/i,
    SPO2: /(?<valor>\d{2,3})\s*%?/
  };

  const pattern = patterns[tagCode.toUpperCase()];
  if (pattern) {
    const match = value.match(pattern);
    return match?.groups || null;
  }

  // Fallback para números simples
  const numMatch = value.match(/\d+(?:\.\d+)?/);
  return numMatch ? { value: parseFloat(numMatch[0]) } : null;
};

/**
 * Valida se uma tag é válida
 * @param {string} tagName - Nome da tag
 * @param {Array} availableTags - Tags disponíveis
 * @returns {boolean} True se a tag é válida
 */
export const isValidTag = (tagName, availableTags = []) => {
  if (!tagName || typeof tagName !== 'string') return false;
  
  // Verificar se está na lista de tags disponíveis
  return availableTags.some(tag => tag.name === tagName.toUpperCase());
};

/**
 * Formata uma tag para o padrão correto
 * @param {string} tagName - Nome da tag
 * @param {boolean} isSubTag - Se é uma subtag
 * @returns {string} Tag formatada
 */
export const formatTag = (tagName, isSubTag = false) => {
  if (!tagName) return '';
  
  const cleanName = tagName.replace(/[#>:]/g, '').trim().toUpperCase();
  return isSubTag ? `>>${cleanName}:` : `#${cleanName}:`;
};
