# ClientPilot — v0 Prompt Specification (`v0_prompt.md`)

## Prompt for v0 (AI Component Generator)

You are building the complete frontend UI for **ClientPilot**, a modern, minimalist micro-SaaS dashboard tailored for freelancers.
Tech Stack: Next.js 14 (App Router), Tailwind CSS, Lucide React icons, and shadcn/ui design patterns.

### Visual Aesthetic & Theme
* Clean, professional SaaS design inspired by Linear, Stripe, and Vercel.
* Dark-mode ready color palette: Slate-900 background, Slate-800 cards, Emerald-500 accent for active timers, Violet-600 primary buttons.
* Crisp typography with Inter font, rounded-lg borders, subtle shadows, and responsive grid layouts.

### Screen Layout & Structure
1. **Top Navigation Bar**:
   - Brand Logo: "ClientPilot" with an electric paper plane or clock icon.
   - Active Timer Indicator: A glowing pill showing currently running project name, running counter (`00:14:32`), and a red "Stop" button.
   - Quick Action: "New Client", "New Project", or "Quick Timer" dropdown.
   - Navigation Tabs:
     - 📊 Overview
     - 👥 Clients
     - 📁 Projects
     - ⏱️ Time Tracker
     - 🧾 Invoices

2. **Overview Tab**:
   - 4 Metric KPI Cards:
     - Total Tracked Hours (e.g., `42.5 hrs` this month)
     - Active Projects (e.g., `4 active`)
     - Unbilled Amount (e.g., `$3,420.00`)
     - Paid Invoices (e.g., `$8,950.00`)
   - Recent Activity Feed & Active Timer Quick Bar.

3. **Clients Tab**:
   - Header with search filter and "Add Client" dialog modal.
   - Client Card Grid / Table:
     - Client Name & Avatar initial
     - Email & Preferred Currency ($ / € / £)
     - Default Hourly Rate ($120/hr)
     - Action buttons: "Edit", "Delete", "View Invoices".
   - Add/Edit Client Modal Form with inputs: Client Name, Email, Hourly Rate, Currency dropdown.

4. **Projects Tab**:
   - Project List with Client Tag, Status Badge (`active`, `completed`, `on_hold`).
   - Budget progress bar: `Tracked Hours / Budget Hours` with percentage indicator.
   - "New Project" button opening modal: Project Name, Client select dropdown, Budget Hours, Description.

5. **Time Tracker Tab**:
   - Prominent "Start New Timer" control bar:
     - Project Selector (dropdown of active projects).
     - Description input (e.g., "Designing high-fidelity checkout mockups").
     - Big Start/Stop button.
   - Live ticker with animated pulse when timer is active.
   - Time Logs History Table:
     - Date & Time range
     - Project & Client name
     - Description
     - Duration (`01:45:00`)
     - Billable tag (`Unbilled` in amber, `Billed` in emerald)
     - Delete action.

6. **Invoices Tab**:
   - "Generate Invoice" action button opening invoice generator dialog:
     - Select Client (aggregates all unbilled hours for this client).
     - Tax Rate input (default 0%).
     - Custom notes.
     - Line items preview table.
     - Subtotal, Tax, Total calculation.
   - Invoices List:
     - Invoice Number (`INV-2026-001`)
     - Client Name (must render special characters safely: `Société & Frères`, `Café René`)
     - Date & Due Date
     - Total Amount
     - Status Badge (`Draft`, `Sent`, `Paid`)
     - Actions: "View / Print", "Mark as Paid".
   - Printable / Downloadable Invoice Modal showing formal invoice template with company header, itemized hours, rate, total, and payment instructions.

### State Management & Props
* Built with clean React state hooks or local mock service.
* Fully interactive: adding a client immediately updates the project dropdown; starting a timer updates the running counter; stopping logs a time entry; generating an invoice displays the new invoice and marks entries as billed.

