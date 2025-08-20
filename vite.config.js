import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  optimizeDeps: {
    include: ['@dfinity/agent', '@dfinity/candid', '@dfinity/principal', '@dfinity/identity']
  },
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT || 4173,
    allowedHosts: [
      'oliviaaiweb3-1.onrender.com',
      '.onrender.com', // Allow all render.com subdomains
      'localhost',
      '127.0.0.1'
    ]
  },
  server: {
    host: '0.0.0.0',
    port: process.env.PORT || 3000,
    proxy: {
      '/lurky': {
        target: 'https://api.lurky.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/lurky/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // SECURITY: API key moved to microservice - this proxy is now disabled
            // All Lurky requests should go through the secure microservice
            console.warn('⚠️ Direct Lurky proxy is disabled. Use microservice endpoints instead.');
          });
        }
      }
    }
  }
})
