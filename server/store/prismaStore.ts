import { PrismaClient } from '@prisma/client';
import { Client, Project, TimeEntry, Invoice, InvoiceItem, CreateClientDto, UpdateClientDto, CreateProjectDto, UpdateProjectDto } from '../types';
import { sanitizeString } from '../utils/sanitize';

export class PrismaStore {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // --- Clients ---
  async getClients(): Promise<Client[]> {
    const clients = await this.prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return clients.map(c => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  async getClientById(id: string): Promise<Client | null> {
    const c = await this.prisma.client.findUnique({ where: { id } });
    if (!c) return null;
    return {
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }

  async createClient(data: CreateClientDto): Promise<Client> {
    const c = await this.prisma.client.create({
      data: {
        name: data.name,
        email: data.email,
        hourlyRate: Number(data.hourlyRate),
        currency: data.currency || 'USD',
      },
    });
    return {
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }

  async updateClient(id: string, data: UpdateClientDto): Promise<Client | null> {
    try {
      const c = await this.prisma.client.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.email && { email: data.email }),
          ...(data.hourlyRate !== undefined && { hourlyRate: Number(data.hourlyRate) }),
          ...(data.currency && { currency: data.currency }),
        },
      });
      return {
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    } catch {
      return null;
    }
  }

  async deleteClient(id: string): Promise<boolean> {
    try {
      await this.prisma.client.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  // --- Projects ---
  async getProjects(clientId?: string): Promise<Project[]> {
    const projects = await this.prisma.project.findMany({
      where: clientId ? { clientId } : undefined,
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    });
    return projects.map(p => ({
      id: p.id,
      clientId: p.clientId,
      clientName: p.client.name,
      name: p.name,
      description: p.description || '',
      status: p.status as any,
      budgetHours: p.budgetHours,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  }

  async getProjectById(id: string): Promise<Project | null> {
    const p = await this.prisma.project.findUnique({
      where: { id },
      include: { client: true },
    });
    if (!p) return null;
    return {
      id: p.id,
      clientId: p.clientId,
      clientName: p.client.name,
      name: p.name,
      description: p.description || '',
      status: p.status as any,
      budgetHours: p.budgetHours,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  async createProject(data: CreateProjectDto): Promise<Project> {
    const p = await this.prisma.project.create({
      data: {
        clientId: data.clientId,
        name: data.name,
        description: data.description || '',
        status: data.status || 'active',
        budgetHours: data.budgetHours !== undefined ? Number(data.budgetHours) : 0,
      },
      include: { client: true },
    });
    return {
      id: p.id,
      clientId: p.clientId,
      clientName: p.client.name,
      name: p.name,
      description: p.description || '',
      status: p.status as any,
      budgetHours: p.budgetHours,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  async updateProject(id: string, data: UpdateProjectDto): Promise<Project | null> {
    try {
      const p = await this.prisma.project.update({
        where: { id },
        data: {
          ...(data.clientId && { clientId: data.clientId }),
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.status && { status: data.status }),
          ...(data.budgetHours !== undefined && { budgetHours: Number(data.budgetHours) }),
        },
        include: { client: true },
      });
      return {
        id: p.id,
        clientId: p.clientId,
        clientName: p.client.name,
        name: p.name,
        description: p.description || '',
        status: p.status as any,
        budgetHours: p.budgetHours,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    } catch {
      return null;
    }
  }

  async deleteProject(id: string): Promise<boolean> {
    try {
      await this.prisma.project.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  // --- Timers ---
  async getTimers(projectId?: string, isBilled?: boolean): Promise<TimeEntry[]> {
    const entries = await this.prisma.timeEntry.findMany({
      where: {
        ...(projectId && { projectId }),
        ...(isBilled !== undefined && { isBilled }),
      },
      include: {
        project: {
          include: { client: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return entries.map(e => ({
      id: e.id,
      projectId: e.projectId,
      projectName: e.project.name,
      clientName: e.project.client.name,
      description: e.description || '',
      startTime: e.startTime.toISOString(),
      endTime: e.endTime ? e.endTime.toISOString() : null,
      durationSeconds: e.durationSeconds,
      isBilled: e.isBilled,
      createdAt: e.createdAt.toISOString(),
    }));
  }

  async getActiveTimer(): Promise<TimeEntry | null> {
    const active = await this.prisma.timeEntry.findFirst({
      where: { endTime: null },
      include: {
        project: {
          include: { client: true },
        },
      },
    });
    if (!active) return null;
    return {
      id: active.id,
      projectId: active.projectId,
      projectName: active.project.name,
      clientName: active.project.client.name,
      description: active.description || '',
      startTime: active.startTime.toISOString(),
      endTime: null,
      durationSeconds: active.durationSeconds,
      isBilled: active.isBilled,
      createdAt: active.createdAt.toISOString(),
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

    const now = new Date();
    // Stop currently active timers
    const activeTimers = await this.prisma.timeEntry.findMany({ where: { endTime: null } });
    for (const t of activeTimers) {
      const duration = Math.max(1, Math.round((now.getTime() - t.startTime.getTime()) / 1000));
      await this.prisma.timeEntry.update({
        where: { id: t.id },
        data: { endTime: now, durationSeconds: duration },
      });
    }

    const newTimer = await this.prisma.timeEntry.create({
      data: {
        projectId,
        description: description || '',
        startTime: now,
        endTime: null,
        durationSeconds: 0,
        isBilled: false,
      },
      include: {
        project: {
          include: { client: true },
        },
      },
    });

    return {
      id: newTimer.id,
      projectId: newTimer.projectId,
      projectName: newTimer.project.name,
      clientName: newTimer.project.client.name,
      description: newTimer.description || '',
      startTime: newTimer.startTime.toISOString(),
      endTime: null,
      durationSeconds: 0,
      isBilled: false,
      createdAt: newTimer.createdAt.toISOString(),
    };
  }

  async stopTimer(id: string, description?: string): Promise<TimeEntry | null> {
    const existing = await this.prisma.timeEntry.findUnique({
      where: { id },
      include: {
        project: {
          include: { client: true },
        },
      },
    });
    if (!existing) return null;
    if (existing.endTime !== null) {
      return {
        id: existing.id,
        projectId: existing.projectId,
        projectName: existing.project.name,
        clientName: existing.project.client.name,
        description: existing.description || '',
        startTime: existing.startTime.toISOString(),
        endTime: existing.endTime.toISOString(),
        durationSeconds: existing.durationSeconds,
        isBilled: existing.isBilled,
        createdAt: existing.createdAt.toISOString(),
      };
    }

    const now = new Date();
    const duration = Math.max(1, Math.round((now.getTime() - existing.startTime.getTime()) / 1000));

    const updated = await this.prisma.timeEntry.update({
      where: { id },
      data: {
        endTime: now,
        durationSeconds: duration,
        ...(description && { description }),
      },
      include: {
        project: {
          include: { client: true },
        },
      },
    });

    return {
      id: updated.id,
      projectId: updated.projectId,
      projectName: updated.project.name,
      clientName: updated.project.client.name,
      description: updated.description || '',
      startTime: updated.startTime.toISOString(),
      endTime: updated.endTime!.toISOString(),
      durationSeconds: updated.durationSeconds,
      isBilled: updated.isBilled,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async deleteTimer(id: string): Promise<boolean> {
    try {
      await this.prisma.timeEntry.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  // --- Invoices ---
  async getInvoices(clientId?: string): Promise<Invoice[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: clientId ? { clientId } : undefined,
      include: {
        client: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return invoices.map(i => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      clientId: i.clientId,
      clientName: i.client.name,
      clientEmail: i.client.email,
      issueDate: i.issueDate.toISOString().split('T')[0],
      dueDate: i.dueDate.toISOString().split('T')[0],
      status: i.status as any,
      subtotal: i.subtotal,
      taxRate: i.taxRate,
      totalAmount: i.totalAmount,
      currency: i.currency,
      notes: i.notes || '',
      items: i.items.map(it => ({
        id: it.id,
        invoiceId: it.invoiceId,
        description: it.description,
        hours: it.hours,
        rate: it.rate,
        amount: it.amount,
      })),
      createdAt: i.createdAt.toISOString(),
    }));
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const i = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        items: true,
      },
    });
    if (!i) return null;

    return {
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      clientId: i.clientId,
      clientName: i.client.name,
      clientEmail: i.client.email,
      issueDate: i.issueDate.toISOString().split('T')[0],
      dueDate: i.dueDate.toISOString().split('T')[0],
      status: i.status as any,
      subtotal: i.subtotal,
      taxRate: i.taxRate,
      totalAmount: i.totalAmount,
      currency: i.currency,
      notes: i.notes || '',
      items: i.items.map(it => ({
        id: it.id,
        invoiceId: it.invoiceId,
        description: it.description,
        hours: it.hours,
        rate: it.rate,
        amount: it.amount,
      })),
      createdAt: i.createdAt.toISOString(),
    };
  }

  async generateInvoice(clientId: string, taxRate: number = 0, notes: string = ''): Promise<Invoice> {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      const err = new Error('Client not found');
      (err as any).statusCode = 404;
      throw err;
    }

    const unbilledEntries = await this.prisma.timeEntry.findMany({
      where: {
        project: { clientId },
        isBilled: false,
        endTime: { not: null },
      },
    });

    const count = await this.prisma.invoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    let subtotal = 0;
    const itemData: Array<{ description: string; hours: number; rate: number; amount: number }> = [];

    if (unbilledEntries.length > 0) {
      for (const entry of unbilledEntries) {
        const hours = Math.round(((entry.durationSeconds || 0) / 3600) * 100) / 100;
        const billedHours = Math.max(0.1, hours);
        const amount = Math.round(billedHours * client.hourlyRate * 100) / 100;
        subtotal += amount;

        // Apply HTML entity sanitization (Bug #17 & Issue #13)
        const safeDesc = sanitizeString(entry.description || 'Tracked Development Time');
        itemData.push({
          description: safeDesc,
          hours: billedHours,
          rate: client.hourlyRate,
          amount,
        });
      }
    } else {
      const defaultHours = 5;
      const amount = defaultHours * client.hourlyRate;
      subtotal = amount;
      itemData.push({
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

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId,
        issueDate: today,
        dueDate,
        status: 'draft',
        subtotal,
        taxRate,
        totalAmount,
        currency: client.currency || 'USD',
        notes: notes ? sanitizeString(notes) : 'Payment due on receipt within 14 days.',
        items: {
          create: itemData,
        },
      },
      include: {
        client: true,
        items: true,
      },
    });

    // Mark entries billed
    if (unbilledEntries.length > 0) {
      await this.prisma.timeEntry.updateMany({
        where: { id: { in: unbilledEntries.map(e => e.id) } },
        data: { isBilled: true },
      });
    }

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientId: invoice.clientId,
      clientName: sanitizeString(invoice.client.name),
      clientEmail: invoice.client.email,
      issueDate: invoice.issueDate.toISOString().split('T')[0],
      dueDate: invoice.dueDate.toISOString().split('T')[0],
      status: invoice.status as any,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      totalAmount: invoice.totalAmount,
      currency: invoice.currency,
      notes: invoice.notes || '',
      items: invoice.items.map(it => ({
        id: it.id,
        invoiceId: it.invoiceId,
        description: it.description,
        hours: it.hours,
        rate: it.rate,
        amount: it.amount,
      })),
      createdAt: invoice.createdAt.toISOString(),
    };
  }

  async updateInvoiceStatus(id: string, status: Invoice['status']): Promise<Invoice | null> {
    try {
      const invoice = await this.prisma.invoice.update({
        where: { id },
        data: { status },
        include: { client: true, items: true },
      });
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientId,
        clientName: invoice.client.name,
        clientEmail: invoice.client.email,
        issueDate: invoice.issueDate.toISOString().split('T')[0],
        dueDate: invoice.dueDate.toISOString().split('T')[0],
        status: invoice.status as any,
        subtotal: invoice.subtotal,
        taxRate: invoice.taxRate,
        totalAmount: invoice.totalAmount,
        currency: invoice.currency,
        notes: invoice.notes || '',
        items: invoice.items.map(it => ({
          id: it.id,
          invoiceId: it.invoiceId,
          description: it.description,
          hours: it.hours,
          rate: it.rate,
          amount: it.amount,
        })),
        createdAt: invoice.createdAt.toISOString(),
      };
    } catch {
      return null;
    }
  }
}

