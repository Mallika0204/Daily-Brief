import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

function newsApi() {
  return {
    name: 'daily-brief-news-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (new URL(req.url || '/', 'http://localhost').pathname !== '/api/news') {
          return next();
        }
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.setHeader('Allow', 'GET');
          res.end();
          return;
        }
        try {
          const { loadNews } = await import('./server/news.mjs');
          const result = await loadNews();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify(result));
        } catch (error) {
          server.config.logger.error('Unable to load RSS feeds', { error });
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'News feeds are temporarily unavailable.' }));
        }
      });
    },
  };
}

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react(), newsApi()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  build: { outDir: 'dist/public', emptyOutDir: true },
  server: {
    port: Number(process.env.PORT) || 5173,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
