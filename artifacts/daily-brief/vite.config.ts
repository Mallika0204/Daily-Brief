import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  build: { outDir: 'dist/public', emptyOutDir: true },
  server: {
    port: Number(process.env.PORT) || 5173,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
