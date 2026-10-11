/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  // 相對路徑，讓建置結果可直接部署於任何子目錄（PRD §9）
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    css: { include: /(?:constellation-tokens|scorpius|course-atlas)\.css/ },
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
