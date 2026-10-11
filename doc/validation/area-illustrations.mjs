/* global process, console, window, document, getComputedStyle */
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'
import assert from 'node:assert/strict'

const require = createRequire(import.meta.url)
const { chromium } = require(process.argv[2])
const base = process.argv[3] || 'http://127.0.0.1:5186/'
const directory = fileURLToPath(new URL('./area-illustrations-20261009/', import.meta.url))
await mkdir(directory, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
const results = []
const errors = []
const stems = [
  'humanities-thinking',
  'narrative-creation',
  'digital-humanities',
  'cultural-social-design',
]
let failure = null

async function layout(page) {
  return page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > window.innerWidth,
    searchBottom: document.querySelector('#atlas-search').getBoundingClientRect().bottom,
    cards: [...document.querySelectorAll('[data-area]')].map((node) => {
      const r = node.getBoundingClientRect()
      const image = node.querySelector('img')
      const ir = image.getBoundingClientRect()
      const copy = node.querySelector('.ca-area-copy').getBoundingClientRect()
      return {
        id: node.dataset.area,
        width: r.width,
        height: r.height,
        bottom: r.bottom,
        imageWidth: ir.width,
        imageHeight: ir.height,
        source: image.currentSrc,
        loaded: image.complete && image.naturalWidth > 0,
        headingFits:
          copy.right <= r.right && (copy.right <= ir.left + 1 || copy.bottom <= ir.top + 1),
      }
    }),
    height: window.innerHeight,
  }))
}

try {
  for (const width of [320, 390, 768, 1024, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: width < 768 ? 844 : 1000 },
      hasTouch: width < 768,
      deviceScaleFactor: width < 768 ? 2 : 1,
    })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(base)
    await page.locator('[data-area]').first().waitFor()
    await page
      .locator('.ca-area-artwork img')
      .evaluateAll((images) => Promise.all(images.map((image) => image.decode())))
    const state = await layout(page)
    assert.equal(state.overflow, false)
    assert.equal(state.cards.length, 4)
    assert.ok(state.searchBottom < state.height && state.cards[0].bottom < state.height)
    for (const [index, card] of state.cards.entries()) {
      assert.ok(card.loaded && card.headingFits)
      assert.ok(card.imageWidth >= 80 && card.width >= 44 && card.height >= 44)
      assert.ok(card.source.includes(stems[index]) && card.source.endsWith('.webp'))
    }
    if (width === 390 || width === 1440) {
      await page.screenshot({ path: `${directory}/${width}-overview.png`, fullPage: true })
      if (process.argv[4]) {
        await page.addScriptTag({ path: process.argv[4] })
        const audit = await page.evaluate(() =>
          window.axe.run(document, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
          }),
        )
        assert.deepEqual(
          audit.violations.map((v) => v.id),
          [],
        )
        results.push({ check: 'axe', width, violations: audit.violations.length })
      }
    }
    if (width < 768) {
      await page.locator('[data-area="thinking"] img').tap()
    } else {
      await page.locator('[data-area="thinking"]').focus()
      assert.equal(
        await page
          .locator('[data-area="thinking"]')
          .evaluate((node) => getComputedStyle(node).outlineStyle),
        'solid',
      )
      await page.keyboard.press('Enter')
    }
    await page.locator('[data-atlas-course]').first().waitFor()
    assert.match(await page.locator('.ca-result-count').innerText(), /13/)
    await page.getByRole('button', { name: '← 返回總覽', exact: true }).click()
    await page.getByRole('button', { name: '按年級看', exact: true }).click()
    assert.equal(await page.locator('[data-year] svg').count(), 4)
    assert.equal(await page.locator('.ca-area-artwork').count(), 0)
    results.push({
      check: 'layout, correct artwork, keyboard/touch entry, original year view',
      width,
      ...state,
    })
    await page.close()
  }

  const reduced = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  })
  await reduced.goto(base)
  await reduced.locator('[data-area]').first().hover()
  assert.equal(
    await reduced
      .locator('.ca-area-artwork img')
      .first()
      .evaluate((node) => getComputedStyle(node).transform),
    'none',
  )
  assert.equal(
    await reduced
      .locator('.ca-area-artwork img')
      .first()
      .evaluate((node) => getComputedStyle(node).transitionDuration),
    '0s',
  )
  results.push({ check: 'reduced motion', passed: true })
  await reduced.close()

  const enlarged = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await enlarged.goto(base)
  await enlarged.locator('[data-area]').first().waitFor()
  await enlarged.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })
  const largeState = await layout(enlarged)
  assert.equal(largeState.overflow, false)
  assert.ok(largeState.cards.every((card) => card.headingFits))
  await enlarged.screenshot({ path: `${directory}/390-text-200.png`, fullPage: true })
  results.push({ check: '200% text size at 390px', ...largeState })
  await enlarged.close()

  const failed = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await failed.route('**/images/areas/*.webp', (route) => route.abort())
  await failed.goto(base)
  await failed.locator('[data-area]').first().waitFor()
  const failedState = await layout(failed)
  assert.equal(failedState.overflow, false)
  assert.ok(
    failedState.cards.every((card) => !card.loaded && card.headingFits && card.imageWidth > 0),
  )
  await failed.locator('[data-area="culture"]').click()
  await failed.locator('[data-atlas-course]').first().waitFor()
  assert.match(await failed.locator('.ca-result-count').innerText(), /18/)
  results.push({ check: 'blocked images retain layout and native entry', passed: true })
  await failed.close()
  assert.deepEqual(errors, [])
} catch (error) {
  failure = error.stack
  throw error
} finally {
  await writeFile(
    `${directory}/browser-results.json`,
    `${JSON.stringify({ passed: !failure, browser: 'Chrome', results, errors, failure }, null, 2)}\n`,
  )
  await browser.close()
  console.log(JSON.stringify({ checks: results.length, errors, failure }))
}
