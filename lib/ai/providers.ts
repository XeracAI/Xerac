import { wrapLanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { customMiddleware } from './custom-middleware';

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
