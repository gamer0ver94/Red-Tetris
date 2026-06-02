import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportOnFailure: true,
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
