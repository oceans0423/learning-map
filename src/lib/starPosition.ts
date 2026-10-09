export interface Point {
  x: number
  y: number
}
export const STAR_BOUNDS = { minX: 0.16, maxX: 0.84, minY: 0.14, maxY: 0.86 } as const
export function boundPoint(point: Point): Point {
  const snap = (value: number) => {
    const grid = Math.round(value / 0.02) * 0.02
    return Math.abs(grid - value) < 0.006 ? grid : value
  }
  const x = Math.min(STAR_BOUNDS.maxX, Math.max(STAR_BOUNDS.minX, snap(point.x)))
  const y = Math.min(STAR_BOUNDS.maxY, Math.max(STAR_BOUNDS.minY, snap(point.y)))
  return { x: Math.round(x * 100000) / 100000, y: Math.round(y * 100000) / 100000 }
}
export function nudgePoint(point: Point, dx: number, dy: number) {
  return boundPoint({ x: point.x + dx, y: point.y + dy })
}
