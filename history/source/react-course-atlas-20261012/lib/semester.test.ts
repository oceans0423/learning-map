import { describe, expect, it } from 'vitest'
import { courses } from '../data/courses'
import { getVisibleCourses, SEMESTER_OPTIONS, type SemesterFilter } from './semester'

describe('semester visibility', () => {
  it('shows all 69 courses for the full academic year', () => {
    const visible = getVisibleCourses(courses, 'all')
    expect(visible).toHaveLength(69)
    expect(visible).toBe(courses)
  })

  it('shows only first-semester courses in source order', () => {
    const visible = getVisibleCourses(courses, 1)
    expect(visible).toHaveLength(35)
    expect(visible.every((course) => course.semester === 1)).toBe(true)
    expect(visible.map((course) => course.id)).toEqual(
      courses.filter((course) => course.semester === 1).map((course) => course.id),
    )
  })

  it('shows only second-semester courses in source order', () => {
    const visible = getVisibleCourses(courses, 2)
    expect(visible).toHaveLength(34)
    expect(visible.every((course) => course.semester === 2)).toBe(true)
    expect(visible.map((course) => course.id)).toEqual(
      courses.filter((course) => course.semester === 2).map((course) => course.id),
    )
  })

  it('preserves course records and returns an empty list for empty input', () => {
    const firstSemester = getVisibleCourses(courses, 1)
    expect(firstSemester[0]).toBe(courses.find((course) => course.semester === 1))
    expect(getVisibleCourses([], 'all')).toEqual([])
    expect(getVisibleCourses([], 1)).toEqual([])
    expect(getVisibleCourses([], 2)).toEqual([])
  })

  it('exposes the supported filter type for UI controls', () => {
    const filters: SemesterFilter[] = ['all', 1, 2]
    expect(filters.map((filter) => getVisibleCourses(courses, filter).length)).toEqual([
      69, 35, 34,
    ])
    expect(SEMESTER_OPTIONS.map((option) => option.label)).toEqual(['全年', '上學期', '下學期'])
  })
})
