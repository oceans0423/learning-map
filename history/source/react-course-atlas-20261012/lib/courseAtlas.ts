import { COURSE_AREAS, type CourseAreaId } from '../config/courseAreas'
import type { Course, CourseType } from '../types/course'

export type AtlasScope =
  | { kind: 'all' }
  | { kind: 'area'; area: CourseAreaId }
  | { kind: 'year'; year: Course['year'] }

export interface AtlasFilters {
  area?: CourseAreaId
  year?: Course['year']
  semester?: Course['semester']
  type?: CourseType
}

export function selectAtlasCourses(
  input: readonly Course[],
  scope: AtlasScope = { kind: 'all' },
  filters: AtlasFilters = {},
): Course[] {
  const seen = new Set<string>()
  const area = scope.kind === 'area' ? scope.area : filters.area
  const year = scope.kind === 'year' ? scope.year : filters.year
  const module = COURSE_AREAS.find((item) => item.id === area)?.module
  return input
    .filter((course) => {
      if (seen.has(course.id)) return false
      seen.add(course.id)
      return (
        (!module || course.module === module) &&
        (!year || course.year === year) &&
        (!filters.semester || course.semester === filters.semester) &&
        (!filters.type || course.type === filters.type)
      )
    })
    .sort((a, b) => a.year - b.year || a.semester - b.semester || a.id.localeCompare(b.id))
}

export function atlasStatistics(input: readonly Course[]) {
  const all = selectAtlasCourses(input)
  return {
    total: all.length,
    required: all.filter((course) => course.type === 'required').length,
    elective: all.filter((course) => course.type === 'elective').length,
    areas: COURSE_AREAS.map((area) => ({
      ...area,
      count: all.filter((course) => course.module === area.module).length,
    })),
    years: ([1, 2, 3, 4] as const).map((year) => ({
      year,
      count: all.filter((course) => course.year === year).length,
      first: all.filter((course) => course.year === year && course.semester === 1).length,
      second: all.filter((course) => course.year === year && course.semester === 2).length,
    })),
  }
}

/** An item anchor survives viewport changes; a page number would not. */
export function atlasPage(total: number, anchor: number, size: 6 | 12) {
  const safe = Number.isFinite(anchor) ? Math.max(0, Math.floor(anchor)) : 0
  const page = Math.floor(Math.min(safe, Math.max(0, total - 1)) / size)
  const start = page * size
  return {
    page,
    pages: Math.max(1, Math.ceil(total / size)),
    start,
    end: Math.min(total, start + size),
  }
}
