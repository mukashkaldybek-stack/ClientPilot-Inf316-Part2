import { test, expect } from '@playwright/test';

test.describe('Issue #21: Client Management E2E', () => {
  test('should navigate to clients, create a new client, and view in list', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/ClientPilot/);

    // Click Clients navigation tab
    await page.click('[data-testid="nav-clients"]');
    await expect(page.locator('[data-testid="clients-view"]')).toBeVisible();

    // Click Add Client button
    await page.click('[data-testid="add-client-button"]');

    // Fill Client form
    const uniqueClientName = `Alpha Consulting & Tech <${Date.now()}>`;
    await page.fill('[data-testid="client-name-input"]', uniqueClientName);
    await page.fill('[data-testid="client-email-input"]', `contact_${Date.now()}@alpha-tech.io`);
    await page.fill('[data-testid="client-rate-input"]', '165');
    await page.selectOption('[data-testid="client-currency-select"]', 'USD');

    // Submit form
    await page.click('[data-testid="submit-client-btn"]');

    // Verify newly added client appears in clients list
    const clientHeading = page.locator('[data-testid="client-name"]', { hasText: uniqueClientName });
    await expect(clientHeading).toBeVisible({ timeout: 10000 });
  });
});
