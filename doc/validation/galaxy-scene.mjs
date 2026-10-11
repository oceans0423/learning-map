/* global process, console, window, document, getComputedStyle */
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { URL, fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const require = createRequire(import.meta.url)
const { chromium } = require(process.argv[2])
const base = process.argv[3] || 'http://127.0.0.1:5186/'
const directory = fileURLToPath(new URL('./galaxy-scene-20261009/', import.meta.url))
await mkdir(directory, { recursive: true })
const catalog = JSON.parse(
  await readFile(new URL('../../src/data/courses.json', import.meta.url), 'utf8'),
).courses
const browser = await chromium.launch({ channel: 'chrome' })
const results = []
const errors = []
let failure = null

async function newPage(options) {
  const page = await browser.newPage(options)
  page.on('pageerror', (error) => errors.push(error.message))
  return page
}
async function layout(page) {
  return page.evaluate(() => ({
    width: window.innerWidth,
    overflow: document.documentElement.scrollWidth > window.innerWidth,
    searchBottom: document.querySelector('#atlas-search').getBoundingClientRect().bottom,
    firstBottom: document.querySelector('[data-area]').getBoundingClientRect().bottom,
    height: window.innerHeight,
    targets: [...document.querySelectorAll('[data-area], [data-galaxy-year]')].map((node) => {
      const r = node.getBoundingClientRect()
      return { x: r.x, y: r.y, width: r.width, height: r.height }
    }),
  }))
}
function assertLayout(state) {
  assert.equal(state.overflow, false)
  for (const [i, a] of state.targets.entries()) {
    assert.ok(a.width >= 44 && a.height >= 44)
    for (const b of state.targets.slice(i + 1)) {
      assert.equal(
        a.x < b.x + b.width - 1 &&
          a.x + a.width > b.x + 1 &&
          a.y < b.y + b.height - 1 &&
          a.y + a.height > b.y + 1,
        false,
        'native targets overlap',
      )
    }
  }
}

try {
  const opening = await newPage({ viewport: { width: 1440, height: 1000 } })
  await opening.goto(base)
  await opening.locator('.gx-scene[data-intro="playing"]').waitFor()
  assertLayout(await layout(opening))
  await opening.locator('.gx-cosmos').evaluate((node) => {
    for (const animation of node.getAnimations()) {
      animation.pause()
      animation.currentTime = 120
    }
  })
  await opening.screenshot({ path: `${directory}/1440-opening.png`, fullPage: true })
  await opening.locator('.gx-cosmos').evaluate((node) => {
    for (const animation of node.getAnimations()) {
      animation.play()
    }
  })
  await opening.locator('.gx-scene[data-intro="complete"]').waitFor()
  assert.equal(
    await opening.locator('.gx-cosmos').evaluate((node) => node.getAnimations().length),
    0,
  )
  await opening.screenshot({ path: `${directory}/1440-overview.png`, fullPage: true })
  await opening.getByRole('button', { name: '重看星河', exact: true }).click()
  assert.equal(await opening.locator('.gx-scene').getAttribute('data-intro'), 'playing')
  await opening.getByRole('button', { name: '跳過動畫', exact: true }).click()
  assert.equal(await opening.locator('.gx-scene').getAttribute('data-intro'), 'complete')
  results.push({
    check: 'tilted opening, automatic flatten, replay, skip, no persistent animation',
  })
  await opening.close()

  for (const width of [320, 390, 768, 1024, 1440]) {
    const page = await newPage({
      viewport: { width, height: width < 768 ? 844 : 1000 },
      hasTouch: width < 768,
    })
    const requests = []
    page.on('request', (request) => {
      if (request.url().includes('/images/areas/')) requests.push(request.url())
    })
    await page.goto(base)
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
      false,
      'intro stays inside its scene',
    )
    await page.locator('.gx-scene[data-intro="complete"]').waitFor()
    const state = await layout(page)
    assertLayout(state)
    assert.ok(state.searchBottom < state.height && state.firstBottom < state.height)
    assert.equal(await page.locator('.gx-scene img').count(), 0)
    assert.deepEqual(requests, [])
    if (width === 390)
      await page.screenshot({ path: `${directory}/390-overview.png`, fullPage: true })
    const world = await page.locator('.gx-cosmos').elementHandle()
    const digital = page.locator('[data-area="digital"]')
    if (width < 768) await digital.tap()
    else {
      await digital.focus()
      await page.keyboard.press('Enter')
    }
    await page.locator('#galaxy-focus-title').waitFor()
    assert.equal(
      await world.evaluate((node) => node.isConnected),
      true,
      'the same universe remains mounted',
    )
    assert.deepEqual(await page.locator('[data-galaxy-year] strong').allTextContents(), [
      '3 門',
      '3 門',
      '4 門',
      '2 門',
    ])
    const focusState = await layout(page)
    assertLayout(focusState)
    if (width === 390 || width === 1440)
      await page.screenshot({ path: `${directory}/${width}-digital.png`, fullPage: true })
    for (const year of [1, 2, 3, 4]) {
      await page.locator(`[data-galaxy-year="${year}"]`).click()
      const expected = catalog
        .filter((course) => course.module === '數位人文' && course.year === year)
        .map((course) => course.id)
        .sort()
      const actual = await page
        .locator('[data-atlas-course]')
        .evaluateAll((nodes) => nodes.map((node) => node.dataset.atlasCourse).sort())
      assert.deepEqual(actual, expected)
      assert.equal(
        await page.getByLabel('篩選年級', { exact: true }).inputValue(),
        String(year),
      )
    }
    await page.locator('[data-galaxy-year="4"]').click()
    assert.equal(await page.getByLabel('篩選年級', { exact: true }).inputValue(), '')
    assert.match(await page.locator('.ca-result-count').innerText(), /12/)
    await page.locator('[data-galaxy-year="4"]').click()
    await page.locator('[data-atlas-course]').first().click()
    await page.locator('.detail-panel').waitFor()
    await page.keyboard.press('Escape')
    await page.locator('.detail-panel').waitFor({ state: 'hidden' })
    assert.equal(
      await page.locator('[data-galaxy-year="4"]').getAttribute('aria-pressed'),
      'true',
    )
    await page.getByRole('button', { name: '← 返回星河', exact: true }).click()
    assert.equal(await page.locator('.gx-scene').getAttribute('data-intro'), 'complete')
    await page.goBack()
    await page.locator('#galaxy-focus-title').waitFor()
    assert.equal(
      await page.locator('[data-galaxy-year="4"]').getAttribute('aria-pressed'),
      'true',
    )
    await page.getByRole('button', { name: '← 返回星河', exact: true }).click()
    await page.getByRole('button', { name: '按年級看', exact: true }).click()
    assert.equal(await page.locator('[data-year] svg').count(), 4)
    await page.getByRole('button', { name: '按領域看', exact: true }).click()
    assert.equal(await page.locator('.gx-scene').getAttribute('data-intro'), 'complete')
    if ((width === 390 || width === 1440) && process.argv[4]) {
      await page.addScriptTag({ path: process.argv[4] })
      for (const screen of ['overview', 'focused']) {
        if (screen === 'focused') await page.locator('[data-area="culture"]').click()
        const audit = await page.evaluate(() =>
          window.axe.run(document, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
          }),
        )
        await writeFile(
          `${directory}/${width}-${screen}-axe.json`,
          `${JSON.stringify(audit.violations, null, 2)}\n`,
        )
        assert.deepEqual(
          audit.violations.map((item) => item.id),
          [],
        )
      }
    }
    results.push({
      check:
        'responsive native targets, no retired images, year data, touch/keyboard, detail, Back, no intro replay, original year view',
      ...state,
      focusState,
    })
    await page.close()
  }

  const reduced = await newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  })
  await reduced.goto(base)
  await reduced.locator('.gx-scene').waitFor()
  assert.equal(await reduced.locator('.gx-scene').getAttribute('data-intro'), 'complete')
  assert.equal(
    await reduced
      .locator('.gx-cosmos')
      .evaluate((node) => getComputedStyle(node).animationName),
    'none',
  )
  await reduced.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })
  assertLayout(await layout(reduced))
  await reduced.locator('[data-area="digital"]').click()
  assertLayout(await layout(reduced))
  await reduced.screenshot({ path: `${directory}/390-text-200.png`, fullPage: true })
  results.push({ check: 'reduced motion, 200% text reflow and native year targets' })
  await reduced.close()

  const early = await newPage({ viewport: { width: 390, height: 844 } })
  await early.goto(base)
  await early.getByLabel('搜尋所有課程', { exact: true }).fill('數位')
  await early.getByRole('button', { name: '搜尋', exact: true }).click()
  await early.locator('[data-atlas-course]').first().waitFor()
  await early.getByRole('button', { name: '清除搜尋', exact: true }).click()
  assert.equal(await early.locator('.gx-scene').getAttribute('data-intro'), 'complete')
  await early.getByRole('button', { name: '重看星河', exact: true }).click()
  await early.emulateMedia({ reducedMotion: 'reduce' })
  await early.locator('.gx-scene[data-intro="complete"]').waitFor()
  for (const area of ['thinking', 'digital', 'narrative', 'culture', 'digital']) {
    await early.locator(`[data-area="${area}"]`).click()
    assert.equal(
      await early.locator(`[data-area="${area}"]`).getAttribute('aria-pressed'),
      'true',
    )
    assert.equal(await early.locator('#atlas-content-title').count(), 1)
  }
  await early.locator('[data-galaxy-year="3"]').click()
  assert.equal(await early.locator('[data-atlas-course]').count(), 4)
  assert.deepEqual(
    await early
      .locator('.gx-cosmos')
      .evaluate((node) => node.getAnimations().map((animation) => animation.playState)),
    [],
  )
  results.push({
    check:
      'search independent of intro, live reduced-motion change interrupts intro, repeated area/year switching has no duplicate content or animation',
  })
  await early.close()
  assert.deepEqual(errors, [])
} catch (error) {
  failure = error.stack
  throw error
} finally {
  await writeFile(
    `${directory}/results.json`,
    `${JSON.stringify({ passed: !failure, environment: 'Windows system Chrome; simulated viewports/touch, not physical phones', results, errors, failure }, null, 2)}\n`,
  )
  await browser.close()
  console.log(JSON.stringify({ checks: results.length, errors, failure }))
}
