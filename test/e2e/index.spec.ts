import { test, expect } from '@playwright/test';

test('homepage has critical structural elements', async ({ page }) => {
    await page.goto('/');

    // Check for existence of main layout areas (structural check)
    await expect(page.locator('header')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('footer')).toHaveCount(1);
});
