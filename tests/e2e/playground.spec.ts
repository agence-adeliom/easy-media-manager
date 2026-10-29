import { expect, type Page, test } from '@playwright/test';

// 2x2 PNG, enough for the upload and image editor flows.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR42mP8z8DwnwEJMDGgAQZGBgYAKGcDAZ0rL1wAAAAASUVORK5CYII=',
  'base64',
);

interface Labels {
  addNewFolder: string;
  create: string;
  uploadMain: string;
  editor: string;
  deleteMain: string;
  close: string;
  pluginAction: string;
}

const MANAGERS: { name: string; url: string; labels: Labels }[] = [
  {
    name: 'IIFE bundle (en)',
    url: 'http://localhost:3001/',
    labels: { addNewFolder: 'Add New Folder', create: 'Create', uploadMain: 'Upload', editor: 'Editor', deleteMain: 'Delete', close: 'Close', pluginAction: 'Generate alt' },
  },
  {
    name: 'ESM source (fr)',
    url: 'http://localhost:5174/',
    labels: { addNewFolder: 'Ajouter un nouveau dossier', create: 'Créer', uploadMain: 'Télécharger', editor: 'Éditeur', deleteMain: 'Supprimer', close: 'Fermer', pluginAction: "Générer l'alt" },
  },
];

// Toolbar buttons are icon-only: find them through the label of their tooltip.
function toolbarButton(page: Page, label: string) {
  return page
    .locator(`xpath=//span[contains(@class,'pointer-events-none') and normalize-space()="${label}"]/preceding-sibling::span//button`)
    .first();
}

function card(page: Page, name: string) {
  return page.locator('article').filter({ hasText: name }).first();
}

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

async function deleteItem(page: Page, labels: Labels, name: string) {
  await card(page, name).click();
  await toolbarButton(page, labels.deleteMain).click();
  await page.getByRole('button', { name: labels.deleteMain, exact: true }).last().click();
  await expect(card(page, name)).toBeHidden();
}

for (const { name, url, labels } of MANAGERS) {
  test(`${name}: browse, create, upload, edit and delete`, async ({ page }) => {
    const errors = collectErrors(page);
    const stamp = Date.now().toString(36);
    const folder = `e2e-folder-${stamp}`;
    const file = `e2e-file-${stamp}.png`;
    const bigFile = `e2e-big-${stamp}.bin`;
    const toasts = page.locator('[data-sonner-toast]');

    await test.step('loads the seeded library', async () => {
      await page.goto(url);
      await expect(card(page, 'Documents')).toBeVisible();
      await expect(card(page, 'Photos')).toBeVisible();
      expect(await page.locator('svg').count()).toBeGreaterThan(8);
    });

    await test.step('creates a folder and shows a toast', async () => {
      await toolbarButton(page, labels.addNewFolder).click();
      await page.locator('#new-folder-name').fill(folder);
      await page.getByRole('button', { name: labels.create, exact: true }).click();
      await expect(toasts.first()).toBeVisible();
      await expect(card(page, folder)).toBeVisible();
    });

    await test.step('uploads a small file', async () => {
      await toolbarButton(page, labels.uploadMain).click();
      await page.locator('input[type=file]').setInputFiles({ name: file, mimeType: 'image/png', buffer: PNG });
      await toolbarButton(page, labels.uploadMain).click();
      await expect(card(page, file)).toBeVisible();
    });

    await test.step('uploads a file in chunks', async () => {
      await toolbarButton(page, labels.uploadMain).click();
      await page.locator('input[type=file]').setInputFiles({
        name: bigFile,
        mimeType: 'application/octet-stream',
        buffer: Buffer.alloc(1536 * 1024, 7),
      });
      await toolbarButton(page, labels.uploadMain).click();
      await expect(card(page, bigFile)).toContainText('1536.00 KB');
      await deleteItem(page, labels, bigFile);
    });

    await test.step('opens the generate-alt plugin modal', async () => {
      await card(page, file).click();
      await toolbarButton(page, labels.pluginAction).click();
      const title = page.locator('[data-easy-media-overlay] header').getByText(labels.pluginAction, { exact: true });
      await expect(title).toBeVisible();
      await page.getByRole('button', { name: labels.close, exact: true }).last().click();
      await expect(title).toBeHidden();
    });

    await test.step('opens the image editor', async () => {
      await toolbarButton(page, labels.editor).click();
      await expect(page.locator('[class*="advanced-cropper"]').first()).toBeVisible();
      await page.getByRole('button', { name: labels.close, exact: true }).last().click();
      await expect(page.locator('[class*="advanced-cropper"]')).toHaveCount(0);
    });

    await test.step('deletes the file and the folder', async () => {
      await deleteItem(page, labels, file);
      await deleteItem(page, labels, folder);
    });

    await test.step('navigates into a folder', async () => {
      await card(page, 'Photos').dblclick();
      await expect(page.locator('article img').first()).toBeVisible();
    });

    expect(errors).toEqual([]);
  });
}

test('pick(): resolves with the chosen image', async ({ page }) => {
  const errors = collectErrors(page);
  const overlay = page.locator('[data-easy-media-overlay="overlay"]');

  await page.goto('http://localhost:5175/');
  await page.getByRole('button', { name: 'Browse images only…' }).click();
  await expect(overlay).toBeVisible();
  await overlay.locator('article').filter({ hasText: 'Photos' }).dblclick();
  await overlay.locator('article').filter({ has: page.locator('img') }).first().click();
  // The footer used to be pushed below the viewport (#13).
  const select = overlay.locator('footer button:not([disabled])').last();
  await expect(select).toBeInViewport();
  await select.click();
  await expect(overlay).toBeHidden();

  const result = JSON.parse((await page.locator('#result-1').textContent()) ?? '{}');
  expect(result.type).toMatch(/^image/);
  expect(errors).toEqual([]);
});

