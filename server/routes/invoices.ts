import { Hono } from 'hono';
import { getStore } from '../store';

export const invoiceRoutes = new Hono();

invoiceRoutes.get('/', async (c) => {
  const clientId = c.req.query('clientId');
  const store = getStore();
  const invoices = await store.getInvoices(clientId);
  return c.json(invoices);
});

invoiceRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const store = getStore();
  const invoice = await store.getInvoiceById(id);
  if (!invoice) {
    return c.json({ error: 'Invoice not found' }, 404);
  }
  return c.json(invoice);
});

invoiceRoutes.post('/generate', async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  const clientId = body?.clientId || body?.client_id;
  if (!clientId || typeof clientId !== 'string' || clientId.trim() === '') {
    return c.json({ error: 'clientId is required for invoice generation' }, 400);
  }

  const taxRate = body.taxRate !== undefined ? Number(body.taxRate) : 0;
  const notes = typeof body.notes === 'string' ? body.notes : '';

  const store = getStore();
  try {
    const invoice = await store.generateInvoice(clientId.trim(), taxRate, notes);
    return c.json(invoice, 201);
  } catch (err: any) {
    if (err.statusCode === 404) {
      return c.json({ error: 'Client not found' }, 404);
    }
    return c.json({ error: err.message || 'Invoice generation failed' }, 500);
  }
});

invoiceRoutes.put('/:id/status', async (c) => {
  const id = c.req.param('id');
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  const status = body?.status;
  if (!['draft', 'sent', 'paid', 'cancelled'].includes(status)) {
    return c.json({ error: 'Invalid status value' }, 400);
  }

  const store = getStore();
  const updated = await store.updateInvoiceStatus(id, status);
  if (!updated) {
    return c.json({ error: 'Invoice not found' }, 404);
  }
  return c.json(updated);
});
