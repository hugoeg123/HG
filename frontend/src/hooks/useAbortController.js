import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing AbortController to cancel pending requests
 * 
 * @returns {Object} - Object with abortController and createAbortSignal function
 * 
 * @example
 * const { abortController, createAbortSignal } = useAbortController();
 * 
 * useEffect(() => {
 *   const signal = createAbortSignal();
 *   fetchData({ signal });
 * }, []);
 * 
 * Connector: Integrates with API calls to prevent ERR_INSUFFICIENT_RESOURCES
 * Hook: Automatically cancels pending requests when component unmounts
 */
export const useAbortController = () => {
  const abortControllerRef = useRef(null);

  const createAbortSignal = useCallback(() => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current.signal;
  }, []);

  const abortPendingRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortPendingRequests();
    };
  }, []);

  return {
    abortController: abortControllerRef.current,
    createAbortSignal,
    abortPendingRequests
  };
};

/**
 * Custom hook for managing multiple AbortControllers by key
 * 
 * @returns {Object} - Object with functions to manage multiple abort controllers
 * 
 * @example
 * const { createSignal, abortRequest, abortAll } = useMultipleAbortControllers();
 * 
 * const fetchPatient = async (id) => {
 *   const signal = createSignal(`patient-${id}`);
 *   return api.get(`/patients/${id}`, { signal });
 * };
 * 
 * Hook: Manages multiple concurrent requests with individual cancellation
 */
export const useMultipleAbortControllers = () => {
  const controllersRef = useRef(new Map());

  const createSignal = useCallback((key) => {
    // Cancel previous request with same key
    if (controllersRef.current.has(key)) {
      console.debug(`Canceling previous request for key: ${key}`);
      controllersRef.current.get(key).abort();
    }

    // Create new controller for this key
    const controller = new AbortController();
    controllersRef.current.set(key, controller);
    
    return controller.signal;
  }, []);

  const abortRequest = useCallback((key) => {
    const controller = controllersRef.current.get(key);
    if (controller) {
      controller.abort();
      controllersRef.current.delete(key);
    }
  }, []);

  const abortAll = useCallback(() => {
    controllersRef.current.forEach((controller) => {
      controller.abort();
    });
    controllersRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortAll();
    };
  }, []);

  return {
    createSignal,
    abortRequest,
    abortAll
  };
};