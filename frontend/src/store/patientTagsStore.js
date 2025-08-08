import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeHeight, normalizeWeight } from '../lib/normalizers';
import { events } from '../lib/events';

/**
 * Patient Tags Store - Manages tag values for patients
 * 
 * Connectors:
 * - Integrates with tagCatalogStore.js for tag definitions
 * - Used in PatientView components for tag display
 * - Triggers events for calculator updates
 * 
 * Hook: Provides normalized tag storage with automatic calculation triggers
 * IA prompt: Add validation, conflict resolution, and audit trail
 */

/**
 * @typedef {Object} TagValue
 * @property {string} tagKey - Tag identifier
 * @property {any} raw - Original input value
 * @property {any} value - Normalized value
 * @property {string|null} unit - Unit of measurement
 * @property {'manual'|'calc'|'import'|'ai'} source - Source of the value
 * @property {string} timestamp - When the value was set
 * @property {string} userId - Who set the value
 */

const usePatientTagsStore = create(
  persist(
    (set, get) => ({
      // State: { patientId: { tagKey: TagValue } }
      byPatient: {},
      loading: {},
      errors: {},

      // Actions
      /**
       * Upsert tag value for a patient
       * Hook: Triggers normalization and calculator updates
       */
      upsert: async (patientId, { tagKey, raw, source = 'manual', userId = null }) => {
        try {
          // Normalize value based on tag type
          let normalized;
          switch (tagKey) {
            case 'H':
              normalized = normalizeHeight(raw);
              break;
            case 'P':
              normalized = normalizeWeight(raw);
              break;
            default:
              // For other tags, try to parse as number if possible
              const numValue = parseFloat(String(raw).replace(',', '.'));
              normalized = isNaN(numValue) ? { value: raw } : { value: numValue };
          }

          const tagValue = {
            tagKey,
            raw,
            value: normalized.value,
            unit: normalized.unit || null,
            source,
            timestamp: new Date().toISOString(),
            userId
          };

          // Update store
          const currentPatientTags = get().byPatient[patientId] || {};
          const updatedPatientTags = {
            ...currentPatientTags,
            [tagKey]: tagValue
          };

          set({
            byPatient: {
              ...get().byPatient,
              [patientId]: updatedPatientTags
            },
            errors: {
              ...get().errors,
              [patientId]: {
                ...get().errors[patientId],
                [tagKey]: null // Clear any previous error
              }
            }
          });

          // Emit event for calculator updates
          events.emit('tag.updated', { tagKey, patientId, value: tagValue });

          return tagValue;
        } catch (error) {
          console.error(`Erro ao normalizar tag ${tagKey}:`, error);
          
          // Store error
          set({
            errors: {
              ...get().errors,
              [patientId]: {
                ...get().errors[patientId],
                [tagKey]: error.message
              }
            }
          });
          
          throw error;
        }
      },

      /**
       * Get all tag values for a patient
       * Hook: Used by calculator components and patient views
       */
      getFor: (patientId) => {
        return get().byPatient[patientId] || {};
      },

      /**
       * Get specific tag value for a patient
       * Hook: Used for individual tag lookups
       */
      getTag: (patientId, tagKey) => {
        const patientTags = get().byPatient[patientId] || {};
        return patientTags[tagKey] || null;
      },

      /**
       * Get tag value with fallback
       * Hook: Used in calculations where default values are needed
       */
      getTagValue: (patientId, tagKey, defaultValue = null) => {
        const tagData = get().getTag(patientId, tagKey);
        return tagData ? tagData.value : defaultValue;
      },

      /**
       * Remove tag value for a patient
       * Hook: Called when tag values are deleted
       */
      remove: (patientId, tagKey) => {
        const currentPatientTags = get().byPatient[patientId] || {};
        const { [tagKey]: removed, ...remainingTags } = currentPatientTags;

        set({
          byPatient: {
            ...get().byPatient,
            [patientId]: remainingTags
          }
        });

        // Emit event for calculator updates
        events.emit('tag.updated', { tagKey, patientId, value: null });
      },

      /**
       * Remove all tags for a patient
       * Hook: Called when patient is deleted
       */
      removePatient: (patientId) => {
        const { [patientId]: removed, ...remainingPatients } = get().byPatient;
        const { [patientId]: removedErrors, ...remainingErrors } = get().errors;
        const { [patientId]: removedLoading, ...remainingLoading } = get().loading;

        set({
          byPatient: remainingPatients,
          errors: remainingErrors,
          loading: remainingLoading
        });
      },

      /**
       * Get tags by source type
       * Hook: Used for filtering calculated vs manual values
       */
      getBySource: (patientId, source) => {
        const patientTags = get().byPatient[patientId] || {};
        return Object.entries(patientTags)
          .filter(([_, tagValue]) => tagValue.source === source)
          .reduce((acc, [tagKey, tagValue]) => {
            acc[tagKey] = tagValue;
            return acc;
          }, {});
      },

      /**
       * Get tags modified after a specific date
       * Hook: Used for sync and audit purposes
       */
      getModifiedAfter: (patientId, timestamp) => {
        const patientTags = get().byPatient[patientId] || {};
        return Object.entries(patientTags)
          .filter(([_, tagValue]) => new Date(tagValue.timestamp) > new Date(timestamp))
          .reduce((acc, [tagKey, tagValue]) => {
            acc[tagKey] = tagValue;
            return acc;
          }, {});
      },

      /**
       * Bulk update tags for a patient
       * Hook: Used for importing data or batch operations
       */
      bulkUpsert: async (patientId, tagUpdates, source = 'import') => {
        const results = [];
        const errors = [];

        for (const { tagKey, raw } of tagUpdates) {
          try {
            const result = await get().upsert(patientId, { tagKey, raw, source });
            results.push(result);
          } catch (error) {
            errors.push({ tagKey, error: error.message });
          }
        }

        return { results, errors };
      },

      /**
       * Get error for a specific tag
       * Hook: Used for displaying validation errors
       */
      getError: (patientId, tagKey) => {
        const patientErrors = get().errors[patientId] || {};
        return patientErrors[tagKey] || null;
      },

      /**
       * Clear error for a specific tag
       * Hook: Called when user fixes validation issues
       */
      clearError: (patientId, tagKey) => {
        set({
          errors: {
            ...get().errors,
            [patientId]: {
              ...get().errors[patientId],
              [tagKey]: null
            }
          }
        });
      },

      /**
       * Get summary statistics for a patient
       * Hook: Used in patient overview components
       */
      getStats: (patientId) => {
        const patientTags = get().byPatient[patientId] || {};
        const tags = Object.values(patientTags);
        
        return {
          total: tags.length,
          manual: tags.filter(t => t.source === 'manual').length,
          calculated: tags.filter(t => t.source === 'calc').length,
          imported: tags.filter(t => t.source === 'import').length,
          lastUpdated: tags.length > 0 
            ? Math.max(...tags.map(t => new Date(t.timestamp).getTime()))
            : null
        };
      },

      /**
       * Export patient tags for backup or transfer
       * Hook: Used in export functionality
       */
      exportPatient: (patientId) => {
        const patientTags = get().byPatient[patientId] || {};
        return {
          patientId,
          tags: patientTags,
          exportedAt: new Date().toISOString(),
          version: '1.0'
        };
      },

      /**
       * Import patient tags from backup
       * Hook: Used in import functionality
       */
      importPatient: async (data) => {
        const { patientId, tags } = data;
        
        // Validate data structure
        if (!patientId || !tags) {
          throw new Error('Dados de importação inválidos');
        }

        // Import tags
        set({
          byPatient: {
            ...get().byPatient,
            [patientId]: tags
          }
        });

        // Emit events for all imported tags
        Object.keys(tags).forEach(tagKey => {
          events.emit('tag.updated', { tagKey, patientId, value: tags[tagKey] });
        });

        return Object.keys(tags).length;
      },

      /**
       * Reset store to initial state
       * Hook: Called on logout or app reset
       */
      reset: () => {
        set({
          byPatient: {},
          loading: {},
          errors: {}
        });
      }
    }),
    {
      name: 'patient-tags-storage',
      // Only persist the tag values, not loading states or errors
      partialize: (state) => ({ byPatient: state.byPatient })
    }
  )
);

