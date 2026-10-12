import { describe, it, expect } from 'vitest'
import { courses } from '../data/courses'
import { parseAtlasState, pageWindow, semesterCourses } from './atlas'
import { parseUrlState, serializeUrlState } from './urlState'
describe('bounded course atlas', () => {
  it('keeps new signal parameters separate from legacy focus and removes invalid/duplicate values', () => {
    const state = parseAtlasState(
      '?signals=text,text,digital,unknown&focus=culture&atlas=2&sem=2',
    )
    expect(state.signals).toEqual(['text', 'digital'])
    expect(state.focus).toEqual(['culture'])
    expect(parseAtlasState('?' + serializeUrlState(state))).toEqual(state)
  })
  it('covers all 69 in eight semesters with stable IDs', () => {
    const semesters = [1, 2, 3, 4].flatMap((year) =>
      ([1, 2] as const).map((sem) => semesterCourses(courses, year, sem)),
    )
    expect(semesters.map((s) => s.length)).toEqual([6, 6, 11, 12, 11, 12, 7, 4])
    expect(new Set(semesters.flat().map((c) => c.id)).size).toBe(69)
  })
  it('starts at overview; preserves valid legacy year/semester and official focus', () => {
    expect(parseAtlasState('').atlasYear).toBeNull()
    const state = parseAtlasState('?open=2,3&sem=2&focus=digital')
    expect(state.atlasYear).toBe(2)
    expect(state.semester).toBe(2)
    expect(state.focus).toEqual(parseUrlState('?focus=digital').focus)
    expect(parseAtlasState('?course=course-069').atlasYear).toBe(4)
    expect(parseAtlasState('?atlas=overview&sem=2').atlasYear).toBeNull()
    expect(parseAtlasState('?atlas=99').atlasYear).toBeNull()
  })
  it('round trips new overview and semester without changing legacy parameter meanings', () => {
    const state = parseAtlasState('?atlas=3&sem=2&open=3&focus=culture')
    expect(parseAtlasState('?' + serializeUrlState(state))).toEqual(state)
    expect(
      parseAtlasState('?' + serializeUrlState({ ...state, atlasYear: null })).atlasYear,
    ).toBeNull()
  })
  it('clamps groups and preserves an anchor on resize', () => {
    expect(pageWindow(12, 6, 6)).toEqual({ page: 1, pages: 2, start: 6, end: 12 })
    expect(pageWindow(12, 6, 12)).toEqual({ page: 0, pages: 1, start: 0, end: 12 })
    expect(pageWindow(7, 99, 6).start).toBe(6)
    expect(pageWindow(4, 6, 6).start).toBe(0)
    expect(pageWindow(0, 0, 6).pages).toBe(1)
  })
})
