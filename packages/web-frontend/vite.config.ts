import { defineConfig } from 'vite';
import path from 'path'; // Node.js path module
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      host: 'localhost',
      port: 5173,
      protocol: 'ws'
    },
    watch: {
      usePolling: true,
      interval: 500
    }
  },
});