import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  feature,
  model,
  modelFeature,
  modelTag,
  tag,
  type Feature
} from '@/lib/db/schema';
import { MetaModel, IMetaInsert } from '@/lib/db/mongoose-schema';

interface Model {
  id: string;

  label: string;

  provider: string;
  apiIdentifier: string;

  description: string;

  inputTypes: Array<'Text' | 'Image' | 'Audio' | 'Video'>;
  outputTypes: Array<'Text' | 'Image'>;

  contextWindow?: number;
  maxOutput?: number;

  inputCost?: number;
  outputCost?: number;
  cacheWriteCost?: number;
  cacheReadCost?: number;

  knowledgeCutoff?: Date;
  releaseDate?: Date;

  extraMetadata?: Record<string, never>;

  status: 'enabled' | 'coming-soon' | 'disabled';

  tags?: Set<string>;
  features: Set<string>;
}

export const featureData: Array<Feature> = [
  {
    id: "vision",
    name: "Vision",
    description: "Supports image uploads and analysis",
    icon: "eye",
    color: "blue",
  },
  {
    id: "pdfs",
    name: "PDFs",
    description: "Supports PDF uploads and analysis",
    icon: "file",
    color: "red"
  },
  {
    id: "reasoning",
    name: "Reasoning",
    description: "Has reasoning capabilities",
    icon: "brain",
    color: "purple",
  },
  {
    id: "reasoningEffort",
    name: "Effort Control",
    description: "Model's reasoning effort level can be customized",
    icon: "gear",
    color: "pink",
  },
  {
    id: "search",
    name: "Search",
    description: "Uses search to answer questions",
    icon: "globe",
    color: "blue",
  }
];