test('getFile(): reads a file by its id', async ({ page }) => {
  const errors = collectErrors(page);

  await page.goto('http://localhost:5175/');
  const [file, missing] = await page.evaluate(async () => {
    const { EasyMedia } = window as unknown as { EasyMedia: { getFile: (id: number) => Promise<unknown> } };

    return Promise.all([EasyMedia.getFile(1), EasyMedia.getFile(999999)]);
  });

  expect(file).toMatchObject({ id: 1, name: 'cliff.jpg', type: expect.stringMatching(/^image/) });
  expect(missing).toBeNull();
  // Reading does not open the picker.
  await expect(page.locator('[data-easy-media-overlay="overlay"]')).toHaveCount(0);
  expect(errors.filter((error) => !error.includes('404'))).toEqual([]);
});

test('pick(): restricts the files and the uploads to a MIME type', async ({ page }) => {
  const errors = collectErrors(page);
  const overlay = page.locator('[data-easy-media-overlay="overlay"]');
  const cards = overlay.locator('article');

  await page.goto('http://localhost:5175/');
  await page.getByRole('button', { name: 'Browse PDF files (MIME type)…' }).click();
  await expect(overlay).toBeVisible();

  await cards.filter({ hasText: 'Documents' }).dblclick();
  await expect(cards.filter({ hasText: 'sample-pdf-1.pdf' })).toBeVisible();
  await overlay.getByRole('button', { name: 'Home' }).click();
  await cards.filter({ hasText: 'Photos' }).dblclick();
  await expect(cards.filter({ hasText: 'Vacations' })).toBeVisible();
  await expect(cards.filter({ hasText: '.jpg' })).toHaveCount(0);

  await toolbarButton(page, 'Upload').click();
  const input = overlay.locator('input[type=file]');
  await expect(input).toHaveAttribute('accept', 'application/pdf');
  await input.setInputFiles([
    { name: 'refused.png', mimeType: 'image/png', buffer: PNG },
    { name: 'too-big.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(1_500_000, 7) },
  ]);
  await expect(page.locator('[data-sonner-toast]').first()).toContainText('refused.png: this file type is not allowed here.');
  await expect(page.locator('[data-sonner-toast]').first()).toContainText('too-big.pdf: the file exceeds 1 MB.');
  await toolbarButton(page, 'Upload').click();
  await expect(cards.filter({ hasText: 'refused.png' })).toHaveCount(0);
  await expect(cards.filter({ hasText: 'too-big.pdf' })).toHaveCount(0);

  expect(errors).toEqual([]);
});

test('pick(): stays inside the restrictions.path folder', async ({ page }) => {
  const errors = collectErrors(page);
  const overlay = page.locator('[data-easy-media-overlay="overlay"]');
  const cards = overlay.locator('article');
  const breadcrumb = overlay.locator('nav');

  await page.goto('http://localhost:5175/');
  await page.getByRole('button', { name: 'Browse the Photos folder only…' }).click();
  await expect(cards.filter({ hasText: 'Vacations' })).toBeVisible();
  await expect(cards.filter({ hasText: 'Documents' })).toHaveCount(0);
  await expect(breadcrumb.getByRole('button')).toHaveText(['Photos']);

  await cards.filter({ hasText: 'Vacations' }).dblclick();
  await expect(breadcrumb.getByRole('button')).toHaveText(['Photos', 'Vacations']);
  await breadcrumb.getByRole('button', { name: 'Photos' }).click();
  await expect(cards.filter({ hasText: 'Vacations' })).toBeVisible();
  // Backspace goes to the parent folder, but not above the restricted one.
  await cards.filter({ hasText: 'Vacations' }).click();
  await page.keyboard.press('Backspace');
  await expect(breadcrumb.getByRole('button')).toHaveText(['Photos']);
  await expect(cards.filter({ hasText: 'Vacations' })).toBeVisible();

  // The move modal cannot reach a destination above the restricted folder either.
  await cards.filter({ hasText: 'Vacations' }).click();
  await toolbarButton(page, 'Move (1)').click();
  const destinations = page.locator('[data-easy-media-overlay]').filter({ hasText: 'Destination Folder' }).last();
  await expect(destinations.getByRole('button', { name: 'Photos', exact: true })).toBeVisible();
  await expect(destinations.getByRole('button', { name: 'Home', exact: true })).toHaveCount(0);
  await destinations.getByRole('button', { name: 'Photos', exact: true }).click();
  await expect(destinations.getByText('Documents', { exact: true })).toHaveCount(0);
  await destinations.getByRole('button', { name: 'Cancel' }).click();

  await overlay.getByRole('button', { name: 'Cancel' }).click();
  await expect(overlay).toBeHidden();

  // The next, unrestricted session starts from the library again.
  await page.getByRole('button', { name: 'Browse media…' }).first().click();
  await expect(cards.filter({ hasText: 'Documents' })).toBeVisible();
  await expect(breadcrumb.getByRole('button')).toHaveText(['Home']);

  expect(errors).toEqual([]);
});
