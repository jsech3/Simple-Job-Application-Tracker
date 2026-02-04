/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync } from 'fs'

const isExtensionBuild = process.env.BUILD_TARGET === 'extension'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Only copy extension files for extension builds
    ...(isExtensionBuild ? [{
      name: 'copy-manifest',
      closeBundle() {
        // Copy manifest and icons to dist
        const distDir = resolve(__dirname, 'dist')
        mkdirSync(resolve(distDir, 'icons'), { recursive: true })
        copyFileSync(
          resolve(__dirname, 'public/manifest.json'),
          resolve(distDir, 'manifest.json')
        )
        copyFileSync(
          resolve(__dirname, 'public/icons/icon-16.png'),
          resolve(distDir, 'icons/icon-16.png')
        )
        copyFileSync(
          resolve(__dirname, 'public/icons/icon-48.png'),
          resolve(distDir, 'icons/icon-48.png')
        )
        copyFileSync(
          resolve(__dirname, 'public/icons/icon-128.png'),
          resolve(distDir, 'icons/icon-128.png')
        )
      }
    }] : [])
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  build: isExtensionBuild ? {
    // Chrome extension build configuration
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'sidepanel.html'),
        options: resolve(__dirname, 'options.html'),
        background: resolve(__dirname, 'src/extension/background.ts'),
        'content-script': resolve(__dirname, 'src/extension/content-script.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Background and content scripts should be in root
          if (chunkInfo.name === 'background' || chunkInfo.name === 'content-script') {
            return '[name].js'
          }
          return 'assets/[name]-[hash].js'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  } : {
    // Web app build configuration (default)
    outDir: 'dist',
    emptyOutDir: true,
  },
})
