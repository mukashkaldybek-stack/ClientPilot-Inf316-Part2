# ClientPilot — Developer Architecture & Iteration Protocols (`developer.md`)

## 1. System Architecture & Tech Stack

```
+-----------------------------------------------------------------------+
|                       Next.js 14 Frontend                             |
|  - Static HTML/CSS/JS export (output: 'export' in out/)               |
|  - Tailwind CSS + Lucide Icons + shadcn/ui design patterns            |
|  - Dual-mode data client: live /api/* with fallback to mockService    |
+-----------------------------------------------------------------------+
                                   |
                             HTTP / REST
                                   v
+-----------------------------------------------------------------------+
|                    Unified Production Server                          |
|  - Serves static out/ folder on /                                     |
|  - Dispatches /api/* routes through Hono API framework (port 3000)    |
+-----------------------------------------------------------------------+
                                   |
         +-------------------------+-------------------------+
         |                                                   |
         v                                                   v
+-----------------------+                 +-----------------------------+
|    InMemoryStore      |                 |   PrismaStore (PostgreSQL)  |
| - Rapid dev / testing |                 | - Relational integrity      |
| - In-memory cache     |                 | - Prisma ORM 6 migrations   |
+-----------------------+                 +-----------------------------+
```

---

## 2. Iteration Execution Protocols

### Iteration 1: Frontend Workspace & Mock Service
* **Objective**: Initialize Next.js project with Tailwind CSS, static export configuration (`output: 'export'`), and modular mock service (`frontend/lib/mockService.ts`).
* **Implementation**:
  - Configured Next.js App Router with custom layout and theme (`frontend/app/`).
  - Implemented `mockService.ts` providing full client-side emulation of client CRUD, project assignment, timer start/stop with duration tracking, and invoice generation.
  - Built view components: `Navbar.tsx`, `OverviewView.tsx`, `ClientsView.tsx`, `ProjectsView.tsx`, `TimerView.tsx`, and `InvoicesView.tsx`.
* **Outcome**: Verified UI rendering in isolation and compiled static export into `out/`.

### Iteration 2: OpenAPI Contract Definition
* **Objective**: Define contract specification in `docs/openapi.yml`.
* **Implementation**:
  - Created complete OpenAPI 3.0 specification covering:
    - `/api/health`
    - `/api/clients`, `/api/clients/{id}`
    - `/api/projects`, `/api/projects/{id}`
    - `/api/timers`, `/api/timers/active`, `/api/timers/start` (with strict 422 schema), `/api/timers/{id}/stop`, `/api/timers/{id}`
    - `/api/invoices`, `/api/invoices/generate`, `/api/invoices/{id}`, `/api/invoices/{id}/status`
* **Outcome**: Contract served as the authoritative baseline for backend routes, tests, and documentation.

### Iteration 3: Hono In-Memory Backend Server
* **Objective**: Implement standalone TypeScript Hono API server with modular routing and in-memory repository layer.
* **Implementation**:
  - `server/app.ts`: Hono application setup with CORS middleware, healthcheck, and route grouping.
  - `server/store/inMemoryStore.ts`: Atomically manages state for Clients, Projects, Timers, and Invoices with seeded data.
  - `server/routes/`: Route modules for clients, projects, timers, and invoices.
* **Outcome**: All CRUD operations and in-memory workflows verified via Vitest unit suite.

