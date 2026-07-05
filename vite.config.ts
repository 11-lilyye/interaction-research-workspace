import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    watch: {
      ignored: ['**/node_modules/**', '**/node_modules.bad-delete-*/**'],
    },
  },
})
