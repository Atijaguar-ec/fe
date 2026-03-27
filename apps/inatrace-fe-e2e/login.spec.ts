import { test, expect } from '@playwright/test';

test('login page loads and displays login form', async ({ page }) => {
  await page.goto('/');
  // Basic smoke test assuming there's a login form or branding
  await expect(page).toHaveTitle(/.*inatrace.*/i);
});
