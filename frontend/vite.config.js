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
    },
    // Middleware para ajustar Content-Type e charset
    configureServer: (server) => {
      server.middlewares.use((req, res, next) => {
        // Adicionar charset=utf-8 para todos os Content-Types de texto
        if (res.getHeader('Content-Type') && res.getHeader('Content-Type').startsWith('text/')) {
          res.setHeader('Content-Type', res.getHeader('Content-Type').split(';')[0] + '; charset=utf-8');
        }
        // Ajustar Content-Type para JSX
        if (req.url.endsWith('.jsx')) {
          res.setHeader('Content-Type', 'text/jsx; charset=utf-8');
        }
        next();
      });
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})