import { describe, it, expect } from 'vitest'
import { courses } from '../data/courses'
import { collectionReducer, EMPTY_COLLECTION } from './collection'
describe('optional session collection', () => {
  it('deduplicates and accepts all69, not capped at8', () => {
    let state = EMPTY_COLLECTION
    for (const course of courses)
      state = collectionReducer(state, { type: 'add', id: course.id })
    expect(state.ids).toHaveLength(69)
    expect(collectionReducer(state, { type: 'add', id: courses[0].id })).toBe(state)
    expect(collectionReducer(state, { type: 'add', id: 'unknown' })).toBe(state)
  })
  it('restores only the most recent removal in its original order', () => {
    let state = EMPTY_COLLECTION
    for (const id of ['course-001', 'course-002', 'course-003'])
      state = collectionReducer(state, { type: 'add', id })
    state = collectionReducer(state, { type: 'remove', id: 'course-002' })
    state = collectionReducer(state, { type: 'remove', id: 'course-003' })
    state = collectionReducer(state, { type: 'undo' })
    expect(state.ids).toEqual(['course-001', 'course-003'])
    expect(state.undo).toBeNull()
  })
  it('retains undo after removing the final item, and never duplicates re-added items', () => {
    let state = collectionReducer(EMPTY_COLLECTION, { type: 'add', id: 'course-001' })
    state = collectionReducer(state, { type: 'remove', id: 'course-001' })
    expect(state.ids).toEqual([])
    expect(state.undo?.id).toBe('course-001')
    state = collectionReducer(state, { type: 'add', id: 'course-001' })
    expect(collectionReducer(state, { type: 'undo' }).ids).toEqual(['course-001'])
  })
})
