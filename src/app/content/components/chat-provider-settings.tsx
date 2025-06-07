import { aiChatProviders, providerToTitle, toolTips } from "@/lib/constants";
import { useSettingsStore } from "@/lib/store/settings.store";
import { Provider } from "@/types";
import { SettingHeader } from "./setting-header";

export function ChatProviderSettings({ darkMode }: { darkMode: boolean }) {
  const { settings, setSettings } = useSettingsStore();

  return (
    <div className="w-auto flex flex-col gap-2 items-start rounded-md">
      <SettingHeader
        title="Provider"
        tooltipText={toolTips.chatProvider}
        darkMode={darkMode}
      />
      <select
        className="cursor-pointer rounded-md h-fit p-2 bg-gray-800 drop-shadow-md text-white font-sans"
        value={settings.provider ?? "openai"}
        onChange={(e) => {
          setSettings({
            ...settings,
            provider: e.target.value as Provider,
          });
        }}
      >
        {aiChatProviders.map((provider) => (
          <option key={provider} value={provider}>
            {providerToTitle[provider as keyof typeof providerToTitle]}
          </option>
        ))}
      </select>
    </div>
  );
}
