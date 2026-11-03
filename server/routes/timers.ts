import { Hono } from 'hono';
import { getStore } from '../store';

export const timerRoutes = new Hono();

timerRoutes.get('/', async (c) => {
  const projectId = c.req.query('projectId');
  const isBilledParam = c.req.query('isBilled');
  const isBilled = isBilledParam !== undefined ? isBilledParam === 'true' : undefined;

  const store = getStore();
  const timers = await store.getTimers(projectId, isBilled);
  return c.json(timers);
});

timerRoutes.get('/active', async (c) => {
  const store = getStore();
  const activeTimer = await store.getActiveTimer();
  return c.json({ activeTimer });
});

timerRoutes.post('/start', async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    // If request body is missing or unparseable, enforce 422
    return c.json({
      error: 'Validation failed: projectId is required',
      field: 'projectId',
      code: 'MISSING_PROJECT_ID',
    }, 422);
  }

  const projectId = body?.projectId || body?.project_id;

  // Defensive validation for Bug #16 & Issue #12
  if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
    return c.json({
      error: 'Validation failed: projectId is required',
      field: 'projectId',
      code: 'MISSING_PROJECT_ID',
    }, 422);
  }

  const store = getStore();
  try {
    const timer = await store.startTimer(projectId.trim(), body?.description || '');
    return c.json(timer, 201);
  } catch (err: any) {
    if (err.statusCode === 422 || err.code === 'MISSING_PROJECT_ID') {
      return c.json({
        error: err.message,
        field: 'projectId',
        code: 'MISSING_PROJECT_ID',
      }, 422);
    }
    return c.json({ error: err.message || 'Internal server error' }, 500);
  }
});

timerRoutes.post('/:id/stop', async (c) => {
  const id = c.req.param('id');
  let description: string | undefined;
  try {
    const body = await c.req.json();
    description = body?.description;
  } catch {
    // optional body
  }

  const store = getStore();
  const timer = await store.stopTimer(id, description);
  if (!timer) {
    return c.json({ error: 'Timer entry not found' }, 404);
  }
  return c.json(timer);
});

timerRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const store = getStore();
  const deleted = await store.deleteTimer(id);
  if (!deleted) {
    return c.json({ error: 'Timer entry not found' }, 404);
  }
  return c.json({ success: true, id });
});