export default usePatientTagsStore;

// Named exports for convenience
export { usePatientTagsStore };

/**
 * Hook for getting tag values with reactive updates
 * 
 * @param {string} patientId - Patient identifier
 * @param {string[]} tagKeys - Tag keys to watch
 * @returns {Object} Tag values object
 * 
 * Hook: Provides reactive tag values for calculator components
 */
export const usePatientTagValues = (patientId, tagKeys = []) => {
  return usePatientTagsStore(state => {
    const patientTags = state.byPatient[patientId] || {};
    
    if (tagKeys.length === 0) {
      return patientTags;
    }
    
    return tagKeys.reduce((acc, tagKey) => {
      acc[tagKey] = patientTags[tagKey] || null;
      return acc;
    }, {});
  });
};

/**
 * Hook for getting normalized tag values for calculations
 * 
 * @param {string} patientId - Patient identifier
 * @param {string[]} tagKeys - Tag keys to get values for
 * @returns {Object} Normalized values object
 * 
 * Hook: Provides clean values for mathematical operations
 */
export const useNormalizedTagValues = (patientId, tagKeys) => {
  return usePatientTagsStore(state => {
    const patientTags = state.byPatient[patientId] || {};
    
    return tagKeys.reduce((acc, tagKey) => {
      const tagData = patientTags[tagKey];
      acc[tagKey] = tagData ? tagData.value : null;
      return acc;
    }, {});
  });
};