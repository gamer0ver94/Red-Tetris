import { defineConfig } from 'vitest/config';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const clientRoot = fileURLToPath(new URL('./', import.meta.url))

export default defineConfig({
  root: clientRoot,
  publicDir:false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    rolldownOptions: {
      output: {
        entryFileNames: 'bundle.js',
        chunkFileNames: 'bundle.js',
        assetFileNames: '[name][extname]',
        codeSplitting: false,
      },
    },
  },
  plugins: [
    react(),
    cssInjectedByJsPlugin(),
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
      reportOnFailure: true,
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["src/**/*.css", "src/**/*.png", "src/**/*.svg", "src/**/*.test.ts", "src/**/*.test.tsx"],
      thresholds: {
        perFile: true,
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 50,
      },
    },
  },

})
