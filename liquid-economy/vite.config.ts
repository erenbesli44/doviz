import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load all env vars (including non-VITE_ ones) for server-side use only.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        // Mirror the nginx BFF proxy for local dev.
        // FINANCE_API_UPSTREAM and FINANCE_API_KEY come from .env.local (never
        // exposed to the browser — they're only read here in Node.js).
        '/api': {
          target: env.FINANCE_API_UPSTREAM ?? 'http://localhost:8000',
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('X-API-Key', env.FINANCE_API_KEY ?? '')
            })
          },
        },
      },
    },
  }
})
