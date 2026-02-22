import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/seasons-study-app/hospital/',
  plugins: [react()],
})
