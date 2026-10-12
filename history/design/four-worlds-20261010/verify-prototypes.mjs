import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { fileURLToPath, URLSearchParams } from 'node:url'
import console from 'node:console'

const taskDir = path.dirname(fileURLToPath(import.meta.url))
const sourceBytes = fs.readFileSync(path.resolve(taskDir, '../../../src/data/courses.json'))
const source = JSON.parse(sourceBytes)
const sourceHash = crypto.createHash('sha256').update(sourceBytes).digest('hex').toUpperCase()
assert.equal(sourceHash, '9A97CD17551A8F8E4218536AFEDECC843019F5CF4C8CAD32C04D37A3FD744691')
const checks = []
for (let run = 1; run <= 3; run++) {
  for (const variant of ['a', 'b']) {
    const html = fs.readFileSync(path.join(taskDir, `atlas-${variant}.html`), 'utf8')
    const data = JSON.parse(html.match(/window\.ATLAS_DATA = (.*);/)[1])
    const modelSource = fs.readFileSync(path.join(taskDir, 'prototype-runtime.js'), 'utf8')
    let factory
    let reduced = false
    let animations = 0
    const root = {
      querySelectorAll: () => [
        {
          getAnimations: () => [],
          animate: () => {
            animations++
          },
        },
      ],
    }
    const context = vm.createContext({
      window: {
        ATLAS_DATA: data,
        Alpine: {
          data: (_name, builder) => {
            factory = builder
          },
        },
        matchMedia: () => ({ matches: reduced }),
      },
      document: { addEventListener: (_event, callback) => callback() },
      URLSearchParams,
    })
    vm.runInContext(modelSource, context)
    const model = factory()
    model.$nextTick = (callback) => callback()
    model.$root = root
    assert.equal(model.courses.length, 69)
    assert.equal(new Set(model.courses.map((course) => course.id)).size, 69)
    assert.deepEqual(Array.from(model.areas.map((area) => area.count)), [13, 26, 12, 18])
    for (const course of model.courses) {
      const original = source.courses.find((item) => item.id === course.id)
      assert.ok(original)
      assert.deepEqual(
        [course.name, course.year, course.semester, course.credits, course.type],
        [original.name, original.year, original.semester, original.credits, original.type],
      )
    }
    model.focusArea(2)
    assert.equal(model.domainCourses.length, 12)
    assert.deepEqual(
      [1, 2, 3, 4].map((year) => model.countFor(year)),
      [3, 3, 4, 2],
    )
    assert.equal(model.domainCourses.filter((course) => course.intro).length, 5)
    assert.equal(model.results.length, 12)
    assert.equal(model.totalPages, 6)
    model.query = '古典文獻'
    assert.equal(model.filteredCourses.length, 1)
    assert.equal(model.results[0].id, 'course-068')
    model.query = ''
    model.yearFilter = '2'
    model.typeFilter = 'required'
    assert.equal(
      model.filteredCourses.length,
      source.courses.filter((course) => course.year === 2 && course.type === 'required').length,
    )
    model.query = '沒有這個課名'
    assert.equal(model.results.length, 0)
    assert.equal(model.totalPages, 1)
    model.toggleSaved('course-068')
    assert.equal(model.savedCourses[0].id, 'course-068')
    model.toggleSaved('course-068')
    assert.equal(model.savedIds.length, 0)
    assert.equal(factory().savedIds.length, 0)
    model.focusArea(0)
    model.shiftArea(-1)
    assert.equal(model.selected, 0)
    model.focusArea(3)
    model.shiftArea(1)
    assert.equal(model.selected, 3)
    const before = animations
    reduced = true
    model.focusArea(2)
    assert.equal(model.selected, 2)
    assert.equal(animations, before)
    assert.ok(!html.includes('%%'))
    assert.ok(!/待審|待核定|課程說明待確認/.test(html))
    assert.ok(fs.existsSync(path.join(taskDir, 'vendor/alpine.min.js')))
    const artworkHashes = []
    for (const areaId of ['thinking', 'narrative', 'digital', 'culture']) {
      const area = data.areas.find((item) => item.id === areaId)
      assert.equal(area.image, `assets/${areaId}-mother.webp`)
      assert.equal(area.focusImage, `assets/${areaId}-focus.webp`)
      assert.equal(area.thumbnail, `assets/${areaId}-thumbnail.webp`)
      const recordName = areaId === 'digital' ? 'artwork.json' : `artwork-${areaId}.json`
      const record = JSON.parse(
        fs.readFileSync(path.join(taskDir, 'assets', recordName), 'utf8'),
      )
      const original = fs.readFileSync(path.resolve(taskDir, '../../..', record.originalPath))
      assert.equal(
        crypto.createHash('sha256').update(original).digest('hex').toUpperCase(),
        record.originalSHA256,
        `Original artwork changed: ${areaId}`,
      )
      artworkHashes.push(record.originalSHA256)
      for (const file of [area.image, area.focusImage, area.thumbnail]) {
        assert.ok(fs.existsSync(path.join(taskDir, file)), `Missing illustration: ${file}`)
        const output = record.outputs.find((item) => item.taskPath === file)
        assert.ok(output, `Missing processing record: ${file}`)
        assert.ok(
          fs
            .readFileSync(path.join(taskDir, file))
            .equals(fs.readFileSync(path.resolve(taskDir, '../../..', output.publicPath))),
          `Public and prototype artwork differ: ${file}`,
        )
      }
      for (const file of variant === 'b'
        ? [area.image, area.focusImage, area.thumbnail]
        : [area.image])
        assert.ok(html.includes(`src="${file}"`), `Image not embedded: ${file}`)
    }
    assert.equal(new Set(artworkHashes).size, 4, 'Each area must have its own original artwork')
    assert.ok(
      !html.includes(':src="area.image"'),
      'Dynamic paths would break offline embedding',
    )
    checks.push({
      run,
      variant,
      status: 'PASS',
      courses: 69,
      digitalCourses: 12,
      years: [3, 3, 4, 2],
      introductoryCourses: 5,
      illustratedAreas: ['thinking', 'narrative', 'digital', 'culture'],
      modelChecks:
        'search, paging, empty results, collection, bounds, reduced motion, artwork paths',
    })
  }
  console.log(
    `Prototype verification ${run}/3: PASS for A and B (course facts, view-model transitions, search, collection, reduced-motion branch).`,
  )
}
fs.writeFileSync(
  path.join(taskDir, 'verification.json'),
  JSON.stringify(
    {
      sourceHash,
      checks,
      scope: 'Data and view-model checks; browser evidence is stored separately.',
    },
    null,
    2,
  ) + '\n',
)
