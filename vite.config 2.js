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
    include: [
      '@dfinity/agent', 
      '@dfinity/candid', 
      '@dfinity/principal', 
      '@dfinity/identity',
      'crypto-js'
    ],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  build: {
    // Use esbuild for better compatibility and faster builds
    minify: 'esbuild',
    // Aggressive memory optimization for 512MB limit
    rollupOptions: {
      output: {
        // More aggressive chunk splitting
        manualChunks: (id) => {
          // Split large libraries into separate chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react';
            }
            if (id.includes('@dfinity')) {
              return 'dfinity';
            }
            if (id.includes('@heroui') || id.includes('framer-motion')) {
              return 'ui';
            }
            if (id.includes('chart.js') || id.includes('d3')) {
              return 'charts';
            }
            if (id.includes('crypto-js')) {
              return 'crypto-js';
            }
            if (id.includes('viem') || id.includes('wagmi')) {
              return 'web3';
            }
            if (id.includes('axios') || id.includes('uuid') || id.includes('sonner')) {
              return 'utils';
            }
            // Group other large node_modules
            return 'vendor';
          }
        },
        // Optimize asset handling
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
            return `assets/videos/[name]-[hash][extname]`;
          }
          if (/\.(png|jpe?g|gif|svg|webp|avif)(\?.*)?$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    // Reduce memory usage
    chunkSizeWarningLimit: 500,
    target: 'esnext',
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
  },
  // Exclude large assets from processing during build
  assetsInclude: ['**/*.mp4', '**/*.gif'],
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
