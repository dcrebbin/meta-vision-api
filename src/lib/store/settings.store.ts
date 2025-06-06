import { create } from "zustand";

interface SettingsStore {
  settings: {
    isFullScreen: boolean;
    imageQuality: number;
    widthCropping: number;
    verticalCropping: number;
    provider: "openai" | "anthropic" | "perplexity" | "google";
    useTTS: boolean;
    model: Map<string, string>;
    ttsModel: string;
    videoCaptureInterval: number;
  };
  setSettings: (settings: SettingsStore["settings"]) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: {
    isFullScreen: false,
    imageQuality: 0.5,
    widthCropping: 300,
    verticalCropping: 100,
    provider: "openai",
    useTTS: false,
    model: new Map([
      ["openai", "gpt-4o-mini"],
      ["anthropic", "claude-3-5-sonnet-20240620"],
      ["perplexity", "sonar-pro"],
      ["google", "gemini-2.0-flash"],
    ]),
    ttsModel: "tts-1",
    videoCaptureInterval: 1000,
  },
  setSettings: (settings) => set({ settings }),
}));
