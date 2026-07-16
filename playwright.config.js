import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectDirectory = path.dirname(fileURLToPath(import.meta.url))
const backendDirectory = path.resolve(projectDirectory, '../affordable-tutor-student-matching-backend')
const backendPython = path.join(backendDirectory, 'venv', 'Scripts', 'python.exe')

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: {
    timeout: 12_000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: `"${backendPython}" manage.py migrate --noinput && "${backendPython}" manage.py seed_demo_data && "${backendPython}" manage.py runserver 127.0.0.1:8001 --noreload`,
      cwd: backendDirectory,
      env: {
        ...process.env,
        SECRET_KEY: process.env.SECRET_KEY || 'isomo-e2e-secret-key-longer-than-thirty-two-characters',
        THROTTLE_AUTH_LOGIN_RATE: '1000/hour',
        CORS_ALLOWED_ORIGINS: 'http://127.0.0.1:5174',
        CSRF_TRUSTED_ORIGINS: 'http://127.0.0.1:5174',
      },
      url: 'http://127.0.0.1:8001/api/health/',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'npm.cmd run dev -- --host 127.0.0.1 --port 5174',
      cwd: projectDirectory,
      env: {
        ...process.env,
        VITE_API_BASE_URL: 'http://127.0.0.1:8001/api',
        VITE_WS_BASE_URL: 'ws://127.0.0.1:8001',
      },
      url: 'http://127.0.0.1:5174',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
    },
  ],
})
