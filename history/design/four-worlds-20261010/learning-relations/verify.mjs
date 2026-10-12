/* global structuredClone */
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath, URL, URLSearchParams } from 'node:url'
import console from 'node:console'
import vm from 'node:vm'
import { introductions, groups } from './editorial.mjs'

const local = (name) => new URL(name, import.meta.url)
const sourceText = readFileSync(local('../../../../src/data/courses.json'), 'utf8')
const canonical = JSON.parse(sourceText).courses
const dataScript = readFileSync(local('learning-data.js'), 'utf8')
const runtimeScript = readFileSync(local('storyboard.js'), 'utf8')
const sourceHash = createHash('sha256').update(sourceText).digest('hex').toUpperCase()
const plain = (value) => JSON.parse(JSON.stringify(value))

function harness(search = '?mode=screen') {
  const nodes = new Map()
  let focused = null
  let popstate
  let index = -1
  const pendingNavigation = []
  const entries = []
  const history = {
    deferred: false,
    replaceState(state) {
      entries[index < 0 ? ++index : index] = structuredClone(state)
    },
    pushState(state) {
      entries.splice(index + 1)
      entries.push(structuredClone(state))
      index += 1
    },
    go(delta) {
      const complete = () => {
        index += delta
        assert.ok(index >= 0 && index < entries.length)
        popstate({ state: entries[index] })
      }
      if (this.deferred) pendingNavigation.push(complete)
      else complete()
    },
  }
  const document = {
    documentElement: { style: { overflow: '' } },
    getElementById(id) {
      if (!id) return null
      if (!nodes.has(id))
        nodes.set(id, {
          focus(options) {
            focused = { id, options }
          },
          getBoundingClientRect() {
            return { top: 100, height: 120 }
          },
        })
      return nodes.get(id)
    },
  }
  const location = { search, href: `http://127.0.0.1/storyboard.html${search}` }
  const window = {
    scrollY: 387,
    innerHeight: 844,
    addEventListener(type, listener) {
      assert.equal(type, 'popstate')
      popstate = listener
    },
    scrollTo(options) {
      this.scrollY = options.top
    },
  }
  const context = vm.createContext({
    document,
    location,
    history,
    window,
    URL,
    URLSearchParams,
  })
  vm.runInContext(dataScript, context)
  vm.runInContext(runtimeScript, context)
  const preview = window.learningPreview()
  preview.route.trail = new Proxy(preview.route.trail, {})
  const sheet = {
    open: false,
    showModal() {
      this.open = true
    },
    setAttribute(key) {
      assert.equal(key, 'open')
      this.open = true
    },
    close() {
      this.open = false
    },
  }
  preview.$refs = {
    sheet,
    map: { inert: false },
    close: { focus() {} },
    sheetBody: { scrollTop: 0 },
  }
  preview.$nextTick = (callback) => callback()
  preview.init()
  return {
    preview,
    context,
    window,
    document,
    history,
    sheet,
    pendingNavigation,
    focused: () => focused,
  }
}

const { context } = harness()
const data = plain(context.learningStory)
assert.equal(data.sourceHash, sourceHash)
assert.equal(data.courses.length, 69)
assert.equal(new Set(data.courses.map((course) => course.id)).size, 69)
assert.equal(data.areas.length, 4)
assert.equal(data.groups.length, 13)
assert.equal(canonical.length, 69)
assert.equal(data.groups.length, groups.length)
assert.equal(new Set(data.groups.map((group) => group.id)).size, 13)
for (const course of data.courses) {
  const original = canonical.find((candidate) => candidate.id === course.id)
  assert.ok(original, course.id)
  for (const field of ['name', 'year', 'semester', 'type', 'credits', 'module'])
    assert.equal(course[field], original[field], `${course.id}.${field}`)
  assert.equal(data.areas.find((area) => area.id === course.area).module, course.module)
  const content = introductions.find(
    ([number]) => course.id === `course-${String(number).padStart(3, '0')}`,
  )
  assert.equal(course.intro, content[1])
  assert.deepEqual(course.abilities, content[2])
  assert.ok(course.intro.length >= 15)
  assert.ok(course.abilities.length >= 1 && course.abilities.length <= 2)
  const relation = data.groups.find((group) => group.id === course.relationId)
  assert.ok(relation.members.some((member) => member.id === course.id))
  assert.equal(relation.area, course.area)
}
const expected = {
  thinking: [6, 4, 1, 2],
  narrative: [2, 10, 11, 3],
  digital: [3, 3, 4, 2],
  culture: [1, 6, 7, 4],
}
for (const area of data.areas) {
  assert.equal(area.navParts.join(''), area.name)
  const own = data.courses.filter((course) => course.area === area.id)
  assert.deepEqual(
    [1, 2, 3, 4].map((year) => own.filter((course) => course.year === year).length),
    expected[area.id],
  )
  assert.ok(own.some((course) => course.id === area.representative))
  assert.equal(area.years.length, 4)
  assert.ok(existsSync(fileURLToPath(local(area.thumbnail))), area.thumbnail)
}
for (const group of data.groups) {
  assert.ok(group.members.length >= 4 && group.members.length <= 8)
  assert.equal(new Set(group.members.map((member) => member.id)).size, group.members.length)
  for (const member of group.members) {
    assert.ok(data.courses.some((course) => course.id === member.id))
    assert.ok(member.reason.length >= 10)
  }
}
for (const asset of ['../vendor/alpine.min.js', '../favicon.svg', 'storyboard.css'])
  assert.ok(existsSync(fileURLToPath(local(asset))), asset)

