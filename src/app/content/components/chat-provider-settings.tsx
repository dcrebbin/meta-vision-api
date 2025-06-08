import {
  aiChatProviders,
  providerInformation,
  toolTips,
} from "@/lib/constants";
import { useSettingsStore } from "@/lib/store/settings.store";
import { Provider } from "@/types";
import { Globe } from "lucide-react";
import { SettingHeader } from "./setting-header";

export function ChatProviderSettings({ darkMode }: { darkMode: boolean }) {
  const { settings, setSettings } = useSettingsStore();

  return (
    <div className="w-auto flex flex-col gap-2 items-start rounded-md">
      <div className="flex flex-row gap-2 items-center">
        <SettingHeader
          title="Provider"
          tooltipText={toolTips.chatProvider}
          darkMode={darkMode}
        />
        <a
          href={
            providerInformation[
              settings.provider as keyof typeof providerInformation
            ].url
          }
          target="_blank"
        >
          <Globe className="w-4 h-4 text-white" />
        </a>
      </div>
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
            {
              providerInformation[provider as keyof typeof providerInformation]
                .title
            }
          </option>
        ))}
      </select>
    </div>
  );
}
