import { defineConfig } from 'vite';
import path from 'path'; // Node.js path module
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'), // Example: '@' maps to '/src'
    },
  },
  server: {
    host: '0.0.0.0', // Listen on all interfaces
    port: 5173,      // Match your Docker port
    hmr: {
      host: 'localhost', // HMR connects back to localhost from the browser
      port: 5173,       // Match the exposed port
      protocol: 'ws'
    },
    watch: {
      usePolling: true,
      interval: 500
    }
  },
});