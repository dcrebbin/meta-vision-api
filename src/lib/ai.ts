import { Provider, TTSProvider } from "@/types";
import { AnthropicProvider, createAnthropic } from "@ai-sdk/anthropic";
import { createDeepSeek, DeepSeekProvider } from "@ai-sdk/deepseek";
import {
  createGoogleGenerativeAI,
  GoogleGenerativeAIProvider,
} from "@ai-sdk/google";
import { createOpenAI, OpenAIProvider } from "@ai-sdk/openai";
import { createPerplexity, PerplexityProvider } from "@ai-sdk/perplexity";
import { createXai, XaiProvider } from "@ai-sdk/xai";
import { generateText } from "ai";
import { providerToTTSModels } from "./constants";
import { getSystemPromptById } from "./prompts";
import { getStorage, StorageKey } from "./storage";
import { logError, logMessage } from "./utils";

async function createAiProvider(
  provider: Provider
): Promise<
  | OpenAIProvider
  | PerplexityProvider
  | AnthropicProvider
  | GoogleGenerativeAIProvider
  | DeepSeekProvider
  | XaiProvider
> {
  const storageApiKey = getStorage(StorageKey.API_KEYS);
  const apiKeys = await storageApiKey.getValue();
  const apiKey = apiKeys[provider];
  if (!apiKey) {
    throw new Error(
      `No API key found for provider: ${provider}. Please set it in the toolbar.`
    );
  }
  switch (provider) {
    case Provider.LLAMA:
      return createOpenAI({
        apiKey: apiKey,
        baseURL: "https://api.llama.com/v1",
      });
    case Provider.INFLECTION:
      return createOpenAI({
        apiKey: apiKey,
        baseURL: "https://api.inflection.ai/v1",
      });
    case Provider.OPENAI:
      return createOpenAI({
        apiKey: apiKey,
        compatibility: "strict",
      });
    case Provider.PERPLEXITY:
      return createPerplexity({
        apiKey: apiKey,
      });
    case Provider.ANTHROPIC:
      return createAnthropic({
        apiKey: apiKey,
      });
    case Provider.GOOGLE:
      return createGoogleGenerativeAI({
        apiKey: apiKey,
      });
    case Provider.DEEPSEEK:
      return createDeepSeek({
        apiKey: apiKey,
      });
    case Provider.XAI:
      return createXai({
        apiKey: apiKey,
      });
  }
}

export async function generateAiText(message: string) {
  logMessage("generateAiText");
  const settings = getStorage(StorageKey.SETTINGS);
  const settingsValue = await settings.getValue();
  const provider = settingsValue.provider;
  const model = settingsValue.model[provider];
  const systemPromptId = settingsValue.systemPrompt;
  
  try {
    const aiProvider = await createAiProvider(provider);
    const systemPrompt = getSystemPromptById(systemPromptId);
    
    const messages = [];
    if (systemPrompt && systemPrompt.content) {
      messages.push({
        role: "system" as const,
        content: systemPrompt.content
      });
    }
    messages.push({
      role: "user" as const,
      content: message
    });

    const { text } = await generateText({
      model: aiProvider(model),
      messages,
    });
    logMessage("generateAiText Response Generated: " + text);
    return text;
  } catch (error) {
    logError("Error generating AI text: " + error);
    throw error;
  }
}

export async function aiVisionRequest(imageBlob: Blob) {
  logMessage("aiVisionRequest");

  const base64Image = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(",")[1] ?? "");
    };
    reader.readAsDataURL(imageBlob);
  });

  const settings = getStorage(StorageKey.SETTINGS);
  const settingsValue = await settings.getValue();
  const provider = settingsValue.provider;
  const model = settingsValue.model[provider];
  try {
    const aiProvider = await createAiProvider(provider);
    const { text } = await generateText({
      model: aiProvider(model),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Describe the image in detail." },
            {
              type: "image",
              image: `data:image/png;base64,${base64Image}`,
            },
          ],
        },
      ],
    });
    return text;
  } catch (error) {
    logError(`(aiVisionRequest) ${error}`);
    throw error;
  }
}

export async function aiTtsRequest(message: string) {
  const settings = getStorage(StorageKey.SETTINGS);
  const settingsValue = await settings.getValue();
  const ttsProvider =
    providerToTTSModels[
      settingsValue.ttsModel as keyof typeof providerToTTSModels
    ].provider;
  logMessage(
    `(aiTtsRequest) | message: ${message} | ttsProvider: ${ttsProvider}`
  );
  const ttsModel = settingsValue.ttsModel;

  try {
    switch (ttsProvider) {
      case TTSProvider.OPENAI:
        return openAiTtsRequest(message);
      case TTSProvider.ELEVENLABS:
        if (ttsModel === "eleven_v3") {
          return elevenLabsV3TtsRequest(message);
        } else {
          return elevenLabsTtsRequest(message);
        }
      case TTSProvider.MINIMAX:
        return minimaxTtsRequest(message);
      default:
        throw new Error("No provider selected");
    }
  } catch (error) {
    logError(`(aiTtsRequest) ${error}`);
    throw error;
  }
}

