import { expect, type Page, test } from '@playwright/test';

// slate-950 and slate-100 of Tailwind, the dark background and the dark main text.
const SLATE_950 = 'oklch(0.129 0.042 264.695)';
const SLATE_100 = 'oklch(0.968 0.007 247.896)';
const DARK_SURFACE = 'oklch(0.17 0.042 265)';

function shell(page: Page) {
  return page.locator('.easy-media.bg-emm-background').first();
}

async function openNewFolderModal(page: Page) {
  await page.getByRole('button', { name: 'Ajouter un nouveau dossier' }).click();
  return page.locator('[data-easy-media-overlay] section').first();
}

test('mode dark: dark palette on the shell and in the portaled modals', async ({ page }) => {
  await page.goto('http://localhost:5174/?mode=dark');
  await expect(page.locator('article').first()).toBeVisible();

  await expect(page.locator('#easy-media-react-root')).toHaveAttribute('data-emm-mode', 'dark');
  await expect(shell(page)).toHaveCSS('background-color', SLATE_950);
  await expect(shell(page)).toHaveCSS('color', SLATE_100);

  const modal = await openNewFolderModal(page);
  await expect(modal).toHaveCSS('background-color', DARK_SURFACE);
  await expect(modal).toHaveCSS('color', SLATE_100);
});

test('mode auto: follows the system setting, live', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('http://localhost:5174/?mode=auto');
  await expect(page.locator('article').first()).toBeVisible();
  await expect(shell(page)).toHaveCSS('background-color', SLATE_950);

  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('#easy-media-react-root')).toHaveAttribute('data-emm-mode', 'light');
  await expect(shell(page)).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
});

test('mode dark: the scales of the theme option are reversed', async ({ page }) => {
  await page.goto('http://localhost:5174/?theme&mode=dark');
  await expect(page.locator('article').first()).toBeVisible();

  const accent = await page.locator('#easy-media-react-root').evaluate((root) => ({
    shade50: root.style.getPropertyValue('--emm-accent-50'),
    shade500: root.style.getPropertyValue('--emm-accent-500'),
    shade950: root.style.getPropertyValue('--emm-accent-950'),
  }));
  expect(accent).toEqual({
    shade50: 'color-mix(in oklab, #6366f1 30%, black)',
    shade500: '#6366f1',
    shade950: 'color-mix(in oklab, #6366f1 8%, white)',
  });
});

test('mode dark: a host stylesheet overrides the default dark palette', async ({ page }) => {
  await page.goto('http://localhost:5174/?mode=dark');
  await page.addStyleTag({ content: '.easy-media { --emm-surface: rgb(30, 41, 59); }' });

  const modal = await openNewFolderModal(page);
  await expect(modal).toHaveCSS('background-color', 'rgb(30, 41, 59)');
});

test('mode light (default): no dark palette, even with a dark system setting', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('http://localhost:5174/');
  await expect(page.locator('article').first()).toBeVisible();

  await expect(page.locator('#easy-media-react-root')).toHaveAttribute('data-emm-mode', 'light');
  await expect(shell(page)).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
});
