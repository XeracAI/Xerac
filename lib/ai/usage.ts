import type { LanguageModelUsage } from 'ai';
import type { LanguageModelV1ProviderMetadata } from '@ai-sdk/provider';
import type { Usage } from '@/lib/db/mongoose-schema';
import type { Model } from '@/lib/db/schema';

export function extractUsage(
  usage: LanguageModelUsage,
  providerMetadata: LanguageModelV1ProviderMetadata | undefined,
  model: Model,
): Usage {
  const usageObject = usage as Usage;
  if (model.provider === 'OpenAI' && providerMetadata?.openai) {
    usageObject.cacheWriteTokens = 0;
    usageObject.cacheReadTokens =
      (providerMetadata.openai.cachedPromptTokens as number) || 0;
    usageObject.reasoningTokens =
      (providerMetadata.openai.reasoningTokens as number) || 0;
    usageObject.promptTokens =
      (usageObject.promptTokens || 0) - usageObject.cacheReadTokens;
  } else if (model.provider === 'Anthropic' && providerMetadata?.anthropic) {
    usageObject.cacheWriteTokens =
      (providerMetadata.anthropic.cacheCreationInputTokens as number) || 0;
    usageObject.cacheReadTokens =
      (providerMetadata.anthropic.cacheReadInputTokens as number) || 0;
    usageObject.reasoningTokens = 0;
  } else {
    usageObject.cacheWriteTokens = 0;
    usageObject.cacheReadTokens = 0;
    usageObject.reasoningTokens = 0;
  }

  return usageObject;
}

export function calculateCost(usage: Usage, model: Model): number {
  return (
    (usage.cacheReadTokens || 0) * (model.cacheReadCost || 0)
  ) + (
    (usage.cacheWriteTokens || 0) * (model.cacheWriteCost || 0)
  ) + (
    usage.completionTokens * (model.outputCost || 0)
  ) + (
    usage.promptTokens * (model.inputCost || 0)
  );
}
