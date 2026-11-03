export interface Client {
  id: string;
  name: string;
  email: string;
  hourlyRate: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  name: string;
  email: string;
  hourlyRate: number;
  currency?: string;
}

export interface UpdateClientDto {
  name?: string;
  email?: string;
  hourlyRate?: number;
  currency?: string;
}

export interface Project {
  id: string;
  clientId: string;
  clientName?: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on_hold';
  budgetHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  clientId: string;
  name: string;
  description?: string;
  status?: 'active' | 'completed' | 'on_hold';
  budgetHours?: number;
}

export interface UpdateProjectDto {
  clientId?: string;
  name?: string;
  description?: string;
  status?: 'active' | 'completed' | 'on_hold';
  budgetHours?: number;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  projectName?: string;
  clientName?: string;
  description: string;
  startTime: string;
  endTime: string | null;
  durationSeconds: number;
  isBilled: boolean;
  createdAt: string;
}

export interface StartTimerDto {
  projectId: string;
  description?: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  hours: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName?: string;
  clientEmail?: string;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  subtotal: number;
  taxRate: number;
  totalAmount: number;
  currency: string;
  notes: string;
  items: InvoiceItem[];
  createdAt: string;
}

export interface GenerateInvoiceDto {
  clientId: string;
  taxRate?: number;
  notes?: string;
}

