import { trace, context, SpanStatusCode, type Tracer } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const SERVICE_NAME = 'clientpilot-backend';
const SERVICE_VERSION = '1.0.0';

let sdk: NodeSDK | null = null;
let tracer: Tracer = trace.getTracer(SERVICE_NAME, SERVICE_VERSION);

export function initTelemetry(): void {
  if (sdk) return;

  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';
  const traceUrl = otlpEndpoint.endsWith('/v1/traces') ? otlpEndpoint : `${otlpEndpoint}/v1/traces`;

  const traceExporter = new OTLPTraceExporter({
    url: traceUrl,
  });

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: SERVICE_NAME,
    [ATTR_SERVICE_VERSION]: SERVICE_VERSION,
    environment: process.env.NODE_ENV || 'development',
  });

  try {
    sdk = new NodeSDK({
      resource,
      traceExporter,
    });
    sdk.start();
    tracer = trace.getTracer(SERVICE_NAME, SERVICE_VERSION);
    console.log(`📡 OpenTelemetry initialized. Exporting traces to: ${traceUrl}`);
  } catch (err) {
    console.warn('⚠️ OpenTelemetry SDK failed to initialize; proceeding with no-op tracer:', err);
  }
}

export function getTracer(): Tracer {
  return tracer;
}

/**
 * Creates and wraps an execution block in an OpenTelemetry active span.
 * Useful for tracing database queries, external calls, and critical business flows.
 */
export async function withSpan<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const span = tracer.startSpan(name, { attributes });
  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err: any) {
      span.recordException(err);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err.message || 'Error occurred during span execution',
      });
      throw err;
    } finally {
      span.end();
    }
  });
}

/**
 * Structured log helper emitting contextual log entries formatted for Loki and standard output.
 */
export function logTelemetry(level: 'info' | 'warn' | 'error', message: string, meta: Record<string, any> = {}): void {
  const currentSpan = trace.getSpan(context.active());
  const traceId = currentSpan?.spanContext().traceId || 'none';
  const spanId = currentSpan?.spanContext().spanId || 'none';

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: SERVICE_NAME,
    traceId,
    spanId,
    message,
    ...meta,
  };

  const output = JSON.stringify(entry);
  if (level === 'error') {
    console.error(output);
  } else if (level === 'warn') {
    console.warn(output);
  } else {
    console.log(output);
  }

  // If Loki endpoint is configured, forward asynchronous log stream
  const lokiUrl = process.env.LOKI_URL || 'http://localhost:3100';
  if (process.env.ENABLE_LOKI_STREAM === 'true') {
    fetch(`${lokiUrl}/loki/api/v1/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        streams: [
          {
            stream: { app: SERVICE_NAME, level },
            values: [[String(Date.now() * 1000000), output]],
          },
        ],
      }),
    }).catch(() => {});
  }
}
