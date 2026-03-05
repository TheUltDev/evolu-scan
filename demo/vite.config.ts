import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  build: {
    minify: false,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
  optimizeDeps: {
    exclude: ['@evolu/sqlite-wasm', '@evolu/react-web'],
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
});
