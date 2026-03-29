import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist/frontend',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'system.html'),
        driver: resolve(__dirname, 'driver.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    open: '/system.html',
    proxy: {
      // Proxy /api to local backend during development
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
});
