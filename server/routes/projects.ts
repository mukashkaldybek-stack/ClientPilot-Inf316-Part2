import { Hono } from 'hono';
import { getStore } from '../store';

export const projectRoutes = new Hono();

projectRoutes.get('/', async (c) => {
  const clientId = c.req.query('clientId');
  const store = getStore();
  const projects = await store.getProjects(clientId);
  return c.json(projects);
});

projectRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const store = getStore();
  const project = await store.getProjectById(id);
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }
  return c.json(project);
});

projectRoutes.post('/', async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  if (!body.name || !body.clientId) {
    return c.json({ error: 'Project name and clientId are required' }, 400);
  }

  const store = getStore();
  const client = await store.getClientById(body.clientId);
  if (!client) {
    return c.json({ error: 'Associated client does not exist' }, 404);
  }

  const project = await store.createProject({
    clientId: body.clientId,
    name: body.name,
    description: body.description || '',
    status: body.status || 'active',
    budgetHours: body.budgetHours !== undefined ? Number(body.budgetHours) : 0,
  });

  return c.json(project, 201);
});

projectRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  const store = getStore();
  const updated = await store.updateProject(id, body);
  if (!updated) {
    return c.json({ error: 'Project not found' }, 404);
  }
  return c.json(updated);
});

projectRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const store = getStore();
  const deleted = await store.deleteProject(id);
  if (!deleted) {
    return c.json({ error: 'Project not found' }, 404);
  }
  return c.json({ success: true, id });
});

