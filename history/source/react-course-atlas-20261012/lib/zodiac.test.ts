import { describe, expect, it } from 'vitest'
import profilesRaw from '../data/zodiacProfiles.json'
import themesRaw from '../data/zodiacCourseThemes.json'
import { courses } from '../data/courses'
import { parseZodiacData, zodiacCourseThemes, zodiacProfiles } from '../data/zodiac'
import {
  assignZodiacCourses,
  matchZodiac,
  zodiacCourseWeight,
  selectZodiacCourses,
  zodiacCourseConnection,
} from './zodiac'

describe('independent draft zodiac registry', () => {
  it('covers every course including the 24 null-track courses, without using unapproved summaries', () => {
    expect(zodiacProfiles).toHaveLength(12)
    expect(zodiacCourseThemes.map((theme) => theme.id).sort()).toEqual(
      courses.map((course) => course.id).sort(),
    )
    expect(courses.filter((course) => course.primaryTrack === null)).toHaveLength(24)
    expect(new Set(zodiacProfiles.map((profile) => JSON.stringify(profile.points))).size).toBe(
      12,
    )
    for (const profile of zodiacProfiles) expect(profile.exampleIds.length).toBeGreaterThan(0)
  })
  it.each(['coverage', 'duplicate', 'unknown tag', 'tag count', 'reason', 'approved'])(
    'rejects invalid theme %s',
    (fault) => {
      const themes = structuredClone(themesRaw)
      if (fault === 'coverage') themes.courses.pop()
      if (fault === 'duplicate') themes.courses[1] = themes.courses[0]
      if (fault === 'unknown tag') themes.courses[0].tags = ['not-a-topic']
      if (fault === 'tag count') themes.courses[0].tags = ['research']
      if (fault === 'reason') themes.courses[0].reason = ''
      if (fault === 'approved') themes.status = 'approved'
      expect(() => parseZodiacData(profilesRaw, themes, courses)).toThrow()
    },
  )
  it.each([
    'count',
    'example',
    'weight',
    'point',
    'disconnected',
    'duplicate edge',
    'fill',
    'description',
    'interpretation',
    'encoding',
  ])('rejects invalid profile %s', (fault) => {
    const raw = structuredClone(profilesRaw)
    if (fault === 'count') raw.profiles.pop()
    if (fault === 'example') raw.profiles[0].exampleIds[0] = 'unknown'
    if (fault === 'description') raw.profiles[0].description = ''
    if (fault === 'encoding') raw.profiles[0].description = '?????'
    if (fault === 'interpretation') raw.profiles[0].interpretations.planning = ''
    if (fault === 'weight') raw.profiles[0].weights.planning = -1
    if (fault === 'point') raw.profiles[0].points[0][0] = NaN
    if (fault === 'disconnected') raw.profiles[0].edges.pop()
    if (fault === 'duplicate edge') raw.profiles[0].edges.push([1, 0])
    if (fault === 'fill') raw.profiles[7].fillOrder = [1, 1]
    expect(() => parseZodiacData(raw, themesRaw, courses)).toThrow()
  })
})
describe('deterministic course-topic matching', () => {
  it('has no empty match, and explicitly distinguishes 1 / 2 / 3-course results', () => {
    expect(matchZodiac(['missing'])).toBeNull()
    expect(matchZodiac([])).toBeNull()
    expect(matchZodiac(['course-001'])?.preliminary).toBe(true)
    expect(matchZodiac(['course-001', 'course-002'])?.preliminary).toBe(true)
    expect(matchZodiac(['course-001', 'course-002', 'course-003'])?.preliminary).toBe(false)
  })
  it('deduplicates and is independent of collection order, without modifying inputs', () => {
    const ids = ['course-051', 'course-030', 'course-005']
    const before = structuredClone(ids)
    const match = matchZodiac(ids)
    expect(matchZodiac([...ids].reverse())).toEqual(match)
    expect(matchZodiac([...ids, ids[0], 'unknown'])).toEqual(match)
    expect(ids).toEqual(before)
  })
  it('normalizes multi-tag courses and explicitly weights only shared required foundations at 0.5', () => {
    for (const course of courses) {
      const result = matchZodiac([course.id])!
      expect(Object.values(result.distribution).reduce((a, b) => a + b, 0)).toBeCloseTo(
        zodiacCourseWeight(course),
      )
      expect(zodiacCourseWeight(course)).toBe(
        course.type === 'required' &&
          course.role === 'foundation' &&
          course.primaryTrack === null
          ? 0.5
          : 1,
      )
    }
  })
  it('returns genuine selected-course evidence and a broad-interest warning for all courses', () => {
    const ids = courses.map((course) => course.id)
    const result = matchZodiac(ids)!
    expect(result.count).toBe(69)
    expect(result.broad).toBe(true)
    expect(result.ranked).toHaveLength(12)
    for (const rank of result.ranked) {
      expect(rank.score).toBeGreaterThanOrEqual(0)
      expect(rank.score).toBeLessThanOrEqual(1.000000001)
      for (const evidence of rank.evidence)
        for (const course of evidence.courses) {
          expect(ids).toContain(course.id)
          expect(zodiacCourseThemes.find((theme) => theme.id === course.id)!.tags).toContain(
            evidence.tag,
          )
        }
    }
  })
  it('reports ties and keeps a stable order without presenting an arbitrary winner as certain', () => {
    const identical = zodiacProfiles
      .slice(0, 2)
      .map((profile) => ({ ...profile, weights: { technology: 1 } }))
    const result = matchZodiac(['course-030'], courses, zodiacCourseThemes, identical)!
    expect(result.tied.map((rank) => rank.profile.id)).toEqual(['aries', 'taurus'])
  })
  it('every editorial example belongs to the full theme and has genuine topic evidence', () => {
    for (const profile of zodiacProfiles) {
      const match = matchZodiac(profile.exampleIds)!
      expect(
        match.ranked.find((rank) => rank.profile.id === profile.id)!.evidence.length,
      ).toBeGreaterThan(0)
      for (const id of profile.exampleIds)
        expect(selectZodiacCourses(profile).some((course) => course.id === id)).toBe(true)
    }
  })
})
describe('four-year themes and honest editorial explanations', () => {
  it('has twelve distinct short introductions and explains every weighted topic', () => {
    expect(new Set(zodiacProfiles.map((profile) => profile.tagline)).size).toBe(12)
    expect(new Set(zodiacProfiles.map((profile) => profile.description)).size).toBe(12)
    for (const profile of zodiacProfiles) {
      expect(profile.description.length).toBeLessThan(150)
      expect(Object.keys(profile.interpretations).sort()).toEqual(
        Object.keys(profile.weights).sort(),
      )
    }
  })
  it('includes all 69 courses across overlapping themes, with no six-course cap', () => {
    const union = new Set<string>()
    const before = JSON.stringify([courses, zodiacCourseThemes, zodiacProfiles])
    for (const profile of zodiacProfiles) {
      const selected = selectZodiacCourses(profile)
      expect(selected.length).toBeGreaterThan(6)
      expect(new Set(selected.map((course) => course.id)).size).toBe(selected.length)
      expect([...new Set(selected.map((course) => course.year))].sort()).toEqual([1, 2, 3, 4])
      for (const course of selected) {
        union.add(course.id)
        const tags = zodiacCourseThemes.find((theme) => theme.id === course.id)!.tags
        expect(tags.some((tag) => (profile.weights[tag] ?? 0) >= 2)).toBe(true)
      }
    }
    expect([...union].sort()).toEqual(courses.map((course) => course.id).sort())
    expect(JSON.stringify([courses, zodiacCourseThemes, zodiacProfiles])).toBe(before)
  })
  it.each([1, 2, 3, 4] as const)(
    'each year %i is a complete nonempty subset in every theme',
    (year) => {
      for (const profile of zodiacProfiles) {
        const all = selectZodiacCourses(profile)
        const selected = selectZodiacCourses(profile, year)
        expect(selected.length).toBeGreaterThan(0)
        expect(selected).toEqual(all.filter((course) => course.year === year))
      }
    },
  )
  it('keeps accent-only courses out of the theme while retaining them in personal matching', () => {
    const taurus = zodiacProfiles.find((profile) => profile.id === 'taurus')!
    expect(selectZodiacCourses(taurus).some((course) => course.id === 'course-011')).toBe(false)
    expect(
      matchZodiac(['course-011'])!
        .ranked.find((rank) => rank.profile.id === 'taurus')!
        .evidence.some((e) => e.tag === 'heritage'),
    ).toBe(true)
  })
  it('gives the same real course different grounded angles, never inventing a missing connection', () => {
    const taurus = zodiacProfiles.find((profile) => profile.id === 'taurus')!
    const pisces = zodiacProfiles.find((profile) => profile.id === 'pisces')!
    expect(zodiacCourseConnection(taurus, 'course-046')!.primary).toBe('nature')
    expect(zodiacCourseConnection(pisces, 'course-046')!.primary).toBe('expression')
    expect(zodiacCourseConnection(taurus, 'course-046')!.reason).not.toBe(
      zodiacCourseConnection(pisces, 'course-046')!.reason,
    )
    expect(zodiacCourseConnection(taurus, 'unknown')).toBeNull()
    expect(zodiacCourseConnection(taurus, 'course-030')).toBeNull()
  })
  it('rejects a theme without four years, instead of fabricating assignments', () => {
    const catalog = courses.filter((course) => course.year !== 4)
    const known = new Set(catalog.map((course) => course.id))
    const themes = {
      ...themesRaw,
      courses: themesRaw.courses.filter((theme) => known.has(theme.id)),
    }
    expect(() => parseZodiacData(profilesRaw, themes, catalog)).toThrow(/all four years/)
  })
})
describe('twelve shapes retain the whole collection', () => {
  it('keeps 44px targets apart and inside the smallest supported normal / text-scaled charts', () => {
    for (const profile of zodiacProfiles)
      for (const [width, height] of [
        [206, 500],
        [260, 360],
      ]) {
        const boxes = profile.points.map(([x, y]) => ({
          x: x * width - 22,
          y: y * height - 22,
        }))
        for (const [index, a] of boxes.entries()) {
          expect(a.x).toBeGreaterThanOrEqual(0)
          expect(a.y).toBeGreaterThanOrEqual(0)
          expect(a.x + 44).toBeLessThanOrEqual(width)
          expect(a.y + 44).toBeLessThanOrEqual(height)
          for (const b of boxes.slice(index + 1))
            expect(
              a.x + 44 <= b.x || b.x + 44 <= a.x || a.y + 44 <= b.y || b.y + 44 <= a.y,
              profile.id,
            ).toBe(true)
        }
      }
  })
  it.each([0, 1, 2, 8, 12, 69])(
    'retains %i unique courses across every shape, without reshaping original data',
    (count) => {
      const ids = courses.slice(0, count).map((course) => course.id)
      const before = JSON.stringify(zodiacProfiles)
      for (const profile of zodiacProfiles) {
        const slots = assignZodiacCourses(profile, [...ids, ...ids, 'missing'])
        expect(slots).toHaveLength(profile.points.length)
        expect(slots.flatMap((slot) => slot.courses.map((course) => course.id)).sort()).toEqual(
          [...ids].sort(),
        )
        expect(slots.filter((slot) => slot.courses.length)).toHaveLength(
          Math.min(count, profile.points.length),
        )
      }
      expect(JSON.stringify(zodiacProfiles)).toBe(before)
    },
  )
})
