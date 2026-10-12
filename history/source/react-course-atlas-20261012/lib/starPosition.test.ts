import { it, expect } from 'vitest'
import { boundPoint, nudgePoint, STAR_BOUNDS } from './starPosition'
it('bounds and lightly snaps pointer/button coordinates using the same calculation', () => {
  expect(boundPoint({ x: -1, y: 3 })).toEqual({ x: STAR_BOUNDS.minX, y: STAR_BOUNDS.maxY })
  expect(boundPoint({ x: 0.243, y: 0.217 })).toEqual({ x: 0.24, y: 0.22 })
  expect(nudgePoint({ x: 0.22, y: 0.16 }, 0.02, 0)).toEqual(boundPoint({ x: 0.24, y: 0.16 }))
  expect(nudgePoint({ x: 0.84, y: 0.86 }, 0.02, 0.02)).toEqual({ x: 0.84, y: 0.86 })
})
