import { StaticImport } from "next/dist/shared/lib/get-img-props";

import gptLogoBlack from '@/assets/icons/third-party-logos/providers/openai-black.svg';
import gptLogoWhite from '@/assets/icons/third-party-logos/providers/openai-white.svg';
import claudeLogo from '@/assets/icons/third-party-logos/providers/claude.svg';
import geminiLogo from '@/assets/icons/third-party-logos/providers/gemini.svg';
import dalleLogo from '@/assets/icons/third-party-logos/providers/dall-e.png';
import grokLogo from '@/assets/icons/third-party-logos/providers/grok.svg';
import stabilityAiLogo from '@/assets/icons/third-party-logos/providers/stability-ai.svg';
import leonardoAiLogo from '@/assets/icons/third-party-logos/providers/leonardo-ai.svg';

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
  output?: 'text' | 'image';
  icon: { light: StaticImport, dark: StaticImport };
  status: 'enabled' | 'coming-soon' | 'disabled';
}

export interface ModelGroup {
  id: string;
  title: string;
  models: Array<Model>;
}

// GPT models
export const gptModels: Array<Model> = [
  {
    id: 'gpt-4o-mini',
    label: 'چت‌جی‌پی‌تی 4o mini (ChatGPT)',
    apiIdentifier: 'gpt-4o-mini',
    description: 'مدلی برای انجام سریع و ارزان کارهای روزمره با دقت بالا از شرکت اوپن ای‌آی',
    icon: { light: gptLogoBlack, dark: gptLogoWhite },
    status: 'enabled',
  },
  {
    id: 'gpt-4o',
    label: 'چت‌جی‌پی‌تی 4o (ChatGPT)',
    apiIdentifier: 'gpt-4o',
    description: 'هوشمندترین مدل شرکت اوپن ای‌آی برای انجام تمامی کارها در سطح پیشرفته',
    icon: { light: gptLogoBlack, dark: gptLogoWhite },
    status: 'enabled',
  },
  {
    id: 'o1-mini',
    label: 'o1 Mini',
    apiIdentifier: 'o1-mini',
    description: 'مدل استدلالی سریع و مقرون به صرفه، طراحی شده برای کاربردهای برنامه‌نویسی، ریاضیات و علوم، از شرکت اوپن ای‌آی',
    icon: { light: gptLogoBlack, dark: gptLogoWhite },
    status: 'enabled',
  },
  {
    id: 'o1-preview',
    label: 'o1 Preview',
    apiIdentifier: 'o1-preview',
    description: 'مدل استدلالی از شرکت اوپن ای‌آی برای مسائل پیچیده که نیاز به دانش عمومی و گسترده دارند',
    icon: { light: gptLogoBlack, dark: gptLogoWhite },
    status: 'enabled',
  },
];

// Claude models
export const claudeModels: Array<Model> = [
  {
    id: 'claude-3-5-sonnet-20241022',
    label: 'کلاود ۳.۵ سانِت (Sonnet)',
    apiIdentifier: 'claude-3-5-sonnet-20241022',
    description: "هوشمندترین مدل شرکت آنتروپیک برای انجام تمامی کارها در سطح پیشرفته",
    icon: { light: claudeLogo, dark: claudeLogo },
    status: 'enabled',
  },
  {
    id: 'claude-3-5-haiku-20241022',
    label: 'کلاود ۳ هایکو (Haiku)',
    apiIdentifier: 'claude-3-5-haiku-20241022',
    description: 'مدلی برای انجام سریع و ارزان کارهای روزمره با دقت بالا از شرکت آنتروپیک',
    icon: { light: claudeLogo, dark: claudeLogo },
    status: 'enabled',
  },
  {
    id: 'claude-3-opus-20240229',
    label: 'کلاود ۳ اوپوس (Opus)',
    apiIdentifier: 'claude-3-opus-20240229',
    description: 'بزرگ‌ترین و گران‌ترین مدل شرکت آنتروپیک برای انجام تحلیل‌های پیچیده',
    icon: { light: claudeLogo, dark: claudeLogo },
    status: 'enabled',
  },
];

