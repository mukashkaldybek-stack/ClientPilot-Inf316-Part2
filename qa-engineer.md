# ClientPilot — QA Engineer Test Protocol & Verification Report (`qa-engineer.md`)

## 1. Test Strategy & Scope
The QA strategy for ClientPilot spans three testing tiers:
1. **Unit & API Integration Tests (Vitest)**: Exhaustive route coverage for Hono endpoints, parameter validation, schema compliance, and status codes (200, 201, 400, 404, 422).
2. **End-to-End Automated Browser Testing (Playwright)**: Full browser verification of user journeys (Client CRUD, Project Management, Timer Start/Stop, Invoice Generation).
3. **Regression & Edge Case Auditing**: Defensively guarding against edge cases (#16 missing `projectId`, #17 special character injection).

---

## 2. Bug Protocols & Regression Records

### Bug Report: Issue #16 — [Bug] Timer API crashes (500) if `project_id` is missing
* **Reporter**: QA Engineer
* **Preconditions**: Backend running on port 3000 / 4000.
* **Reproduction Steps**:
  1. Send `POST /api/timers/start` with payload `{ "description": "No project assigned" }`.
  2. Observe HTTP response status.
* **Actual Result (Before Fix)**: Returns `HTTP 500 Internal Server Error` due to unhandled null pointer / Prisma foreign key violation.
* **Expected Result**: Must return `HTTP 422 Unprocessable Entity` with JSON `{ "error": "Validation failed: projectId is required", "field": "projectId" }`.
* **Regression Test Definition**:
  - Test file: `tests/api.test.ts`
  - Test case: `"should return 422 when starting a timer without projectId"`
  - Verification: Sends empty body `{}` and `{ "description": "test" }`; asserts `res.status === 422` and body contains `code: 'MISSING_PROJECT_ID'`.
* **Status**: FIXED & VERIFIED.

---

### Bug Report: Issue #17 — [Bug] Invoice generation fails with special characters (`é`, `&`, `<`, `>`)
* **Reporter**: QA Engineer
* **Preconditions**: A client exists with name `"Café & René <Solutions>"`. A project exists with description `"Audit & Fix <Vulnerability>"`. Unbilled time entries logged.
* **Reproduction Steps**:
  1. Trigger invoice generation via `POST /api/invoices/generate` with `clientId` for `"Café & René <Solutions>"`.
  2. Inspect output payload, line item descriptions, and invoice preview.
* **Actual Result (Before Fix)**: Unsanitized HTML tags caused XSS / layout breakdown or JSON parser failures when special characters were unescaped.
* **Expected Result**: Special characters must be cleanly sanitized into safe HTML entities (`&amp;`, `&lt;`, `&gt;`) while international UTF-8 characters (`é`) remain intact. Returns `HTTP 201 Created` with valid invoice structure.
* **Regression Test Definition**:
  - Test file: `tests/api.test.ts`
  - Test case: `"should sanitize special characters in invoice generation without crashing"`
  - Verification: Asserts `res.status === 201`, client name is safely rendered, and no unescaped `<` or `>` tags break document layout.
* **Status**: FIXED & VERIFIED.

---

## 3. Issue Acceptance Criteria Verification Matrix

| Issue # | Title | AC Status | Regression Tests | Manual E2E | Final QA Decision |
| :--- | :--- | :--- | :--- | :--- | :--- |
| #1 | Scaffold Next.js frontend workspace | PASS | PASS | PASS | VERIFIED & CLOSED |
| #2 | Build frontend UI with mockService | PASS | PASS | PASS | VERIFIED & CLOSED |
| #3 | Define OpenAPI contract (`docs/openapi.yml`) | PASS | PASS | PASS | VERIFIED & CLOSED |
| #4 | Scaffold Hono backend server | PASS | PASS | PASS | VERIFIED & CLOSED |
| #5 | In-memory backend: Client CRUD | PASS | PASS | PASS | VERIFIED & CLOSED |
| #6 | In-memory backend: Project CRUD | PASS | PASS | PASS | VERIFIED & CLOSED |
| #7 | In-memory backend: Timer start/stop | PASS | PASS | PASS | VERIFIED & CLOSED |
| #8 | In-memory backend: Invoice generation | PASS | PASS | PASS | VERIFIED & CLOSED |
| #9 | Database Migration: Setup Prisma with PostgreSQL schema | PASS | PASS | PASS | VERIFIED & CLOSED |
| #10 | PostgreSQL backend: Client CRUD | PASS | PASS | PASS | VERIFIED & CLOSED |
| #11 | PostgreSQL backend: Project CRUD | PASS | PASS | PASS | VERIFIED & CLOSED |
| #12 | PostgreSQL backend: Timer start/stop (Enforce 422) | PASS | PASS | PASS | VERIFIED & CLOSED |
| #13 | PostgreSQL backend: Invoice generation (Sanitize special chars) | PASS | PASS | PASS | VERIFIED & CLOSED |
| #14 | Connect frontend to backend (Clients & Projects) | PASS | PASS | PASS | VERIFIED & CLOSED |
| #15 | Connect frontend to backend (Timers & Invoices) | PASS | PASS | PASS | VERIFIED & CLOSED |
| #16 | [Bug] Timer API crashes (500) if `project_id` is missing | PASS | PASS | PASS | VERIFIED & CLOSED |
| #17 | [Bug] Invoice generation fails with special characters (`é`, `&`, `<`, `>`) | PASS | PASS | PASS | VERIFIED & CLOSED |
| #18 | [post-mvp] Stripe B2B subscriptions integration | N/A | N/A | N/A | OPEN (Post-MVP Backlog) |
| #19 | [post-mvp] NextAuth/Clerk multi-tenant authentication | N/A | N/A | N/A | OPEN (Post-MVP Backlog) |
| #20 | [post-mvp] Advanced Analytics Dashboard | N/A | N/A | N/A | OPEN (Post-MVP Backlog) |
| #21 | [e2e-test] Playwright test for Client Management | PASS | PASS | PASS | VERIFIED & CLOSED |
| #22 | [e2e-test] Playwright test for Project Management | PASS | PASS | PASS | VERIFIED & CLOSED |
| #23 | [e2e-test] Playwright test for Time Tracking | PASS | PASS | PASS | VERIFIED & CLOSED |
| #24 | [e2e-test] Playwright test for Invoice Generation | PASS | PASS | PASS | VERIFIED & CLOSED |
| #26 | [devops] Separate development and production environments | PASS | PASS | PASS | VERIFIED & CLOSED |
| #27 | [devops] Manual CI/CD promotion trigger (dev → prod) | PASS | PASS | PASS | VERIFIED & CLOSED |
| #28 | [observability] Instrument backend with OpenTelemetry (metrics, traces, logs) | PASS | PASS | PASS | VERIFIED & CLOSED |
| #29 | [observability] Define application-specific metrics + Grafana dashboard | PASS | PASS | PASS | VERIFIED & CLOSED |
| #30 | [observability] Alert rules on application metrics | PASS | PASS | PASS | VERIFIED & CLOSED |
| #31 | [observability] AI agent as on-call responder for alerts | PASS | PASS | PASS | VERIFIED & CLOSED |

---

## 4. Phase 2: DevOps & Observability Verification Reports

### Verification: Issue #26 — Separate Development and Production Environments
* **Test Plan**: Validate `docker-compose.yml`, `docker-compose.prod.yml`, `.env.dev`, and `.env.prod.example`.
* **Execution**:
  - Dev configuration spins up separate development database `clientpilot_dev` and mounts local source.
  - Prod overlay enforces strict memory and CPU limits (`cpus: '1.0'`, `memory: 1024M`), `restart: always`, and points to `clientpilot_prod`.
  - CloudFormation template supports parameter `EnvironmentName=dev` vs `EnvironmentName=prod`.
* **Result**: PASS.

### Verification: Issue #27 — Manual CI/CD Promotion Trigger (Dev → Prod)
* **Test Plan**: Validate GitHub Actions workflow `.github/workflows/promote.yml` for manual dispatch and image re-tagging.
* **Execution**:
  - `workflow_dispatch` accepts `image_tag` or git SHA input.
  - Targets GitHub environment `production` with required review protection gates.
  - Pulls `ghcr.io/...:dev-<tag>` and pushes promoted tag `ghcr.io/...:prod-<tag>`.
* **Result**: PASS.

### Verification: Issue #28 — Instrument Backend with OpenTelemetry
* **Test Plan**: Verify OpenTelemetry NodeSDK exports spans and structured logs.
* **Execution**:
  - Executed Vitest test suite (`tests/observability.test.ts`).
  - OpenTelemetry SDK initializes without errors; trace exporter targets OTLP endpoint `http://localhost:4318/v1/traces`.
  - Manual Prisma spans (`withSpan`) wrap queries in `server/store/prismaStore.ts`.
  - Loki log forwarder formats structured JSON entries with trace correlation.
* **Result**: PASS.

### Verification: Issue #29 — Application-Specific Metrics & Grafana Dashboard
* **Test Plan**: Verify Prometheus metrics exposition and Grafana provisioning artifacts.
* **Execution**:
  - `GET /metrics` tested and verified exposing:
    - `clientpilot_invoices_generated_total`
    - `clientpilot_time_tracked_hours_total`
    - `clientpilot_active_timers`
    - `clientpilot_http_request_duration_seconds`
    - `clientpilot_pdf_generation_duration_seconds`
    - `clientpilot_pdf_generation_errors_total`
  - Validated dashboard configuration `grafana/provisioning/dashboards/clientpilot-overview.json`.
* **Result**: PASS.

### Verification: Issue #30 — Alert Rules on Application Metrics
* **Test Plan**: Validate alert rule definitions in `grafana/provisioning/alerting/rules.yaml`.
* **Execution**:
  - Verified 4 rules: `HighErrorRate`, `HighLatencyP95`, `PdfGenerationErrorsSpike`, `ClientPilotNoData`.
  - Verified webhook contact point routing to `http://app:3000/api/alerts/webhook`.
* **Result**: PASS.

### Verification: Issue #31 — Autonomous AI Agent as On-Call Responder
* **Test Plan**: Test webhook handling, hypothesis formulation, and synthetic drill execution.
* **Execution**:
  - Automated tests in `tests/observability.test.ts` send alert payloads to `POST /api/alerts/webhook`.
  - Verified hypothesis generation, telemetry snapshots, and 3-step remediation recommendations.
  - Live drill triggered via `POST /api/alerts/simulate`: autonomously opened GitHub Issue #32 with full triage comment and closed it cleanly.
  - Post-mortem recorded in `incidents.md`.
* **Result**: PASS.

---

## 5. Standard QA Issue Closure Notice
Every closed issue is resolved and tagged using the official verification statement:
`"✅ Verified by qa-engineer.md — Acceptance criteria: PASS | Regression tests: PASS | Manual E2E: PASS. Closing issue."`

Only the 3 post-mvp issues (#18, #19, #20) remain open for future roadmap expansion.

