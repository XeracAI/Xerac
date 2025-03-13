import { customProvider, extractReasoningMiddleware, wrapLanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { customMiddleware } from './custom-middleware';
import { isTestEnvironment } from '@/lib/constants';
import { artifactModel, chatModel, reasoningModel, titleModel } from '@/lib/ai/models.test';
import { fireworks } from '@ai-sdk/fireworks';

export interface ImageData {
  b64_json?: string;
  url?: string;
  revised_prompt: string;
}

interface ImageObject {
  data: Array<ImageData>;
}

const openai = createOpenAI({
  baseURL: process.env.LITELLM_BASE_URL,
  apiKey: process.env.LITELLM_API_KEY
});

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
        'chat-model-small': openai('gpt-4o-mini'),
        'chat-model-large': openai('gpt-4o'),
        'chat-model-reasoning': wrapLanguageModel({
          model: fireworks('accounts/fireworks/models/deepseek-r1'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': openai('gpt-4-turbo'),
        'artifact-model': openai('gpt-4o-mini'),
      },
      imageModels: {
        'small-model': openai.image('dall-e-2'),
        'large-model': openai.image('dall-e-3'),
      },
    });

export const customModel = (apiIdentifier: string) => {
  return wrapLanguageModel({
    model: openai(apiIdentifier),
    middleware: customMiddleware,
  });
};

export const customImageModel = (apiIdentifier: string) => {
  return openai.image(apiIdentifier);
  // return wrapLanguageModel({
  //   model: openai.image(apiIdentifier),
  //   middleware: customMiddleware,
  // });
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
