import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  
  // ADICIONE ESTA SEÇÃO PARA O PROXY
  server: {
    proxy: {
      // Qualquer request começando com /api será redirecionado
      '/api': {
        target: 'http://localhost:5000', // O seu backend Flask
        changeOrigin: true, // Necessário para o proxy funcionar
        rewrite: (path) => path.replace(/^\/api/, '') // Remove /api antes de enviar ao backend
      }
    }
  }
})