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
import { getStorage, StorageKey } from "./storage";
import { logError, logToConsole } from "./utils";

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
  switch (provider) {
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
  const settings = getStorage(StorageKey.SETTINGS);
  const settingsValue = await settings.getValue();
  const provider = settingsValue.provider;
  const model = settingsValue.model[provider];

  const aiProvider = await createAiProvider(provider);

  const { text } = await generateText({
    model: aiProvider(model),
    prompt: message,
  });
  return text;
}

export async function aiVisionRequest(imageBlob: Blob) {
  logToConsole("aiVisionRequest");

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

  const aiProvider = await createAiProvider(provider);
  try {
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
    return "Error: " + error;
  }
}

export async function aiTtsRequest(message: string) {
  logToConsole("aiTtsRequest");
  const settings = getStorage(StorageKey.SETTINGS);
  const settingsValue = await settings.getValue();
  const ttsProvider =
    providerToTTSModels[
      settingsValue.ttsModel as keyof typeof providerToTTSModels
    ].provider;
  try {
    switch (ttsProvider) {
      case TTSProvider.OPENAI:
        return openAiTtsRequest(message);
      case TTSProvider.ELEVENLABS:
        return elevenLabsTtsRequest(message);
      case TTSProvider.MINIMAX:
        return minimaxTtsRequest(message);
      default:
        return "Error: No provider selected";
    }
  } catch (error) {
    logError(`(aiTtsRequest) ${error}`);
    return "Error: " + error;
  }
}

async function retrieveBase64Audio(audioBlob: Blob) {
  logToConsole("retrieveBase64Audio");
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
    return "Error: " + error;
  }
}

async function elevenLabsTtsRequest(message: string) {
  logToConsole("elevenLabsTtsRequest");
  const storageApiKey = getStorage(StorageKey.API_KEYS);
  const apiKeys = await storageApiKey.getValue();
  const apiKey = apiKeys[TTSProvider.ELEVENLABS];
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

async function minimaxTtsRequest(text: string) {
  logToConsole("minimaxTtsRequest");
  const storageApiKey = getStorage(StorageKey.API_KEYS);
  const apiKeys = await storageApiKey.getValue();
  const apiKey = apiKeys[TTSProvider.MINIMAX];

  const ttsResponse = await fetch(
    "https://api.minimaxi.chat/v1/t2a_v2?GroupId=1920022035161944772",
    {
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
    }
  );

  const audioBlob = await ttsResponse.blob();
  return retrieveBase64Audio(audioBlob);
}

async function openAiTtsRequest(message: string) {
  logToConsole("openAiTtsRequest");
  const storageApiKey = getStorage(StorageKey.API_KEYS);
  const apiKeys = await storageApiKey.getValue();
  const apiKey = apiKeys[TTSProvider.OPENAI];
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
