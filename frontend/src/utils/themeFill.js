/**
 * Theme Fill Utility
 *
 * Copies a computed background color from a "source" element (e.g., a nested li)
 * and applies it to the background of the first N target elements (e.g., four divs),
 * working seamlessly across dark and light themes because it reads computed styles.
 *
 * How to use (no framework dependency):
 * 1) In your container, add data-fill-from, data-fill-target, and data-fill-count, for example:
 *    <section data-fill-from="div div li" data-fill-target="div" data-fill-count="4"></section>
 * 2) Call initThemeFill() once at app startup. This file also re-applies on DOM changes and theme toggles.
 *
 * Defaults:
 * - from selector: 'div div li'
 * - target selector: 'div'
 * - count: 4
 *
 * Examples:
 *  <div class="my-panel" data-fill-from="div div li" data-fill-target="div" data-fill-count="4">
 *    ...
 *  </div>
 *
 * JSDoc Example:
 * @example
 * // Initialize once (e.g., in main.jsx)
 * import { initThemeFill } from './utils/themeFill';
 * initThemeFill();
 *
 * @example
 * // In markup (React JSX):
 * <div data-fill-from="div div li" data-fill-target="div" data-fill-count="4"> ... </div>
 *
 * Connector: Integrates with index.css/theme variables by reading computed styles resolved from CSS vars
 * IA prompt: "Apply background color derived from nested li to first four divs, responsive to theme"
 */

/**
 * Get the first non-transparent computed background color walking up the tree.
 * @param {Element|null} el - Start element
 * @returns {string|null} CSS color string like 'rgb(34, 38, 43)' or null
 */
function getEffectiveBackgroundColor(el) {
  let node = el;
  while (node && node instanceof Element) {
    const bg = getComputedStyle(node).backgroundColor;
    if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
      return bg;
    }
    node = node.parentElement;
  }
  return null;
}

/**
 * Apply fill logic to a specific container element.
 * @param {Element} container - The container having data-fill-* attributes
 */
function applyThemeFillToContainer(container) {
  const fromSel = container.getAttribute('data-fill-from') || 'div div li';
  const targetSel = container.getAttribute('data-fill-target') || 'div';
  const count = parseInt(container.getAttribute('data-fill-count') || '4', 10);
  const disableInLight = container.hasAttribute('data-fill-disable-in-light');
  const disableInDark = container.hasAttribute('data-fill-disable-in-dark');
  const isLight = document.documentElement.classList.contains('light-mode') || document.body.classList.contains('light-mode');
  const isDark = document.documentElement.classList.contains('dark-mode') || document.body.classList.contains('dark-mode');

  // Pre-compute targets so we can also clear styles when needed
  const targets = Array.from(container.querySelectorAll(targetSel)).slice(0, Math.max(0, count));

  // If this container should not apply fills in light mode, clear and bail out
  if (disableInLight && isLight) {
    for (const t of targets) {
      t.style.removeProperty('background-color');
      t.style.removeProperty('--theme-fill-derived-bg');
    }
    return;
  }

  // If this container should not apply fills in dark mode, clear and bail out
  if (disableInDark && isDark) {
    for (const t of targets) {
      t.style.removeProperty('background-color');
      t.style.removeProperty('--theme-fill-derived-bg');
    }
    return;
  }

  // Find source element that provides the color
  const source = container.querySelector(fromSel);
  if (!source) return;

  const color = getEffectiveBackgroundColor(source);
  if (!color) return;

  // Apply to first N targets within the same container
  for (const t of targets) {
    // Use !important to ensure our derived background wins over utility classes
    t.style.setProperty('background-color', color, 'important');
    // Optional: expose as CSS var for further styling hooks
    t.style.setProperty('--theme-fill-derived-bg', color);
  }
}

/**
 * Apply to all containers in the document.
 */
function applyThemeFillAll() {
  const containers = document.querySelectorAll('[data-fill-from]');
  containers.forEach(applyThemeFillToContainer);
}

/**
 * Debounce utility to avoid excessive recalculations.
 * @param {(…args:any[])=>void} fn
 * @param {number} delay
 */
function debounce(fn, delay) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Observe DOM and theme class changes to re-apply fills when UI updates or theme toggles.
 */
function setupObservers() {
  const debouncedApply = debounce(applyThemeFillAll, 50);

  // Observe body subtree for content changes (route changes, components mount)
  const domObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type !== 'childList') continue;
      // Only re-apply fills if the mutation affects containers that use data-fill-from
      const target = m.target;
      const targetAffects = target instanceof Element && (
        target.matches('[data-fill-from]') || !!target.closest('[data-fill-from]')
      );
      const addedAffects = Array.from(m.addedNodes).some((n) => (
        n instanceof Element && (n.matches('[data-fill-from]') || !!n.closest('[data-fill-from]'))
      ));
      const removedAffects = Array.from(m.removedNodes).some((n) => (
        n instanceof Element && (n.matches('[data-fill-from]') || !!n.closest('[data-fill-from]'))
      ));
      if (targetAffects || addedAffects || removedAffects) {
        debouncedApply();
        break;
      }
    }
  });
  domObserver.observe(document.body, { childList: true, subtree: true });

  // Observe class changes on html and body to catch theme toggles
  const classObserver = new MutationObserver(debouncedApply);
  classObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  classObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // First run
  applyThemeFillAll();
}

/**
 * Initialize once at app startup.
 */
export function initThemeFill() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__themeFillInitialized) return; // idempotent
  window.__themeFillInitialized = true;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupObservers, { once: true });
  } else {
    setupObservers();
  }
}

// Optional: auto-initialize if imported without explicit call
// This is safe due to the idempotent guard above
try {
  initThemeFill();
} catch (_) {
  // no-op: environments like SSR safely ignore
}