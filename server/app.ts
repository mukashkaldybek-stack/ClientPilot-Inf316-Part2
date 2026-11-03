import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { clientRoutes } from './routes/clients';
import { projectRoutes } from './routes/projects';
import { timerRoutes } from './routes/timers';
import { invoiceRoutes } from './routes/invoices';

export const app = new Hono();

// Middlewares
app.use('*', cors());

// Health check
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ClientPilot API',
    uptime: process.uptime(),
  });
});

// Mount Routes
app.route('/api/clients', clientRoutes);
app.route('/api/projects', projectRoutes);
app.route('/api/timers', timerRoutes);
app.route('/api/invoices', invoiceRoutes);

// 404 handler for unknown API routes
app.all('/api/*', (c) => {
  return c.json({ error: 'Endpoint not found' }, 404);
});
