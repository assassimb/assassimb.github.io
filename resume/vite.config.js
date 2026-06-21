import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base '/' works for the root user site (assassimb.github.io).
// If this ever moves to a subpath, set base accordingly.
export default defineConfig({
  plugins: [react()],
  base: '/',
})
