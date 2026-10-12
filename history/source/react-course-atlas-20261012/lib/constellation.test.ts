import { describe, it, expect } from 'vitest'
import { boundedName, graphemes, chronologicalStars } from './constellation'
import { personalReducer, EMPTY_PERSONAL } from './personal'
describe('safe personal naming and chronology', () => {
  it('caps24 graphemes without splitting Chinese, emoji, families or combining marks', () => {
    const family = '👩‍👩‍👧‍👦'
    expect(graphemes(family + 'é')).toHaveLength(2)
    expect(graphemes(boundedName(family.repeat(25)))).toHaveLength(24)
    expect(boundedName('  ' + '星'.repeat(30) + '  ')).toBe('星'.repeat(24))
    expect(boundedName(' <script>&" ')).toBe('<script>&"')
    expect(boundedName('\n\t')).toBe('')
  })
  it('sorts time thenstableID independently of coordinates and collection order', () => {
    const stars = [
      { id: 'course-069', x: 0.2, y: 0.2 },
      { id: 'course-001', x: 0.8, y: 0.8 },
      { id: 'course-002', x: 0.6, y: 0.6 },
    ]
    expect(chronologicalStars(stars).map((s) => s.id)).toEqual([
      'course-001',
      'course-002',
      'course-069',
    ])
    expect(stars[0].id).toBe('course-069')
  })
  it('one star can complete; empty names fall back, first valid name tracked once', () => {
    let state = personalReducer(EMPTY_PERSONAL, { type: 'add', id: 'course-001' })
    state = personalReducer(state, { type: 'initialize' })
    state = personalReducer(state, { type: 'name', value: ' ' })
    expect(state.name).toBe('未命名星座')
    expect(state.completed).toBe(true)
    expect(state.namedOnce).toBe(false)
    state = personalReducer(state, { type: 'name', value: '我的提問' })
    expect(state.namedOnce).toBe(true)
    const stars = state.representatives
    state = personalReducer(state, { type: 'name', value: '第二個名稱' })
    expect(state.namedOnce).toBe(true)
    expect(state.representatives).toBe(stars)
  })
})
