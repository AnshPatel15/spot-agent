/**
 * OpenRouter LLM configuration for LangChain
 * Uses OpenAI-compatible API from OpenRouter
 */

import { ChatOpenAI } from '@langchain/openai';

/**
 * Create OpenRouter LLM instance
 * @param {string} model - Model name (default: 'anthropic/claude-3-haiku')
 * @param {number} temperature - Temperature for response generation
 * @returns {ChatOpenAI} Configured LLM instance
 */
export function createOpenRouterLLM(model = 'qwen/qwen3.6-plus:free', temperature = 0.7) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is required');
  }

  // Set the environment variable that LangChain expects
  process.env.OPENAI_API_KEY = apiKey;

  return new ChatOpenAI({
    model: model,
    temperature,
    configuration: {
      apiKey: apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    },
  });
}

/**
 * Create a simple LLM instance for basic chat
 * @returns {ChatOpenAI} Basic LLM instance
 */
export function createBasicLLM() {
  return createOpenRouterLLM('qwen/qwen3.6-plus:free', 0.7);
}
