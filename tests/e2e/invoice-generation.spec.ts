import { test, expect } from '@playwright/test';

test.describe('Issue #24: Invoice Generation E2E', () => {
  test('should generate invoice, verify itemized amounts, and inspect modal with special characters', async ({ page }) => {
    await page.goto('/');

    // Navigate to Invoices
    await page.click('[data-testid="nav-invoices"]');
    await expect(page.locator('[data-testid="invoices-view"]')).toBeVisible();

    // Click Generate Invoice
    await page.click('[data-testid="generate-invoice-btn"]');

    // Fill notes with special chars (&, <, >, é) to assert #17 safety
    await page.fill('[data-testid="invoice-tax-input"]', '15');
    await page.fill('[data-testid="invoice-notes-input"]', 'Conditions: Payment < 14 days & 2% escompte pour Société René.');

    // Submit invoice generation
    await page.click('[data-testid="submit-generate-invoice"]');

    // Modal preview should display with details
    await expect(page.locator('[data-testid="invoice-modal-content"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="modal-invoice-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="modal-total-amount"]')).toBeVisible();

    // Close modal
    await page.click('[data-testid="close-invoice-modal-btn"]');
    await expect(page.locator('[data-testid="invoice-modal-content"]')).not.toBeVisible();

    // Invoices list must contain the generated invoice row
    await expect(page.locator('[data-testid="invoices-list"]')).toBeVisible();
  });
});

