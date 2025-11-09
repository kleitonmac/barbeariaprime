import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin para ignorar pasta api (serverless functions)
const ignoreApiPlugin = () => {
  return {
    name: 'ignore-api',
    resolveId(id: string) {
      // Ignorar qualquer import que tente acessar arquivos da pasta api
      if (id.includes('/api/') || id.includes('\\api\\') || id.startsWith('../api/') || id.startsWith('./api/')) {
        return { id, external: true }
      }
      return null
    },
    load(id: string) {
      // Não carregar arquivos da pasta api
      if (id.includes('/api/') || id.includes('\\api\\')) {
        return 'export default {}'
      }
      return null
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), ignoreApiPlugin()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      external: (id) => {
        // Ignorar arquivos da pasta api e models durante o build
        return id.includes('/api/') || id.includes('\\api\\') || 
               id.includes('/models/') || id.includes('\\models\\')
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  // Importante para SPA no Vercel
  base: '/',
  // Ignorar pasta api durante análise de dependências
  optimizeDeps: {
    exclude: ['api', 'models']
  },
  publicDir: 'public'
})