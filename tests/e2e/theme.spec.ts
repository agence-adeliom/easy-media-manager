import { expect, test } from '@playwright/test';

// The ESM playground sets, with `?theme`: { accent: '#6366f1', font: 'Georgia, serif', tokens: { toolbar: '#312e81' } }.
const THEMED = 'http://localhost:5174/?theme';

function toolbar(page: import('@playwright/test').Page) {
  return page.locator('.easy-media .emm\\:bg-emm-toolbar').first();
}

test('theme: sets the scales, the font and the tokens on the whole manager, modals included', async ({ page }) => {
  await page.goto(THEMED);
  await expect(page.locator('article').first()).toBeVisible();

  await expect(toolbar(page)).toHaveCSS('background-color', 'rgb(49, 46, 129)');
  await expect(page.locator('article').first()).toHaveCSS('font-family', 'Georgia, serif');

  // Shade 500 is the accent color itself, the others are mixed from it.
  const accent = await page.locator('#easy-media-react-root').evaluate((root) => ({
    shade500: root.style.getPropertyValue('--emm-accent-500'),
    shade700: root.style.getPropertyValue('--emm-accent-700'),
  }));
  expect(accent).toEqual({ shade500: '#6366f1', shade700: 'color-mix(in oklab, #6366f1 75%, black)' });

  // The active "bulk selection" button uses accent-700; the modal title, rendered in a portal, the font.
  await page.getByRole('button', { name: 'Sélection groupée' }).click();
  await page.mouse.move(0, 0); // accent-600 on hover
  const accent700 = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'color-mix(in oklab, #6366f1 75%, black)';
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  await expect(page.getByRole('button', { name: 'Sélection groupée' })).toHaveCSS('background-color', accent700);
  await page.getByRole('button', { name: 'Ajouter un nouveau dossier' }).click();
  await expect(page.locator('[data-easy-media-overlay] section header p').first()).toHaveCSS('font-family', 'Georgia, serif');
});

test('theme: wins over the host stylesheet, and leaves the tokens it does not set to it', async ({ page }) => {
  await page.goto(THEMED);
  await page.addStyleTag({ content: '.easy-media { --emm-toolbar: rgb(255, 0, 0); --emm-surface: rgb(254, 243, 199); }' });
  await expect(page.locator('article').first()).toBeVisible();

  await expect(toolbar(page)).toHaveCSS('background-color', 'rgb(49, 46, 129)');
  await expect(page.getByRole('button', { name: 'Actualiser' })).toHaveCSS('background-color', 'rgb(254, 243, 199)');
});

test('theme: without it, the manager keeps the default colors', async ({ page }) => {
  await page.goto('http://localhost:5174/');
  await expect(page.locator('article').first()).toBeVisible();

  expect(await page.locator('#easy-media-react-root').getAttribute('style')).toBe('display: contents;');
  await expect(toolbar(page)).toHaveCSS('background-color', 'oklch(0.371 0 none)');
});
