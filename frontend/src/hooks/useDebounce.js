import { useState, useEffect } from 'react';

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
 * Custom hook for debouncing function calls
 * 
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - The debounced function
 * 
 * @example
 * const debouncedFetch = useDebounceCallback(fetchData, 500);
 * 
 * Hook: Prevents multiple rapid function calls that could cause resource errors
 */
export const useDebounceCallback = (func, delay) => {
  const [debounceTimer, setDebounceTimer] = useState(null);

  const debouncedFunction = (...args) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const newTimer = setTimeout(() => {
      func(...args);
    }, delay);

    setDebounceTimer(newTimer);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return debouncedFunction;
};