import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import console from 'node:console'

const taskDir = path.dirname(fileURLToPath(import.meta.url))
const projectDir = path.resolve(taskDir, '../../..')
const sourcePath = path.join(projectDir, 'src/data/courses.json')
const sourceBytes = fs.readFileSync(sourcePath)
const sourceHash = crypto.createHash('sha256').update(sourceBytes).digest('hex').toUpperCase()
if (sourceHash !== '9A97CD17551A8F8E4218536AFEDECC843019F5CF4C8CAD32C04D37A3FD744691') {
  throw new Error('Course source changed. Recheck facts before refreshing the samples.')
}
const source = JSON.parse(sourceBytes.toString('utf8'))
const areas = [
  {
    id: 'thinking',
    name: '人文思維與方法',
    module: '人文思維與方法',
    scene: '觀點觀測庭',
    color: '#8F68D8',
    goal: '從閱讀與觀察出發，練習提出問題、理解不同觀點。',
    ability: '提問・觀察・理解',
    phases: ['建立人文視野', '分析文本與脈絡', '練習研究方法', '整合問題與觀點'],
  },
  {
    id: 'narrative',
    name: '敘事與內容創作',
    module: '文學創作',
    scene: '故事製造所',
    color: '#ED8855',
    goal: '把理解與想像，轉成能被閱讀、理解與傳播的內容。',
    ability: '敘事・表達・編輯',
    phases: ['認識語言與敘事', '練習多元寫作', '發展內容與編輯', '整合創作與傳播'],
  },
  {
    id: 'digital',
    name: '數位人文',
    module: '數位人文',
    scene: '資料實驗場',
    color: '#439ED4',
    goal: '用資料與數位方法，探索人文問題的理解與呈現方式。',
    ability: '文本・資料・數位媒介',
    phases: [
      '認識數位人文與媒介',
      '嘗試分析與工具應用',
      '探索互動、空間與策展',
      '連結文本資料與文化轉譯',
    ],
  },
  {
    id: 'culture',
    name: '文化創意與社會設計',
    module: '文化創意與社會設計',
    scene: '文化共創街區',
    color: '#45AA8C',
    goal: '理解地方與社會需求，練習把想法發展為文化提案與實踐。',
    ability: '地方・企劃・實踐',
    phases: ['認識文化與地方', '發展企劃與設計', '整合專題與實踐', '連結現場與應用'],
  },
]
const introductions = {
  'course-008': {
    intro: '學習數位人文的基本方法，連結人文問題與數位工具。',
    abilities: ['問題界定', '數位方法理解'],
  },
  'course-019': {
    intro: '整理並分析文本資料，從資料中辨認模式與解讀意義。',
    abilities: ['資料整理', '文本分析'],
  },
  'course-030': {
    intro: '運用 AI 輔助程式設計，將問題需求轉為應用構想與實作。',
    abilities: ['需求拆解', '工具應用與檢查'],
  },
  'course-049': {
    intro: '學習組織策展內容，運用數位媒介設計觀眾的閱讀體驗。',
    abilities: ['內容組織', '數位呈現'],
  },
  'course-068': {
    intro: '將古典文獻整理為數位資料，發展文化內容與 IP 轉譯。',
    abilities: ['文獻資料整理', '文化轉譯'],
  },
}
const courses = source.courses
  .map(({ id, name, year, semester, credits, type, module }) => ({
    id,
    name,
    year,
    semester,
    credits,
    type,
    area: areas.findIndex((area) => area.module === module),
    intro: introductions[id]?.intro || '',
    abilities: introductions[id]?.abilities || [],
  }))
  .sort((a, b) => a.year - b.year || a.semester - b.semester || a.id.localeCompare(b.id))
if (courses.length !== 69 || courses.some((course) => course.area < 0))
  throw new Error('Incomplete course coverage.')
