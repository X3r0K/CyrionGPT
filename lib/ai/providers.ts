import { customProvider } from 'ai';
import { openai } from '@ai-sdk/openai';
import { openrouter } from '@openrouter/ai-sdk-provider';

export const myProvider = customProvider({
  languageModels: {
    'chat-model-small': openai.responses('gpt-4.1-mini-2025-04-14'),
    'chat-model-small-text': openrouter('deepseek/deepseek-chat-v3-0324'),
    'chat-model-large': openai.responses('gpt-4.1-2025-04-14'),
    'chat-model-large-text': openrouter('qwen/qwen3-coder'),
  },
});