for (const area of data.areas) {
  const h = harness(`?mode=screen&area=${area.id}`)
  const { preview, window, sheet } = h
  assert.equal(preview.domain.id, area.id)
  assert.equal(
    preview.domainCourses.length,
    expected[area.id].reduce((sum, value) => sum + value, 0),
  )
  assert.equal(new URL(preview.screenUrl('relations', true)).searchParams.get('area'), area.id)
  assert.equal(new URL(preview.screenUrl('relations', true)).searchParams.get('embedded'), '1')
  for (const course of preview.domainCourses) {
    window.scrollY = 387
    preview.openCourse(course.id)
    assert.equal(preview.selected.id, course.id)
    assert.equal(preview.hasRelation, true)
    preview.toggleRelations()
    assert.equal(preview.route.view, 'relations')
    preview.closeCourse()
    assert.equal(window.scrollY, 387)
    assert.equal(h.focused().id, course.id)
  }
  for (let cycle = 0; cycle < 3; cycle += 1) {
    window.scrollY = 387
    preview.openCourse(area.representative)
    assert.equal(sheet.open, true)
    preview.toggleRelations()
    const groupId = preview.relation.id
    const related = preview.relation.members.find((member) => member.id !== area.representative)
    preview.$refs.sheetBody.scrollTop = 260
    preview.openCourse(related.id)
    assert.equal(preview.previous.id, area.representative)
    assert.equal(preview.relation.id, groupId)
    preview.backWithinSheet()
    assert.equal(preview.route.view, 'relations')
    assert.equal(preview.$refs.sheetBody.scrollTop, 260)
    preview.toggleRelations()
    assert.equal(preview.route.view, 'detail')
    preview.closeCourse()
    assert.equal(preview.route.depth, 0)
    assert.equal(sheet.open, false)
    assert.equal(h.document.documentElement.style.overflow, '')
    assert.equal(window.scrollY, 387)
    assert.equal(h.focused().id, area.representative)
    assert.equal(h.focused().options.preventScroll, true)
  }
  preview.openCourse('missing')
  assert.equal(preview.route.view, 'overview')
  for (const state of ['overview', 'detail', 'relations', 'return']) {
    const initial = harness(`?mode=screen&area=${area.id}&state=${state}`).preview
    assert.equal(initial.route.view, state === 'return' ? 'overview' : state)
    if (state === 'return') assert.equal(initial.origin, area.representative)
  }
}

const cross = harness('?mode=screen&area=narrative')
cross.preview.openCourse('course-046')
cross.preview.toggleRelations()
cross.preview.$refs.sheetBody.scrollTop = 411
cross.preview.openCourse('course-013')
assert.equal(cross.preview.selected.area, 'thinking')
assert.equal(cross.preview.domain.id, 'narrative')
assert.equal(cross.preview.relation.id, 'nature-writing')
cross.preview.toggleRelations()
assert.equal(cross.preview.relation.id, 'nature-writing')
cross.preview.backWithinSheet()
assert.equal(cross.preview.selected.id, 'course-046')
assert.equal(cross.preview.$refs.sheetBody.scrollTop, 411)
cross.preview.closeCourse()
assert.equal(cross.focused().id, 'course-046')

const rapid = harness()
rapid.preview.openCourse('course-049')
rapid.preview.toggleRelations()
rapid.preview.openCourse('course-030')
rapid.history.deferred = true
rapid.preview.backWithinSheet()
rapid.preview.closeCourse()
assert.equal(rapid.pendingNavigation.length, 1)
assert.equal(rapid.preview.closeQueued, true)
rapid.pendingNavigation.shift()()
assert.equal(rapid.preview.route.id, 'course-049')
assert.equal(rapid.pendingNavigation.length, 1)
rapid.pendingNavigation.shift()()
assert.equal(rapid.preview.route.view, 'overview')
assert.equal(rapid.preview.navigationPending, false)
assert.equal(rapid.preview.closeQueued, false)
assert.equal(rapid.focused().id, 'course-049')
assert.equal(harness('?mode=screen&area=unknown').preview.domain.id, 'digital')
assert.equal(harness('?area=narrative').preview.domain.id, 'narrative')
const embedded = harness('?mode=screen&area=culture&state=detail&embedded=1')
assert.equal(embedded.preview.$refs.map.inert, true)
embedded.preview.closeCourse()
assert.equal(embedded.preview.$refs.map.inert, false)
console.log('PASS: 69 門事實與介紹、四領域 13/26/12/18、四年分布、13 組關聯與素材。')
console.log('PASS: 全部課程可開啟、四領域各三輪操作、16 個初始狀態、焦點與兩層捲動返回。')
console.log('PASS: 跨域關聯保留原組與原領域、無效參數降級、非同步返回途中快速關閉。')
console.log('注意：狀態模型不是讀屏、實機觸控或學生理解測試。')
console.log(`課程來源 SHA256: ${sourceHash}`)
