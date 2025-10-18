import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import ElementPlus from 'unplugin-element-plus/vite'

const chunkDirs = ['activities', 'components', 'views']

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // vueDevTools(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    ElementPlus({}),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        agreement: fileURLToPath(new URL('./agreement.html', import.meta.url)),
      },
      output: {
        manualChunks(id) {
          /*if (id.includes('node_modules')) {
            if (id.includes('element-plus')) {
              return 'element-plus'
            }
            return 'vendor'
          }

          if (id.includes('components')) return 'components';
          if (id.includes('config')) return 'config';
          if (id.endsWith("agreement.ts")) return 'e.agreement';

          const chunkRegex = new RegExp(`/(${chunkDirs.join('|')})/(.+?)\\.vue$`)
          const match = id.match(chunkRegex)
          if (match) {
            return `${match[1]}-${match[2]}`
          }

          const pathParts = id.split('/')
          if (pathParts.length > 2) {
            const container_dir = pathParts[pathParts.length - 2]
            if (container_dir === 'src') return 'app';
          }

          if ((id.includes('vue') && !id.endsWith('.vue')) || id.includes('vite')) {
            return 'app'
          }*/
          // 教训：没事不要手动分chunk。。。
        },
      },
    },
  },
})
