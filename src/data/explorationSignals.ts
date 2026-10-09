import raw from './explorationSignals.json'
import { courses } from './courses'
import { SIGNAL_IDS, type SignalId } from '../config/explorationSignals'
import type { Course } from '../types/course'

type MappingBase = { id: string; status: 'draft' | 'approved'; reason: string }
export type ExplorationSignalMapping = MappingBase &
  (
    | { signalPolicy: 'assigned'; primary: SignalId; secondary: SignalId | null }
    | { signalPolicy: 'open'; primary: null; secondary: null }
  )
type CourseIdentity = Pick<Course, 'id' | 'role'>
export type SignalRegistry = ReadonlyMap<string, ExplorationSignalMapping>

function isSignal(value: unknown): value is SignalId {
  return typeof value === 'string' && (SIGNAL_IDS as readonly string[]).includes(value)
}

export function parseExplorationSignals(
  input: unknown,
  courseList: readonly CourseIdentity[],
): SignalRegistry {
  if (!Array.isArray(input)) throw new Error('explorationSignals: expected array')
  const courseById = new Map(courseList.map((course) => [course.id, course]))
  const entries = new Map<string, ExplorationSignalMapping>()
  for (const value of input) {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
      throw new Error('explorationSignals: invalid entry')
    const entry = value as Record<string, unknown>
    const id = entry.id
    if (typeof id !== 'string' || !courseById.has(id))
      throw new Error('explorationSignals: unknown course ID')
    if (entries.has(id)) throw new Error(`explorationSignals: duplicate ${id}`)
    if (
      (entry.status !== 'draft' && entry.status !== 'approved') ||
      typeof entry.reason !== 'string' ||
      !entry.reason.trim()
    )
      throw new Error(`explorationSignals: invalid status/reason ${id}`)
    const integration = courseById.get(id)!.role === 'integration'
    if (entry.signalPolicy === 'open') {
      if (!integration || entry.primary !== null || entry.secondary !== null)
        throw new Error(`explorationSignals: invalid open policy ${id}`)
    } else if (entry.signalPolicy === 'assigned') {
      if (
        integration ||
        !isSignal(entry.primary) ||
        (entry.secondary !== null && !isSignal(entry.secondary)) ||
        entry.secondary === entry.primary
      )
        throw new Error(`explorationSignals: invalid assigned policy ${id}`)
    } else {
      throw new Error(`explorationSignals: unknown policy ${id}`)
    }
    entries.set(id, Object.freeze({ ...entry }) as ExplorationSignalMapping)
  }
  for (const id of courseById.keys()) {
    if (!entries.has(id)) throw new Error(`explorationSignals: missing ${id}`)
  }
  return entries
}

export const explorationSignals = parseExplorationSignals(raw, courses)

export function getCourseSignal(id: string, registry = explorationSignals) {
  const mapping = registry.get(id)
  if (!mapping) throw new Error(`explorationSignals: missing ${id}`)
  return mapping
}

export function matchesSignal(
  mapping: ExplorationSignalMapping,
  selected: readonly SignalId[],
): boolean {
  if (mapping.signalPolicy === 'open' || !selected.length) return false
  return selected.some((id) => mapping.primary === id || mapping.secondary === id)
}

export function getRelatedCourses(
  courseList: readonly Course[],
  selected: readonly SignalId[],
  registry = explorationSignals,
): readonly Course[] {
  const unique = new Map(courseList.map((course) => [course.id, course]))
  return [...unique.values()].filter((course) =>
    matchesSignal(getCourseSignal(course.id, registry), selected),
  )
}

export function getSignalStats(courseList: readonly Course[], registry = explorationSignals) {
  const counts = { text: 0, story: 0, digital: 0, field: 0, open: 0, total: 0, secondary: 0 }
  for (const course of new Map(courseList.map((item) => [item.id, item])).values()) {
    const mapping = getCourseSignal(course.id, registry)
    counts.total++
    if (mapping.signalPolicy === 'open') counts.open++
    else {
      counts[mapping.primary]++
      if (mapping.secondary) counts.secondary++
    }
  }
  return counts
}
