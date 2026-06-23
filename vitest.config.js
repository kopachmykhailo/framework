import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./test/setup.js'],
    include: ['test/**/*.test.js'],
    hookTimeout: 30000,
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**'],
      exclude: [
        'src/server.js',
        'src/app.js',
        'src/constants/**',
        'src/plugins/index.js',
        'src/routes/**'
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70
      }
    }
  }
});
