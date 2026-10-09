import { describe, it, expect } from 'vitest'
import { courses } from '../data/courses'
import { searchCourses } from './search'
describe('literal global course search', () => {
  it('searches all 69 with trimming, middle strings and compatibility characters', () => {
    expect(searchCourses(courses, '  ')).toHaveLength(69)
    expect(searchCourses(courses, '  IP  ').map((c) => c.id)).toContain('course-068')
    expect(searchCourses(courses, 'ＩＰ').map((c) => c.id)).toContain('course-068')
    expect(searchCourses(courses, '數據化與文化')).toHaveLength(1)
  })
  it('handles no results and special characters without regular expressions', () => {
    expect(searchCourses(courses, '[.*')).toEqual([])
    expect(searchCourses(courses, '不存在的課名')).toEqual([])
    for (const course of courses)
      expect(searchCourses(courses, course.name).some((c) => c.id === course.id)).toBe(true)
  })
})
