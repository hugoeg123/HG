
const STORAGE_KEY_PREFIX = 'hg_record_draft_';

const dispatchDraftEvent = (patientId, action) => {
  const event = new CustomEvent('draft_updated', {
    detail: { patientId, action }
  });
  window.dispatchEvent(event);
};

export const draftService = {
  /**
   * Save a draft for a specific patient
   * @param {string} patientId 
   * @param {Object} data - { content, title, recordType, timestamp }
   */
  saveDraft: (patientId, data) => {
    if (!patientId) return;
    const key = `${STORAGE_KEY_PREFIX}${patientId}`;
    const payload = {
      ...data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(payload));
    dispatchDraftEvent(patientId, 'save');
  },

  /**
   * Get a draft for a specific patient
   * @param {string} patientId 
   * @returns {Object|null}
   */
  getDraft: (patientId) => {
    if (!patientId) return null;
    const key = `${STORAGE_KEY_PREFIX}${patientId}`;
    const data = localStorage.getItem(key);
    try {
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error parsing draft:', e);
      return null;
    }
  },

  /**
   * Clear draft for a specific patient
   * @param {string} patientId 
   */
  clearDraft: (patientId) => {
    if (!patientId) return;
    const key = `${STORAGE_KEY_PREFIX}${patientId}`;
    localStorage.removeItem(key);
    dispatchDraftEvent(patientId, 'clear');
  },

  /**
   * Check if a draft exists
   * @param {string} patientId 
   * @returns {boolean}
   */
  hasDraft: (patientId) => {
    return !!draftService.getDraft(patientId);
  }
};
