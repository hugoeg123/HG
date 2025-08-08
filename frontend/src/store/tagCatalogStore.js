import { create } from 'zustand';
import { tagService } from '../services/api';

/**
 * Tag Catalog Store - Global state management for tag definitions
 * 
 * Connectors:
 * - Used in CalculatorModal.jsx for tag selection
 * - Integrates with tagService.js for API calls
 * - Referenced in TagToolbar.jsx for tag creation
 * 
 * Hook: Provides centralized tag management with immediate updates
 * IA prompt: Extend with tag validation, caching, and offline support
 */

/**
 * @typedef {Object} TagDef
 * @property {string} id - Unique identifier
 * @property {string} key - Tag code (e.g., 'H', 'P', 'BMI')
 * @property {string} label - Human readable label
 * @property {'number'|'int'|'string'|'bool'|'date'} datatype - Data type
 * @property {string|null} unit - Unit of measurement
 * @property {'patient'|'encounter'|'record'} scope - Scope of the tag
 * @property {string[]} examples - Usage examples
 * @property {string} description - Detailed description
 * @property {boolean} isActive - Whether tag is active
 */

const useTagCatalogStore = create((set, get) => ({
  // State
  defs: [],
  ready: false,
  loading: false,
  error: null,
  lastUpdated: null,

  // Actions
  /**
   * Refresh tag definitions from API
   * Hook: Called on component mount and after tag creation
   */
  refresh: async () => {
    const state = get();
    if (state.loading) return; // Prevent concurrent requests

    set({ loading: true, error: null });
    
    try {
      // Try to get from API, fallback to seed data
      let tags = [];
      try {
        const response = await tagService.getAll();
        // aceita array puro OU objeto { data: [] }
        const payload = response?.data;
        tags = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
      } catch (apiError) {
        console.warn('API not available, using seed data:', apiError);
        // Fallback to seed data
        tags = [
          { key: 'H', label: 'Altura', datatype: 'number', unit: 'm', scope: 'patient', examples: ['170 cm', '1.70 m'] },
          { key: 'P', label: 'Peso', datatype: 'number', unit: 'kg', scope: 'patient', examples: ['70 kg'] },
          { key: 'PA_SYS', label: 'PA Sistólica', datatype: 'integer', unit: 'mmHg', scope: 'encounter' },
          { key: 'PA_DIA', label: 'PA Diastólica', datatype: 'integer', unit: 'mmHg', scope: 'encounter' },
        ];
      }
      
      // Transform API response to TagDef format
      const tagDefs = tags.map(tag => ({
        id: tag.id || tag.key,
        key: tag.code || tag.key || tag.name?.toUpperCase(),
        label: tag.name || tag.label,
        datatype: tag.datatype || 'string',
        unit: tag.unit || null,
        scope: tag.scope || 'record',
        examples: tag.examples || [],
        description: tag.description || '',
        isActive: tag.isActive !== false
      }));

      set({ 
        defs: tagDefs, 
        ready: true, 
        loading: false,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao carregar catálogo de tags:', error);
      // Set empty array as fallback to prevent map errors
      set({ 
        defs: [],
        error: error.message || 'Erro ao carregar tags',
        loading: false,
        ready: true // Mark as ready even on error to prevent infinite loading
      });
    }
  },

  /**
   * Add new tag definition to catalog
   * Hook: Called immediately after tag creation to update UI
   */
  add: (tagDef) => {
    const currentDefs = get().defs || []; // Ensure it's always an array
    const updatedDefs = [
      ...currentDefs.filter(d => d.key !== tagDef.key),
      tagDef
    ];
    
    set({ 
      defs: updatedDefs,
      lastUpdated: new Date().toISOString()
    });
  },

  /**
   * Update existing tag definition
   * Hook: Called after tag edit operations
   */
  update: (tagKey, updates) => {
    const currentDefs = get().defs || []; // Ensure it's always an array
    const updatedDefs = currentDefs.map(def => 
      def.key === tagKey ? { ...def, ...updates } : def
    );
    
    set({ 
      defs: updatedDefs,
      lastUpdated: new Date().toISOString()
    });
  },

  /**
   * Remove tag definition from catalog
   * Hook: Called after tag deletion
   */
  remove: (tagKey) => {
    const currentDefs = get().defs || []; // Ensure it's always an array
    const updatedDefs = currentDefs.filter(def => def.key !== tagKey);
    
    set({ 
      defs: updatedDefs,
      lastUpdated: new Date().toISOString()
    });
  },

  /**
   * Get tag definition by key
   * Hook: Used for tag validation and display
   */
  getByKey: (tagKey) => {
    const defs = get().defs || []; // Ensure it's always an array
    return defs.find(def => def.key === tagKey);
  },

  /**
   * Get tags filtered by scope
   * Hook: Used to show relevant tags based on context
   */
  getByScope: (scope) => {
    const defs = get().defs || []; // Ensure it's always an array
    return defs.filter(def => def.scope === scope && def.isActive);
  },

  /**
   * Search tags by query
   * Hook: Used in tag selection components
   */
  search: (query) => {
    const defs = get().defs || []; // Ensure it's always an array
    if (!query) return defs.filter(def => def.isActive);
    
    const lowerQuery = query.toLowerCase();
    return defs.filter(def => 
      def.isActive && (
        def.key.toLowerCase().includes(lowerQuery) ||
        def.label.toLowerCase().includes(lowerQuery) ||
        def.description.toLowerCase().includes(lowerQuery)
      )
    );
  },

  /**
   * Clear error state
   * Hook: Called when user dismisses error messages
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset store to initial state
   * Hook: Called on logout or app reset
   */
  reset: () => {
    set({
      defs: [],
      ready: false,
      loading: false,
      error: null,
      lastUpdated: null
    });
  }
}));

export default useTagCatalogStore;

// Named exports for convenience
export { useTagCatalogStore };

/**
 * Hook for getting formatted tag options for select components
 * 
 * @param {Object} options - Configuration options
 * @param {string[]} options.scopes - Filter by scopes
 * @param {boolean} options.includeInactive - Include inactive tags
 * @returns {Array} Formatted options for select components
 * 
 * Hook: Used in CalculatorModal and other tag selection components
 */
export const useTagOptions = (options = {}) => {
  const { scopes, includeInactive = false } = options;
  
  return useTagCatalogStore(state => {
    let tags = state.defs;
    
    if (!includeInactive) {
      tags = tags.filter(tag => tag.isActive);
    }
    
    if (scopes && scopes.length > 0) {
      tags = tags.filter(tag => scopes.includes(tag.scope));
    }
    
    return tags.map(tag => ({
      value: tag.key,
      label: `${tag.key} — ${tag.label} (${tag.datatype}${tag.unit ? `, ${tag.unit}` : ''})`,
      tooltip: tag.examples?.join(' · ') || tag.description,
      tag: tag
    }));
  });
};

/**
 * Seed data for development and testing
 * Hook: Provides initial tag definitions when API is not available
 */
export const seedTagDefinitions = () => {
  const { add } = useTagCatalogStore.getState();
  
  const seedTags = [
    {
      id: 'seed-1',
      key: 'H',
      label: 'Altura',
      datatype: 'number',
      unit: 'm',
      scope: 'patient',
      examples: ['170 cm', '1,70 m', '1.75'],
      description: 'Altura do paciente em metros',
      isActive: true
    },
    {
      id: 'seed-2',
      key: 'P',
      label: 'Peso',
      datatype: 'number',
      unit: 'kg',
      scope: 'patient',
      examples: ['70 kg', '75.5', '80,2 kg'],
      description: 'Peso do paciente em quilogramas',
      isActive: true
    },
    {
      id: 'seed-3',
      key: 'BMI',
      label: 'Índice de Massa Corporal',
      datatype: 'number',
      unit: 'kg/m²',
      scope: 'patient',
      examples: ['25.3', '18.5', '30.1'],
      description: 'Índice de massa corporal calculado',
      isActive: true
    },
    {
      id: 'seed-4',
      key: 'PA',
      label: 'Pressão Arterial',
      datatype: 'string',
      unit: 'mmHg',
      scope: 'encounter',
      examples: ['120/80', '140/90', '110/70'],
      description: 'Pressão arterial sistólica/diastólica',
      isActive: true
    },
    {
      id: 'seed-5',
      key: 'FC',
      label: 'Frequência Cardíaca',
      datatype: 'number',
      unit: 'bpm',
      scope: 'encounter',
      examples: ['72', '85', '60'],
      description: 'Frequência cardíaca em batimentos por minuto',
      isActive: true
    }
  ];
  
  seedTags.forEach(tag => add(tag));
};