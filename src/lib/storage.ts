import { type WxtStorageItem, storage as browserStorage } from "#imports";
import { useEffect, useState } from "react";
import { Provider, TTSProvider } from "~/types";
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
  OPENAI_API_KEY: "local:openai_api_key",
  PERPLEXITY_API_KEY: "local:perplexity_api_key",
  ANTHROPIC_API_KEY: "local:anthropic_api_key",
  GOOGLE_API_KEY: "local:google_api_key",
  ELEVENLABS_API_KEY: "local:elevenlabs_api_key",
} as const;

export type StorageKey = (typeof StorageKey)[keyof typeof StorageKey];

const storage = {
  [StorageKey.LOGS]: browserStorage.defineItem<string[]>(StorageKey.LOGS, {
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
          openai: "gpt-4o-mini",
          anthropic: "claude-3-5-sonnet-20240620",
          perplexity: "sonar-pro",
          google: "gemini-2.0-flash",
        },
        ttsModel: "tts-1",
        videoCaptureInterval: 1000,
      },
    }
  ),
  [StorageKey.API_KEYS]: browserStorage.defineItem<{
    [key in Provider | TTSProvider]: string;
  }>(StorageKey.API_KEYS, {
    fallback: {
      openai: "",
      anthropic: "",
      perplexity: "",
      google: "",
      elevenlabs: "",
      minimax: "",
    },
  }),
  [StorageKey.OPENAI_API_KEY]: browserStorage.defineItem<string>(
    StorageKey.OPENAI_API_KEY,
    {
      fallback: "",
    }
  ),
  [StorageKey.PERPLEXITY_API_KEY]: browserStorage.defineItem<string>(
    StorageKey.PERPLEXITY_API_KEY,
    {
      fallback: "",
    }
  ),
  [StorageKey.ANTHROPIC_API_KEY]: browserStorage.defineItem<string>(
    StorageKey.ANTHROPIC_API_KEY,
    {
      fallback: "",
    }
  ),
  [StorageKey.GOOGLE_API_KEY]: browserStorage.defineItem<string>(
    StorageKey.GOOGLE_API_KEY,
    {
      fallback: "",
    }
  ),
  [StorageKey.ELEVENLABS_API_KEY]: browserStorage.defineItem<string>(
    StorageKey.ELEVENLABS_API_KEY,
    {
      fallback: "",
    }
  ),
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
