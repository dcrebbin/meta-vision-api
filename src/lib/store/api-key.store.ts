import { create } from "zustand";
import type { Provider, TTSProvider } from "~/types";
import { getStorage, StorageKey } from "../storage";

export interface ApiKeyStore {
  apiKeys: {
    [key in Provider | TTSProvider]: string;
  };
  setApiKeys: (apiKeys: Partial<ApiKeyStore["apiKeys"]>) => void;
  isLoaded: boolean;
}

const apiKeyStorage = getStorage(StorageKey.API_KEYS);

export const useApiKeyStore = create<ApiKeyStore>((set, get) => ({
  apiKeys: {
    ...apiKeyStorage.fallback,
  },
  isLoaded: false,
  setApiKeys: (newApiKeys) => {
    const { apiKeys } = get();
    const updatedApiKeys = { ...apiKeys, ...newApiKeys };
    set({ apiKeys: updatedApiKeys, isLoaded: true });
  },
}));

// Initialize immediately when the store is created
(async () => {
  const storedApiKeys = await apiKeyStorage.getValue();
  useApiKeyStore.getState().setApiKeys({
    ...storedApiKeys,
  });
})();

useApiKeyStore.subscribe(async (state) => {
  const { apiKeys } = state;
  await apiKeyStorage.setValue(apiKeys);
});