// GPT models
export const gptModels: Array<Model> = [
  {
    id: 'gpt-4o-mini-2024-07-18',
    label: 'چت‌جی‌پی‌تی 4o mini (ChatGPT)',
    provider: 'OpenAI',
    apiIdentifier: 'gpt-4o-mini-2024-07-18',
    description: 'مدلی برای انجام سریع و ارزان کارهای روزمره با دقت بالا از شرکت اوپن ای‌آی',

    inputTypes: ['Text', 'Image'],
    outputTypes: ['Text'],

    contextWindow: 128_000,
    maxOutput: 16_384,

    inputCost: 0.15,
    outputCost: 0.6,
    cacheReadCost: 0.075,

    knowledgeCutoff: new Date('2024-10-01'),
    releaseDate: new Date('2024-07-18'),

    status: 'enabled',

    tags: new Set(['cheap']),
    features: new Set(['vision']),
  },
  {
    id: 'gpt-4o-2024-11-20',
    label: 'چت‌جی‌پی‌تی 4o (ChatGPT)',
    provider: 'OpenAI',
    apiIdentifier: 'gpt-4o-2024-11-20',
    description: 'هوشمندترین مدل شرکت اوپن ای‌آی برای انجام تمامی کارها در سطح پیشرفته',

    inputTypes: ['Text', 'Image'],
    outputTypes: ['Text'],

    contextWindow: 128_000,
    maxOutput: 16_384,

    inputCost: 2.5,
    outputCost: 10,
    cacheReadCost: 1.25,

    knowledgeCutoff: new Date('2024-10-01'),
    releaseDate: new Date('2024-11-20'),

    status: 'enabled',

    tags: new Set(['powerful']),
    features: new Set(['vision']),
  },

  {
    id: 'gpt-4.5-preview-2025-02-27',
    label: 'چت‌جی‌پی‌تی 4.5 Preview (ChatGPT)',
    provider: 'OpenAI',
    apiIdentifier: 'gpt-4.5-preview-2025-02-27',
    description: 'هوشمندترین مدل شرکت اوپن ای‌آی برای انجام تمامی کارها در سطح پیشرفته',

    inputTypes: ['Text', 'Image'],
    outputTypes: ['Text'],

    contextWindow: 128_000,
    maxOutput: 16_384,

    inputCost: 75,
    outputCost: 150,
    cacheReadCost: 37.5,

    knowledgeCutoff: new Date('2024-10-01'),
    releaseDate: new Date('2025-02-27'),

    status: 'enabled',

    tags: new Set(['powerful']),
    features: new Set(['vision']),
  },

  {
    id: 'o3-mini-2025-01-31',
    label: 'o3 Mini',
    provider: 'OpenAI',
    apiIdentifier: 'o3-mini-2025-01-31',
    description: 'مدل استدلالی سریع و مقرون به صرفه، طراحی شده برای کاربردهای برنامه‌نویسی، ریاضیات و علوم، از شرکت اوپن ای‌آی',

    inputTypes: ['Text'],
    outputTypes: ['Text'],

    contextWindow: 200_000,
    maxOutput: 100_000,

    inputCost: 1.1,
    outputCost: 4.4,
    cacheReadCost: 0.55,

    knowledgeCutoff: new Date('2024-10-01'),
    releaseDate: new Date('2025-01-31'),

    status: 'enabled',

    tags: new Set(['specific']),
    features: new Set(['reasoning', 'reasoningEffort']),
  },
  {
    id: 'o1-mini-2024-09-12',
    label: 'o1 Mini',
    provider: 'OpenAI',
    apiIdentifier: 'o1-mini-2024-09-12',
    description: 'مدل استدلالی سریع و مقرون به صرفه، طراحی شده برای کاربردهای برنامه‌نویسی، ریاضیات و علوم، از شرکت اوپن ای‌آی',

    inputTypes: ['Text'],
    outputTypes: ['Text'],

    contextWindow: 128_000,
    maxOutput: 65_536,

    inputCost: 1.1,
    outputCost: 4.4,
    cacheReadCost: 0.55,

    knowledgeCutoff: new Date('2024-10-01'),
    releaseDate: new Date('2024-09-12'),

    status: 'enabled',

    tags: new Set(['specific']),
    features: new Set(['reasoning', 'reasoningEffort']),
  },
  {
    id: 'o1-pro-2025-03-19',
    label: 'o1',
    provider: 'OpenAI',
    apiIdentifier: 'o1-pro-2025-03-19',
    description: 'مدل استدلالی از شرکت اوپن ای‌آی برای مسائل پیچیده که نیاز به دانش عمومی و گسترده دارند',

    inputTypes: ['Text', 'Image'],
    outputTypes: ['Text'],

    contextWindow: 200_000,
    maxOutput: 100_000,

    inputCost: 150,
    outputCost: 600,

    knowledgeCutoff: new Date('2024-10-01'),
    releaseDate: new Date('2025-03-19'),

    status: 'enabled',

    tags: new Set(['specific']),
    features: new Set(['vision', 'reasoning', 'reasoningEffort']),
  },
  {
    id: 'o1-2024-12-17',
    label: 'o1',
    provider: 'OpenAI',
    apiIdentifier: 'o1-2024-12-17',
    description: 'مدل استدلالی از شرکت اوپن ای‌آی برای مسائل پیچیده که نیاز به دانش عمومی و گسترده دارند',

    inputTypes: ['Text', 'Image'],
    outputTypes: ['Text'],

    contextWindow: 200_000,
    maxOutput: 100_000,

    inputCost: 15,
    outputCost: 60,
    cacheReadCost: 7.5,

    knowledgeCutoff: new Date('2024-10-01'),
    releaseDate: new Date('2024-12-17'),

    status: 'enabled',

    tags: new Set(['vision', 'specific']),
    features: new Set(['reasoning', 'reasoningEffort']),
  },
  {
    id: 'o1-preview-2024-09-12',
    label: 'o1 Preview',
    provider: 'OpenAI',
    apiIdentifier: 'o1-preview-2024-09-12',
    description: 'مدل استدلالی از شرکت اوپن ای‌آی برای مسائل پیچیده که نیاز به دانش عمومی و گسترده دارند',

    inputTypes: ['Text'],
    outputTypes: ['Text'],

    contextWindow: 200_000,
    maxOutput: 100_000,

    inputCost: 15,
    outputCost: 60,
    cacheReadCost: 7.5,

    knowledgeCutoff: new Date('2024-10-01'),
    releaseDate: new Date('2024-09-12'),

    status: 'enabled',

    tags: new Set(['specific']),
    features: new Set(['vision', 'reasoning', 'reasoningEffort']),
  },
];

