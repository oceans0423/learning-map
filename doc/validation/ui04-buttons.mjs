/* global process, console, document, innerWidth, getComputedStyle, URL */
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)(process.argv[2]);
const dir = fileURLToPath(new URL('./ui04-20261009/', import.meta.url));
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const report = { browser: browser.version(), checks: [] };
const assert = (ok, message) => { if (!ok) throw new Error(message); };
try {
  for (const width of [360,390,768,1024,1440]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, hasTouch: width < 768, isMobile: width < 768 });
    await page.goto('http://127.0.0.1:5181/doc/validation/ui-buttons.html');
    const night = page.getByRole('region', { name: 'ui-night', exact: true });
    const activate = button => width < 768 ? button.tap() : button.click();
    const collect = night.getByRole('button', { name: '收藏課程', exact: true });
    const before = await collect.boundingBox();
    await activate(collect);
    const cancel = night.getByRole('button', { name: '取消收藏課程', exact: true });
    const after = await cancel.boundingBox();
    assert(Math.abs(before.width - after.width) < 0.5, 'Collection width changed');
    await cancel.focus(); await page.keyboard.press('Space');
    assert(await collect.count() === 1, 'Space failed');
    await collect.focus(); await page.keyboard.press('Enter');
    assert(await cancel.count() === 1, 'Enter failed');
    const upper = night.getByRole('button', { name: /上學期/ });
    const lower = night.getByRole('button', { name: /下學期/ });
    await activate(lower);
    assert(await lower.getAttribute('aria-pressed') === 'true' && await upper.getAttribute('aria-pressed') === 'false', 'Single selection failed');
    const signal = night.getByRole('button', { name: /文本思辨/ });
    await activate(signal);
    assert(await signal.getAttribute('aria-pressed') === 'true', 'Signal selection failed');
    await activate(night.getByRole('button', { name: '清除訊號' }));
    assert(await signal.getAttribute('aria-pressed') === 'false', 'Signal clear failed');
    await signal.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
    const focus = await signal.evaluate(e => ({ visible: e.matches(':focus-visible'), outline: getComputedStyle(e).outlineWidth }));
    assert(focus.visible && focus.outline === '3px', 'Missing keyboard focus');
    const geometry = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      nested: document.querySelectorAll('button button').length,
      targets: [...document.querySelectorAll('button')].every(b => b.getBoundingClientRect().height >= 44),
    }));
    assert(!geometry.overflow && !geometry.nested && geometry.targets, 'Bad geometry');
    assert(await night.getByRole('button', { name: /下載作品/ }).isDisabled(), 'Not native disabled');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert(await signal.evaluate(e => getComputedStyle(e).transitionDuration.split(',').every(d => parseFloat(d) === 0)), 'Reduced motion failed');
    await page.screenshot({ path: dir + width + '.png', fullPage: true });
    report.checks.push({ width, input: width < 768 ? 'emulated tap, Enter, Space' : 'mouse, Enter, Space', geometry, focus, stableCollectionWidth: before.width, reducedMotion: true, passed: true });
    await page.close();
  }
} finally {
  await writeFile(dir + 'results.json', JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(JSON.stringify(report));
