/* global process, console, document, window, URL, innerWidth, PerformanceObserver, performance, requestAnimationFrame, Storage */
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { cpus, platform } from 'node:os'
const { chromium } = createRequire(import.meta.url)(process.argv[2])
const base = process.argv[3] || 'http://127.0.0.1:5182/'
const dir = fileURLToPath(new URL('./ui19-20261009/', import.meta.url)); await mkdir(dir, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' }), key = 'humanities-atlas:personal:v1'
const report = { browser: browser.version(), base, environment: { platform: platform(), cpu: cpus()[0]?.model, headless: true, realPhone: false }, journeys: [], viewport: [], failures: [], userValidation: 'Pending: student participants, physical devices, Safari/Firefox and real OS IME' }
const assert = (ok, message) => { if (!ok) throw new Error(message) }
let fixture
try {
  for (const mode of ['mouse','tap','keyboard','reduce']) {
    console.log('journeys', mode)
    const width = mode === 'tap' ? 390 : 1440
    const context = await browser.newContext({ viewport: { width, height: 1000 }, hasTouch: mode === 'tap', reducedMotion: mode === 'reduce' ? 'reduce' : 'no-preference', ...(mode === 'mouse' || mode === 'tap' ? { recordVideo: { dir, size: { width: Math.min(width, 960), height: 700 } } } : {}) })
    const page = await context.newPage(), errors = []; page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(() => { window.perf = { tasks: [], frames: [] }; new PerformanceObserver(list => window.perf.tasks.push(...list.getEntries().map(e => e.duration))).observe({ type: 'longtask', buffered: true }); let prior = performance.now(); function sample(now) { window.perf.frames.push(now - prior); prior = now; requestAnimationFrame(sample) } requestAnimationFrame(sample) })
    const tabTo = async locator => { for (let i = 0; i < 250; i++) { if (await locator.evaluate(e => e === document.activeElement)) return; await page.keyboard.press('Tab') } throw new Error('Unreachable keyboard target') }
    const activate = async locator => { if (mode === 'keyboard') { await tabTo(locator); await page.keyboard.press('Enter') } else if (mode === 'tap') await locator.tap(); else await locator.click() }
    const fill = async (locator, value) => { if (mode === 'keyboard') { await tabTo(locator); await page.keyboard.press('Control+A'); await page.keyboard.insertText(value) } else await locator.fill(value) }
    await page.goto(base); await activate(page.getByRole('button', { name: '查看大二課程' })); await activate(page.getByRole('group', { name: '選擇學期' }).getByRole('button').nth(1)); await activate(page.getByRole('button', { name: '文本思辨', exact: true }))
    await fill(page.getByRole('searchbox', { name: '搜尋所有課程' }), '數據化與文化')
    const result = page.locator('[data-search-id="course-068"]'); await activate(result)
    assert(await page.locator('#course-detail-title').innerText() === '古典文獻的數據化與文化IP轉譯', 'Cross year search failed')
    await activate(page.getByRole('button', { name: '關閉課程詳情' })); await page.waitForFunction(() => !document.querySelector('.detail-panel'))
    assert(await result.evaluate(e => e === document.activeElement), 'Source focus lost')
    await activate(page.getByRole('button', { name: '清除搜尋' })); await activate(page.getByRole('button', { name: '所有課程', exact: true }))
    assert(await page.locator('[data-list-id]').count() === 69, 'List excludes unclassified courses')
    await activate(page.getByRole('button', { name: '課程星圖', exact: true })); assert(!await page.locator('.collection-summary,.personal-storage-controls,.wb-feedback button').count(), 'Collection nag on journey A')
    assert(await page.evaluate(key => window.localStorage.getItem(key), key) === null, 'Journey A storage write')
    await activate(page.getByRole('button', { name: '所有課程', exact: true }))
    for (let i = 0; i < 9; i++) { await activate(page.locator('[data-list-id]').nth(i)); await activate(page.locator('.collection-toggle')); await activate(page.getByRole('button', { name: '關閉課程詳情' })); await page.waitForFunction(() => !document.querySelector('.detail-panel')) }
    await activate(page.locator('[data-list-id]').first()); await activate(page.locator('.collection-toggle')); await activate(page.getByRole('button', { name: '關閉課程詳情' })); await page.waitForFunction(() => !document.querySelector('.detail-panel')); await activate(page.locator('.wb-feedback button'))
    assert((await page.locator('.collection-summary').innerText()).includes('查看收藏'), 'Undo lost collection')
    await activate(page.getByRole('button', { name: '我的星座（選用）' }))
    const candidate = page.locator('[data-representative-id]').nth(8)
    await activate(candidate); await activate(page.getByRole('button', { name: '取消替換' })); assert(await page.locator('.constellation-star').count() === 8, 'Ninth cancel failed')
    await activate(candidate); await activate(page.locator('.replacement-panel button').first()); assert(await page.locator('.constellation-star').count() === 8 && (await page.locator('.representative-count').innerText()).includes('收藏 9'), 'Replacement deleted collection')
    await fill(page.getByRole('textbox', { name: '為你的星座命名' }), '故事與地方的交會'); await activate(page.getByRole('button', { name: '完成這個星座' }))
    const movingId = await page.locator('#star-selector').inputValue()
    const point = () => page.locator(`[data-star-id="${movingId}"]`).evaluate(e => [Number(e.dataset.starX), Number(e.dataset.starY)])
    const original = await point()
    await activate(page.getByRole('button', { name: '移動模式', exact: true })); await activate(page.getByRole('button', { name: '右 →', exact: true })); await activate(page.getByRole('button', { name: '完成移動', exact: true }))
    const moved = await point(); assert(moved[0] > original[0], 'Visible movement failed')
    await activate(page.getByRole('button', { name: '移動模式', exact: true })); await activate(page.getByRole('button', { name: '下 ↓', exact: true })); await activate(page.getByRole('button', { name: '取消移動', exact: true })); assert(JSON.stringify(await point()) === JSON.stringify(moved), 'Cancel changed constellation')
    await activate(page.getByRole('button', { name: '儲存在這台裝置', exact: true })); fixture = await page.evaluate(key => window.localStorage.getItem(key), key)
    await page.reload(); assert(!await page.locator('.constellation-editor').count(), 'Reload forced editor')
    await activate(page.getByRole('button', { name: '我的星座（選用）' })); assert(await page.locator('.constellation-name-display').innerText() === '故事與地方的交會', 'Reload lost name'); assert(JSON.stringify(await point()) === JSON.stringify(moved), 'Reload lost coordinates')
    if (mode === 'mouse' || mode === 'tap') {
      const grip = page.locator('.star-grip').first(); await grip.scrollIntoViewIfNeeded(); const box = await grip.boundingBox()
      await page.evaluate(() => { window.perf = { tasks: [], frames: [] } })
      if (mode === 'tap') {
        const session = await context.newCDPSession(page)
        await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + 22, y: box.y + 22 }] })
        for (let i = 1; i <= 30; i++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x + 22 + i, y: box.y + 22 + i }] })
        await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      } else { await page.mouse.move(box.x + 22, box.y + 22); await page.mouse.down(); await page.mouse.move(box.x + 72, box.y + 72, { steps: 30 }); await page.mouse.up() }
      report.journeys.push({ mode, dragPerformance: await page.evaluate(() => ({ longTasks: window.perf.tasks, frames: window.perf.frames.length, maxFrameMs: Math.max(...window.perf.frames) })), note: 'Recorded headless Chrome; not real-device fluidity proof' })
    }
    const event = page.waitForEvent('download'); await activate(page.getByRole('button', { name: '下載星座 SVG', exact: true })); const download = await event; await download.saveAs(dir + mode + '.svg'); assert(await download.failure() === null, 'Regression download failed')
    await activate(page.getByRole('button', { name: '繼續探索課程' })); await activate(page.getByRole('button', { name: '所有課程', exact: true })); assert(await page.locator('[data-list-id]').count() === 69, 'Creation broke return finding')
    if (mode === 'reduce') assert(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length) === 0, 'Reduced active animation')
    assert(!errors.length, 'Runtime error'); assert(!await page.locator('.collection-flight,[inert]').count(), 'Stale effects or inert')
    report.journeys.push({ mode, width, A: true, B: true, errors, sourceFocus: true, ninthExplicit: true, actualDownload: true }); await context.close()
  }
  for (const width of [360,390,768,1024,1440]) {
    console.log('viewport', width)
    const page = await browser.newPage({ viewport: { width, height: 400 }, reducedMotion: 'reduce' }); await page.goto(base); await page.evaluate(({ key, fixture }) => window.localStorage.setItem(key, fixture), { key, fixture }); await page.reload()
    await page.getByRole('button', { name: '我的星座（選用）' }).click(); await page.addStyleTag({ content: 'html{font-size:200%}' })
    assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'Editor 200% overflow')
    await page.getByRole('button', { name: '移動模式', exact: true }).click(); await page.getByRole('button', { name: '右 →', exact: true }).click(); await page.getByRole('button', { name: '取消移動', exact: true }).click()
    const targets = await page.locator('.star-grip,.personal-storage-controls button,.constellation-export button,.star-move-toolbar button').evaluateAll(nodes => nodes.map(e => { const r = e.getBoundingClientRect(); return { width: r.width, height: r.height } }))
    assert(targets.every(r => r.width >= 44 && r.height >= 44), 'Small primary editor target')
    await page.locator('.star-move-toolbar').scrollIntoViewIfNeeded(); await page.screenshot({ path: dir + width + '-200.png', animations: 'disabled' })
    report.viewport.push({ width, height: 400, textScale: '200%', stars: 8, targets, overflow: false, visibleMovement: true }); await page.close()
  }
  // Failure paths use a test context only, never the user's browser profile.
  const page = await browser.newPage(); await page.goto(base); await page.evaluate(({ key, fixture }) => window.localStorage.setItem(key, fixture), { key, fixture }); await page.reload(); await page.getByRole('button', { name: '我的星座（選用）' }).click()
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Quota regression') }; Storage.prototype.removeItem = () => { throw new Error('Delete blocked regression') } })
  await page.getByRole('textbox', { name: '為你的星座命名' }).fill('儲存失败也保留草稿'); await page.getByRole('button', { name: '更新名稱' }).click()
  await page.waitForFunction(() => document.querySelector('.personal-storage-controls').textContent.includes('儲存失敗'))
  assert(await page.getByRole('button', { name: '儲存在這台裝置', exact: true }).count() === 1, 'Failed auto write not stopped')
  await page.getByRole('button', { name: '刪除此裝置的資料' }).click(); await page.getByRole('button', { name: '確認刪除存檔' }).click()
  assert((await page.locator('.personal-storage-controls').innerText()).includes('刪除失敗'), 'False delete success')
  const event = page.waitForEvent('download'); await page.getByRole('button', { name: '下載星座 SVG', exact: true }).click(); const download = await event; await download.saveAs(dir + 'failed-storage.svg')
  report.failures.push({ autoSaveFailureRetainsDraft: true, deleteFailureTruthful: true, exportStillWorks: true }); await page.close()
} finally { await writeFile(dir + 'results.json', JSON.stringify(report, null, 2)); await browser.close() }
console.log(JSON.stringify(report))
