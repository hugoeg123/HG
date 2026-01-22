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

  // Mapa de cabeçalhos naturais para tags padronizadas
  const NATURAL_HEADERS = {
    'subjetivo': '#Subjetivo',
    'subjective': '#Subjetivo',
    's': '#Subjetivo',
    'objetivo': '#Objetivo',
    'objective': '#Objetivo',
    'o': '#Objetivo',
    'avaliação': '#Avaliacao',
    'avaliacao': '#Avaliacao',
    'assessment': '#Avaliacao',
    'a': '#Avaliacao',
    'plano': '#Conduta',
    'conduta': '#Conduta',
    'plan': '#Conduta',
    'p': '#Conduta',
    'hpp': '#HPP',
    'hda': '#HDA',
    'queixa principal': '#QP',
    'qp': '#QP',
    'historia': '#HDA',
    'history': '#HDA',
    'exame fisico': '#ExameFisico',
    'physical exam': '#ExameFisico'
  };

  const lines = text.split(/\r?\n/);
  const sections = [];
  let currentSection = {
    id: 'section-pre',
    contentLines: [],
    tag: null,
    category: null,
    isMainTag: false,
    isSubTag: false
  };
  let sectionCounter = 0;

  const flushCurrentSection = () => {
    if (currentSection.contentLines.length > 0 || currentSection.tag) {
      const content = currentSection.contentLines.join('\n').trim();
      // Adiciona seção se tiver conteúdo OU se for uma tag explícita (mesmo vazia)
      if (content || currentSection.tag) {
        // Encontrar categoria se tiver tag
        let tagInfo = null;
        if (currentSection.tag) {
          const cleanTagName = currentSection.tag.replace(/^[#:>]+/, '');
          tagInfo = availableTags.find(t => 
            t.name?.toLowerCase() === cleanTagName.toLowerCase() || 
            t.code?.toLowerCase() === currentSection.tag.toLowerCase()
          );
        }

        sections.push({
          id: currentSection.id,
          content: content,
          tag: currentSection.tag ? currentSection.tag.replace(/^[#:>]+/, '') : null,
          tagCode: currentSection.tag, // Preserves the # or ## prefix
          category: tagInfo?.category || (currentSection.tag ? 'Geral' : null),
          isMainTag: currentSection.isMainTag,
          isSubTag: currentSection.isSubTag
        });
      }
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 1. Verificar Tag Padrão (#TAG: ou >>TAG:)
    const standardMatch = line.match(/^\s*(#[A-Z_0-9]+:|##[A-Z_0-9]+:|>>[A-Z_0-9]+:)(.*)$/i);
    
    if (standardMatch) {
      flushCurrentSection();
      
      const fullTag = standardMatch[1]; // ex: #Subjetivo:
      const contentRest = standardMatch[2]; // ex: texto restante
      
      const isSub = fullTag.startsWith('##') || fullTag.startsWith('>>');
      const tagName = fullTag.replace(/[:\s]+$/, ''); // remove : do final

      currentSection = {
        id: `section-${sectionCounter++}`,
        contentLines: [],
        tag: tagName,
        category: null, // Será resolvido no flush
        isMainTag: !isSub,
        isSubTag: isSub
      };

      if (contentRest.trim()) {
        currentSection.contentLines.push(contentRest.trim());
      }
      continue;
    }

    // 2. Verificar Cabeçalho Natural (Subjetivo:, Objetivo:, etc)
    const naturalMatch = line.match(/^\s*([A-Za-zÀ-ÿ ]+)\s*:\s*(.*)$/);
    if (naturalMatch) {
      const headerRaw = naturalMatch[1].trim().toLowerCase();
      const mappedTag = NATURAL_HEADERS[headerRaw];

      if (mappedTag) {
        flushCurrentSection();
        
        const contentRest = naturalMatch[2];

        currentSection = {
          id: `section-${sectionCounter++}`,
          contentLines: [],
          tag: mappedTag, // Usa a tag mapeada (ex: #Subjetivo)
          category: null,
          isMainTag: true,
          isSubTag: false
        };

        if (contentRest.trim()) {
          currentSection.contentLines.push(contentRest.trim());
        }
        continue;
      }
    }

    // Se não for tag, acumula na seção atual
    currentSection.contentLines.push(line);
  }

  // Flush da última seção
  flushCurrentSection();

  // Se não gerou nenhuma seção (texto vazio?), retorna default
  if (sections.length === 0) {
    return [{ id: 'section-0', content: text, tag: null, category: null }];
  }

  // Filtrar seções "pre" vazias se houver outras seções
  if (sections.length > 1 && sections[0].id === 'section-pre' && !sections[0].content && !sections[0].tag) {
    sections.shift();
  }

  return sections;
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
