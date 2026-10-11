import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { URL, fileURLToPath } from 'node:url'
import console from 'node:console'
import { format, resolveConfig } from 'prettier'
import { areas, introductions, groups } from './editorial.mjs'

const local = (name) => new URL(name, import.meta.url)
const formatting = (await resolveConfig(fileURLToPath(local('learning-data.js')))) || {}
const source = readFileSync(local('../../../../src/data/courses.json'))
const sourceHash = createHash('sha256').update(source).digest('hex').toUpperCase()
assert.equal(
  sourceHash,
  '9A97CD17551A8F8E4218536AFEDECC843019F5CF4C8CAD32C04D37A3FD744691',
  '來源有變，請先重新核對課程事實。',
)
const idFor = (number) => `course-${String(number).padStart(3, '0')}`
const content = new Map(
  introductions.map(([number, intro, abilities]) => [idFor(number), { intro, abilities }]),
)
assert.equal(content.size, introductions.length, '介紹 ID 不可重複。')
const primary = new Map()
const relations = groups.map(({ primary: numbers, members, ...group }) => {
  const ids = members.map(([number]) => idFor(number))
  assert.equal(new Set(ids).size, ids.length, group.id)
  for (const number of numbers) {
    const id = idFor(number)
    assert.ok(!primary.has(id), `主要關聯重複：${id}`)
    assert.ok(ids.includes(id), `主要課程不在組內：${id}`)
    primary.set(id, group.id)
  }
  return {
    ...group,
    members: members.map(([number, reason]) => ({ id: idFor(number), reason })),
  }
})
const courses = JSON.parse(source.toString('utf8')).courses.map(
  ({ id, name, year, semester, type, credits, module }) => {
    assert.ok(content.has(id), `缺少介紹：${id}`)
    assert.ok(primary.has(id), `缺少主要關聯：${id}`)
    const area = areas.find((item) => item.module === module)
    assert.ok(area, `未知領域：${module}`)
    assert.equal(
      relations.find((group) => group.id === primary.get(id)).area,
      area.id,
      `主要關聯領域不符：${id}`,
    )
    return {
      id,
      name,
      year,
      semester,
      type,
      credits,
      module,
      area: area.id,
      ...content.get(id),
      relationId: primary.get(id),
    }
  },
)
assert.equal(courses.length, content.size)
assert.equal(courses.length, primary.size)
const known = new Set(courses.map((course) => course.id))
for (const group of relations)
  for (const member of group.members) assert.ok(known.has(member.id), member.id)
const data = {
  version: 'four-domains-2026-10-10',
  sourceHash,
  areas: areas.map((area) => ({
    ...area,
    thumbnail: `../assets/${area.id}-thumbnail.webp`,
    years: area.years.map((title, index) => ({ year: index + 1, title })),
  })),
  courses,
  groups: relations,
}
writeFileSync(
  local('learning-data.js'),
  await format(
    `/* 由 build-data.mjs 產生；請修改 editorial.mjs，不改課程來源。 */\nglobalThis.learningStory = ${JSON.stringify(data, null, 2)}\n`,
    { ...formatting, parser: 'babel' },
  ),
)
const lines = [
  '# 四領域課程介紹與學習關聯',
  '',
  '日期：2026-10-10。課程事實來自原始 JSON；介紹與能力是依課名及學系方向撰寫的設計內容，尚未逐筆對照訪談 metadata。不是先修規則或已完成的課程大綱。',
  '',
  '由 `build-data.mjs` 產生；內容請修改 `editorial.mjs`。',
  '',
]
for (const area of data.areas) {
  const own = courses.filter((course) => course.area === area.id)
  lines.push(
    `## ${area.name}（${own.length} 門）`,
    '',
    area.goal,
    '',
    '| 年級 | 課程數 | 學習方向 |',
    '| --- | ---: | --- |',
  )
  for (const stage of area.years)
    lines.push(
      `| 大${['一', '二', '三', '四'][stage.year - 1]} | ${own.filter((course) => course.year === stage.year).length} | ${stage.title} |`,
    )
  lines.push('', '| ID | 課程 | 介紹 | 能力重點 |', '| --- | --- | --- | --- |')
  for (const course of own)
    lines.push(
      `| ${course.id} | ${course.name} | ${course.intro} | ${course.abilities.join('、')} |`,
    )
  lines.push('')
  for (const group of relations.filter((item) => item.area === area.id)) {
    lines.push(
      `### ${group.title}`,
      '',
      group.description,
      '',
      '| 年級 | 課程／領域 | 在這個方向中的作用 |',
      '| --- | --- | --- |',
    )
    for (const member of [...group.members].sort((a, b) => {
      const left = courses.find((course) => course.id === a.id)
      const right = courses.find((course) => course.id === b.id)
      return (
        left.year - right.year ||
        left.semester - right.semester ||
        left.id.localeCompare(right.id)
      )
    })) {
      const course = courses.find((item) => item.id === member.id)
      const domain = data.areas.find((item) => item.id === course.area)
      lines.push(
        `| 大${['一', '二', '三', '四'][course.year - 1]} | ${course.name}${course.area === area.id ? '' : `（${domain.name}）`} | ${member.reason} |`,
      )
    }
    lines.push('')
  }
}
writeFileSync(
  local('CONTENT.md'),
  await format(lines.join('\n'), { ...formatting, parser: 'markdown' }),
)
console.log(
  `已生成 ${courses.length} 門介紹、${relations.length} 組關聯；來源 SHA256 ${sourceHash}`,
)
