import { courses } from '../data/courses'
import { parseUrlState } from './urlState'
import type { Course } from '../types/course'

export function parseAtlasState(search: string) {
  const state = parseUrlState(search)
  const course = courses.find((c) => c.id === state.courseId)
  const explicitLegacy = new URLSearchParams(search).has('open') || state.semester !== 'all'
  const atlasYear =
    state.atlasYear !== undefined
      ? state.atlasYear
      : (course?.year ?? (explicitLegacy ? state.openYears[0] : null))
  return {
    ...state,
    signals: state.signals ?? [],
    atlasYear,
    semester:
      atlasYear === null
        ? state.semester
        : state.semester === 'all'
          ? (course?.semester ?? 1)
          : state.semester,
  }
}

export function semesterCourses(list: readonly Course[], year: number, semester: 1 | 2) {
  return list
    .filter((c) => c.year === year && c.semester === semester)
    .sort((a, b) => a.id.localeCompare(b.id))
}

export function pageWindow(total: number, anchor: number, limit: number) {
  const pages = Math.max(1, Math.ceil(total / limit))
  const page = Math.max(0, Math.min(pages - 1, Math.floor(Math.max(0, anchor) / limit)))
  return { page, pages, start: page * limit, end: Math.min(total, (page + 1) * limit) }
}
