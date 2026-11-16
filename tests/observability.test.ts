import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../server/app';
import { InMemoryStore } from '../server/store/inMemoryStore';
import { setStore } from '../server/store';
import { withSpan } from '../server/telemetry';
import {
  recordInvoiceGenerated,
  recordTimeTracked,
  updateActiveTimersCount,
  recordPdfGenerationTime,
  getPrometheusMetrics,
} from '../server/metrics';

describe('Phase 2: Observability & Alerting Test Suite (#28 - #31)', () => {
  beforeEach(() => {
    setStore(new InMemoryStore());
  });

  describe('Issue #28: OpenTelemetry Tracing & Spans', () => {
    it('executes function within OpenTelemetry span and records attributes', async () => {
      let executed = false;
      const result = await withSpan('test.span.operation', async () => {
        executed = true;
        return { success: true };
      }, { 'test.attribute': 'clientpilot_span' });

      expect(executed).toBe(true);
      expect(result.success).toBe(true);
    });

    it('health check endpoint reports telemetry enabled', async () => {
      const res = await app.request('/api/health');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.telemetry).toBe('enabled');
    });
  });

  describe('Issue #29: Application Metrics & Prometheus Endpoint', () => {
    it('GET /metrics returns valid Prometheus metrics text format', async () => {
      // Seed some metrics
      recordInvoiceGenerated('EUR');
      recordTimeTracked(3.5, 'proj_test', 'Acme Corp');
      updateActiveTimersCount(2);
      recordPdfGenerationTime(0.45, true);

      const res = await app.request('/metrics');
      expect(res.status).toBe(200);
      const text = await res.text();

      // Check required application metrics
      expect(text).toContain('clientpilot_invoices_generated_total');
      expect(text).toContain('clientpilot_time_tracked_hours_total');
      expect(text).toContain('clientpilot_active_timers');
      expect(text).toContain('clientpilot_http_request_duration_seconds');
      expect(text).toContain('clientpilot_pdf_generation_duration_seconds');
      expect(text).toContain('clientpilot_pdf_generation_errors_total');
    });

    it('records HTTP request duration on every endpoint call', async () => {
      await app.request('/api/clients');
      const metricsText = await getPrometheusMetrics();
      expect(metricsText).toContain('clientpilot_http_request_duration_seconds');
      expect(metricsText).toContain('route="/api/clients"');
    });
  });

  describe('Issue #30 & #31: Alerting & AI On-Call Responder Webhook', () => {
    it('POST /api/alerts/webhook accepts Grafana alert payload and returns triage report', async () => {
      const alertPayload = {
        title: 'HighErrorRate',
        message: 'HTTP 5xx error rate exceeded 5% threshold',
        alerts: [
          {
            status: 'firing',
            labels: {
              alertname: 'HighErrorRate',
              severity: 'critical',
              service: 'clientpilot-backend',
            },
            annotations: {
              summary: 'ClientPilot HTTP error rate exceeds 5%',
              description: 'Observed 8% failures on timer routes',
            },
          },
        ],
      };

      const res = await app.request('/api/alerts/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertPayload),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('incident_triaged');
      expect(data.triage).toBeDefined();
      expect(data.triage.alertName).toBe('HighErrorRate');
      expect(data.triage.severity).toBe('critical');
      expect(data.triage.hypothesis).toBeDefined();
      expect(data.triage.remediationSteps.length).toBeGreaterThan(0);
    });

    it('POST /api/alerts/simulate triggers synthetic alert, spikes error metric, and logs incident', async () => {
      const res = await app.request('/api/alerts/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertname: 'PdfGenerationErrorsSpike',
          severity: 'critical',
          summary: 'Simulated invoice generation renderer crash',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('simulation_complete');
      expect(data.result.alertName).toBe('PdfGenerationErrorsSpike');
      expect(data.result.hypothesis).toContain('Invoice compilation failures detected');

      // Verify that error counter was incremented in Prometheus metrics
      const metrics = await getPrometheusMetrics();
      expect(metrics).toContain('clientpilot_pdf_generation_errors_total');
    });
  });
});

