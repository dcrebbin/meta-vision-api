import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Message, sendMessage } from "./messaging";
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

export function logMessage(message: string) {
  sendMessage(Message.ADD_LOG, message);
}

export function logError(message: string) {
  console.error(`[mai api] ${message}`);
}

export function logToConsole(message: string) {
  console.log(`[mai api] ${message}`);
}
