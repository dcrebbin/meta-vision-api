"use client";

import { Moon, Sun } from "lucide-react";
import { memo } from "react";
import { browser } from "wxt/browser";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { StorageKey, useStorage } from "~/lib/storage";
import { cn } from "~/lib/utils";
import { Theme } from "~/types";

type ThemeSwitchProps = {
  readonly className?: string;
};

export const ThemeSwitch = memo<ThemeSwitchProps>(({ className }) => {
  const { set: setTheme } = useStorage(StorageKey.THEME);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn("rounded-full", className)}
        >
          <Sun className="size-5 scale-100 dark:scale-0" />
          <Moon className="absolute size-5 scale-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.values(Theme).map((theme) => (
          <DropdownMenuItem key={theme} onClick={() => setTheme(theme)}>
            {browser.i18n.getMessage(theme)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

ThemeSwitch.displayName = "ThemeSwitch";
