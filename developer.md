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

## 4. Operational Commands Guide

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

# Run application with PostgreSQL database via Docker Compose
docker compose up -d

# Check health and logs
docker compose logs -f app
curl http://localhost:3000/api/health

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
