import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for debouncing values to prevent excessive API calls
 * 
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} - The debounced value
 * 
 * @example
 * const debouncedSearchTerm = useDebounce(searchTerm, 300);
 * 
 * Connector: Used in components to prevent rapid API calls
 * Hook: Integrates with PatientStore and other services to reduce network load
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Custom hook for debouncing function calls - optimized to prevent re-renders
 * 
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - The debounced function
 * 
 * @example
 * const debouncedFetch = useDebounceCallback(fetchData, 500);
 * 
 * Hook: Prevents multiple rapid function calls without causing component re-renders
 */
export const useDebounceCallback = (func, delay) => {
  const debounceTimer = useRef(null);
  const funcRef = useRef(func);
  
  // Update function reference without causing re-render
  funcRef.current = func;

  const debouncedFunction = useCallback((...args) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      funcRef.current(...args);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return debouncedFunction;
};