import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  optimizeDeps: {
    exclude: ['@evolu/sqlite-wasm', '@evolu/react-web'],
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
});
