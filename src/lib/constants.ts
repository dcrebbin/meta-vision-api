import { ElevenLabsLogo } from "./logos/11labs";
import { AnthropicLogo } from "./logos/anthropic";
import { DeepSeekLogo } from "./logos/deepseek";
import { GoogleLogo } from "./logos/google";
import { InflectionLogo } from "./logos/inflection";
import { MetaLogo } from "./logos/meta";
import { MinimaxLogo } from "./logos/minimax";
import { OpenAILogo } from "./logos/openai";
import { PerplexityLogo } from "./logos/perplexity";
import { XAILogo } from "./logos/xai";

export const providerInformation = {
  llama: {
    title: "Llama",
    url: "https://llamacom",
    modelsUrl: "https://llama.com",
    apiKeyUrl: "https://llama.com",
    logo: MetaLogo,
  },
  inflection: {
    title: "Inflection",
    url: "https://inflection.ai",
    modelsUrl: "https://developers.inflection.ai",
    apiKeyUrl: "https://developers.inflection.ai",
    logo: InflectionLogo,
  },
  openai: {
    title: "OpenAI",
    url: "https://openai.com",
    modelsUrl: "https://platform.openai.com/docs/models",
    apiKeyUrl: "https://platform.openai.com/api-keys",
    logo: OpenAILogo,
  },
  perplexity: {
    title: "Perplexity",
    url: "https://perplexity.ai",
    modelsUrl: "https://docs.perplexity.ai/models/model-cards",
    apiKeyUrl: "https://docs.perplexity.ai/guides/getting-started",
    logo: PerplexityLogo,
  },
  anthropic: {
    title: "Anthropic",
    url: "https://anthropic.com",
    modelsUrl:
      "https://docs.anthropic.com/en/docs/about-claude/models/overview",
    apiKeyUrl: "https://console.anthropic.com",
    logo: AnthropicLogo,
  },
  google: {
    title: "Google",
    url: "https://google.com",
    modelsUrl: "https://ai.google.dev/models",
    apiKeyUrl: "https://ai.google.dev/gemini-api/docs/api-key",
    logo: GoogleLogo,
  },
  elevenlabs: {
    title: "ElevenLabs",
    url: "https://elevenlabs.io",
    modelsUrl: "https://elevenlabs.io/docs/models",
    apiKeyUrl: "https://elevenlabs.io/app/settings/api-keys",
    logo: ElevenLabsLogo,
  },
  deepseek: {
    title: "DeepSeek",
    url: "https://deepseek.com",
    modelsUrl: "https://api-docs.deepseek.com/quick_start/pricing",
    apiKeyUrl: "https://platform.deepseek.com/",
    logo: DeepSeekLogo,
  },
  xai: {
    title: "xAI",
    url: "https://x.ai",
    modelsUrl: "https://docs.x.ai/docs/models",
    apiKeyUrl: "https://console.x.ai/",
    logo: XAILogo,
  },
  minimax: {
    title: "Minimax",
    url: "https://www.minimax.io/",
    modelsUrl: "https://www.minimax.io/platform_overview",
    apiKeyUrl: "https://www.minimax.io/platform",
    logo: MinimaxLogo,
  },
};

export const MESSENGER_CALL_URL = "groupcall/ROOM";
export const MESSENGER_CONVERSATION_URL = "messages/t/";

export const aiChatProviders = [
  "llama",
  "inflection",
  "openai",
  "anthropic",
  "perplexity",
  "google",
  "deepseek",
  "xai",
];

export const providerToModels = {
  llama: [
    {
      title: "Llama-4-Maverick",
      value: "Llama-4-Maverick-17B-128E-Instruct-FP8",
    },
  ],
  inflection: [
    {
      title: "Pi-3.0",
      value: "inflection_3_pi",
    },
    {
      title: "Pi-3.1",
      value: "Pi-3.1",
    },
    {
      title: "Llama-Inf-3.1-70B-EQ-Reasoning",
      value: "Llama-Inf-3.1-70B-EQ-Reasoning",
    },
    {
      title: "Llama-Inf-3.1-70B-Productivity",
      value: "Llama-Inf-3.1-70B-Productivity",
    },
  ],
  openai: [
    {
      title: "GPT-4.1",
      value: "gpt-4.1-2025-04-14",
    },
    {
      title: "GPT-4.1-mini",
      value: "gpt-4.1-mini",
    },
    {
      title: "GPT-4.1-nano",
      value: "gpt-4.1-nano-2025-04-14",
    },
    { title: "GPT-4o", value: "gpt-4o" },
  ],
  perplexity: [
    { title: "Sonar Pro", value: "sonar-pro" },
    { title: "Sonar", value: "sonar" },
  ],
  anthropic: [
    { title: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet-20240620" },
  ],
  google: [
    { title: "Gemini 2.5 Flash", value: "gemini-2.5-flash" },
    { title: "Gemini 2.5 Flash Lite", value: "gemini-2.5-flash-lite" },
  ],
  deepseek: [
    { title: "DeepSeek Chat", value: "deepseek-chat" },
    { title: "DeepSeek Reasoner", value: "deepseek-reasoner" },
  ],
  xai: [{ title: "Grok 3", value: "grok-3-latest" }],
};

export const providerToTTSModels = {
  "tts-1": {
    title: "TTS-1",
    value: "tts-1",
    provider: "openai",
  },
  "gpt-4o-mini-tts": {
    title: "GPT 4o mini TTS",
    value: "gpt-4o-mini-tts",
    provider: "openai",
  },
  eleven_multilingual_v2: {
    title: "Multilingual v2",
    value: "eleven_multilingual_v2",
    provider: "elevenlabs",
  },
  eleven_flash_v2_5: {
    title: "Flash v2.5",
    value: "eleven_flash_v2_5",
    provider: "elevenlabs",
  },
  eleven_turbo_v2_5: {
    title: "Turbo v2.5",
    value: "eleven_turbo_v2_5",
    provider: "elevenlabs",
  },
  eleven_v3: {
    title: "V3",
    value: "eleven_v3",
    provider: "elevenlabs",
  },
  "speech-02-turbo": {
    title: "Speech 02 Turbo",
    value: "speech-02-turbo",
    provider: "minimax",
  },
};

export const toolTips = {
  chatProvider: "The AI provider to use for chat or vision LLM responses.",
  chatModel:
    "The model to use for chat or vision LLM responses specific to selected provider.",
  ttsModel: "The model to use for text to speech if TTS is enabled.",
  conversationName:
    "The name of the conversation. Used to identify the conversation in the chat history via the DOM.",
  takeAndSendScreenshot:
    "Takes a screenshot of the current screen and sends it to the server for processing.",
  requestDisplayPermission:
    "Requests permission to access the display. This is required to take screenshots of the current screen.",
};
