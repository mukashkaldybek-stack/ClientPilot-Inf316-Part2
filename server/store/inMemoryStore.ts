import { Client, Project, TimeEntry, Invoice, InvoiceItem, CreateClientDto, UpdateClientDto, CreateProjectDto, UpdateProjectDto } from '../types';
import { sanitizeString } from '../utils/sanitize';

export class InMemoryStore {
  private clients: Client[] = [];
  private projects: Project[] = [];
  private timers: TimeEntry[] = [];
  private invoices: Invoice[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    const c1: Client = {
      id: 'clnt_seed_1',
      name: 'Acme Global Corp',
      email: 'billing@acme.example.com',
      hourlyRate: 120,
      currency: 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const c2: Client = {
      id: 'clnt_seed_2',
      name: 'Société & Frères Consulting',
      email: 'finance@societe.fr',
      hourlyRate: 110,
      currency: 'EUR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.clients.push(c1, c2);

    const p1: Project = {
      id: 'proj_seed_1',
      clientId: c1.id,
      clientName: c1.name,
      name: 'Cloud Infrastructure Modernization',
      description: 'AWS VPC and ECS setup',
      status: 'active',
      budgetHours: 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.projects.push(p1);

    const t1: TimeEntry = {
      id: 'time_seed_1',
      projectId: p1.id,
      projectName: p1.name,
      clientName: c1.name,
      description: 'VPC and subnet architecture setup',
      startTime: new Date(Date.now() - 7200 * 1000).toISOString(),
      endTime: new Date().toISOString(),
      durationSeconds: 7200,
      isBilled: false,
      createdAt: new Date().toISOString(),
    };
    this.timers.push(t1);
  }

  // --- Clients ---
  async getClients(): Promise<Client[]> {
    return [...this.clients];
  }

  async getClientById(id: string): Promise<Client | null> {
    return this.clients.find(c => c.id === id) || null;
  }

  async createClient(data: CreateClientDto): Promise<Client> {
    const now = new Date().toISOString();
    const newClient: Client = {
      id: `clnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: data.name,
      email: data.email,
      hourlyRate: Number(data.hourlyRate),
      currency: data.currency || 'USD',
      createdAt: now,
      updatedAt: now,
    };
    this.clients.push(newClient);
    return newClient;
  }

  async updateClient(id: string, data: UpdateClientDto): Promise<Client | null> {
    const idx = this.clients.findIndex(c => c.id === id);
    if (idx === -1) return null;

    const existing = this.clients[idx];
    const updated: Client = {
      ...existing,
      name: data.name ?? existing.name,
      email: data.email ?? existing.email,
      hourlyRate: data.hourlyRate !== undefined ? Number(data.hourlyRate) : existing.hourlyRate,
      currency: data.currency ?? existing.currency,
      updatedAt: new Date().toISOString(),
    };
    this.clients[idx] = updated;

    // Cascade update clientName in projects
    this.projects.forEach(p => {
      if (p.clientId === id) p.clientName = updated.name;
    });

    return updated;
  }

  async deleteClient(id: string): Promise<boolean> {
    const prevLen = this.clients.length;
    this.clients = this.clients.filter(c => c.id !== id);
    // Cascade delete projects & timers
    const projectIds = this.projects.filter(p => p.clientId === id).map(p => p.id);
    this.projects = this.projects.filter(p => p.clientId !== id);
    this.timers = this.timers.filter(t => !projectIds.includes(t.projectId));
    return this.clients.length < prevLen;
  }

  // --- Projects ---
  async getProjects(clientId?: string): Promise<Project[]> {
    let projs = this.projects;
    if (clientId) {
      projs = projs.filter(p => p.clientId === clientId);
    }
    return projs.map(p => {
      const client = this.clients.find(c => c.id === p.clientId);
      return { ...p, clientName: client?.name || p.clientName };
    });
  }

  async getProjectById(id: string): Promise<Project | null> {
    const p = this.projects.find(p => p.id === id);
    if (!p) return null;
    const client = this.clients.find(c => c.id === p.clientId);
    return { ...p, clientName: client?.name || p.clientName };
  }

  async createProject(data: CreateProjectDto): Promise<Project> {
    const client = this.clients.find(c => c.id === data.clientId);
    const now = new Date().toISOString();
    const newProject: Project = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      clientId: data.clientId,
      clientName: client?.name,
      name: data.name,
      description: data.description || '',
      status: data.status || 'active',
      budgetHours: data.budgetHours !== undefined ? Number(data.budgetHours) : 0,
      createdAt: now,
      updatedAt: now,
    };
    this.projects.push(newProject);
    return newProject;
  }

  async updateProject(id: string, data: UpdateProjectDto): Promise<Project | null> {
    const idx = this.projects.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const existing = this.projects[idx];
    const client = data.clientId ? this.clients.find(c => c.id === data.clientId) : undefined;

    const updated: Project = {
      ...existing,
      clientId: data.clientId ?? existing.clientId,
      clientName: client ? client.name : existing.clientName,
      name: data.name ?? existing.name,
      description: data.description ?? existing.description,
      status: data.status ?? existing.status,
      budgetHours: data.budgetHours !== undefined ? Number(data.budgetHours) : existing.budgetHours,
      updatedAt: new Date().toISOString(),
    };
    this.projects[idx] = updated;
    return updated;
  }

  async deleteProject(id: string): Promise<boolean> {
    const prevLen = this.projects.length;
    this.projects = this.projects.filter(p => p.id !== id);
    this.timers = this.timers.filter(t => t.projectId !== id);
    return this.projects.length < prevLen;
  }

  // --- Timers ---
  async getTimers(projectId?: string, isBilled?: boolean): Promise<TimeEntry[]> {
    let list = this.timers;
    if (projectId) list = list.filter(t => t.projectId === projectId);
    if (isBilled !== undefined) list = list.filter(t => t.isBilled === isBilled);

    return list.map(t => {
      const proj = this.projects.find(p => p.id === t.projectId);
      const client = proj ? this.clients.find(c => c.id === proj.clientId) : undefined;
      return {
        ...t,
        projectName: proj?.name || t.projectName,
        clientName: client?.name || t.clientName,
      };
    });
  }

  async getActiveTimer(): Promise<TimeEntry | null> {
    const active = this.timers.find(t => t.endTime === null);
    if (!active) return null;
    const proj = this.projects.find(p => p.id === active.projectId);
    const client = proj ? this.clients.find(c => c.id === proj.clientId) : undefined;
    return {
      ...active,
      projectName: proj?.name,
      clientName: client?.name,
    };
  }

  async startTimer(projectId: string, description: string = ''): Promise<TimeEntry> {
    // Defensively enforce project_id requirement (Bug #16 & Issue #12)
    if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
      const err = new Error('Validation failed: projectId is required');
      (err as any).statusCode = 422;
      (err as any).code = 'MISSING_PROJECT_ID';
      (err as any).field = 'projectId';
      throw err;
    }

    const proj = this.projects.find(p => p.id === projectId);
    const client = proj ? this.clients.find(c => c.id === proj.clientId) : undefined;

    // Automatically stop any currently running timer
    const now = new Date();
    this.timers.forEach(t => {
      if (t.endTime === null) {
        t.endTime = now.toISOString();
        t.durationSeconds = Math.max(1, Math.round((now.getTime() - new Date(t.startTime).getTime()) / 1000));
      }
    });

    const newTimer: TimeEntry = {
      id: `time_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      projectName: proj?.name || 'Project Task',
      clientName: client?.name,
      description: description || '',
      startTime: now.toISOString(),
      endTime: null,
      durationSeconds: 0,
      isBilled: false,
      createdAt: now.toISOString(),
    };
    this.timers.unshift(newTimer);
    return newTimer;
  }

  async stopTimer(id: string, description?: string): Promise<TimeEntry | null> {
    const timer = this.timers.find(t => t.id === id);
    if (!timer) return null;
    if (timer.endTime !== null) return timer; // already stopped

    const now = new Date();
    timer.endTime = now.toISOString();
    timer.durationSeconds = Math.max(1, Math.round((now.getTime() - new Date(timer.startTime).getTime()) / 1000));
    if (description) timer.description = description;

    return timer;
  }

  async deleteTimer(id: string): Promise<boolean> {
    const prevLen = this.timers.length;
    this.timers = this.timers.filter(t => t.id !== id);
    return this.timers.length < prevLen;
  }

  // --- Invoices ---
  async getInvoices(clientId?: string): Promise<Invoice[]> {
    if (clientId) return this.invoices.filter(i => i.clientId === clientId);
    return [...this.invoices];
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    return this.invoices.find(i => i.id === id) || null;
  }

  async generateInvoice(clientId: string, taxRate: number = 0, notes: string = ''): Promise<Invoice> {
    const client = this.clients.find(c => c.id === clientId);
    if (!client) {
      const err = new Error('Client not found');
      (err as any).statusCode = 404;
      throw err;
    }

    const clientProjectIds = this.projects.filter(p => p.clientId === clientId).map(p => p.id);
    const unbilledEntries = this.timers.filter(
      t => clientProjectIds.includes(t.projectId) && !t.isBilled && t.endTime !== null
    );

    const invoiceId = `inv_${Date.now()}`;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(this.invoices.length + 1).padStart(3, '0')}`;

    let subtotal = 0;
    const items: InvoiceItem[] = [];

    if (unbilledEntries.length > 0) {
      for (const entry of unbilledEntries) {
        const hours = Math.round(((entry.durationSeconds || 0) / 3600) * 100) / 100;
        const billedHours = Math.max(0.1, hours);
        const amount = Math.round(billedHours * client.hourlyRate * 100) / 100;
        subtotal += amount;

        // Apply HTML entity sanitization (Bug #17 & Issue #13)
        const safeDesc = sanitizeString(entry.description || 'Tracked Development Time');

        items.push({
          id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          invoiceId,
          description: safeDesc,
          hours: billedHours,
          rate: client.hourlyRate,
          amount,
        });

        entry.isBilled = true;
      }
    } else {
      // Default 5 billable hours if no unbilled time entries
      const defaultHours = 5;
      const amount = defaultHours * client.hourlyRate;
      subtotal = amount;

      items.push({
        id: `item_${Date.now()}`,
        invoiceId,
        description: sanitizeString(`Professional Consulting Services (${client.name})`),
        hours: defaultHours,
        rate: client.hourlyRate,
        amount,
      });
    }

    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const totalAmount = Math.round((subtotal + tax) * 100) / 100;
    const today = new Date();
    const dueDate = new Date(today.getTime() + 14 * 24 * 3600 * 1000);

    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      clientId,
      clientName: sanitizeString(client.name),
      clientEmail: client.email,
      issueDate: today.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      status: 'draft',
      subtotal,
      taxRate,
      totalAmount,
      currency: client.currency || 'USD',
      notes: notes ? sanitizeString(notes) : 'Payment due on receipt within 14 days.',
      items,
      createdAt: today.toISOString(),
    };

    this.invoices.unshift(newInvoice);
    return newInvoice;
  }

  async updateInvoiceStatus(id: string, status: Invoice['status']): Promise<Invoice | null> {
    const inv = this.invoices.find(i => i.id === id);
    if (!inv) return null;
    inv.status = status;
    return inv;
  }
}
