import { describe, it, expect } from 'vitest'
import { courses } from '../data/courses'
import { personalReducer, EMPTY_PERSONAL } from './personal'
const collect = (n: number) =>
  courses
    .slice(0, n)
    .reduce((s, c) => personalReducer(s, { type: 'add', id: c.id }), EMPTY_PERSONAL)
describe('optional representatives', () => {
  it('commits bounded positions and undo retains a moved representative snapshot', () => {
    let state = personalReducer(collect(2), { type: 'initialize' })
    state = personalReducer(state, { type: 'move', id: 'course-001', x: 0.5, y: 0.7 })
    const before = state.representatives
    state = personalReducer(state, { type: 'remove', id: 'course-001' })
    state = personalReducer(state, { type: 'undo' })
    expect(state.representatives).toEqual(before)
    expect(personalReducer(state, { type: 'move', id: 'course-001', x: NaN, y: 0.7 })).toBe(
      state,
    )
    expect(personalReducer(state, { type: 'move', id: 'unknown', x: 0.5, y: 0.7 })).toBe(state)
  })
  it('handles0/1/8/9/69 without limiting collection', () => {
    for (const n of [0, 1, 8, 9, 69]) {
      const state = personalReducer(collect(n), { type: 'initialize' })
      expect(state.ids).toHaveLength(n)
      expect(state.representatives).toHaveLength(Math.min(n, 8))
    }
    expect(personalReducer(EMPTY_PERSONAL, { type: 'initialize' }).initialized).toBe(false)
  })
  it('requires explicit ninth replacement and re-entry never overwrites edits', () => {
    let state = personalReducer(collect(9), { type: 'initialize' })
    const before = state.representatives
    state = personalReducer(state, { type: 'representative', id: 'course-009' })
    expect(state.representatives).toEqual(before)
    state = personalReducer(state, {
      type: 'replace',
      oldId: 'course-002',
      newId: 'course-009',
    })
    expect(state.representatives[1].id).toBe('course-009')
    expect(state.ids).toContain('course-002')
    expect(personalReducer(state, { type: 'initialize' })).toBe(state)
  })
  it('removing a star retains collection; collection removal/undo restores exact identity/order/position', () => {
    let state = personalReducer(collect(8), { type: 'initialize' })
    const before = state.representatives
    const noStar = personalReducer(state, { type: 'representative', id: 'course-002' })
    expect(noStar.ids).toHaveLength(8)
    expect(noStar.representatives).toHaveLength(7)
    state = personalReducer(state, { type: 'remove', id: 'course-002' })
    expect(state.representatives).toHaveLength(7)
    state = personalReducer(state, { type: 'undo' })
    expect(state.representatives).toEqual(before)
  })
  it('never creates ninth through undo, and never replaces another star silently', () => {
    let state = personalReducer(collect(9), { type: 'initialize' })
    state = personalReducer(state, { type: 'remove', id: 'course-001' })
    state = personalReducer(state, { type: 'representative', id: 'course-009' })
    const stars = state.representatives
    state = personalReducer(state, { type: 'undo' })
    expect(state.representatives).toEqual(stars)
    expect(state.ids).not.toContain('course-001')
    expect(state.undo).not.toBeNull()
    state = personalReducer(state, { type: 'representative', id: 'course-009' })
    state = personalReducer(state, { type: 'undo' })
    expect(state.ids).toContain('course-001')
    expect(state.representatives).toHaveLength(8)
  })
})
