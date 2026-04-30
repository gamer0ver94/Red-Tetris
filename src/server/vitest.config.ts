import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', 'docs/**', 'coverage/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportOnFailure: true,
      exclude: ['node_modules/**', 'docs/**', 'coverage/**', 'dist/**'],
      thresholds: {
        perFile: true,
        lines: 70,
        statements: 70,
        functions: 70,
        branches: 50,
      },
    },
  },
});

