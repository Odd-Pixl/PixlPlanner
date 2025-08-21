import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // load .env files to expose VITE_* variables
  loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue()],
    // Use relative base so assets work under GitHub Pages subpaths
    base: './',
  }
})
