/* global process, console, document, window, URL, innerWidth, innerHeight */
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const { chromium } = createRequire(import.meta.url)(process.argv[2])
const axePath =
  'C:/Users/user/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/axe-core/axe.min.js'
const dir = fileURLToPath(new URL('./uiux-audit-20261009/', import.meta.url))
await mkdir(dir, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
const report = {
  date: '2026-10-09 Asia/Taipei',
  base: 'http://127.0.0.1:5181/',
  browser: browser.version(),
  method:
    'Isolated temporary browser contexts; no user browser data or application source changes',
  screens: [],
  probes: [],
  untested: ['students', 'screen reader', 'real phones', 'Safari', 'Firefox', 'OS IME'],
}
const focus = (page) =>
  page.evaluate(() => ({
    tag: document.activeElement.tagName,
    text: document.activeElement.textContent?.trim().slice(0, 100),
    label: document.activeElement.getAttribute('aria-label'),
  }))
async function scan(page, label, width) {
  await page.addScriptTag({ path: axePath })
  const axe = await page.evaluate(async () => {
    const result = await window.axe.run(document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'],
      },
    })
    return {
      version: result.testEngine.version,
      violations: result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        help: v.help,
        tags: v.tags,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          html: n.html,
          summary: n.failureSummary,
        })),
      })),
      incomplete: result.incomplete.map((v) => ({ id: v.id, nodes: v.nodes.length })),
      passes: result.passes.length,
    }
  })
  const metrics = await page.evaluate(() => {
    const regions = [
      '.wb-intro',
      '.wb-signals',
      '.wb-toolbar',
      '.wb-search',
      '#curriculum',
      '.atlas-overview',
      '.atlas-scene',
      '.wb-note-intro',
      '.constellation-canvas',
      '.star-move-toolbar',
      '.personal-storage-controls',
      '.representative-picker',
    ]
    return {
      pageHeight: document.documentElement.scrollHeight,
      viewportHeight: innerHeight,
      overflow: document.documentElement.scrollWidth > innerWidth,
      imgCount: document.querySelectorAll('img,picture,video,canvas').length,
      svgs: document.querySelectorAll('svg').length,
      headings: [...document.querySelectorAll('h1,h2,h3,h4')]
        .filter((e) => e.getClientRects().length)
        .map((e) => ({ tag: e.tagName, text: e.textContent })),
      regions: regions.flatMap((selector) => {
        const e = document.querySelector(selector)
        if (!e || !e.getClientRects().length) return []
        const r = e.getBoundingClientRect()
        return [{ selector, top: r.top + window.scrollY, width: r.width, height: r.height }]
      }),
      interactive: [...document.querySelectorAll('button,input,select,summary,a')].filter(
        (e) => e.getClientRects().length && !e.closest('[inert]'),
      ).length,
    }
  })
  report.screens.push({ label, width, axe, metrics })
}
try {
  for (const width of [390, 1440]) {
    console.log('review', width)
    const context = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 1000 },
      hasTouch: width === 390,
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(report.base)
    await page.screenshot({ path: dir + width + '-home.png' })
    await page.screenshot({ path: dir + width + '-home-full.png', fullPage: true })
    await scan(page, 'home', width)
    await page.getByRole('button', { name: '查看大二課程' }).click()
    await page.getByRole('group', { name: '選擇學期' }).getByRole('button').nth(1).click()
    await page.getByRole('button', { name: '文本思辨', exact: true }).click()
    await page.locator('#curriculum').scrollIntoViewIfNeeded()
    await page.screenshot({ path: dir + width + '-semester.png' })
    await scan(page, 'semester-signal', width)
    await page.locator('.atlas-course').first().click()
    await page.screenshot({ path: dir + width + '-note.png' })
    await scan(page, 'course-note', width)
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => !document.querySelector('.detail-panel'))
    await page.getByRole('button', { name: '所有課程', exact: true }).click()
    await page.locator('#curriculum').scrollIntoViewIfNeeded()
    await page.screenshot({ path: dir + width + '-list.png' })
    for (let i = 0; i < 9; i++) {
      await page.locator('[data-list-id]').nth(i).click()
      await page.locator('.collection-toggle').click()
      await page.getByRole('button', { name: '關閉課程詳情' }).click()
      await page.waitForFunction(() => !document.querySelector('.detail-panel'))
    }
    await page.locator('.collection-summary').click()
    await page.locator('#curriculum').scrollIntoViewIfNeeded()
    await page.screenshot({ path: dir + width + '-collection.png' })
    await scan(page, 'collection', width)
    await page.getByRole('searchbox', { name: '搜尋所有課程' }).fill('數據化與文化')
    report.probes.push({
      width,
      case: 'global-search-in-collection',
      countText: await page.locator('.wb-search-count').innerText(),
      searchResultButtons: await page.locator('[data-search-id]').count(),
      collectionRows: await page.locator('.collection-list li').count(),
    })
    await page.getByRole('button', { name: '清除搜尋', exact: true }).click()
    await page.getByRole('button', { name: '我的星座（選用）' }).click()
    await page.screenshot({ path: dir + width + '-editor-entry.png' })
    await page.screenshot({ path: dir + width + '-editor-full.png', fullPage: true })
    await scan(page, 'editor', width)
    await page.locator('.constellation-art').screenshot({ path: dir + width + '-art.png' })
    await page.getByRole('searchbox', { name: '搜尋所有課程' }).fill('數據化與文化')
    await page.locator('.wb-search').scrollIntoViewIfNeeded()
    await page.screenshot({ path: dir + width + '-search-no-results.png' })
    report.probes.push({
      width,
      case: 'global-search-in-editor',
      countText: await page.locator('.wb-search-count').innerText(),
      searchResultButtons: await page.locator('[data-search-id]').count(),
      editorRemains: await page.locator('.constellation-editor').count(),
    })
    await page.getByRole('button', { name: '清除搜尋', exact: true }).click()
    const ninth = page.locator('[data-representative-id]').nth(8)
    await ninth.click()
    await page.getByRole('button', { name: '取消替換', exact: true }).click()
    report.probes.push({ width, case: 'replacement-cancel-focus', focus: await focus(page) })
    await ninth.click()
    await page.locator('.replacement-panel button').first().click()
    report.probes.push({ width, case: 'replacement-commit-focus', focus: await focus(page) })
    await page.getByRole('textbox', { name: '為你的星座命名' }).fill('已提交名稱')
    await page.getByRole('button', { name: '完成這個星座', exact: true }).click()
    await page.getByRole('button', { name: '儲存在這台裝置', exact: true }).click()
    await page.getByRole('textbox', { name: '為你的星座命名' }).fill('尚未提交的新名稱')
    report.probes.push({
      width,
      case: 'name-draft-versus-saved',
      visibleDraft: await page.locator('#constellation-name').inputValue(),
      displayedName: await page.locator('.constellation-name-display').innerText(),
      storageStatus: await page.locator('.personal-storage-controls [role=status]').innerText(),
    })
    // Colliding placements are legal; check whether both handles remain directly reachable.
    const selection = page.locator('#star-selector')
    await selection.selectOption({ index: 0 })
    await page.getByRole('button', { name: '移動模式', exact: true }).click()
    for (let i = 0; i < 40; i++)
      await page.getByRole('button', { name: '右 →', exact: true }).click()
    for (let i = 0; i < 40; i++)
      await page.getByRole('button', { name: '下 ↓', exact: true }).click()
    await page.getByRole('button', { name: '完成移動', exact: true }).click()
    await selection.selectOption({ index: 1 })
    await page.getByRole('button', { name: '移動模式', exact: true }).click()
    for (let i = 0; i < 40; i++)
      await page.getByRole('button', { name: '右 →', exact: true }).click()
    for (let i = 0; i < 40; i++)
      await page.getByRole('button', { name: '下 ↓', exact: true }).click()
    await page.getByRole('button', { name: '完成移動', exact: true }).click()
    const collisions = await page.locator('.star-grip').evaluateAll((nodes) => {
      const rects = nodes.map((e) => e.getBoundingClientRect())
      return rects.flatMap((a, i) =>
        rects
          .slice(i + 1)
          .flatMap((b, j) =>
            a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
              ? [{ a: i, b: i + j + 1 }]
              : [],
          ),
      )
    })
    report.probes.push({ width, case: 'legal-position-collisions', collisions })
    await page
      .locator('.constellation-art')
      .screenshot({ path: dir + width + '-collision.png' })
    await page.getByRole('button', { name: '繼續探索課程', exact: true }).click()
    report.probes.push({ width, case: 'return-editor-focus', focus: await focus(page), errors })
    await context.close()
  }
  for (const width of [320, 360, 768, 1024]) {
    const page = await browser.newPage({
      viewport: { width, height: 720 },
      reducedMotion: 'reduce',
    })
    await page.goto(report.base)
    await scan(page, 'responsive-home', width)
    await page.screenshot({ path: dir + width + '-home.png' })
    await page.close()
  }
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    forcedColors: 'active',
  })
  await page.goto(report.base + '?atlas=2&sem=2')
  await page.locator('#curriculum').scrollIntoViewIfNeeded()
  await page.screenshot({ path: dir + '390-forced-colors.png' })
  await scan(page, 'forced-colors-semester', 390)
  // Pure keyboard inspection, no focus() calls.
  await page.emulateMedia({ forcedColors: 'none' })
  await page.goto(report.base)
  let sequence = []
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab')
    sequence.push(await focus(page))
  }
  report.probes.push({ case: 'initial-30-tabs', sequence })
  await page.close()
} finally {
  await writeFile(dir + 'results.json', JSON.stringify(report, null, 2))
  await browser.close()
}
console.log(
  JSON.stringify({
    screens: report.screens.map((s) => ({
      label: s.label,
      width: s.width,
      height: s.metrics.pageHeight,
      axe: s.axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
    })),
    probes: report.probes,
  }),
)
