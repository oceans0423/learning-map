import raw from './courses.json'
import { ROLE_IDS } from '../config/roles'
import { TRACK_NAMES, type TrackName } from '../config/tracks'
import { MODULES, type Course, type Verification } from '../types/course'

// 在載入時驗證 courses.json，資料一有錯立即失敗，而不是在畫面上悄悄出錯。

const VERIFICATION_KEYS: (keyof Verification)[] = [
  'basic',
  'role',
  'tracks',
  'module',
  'summary',
  'activities',
  'possibleOutputs',
]

function fail(id: string, message: string): never {
  throw new Error(`courses.json ${id}: ${message}`)
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string')
}

function isTrackName(v: unknown): v is TrackName {
  return typeof v === 'string' && (TRACK_NAMES as readonly string[]).includes(v)
}

function parseCourse(input: unknown, index: number): Course {
  if (typeof input !== 'object' || input === null || Array.isArray(input))
    fail(`#${index}`, 'not an object')
  const c = input as Record<string, unknown>
  const id = typeof c.id === 'string' && c.id ? c.id : fail(`#${index}`, 'missing id')

  if (typeof c.name !== 'string' || !c.name) fail(id, 'invalid name')
  if (typeof c.sourceName !== 'string' || !c.sourceName) fail(id, 'invalid sourceName')
  if (![1, 2, 3, 4].includes(c.year as number)) fail(id, `invalid year ${String(c.year)}`)
  if (![1, 2].includes(c.semester as number)) fail(id, `invalid semester ${String(c.semester)}`)
  if (typeof c.credits !== 'number' || !Number.isFinite(c.credits) || c.credits <= 0)
    fail(id, 'invalid credits')
  if (c.type !== 'required' && c.type !== 'elective') fail(id, `invalid type ${String(c.type)}`)
  if (!(ROLE_IDS as readonly unknown[]).includes(c.role))
    fail(id, `invalid role ${String(c.role)}`)
  if (!(MODULES as readonly unknown[]).includes(c.module))
    fail(id, `invalid module ${String(c.module)}`)
  if (c.primaryTrack !== null && !isTrackName(c.primaryTrack)) {
    fail(id, `invalid primaryTrack ${String(c.primaryTrack)}`)
  }
  if (!Array.isArray(c.relatedTracks) || !c.relatedTracks.every(isTrackName)) {
    fail(id, 'invalid relatedTracks')
  }
  if (new Set(c.relatedTracks).size !== c.relatedTracks.length)
    fail(id, 'duplicate relatedTracks')
  if (c.primaryTrack !== null && c.relatedTracks.includes(c.primaryTrack))
    fail(id, 'relatedTracks repeats primaryTrack')
  if (!isStringArray(c.subTags)) fail(id, 'invalid subTags')
  if (c.summary !== null && typeof c.summary !== 'string') fail(id, 'invalid summary')
  if (!isStringArray(c.activities)) fail(id, 'invalid activities')
  if (!isStringArray(c.possibleOutputs)) fail(id, 'invalid possibleOutputs')
  if (typeof c.offeringNote !== 'string') fail(id, 'invalid offeringNote')
  if (typeof c.sourceVersion !== 'string') fail(id, 'invalid sourceVersion')

  const v = c.verification as Record<string, unknown> | null
  if (typeof v !== 'object' || v === null || Array.isArray(v)) fail(id, 'missing verification')
  for (const key of VERIFICATION_KEYS) {
    if (v[key] !== 'approved' && v[key] !== 'draft') fail(id, `invalid verification.${key}`)
  }

  return c as unknown as Course
}

export function parseCourses(input: unknown): Course[] {
  if (!Array.isArray(input)) throw new Error('courses.json: courses is not an array')
  const courses = input.map(parseCourse)
  const seen = new Set<string>()
  for (const c of courses) {
    if (seen.has(c.id)) fail(c.id, 'duplicate id')
    seen.add(c.id)
  }
  return courses
}

export const meta = raw.meta
export const courses: readonly Course[] = parseCourses(raw.courses)
