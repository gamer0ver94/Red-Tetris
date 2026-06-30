import { defineConfig } from 'vitest/config'

import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const clientRoot = fileURLToPath(new URL('./', import.meta.url))

export default defineConfig({
  root: clientRoot,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  plugins: [
    react(),
  ],
  test: {
    globals: true,
    setupFiles: "./tests/setup.tsx",
    environment: "jsdom",
    include: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    coverage: {
      provider: "v8",
      all: true,
      reporter: ["text", "html"],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["src/**/*.css", "src/**/*.png", "src/**/*.svg", "src/**/*.test.ts", "src/**/*.test.tsx"],
      branches: 50,
      statements: 80,
      functions: 80,
      lines: 80,
    },
  },

})

