import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    // split vendor code so it caches better
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'socket-vendor': ['socket.io-client'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    hmr: {
      overlay: true,
    },
  },
})
