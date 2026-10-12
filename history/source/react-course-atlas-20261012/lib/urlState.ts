import { courses } from '../data/courses'
import { focusFromUrl, focusToUrl, type FocusId } from '../config/focus'
import type { SemesterFilter } from './semester'
import { SIGNAL_IDS, type SignalId } from '../config/explorationSignals'

export const DEFAULT_OPEN_YEARS = [1] as const

export interface MapUrlState {
  semester: SemesterFilter
  focus: FocusId[]
  openYears: number[]
  courseId: string | null
  /** New atlas view; omitted for untouched legacy URLs. null means overview. */
  atlasYear?: number | null
  signals?: SignalId[]
}

export interface HistoryPort {
  state: unknown
  pushState(data: unknown, unused: string, url?: string | URL | null): void
  replaceState(data: unknown, unused: string, url?: string | URL | null): void
  back(): void
}

export interface LocationPort {
  pathname: string
  search: string
  hash: string
}

const courseIds = new Set(courses.map((course) => course.id))
const historyMarker = '__curriculumMap'

export function parseUrlState(search: string): MapUrlState {
  const params = new URLSearchParams(search)
  const semesterValue = params.get('sem')
  const semester: SemesterFilter = semesterValue === '1' ? 1 : semesterValue === '2' ? 2 : 'all'

  const focus = [
    ...new Set(params.getAll('focus').flatMap((value) => value.split(',').filter(Boolean))),
  ]
    .map((value) => focusFromUrl(value))
    .filter((option) => option !== undefined)
    .map((option) => option.id)

  const openYears = [
    ...new Set(params.getAll('open').flatMap((value) => value.split(',').filter(Boolean))),
  ]
    .map(Number)
    .filter((year) => Number.isInteger(year) && year >= 1 && year <= 4)

  const courseValue = params.get('course')

  return {
    semester,
    focus,
    openYears: openYears.length ? openYears : [...DEFAULT_OPEN_YEARS],
    courseId: courseValue && courseIds.has(courseValue) ? courseValue : null,
    ...(params.has('signals')
      ? {
          signals: [
            ...new Set(params.getAll('signals').flatMap((value) => value.split(','))),
          ].filter((value): value is SignalId =>
            (SIGNAL_IDS as readonly string[]).includes(value),
          ),
        }
      : {}),
    ...(params.has('atlas')
      ? {
          atlasYear: /^[1-4]$/.test(params.get('atlas') ?? '')
            ? Number(params.get('atlas'))
            : null,
        }
      : {}),
  }
}

export function serializeUrlState(state: MapUrlState): string {
  const params = new URLSearchParams()
  if (state.semester !== 'all') params.set('sem', String(state.semester))
  const focus = [...new Set(state.focus)]
  if (focus.length) params.set('focus', focus.map(focusToUrl).join(','))
  const openYears = [...new Set(state.openYears)].filter(
    (year) => Number.isInteger(year) && year >= 1 && year <= 4,
  )
  if (openYears.length && !(openYears.length === 1 && openYears[0] === 1)) {
    params.set('open', openYears.join(','))
  }
  if (state.courseId && courseIds.has(state.courseId)) params.set('course', state.courseId)
  if (state.signals?.length)
    params.set(
      'signals',
      [...new Set(state.signals)].filter((id) => SIGNAL_IDS.includes(id)).join(','),
    )
  if (state.atlasYear === null) params.set('atlas', 'overview')
  else if (
    state.atlasYear !== undefined &&
    Number.isInteger(state.atlasYear) &&
    state.atlasYear >= 1 &&
    state.atlasYear <= 4
  )
    params.set('atlas', String(state.atlasYear))
  return params.toString()
}

function urlForState(state: MapUrlState, location: LocationPort): string {
  const query = serializeUrlState(state)
  return `${location.pathname}${query ? `?${query}` : ''}${location.hash}`
}

function preservedHistoryState(
  state: unknown,
  courseId: string | null,
): Record<string, unknown> {
  const existing = typeof state === 'object' && state !== null ? state : {}
  const next = { ...(existing as Record<string, unknown>) }
  if (courseId) next[historyMarker] = { openedCourse: courseId }
  else delete next[historyMarker]
  return next
}

function openedCourseMarker(state: unknown): unknown {
  const marker =
    typeof state === 'object' && state !== null
      ? (state as Record<string, unknown>)[historyMarker]
      : null
  return typeof marker === 'object' && marker !== null
    ? (marker as Record<string, unknown>).openedCourse
    : null
}

export function replaceUrlState(
  state: MapUrlState,
  history: HistoryPort = window.history,
  location: LocationPort = window.location,
): void {
  history.replaceState(
    preservedHistoryState(
      history.state,
      state.courseId && openedCourseMarker(history.state) === state.courseId
        ? state.courseId
        : null,
    ),
    '',
    urlForState(state, location),
  )
}

export function pushCourseUrlState(
  state: MapUrlState,
  courseId: string,
  history: HistoryPort = window.history,
  location: LocationPort = window.location,
): void {
  if (!courseIds.has(courseId)) throw new Error(`Unknown course ID: ${courseId}`)
  if (state.courseId) {
    history.replaceState(
      preservedHistoryState(
        history.state,
        openedCourseMarker(history.state) === state.courseId ? courseId : null,
      ),
      '',
      urlForState({ ...state, courseId }, location),
    )
    return
  }
  history.pushState(
    preservedHistoryState(history.state, courseId),
    '',
    urlForState({ ...state, courseId }, location),
  )
}

export function setCourseUrlState(
  state: MapUrlState,
  courseId: string | null,
  history: HistoryPort = window.history,
  location: LocationPort = window.location,
): void {
  if (courseId !== null && !courseIds.has(courseId))
    throw new Error(`Unknown course ID: ${courseId}`)
  history.replaceState(
    preservedHistoryState(history.state, null),
    '',
    urlForState({ ...state, courseId }, location),
  )
}

/** Back closes a course opened in-app; a directly shared course URL is replaced in place. */
export function closeCourseUrlState(
  state: MapUrlState,
  history: HistoryPort = window.history,
  location: LocationPort = window.location,
): 'back' | 'replaced' {
  const marker =
    typeof history.state === 'object' && history.state !== null
      ? (history.state as Record<string, unknown>)[historyMarker]
      : null
  const openedCourse =
    typeof marker === 'object' && marker !== null
      ? (marker as Record<string, unknown>).openedCourse
      : null
  if (state.courseId && openedCourse === state.courseId) {
    history.back()
    return 'back'
  }
  replaceUrlState({ ...state, courseId: null }, history, location)
  return 'replaced'
}
