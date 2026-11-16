# ClientPilot — Strategic Product & Observability Roadmap (`ROADMAP.md`)

This document outlines the strategic evolution of **ClientPilot**, detailing Post-MVP feature trajectories and the transition from local self-hosted telemetry to enterprise-grade managed observability.

---

## 1. Post-MVP Feature Backlog (Open Issues)

The following three core epics remain open as part of the strategic post-MVP roadmap:

### 1.1 Issue #18: Stripe B2B Subscriptions & Client Payment Processing
* **Goal**: Enable micro-SaaS recurring subscriptions for freelancers and direct invoice payment links for clients.
* **Architecture**:
  - Integrate Stripe Checkout and Stripe Billing for freelance tier plans ($9/mo Solo, $29/mo Pro).
  - Webhook handlers for `customer.subscription.created`, `invoice.payment_succeeded`, and `customer.subscription.deleted`.
  - Client-facing invoice payment gateway via Stripe Payment Intents allowing immediate credit card and ACH payments directly on generated invoices.

### 1.2 Issue #19: Multi-Tenant Authentication & Workspace RBAC
* **Goal**: Secure multi-tenant architecture supporting freelancer teams, agency collaborators, and accountant access.
* **Architecture**:
  - Integration with Clerk or NextAuth.js (Auth.js) supporting OAuth 2.0 (Google, GitHub) and passkeys.
  - Multi-tenant tenant ID segregation at the Prisma schema layer (`tenantId` column on all models with Prisma middleware row-level security).
  - Role-Based Access Control: `Admin` (full access), `Contractor` (log time only), and `Accountant` (read-only billing & invoices).

### 1.3 Issue #20: Advanced Analytics & Financial Forecasting Dashboard
* **Goal**: Deliver actionable business intelligence for freelance business owners.
* **Architecture**:
  - Visual charts showing Effective Hourly Rate (EHR) per client and project.
  - Revenue forecasting based on logged unbilled hours vs historic payment cycles.
  - Client profitability ranking and overdue invoice aging brackets (30/60/90 days).

---

## 2. Enterprise Observability Evolution

ClientPilot Phase 2 successfully instituted OpenTelemetry tracing, Prometheus metrics, Loki log collection, and an autonomous AI On-Call Responder. To support high-availability enterprise production, the observability infrastructure will progress through the following rollout phases:

```
+-----------------------------------------------------------------------------------+
|                        Phase 2 (Current Baseline)                                 |
|  - Self-hosted OTel Collector + Prometheus + Tempo + Loki in Docker Compose      |
|  - In-process AI On-Call Agent via Webhook & GitHub Issues                        |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                        Phase 3 (Cloud Managed Rollout)                            |
|  - AWS ECS / Kubernetes deployment with OTel Collector Sidecar                    |
|  - Amazon Managed Service for Prometheus (AMP) & Amazon Managed Grafana (AMG)    |
|  - CloudWatch Logs / AWS X-Ray integration via AWS Distro for OpenTelemetry (ADOT)|
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                        Phase 4 (Enterprise Autonomous SRE)                        |
|  - Grafana Cloud / Datadog APM with synthetic global probes                       |
|  - PagerDuty & Slack bi-directional incident dispatch                             |
|  - AI On-Call Responder auto-remediation (auto-rollback & canary traffic shaping) |
+-----------------------------------------------------------------------------------+
```

---

## 3. Managed Telemetry Rollout Strategies

### 3.1 Migration to Amazon Managed Grafana (AMG) & AMP
* **Problem**: Managing local Prometheus storage and Grafana server instances in production introduces maintenance overhead and single-point-of-failure risks.
* **Solution**:
  - Deploy **Amazon Managed Service for Prometheus (AMP)** for serverless, horizontally-scalable metrics ingestion.
  - Configure OTel Collector with `sigv4auth` to forward remote-write metrics directly to AMP endpoint.
  - Provision **Amazon Managed Grafana (AMG)** connected to AWS SSO for secure team access with pre-built workspace dashboards.

### 3.2 OpenTelemetry Sidecar Pattern on AWS ECS / Fargate
* **Container Architecture**:
  - In production ECS tasks, deploy the **AWS Distro for OpenTelemetry (ADOT)** collector as a sidecar container alongside the ClientPilot application container.
  - The application emits traces and metrics to `localhost:4318` via container loopback.
  - ADOT sidecar routes traces to **AWS X-Ray** / Grafana Tempo and logs to **Amazon CloudWatch Logs** / Grafana Loki without burdening the application process.

### 3.3 Autonomous AI On-Call SRE Expansion
* **Self-Healing Remediation**:
  - Expand the AI responder (`server/oncall.ts`) from advisory incident opening to automated remediation workflows.
  - If `HighErrorRate` is sustained after a new release promotion, the AI agent triggers an automated GitHub Actions rollback workflow (`gh workflow run rollback.yml`).
  - If database connection pool saturation occurs, the agent signals connection pool expansion or triggers database read-replica scale-out.

---

## 4. Observability SLO Targets

| Metric | Target SLO | Warning Alert | Critical Alert | AI Remediation Action |
| :--- | :--- | :--- | :--- | :--- |
| **API Availability** | 99.9% uptime | < 99.95% (5m) | < 99.0% (5m) | Health probe check & auto-restart |
| **p95 Request Latency** | < 250ms | > 500ms | > 1,500ms | Cache flush & thread pool dump |
| **Invoice Generation Latency** | < 1,000ms | > 2,000ms | > 5,000ms | Worker concurrency scale-up |
| **PDF Render Error Rate** | 0.0% | > 0.1% | > 1.0% | Template fallback to plaintext HTML |
| **Active Timer Sync Lag** | < 1s | > 2s | > 5s | In-memory Redis sync flush |
