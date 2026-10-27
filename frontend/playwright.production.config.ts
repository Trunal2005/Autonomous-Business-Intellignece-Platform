import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './deployment-e2e',
  timeout: 60000,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5190',
    ...devices['Desktop Chrome'],
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {},
  },
  webServer: {
    command: 'python tests/production_ui_server.py',
    cwd: '../backend',
    url: 'http://127.0.0.1:5190/health',
    reuseExistingServer: false,
  },
})
