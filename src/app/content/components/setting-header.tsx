import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

export function SettingHeader({
  title,
  tooltipText,
  darkMode = false,
}: {
  title: string;
  tooltipText: string;
  darkMode?: boolean;
}) {
  const settingHeaderTooltip = (
    tooltipText: string,
    darkMode: boolean = false
  ) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Info
            className={`w-4 h-4 cursor-pointer ${
              darkMode ? "text-white" : "text-black"
            }`}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="flex flex-row gap-2 items-center justify-between w-fit">
      <p
        className={`text-sm font-bold font-sans flex flex-row gap-2 items-center ${
          darkMode ? "text-white" : "text-black"
        }`}
      >
        {title}
      </p>
      {settingHeaderTooltip(tooltipText, darkMode)}
    </div>
  );
}
