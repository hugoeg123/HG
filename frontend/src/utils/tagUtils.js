/**
 * Tag utilities for consistent tag handling across components
 * 
 * Integrates with:
 * - PatientView components for tag normalization
 * - RecordViewer for consistent tag display
 * - RecordsList for tag formatting
 * 
 * IA prompt: Extend with tag categorization and medical specialty grouping
 */

// Standard medical tag labels with Portuguese descriptions
export const TAG_LABELS = {
  HD: 'Hipótese Diagnóstica',
  HMA: 'História da Moléstia Atual',
  EF: 'Exame Físico',
  SV: 'Sinais Vitais',
  RX: 'Exames de Imagem',
  LAB: 'Exames Laboratoriais',
  COND: 'Conduta / Plano',
  PROG: 'Prognóstico',
  ANAM: 'Anamnese',
  DIAG: 'Diagnóstico',
  TRAT: 'Tratamento',
  EVOL: 'Evolução',
  // Additional common medical tags
  AP: 'Antecedentes Pessoais',
  AF: 'Antecedentes Familiares',
  MED: 'Medicações',
  ALER: 'Alergias',
  PROC: 'Procedimentos',
  COMP: 'Complicações',
  OBS: 'Observações'
};

/**
 * Normalizes raw tag data into consistent format
 * 
 * @param {Array|string|Object} raw - Raw tag data from various sources
 * @param {number} maxTags - Maximum number of tags to return (default: 8)
 * @returns {Array<string>} Normalized tag codes in uppercase
 * 
 * @example
 * normalizeTags(['hd', 'HMA', {code: 'ef'}, {name: 'lab'}]) 
 * // Returns: ['HD', 'HMA', 'EF', 'LAB']
 * 
 * Hook: Used across PatientView components for consistent tag display
 */
export function normalizeTags(raw, maxTags = 8) {
  if (!raw) return [];
  
  const arr = Array.isArray(raw) ? raw : [raw];
  
  return arr
    .map(tag => {
      if (typeof tag === 'string') {
        return tag.trim().toUpperCase();
      }
      if (typeof tag === 'object' && tag !== null) {
        // Handle different object structures
        return (tag.code || tag.name || tag.value || tag.tag || '').toString().trim().toUpperCase();
      }
      return '';
    })
    .filter(Boolean) // Remove empty strings
    .filter(tag => tag.length > 0) // Extra safety check
    .slice(0, maxTags); // Limit number of tags
}

/**
 * Gets the display label for a tag code
 * 
 * @param {string} tagCode - The tag code (e.g., 'HD', 'HMA')
 * @returns {string} Human-readable label or the code itself if not found
 * 
 * @example
 * getTagLabel('HD') // Returns: 'Hipótese Diagnóstica'
 * getTagLabel('UNKNOWN') // Returns: 'UNKNOWN'
 */
export function getTagLabel(tagCode) {
  if (!tagCode || typeof tagCode !== 'string') return '';
  return TAG_LABELS[tagCode.toUpperCase()] || tagCode;
}

/**
 * Formats a tag for display with proper styling classes
 * 
 * @param {string} tag - The tag code
 * @param {string} variant - Style variant ('default', 'compact', 'viewer')
 * @returns {Object} Object with tag info and CSS classes
 * 
 * @example
 * formatTagForDisplay('HD', 'default')
 * // Returns: { code: 'HD', label: 'Hipótese Diagnóstica', className: '...' }
 */
export function formatTagForDisplay(tag, variant = 'default') {
  const code = tag.toUpperCase();
  const label = getTagLabel(code);
  
  const variants = {
    default: 'inline-block px-2 py-1 text-[11px] sm:text-xs font-medium uppercase bg-teal-600/20 text-teal-300 rounded border border-teal-500/30 whitespace-nowrap cursor-help',
    compact: 'px-1.5 py-0.5 bg-teal-900 text-teal-200 text-xs rounded-full',
    viewer: 'px-3 py-1 bg-teal-900/30 text-teal-300 border border-teal-500/30 rounded-md text-sm'
  };
  
  return {
    code,
    label,
    className: variants[variant] || variants.default
  };
}

/**
 * Groups tags by medical category for better organization
 * 
 * @param {Array<string>} tags - Array of normalized tag codes
 * @returns {Object} Tags grouped by category
 * 
 * @example
 * groupTagsByCategory(['HD', 'HMA', 'LAB', 'RX'])
 * // Returns: { diagnostic: ['HD'], history: ['HMA'], exams: ['LAB', 'RX'] }
 */
export function groupTagsByCategory(tags) {
  const categories = {
    diagnostic: ['HD', 'DIAG', 'PROG'],
    history: ['HMA', 'ANAM', 'AP', 'AF'],
    examination: ['EF', 'SV'],
    exams: ['LAB', 'RX'],
    treatment: ['TRAT', 'COND', 'MED', 'PROC'],
    evolution: ['EVOL', 'COMP', 'OBS']
  };
  
  const grouped = {};
  
  Object.entries(categories).forEach(([category, categoryTags]) => {
    const matchingTags = tags.filter(tag => categoryTags.includes(tag));
    if (matchingTags.length > 0) {
      grouped[category] = matchingTags;
    }
  });
  
  // Add uncategorized tags
  const categorizedTags = Object.values(categories).flat();
  const uncategorized = tags.filter(tag => !categorizedTags.includes(tag));
  if (uncategorized.length > 0) {
    grouped.other = uncategorized;
  }
  
  return grouped;
}

// Connector: Exports utilities used across PatientView components
// Hook: Integrates with TAG_LABELS constant for consistent labeling