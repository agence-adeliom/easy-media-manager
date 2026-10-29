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

for (const { name, url, labels } of MANAGERS) {
  test(`${name}: the host page CSS does not override the library utilities`, async ({ page }) => {
    await page.goto(url);
    // Same class names as the library utilities, unlayered, like Tabler and Bootstrap.
    await page.addStyleTag({ content: '.grid { grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 0 } .hidden { display: block }' });
    const grid = page.locator('div.grid', { has: page.locator('article') }).first();

    await expect(card(page, 'Photos')).toBeVisible();
    const style = await grid.evaluate((element) => {
      const computed = getComputedStyle(element);

      return { columns: computed.gridTemplateColumns.split(' ').length, gap: computed.rowGap };
    });
    expect(style).toEqual({ columns: 4, gap: '8px' });
    await toolbarButton(page, labels.uploadMain).click();
    await expect(page.locator('.easy-media input[type=file].hidden')).toHaveCount(1);
    await expect(page.locator('.easy-media input[type=file].hidden')).toBeHidden();
  });
}
