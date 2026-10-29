import { expect, test } from '@playwright/test';

test('tooltip: the toolbar tooltips stay on one line, below the toolbar', async ({ page }) => {
  await page.goto('http://localhost:5174/');
  await expect(page.locator('article').first()).toBeVisible();

  const button = page.getByRole('button', { name: 'Télécharger', exact: true });
  const tooltip = button.locator('xpath=../following-sibling::span');
  await button.hover();
  await expect(tooltip).toBeVisible();

  // A host page usually puts the manager right under its header: a tooltip above the toolbar would be cut off.
  const tooltipBox = (await tooltip.boundingBox())!;
  const buttonBox = (await button.boundingBox())!;
  expect(tooltipBox.height).toBeLessThan(30);
  expect(tooltipBox.y).toBeGreaterThan(buttonBox.y + buttonBox.height);
  // The first buttons sit on the left edge of the manager: a centered tooltip would overflow it.
  expect(tooltipBox.x).toBeGreaterThanOrEqual(buttonBox.x);
});

test('tooltip: the tooltip of a file card stays on one line', async ({ page }) => {
  await page.goto('http://localhost:5174/');
  await page.locator('article').filter({ hasText: 'Photos' }).first().dblclick();
  await expect(page.locator('article img').first()).toBeVisible();
  const button = page.getByRole('button', { name: 'Copier le lien', exact: true }).first();
  await button.hover();
  const tooltip = button.locator('xpath=../following-sibling::span');
  await expect(tooltip).toBeVisible();

  expect((await tooltip.boundingBox())!.height).toBeLessThan(30);
});
