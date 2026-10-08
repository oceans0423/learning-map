import { describe, expect, it } from 'vitest'
import { LEARNING_PATH } from './learningPath'

describe('four-year learning path', () => {
  it('describes each undergraduate year in sequence', () => {
    expect(LEARNING_PATH.map((year) => year.year)).toEqual([1, 2, 3, 4])
    expect(LEARNING_PATH.map((year) => year.phase)).toEqual([
      '探索與奠基',
      '方法與表達',
      '跨域實作',
      '整合與展現',
    ])
  })

  it('provides a focus, capabilities and learning activities for each year', () => {
    for (const year of LEARNING_PATH) {
      expect(year.title.length).toBeGreaterThan(0)
      expect(year.focus.length).toBeGreaterThan(0)
      expect(year.capabilities.length).toBeGreaterThan(0)
      expect(year.activities.length).toBeGreaterThan(0)
    }
  })
})
