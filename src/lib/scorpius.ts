import type { Course } from '../types/course'

/** Original, stylized Scorpius layout; not an astronomical coordinate chart. */
export const SCORPIUS_POINTS = [
  { x: 0.18, y: 0.12 },
  { x: 0.4, y: 0.16 },
  { x: 0.12, y: 0.31 },
  { x: 0.29, y: 0.4 },
  { x: 0.38, y: 0.55 },
  { x: 0.41, y: 0.7 },
  { x: 0.52, y: 0.85 },
  { x: 0.74, y: 0.82 },
  { x: 0.89, y: 0.67 },
  { x: 0.87, y: 0.49 },
  { x: 0.65, y: 0.4 },
] as const

export const SCORPIUS_EDGES = [
  [0, 3],
  [1, 3],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [8, 9],
  [9, 10],
] as const

// Fill widely separated points first; additional courses share a selectable group.
const assignmentOrder = [3, 7, 1, 8, 0, 4, 9, 2, 5, 10, 6] as const

export function assignScorpiusCourses(ids: readonly string[], catalog: readonly Course[]) {
  const known = new Map(catalog.map((course) => [course.id, course]))
  const selected = [...new Set(ids)].flatMap((id) => {
    const course = known.get(id)
    return course ? [course] : []
  })
  const slots = SCORPIUS_POINTS.map((point, index) => ({
    ...point,
    index,
    courses: [] as Course[],
  }))
  selected.forEach((course, index) => {
    slots[assignmentOrder[index % assignmentOrder.length]].courses.push(course)
  })
  return slots
}