// Claude models
export const claudeModels: Array<Model> = [
  {
    id: 'claude-3-7-sonnet-20250219',
    label: 'کلاود ۳.۷ سانِت (Sonnet)',
    provider: 'Anthropic',
    apiIdentifier: 'claude-3-7-sonnet-20250219',
    description: "هوشمندترین مدل شرکت آنتروپیک برای انجام تمامی کارها در سطح پیشرفته",

    inputTypes: ['Text', 'Image'],
    outputTypes: ['Text'],

    contextWindow: 200_000,
    maxOutput: 8_192,

    inputCost: 3,
    outputCost: 15,
    cacheWriteCost: 3.75,
    cacheReadCost: 0.3,

    knowledgeCutoff: new Date('2024-04-01'),
    releaseDate: new Date('2025-02-19'),

    status: 'enabled',

    tags: new Set(['powerful']),
    features: new Set(['vision', 'pdfs']),
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    label: 'کلاود ۳.۵ سانِت (Sonnet)',
    provider: 'Anthropic',
    apiIdentifier: 'claude-3-5-sonnet-20241022',
    description: "هوشمندترین مدل شرکت آنتروپیک برای انجام تمامی کارها در سطح پیشرفته",

    inputTypes: ['Text', 'Image'],
    outputTypes: ['Text'],

    contextWindow: 200_000,
    maxOutput: 8_192,

    inputCost: 3,
    outputCost: 15,
    cacheWriteCost: 3.75,
    cacheReadCost: 0.3,

    knowledgeCutoff: new Date('2024-04-01'),
    releaseDate: new Date('2024-10-22'),

    status: 'enabled',

    tags: new Set(['powerful']),
    features: new Set(['vision', 'pdfs']),
  },
  {
    id: 'claude-3-5-sonnet-20240620',
    label: 'کلاود ۳.۵ سانِت (Sonnet)',
    provider: 'Anthropic',
    apiIdentifier: 'claude-3-5-sonnet-20240620',
    description: "هوشمندترین مدل شرکت آنتروپیک برای انجام تمامی کارها در سطح پیشرفته",

    inputTypes: ['Text', 'Image'],
    outputTypes: ['Text'],

    contextWindow: 200_000,
    maxOutput: 8_192,

    inputCost: 3,
    outputCost: 15,
    cacheWriteCost: 3.75,
    cacheReadCost: 0.3,

    knowledgeCutoff: new Date('2024-04-01'),
    releaseDate: new Date('2024-06-20'),

    status: 'enabled',

    tags: new Set(['powerful']),
    features: new Set(['vision', 'pdfs']),
  },
  {
    id: 'claude-3-5-haiku-20241022',
    label: 'کلاود ۳.۵ هایکو (Haiku)',
    provider: 'Anthropic',
    apiIdentifier: 'claude-3-5-haiku-20241022',
    description: 'مدلی برای انجام سریع و ارزان کارهای روزمره با دقت بالا از شرکت آنتروپیک',

    inputTypes: ['Text', 'Image'],
    outputTypes: ['Text'],

    contextWindow: 200_000,
    maxOutput: 8_192,

    inputCost: 0.8,
    outputCost: 4,
    cacheWriteCost: 1,
    cacheReadCost: 0.08,

    knowledgeCutoff: new Date('2024-07-01'),
    releaseDate: new Date('2024-10-22'),

    status: 'enabled',

    tags: new Set(['cheap']),
    features: new Set(['vision', 'pdfs']),
  },
  {
    id: 'claude-3-opus-20240229',
    label: 'کلاود ۳ اوپوس (Opus)',
    provider: 'Anthropic',
    apiIdentifier: 'claude-3-opus-20240229',
    description: 'بزرگ‌ترین و گران‌ترین مدل شرکت آنتروپیک برای انجام تحلیل‌های پیچیده',

    inputTypes: ['Text', 'Image'],
    outputTypes: ['Text'],

    contextWindow: 200_000,
    maxOutput: 4_096,

    inputCost: 15,
    outputCost: 75,
    cacheWriteCost: 18.75,
    cacheReadCost: 1.5,

    knowledgeCutoff: new Date('2023-08-01'),
    releaseDate: new Date('2024-02-29'),

    status: 'enabled',

    tags: new Set(['specific']),
    features: new Set(['vision', 'pdfs']),
  },
];

