import { Client, Project, TimeEntry, Invoice } from './types';
import { mockService } from './mockService';

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3000';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorData: any = {};
    try {
      errorData = await res.json();
    } catch {
      errorData = { error: res.statusText };
    }
    const err = new Error(errorData.error || errorData.message || 'API request failed');
    (err as any).status = res.status;
    (err as any).data = errorData;
    throw err;
  }

  return res.json();
}

export const apiClient = {
  // Mode flag: 'api' by default in browser, fallback to 'mock' on failure
  mode: 'api' as 'api' | 'mock',

  // Clients
  async getClients(): Promise<Client[]> {
    if (this.mode === 'mock') return mockService.getClients();
    try {
      return await fetchJson<Client[]>('/api/clients');
    } catch (err) {
      console.warn('Backend unavailable, falling back to mockService', err);
      return mockService.getClients();
    }
  },

  async createClient(data: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    if (this.mode === 'mock') return mockService.createClient(data);
    try {
      return await fetchJson<Client>('/api/clients', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      if ((err as any).status) throw err;
      return mockService.createClient(data);
    }
  },

  async updateClient(id: string, data: Partial<Client>): Promise<Client> {
    if (this.mode === 'mock') return mockService.updateClient(id, data);
    try {
      return await fetchJson<Client>(`/api/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (err) {
      return mockService.updateClient(id, data);
    }
  },

  async deleteClient(id: string): Promise<boolean> {
    if (this.mode === 'mock') return mockService.deleteClient(id);
    try {
      await fetchJson(`/api/clients/${id}`, { method: 'DELETE' });
      return true;
    } catch (err) {
      return mockService.deleteClient(id);
    }
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    if (this.mode === 'mock') return mockService.getProjects();
    try {
      return await fetchJson<Project[]>('/api/projects');
    } catch (err) {
      return mockService.getProjects();
    }
  },

  async createProject(data: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    if (this.mode === 'mock') return mockService.createProject(data);
    try {
      return await fetchJson<Project>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      if ((err as any).status) throw err;
      return mockService.createProject(data);
    }
  },

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    if (this.mode === 'mock') return mockService.updateProject(id, data);
    try {
      return await fetchJson<Project>(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (err) {
      return mockService.updateProject(id, data);
    }
  },

  async deleteProject(id: string): Promise<boolean> {
    if (this.mode === 'mock') return mockService.deleteProject(id);
    try {
      await fetchJson(`/api/projects/${id}`, { method: 'DELETE' });
      return true;
    } catch (err) {
      return mockService.deleteProject(id);
    }
  },

  // Timers
  async getTimers(): Promise<TimeEntry[]> {
    if (this.mode === 'mock') return mockService.getTimers();
    try {
      return await fetchJson<TimeEntry[]>('/api/timers');
    } catch (err) {
      return mockService.getTimers();
    }
  },

  async getActiveTimer(): Promise<TimeEntry | null> {
    if (this.mode === 'mock') return mockService.getActiveTimer();
    try {
      const data = await fetchJson<{ activeTimer: TimeEntry | null }>('/api/timers/active');
      return data.activeTimer;
    } catch (err) {
      return mockService.getActiveTimer();
    }
  },

  async startTimer(projectId: string, description: string = ''): Promise<TimeEntry> {
    // Note: Bug #16 & Issue #12 enforce strict 422 if projectId is missing
    if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
      if (this.mode === 'mock') return mockService.startTimer(projectId, description);
      // Directly hit backend to ensure 422 is properly returned or validated
    }

    try {
      return await fetchJson<TimeEntry>('/api/timers/start', {
        method: 'POST',
        body: JSON.stringify({ projectId, description }),
      });
    } catch (err) {
      if ((err as any).status === 422) throw err;
      if (this.mode === 'mock') return mockService.startTimer(projectId, description);
      throw err;
    }
  },

  async stopTimer(id: string, description?: string): Promise<TimeEntry> {
    if (this.mode === 'mock') return mockService.stopTimer(id, description);
    try {
      return await fetchJson<TimeEntry>(`/api/timers/${id}/stop`, {
        method: 'POST',
        body: JSON.stringify({ description }),
      });
    } catch (err) {
      return mockService.stopTimer(id, description);
    }
  },

  async deleteTimer(id: string): Promise<boolean> {
    if (this.mode === 'mock') return mockService.deleteTimer(id);
    try {
      await fetchJson(`/api/timers/${id}`, { method: 'DELETE' });
      return true;
    } catch (err) {
      return mockService.deleteTimer(id);
    }
  },

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    if (this.mode === 'mock') return mockService.getInvoices();
    try {
      return await fetchJson<Invoice[]>('/api/invoices');
    } catch (err) {
      return mockService.getInvoices();
    }
  },

  async generateInvoice(clientId: string, taxRate: number = 0, notes: string = ''): Promise<Invoice> {
    if (this.mode === 'mock') return mockService.generateInvoice(clientId, taxRate, notes);
    try {
      return await fetchJson<Invoice>('/api/invoices/generate', {
        method: 'POST',
        body: JSON.stringify({ clientId, taxRate, notes }),
      });
    } catch (err) {
      if ((err as any).status) throw err;
      return mockService.generateInvoice(clientId, taxRate, notes);
    }
  },

  async updateInvoiceStatus(id: string, status: Invoice['status']): Promise<Invoice> {
    if (this.mode === 'mock') return mockService.updateInvoiceStatus(id, status);
    try {
      return await fetchJson<Invoice>(`/api/invoices/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      return mockService.updateInvoiceStatus(id, status);
    }
  },
};

