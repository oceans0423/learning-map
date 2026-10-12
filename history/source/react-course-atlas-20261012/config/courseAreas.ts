import type { ModuleName } from '../types/course'

/** Display aliases only: never modify the approved module in courses.json. */
export const COURSE_AREAS = [
  { id: 'thinking', module: '人文思維與方法', label: '人文思維與方法', color: '#b9b2e8' },
  { id: 'narrative', module: '文學創作', label: '敘事與內容創作', color: '#d6ad9a' },
  { id: 'digital', module: '數位人文', label: '數位人文', color: '#a9c2f5' },
  {
    id: 'culture',
    module: '文化創意與社會設計',
    label: '文化創意與社會設計',
    color: '#98c6be',
  },
] as const satisfies readonly { id: string; module: ModuleName; label: string; color: string }[]

export type CourseAreaId = (typeof COURSE_AREAS)[number]['id']
export const YEAR_LABELS = ['大一', '大二', '大三', '大四'] as const

export function isCourseAreaId(value: unknown): value is CourseAreaId {
  return COURSE_AREAS.some((area) => area.id === value)
}

export function courseArea(module: ModuleName) {
  return COURSE_AREAS.find((area) => area.module === module)!
}