### Iteration 4: PostgreSQL Setup via Docker & Prisma Migration
* **Objective**: Define PostgreSQL schema via Prisma ORM, create database repository, and enforce business validation rules:
  - Enforce HTTP 422 Unprocessable Entity when `projectId` is missing (#12 & #16).
  - Enforce HTML entity sanitization on invoice generation to prevent XSS and formatting corruption (#13 & #17).
* **Implementation**:
  - `prisma/schema.prisma`: Models for `Client`, `Project`, `TimeEntry`, `Invoice`, `InvoiceItem` with Cascade delete and foreign key relations.
  - `server/store/prismaStore.ts`: Persistent PostgreSQL repository using `@prisma/client`.
  - `server/store/index.ts`: `ResilientStore` pattern that seamlessly routes to Prisma/Postgres or falls back to in-memory mode when running isolated unit/E2E tests.
* **Outcome**: `npx prisma validate` passed; Prisma client generated.

### Iteration 5: Connect Frontend to Backend
* **Objective**: Connect the Next.js frontend to the live Hono API (`frontend/lib/apiClient.ts`).
* **Implementation**:
  - Connected `ClientsView` and `ProjectsView` to `/api/clients` and `/api/projects`.
  - Connected `TimerView` to `/api/timers/start` and `/api/timers/:id/stop`, enabling real-time counter ticking and navbar pill notifications.
  - Connected `InvoicesView` to `/api/invoices/generate`, auto-aggregating unbilled time entries and recalculating taxes and line items.
* **Outcome**: Full end-to-end user loop functional between client and server.

### Iteration 6: Containerization
* **Objective**: Build a single production Dockerfile and `docker-compose.yml` orchestrating PostgreSQL.
* **Implementation**:
  - `Dockerfile`: Multi-stage build:
    - Stage 1: Builds static frontend assets into `/app/out`.
    - Stage 2: Compiles Hono backend into `/app/dist/server/index.js` and generates Prisma client.
    - Stage 3: Lightweight Node 20 Alpine runner serving static files on `/` and API on `/api/*` on port 3000.
  - `docker-compose.yml`:
    - `db`: `postgres:15-alpine` with healthcheck.
    - `app`: builds `Dockerfile`, depends on healthy `db`, connects via `DATABASE_URL`.
* **Outcome**: Single self-contained container design with zero reverse-proxy complexity.

### Iteration 7: Playwright End-to-End Tests
* **Objective**: Automated browser testing for all four core micro-SaaS user journeys.
* **Implementation**:
  - `tests/e2e/client-management.spec.ts` (#21): Tests client profile creation, rates, and listing.
  - `tests/e2e/project-management.spec.ts` (#22): Tests project creation, client assignment, and status badges.
  - `tests/e2e/time-tracking.spec.ts` (#23): Tests live timer start, clock incrementation, stop, and log persistence.
  - `tests/e2e/invoice-generation.spec.ts` (#24): Tests invoice generation from tracked time, modal breakdown, and special character sanitization.
* **Outcome**: All 4 Playwright tests passed (4/4 passed).

### Iteration 8: AWS CloudFormation (Free Tier) & CI/CD Pipeline
* **Objective**: Infrastructure as Code (IaC) and automated GitHub Actions workflow.
* **Implementation**:
  - `infra/aws.yml`: 100% Free-Tier eligible CloudFormation template:
    - VPC (10.0.0.0/16), 2 Public Subnets, Internet Gateway, Route Tables.
    - Security Groups allowing ports 80 (HTTP), 443 (HTTPS), 22 (SSH), and 3000.
    - EC2 Instance (`t2.micro`) running Docker Compose.
    - RDS PostgreSQL (`db.t3.micro`, 20GB gp2).
  - `.github/workflows/deploy.yml`:
    - Step 1: Vitest unit & integration tests + Prisma schema validation.
    - Step 2: Build static export & server, execute Playwright E2E suite, build Docker Compose.
    - Step 3: Trigger automated production deployment on push to `main`.
* **Outcome**: Production pipeline codified and deployment-ready.

---

## 3. Bug Fix Protocols & Resolutions

### Bug #16: [Bug] Timer API crashes (500) if `project_id` is missing
* **Root Cause**: Backend `/api/timers/start` did not defensively validate payload structure before querying the repository. Missing `projectId` caused an unhandled runtime error resulting in HTTP 500.
* **Fix**: Implemented strict validation guard in `server/routes/timers.ts`:
  ```typescript
  const projectId = body?.projectId || body?.project_id;
  if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
    return c.json({
      error: 'Validation failed: projectId is required',
      field: 'projectId',
      code: 'MISSING_PROJECT_ID',
    }, 422);
  }
  ```
* **Verification**: Vitest regression test asserts empty object `{}`, `{ description: "test" }`, and whitespace string `projectId: "   "` return HTTP 422 with `code: 'MISSING_PROJECT_ID'`.

### Bug #17: [Bug] Invoice generation fails with special characters (`é`, `&`, `<`, `>`)
* **Root Cause**: International diacritics and XML/HTML reserved characters in client names (e.g. `Société & Frères`) or notes were unescaped, causing document breakdown or parsing crashes.
* **Fix**: Built `server/utils/sanitize.ts` using entity escaping for HTML-sensitive characters while preserving UTF-8 diacritics:
  ```typescript
  export function sanitizeString(input: string | undefined | null): string {
    if (!input) return '';
    return String(input)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  ```
  Applied across client names, project names, descriptions, and invoice notes during invoice compilation.
* **Verification**: Vitest regression test verified client `"Café & René <Solutions & Cie>"` generates valid invoice containing `&amp;`, `&lt;`, `&gt;`, and `é` without crashing.

---

## 4. Phase 2: DevOps & Observability Iteration Protocols

### Iteration 8: Environment Isolation (Dev vs Prod) — Issue #26
* **Objective**: Segregate development and production environments with discrete compose files, database instances, and environment configurations.
* **Implementation**:
  - `docker-compose.yml`: Primary development composition running PostgreSQL 15 (`clientpilot_dev`), OpenTelemetry Collector (`otel/opentelemetry-collector-contrib`), Prometheus (`prom/prometheus:v2.51.0`), Tempo (`grafana/tempo:2.4.1`), Loki (`grafana/loki:2.9.4`), Grafana (`grafana/grafana:10.4.1`), and the Node.js application container.
  - `docker-compose.prod.yml`: Production overlay enforcing `restart: always`, resource reservations and limits (CPU: 1.0, Memory: 1GB), production PostgreSQL container (`clientpilot_prod`), production environment injection, and disabling development mock seeders.
  - Environment files: Created `.env.dev` (with `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clientpilot_dev"`) and `.env.prod.example`.
  - CloudFormation: Updated `infra/aws.yml` with dual named deployment targets (`dev` and `prod`) and dynamic environment parameterization.
* **Verification**:
  - `docker compose up` boots dev environment with full telemetry.
  - `docker compose -f docker-compose.yml -f docker-compose.prod.yml config` produces validated production composition.

### Iteration 9: Manual Promotion Pipeline (Dev → Prod) — Issue #27
* **Objective**: Automate release promotion via GitHub Actions with explicit reviewer gate and audit logging.
* **Implementation**:
  - Created `.github/workflows/promote.yml` with `workflow_dispatch` trigger.
  - Input parameters: `image_tag` (commit SHA or tag, e.g., `dev-v1.0.0`) and optional target cluster.
  - Protection gate: Attached to GitHub environment `production` requiring required reviewer sign-off.
  - Re-tagging: Authenticates to GitHub Container Registry (GHCR), pulls `ghcr.io/${{ github.repository }}:${{ inputs.image_tag }}`, tags as `prod-${{ inputs.image_tag }}`, and deploys to target container host (AWS EC2 / Railway).
* **Verification**: Workflow syntax validated, step execution mapped, and logged in developer audit trails.

### Iteration 10: OpenTelemetry Full-Stack Instrumentation — Issue #28
* **Objective**: Implement vendor-neutral OpenTelemetry instrumentation in Hono backend covering traces, metrics, and structured logs.
* **Implementation**:
  - Installed `@opentelemetry/sdk-node`, `@opentelemetry/api`, `@opentelemetry/exporter-trace-otlp-http`, and `@opentelemetry/exporter-metrics-otlp-http`.
  - Created `server/telemetry.ts` initializing OpenTelemetry `NodeSDK` with OTLP HTTP trace exporter directed to `http://localhost:4318/v1/traces`.
  - Implemented `withSpan(name, fn, attributes)` helper wrapping synchronous and asynchronous operations in active OpenTelemetry spans.
  - Instrumented `server/store/prismaStore.ts` with custom database spans for `db.client.create`, `db.project.list`, `db.timer.start`, and `db.invoice.create`.
  - Structured logging with `logTelemetry()` emitting ISO-8601 timestamps, trace IDs, span IDs, and level-tagged JSON, with forwarders for Loki (`http://localhost:3100/loki/api/v1/push`).
  - Configured `otel-collector-config.yaml` pipeline routing OTLP traces to Tempo, metrics to Prometheus, and logs to Loki.
* **Verification**: Backend exports OTLP spans cleanly, tested via Vitest suite.

### Iteration 11: Domain Metrics & Grafana Dashboard — Issue #29
* **Objective**: Expose micro-SaaS business and latency metrics via Prometheus format and provision Grafana dashboards.
* **Implementation**:
  - Built `server/metrics.ts` utilizing `prom-client` exposing:
    - `clientpilot_invoices_generated_total`: Total count of compiled invoices.
    - `clientpilot_time_tracked_hours_total`: Cumulative billable hours logged.
    - `clientpilot_active_timers`: Current gauge of live running timers.
    - `clientpilot_http_request_duration_seconds`: Histogram measuring latency percentiles across endpoints.
    - `clientpilot_pdf_generation_duration_seconds`: Histogram measuring invoice PDF rendering time.
    - `clientpilot_pdf_generation_errors_total`: Counter for render and compilation failures.
  - Exposed `GET /metrics` route on Hono backend with standard Prometheus text exposition format.
  - Automated Grafana provisioning:
    - Datasources: `grafana/provisioning/datasources/datasources.yaml` (Prometheus at `http://prometheus:9090`, Tempo at `http://tempo:3200`, Loki at `http://loki:3100`).
    - Dashboard: `grafana/provisioning/dashboards/clientpilot-overview.json` visualizing Active Timers, Invoices Generated, p95/p99 Latency, Error Rate %, and Trace/Log correlations.
* **Verification**: GET `/metrics` returns valid Prometheus metrics; Grafana dashboard passes JSON schema validation.

### Iteration 12: Grafana Alert Rules — Issue #30
* **Objective**: Configure declarative SLO alert rules for fast error detection.
* **Implementation**:
  - Created `grafana/provisioning/alerting/rules.yaml` containing 4 alert definitions:
    1. `HighErrorRate`: Triggers when HTTP 5xx error rate exceeds 5% over 5m window (Severity: Critical).
    2. `HighLatencyP95`: Triggers when p95 request duration exceeds 1.5s (Severity: Warning).
    3. `PdfGenerationErrorsSpike`: Triggers immediately when invoice compilation error counter increments (Severity: Critical).
    4. `ClientPilotNoData`: Watchdog alert triggering if metrics scrape is missing for >2m.
  - Notification policy configured with Webhook contact point routing alerts to `http://app:3000/api/alerts/webhook`.
* **Verification**: Alert rules validate against Prometheus Alertmanager/Grafana syntax.

### Iteration 13: Autonomous AI On-Call Responder — Issue #31
* **Objective**: Build an autonomous AI agent triggered by alerting webhooks that investigates incidents, inspects metrics, formulates hypotheses, recommends fixes, creates GitHub tracking issues, and records post-mortems.
* **Implementation**:
  - Developed `server/oncall.ts` containing the autonomous triage engine:
    - Parses Grafana alert webhooks (`POST /api/alerts/webhook`).
    - Gathers current telemetry snapshot (active timers, p95 latency, error rate, Loki logs).
    - Uses automated reasoning to construct root-cause hypothesis and 3 immediate remediation steps.
    - Executes `gh issue create` autonomously with label `observability` and title `INCIDENT: <AlertName> (<Severity>)`.
    - Appends incident record to `incidents.md` with post-mortem documentation.
    - Exposes synthetic test trigger `POST /api/alerts/simulate` for SRE drills and automated test suites.
* **Verification**:
  - Synthetic alert simulation executed: successfully created GitHub Issue #32 with full triage comment and closed it automatically after verification.
  - Verified 6/6 tests passing in `tests/observability.test.ts`.

---

## 5. Operational Commands Guide

### Local Development
```bash
# Install dependencies
npm install

# Run Vitest test suite
npm test

# Run Next.js static export build
npm run build:frontend

# Run Hono server build
npm run build:server

# Run unified full build
npm run build

# Run Playwright E2E tests
npm run test:e2e
```

### Docker Commands
```bash
# Build unified multi-stage container
docker build -t clientpilot:latest .

# Run development environment (PostgreSQL dev, OTel, Prometheus, Tempo, Loki, Grafana)
docker compose up -d

# Run production environment overlay (resource limits, prod database, restart policy)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check health and logs
docker compose logs -f app
curl http://localhost:3000/api/health

# Access Grafana Observability Portal
# Open http://localhost:3001 (Default credentials: admin / admin)

# Teardown
docker compose down
```

### AWS Deployment Commands
```bash
# Validate CloudFormation template
aws cloudformation validate-template --template-body file://infra/aws.yml

# Deploy Free-Tier Stack
aws cloudformation create-stack \
  --stack-name clientpilot-production \
  --template-body file://infra/aws.yml \
  --parameters ParameterKey=EnvironmentName,ParameterValue=clientpilot-prod \
               ParameterKey=DBUser,ParameterValue=postgres \
               ParameterKey=DBPassword,ParameterValue=ClientPilot2026Secure! \
  --capabilities CAPABILITY_IAM

# Check Stack Status
aws cloudformation describe-stacks --stack-name clientpilot-production --query "Stacks[0].StackStatus"
```
