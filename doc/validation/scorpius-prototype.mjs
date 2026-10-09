/* global process, console, document, window, getComputedStyle */
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'
import assert from 'node:assert/strict'

const require = createRequire(import.meta.url)
const { chromium } = require(process.argv[2])
const base = process.argv[3] || 'http://127.0.0.1:5181/'
const axePath = process.argv[4]
const catalog = JSON.parse(
  await readFile(new URL('../../src/data/courses.json', import.meta.url), 'utf8'),
).courses
const directory = fileURLToPath(new URL('./scorpius-20261009/', import.meta.url))
await mkdir(directory, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
const results = []
const errors = []

async function makePage(width, count, reducedMotion = 'no-preference') {
  const page = await browser.newPage({
    viewport: { width, height: width < 768 ? 844 : 1000 },
    isMobile: width < 768,
    hasTouch: width < 768,
    reducedMotion,
  })
  page.on('pageerror', (error) => errors.push(error.message))
  if (count > 0)
    await page.addInitScript(
      ({ ids }) => {
        window.localStorage.setItem(
          'humanities-atlas:personal:v1',
          JSON.stringify({
            version: 1,
            consent: true,
            ids,
            representatives: [],
            name: '未命名星座',
            initialized: false,
            namedOnce: false,
            completed: false,
          }),
        )
      },
      { ids: catalog.slice(0, count).map((course) => course.id) },
    )
  await page.goto(base + '#scorpius')
  await page.locator('.scorpius-chart').waitFor()
  return page
}

async function layout(page) {
  return page.evaluate(() => {
    const targets = [...document.querySelectorAll('.scorpius-star')].map((node) => {
      const r = node.getBoundingClientRect()
      return { id: node.dataset.scorpiusSlot, x: r.x, y: r.y, width: r.width, height: r.height }
    })
    const collisions = []
    targets.forEach((a, i) =>
      targets.slice(i + 1).forEach((b) => {
        if (
          a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y
        )
          collisions.push([a.id, b.id])
      }),
    )
    return {
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      targets,
      collisions,
      background: getComputedStyle(document.querySelector('.scorpius-stage')).backgroundImage,
      count: document.querySelectorAll('[data-scorpius-course]').length,
    }
  })
}

async function settle(page) {
  await page.evaluate(async () => {
    await Promise.all(
      document.getAnimations().map((animation) => animation.finished.catch(() => {})),
    )
  })
}

async function scan(page) {
  await page.addScriptTag({ path: axePath })
  return page.evaluate(async () => {
    const report = await window.axe.run(document)
    return report.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      targets: v.nodes.map((n) => n.target),
    }))
  })
}

