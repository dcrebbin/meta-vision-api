import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { StorageKey } from "./storage";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export function getStorageKey(provider: string): StorageKey | undefined {
  switch (provider) {
    case "openai":
      return StorageKey.OPENAI_API_KEY;
    case "perplexity":
      return StorageKey.PERPLEXITY_API_KEY;
    case "anthropic":
      return StorageKey.ANTHROPIC_API_KEY;
    case "google":
      return StorageKey.GOOGLE_API_KEY;
    case "elevenlabs":
      return StorageKey.ELEVENLABS_API_KEY;
  }
}

export function getStorageModel(provider: string): StorageKey | undefined {
  switch (provider) {
    case "openai":
      return StorageKey.OPENAI_MODEL;
    case "perplexity":
      return StorageKey.PERPLEXITY_MODEL;
    case "anthropic":
      return StorageKey.ANTHROPIC_MODEL;
    case "google":
      return StorageKey.GOOGLE_MODEL;
    case "elevenlabs":
      return StorageKey.ELEVENLABS_API_KEY;
    case "tts":
      return StorageKey.TTS_MODEL;
  }
}
