/**
 * Parser Único Compartilhado (Frontend/Backend)
 * 
 * MISSÃO ZERO-DÉBITO: Parser único para tags dinâmicas
 * que funciona tanto no frontend quanto no backend
 * 
 * CONTEXTO ESTRATÉGICO: Validação consistente, transações atômicas
 * e preparação para IA/cálculos com dados estruturados
 */

/**
 * Interface para Tag
 * @typedef {Object} Tag
 * @property {string} id - UUID da tag
 * @property {string} codigo - Código da tag (#QP, #HDA, >>subtag)
 * @property {string} nome - Nome descritivo da tag
 * @property {string} tipo_dado - Tipo de dado (texto, numero, data, booleano, bp)
 * @property {Object} regras_validacao - Regras de validação JSON
 */

/**
 * Interface para Seção
 * @typedef {Object} Section
 * @property {string} tag_id - UUID da tag
 * @property {string} valor_raw - Valor bruto inserido
 * @property {any} parsed_value - Valor parseado e validado
 * @property {number} ordem - Ordem da seção no registro
 */

/**
 * Parseia o texto bruto em seções estruturadas
 * @param {string} rawText - Texto bruto do prontuário
 * @param {Tag[]} tags - Array de tags disponíveis
 * @returns {Section[]} Array de seções parseadas
 */