try {
  for (const width of [320, 390, 768, 1440]) {
    for (const count of [0, 1, 2, 8, 12, 69]) {
      const page = await makePage(width, count)
      const state = await layout(page)
      assert.equal(state.overflow, false, `${width}/${count}: overflow`)
      assert.deepEqual(state.collisions, [], `${width}/${count}: overlap`)
      assert.equal(state.count, count)
      assert.equal(state.targets.length, Math.min(count, 11))
      assert.ok(state.background.includes('minimal-deep-blue-starfield.png'))
      assert.ok(state.targets.every((r) => r.width >= 44 && r.height >= 44))
      const card = page.locator('.scorpius-stage')
      if ([0, 8, 69].includes(count))
        await card.screenshot({ path: directory + `${width}-${count}-chart.png` })
      if (count === 8) {
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
        await page.screenshot({ path: directory + `${width}-preview.png` })
      }
      if (count) {
        const star =
          count > 11
            ? page
                .locator('[data-scorpius-slot]')
                .filter({ has: page.locator('.scorpius-star-badge') })
                .first()
            : page.locator('[data-scorpius-slot]').first()
        const slot = await star.getAttribute('data-scorpius-slot')
        await star.click()
        if (count > 11) {
          await page.getByRole('dialog', { name: /星點/ }).waitFor()
          if (axePath && count === 69 && [390, 1440].includes(width))
            state.axeGroup = await scan(page)
          await page.screenshot({ path: directory + `${width}-${count}-group.png` })
          await page.keyboard.press('Escape')
          assert.equal(await page.locator(':focus').getAttribute('data-scorpius-slot'), slot)
          await star.click()
          await page.locator('.scorpius-group .scorpius-course-name').first().click()
        }
        await page.getByRole('dialog', { name: /./ }).waitFor()
        await settle(page)
        if (axePath && count === 8 && [390, 1440].includes(width))
          state.axeDetails = await scan(page)
        if (count === 8) await page.screenshot({ path: directory + `${width}-details.png` })
        const traps = await page.evaluate(
          () => !!document.activeElement?.closest('.detail-panel'),
        )
        if (count > 11) assert.equal(traps, true, 'group to note initial focus')
        await page.keyboard.press('Escape')
        await page.locator('.detail-panel').waitFor({ state: 'detached' })
        assert.equal(await page.locator(':focus').getAttribute('data-scorpius-slot'), slot)
      }
      if (axePath && count === 8 && [390, 1440].includes(width)) {
        state.axe = await scan(page)
      }
      results.push({ width, selected: count, ...state })
      await page.close()
    }
  }

  const page = await makePage(390, 0)
  await page.getByRole('button', { name: '選擇課程', exact: true }).tap()
  await page.getByRole('searchbox', { name: '搜尋課名' }).fill('數據化')
  assert.equal(await page.locator('[data-scorpius-select]').count(), 1)
  await page.locator('[data-scorpius-select]').tap()
  await page.getByRole('button', { name: '看我的星座 · 1 門' }).tap()
  assert.equal(await page.locator('.scorpius-picker').count(), 0)
  await page.locator('.scorpius-star').tap()
  await page
    .getByRole('heading', { name: '古典文獻的數據化與文化IP轉譯', exact: true })
    .waitFor()
  await page.getByRole('button', { name: '關閉課程詳情' }).tap()
  await page.locator('.detail-panel').waitFor({ state: 'detached' })
  await page.locator('.scorpius-star').tap()
  await page.locator('.collection-toggle').tap()
  await page.keyboard.press('Escape')
  await page.locator('.detail-panel').waitFor({ state: 'detached' })
  await page.waitForFunction(() => document.activeElement?.id === 'scorpius-chart-title')
  await page.getByRole('button', { name: '復原最近移除的課程' }).tap()
  assert.equal(await page.locator('[data-scorpius-course]').count(), 1)
  await page.getByRole('button', { name: '調整選擇的課程' }).tap()
  await page.getByRole('searchbox', { name: '搜尋課名' }).fill('完全不存在的課程')
  assert.equal(await page.locator('[data-scorpius-select]').count(), 0)
  await page.getByRole('button', { name: '清除篩選（保留已選課程）' }).tap()
  assert.equal(await page.locator('[data-scorpius-course]').count(), 1)
  await page.getByRole('button', { name: '只看已選' }).tap()
  await page.locator('[data-scorpius-select]').tap()
  await page.waitForFunction(() => document.activeElement?.id === 'scorpius-picker-title')
  await page.getByRole('button', { name: '復原最近移除的課程' }).tap()
  assert.equal(await page.locator('[data-scorpius-course]').count(), 1)
  assert.equal(await page.evaluate(() => window.localStorage.length), 0)
  await page.getByRole('button', { name: '← 回到課程地圖' }).tap()
  await page.locator('.atlas-overview').waitFor()
  assert.ok((await page.locator(':focus').getAttribute('class')).includes('scorpius-entry'))
  await page.getByRole('button', { name: '天蠍座原型' }).tap()
  assert.equal(await page.locator('[data-scorpius-course]').count(), 1)
  await page.getByRole('button', { name: '← 回到課程地圖' }).tap()
  await page.getByRole('button', { name: '所有課程', exact: true }).tap()
  assert.equal(await page.locator('[data-list-id]').count(), 69)
  results.push({
    journey: 'tap/search/add/view/note/close/filter/remove/undo/return/reenter',
    passed: true,
    unsolicitedStorage: false,
  })
  await page.close()

  const keyboard = await makePage(390, 8, 'reduce')
  await keyboard.locator('.scorpius-star').first().focus()
  await keyboard.keyboard.press('Enter')
  await keyboard.getByRole('button', { name: '關閉課程詳情' }).waitFor()
  for (let i = 0; i < 12; i++) {
    await keyboard.keyboard.press('Tab')
    assert.equal(
      await keyboard.evaluate(() => !!document.activeElement?.closest('.detail-panel')),
      true,
    )
  }
  await keyboard.keyboard.press('Escape')
  await keyboard.locator('.detail-panel').waitFor({ state: 'detached' })
  assert.ok(await keyboard.locator(':focus').getAttribute('data-scorpius-slot'))
  await keyboard.locator('.scorpius-star').first().focus()
  await keyboard.keyboard.press('Enter')
  await keyboard.getByRole('button', { name: '關閉課程詳情' }).waitFor()
  await keyboard.goBack()
  await keyboard.locator('.detail-panel').waitFor({ state: 'detached' })
  assert.ok(await keyboard.locator(':focus').getAttribute('data-scorpius-slot'))
  await keyboard.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })
  assert.equal((await layout(keyboard)).overflow, false)
  await keyboard.screenshot({ path: directory + '390-reduced-200-text.png' })
  results.push({
    journey: 'keyboard/focus-trap/escape/reduced-motion/200-percent-text',
    passed: true,
  })
  await keyboard.close()
  const reload = await makePage(390, 2, 'reduce')
  await reload.reload()
  assert.equal(await reload.locator('[data-scorpius-course]').count(), 2)
  await reload.goto(base + '#scorpius-chart-title')
  await reload.locator('.scorpius-chart').waitFor()
  assert.equal(await reload.locator('[data-scorpius-course]').count(), 2)
  results.push({ journey: 'consented-reload/skip-link-deep-link', passed: true })
  await reload.close()
  assert.deepEqual(errors, [])
} finally {
  await writeFile(
    directory + 'results.json',
    JSON.stringify({ base, results, errors }, null, 2),
  )
  await browser.close()
}
console.log(
  JSON.stringify({
    checks: results.length,
    errors,
    scans: results.filter((r) => r.axe).map((r) => ({ width: r.width, axe: r.axe })),
  }),
)
