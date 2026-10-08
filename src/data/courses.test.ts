import { describe, expect, it } from 'vitest'
import { courses, meta, parseCourses } from './courses'
import raw from './courses.json'
import approved from '../../doc/course/courses_v1.json'
import sourceList from '../../doc/course/人文跨域與應用學系必選修課清單.md?raw'
import { FOCUS_IDS, FOCUS_OPTIONS, focusFromUrl, focusToUrl } from '../config/focus'
import { ROLE_IDS, ROLES } from '../config/roles'
import { TRACKS, TRACKS_BY_ID } from '../config/tracks'

// T03：正式資料、原始清單、PRD §4.1／§8.5 的回歸檢核。

describe('courses data', () => {
  it('loads all 69 courses', () => {
    expect(courses).toHaveLength(69)
    expect(meta.totalCourses).toBe(courses.length)
  })

  it('rejects an invalid role', () => {
    const bad = [{ ...raw.courses[0], role: 'core' }]
    expect(() => parseCourses(bad)).toThrow(/course-001: invalid role core/)
  })

  it('rejects an unknown track name', () => {
    const bad = [{ ...raw.courses[0], relatedTracks: ['語文教育'] }]
    expect(() => parseCourses(bad)).toThrow(/invalid relatedTracks/)
  })

  it('rejects duplicate ids', () => {
    expect(() => parseCourses([raw.courses[0], raw.courses[0]])).toThrow(/duplicate id/)
  })

  it('keeps the frontend dataset identical to the approved source', () => {
    expect(raw).toEqual(approved)
  })

  it('matches every undergraduate row in the original course list', () => {
    const years: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4 }
    const rows = sourceList
      .split(/\r?\n/)
      .filter((line) => /^\| [一二三四][上下] \|/.test(line))
    expect(rows).toHaveLength(69)
    const matched = new Set<string>()
    for (const row of rows) {
      const [, term, sourceName, credits, requirement] = row
        .split('|')
        .map((cell) => cell.trim())
      const matches = courses.filter(
        (course) =>
          course.sourceName === sourceName &&
          course.year === years[term[0]] &&
          course.semester === (term[1] === '上' ? 1 : 2),
      )
      expect(matches, sourceName).toHaveLength(1)
      expect(matches[0].credits, sourceName).toBe(Number(credits))
      expect(matches[0].type, sourceName).toBe(requirement === '必修' ? 'required' : 'elective')
      matched.add(matches[0].id)
    }
    expect(matched.size).toBe(courses.length)
  })

  it('normalizes only CJK compatibility characters and fullwidth letters/digits', () => {
    const normalizeName = (name: string) =>
      name.replace(/[\uF900-\uFAFF\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A]/g, (character) =>
        character.normalize('NFKC'),
      )
    for (const course of courses)
      expect(course.name, course.id).toBe(normalizeName(course.sourceName))
    expect(courses.find((course) => course.id === 'course-068')?.name).toBe(
      '古典文獻的數據化與文化IP轉譯',
    )
  })

  it('matches course and credit totals including required credits', () => {
    const required = courses.filter((course) => course.type === 'required')
    expect(required).toHaveLength(15)
    expect(courses.filter((course) => course.type === 'elective')).toHaveLength(54)
    expect(courses.every((course) => course.credits === 2)).toBe(true)
    expect(courses.reduce((sum, course) => sum + course.credits, 0)).toBe(138)
    expect(required.reduce((sum, course) => sum + course.credits, 0)).toBe(30)
    expect(meta.required).toBe(required.length)
    expect(meta.elective).toBe(54)
    expect(meta.totalCredits).toBe(138)
  })

  it('matches the total, required and elective counts for all eight terms', () => {
    const expected = [
      [6, 2, 4],
      [6, 2, 4],
      [11, 1, 10],
      [12, 2, 10],
      [11, 1, 10],
      [12, 4, 8],
      [7, 2, 5],
      [4, 1, 3],
    ]
    expected.forEach(([total, required, elective], index) => {
      const term = courses.filter(
        (course) =>
          course.year === Math.floor(index / 2) + 1 && course.semester === (index % 2) + 1,
      )
      expect(term).toHaveLength(total)
      expect(term.filter((course) => course.type === 'required')).toHaveLength(required)
      expect(term.filter((course) => course.type === 'elective')).toHaveLength(elective)
    })
  })

  it('matches approved role and primary track statistics', () => {
    for (const [role, count] of Object.entries({
      foundation: 20,
      application: 45,
      integration: 4,
    })) {
      expect(courses.filter((course) => course.role === role)).toHaveLength(count)
    }
    for (const [track, count] of Object.entries({
      敘事與創作: 17,
      數位人文與媒介: 10,
      文化與社會實踐: 18,
    })) {
      expect(courses.filter((course) => course.primaryTrack === track)).toHaveLength(count)
    }
    expect(courses.filter((course) => course.primaryTrack === null)).toHaveLength(24)
    for (const course of courses) {
      expect(course.primaryTrack !== null, course.id).toBe(course.role === 'application')
      expect(course.relatedTracks).not.toContain(course.primaryTrack)
    }
  })

  it('retains approved basic/classification fields and empty draft descriptions', () => {
    for (const course of courses) {
      for (const key of ['basic', 'role', 'tracks', 'module'] as const)
        expect(course.verification[key]).toBe('approved')
      for (const key of ['summary', 'activities', 'possibleOutputs'] as const)
        expect(course.verification[key]).toBe('draft')
      expect(course.summary).toBeNull()
      expect(course.activities).toEqual([])
      expect(course.possibleOutputs).toEqual([])
    }
  })

  it('rejects malformed fields and unknown enumeration values', () => {
    const invalid: Record<string, unknown> = {
      id: '',
      name: '',
      sourceName: '',
      year: 5,
      semester: 0,
      credits: NaN,
      type: 'optional',
      role: 'unknown',
      module: 'unknown',
      primaryTrack: 'unknown',
      relatedTracks: null,
      subTags: [1],
      summary: {},
      activities: null,
      possibleOutputs: [1],
      offeringNote: null,
      sourceVersion: null,
      verification: null,
    }
    for (const [field, value] of Object.entries(invalid)) {
      expect(() => parseCourses([{ ...raw.courses[0], [field]: value }]), field).toThrow()
    }
    for (const credits of [0, -2, Infinity])
      expect(() => parseCourses([{ ...raw.courses[0], credits }])).toThrow(/invalid credits/)
    for (const input of [null, {}, 'text', [null], [[]]])
      expect(() => parseCourses(input)).toThrow()
  })

  it('rejects invalid verification status in every field group', () => {
    for (const key of Object.keys(raw.courses[0].verification)) {
      const verification = { ...raw.courses[0].verification, [key]: 'pending' }
      expect(() => parseCourses([{ ...raw.courses[0], verification }])).toThrow(
        `invalid verification.${key}`,
      )
    }
  })

  it('rejects related track duplication and overlap with the primary track', () => {
    expect(() =>
      parseCourses([{ ...raw.courses[0], relatedTracks: ['敘事與創作', '敘事與創作'] }]),
    ).toThrow(/duplicate relatedTracks/)
    expect(() =>
      parseCourses([
        { ...raw.courses[0], primaryTrack: '敘事與創作', relatedTracks: ['敘事與創作'] },
      ]),
    ).toThrow(/repeats primaryTrack/)
  })

  it('maps all five structure controls to stable URL values', () => {
    expect(FOCUS_OPTIONS).toHaveLength(5)
    expect(FOCUS_IDS).toEqual(['foundation', 'integration', 'narrative', 'digital', 'culture'])
    for (const option of FOCUS_OPTIONS) {
      expect(focusFromUrl(option.urlValue)).toEqual(option)
      expect(focusToUrl(option.id)).toBe(option.urlValue)
    }
    expect(focusFromUrl('敘事與創作')).toBeUndefined()
    expect(focusFromUrl('invalid')).toBeUndefined()
  })

  it('provides complete visual tokens for every track and role', () => {
    const tokenKeys = ['accent', 'soft', 'border', 'onAccent']
    expect(TRACKS_BY_ID.narrative).toEqual(TRACKS[0])
    expect(ROLES).toHaveLength(3)
    for (const item of [...TRACKS, ...ROLES]) {
      for (const key of tokenKeys)
        expect(item.visual[key as keyof typeof item.visual]).toMatch(/^#[0-9a-f]{6}$/i)
    }
    expect(ROLE_IDS).toEqual(['foundation', 'application', 'integration'])
  })
})
