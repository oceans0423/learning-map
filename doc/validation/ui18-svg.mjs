/* global process, console, document, window, URL, Storage */
import { createRequire } from 'node:module'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
const { chromium } = createRequire(import.meta.url)(process.argv[2])
const dir = fileURLToPath(new URL('./ui18-20261009/', import.meta.url)); await mkdir(dir, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' }), report = { browser: browser.version(), checks: [] }
const assert = (ok, message) => { if (!ok) throw new Error(message) }
try {
  for (const width of [390,1440]) for (const n of [1,2,8]) {
    console.log('case', width, n)
    const page = await browser.newPage({ viewport: { width, height: 1000 } }); await page.goto('http://127.0.0.1:5181/'); await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.getByRole('button', { name: '所有課程', exact: true }).click()
    for (let i = 0; i < n; i++) { await page.locator('[data-list-id]').nth(i).click(); await page.locator('.collection-toggle').click(); await page.getByRole('button', { name: '關閉課程詳情' }).click(); await page.waitForFunction(() => !document.querySelector('.detail-panel')) }
    await page.getByRole('button', { name: '我的星座（選用）' }).click()
    const name = n === 1 ? '<script>"&探索' : n === 2 ? '星'.repeat(24) : '👩‍👩‍👧‍👦'.repeat(24)
    await page.getByRole('textbox', { name: '為你的星座命名' }).fill(name); await page.getByRole('button', { name: '完成這個星座' }).click()
    await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Quota test') }; window.created = []; window.revoked = []; const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL); URL.createObjectURL = blob => { const url = create(blob); window.created.push(url); return url }; URL.revokeObjectURL = url => { window.revoked.push(url); revoke(url) } })
    await page.getByRole('button', { name: '儲存在這台裝置', exact: true }).click()
    assert((await page.locator('.personal-storage-controls').innerText()).includes('儲存失敗'), 'Failure setup wrong')
    await page.getByRole('button', { name: '移動模式', exact: true }).click()
    assert(await page.getByRole('button', { name: '下載星座 SVG', exact: true }).isDisabled(), 'Export active preview')
    await page.getByRole('button', { name: '取消移動', exact: true }).click()
    const expected = await page.locator('.constellation-star').evaluateAll(nodes => nodes.map(e => ({ id: e.dataset.starId, x: e.dataset.starX, y: e.dataset.starY })))
    const downloadEvent = page.waitForEvent('download'); await page.getByRole('button', { name: '下載星座 SVG', exact: true }).click(); const download = await downloadEvent
    console.log('download received')
    assert(download.suggestedFilename() === 'my-humanities-constellation.svg', 'Unsafe filename')
    const filename = dir + width + '-' + n + '.svg'; await download.saveAs(filename)
    console.log('saved')
    assert(await download.failure() === null, 'Download failure')
    const source = await readFile(filename, 'utf8'); assert(!/<script|<foreignObject|href=|<image|<style/.test(source), 'Injection or external resource')
    await page.waitForFunction(() => window.created.length === window.revoked.length)
    const svgPage = await browser.newPage({ viewport: { width: 1200, height: 1500 } }), requests = []
    svgPage.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()) })
    await svgPage.goto(pathToFileURL(filename).href)
    console.log('opened')
    assert(!await svgPage.locator('parsererror').count(), 'XML failed to open')
    assert(await svgPage.locator('title').textContent() === name, 'Title corrupted')
    assert(await svgPage.locator('polyline').count() === (n > 1 ? 1 : 0), 'Wrong line count')
    for (const star of expected) { const node = svgPage.locator(`[data-course-id="${star.id}"]`); assert(await node.getAttribute('data-x') === star.x && await node.getAttribute('data-y') === star.y, 'Export position mismatch') }
    const textBounds = await svgPage.locator('svg').evaluate(svg => [...svg.querySelectorAll('text')].map(text => { const b = text.getBBox(); return { text: text.textContent, x: b.x, y: b.y, width: b.width, height: b.height, contained: b.x >= 0 && b.x + b.width <= svg.viewBox.baseVal.width && b.y >= 0 && b.y + b.height <= svg.viewBox.baseVal.height } }))
    assert(textBounds.every(item => item.contained), 'SVG text clipped')
    assert(requests.length === 0, 'SVG requested outside resources')
    await svgPage.setViewportSize({ width: 1200, height: await svgPage.locator('svg').evaluate(svg => svg.viewBox.baseVal.height) })
    await svgPage.screenshot({ path: dir + width + '-' + n + '.png', fullPage: false })
    if (n === 1) {
      await page.evaluate(() => { URL.createObjectURL = () => { throw new Error('Download denied test') } })
      await page.getByRole('button', { name: '下載星座 SVG', exact: true }).click()
      assert((await page.locator('.constellation-export').innerText()).includes('無法建立下載'), 'Fake success on failure')
    }
    report.checks.push({ width, stars: n, download: true, openedIn: 'system Chrome file URL', standalone: true, matchesEditor: true, textBounds, storageFailureIndependent: true, objectURLCleanup: true }); await svgPage.close(); await page.close()
  }
} finally { await writeFile(dir + 'results.json', JSON.stringify(report, null, 2)); await browser.close() }
console.log(JSON.stringify({ browser: report.browser, passed: report.checks.length }))
