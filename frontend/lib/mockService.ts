import { Client, Project, TimeEntry, Invoice, InvoiceItem } from './types';

// Initial Mock Seed Data
let mockClients: Client[] = [
  {
    id: 'clnt_1',
    name: 'Acme Global Innovations',
    email: 'contact@acme.example.com',
    hourlyRate: 120,
    currency: 'USD',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'clnt_2',
    name: 'Société & Frères Tech <Paris>',
    email: 'contact@societe-tech.fr',
    hourlyRate: 110,
    currency: 'EUR',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'clnt_3',
    name: 'Nordic Clean Design ApS',
    email: 'hello@nordicdesign.dk',
    hourlyRate: 95,
    currency: 'USD',
    createdAt: new Date().toISOString(),
  },
];

let mockProjects: Project[] = [
  {
    id: 'proj_1',
    clientId: 'clnt_1',
    clientName: 'Acme Global Innovations',
    name: 'Cloud Infrastructure Modernization',
    description: 'Migration to AWS serverless architecture with Docker',
    status: 'active',
    budgetHours: 80,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'proj_2',
    clientId: 'clnt_2',
    clientName: 'Société & Frères Tech <Paris>',
    name: 'Mobile App API Integration',
    description: 'GraphQL & Hono microservice backend development',
    status: 'active',
    budgetHours: 40,
    createdAt: new Date().toISOString(),
  },
];

let mockTimers: TimeEntry[] = [
  {
    id: 'time_1',
    projectId: 'proj_1',
    projectName: 'Cloud Infrastructure Modernization',
    clientName: 'Acme Global Innovations',
    description: 'Terraform and CloudFormation templates initial review',
    startTime: new Date(Date.now() - 3600 * 2.5 * 1000).toISOString(),
    endTime: new Date(Date.now() - 3600 * 0.5 * 1000).toISOString(),
    durationSeconds: 7200,
    isBilled: false,
    createdAt: new Date().toISOString(),
  },
];

let mockInvoices: Invoice[] = [];

