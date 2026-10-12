import { describe, expect, it } from 'vitest'
import { courses } from '../data/courses'
import { isCourseHighlighted } from './highlight'

const course = (id: string) => courses.find((item) => item.id === id)!

describe('course emphasis', () => {
  it('leaves all courses ordinary when no structure controls are selected', () => {
    for (const item of courses) expect(isCourseHighlighted(item, [])).toBe(false)
  })

  it('matches foundation and integration roles independently of required/elective type', () => {
    expect(isCourseHighlighted(course('course-001'), ['foundation'])).toBe(true)
    expect(isCourseHighlighted(course('course-004'), ['foundation'])).toBe(true)
    expect(isCourseHighlighted(course('course-036'), ['integration'])).toBe(true)
    expect(isCourseHighlighted(course('course-003'), ['integration'])).toBe(false)
  })

  it('matches the primary track and every related track equally', () => {
    expect(isCourseHighlighted(course('course-003'), ['digital'])).toBe(true)
    expect(isCourseHighlighted(course('course-001'), ['narrative'])).toBe(false)
    expect(isCourseHighlighted(course('course-002'), ['culture'])).toBe(true)
    expect(isCourseHighlighted(course('course-005'), ['digital'])).toBe(true)
  })

  it('combines selected roles and tracks with OR semantics', () => {
    expect(isCourseHighlighted(course('course-003'), ['foundation', 'digital'])).toBe(true)
    expect(isCourseHighlighted(course('course-001'), ['digital', 'culture'])).toBe(false)
    expect(isCourseHighlighted(course('course-036'), ['narrative', 'culture'])).toBe(true)
  })

  it('supports independent multi-track highlights across a course', () => {
    expect(isCourseHighlighted(course('course-005'), ['digital', 'culture'])).toBe(true)
    expect(isCourseHighlighted(course('course-005'), ['narrative'])).toBe(false)
  })
})
