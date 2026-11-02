import { expect, type Page, test } from '@playwright/test';

// Seeded library: Photos (dive, night-sky, paris) › Vacations (cliff, desert, sea-500K), Documents (sample-pdf-1, sample-pdf-2).

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  return errors;
}

function card(page: Page, name: string) {
  return page.locator('article').filter({ hasText: name }).first();
}

test('search: looks in the whole library by default, and in the current folder on demand', async ({ page }) => {
  const errors = collectErrors(page);
  const search = page.getByPlaceholder('Rechercher dans la médiathèque...');
  const scope = page.getByRole('radiogroup', { name: 'Rechercher dans' });

  await page.goto('http://localhost:5174/');
  await expect(card(page, 'Documents')).toBeVisible();
  // No search: the breadcrumb, without scope.
  await expect(scope).toHaveCount(0);

  await search.fill('sample');
  await expect(scope.getByRole('radio', { name: 'Toute la médiathèque' })).toBeChecked();
  await expect(page.locator('nav')).toContainText('2 résultats');
  // Each result names its folder.
  await expect(card(page, 'sample-pdf-1.pdf').getByRole('button', { name: 'Ouvrir le dossier Documents' })).toBeVisible();
  await expect(card(page, 'sample-pdf-2.pdf')).toBeVisible();

  // The root only holds folders: nothing found there.
  await scope.getByRole('radio', { name: 'Racine' }).click();
  await expect(page.getByText('Aucun résultat', { exact: true })).toBeVisible();
  await expect(page.locator('article')).toHaveCount(0);

  await scope.getByRole('radio', { name: 'Toute la médiathèque' }).click();
  await expect(card(page, 'sample-pdf-1.pdf')).toBeVisible();

  // Opening the folder of a result ends the search.
  await card(page, 'sample-pdf-1.pdf').getByRole('button', { name: 'Ouvrir le dossier Documents' }).click();
  await expect(scope).toHaveCount(0);
  await expect(page.locator('nav').getByRole('button')).toHaveText(['Racine', 'Documents']);
  await expect(search).toHaveValue('');
  await expect(card(page, 'sample-pdf-2.pdf')).toBeVisible();

  expect(errors).toEqual([]);
});

test('search: finds a file below the current folder, with its path', async ({ page }) => {
  const errors = collectErrors(page);
  const scope = page.getByRole('radiogroup', { name: 'Rechercher dans' });

  await page.goto('http://localhost:5174/');
  await card(page, 'Photos').dblclick();
  await expect(card(page, 'dive.jpg')).toBeVisible();

  const search = page.getByPlaceholder('Rechercher dans la médiathèque...');
  await search.fill('cliff');
  await expect(card(page, 'cliff.jpg').getByRole('button', { name: 'Ouvrir le dossier Photos › Vacations' })).toBeVisible();

  // cliff.jpg is in Vacations, not in Photos itself.
  await scope.getByRole('radio', { name: 'Photos' }).click();
  await expect(page.getByPlaceholder('Rechercher dans Photos...')).toHaveValue('cliff');
  await expect(page.locator('article')).toHaveCount(0);

  // Escape ends the search and shows the folder again; the next search starts from the whole library.
  await page.getByPlaceholder('Rechercher dans Photos...').press('Escape');
  await expect(scope).toHaveCount(0);
  await expect(search).toHaveValue('');
  await expect(page.locator('nav').getByRole('button')).toHaveText(['Racine', 'Photos']);
  await expect(card(page, 'dive.jpg')).toBeVisible();

  expect(errors).toEqual([]);
});

test('search: the whole library search starts at 2 characters', async ({ page }) => {
  await page.goto('http://localhost:5174/');
  await expect(card(page, 'Documents')).toBeVisible();

  await page.getByPlaceholder('Rechercher dans la médiathèque...').fill('s');
  await expect(page.getByText('Saisissez au moins 2 caractères pour chercher dans toute la médiathèque.')).toBeVisible();
  await expect(page.locator('article')).toHaveCount(0);
});

test('pick(): the library search stays inside restrictions.path and restrictions.types', async ({ page }) => {
  const errors = collectErrors(page);
  const overlay = page.locator('[data-easy-media-overlay="overlay"]');
  const cards = overlay.locator('article');
  const scope = overlay.getByRole('radiogroup', { name: 'Search in' });

  await page.goto('http://localhost:5175/');
  await page.getByRole('button', { name: 'Browse the Photos folder only…' }).click();
  await expect(cards.filter({ hasText: 'Vacations' })).toBeVisible();

  const search = overlay.getByPlaceholder('Search in all of Photos...');
  await search.fill('.jpg');
  await expect(scope.getByRole('radio', { name: 'All of Photos' })).toBeChecked();
  await expect(cards).toHaveCount(6);
  await search.fill('sample');
  await expect(cards).toHaveCount(0);

  // A result can be chosen like any file.
  await search.fill('cliff');
  await cards.filter({ hasText: 'cliff.jpg' }).click();
  await overlay.locator('footer button:not([disabled])').last().click();
  await expect(overlay).toBeHidden();
  expect(JSON.parse((await page.locator('#result-1').textContent()) ?? '{}')).toMatchObject({ name: 'cliff.jpg' });

  // Images only: the PDF found by name is not offered.
  await page.getByRole('button', { name: 'Browse images only…' }).click();
  await overlay.getByPlaceholder('Search in the library...').fill('sample');
  await expect(overlay.getByText('No results', { exact: true })).toBeVisible();
  await expect(cards).toHaveCount(0);

  expect(errors).toEqual([]);
});
