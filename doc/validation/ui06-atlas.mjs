/* global process, console, document, innerWidth, URL */
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)(process.argv[2]);
const dir = fileURLToPath(new URL('./ui06-20261009/', import.meta.url));
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const report = { browser: browser.version(), checks: [] };
const assert = (ok, message) => { if (!ok) throw new Error(message); };
try {
  for (const width of [360,390,768,1024,1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: width < 768 });
    await page.goto('http://127.0.0.1:5181/');
    await page.locator('.atlas-overview').waitFor();
    assert(await page.locator('.atlas-year').count() === 4, 'No overview');
    await page.screenshot({ path: dir + width + '-overview.png', fullPage: true });
    const ids = new Set(); const counts = [];
    for (let year = 1; year <= 4; year++) {
      if (year === 1) await page.getByRole('button', { name: '查看大一課程' }).click();
      else await page.getByRole('group', { name: '選擇年級' }).getByRole('button').nth(year - 1).click();
      for (const sem of [1,2]) {
        await page.getByRole('group', { name: '選擇學期' }).getByRole('button').nth(sem - 1).click();
        const count = Number((await page.locator('.atlas-count').innerText()).match(/\d+/)[0]); counts.push(count);
        if (width < 768) assert(!await page.getByRole('button', { name: '上一組' }).count() || await page.getByRole('button', { name: '上一組' }).isDisabled(), 'Page not reset');
        for (;;) {
          const nodes = page.locator('.atlas-course');
          assert(await nodes.count() <= (width < 768 ? 6 : 12), 'Too many nodes');
          for (const id of await nodes.evaluateAll(nodes => nodes.map(n => n.dataset.courseId))) ids.add(id);
          const boxes = await nodes.evaluateAll(nodes => nodes.map(n => { const r=n.getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}; }));
          assert(boxes.every((a,i) => boxes.every((b,j) => i === j || a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top)), 'Overlapping hit areas');
          if (!await page.getByRole('button', { name: '下一組' }).count() || await page.getByRole('button', { name: '下一組' }).isDisabled()) break;
          await page.getByRole('button', { name: '下一組' }).click();
        }
      }
    }
    assert(ids.size === 69 && counts.join(',') === '6,6,11,12,11,12,7,4', 'Missing courses');
    await page.screenshot({ path: dir + width + '-semester.png', fullPage: true });
    await page.goto('http://127.0.0.1:5181/?open=2,3&sem=2&focus=digital');
    await page.locator('.atlas-course').first().waitFor();
    assert(await page.locator('.atlas-heading h3').innerText() === '大二 · 下學期', 'Legacy year broken');
    if(width < 768) await page.getByRole('button', { name: '下一組' }).click();
    const firstId = await page.locator('.atlas-course').first().getAttribute('data-course-id');
    await page.locator('.atlas-course').first().click();
    await page.locator('.detail-panel').waitFor();
    await page.goBack();
    await page.waitForFunction(() => !document.querySelector('.detail-panel'));
    assert(await page.locator(`.atlas-course[data-course-id='${firstId}']`).count() === 1, 'Back lost group');
    await page.goForward(); await page.locator('.detail-panel').waitFor();
    await page.getByRole('button', {name:'關閉課程詳情'}).click(); await page.waitForFunction(() => !document.querySelector('.detail-panel'));
    if(width < 768) {
      await page.setViewportSize({width:1440,height:900}); await page.waitForFunction(() => document.querySelectorAll('.atlas-course').length === 12);
      await page.setViewportSize({width,height:900}); await page.waitForFunction(() => document.querySelectorAll('.atlas-course').length === 6);
      assert(await page.locator(`.atlas-course[data-course-id='${firstId}']`).count() === 1, 'Resize lost anchor');
    }
    await page.getByRole('button', { name: '返回總覽' }).click();
    await page.getByRole('button', { name: '查看大二課程' }).click();
    assert(await page.locator('.atlas-heading h3').innerText() === '大二 · 下學期', 'Session semester lost');
    await page.setViewportSize({width,height:400}); await page.addStyleTag({content:'html{font-size:200%}'});
    assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), '200% overflow');
    report.checks.push({width, ids:ids.size, counts, history: true, resize: width < 768, text200percent: true, passed: true}); await page.close();
  }
} finally { await writeFile(dir + 'results.json', JSON.stringify(report,null,2)); await browser.close(); }
console.log(JSON.stringify(report));
