import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Nawras CRM/);
});

test('dashboard navigation', async ({ page }) => {
  await page.goto('/');

  // Wait for the page to load and redirect to dashboard
  await page.waitForURL('/dashboard');

  // Expects page to have a heading with the name of Dashboard.
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});