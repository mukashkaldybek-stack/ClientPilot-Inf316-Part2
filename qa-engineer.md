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
| #18 | [post-mvp] Stripe B2B subscriptions integration | N/A | N/A | N/A | **STAYS OPEN** |
| #19 | [post-mvp] NextAuth/Clerk multi-tenant authentication | N/A | N/A | N/A | **STAYS OPEN** |
| #20 | [post-mvp] Advanced Analytics Dashboard | N/A | N/A | N/A | **STAYS OPEN** |
| #21 | [e2e-test] Playwright test for Client Management | PASS | PASS | PASS | VERIFIED & CLOSED |
| #22 | [e2e-test] Playwright test for Project Management | PASS | PASS | PASS | VERIFIED & CLOSED |
| #23 | [e2e-test] Playwright test for Time Tracking | PASS | PASS | PASS | VERIFIED & CLOSED |
| #24 | [e2e-test] Playwright test for Invoice Generation | PASS | PASS | PASS | VERIFIED & CLOSED |

---

## 4. Standard QA Issue Closure Notice
Every closed issue is resolved and tagged using the official verification statement:
`"✅ Verified by qa-engineer.md — Acceptance criteria: PASS | Regression tests: PASS | Manual E2E: PASS. Closing issue."`
Issues 18, 19, and 20 remain open for post-MVP enhancements.
