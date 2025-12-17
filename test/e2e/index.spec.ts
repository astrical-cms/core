import { test, expect } from '@playwright/test';

test('homepage has critical structural elements', async ({ page }) => {
    await page.goto('/');

    // Check for existence of main layout areas (structural check)
    await expect(page.locator('[data-name="header"]')).toHaveCount(1);
    await expect(page.locator('[data-name="layout-main"]')).toHaveCount(1);
    await expect(page.locator('[data-name="footer-container"]')).toHaveCount(1);
});