for (const [index, area] of areas.entries()) {
  area.count = courses.filter((course) => course.area === index).length
  area.image =
    ['webp', 'png']
      .map((extension) => `assets/${area.id}-mother.${extension}`)
      .find((file) => fs.existsSync(path.join(taskDir, file))) || ''
  area.focusImage = fs.existsSync(path.join(taskDir, `assets/${area.id}-focus.webp`))
    ? `assets/${area.id}-focus.webp`
    : area.image
  area.thumbnail = fs.existsSync(path.join(taskDir, `assets/${area.id}-thumbnail.webp`))
    ? `assets/${area.id}-thumbnail.webp`
    : area.image
}
const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
const template = fs.readFileSync(path.join(taskDir, 'prototype.template.html'), 'utf8')
const css = fs.readFileSync(path.join(taskDir, 'prototype.css'), 'utf8')
const runtime = ['gestures.js', 'prototype-runtime.js']
  .map((file) => fs.readFileSync(path.join(taskDir, file), 'utf8'))
  .join('\n')
const license = fs.readFileSync(path.join(taskDir, 'vendor/LICENSE.md'), 'utf8')
const data = JSON.stringify({ areas, courses }).replaceAll('<', '\\u003c')
// Static src attributes let the comparison generator embed every image offline.
const sceneImages = (focused) =>
  areas
    .flatMap((area, index) =>
      area.image
        ? [
            `<img src="${focused ? area.focusImage : area.image}" alt="" class="mother-art" x-show="selected === ${index}" style="display:none" decoding="async">`,
          ]
        : [],
    )
    .join('')
for (const variant of ['a', 'b']) {
  const buttons = areas
    .map(
      (area, index) => `
    <button type="button" class="area-choice area-${index}" style="--area-color:${area.color}" @click="focusArea(${index})" :aria-pressed="selected === ${index}" :class="{ 'is-selected': selected === ${index} }" aria-label="比較${escapeHtml(area.name)}">
      <span class="area-art${area.image ? ' has-artwork' : ''}" aria-hidden="true">${area.image ? `<img src="${variant === 'b' ? area.thumbnail : area.image}" alt="" class="mother-art" decoding="async">` : `<span class="art-index">0${index + 1}</span>`}</span>
      <span class="area-label"><span class="scene-alias">${escapeHtml(area.scene)}</span><strong>${area.id === 'culture' ? '文化創意與<wbr>社會設計' : escapeHtml(area.name)}</strong><span class="area-count">${area.count} 門課<span class="selected-mark" x-show="selected === ${index}" aria-hidden="true"> ✓</span></span></span>
    </button>`,
    )
    .join('')
  const hero =
    variant === 'b'
      ? `<div class="focus-art gesture-zone" :class="{ 'has-artwork': !!area.image }" data-gesture-zone aria-label="左右滑動比較領域"><div class="gesture-content"><span class="large-index" x-show="!area.image" aria-hidden="true" x-text="'0' + (selected + 1)">01</span>${sceneImages(true)}<span class="hero-scene" x-show="!area.image" x-text="area.scene">觀點觀測庭</span></div></div>`
      : ''
  const html = template
    .replaceAll('%%VARIANT%%', variant)
    .replace('%%CSS%%', css)
    .replace('%%AREA_BUTTONS%%', buttons)
    .replace('%%FOCUSED_ART%%', hero)
    .replace('%%DOMAIN_IMAGES%%', sceneImages(false))
    .replace('%%GESTURE_ATTRIBUTE%%', variant === 'a' ? 'data-gesture-zone' : '')
    .replace('%%DATA%%', data)
    .replace('%%RUNTIME%%', `/* ${license} */\n${runtime}`)
  fs.writeFileSync(path.join(taskDir, `atlas-${variant}.html`), html, 'utf8')
}
console.log('Created atlas-a.html and atlas-b.html from the same 69-course source.')
console.log(
  areas.some((area) => area.image)
    ? 'Mother artwork included where available.'
    : 'Artwork spaces reserved; no images generated.',
)
