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
const profiles = JSON.parse(
  await readFile(new URL('../../src/data/zodiacProfiles.json', import.meta.url), 'utf8'),
).profiles
const themes = JSON.parse(
  await readFile(new URL('../../src/data/zodiacCourseThemes.json', import.meta.url), 'utf8'),
).courses
function themeCourses(profile, year = null) {
  const ids = new Set(
    themes
      .filter((theme) => theme.tags.some((tag) => (profile.weights[tag] ?? 0) >= 2))
      .map((theme) => theme.id),
  )
  return catalog.filter((course) => ids.has(course.id) && (!year || course.year === year))
}
const directory = fileURLToPath(new URL('./course-atlas-zodiac-20261009/', import.meta.url))
await mkdir(directory, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
const results = [],
  errors = []
let passed = false,
  failure = null
const key = 'humanities-atlas:personal:v1'
function saved(ids) {
  return {
    version: 1,
    consent: true,
    ids,
    representatives: [],
    name: '保留我的作品名稱',
    initialized: false,
    namedOnce: false,
    completed: false,
  }
}
function url(screen, zodiac) {
  const u = new URL(base)
  u.searchParams.set('mapScreen', screen)
  if (zodiac) u.searchParams.set('mapZodiac', zodiac)
  return u.href
}
async function pageWith(ids, width = 390, options = {}) {
  const page = await browser.newPage({
    viewport: { width, height: width < 768 ? 844 : 1000 },
    ...options,
  })
  page.on('pageerror', (e) => errors.push(e.message))
  const state = saved(ids)
  await page.addInitScript(
    ({ key, state }) => window.localStorage.setItem(key, JSON.stringify(state)),
    { key, state },
  )
  await page.goto(url('mine'))
  return { page, state }
}
async function stored(page) {
  return page.evaluate((key) => JSON.parse(window.localStorage.getItem(key)), key)
}
async function plotted(page) {
  return (
    await page
      .locator('[data-star-ids]')
      .evaluateAll((nodes) => nodes.flatMap((n) => n.dataset.starIds.split(',')))
  ).sort()
}
async function collectThemePages(page, profile) {
  const ids = []
  const notes = {}
  while (true) {
    for (const row of await page
      .locator('[data-atlas-course]')
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          id: node.dataset.atlasCourse,
          note: node.querySelector('.ca-course-theme-note')?.textContent,
          description: node.getAttribute('aria-describedby'),
        })),
      )) {
      ids.push(row.id)
      notes[row.id] = row.note
      assert.equal(row.description, `atlas-course-note-${row.id}`)
      const tag = themes
        .find((theme) => theme.id === row.id)
        .tags.filter((tag) => profile.weights[tag])
        .sort((a, b) => profile.weights[b] - profile.weights[a])[0]
      assert.equal(row.note, `${profile.label}角度：${profile.interpretations[tag]}`)
    }
    const next = page.getByRole('button', { name: '下一頁', exact: true })
    if (!(await next.count()) || (await next.isDisabled())) break
    await next.click()
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      'atlas-zodiac-courses-title',
    )
  }
  return { ids: ids.sort(), notes }
}
async function geometry(page) {
  const layout = await page.evaluate(() => {
    const r = document.querySelector('.ca-star-chart').getBoundingClientRect()
    return {
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      chart: { x: r.x, y: r.y, width: r.width, height: r.height },
      boxes: [...document.querySelectorAll('[data-constellation-slot]')].map((n) => {
        const b = n.getBoundingClientRect()
        return { x: b.x, y: b.y, width: b.width, height: b.height }
      }),
    }
  })
  assert.equal(layout.overflow, false)
  const c = layout.chart
  for (let i = 0; i < layout.boxes.length; i++) {
    const a = layout.boxes[i]
    assert.ok(a.width >= 44 && a.height >= 44, 'minimum 44px touch target')
    assert.ok(
      a.x >= c.x &&
        a.y >= c.y &&
        a.x + a.width <= c.x + c.width &&
        a.y + a.height <= c.y + c.height,
      'star outside chart',
    )
    for (const b of layout.boxes.slice(i + 1))
      assert.ok(
        a.x + a.width <= b.x ||
          b.x + b.width <= a.x ||
          a.y + a.height <= b.y ||
          b.y + b.height <= a.y,
        'overlapping targets: ' + JSON.stringify({ a, b, c }),
      )
  }
  return layout
}
try {
  for (const width of [320, 390, 768, 1024, 1440]) {
    for (const count of [1, 2, 6, 12, 69]) {
      const ids = catalog.slice(0, count).map((c) => c.id)
      const { page, state } = await pageWith(ids, width)
      await page.getByRole('button', { name: '找到我的星座', exact: true }).click()
      assert.equal(await page.evaluate(() => document.activeElement.id), 'atlas-match-title')
      assert.ok((await page.locator('.ca-zodiac-panel').innerText()).includes('配對怎麼來'))
      for (const p of profiles) {
        await page.locator('#atlas-zodiac-shape').selectOption(p.id)
        assert.equal(await page.locator('.ca-constellation').getAttribute('data-zodiac'), p.id)
        assert.deepEqual(await plotted(page), [...ids].sort())
        assert.equal(
          await page.locator('[data-constellation-slot]').count(),
          Math.min(count, p.points.length),
        )
        await geometry(page)
        assert.deepEqual(await stored(page), state)
        results.push({
          check:
            'manual shape, ID coverage, no storage write, non-overlapping bounded touch targets',
          width,
          count,
          zodiac: p.id,
        })
      }
      if (count === 69 && width === 320) {
        await page.evaluate(() => (document.documentElement.style.fontSize = '200%'))
        await page.setViewportSize({ width: 320, height: 400 })
        for (const p of profiles) {
          await page.locator('#atlas-zodiac-shape').selectOption(p.id)
          await geometry(page)
          results.push({ check: '320px / 400px height / 200% root text', zodiac: p.id })
        }
      }
      if (count === 12 && (width === 390 || width === 1440)) {
        await page.locator('#atlas-zodiac-shape').selectOption('taurus')
        await page.screenshot({
          path: `${directory}/${width}-personal-taurus.png`,
          fullPage: true,
        })
      }
      await page.close()
    }
    console.log(`Zodiac geometry completed at ${width}px`)
  }
  const { page: empty, state: emptyState } = await pageWith([])
  assert.equal(
    await empty.getByRole('button', { name: '找到我的星座', exact: true }).count(),
    0,
  )
  await empty.getByRole('button', { name: '探索十二星座', exact: true }).click()
  for (const p of profiles) {
    await empty.locator('#atlas-zodiac-theme').selectOption(p.id)
    assert.deepEqual(
      await plotted(empty),
      themeCourses(p)
        .map((course) => course.id)
        .sort(),
    )
    assert.equal(await empty.locator('[data-atlas-course]').count(), 6)
    assert.ok((await empty.locator('.ca-zodiac-panel').innerText()).includes('設計草案'))
    assert.deepEqual(await stored(empty), emptyState)
    results.push({
      check: 'zero-collection twelve full themes without forced collecting',
      zodiac: p.id,
    })
  }
  for (const width of [390, 1440]) {
    const { page: years, state } = await pageWith([], width)
    await years.getByRole('button', { name: '探索十二星座', exact: true }).click()
    const courseAngles = {}
    for (const p of profiles) {
      await years.locator('#atlas-zodiac-theme').selectOption(p.id)
      const intro = await years.locator('.ca-zodiac-panel').innerText()
      assert.ok(intro.includes(p.tagline) && intro.includes(p.description))
      const reasons = years.locator('.ca-zodiac-reasons')
      if ((await reasons.getAttribute('open')) === null) await reasons.locator('summary').click()
      const body = await reasons.innerText()
      for (const id of p.exampleIds)
        assert.ok(body.includes(catalog.find((course) => course.id === id).name))
      assert.ok(body.includes('不是你的收藏'))
      for (const year of [null, 1, 2, 3, 4]) {
        await years.locator('#atlas-zodiac-year').focus()
        await years.locator('#atlas-zodiac-year').selectOption(year ? String(year) : '')
        assert.equal(await years.evaluate(() => document.activeElement.id), 'atlas-zodiac-year')
        const expected = themeCourses(p, year)
          .map((course) => course.id)
          .sort()
        assert.ok(expected.length > 0)
        assert.deepEqual(await plotted(years), expected)
        await geometry(years)
        const { ids, notes } = await collectThemePages(years, p)
        assert.deepEqual(ids, expected)
        if (!year) courseAngles[p.id] = notes['course-046']
        assert.deepEqual(await stored(years), state)
        results.push({
          check:
            'four-year real course coverage, complete paginated IDs, per-course angle, native control/page focus, no storage mutation',
          width,
          zodiac: p.id,
          year,
          count: expected.length,
        })
      }
      await years.locator('#atlas-zodiac-year').selectOption('')
    }
    assert.notEqual(courseAngles.taurus, courseAngles.pisces)
    if (width === 390) {
      await years.locator('#atlas-zodiac-theme').selectOption('taurus')
      await years.locator('#atlas-zodiac-year').selectOption('3')
      await years.evaluate(() => (document.documentElement.style.fontSize = '200%'))
      await years.setViewportSize({ width: 320, height: 400 })
      await geometry(years)
      assert.equal(
        await years.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
        false,
      )
      await years.screenshot({ path: `${directory}/320-story-200-text.png`, fullPage: true })
    }
    await years.close()
  }
  await empty.locator('#atlas-zodiac-theme').selectOption('taurus')
  await empty.locator('.ca-zodiac-gallery summary').click()
  assert.equal(await empty.locator('.ca-zodiac-gallery button').count(), 12)
  await empty.getByRole('button', { name: '探索巨蟹座', exact: true }).click()
  assert.equal(await empty.locator('#atlas-zodiac-theme').inputValue(), 'cancer')
  await empty.screenshot({ path: `${directory}/390-twelve-gallery.png`, fullPage: true })
  await empty.locator('[data-atlas-course]').first().click()
  await empty.locator('.detail-panel').waitFor()
  const newId = new URL(empty.url()).searchParams.get('course')
  await empty.getByRole('button', { name: /^加入我的課程：/ }).click()
  await empty.keyboard.press('Escape')
  await empty.locator('.detail-panel').waitFor({ state: 'hidden' })
  assert.deepEqual((await stored(empty)).ids, [newId])
  await empty.getByRole('button', { name: '← 返回我的課程', exact: true }).click()
  assert.equal(
    await empty.locator('[data-atlas-course]').getAttribute('data-atlas-course'),
    newId,
  )
  results.push({
    check:
      'gallery changes theme only; one explicit detail add uses same collection and return restores mine',
  })
  await empty.close()

  // Match source and shape choice survive exploration, global search and browser history.
  const { page: flow, state: flowState } = await pageWith(
    ['course-030', 'course-051', 'course-005'],
    390,
    { isMobile: true, hasTouch: true, reducedMotion: 'reduce' },
  )
  await flow.getByRole('button', { name: '找到我的星座', exact: true }).tap()
  await flow.locator('.ca-zodiac-method summary').tap()
  assert.ok(
    (await flow.locator('.ca-zodiac-panel').innerText()).includes(
      catalog.find((c) => c.id === 'course-030').name,
    ),
  )
  await flow.locator('#atlas-zodiac-shape').selectOption('scorpio')
  await flow.getByRole('button', { name: '看看天蠍座的主題課程', exact: true }).tap()
  await flow.locator('#atlas-zodiac-theme').selectOption('taurus')
  await flow.locator('#atlas-zodiac-year').selectOption('3')
  await flow.getByRole('button', { name: '下一頁', exact: true }).tap()
  assert.equal(new URL(flow.url()).searchParams.get('mapZodiacAnchor'), '6')
  await flow.getByLabel('搜尋所有課程', { exact: true }).fill(catalog[68].name)
  await flow.getByRole('button', { name: '搜尋', exact: true }).tap()
  assert.equal(await flow.locator('[data-atlas-course="course-069"]').count(), 1)
  await flow.getByRole('button', { name: '清除搜尋', exact: true }).tap()
  assert.equal(await flow.locator('#atlas-zodiac-theme').inputValue(), 'taurus')
  assert.equal(await flow.locator('#atlas-zodiac-year').inputValue(), '3')
  assert.equal(new URL(flow.url()).searchParams.get('mapZodiacAnchor'), '6')
  await flow.getByRole('button', { name: '← 返回我的課程', exact: true }).tap()
  assert.equal(await flow.locator('#atlas-zodiac-shape').inputValue(), 'scorpio')
  assert.equal(await flow.evaluate(() => document.activeElement.id), 'atlas-explore-matched')
  assert.deepEqual(await plotted(flow), [...flowState.ids].sort())
  await flow.goBack()
  assert.equal(await flow.locator('#atlas-zodiac-theme').inputValue(), 'taurus')
  await flow.getByRole('button', { name: '我的課程（3）', exact: true }).tap()
  assert.equal(new URL(flow.url()).searchParams.get('mapScreen'), 'mine')
  await flow.getByRole('button', { name: '找到我的星座', exact: true }).tap()
  assert.equal(await flow.locator('#atlas-zodiac-shape').inputValue(), 'scorpio')
  assert.deepEqual(await stored(flow), flowState)
  results.push({
    check:
      'mobile touch / reduced motion / matching evidence / manual shape retained / theme global search / Back and source focus',
  })
  await flow.close()

  const { page: direct } = await pageWith([])
  await direct.goto(url('zodiac', 'taurus') + '&mapZodiacYear=3&course=course-046')
  await direct.locator('.detail-panel').waitFor()
  await direct.keyboard.press('Escape')
  await direct.locator('.detail-panel').waitFor({ state: 'hidden' })
  assert.equal(await direct.locator('#atlas-zodiac-theme').inputValue(), 'taurus')
  assert.equal(await direct.locator('#atlas-zodiac-year').inputValue(), '3')
  await direct.getByRole('button', { name: '← 返回我的課程', exact: true }).click()
  assert.equal(new URL(direct.url()).searchParams.get('mapScreen'), 'mine')
  assert.equal(await direct.locator('[data-atlas-course]').count(), 0)
  await direct.close()
  results.push({
    check: 'direct zodiac + course URL closes in place and has safe empty-personal fallback',
  })

  const { page: tie } = await pageWith(['course-020'])
  await tie.getByRole('button', { name: '找到我的星座', exact: true }).click()
  const description = await tie.locator('.ca-zodiac-panel').innerText()
  assert.ok(description.includes('初步結果') && description.includes('同分主題'))
  await tie.close()
  results.push({ check: 'real single-course preliminary result and explicit tie' })

  const { page: rematch } = await pageWith(['course-030', 'course-051', 'course-005'])
  await rematch.getByRole('button', { name: '找到我的星座', exact: true }).click()
  const originalShape = await rematch.locator('.ca-constellation').getAttribute('data-zodiac')
  await rematch.locator('[data-star-ids="course-005"]').click()
  await rematch.getByRole('button', { name: /^移除我的課程：/ }).click()
  assert.notEqual(
    await rematch.locator('.ca-constellation').getAttribute('data-zodiac'),
    originalShape,
  )
  await rematch.keyboard.press('Escape')
  await rematch.locator('.detail-panel').waitFor({ state: 'hidden' })
  assert.equal(await rematch.evaluate(() => document.activeElement.id), 'atlas-content-title')
  assert.deepEqual(await plotted(rematch), ['course-030', 'course-051'])
  await rematch.getByRole('button', { name: '復原最近移除', exact: true }).click()
  assert.equal(
    await rematch.locator('.ca-constellation').getAttribute('data-zodiac'),
    originalShape,
  )
  assert.deepEqual(await plotted(rematch), ['course-005', 'course-030', 'course-051'])
  await rematch.close()
  results.push({
    check:
      'removing a course recomputes automatic shape, restores safe focus rather than unrelated reused slot, and undo rematches',
  })

  // Every new shape keeps the accessible shared detail on narrowed desktop layouts.
  const { page: narrow } = await pageWith(
    catalog.map((c) => c.id),
    1024,
  )
  await narrow.getByRole('button', { name: '找到我的星座', exact: true }).click()
  for (const p of profiles) {
    await narrow.locator('#atlas-zodiac-shape').selectOption(p.id)
    await narrow.locator('[data-constellation-slot]').first().click()
    assert.equal(
      await narrow.evaluate(() => document.activeElement.id),
      'atlas-star-group-title',
    )
    await narrow.locator('[data-star-course]').first().click()
    await narrow.locator('.detail-panel').waitFor()
    await geometry(narrow)
    await narrow.keyboard.press('Escape')
    await narrow.locator('.detail-panel').waitFor({ state: 'hidden' })
    assert.ok(await narrow.evaluate(() => !!document.activeElement.dataset.starCourse))
    await narrow.getByRole('button', { name: '收合星點清單', exact: true }).click()
    assert.ok(await narrow.evaluate(() => !!document.activeElement.dataset.constellationSlot))
    results.push({
      check: 'grouped course details, source focus, 1024px detail-narrowed geometry',
      zodiac: p.id,
    })
  }
  await narrow.close()

  if (axePath)
    for (const width of [390, 1440]) {
      const { page } = await pageWith(
        catalog.slice(0, 12).map((c) => c.id),
        width,
      )
      await page.getByRole('button', { name: '找到我的星座', exact: true }).click()
      await page.addScriptTag({ path: axePath })
      for (const state of ['match', 'explorer', 'reasons', 'year', 'gallery', 'details']) {
        if (state === 'explorer')
          await page.getByRole('button', { name: /^看看.*的主題課程$/ }).click()
        if (state === 'gallery') await page.locator('.ca-zodiac-gallery summary').click()
        if (state === 'reasons') await page.locator('.ca-zodiac-reasons summary').click()
        if (state === 'year') await page.locator('#atlas-zodiac-year').selectOption('3')
        if (state === 'details') await page.locator('[data-atlas-course]').first().click()
        const violations = await page.evaluate(async () =>
          (await window.axe.run()).violations.map((v) => ({
            id: v.id,
            targets: v.nodes.map((n) => n.target),
          })),
        )
        assert.deepEqual(violations, [])
        results.push({ check: 'axe scoped state', width, state })
      }
      if (width === 1440)
        await page.screenshot({ path: `${directory}/1440-explorer-detail.png`, fullPage: true })
      await page.close()
    }
  assert.deepEqual(errors, [])
  passed = true
  console.log(JSON.stringify({ checks: results.length, errors }))
} catch (e) {
  failure = e.stack || String(e)
  throw e
} finally {
  await writeFile(
    `${directory}/results.json`,
    JSON.stringify(
      {
        passed,
        failure,
        results,
        errors,
        environment: 'Windows Chrome; isolated contexts, simulated touch; not physical devices',
      },
      null,
      2,
    ),
  )
  await browser.close()
}
