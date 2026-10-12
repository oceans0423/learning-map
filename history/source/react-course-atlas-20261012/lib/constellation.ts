import { courses } from '../data/courses'
import type { StarPosition } from './personal'
const segmenter = new Intl.Segmenter('zh-Hant', { granularity: 'grapheme' })
export const UNNAMED_CONSTELLATION = '未命名星座'
export function graphemes(value: string) {
  return [...segmenter.segment(value)].map((part) => part.segment)
}
export function boundedName(value: string) {
  return graphemes(value.replace(/\p{Cc}/gu, '').trim())
    .slice(0, 24)
    .join('')
}
export function shortCourseName(value: string, limit = 8) {
  const parts = graphemes(value)
  return parts.length > limit ? parts.slice(0, limit).join('') + '…' : value
}
export function chronologicalStars(stars: readonly StarPosition[]) {
  return [...stars].sort((a, b) => {
    const first = courses.find((course) => course.id === a.id)!
    const second = courses.find((course) => course.id === b.id)!
    return (
      first.year - second.year || first.semester - second.semester || a.id.localeCompare(b.id)
    )
  })
}
