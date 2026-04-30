import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    exclude: [
      'src/utils/ratesPdfImportCore.test.js',
      'node_modules/**',
      'dist/**',
    ],
  },
});
