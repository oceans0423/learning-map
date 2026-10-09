/* global process, console, document, URL, window */
import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const { chromium } = createRequire(import.meta.url)(process.argv[2]),
  browser = await chromium.launch({ channel: 'chrome' }),
  report = []
const dir = fileURLToPath(new URL('./uiux-audit-20261009/', import.meta.url))
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: width === 390 ? 844 : 1000 },
      reducedMotion: 'reduce',
    })
    await page.goto('http://127.0.0.1:5181/')
    await page.getByRole('button', { name: '所有課程', exact: true }).click()
    for (let i = 0; i < 8; i++) {
      await page.locator('[data-list-id]').nth(i).click()
      await page.locator('.collection-toggle').click()
      await page.getByRole('button', { name: '關閉課程詳情' }).click()
      await page.waitForFunction(() => !document.querySelector('.detail-panel'))
    }
    await page.getByRole('button', { name: '我的星座（選用）' }).click()
    let stars = []
    for (let i = 0; i < 80 && stars.length < 8; i++) {
      await page.keyboard.press('Tab')
      const hit = await page.evaluate(() => {
        const e = document.activeElement
        if (!e.classList.contains('star-grip')) return null
        const r = e.getBoundingClientRect(),
          toolbar = document.querySelector('.star-move-toolbar').getBoundingClientRect()
        const samples = [0.1, 0.5, 0.9].flatMap((x) =>
          [0.1, 0.5, 0.9].map((y) => {
            const top = document.elementFromPoint(r.x + r.width * x, r.y + r.height * y)
            return {
              own: !!top?.closest('.star-grip'),
              toolbar: !!top?.closest('.star-move-toolbar'),
            }
          }),
        )
        return {
          name: e.getAttribute('aria-label'),
          top: r.top,
          bottom: r.bottom,
          toolbarTop: toolbar.top,
          toolbarBottom: toolbar.bottom,
          samples,
          fullyCovered: samples.every((s) => s.toolbar),
          scrollY: window.scrollY,
        }
      })
      if (hit) {
        stars.push(hit)
        if (hit.fullyCovered)
          await page.screenshot({
            path: dir + width + '-focus-obscured-' + stars.length + '.png',
          })
      }
    }
    await page.locator('.constellation-canvas').scrollIntoViewIfNeeded()
    await page.screenshot({ path: dir + width + '-canvas-viewport.png' })
    report.push({ width, stars })
    await page.close()
  }
} finally {
  await writeFile(dir + 'focus-probe.json', JSON.stringify(report, null, 2))
  await browser.close()
}
console.log(JSON.stringify(report))
