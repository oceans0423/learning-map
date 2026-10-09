import { describe, expect, it } from 'vitest'
import {
  atlasRouteUrl,
  closeAtlasCourse,
  emptyAtlasRoute,
  openAtlasCourse,
  parseAtlasRoute,
  writeAtlasRoute,
} from './courseAtlasRoute'
import type { HistoryPort } from './urlState'

const location = { pathname: '/map/', search: '?ui=atlas2&external=keep', hash: '' }
function port() {
  const calls: { kind: string; url?: string | URL | null }[] = []
  const history: HistoryPort = {
    state: { unrelated: true },
    pushState(data, _unused, url) {
      this.state = data
      calls.push({ kind: 'push', url })
    },
    replaceState(data, _unused, url) {
      this.state = data
      calls.push({ kind: 'replace', url })
    },
    back() {
      calls.push({ kind: 'back' })
    },
  }
  return { history, calls }
}
describe('course atlas navigation contract', () => {
  it('opens overview by default and safely rejects invalid fields', () => {
    expect(parseAtlasRoute('')).toEqual(emptyAtlasRoute())
    const route = parseAtlasRoute(
      '?mapView=x&mapScope=missing&mapYear=7&mapArea=x&mapSemester=5&mapType=no&mapAnchor=-4&course=missing',
    )
    expect(route.scope).toBeNull()
    expect(route.courseId).toBeNull()
    expect(route.anchor).toBe(0)
    expect(route.filters).toEqual({})
  })
  it('round-trips scope, filters, source pagination and global query separately', () => {
    const route = {
      ...emptyAtlasRoute(),
      scope: { kind: 'area', area: 'narrative' } as const,
      filters: { year: 2, semester: 1, type: 'elective' } as const,
      anchor: 18,
      mineAnchor: 6,
      searchAnchor: 12,
      query: '文化',
      screen: 'mine' as const,
    }
    const url = atlasRouteUrl(route, location)
    expect(url).toContain('external=keep')
    expect(url).toContain('ui=atlas2')
    expect(parseAtlasRoute(url.slice(url.indexOf('?')))).toEqual(route)
  })
  it('locates legacy semester/year/course links without reinterpreting focus or signals', () => {
    const route = parseAtlasRoute('?atlas=2&sem=2&focus=story&signals=text')
    expect(route.scope).toEqual({ kind: 'year', year: 2 })
    expect(route.filters).toEqual({ semester: 2 })
    expect(parseAtlasRoute('?open=3,4').scope).toEqual({ kind: 'year', year: 3 })
    expect(parseAtlasRoute('?course=course-069').courseId).toBe('course-069')
    const next = atlasRouteUrl(route, {
      ...location,
      search: '?focus=story&signals=text&sem=2&external=keep',
    })
    expect(next).not.toMatch(/focus=|signals=|sem=/)
    expect(next).toContain('mapSemester=2')
  })
  it('does not carry a one-time skip-link focus fragment into course navigation', () => {
    const route = { ...emptyAtlasRoute(), scope: { kind: 'area', area: 'thinking' } as const }
    expect(atlasRouteUrl(route, { ...location, hash: '#atlas-content' })).not.toContain('#')
    expect(atlasRouteUrl(route, { ...location, hash: '#external' })).toContain('#external')
  })
  it('round-trips the optional constellation view, detail and the existing personal list anchor', () => {
    const route = {
      ...emptyAtlasRoute(),
      screen: 'constellation' as const,
      mineAnchor: 18,
      courseId: 'course-069',
    }
    const url = atlasRouteUrl(route, location)
    expect(parseAtlasRoute(url.slice(url.indexOf('?')))).toEqual(route)
    expect(parseAtlasRoute('?mapScreen=constellation&mapQuery=文化').screen).toBe(
      'constellation',
    )
    expect(parseAtlasRoute('?mapScreen=unrecognized').screen).toBe('map')
  })
  it('pushes once for details, replaces when changing course and closes by Back', () => {
    const { history, calls } = port()
    const first = openAtlasCourse(emptyAtlasRoute(), 'course-001', history, location)
    const second = openAtlasCourse(first, 'course-002', history, location)
    expect(closeAtlasCourse(second, history, location)).toBe('back')
    expect(calls.map((call) => call.kind)).toEqual(['push', 'replace', 'back'])
    expect(history.state).toHaveProperty('unrelated', true)
  })
  it('round-trips zodiac themes, separate anchors, global search and direct details', () => {
    for (const screen of ['zodiac', 'constellation'] as const) {
      const route = {
        ...emptyAtlasRoute(),
        screen,
        zodiac: 'taurus' as const,
        zodiacAnchor: 6,
        mineAnchor: 12,
        query: '文學',
        courseId: 'course-046',
      }
      const url = atlasRouteUrl(route, location)
      expect(parseAtlasRoute(url.slice(url.indexOf('?')))).toEqual(route)
    }
    expect(
      parseAtlasRoute('?mapScreen=zodiac&mapZodiac=missing&mapZodiacAnchor=-1').zodiac,
    ).toBeNull()
    expect(parseAtlasRoute('?mapScreen=zodiac&mapZodiacAnchor=-1').zodiacAnchor).toBe(0)
  })
  it('keeps zodiac year separate from main-map filters and restores it across global search', () => {
    const route = {
      ...emptyAtlasRoute(),
      screen: 'zodiac' as const,
      zodiac: 'taurus' as const,
      zodiacYear: 3 as const,
      zodiacAnchor: 6,
      query: '文化',
      searchAnchor: 12,
      scope: { kind: 'all' } as const,
      filters: { year: 1 as const },
      courseId: 'course-046',
    }
    const url = atlasRouteUrl(route, location)
    expect(parseAtlasRoute(url.slice(url.indexOf('?')))).toEqual(route)
    expect(parseAtlasRoute('?mapScreen=zodiac&mapZodiacYear=3').filters).toEqual({})
    for (const value of ['0', '5', '-1', '2.5', 'garbage'])
      expect(parseAtlasRoute('?mapScreen=zodiac&mapZodiacYear=' + value).zodiacYear).toBeNull()
  })
  it('does not go off-site for direct links, including switching to a second course', () => {
    const { history, calls } = port()
    const direct = parseAtlasRoute('?course=course-001')
    const next = openAtlasCourse(direct, 'course-002', history, location)
    expect(closeAtlasCourse(next, history, location)).toBe('replaced')
    expect(calls.map((call) => call.kind)).toEqual(['replace', 'replace'])
    expect(calls.at(-1)?.url).not.toContain('course=')
  })
  it('navigation clears only its own course marker and rejects unknown IDs', () => {
    const { history } = port()
    openAtlasCourse(emptyAtlasRoute(), 'course-001', history, location)
    writeAtlasRoute(emptyAtlasRoute(), 'push', history, location)
    expect(history.state).toEqual({ unrelated: true })
    expect(() => openAtlasCourse(emptyAtlasRoute(), 'missing', history, location)).toThrow()
  })
})
