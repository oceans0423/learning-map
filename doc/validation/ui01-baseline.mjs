// Node driver globals and globals inside Playwright's browser callbacks.
/* global process, console, URL, URLSearchParams, setTimeout, innerWidth, document, getComputedStyle, location */
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[2]);
const baseUrl = process.argv[3] || 'http://127.0.0.1:5182/';
const outputDir = fileURLToPath(new URL('./ui01-20261009/', import.meta.url));
await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { date: '2026-10-09', baseUrl, browser: browser.version(), mode: 'headless Chrome; mobile viewport/touch emulation, not physical device', scenarios: [] };
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

try {
  for (const config of [
    { name: 'desktop', viewport: { width: 1440, height: 1000 }, isMobile: false, hasTouch: false },
    { name: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  ]) {
    const context = await browser.newContext(config);
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    const activate = locator => config.hasTouch ? locator.tap() : locator.click();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const result = { device: config.name, viewport: config.viewport, tests: [], errors, screenshots: [], observations: {} };
    report.scenarios.push(result);
    const check = async (name, fn) => {
      try {
        const details = await fn();
        result.tests.push({ name, passed: true, ...(details || {}) });
      } catch (error) {
        result.tests.push({ name, passed: false, error: error.message });
      }
    };
    const load = async (query = '') => {
      await page.goto(new URL(query, baseUrl).href, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.locator('button.year-toggle').first().waitFor();
    };
    const screenshot = async (name, fullPage = false) => {
      const filename = config.name + '-' + name + '.png';
      await page.screenshot({ path: outputDir + filename, fullPage, animations: 'disabled', timeout: 15000 });
      result.screenshots.push(filename);
    };
    const metrics = () => page.evaluate(() => ({
      viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      mapHeight: document.querySelector('#curriculum')?.getBoundingClientRect().height,
      courseNodes: document.querySelectorAll('button.course-card').length,
      visibleCourses: [...document.querySelectorAll('button.course-card')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden').length,
    }));
    await check('default page and desktop/mobile screenshots', async () => {
      await load();
      await delay(250);
      result.observations.default = await metrics();
      assert(await page.locator('button.year-toggle').first().getAttribute('aria-expanded') === 'true', 'Default year 1 must be expanded');
      assert(await page.locator('button.semester-option').first().getAttribute('aria-pressed') === 'true', 'Default semester must be all');
      assert(result.observations.default.documentWidth <= config.viewport.width, 'Horizontal overflow');
      await screenshot('home');
      await screenshot('full', true);
      await page.locator('#curriculum').evaluate(e => e.scrollIntoView({ block: 'start', behavior: 'instant' }));
      await screenshot('map');
      return { url: page.url(), metrics: result.observations.default };
    });
    await check('year and elective expansion; all 69 courses reachable', async () => {
      for (const button of await page.locator('button.year-toggle').all()) {
        if (await button.getAttribute('aria-expanded') !== 'true') await activate(button);
      }
      for (const button of await page.locator('button.elective-toggle').all()) {
        if (await button.getAttribute('aria-expanded') !== 'true') await activate(button);
      }
      result.observations.expanded = await metrics();
      assert(result.observations.expanded.visibleCourses === 69, 'Expected 69 visible courses');
      await page.locator('#curriculum').evaluate(e => e.scrollIntoView({ block: 'start', behavior: 'instant' }));
      await screenshot('expanded-map');
      return { metrics: result.observations.expanded, url: page.url() };
    });
    await check('semester and official focus OR state', async () => {
      await load();
      await activate(page.locator('button.semester-option').nth(2));
      await page.waitForFunction(() => new URLSearchParams(location.search).get('sem') === '2');
      assert(await page.locator('button.course-card').count() === 34, 'Expected 34 total lower-semester course nodes');
      await activate(page.locator('button.structure-control').nth(0));
      await activate(page.locator('button.structure-control').nth(1));
      await page.waitForFunction(() => {
        const values = new URLSearchParams(location.search).get('focus')?.split(',') || [];
        return values.includes('foundation') && values.includes('narrative');
      });
      const before = page.url();
      const clear = page.getByRole('button', { name: /清除/ });
      await activate(clear);
      await page.waitForFunction(() => !new URLSearchParams(location.search).has('focus'));
      assert(new URL(page.url()).searchParams.get('sem') === '2', 'Clear must preserve semester');
      return { beforeClear: before, afterClear: page.url() };
    });
    await check('details: course URL, visible content, Escape and focus return', async () => {
      await load();
      const source = page.getByRole('button', { name: /^文本分析與詮釋，/ });
      await activate(source);
      const dialog = page.getByRole('dialog');
      await dialog.waitFor();
      const text = await dialog.innerText();
      assert(text.includes('文本分析與詮釋'), 'Wrong course details');
      assert(text.includes('課程詳細說明整理中'), 'Unapproved contents must remain hidden');
      assert(new URL(page.url()).searchParams.get('course') === 'course-007', 'Course URL not synchronized');
      const focusInside = await dialog.evaluate(e => e.contains(document.activeElement));
      assert(focusInside, 'Focus not inside dialog');
      result.observations.dialog = {
        text,
        buttons: await dialog.locator('button').evaluateAll(elements => elements.map(e => ({ text: e.innerText, label: e.getAttribute('aria-label') }))),
      };
      await screenshot('details');
      for (const key of ['Tab', 'Tab', 'Shift+Tab']) {
        await page.keyboard.press(key);
        assert(await dialog.evaluate(e => e.contains(document.activeElement)), 'Tab escaped dialog');
      }
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
      await page.waitForFunction(() => !new URLSearchParams(location.search).has('course'));
      const focusReturned = await source.evaluate(e => document.activeElement === e);
      assert(focusReturned, 'Focus did not return to course button');
      return { focusInside, focusReturned, url: page.url() };
    });
    await check('visible close button and browser Back close details', async () => {
      await load();
      const source = page.getByRole('button', { name: /^人文學概論，/ });
      await activate(source);
      const dialog = page.getByRole('dialog');
      await dialog.waitFor();
      await activate(dialog.getByRole('button', { name: /關閉/ }));
      await dialog.waitFor({ state: 'hidden' });
      await activate(source);
      await dialog.waitFor();
      await page.goBack({ waitUntil: 'domcontentloaded' });
      await dialog.waitFor({ state: 'hidden' });
      assert(!new URL(page.url()).searchParams.has('course'), 'Back left stale course parameter');
      return { url: page.url(), focusReturned: await source.evaluate(e => document.activeElement === e) };
    });
    await check('legacy direct URL, reload and safe direct close', async () => {
      const query = '?sem=2&focus=foundation,narrative&open=1,2&course=course-010';
      await load(query);
      const dialog = page.getByRole('dialog');
      await dialog.waitFor();
      assert((await dialog.innerText()).includes('地方創生與數位敘事'), 'Direct URL selected wrong course');
      assert(await page.locator('button.year-toggle[aria-expanded="true"]').count() === 2, 'Direct URL year state not restored');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await dialog.waitFor();
      await activate(dialog.getByRole('button', { name: /關閉/ }));
      await dialog.waitFor({ state: 'hidden' });
      assert(page.url().startsWith(baseUrl), 'Closing direct URL left the app');
      assert(new URL(page.url()).searchParams.get('sem') === '2', 'Direct close lost semester');
      return { url: page.url() };
    });
    await check('invalid URL fallback', async () => {
      await load('?sem=bad&focus=bad&open=bad&course=unknown');
      assert(await page.getByRole('dialog').count() === 0 || !(await page.getByRole('dialog').isVisible()), 'Invalid course opened details');
      assert(await page.locator('button.year-toggle').first().getAttribute('aria-expanded') === 'true', 'Invalid year fallback failed');
      assert(await page.locator('button.semester-option').first().getAttribute('aria-pressed') === 'true', 'Invalid semester fallback failed');
      return { url: page.url() };
    });
    await context.close();
  }
} finally {
  await browser.close();
  await writeFile(outputDir + 'browser-results.json', JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify(report, null, 2));
}
if (report.scenarios.some(s => s.tests.some(t => !t.passed) || s.errors.length)) process.exitCode = 1;
