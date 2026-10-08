import type { Course } from '../types/course'

/** All terms, or one semester of the academic year. */
export type SemesterFilter = 'all' | 1 | 2

export const SEMESTER_OPTIONS: readonly { value: SemesterFilter; label: string }[] = [
  { value: 'all', label: '全年' },
  { value: 1, label: '上學期' },
  { value: 2, label: '下學期' },
]

/** Select visible courses without changing their source order or records. */
export function getVisibleCourses(
  courses: readonly Course[],
  semester: SemesterFilter,
): readonly Course[] {
  if (semester === 'all') return courses
  return courses.filter((course) => course.semester === semester)
}
