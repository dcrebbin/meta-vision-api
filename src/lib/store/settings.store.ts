import { create } from "zustand";
import type { Provider } from "~/types";
import { getStorage, StorageKey } from "../storage";

export interface SettingsStore {
  settings: {
    imageQuality: number;
    provider: Provider;
    useTTS: boolean;
    model: {
      [key in Provider]: string;
    };
    ttsModel: string;
    systemPrompt: string;
    videoCaptureInterval: number;
    isMaiUIVisible: boolean;
    isConversationSidebarVisible: boolean;
  };
  setSettings: (settings: Partial<SettingsStore["settings"]>) => void;
}

const settingsStorage = getStorage(StorageKey.SETTINGS);

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: {
    ...settingsStorage.fallback,
    model: settingsStorage.fallback.model,
  },
  setSettings: (newSettings) => {
    const { settings } = get();
    const updatedSettings = { ...settings, ...newSettings };
    if (newSettings.model) {
      updatedSettings.model = {
        ...settings.model,
        ...newSettings.model,
      };
    }
    set({ settings: updatedSettings });
  },
}));

async function loadAndInitializeSettings() {
  const storedSettings = await settingsStorage.getValue();
  useSettingsStore.getState().setSettings({
    ...storedSettings,
    model: storedSettings.model,
    isMaiUIVisible: storedSettings.isMaiUIVisible,
    isConversationSidebarVisible: storedSettings.isConversationSidebarVisible,
  });
}

useSettingsStore.subscribe(async (state) => {
  const { settings } = state;
  const storedSettings = {
    ...settings,
    model: settings.model,
  };
  await settingsStorage.setValue(storedSettings);
});

void loadAndInitializeSettings();
