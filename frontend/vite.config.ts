import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, '.', '')
  const configured = environment.VITE_API_BASE_URL?.trim()
  if (mode === 'production' && environment.VITE_AUTH_REQUIRED === 'false') {
    throw new Error('Production requires VITE_AUTH_REQUIRED=true.')
  }
  if (mode === 'production' && configured) {
    const url = new URL(configured)
    if (url.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].indexOf(url.hostname) >= 0) {
      throw new Error('Production VITE_API_BASE_URL must be HTTPS and cannot use localhost. Leave it unset for same-origin Vercel routing.')
    }
  }
  return {
  plugins: [react()],
  server: { port: 5173 },
  resolve: { alias: { '@': '/src' } },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          motion: ['framer-motion'],
        },
      },
    },
  },
  }
})
