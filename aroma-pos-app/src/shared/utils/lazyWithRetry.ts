import { lazy, ComponentType } from 'react';

/**
 * A wrapper around React.lazy that handles dynamic import (chunk load) failures.
 * Under deployments, Vite/Webpack filenames change. If a user has an active session
 * and navigates to a route with an outdated chunk name, the browser fails to import it.
 * This utility detects the failure, checks if a reload was already attempted, and reloads
 * the page once to retrieve the new bundle index and load the correct chunk.
 *
 * @param importFunc The dynamic import function, e.g., () => import('./MyComponent')
 * @returns A lazy-loaded React Component
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const pageKey = `lazy_retry_${importFunc.toString().replace(/[^a-zA-Z0-9]/g, '_')}`;

    try {
      const component = await importFunc();
      // On success, clean up retry flag from session storage
      try {
        sessionStorage.removeItem(pageKey);
      } catch (e) {
        // Ignore storage access errors in restricted environments
      }
      return component;
    } catch (error: any) {
      const errorMsg = error?.message || '';
      const isChunkError =
        errorMsg.includes('Failed to fetch dynamically imported module') ||
        errorMsg.includes('Loading chunk') ||
        errorMsg.includes('dynamically imported module') ||
        errorMsg.includes('network error') ||
        error instanceof TypeError; // Dynamic imports throw TypeErrors on network failure in some browsers

      if (isChunkError) {
        const hasRetried = sessionStorage.getItem(pageKey);

        if (!hasRetried) {
          try {
            sessionStorage.setItem(pageKey, 'true');
          } catch (e) {
            // Ignore storage write errors
          }
          console.warn('Chunk load failed. Refreshing page to load latest version...', error);
          window.location.reload();
          // Return a pending promise to prevent rendering half-loaded state before reload
          return new Promise<{ default: T }>(() => {});
        }
      }

      // If we already retried and failed again, or if it is a different error, propagate it
      throw error;
    }
  });
}
