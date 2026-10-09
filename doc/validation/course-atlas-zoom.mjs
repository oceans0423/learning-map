/* global process, console, window, document */
import { createRequire } from 'node:module'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { URL } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require(process.argv[2])
const base = process.argv[3] || 'http://127.0.0.1:5186/'
const catalog = JSON.parse(
  await readFile(new URL('../../src/data/courses.json', import.meta.url), 'utf8'),
).courses
const profiles = JSON.parse(
  await readFile(new URL('../../src/data/zodiacProfiles.json', import.meta.url), 'utf8'),
).profiles
const results = []
for (const zoom of [1, 2]) {
  const profile = await mkdtemp(join(tmpdir(), 'course-atlas-zoom-'))
  await mkdir(join(profile, 'Default'))
  // Chromium default partition path is empty: GetPartitionKey returns "x".
  // Source: chrome/browser/ui/zoom/chrome_zoom_level_prefs.cc.
  await writeFile(
    join(profile, 'Default', 'Preferences'),
    JSON.stringify({
      partition: { default_zoom_level: { x: Math.log(zoom) / Math.log(1.2) } },
    }),
  )
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chrome',
    headless: true,
    viewport: null,
    args: ['--window-size=1440,1000'],
  })
  try {
    const page = context.pages()[0]
    await page.goto(base)
    await page.locator('.course-atlas').waitFor()
    const overview = await page.evaluate(() => ({
      width: window.innerWidth,
      outer: window.outerWidth,
      dpr: window.devicePixelRatio,
      fontSize: window.getComputedStyle(document.querySelector('.course-atlas')).fontSize,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
    }))
    await page.getByRole('button', { name: '查看全部 69 門課程', exact: true }).click()
    await page.locator('[data-atlas-course]').first().click()
    const details = await page.evaluate(() => ({
      width: document.querySelector('.detail-panel').getBoundingClientRect().width,
      innerWidth: window.innerWidth,
      modal: !!document.querySelector('[aria-modal="true"]'),
      overflow: document.documentElement.scrollWidth > window.innerWidth,
    }))
    await page.keyboard.press('Escape')
    await page.locator('.detail-panel').waitFor({ state: 'hidden' })
    await page.evaluate(
      (ids) =>
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
        ),
      catalog.slice(0, 12).map((course) => course.id),
    )
    const starsUrl = new URL(base)
    starsUrl.searchParams.set('mapScreen', 'constellation')
    starsUrl.searchParams.set('mapZodiac', 'scorpio')
    await page.goto(starsUrl.href)
    await page.locator('.ca-constellation').waitFor()
    const constellation = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      starCount: document.querySelectorAll('[data-constellation-slot]').length,
      targets: [...document.querySelectorAll('[data-constellation-slot]')].map((node) => {
        const { x, y, width, height } = node.getBoundingClientRect()
        return { x, y, width, height }
      }),
    }))
    const zodiacShapes = []
    for (const zodiac of profiles) {
      await page.locator('#atlas-zodiac-shape').selectOption(zodiac.id)
      const shape = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        starCount: document.querySelectorAll('[data-constellation-slot]').length,
        targets: [...document.querySelectorAll('[data-constellation-slot]')].map((node) => {
          const { x, y, width, height } = node.getBoundingClientRect()
          return { x, y, width, height }
        }),
      }))
      zodiacShapes.push({
        id: zodiac.id,
        expected: Math.min(12, zodiac.points.length),
        ...shape,
      })
    }
    results.push({
      requestedBrowserZoom: zoom,
      profile,
      overview,
      details,
      constellation,
      zodiacShapes,
    })
  } finally {
    await context.close()
  }
}
const verified =
  results[1].overview.dpr >= results[0].overview.dpr * 1.9 &&
  results[1].overview.width <= results[0].overview.width / 1.9 &&
  results[1].overview.fontSize === results[0].overview.fontSize
const output = {
  verifiedRealBrowserZoom: verified,
  method:
    'isolated Chrome default_zoom_level preference; viewport:null; no CSS zoom, font-size override, device-scale flag or user profile access',
  results,
}
await writeFile(
  new URL('./course-atlas-v2-20261009/browser-zoom.json', import.meta.url),
  JSON.stringify(output, null, 2),
)
console.log(JSON.stringify(output))
if (
  !verified ||
  results.some(
    (item) =>
      item.overview.overflow ||
      item.details.overflow ||
      item.constellation.overflow ||
      item.constellation.starCount !== 11 ||
      item.zodiacShapes.some(
        (shape) =>
          shape.overflow ||
          shape.starCount !== shape.expected ||
          shape.targets.some(
            (a, index, boxes) =>
              a.width < 44 ||
              a.height < 44 ||
              boxes
                .slice(index + 1)
                .some(
                  (b) =>
                    a.x + a.width > b.x &&
                    b.x + b.width > a.x &&
                    a.y + a.height > b.y &&
                    b.y + b.height > a.y,
                ),
          ),
      ) ||
      item.constellation.targets.some(
        (a, index, boxes) =>
          a.width < 44 ||
          a.height < 44 ||
          boxes
            .slice(index + 1)
            .some(
              (b) =>
                a.x + a.width > b.x &&
                b.x + b.width > a.x &&
                a.y + a.height > b.y &&
                b.y + b.height > a.y,
            ),
      ),
  )
)
  process.exitCode = 1