// Gemini models
export const geminiModels: Array<Model> = [
  {
    id: 'gemini-2.0-flash-lite-001',
    label: 'جِمِنای ۲.۰ فلش لایت (Flash)',
    provider: 'Google',
    apiIdentifier: 'gemini-2.0-flash-lite-001',
    description: 'مدلی برای انجام سریع و ارزان کارهای روزمره با دقت بالا از شرکت گوگل',

    inputTypes: ['Text', 'Image', 'Audio', 'Video'],
    outputTypes: ['Text'],

    contextWindow: 1_048_576,
    maxOutput: 8_192,

    inputCost: 0.075,
    outputCost: 0.3,
    cacheReadCost: 0.0375,

    knowledgeCutoff: new Date('2023-04-01'),
    releaseDate: new Date('2025-02-01'),

    status: 'enabled',

    tags: new Set(['cheap']),
    features: new Set(['vision', 'pdfs', 'search']),
  },
  {
    id: 'gemini-2.0-flash-001',
    label: 'جِمِنای ۲.۰ فلش (Flash)',
    provider: 'Google',
    apiIdentifier: 'gemini-2.0-flash-001',
    description: 'مدلی برای انجام سریع و ارزان کارهای روزمره با دقت بالا از شرکت گوگل',

    inputTypes: ['Text', 'Image', 'Audio', 'Video'],
    outputTypes: ['Text'],

    contextWindow: 1_048_576,
    maxOutput: 8_192,

    inputCost: 0.1,
    outputCost: 0.4,
    cacheReadCost: 0.025,

    knowledgeCutoff: new Date('2023-04-01'),
    releaseDate: new Date('2025-02-01'),

    status: 'enabled',

    tags: new Set(['cheap']),
    features: new Set(['vision', 'pdfs', 'search']),
  },
  {
    id: 'gemini-1.5-flash-002',
    label: 'جِمِنای ۱.۵ فلش (Flash)',
    provider: 'Google',
    apiIdentifier: 'gemini-1.5-flash-002',
    description: 'مدلی برای انجام سریع و ارزان کارهای روزمره با دقت بالا از شرکت گوگل',

    inputTypes: ['Text', 'Image', 'Audio', 'Video'],
    outputTypes: ['Text'],

    contextWindow: 1_048_576,
    maxOutput: 8_192,

    // > 128k tokens
    inputCost: 0.15,
    outputCost: 0.6,
    cacheReadCost: 0.0375,

    knowledgeCutoff: new Date('2023-04-01'),
    releaseDate: new Date('2024-09-01'),

    status: 'enabled',

    tags: new Set(['cheap']),
    features: new Set(['vision', 'pdfs', 'search']),
  },
  {
    id: 'gemini-1.5-flash-8b-001',
    label: 'جِمِنای ۱.۵ فلش 8b (Flash)',
    provider: 'Google',
    apiIdentifier: 'gemini-1.5-flash-8b-001',
    description: 'مدلی برای انجام سریع و ارزان کارهای روزمره با دقت بالا از شرکت گوگل',

    inputTypes: ['Text', 'Image', 'Audio', 'Video'],
    outputTypes: ['Text'],

    contextWindow: 1_048_576,
    maxOutput: 8_192,

    // > 128k tokens
    inputCost: 0.15,
    outputCost: 0.6,
    cacheReadCost: 0.0375,

    knowledgeCutoff: new Date('2023-04-01'),
    releaseDate: new Date('2024-10-01'),

    status: 'enabled',

    tags: new Set(['cheap']),
    features: new Set(['vision', 'pdfs', 'search']),
  },

  {
    id: 'gemini-2.0-pro-exp-02-05',
    label: 'جِمِنای ۲.۰ پرو (Pro)',
    provider: 'Google',
    apiIdentifier: 'gemini-2.0-pro-exp-02-05',
    description: 'هوشمندترین مدل شرکت گوگل برای انجام تمامی کارها در سطح پیشرفته',

    inputTypes: ['Text', 'Image'],
    outputTypes: ['Text'],

    contextWindow: 2_097_152,
    maxOutput: 8_192,

    // > 128k tokens
    inputCost: 2.5,
    outputCost: 10,
    cacheReadCost: 0.625,

    knowledgeCutoff: new Date('2023-04-01'),
    releaseDate: new Date('2025-02-01'),

    status: 'enabled',

    tags: new Set(['powerful']),
    features: new Set(['vision', 'pdfs', 'search']),
  },
  {
    id: 'gemini-1.5-pro-002',
    label: 'جِمِنای ۱.۵ پرو (Pro)',
    provider: 'Google',
    apiIdentifier: 'gemini-1.5-pro-002',
    description: 'هوشمندترین مدل شرکت گوگل برای انجام تمامی کارها در سطح پیشرفته',

    inputTypes: ['Text', 'Image'],
    outputTypes: ['Text'],

    contextWindow: 2_097_152,
    maxOutput: 8_192,

    // > 128k tokens
    inputCost: 2.5,
    outputCost: 10,
    cacheReadCost: 0.625,

    knowledgeCutoff: new Date('2023-04-01'),
    releaseDate: new Date('2024-09-01'),

    status: 'enabled',

    tags: new Set(['powerful']),
    features: new Set(['vision', 'pdfs', 'search']),
  },
];

