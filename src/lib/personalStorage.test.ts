import { describe, expect, it } from 'vitest'
import { EMPTY_PERSONAL, personalReducer } from './personal'
import { parsePersonal, serializePersonal } from './personalStorage'

const draft = personalReducer(
  personalReducer(EMPTY_PERSONAL, { type: 'add', id: 'course-001' }),
  { type: 'initialize' },
)
const valid = JSON.parse(serializePersonal(draft, true))
describe('personal storage validation', () => {
  it('round trips opt-in snapshot without transient undo or messages', () => {
    const parsed = parsePersonal(serializePersonal(draft, true))!
    expect(parsed.consent).toBe(true)
    expect(parsed.state.ids).toEqual(['course-001'])
    expect(parsed.state.representatives).toEqual(draft.representatives)
    expect(parsed.state.undo).toBeNull()
    expect(parsePersonal(serializePersonal(draft, false))!.consent).toBe(false)
  })
  it('deduplicates known collection identities', () => {
    expect(
      parsePersonal(JSON.stringify({ ...valid, ids: ['course-001', 'course-001'] }))!.state.ids,
    ).toEqual(['course-001'])
  })
  it('round trips the full collection with only eight representatives and a 24-grapheme name', () => {
    let full = EMPTY_PERSONAL
    for (let n = 1; n <= 69; n++)
      full = personalReducer(full, { type: 'add', id: `course-${String(n).padStart(3, '0')}` })
    full = personalReducer(full, { type: 'initialize' })
    full = personalReducer(full, { type: 'name', value: '👩‍👩‍👧‍👦'.repeat(24) })
    const restored = parsePersonal(serializePersonal(full, true))!
    expect(restored.state.ids).toHaveLength(69)
    expect(restored.state.representatives).toHaveLength(8)
    expect(restored.state.name).toBe(full.name)
  })
  it('rejects corrupt versions, types, unknown IDs, nonfinite/boundary positions, oversized stars and names', () => {
    const invalid = [
      null,
      {},
      { ...valid, version: 0 },
      { ...valid, consent: 'yes' },
      { ...valid, ids: ['unknown'] },
      { ...valid, representatives: [{ id: 'course-002', x: 0.5, y: 0.5 }] },
      { ...valid, representatives: [{ id: 'course-001', x: null, y: 0.5 }] },
      { ...valid, representatives: [{ id: 'course-001', x: 0.85, y: 0.5 }] },
      { ...valid, representatives: Array(9).fill(valid.representatives[0]) },
      { ...valid, name: '字'.repeat(25) },
      { ...valid, name: 'a\u0000b' },
      { ...valid, initialized: false },
      { ...valid, completed: false, namedOnce: true },
    ]
    for (const value of invalid) expect(parsePersonal(JSON.stringify(value))).toBeNull()
    expect(parsePersonal('{')).toBeNull()
    expect(
      parsePersonal(
        JSON.stringify({
          ...valid,
          representatives: [valid.representatives[0], valid.representatives[0]],
        }),
      ),
    ).toBeNull()
  })
})
