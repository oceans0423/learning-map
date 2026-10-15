import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../..')
const sourcePath = path.join(root, '人文系課程架構_最新修訂淨版.md')
const dataPath = path.join(import.meta.dirname, 'courses_v1.json')
const overviewPath = path.join(import.meta.dirname, 'courses_v1_overview.md')

const aliases = new Map([
  ['人文地理學概論', '人文地理與地方學'],
  ['AI 輔助程式設計與應用開發', 'AI輔助程式設計與應用開發'],
  ['策展學：理論與實務', '策展理論與實務'],
  ['文化資產保存與傳播', '文化資產行銷與應用'],
  ['人本AI 產品提案與設計', '人本AI產品提案與設計'],
  ['文化事業與管理概論', '文化事業管理概論'],
  ['古典文獻的數據化與文化IP轉譯', '古典文獻的數據化與文化ＩＰ轉譯'],
])

const yearNumber = new Map([
  ['一', 1],
  ['二', 2],
  ['三', 3],
  ['四', 4],
])

function parseUndergraduate(markdown) {
  const rows = []
  for (const line of markdown.split(/\r?\n/)) {
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim())
    if (cells.length !== 8) continue
    const term = cells[0].match(/^([一二三四])(上|下)$/)
    if (!term) continue // Explicitly excludes every 碩士班 row.
    rows.push({
      year: yearNumber.get(term[1]),
      semester: term[2] === '上' ? 1 : 2,
      name: cells[1],
      credits: Number(cells[2]),
      type: cells[3] === '必修' ? 'required' : 'elective',
    })
  }
  return rows
}

function freshCourse(row) {
  return {
    id: 'course-070',
    name: row.name,
    sourceName: row.name,
    year: row.year,
    semester: row.semester,
    credits: row.credits,
    type: row.type,
    role: 'foundation',
    module: '人文思維與方法',
    primaryTrack: null,
    relatedTracks: [],
    subTags: [],
    summary: null,
    activities: [],
    possibleOutputs: [],
    offeringNote: '實際開課依當學年度課表',
    sourceVersion: '整併後最新修訂版（2026-10-15）',
    verification: {
      basic: 'approved',
      role: 'draft',
      tracks: 'draft',
      module: 'approved',
      summary: 'draft',
      activities: 'draft',
      possibleOutputs: 'draft',
    },
  }
}

const markdown = await readFile(sourcePath, 'utf8')
const current = JSON.parse(await readFile(dataPath, 'utf8'))
const rows = parseUndergraduate(markdown)
const oldByNewName = new Map(
  current.courses.map((course) => [aliases.get(course.name) ?? course.name, course]),
)

const courses = rows.map((row) => {
  const old = oldByNewName.get(row.name)
  const base = old ?? freshCourse(row)
  const publicBase = { ...base }
  for (const field of ['instructor', 'employmentType', 'highestDegree', 'expertise']) {
    delete publicBase[field]
  }
  return {
    ...publicBase,
    name: row.name,
    sourceName: row.name,
    year: row.year,
    semester: row.semester,
    credits: row.credits,
    type: row.type,
    sourceVersion: '整併後最新修訂版（2026-10-15）',
    verification: { ...base.verification, basic: 'approved' },
  }
})

const ids = new Set(courses.map((course) => course.id))
if (rows.length !== 69) throw new Error(`Expected 69 undergraduate table rows, got ${rows.length}`)
if (courses.length !== ids.size) throw new Error('Duplicate active course IDs after reconciliation')
if (!ids.has('course-070')) throw new Error('New 研究方法 course did not receive course-070')
if (ids.has('course-049')) throw new Error('Retired 數位策展 course is still active')

const required = courses.filter((course) => course.type === 'required').length
const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0)
current.meta = {
  ...current.meta,
  scope: '大學部最新修訂課程（不含碩士班）',
  totalCourses: courses.length,
  required,
  elective: courses.length - required,
  totalCredits,
  sourceOfTruth: '人文系課程架構_最新修訂淨版.md',
  sourceVersion: '整併後最新修訂版（2026-10-15）',
  normalizationNote:
    '課名依最新修訂淨版逐字呈現；sourceName 與 name 相同。網站不公開碩士班與教師相關欄位。',
  approval:
    '課名、年級、學期、學分與必選修依最新修訂淨版更新；四領域沿用既有核定分類，新增研究方法歸入人文思維與方法。碩士班與教師資料不納入網站。',
  reconciliationNote:
    '來源摘要稱大學部 70 門，但大學部表格實際 69 筆；本資料逐列採表格內容。新增 course-070 研究方法，course-049 數位策展：理論與實務退出現行清單，ID 不回收。',
}
current.courses = courses

await writeFile(dataPath, `${JSON.stringify(current, null, 2)}\n`, 'utf8')
const overview = [
  '# 最新修訂大學部課程分類總表',
  '',
  `**範圍：** ${current.meta.scope}`,
  `**來源：** ${current.meta.sourceOfTruth}`,
  `**統計：** ${courses.length} 門；必修 ${required} 門、選修 ${courses.length - required} 門；共 ${totalCredits} 學分。`,
  '',
  '> 來源摘要稱大學部 70 門，但大學部表格實際為 69 筆；本表逐列採用表格內容。',
  '',
  '| ID | 年級學期 | 課程名稱 | 學分 | 性質 | 四大領域 |',
  '| --- | --- | --- | ---: | --- | --- |',
  ...courses.map(
    (course) =>
      `| ${course.id} | ${course.year} 年級第 ${course.semester} 學期 | ${course.name} | ${course.credits} | ${course.type === 'required' ? '必修' : '選修'} | ${course.module} |`,
  ),
  '',
].join('\n')
await writeFile(overviewPath, overview, 'utf8')
console.log(
  JSON.stringify(
    {
      rows: rows.length,
      required,
      elective: courses.length - required,
      totalCredits,
      added: courses.filter((course) => course.id === 'course-070').map((course) => course.name),
      retired: current.courses.some((course) => course.id === 'course-049') ? [] : ['course-049'],
    },
    null,
    2,
  ),
)
