import { courses } from '../data/courses'
import { isCourseAreaId } from '../config/courseAreas'
import { isZodiacId, type ZodiacId } from '../config/zodiac'
import type { Course } from '../types/course'
import type { HistoryPort, LocationPort } from './urlState'
import { parseUrlState } from './urlState'
import { selectAtlasCourses, type AtlasFilters, type AtlasScope } from './courseAtlas'

export interface AtlasRoute {
  perspective: 'area' | 'year'
  screen: 'map' | 'mine' | 'constellation' | 'zodiac' | 'legacy'
  zodiac: ZodiacId | null
  zodiacAnchor: number
  zodiacYear: Course['year'] | null
  scope: AtlasScope | null
  filters: AtlasFilters
  anchor: number
  mineAnchor: number
  searchAnchor: number
  query: string
  courseId: string | null
}

const ids = new Set(courses.map((course) => course.id))
const keys = [
  'mapView',
  'mapScope',
  'mapYear',
  'mapArea',
  'mapSemester',
  'mapType',
  'mapAnchor',
  'mapMineAnchor',
  'mapSearchAnchor',
  'mapQuery',
  'mapScreen',
  'mapZodiac',
  'mapZodiacAnchor',
  'mapZodiacYear',
  'course',
]
const legacyKeys = ['sem', 'focus', 'open', 'atlas', 'signals']
const marker = '__courseAtlasV2Course'

export function emptyAtlasRoute(): AtlasRoute {
  return {
    perspective: 'area',
    screen: 'map',
    zodiac: null,
    zodiacAnchor: 0,
    zodiacYear: null,
    scope: null,
    filters: {},
    anchor: 0,
    mineAnchor: 0,
    searchAnchor: 0,
    query: '',
    courseId: null,
  }
}
function yearValue(value: string | null): Course['year'] | undefined {
  return value && /^[1-4]$/.test(value) ? (Number(value) as Course['year']) : undefined
}
function anchorValue(value: string | null) {
  return value && /^\d{1,6}$/.test(value) ? Number(value) : 0
}

export function parseAtlasRoute(search: string): AtlasRoute {
  const params = new URLSearchParams(search)
  const route = emptyAtlasRoute()
  const courseId = params.get('course')
  route.courseId = courseId && ids.has(courseId) ? courseId : null
  if (!keys.some((key) => key !== 'course' && params.has(key))) {
    const legacy = parseUrlState(search)
    const year =
      legacy.atlasYear !== undefined
        ? legacy.atlasYear
        : params.has('open')
          ? (legacy.openYears[0] as Course['year'])
          : undefined
    if (year) {
      route.perspective = 'year'
      route.scope = { kind: 'year', year: year as Course['year'] }
    }
    if (legacy.semester !== 'all') {
      route.filters.semester = legacy.semester
      route.scope ??= { kind: 'all' }
    }
    if (route.courseId && !route.scope) {
      const course = courses.find((item) => item.id === route.courseId)!
      route.perspective = 'year'
      route.scope = { kind: 'year', year: course.year }
      route.filters.semester = course.semester
    }
    if (route.courseId)
      route.anchor = Math.max(
        0,
        selectAtlasCourses(courses, route.scope ?? { kind: 'all' }, route.filters).findIndex(
          (course) => course.id === route.courseId,
        ),
      )
    return route
  }
  route.perspective = params.get('mapView') === 'year' ? 'year' : 'area'
  route.screen =
    params.get('mapScreen') === 'mine'
      ? 'mine'
      : params.get('mapScreen') === 'legacy'
        ? 'legacy'
        : params.get('mapScreen') === 'constellation'
          ? 'constellation'
          : params.get('mapScreen') === 'zodiac'
            ? 'zodiac'
            : 'map'
  const zodiac = params.get('mapZodiac')
  route.zodiac = isZodiacId(zodiac) ? zodiac : null
  route.zodiacAnchor = anchorValue(params.get('mapZodiacAnchor'))
  route.zodiacYear = yearValue(params.get('mapZodiacYear')) ?? null
  const scope = params.get('mapScope')
  if (isCourseAreaId(scope)) route.scope = { kind: 'area', area: scope }
  else if (scope === 'year' && yearValue(params.get('mapYear')))
    route.scope = { kind: 'year', year: yearValue(params.get('mapYear'))! }
  else if (scope === 'all') route.scope = { kind: 'all' }
  const filterYear = yearValue(params.get('mapYear'))
  if (route.scope?.kind !== 'year' && filterYear) route.filters.year = filterYear
  const area = params.get('mapArea')
  if (route.scope?.kind !== 'area' && isCourseAreaId(area)) route.filters.area = area
  const semester = params.get('mapSemester')
  if (semester === '1' || semester === '2') route.filters.semester = Number(semester) as 1 | 2
  const type = params.get('mapType')
  if (type === 'required' || type === 'elective') route.filters.type = type
  route.query = (params.get('mapQuery') ?? '').trim().slice(0, 120)
  route.anchor = anchorValue(params.get('mapAnchor'))
  route.mineAnchor = anchorValue(params.get('mapMineAnchor'))
  route.searchAnchor = anchorValue(params.get('mapSearchAnchor'))
  if (route.courseId && route.screen === 'map' && !route.scope && !route.query) {
    const course = courses.find((item) => item.id === route.courseId)!
    route.scope = { kind: 'year', year: course.year }
  }
  if (!route.scope) route.filters = {}
  if (route.scope?.kind === 'year') delete route.filters.year
  return route
}

