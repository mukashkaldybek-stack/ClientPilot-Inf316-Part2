# ClientPilot — Product Manager Specification (`pm.md`)

## 1. Product Objective & Vision
ClientPilot enables freelance knowledge workers (developers, designers, consultants) to streamline client management, track active billable project hours, and generate polished, error-free invoices within seconds.

---

## 2. Epics & User Stories

### Epic 1: Client Directory & Billing Profiles
* **Story 1.1**: As a freelancer, I want to create, view, edit, and delete client profiles so that I maintain accurate billing rates and contact information.
  * **Acceptance Criteria**:
    - Required fields: Name, Email, Hourly Rate, Currency.
    - Default currency is USD; supports EUR, GBP, CAD, etc.
    - Positive numeric rate validation.
    - Deleting a client safely cascades or prevents orphaned projects.

### Epic 2: Project Management
* **Story 2.1**: As a freelancer, I want to organize work under specific projects tied to a client so I can manage scope and track budget hours.
  * **Acceptance Criteria**:
    - Required fields: Project Name, Client ID.
    - Statuses: `active`, `completed`, `on_hold`.
    - Real-time aggregation of logged hours against budget hours.

### Epic 3: Frictionless Time Tracking
* **Story 3.1**: As a freelancer, I want to start a live timer for a specific project with one click, and stop it when finished so my billable hours are tracked accurately.
  * **Acceptance Criteria**:
    - Timer requires `projectId`.
    - If `projectId` is missing, API returns HTTP 422 Unprocessable Entity.
    - Only one active timer allowed per user at any time.
    - Elapsed time updates dynamically on the UI.
    - Stopping a timer persists duration in seconds and marks `isBilled: false`.

### Epic 4: Invoice Generation & Billing
* **Story 4.1**: As a freelancer, I want to generate an itemized invoice for a client from unbilled time entries so I can bill them promptly.
  * **Acceptance Criteria**:
    - Automatically collects all unbilled time entries for the selected client.
    - Calculates Line Item Amount = Hours * Hourly Rate.
    - Computes Subtotal, Tax (configurable rate), and Total Amount.
    - Atomically flags included time entries as `isBilled: true`.
    - Flawlessly handles special characters (`é`, `&`, `<`, `>`, quotes, multilingual names) without corrupting document structure or crashing.

---

## 3. Issue Grooming & Priority Backlog

| Epic | Issue ID | Title | Priority | Target Iteration |
| :--- | :--- | :--- | :--- | :--- |
| Core Setup | #1 | Scaffold Next.js frontend workspace | High | Iteration 1 |
| Core Setup | #2 | Build frontend UI with mockService | High | Iteration 1 |
| API Spec | #3 | Define OpenAPI contract (`docs/openapi.yml`) | Critical | Iteration 2 |
| Backend Core | #4 | Scaffold Hono backend server | Critical | Iteration 3 |
| In-Memory BE | #5 | In-memory backend: Client CRUD | High | Iteration 3 |
| In-Memory BE | #6 | In-memory backend: Project CRUD | High | Iteration 3 |
| In-Memory BE | #7 | In-memory backend: Timer start/stop | High | Iteration 3 |
| In-Memory BE | #8 | In-memory backend: Invoice generation | High | Iteration 3 |
| Persistence | #9 | Database Migration: Setup Prisma with PostgreSQL schema | Critical | Iteration 4 |
| Postgres BE | #10 | PostgreSQL backend: Client CRUD | High | Iteration 4 |
| Postgres BE | #11 | PostgreSQL backend: Project CRUD | High | Iteration 4 |
| Postgres BE | #12 | PostgreSQL backend: Timer start/stop (Enforce 422) | High | Iteration 4 |
| Postgres BE | #13 | PostgreSQL backend: Invoice generation (Sanitize special chars) | High | Iteration 4 |
| Integration | #14 | Connect frontend to backend (Clients & Projects) | High | Iteration 5 |
| Integration | #15 | Connect frontend to backend (Timers & Invoices) | High | Iteration 5 |
| Quality/Bug | #16 | [Bug] Timer API crashes (500) if `project_id` is missing | Critical | Bug Protocol |
| Quality/Bug | #17 | [Bug] Invoice generation fails with special characters (`é`, `&`, `<`, `>`) | Critical | Bug Protocol |
| Future Scope | #18 | [post-mvp] Stripe B2B subscriptions integration | Low | Post-MVP (Open) |
| Future Scope | #19 | [post-mvp] NextAuth/Clerk multi-tenant authentication | Low | Post-MVP (Open) |
| Future Scope | #20 | [post-mvp] Advanced Analytics Dashboard | Low | Post-MVP (Open) |
| E2E Testing | #21 | [e2e-test] Playwright test for Client Management | High | Iteration 7 |
| E2E Testing | #22 | [e2e-test] Playwright test for Project Management | High | Iteration 7 |
| E2E Testing | #23 | [e2e-test] Playwright test for Time Tracking | High | Iteration 7 |
| E2E Testing | #24 | [e2e-test] Playwright test for Invoice Generation | High | Iteration 7 |

---

## 4. PM Grooming Notes for Bugs

### Grooming Note for Bug #16: [Bug] Timer API crashes (500) if `project_id` is missing
* **Severity**: Blocker (produces server crash / 500 internal server error instead of standard client error).
* **Root Cause Assessment**: Backend route `/api/timers/start` did not defensively validate payload structure prior to querying the database or in-memory map. A `null` or `undefined` `projectId` threw an unhandled reference/foreign-key exception resulting in HTTP 500.
* **Product Requirement**:
  - Request body must be validated before any database transaction.
  - If `projectId` (or `project_id`) is missing, empty, or undefined, backend must immediately return **HTTP 422 Unprocessable Entity** with JSON body:
    ```json
    {
      "error": "Validation failed: projectId is required",
      "field": "projectId",
      "code": "MISSING_PROJECT_ID"
    }
    ```
  - Frontend must catch 422 and display a friendly form validation toast or inline error indicator without crashing the timer widget.

### Grooming Note for Bug #17: [Bug] Invoice generation fails with special characters (`é`, `&`, `<`, `>`)
* **Severity**: High (corrupts invoice render and causes PDF/HTML layout crashes when billing clients with non-ASCII or reserved XML/HTML characters).
* **Root Cause Assessment**: Client names (e.g. `Société Générale & Partners`) or task notes containing `<`, `>`, `&`, or accented characters were directly injected into invoice rendering templates or unsanitized strings without UTF-8 encoding or entity escaping.
* **Product Requirement**:
  - All textual input fields (`name`, `description`, `notes`) must be sanitized using standard HTML entity escaping (`&` $\rightarrow$ `&amp;`, `<` $\rightarrow$ `&lt;`, `>` $\rightarrow$ `&gt;`, `"` $\rightarrow$ `&quot;`) while preserving valid UTF-8 international characters (`é`, `ñ`, `ü`, `ø`).
  - Invoice generation endpoint `/api/invoices/generate` must safely process these payloads and return HTTP 201 with properly escaped and structured items.
  - Regression unit tests must assert payloads with `René & Frères <Consulting>` generate valid invoice records without throwing errors.

