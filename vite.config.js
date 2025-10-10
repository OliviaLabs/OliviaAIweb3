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
  }
})
