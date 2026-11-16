import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
// QC-SITE-001 m-9: the inspect plugin adds code-path attributes (source file
// and line) to the DOM, so it runs in the dev server only, never in builds.
export default defineConfig(({ command }) => ({
  base: '/',
  plugins: command === 'serve' ? [inspectAttr(), react()] : [react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // package "module" field points at unpublished src/; force the dist bundle
      "circular-natal-horoscope-js": path.resolve(
        __dirname,
        "./node_modules/circular-natal-horoscope-js/dist/index.js"
      ),
    },
  },
}));
