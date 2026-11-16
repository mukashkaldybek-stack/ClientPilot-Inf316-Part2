import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sirv from 'sirv';
import { getRequestListener } from '@hono/node-server';
import { app } from './app';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const cwdOut = path.resolve(process.cwd(), 'out');
const outDir = fs.existsSync(cwdOut) ? cwdOut : path.resolve(__dirname, '../../out');

const staticServe = sirv(outDir, {
  single: true, // SPA fallback to index.html
  dev: process.env.NODE_ENV !== 'production',
  etag: true,
});

const apiListener = getRequestListener(app.fetch);

const server = http.createServer((req, res) => {
  if (req.url?.startsWith('/api')) {
    apiListener(req, res);
  } else {
    staticServe(req, res, () => {
      // If not handled by static files, route through API or 404
      apiListener(req, res);
    });
  }
});

process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught exception captured (server remaining online):', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled promise rejection captured (server remaining online):', reason);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ClientPilot Unified Server running on http://0.0.0.0:${PORT}`);
  console.log(`📁 Serving static export from: ${outDir}`);
  console.log(`⚡ API endpoints available at http://0.0.0.0:${PORT}/api/*`);
});

export { server };

