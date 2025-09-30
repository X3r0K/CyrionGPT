import { customProvider } from 'ai';
import { openai } from '@ai-sdk/openai';
import { openrouter } from '@openrouter/ai-sdk-provider';

export const myProvider = customProvider({
  languageModels: {
    // Old models
    'chat-model-small': openai.responses('gpt-4.1-mini-2025-04-14'),
    'chat-model-small-text': openrouter('qwen/qwen3-coder'),
    'chat-model-large': openai.responses('gpt-4.1-2025-04-14'),
    'chat-model-large-text': openrouter('qwen/qwen3-coder'),

    // New models
    'ask-model': openrouter('qwen/qwen3-coder'),
    'vision-model': openrouter('qwen/qwen3-vl-235b-a22b-instruct'),
    'vision-model-for-pdfs': openai('gpt-4.1-2025-04-14'),
    'title-generator-model': openai('gpt-4.1-mini-2025-04-14'),
  },
});
