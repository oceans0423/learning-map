import { describe, expect, it } from 'vitest'
import raw from './explorationSignals.json'
import { courses } from './courses'
import {
  explorationSignals,
  getCourseSignal,
  getRelatedCourses,
  getSignalStats,
  matchesSignal,
  parseExplorationSignals,
} from './explorationSignals'

describe('independent exploration signal mapping', () => {
  it('covers the 69 stable course IDs exactly and keeps classifications draft', () => {
    expect([...explorationSignals.keys()].sort()).toEqual(
      courses.map((course) => course.id).sort(),
    )
    expect(raw.every((mapping) => mapping.status === 'draft')).toBe(true)
    expect(getSignalStats(courses)).toEqual({
      text: 20,
      story: 14,
      digital: 10,
      field: 21,
      open: 4,
      total: 69,
      secondary: 50,
    })
    expect(courses.filter((course) => course.role === 'foundation')).toHaveLength(20)
    expect(courses.filter((course) => course.role === 'application')).toHaveLength(45)
    expect(courses.filter((course) => course.role === 'integration')).toHaveLength(4)
  })

  it('uses a content signal independently of the approved learning role', () => {
    expect(courses.find((course) => course.id === 'course-002')?.role).toBe('foundation')
    expect(getCourseSignal('course-002').primary).toBe('field')
    expect(getCourseSignal('course-053').primary).toBe('text')
    expect(courses.find((course) => course.id === 'course-053')?.role).toBe('application')
  })

  it('matches primary and secondary by OR without double-counting', () => {
    expect(matchesSignal(getCourseSignal('course-007'), ['text'])).toBe(true)
    expect(matchesSignal(getCourseSignal('course-007'), ['story'])).toBe(true)
    expect(matchesSignal(getCourseSignal('course-007'), ['digital'])).toBe(false)
    expect(matchesSignal(getCourseSignal('course-007'), [])).toBe(false)
    const course = courses.find((item) => item.id === 'course-007')!
    expect(getRelatedCourses([course, course], ['text', 'story', 'text'])).toHaveLength(1)
    expect(getRelatedCourses([course], ['digital'])).toHaveLength(0)
    expect(getSignalStats([course, course]).total).toBe(1)
  })

  it('keeps the four open integration courses out of all signal matches', () => {
    const integration = courses.filter((course) => course.role === 'integration')
    expect(integration.map((course) => course.id)).toEqual([
      'course-036',
      'course-050',
      'course-059',
      'course-066',
    ])
    for (const course of integration) {
      const mapping = getCourseSignal(course.id)
      expect(mapping.primary).toBeNull()
      expect(mapping.secondary).toBeNull()
      expect(matchesSignal(mapping, ['text', 'story', 'digital', 'field'])).toBe(false)
    }
  })

  it('rejects missing, unknown and duplicate IDs', () => {
    expect(() => parseExplorationSignals(raw.slice(1), courses)).toThrow('missing')
    expect(() => parseExplorationSignals([...raw, raw[0]], courses)).toThrow('duplicate')
    expect(() =>
      parseExplorationSignals([{ ...raw[0], id: 'unknown' }, ...raw.slice(1)], courses),
    ).toThrow('unknown')
    expect(() => getCourseSignal('unknown')).toThrow('missing')
  })

  it('rejects bad signals, repeated secondary, approval values and policies', () => {
    const invalid = [
      { primary: 'bad' },
      { secondary: 'text' },
      { secondary: 'bad' },
      { status: 'unknown' },
      { reason: '' },
      { signalPolicy: 'unknown' },
      { signalPolicy: 'open', primary: null, secondary: null },
    ]
    for (const change of invalid) {
      expect(() =>
        parseExplorationSignals([{ ...raw[0], ...change }, ...raw.slice(1)], courses),
      ).toThrow()
    }
    expect(() => parseExplorationSignals({}, courses)).toThrow('expected array')
    expect(() => parseExplorationSignals([null], courses)).toThrow('invalid entry')
  })

  it('rejects assigned integration courses and open courses with signals', () => {
    const index = raw.findIndex((entry) => entry.signalPolicy === 'open')
    for (const change of [
      { signalPolicy: 'assigned', primary: 'text', secondary: null },
      { primary: 'text' },
      { secondary: 'story' },
    ]) {
      const changed = raw.map((entry, i) => (i === index ? { ...entry, ...change } : entry))
      expect(() => parseExplorationSignals(changed, courses)).toThrow()
    }
  })

  it('does not mutate course facts when parsing or matching', () => {
    const before = JSON.stringify(courses)
    parseExplorationSignals(raw, courses)
    getRelatedCourses(courses, ['text', 'story', 'digital', 'field'])
    expect(JSON.stringify(courses)).toBe(before)
  })
})
