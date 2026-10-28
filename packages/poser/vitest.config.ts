import { defineConfig } from 'vitest/config';
import * as path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/**/*.ts'],
    },
  },
  resolve: {
    alias: {
      'atp-geometry': path.resolve(__dirname, '../geometry/src/index.ts'),
    },
  },
});