// Gemini models
export const geminiModels: Array<Model> = [
  {
    id: 'gemini-1.5-flash',
    label: 'جِمِنای ۱.۵ فلش (Flash)',
    apiIdentifier: 'gemini-1.5-flash',
    description: 'مدلی برای انجام سریع و ارزان کارهای روزمره با دقت بالا از شرکت گوگل',
    icon: { light: geminiLogo, dark: geminiLogo },
    status: 'enabled',
  },
  {
    id: 'gemini-1.5-pro',
    label: 'جِمِنای ۱.۵ پرو (Pro)',
    apiIdentifier: 'gemini-1.5-pro',
    description: 'هوشمندترین مدل شرکت گوگل برای انجام تمامی کارها در سطح پیشرفته',
    icon: { light: geminiLogo, dark: geminiLogo },
    status: 'enabled',
  },
];

// Grok models
export const grokModels: Array<Model> = [
  {
    id: 'grok-beta',
    label: 'Grok 2',
    apiIdentifier: 'grok-beta',
    description: 'مدل قدرتمند ساخته شده توسط شرکت xAI',
    icon: { light: grokLogo, dark: grokLogo },
    status: 'coming-soon',
  },
];

// Image generation models
export const imageGenerationModels: Array<Model> = [
  {
    id: 'dall-e-3',
    label: 'DALL-E 3',
    apiIdentifier: 'dall-e-3',
    description: 'مدلی از شرکت اوپن ای‌آی برای ایجاد عکس در سبک‌های مختلف با توجه به توضیحات شما',
    output: 'image',
    icon: { light: dalleLogo, dark: dalleLogo },
    status: 'enabled',
  },
  {
    id: 'leonardo',
    label: 'Leonardo.Ai',
    apiIdentifier: 'leonardo',
    description: 'مدل قدرتمند تولید عکس',
    output: 'image',
    icon: { light: leonardoAiLogo, dark: leonardoAiLogo },
    status: 'coming-soon',
  },
  {
    id: 'SD3.5',
    label: 'Stable Diffusion 3.5',
    apiIdentifier: 'SD3.5',
    description: 'مدل قدرتمند تولید عکس',
    output: 'image',
    icon: { light: stabilityAiLogo, dark: stabilityAiLogo },
    status: 'coming-soon',
  },
  {
    id: 'SDXL',
    label: 'Stable Diffusion XL',
    apiIdentifier: 'SDXL',
    description: 'مدل قدرتمند تولید عکس',
    output: 'image',
    icon: { light: stabilityAiLogo, dark: stabilityAiLogo },
    status: 'coming-soon',
  },
];

// Combine all models
export const models: Array<Model> = [
  ...gptModels,
  ...claudeModels,
  ...geminiModels,
  ...grokModels,
  ...imageGenerationModels,
];

// Define model tiers based on capabilities using prefixes
const strongestPrefixes = [
  'claude-3-5-sonnet-',
  'gpt-4o',  // not mini
  'gemini-1.5-pro'
];

const cheapestPrefixes = [
  'gpt-4o-mini',
  'claude-3-5-haiku-',
  'gemini-1.5-flash'
];

const specificPrefixes = [
  'claude-3-opus-',
  'o1',
  'grok'
];

export const modelGroups: Array<ModelGroup> = [
  {
    id: "powerful",
    title: "قوی‌ترین‌ها",
    models: strongestPrefixes.map(prefix =>
      models.find(model =>
        model.id.startsWith(prefix) &&
        // Special case for gpt-4o to exclude gpt-4o-mini
        !(prefix === 'gpt-4o' && model.id.includes('-mini'))
      )
    ).filter(model => !!model),
  },
  {
    id: "cheap",
    title: "ارزان‌ترین‌ها",
    models: cheapestPrefixes.map(prefix =>
      models.find(model =>
        model.id.startsWith(prefix)
      )
    ).filter(model => !!model),
  },
  {
    id: "image",
    title: "تولید عکس",
    models: imageGenerationModels,
  },
  {
    id: "specific",
    title: "خاص‌منظوره‌ها",
    models: specificPrefixes.map(prefix =>
      models.find(model =>
        model.id.startsWith(prefix)
      )
    ).filter(model => !!model),
  }
];

export const DEFAULT_MODEL_NAME: string = 'gpt-4o-mini';
