import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 * 
 * @param {...any} inputs - Class names to merge
 * @returns {string} Merged class names
 * 
 * Usage:
 * ```javascript
 * import { cn } from '../lib/utils';
 * 
 * const className = cn(
 *   'base-class',
 *   condition && 'conditional-class',
 *   { 'object-class': true }
 * );
 * ```
 * 
 * Integration:
 * - Used throughout UI components for conditional styling
 * - Combines clsx for conditional classes with tailwind-merge for deduplication
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format number with locale-specific formatting
 * 
 * @param {number} value - Number to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted number
 */
export function formatNumber(value, options = {}) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  }).format(value);
}

/**
 * Debounce function
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}