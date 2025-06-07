export const providerToTitle = {
  openai: "OpenAI",
  perplexity: "Perplexity",
  anthropic: "Anthropic",
  google: "Google",
  elevenlabs: "ElevenLabs",
  minimax: "Minimax",
  deepseek: "DeepSeek",
  xai: "XAI",
};

export const MESSENGER_CALL_URL = "groupcall/ROOM";
export const MESSENGER_CONVERSATION_URL = "messages/t/";

export const aiChatProviders = [
  "openai",
  "anthropic",
  "perplexity",
  "google",
  "deepseek",
  "xai",
];

export const providerToModels = {
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
