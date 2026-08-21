import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Change '/tcm-clamp-management/' to match your exact GitHub repo name
export default defineConfig({
  plugins: [react()],
  base: '/tcm-clamp-management/',
})
