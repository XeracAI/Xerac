import { customProvider } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { vertex } from '@ai-sdk/google-vertex';

import { isTestEnvironment } from '@/lib/constants';
import { artifactModel, chatModel, reasoningModel, titleModel } from '@/lib/ai/models.test';

export interface ImageData {
  b64_json?: string;
  url?: string;
  revised_prompt: string;
}

interface ImageObject {
  data: Array<ImageData>;
}

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model-small': chatModel,
        'chat-model-large': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'title-model': openai('gpt-4o'),
        'artifact-model': openai('gpt-4o-mini'),
      },
      imageModels: {
        'small-model': openai.image('dall-e-2'),
        'large-model': openai.image('dall-e-3'),
      },
    });

export const getChatModel = (provider: string, apiIdentifier: string) => {
  switch (provider) {
    case 'openai':
      return openai(apiIdentifier);
    case 'anthropic':
      return anthropic(apiIdentifier);
    case 'google':
      return google(apiIdentifier);
    default:
      throw new Error('Invalid provider');
  }
};

export const getImageModel = (provider: string, apiIdentifier: string) => {
  switch (provider) {
    case 'openai':
      return openai.image(apiIdentifier);
    case 'vertex':
      return vertex.image(apiIdentifier);
    default:
      throw new Error('Invalid provider');
  }
};

export const generateImage = async ({prompt, model}: { prompt: string, model: any }): Promise<ImageData> => {
  const response = await fetch(
    `${process.env.LITELLM_BASE_URL}/images/generations`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LITELLM_API_KEY}`
      },
      body: JSON.stringify({
        prompt,
        model: model.modelId,
        response_format: 'url',
      }),
    }
  )

  if (!response.ok) {
    throw new Error('Failed to generate image');
  }

  const responseBody: ImageObject = await response.json();

  // TODO generate a title for the generated image, using original and revised prompt

  return responseBody.data[0];
}