// Helper sanitization
function sanitize(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const mockService = {
  // Clients
  async getClients(): Promise<Client[]> {
    return [...mockClients];
  },
  async createClient(data: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    const newClient: Client = {
      ...data,
      id: `clnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    mockClients.push(newClient);
    return newClient;
  },
  async updateClient(id: string, data: Partial<Client>): Promise<Client> {
    const idx = mockClients.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Client not found');
    mockClients[idx] = { ...mockClients[idx], ...data, updatedAt: new Date().toISOString() };
    return mockClients[idx];
  },
  async deleteClient(id: string): Promise<boolean> {
    mockClients = mockClients.filter(c => c.id !== id);
    return true;
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    return mockProjects.map(p => {
      const client = mockClients.find(c => c.id === p.clientId);
      return { ...p, clientName: client?.name || 'Unknown Client' };
    });
  },
  async createProject(data: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    const client = mockClients.find(c => c.id === data.clientId);
    const newProject: Project = {
      ...data,
      clientName: client?.name,
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    mockProjects.push(newProject);
    return newProject;
  },
  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const idx = mockProjects.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Project not found');
    mockProjects[idx] = { ...mockProjects[idx], ...data, updatedAt: new Date().toISOString() };
    return mockProjects[idx];
  },
  async deleteProject(id: string): Promise<boolean> {
    mockProjects = mockProjects.filter(p => p.id !== id);
    return true;
  },

  // Timers
  async getTimers(): Promise<TimeEntry[]> {
    return mockTimers.map(t => {
      const project = mockProjects.find(p => p.id === t.projectId);
      const client = project ? mockClients.find(c => c.id === project.clientId) : undefined;
      return {
        ...t,
        projectName: project?.name || 'Unknown Project',
        clientName: client?.name || 'Unknown Client',
      };
    });
  },
  async getActiveTimer(): Promise<TimeEntry | null> {
    const active = mockTimers.find(t => !t.endTime);
    if (!active) return null;
    const project = mockProjects.find(p => p.id === active.projectId);
    const client = project ? mockClients.find(c => c.id === project.clientId) : undefined;
    return {
      ...active,
      projectName: project?.name,
      clientName: client?.name,
    };
  },
  async startTimer(projectId: string, description: string = ''): Promise<TimeEntry> {
    if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
      const err = new Error('Validation failed: projectId is required');
      (err as any).status = 422;
      (err as any).field = 'projectId';
      throw err;
    }
    // Stop any existing running timer
    const now = new Date();
    mockTimers.forEach(t => {
      if (!t.endTime) {
        t.endTime = now.toISOString();
        t.durationSeconds = Math.max(1, Math.round((now.getTime() - new Date(t.startTime).getTime()) / 1000));
      }
    });

    const project = mockProjects.find(p => p.id === projectId);
    const client = project ? mockClients.find(c => c.id === project.clientId) : undefined;

    const newTimer: TimeEntry = {
      id: `time_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      projectName: project?.name,
      clientName: client?.name,
      description: description || 'Tracked task',
      startTime: now.toISOString(),
      endTime: null,
      isBilled: false,
      createdAt: now.toISOString(),
    };
    mockTimers.unshift(newTimer);
    return newTimer;
  },
  async stopTimer(id: string, description?: string): Promise<TimeEntry> {
    const timer = mockTimers.find(t => t.id === id);
    if (!timer) throw new Error('Timer not found');
    const now = new Date();
    timer.endTime = now.toISOString();
    timer.durationSeconds = Math.max(1, Math.round((now.getTime() - new Date(timer.startTime).getTime()) / 1000));
    if (description) timer.description = description;
    return timer;
  },
  async deleteTimer(id: string): Promise<boolean> {
    mockTimers = mockTimers.filter(t => t.id !== id);
    return true;
  },

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return [...mockInvoices];
  },
  async generateInvoice(clientId: string, taxRate: number = 0, notes: string = ''): Promise<Invoice> {
    const client = mockClients.find(c => c.id === clientId);
    if (!client) throw new Error('Client not found');

    const clientProjects = mockProjects.filter(p => p.clientId === clientId).map(p => p.id);
    const unbilledEntries = mockTimers.filter(t => clientProjects.includes(t.projectId) && !t.isBilled && t.endTime);

    const invoiceId = `inv_${Date.now()}`;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(mockInvoices.length + 1).padStart(3, '0')}`;

    let subtotal = 0;
    const items: InvoiceItem[] = [];

    if (unbilledEntries.length > 0) {
      for (const entry of unbilledEntries) {
        const hours = Math.round(((entry.durationSeconds || 0) / 3600) * 100) / 100;
        const amount = Math.round(hours * client.hourlyRate * 100) / 100;
        subtotal += amount;

        // Apply special character sanitization
        const safeDesc = sanitize(entry.description || 'Consulting hours');

        items.push({
          id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          invoiceId,
          description: safeDesc,
          hours: Math.max(0.1, hours),
          rate: client.hourlyRate,
          amount: Math.max(0.1 * client.hourlyRate, amount),
        });

        // Mark as billed
        entry.isBilled = true;
      }
    } else {
      // Default line item if no unbilled entries exist
      const defaultAmount = client.hourlyRate * 5;
      subtotal = defaultAmount;
      items.push({
        id: `item_${Date.now()}`,
        invoiceId,
        description: sanitize(`Professional Services (${client.name})`),
        hours: 5,
        rate: client.hourlyRate,
        amount: defaultAmount,
      });
    }

    const totalAmount = Math.round((subtotal + subtotal * taxRate) * 100) / 100;
    const today = new Date();
    const dueDate = new Date(today.getTime() + 14 * 24 * 3600 * 1000);

    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      clientId,
      clientName: sanitize(client.name),
      clientEmail: client.email,
      issueDate: today.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      status: 'draft',
      subtotal,
      taxRate,
      totalAmount,
      currency: client.currency || 'USD',
      notes: notes ? sanitize(notes) : 'Payment due within 14 days.',
      items,
      createdAt: today.toISOString(),
    };

    mockInvoices.unshift(newInvoice);
    return newInvoice;
  },
  async updateInvoiceStatus(id: string, status: Invoice['status']): Promise<Invoice> {
    const inv = mockInvoices.find(i => i.id === id);
    if (!inv) throw new Error('Invoice not found');
    inv.status = status;
    return inv;
  },
};
