import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5555,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:12345',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src/ui',
    },
  },
});
