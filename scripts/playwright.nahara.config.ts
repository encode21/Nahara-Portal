import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "nahara-preview.spec.ts",
  timeout: 120000,
  outputDir: "/private/tmp/nahara-playwright-results",
  use: {
    actionTimeout: 10000,
    screenshot: "only-on-failure",
    viewport: { width: 1200, height: 1000 },
    hasTouch: true,
    launchOptions: {
      executablePath: process.env.NAHARA_TEST_BROWSER || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    },
  },
});
