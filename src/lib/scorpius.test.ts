import { describe, expect, it } from 'vitest'
import { courses } from '../data/courses'
import { assignScorpiusCourses, SCORPIUS_EDGES, SCORPIUS_POINTS } from './scorpius'
import { personalReducer } from './personal'
import { EMPTY_PERSONAL } from './personal'
import css from '../styles/scorpius.css?raw'
import { contrastRatio } from './contrast'

describe('fixed Scorpius prototype', () => {
  it('keeps local text, focus and graph lines readable on the solid surfaces', () => {
    const token = (name: string) => {
      const color = css.match(new RegExp(name + ': (#[0-9a-f]{6})', 'i'))?.[1]
      if (!color) throw new Error('Missing color ' + name)
      return color
    }
    for (const surface of ['--sc-night', '--sc-surface']) {
      for (const text of ['--sc-text', '--sc-muted', '--sc-blue', '--sc-gold']) {
        expect(
          contrastRatio(token(text), token(surface)),
          `${text} on ${surface}`,
        ).toBeGreaterThanOrEqual(4.5)
      }
      expect(contrastRatio(token('--sc-line'), token(surface))).toBeGreaterThanOrEqual(3)
    }
  })
  it.each([0, 1, 2, 8, 11, 12, 69])('keeps every selected course at count %i', (count) => {
    const ids = courses.slice(0, count).map((course) => course.id)
    const slots = assignScorpiusCourses(ids, courses)
    expect(slots).toHaveLength(SCORPIUS_POINTS.length)
    expect(slots.flatMap((slot) => slot.courses.map((course) => course.id)).sort()).toEqual(
      [...ids].sort(),
    )
    expect(slots.filter((slot) => slot.courses.length)).toHaveLength(Math.min(count, 11))
  })

  it('deduplicates IDs, ignores unknown IDs and never mutates the input', () => {
    const ids = Object.freeze(['course-001', 'not-a-course', 'course-001', 'course-068'])
    const result = assignScorpiusCourses(ids, courses)
    expect(result.flatMap((slot) => slot.courses.map((course) => course.id)).sort()).toEqual([
      'course-001',
      'course-068',
    ])
    expect(ids).toHaveLength(4)
  })

  it('keeps assignment deterministic and the original selections first in each group', () => {
    const ids = courses.map((course) => course.id)
    expect(assignScorpiusCourses(ids, courses)).toEqual(assignScorpiusCourses(ids, courses))
    const before = assignScorpiusCourses(ids.slice(0, 11), courses)
    const after = assignScorpiusCourses(ids, courses)
    before.forEach((slot, index) => expect(after[index].courses[0]).toBe(slot.courses[0]))
  })

  it('uses valid connected edges and non-overlapping 44px targets on a narrow phone', () => {
    const connected = new Set<number>([0])
    for (let pass = 0; pass < SCORPIUS_POINTS.length; pass++) {
      for (const [a, b] of SCORPIUS_EDGES) {
        expect(SCORPIUS_POINTS[a]).toBeDefined()
        expect(SCORPIUS_POINTS[b]).toBeDefined()
        if (connected.has(a) || connected.has(b)) {
          connected.add(a)
          connected.add(b)
        }
      }
    }
    expect(connected.size).toBe(SCORPIUS_POINTS.length)
    const width = 286,
      height = width * 1.25
    SCORPIUS_POINTS.forEach((a, i) => {
      expect(a.x * width).toBeGreaterThanOrEqual(22)
      expect((1 - a.x) * width).toBeGreaterThanOrEqual(22)
      expect(a.y * height).toBeGreaterThanOrEqual(22)
      expect((1 - a.y) * height).toBeGreaterThanOrEqual(22)
      SCORPIUS_POINTS.slice(i + 1).forEach((b) => {
        expect(Math.abs(a.x - b.x) * width >= 44 || Math.abs(a.y - b.y) * height >= 44).toBe(
          true,
        )
      })
    })
  })

  it('does not rewrite existing personal layout or name when adding a course', () => {
    const state = {
      ...EMPTY_PERSONAL,
      ids: ['course-001'],
      name: '原本的作品',
      completed: true,
      representatives: [{ id: 'course-001', x: 0.3, y: 0.6 }],
    }
    const next = personalReducer(state, { type: 'add', id: 'course-002' })
    assignScorpiusCourses(next.ids, courses)
    expect(next.representatives).toEqual(state.representatives)
    expect(next.name).toBe(state.name)
  })
})
