import { describe, expect, it } from 'vitest'
import {
  closeCourseUrlState,
  parseUrlState,
  pushCourseUrlState,
  replaceUrlState,
  serializeUrlState,
  type HistoryPort,
} from './urlState'

describe('URL state parsing', () => {
  it('switches an already open note in place and never invents a direct-link back marker', () => {
    let pushed = 0
    let replaced = 0
    const history: HistoryPort = {
      state: { __curriculumMap: { openedCourse: 'course-001' } },
      pushState: () => {
        pushed++
      },
      replaceState: (data) => {
        history.state = data
        replaced++
      },
      back: () => {},
    }
    const source = { semester: 1 as const, focus: [], openYears: [1], courseId: 'course-001' }
    const location = { pathname: '/', search: '', hash: '' }
    pushCourseUrlState(source, 'course-002', history, location)
    expect(pushed).toBe(0)
    expect(replaced).toBe(1)
    expect(history.state).toEqual({ __curriculumMap: { openedCourse: 'course-002' } })
    replaceUrlState({ ...source, courseId: 'course-002', signals: ['text'] }, history, location)
    expect(history.state).toEqual({ __curriculumMap: { openedCourse: 'course-002' } })
    history.state = null
    pushCourseUrlState(source, 'course-002', history, location)
    expect(history.state).toEqual({})
  })
  it('parses valid semester, focus controls, expanded years and a course', () => {
    expect(
      parseUrlState('?sem=2&focus=foundation,narrative&open=1,2&course=course-010'),
    ).toEqual({
      semester: 2,
      focus: ['foundation', 'narrative'],
      openYears: [1, 2],
      courseId: 'course-010',
    })
  })

  it('defaults missing and invalid semesters to all terms', () => {
    expect(parseUrlState('').semester).toBe('all')
    expect(parseUrlState('?sem=fall').semester).toBe('all')
    expect(parseUrlState('?sem=3').semester).toBe('all')
  })

  it('ignores unknown focus values and removes duplicate values across repeated params', () => {
    expect(
      parseUrlState('?focus=narrative,bogus,narrative&focus=digital,narrative'),
    ).toMatchObject({
      focus: ['narrative', 'digital'],
    })
  })

  it('keeps valid unique years and defaults when no valid year remains', () => {
    expect(parseUrlState('?open=2,2,4,5,NaN').openYears).toEqual([2, 4])
    expect(parseUrlState('?open=0,5,nope').openYears).toEqual([1])
    expect(parseUrlState('?open=').openYears).toEqual([1])
  })

  it('opens only a known course ID', () => {
    expect(parseUrlState('?course=course-010').courseId).toBe('course-010')
    expect(parseUrlState('?course=missing').courseId).toBeNull()
    expect(parseUrlState('?course=').courseId).toBeNull()
  })

  it('handles encoded and unrelated query parameters safely', () => {
    expect(
      parseUrlState(
        '?focus=%E6%95%B8%E4%BD%8D%E4%BA%BA%E6%96%87%E8%88%87%E5%AA%92%E4%BB%8B&other=value',
      ),
    ).toMatchObject({
      focus: [],
      semester: 'all',
      openYears: [1],
      courseId: null,
    })
  })

  it('serializes state and omits defaults while removing duplicate values', () => {
    expect(
      serializeUrlState({ semester: 'all', focus: [], openYears: [1], courseId: null }),
    ).toBe('')
    expect(
      serializeUrlState({
        semester: 2,
        focus: ['narrative', 'narrative'],
        openYears: [1, 2, 2],
        courseId: 'course-010',
      }),
    ).toBe('sem=2&focus=narrative&open=1%2C2&course=course-010')
  })

  it('replaces view changes without adding a history entry and preserves the hash', () => {
    const calls: string[] = []
    const history: HistoryPort = {
      state: { router: 'kept' },
      pushState: () => calls.push('push'),
      replaceState: (_data, _unused, url) => calls.push(String(url)),
      back: () => calls.push('back'),
    }
    replaceUrlState({ semester: 1, focus: [], openYears: [2], courseId: null }, history, {
      pathname: '/map',
      search: '',
      hash: '#courses',
    })
    expect(calls).toEqual(['/map?sem=1&open=2#courses'])
  })

  it('pushes course detail as a history entry', () => {
    const calls: unknown[][] = []
    const history: HistoryPort = {
      state: { router: 'kept' },
      pushState: (...args) => calls.push(args),
      replaceState: () => calls.push(['replace']),
      back: () => calls.push(['back']),
    }
    pushCourseUrlState(
      { semester: 'all', focus: ['digital'], openYears: [1], courseId: null },
      'course-010',
      history,
      {
        pathname: '/map',
        search: '',
        hash: '',
      },
    )
    expect(calls).toHaveLength(1)
    expect(calls[0][2]).toBe('/map?focus=digital&course=course-010')
    expect(calls[0][0]).toEqual({
      router: 'kept',
      __curriculumMap: { openedCourse: 'course-010' },
    })
    expect(() =>
      pushCourseUrlState(
        { semester: 'all', focus: [], openYears: [1], courseId: null },
        'bad',
        history,
        {
          pathname: '/map',
          search: '',
          hash: '',
        },
      ),
    ).toThrow(/Unknown course ID/)
  })

  it('uses browser back for in-app detail and replaces a direct-link detail', () => {
    const calls: string[] = []
    const inAppHistory: HistoryPort = {
      state: { __curriculumMap: { openedCourse: 'course-010' } },
      pushState: () => calls.push('push'),
      replaceState: () => calls.push('replace'),
      back: () => calls.push('back'),
    }
    const state = {
      semester: 2 as const,
      focus: ['narrative' as const],
      openYears: [2],
      courseId: 'course-010',
    }
    expect(
      closeCourseUrlState(state, inAppHistory, { pathname: '/map', search: '', hash: '' }),
    ).toBe('back')
    expect(calls).toEqual(['back'])

    const directLinkHistory: HistoryPort = { ...inAppHistory, state: null }
    expect(
      closeCourseUrlState(state, directLinkHistory, { pathname: '/map', search: '', hash: '' }),
    ).toBe('replaced')
    expect(calls.at(-1)).toBe('replace')
  })
})
