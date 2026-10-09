/* global process, console, document, window, URL, PointerEvent, Event */
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const { chromium } = createRequire(import.meta.url)(process.argv[2])
const dir = fileURLToPath(new URL('./ui16-20261009/', import.meta.url))
await mkdir(dir, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
const report = { browser: browser.version(), checks: [] }
const assert = (ok, message) => { if (!ok) throw new Error(message) }
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, hasTouch: width === 390 })
    await page.goto('http://127.0.0.1:5181/')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.getByRole('button', { name: '所有課程', exact: true }).click()
    for (let i = 0; i < 8; i++) {
      await page.locator('.wb-course-list [data-list-id]').nth(i).click()
      await page.locator('.collection-toggle').click()
      await page.getByRole('button', { name: '關閉課程詳情' }).click()
      await page.waitForFunction(() => !document.querySelector('.detail-panel'))
    }
    await page.getByRole('button', { name: '我的星座（選用）' }).click()
    const star = page.locator('.constellation-star').first(), grip = star.locator('.star-grip')
    const point = () => star.evaluate(e => [Number(e.dataset.starX), Number(e.dataset.starY)])
    const original = await point()
    if (width === 390) await grip.tap(); else await grip.click()
    assert(JSON.stringify(await point()) === JSON.stringify(original), 'Tap moved star')
    await page.getByRole('button', { name: '右 →', exact: true }).click()
    await page.getByRole('button', { name: '取消移動', exact: true }).click()
    assert(JSON.stringify(await point()) === JSON.stringify(original), 'Cancel not restored')
    await grip.focus(); await page.keyboard.press('Space'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter')
    const keyboard = await point()
    assert(Math.abs(keyboard[0] - original[0] - .02) < .00001, 'Keyboard commit failed')
    assert(await page.getByRole('button', { name: '完成移動', exact: true }).isDisabled(), 'Enter reopened transaction')
    await grip.click(); await page.getByRole('button', { name: '下 ↓', exact: true }).click(); await page.keyboard.press('Escape')
    assert(JSON.stringify(await point()) === JSON.stringify(keyboard), 'Esc not restored')
    for (const event of ['blur', 'resize']) {
      await grip.click(); await page.getByRole('button', { name: '下 ↓', exact: true }).click()
      await page.evaluate(type => window.dispatchEvent(new Event(type)), event)
      await page.waitForFunction(() => document.querySelector('.star-grip').getAttribute('aria-pressed') === 'false')
      assert(JSON.stringify(await point()) === JSON.stringify(keyboard), event + ' not restored')
    }
    await grip.scrollIntoViewIfNeeded()
    const box = await grip.boundingBox(), canvas = await page.locator('.constellation-canvas').boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + canvas.width * .08, box.y + box.height / 2 + canvas.height * .04, { steps: 10 }); await page.mouse.up()
    const dragged = await point()
    assert(Math.abs(dragged[0] - keyboard[0] - .08) < .008, 'Drag x wrong')
    assert(await page.getByRole('button', { name: '完成移動', exact: true }).isDisabled(), 'Drag extra click reopened')
    if (width === 390) {
      const session = await page.context().newCDPSession(page)
      const b = await grip.boundingBox()
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + 22, y: b.y + 22 }] })
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: b.x + 42, y: b.y + 42 }] })
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await page.waitForFunction(x => Number(document.querySelector('.constellation-star').dataset.starX) > x, dragged[0])
      assert((await point())[0] > dragged[0], 'Touch drag failed')
      assert(await page.getByRole('button', { name: '完成移動', exact: true }).isDisabled(), 'Touch extra click')
    }
    const committed = await point()
    for (const type of ['pointercancel', 'lostpointercapture']) {
      await grip.scrollIntoViewIfNeeded(); const b = await grip.boundingBox()
      await page.mouse.move(b.x + 22, b.y + 22); await page.mouse.down(); await page.mouse.move(b.x + 55, b.y + 45)
      await grip.evaluate((e, type) => e.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1 })), type)
      await page.mouse.up()
      await page.waitForFunction(() => document.querySelector('.star-grip').getAttribute('aria-pressed') === 'false')
      assert(JSON.stringify(await point()) === JSON.stringify(committed), type + ' changed model')
      await page.keyboard.press('Escape')
    }
    await grip.click()
    for (let i = 0; i < 45; i++) await page.getByRole('button', { name: '右 →', exact: true }).click()
    await page.getByRole('button', { name: '完成移動', exact: true }).click()
    assert((await point())[0] === .84, 'Bounds failed')
    await page.setViewportSize({ width: width === 390 ? 768 : 1024, height: 1000 })
    assert((await point())[0] === .84, 'Resize lost committed position')
    await page.setViewportSize({ width, height: 1000 })
    const contained = await star.evaluate(e => { const r = e.getBoundingClientRect(), p = e.parentElement.getBoundingClientRect(); return r.left >= p.left && r.right <= p.right && r.top >= p.top && r.bottom <= p.bottom })
    assert(contained, 'Boundary label clipping')
    await page.locator('.constellation-canvas').scrollIntoViewIfNeeded()
    await page.screenshot({ path: dir + width + '.png', animations: 'disabled' })
    const removingId = await star.getAttribute('data-star-id')
    await grip.click(); await page.getByRole('button', { name: '下 ↓', exact: true }).click()
    await page.locator(`[data-representative-id="${removingId}"]`).click()
    assert(await page.locator('.constellation-star').count() === 7, 'Removed star stale')
    await page.waitForFunction(() => document.querySelector('.star-move-directions button').disabled)
    assert(await page.getByRole('button', { name: '完成移動', exact: true }).isDisabled(), 'Removed star left transaction')
    await page.getByRole('button', { name: '繼續探索課程' }).click()
    assert(!await page.locator('.constellation-canvas').count(), 'Unmount did not leave editor')
    report.checks.push({ width, keyboard: true, tap: true, drag: true, cancellation: true, boundary: true, resize: true })
    await page.close()
  }
} finally { await writeFile(dir + 'results.json', JSON.stringify(report, null, 2)); await browser.close() }
console.log(JSON.stringify(report))
