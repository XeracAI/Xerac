import 'server-only';

import { getModelsWithFeaturesAndTags as getModelsWithFeaturesAndTagsQuery } from '@/lib/db/queries';
import type { ModelWithFeaturesAndTags } from '@/lib/db/types';
import type { Feature, Tag } from '@/lib/db/schema';
import dbConnect from '@/lib/db/connect';
import { MetaModel, type IMeta } from '@/lib/db/mongoose-schema';

class Storage {
  private static instance: Storage;

  private initialized = false;

  private models: ModelWithFeaturesAndTags[] = [];
  private modelMap: Map<string, ModelWithFeaturesAndTags> = new Map();
  private modelFeaturesMap: Map<string, Feature[]> = new Map();
  private modelTagsMap: Map<string, Tag[]> = new Map();
  private lastRefreshed: Date | null = null;

  // Meta cache properties
  private metaDocuments: IMeta[] = [];
  private metaMap: Map<string, IMeta> = new Map();
  private metaLastRefreshed: Date | null = null;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): Storage {
    if (!Storage.instance) {
      Storage.instance = new Storage();
    }
    return Storage.instance;
  }

  /**
   * Initialize the models cache with data from the database
   */
  public async initializeModels(): Promise<void> {
    try {
      console.log('Initializing model cache storage...');

      // Load all models with their features and tags
      this.models = await getModelsWithFeaturesAndTagsQuery();

      // Populate individual model features and tags maps for quick access
      for (const model of this.models) {
        this.modelFeaturesMap.set(model.id, model.features);
        this.modelTagsMap.set(model.id, model.tags);
        this.modelMap.set(model.id, model);
      }

      this.lastRefreshed = new Date();
      console.log(
        `Model cache initialized with ${this.models.length} models at ${this.lastRefreshed.toISOString()}`,
      );
    } catch (error) {
      console.error('Failed to initialize model cache:', error);
      throw error;
    }
  }

  /**
   * Initialize Meta documents cache with data from MongoDB
   */
  public async initializeMeta(): Promise<void> {
    try {
      console.log('Initializing Meta cache storage...');

      // Get all meta documents from MongoDB
      await dbConnect();
      const metaDocs = await MetaModel.find().lean();
      this.metaDocuments = metaDocs as unknown as IMeta[];

      // Create a map for quick lookups by id
      this.metaMap = new Map(this.metaDocuments.map((meta) => [meta.id, meta]));

      this.metaLastRefreshed = new Date();
      console.log(
        `Meta cache initialized with ${this.metaDocuments.length} documents at ${this.metaLastRefreshed.toISOString()}`,
      );
    } catch (error) {
      console.error('Failed to initialize Meta cache:', error);
      throw error;
    }
  }

  public async initialize(): Promise<void> {
    if (process.env.CI !== 'true') {
      await Promise.all([this.initializeModels(), this.initializeMeta()]);
    }
    this.initialized = true;
  }

  /**
   * Refresh all caches with fresh data from the databases
   */
  public async refresh(): Promise<void> {
    this.initialized = false;

    try {
      await Promise.all([this.initializeModels(), this.initializeMeta()]);

      this.initialized = true;
    } catch (error) {
      console.error('Failed to refresh caches:', error);
      throw error;
    }
  }

  /**
   * Refresh the Model cache with fresh data from PostgreSQL
   */
  public async refreshModel(): Promise<void> {
    try {
      await this.initializeModels();
    } catch (error) {
      console.error('Failed to refresh Model cache:', error);
      throw error;
    }
  }

  /**
   * Refresh the Meta cache with fresh data from MongoDB
   */
  public async refreshMeta(): Promise<void> {
    try {
      await this.initializeMeta();
    } catch (error) {
      console.error('Failed to refresh Meta cache:', error);
      throw error;
    }
  }

  /**
   * Get all models
   */
  public getModels(): ModelWithFeaturesAndTags[] {
    this.ensureInitialized();
    return this.models;
  }

  /**
   * Get a model by ID
   */
  public getModelById(id: string): ModelWithFeaturesAndTags | undefined {
    this.ensureInitialized();
    return this.modelMap.get(id);
  }

  /**
   * Get features for a model
   */
  public getModelFeatures(modelId: string): Feature[] {
    this.ensureInitialized();
    return this.modelFeaturesMap.get(modelId) || [];
  }

  /**
   * Get tags for a model
   */
  public getModelTags(modelId: string): Tag[] {
    this.ensureInitialized();
    return this.modelTagsMap.get(modelId) || [];
  }

  /**
   * Get the timestamp when the cache was last refreshed
   */
  public getModelsLastRefreshedTime(): Date | null {
    return this.lastRefreshed;
  }

  /**
   * Get all Meta documents
   */
  public getAllMeta(): IMeta[] {
    this.ensureInitialized();
    return this.metaDocuments;
  }

  /**
   * Get a Meta document by ID
   */
  public getMetaById(id: string): IMeta | undefined {
    this.ensureInitialized();
    return this.metaMap.get(id);
  }

  /**
   * Get the timestamp when the Meta cache was last refreshed
   */
  public getMetaLastRefreshedTime(): Date | null {
    return this.metaLastRefreshed;
  }

  /**
   * Check if the cache is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(
        'Cache has not been initialized. Call initialize() first.',
      );
    }
  }

  public isInitialized(): boolean {
    return this.initialized;
  }
}

// Export the singleton instance
declare global {
  // eslint-disable-next-line no-var
  var modelCacheGlobal: Storage;
}
if (!global.modelCacheGlobal) {
  global.modelCacheGlobal = Storage.getInstance();
}
export const modelCache = global.modelCacheGlobal;

// Export helper functions for easy access
export const getModels = () => modelCache.getModels();
export const getModelById = (id: string) => modelCache.getModelById(id);
export const getModelFeatures = (modelId: string) =>
  modelCache.getModelFeatures(modelId);
export const getModelTags = (modelId: string) =>
  modelCache.getModelTags(modelId);
export const getModelsLastRefreshedTime = () =>
  modelCache.getModelsLastRefreshedTime();
export const refreshModelCache = () => modelCache.refreshModel();

// Export Meta cache helper functions
export const getAllMeta = () => modelCache.getAllMeta();
export const getMetaById = (id: string) => modelCache.getMetaById(id);
export const getMetaLastRefreshedTime = () =>
  modelCache.getMetaLastRefreshedTime();
export const refreshMetaCache = () => modelCache.refreshMeta();

export const refreshCache = () => modelCache.refresh();
