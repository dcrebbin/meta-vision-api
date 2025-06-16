import { SYSTEM_PROMPTS } from "@/lib/prompts";
import { useSettingsStore } from "@/lib/store/settings.store";
import { toolTips } from "@/lib/constants";
import { SettingHeader } from "./setting-header";

interface SystemPromptSettingsProps {
  darkMode?: boolean;
}

export function SystemPromptSettings({ darkMode = false }: SystemPromptSettingsProps) {
  const { settings, setSettings } = useSettingsStore();

  return (
    <div className="w-auto flex flex-col gap-2 items-start">
      <SettingHeader
        title="Personality"
        tooltipText="Choose the AI's personality and communication style"
        darkMode={darkMode}
      />
      <select
        className={`cursor-pointer rounded-md p-2 h-fit drop-shadow-md font-sans ${
          darkMode
            ? "bg-gray-800 text-white"
            : "bg-white text-black border border-gray-300"
        }`}
        value={settings.systemPrompt ?? "default"}
        onChange={(e) => {
          setSettings({
            ...settings,
            systemPrompt: e.target.value,
          });
        }}
      >
        {SYSTEM_PROMPTS.map((prompt) => (
          <option key={prompt.id} value={prompt.id} title={prompt.description}>
            {prompt.name}
          </option>
        ))}
      </select>
    </div>
  );
}