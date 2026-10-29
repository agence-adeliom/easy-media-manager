import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';

// A host stylesheet outside any cascade layer, as in a Sylius admin: Tabler's `.grid`,
// Bootstrap's reboot margin on paragraphs, and a `.hidden` class that only sets `display`.
const HOST_CSS = `
  .grid { display: grid; gap: var(--tblr-gap, 1rem); grid-template-columns: repeat(var(--tblr-columns, 12), 1fr); grid-template-rows: repeat(var(--tblr-rows, 1), 1fr); }
  p { margin-top: 0; margin-bottom: 1rem; }
  .hidden { display: block; }
`;

// The IIFE playground page, styled with one of the published (scoped) stylesheets.
async function openWithStylesheet(page: Page, stylesheet: string) {
  const css = readFileSync(`dist/esm/${stylesheet}`, 'utf8');
  await page.route('**/dist/easy-media.css', (route) => route.fulfill({ contentType: 'text/css', body: css }));
  await page.goto('http://localhost:3001/');
  await page.addStyleTag({ content: HOST_CSS });
  await expect(page.locator('article').filter({ hasText: 'Documents' }).first()).toBeVisible();
}

async function fileGridColumns(page: Page) {
  return page
    .locator('article')
    .first()
    .evaluate((card) => getComputedStyle(card.parentElement!).gridTemplateColumns.split(' ').length);
}

async function modalTitleMarginBottom(page: Page) {
  await page
    .locator(`xpath=//span[contains(@class,'pointer-events-none') and normalize-space()="Add New Folder"]/preceding-sibling::span//button`)
    .first()
    .click();
  return page.locator('[data-easy-media-overlay] section header p').first().evaluate((title) => getComputedStyle(title).marginBottom);
}

// The file input of the upload zone carries the library's `hidden` utility.
async function uploadInputDisplay(page: Page) {
  await page.keyboard.press('Escape');
  await page
    .locator(`xpath=//span[contains(@class,'pointer-events-none') and normalize-space()="Upload"]/preceding-sibling::span//button`)
    .first()
    .click();
  return page.locator('.easy-media input[type=file]').first().evaluate((input) => getComputedStyle(input).display);
}

test('style.css: an unlayered host stylesheet overrides the library', async ({ page }) => {
  await openWithStylesheet(page, 'style.css');

  expect(await fileGridColumns(page)).toBe(12);
  expect(await modalTitleMarginBottom(page)).toBe('16px');
  expect(await uploadInputDisplay(page)).toBe('block');
});

test('style.unlayered.css: the library keeps its own styles next to an unlayered host stylesheet', async ({ page }) => {
  await openWithStylesheet(page, 'style.unlayered.css');

  expect(await fileGridColumns(page)).toBe(4);
  expect(await modalTitleMarginBottom(page)).toBe('0px');
  expect(await uploadInputDisplay(page)).toBe('none');
});
