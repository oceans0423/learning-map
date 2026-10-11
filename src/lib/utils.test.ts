import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('shadcn class merging', () => {
  it('merges prefixed Tailwind utilities', () => {
    expect(cn('tw:p-2', 'tw:p-4')).toBe('tw:p-4')
  })

  it('keeps different states separate', () => {
    expect(cn('tw:hover:p-2', 'tw:hover:p-4', 'tw:p-2')).toBe('tw:hover:p-4 tw:p-2')
  })

  it('supports conditional inputs and preserves existing CSS classes', () => {
    expect(cn('course-row', false, null, undefined, { 'is-selected': true })).toBe(
      'course-row is-selected',
    )
  })
})