// Grok models
export const grokModels: Array<Model> = [
  {
    id: 'grok-beta',
    label: 'Grok 2',
    provider: 'xAI',
    apiIdentifier: 'grok-2-1212',
    description: 'مدل قدرتمند ساخته شده توسط شرکت xAI',

    inputTypes: ['Text', 'Image'],
    outputTypes: ['Text'],

    contextWindow: 131_072,
    maxOutput: 131_072,

    inputCost: 2,
    outputCost: 10,

    knowledgeCutoff: new Date('2023-07-17'),
    releaseDate: new Date('2025-01-01'),

    status: 'coming-soon',

    tags: new Set([]),
    features: new Set(['vision']),
  },
];

// Image generation models
export const imageGenerationModels: Array<Model> = [
  {
    id: 'dall-e-3',
    label: 'DALL-E 3',
    provider: 'OpenAI',
    apiIdentifier: 'dall-e-3',
    description: 'مدلی از شرکت اوپن ای‌آی برای ایجاد عکس در سبک‌های مختلف با توجه به توضیحات شما',

    inputTypes: ['Text'],
    outputTypes: ['Image'],

    status: 'enabled',

    tags: new Set(['specific']),
    features: new Set([]),
  },
  {
    id: 'imagen-3.0-generate-002',
    label: 'Google Imagen 3',
    provider: 'Google',
    apiIdentifier: 'imagen-3.0-generate-002',
    description: 'مدل قدرتمند تولید عکس',

    inputTypes: ['Text'],
    outputTypes: ['Image'],

    releaseDate: new Date('2025-02-01'),

    status: 'coming-soon',

    tags: new Set(['specific']),
    features: new Set([]),
  },
  {
    id: 'leonardo',
    label: 'Leonardo.Ai',
    provider: 'Leonardo.Ai',
    apiIdentifier: 'leonardo',
    description: 'مدل قدرتمند تولید عکس',

    inputTypes: ['Text'],
    outputTypes: ['Image'],

    status: 'coming-soon',

    tags: new Set(['specific']),
    features: new Set([]),
  },
  {
    id: 'SD3.5',
    label: 'Stable Diffusion 3.5',
    provider: 'OpenAI', // Using OpenAI as a placeholder, update as needed
    apiIdentifier: 'SD3.5',
    description: 'مدل قدرتمند تولید عکس',

    inputTypes: ['Text'],
    outputTypes: ['Image'],

    status: 'coming-soon',

    tags: new Set(['specific']),
    features: new Set([]),
  },
  {
    id: 'SDXL',
    label: 'Stable Diffusion XL',
    provider: 'OpenAI', // Using OpenAI as a placeholder, update as needed
    apiIdentifier: 'SDXL',
    description: 'مدل قدرتمند تولید عکس',

    inputTypes: ['Text'],
    outputTypes: ['Image'],

    status: 'coming-soon',

    tags: new Set(['specific']),
    features: new Set([]),
  },
];

