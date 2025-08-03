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
 * Valida e parseia um valor de acordo com o tipo e regras da tag
 * @param {string} raw - Valor bruto
 * @param {string} tipo - Tipo de dado da tag
 * @param {Object} rules - Regras de validação da tag
 * @returns {any} Valor parseado e normalizado
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
      // Validar comprimento se especificado
      if (rules.min_length && trimmedRaw.length < rules.min_length) {
        throw new Error(`Texto deve ter pelo menos ${rules.min_length} caracteres`);
      }
      if (rules.max_length && trimmedRaw.length > rules.max_length) {
        throw new Error(`Texto deve ter no máximo ${rules.max_length} caracteres`);
      }
      return trimmedRaw;

    case 'numero':
      return parseNumero(trimmedRaw, rules);

    case 'data':
      return parseData(trimmedRaw, rules);

    case 'booleano':
      return parseBooleano(trimmedRaw, rules);

    case 'bp': // Pressão arterial
      return parsePressaoArterial(trimmedRaw, rules);

    default:
      throw new Error(`Tipo de dado não suportado: ${tipo}`);
  }
}

/**
 * Parseia e normaliza valores numéricos
 * @param {string} raw - Valor bruto
 * @param {Object} rules - Regras de validação
 * @returns {number} Valor numérico normalizado
 */
function parseNumero(raw, rules) {
  let valorLimpo = raw.toLowerCase().replace(',', '.');
  let fatorConversao = 1;
  
  // Detectar e remover sufixos, aplicando conversões se necessário
  if (rules.sufixos_aceitos) {
    // Ordenar sufixos por comprimento decrescente para testar os mais específicos primeiro
    const sufixosOrdenados = [...rules.sufixos_aceitos].sort((a, b) => b.length - a.length);
    
    for (const sufixo of sufixosOrdenados) {
      const sufixoLower = sufixo.toLowerCase();
      const regex = new RegExp('\\s*' + sufixoLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
      
      if (regex.test(valorLimpo)) {
        // Remover o sufixo completo
        valorLimpo = valorLimpo.replace(regex, '').trim();
        
        // Aplicar conversão se especificada
        if (rules.conversoes && rules.conversoes[sufixo]) {
          fatorConversao = rules.conversoes[sufixo];
        }
        break;
      }
    }
  }
  
  const numero = parseFloat(valorLimpo) * fatorConversao;
  
  if (isNaN(numero)) {
    throw new Error('Valor deve ser um número válido');
  }
  
  // Validar limites
  if (rules.min !== undefined && numero < rules.min) {
    throw new Error(`Valor deve ser maior ou igual a ${rules.min}`);
  }
  if (rules.max !== undefined && numero > rules.max) {
    throw new Error(`Valor deve ser menor ou igual a ${rules.max}`);
  }
  
  // Aplicar arredondamento se especificado
  if (rules.decimais !== undefined) {
    return Math.round(numero * Math.pow(10, rules.decimais)) / Math.pow(10, rules.decimais);
  }
  
  return numero;
}

/**
 * Parseia valores de data
 * @param {string} raw - Valor bruto
 * @param {Object} rules - Regras de validação
 * @returns {string} Data em formato ISO
 */
function parseData(raw, rules) {
  const data = new Date(raw);
  if (isNaN(data.getTime())) {
    throw new Error('Valor deve ser uma data válida');
  }
  
  // Validar limites de data se especificados
  if (rules.data_min) {
    const dataMin = new Date(rules.data_min);
    if (data < dataMin) {
      throw new Error(`Data deve ser posterior a ${rules.data_min}`);
    }
  }
  if (rules.data_max) {
    const dataMax = new Date(rules.data_max);
    if (data > dataMax) {
      throw new Error(`Data deve ser anterior a ${rules.data_max}`);
    }
  }
  
  return data.toISOString();
}

/**
 * Parseia valores booleanos
 * @param {string} raw - Valor bruto
 * @param {Object} rules - Regras de validação
 * @returns {boolean} Valor booleano
 */
function parseBooleano(raw, rules) {
  const valorLower = raw.toLowerCase();
  
  const valoresVerdadeiros = rules.valores_verdadeiros || 
    ['true', 'sim', 's', '1', 'verdadeiro', 'yes', 'y'];
  const valoresFalsos = rules.valores_falsos || 
    ['false', 'não', 'nao', 'n', '0', 'falso', 'no'];
  
  if (valoresVerdadeiros.includes(valorLower)) {
    return true;
  }
  if (valoresFalsos.includes(valorLower)) {
    return false;
  }
  
  throw new Error('Valor deve ser verdadeiro ou falso');
}

/**
 * Parseia valores de pressão arterial
 * @param {string} raw - Valor bruto
 * @param {Object} rules - Regras de validação
 * @returns {Object} Objeto com sistólica, diastólica e texto original
 */
function parsePressaoArterial(raw, rules) {
  // Detectar separadores aceitos
  const separadores = rules.separadores_aceitos || ['/', 'x', 'por'];
  let separadorEncontrado = null;
  
  for (const sep of separadores) {
    if (raw.includes(sep)) {
      separadorEncontrado = sep;
      break;
    }
  }
  
  if (!separadorEncontrado) {
    throw new Error(`Pressão arterial deve usar um dos separadores: ${separadores.join(', ')}`);
  }
  
  const partes = raw.split(separadorEncontrado);
  if (partes.length !== 2) {
    throw new Error('Pressão arterial deve ter exatamente dois valores');
  }
  
  const sistolica = parseInt(partes[0].trim());
  const diastolica = parseInt(partes[1].trim());
  
  if (isNaN(sistolica) || isNaN(diastolica)) {
    throw new Error('Valores de pressão arterial devem ser números válidos');
  }
  
  // Validar limites usando regras da tag
  const limiteSistolica = rules.sistolica || { min: 50, max: 300 };
  const limiteDiastolica = rules.diastolica || { min: 30, max: 200 };
  
  if (sistolica < limiteSistolica.min || sistolica > limiteSistolica.max) {
    throw new Error(`Pressão sistólica deve estar entre ${limiteSistolica.min} e ${limiteSistolica.max} mmHg`);
  }
  if (diastolica < limiteDiastolica.min || diastolica > limiteDiastolica.max) {
    throw new Error(`Pressão diastólica deve estar entre ${limiteDiastolica.min} e ${limiteDiastolica.max} mmHg`);
  }
  if (sistolica <= diastolica) {
    throw new Error('Pressão sistólica deve ser maior que a diastólica');
  }
  
  return {
    sistolica,
    diastolica,
    texto: raw,
    unidade: rules.unidade || 'mmHg'
  };
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

// Exportações ES6 para frontend
export {
  parseSections,
  validateAndParse,
  parseNumero,
  parseData,
  parseBooleano,
  parsePressaoArterial,
  sectionsToText,
  isValidTagCode,
  extractTagCodes,
  validateRequiredTags,
  calculateStats
};

// Exportações para compatibilidade CommonJS (Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseSections,
    validateAndParse,
    parseNumero,
    parseData,
    parseBooleano,
    parsePressaoArterial,
    sectionsToText,
    isValidTagCode,
    extractTagCodes,
    validateRequiredTags,
    calculateStats
  };
}