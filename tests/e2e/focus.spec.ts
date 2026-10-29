import { expect, test } from '@playwright/test';

// The ESM playground sets, with `?theme`, the accent color #6366f1: shade 500 is the color itself.
const THEMED = 'http://localhost:5174/?theme';
const ACCENT_500 = 'rgb(99, 102, 241)';

test('focus: a focused text field shows the accent color instead of the browser outline', async ({ page }) => {
  await page.goto(THEMED);
  await expect(page.locator('article').first()).toBeVisible();

  await page.getByRole('button', { name: 'Ajouter un nouveau dossier' }).click();
  const field = page.locator('#new-folder-name');
  await field.focus();

  await expect(field).toHaveCSS('border-color', ACCENT_500);
  await expect(field).toHaveCSS('outline-style', 'none');
  expect(await field.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe('none');
});

test('focus: the search bar shows the accent color while its field is focused', async ({ page }) => {
  await page.goto(THEMED);
  await expect(page.locator('article').first()).toBeVisible();

  const field = page.getByPlaceholder('Rechercher...');
  const bar = field.locator('xpath=ancestor::label');
  await field.focus();

  await expect(bar).toHaveCSS('border-color', ACCENT_500);
  expect(await bar.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe('none');
});