// Combine all models
const allModels = [
  ...gptModels,
  ...claudeModels,
  ...geminiModels,
  ...grokModels,
  ...imageGenerationModels
];

// MongoDB seed data
const meta: IMetaInsert[] = [
  {
    id: 'default-models',
    defaultModel: 'gemini-2.0-flash-lite-001',
    defaultModelGroups: [
      {
        id: "powerful",
        title: "قوی‌ترین‌ها",
        models: ['claude-3-7-sonnet-20250219', 'gpt-4o-2024-11-20', 'gemini-2.0-pro-exp-02-05'],
      },
      {
        id: "cheap",
        title: "ارزان‌ترین‌ها",
        models: ['gpt-4o-mini-2024-07-18', 'claude-3-5-haiku-20241022', 'gemini-2.0-flash-lite-001'],
      },
      {
        id: "image",
        title: "تولید عکس",
        models: ['dall-e-3', 'imagen-3.0-generate-002', 'leonardo', 'SD3.5', 'SDXL'],
      },
      {
        id: "specific",
        title: "خاص‌منظوره‌ها",
        models: ['gpt-4.5-preview-2025-02-27', 'o3-mini-2025-01-31', 'o1-2024-12-17'],
      }
    ]
  },
  {
    id: 'cost-function-coefficients',
    rialExchangeRate: 95000
  }
];

async function seedFeatures(db: PostgresJsDatabase) {
  console.log('Seeding features...');

  // Instead of deleting, use upsert approach
  for (const featureItem of featureData) {
    await db.insert(feature)
      .values(featureItem)
      .onConflictDoNothing({ target: [feature.id] });
  }
  console.log(`Ensured ${featureData.length} features exist`);
}

async function seedModels(db: PostgresJsDatabase) {
  console.log('Seeding models...');

  // Insert models without clearing existing ones
  for (const modelData of allModels) {
    await db.insert(model)
      .values(modelData)
      .onConflictDoNothing({ target: [model.id] });
  }
  console.log(`Ensured ${allModels.length} models exist`);
}

