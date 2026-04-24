import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const tracker =
    env.TRACKER_API_URL ??
    'http://t122yraee5v724x7tonr3d6g.204.168.192.245.sslip.io'
  const trackerKey = env.TRACKER_API_KEY ?? ''

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api/news': {
          target: tracker,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/news/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (trackerKey) proxyReq.setHeader('X-API-Key', trackerKey)
            })
          },
        },
      },
    },
  }
})
