export interface ModelInfo {
  id: string;
  name: string;
  providerId: string;
  providerName: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  envKey: string;
  models: ModelInfo[];
}

function models(
  providerId: string,
  providerName: string,
  list: Array<[string, string]>
): ModelInfo[] {
  return list.map(([id, name]) => ({ id, name, providerId, providerName }));
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    envKey: "ANTHROPIC_API_KEY",
    models: models("anthropic", "Anthropic", [
      ["claude-opus-4-6", "Claude Opus 4.6"],
      ["claude-sonnet-4-6", "Claude Sonnet 4.6"],
      ["claude-sonnet-4-5", "Claude Sonnet 4.5"],
      ["claude-haiku-4-5", "Claude Haiku 4.5"],
    ]),
  },
  {
    id: "openai",
    name: "OpenAI",
    envKey: "OPENAI_API_KEY",
    models: models("openai", "OpenAI", [
      ["gpt-5", "GPT-5"],
      ["gpt-4o", "GPT-4o"],
      ["gpt-4o-mini", "GPT-4o Mini"],
      ["gpt-4.1", "GPT-4.1"],
      ["gpt-4.1-mini", "GPT-4.1 Mini"],
      ["gpt-4.1-nano", "GPT-4.1 Nano"],
      ["o4-mini", "o4 Mini"],
    ]),
  },
  {
    id: "google",
    name: "Google",
    envKey: "GOOGLE_GENERATIVE_AI_API_KEY",
    models: models("google", "Google", [
      ["gemini-2.5-pro", "Gemini 2.5 Pro"],
      ["gemini-2.5-flash", "Gemini 2.5 Flash"],
      ["gemini-2.0-flash", "Gemini 2.0 Flash"],
    ]),
  },
  {
    id: "xai",
    name: "xAI",
    envKey: "XAI_API_KEY",
    models: models("xai", "xAI", [
      ["grok-4", "Grok 4"],
      ["grok-3", "Grok 3"],
      ["grok-3-mini", "Grok 3 Mini"],
    ]),
  },
  {
    id: "mistral",
    name: "Mistral",
    envKey: "MISTRAL_API_KEY",
    models: models("mistral", "Mistral", [
      ["mistral-large-latest", "Mistral Large"],
      ["pixtral-large-latest", "Pixtral Large"],
      ["mistral-small-latest", "Mistral Small"],
    ]),
  },
  {
    id: "groq",
    name: "Groq",
    envKey: "GROQ_API_KEY",
    models: models("groq", "Groq", [
      ["llama-3.3-70b-versatile", "Llama 3.3 70B"],
      ["llama-3.1-8b-instant", "Llama 3.1 8B"],
      ["mixtral-8x7b-32768", "Mixtral 8x7B"],
    ]),
  },
  {
    id: "cerebras",
    name: "Cerebras",
    envKey: "CEREBRAS_API_KEY",
    models: models("cerebras", "Cerebras", [
      ["llama-3.3-70b", "Llama 3.3 70B"],
    ]),
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    envKey: "DEEPSEEK_API_KEY",
    models: models("deepseek", "DeepSeek", [
      ["deepseek-chat", "DeepSeek Chat"],
      ["deepseek-reasoner", "DeepSeek Reasoner"],
    ]),
  },
  {
    id: "perplexity",
    name: "Perplexity",
    envKey: "PERPLEXITY_API_KEY",
    models: models("perplexity", "Perplexity", [
      ["sonar-pro", "Sonar Pro"],
      ["sonar", "Sonar"],
    ]),
  },
  {
    id: "cohere",
    name: "Cohere",
    envKey: "COHERE_API_KEY",
    models: models("cohere", "Cohere", [
      ["command-a-03-2025", "Command A"],
      ["command-r-plus", "Command R+"],
    ]),
  },
  {
    id: "togetherai",
    name: "Together AI",
    envKey: "TOGETHER_AI_API_KEY",
    models: models("togetherai", "Together AI", [
      ["meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo", "Llama 3.1 405B"],
      ["meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo", "Llama 3.1 70B"],
    ]),
  },
  {
    id: "fireworks",
    name: "Fireworks",
    envKey: "FIREWORKS_API_KEY",
    models: models("fireworks", "Fireworks", [
      ["accounts/fireworks/models/llama-v3p1-405b-instruct", "Llama 3.1 405B"],
    ]),
  },
];

export const ALL_MODELS = PROVIDERS.flatMap((p) => p.models);

export const DEFAULT_MODEL = "anthropic:claude-sonnet-4-6";

export function findProvider(providerId: string): ProviderInfo | undefined {
  return PROVIDERS.find((p) => p.id === providerId);
}

export function parseModelString(modelStr: string): { providerId: string; modelId: string } {
  const idx = modelStr.indexOf(":");
  if (idx === -1) return { providerId: "anthropic", modelId: modelStr };
  return { providerId: modelStr.slice(0, idx), modelId: modelStr.slice(idx + 1) };
}
