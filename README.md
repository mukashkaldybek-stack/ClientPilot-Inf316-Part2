# ClientPilot — Autonomous Micro-SaaS for Freelancers

[![CI/CD Pipeline](https://github.com/mukashkaldybek-stack/ClientPilot-Inf316-Part2/actions/workflows/deploy.yml/badge.svg)](https://github.com/mukashkaldybek-stack/ClientPilot-Inf316-Part2/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![Hono](https://img.shields.io/badge/Hono-4.6-orange)](https://hono.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.3-2D3748)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)](https://www.postgresql.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.50-green)](https://playwright.dev/)

**ClientPilot** is an autonomous, lightweight micro-SaaS engineered specifically for independent freelancers, contractors, and digital consultants. It eliminates fragmented administrative overhead by unifying client directories, project tracking, real-time start/stop time tracking, and automated itemized invoice generation within a single, unified interface.

---

## 📌 Project Links

* **Live Demo**: **Not deployed yet** *(Deployment blueprints in [`infra/aws.yml`](infra/aws.yml) and container configurations are verified and deployment-ready)*
* **GitHub Repository**: [https://github.com/mukashkaldybek-stack/ClientPilot-Inf316-Part2](https://github.com/mukashkaldybek-stack/ClientPilot-Inf316-Part2)
* **API Documentation**: [`docs/openapi.yml`](docs/openapi.yml)
* **Deployment Documentation**: [`DEPLOYMENT.md`](DEPLOYMENT.md)

---

## 💡 Problem Statement

Freelance professionals frequently lose billable hours and administrative time due to disparate, overly complex tools:
1. **Context Fragmentation**: Switching between separate apps for time tracking, project status, contact management, and billing.
2. **Billing Inaccuracies**: Forgetting to log unbilled hours or struggling to aggregate disparate time entries into client-ready invoices at month-end.
3. **Bloated Software**: Mainstream SaaS invoicing suites are expensive, slow, and impose heavy subscription tiers for basic tracking workflows.
4. **Data Formatting Failures**: Invoicing international clients often fails or breaks PDF layouts when handling multilingual diacritics and special characters (`é`, `&`, `<`, `>`).

ClientPilot solves this by offering a zero-bloat, high-performance solution that tracks time directly against client projects and converts unbilled logs into professional, itemized invoices in one click.

---

## ✨ Main Features

### 1. 👥 Client Management (CRUD)
* Maintain complete client billing directories with customizable hourly rates and multi-currency support (USD, EUR, GBP, CAD).
* Full create, read, update, and delete (CRUD) capabilities with cascading safety for associated projects and time records.
* Robust support for international business entities containing accented letters and symbols (e.g. *Société Générale*, *Müller & Söhne*).

### 2. 📁 Project Portfolio Management
* Organize freelance deliverables under specific clients with budget hour allocations and status pipelines (`active`, `completed`, `on_hold`).
* Track total tracked hours versus scoped project budgets in real time.

### 3. ⏱️ Precision Time Tracking
* **One-Click Live Timer**: Instant start/stop timer widget accessible across all views with dynamic elapsed time ticking (`HH:MM:SS`).
* **Active Status Bar**: Glowing, animated pill indicator in the top navbar displaying currently running projects.
* **Defensive Input Validation**: Strictly enforces `HTTP 422 Unprocessable Entity` if a user attempts to start a timer without assigning a valid project.
* **Historical Time Logs**: Comprehensive ledger displaying date, task description, duration, project, client, and billable status.

### 4. 🧾 Instant Invoice Generation
* **One-Click Time Aggregation**: Automatically identifies and pulls all unbilled time entries for a selected client.
* **Automated Calculations**: Calculates Line Item Amount = $\text{Hours} \times \text{Hourly Rate}$, applies configurable tax rates, and sums the total due.
* **Sanitized Document Safety**: Escapes HTML/XML entities (`&amp;`, `&lt;`, `&gt;`) while preserving legitimate UTF-8 characters (`é`, `ñ`, `ü`) to guarantee formatting integrity.
* **Printable / Exportable Invoices**: Clean, printable invoice modal formatted for PDF export and client presentation.
* **Invoice State Management**: Seamlessly transition invoice statuses (`draft`, `sent`, `paid`, `cancelled`).

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose & Rationale |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 14 (App Router)** | Configured with static export (`output: 'export'`) for zero server overhead and rapid edge distribution. |
| **Styling & UI** | **Tailwind CSS + shadcn/ui** | Clean, accessible dark-themed interface inspired by modern developer-first SaaS platforms. |
| **Icons** | **Lucide React** | Consistent, lightweight SVG iconography. |
| **Backend API** | **Hono (TypeScript)** | Ultra-lightweight, high-speed API framework running on Node.js with declarative route dispatching. |
| **ORM & Schema** | **Prisma 6** | Type-safe query engine, migrations, and declarative PostgreSQL schema definitions. |
| **Database** | **PostgreSQL 15** | Relational persistence with foreign keys, indexes, and transactional consistency. |
| **Testing** | **Vitest** | Blazing-fast unit and API integration testing. |
| **E2E Testing** | **Playwright** | Full browser automation verifying end-to-end user journeys in headless Chromium. |
| **Container** | **Docker & Docker Compose** | Multi-stage single production image and multi-service orchestration. |
| **Infrastructure** | **AWS CloudFormation** | 100% Free-Tier eligible CloudFormation template (VPC, EC2 `t2.micro`, RDS `db.t3.micro`). |

---

## 🏛️ System Architecture

```mermaid
graph TD
    User([Freelancer / Client]) -->|HTTP / HTTPS| WebServer[Unified Server :3000]

    subgraph Container [clientpilot-app Container]
        WebServer -->|GET / static routes| StaticFiles[Next.js Static Export /out]
        WebServer -->|/api/* requests| HonoAPI[Hono API Gateway]
        HonoAPI --> StoreRouter{Resilient Store Router}
        StoreRouter -->|Local/Test Mode| InMemory[In-Memory Store]
        StoreRouter -->|Production Mode| PrismaORM[Prisma Client]
    end

    subgraph Database [clientpilot-db Container / AWS RDS]
        PrismaORM -->|TCP 5432| Postgres[(PostgreSQL 15)]
    end
```

### Architecture Highlights
* **Unified Single Runtime**: A lightweight Node.js server serves the pre-rendered Next.js single-page application at `/` via `sirv` and handles all REST API routes under `/api/*` via Hono.
* **Dual-Mode Persistence Layer**: Incorporates a resilient store interface (`server/store/index.ts`) that runs with PostgreSQL via Prisma in production, while falling back seamlessly to an in-memory repository for isolated unit and end-to-end testing without external database dependencies.

---

## 📂 Project Folder Structure

```
ClientPilot-Inf316-Part2/
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD: Vitest, Prisma, Playwright, Docker, Deploy
├── .env.example                    # Sample environment variables
├── .gitignore                      # Git ignore patterns
├── Dockerfile                      # Multi-stage production container
├── GITHUB_ISSUES.md                # Real issue mapping and resolution audit
├── README.md                       # Comprehensive documentation
├── DEPLOYMENT.md                   # Production deployment guide
├── brainstorm.md                   # Product concept and domain diagrams
├── developer.md                    # Technical log across Iterations 1 to 8
├── docker-compose.yml              # Postgres 15 + App service orchestration
├── docs/
│   └── openapi.yml                 # OpenAPI 3.0 REST specification
├── frontend/                       # Next.js frontend source
│   ├── app/                        # App Router pages and CSS
│   ├── components/                 # React UI views (Clients, Projects, Timers, Invoices)
│   ├── lib/                        # API client, types, and mock service
│   └── next.config.js              # Next.js static export config
├── infra/
│   └── aws.yml                     # AWS Free-Tier CloudFormation template
├── package.json                    # Monorepo build and test scripts
├── playwright.config.ts            # E2E test runner configuration
├── pm.md                           # Product Manager backlog and grooming notes
├── prisma/
│   └── schema.prisma               # PostgreSQL Prisma schema definition
├── qa-engineer.md                  # QA verification report & regression matrices
├── server/                         # Hono backend API source
│   ├── app.ts                      # Hono app setup and route binding
│   ├── index.ts                    # Unified production runner
│   ├── routes/                     # REST endpoints (clients, projects, timers, invoices)
│   ├── store/                      # In-memory and Prisma PostgreSQL repositories
│   ├── types.ts                    # Backend TypeScript models
│   └── utils/                      # Sanitization utilities
├── tests/
│   ├── api.test.ts                 # Vitest unit & integration test suite
│   └── e2e/                        # Playwright automated browser tests
└── vitest.config.ts                # Vitest test configuration
```

---

## ⚙️ Installation Prerequisites

Before running ClientPilot locally, ensure you have the following installed:
* **Node.js**: `v20.x` or `v22.x` (Tested on `v24.20.0`)
* **npm**: `v10.x` or higher
* **Git**: `v2.x`
* **Docker & Docker Compose** *(Optional, for containerized execution)*

---

## 🚀 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/mukashkaldybek-stack/ClientPilot-Inf316-Part2.git
cd ClientPilot-Inf316-Part2
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the sample environment file:
```bash
cp .env.example .env
```

Contents of `.env`:
```ini
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clientpilot?schema=public"
PORT=3000
NODE_ENV=development
```

---

## 🗄️ Database Setup & Prisma Migrations

When running against a local or remote PostgreSQL instance:

```bash
# 1. Validate the Prisma schema
npx prisma validate

# 2. Push schema models to PostgreSQL
npx prisma db push

# 3. Generate the Prisma Client
npx prisma generate
```

*(Note: If no PostgreSQL instance is detected, the server automatically operates in isolated In-Memory mode for local development and rapid testing).*

---

## 💻 Running the Application

### Option A: Development Mode (Live Watch)
Run the development server with live TypeScript reload:
```bash
npm run dev
```

### Option B: Production Build & Run
Compile both the static frontend export and the backend server, then start the unified runner:
```bash
# 1. Build static frontend (/out) and bundle backend (/dist)
npm run build

# 2. Start the unified production server
npm start
```
The application will be accessible at **http://localhost:3000**.
* **Frontend SPA**: `http://localhost:3000/`
* **API Health Check**: `http://localhost:3000/api/health`
* **API Endpoints**: `http://localhost:3000/api/*`

---

## 🧪 Running Automated Tests

ClientPilot incorporates a two-tier automated testing strategy:

### 1. Unit & Integration Tests (Vitest)
Executes route coverage, business calculations, schema validation, and bug regression tests:
```bash
npm test
```
* **Coverage**: 16 exhaustive tests covering Client CRUD, Project CRUD, Timer Start/Stop, Invoice generation, Bug #16 (422 missing project ID), and Bug #17 (Special character sanitization).

### 2. End-to-End Browser Tests (Playwright)
Executes full user journey automation against the running application in headless Chromium:
```bash
# Install Playwright browser binaries (one-time setup)
npx playwright install chromium

# Execute E2E test suite
npm run test:e2e
```
* **Coverage**:
  - `client-management.spec.ts`: Client profile creation, rate validation, and listing (#21)
  - `project-management.spec.ts`: Project creation and client linkage (#22)
  - `time-tracking.spec.ts`: Timer start, live ticker counter, and stopping (#23)
  - `invoice-generation.spec.ts`: Unbilled time aggregation and printable invoice modal (#24)

---

## 🐳 Running with Docker Compose

To run the entire production stack (Application + PostgreSQL 15 database) in isolated containers:

```bash
# Build and launch containers in background
docker compose up -d --build

# Check status of running containers
docker compose ps

# View unified application logs
docker compose logs -f app

# Stop and remove containers
docker compose down
```

The application will be available at **http://localhost:3000** with persistent PostgreSQL data stored in the `pgdata` volume.

---

## ☁️ Deployment Instructions

### AWS CloudFormation (Free-Tier Eligible)
Deploy to AWS using the provided template [`infra/aws.yml`](infra/aws.yml):
```bash
aws cloudformation create-stack \
  --stack-name clientpilot-production \
  --template-body file://infra/aws.yml \
  --parameters ParameterKey=EnvironmentName,ParameterValue=clientpilot-prod \
               ParameterKey=DBUser,ParameterValue=postgres \
               ParameterKey=DBPassword,ParameterValue=YourSecurePassword123! \
  --capabilities CAPABILITY_IAM
```
Refer to [`DEPLOYMENT.md`](DEPLOYMENT.md) for detailed AWS and GCP step-by-step instructions.

---

## 🔄 CI/CD Pipeline

The automated CI/CD pipeline is implemented via **GitHub Actions** in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

On every push to `main` and Pull Requests, the pipeline executes:
1. **Validation & Unit Testing**: Runs ephemeral PostgreSQL service, validates Prisma schema, and runs Vitest suite.
2. **Build & End-to-End Testing**: Builds Next.js static export, bundles Hono backend, executes Playwright E2E tests, and builds Docker Compose smoke test.
3. **Continuous Deployment**: On merge into `main`, triggers production deployment to the designated host.

---

## 📊 Current Project Status

* **Status**: **Production-Ready (Part 2 Completion)**
* **Issues Resolved**: **24 / 24 GitHub Issues Closed (100%)**
  - Issues 1–15: MVP Core Features & Persistence (`mvp`)
  - Issues 16–17: User Testing Bugs Resolved & Verified (`user-test-bug`)
  - Issues 18–20: Post-MVP Architecture Codified (`post-mvp`)
  - Issues 21–24: Automated Playwright E2E Test Suite (`e2e-test`)
* **Acceptance Standard**: Every issue closed with official QA verification comment:
  > *"✅ Verified by qa-engineer.md — Acceptance criteria: PASS | Regression tests: PASS | Manual E2E: PASS. Closing issue."*

---

## 🔮 Known Limitations & Future Roadmap

* **Authentication & Multi-Tenancy**: The current release is architected for single-freelancer local/container operation. Issue #19 establishes the design for Clerk / NextAuth integration.
* **Payment Gateway**: Current invoices can be exported, printed, and marked as paid manually. Issue #18 outlines Stripe Billing and customer payment links.
* **Advanced Analytics**: Visual breakdown of revenue trends over quarters and billable utilization percentages (Issue #20).

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
