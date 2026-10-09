import type { Course } from '../types/course'
export function searchCourses(courses: readonly Course[], query: string) {
  const needle = query.trim().normalize('NFKC').toLocaleLowerCase()
  return courses.filter((course) =>
    course.name.normalize('NFKC').toLocaleLowerCase().includes(needle),
  )
}
