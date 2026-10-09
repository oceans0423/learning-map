import profilesRaw from './zodiacProfiles.json'
import themesRaw from './zodiacCourseThemes.json'
import { courses } from './courses'
import {
  isZodiacId,
  ZODIAC_IDS,
  ZODIAC_TOPICS,
  belongsToZodiac,
  type ZodiacProfile,
  type ZodiacCourseTheme,
} from '../config/zodiac'
import type { Course } from '../types/course'

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('zodiac: expected object')
  return value as Record<string, unknown>
}
function fail(message: string): never {
  throw new Error('zodiac: ' + message)
}
function text(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 && !/[?\uFFFD]{3,}/.test(value)
}
function topics(value: unknown) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    new Set(value).size === value.length &&
    value.every((key) => typeof key === 'string' && Object.hasOwn(ZODIAC_TOPICS, key))
  )
}
function envelope(value: unknown, key: string, version = 1): unknown[] {
  const data = object(value)
  if (data.version !== version || data.status !== 'draft' || !Array.isArray(data[key]))
    fail('invalid draft envelope')
  return data[key] as unknown[]
}

/** Independent editorial data; never edits or approves curriculum metadata. */
export function parseZodiacData(
  profileInput: unknown,
  themeInput: unknown,
  catalog: readonly Course[],
) {
  const known = new Set(catalog.map((course) => course.id))
  const themes = envelope(themeInput, 'courses').map((value) => {
    const theme = object(value)
    if (
      typeof theme.id !== 'string' ||
      !known.has(theme.id) ||
      !topics(theme.tags) ||
      !(Array.isArray(theme.tags) && [2, 3].includes(theme.tags.length)) ||
      !text(theme.reason)
    )
      fail('invalid course theme')
    return theme as unknown as ZodiacCourseTheme
  })
  if (
    themes.length !== known.size ||
    new Set(themes.map((theme) => theme.id)).size !== known.size
  )
    fail('course coverage must be exact')
  const byCourse = new Map(themes.map((theme) => [theme.id, theme]))
  const profiles = envelope(profileInput, 'profiles', 2).map((value) => {
    const p = object(value)
    if (
      !isZodiacId(p.id) ||
      !text(p.label) ||
      !text(p.theme) ||
      !text(p.traits) ||
      !text(p.tagline) ||
      !text(p.description)
    )
      fail('invalid profile')
    const weights = object(p.weights)
    if (
      !topics(Object.keys(weights)) ||
      Object.values(weights).some((w) => typeof w !== 'number' || !Number.isFinite(w) || w <= 0)
    )
      fail('invalid weights')
    const interpretations = object(p.interpretations)
    if (
      Object.keys(interpretations).length !== Object.keys(weights).length ||
      Object.keys(weights).some((key) => !text(interpretations[key])) ||
      Object.keys(interpretations).some((key) => !Object.hasOwn(weights, key))
    )
      fail('interpretations must explain every weighted topic')
    const profile = p as unknown as ZodiacProfile
    if (
      !Array.isArray(p.exampleIds) ||
      !p.exampleIds.length ||
      new Set(p.exampleIds).size !== p.exampleIds.length ||
      p.exampleIds.some(
        (id) => !known.has(id) || !belongsToZodiac(profile, byCourse.get(id)!.tags),
      )
    )
      fail('invalid or unrelated example courses')
    const related = catalog.filter((course) =>
      belongsToZodiac(profile, byCourse.get(course.id)!.tags),
    )
    if ([1, 2, 3, 4].some((year) => !related.some((course) => course.year === year)))
      fail('each theme must cover all four years')
    if (
      !Array.isArray(p.points) ||
      p.points.length < 4 ||
      p.points.some(
        (point) =>
          !Array.isArray(point) ||
          point.length !== 2 ||
          point.some((n) => typeof n !== 'number' || !Number.isFinite(n) || n < 0.1 || n > 0.9),
      )
    )
      fail('invalid points')
    const count = p.points.length
    if (new Set(p.points.map((point) => JSON.stringify(point))).size !== count)
      fail('duplicate points')
    if (
      !Array.isArray(p.edges) ||
      p.edges.some(
        (edge) =>
          !Array.isArray(edge) ||
          edge.length !== 2 ||
          edge[0] === edge[1] ||
          edge.some((n) => !Number.isInteger(n) || n < 0 || n >= count),
      )
    )
      fail('invalid edges')
    const edges = p.edges as number[][]
    if (
      new Set(edges.map((edge) => [...edge].sort((a, b) => a - b).join(','))).size !==
      edges.length
    )
      fail('duplicate edges')
    const reached = new Set([0])
    for (let i = 0; i < count; i++)
      for (const [a, b] of edges)
        if (reached.has(a) || reached.has(b)) {
          reached.add(a)
          reached.add(b)
        }
    if (reached.size !== count) fail('disconnected shape')
    if (
      p.fillOrder !== undefined &&
      (!Array.isArray(p.fillOrder) ||
        p.fillOrder.length !== count ||
        new Set(p.fillOrder).size !== count ||
        p.fillOrder.some((n) => !Number.isInteger(n) || n < 0 || n >= count))
    )
      fail('invalid fill order')
    return p as unknown as ZodiacProfile
  })
  if (
    profiles.length !== 12 ||
    new Set(profiles.map((p) => p.id)).size !== 12 ||
    new Set(profiles.map((p) => JSON.stringify([p.points, p.edges]))).size !== 12
  )
    fail('twelve distinct profiles required')
  if (
    catalog.some(
      (course) =>
        !profiles.some((profile) => belongsToZodiac(profile, byCourse.get(course.id)!.tags)),
    )
  )
    fail('every course must belong to at least one theme')
  return { profiles: ZODIAC_IDS.map((id) => profiles.find((p) => p.id === id)!), themes }
}
const data = parseZodiacData(profilesRaw, themesRaw, courses)
export const zodiacProfiles: readonly ZodiacProfile[] = data.profiles
export const zodiacCourseThemes: readonly ZodiacCourseTheme[] = data.themes
export const zodiacProfilesById = Object.fromEntries(
  zodiacProfiles.map((p) => [p.id, p]),
) as Record<ZodiacProfile['id'], ZodiacProfile>
