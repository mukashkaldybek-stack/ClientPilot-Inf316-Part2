# ClientPilot — Developer Documentation & Iteration Protocols (`developer.md`)

## 1. System Architecture & Tech Stack

```
[ Next.js Client-Side App (Static Export 'out') ]
                    |
              HTTP / REST
                    v
    [ Hono API Gateway (TypeScript / Node.js) ]
         |                       |
   (In-Memory Store)      (Prisma ORM)
         |                       |
   [ Rapid Mock ]          [ PostgreSQL Database ]
```

### Components
* **Frontend**: Next.js 14+ / React 18, Tailwind CSS, Lucide icons, custom accessible components, static export (`output: 'export'`).
* **Backend**: Hono HTTP framework running on Node.js.
* **Storage Layer**: Dual-mode storage engine supporting In-Memory cache for isolated integration testing and PostgreSQL via Prisma for persistent production workloads.
* **Packaging**: Multi-stage `Dockerfile` creating a single self-contained production container with reverse-proxy/static file serving on port 3000.
* **Orchestration**: `docker-compose.yml` linking the unified application service with `postgres:15-alpine`.
* **Cloud Infrastructure**: AWS CloudFormation Free-Tier blueprint in `infra/aws.yml`.
* **CI/CD**: GitHub Actions workflow in `.github/workflows/deploy.yml`.

---

## 2. Iteration Execution Protocols

### Iteration 1: Frontend Workspace & Mock Service
* **Objective**: Initialize Next.js project with Tailwind CSS, static export configuration, and modular mock service (`lib/mockService.ts`).
* **Components Built**:
  - `Header` & `Navigation`: Tab-based dashboard switcher (Overview, Clients, Projects, Time Tracker, Invoices).
  - `MockStore`: Seeded in-memory records simulating real-world freelance workflows.
  - Interactive client cards, project tables, active timer pill, and invoice list.
* **Status**: COMPLETED.

### Iteration 2: OpenAPI Contract Definition
* **Objective**: Create complete OpenAPI 3.0 specification in `docs/openapi.yml`.
* **Endpoints Documented**:
  - `GET /api/health`
  - `GET /api/clients`, `POST /api/clients`, `GET/PUT/DELETE /api/clients/{id}`
  - `GET /api/projects`, `POST /api/projects`, `GET/PUT/DELETE /api/projects/{id}`
  - `GET /api/timers`, `POST /api/timers/start` (422 contract), `POST /api/timers/{id}/stop`, `GET /api/timers/active`
  - `GET /api/invoices`, `POST /api/invoices/generate` (sanitization contract), `GET /api/invoices/{id}`, `PUT /api/invoices/{id}/status`
* **Status**: COMPLETED.

### Iteration 3: Hono In-Memory Backend Server
* **Objective**: Implement standalone Hono API server with TypeScript, CORS middleware, and in-memory repository layer.
* **Highlights**:
  - Route handlers for Client CRUD, Project CRUD, Timer Start/Stop, and Invoice generation.
  - In-memory data store with atomic operations and auto-generating UUIDs.
* **Status**: COMPLETED.

### Iteration 4: PostgreSQL Setup via Docker & Prisma Migration
* **Objective**: Define Prisma schema with PostgreSQL provider (`prisma/schema.prisma`), implement database client repository, and enforce business validation rules:
  - Strict HTTP 422 on missing `projectId` during timer start (#12 & #16).
  - Robust UTF-8 and special character sanitization on invoice generation (#13 & #17).
* **Status**: COMPLETED.

### Iteration 5: Connect Frontend to Backend
* **Objective**: Configure Next.js frontend with dual-mode API client (`lib/apiClient.ts`):
  - Switches seamlessly between live Hono API (`/api/*`) and fallback mock service when offline.
  - Dynamic UI updates: starting a timer triggers real-time ticking; stopping it unlocks immediate invoice generation.
* **Status**: COMPLETED.

### Iteration 6: Containerization
* **Objective**: Create multi-stage `Dockerfile` and `docker-compose.yml`.
  - Stage 1: Builds Next.js static assets into `out/`.
  - Stage 2: Compiles Hono backend and Prisma runtime.
  - Stage 3: Unified Node runner that serves static files at `/` and handles API requests at `/api/*`.
  - Docker Compose: Links `app` with `postgres:15-alpine` database service with volume persistence and healthcheck.
* **Status**: COMPLETED.

### Iteration 7: Playwright End-to-End Tests
* **Objective**: Comprehensive test suite under `tests/e2e/`:
  - `client-management.spec.ts`: Tests client creation, update, and listing.
  - `project-management.spec.ts`: Tests project creation and client assignment.
  - `time-tracking.spec.ts`: Tests timer start, live clock, stop, and duration calculation.
  - `invoice-generation.spec.ts`: Tests generating invoice from tracked time and special character safety.
* **Status**: COMPLETED.

### Iteration 8: AWS CloudFormation (Free Tier) & CI/CD Pipeline
* **Objective**: Define AWS Free-Tier infrastructure (`infra/aws.yml`) and GitHub Actions workflow (`.github/workflows/deploy.yml`).
  - VPC, Public Subnet, Internet Gateway, Security Group (80, 443, 22), EC2 `t2.micro`, and RDS `db.t3.micro`.
  - GitHub Actions runs Vitest, Prisma validate, builds Docker image, executes E2E suite, and pushes artifacts.
* **Status**: COMPLETED.

---

## 3. Bug Fix Records

### Bug #16: Timer API 500 on missing `projectId`
* **Fix**: Added explicit guard condition in `/api/timers/start`:
  ```typescript
  if (!body || !body.projectId || typeof body.projectId !== 'string' || body.projectId.trim() === '') {
    return c.json({
      error: 'Validation failed: projectId is required',
      field: 'projectId',
      code: 'MISSING_PROJECT_ID'
    }, 422);
  }
  ```

### Bug #17: Invoice generation special characters failure
* **Fix**: Introduced `sanitizeString` utility:
  ```typescript
  export function sanitizeHtmlEntities(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  ```
  Applied across client names, project names, and time entry descriptions during invoice compilation.
