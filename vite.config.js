import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: './frontend',
  server: {
    port: 3001,
    host: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Content-Security-Policy': "connect-src 'self' https: wss: ws: http://localhost:*"
    },
    fs: {
      // Allow importing files from the WEB2 dash directory outside the Vite root
      allow: [
        '..',
        path.resolve(__dirname, 'WEB2 dash')
      ]
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'dayjs'
    ]
  },
  build: {
    outDir: '../dist',
    sourcemap: false
  },
  define: {
    global: 'globalThis'
  },
  resolve: {
    alias: {
      // Alias to the WEB2 dash source directory
      '@dash': path.resolve(__dirname, 'WEB2 dash/src'),
      // Alias to frontend assets for shared use across both apps
      '@frontAssets': path.resolve(__dirname, 'frontend/src/assets')
    }
  }
})
