import { expect, it } from 'vitest'
import { courses } from '../data/courses'
import { constellationSvg, escapeXml } from './constellationSvg'
it('exports actual ordered stars and chronological links only when needed', () => {
  for (const n of [1, 2, 8]) {
    const stars = courses
      .slice(0, n)
      .map((course) => ({ id: course.id, x: 0.5, y: 0.5 }))
      .reverse()
    const svg = constellationSvg(stars, '我的星座')
    expect(svg.match(/data-course-id=/g)).toHaveLength(n)
    expect(svg.includes('<polyline')).toBe(n > 1)
    expect(svg).toContain(courses[0].name)
    expect(svg).toContain('不是課程先修順序')
  }
})
it('escapes XML including malformed unicode without scripts or external resources', () => {
  const svg = constellationSvg([{ id: courses[0].id, x: 0.5, y: 0.5 }], '<script>"&探索')
  expect(svg).toContain('&lt;script&gt;&quot;&amp;探索')
  expect(svg).not.toMatch(/<script|<foreignObject|href=|<image|<style/)
  expect(escapeXml('\u0000\ud800\uffff')).toBe('���')
})
it('rejects invalid export coordinates and unknown/duplicate representatives', () => {
  expect(() => constellationSvg([], '')).toThrow()
  expect(() => constellationSvg([{ id: 'unknown', x: 0.5, y: 0.5 }], '')).toThrow()
  expect(() => constellationSvg([{ id: courses[0].id, x: Infinity, y: 0.5 }], '')).toThrow()
  expect(() => constellationSvg([{ id: courses[0].id, x: 0.9, y: 0.5 }], '')).toThrow()
})
it('preserves every curriculum name including the longest name in the standalone legend', () => {
  for (const course of courses) {
    const svg = constellationSvg([{ id: course.id, x: 0.84, y: 0.86 }], '字'.repeat(24))
    expect(svg).toContain(escapeXml(course.name))
    expect(svg).toContain(`data-course-id="${course.id}"`)
  }
})
