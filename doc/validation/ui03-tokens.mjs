/* global process, console, document, getComputedStyle, innerWidth, URL */
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)(process.argv[2]);
const dir = fileURLToPath(new URL('./ui03-20261009/', import.meta.url));
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const results = { browser: browser.version(), device: 'Chrome headless; emulated touch, not physical device', checks: [] };
try {
  for (const width of [360, 390, 768, 1024, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    await page.goto('http://127.0.0.1:5181/doc/validation/ui-tokens.html');
    for (const reducedMotion of ['no-preference', 'reduce']) {
      await page.emulateMedia({ reducedMotion });
      const data = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        duration: getComputedStyle(document.documentElement).getPropertyValue('--ui-duration-panel').trim(),
        font: getComputedStyle(document.body).fontSize,
        surfaces: document.querySelectorAll('.ui-paper,.ui-night').length,
      }));
      if (data.overflow || data.duration !== (reducedMotion === 'reduce' ? '0ms' : '220ms') || data.font !== '16px') throw new Error(JSON.stringify(data));
      results.checks.push({ width, reducedMotion, ...data, passed: true });
    }
    await page.screenshot({ path: dir + width + '.png', fullPage: true });
    await page.close();
  }
} finally {
  await writeFile(dir + 'results.json', JSON.stringify(results, null, 2));
  await browser.close();
}
console.log(JSON.stringify(results));
