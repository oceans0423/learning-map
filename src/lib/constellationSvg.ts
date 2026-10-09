import { courses } from '../data/courses'
import {
  boundedName,
  chronologicalStars,
  graphemes,
  UNNAMED_CONSTELLATION,
} from './constellation'
import type { StarPosition } from './personal'
import { STAR_BOUNDS } from './starPosition'

export function escapeXml(value: string): string {
  const safe = Array.from(value)
    .map((char) => {
      const code = char.codePointAt(0)!
      return (code < 32 && code !== 9 && code !== 10 && code !== 13) ||
        (code >= 0xd800 && code <= 0xdfff) ||
        code === 0xfffe ||
        code === 0xffff
        ? '�'
        : char
    })
    .join('')
  return safe.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!,
  )
}
function wrap(value: string, limit: number): string[] {
  const parts = graphemes(value),
    lines: string[] = []
  for (let i = 0; i < parts.length; i += limit) lines.push(parts.slice(i, i + limit).join(''))
  return lines
}
/** Standalone SVG: no HTML, scripts, remote fonts, links or external resources. */
export function constellationSvg(stars: readonly StarPosition[], rawName: string): string {
  if (
    !stars.length ||
    stars.length > 8 ||
    new Set(stars.map((star) => star.id)).size !== stars.length
  )
    throw new Error('Invalid representatives')
  for (const star of stars) {
    if (
      !courses.some((course) => course.id === star.id) ||
      !Number.isFinite(star.x) ||
      !Number.isFinite(star.y) ||
      star.x < STAR_BOUNDS.minX ||
      star.x > STAR_BOUNDS.maxX ||
      star.y < STAR_BOUNDS.minY ||
      star.y > STAR_BOUNDS.maxY
    )
      throw new Error('Invalid star')
  }
  const ordered = chronologicalStars(stars),
    name = boundedName(rawName) || UNNAMED_CONSTELLATION
  const points = ordered.map((star) => `${100 + star.x * 1000},${210 + star.y * 700}`)
  const heading = wrap(name, 12)
    .map((line, index) => `<tspan x="600" y="${85 + index * 48}">${escapeXml(line)}</tspan>`)
    .join('')
  const nodes = ordered
    .map((star, index) => {
      const x = 100 + star.x * 1000,
        y = 210 + star.y * 700
      return `<g data-course-id="${escapeXml(star.id)}" data-x="${star.x}" data-y="${star.y}"><circle cx="${x}" cy="${y}" r="19" fill="#F6F0E4"/><text x="${x}" y="${y + 8}" text-anchor="middle" font-size="24" font-weight="700" fill="#102630">${index + 1}</text></g>`
    })
    .join('')
  let legendY = 1000
  const legend = ordered
    .map((star, index) => {
      const course = courses.find((course) => course.id === star.id)!
      const lines = wrap(
        `${index + 1}. ${course.name} · 大${['一', '二', '三', '四'][course.year - 1]}${course.semester === 1 ? '上' : '下'}`,
        34,
      )
      const text = `<text x="100" y="${legendY}" font-size="25" fill="#F6F0E4">${lines.map((line, i) => `<tspan x="100" dy="${i ? 36 : 0}">${escapeXml(line)}</tspan>`).join('')}</text>`
      legendY += lines.length * 36 + 20
      return text
    })
    .join('')
  const height = legendY + 160
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${height}" viewBox="0 0 1200 ${height}" role="img" aria-labelledby="title description" font-family="system-ui, sans-serif">
<title id="title">${escapeXml(name)}</title><desc id="description">個人探索星座，${stars.length}顆代表星。連線不是先修、已修課或官方推薦。</desc>
<rect width="1200" height="${height}" fill="#102630"/>
<text text-anchor="middle" font-size="36" font-weight="600" fill="#F6F0E4">${heading}</text>
<text x="600" y="180" text-anchor="middle" font-size="20" fill="#CCDADB">MY HUMANITIES CONSTELLATION / 個人探索星座</text>
<rect x="100" y="210" width="1000" height="700" rx="24" fill="#17343E" stroke="#667F88" stroke-width="2"/>
${stars.length > 1 ? `<polyline points="${points.join(' ')}" fill="none" stroke="#CCDADB" stroke-width="3"/>` : ''}
${nodes}${legend}
<text x="100" y="${legendY + 30}" font-size="22" fill="#CCDADB"><tspan x="100">連線是個人探索想像，不是課程先修順序。</tspan><tspan x="100" dy="34">依年級、學期與課程 ID 連接；位置不代表能力、重要性或官方推薦。</tspan><tspan x="100" dy="34">人文跨域與應用學系 · 課程探索 · 實際開課以當學年度課表為準。</tspan></text>
</svg>`
}
