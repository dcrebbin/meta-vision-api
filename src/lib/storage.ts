import { type WxtStorageItem, storage as browserStorage } from "#imports";
import { useEffect, useState } from "react";
import { Provider, TTSProvider } from "~/types";
import { Log } from "./messaging";
import { DEFAULT_PROMPT_ID } from "./prompts";
import { type SettingsStore } from "./store/settings.store";

type StoredSettings = Omit<SettingsStore["settings"], "model"> & {
  model: {
    [key in Provider]: string;
  };
};

export const StorageKey = {
  LOGS: "local:logs",
  SETTINGS: "local:settings",
  API_KEYS: "local:api_keys",
} as const;

export type StorageKey = (typeof StorageKey)[keyof typeof StorageKey];

const storage = {
  [StorageKey.LOGS]: browserStorage.defineItem<Log[]>(StorageKey.LOGS, {
    fallback: [],
  }),
  [StorageKey.SETTINGS]: browserStorage.defineItem<StoredSettings>(
    StorageKey.SETTINGS,
    {
      fallback: {
        imageQuality: 0.5,
        provider: "openai",
        useTTS: false,
        model: {
          llama: "Llama-4-Maverick-17B-128E-Instruct-FP8",
          inflection: "Pi-3.1",
          openai: "gpt-4o-mini",
          anthropic: "claude-3-5-sonnet-20240620",
          perplexity: "sonar-pro",
          google: "gemini-2.0-flash",
          deepseek: "deepseek-chat",
          xai: "grok-3-latest",
        },
        ttsModel: "tts-1",
        systemPrompt: DEFAULT_PROMPT_ID,
        videoCaptureInterval: 1000,
        isMaiUIVisible: true,
        isConversationSidebarVisible: false,
      },
    }
  ),
  [StorageKey.API_KEYS]: browserStorage.defineItem<{
    [key in Provider | TTSProvider]: string;
  }>(StorageKey.API_KEYS, {
    fallback: {
      llama: "",
      inflection: "",
      openai: "",
      anthropic: "",
      perplexity: "",
      google: "",
      elevenlabs: "",
      minimax: "",
      deepseek: "",
      xai: "",
    },
  }),
} as const;

type Value<T extends StorageKey> = (typeof storage)[T] extends WxtStorageItem<
  infer V,
  infer _
>
  ? V
  : never;

export const getStorage = <K extends StorageKey>(key: K) => {
  return storage[key];
};

export const useStorage = <K extends StorageKey>(key: K) => {
  const item = storage[key] as WxtStorageItem<
    Value<K>,
    Record<string, unknown>
  >;
  const [value, setValue] = useState<Value<K> | null>(null);

  useEffect(() => {
    const unwatch = item.watch((value) => {
      setValue(value);
    });

    return () => {
      unwatch();
    };
  }, [item]);

  useEffect(() => {
    (async () => {
      const value = await item.getValue();
      setValue(value);
    })();
  }, [item.getValue]);

  const remove = () => {
    void item.removeValue();
  };

  const set = (value: Value<K>) => {
    void item.setValue(value);
  };

  return { data: value ?? item.fallback, remove, set };
};
