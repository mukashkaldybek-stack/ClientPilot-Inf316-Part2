import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../server/app';
import { InMemoryStore } from '../server/store/inMemoryStore';
import { setStore } from '../server/store';

describe('ClientPilot Backend API Test Suite', () => {
  beforeEach(() => {
    // Reset to fresh in-memory store before each test
    setStore(new InMemoryStore());
  });

  describe('Health Check Endpoint', () => {
    it('GET /api/health returns 200 with ok status', async () => {
      const res = await app.request('/api/health');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('ok');
      expect(data.service).toBe('ClientPilot API');
      expect(data.uptime).toBeDefined();
    });
  });

  describe('Client Management CRUD (#5 & #10)', () => {
    it('GET /api/clients returns list of clients', async () => {
      const res = await app.request('/api/clients');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(1);
    });

    it('POST /api/clients creates a new client', async () => {
      const payload = {
        name: 'Globex Corporation',
        email: 'billing@globex.test',
        hourlyRate: 150,
        currency: 'USD',
      };
      const res = await app.request('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.name).toBe(payload.name);
      expect(data.email).toBe(payload.email);
      expect(data.hourlyRate).toBe(150);
      expect(data.currency).toBe('USD');
    });

    it('GET /api/clients/:id returns client details', async () => {
      const listRes = await app.request('/api/clients');
      const clients = await listRes.json();
      const firstId = clients[0].id;

      const res = await app.request(`/api/clients/${firstId}`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(firstId);
    });

    it('PUT /api/clients/:id updates client details', async () => {
      const listRes = await app.request('/api/clients');
      const clients = await listRes.json();
      const firstId = clients[0].id;

      const res = await app.request(`/api/clients/${firstId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hourlyRate: 175 }),
      });

      expect(res.status).toBe(200);
      const updated = await res.json();
      expect(updated.hourlyRate).toBe(175);
    });

    it('DELETE /api/clients/:id removes a client', async () => {
      const createRes = await app.request('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Temp Client', email: 'temp@test.com', hourlyRate: 50 }),
      });
      const created = await createRes.json();

      const deleteRes = await app.request(`/api/clients/${created.id}`, { method: 'DELETE' });
      expect(deleteRes.status).toBe(200);

      const getRes = await app.request(`/api/clients/${created.id}`);
      expect(getRes.status).toBe(404);
    });
  });

  describe('Project Management CRUD (#6 & #11)', () => {
    it('POST /api/projects creates a new project linked to a client', async () => {
      const clientsRes = await app.request('/api/clients');
      const clients = await clientsRes.json();
      const clientId = clients[0].id;

      const payload = {
        clientId,
        name: 'Mobile App Redesign',
        description: 'React Native revamp',
        status: 'active',
        budgetHours: 50,
      };

      const res = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(201);
      const project = await res.json();
      expect(project.id).toBeDefined();
      expect(project.clientId).toBe(clientId);
      expect(project.name).toBe(payload.name);
      expect(project.budgetHours).toBe(50);
    });

    it('GET /api/projects returns all projects with client metadata', async () => {
      const res = await app.request('/api/projects');
      expect(res.status).toBe(200);
      const projects = await res.json();
      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThan(0);
      expect(projects[0].clientName).toBeDefined();
    });

    it('PUT /api/projects/:id updates project status and budget', async () => {
      const listRes = await app.request('/api/projects');
      const projects = await listRes.json();
      const projId = projects[0].id;

      const res = await app.request(`/api/projects/${projId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', budgetHours: 80 }),
      });

      expect(res.status).toBe(200);
      const updated = await res.json();
      expect(updated.status).toBe('completed');
      expect(updated.budgetHours).toBe(80);
    });
  });

  describe('Time Tracking & Start/Stop (#7 & #12)', () => {
    it('POST /api/timers/start starts a new timer for a project', async () => {
      const projectsRes = await app.request('/api/projects');
      const projects = await projectsRes.json();
      const projectId = projects[0].id;

      const res = await app.request('/api/timers/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, description: 'Fixing navigation bug' }),
      });

      expect(res.status).toBe(201);
      const timer = await res.json();
      expect(timer.id).toBeDefined();
      expect(timer.projectId).toBe(projectId);
      expect(timer.endTime).toBeNull();
      expect(timer.isBilled).toBe(false);
    });

    it('GET /api/timers/active retrieves the currently running timer', async () => {
      const projectsRes = await app.request('/api/projects');
      const projects = await projectsRes.json();
      const projectId = projects[0].id;

      await app.request('/api/timers/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, description: 'Active test' }),
      });

      const res = await app.request('/api/timers/active');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.activeTimer).toBeDefined();
      expect(data.activeTimer.endTime).toBeNull();
    });

    it('POST /api/timers/:id/stop stops the active timer and computes duration', async () => {
      const projectsRes = await app.request('/api/projects');
      const projects = await projectsRes.json();
      const projectId = projects[0].id;

      const startRes = await app.request('/api/timers/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const timer = await startRes.json();

      const stopRes = await app.request(`/api/timers/${timer.id}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Finished task' }),
      });

      expect(stopRes.status).toBe(200);
      const stopped = await stopRes.json();
      expect(stopped.endTime).not.toBeNull();
      expect(stopped.durationSeconds).toBeGreaterThanOrEqual(0);
      expect(stopped.description).toBe('Finished task');
    });
  });

  describe('Invoice Generation (#8 & #13)', () => {
    it('POST /api/invoices/generate produces an itemized invoice with calculations', async () => {
      const clientsRes = await app.request('/api/clients');
      const clients = await clientsRes.json();
      const client = clients[0];

      const res = await app.request('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, taxRate: 0.1, notes: 'Net 30' }),
      });

      expect(res.status).toBe(201);
      const invoice = await res.json();
      expect(invoice.id).toBeDefined();
      expect(invoice.invoiceNumber).toMatch(/^INV-\d{4}-\d{3}$/);
      expect(invoice.clientId).toBe(client.id);
      expect(invoice.subtotal).toBeGreaterThan(0);
      expect(invoice.taxRate).toBe(0.1);
      expect(invoice.totalAmount).toBe(Math.round((invoice.subtotal * 1.1) * 100) / 100);
      expect(invoice.items.length).toBeGreaterThan(0);
    });

    it('PUT /api/invoices/:id/status updates payment status', async () => {
      const clientsRes = await app.request('/api/clients');
      const clients = await clientsRes.json();

      const genRes = await app.request('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: clients[0].id }),
      });
      const invoice = await genRes.json();

      const statusRes = await app.request(`/api/invoices/${invoice.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      });

      expect(statusRes.status).toBe(200);
      const updated = await statusRes.json();
      expect(updated.status).toBe('paid');
    });
  });

  describe('Bug Protocol Regression Tests (#16 & #17)', () => {
    it('Regression #16: Timer API must return 422 when projectId is missing or empty', async () => {
      // Case 1: Empty body
      const res1 = await app.request('/api/timers/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res1.status).toBe(422);
      const err1 = await res1.json();
      expect(err1.field).toBe('projectId');
      expect(err1.code).toBe('MISSING_PROJECT_ID');

      // Case 2: Body with only description, no projectId
      const res2 = await app.request('/api/timers/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'No project specified' }),
      });
      expect(res2.status).toBe(422);
      const err2 = await res2.json();
      expect(err2.field).toBe('projectId');

      // Case 3: Body with empty string projectId
      const res3 = await app.request('/api/timers/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: '   ' }),
      });
      expect(res3.status).toBe(422);
    });

    it('Regression #17: Invoice generation must sanitize special characters (é, &, <, >) without crashing', async () => {
      // Step 1: Create client with special characters
      const specialClientRes = await app.request('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Café & René <Solutions & Cie>',
          email: 'rene@solutions.fr',
          hourlyRate: 140,
          currency: 'EUR',
        }),
      });
      expect(specialClientRes.status).toBe(201);
      const specialClient = await specialClientRes.json();

      // Step 2: Create project with special chars
      const specialProjectRes = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: specialClient.id,
          name: 'Audit <Security & XSS> Sprint',
          description: 'Testing special characters: "Quotes", & ampersands, <tags>',
        }),
      });
      expect(specialProjectRes.status).toBe(201);
      const specialProject = await specialProjectRes.json();

      // Step 3: Log a timer entry with special characters
      const timerRes = await app.request('/api/timers/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: specialProject.id,
          description: 'Reviewing <script>alert("XSS")</script> & accents like é, è, ç',
        }),
      });
      expect(timerRes.status).toBe(201);
      const timer = await timerRes.json();
      await app.request(`/api/timers/${timer.id}/stop`, { method: 'POST' });

      // Step 4: Generate invoice with special character notes
      const invoiceRes = await app.request('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: specialClient.id,
          taxRate: 0.2,
          notes: 'Special terms: 10% discount if paid < 5 days & full rate if > 15 days.',
        }),
      });

      expect(invoiceRes.status).toBe(201);
      const invoice = await invoiceRes.json();

      // Assertions: Client name should preserve Unicode 'é' while escaping XML/HTML '<', '>', '&'
      expect(invoice.clientName).toContain('&amp;');
      expect(invoice.clientName).toContain('&lt;');
      expect(invoice.clientName).toContain('&gt;');
      expect(invoice.clientName).toContain('é');

      // Notes should be properly escaped
      expect(invoice.notes).toContain('&lt;');
      expect(invoice.notes).toContain('&gt;');
      expect(invoice.notes).toContain('&amp;');

      // Line item descriptions should be sanitized
      const itemWithXSS = invoice.items.find((i: any) => i.description.includes('&lt;script&gt;'));
      expect(itemWithXSS).toBeDefined();
      expect(itemWithXSS?.description).toContain('é, è, ç');
    });
  });
});
