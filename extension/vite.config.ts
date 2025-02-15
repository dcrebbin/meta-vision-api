import { resolve } from "path";
import { defineConfig } from "vite";
import webExtension from "@samrum/vite-plugin-web-extension";
import manifest from "./manifest.json";
import { WebExtensionManifest } from "@samrum/rollup-plugin-web-extension";

const root = resolve(__dirname, "src");
const pagesDir = resolve(root, "pages");
const publicDir = resolve(__dirname, "public");

const isDev = process.env.__DEV__ === "true";

const getOutDir = (version: string) => resolve(__dirname, `dist/${version}`);

const baseConfig = {
  resolve: {
    alias: {
      "@src": root,
      "@pages": pagesDir,
    },
  },
  publicDir,
  build: {
    sourcemap: isDev,
    emptyOutDir: !isDev,
    rollupOptions: {
      input: {
        contentScript: resolve(pagesDir, "content/index.ts"),
      },
      output: {
        entryFileNames: "dist/[name].js",
        chunkFileNames: "dist/[name].[hash].js",
        assetFileNames: "dist/[name].[hash][extname]",
      },
    },
  },
};

const v3Config = defineConfig({
  ...baseConfig,
  plugins: [
    webExtension({
      manifest: manifest as unknown as WebExtensionManifest,
    }),
  ],
  build: {
    ...baseConfig.build,
    outDir: getOutDir("v3"),
  },
});

export default v3Config;
