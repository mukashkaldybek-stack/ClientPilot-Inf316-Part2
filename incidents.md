# ClientPilot Incident Response Ledger


## Incident: HighErrorRate
* **Timestamp**: 2026-11-16T13:53:34.320Z
* **Severity**: CRITICAL
* **GitHub Issue**: Simulated local execution
* **Root-Cause Hypothesis**: HTTP 5xx error rate exceeded 5% threshold over 5m window. Downstream database connection latency or schema validation error.
* **Remediation Actions Taken**:
  - Inspect PostgreSQL container health and connection pool saturation.
  - Check server/routes/timers.ts for unhandled 422 vs 500 status codes.
  - Review recent deployment commits and verify Prisma schema synchronization.
* **Status**: RESOLVED & CLOSED
---

## Incident: PdfGenerationErrorsSpike
* **Timestamp**: 2026-11-16T13:53:35.022Z
* **Severity**: CRITICAL
* **GitHub Issue**: Simulated local execution
* **Root-Cause Hypothesis**: Spike in PDF / Invoice compilation failures detected. Likely root cause: malformed invoice template tokens or unexpected unicode byte sequence in client company name.
* **Remediation Actions Taken**:
  - Validate HTML entity escaping function in server/utils/sanitize.ts.
  - Check time_entries table for duration anomalies or zero-second logs.
  - Restart the invoice generator worker pool if memory threshold exceeded.
* **Status**: RESOLVED & CLOSED
---

## Incident: HighErrorRate
* **Timestamp**: 2026-11-16T13:54:09.189Z
* **Severity**: CRITICAL
* **GitHub Issue**: [#32](https://github.com/mukashkaldybek-stack/ClientPilot-Inf316-Part2/issues/32)
* **Root-Cause Hypothesis**: HTTP 5xx error rate exceeded 5% threshold over 5m window. Downstream database connection latency or schema validation error.
* **Remediation Actions Taken**:
  - Inspect PostgreSQL container health and connection pool saturation.
  - Check server/routes/timers.ts for unhandled 422 vs 500 status codes.
  - Review recent deployment commits and verify Prisma schema synchronization.
* **Status**: RESOLVED & CLOSED
---

## Incident: HighErrorRate
* **Timestamp**: 2026-11-16T13:56:04.939Z
* **Severity**: CRITICAL
* **GitHub Issue**: Simulated local execution
* **Root-Cause Hypothesis**: HTTP 5xx error rate exceeded 5% threshold over 5m window. Downstream database connection latency or schema validation error.
* **Remediation Actions Taken**:
  - Inspect PostgreSQL container health and connection pool saturation.
  - Check server/routes/timers.ts for unhandled 422 vs 500 status codes.
  - Review recent deployment commits and verify Prisma schema synchronization.
* **Status**: RESOLVED & CLOSED
---

## Incident: PdfGenerationErrorsSpike
* **Timestamp**: 2026-11-16T13:56:05.683Z
* **Severity**: CRITICAL
* **GitHub Issue**: Simulated local execution
* **Root-Cause Hypothesis**: Spike in PDF / Invoice compilation failures detected. Likely root cause: malformed invoice template tokens or unexpected unicode byte sequence in client company name.
* **Remediation Actions Taken**:
  - Validate HTML entity escaping function in server/utils/sanitize.ts.
  - Check time_entries table for duration anomalies or zero-second logs.
  - Restart the invoice generator worker pool if memory threshold exceeded.
* **Status**: RESOLVED & CLOSED
---

## Incident: HighErrorRate
* **Timestamp**: 2026-11-16T14:04:05.441Z
* **Severity**: CRITICAL
* **GitHub Issue**: Simulated local execution
* **Root-Cause Hypothesis**: HTTP 5xx error rate exceeded 5% threshold over 5m window. Downstream database connection latency or schema validation error.
* **Remediation Actions Taken**:
  - Inspect PostgreSQL container health and connection pool saturation.
  - Check server/routes/timers.ts for unhandled 422 vs 500 status codes.
  - Review recent deployment commits and verify Prisma schema synchronization.
* **Status**: RESOLVED & CLOSED
---

## Incident: PdfGenerationErrorsSpike
* **Timestamp**: 2026-11-16T14:04:06.294Z
* **Severity**: CRITICAL
* **GitHub Issue**: Simulated local execution
* **Root-Cause Hypothesis**: Spike in PDF / Invoice compilation failures detected. Likely root cause: malformed invoice template tokens or unexpected unicode byte sequence in client company name.
* **Remediation Actions Taken**:
  - Validate HTML entity escaping function in server/utils/sanitize.ts.
  - Check time_entries table for duration anomalies or zero-second logs.
  - Restart the invoice generator worker pool if memory threshold exceeded.
* **Status**: RESOLVED & CLOSED
---
