import { create } from "zustand";

interface SettingsStore {
  settings: {
    isFullScreen: boolean;
    imageQuality: number;
    widthCropping: number;
    verticalCropping: number;
    responseType: "chat" | "tts";
  };
  setSettings: (settings: SettingsStore["settings"]) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: {
    isFullScreen: false,
    imageQuality: 0.5,
    widthCropping: 300,
    verticalCropping: 100,
    responseType: "chat",
  },
  setSettings: (settings) => set({ settings }),
}));
