import { test, expect } from '@playwright/test';

test.describe('Issue #23: Time Tracking E2E', () => {
  test('should start timer, verify live clock, and stop timer logging entry', async ({ page }) => {
    await page.goto('/');

    // Navigate to Time Tracker
    await page.click('[data-testid="nav-timers"]');
    await expect(page.locator('[data-testid="timer-view"]')).toBeVisible();

    // Select first project in dropdown if available
    const projectSelect = page.locator('[data-testid="timer-project-select"]');
    await projectSelect.waitFor({ state: 'visible' });

    // Pick second option (first real project)
    await projectSelect.selectOption({ index: 1 });

    const taskDesc = `API Benchmark & Optimization ${Date.now()}`;
    await page.fill('[data-testid="timer-desc-input"]', taskDesc);

    // Click Start
    await page.click('[data-testid="start-timer-btn"]');

    // Verify Active Timer Box and live ticker
    await expect(page.locator('[data-testid="active-timer-box"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="live-timer-counter"]')).toBeVisible();

    // Wait 2 seconds to accumulate duration
    await page.waitForTimeout(2000);

    // Click Stop Timer
    await page.click('[data-testid="stop-timer-btn"]');

    // Verify timer stopped and entry appears in table
    const loggedEntry = page.locator('[data-testid="entry-desc"]', { hasText: taskDesc });
    await expect(loggedEntry).toBeVisible({ timeout: 10000 });
  });
});
