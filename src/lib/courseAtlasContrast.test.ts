import { describe, expect, it } from 'vitest'
import css from '../styles/course-atlas.css?raw'
import { contrastRatio } from './contrast'
import { COURSE_AREAS } from '../config/courseAreas'

describe('course atlas scoped palette', () => {
  it('tests real CSS token values on opaque reading surfaces', () => {
    const token = (name: string) => {
      const value = css.match(new RegExp(`--ca-${name}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1]
      expect(value).toBeTruthy()
      return value!
    }
    for (const background of [token('night'), token('surface')]) {
      for (const text of ['text', 'muted', 'blue', 'gold'])
        expect(contrastRatio(token(text), background)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(token('line'), background)).toBeGreaterThanOrEqual(3)
      for (const area of COURSE_AREAS)
        expect(contrastRatio(area.color, background)).toBeGreaterThanOrEqual(4.5)
    }
    expect(contrastRatio(token('night'), token('blue'))).toBeGreaterThanOrEqual(4.5)
  })
})
