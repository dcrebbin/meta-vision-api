export const providerToTitle = {
  openai: "OpenAI",
  perplexity: "Perplexity",
  anthropic: "Anthropic",
  google: "Google",
  elevenlabs: "ElevenLabs",
};

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
    title: "ElevenLabs Multilingual v2",
    value: "eleven_multilingual_v2",
    provider: "elevenlabs",
  },
};
