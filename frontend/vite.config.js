import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
  server: {
    port: 3000,
    open: true,
    // Configurar cabeçalhos de resposta
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY', // Preferir CSP frame-ancestors
      'X-XSS-Protection': '0', // Desabilitar XSS Protection
    }
  },
  resolve: {
    alias: {
      '@': '/src',
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  },
})