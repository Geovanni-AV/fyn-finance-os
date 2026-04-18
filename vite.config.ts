import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: { 
          build: { 
            outDir: 'dist-electron', 
            sourcemap: true,
            rollupOptions: {
              external: ['better-sqlite3', 'pdf-parse']
            }
          } 
        }
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) { options.reload() },
        vite: { 
          build: { 
            outDir: 'dist-electron', 
            sourcemap: true,
            rollupOptions: {
              output: {
                format: 'cjs'
              }
            }
          } 
        }
      }
    ]),
    renderer(),
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})
