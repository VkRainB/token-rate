import { defineConfig } from 'vite';
import Vue from '@vitejs/plugin-vue';
import Pages from 'vite-plugin-pages';
import Modules from 'vite-plugin-use-modules';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';

import { resolve } from 'path';
import path from 'node:path';
import tailwind from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const outDir = resolve(__dirname, 'dist');

export default defineConfig({
  base: './',
  server: {
    port: 3001
  },
  css: {
    postcss: {
      plugins: [tailwind(), autoprefixer()]
    }
  },
  plugins: [
    Vue(),
    Pages({
      dirs: 'src/views',
      exclude: ['**/components/**'],
      extendRoute(route) {
        return {
          ...route
        };
      }
    }),
    Components({
      dts: 'src/types/components.d.ts'
    }),
    Modules({
      auto: true
    }),
    AutoImport({
      dts: 'src/types/auto-imports.d.ts',
      imports: ['vue', 'vue-router']
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: outDir
  }
});
