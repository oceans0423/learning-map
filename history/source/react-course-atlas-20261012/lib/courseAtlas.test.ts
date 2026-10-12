import { describe, expect, it } from 'vitest'
import { COURSE_AREAS, courseArea, isCourseAreaId } from '../config/courseAreas'
import { courses } from '../data/courses'
import { atlasPage, atlasStatistics, selectAtlasCourses } from './courseAtlas'

describe('approved course atlas data contract', () => {
  it('uses display aliases without rewriting official modules or content', () => {
    expect(courseArea('文學創作').label).toBe('敘事與內容創作')
    expect(isCourseAreaId('narrative')).toBe(true)
    expect(isCourseAreaId('文學創作')).toBe(false)
    expect(COURSE_AREAS.map((area) => area.module).sort()).toEqual(
      [...new Set(courses.map((course) => course.module))].sort(),
    )
    const original = JSON.stringify(courses)
    selectAtlasCourses(courses, { kind: 'area', area: 'narrative' })
    expect(JSON.stringify(courses)).toBe(original)
    expect(
      courses.every(
        (course) => course.summary === null && course.verification.summary === 'draft',
      ),
    ).toBe(true)
  })

  it('counts the full curriculum without treating null tracks as unclassified', () => {
    const stats = atlasStatistics(courses)
    expect([stats.total, stats.required, stats.elective]).toEqual([69, 15, 54])
    expect(stats.areas.map((area) => area.count)).toEqual([13, 26, 12, 18])
    expect(stats.years.map((year) => year.count)).toEqual([12, 23, 23, 11])
    expect(stats.years.flatMap((year) => [year.first, year.second])).toEqual([
      6, 6, 11, 12, 11, 12, 7, 4,
    ])
    expect(
      selectAtlasCourses(courses).filter((course) => course.primaryTrack === null),
    ).toHaveLength(24)
  })

  it('makes every ID reachable exactly once through either overview', () => {
    const byArea = COURSE_AREAS.flatMap((area) =>
      selectAtlasCourses(courses, { kind: 'area', area: area.id }),
    )
    const byYear = ([1, 2, 3, 4] as const).flatMap((year) =>
      selectAtlasCourses(courses, { kind: 'year', year }),
    )
    const ids = courses.map((course) => course.id).sort()
    expect(byArea.map((course) => course.id).sort()).toEqual(ids)
    expect(byYear.map((course) => course.id).sort()).toEqual(ids)
    expect(selectAtlasCourses([...courses, courses[0]])).toHaveLength(69)
  })

  it('intersects year, module, semester and type, including empty combinations', () => {
    for (const area of COURSE_AREAS)
      for (const year of [1, 2, 3, 4] as const) {
        for (const semester of [1, 2] as const)
          for (const type of ['required', 'elective'] as const) {
            const expected = courses
              .filter(
                (course) =>
                  course.module === area.module &&
                  course.year === year &&
                  course.semester === semester &&
                  course.type === type,
              )
              .map((course) => course.id)
              .sort()
            expect(
              selectAtlasCourses(
                courses,
                { kind: 'area', area: area.id },
                { year, semester, type },
              )
                .map((course) => course.id)
                .sort(),
            ).toEqual(expected)
            expect(
              selectAtlasCourses(
                courses,
                { kind: 'year', year },
                { area: area.id, semester, type },
              )
                .map((course) => course.id)
                .sort(),
            ).toEqual(expected)
          }
      }
  })

  it('sorts deterministically and keeps input untouched', () => {
    const input = [...courses].reverse()
    const before = input.map((course) => course.id)
    expect(selectAtlasCourses(input).map((course) => course.id)).toEqual(
      selectAtlasCourses(courses).map((course) => course.id),
    )
    expect(input.map((course) => course.id)).toEqual(before)
  })

  it('paginates all IDs at both sizes and retains resize anchors', () => {
    for (const size of [6, 12] as const) {
      const collected: string[] = []
      const all = selectAtlasCourses(courses)
      for (let anchor = 0; anchor < all.length; anchor += size) {
        const page = atlasPage(all.length, anchor, size)
        collected.push(...all.slice(page.start, page.end).map((course) => course.id))
      }
      expect(collected).toEqual(all.map((course) => course.id))
    }
    expect(atlasPage(69, 18, 6).start).toBe(18)
    expect(atlasPage(69, 18, 12).start).toBe(12)
    expect(atlasPage(0, 30, 6)).toEqual({ page: 0, pages: 1, start: 0, end: 0 })
    expect(atlasPage(2, 900, 6).end).toBe(2)
    expect(atlasPage(69, NaN, 6).start).toBe(0)
  })
})
