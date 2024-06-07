import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  host: true,
  server: {
    cors: false,
    port: 8000
  },
  preview: {
    cors: false,
    port: 8000
  } 
})
