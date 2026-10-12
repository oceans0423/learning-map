import { courses } from '../data/courses'
import { zodiacCourseThemes, zodiacProfiles } from '../data/zodiac'
import {
  ZODIAC_TOPICS,
  belongsToZodiac,
  zodiacConnectionTags,
  type ZodiacProfile,
  type ZodiacTopic,
  type ZodiacCourseTheme,
} from '../config/zodiac'
import type { Course } from '../types/course'

/** No fixed bundle size; every course with a primary/secondary theme is eligible. */
export function selectZodiacCourses(
  profile: ZodiacProfile,
  year: Course['year'] | null = null,
  catalog: readonly Course[] = courses,
  themes: readonly ZodiacCourseTheme[] = zodiacCourseThemes,
) {
  const byTheme = new Map(themes.map((theme) => [theme.id, theme]))
  return catalog.filter(
    (course) =>
      (!year || course.year === year) &&
      belongsToZodiac(profile, byTheme.get(course.id)?.tags ?? []),
  )
}
/** Same course can have different editorial angles, grounded in its known tags. */
export function zodiacCourseConnection(
  profile: ZodiacProfile,
  id: string,
  themes: readonly ZodiacCourseTheme[] = zodiacCourseThemes,
) {
  const tags = zodiacConnectionTags(
    profile,
    themes.find((theme) => theme.id === id)?.tags ?? [],
  )
  if (!tags.length) return null
  return { tags, primary: tags[0], reason: profile.interpretations[tags[0]]! }
}

export function zodiacCourseWeight(course: Course) {
  // Shared required foundations should inform, not overwhelm, elective interests.
  return course.type === 'required' &&
    course.role === 'foundation' &&
    course.primaryTrack === null
    ? 0.5
    : 1
}

/** Stable, explainable topic similarity, not a personality/aptitude score. */
export function matchZodiac(
  ids: readonly string[],
  catalog: readonly Course[] = courses,
  themes: readonly ZodiacCourseTheme[] = zodiacCourseThemes,
  profiles: readonly ZodiacProfile[] = zodiacProfiles,
) {
  const known = new Map(catalog.map((course) => [course.id, course]))
  const byTheme = new Map(themes.map((theme) => [theme.id, theme]))
  const selected = [...new Set(ids)]
    .sort()
    .flatMap((id) => (known.has(id) && byTheme.has(id) ? [known.get(id)!] : []))
  if (!selected.length) return null
  const topics = Object.keys(ZODIAC_TOPICS) as ZodiacTopic[]
  const distribution = Object.fromEntries(topics.map((key) => [key, 0])) as Record<
    ZodiacTopic,
    number
  >
  for (const course of selected) {
    const tags = byTheme.get(course.id)!.tags
    for (const tag of tags) distribution[tag] += zodiacCourseWeight(course) / tags.length
  }
  const norm = Math.hypot(...Object.values(distribution))
  const ranked = profiles
    .map((profile, index) => {
      const dot = topics.reduce(
        (sum, tag) => sum + distribution[tag] * (profile.weights[tag] ?? 0),
        0,
      )
      const weightNorm = Math.hypot(...Object.values(profile.weights))
      const evidence = topics
        .filter((tag) => profile.weights[tag] && distribution[tag] > 0)
        .sort(
          (a, b) =>
            distribution[b] * (profile.weights[b] ?? 0) -
            distribution[a] * (profile.weights[a] ?? 0),
        )
        .map((tag) => ({
          tag,
          courses: selected.filter((course) => byTheme.get(course.id)!.tags.includes(tag)),
        }))
      return {
        profile,
        score: norm && weightNorm ? dot / (norm * weightNorm) : 0,
        evidence,
        index,
      }
    })
    .sort((a, b) =>
      Math.abs(b.score - a.score) < 1e-9 ? a.index - b.index : b.score - a.score,
    )
  const tied = ranked.filter((candidate) => Math.abs(candidate.score - ranked[0].score) < 1e-9)
  return {
    count: selected.length,
    preliminary: selected.length < 3,
    broad: topics.filter((tag) => distribution[tag] > 0).length >= 9,
    ranked,
    tied,
    distribution,
  }
}

function fillOrder(profile: ZodiacProfile) {
  if (profile.fillOrder) return profile.fillOrder
  const order = [0]
  while (order.length < profile.points.length) {
    const candidates = profile.points
      .map(([x, y], index) => ({
        index,
        distance: Math.min(
          ...order.map((chosen) =>
            Math.hypot(x - profile.points[chosen][0], y - profile.points[chosen][1]),
          ),
        ),
      }))
      .filter(({ index }) => !order.includes(index))
      .sort((a, b) => b.distance - a.distance || a.index - b.index)
    order.push(candidates[0].index)
  }
  return order
}

/** Every valid ID is retained; overflow shares a keyboard-operable star group. */
export function assignZodiacCourses(
  profile: ZodiacProfile,
  ids: readonly string[],
  catalog: readonly Course[] = courses,
) {
  const known = new Map(catalog.map((course) => [course.id, course]))
  const selected = [...new Set(ids)].flatMap((id) => (known.has(id) ? [known.get(id)!] : []))
  const order = fillOrder(profile)
  const slots = profile.points.map(([x, y], index) => ({
    x,
    y,
    index,
    courses: [] as Course[],
  }))
  selected.forEach((course, index) => slots[order[index % order.length]].courses.push(course))
  return slots
}
