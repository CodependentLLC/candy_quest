import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./test/e2e",
  timeout: 15_000,
  use: {baseURL:"http://127.0.0.1:3000", trace:"retain-on-failure"},
  reporter: "list",
  webServer: {
    command: "node server.js",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    timeout: 10_000
  },
  projects: [
    {name:"desktop", use:{...devices["Desktop Chrome"]}},
    {name:"mobile", use:{...devices["Pixel 5"]}}
  ]
});
