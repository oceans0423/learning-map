/* global process, console, document, innerWidth, URL */
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)(process.argv[2]);
const dir = fileURLToPath(new URL('./ui05-20261009/', import.meta.url));
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const report = { browser: browser.version(), checks: [] };
const assert = (ok, message) => { if (!ok) throw new Error(message); };
try {
  for (const width of [360,390,768,1024,1440]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, hasTouch: width < 768 });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:5181/');
    await page.getByRole('heading', { level: 1 }).waitFor();
    assert(await page.locator('.wb-personal-slot').innerText() === '', 'Empty collection content');
    assert(await page.locator('.wb-supplement').getAttribute('open') === null, 'Supplement must be folded');
    await page.screenshot({ path: dir + width + '-home.png', fullPage: true });
    await page.getByRole('button', { name: '所有課程', exact: true }).click();
    assert(await page.locator('.wb-course-list li').count() === 69, 'Incomplete list');
    const source = page.locator('.wb-course-list button').first(); await source.click();
    await page.locator('.detail-panel').waitFor();
    assert(await page.locator('.detail-panel').getAttribute('role') === (width < 1024 ? 'dialog' : 'region'), 'Wrong note mode');
    assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'Overflow');
    await page.screenshot({ path: dir + width + '-note.png', fullPage: width >= 1024 });
    await page.getByRole('button', { name: '關閉課程詳情' }).click();
    await page.waitForFunction(() => !document.querySelector('.detail-panel'));
    await page.getByRole('button', { name: '課程星圖', exact: true }).click();
    await page.setViewportSize({ width, height: 400 });
    await page.addStyleTag({ content: 'html { font-size: 200%; }' });
    assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), '200% overflow');
    assert(await page.getByRole('button', { name: '所有課程', exact: true }).isVisible(), 'Lost list entry');
    report.checks.push({ width, all69: true, note: width < 1024 ? 'modal drawer' : 'non-modal inline', lowHeight200percent: true, errors, passed: errors.length === 0 });
    assert(!errors.length, 'Runtime error'); await page.close();
  }
} finally { await writeFile(dir + 'results.json', JSON.stringify(report, null, 2)); await browser.close(); }
console.log(JSON.stringify(report));
