import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const isDemoMode = mode === "demo" || mode === "demo-pages";
  const seedRuntimeModule =
    isDemoMode
      ? "./src/data/seed/runtimeDemo.ts"
      : "./src/data/seed/runtimeDefault.ts";
  const base =
    process.env.VITE_BASE_PATH ?? (mode === "demo-pages" ? "/CareerLab/" : "/");

  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "#career-lab-seed-data": fileURLToPath(
          new URL(seedRuntimeModule, import.meta.url)
        )
      }
    },
    test: {
      css: true,
      environment: "jsdom",
      exclude: ["tests/e2e/**", "tests/demo/**", "node_modules/**", "dist/**"],
      globals: true,
      setupFiles: "./src/test/setup.ts"
    }
  };
});
