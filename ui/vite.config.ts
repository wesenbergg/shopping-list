import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'
import { fileURLToPath } from 'url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Get the current directory using import.meta
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  // Load env file based on `mode` in the root directory
  loadEnv(mode, path.resolve(__dirname, '..'), '')

  return {
    plugins: [react()],
    build: {
      outDir: '../dist/ui',
    }
  }
})
