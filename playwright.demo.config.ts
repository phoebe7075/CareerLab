import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 5176);
const host = process.env.PLAYWRIGHT_HOST ?? "127.0.0.1";
const channel = process.env.PLAYWRIGHT_CHANNEL ?? "chrome";

export default defineConfig({
  testDir: "./tests/demo",
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  projects: [
    {
      name: "demo-desktop",
      use: { viewport: { height: 900, width: 1440 } }
    },
    {
      name: "demo-mobile",
      use: { isMobile: true, viewport: { height: 844, width: 390 } }
    }
  ],
  use: {
    baseURL: `http://${host}:${port}`,
    channel,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off"
  },
  webServer: {
    command: `npm run dev:demo -- --host ${host} --port ${port} --strictPort`,
    reuseExistingServer: false,
    timeout: 30_000,
    url: `http://${host}:${port}`
  }
});
