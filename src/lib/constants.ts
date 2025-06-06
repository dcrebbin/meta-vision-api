export const providerToTitle = {
  openai: "OpenAI",
  perplexity: "Perplexity",
  anthropic: "Anthropic",
  google: "Google",
  elevenlabs: "ElevenLabs",
};

export const MESSENGER_CALL_URL = "groupcall/ROOM";
export const MESSENGER_CONVERSATION_URL = "messages/t/";

export const aiChatProviders = ["openai", "anthropic", "perplexity", "google"];

export const providerToModels = {
  openai: [
    {
      title: "GPT-4o-mini",
      value: "gpt-4o-mini",
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
    { title: "Gemini 2.0 Flash", value: "gemini-2.0-flash" },
    { title: "Gemini 2.0 Flash Lite", value: "gemini-2.0-flash-lite" },
  ],
};

export const providerToTTSModels = {
  "tts-1": {
    title: "TTS-1",
    value: "tts-1",
    provider: "openai",
  },
  eleven_multilingual_v2: {
    title: "Multilingual v2",
    value: "eleven_multilingual_v2",
    provider: "elevenlabs",
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
