import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { clientRoutes } from './routes/clients';
import { projectRoutes } from './routes/projects';
import { timerRoutes } from './routes/timers';
import { invoiceRoutes } from './routes/invoices';
import { initTelemetry, withSpan, logTelemetry } from './telemetry';
import {
  getPrometheusMetrics,
  getPrometheusContentType,
  recordHttpRequestMetric,
  recordPdfGenerationTime,
} from './metrics';
import { triageAlert } from './oncall';

// Initialize OpenTelemetry
initTelemetry();

export const app = new Hono();

// Global Error Handler
app.onError((err, c) => {
  console.error('⚠️ Server error captured gracefully:', err);
  return c.json({
    error: err.message || 'Internal Server Error',
    status: 500,
  }, 500);
});

// Middlewares
app.use('*', cors());

// Observability: HTTP Request Latency & Status Tracking Middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const durationSec = (Date.now() - start) / 1000;
  const path = c.req.path;
  recordHttpRequestMetric(c.req.method, path, c.res.status, durationSec);
});

// Health check
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ClientPilot API',
    uptime: process.uptime(),
    telemetry: 'enabled',
  });
});

// Prometheus Metrics Scrape Endpoint (#28, #29)
app.get('/metrics', async (c) => {
  const metrics = await getPrometheusMetrics();
  c.header('Content-Type', getPrometheusContentType());
  return c.body(metrics);
});

// AI On-Call Webhook Receiver (#30, #31)
app.post('/api/alerts/webhook', async (c) => {
  let payload: any = {};
  try {
    payload = await c.req.json();
  } catch {
    payload = { title: 'GenericAlert', message: 'Unparsed webhook payload' };
  }

  logTelemetry('warn', '🚨 Alert received on webhook', { payload });
  const triageResult = await triageAlert(payload);
  return c.json({
    status: 'incident_triaged',
    triage: triageResult,
  }, 200);
});

// Synthetic Alert Simulation Endpoint for E2E testing (#30, #31)
app.post('/api/alerts/simulate', async (c) => {
  let body: any = {};
  try {
    body = await c.req.json();
  } catch {}

  const alertname = body.alertname || 'HighErrorRate';
  const severity = body.severity || 'critical';
  const summary = body.summary || 'Simulated synthetic threshold breach';

  // Record an artificial error metric spike to reflect on metrics/dashboard
  recordPdfGenerationTime(1.8, false, 'SimulatedRendererCrash');

  const simulatedPayload = {
    title: alertname,
    message: summary,
    alerts: [
      {
        status: 'firing',
        labels: { alertname, severity, service: 'clientpilot-backend' },
        annotations: { summary, description: 'Test synthetic event fired for AI on-call verification' },
      },
    ],
  };

  const result = await triageAlert(simulatedPayload);
  return c.json({
    status: 'simulation_complete',
    result,
  }, 200);
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