function parseSections(rawText, tags) {
  if (!rawText || !tags || tags.length === 0) {
    return [];
  }

  // Regex para capturar tags e seu conteúdo
  // Captura: #TAG: conteúdo até próxima tag ou fim
  const tagRegex = /^(#\w+|>>\w+):\s*([\s\S]*?)(?=^(?:#\w+|>>\w+):|$)/gm;
  const matches = Array.from(rawText.matchAll(tagRegex));

  if (matches.length === 0) {
    throw new Error('Nenhuma tag válida encontrada no texto');
  }

  return matches.map((match, index) => {
    const codigo = match[1];
    const valorRaw = match[2].trim();

    // Encontrar a tag correspondente
    const tag = tags.find(t => t.codigo === codigo);
    if (!tag) {
      throw new Error(`Tag inválida: ${codigo}`);
    }

    // Validar e parsear o valor
    const parsedValue = validateAndParse(valorRaw, tag.tipo_dado, tag.regras_validacao);

    return {
      tag_id: tag.id,
      valor_raw: valorRaw,
      parsed_value: parsedValue,
      ordem: index
    };
  });
}

/**
 * Valida e parseia um valor de acordo com o tipo e regras
 * @param {string} raw - Valor bruto
 * @param {string} tipo - Tipo de dado
 * @param {Object} rules - Regras de validação
 * @returns {any} Valor parseado
 */
function validateAndParse(raw, tipo, rules = {}) {
  if (!raw || raw.trim() === '') {
    throw new Error('Valor não pode estar vazio');
  }

  const trimmedRaw = raw.trim();

  // Aplicar validação por regex se especificada
  if (rules.regex) {
    const regex = new RegExp(rules.regex);
    if (!regex.test(trimmedRaw)) {
      throw new Error(`Valor não atende ao padrão esperado: ${rules.regex}`);
    }
  }

  // Parsear de acordo com o tipo
  switch (tipo) {
    case 'texto':
      return trimmedRaw;

    case 'numero':
      const numero = Number(trimmedRaw);
      if (isNaN(numero)) {
        throw new Error('Valor deve ser um número válido');
      }
      return numero;

    case 'data':
      const data = new Date(trimmedRaw);
      if (isNaN(data.getTime())) {
        throw new Error('Valor deve ser uma data válida');
      }
      return data.toISOString();

    case 'booleano':
      const valorLower = trimmedRaw.toLowerCase();
      if (['true', 'sim', 's', '1', 'verdadeiro'].includes(valorLower)) {
        return true;
      }
      if (['false', 'não', 'n', '0', 'falso'].includes(valorLower)) {
        return false;
      }
      throw new Error('Valor deve ser verdadeiro ou falso');

    case 'bp': // Pressão arterial
      const bpMatch = trimmedRaw.match(/^(\d{2,3})\/(\d{2,3})$/);
      if (!bpMatch) {
        throw new Error('Pressão arterial deve estar no formato XXX/YYY');
      }
      const sistolica = parseInt(bpMatch[1]);
      const diastolica = parseInt(bpMatch[2]);
      
      // Validações básicas de PA
      if (sistolica < 50 || sistolica > 300) {
        throw new Error('Pressão sistólica deve estar entre 50 e 300 mmHg');
      }
      if (diastolica < 30 || diastolica > 200) {
        throw new Error('Pressão diastólica deve estar entre 30 e 200 mmHg');
      }
      if (sistolica <= diastolica) {
        throw new Error('Pressão sistólica deve ser maior que a diastólica');
      }
      
      return {
        sistolica,
        diastolica,
        texto: trimmedRaw
      };

    default:
      throw new Error(`Tipo de dado não suportado: ${tipo}`);
  }
}

/**
 * Converte seções de volta para texto formatado
 * @param {Section[]} sections - Array de seções
 * @param {Tag[]} tags - Array de tags para lookup
 * @returns {string} Texto formatado
 */
function sectionsToText(sections, tags) {
  if (!sections || sections.length === 0) {
    return '';
  }

  return sections
    .sort((a, b) => a.ordem - b.ordem)
    .map(section => {
      const tag = tags.find(t => t.id === section.tag_id);
      if (!tag) {
        throw new Error(`Tag não encontrada: ${section.tag_id}`);
      }
      return `${tag.codigo}: ${section.valor_raw}`;
    })
    .join('\n\n');
}

/**
 * Valida se um código de tag é válido
 * @param {string} codigo - Código da tag
 * @returns {boolean} True se válido
 */
function isValidTagCode(codigo) {
  return /^(#\w+|>>\w+)$/.test(codigo);
}

/**
 * Extrai códigos de tags de um texto
 * @param {string} text - Texto para análise
 * @returns {string[]} Array de códigos encontrados
 */
function extractTagCodes(text) {
  const matches = text.match(/^(#\w+|>>\w+):/gm);
  return matches ? matches.map(match => match.slice(0, -1)) : [];
}

/**
 * Valida se todas as tags obrigatórias estão presentes
 * @param {Section[]} sections - Seções do registro
 * @param {Tag[]} requiredTags - Tags obrigatórias
 * @returns {string[]} Array de códigos de tags faltantes
 */
function validateRequiredTags(sections, requiredTags) {
  const presentTagIds = new Set(sections.map(s => s.tag_id));
  return requiredTags
    .filter(tag => !presentTagIds.has(tag.id))
    .map(tag => tag.codigo);
}

/**
 * Calcula estatísticas do registro
 * @param {Section[]} sections - Seções do registro
 * @param {Tag[]} tags - Tags disponíveis
 * @returns {Object} Estatísticas calculadas
 */
function calculateStats(sections, tags) {
  const stats = {
    totalSections: sections.length,
    tagTypes: {},
    hasVitalSigns: false,
    completeness: 0
  };

  sections.forEach(section => {
    const tag = tags.find(t => t.id === section.tag_id);
    if (tag) {
      stats.tagTypes[tag.tipo_dado] = (stats.tagTypes[tag.tipo_dado] || 0) + 1;
      
      // Verificar sinais vitais
      if (tag.codigo === '#PA' && section.parsed_value) {
        stats.hasVitalSigns = true;
        stats.bloodPressure = section.parsed_value;
      }
    }
  });

  // Calcular completude (tags básicas presentes)
  const basicTags = ['#QP', '#HDA', '#EF'];
  const presentBasicTags = sections.filter(s => {
    const tag = tags.find(t => t.id === s.tag_id);
    return tag && basicTags.includes(tag.codigo);
  }).length;
  
  stats.completeness = Math.round((presentBasicTags / basicTags.length) * 100);

  return stats;
}

// Exportações para compatibilidade CommonJS (Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseSections,
    sectionsToText,
    isValidTagCode,
    extractTagCodes,
    validateRequiredTags,
    calculateStats
  };
}