async function retrieveBase64Audio(audioBlob: Blob) {
  logMessage("retrieveBase64Audio");
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );
    return base64Audio;
  } catch (error) {
    logError(`(retrieveBase64Audio) ${error}`);
    throw error;
  }
}

async function elevenLabsV3TtsRequest(message: string) {
  logMessage("elevenLabsV3TtsRequest");
  const storageApiKey = getStorage(StorageKey.API_KEYS);
  const apiKeys = await storageApiKey.getValue();
  const apiKey = apiKeys[TTSProvider.ELEVENLABS];
  if (!apiKey) {
    throw new Error(
      `No API key found for provider: ${TTSProvider.ELEVENLABS}. Please set it in the toolbar.`
    );
  }
  const response = await fetch(
    "https://api.us.elevenlabs.io/v1/text-to-dialogue/stream?",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        inputs: [
          {
            text: message,
            voice_id: "cgSgspJ2msm6clMCkdW9",
          },
        ],
        model_id: "eleven_v3",
        settings: { stability: 0.5, use_speaker_boost: true },
      }),
    }
  );

  const audioBlob = await response.blob();
  return retrieveBase64Audio(audioBlob);
}

async function elevenLabsTtsRequest(message: string) {
  logMessage("elevenLabsTtsRequest");
  const storageApiKey = getStorage(StorageKey.API_KEYS);
  const apiKeys = await storageApiKey.getValue();
  const apiKey = apiKeys[TTSProvider.ELEVENLABS];
  if (!apiKey) {
    throw new Error(
      `No API key found for provider: ${TTSProvider.ELEVENLABS}. Please set it in the toolbar.`
    );
  }
  const settings = getStorage(StorageKey.SETTINGS);
  const settingsValue = await settings.getValue();
  const ttsModel = settingsValue.ttsModel;

  const response = await fetch(
    "https://api.elevenlabs.io/v1/text-to-speech/SCbIlR40EEyW2I6quW1h?output_format=mp3_44100_128",
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: message,
        model_id: ttsModel,
      }),
    }
  );

  const audioBlob = await response.blob();
  return retrieveBase64Audio(audioBlob);
}

interface MinimaxTtsResponse {
  data?: {
    audio?: string;
  };
  [key: string]: unknown;
}

async function minimaxTtsRequest(text: string) {
  logMessage("minimaxTtsRequest");
  const storageApiKey = getStorage(StorageKey.API_KEYS);
  const apiKeys = await storageApiKey.getValue();
  const apiKey = apiKeys[TTSProvider.MINIMAX];
  if (!apiKey) {
    throw new Error(
      `No API key found for provider: ${TTSProvider.MINIMAX}. Please set it in the toolbar.`
    );
  }
  const ttsResponse = await fetch("https://api.minimaxi.chat/v1/t2a_v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "speech-02-turbo",
      text: text,
      stream: false,
      subtitle_enable: false,
      voice_setting: {
        voice_id: "English_Aussie_Bloke",
        speed: 1,
        vol: 1,
        pitch: 0,
      },
      audio_setting: {
        sample_rate: 32000,
        bitrate: 128000,
        format: "mp3",
        channel: 1,
      },
    }),
  }).catch((error) => {
    logError(`(minimaxTtsRequest) ${error}`);
    throw error;
  });

  if (ttsResponse instanceof Response && !ttsResponse.ok) {
    logError(`(minimaxTtsRequest) ${ttsResponse.statusText}`);
    throw new Error(ttsResponse.statusText);
  }
  const responseData = await (ttsResponse as Response).json();

  const { data } = responseData as MinimaxTtsResponse;
  if (!data?.audio) {
    logError("(minimaxTtsRequest) No audio data in response");
    throw new Error("No audio data in response");
  }
  function hexToUint8Array(hex: string): Uint8Array {
    if (hex.length % 2 !== 0) throw new Error("Invalid hex string");
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2)
      arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    return arr;
  }
  const audioBytes = hexToUint8Array(data.audio);
  function uint8ToBase64(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.length; i++)
      binary += String.fromCharCode(bytes[i] ?? 0);
    return btoa(binary);
  }
  const base64Audio = uint8ToBase64(audioBytes);
  return base64Audio;
}

async function openAiTtsRequest(message: string) {
  logMessage("openAiTtsRequest");
  const storageApiKey = getStorage(StorageKey.API_KEYS);
  const apiKeys = await storageApiKey.getValue();
  const apiKey = apiKeys[TTSProvider.OPENAI];
  if (!apiKey) {
    throw new Error(
      `No API key found for provider: ${TTSProvider.OPENAI}. Please set it in the toolbar.`
    );
  }
  const settings = getStorage(StorageKey.SETTINGS);
  const settingsValue = await settings.getValue();
  const ttsModel = settingsValue.ttsModel;

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    body: JSON.stringify({
      model: ttsModel,
      input: message,
      voice: ttsModel === "tts-1" ? "alloy" : "coral",
    }),
    headers: {
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const audioBlob = await response.blob();
  return retrieveBase64Audio(audioBlob);
}
