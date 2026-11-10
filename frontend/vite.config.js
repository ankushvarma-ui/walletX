import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    build: {
      // Raise the warning threshold to suppress the Three.js vendor chunk advisory
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Split Three.js and animejs into separate vendor chunks so the main
          // bundle stays lightweight; browsers cache these separately.
          manualChunks(id) {
            if (id.includes('node_modules/three')) {
              return 'vendor-three';
            }
            if (id.includes('node_modules/animejs') || id.includes('node_modules/anime')) {
              return 'vendor-animejs';
            }
            if (id.includes('node_modules/axios')) {
              return 'vendor-axios';
            }
            if (
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router')
            ) {
              return 'vendor-react';
            }
          },
        },
      },
    },
  }
})