export function atlasRouteUrl(route: AtlasRoute, location: LocationPort): string {
  const params = new URLSearchParams(location.search)
  for (const key of [...keys, ...legacyKeys]) params.delete(key)
  params.set('mapView', route.perspective)
  if (route.scope?.kind === 'area') params.set('mapScope', route.scope.area)
  else if (route.scope?.kind === 'year') {
    params.set('mapScope', 'year')
    params.set('mapYear', String(route.scope.year))
  } else if (route.scope) params.set('mapScope', 'all')
  if (route.filters.year && route.scope?.kind !== 'year')
    params.set('mapYear', String(route.filters.year))
  if (route.filters.area && route.scope?.kind !== 'area')
    params.set('mapArea', route.filters.area)
  if (route.filters.semester) params.set('mapSemester', String(route.filters.semester))
  if (route.filters.type) params.set('mapType', route.filters.type)
  if (route.anchor) params.set('mapAnchor', String(route.anchor))
  if (route.mineAnchor) params.set('mapMineAnchor', String(route.mineAnchor))
  if (route.searchAnchor) params.set('mapSearchAnchor', String(route.searchAnchor))
  if (route.query) params.set('mapQuery', route.query)
  if (route.screen !== 'map') params.set('mapScreen', route.screen)
  if (route.zodiac) params.set('mapZodiac', route.zodiac)
  if (route.zodiacAnchor) params.set('mapZodiacAnchor', String(route.zodiacAnchor))
  if (route.zodiacYear) params.set('mapZodiacYear', String(route.zodiacYear))
  if (route.courseId && ids.has(route.courseId)) params.set('course', route.courseId)
  // A skip-link fragment is a one-time focus jump, not persistent route state.
  // Carrying it into detail history lets native fragment restoration override
  // the source-course focus when the user closes the dialog with Back/Escape.
  const hash = location.hash === '#atlas-content' ? '' : location.hash
  return `${location.pathname}?${params}${hash}`
}

function historyData(history: HistoryPort) {
  return history.state && typeof history.state === 'object'
    ? { ...(history.state as Record<string, unknown>) }
    : {}
}

export function writeAtlasRoute(
  route: AtlasRoute,
  mode: 'push' | 'replace',
  history: HistoryPort = window.history,
  location: LocationPort = window.location,
) {
  const data = historyData(history)
  delete data[marker]
  history[mode === 'push' ? 'pushState' : 'replaceState'](
    data,
    '',
    atlasRouteUrl(route, location),
  )
}

export function openAtlasCourse(
  route: AtlasRoute,
  id: string,
  history: HistoryPort = window.history,
  location: LocationPort = window.location,
) {
  if (!ids.has(id)) throw new Error(`Unknown course ID: ${id}`)
  const data = historyData(history)
  const inApp = data[marker] === route.courseId
  if (!route.courseId || inApp) data[marker] = id
  else delete data[marker]
  const next = { ...route, courseId: id }
  history[route.courseId ? 'replaceState' : 'pushState'](
    data,
    '',
    atlasRouteUrl(next, location),
  )
  return next
}

export function closeAtlasCourse(
  route: AtlasRoute,
  history: HistoryPort = window.history,
  location: LocationPort = window.location,
): 'back' | 'replaced' {
  if (route.courseId && historyData(history)[marker] === route.courseId) {
    history.back()
    return 'back'
  }
  writeAtlasRoute({ ...route, courseId: null }, 'replace', history, location)
  return 'replaced'
}
