import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";
import { type WxtViteConfig, defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "__MSG_extensionName__",
    description: "__MSG_extensionDescription__",
    default_locale: "en",
    permissions: ["storage", "sidePanel", "scripting"],
    host_permissions: ["<all_urls>"],
  },
  srcDir: "src",
  entrypointsDir: "app",
  outDir: "build",
  modules: ["@wxt-dev/module-react", "@wxt-dev/auto-icons"],
  imports: false,
  webExt: {
    binaries: {
      brave:
        process.platform === "win32"
          ? "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
          : "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    },
  },
  autoIcons: {
    grayscaleOnDevelopment: false,
  },
  vite: () =>
    ({
      plugins: [svgr(), tailwindcss()],
      server: {
        hmr: true,
      },
      build: {
        sourcemap: process.env.NODE_ENV === "development",
      },
    } as WxtViteConfig),
});
