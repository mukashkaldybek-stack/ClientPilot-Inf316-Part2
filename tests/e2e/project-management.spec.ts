import { test, expect } from '@playwright/test';

test.describe('Issue #22: Project Management E2E', () => {
  test('should navigate to projects, create a new project, and view in list', async ({ page }) => {
    await page.goto('/');

    // Navigate to Projects
    await page.click('[data-testid="nav-projects"]');
    await expect(page.locator('[data-testid="projects-view"]')).toBeVisible();

    // Click New Project button
    await page.click('[data-testid="add-project-button"]');

    // Fill Project form
    const uniqueProjectName = `Design System Revamp ${Date.now()}`;
    await page.fill('[data-testid="project-name-input"]', uniqueProjectName);
    await page.fill('[data-testid="project-desc-input"]', 'Figma to Tailwind CSS component implementation');
    await page.fill('[data-testid="project-budget-input"]', '45');
    await page.selectOption('[data-testid="project-status-select"]', 'active');

    // Submit Project
    await page.click('[data-testid="submit-project-btn"]');

    // Verify project appears in projects list
    const projectCard = page.locator('[data-testid="project-name"]', { hasText: uniqueProjectName });
    await expect(projectCard).toBeVisible({ timeout: 10000 });
  });
});

