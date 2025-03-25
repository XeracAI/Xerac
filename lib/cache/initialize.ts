import modelCache, { getModelsLastRefreshedTime, getMetaLastRefreshedTime } from './storage';

/**
 * Initialize all caches (AI models and Meta documents).
 * This function is idempotent and will only initialize the caches once.
 */
export async function initializeCache(): Promise<void> {
  // Prevent multiple initialization attempts
  if (modelCache.isInitialized()) return;

  try {
    // Initialize cache
    await modelCache.initialize();
    console.log('Cache initialization complete (AI models and Meta)');
  } catch (error) {
    console.error('Failed to initialize caches:', error);
  }
}

// Status check function
export function isCacheInitialized(): boolean {
  return modelCache.isInitialized();
}

// Get the timestamp when the AI model cache was last refreshed
export function getModelsCacheLastRefreshed(): Date | null {
  return getModelsLastRefreshedTime();
}

// Get the timestamp when the Meta cache was last refreshed
export function getMetaCacheLastRefreshed(): Date | null {
  return getMetaLastRefreshedTime();
}
