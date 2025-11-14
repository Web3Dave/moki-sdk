import { join } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/_esm/**',
        '**/_types/**',
        '**/dist/**',
        '**/*.test.ts',
        '**/node_modules/**',
      ],
    },
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/_esm/**', '**/_types/**', '**/dist/**'],
    root: join(__dirname, 'packages/core'),
    testTimeout: 10_000,
  },
})
