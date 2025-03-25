import { StaticImport } from 'next/dist/shared/lib/get-img-props';

import dalleLogo from '@/assets/icons/third-party-logos/providers/dall-e.png';
import grokLogo from '@/assets/icons/third-party-logos/providers/grok.svg';
import leonardoAiLogo from '@/assets/icons/third-party-logos/providers/leonardo-ai.svg';
import stabilityAiLogo from '@/assets/icons/third-party-logos/providers/stability-ai.svg';
import gptLogoBlack from '@/assets/icons/third-party-logos/providers/openai-black.svg';
import gptLogoWhite from '@/assets/icons/third-party-logos/providers/openai-white.svg';
import claudeLogo from '@/assets/icons/third-party-logos/providers/claude.svg';
import geminiLogo from '@/assets/icons/third-party-logos/providers/gemini.svg';

import type { ModelWithFeaturesAndTags } from '@/lib/db/types';

import { Model } from './types';

/**
 * Returns the appropriate icon for a model based on its ID or provider
 * @param modelId - Optional model ID (e.g., 'dall-e-3')
 * @param provider - Optional provider name (e.g., 'OpenAI')
 * @returns Object containing light and dark versions of the icon
 */
export function getModelIcon(modelId?: string, provider?: string): { light: StaticImport, dark: StaticImport } {
  // First check for special model-specific icons
  if (modelId) {
    switch (modelId) {
      case 'dall-e-3':
        return { light: dalleLogo, dark: dalleLogo };
      case 'grok-beta':
        return { light: grokLogo, dark: grokLogo };
      case 'leonardo':
        return { light: leonardoAiLogo, dark: leonardoAiLogo };
      case 'SD3.5':
      case 'SDXL':
        return { light: stabilityAiLogo, dark: stabilityAiLogo };
    }
  }

  // Then fall back to provider icons
  if (provider) {
    switch (provider) {
      case 'OpenAI':
        return { light: gptLogoBlack, dark: gptLogoWhite };
      case 'Anthropic':
        return { light: claudeLogo, dark: claudeLogo };
      case 'Google':
        return { light: geminiLogo, dark: geminiLogo };
    }
  }

  // Default to OpenAI if neither model ID nor provider matched
  return { light: gptLogoBlack, dark: gptLogoWhite };
}

export function injectIconToModel(model: ModelWithFeaturesAndTags): Model {
  return {
   ...model,
    icon: getModelIcon(model.id, model.provider)
  };
}
