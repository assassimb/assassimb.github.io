import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// base '/' works for the root user site (assassimb.github.io).
// If this ever moves to a subpath, set base accordingly.
// Multi-page: every HTML entry must be listed here, or the build drops it.
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        cv: resolve(__dirname, 'cv/index.html'),
        computah: resolve(__dirname, 'computah/index.html'),
      },
    },
  },
})
