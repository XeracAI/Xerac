import {
  getModels,
  getModelById,
  getModelFeatures,
  getAllMeta,
  getMetaById
} from './storage';
import { 
  isCacheInitialized,
  getModelsCacheLastRefreshed,
  getMetaCacheLastRefreshed 
} from './initialize';

import type { Feature } from '@/lib/db/schema';
import type { IMeta } from '@/lib/db/mongoose-schema';
import type { ModelWithFeaturesAndTags } from '@/lib/db/types';

/**
 * Get all available AI models
 */
export function getAllAIModels(): ModelWithFeaturesAndTags[] {
  return getModels();
}

/**
 * Get an AI model by ID
 */
export function getAIModelById(id: string): ModelWithFeaturesAndTags | undefined {
  return getModelById(id);
}

/**
 * Get features for a specific AI model
 */
export function getAIModelFeatures(modelId: string): Feature[] {
  return getModelFeatures(modelId);
}

/**
 * Get all models with a specific feature
 */
export function getModelsByFeature(featureId: string) {
  const allModels = getAllAIModels();
  return allModels.filter(model =>
    model.features.some(feature => feature.id === featureId)
  );
}

/**
 * Get all models with a specific tag
 */
export function getModelsByTag(tag: string) {
  const allModels = getAllAIModels();
  return allModels.filter(model =>
    model.tags.find((tagObject) => tagObject.name === tag)
  );
}

/**
 * Check if the cache system is ready to use
 */
export function isCacheReady(): boolean {
  return isCacheInitialized();
}

/**
 * Get the timestamp when the AI models cache was last refreshed
 * Returns null if the cache has never been initialized
 */
export function getAIModelsCacheTimestamp(): Date | null {
  return getModelsCacheLastRefreshed();
}

/**
 * Get all Meta documents from the cache
 */
export function getAllMetaDocuments(): IMeta[] {
  return getAllMeta();
}

/**
 * Get a Meta document by ID from the cache
 */
export function getMetaDocumentById(id: string): IMeta | undefined {
  return getMetaById(id);
}

/**
 * Get the timestamp when the Meta cache was last refreshed
 * Returns null if the cache has never been initialized
 */
export function getMetaCacheTimestamp(): Date | null {
  return getMetaCacheLastRefreshed();
}
