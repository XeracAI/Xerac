import { getMetaDocumentById, getAIModelById } from '@/lib/cache';
import { getUserModelGroups } from '@/lib/db/queries';
import type { ModelGroupWithModelIDs } from '@/lib/db/types';

import { ModelGroupWithModels, ModelGroup } from './types';
import { injectIconToModel } from './icons';
import { initializeCache, isCacheInitialized } from "@/lib/cache/initialize";

if (!isCacheInitialized()) {
  await initializeCache();
}

function injectIconToModelGroups(modelGroups: ModelGroupWithModels[]): ModelGroup[] {
  return modelGroups.map(modelGroup => ({
    ...modelGroup,
    models: modelGroup.models.map(model => injectIconToModel(model))
  }));
}

function injectModelToModelGroups(modelGroups: ModelGroupWithModelIDs[]): ModelGroupWithModels[] {
  return modelGroups.map(modelGroup => ({
    ...modelGroup,
    models: modelGroup.models.map(modelId => getAIModelById(modelId)).filter(model => model !== undefined)
  }));
}

const defaultMetaDocument = getMetaDocumentById(process.env.DEFAULT_META_DOCUMENT_ID || 'default-models')
export const DEFAULT_CHAT_MODEL_ID: string = defaultMetaDocument?.defaultModel || 'gemini-2.0-flash-lite-001';
const defaultModelGroups: ModelGroup[] = injectIconToModelGroups(injectModelToModelGroups(defaultMetaDocument?.defaultModelGroups || []));

/**
 * Fetches user's model groups from the database or returns default groups if none found
 * @param userId - The current user's ID
 * @returns Promise resolving to an array of ModelGroup objects
 */
export async function fetchUserModelGroups(userId: string): Promise<ModelGroup[]> {
  let finalModelGroups: ModelGroupWithModelIDs[];
  try {
    finalModelGroups = await getUserModelGroups(userId);

    if (finalModelGroups.length === 0) {
      return defaultModelGroups;
    }

    return injectIconToModelGroups(injectModelToModelGroups(finalModelGroups));
  } catch (error) {
    console.error('Failed to fetch user model groups:', error);
    return defaultModelGroups;
  }
}
