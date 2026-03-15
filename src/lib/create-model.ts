import { anthropic as createAnthropic } from "@ai-sdk/anthropic";
import { openai as createOpenai } from "@ai-sdk/openai";
import { google as createGoogle } from "@ai-sdk/google";
import { xai as createXai } from "@ai-sdk/xai";
import { mistral as createMistral } from "@ai-sdk/mistral";
import { groq as createGroq } from "@ai-sdk/groq";
import { deepseek as createDeepseek } from "@ai-sdk/deepseek";
import { perplexity as createPerplexity } from "@ai-sdk/perplexity";
import { cohere as createCohere } from "@ai-sdk/cohere";
import { cerebras as createCerebras } from "@ai-sdk/cerebras";
import { togetherai as createTogetherai } from "@ai-sdk/togetherai";
import { fireworks as createFireworks } from "@ai-sdk/fireworks";
import { moonshotai as createMoonshotai } from "@ai-sdk/moonshotai";
import { alibaba as createAlibaba } from "@ai-sdk/alibaba";
import { deepinfra as createDeepinfra } from "@ai-sdk/deepinfra";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProviderFactory = (modelId: string, opts?: any) => any;

const providers: Record<string, ProviderFactory> = {
  anthropic: createAnthropic,
  openai: createOpenai,
  google: createGoogle,
  xai: createXai,
  mistral: createMistral,
  groq: createGroq,
  deepseek: createDeepseek,
  perplexity: createPerplexity,
  cohere: createCohere,
  cerebras: createCerebras,
  togetherai: createTogetherai,
  fireworks: createFireworks,
  moonshotai: createMoonshotai,
  alibaba: createAlibaba,
  deepinfra: createDeepinfra,
};

export function createModel(modelStr: string, apiKey?: string) {
  const idx = modelStr.indexOf(":");
  const providerId = idx === -1 ? "anthropic" : modelStr.slice(0, idx);
  const modelId = idx === -1 ? modelStr : modelStr.slice(idx + 1);
  const factory = providers[providerId] ?? createAnthropic;
  return factory(modelId, apiKey ? { apiKey } : undefined);
}

export function isAnthropicModel(modelStr: string): boolean {
  return modelStr.startsWith("anthropic:") || !modelStr.includes(":");
}
