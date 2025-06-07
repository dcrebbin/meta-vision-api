import { providerToModels, toolTips } from "@/lib/constants";
import { useSettingsStore } from "@/lib/store/settings.store";
import { SettingHeader } from "./setting-header";

export function ChatModelSettings({ darkMode }: { darkMode: boolean }) {
  const { settings, setSettings } = useSettingsStore();

  return (
    <div className="w-auto flex flex-col gap-2 items-start">
      <SettingHeader
        title="Model"
        tooltipText={toolTips.chatModel}
        darkMode={darkMode}
      />

      <select
        className="cursor-pointer rounded-md h-auto p-2 bg-gray-800 drop-shadow-md text-white font-sans"
        value={settings.model[settings.provider] ?? "gpt-4o-mini"}
        onChange={(e) => {
          setSettings({
            ...settings,
            model: {
              ...settings.model,
              [settings.provider]: e.target.value,
            },
          });
        }}
      >
        {providerToModels[
          settings.provider as keyof typeof providerToModels
        ].map((model) => (
          <option key={model.value} value={model.value}>
            {model.title}
          </option>
        ))}
      </select>
    </div>
  );
}
