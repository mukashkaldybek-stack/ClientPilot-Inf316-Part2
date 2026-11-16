import { Hono } from 'hono';
import { getStore } from '../store';
import { updateActiveTimersCount, recordTimeTracked } from '../metrics';
import { withSpan } from '../telemetry';

export const timerRoutes = new Hono();

timerRoutes.get('/', async (c) => {
  const projectId = c.req.query('projectId');
  const isBilledParam = c.req.query('isBilled');
  const isBilled = isBilledParam !== undefined ? isBilledParam === 'true' : undefined;

  const store = getStore();
  const timers = await withSpan('timers.list', async () => {
    return await store.getTimers(projectId, isBilled);
  });
  return c.json(timers);
});

timerRoutes.get('/active', async (c) => {
  const store = getStore();
  const activeTimer = await withSpan('timers.get_active', async () => {
    return await store.getActiveTimer();
  });
  updateActiveTimersCount(activeTimer ? 1 : 0);
  return c.json({ activeTimer });
});

timerRoutes.post('/start', async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
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
    const timer = await withSpan('timers.start', async () => {
      return await store.startTimer(projectId.trim(), body?.description || '');
    }, { projectId: projectId.trim() });
    updateActiveTimersCount(1);
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
  } catch {}

  const store = getStore();
  const timer = await withSpan('timers.stop', async () => {
    return await store.stopTimer(id, description);
  }, { timerId: id });

  if (!timer) {
    return c.json({ error: 'Timer entry not found' }, 404);
  }

  // Record tracked hours metric
  const hours = ((timer.durationSeconds || 0) / 3600);
  recordTimeTracked(hours > 0 ? hours : 0.05, timer.projectId, timer.clientName || 'Client');
  updateActiveTimersCount(0);

  return c.json(timer);
});

timerRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const store = getStore();
  const deleted = await withSpan('timers.delete', async () => {
    return await store.deleteTimer(id);
  }, { timerId: id });

  if (!deleted) {
    return c.json({ error: 'Timer entry not found' }, 404);
  }
  return c.json({ success: true, id });
});
