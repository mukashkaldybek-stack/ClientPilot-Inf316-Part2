import { InMemoryStore } from './inMemoryStore';
import { PrismaStore } from './prismaStore';

export interface DataStore {
  getClients(): Promise<any[]>;
  getClientById(id: string): Promise<any | null>;
  createClient(data: any): Promise<any>;
  updateClient(id: string, data: any): Promise<any | null>;
  deleteClient(id: string): Promise<boolean>;

  getProjects(clientId?: string): Promise<any[]>;
  getProjectById(id: string): Promise<any | null>;
  createProject(data: any): Promise<any>;
  updateProject(id: string, data: any): Promise<any | null>;
  deleteProject(id: string): Promise<boolean>;

  getTimers(projectId?: string, isBilled?: boolean): Promise<any[]>;
  getActiveTimer(): Promise<any | null>;
  startTimer(projectId: string, description?: string): Promise<any>;
  stopTimer(id: string, description?: string): Promise<any | null>;
  deleteTimer(id: string): Promise<boolean>;

  getInvoices(clientId?: string): Promise<any[]>;
  getInvoiceById(id: string): Promise<any | null>;
  generateInvoice(clientId: string, taxRate?: number, notes?: string): Promise<any>;
  updateInvoiceStatus(id: string, status: any): Promise<any | null>;
}

let activeStore: DataStore | null = null;
const fallbackStore = new InMemoryStore();

class ResilientStore implements DataStore {
  private primary: PrismaStore | null = null;
  private fallback: InMemoryStore = fallbackStore;

  constructor() {
    if (process.env.USE_IN_MEMORY !== 'true' && process.env.DATABASE_URL?.startsWith('postgres')) {
      try {
        this.primary = new PrismaStore();
      } catch {
        this.primary = null;
      }
    }
  }

  private async execute<T>(fn: (store: DataStore) => Promise<T>): Promise<T> {
    if (this.primary && process.env.USE_IN_MEMORY !== 'true') {
      try {
        return await fn(this.primary);
      } catch (err: any) {
        // If Postgres is down or ECONNREFUSED, fallback to InMemoryStore seamlessly
        if (
          err?.message?.includes('ECONNREFUSED') ||
          err?.message?.includes('connect') ||
          err?.name === 'PrismaClientInitializationError' ||
          err?.name === 'PrismaClientKnownRequestError'
        ) {
          return await fn(this.fallback);
        }
        throw err;
      }
    }
    return await fn(this.fallback);
  }

  getClients() { return this.execute(s => s.getClients()); }
  getClientById(id: string) { return this.execute(s => s.getClientById(id)); }
  createClient(data: any) { return this.execute(s => s.createClient(data)); }
  updateClient(id: string, data: any) { return this.execute(s => s.updateClient(id, data)); }
  deleteClient(id: string) { return this.execute(s => s.deleteClient(id)); }

  getProjects(clientId?: string) { return this.execute(s => s.getProjects(clientId)); }
  getProjectById(id: string) { return this.execute(s => s.getProjectById(id)); }
  createProject(data: any) { return this.execute(s => s.createProject(data)); }
  updateProject(id: string, data: any) { return this.execute(s => s.updateProject(id, data)); }
  deleteProject(id: string) { return this.execute(s => s.deleteProject(id)); }

  getTimers(projectId?: string, isBilled?: boolean) { return this.execute(s => s.getTimers(projectId, isBilled)); }
  getActiveTimer() { return this.execute(s => s.getActiveTimer()); }
  startTimer(projectId: string, description?: string) { return this.execute(s => s.startTimer(projectId, description)); }
  stopTimer(id: string, description?: string) { return this.execute(s => s.stopTimer(id, description)); }
  deleteTimer(id: string) { return this.execute(s => s.deleteTimer(id)); }

  getInvoices(clientId?: string) { return this.execute(s => s.getInvoices(clientId)); }
  getInvoiceById(id: string) { return this.execute(s => s.getInvoiceById(id)); }
  generateInvoice(clientId: string, taxRate?: number, notes?: string) { return this.execute(s => s.generateInvoice(clientId, taxRate, notes)); }
  updateInvoiceStatus(id: string, status: any) { return this.execute(s => s.updateInvoiceStatus(id, status)); }
}

export function getStore(): DataStore {
  if (!activeStore) {
    activeStore = new ResilientStore();
  }
  return activeStore;
}

export function setStore(store: DataStore) {
  activeStore = store;
}
