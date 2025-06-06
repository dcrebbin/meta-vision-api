import { type WxtStorageItem, storage as browserStorage } from "#imports";
import { useEffect, useState } from "react";
import { Theme } from "~/types";

export const StorageKey = {
  THEME: "local:theme",
  LOGS: "local:logs",
  OPENAI_API_KEY: "local:openai_api_key",
  OPENAI_MODEL: "local:openai_model",
  PERPLEXITY_API_KEY: "local:perplexity_api_key",
  PERPLEXITY_MODEL: "local:perplexity_model",
  ANTHROPIC_API_KEY: "local:anthropic_api_key",
  ANTHROPIC_MODEL: "local:anthropic_model",
  GOOGLE_API_KEY: "local:google_api_key",
  GOOGLE_MODEL: "local:google_model",
  ELEVENLABS_API_KEY: "local:elevenlabs_api_key",
  TTS_MODEL: "local:tts_model",
  USE_TTS: "local:use_tts",
} as const;

export type StorageKey = (typeof StorageKey)[keyof typeof StorageKey];

const storage = {
  [StorageKey.THEME]: browserStorage.defineItem<Theme>(StorageKey.THEME, {
    fallback: Theme.SYSTEM,
  }),
  [StorageKey.LOGS]: browserStorage.defineItem<string[]>(StorageKey.LOGS, {
    fallback: [],
  }),
  [StorageKey.OPENAI_API_KEY]: browserStorage.defineItem<string>(
    StorageKey.OPENAI_API_KEY,
    {
      fallback: "",
    }
  ),
  [StorageKey.OPENAI_MODEL]: browserStorage.defineItem<string>(
    StorageKey.OPENAI_MODEL,
    {
      fallback: "gpt-4o-mini",
    }
  ),
  [StorageKey.PERPLEXITY_API_KEY]: browserStorage.defineItem<string>(
    StorageKey.PERPLEXITY_API_KEY,
    {
      fallback: "",
    }
  ),
  [StorageKey.PERPLEXITY_MODEL]: browserStorage.defineItem<string>(
    StorageKey.PERPLEXITY_MODEL,
    {
      fallback: "sonar-pro",
    }
  ),
  [StorageKey.ANTHROPIC_API_KEY]: browserStorage.defineItem<string>(
    StorageKey.ANTHROPIC_API_KEY,
    {
      fallback: "",
    }
  ),
  [StorageKey.ANTHROPIC_MODEL]: browserStorage.defineItem<string>(
    StorageKey.ANTHROPIC_MODEL,
    {
      fallback: "claude-3-5-sonnet-20240620",
    }
  ),
  [StorageKey.GOOGLE_API_KEY]: browserStorage.defineItem<string>(
    StorageKey.GOOGLE_API_KEY,
    {
      fallback: "",
    }
  ),
  [StorageKey.GOOGLE_MODEL]: browserStorage.defineItem<string>(
    StorageKey.GOOGLE_MODEL,
    {
      fallback: "gemini-2.0-flash",
    }
  ),
  [StorageKey.ELEVENLABS_API_KEY]: browserStorage.defineItem<string>(
    StorageKey.ELEVENLABS_API_KEY,
    {
      fallback: "",
    }
  ),
  [StorageKey.TTS_MODEL]: browserStorage.defineItem<string>(
    StorageKey.TTS_MODEL,
    {
      fallback: "tts-1",
    }
  ),
  [StorageKey.USE_TTS]: browserStorage.defineItem<boolean>(StorageKey.USE_TTS, {
    fallback: false,
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
