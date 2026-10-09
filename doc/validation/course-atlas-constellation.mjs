/* global process, console, window, document */
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'
import assert from 'node:assert/strict'

const require = createRequire(import.meta.url)
const { chromium } = require(process.argv[2])
const base = process.argv[3] || 'http://127.0.0.1:5186/'
const axePath = process.argv[4]
const catalog = JSON.parse(
  await readFile(new URL('../../src/data/courses.json', import.meta.url), 'utf8'),
).courses
const directory = fileURLToPath(
  new URL('./course-atlas-constellation-20261009/', import.meta.url),
)
await mkdir(directory, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
const results = []
const errors = []
let passed = false
let failure = null

async function pageWithCollection(width, count, options = {}, overrides = {}) {
  const page = await browser.newPage({
    viewport: { width, height: width < 768 ? 844 : 1000 },
    ...options,
  })
  page.on('pageerror', (error) => errors.push(error.message))
  const saved = {
    version: 1,
    consent: true,
    ids: catalog.slice(0, count).map((course) => course.id),
    representatives: [],
    name: '未命名星座',
    initialized: false,
    namedOnce: false,
    completed: false,
    ...overrides,
  }
  await page.addInitScript(
    (saved) =>
      window.localStorage.setItem('humanities-atlas:personal:v1', JSON.stringify(saved)),
    saved,
  )
  const pinned = new URL(base)
  pinned.searchParams.set('mapZodiac', 'scorpio')
  await page.goto(pinned.href)
  await page
    .getByRole('button', { name: count ? `我的課程（${count}）` : '我的課程', exact: true })
    .click()
  return { page, saved }
}

async function assertLayout(page) {
  const layout = await page.evaluate(() => {
    const boxes = [...document.querySelectorAll('[data-constellation-slot]')].map((node) => {
      const { x, y, width, height } = node.getBoundingClientRect()
      return { x, y, width, height }
    })
    return { overflow: document.documentElement.scrollWidth > window.innerWidth, boxes }
  })
  assert.equal(layout.overflow, false)
  for (let index = 0; index < layout.boxes.length; index++) {
    const a = layout.boxes[index]
    assert.ok(a.width >= 44 && a.height >= 44)
    for (const b of layout.boxes.slice(index + 1)) {
      assert.ok(
        a.x + a.width <= b.x ||
          b.x + b.width <= a.x ||
          a.y + a.height <= b.y ||
          b.y + b.height <= a.y,
        'star targets overlap',
      )
    }
  }
  return layout
}

async function collectList(page) {
  const ids = []
  while (true) {
    ids.push(
      ...(await page
        .locator('[data-atlas-course]')
        .evaluateAll((nodes) => nodes.map((node) => node.dataset.atlasCourse))),
    )
    const next = page.getByRole('button', { name: '下一頁', exact: true })
    if (!(await next.count()) || (await next.isDisabled())) break
    await next.click()
  }
  return ids
}

try {
  for (const width of [320, 390, 768, 1024, 1440]) {
    for (const count of [0, 1, 2, 8, 12, 69]) {
      const { page, saved } = await pageWithCollection(width, count)
      if (!count) {
        assert.equal(
          await page.getByRole('button', { name: '找到我的星座', exact: true }).count(),
          0,
        )
        assert.equal(await page.locator('.ca-constellation').count(), 0)
        await page.goto(base + '?mapScreen=constellation')
        await page.getByRole('button', { name: '回課程地圖', exact: true }).waitFor()
        assert.equal(await page.locator('.ca-constellation').count(), 0)
        await page.getByRole('button', { name: '回課程地圖', exact: true }).click()
        assert.equal(await page.locator('[data-area]').count(), 4)
      } else {
        const before = await page.evaluate(() =>
          window.localStorage.getItem('humanities-atlas:personal:v1'),
        )
        await page.getByRole('button', { name: '找到我的星座', exact: true }).click()
        await page.locator('.ca-constellation').waitFor()
        assert.equal(await page.evaluate(() => document.activeElement.id), 'atlas-match-title')
        const plotted = await page
          .locator('[data-star-ids]')
          .evaluateAll((nodes) => nodes.flatMap((node) => node.dataset.starIds.split(',')))
        assert.deepEqual(plotted.sort(), [...saved.ids].sort())
        assert.equal(
          await page.locator('[data-constellation-slot]').count(),
          Math.min(count, 11),
        )
        assert.equal(await page.locator('[data-scorpius-select]').count(), 0)
        const layout = await assertLayout(page)
        assert.equal(
          await page.evaluate(() =>
            window.localStorage.getItem('humanities-atlas:personal:v1'),
          ),
          before,
        )
        assert.deepEqual((await collectList(page)).sort(), [...saved.ids].sort())
        const anchor = new URL(page.url()).searchParams.get('mapMineAnchor')
        await page.getByRole('button', { name: '返回課程清單', exact: true }).click()
        assert.equal(new URL(page.url()).searchParams.get('mapMineAnchor'), anchor)
        assert.equal(await page.locator('.ca-constellation').count(), 0)
        await page.goBack()
        await page.locator('.ca-constellation').waitFor()
        if (
          (width === 390 || width === 1440) &&
          (count === 1 || count === 12 || count === 69)
        ) {
          await page.screenshot({
            path: `${directory}/${width}-${count}-stars.png`,
            fullPage: true,
          })
        }
        if (count === 12) {
          const groupedStar = page.locator('[data-star-ids*="course-012"]')
          const slot = await groupedStar.getAttribute('data-constellation-slot')
          await groupedStar.click()
          assert.equal(
            await page.evaluate(() => document.activeElement.id),
            'atlas-star-group-title',
          )
          const groupIds = await page
            .locator('[data-star-course]')
            .evaluateAll((nodes) => nodes.map((node) => node.dataset.starCourse))
          assert.deepEqual(
            groupIds,
            (await groupedStar.getAttribute('data-star-ids')).split(','),
          )
          await page.locator('[data-star-course]').first().click()
          await page.locator('.detail-panel').waitFor()
          await page.keyboard.press('Escape')
          await page.locator('.detail-panel').waitFor({ state: 'hidden' })
          assert.equal(
            await page.evaluate(() => document.activeElement.dataset.starCourse),
            groupIds[0],
          )
          await page.getByRole('button', { name: '收合星點清單', exact: true }).click()
          assert.equal(
            await page.evaluate(() => document.activeElement.dataset.constellationSlot),
            slot,
          )
        }
        if (width === 390 && count === 69) {
          await page.evaluate(() => {
            document.documentElement.style.fontSize = '200%'
          })
          await assertLayout(page)
          await page.setViewportSize({ width: 320, height: 400 })
          await assertLayout(page)
        }
        results.push({
          check:
            'same IDs, no rewriting storage, full paged list, toggle/Back, grouped star and geometry',
          width,
          count,
          layout,
        })
      }
      if (!count)
        results.push({
          check: 'empty collection does not require stars and direct star URL has an exit',
          width,
          count,
        })
      await page.close()
    }
    console.log(`Completed constellation counts at ${width}px`)
  }

  // Keyboard-only route from the presentation switch through a star and detail.
  const { page: keyboard } = await pageWithCollection(390, 1)
  await keyboard.locator('#atlas-mine-view').focus()
  await keyboard.keyboard.press('Enter')
  await keyboard.locator('.ca-constellation').waitFor()
  assert.equal(await keyboard.evaluate(() => document.activeElement.id), 'atlas-match-title')
  for (let step = 0; step < 8; step++) {
    await keyboard.keyboard.press('Tab')
    if (await keyboard.evaluate(() => !!document.activeElement.dataset.constellationSlot)) break
  }
  const slot = await keyboard.evaluate(() => document.activeElement.dataset.constellationSlot)
  assert.ok(slot)
  await keyboard.keyboard.press('Enter')
  await keyboard.locator('.detail-panel').waitFor()
  await keyboard.keyboard.press('Escape')
  await keyboard.locator('.detail-panel').waitFor({ state: 'hidden' })
  assert.equal(
    await keyboard.evaluate(() => document.activeElement.dataset.constellationSlot),
    slot,
  )
  // Removing the last course must leave an accessible empty view, not trap the user.
  await keyboard.keyboard.press('Enter')
  await keyboard.locator('.detail-panel').waitFor()
  await keyboard.getByRole('button', { name: /^移除我的課程：/ }).click()
  await keyboard.keyboard.press('Escape')
  await keyboard.locator('.detail-panel').waitFor({ state: 'hidden' })
  assert.equal(await keyboard.locator('.ca-constellation').count(), 0)
  assert.equal(await keyboard.evaluate(() => document.activeElement.id), 'atlas-content-title')
  await keyboard.getByRole('button', { name: '復原最近移除', exact: true }).click()
  assert.equal(await keyboard.locator('[data-constellation-slot]').count(), 1)
  results.push({
    check: 'keyboard star/details, source focus, last removal/undo and accessible empty view',
  })
  await keyboard.close()

  const { page: touch } = await pageWithCollection(390, 2, {
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  })
  await touch.getByRole('button', { name: '找到我的星座', exact: true }).tap()
  await touch.locator('[data-constellation-slot]').first().tap()
  await touch.getByRole('button', { name: '關閉課程詳情', exact: true }).tap()
  await touch.locator('.detail-panel').waitFor({ state: 'hidden' })
  await touch.getByLabel('搜尋所有課程', { exact: true }).fill(catalog[68].name)
  await touch.getByRole('button', { name: '搜尋', exact: true }).tap()
  assert.equal(await touch.locator('[data-atlas-course="course-069"]').count(), 1)
  await touch.getByRole('button', { name: '清除搜尋', exact: true }).tap()
  assert.equal(await touch.locator('[data-constellation-slot]').count(), 2)
  results.push({
    check:
      'Chrome injected touch and global search from stars returns to the same collection; reduced motion',
  })
  await touch.close()

  // Use an isolated context with no stored consent for the genuine add → generate flow.
  const fresh = await browser.newPage({ viewport: { width: 390, height: 844 } })
  fresh.on('pageerror', (error) => errors.push(error.message))
  const failedBackgrounds = []
  fresh.on('requestfailed', (request) => {
    if (request.url().includes('starfield')) failedBackgrounds.push(request.url())
  })
  await fresh.route('**/*starfield*.webp', (route) => route.abort())
  await fresh.goto(base)
  await fresh.locator('[data-area="digital"]').click()
  await fresh.locator('[data-atlas-course]').first().click()
  await fresh.getByRole('button', { name: /^加入我的課程：/ }).click()
  await fresh.getByRole('button', { name: '關閉課程詳情', exact: true }).click()
  await fresh.locator('.detail-panel').waitFor({ state: 'hidden' })
  await fresh.getByRole('button', { name: '我的課程（1）', exact: true }).click()
  await fresh.getByRole('button', { name: '找到我的星座', exact: true }).click()
  assert.equal(await fresh.locator('[data-constellation-slot]').count(), 1)
  assert.equal(await fresh.evaluate(() => window.localStorage.length), 0)
  await fresh.getByRole('button', { name: '返回課程清單', exact: true }).click()
  await fresh.getByRole('button', { name: '找到我的星座', exact: true }).click()
  assert.equal(await fresh.locator('[data-constellation-slot]').count(), 1)
  assert.ok(failedBackgrounds.length > 0)
  await fresh.evaluate(() => {
    window.Storage.prototype.setItem = () => {
      throw new Error('Test denied storage')
    }
  })
  await fresh.getByRole('button', { name: '儲存在這台裝置', exact: true }).click()
  assert.ok(
    (await fresh.locator('.personal-storage-controls').innerText()).includes('儲存失敗'),
  )
  assert.equal(await fresh.locator('[data-constellation-slot]').count(), 1)
  results.push({
    check:
      'ordinary collection generates without consent/writes; confirmed blocked background and denied save retain its stars',
  })
  await fresh.close()

  const { page: legacy, saved: oldArtwork } = await pageWithCollection(
    390,
    8,
    {},
    {
      representatives: catalog.slice(0, 3).map((course, index) => ({
        id: course.id,
        x: [0.22, 0.7, 0.27][index],
        y: [0.16, 0.21, 0.36][index],
      })),
      name: '原有作品不要改',
      initialized: true,
      namedOnce: true,
      completed: true,
    },
  )
  await legacy.getByRole('button', { name: '找到我的星座', exact: true }).click()
  await legacy.getByRole('button', { name: '返回課程清單', exact: true }).click()
  const unchanged = await legacy.evaluate(() =>
    JSON.parse(window.localStorage.getItem('humanities-atlas:personal:v1')),
  )
  assert.deepEqual(unchanged, oldArtwork)
  await legacy.getByRole('button', { name: '查看既有星座作品', exact: true }).click()
  assert.ok(
    (await legacy.locator('.constellation-editor').innerText()).includes(oldArtwork.name),
  )
  results.push({
    check:
      'fixed template is derived only; existing name/representatives/consent remain unchanged and old artwork remains accessible',
  })
  await legacy.close()

  if (axePath) {
    for (const width of [390, 1440]) {
      const { page } = await pageWithCollection(width, 12)
      await page.getByRole('button', { name: '找到我的星座', exact: true }).click()
      await page.addScriptTag({ path: axePath })
      for (const state of ['stars', 'group', 'details']) {
        if (state === 'group') await page.locator('[data-star-ids*="course-012"]').click()
        if (state === 'details') await page.locator('[data-star-course]').first().click()
        const violations = await page.evaluate(async () =>
          (await window.axe.run()).violations.map((item) => ({
            id: item.id,
            nodes: item.nodes.map((node) => node.target),
          })),
        )
        assert.deepEqual(violations, [])
        results.push({ check: 'axe scoped state', width, state, violations })
      }
      await page.close()
    }
  }
  assert.deepEqual(errors, [])
  passed = true
  console.log(JSON.stringify({ checks: results.length, runtimeErrors: errors }))
} catch (error) {
  failure = error.stack || String(error)
  throw error
} finally {
  await writeFile(
    `${directory}/results.json`,
    JSON.stringify(
      {
        passed,
        failure,
        results,
        errors,
        environment:
          'Windows Chrome; isolated contexts and simulated touch, not physical phones',
      },
      null,
      2,
    ),
  )
  await browser.close()
}
