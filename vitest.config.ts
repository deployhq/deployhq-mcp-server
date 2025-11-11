import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '*.config.*',
        'src/index.ts', // Hosted server entry (optional)
        'src/stdio.ts', // stdio entry (integration tested separately)
      ],
    },
  },
});