async function seedModelFeatures(db: PostgresJsDatabase) {
  console.log('Seeding model features relationships...');

  // Create model-feature relationships
  const modelFeaturesToInsert = [];

  for (const m of allModels) {
    // Handle the fact that features might be an array of strings or a Set
    const modelFeatures = Array.isArray(m.features)
      ? m.features
      : m.features instanceof Set
        ? Array.from(m.features)
        : [];

    for (const featureId of modelFeatures) {
      // If f is a string (feature ID), use it directly
      // If f is a Feature object, extract its ID
      modelFeaturesToInsert.push({
        modelId: m.id,
        featureId,
        createdAt: new Date(),
      });
    }
  }

  if (modelFeaturesToInsert.length > 0) {
    // Insert only relationships that don't exist
    for (const mf of modelFeaturesToInsert) {
      await db.insert(modelFeature)
        .values(mf)
        .onConflictDoNothing({ target: [modelFeature.modelId, modelFeature.featureId] });
    }
  }
  console.log(`Ensured model-feature relationships exist`);
}

async function seedModelTags(db: PostgresJsDatabase) {
  console.log('Seeding model tags relationships...');

  // First, make sure we have tags in the database
  // Get unique tags from all models
  const uniqueTags = new Set<string>();
  for (const m of allModels) {
    const modelTags = Array.isArray(m.tags)
      ? m.tags
      : m.tags instanceof Set
        ? Array.from(m.tags)
        : [];

    for (const t of modelTags) {
      uniqueTags.add(t);
    }
  }

  // Insert tags if they don't exist
  const tagInserts = Array.from(uniqueTags).map(tagName => ({
    name: tagName,
    description: `Tag for ${tagName} models`,
  }));

  if (tagInserts.length > 0) {
    for (const tagItem of tagInserts) {
      await db.insert(tag)
        .values(tagItem)
        .onConflictDoNothing({ target: [tag.name] });
    }
  }
  console.log(`Ensured ${tagInserts.length} tags exist`);

  // Get all tags to map names to IDs
  const existingTags = await db.select().from(tag);
  const tagNameToId = new Map(existingTags.map(t => [t.name, t.id]));

  // Create model-tag relationships
  const modelTagsToInsert = [];

  for (const m of allModels) {
    const modelTags = Array.isArray(m.tags)
      ? m.tags
      : m.tags instanceof Set
        ? Array.from(m.tags)
        : [];

    for (const tagName of modelTags) {
      const tagId = tagNameToId.get(tagName);
      if (tagId) {
        modelTagsToInsert.push({
          modelId: m.id,
          tagId: tagId,
          createdAt: new Date(),
        });
      }
    }
  }

  if (modelTagsToInsert.length > 0) {
    for (const mt of modelTagsToInsert) {
      await db.insert(modelTag)
        .values(mt)
        .onConflictDoNothing({ target: [modelTag.modelId, modelTag.tagId] });
    }
  }
  console.log(`Ensured model-tag relationships exist`);
}

// MongoDB seeding functions
async function seedMongoMeta() {
  console.log('Seeding MongoDB meta...');

  try {
    // Insert meta documents only if they don't exist
    for (const metaItem of meta) {
      await MetaModel.updateOne(
        { id: metaItem.id },
        { $setOnInsert: metaItem },
        { upsert: true }
      );
    }

    console.log('Ensured meta documents exist');
  } catch (error) {
    console.error('Error seeding MongoDB meta:', error);
  }
}

async function seedMongoDatabase() {
  try {
    console.log('Starting MongoDB database seeding...');

    // Seed MongoDB collections
    await seedMongoMeta();

    console.log('MongoDB database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding MongoDB database:', error);
  }
}

async function seedDatabase(db: PostgresJsDatabase) {
  console.log('Starting database seeding...');

  // Seed PostgreSQL in sequence to maintain referential integrity
  await seedFeatures(db);
  await seedModels(db);
  await seedModelFeatures(db);
  await seedModelTags(db);

  // Seed MongoDB
  await seedMongoDatabase();

  console.log('Database seeding completed successfully!');
}

// Export for programmatic use
export {
  seedDatabase,
  seedFeatures,
  seedModels,
  seedModelFeatures,
  seedModelTags,
  seedMongoDatabase,
  seedMongoMeta
};
