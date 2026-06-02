import { defineConfig } from 'vitest/config'

import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
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
    babel({ presets: [reactCompilerPreset()] }),
  ],
  test: {
    globals: true,
    setupFiles: "./tests/setup.tsx",
    environment: "jsdom",
    include: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],

  },

})

