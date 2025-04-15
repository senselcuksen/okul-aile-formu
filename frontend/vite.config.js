import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // API istekleri için proxy ayarı
    proxy: {
      // /api ile başlayan istekleri yönlendir
      '/api': {
        target: 'http://localhost:8000', // Django backend adresimiz
        changeOrigin: true, // Origin header'ını değiştir (CORS için gerekli)
        // secure: false, // HTTPS backend için gerekebilir
      }
    }
  }
})
