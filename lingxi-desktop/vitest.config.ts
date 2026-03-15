import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/unit/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,js}'],
    testTimeout: 10000,
    hookTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        'src/main.ts',
        'src/**/*.d.ts',
        'src/types/**',
        'tests/**',
        'dist/**',
        'dist-electron/**',
        'node_modules/**',
        '**/*.config.*'
      ]
    },
    transformMode: {
      web: [/\.[jt]sx$/, /\.vue$/]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
