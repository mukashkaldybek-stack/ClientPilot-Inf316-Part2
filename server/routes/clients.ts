import { Hono } from 'hono';
import { getStore } from '../store';

export const clientRoutes = new Hono();

clientRoutes.get('/', async (c) => {
  const store = getStore();
  const clients = await store.getClients();
  return c.json(clients);
});

clientRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const store = getStore();
  const client = await store.getClientById(id);
  if (!client) {
    return c.json({ error: 'Client not found' }, 404);
  }
  return c.json(client);
});

clientRoutes.post('/', async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  if (!body.name || !body.email) {
    return c.json({ error: 'Client name and email are required' }, 400);
  }

  const store = getStore();
  const client = await store.createClient({
    name: body.name,
    email: body.email,
    hourlyRate: body.hourlyRate !== undefined ? Number(body.hourlyRate) : 100,
    currency: body.currency || 'USD',
  });

  return c.json(client, 201);
});

clientRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  const store = getStore();
  const updated = await store.updateClient(id, body);
  if (!updated) {
    return c.json({ error: 'Client not found' }, 404);
  }
  return c.json(updated);
});

clientRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const store = getStore();
  const deleted = await store.deleteClient(id);
  if (!deleted) {
    return c.json({ error: 'Client not found' }, 404);
  }
  return c.json({ success: true, id });
});

