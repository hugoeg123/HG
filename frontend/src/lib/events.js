import mitt from 'mitt';

/**
 * Event Bus for Tag System
 * 
 * Connectors:
 * - Used by patientTagsStore.js to emit tag updates
 * - Consumed by calculatorStore.js for reactive calculations
 * - Integrated with UI components for real-time updates
 * 
 * Hook: Provides decoupled communication between tag and calculator systems
 * IA prompt: Add event persistence, replay functionality, and debugging tools
 */

/**
 * @typedef {Object} TagUpdatedEvent
 * @property {string} tagKey - The tag that was updated
 * @property {string} patientId - Patient identifier
 * @property {Object|null} value - New tag value or null if deleted
 */

/**
 * @typedef {Object} CalculatorUpdatedEvent
 * @property {string} calculatorId - Calculator identifier
 * @property {string} patientId - Patient identifier
 * @property {Object} result - Calculation result
 */

/**
 * @typedef {Object} TagCreatedEvent
 * @property {Object} tagDef - New tag definition
 * @property {string} source - Source of creation ('ui'|'import'|'api')
 */

/**
 * Event types for the tag system
 */
export const EVENT_TYPES = {
  TAG_UPDATED: 'tag.updated',
  TAG_CREATED: 'tag.created',
  TAG_DELETED: 'tag.deleted',
  CALCULATOR_UPDATED: 'calculator.updated',
  CALCULATOR_EXECUTED: 'calculator.executed',
  PATIENT_SELECTED: 'patient.selected',
  VALIDATION_ERROR: 'validation.error',
  NORMALIZATION_WARNING: 'normalization.warning'
};

/**
 * Global event emitter instance
 * Hook: Singleton pattern ensures consistent event handling across the app
 */
export const events = mitt();

/**
 * Event listener management utilities
 * Hook: Provides React-friendly event handling with automatic cleanup
 */
export class EventManager {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Add event listener with automatic cleanup tracking
   * 
   * @param {string} eventType - Event type to listen for
   * @param {Function} handler - Event handler function
   * @param {string} [componentId] - Optional component identifier for debugging
   * @returns {Function} Cleanup function
   */
  on(eventType, handler, componentId = null) {
    const wrappedHandler = (data) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${eventType}:`, error);
        if (componentId) {
          console.error(`Component: ${componentId}`);
        }
      }
    };

    events.on(eventType, wrappedHandler);
    
    // Track listener for cleanup
    const listenerId = `${eventType}_${Date.now()}_${Math.random()}`;
    this.listeners.set(listenerId, { eventType, handler: wrappedHandler, componentId });
    
    // Return cleanup function
    return () => {
      events.off(eventType, wrappedHandler);
      this.listeners.delete(listenerId);
    };
  }

  /**
   * Remove all listeners for a component
   * Hook: Called in React useEffect cleanup
   */
  cleanup(componentId) {
    for (const [listenerId, { eventType, handler, componentId: id }] of this.listeners) {
      if (id === componentId) {
        events.off(eventType, handler);
        this.listeners.delete(listenerId);
      }
    }
  }

  /**
   * Remove all listeners
   * Hook: Called on app shutdown or reset
   */
  cleanupAll() {
    for (const [listenerId, { eventType, handler }] of this.listeners) {
      events.off(eventType, handler);
    }
    this.listeners.clear();
  }

  /**
   * Get debug information about active listeners
   * Hook: Used for debugging event system issues
   */
  getDebugInfo() {
    const listenersByType = {};
    for (const [listenerId, { eventType, componentId }] of this.listeners) {
      if (!listenersByType[eventType]) {
        listenersByType[eventType] = [];
      }
      listenersByType[eventType].push({ listenerId, componentId });
    }
    return {
      totalListeners: this.listeners.size,
      listenersByType
    };
  }
}

/**
 * Global event manager instance
 */
export const eventManager = new EventManager();

/**
 * React hook for event listening with automatic cleanup
 * 
 * @param {string} eventType - Event type to listen for
 * @param {Function} handler - Event handler function
 * @param {Array} deps - Dependency array for handler
 * @param {string} [componentName] - Component name for debugging
 * 
 * Hook: Provides React-friendly event handling
 */
export const useEventListener = (eventType, handler, deps = [], componentName = null) => {
  const { useEffect, useCallback } = require('react');
  
  const memoizedHandler = useCallback(handler, deps);
  
  useEffect(() => {
    const cleanup = eventManager.on(eventType, memoizedHandler, componentName);
    return cleanup;
  }, [eventType, memoizedHandler, componentName]);
};

// Export individual event functions for direct use
export const on = events.on.bind(events);
export const off = events.off.bind(events);
export const emit = events.emit.bind(events);

/**
 * Utility functions for common event patterns
 */
export const eventUtils = {
  // Include the basic event functions
  on: events.on.bind(events),
  off: events.off.bind(events),
  emit: events.emit.bind(events),

  /**
   * Emit tag updated event with validation
   * Hook: Used by tag stores to ensure consistent event format
   */
  emitTagUpdated: (tagKey, patientId, value) => {
    if (!tagKey || !patientId) {
      console.warn('Invalid tag update event: missing tagKey or patientId');
      return;
    }
    
    events.emit(EVENT_TYPES.TAG_UPDATED, { tagKey, patientId, value });
  },

  /**
   * Emit calculator executed event
   * Hook: Used by calculator system to notify UI of results
   */
  emitCalculatorExecuted: (calculatorId, patientId, result) => {
    if (!calculatorId || !patientId) {
      console.warn('Invalid calculator execution event: missing calculatorId or patientId');
      return;
    }
    
    events.emit(EVENT_TYPES.CALCULATOR_EXECUTED, { calculatorId, patientId, result });
  },

  /**
   * Emit validation error event
   * Hook: Used for centralized error handling and display
   */
  emitValidationError: (field, message, context = {}) => {
    events.emit(EVENT_TYPES.VALIDATION_ERROR, { field, message, context, timestamp: new Date().toISOString() });
  },

  /**
   * Emit normalization warning
   * Hook: Used when automatic value conversion occurs
   */
  emitNormalizationWarning: (tagKey, originalValue, normalizedValue, reason) => {
    events.emit(EVENT_TYPES.NORMALIZATION_WARNING, {
      tagKey,
      originalValue,
      normalizedValue,
      reason,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Event debugging utilities
 * Hook: Provides tools for debugging event flow in development
 */
export const eventDebug = {
  /**
   * Log all events to console (development only)
   */
  enableLogging: () => {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Event logging should only be enabled in development');
      return;
    }
    
    Object.values(EVENT_TYPES).forEach(eventType => {
      events.on(eventType, (data) => {
        console.log(`🔔 Event: ${eventType}`, data);
      });
    });
  },

  /**
   * Get event statistics
   */
  getStats: () => {
    return {
      eventManager: eventManager.getDebugInfo(),
      eventTypes: Object.keys(EVENT_TYPES).length
    };
  },

  /**
   * Test event system
   */
  test: () => {
    console.log('Testing event system...');
    
    const testHandler = (data) => {
      console.log('Test event received:', data);
    };
    
    const cleanup = eventManager.on('test.event', testHandler, 'debug-test');
    events.emit('test.event', { message: 'Hello from event system!' });
    
    setTimeout(() => {
      cleanup();
      console.log('Event system test completed');
    }, 100);
  }
};

// Enable event logging in development
if (process.env.NODE_ENV === 'development') {
  // Uncomment to enable event logging
  // eventDebug.enableLogging();
}

export default events;